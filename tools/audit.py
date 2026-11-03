#!/usr/bin/env python3
"""Аудит качества «Речки»: звуки, картинки, прохождение игр на экране телефона.

Запуск:  python3 tools/audit.py [--only assets|ui] [--root DIR] [--games 1,5] [--mic]
Результат: audit-out/ (report.md, audio.csv, images.csv, ui.json, contact-sheet.png, ui/NN-*/)
Подробности — в AUDIT.md. Это отправная точка: пороги и эвристики можно подстраивать.
"""
import argparse, base64, csv, functools, hashlib, http.server, io, json, os, random, re
import shutil, socketserver, statistics, subprocess, sys, threading, time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "audit-out", "__pycache__", ".venv", "venv", "audio-raw", "reference"}
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
AUD_EXT = {".mp3", ".ogg", ".oga", ".wav", ".m4a", ".aac", ".webm", ".opus", ".flac"}
DATA_URI = re.compile(rb"data:(image|audio)/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]{200,})")

# Пороги (см. AUDIT.md)
TH = dict(
    lufs_dev=4.0,          # отклонение от медианы группы, LU
    lufs_quiet=-32.0, lufs_loud=-12.0,  # абсолютные пределы громкости
    peak_max=-1.0,         # dBFS
    lead_sil=0.15, lead_sil_short=0.08, tail_sil=0.30,  # с
    dur_effect=1.5, dur_long=4.0,                       # с
    img_kb=300, img_side_max=2048, img_side_min=160,
    img_empty_margin=0.45,  # доля пустой площади вокруг предмета
    img_sharp_min=6.0,      # ниже — вероятно размыто (эвристика)
    tap_min=48, react_ok=150, react_max=300,            # px, мс
    upscale=0.8, overscale=3.0,
)


def log(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------- поиск медиа
def collect_media(out: Path):
    """Файлы звуков/картинок + встроенные data:URI из .js/.html. Встроенные распаковываются в out/embedded."""
    emb = out / "embedded"
    emb.mkdir(parents=True, exist_ok=True)
    items, seen = [], set()
    for root, dirs, files in os.walk(REPO):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            p = Path(root) / f
            ext = p.suffix.lower()
            rel = str(p.relative_to(REPO))
            if ext in IMG_EXT or ext in AUD_EXT:
                kind = "image" if ext in IMG_EXT else "audio"
                if ext == ".webm" and "video" in rel.lower():
                    continue
                items.append(dict(kind=kind, path=p, name=rel, src=rel))
            elif ext in {".js", ".html", ".htm", ".css", ".json"}:
                try:
                    data = p.read_bytes()
                except OSError:
                    continue
                for m in DATA_URI.finditer(data):
                    kind, sub, b64 = m.group(1).decode(), m.group(2).decode().lower(), m.group(3)
                    h = hashlib.sha1(b64).hexdigest()[:10]
                    if h in seen:
                        continue
                    seen.add(h)
                    # ближайший ключ перед data: — для понятного имени
                    before = data[max(0, m.start() - 120):m.start()].decode("utf-8", "ignore")
                    keys = re.findall(r"[\"']?([\w\u0400-\u04FF.\- ]{2,40})[\"']?\s*[:=]\s*[\"'`]?$", before)
                    label = (keys[-1] if keys else "") or "item"
                    label = re.sub(r"[^\w\u0400-\u04FF.-]+", "_", label).strip("_")[:40] or "item"
                    ext2 = {"jpeg": "jpg", "svg+xml": "svg", "mpeg": "mp3", "x-wav": "wav", "wave": "wav"}.get(sub, sub)
                    fp = emb / f"{label}-{h}.{ext2}"
                    try:
                        fp.write_bytes(base64.b64decode(b64))
                    except Exception:
                        continue
                    items.append(dict(kind=kind, path=fp, name=f"{label} ({fp.name})", src=rel))
    return items


# ---------------------------------------------------------------- звуки
def _ff(args):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True)
    return r.stderr


