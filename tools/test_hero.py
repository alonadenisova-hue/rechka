"""Проверка новых заданий «Играем с Шариком» (версия 48, задача 12) в браузере без микрофона и камеры.
Запуск: cd app && python3 -m http.server 8765 (в фоне), затем python3 tools/test_hero.py
Каждый вид на каждом уровне: открывается, ждёт ответа, после верного ответа хвалит и пишет в журнал;
похвала только после события; «Привет» первым заданием; перерыв; выключатель вида."""
import sys
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8765/'
fails, errors = [], []
def check(ok, what):
    print(('OK   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)
OK_EV = {'tap', 'parent', 'camera', 'voice'}
def praise_ok(L):
    for i, e in enumerate(L):
        if e['type'] != 'praise': continue
        prev = [x for x in L[:i] if x['type'] in OK_EV | {'skip', 'help'} or (x['type'] == 'stage' and x.get('st') in ('wait', 'help'))]
        p = prev[-1] if prev else None
        if not p or p['type'] not in OK_EV or (p['type'] == 'tap' and p.get('ok') is False): return False
    return True

KINDS = ['dress', 'hide', 'big', 'feed', 'yesno', 'chain', 'color', 'yaty', 'put', 'rhythm', 'hello', 'bye']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 412, 'height': 860})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(m.text))
    pg.add_init_script("window.speechSynthesis.speak=u=>{setTimeout(()=>{u.onend&&u.onend()},30)};")
    pg.goto(URL); pg.wait_for_timeout(1200)
    R = 'window.__rechka'
    pg.evaluate(f"(()=>{{const S={R}.S;S.shVoice=false;S.shWaitS=2;S.shCam=false}})()")
    # первое задание — «Привет»
    pg.evaluate("__ev('startGame')('cat')")
    pg.wait_for_function(f"{R}.G&&{R}.G.hgLast", timeout=8000)
    check(pg.evaluate(f"{R}.G.hgLast") == 'hello', 'первое задание — «Привет»')
    # драйвер: верный ответ, как только задание ждёт
    drive = f"""(()=>{{const L=window.__ls.L;if(!L||!L.it||L.it.done||!['wait'].includes(L.stage))return 0;
      const e=document.querySelector('#stage [data-ok="1"]:not(.gone)');if(e){{e.click();return 1}}
      window.__ls.lsEmit(L.x.kind==='pick'?'tap':'parent',{{ok:true}});L.it.done=true;return 2}})()"""
    for lv in [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else "123")]:
        done, praised = [], True
        for k in KINDS:
            if lv < pg.evaluate(f"(window.__hgt.HGT && ({{yaty:2,put:2,rhythm:2}})['{k}'])||1"): continue
            try:
                pg.evaluate(f"""(()=>{{document.querySelector('#btn-home').click();{R}.S.lvl.cat={lv};__ev('startGame')('cat');const G={R}.G;G.round.dead=true;G.hgSeq=['{k}'];G.i=0;__ev('nextRound')()}})()""")
                pg.wait_for_function(f"{R}.G&&{R}.G.hgLast==='{k}'", timeout=8000)
                for _ in range(200):
                    if pg.evaluate(f"{R}.G&&{R}.G.i>=1"): break
                    pg.evaluate(drive); pg.wait_for_timeout(150)
                last = pg.evaluate(f"{R}.S.log[{R}.S.log.length-1]")
                want = 'hello' if k == 'bye' else k
                if pg.evaluate(f"{R}.G&&{R}.G.i>=1") and last.get('m') == want and last.get('ok'): done.append(k)
                else: print('    не прошло:', lv, k, last, pg.evaluate("window.__ls.L&&window.__ls.L.log.slice(-6)"))
                praised = praised and praise_ok(pg.evaluate("window.__ls.L?window.__ls.L.log:[]"))
            except Exception as e_:
                print('    ', lv, k, str(e_)[:160])
        need = [k for k in KINDS if lv >= ({'yaty': 2, 'put': 2, 'rhythm': 2}.get(k, 1))]
        check(done == need, f'уровень {lv}: все виды проходятся и пишутся в журнал ({len(done)} из {len(need)}) {sorted(set(need)-set(done))}')
        check(praised, f'уровень {lv}: похвала только после ответа')
    # без ответа — помощь без похвалы, затем «дальше»
    pg.evaluate(f"""(()=>{{document.querySelector('#btn-home').click();{R}.S.lvl.cat=1;__ev('startGame')('cat');const G={R}.G;G.round.dead=true;G.hgSeq=['color'];G.i=0;__ev('nextRound')()}})()""")
    pg.wait_for_function(f"{R}.G&&{R}.G.i>=1", timeout=60000)
    L = pg.evaluate("window.__ls.L.log")
    acts = [e.get('act') for e in L if e['type'] == 'stage' and e.get('st') == 'help']
    last = pg.evaluate(f"{R}.S.log[{R}.S.log.length-1]")
    check(not any(e['type'] == 'praise' for e in L) and acts[-1] == 'next' and last['ok'] is False, f'молчит — помощь без похвалы ({acts}), задание не засчитано')
    # перерыв
    pg.evaluate(f"""(()=>{{document.querySelector('#btn-home').click();__ev('startGame')('cat');const G={R}.G;G.round.dead=true;G.hgSeq=['do'];G.i=4;__ev('nextRound')()}})()""")
    pg.wait_for_function(f"{R}.G&&{R}.G.hgLast==='rest'", timeout=8000); pg.wait_for_timeout(600)
    for _ in range(4): pg.click('#stage .hgspoon'); pg.wait_for_timeout(700)
    pg.wait_for_function(f"{R}.G&&{R}.G.i>=5", timeout=10000)
    check(pg.evaluate(f"{R}.S.log[{R}.S.log.length-1].m") == 'rest', 'перерыв: мяч — 4 раза, потом дальше')
    # выключатель
    pg.evaluate(f"{R}.S.hgK={{dress:false}}")
    check('dress' not in pg.evaluate("window.__hgt.hgKinds(3)") and 'hide' in pg.evaluate("window.__hgt.hgKinds(3)"), 'вид задания выключается')
    pg.evaluate(f"delete {R}.S.hgK;document.querySelector('#btn-home').click()")
    pg.evaluate("__ev('renderParent')()")
    check(pg.evaluate("document.querySelectorAll('#hg-kinds input').length") >= 15, 'выключатели видов в «Для взрослых»')
    b.close()
check(not errors, f'ошибок консоли нет {errors[:3]}')
print('ИТОГ:', 'всё прошло' if not fails else f'не прошло {len(fails)}')
sys.exit(1 if fails else 0)
