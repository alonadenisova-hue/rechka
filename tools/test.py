"""Автопроверка «Речки» (Python Playwright), версия 28: все игры на всех уровнях.
Запуск: python3 tools/test.py [nomic|mic]
  nomic — без микрофона и камеры (как пробная версия внутри Claude);
  mic   — с поддельными микрофоном и камерой Chromium (звуковой сигнал «бип» вместо голоса).
Нужен локальный сервер с приложением: cd app && python3 -m http.server 8765
(другой адрес — переменная RECHKA_URL, например RECHKA_URL=http://localhost:8766/index.html)
"""
import sys, json, time, os
from playwright.sync_api import sync_playwright

URL = os.environ.get('RECHKA_URL', 'http://localhost:8765/index.html')
MODE = sys.argv[1] if len(sys.argv) > 1 else 'nomic'
errors = []
fails = []

def check(cond, msg):
    print(('  ok  ' if cond else '  FAIL ') + msg)
    if not cond:
        fails.append(msg)

with sync_playwright() as p:
    args = ['--autoplay-policy=no-user-gesture-required']
    if MODE == 'mic':
        args += ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
    b = p.chromium.launch(args=args)
    ctx = b.new_context(viewport={'width': 412, 'height': 860}, has_touch=True,
                        permissions=['microphone', 'camera'] if MODE == 'mic' else [])
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(m.text))
    # быстрый голос: синтез речи в headless может молчать, подменяем на короткую паузу
    pg.add_init_script("""
      const ss=window.speechSynthesis;
      window.speechSynthesis.speak=u=>{setTimeout(()=>{u.onend&&u.onend()},60)};
    """)
    pg.goto(URL)
    pg.wait_for_timeout(1500)
    R = 'window.__rechka'
    print('MODE', MODE)
    # ---- главный экран
    check(pg.is_visible('#btn-wb'), 'кнопка «Хочу» на главном экране')
    micx = pg.evaluate(R + '.MICX')
    vis = pg.is_visible('.tile[data-game="voice"]')
    if MODE == 'nomic':
        check(not vis, f'«Скажи — и будет!» объединена с «Шариком» (MICX={micx})')
    else:
        check(not vis, '«Скажи — и будет!» объединена с «Шариком» (плитка скрыта)')

    # ---- все игры: каждая стартует на каждом уровне без ошибок
    games = pg.evaluate(R + '.ROUNDS && Object.keys(' + R + '.ROUNDS)')
    skip = ({'voice'} if MODE == 'nomic' else set()) | {'make', 'dogs', 'br'}
    for g in games:
        if g in skip: continue
        maxl = pg.evaluate(f"({{}}).constructor.keys({R}.S.lvl).includes('{g}')?null:null")
        n_err = len(errors)
        for lv in range(1, 8):
            ok = pg.evaluate(f"(()=>{{const S={R}.S;if(!S.lvl['{g}'])return false;S.lvl['{g}']={lv};return true}})()")
            pg.evaluate(f"document.querySelector('#btn-home').click()")
            pg.evaluate(f"(()=>{{const t=document.querySelector('.tile[data-game=\"{g}\"]');if(t&&!t.hidden){{t.hidden=false}}}})()")
            pg.evaluate(f"(()=>{{const S={R}.S;S.lvl['{g}']={lv};}})()")
            pg.evaluate(f"(()=>{{const t=document.querySelector('.tile[data-game=\"{g}\"]');t.hidden=false;t.click()}})()")
            pg.wait_for_timeout(900 if g not in ('make','voice','syl') else 1400)
        check(len(errors) == n_err, f'игра {g}: все уровни стартуют' + ('' if len(errors) == n_err else ' — ' + '; '.join(errors[n_err:])[:300]))
    pg.evaluate("document.querySelector('#btn-home').click()")

    # ---- v22: новые уровни и перестановки
    def start(g, lv):
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(1200)
        pg.evaluate(f"{R}.S.lvl['{g}']={lv}")
        pg.evaluate(f"document.querySelector('.tile[data-game=\"{g}\"]').click()")
    def drag(a, b):
        pg.mouse.move(*a); pg.mouse.down(); pg.mouse.move(*b, steps=8); pg.mouse.up(); pg.wait_for_timeout(350)
    ctr = lambda bb: (bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2)
    # «Повтори!»: 3, 4, 5 картинок в ряд — 5 секунд смотреть, потом перенести на пустые места
    for lv in (1, 2, 3):
        start('seq', lv)
        pg.wait_for_function("document.querySelectorAll('.sq-slot.empty').length>0", timeout=25000); pg.wait_for_timeout(1500)
        i0 = pg.evaluate(f"{R}.G.i"); n = len(pg.query_selector_all('.sq-c'))
        for p_ in range(n):
            if pg.evaluate(f"{R}.G&&{R}.G.i") != i0: break
            el = pg.query_selector_all('.sq-c')[p_]; sl = pg.query_selector_all('.sq-slot')[p_]
            drag(ctr(el.bounding_box()), ctr(sl.bounding_box()))
        pg.wait_for_timeout(2500)
        check(pg.evaluate(f"{R}.G&&{R}.G.i") == i0 + 1, f'«Повтори!» ур. {lv}: {n} картинок в ряд, переносятся на пустые места')
    # «Цифры»: предметы вместо точек, «Соедини»
    for _ in range(10):
        start('num', 1); pg.wait_for_function("document.querySelector('.countbox .cnt img,.nscene')", timeout=15000); pg.wait_for_timeout(300)
        if pg.query_selector('.countbox .cnt img'): break
    check(len(pg.query_selector_all('.numopts .opt')) == 2 and not pg.query_selector('.dots5'), '«Цифры» ур. 1: предметы (не точки) и 2 цифры на выбор')
    found = False
    for _ in range(14):
        start('num', 6); pg.wait_for_function("document.querySelector('.nmatch,.trace,.nscene,.nhide')", timeout=15000)
        if pg.query_selector('.nmatch'): found = True; break
    if found:
        i0 = pg.evaluate(f"{R}.G.i")
        for d in pg.query_selector_all('.nm-dig'):
            n = d.get_attribute('data-n'); c = pg.query_selector(f'.nm-card[data-n="{n}"]')
            drag(ctr(d.bounding_box()), ctr(c.bounding_box()))
        pg.wait_for_timeout(2500)
        check(pg.evaluate(f"{R}.G&&{R}.G.i") == i0 + 1, '«Цифры»: «Соедини» — цифры перетаскиваются на предметы')
    else:
        check(False, '«Цифры»: «Соедини» не появилось')
    # «Летит, едет, плывёт»: разложить 3 картинки
    found = False
    for _ in range(8):
        start('tr', 3); pg.wait_for_function("document.querySelectorAll('.trobj').length||document.querySelectorAll('#stage .opt').length", timeout=15000)
        if len(pg.query_selector_all('.trobj')) == 3: found = True; break
    if found:
        i0 = pg.evaluate(f"{R}.G.i"); zones = [ctr(z.bounding_box()) for z in pg.query_selector_all('.tz')]
        for k in range(3):
            for z in zones:
                o = pg.query_selector_all('.trobj')[k]
                if 'placed' in (o.get_attribute('class') or ''): break
                drag(ctr(o.bounding_box()), z); pg.wait_for_timeout(300)
                if 'placed' in (o.get_attribute('class') or '') and 'back' not in (o.get_attribute('class') or ''):
                    pg.wait_for_timeout(2200)
                    if 'back' not in (o.get_attribute('class') or ''): break
                pg.wait_for_timeout(2200)
        pg.wait_for_timeout(3500)
        check(pg.evaluate(f"{R}.G&&{R}.G.i") == i0 + 1, '«Летит, едет, плывёт» ур. 3: 3 картинки раскладываются на небо, дорогу, речку')
    else:
        check(False, '«Летит, едет, плывёт»: раскладка не появилась')
    # «Съедобное»: знакомая еда
    start('food', 1); pg.wait_for_selector('.put.food .obj', timeout=15000)
    names = pg.evaluate("[...document.querySelectorAll('.put.food .obj')].map(e=>e.getAttribute('aria-label'))")
    check(len(names) == 2 and any(n in ('банан','яблоко','оладьи','пельмени','манго','вода') for n in names), f'«Съедобное» ур. 1: знакомая еда {names}')
    # убранные игры
    check(all(not pg.is_visible(f'.tile[data-game="{g}"]') for g in ('make', 'dogs', 'br', 'syl', 'word')), 'убраны «Сделай как скажу», «Щенки», «Мостик», «Слоги», отдельная «Что это?»')
    # ---- v24
    def opts_n(): return len(pg.query_selector_all('#stage .opt'))
    def wait_opts(): pg.wait_for_function("document.querySelectorAll('#stage .opt').length>0", timeout=15000); pg.wait_for_timeout(300)
    start('want', 1); wait_opts(); pr = pg.inner_text('#prompt')
    check(opts_n() == 2 and (pr.startswith('Хочу') or pr.startswith('Включи')), f'«Я хочу»: голос просит «{pr}», 2 картинки')
    start('want', 4); wait_opts(); check(opts_n() == 6, '«Я хочу» ур. 4: из 6')
    gos = 0
    for _ in range(12):
        start('want', 2); wait_opts(); pr = pg.inner_text('#prompt'); gos += any(w in pr for w in ('бассейн','магазин','гулять','горку','мультик','пианино'))
    check(gos >= 2, f'«Я хочу»: бассейн / магазин / гулять встречаются ({gos} из 12)')
    start('not', 1); wait_opts(); pr = pg.inner_text('#prompt')
    check(opts_n() == 2 and ' не ' in pr, f'«Что не…?» ур. 1: «{pr}» из 2')
    start('not', 3); wait_opts(); check(opts_n() == 3, '«Что не…?» ур. 3: из 3')
    start('ib', 1); wait_opts(); pr = pg.inner_text('#prompt')
    check(opts_n() == 2 and pr in ('Кто стоит?', 'Кто сидит?', 'Кто идёт?', 'Кто бежит?') and len(pg.query_selector_all('#stage svg.fig')) == 2, f'«Идёт, бежит, стоит, сидит» ур. 1: {pr}, 2 человечка')
    start('ib', 2); wait_opts(); check(opts_n() == 3, f'ур. 2: {opts_n()} человечка')
    start('ib', 3); wait_opts(); check(opts_n() == 4, f'ур. 3: {opts_n()} картинки')
    start('world', 5); pg.wait_for_selector('.topic', timeout=15000); n_t = len(pg.query_selector_all('.topic'))
    pg.query_selector_all('.topic')[0].click(); wait_opts()
    check(n_t >= 6 and opts_n() == 9, f'«Что это?»: {n_t} тем, ур. 5 — 9 карточек')
    pos = []
    for _ in range(10):
        start('world', 1); pg.wait_for_timeout(200)
        if pg.query_selector('.topic'): pg.query_selector_all('.topic')[0].click()
        wait_opts(); pos.append(pg.evaluate(f"{R}.G.posH.slice(-1)[0]"))
    check(len(set(pos)) == 2 and not any(pos[k] == pos[k+1] == pos[k+2] for k in range(len(pos)-2)), f'правильная карточка меняет место: {pos}')
    check(pg.evaluate("window.PG25[0].m>=6&&window.PG25.length>=20&&window.PG25.every(l=>l.holes.length>=1)"), '«Пингвины»: уровни с полыньями от 6 ходов')
    sol=pg.evaluate(f"window.PG25.map(l=>{{const s={R}.pgSolve2(l.p.map(x=>x.slice()),l,400000);return s?s.d:0}})")
    check(all(sol[k]==pg.evaluate(f"window.PG25[{k}].m") for k in range(len(sol))), f'«Пингвины»: все задачи решаются, ходов: {sol}')
    check(pg.evaluate(f"{R}.S.lvl&&{R}.D.animals.length>=25"), f'«Покорми»: животных {pg.evaluate(f"{R}.D.animals.length")}')
    check(pg.evaluate(f"{R}.ONO_L.length>=12"), f'«Кто как говорит?»: животных с голосом {pg.evaluate(f"{R}.ONO_L.length")}')
    # пазл из 10 кусочков
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(500)
    pg.evaluate(f"{R}.S.pz.ready=true;{R}.S.pz.placed=[];{R}.openPuzzle()"); pg.wait_for_timeout(800)
    pcs = pg.query_selector_all('#puz .pc:not(.placed)')
    check(len(pcs) == 10, f'пазл: 10 кусочков ({len(pcs)})')
    n0 = pg.evaluate(f"({R}.S.pz.ph||[]).length")
    bb = pg.query_selector('#pz-board').bounding_box(); cw = bb['width'] / 5; ch = bb['height'] / 2
    for _ in range(10):
        el = pg.query_selector('#puz .pc:not(.placed)')
        if not el: break
        j = int(el.get_attribute('data-j'))
        drag(ctr(el.bounding_box()), (bb['x'] + (j % 5 + .5) * cw, bb['y'] + (j // 5 + .5) * ch))
    pg.wait_for_timeout(1500)
    check(pg.evaluate(f"({R}.S.pz.ph||[]).length") == n0 + 1 and not pg.evaluate(f"{R}.S.pz.ready"), 'пазл собирается, картинка попадает в «Мои пазлы»')
    # v25: новые задания
    check(pg.evaluate(f"{R}.S.pz.maze")!=True, 'лабиринт убран')
    for mode in ('findall','peek','hidden'):
        ok=False
        for _ in range(25):
            start('num', 4 if mode!='peek' else 2); pg.wait_for_timeout(300)
            pg.wait_for_function("document.querySelector('.nscene,.npeek,.nhide,.numwrap,.nmatch,.trace,.grid')", timeout=15000)
            sel={'findall':'.nscene','peek':'.npeek','hidden':'.nhide'}[mode]
            if pg.query_selector(sel): ok=True; break
        if not ok: check(False, f'«Цифры»: {mode} не появилось'); continue
        i0 = pg.evaluate(f"{R}.G.i")
        if mode=='peek':
            pg.wait_for_function("document.querySelector('.np.hid')&&document.querySelectorAll('.numopts .opt').length", timeout=15000)
            n = int(pg.evaluate("[...document.querySelectorAll('.np')].find(e=>e.classList.contains('hid')).querySelector('b').textContent"))
            for bt in pg.query_selector_all(".numopts .opt"):
                if bt.inner_text().strip()==str(n): bt.click(); break
        else:
            pg.wait_for_timeout(500); n = pg.evaluate(f"(()=>{{const t=document.querySelector('#prompt .digit');return t?+t.textContent:0}})()")
            pg.evaluate(f"document.querySelectorAll('[data-d=\"{n}\"]').forEach((b,k)=>setTimeout(()=>b.click(),k*200))"); pg.wait_for_timeout(1200)
        pg.wait_for_timeout(3000)
        check(pg.evaluate(f"{R}.G&&{R}.G.i") == i0 + 1, f'«Цифры»: «{mode}» проходится')
    # обвести цифру до конца
    found=False
    for _ in range(10):
        start('num', 6); pg.wait_for_function("document.querySelector('.nmatch,.trace,.nscene,.nhide')", timeout=15000)
        if pg.query_selector('.trace'): found=True; break
    if found:
        pg.wait_for_timeout(300); i0 = pg.evaluate(f"{R}.G.i")
        pts = pg.evaluate("""(()=>{const s=document.querySelector('.trace svg'),p=s.querySelector('.tr-bg'),L=p.getTotalLength(),m=s.getScreenCTM();const o=[];for(let k=0;k<=120;k++){const q=p.getPointAtLength(L*k/120);o.push([m.a*q.x+m.e,m.d*q.y+m.f])}return o})()""")
        # первые 60%: проверяем, что не засчитывает раньше конца
        pg.mouse.move(*pts[0]); pg.mouse.down()
        for x in pts[1:80]: pg.mouse.move(*x)
        pg.mouse.up(); pg.wait_for_timeout(500)
        early = pg.evaluate(f"{R}.G.i") != i0
        pg.mouse.move(*pts[78]); pg.mouse.down()
        for x in pts[78:]: pg.mouse.move(*x)
        pg.mouse.up(); pg.wait_for_timeout(3500)
        check(not early and pg.evaluate(f"{R}.G&&{R}.G.i") == i0 + 1, '«Цифры»: цифру можно обвести до самого конца, засчитывается только в конце')
    else: check(False, '«Цифры»: «обведи» не появилось')
    # бонус: 7 секунд шариков
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.evaluate("document.querySelector('.tile[data-game=\"odd\"]').click()"); pg.wait_for_timeout(1500)
    pg.evaluate(f"{R}.bonusPop();0"); pg.wait_for_timeout(2500)
    nb = len(pg.query_selector_all('.bonus .balloon'))
    if nb: pg.evaluate("document.querySelector('.bonus .balloon').dispatchEvent(new PointerEvent('pointerdown'))"); pg.wait_for_timeout(200)
    fx = len(pg.query_selector_all('.bn-fx'))
    pg.wait_for_timeout(8000)
    check(nb > 0 and fx > 0 and not pg.query_selector('.bonus'), f'бонус: шарики 7 секунд ({nb}), из шарика сыплются конфеты ({fx}), потом исчезает')
    # шарики: новые игры
    for nm in ('balAni','balCount','balFeed','balDigit'):
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(800)
        pg.evaluate(f"document.querySelector('.tile[data-game=\"bal\"]').click()"); pg.wait_for_timeout(1500)
        pg.evaluate(f"{R}.G.round.dead=true;{R}.G.round={{wrong:0,lvl:1}};{R}.{nm}(1);0"); pg.wait_for_timeout(2500)
        check(len(pg.query_selector_all('#stage .balloon'))>0, f'шарики: {nm} показывает шарики')
    # Шарик: звуки / слоги
    seen=set()
    for _ in range(16):
        start('dog', 1); pg.wait_for_selector('.dogc', timeout=15000); seen.add('txt' if pg.query_selector('.dogc.txt') else 'pic')
    check(len(seen)==2, f'«Повторяй за Шариком» ур. 1: и звуки с картинкой, и слоги ({seen})')
    # большой — маленький + один — много
    gm=set()
    for _ in range(8):
        start('size', 1); pg.wait_for_function("document.querySelectorAll('#stage .opt').length", timeout=15000); gm.add(pg.inner_text('#prompt').split()[0])
    check(len(gm)>=2, f'«Большой — маленький, один — много»: вопросы чередуются ({gm})')
    pg.evaluate("document.querySelector('#btn-home').click()")


    # ---- доска «Хочу»
    pg.click('#btn-wb'); pg.wait_for_timeout(1800)
    check(pg.is_visible('#wbscr') and len(pg.query_selector_all('.wbcard')) == 12, 'доска «Хочу»: 12 карточек')
    n0 = pg.evaluate(f"{R}.S.log.filter(x=>x.g==='wb').length")
    pg.query_selector_all('.wbcard')[0].click(); pg.wait_for_timeout(300)
    check('big' in pg.query_selector_all('.wbcard')[0].get_attribute('class'), 'карточка увеличивается сразу')
    pg.wait_for_timeout(2000)
    check(pg.evaluate(f"{R}.S.log.filter(x=>x.g==='wb').length") == n0 + 1, 'нажатие записано в статистику')
    pg.click('#wb-home'); pg.wait_for_timeout(300)

    # ---- «Сегодня дома»: занятие с ошибками → подсказка про путаницу
    pg.click('.tile[data-game="want"]')
    pg.wait_for_function("window.__rechka.G&&document.querySelectorAll('#stage .opt').length>0", timeout=15000)
    pg.evaluate(f"{R}.G.t0=Date.now()")
    pg.evaluate(f"""(()=>{{const S={R}.S;const t=Date.now();
      S.log.push({{t,g:'sl',l:1,ok:false,w:1,v:'спит/лежит'}},{{t,g:'verb',l:2,ok:false,w:1,v:'спит',picks:['лежит']}},{{t,g:'verb',l:2,ok:false,w:2,v:'спит',picks:['лежит','сидит']}});}})()""")
    pg.evaluate(f"{R}.G||0")
    tip = pg.evaluate(f"(()=>{{return {R}.chooseTip()}})()")
    check(tip and tip['k'] == 'conf:лежит|спит', f'подсказка по путанице спит/лежит: {tip and tip["t"][:60]}')
    # короткое занятие до конца → экран «Молодец» → домой → подсказка
    pg.evaluate(f"(()=>{{const G={R}.G;G.max=1;}})()")
    # отвечаем на первое задание любым вариантом, пока не появится экран «Молодец»
    for _ in range(60):
        if pg.is_visible('#finish'): break
        n = pg.evaluate("document.querySelectorAll('#stage .opt').length")
        for k in range(n):
            pg.evaluate(f"(()=>{{const h=document.querySelector('#stage .opt.hint');const b=h||document.querySelectorAll('#stage .opt')[{k}];b&&b.click()}})()")
            pg.wait_for_timeout(1300)
        pg.wait_for_timeout(400)
    check(pg.is_visible('#finish') and ('пазл' in pg.inner_text('#btn-to-puz') or 'лабиринт' in pg.inner_text('#btn-to-puz')), 'занятие закончилось экраном «Молодец» и наградой: ' + pg.inner_text('#btn-to-puz'))
    check(pg.is_visible('#finish'), 'занятие закончилось экраном «Молодец»' + ('' if pg.is_visible('#finish') else ' ' + str(pg.evaluate(f"JSON.stringify({{G:{R}.G&&{{i:{R}.G.i,max:{R}.G.max,game:{R}.G.game}},scr:[...document.querySelectorAll('.screen')].filter(x=>!x.hidden).map(x=>x.id),p:document.querySelector('#prompt').textContent,r:{R}.G&&{R}.G.round&&{{dead:{R}.G.round.dead,fin:{R}.G.round.finished,w:{R}.G.round.wrong,lvl:{R}.G.round.lvl}},sayit:!document.querySelector('#sayit').hidden,opts:[...document.querySelectorAll('#stage .opt')].map(o=>o.className).join('|'),bar:!document.querySelector('#nextbar').hidden}})"))))
    pg.click('#btn-finish-home'); pg.wait_for_timeout(1200)
    check(not pg.is_visible('#tip'), 'после занятия «Сегодня дома» больше не выскакивает')

    # ---- раздел для взрослых и статистика
    pg.evaluate("document.querySelector('#gear').dispatchEvent(new PointerEvent('pointerdown'))"); pg.wait_for_timeout(1900)
    check(pg.is_visible('#parent'), 'раздел для взрослых открывается')
    html = pg.inner_html('#stats')
    check('Хочу' in html, 'статистика за 7 дней открывается')
    check(len(pg.query_selector_all('#wb-list .wbrow')) == 13, 'редактор карточек «Хочу»: 13 карточек')
    check('Хочу хлеб!' in pg.inner_html('#wb-list') and 'Дай мяч' not in pg.inner_html('#wb-list'), 'новые карточки (хлеб, бассейн…), без мяча и мишки')
    pg.click('#pn-vid summary'); pg.click('[data-vidtab="ph"]'); pg.wait_for_timeout(300)
    check(len(pg.query_selector_all('#vid-list .rec-row')) > 10, 'список фраз для видео')

    # ---- микрофон и камера
    if MODE == 'mic':
        pg.click('#btn-parent-close'); pg.wait_for_timeout(300)
        # видео: записать для фразы «Я ем»
        pg.evaluate("document.querySelector('#gear').dispatchEvent(new PointerEvent('pointerdown'))"); pg.wait_for_timeout(1900)
        pg.evaluate(f"{R}.recordVideo('Я ем');0")
        pg.wait_for_timeout(2400 + 2600)
        pg.click('#vrec-stop', timeout=5000); pg.wait_for_timeout(800)
        pg.click('#vrec-save', timeout=5000); pg.wait_for_timeout(800)
        has = pg.evaluate(f"[...{R}.VIDK]")
        check('я ем' in has, f'видео записано и сохранено ({has})')
        pg.click('#btn-parent-close'); pg.wait_for_timeout(300)
        # видео играет перед «Скажи!»
        pg.click('.tile[data-game="want"]')
        pg.wait_for_function("window.__rechka.G&&window.__rechka.G.round", timeout=15000)
        pg.evaluate(f"{R}.sayIt('Я ем','');0")
        pg.wait_for_timeout(700)
        check(pg.is_visible('#sayit video'), 'видеообразец показывается в «Скажи!»')
        pg.click('#sayit-skip'); pg.wait_for_timeout(400)
        pg.evaluate("document.querySelector('#btn-home').click()")
        # «Повторяй за Шариком» с микрофоном: поддельный «бип» засчитывается
        pg.evaluate(f"{R}.S.vthr=0.004;{R}.S.lvl.dog=1")
        n0 = pg.evaluate(f"{R}.S.log.filter(x=>x.g==='dog').length")
        pg.evaluate("document.querySelector('.tile[data-game=\"dog\"]').click()")
        ok = False
        for _ in range(90):
            pg.wait_for_timeout(500)
            if pg.evaluate(f"{R}.S.log.filter(x=>x.g==='dog'&&x.k).length") > 0: ok = True; break
        check(ok, '«Повторяй за Шариком»: микрофон слушает повтор')
        pg.evaluate("document.querySelector('#btn-home').click()")
    else:
        pg.click('#btn-parent-close'); pg.wait_for_timeout(300)
        # sayIt без видео и без записи — ничего не показывает
        pg.click('.tile[data-game="want"]')
        pg.wait_for_function("window.__rechka.G&&window.__rechka.G.round", timeout=15000)
        pg.evaluate(f"{R}.sayIt('Лиса бежит','');0"); pg.wait_for_timeout(300)
        check(not pg.is_visible('#sayit'), 'без видео «Скажи!» не появляется (как в v20)')
        pg.evaluate("document.querySelector('#btn-home').click()")
        # запись видео без камеры — понятное сообщение, без ошибок
        pg.evaluate(f"{R}.recordVideo('Я ем');0"); pg.wait_for_timeout(800)
        check('недоступна' in pg.inner_text('#vrec .msg'), 'без камеры: сообщение «Камера недоступна»')
        pg.click('#vrec-close')


    # ---- v28
    if True:
        # «Собака дома»: тащим героя куда нужно (и шаг 2 с миской / футболкой)
        for lv in (1, 3, 4):
            start('home', lv); okr = 0
            for r_ in range(3):
                pg.wait_for_selector('.hm-hero', timeout=20000); pg.wait_for_timeout(400); i0 = pg.evaluate(f"{R}.G.i")
                tgt = pg.evaluate("__ev('HM_T').find(t=>document.querySelector('#prompt').textContent.includes(t.want)).pl")
                drag(ctr(pg.query_selector('.hm-hero').bounding_box()), ctr(pg.query_selector('.pl-' + tgt).bounding_box())); pg.wait_for_timeout(1300)
                if pg.query_selector('.hm-item'): drag(ctr(pg.query_selector('.hm-item').bounding_box()), ctr(pg.query_selector('.pl-' + tgt).bounding_box()))
                try: pg.wait_for_function(f"{R}.G&&{R}.G.i!=={i0}", timeout=20000); okr += 1
                except Exception: pass
            check(okr == 3, f'«Собака дома» ур. {lv}: герой идёт на место, задание засчитано ({okr} из 3)')
        # «Дорисуй»: обвести пунктир пальцем
        for lv in (1, 2, 3):
            start('draw', lv); pg.wait_for_selector('.dr-miss', state='attached', timeout=20000); pg.wait_for_timeout(300); i0 = pg.evaluate(f"{R}.G.i")
            pts = pg.evaluate("""(()=>{const svg=document.querySelector('.draw28 svg'),m=svg.querySelector('.dr-miss');const L=m.getTotalLength();const M=svg.getScreenCTM();const o=[];for(let k=0;k<=120;k++){const p=m.getPointAtLength(L*k/120);o.push([p.x*M.a+M.e,p.y*M.d+M.f])}return o})()""")
            pg.mouse.move(*pts[0]); pg.mouse.down()
            for q_ in pts: pg.mouse.move(*q_)
            pg.mouse.up()
            try: pg.wait_for_function(f"document.querySelector('.dr-final')||{R}.G.i!=={i0}", timeout=8000); okd = True
            except Exception: okd = False
            check(okd, f'«Дорисуй» ур. {lv}: обвёл — картинка ожила')
        # цифры: все предметы видны внутри карточки (и в альбомной ориентации)
        for vw_, vh_ in ((412, 860), (860, 412)):
            pg.set_viewport_size({'width': vw_, 'height': vh_})
            bad = 0
            for n_ in (1, 2, 3, 4, 5):
                start('num', 5); pg.wait_for_selector('#stage', timeout=5000); pg.wait_for_timeout(1500)
                pg.evaluate(f"""(()=>{{document.querySelector('#stage').innerHTML=`<div class="numwrap"><div class="countbox">${{__ev('numCard({n_},RPIC["яблоко"][0])')}}</div><div class="grid n2 numopts"><button class=opt>1</button><button class=opt>3</button></div></div>`}})()"""); pg.wait_for_timeout(300)
                bad += pg.evaluate("(()=>{const b=document.querySelector('.countbox').getBoundingClientRect();return [...document.querySelectorAll('.countbox img')].filter(i=>{const r=i.getBoundingClientRect();return r.top<b.top-1||r.bottom>b.bottom+1||r.left<b.left-1||r.right>b.right+1||r.height<10}).length})()")
            check(bad == 0, f'«Цифры» {vw_}×{vh_}: все предметы целиком в карточке (вылезло {bad})')
        pg.set_viewport_size({'width': 412, 'height': 860})
        check(pg.evaluate("__ev('W24T.animals').every(x=>x.is.length||x.an.length)") and pg.evaluate("!__ev('W24T.all').some(x=>['подушка','пульт','телефон'].includes(x.n))"), '«Что это?»: у каждого животного понятная картинка, без непонятных значков')

    # ---- v29: «Покажи, где…» — нажать на часть тела мальчика
    if True:
        # точка, которая действительно попадает в нужную часть (середина рамки может лежать на соседней: волосы → голова)
        PT = """(name)=>{const gs=[...document.querySelectorAll('#stage [data-part]')].filter(e=>e.dataset.part===name);
          const g=gs[0];const e=[...g.children].find(c=>c.tagName!=='g'&&c.getAttribute('fill')!=='transparent')||g;const r=e.getBoundingClientRect();
          const c=[r.x+r.width/2,r.y+r.height/2];const hit=(x,y)=>{const el=document.elementFromPoint(x,y);const p=el&&el.closest&&el.closest('[data-part]');return p&&p.dataset.part===name};
          if(hit(...c))return c;
          for(let k=1;k<=8;k++)for(let a=0;a<12;a++){const x=c[0]+Math.cos(a*Math.PI/6)*r.width*k/16,y=c[1]+Math.sin(a*Math.PI/6)*r.height*k/16;if(hit(x,y))return [x,y]}
          return c}"""
        for lv in (1, 2, 3):
            okr = okw = 0
            start('body', lv); prev = None
            for r_ in range(3):
                pg.wait_for_function(f"{R}.G&&{R}.G.round&&{R}.G.round.bodyReady&&{R}.G.round.tStart!=={json.dumps(prev)}", timeout=20000); pg.wait_for_timeout(300)
                prev = pg.evaluate(f"{R}.G.round.tStart")
                i0 = pg.evaluate(f"{R}.G.i")
                tgt = pg.evaluate("document.querySelector('#prompt').textContent.replace('Покажи, где ','').replace('!','').trim()")
                top = [x for x in ('нога', 'рука', 'живот', 'голова') if x != tgt and not pg.evaluate(f"__ev('bodyHits')('{tgt}','{x}')")]
                w0 = pg.evaluate(f"{R}.G.round.wrong")
                pg.touchscreen.tap(*pg.evaluate(PT, top[0])); pg.wait_for_timeout(300)
                if pg.evaluate(f"{R}.G.round.wrong") == w0 + 1: okw += 1
                pg.wait_for_function(f"!document.querySelector('#stage .bad')", timeout=8000); pg.wait_for_timeout(300)
                pg.touchscreen.tap(*pg.evaluate(PT, tgt))
                try: pg.wait_for_function(f"{R}.G&&{R}.G.i!=={i0}", timeout=15000); okr += 1
                except Exception: pass
            check(okr == 3 and okw == 3, f'«Покажи, где…» ур. {lv}: неверное место — ошибка, верное — задание засчитано ({okw}/3, {okr}/3)')
        # выключатель в разделе для взрослых прячет плитку
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
        pg.evaluate(f"{R}.S.bodyOn=false;__ev('applyV21Home')()")
        hid = not pg.is_visible('.tile[data-game="body"]')
        pg.evaluate(f"{R}.S.bodyOn=true;__ev('applyV21Home')()")
        check(hid and pg.is_visible('.tile[data-game="body"]'), '«Покажи, где…» выключается в разделе для взрослых')

    # ---- v30: «Зеркало с Шариком» — камера (поза подменяется через window.__mirrSim) и кнопка «Получилось»
    if True:
        SIM = {'улыбка': "{b:{mouthSmileLeft:.9,mouthSmileRight:.9}}", 'а': "{b:{jawOpen:.8}}", 'трубочка': "{b:{mouthPucker:.9}}",
               'глазки': "{b:{eyeBlinkLeft:.9,eyeBlinkRight:.9}}", 'щёки': "{b:{cheekPuff:.8}}", 'брови': "{b:{browInnerUp:.8}}"}
        # точки лица для «покажи на себе»: 478 точек, нужные — нос 1, рот 13/14, глаза 159/386, края лица 234/454, щёки 50/280, лоб 10
        FACE = "(()=>{const f=Array.from({length:478},()=>({x:.5,y:.5}));Object.assign(f,{1:{x:.5,y:.5},13:{x:.5,y:.62},14:{x:.5,y:.64},159:{x:.42,y:.42},386:{x:.58,y:.42},234:{x:.3,y:.5},454:{x:.7,y:.5},50:{x:.38,y:.55},280:{x:.62,y:.55},10:{x:.5,y:.25}});return f})()"
        PTS = {'нос': (.5, .5), 'рот': (.5, .63), 'глаз': (.42, .42), 'ухо': (.28, .5), 'щёчка': (.38, .55), 'голова': (.5, .2)}
        for lv in (1, 2, 3):
            start('mirr', lv); okc = 0; prev = None
            for r_ in range(3):
                pg.wait_for_function(f"{R}.G&&{R}.G.round&&{R}.G.round.mirrReady&&{R}.G.round.tStart!=={json.dumps(prev)}", timeout=60000); pg.wait_for_timeout(200)
                prev = pg.evaluate(f"{R}.G.round.tStart")
                i0 = pg.evaluate(f"{R}.G.i"); key = pg.evaluate("__ev('G.mirrLast').slice(-1)[0]")
                if key in SIM: pg.evaluate(f"window.__mirrSim=Object.assign({{f:null,h:[]}},{SIM[key]})")
                else:
                    x, y = PTS[key]; pg.evaluate(f"window.__mirrSim={{b:{{}},f:{FACE},h:[{{x:{x},y:{y}}}]}}")
                try: pg.wait_for_function(f"{R}.G&&{R}.G.i!=={i0}", timeout=10000); okc += 1
                except Exception: print('    не засчитано:', key)
                pg.evaluate("delete window.__mirrSim")
            check(okc == 3, f'«Зеркало с Шариком» ур. {lv}: поза перед камерой засчитана ({okc} из 3)')
        # v35: уровень 4 — всё тело и движения (поза подменяется: 33 точки MediaPipe Pose, движения — функцией времени)
        POSE = """window.__P=(ch)=>{const P=Array.from({length:33},()=>({x:.5,y:.5,visibility:1}));
          const set=(o)=>{for(const k in o)P[k]={x:o[k][0],y:o[k][1],visibility:1}};
          set({0:[.5,.2],11:[.6,.32],12:[.4,.32],13:[.63,.45],14:[.37,.45],15:[.64,.58],16:[.36,.58],19:[.64,.61],20:[.36,.61],
               23:[.57,.6],24:[.43,.6],25:[.57,.78],26:[.43,.78],27:[.57,.95],28:[.43,.95]});set(ch||{});return {b:{},f:null,h:[],p:P}}"""
        PSIM = {'живот': "__P({19:[.5,.5]})", 'нога': "__P({19:[.57,.8]})", 'коленка': "__P({19:[.57,.77]})",
                'плечи': "__P({19:[.4,.34],20:[.6,.34]})", 'руки вверх': "__P({15:[.62,.08],16:[.38,.08],19:[.62,.05],20:[.38,.05]})",
                'присядь': "__P({23:[.57,.75],24:[.43,.75],25:[.65,.8],26:[.35,.8]})",
                'помаши': "t=>__P({13:[.62,.3],15:[.6+.08*Math.sign(Math.sin(t/200)),.18],19:[.6+.08*Math.sign(Math.sin(t/200)),.15]})",
                'хлопни': "t=>{const c=Math.sin(t/250)>0;return __P({15:[c?.52:.7,.45],16:[c?.48:.3,.45]})}"}
        pg.evaluate(POSE)
        start('mirr', 4); okc = 0; prev = None; seen = []
        for r_ in range(4):
            pg.wait_for_function(f"{R}.G&&{R}.G.round&&{R}.G.round.mirrReady&&{R}.G.round.tStart!=={json.dumps(prev)}", timeout=60000); pg.wait_for_timeout(200)
            prev = pg.evaluate(f"{R}.G.round.tStart")
            i0 = pg.evaluate(f"{R}.G.i"); key = pg.evaluate("__ev('G.mirrLast').slice(-1)[0]"); seen.append(key)
            pg.evaluate(f"window.__mirrSim=__P()"); pg.wait_for_timeout(700)
            early = pg.evaluate(f"{R}.G.i!=={i0}")
            pg.evaluate(f"window.__mirrSim={PSIM.get(key, '__P()')}")
            try: pg.wait_for_function(f"{R}.G&&{R}.G.i!=={i0}", timeout=10000); okc += 0 if early else 1
            except Exception: print('    не засчитано:', key)
            pg.evaluate("delete window.__mirrSim")
        check(okc == 4, f'«Зеркало с Шариком» ур. 4 (тело и движения): движение засчитано, спокойная поза — нет ({okc} из 4: {seen})')
        # смотрит ли на экран: лицо прямо — да, отвернулся — нет
        look = pg.evaluate(f"(()=>{{const f=Array.from({{length:478}},()=>({{x:.5,y:.5}}));f[234]={{x:.3,y:.5}};f[454]={{x:.7,y:.5}};f[1]={{x:.5,y:.5}};const a=__ev('mirrLook')({{f}});f[1]={{x:.66,y:.5}};const b=__ev('mirrLook')({{f}});return [a,b,__ev('mirrLook')({{f:null}})]}})()")
        check(look == [True, False, False], f'«Зеркало»: смотрит ли на экран ({look})')
        start('mirr', 1); pg.wait_for_function(f"{R}.G&&{R}.G.round&&{R}.G.round.mirrReady", timeout=60000)
        i0 = pg.evaluate(f"{R}.G.i"); pg.click('.mok')
        try: pg.wait_for_function(f"{R}.G.i!=={i0}", timeout=10000); okp = True
        except Exception: okp = False
        check(okp, '«Зеркало с Шариком»: кнопка «Получилось» для мамы засчитывает попытку')
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(1500)
        check(pg.evaluate("!__ev('MIRR_STREAM')"), '«Зеркало с Шариком»: камера выключается после выхода домой')
        pg.evaluate(f"{R}.S.mirrOn=false;__ev('applyV21Home')()"); hid = not pg.is_visible('.tile[data-game="mirr"]')
        pg.evaluate(f"{R}.S.mirrOn=true;__ev('applyV21Home')()")
        check(hid, '«Зеркало с Шариком» выключается в разделе для взрослых')

    # ---- v31: «Занятие с Шариком» — ответы сервера подменяются через window.__shSim
    if True:
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(800)
        check(not pg.is_visible('#btn-sharik'), '«Занятие с Шариком» скрыто, пока не включено в разделе для взрослых')
        pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=false;S.shUrl='https://example.invalid';__ev('applyV21Home')();
          window.__shLog=[];window.__shSim=ev=>{{window.__shLog.push(ev);const n=window.__shLog.length;
            if(n>=3)return {{say:'Ты молодец! Пока!',next:{{kind:'end',game:null,level:null}},tone:'calm'}};
            return {{say:n===1?'Привет! Покажи нос!':'Молодец!',next:{{kind:'game',game:n===1?'body':'yn',level:1}},tone:'praise'}}}}}})()""")
        check(pg.is_visible('#btn-sharik'), '«Занятие с Шариком» появляется на главном экране')
        pg.click('#btn-sharik')
        okg = []
        for want in ('body', 'yn'):
            try:
                pg.wait_for_function(f"{R}.G&&{R}.G.game==='{want}'&&{R}.G.round&&!{R}.G.round.finished&&{R}.G.round.lvl!==undefined", timeout=30000)
                okg.append(want); i0 = pg.evaluate(f"{R}.G.i")
                pg.evaluate(f"{R}.G.round&&__ev('roundDone')(true,{{n:'тест'}})")
                pg.wait_for_function(f"!{R}.G||{R}.G.i!=={i0}", timeout=10000)
            except Exception as e_: print('    ', want, str(e_)[:120])
        try: pg.wait_for_selector('#finish', state='visible', timeout=30000); fin = True
        except Exception: fin = False
        evs = pg.evaluate("window.__shLog.map(e=>e.type+(e.game?':'+e.game:'')+(e.ok!==undefined?':'+e.ok:''))")
        check(okg == ['body', 'yn'] and fin and evs[:3] == ['start', 'result:body:true', 'result:yn:true'],
              f'«Занятие с Шариком»: Шарик выбирает игры, получает результаты и заканчивает занятие ({okg}, {evs}, конец={fin})')
        pg.evaluate(f"delete window.__shSim;{R}.S.shOn=false;__ev('applyV21Home')()")
        pg.click('#btn-finish-home'); pg.wait_for_timeout(800)

        # ---- v32: Шарик слышит Льва — голос и распознавание подменяются (__shVoiceSim, __shSttSim)
        pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=true;S.shStt=true;S.shUrl='https://example.invalid';__ev('applyV21Home')();
          window.__shLog=[];let nv=0;window.__shVoiceSim=async()=>{{nv++;return nv===1?{{ms:900,span:1200}}:null}};
          window.__shSttSim=async()=>'нос';
          window.__shSim=ev=>{{window.__shLog.push(ev);const n=window.__shLog.length;
            if(ev.type==='voice')return {{say:'Ух ты, ты сказал!',next:{{kind:'game',game:null,level:null}},tone:'praise'}};
            if(n>=3)return {{say:'Пока!',next:{{kind:'end',game:null,level:null}},tone:'calm'}};
            return {{say:'Привет! Покажи нос!',next:{{kind:'game',game:'body',level:1}},tone:'invite'}}}}}})()""")
        pg.click('#btn-sharik')
        try:
            pg.wait_for_function(f"{R}.G&&{R}.G.game==='body'&&{R}.G.round&&{R}.G.round.lvl!==undefined", timeout=30000); okb = True
        except Exception: okb = False
        evs = pg.evaluate("window.__shLog.map(e=>[e.type,e.game||'',e.voiceMs||0,e.heard||''])")
        check(okb and evs[:2] == [['start', '', 0, ''], ['voice', 'body', 900, 'нос']],
              f'«Занятие с Шариком»: голос Льва — событие voice с длительностью и heard, игра та, что задумана ({evs[:2]}, игра={okb})')
        if okb:
            i0 = pg.evaluate(f"{R}.G.i"); pg.evaluate(f"{R}.G.round&&__ev('roundDone')(true,{{n:'тест'}})")
            try: pg.wait_for_selector('#finish', state='visible', timeout=30000); fin = True
            except Exception: fin = False
            check(fin, '«Занятие с Шариком»: после голоса занятие продолжается и заканчивается')
            pg.click('#btn-finish-home'); pg.wait_for_timeout(800)
        # выключатель: Шарик не слушает
        pg.evaluate(f"""(()=>{{const S={R}.S;S.shVoice=false;window.__shLog=[];window.__shVoiceSim=async()=>({{ms:900,span:1200}})}})()""")
        pg.click('#btn-sharik')
        try: pg.wait_for_function(f"{R}.G&&{R}.G.game==='body'&&{R}.G.round&&{R}.G.round.lvl!==undefined", timeout=30000)
        except Exception: pass
        evs = pg.evaluate("window.__shLog.map(e=>e.type)")
        check(evs[:1] == ['start'] and 'voice' not in evs, f'«Занятие с Шариком»: слушание голоса выключается в разделе для взрослых ({evs})')
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(800)
        pg.evaluate(f"delete window.__shSim;delete window.__shVoiceSim;delete window.__shSttSim;{R}.S.shOn=false;{R}.S.shVoice=true;{R}.S.shStt=false;__ev('applyV21Home')()")
        if MODE == 'mic':  # настоящий микрофон Chromium (сигнал «бип») — Шарик слышит голос
            pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=true;S.shUrl='https://example.invalid';__ev('applyV21Home')();
              window.__shLog=[];window.__shSim=ev=>{{window.__shLog.push(ev);return ev.type==='voice'?{{say:'Ух ты!',next:{{kind:'end',game:null,level:null}},tone:'praise'}}:{{say:'Привет!',next:{{kind:'game',game:'body',level:1}},tone:'invite'}}}}}})()""")
            pg.click('#btn-sharik')
            try: pg.wait_for_selector('#finish', state='visible', timeout=30000)
            except Exception: pass
            evs = pg.evaluate("window.__shLog.map(e=>[e.type,e.voiceMs||0])")
            check(len(evs) >= 2 and evs[1][0] == 'voice' and evs[1][1] > 100, f'«Занятие с Шариком»: микрофон слышит голос — событие voice ({evs})')
            if pg.is_visible('#btn-finish-home'): pg.click('#btn-finish-home')
            else: pg.evaluate("document.querySelector('#btn-home').click()")
            pg.wait_for_timeout(800)
            pg.evaluate(f"delete window.__shSim;{R}.S.shOn=false;__ev('applyV21Home')()")

    # ---- v37: живой голос Шарика — /tts подменяется (__shTtsSim): звук 1,2 с; без ответа — голос телефона
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=true;S.shTts=true;S.shUrl='https://example.invalid';__ev('applyV21Home')();
      window.__shLog=[];window.__shVoiceSim=async()=>null;S.shLat=[];
      const sr=16000,f=new Float32Array(sr*1.2);for(let i=0;i<f.length;i++)f[i]=Math.sin(i/sr*2*Math.PI*220)*.5*Math.abs(Math.sin(i/sr*Math.PI*4));
      const wav=__ev('wavBlob')(f,sr);window.__ttsN=0;window.__shTtsSim=async t=>{{window.__ttsN++;return t==='Пока!'?null:wav}};
      window.__shSim=ev=>{{window.__shLog.push(ev);const n=window.__shLog.length;
        if(n>=2)return {{say:'Пока!',next:{{kind:'end',game:null,level:null}},tone:'calm'}};
        return {{say:'Привет! Покажи нос!',next:{{kind:'game',game:'body',level:1}},tone:'invite'}}}}}})()""")
    pg.click('#btn-sharik')
    try:
        pg.wait_for_function(f"{R}.G&&{R}.G.game==='body'&&{R}.G.round&&{R}.G.round.lvl!==undefined", timeout=30000)
        pg.evaluate(f"{R}.G.round&&__ev('roundDone')(true,{{n:'тест'}})")
        pg.wait_for_selector('#finish', state='visible', timeout=30000)
    except Exception as e_: print('    ', str(e_)[:120])
    how = pg.evaluate("__ev('SH_HOW').slice(-2)")
    lat = pg.evaluate(f"{R}.S.shLat||[]")
    check(how == ['tts:ok', 'phone'] and pg.evaluate("window.__ttsN") == 3, f'живой голос Шарика: приветствие и реплика по предложениям с сервера дослушаны, без ответа — голос телефона; фразы игр в сеть не ходят ({how}, {pg.evaluate("window.__ttsN")})')
    # v39: заранее скачать голос готовых фраз
    pg.evaluate(f"{R}.S.shOn=true;window.__shPhrasesSim=async()=>['Молодец!','Ура!'];window.__shTtsSim=async t=>new Blob([new Uint8Array(500)],{{type:'audio/mpeg'}})")
    dl = pg.evaluate("__ev('shPhrasesDownload')()")
    check(dl == {'ok': 5, 'all': 5}, f'готовые фразы: скачиваются все (2 с сервера + 3 с именем) ({dl})')
    pg.evaluate("delete window.__shPhrasesSim")
    check(len(lat) >= 2, f'живой голос Шарика: задержка до первого звука записана ({lat})')
    if pg.is_visible('#btn-finish-home'): pg.click('#btn-finish-home')
    pg.evaluate(f"delete window.__shSim;delete window.__shTtsSim;delete window.__shVoiceSim;{R}.S.shOn=false;__ev('applyV21Home')()")

    # ---- v40: Шарик думает, пока ждёт сервер; выход домой отменяет запросы, поздний ответ ничего не делает
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=false;S.shTts=false;S.shUrl='https://example.invalid';__ev('applyV21Home')();
      window.__shLog=[];window.__shSim=ev=>new Promise(r=>setTimeout(()=>{{window.__shLog.push(ev);r({{say:'Привет! Покажи нос!',next:{{kind:'game',game:'body',level:1}},tone:'invite'}})}},2500))}})()""")
    pg.click('#btn-sharik')
    try: pg.wait_for_selector('#shc .shbub.think', timeout=4000); think = pg.evaluate("!!document.querySelector('#shc .shdog.think')")
    except Exception: think = False
    try: pg.wait_for_function(f"{R}.G&&{R}.G.game==='body'&&{R}.G.round&&{R}.G.round.lvl!==undefined", timeout=15000); went = True
    except Exception: went = False
    check(think and went and not pg.evaluate("!!document.querySelector('#shc .shbub.think')"), f'«Занятие с Шариком»: пока ждёт ответ — Шарик думает («…»), потом игра (думает={think}, игра={went})')
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.click('#btn-sharik'); pg.wait_for_timeout(600)
    sig = pg.evaluate("(window.__oldSig=__ev('SH_CTL').signal, window.__oldSig.aborted)")
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(3500)
    late = pg.evaluate(f"({{aborted:window.__oldSig.aborted,G:!!{R}.G,game:document.querySelector('#game').hidden,log:window.__shLog.length}})")
    check(sig is False and late['aborted'] and not late['G'] and late['game'], f'«Занятие с Шариком»: выход домой отменяет запросы, поздний ответ ничего не делает ({late})')
    pg.evaluate(f"delete window.__shSim;{R}.S.shOn=false;{R}.S.shVoice=true;{R}.S.shTts=true;__ev('applyV21Home')()")

    # ---- v41: Шарик — ведущий внутри задания: на экране рядом с игрой, сервер не задерживает занятие
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shVoice=false;S.shTts=false;S.shUrl='https://example.invalid';__ev('applyV21Home')();
      window.__shLog=[];window.__shSim=ev=>{{window.__shLog.push(ev);return ev.type==='start'?{{say:'Давай играть!',next:{{kind:'game',game:'yn',level:1}},tone:'invite'}}:new Promise(()=>{{}})}}}})()""")
    pg.click('#btn-sharik')
    try: pg.wait_for_function(f"{R}.G&&{R}.G.game==='yn'&&{R}.G.round&&{R}.G.round.prompt", timeout=30000); in_game = True
    except Exception: in_game = False
    comp = pg.evaluate("(()=>{const c=document.querySelector('#shc'),st=document.querySelector('#stage');if(!c)return null;const r=c.getBoundingClientRect(),q=st.getBoundingClientRect();return {vis:r.height>60&&q.height>200,below:r.top>=q.bottom-1,big:document.querySelector('#game').classList.contains('shbig')}})()")
    check(in_game and comp and comp['vis'] and comp['below'] and not comp['big'], f'«Занятие с Шариком»: Шарик на экране рядом с заданием и не закрывает его ({comp})')
    t0 = time.time(); i0 = pg.evaluate(f"{R}.G.i")
    pg.evaluate(f"{R}.G.round&&__ev('roundDone')(true,{{n:'тест'}})")
    try: pg.wait_for_function(f"{R}.G&&{R}.G.i==={i0}+1&&{R}.G.round&&!{R}.G.round.finished&&{R}.G.round.prompt", timeout=15000); nxt = True
    except Exception: nxt = False
    dt = time.time() - t0
    ev1 = pg.evaluate("window.__shLog[1]||null")
    check(nxt and dt < 6 and ev1 and ev1.get('type') == 'result' and len(ev1.get('task') or '') > 3 and pg.evaluate(f"{R}.G.game") == 'yn',
          f'«Занятие с Шариком»: сервер молчит — следующее задание всё равно начинается (за {dt:.1f} с), серверу ушёл текст задания ({ev1})')
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    pg.evaluate(f"delete window.__shSim;{R}.S.shOn=false;{R}.S.shVoice=true;{R}.S.shTts=true;__ev('applyV21Home')()")
    pg.evaluate(f"__ev('startGame')('yn')"); pg.wait_for_timeout(500)
    check(pg.evaluate("!document.querySelector('#shc')||getComputedStyle(document.querySelector('#shc')).display==='none'"), 'Шарик выключен: в обычной игре его на экране нет')
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
    # v42: Шарик включён — он рядом и в обычной игре (без сервера); выключатель «в обычных играх» его убирает
    pg.evaluate(f"{R}.S.shOn=true;{R}.S.shUrl='';__ev('startGame')('yn')"); pg.wait_for_timeout(700)
    on = pg.evaluate(f"!!{R}.G.host&&!!document.querySelector('#shc')&&document.querySelector('#shc').getBoundingClientRect().height>60")
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(500)
    pg.evaluate(f"{R}.S.shHost=false;__ev('startGame')('yn')"); pg.wait_for_timeout(500)
    off = pg.evaluate(f"!{R}.G.host&&!document.querySelector('#shc')")
    check(on and off, f'Шарик рядом в обычной игре и выключается в разделе для взрослых (есть={on}, убран={off})')
    pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(500)
    pg.evaluate(f"delete {R}.S.shHost;{R}.S.shOn=false;__ev('applyV21Home')()")

    # ---- v34: память между занятиями — сводка за 7 дней по журналу (считается на телефоне)
    mem = pg.evaluate(f"""(()=>{{const S={R}.S,keep=S.log,now=Date.now(),D=864e5;
      S.log=[{{t:now-2*D,g:'body',l:1,ok:false,w:2,n:'ухо'}},{{t:now-D-5,g:'body',l:1,ok:true,w:1,n:'ухо'}},{{t:now-D,g:'body',l:1,ok:false,w:1,n:'ухо'}},
        {{t:now-3*D,g:'body',l:1,ok:true,w:1,n:'нос'}},{{t:now-D,g:'body',l:2,ok:true,w:0,n:'нос'}},{{t:now-D+9,g:'body',l:2,ok:true,w:0,n:'нос'}},
        {{t:now-9*D,g:'body',l:1,ok:false,w:3,n:'рука'}},{{t:now-D,g:'hack',ok:true}}];
      const keepG=window.__rechka.G;const m=__ev('shMemory')(now);S.shMem=false;const off=__ev('shMemory')(now);S.shMem=true;S.log=keep;
      return {{m,off}}}})()""")
    m = mem['m'] or {}
    check(m.get('days') == 3 and m.get('lastDaysAgo') == 1 and [h['item'] for h in m.get('hard', [])] == ['ухо']
          and [h['item'] for h in m.get('better', [])] == ['нос'] and [g['game'] for g in m.get('games', [])] == ['body'] and mem['off'] is None,
          f'«Занятие с Шариком»: сводка прошлых занятий (трудно — ухо, получается — нос; выключается) {mem}')

    # ---- v33: объёмный Шарик (three.js); без WebGL — прежний рисунок
    if True:
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
        # v43: герой по умолчанию — рисованный кот; он же в «Повторяй за Шариком»
        pg.evaluate(f"{R}.S.dogHi=1;{R}.S.hero='cat'"); pg.click('.tile[data-game="dog"]'); pg.wait_for_timeout(1500)
        cat = pg.evaluate("(()=>{const d=document.querySelector('.dogbox');const h=d&&d._s3;return !!(d&&d.classList.contains('is3d')&&d.querySelector('.hero2d svg')&&h&&h.active&&h.kind==='cat'&&!window.Sharik3D)})()")
        check(cat, 'герой — рисованный кот: показывается в «Повторяй за Шариком» без загрузки 3D')
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
        pg.evaluate(f"{R}.S.dogHi=1;{R}.S.sh3d=true;{R}.S.hero='dog'"); pg.click('.tile[data-game="dog"]')
        try: pg.wait_for_selector('.dogbox', timeout=15000); pg.wait_for_timeout(2500)
        except Exception: pass
        loaded = pg.evaluate("!!window.Sharik3D")
        sup = pg.evaluate("!!(window.Sharik3D&&Sharik3D.supported())")
        has = pg.evaluate("!!document.querySelector('.dogbox.is3d canvas.sh3d')")
        svg = pg.evaluate("!!document.querySelector('.dogbox svg')")
        check(loaded and (has if sup else svg), f'объёмный Шарик в «Повторяй за Шариком» (загружен={loaded}, WebGL={sup}, 3D={has})')
        pg.evaluate("document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)
        pg.evaluate(f"{R}.S.sh3d=false"); pg.click('.tile[data-game="dog"]')
        try: pg.wait_for_selector('.dogbox', timeout=15000); pg.wait_for_timeout(1500)
        except Exception: pass
        check(not pg.evaluate("!!document.querySelector('.dogbox.is3d')") and pg.evaluate("!!document.querySelector('.dogbox svg')"),
              'объёмный Шарик выключается в разделе для взрослых — прежний рисунок')
        pg.evaluate(f"{R}.S.sh3d=true;{R}.S.hero='cat';document.querySelector('#btn-home').click()"); pg.wait_for_timeout(600)

    check(not errors, 'ошибок в консоли нет' + ('' if not errors else ': ' + ' | '.join(errors[:5])[:600]))
    b.close()
print('\nИТОГ:', 'всё прошло' if not fails else f'{len(fails)} проблем(ы)')
sys.exit(1 if fails else 0)