def audio_info(p: Path):
    d = dict(duration=None, lufs=None, peak=None, lead_sil=0.0, tail_sil=0.0, attack_jump=None)
    try:
        dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout.strip()
        d["duration"] = round(float(dur), 3)
    except Exception:
        return d
    # pad, чтобы ebur128 работал на коротких файлах
    e = _ff(["-i", str(p), "-af", "apad=pad_dur=0.5,ebur128=framelog=quiet", "-f", "null", "-"])
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", e)
    if m:
        v = float(m[-1])
        d["lufs"] = v if v > -69 else None
    e = _ff(["-i", str(p), "-af", "volumedetect", "-f", "null", "-"])
    m = re.search(r"max_volume:\s+(-?[\d.]+) dB", e)
    if m:
        d["peak"] = float(m.group(1))
    e = _ff(["-i", str(p), "-af", "silencedetect=noise=-45dB:d=0.03", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start:\s*(-?[\d.]+)", e)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", e)]
    if starts and starts[0] <= 0.01 and ends:
        d["lead_sil"] = round(ends[0], 3)
    if starts and d["duration"] and (len(ends) < len(starts)):
        d["tail_sil"] = round(d["duration"] - starts[-1], 3)
    # резкий старт: громкость первых 30 мс против медианы
    try:
        import numpy as np
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", "16000",
                              "-f", "s16le", "-"], capture_output=True).stdout
        x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
        if len(x) > 1600:
            fr = 480  # 30 мс
            rms = np.sqrt(np.array([np.mean(x[i:i + fr] ** 2) + 1e-12 for i in range(0, len(x) - fr, fr)]))
            db = 20 * np.log10(rms)
            nz = np.where(db > -45)[0]
            if len(nz):
                first = db[nz[0]]
                med = float(np.median(db[nz]))
                d["attack_jump"] = round(first - med, 1)  # >6 дБ — первый же кадр громче обычного
                d["edge_click"] = bool(abs(x[0]) > 0.05 or abs(x[-1]) > 0.05)
    except Exception:
        pass
    return d


def audio_group(name: str, dur):
    n = name.lower()
    if any(k in n for k in ("praise", "molod", "умни", "молод", "good", "win", "yes", "ok", "correct")):
        return "похвала"
    if any(k in n for k in ("click", "tap", "pop", "клик", "щелч", "click", "snap", "whoosh", "boing")):
        return "эффект"
    if dur is not None and dur <= 1.2:
        return "эффект"
    return "голос/звук"


def check_audio(items):
    rows = [dict(name=i["name"], src=i["src"], **audio_info(i["path"])) for i in items]
    for r in rows:
        r["group"] = audio_group(r["name"], r["duration"])
    groups = {}
    for r in rows:
        if r["lufs"] is not None:
            groups.setdefault(r["group"], []).append(r["lufs"])
    med = {g: statistics.median(v) for g, v in groups.items() if v}
    all_l = [x for v in groups.values() for x in v]
    med_all = statistics.median(all_l) if all_l else None
    for r in rows:
        f = []
        if r["duration"] is None:
            f.append("не читается")
        if r["lufs"] is not None and r["group"] in med:
            dev = r["lufs"] - med[r["group"]]
            r["lufs_dev"] = round(dev, 1)
            if dev > TH["lufs_dev"]:
                f.append(f"громче остальных на {dev:.0f} LU")
            elif dev < -TH["lufs_dev"]:
                f.append(f"тише остальных на {-dev:.0f} LU")
        if r["lufs"] is not None:
            if r["lufs"] < TH["lufs_quiet"]:
                f.append(f"очень тихий ({r['lufs']:.0f} LUFS)")
            elif r["lufs"] > TH["lufs_loud"]:
                f.append(f"очень громкий ({r['lufs']:.0f} LUFS)")
            elif med_all is not None and abs(r["lufs"] - med_all) > 8:
                f.append(f"сильно отличается от всех звуков ({r['lufs'] - med_all:+.0f} LU)")
        if r["peak"] is not None and r["peak"] > TH["peak_max"]:
            f.append(f"пик {r['peak']} dB — риск треска")
        lim = TH["lead_sil_short"] if r["group"] in ("похвала", "эффект") else TH["lead_sil"]
        if r["lead_sil"] > lim:
            f.append(f"тишина в начале {r['lead_sil']} с")
        if r["tail_sil"] > TH["tail_sil"]:
            f.append(f"тишина в конце {r['tail_sil']} с")
        if r["duration"]:
            lim = TH["dur_effect"] if r["group"] == "эффект" else TH["dur_long"]
            if r["duration"] > lim:
                f.append(f"длинный ({r['duration']} с)")
        if (r.get("attack_jump") or 0) > 6:
            f.append("резкое начало")
        if r.get("edge_click"):
            f.append("возможен щелчок на краю (нет fade)")
        r["flags"] = "; ".join(f)
    return rows, med


# ---------------------------------------------------------------- картинки
def check_images(items):
    from PIL import Image, ImageFilter, ImageStat
    rows = []
    for i in items:
        p = i["path"]
        r = dict(name=i["name"], src=i["src"], kb=round(p.stat().st_size / 1024, 1))
        f = []
        if p.suffix.lower() == ".svg":
            r["flags"] = ""
            rows.append(r)
            continue
        try:
            im = Image.open(p)
            im.load()
        except Exception:
            r["flags"] = "не открывается"
            rows.append(r)
            continue
        w, h = im.size
        r.update(w=w, h=h, mode=im.mode)
        if r["kb"] > TH["img_kb"]:
            f.append(f"тяжёлая ({r['kb']:.0f} КБ)")
        if max(w, h) > TH["img_side_max"]:
            f.append(f"очень большая ({w}×{h})")
        if max(w, h) < TH["img_side_min"]:
            f.append(f"маленькая ({w}×{h}) — может быть размытой")
        if im.mode in ("RGBA", "LA", "P"):
            a = im.convert("RGBA").getchannel("A").point(lambda v: 255 if v > 8 else 0)
            bb = a.getbbox()
            if bb:
                fill = (bb[2] - bb[0]) * (bb[3] - bb[1]) / (w * h)
                r["content_share"] = round(fill, 2)
                if 1 - fill > TH["img_empty_margin"]:
                    f.append(f"пустые поля {round((1 - fill) * 100)}% — предмет мелкий")
        g = im.convert("L")
        g.thumbnail((256, 256))
        sharp = ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).stddev[0]
        r["sharpness"] = round(sharp, 1)
        if sharp < TH["img_sharp_min"]:
            f.append("возможно размыта")
        r["flags"] = "; ".join(f)
        rows.append(r)
    return rows


# ---------------------------------------------------------------- сервер
def find_root(arg):
    if arg:
        return (REPO / arg).resolve()
    for c in ["dist", "build", "site", "public", "app", ".", "src"]:
        if (REPO / c / "index.html").exists():
            return (REPO / c).resolve()
    hits = sorted(REPO.glob("**/index.html"), key=lambda p: len(p.parts))
    hits = [h for h in hits if not (set(h.relative_to(REPO).parts) & SKIP_DIRS)]
    if hits:
        return hits[0].parent
    return None


def serve(root: Path):
    class Q(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                          ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                          ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
                          ".webmanifest": "application/manifest+json"}

        def log_message(self, *a):
            pass
    handler = functools.partial(Q, directory=str(root))
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"


# ---------------------------------------------------------------- игры
JS_CANDIDATES = r"""
([sel, minSize, all]) => {
  // all=true: включая элементы ниже экрана (во внутренней прокрутке) — для плиток главного экрана
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (!(r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05)) return false;
    if (all) return r.right > 0 && r.left < innerWidth;
    return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  let els;
  if (sel) els = [...document.querySelectorAll(sel)];
  else els = [...document.querySelectorAll('button,a,[onclick],[role=button],[data-game],[data-id],[draggable=true],.tile,.card,.btn,img,div,span')]
    .filter(e => { const s = getComputedStyle(e);
      return e.matches('button,a,[onclick],[role=button],[data-game],.tile,.card,.btn') || s.cursor === 'pointer' ||
             typeof e.onclick === 'function' || typeof e.onpointerdown === 'function' || typeof e.ontouchstart === 'function'; });
  els = els.filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.width >= minSize && r.height >= minSize; });
  els = els.filter(e => !els.some(o => o !== e && o.contains(e)));   // только самые внешние
  document.querySelectorAll('[data-audit-idx]').forEach(e => e.removeAttribute('data-audit-idx'));
  els.forEach((e, i) => e.setAttribute('data-audit-idx', i));
  return els.map((e, i) => { const r = e.getBoundingClientRect();
    return {i, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height,
            text: (e.innerText || e.getAttribute('aria-label') || e.title || e.alt || '').trim().replace(/\s+/g, ' ').slice(0, 40),
            id: e.id || '', cls: (typeof e.className === 'string' ? e.className : '').slice(0, 60)}; });
}
"""

JS_LAYOUT = r"""
([tapMin, up, over]) => {
  const dpr = devicePixelRatio, out = {overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    offscreen: [], smallTap: [], upscaled: [], overscaled: [], smallText: []};
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const name = e => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.split(/\s+/).slice(0,2).join('.') : '') || e.tagName.toLowerCase();
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e)) continue;
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (s.position !== 'fixed' && (r.right > innerWidth + 2 || r.left < -2) && r.width < innerWidth * 1.5 && r.top < innerHeight)
      out.offscreen.push(name(e));
    const clickable = e.matches('button,a,[onclick],[role=button]') || s.cursor === 'pointer';
    if (clickable && (r.width < tapMin || r.height < tapMin) && r.top < innerHeight)
      out.smallTap.push(`${name(e)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    if (e.tagName === 'IMG' && e.naturalWidth && r.top < innerHeight) {
      const need = r.width * dpr, nm = (e.currentSrc || e.src || '').slice(0, 80).replace(/^data:([^;]+);base64,.*/, 'data:$1');
      if (e.naturalWidth < need * up) out.upscaled.push(`${nm} ${e.naturalWidth}px → нужно ${Math.round(need)}px`);
      if (e.naturalWidth > need * over && e.naturalWidth > 600) out.overscaled.push(`${nm} ${e.naturalWidth}px на ${Math.round(r.width)}px`);
    }
    if (e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(s.fontSize) < 14)
      out.smallText.push(`${name(e)} ${s.fontSize}`);
  }
  for (const k of ['offscreen','smallTap','upscaled','overscaled','smallText']) out[k] = [...new Set(out[k])].slice(0, 15);
  return out;
}
"""


def _png_diff(a: bytes, b: bytes):
    from PIL import Image, ImageChops
    ia, ib = Image.open(io.BytesIO(a)).convert("RGB"), Image.open(io.BytesIO(b)).convert("RGB")
    if ia.size != ib.size:
        return True
    d = ImageChops.difference(ia, ib).convert("L").point(lambda v: 255 if v > 24 else 0)
    bb = d.getbbox()
    if not bb:
        return False
    return sum(d.histogram()[255:]) > 150  # не просто мигание курсора


def measure_reaction(page, x, y, limit_ms=600):
    before = page.screenshot()
    t0 = time.perf_counter()
    page.touchscreen.tap(x, y)
    while (time.perf_counter() - t0) * 1000 < limit_ms:
        if _png_diff(before, page.screenshot()):
            return round((time.perf_counter() - t0) * 1000)
    return None


def slug(s):
    s = re.sub(r"[^\w\u0400-\u04FF]+", "-", s or "").strip("-").lower()
    return s[:30] or "game"


def run_ui(args, out: Path):
    from playwright.sync_api import sync_playwright
    root = find_root(args.root)
    if not root:
        log("! Не нашёл index.html. Соберите приложение и укажите --root.")
        return None
    log(f"Приложение: {root.relative_to(REPO) if root != REPO else '.'}")
    srv, url = serve(root)
    w, h = (int(v) for v in args.size.lower().split("x"))
    uidir = out / "ui"
    uidir.mkdir(parents=True, exist_ok=True)
    rnd = random.Random(args.seed)
    launch_args = ["--autoplay-policy=no-user-gesture-required"]
    if args.mic:
        launch_args += ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
    result = dict(url=url, size=args.size, mic=args.mic, home={}, games=[])

    def new_ctx(browser, video_dir=None):
        kw = dict(viewport={"width": w, "height": h}, device_scale_factor=2.75, is_mobile=True, has_touch=True,
                  locale="ru-RU", user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36")
        if video_dir:
            kw.update(record_video_dir=str(video_dir), record_video_size={"width": w, "height": h})
        if args.mic:
            kw["permissions"] = ["microphone", "camera"]
        return browser.new_context(**kw)

    def attach_logs(page, sink):
        page.on("console", lambda m: m.type in ("error", "warning") and sink.append(f"{m.type}: {m.text[:200]}"))
        page.on("pageerror", lambda e: sink.append(f"pageerror: {str(e)[:200]}"))
        page.on("requestfailed", lambda r: sink.append(f"404/failed: {r.url[:120]}"))

    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=launch_args)
        # --- главный экран
        ctx = new_ctx(browser)
        page = ctx.new_page()
        logs = []
        attach_logs(page, logs)
        t0 = time.perf_counter()
        page.goto(url, wait_until="load")
        page.wait_for_timeout(args.wait)
        result["home"]["load_ms"] = round((time.perf_counter() - t0) * 1000)
        page.screenshot(path=str(uidir / "00-home.png"))
        page.screenshot(path=str(uidir / "00-home-full.png"), full_page=True)
        tiles = page.evaluate(JS_CANDIDATES, [args.tile_selector, 56, True])
        tiles = [t for t in tiles if t["w"] * t["h"] < w * h * 0.6]
        result["home"].update(layout=page.evaluate(JS_LAYOUT, [TH["tap_min"], TH["upscale"], TH["overscale"]]),
                              console=logs, tiles=[{k: t[k] for k in ("text", "id", "cls", "w", "h")} for t in tiles])
        # плитки ниже экрана: прокрутка
        full_h = page.evaluate("document.documentElement.scrollHeight")
        ctx.close()
        log(f"Главный экран: найдено плиток {len(tiles)} (высота страницы {full_h}px)")
        if not tiles:
            log("! Плитки игр не найдены. Укажите --tile-selector (см. src/body.html).")

        wanted = None
        if args.games:
            wanted = {int(x) for x in args.games.split(",") if x.strip()}
        for n, tile in enumerate(tiles, 1):
            if wanted and n not in wanted:
                continue
            gdir = uidir / f"{n:02d}-{slug(tile['text'] or tile['id'] or tile['cls'])}"
            if gdir.exists():
                shutil.rmtree(gdir)
            gdir.mkdir()
            vdir = gdir / "_v"
            ctx = new_ctx(browser, vdir)
            page = ctx.new_page()
            logs = []
            attach_logs(page, logs)
            g = dict(n=n, tile=tile["text"] or tile["id"] or tile["cls"], dir=gdir.name, steps=[], console=logs)
            try:
                page.goto(url, wait_until="load")
                page.wait_for_timeout(args.wait)
                cur = page.evaluate(JS_CANDIDATES, [args.tile_selector, 56, True])
                cur = [t for t in cur if t["w"] * t["h"] < w * h * 0.6]
                if n - 1 >= len(cur):
                    raise RuntimeError("плитка пропала при повторной загрузке")
                # прокрутить к плитке (и в документе, и во внутреннем контейнере)
                idx = cur[n - 1]["i"]
                t = page.evaluate("""(i) => { const e = document.querySelector(`[data-audit-idx="${i}"]`);
                    e.scrollIntoView({block: 'center', behavior: 'instant'}); const r = e.getBoundingClientRect();
                    return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }""", idx)
                page.wait_for_timeout(500)
                g["enter_reaction_ms"] = measure_reaction(page, t["x"], t["y"])
                for ms, tag in ((300, "a"), (1200, "b"), (3000, "c")):
                    page.wait_for_timeout(ms if tag == "a" else ms - prev)
                    prev = ms
                    page.screenshot(path=str(gdir / f"enter-{tag}-{ms}ms.png"))
                g["layout"] = page.evaluate(JS_LAYOUT, [TH["tap_min"], TH["upscale"], TH["overscale"]])
                # несколько нажатий по карточкам
                for s in range(args.steps):
                    cands = page.evaluate(JS_CANDIDATES, [args.card_selector, 40, False])
                    # верхняя полоса (назад, шестерёнка) — мелкие кнопки выше 60 px не трогаем
                    cands = [c for c in cands if (c["y"] > 60 or c["h"] > 80) and c["w"] * c["h"] < w * h * 0.5]
                    if not cands:
                        page.wait_for_timeout(1500)
                        page.screenshot(path=str(gdir / f"step{s + 1}-nocards.png"))
                        g["steps"].append(dict(step=s + 1, note="нет карточек для нажатия"))
                        continue
                    c = rnd.choice(cands)
                    react = measure_reaction(page, c["x"], c["y"])
                    page.wait_for_timeout(250)
                    page.screenshot(path=str(gdir / f"step{s + 1}-after250ms.png"))
                    page.wait_for_timeout(1500)
                    page.screenshot(path=str(gdir / f"step{s + 1}-after1750ms.png"))
                    g["steps"].append(dict(step=s + 1, tapped=c["text"] or c["cls"], cards=len(cands), reaction_ms=react))
                    # двойное быстрое нажатие на случай двойного засчёта — смотреть в видео
                    if s == 1:
                        page.touchscreen.tap(c["x"], c["y"])
                        page.touchscreen.tap(c["x"], c["y"])
                        page.wait_for_timeout(800)
                        page.screenshot(path=str(gdir / f"step{s + 1}-doubletap.png"))
            except Exception as e:
                g["error"] = str(e)[:300]
                try:
                    page.screenshot(path=str(gdir / "error.png"))
                except Exception:
                    pass
            ctx.close()
            vids = list(vdir.glob("*.webm"))
            if vids:
                vids[0].rename(gdir / "video.webm")
            shutil.rmtree(vdir, ignore_errors=True)
            rs = [x["reaction_ms"] for x in g["steps"] if x.get("reaction_ms")]
            g["reaction_med_ms"] = round(statistics.median(rs)) if rs else None
            g["no_reaction"] = sum(1 for x in g["steps"] if "reaction_ms" in x and x["reaction_ms"] is None)
            result["games"].append(g)
            log(f"  {n:02d} {g['tile'][:30]:30} отклик {g['reaction_med_ms']} мс, ошибок консоли {len(logs)}"
                + (f", СБОЙ: {g['error'][:60]}" if g.get("error") else ""))
        browser.close()
    srv.shutdown()
    (out / "ui.json").write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    contact_sheet(uidir, out / "contact-sheet.png")
    return result


def contact_sheet(uidir: Path, dst: Path, thumb_w=180):
    from PIL import Image, ImageDraw
    shots = [uidir / "00-home.png"] + [sorted(d.glob("enter-b-*.png"))[0] for d in sorted(uidir.iterdir())
                                        if d.is_dir() and list(d.glob("enter-b-*.png"))]
    shots = [s for s in shots if s.exists()]
    if not shots:
        return
    ims = []
    for s in shots:
        im = Image.open(s).convert("RGB")
        im.thumbnail((thumb_w, thumb_w * 3))
        ims.append((s.parent.name if s.parent != uidir else "главный", im))
    cols = 6
    th = max(i.size[1] for _, i in ims) + 18
    sheet = Image.new("RGB", (cols * (thumb_w + 8) + 8, ((len(ims) + cols - 1) // cols) * (th + 8) + 8), "white")
    dr = ImageDraw.Draw(sheet)
    for k, (lab, im) in enumerate(ims):
        x, y = 8 + (k % cols) * (thumb_w + 8), 8 + (k // cols) * (th + 8)
        sheet.paste(im, (x, y + 16))
        dr.text((x, y), lab[:28], fill="black")
    sheet.save(dst)


# ---------------------------------------------------------------- отчёт
def write_csv(path, rows):
    if not rows:
        return
    keys = []
    for r in rows:
        keys += [k for k in r if k not in keys]
    with open(path, "w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, keys)
        wr.writeheader()
        wr.writerows(rows)


def report(out, audio, med, images, ui):
    L = [f"# Аудит — сводка ({time.strftime('%Y-%m-%d %H:%M')})", ""]
    if audio is not None:
        bad = [r for r in audio if r["flags"]]
        L += ["## Звуки", f"Всего {len(audio)}, с замечаниями {len(bad)}. "
              + "Медиана громкости по группам: " + ", ".join(f"{g} {v:.1f} LUFS" for g, v in med.items()), ""]
        for r in sorted(bad, key=lambda r: r["name"])[:80]:
            L.append(f"- `{r['name']}` ({r['src']}, {r['group']}): {r['flags']}")
        L.append("")
    if images is not None:
        bad = [r for r in images if r.get("flags")]
        tot = sum(r["kb"] for r in images)
        L += ["## Картинки", f"Всего {len(images)} ({tot / 1024:.1f} МБ), с замечаниями {len(bad)}.", ""]
        for r in sorted(bad, key=lambda r: -r["kb"])[:80]:
            L.append(f"- `{r['name']}` ({r.get('w')}×{r.get('h')}, {r['kb']:.0f} КБ): {r['flags']}")
        L.append("")
    if ui:
        L += ["## Игры на экране " + ui["size"] + (" (с микрофоном)" if ui["mic"] else " (без микрофона)"), ""]
        hl = ui["home"].get("layout", {})
        L.append(f"Главный экран: загрузка {ui['home'].get('load_ms')} мс, плиток {len(ui['home'].get('tiles', []))}, "
                 f"ошибок консоли {len(ui['home'].get('console', []))}"
                 + (", ЕСТЬ горизонтальная прокрутка" if hl.get("overflowX") else ""))
        L += ["", "| № | Игра | Вход, мс | Отклик (медиана), мс | Без реакции | Консоль | Вёрстка | Сбой |",
              "|---|---|---|---|---|---|---|---|"]
        for g in ui["games"]:
            lay = g.get("layout", {})
            lay_s = ", ".join(f"{k} {len(v)}" for k, v in lay.items() if isinstance(v, list) and v)
            if lay.get("overflowX"):
                lay_s = "прокрутка вбок; " + lay_s
            r = g.get("reaction_med_ms")
            r_s = f"{r}" + (" ⚠" if r and r > TH["react_max"] else "")
            L.append(f"| {g['n']} | {g['tile'][:28]} | {g.get('enter_reaction_ms')} | {r_s} | {g.get('no_reaction')} | "
                     f"{len(g['console'])} | {lay_s or '—'} | {g.get('error', '')[:50]} |")
        L += ["", "Подробности: `ui.json` (списки элементов, тексты ошибок консоли), скриншоты и видео — `ui/NN-*/`.",
              "Отклик меряется по изменению экрана после нажатия; «Без реакции» — экран не изменился за 600 мс.", ""]
    (out / "report.md").write_text("\n".join(L), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", choices=["assets", "audio", "images", "ui"])
    ap.add_argument("--root", help="папка с index.html приложения")
    ap.add_argument("--out", default="audit-out")
    ap.add_argument("--games", help="номера игр через запятую")
    ap.add_argument("--steps", type=int, default=6, help="нажатий в каждой игре")
    ap.add_argument("--wait", type=int, default=2500, help="ожидание после загрузки, мс")
    ap.add_argument("--size", default="360x780")
    ap.add_argument("--mic", action="store_true")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--tile-selector", default=None, help="CSS-селектор плиток игр на главном экране")
    ap.add_argument("--card-selector", default=None, help="CSS-селектор карточек внутри игры")
    args = ap.parse_args()
    out = (REPO / args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    audio = med = images = ui = None
    if args.only in (None, "assets", "audio", "images"):
        media = collect_media(out)
        if args.only in (None, "assets", "audio"):
            if shutil.which("ffmpeg"):
                log(f"Звуки: {sum(m['kind'] == 'audio' for m in media)} …")
                audio, med = check_audio([m for m in media if m["kind"] == "audio"])
                write_csv(out / "audio.csv", audio)
            else:
                log("! Нет ffmpeg — звуки пропущены (apt-get install -y ffmpeg)")
        if args.only in (None, "assets", "images"):
            log(f"Картинки: {sum(m['kind'] == 'image' for m in media)} …")
            images = check_images([m for m in media if m["kind"] == "image"])
            write_csv(out / "images.csv", images)
    if args.only in (None, "ui"):
        ui = run_ui(args, out)
    report(out, audio, med or {}, images, ui)
    log(f"\nГотово: {out.relative_to(REPO)}/report.md")


if __name__ == "__main__":
    main()
