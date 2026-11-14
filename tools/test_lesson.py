"""Проверка «Пятиминутки с Шариком» (версия 47) в браузере, без микрофона и камеры: события подставляются.
Запуск: cd app && python3 -m http.server 8765 (в фоне), затем python3 tools/test_lesson.py
Проверяет: этапы задания, похвала только после события, помощь без похвалы, правила телефона, действие ИИ,
кнопки мамы, жест камерой (подменённый кадр), отчёт на экране «Молодец!» и в «Для взрослых»."""
import sys, json
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8765/'
fails, errors = [], []
def check(ok, what):
    print(('OK   ' if ok else 'FAIL ') + what)
    if not ok: fails.append(what)

OK_EV = {'tap', 'parent', 'camera', 'voice'}

def log(pg):
    return pg.evaluate("window.__ls.L?window.__ls.L.log:[]")

def wait_stage(pg, st, ms=20000):
    pg.wait_for_function(f"window.__ls.L&&window.__ls.L.stage==='{st}'", timeout=ms)

def praise_ok(L):
    """каждая похвала — сразу после события-ответа"""
    ok = True
    for i, e in enumerate(L):
        if e['type'] != 'praise': continue
        prev = [x for x in L[:i] if x['type'] in OK_EV | {'skip', 'help', 'stage'} and not (x['type'] == 'stage' and x.get('st') == 'notice')]
        p = prev[-1] if prev else None
        if not p or p['type'] not in OK_EV or (p['type'] == 'tap' and not p.get('ok', True)):
            ok = False; print('   похвала без события:', p, e)
    return ok

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 412, 'height': 860}, has_touch=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errors.append(m.text))
    pg.add_init_script("window.speechSynthesis.speak=u=>{setTimeout(()=>{u.onend&&u.onend()},40)};")
    pg.goto(URL); pg.wait_for_timeout(1200)
    R = 'window.__rechka'
    check(not pg.is_visible('#btn-ls'), 'кнопка «Пятиминутка» скрыта, пока Шарик выключен')
    # ИИ подменён: на событие lesson выбирает «показать образец»
    pg.evaluate(f"""(()=>{{const S={R}.S;S.shOn=true;S.shUrl='http://sim';S.lsPre=false;S.shWaitS=2;S.lsMin=10;S.lsItems=2;S.shCam=true;
      window.__aiLog=[];window.__shSim=ev=>{{window.__aiLog.push(ev);return ev.type==='lesson'?{{say:'',next:{{kind:'game',game:null,level:null,action:window.__aiAct||null}},tone:'calm',note:window.__aiNote||'ok'}}:null}};
      __ev('applyV21Home')()}})()""")
    check(pg.is_visible('#btn-ls'), 'кнопка «Пятиминутка» на главном экране, когда Шарик включён')
    pg.click('#btn-ls')

    # ---- упражнение 1: выбор картинки
    wait_stage(pg, 'wait')
    check(pg.evaluate("document.querySelectorAll('.ls .hgopt').length") >= 2, 'выбор: карточки после вопроса')
    t = pg.evaluate("window.__ls.L.x.n")
    pg.evaluate("window.__aiAct=null")  # ИИ ничего не выбрал — помогает телефон
    pg.click(f'.ls .hgopt:not([data-a="{t}"])')
    wait_stage(pg, 'help')
    L = log(pg); h = [e for e in L if e['type'] == 'stage' and e.get('st') == 'help']
    check(h and h[-1]['act'] == 'repeat' and h[-1]['stage'] == 'wrong', f'ошибка → тот же предмет, повтор (телефон): {h[-1] if h else None}')
    check(not any(e['type'] == 'praise' for e in L), 'после ошибки похвалы нет')
    wait_stage(pg, 'wait')
    pg.click(f'.ls .hgopt[data-a="{t}"]')
    pg.wait_for_function("window.__ls.L.log.some(e=>e.type==='praise')", timeout=8000)
    check(True, 'верная карточка → похвала')
    # задание 2: молчим — ИИ выбирает «образец», потом правила телефона, в конце «дальше» без похвалы
    pg.evaluate("window.__aiAct='model'")
    pg.wait_for_function("window.__ls.L.log.filter(e=>e.type==='stage'&&e.st==='show').length>=2", timeout=15000)
    n0 = len(log(pg))
    pg.wait_for_function(f"window.__ls.L.log.slice({n0}).some(e=>e.type==='stage'&&e.st==='help')", timeout=15000)
    L = log(pg)[n0:]; h = [e for e in L if e['type'] == 'stage' and e.get('st') == 'help']
    check(h[0]['act'] == 'model' and any(e['type'] == 'ai_action' for e in L), f'молчит → помощь, выбранная ИИ (model): {h[0]}')
    ev = [e for e in pg.evaluate("window.__aiLog") if e['type'] == 'lesson']
    check(ev and 'model' in ev[0]['allowed'] and ev[0]['stage'] == 'ask', f'ИИ спрошен заранее со списком разрешённых действий: {ev[0] if ev else None}')
    pg.wait_for_function(f"window.__ls.L.log.slice({n0}).some(e=>e.type==='stage'&&e.st==='continue')", timeout=40000)
    L = log(pg)[n0:]
    check(not any(e['type'] == 'praise' for e in L), 'нет ответа → помогает, но не хвалит')
    check(any(e['type'] == 'stage' and e.get('act') == 'next' for e in L), f'после трёх помощей — дальше: {[e.get("act") for e in L if e.get("st")=="help"]}')

    # ---- упражнение 2: голос (микрофон подменён событиями)
    pg.wait_for_function("window.__ls.L.x&&window.__ls.L.x.kind==='voice'&&window.__ls.L.stage==='wait'", timeout=20000)
    pg.evaluate("window.__ls.L.vT=1;window.__ls.lsEmit('voice_start')"); pg.wait_for_timeout(200)
    pg.evaluate("window.__ls.L.vT=0;window.__ls.lsEmit('voice',{ms:800})")
    pg.wait_for_function("window.__ls.L.log.filter(e=>e.type==='praise').length>=2", timeout=8000)
    check(True, 'голос: попытка замечена → похвала')
    pg.wait_for_function("window.__ls.L.x.kind==='voice'&&window.__ls.L.stage==='wait'&&window.__ls.L.log.filter(e=>e.type==='stage'&&e.st==='show').length>=4", timeout=20000)
    n1 = len(log(pg))
    FACE = '[' + ','.join('{x:.5,y:.5}' for _ in range(478)) + ']'
    pg.evaluate(f"window.__mirrSim={{b:{{}},f:{FACE},h:[],p:null}}")  # камера «видит» лицо без жеста
    pg.click('.ls .lsnext')
    pg.wait_for_function(f"window.__ls.L.log.slice({n1}).some(e=>e.type==='stage'&&e.st==='continue')", timeout=8000)
    check(not any(e['type'] == 'praise' for e in log(pg)[n1:]), 'мама нажала «Дальше» → без похвалы')

    # ---- упражнение 3: жест камерой (кадр подменён: улыбка или палец у носа)
    pg.wait_for_function("window.__ls.L.x&&window.__ls.L.x.kind==='gest'&&window.__ls.L.stage==='wait'", timeout=20000)
    k = pg.evaluate("window.__ls.L.x.n")
    check(pg.evaluate("window.__ls.L.gest.cam"), 'камера включилась')
    pg.evaluate(f"window.__mirrSim={{b:{{mouthSmileLeft:.9,mouthSmileRight:.9}},f:{FACE},h:[{{x:.5,y:.5}}],p:null}}")
    pg.wait_for_function("window.__ls.L.log.filter(e=>e.type==='praise').length>=3", timeout=8000)
    check(any(e['type'] == 'camera' for e in log(pg)), f'жест «{k}» увидела камера → похвала')
    pg.evaluate("delete window.__mirrSim")
    pg.wait_for_function("window.__ls.L.log.filter(e=>e.type==='stage'&&e.st==='show').length>=6&&window.__ls.L.stage==='wait'", timeout=20000)
    pg.click('.ls .lsmom')
    pg.wait_for_selector('#finish:not([hidden])', timeout=20000)
    L = log(pg)
    check(praise_ok(L), 'каждая похвала — сразу после события (нажатие, голос, камера, мама)')
    rep = pg.inner_text('#sh-sum')
    print('   отчёт:', rep.replace('\n', ' | '))
    check('ИИ ответил' in rep and 'Получилось' in rep and 'жест камерой — 1' in rep, 'отчёт маме на экране «Молодец!»')
    items = pg.evaluate(f"{R}.S.log.filter(x=>x.ls).length")
    check(items == 6, f'в журнал занятий записано 6 заданий ({items})')
    # «ИИ молчит»: сервер прислал запасной ответ
    pg.evaluate(f"(()=>{{window.__aiNote='no_key';document.querySelector('#btn-home').click();document.querySelector('#btn-ls').click()}})()")
    pg.wait_for_function("window.__ls.L&&window.__ls.L.stage==='wait'", timeout=20000)
    pg.wait_for_timeout(300)
    check(pg.is_visible('#shai') and 'нет ключа' in pg.inner_text('#shai'), 'значок «ИИ молчит: нет ключа»')
    # голос занятия скачивается заранее (сервис голоса подменён)
    pg.evaluate(f"(()=>{{window.__ttsN=0;window.__shTtsSim=async t=>{{window.__ttsN++;return new Blob([new Uint8Array(400)],{{type:'audio/mpeg'}})}};{R}.S.lsPre=true;document.querySelector('#btn-home').click();document.querySelector('#btn-ls').click()}})()")
    pg.wait_for_function("window.__ls.L&&window.__ls.L.stage==='wait'", timeout=30000)
    v = pg.evaluate("window.__ls.L.log.find(e=>e.type==='voice'&&e.kind)")
    check(v and v['kind'] == 'tts' and pg.evaluate("window.__ttsN") >= v['phrases'], f'голос всех фраз скачан до начала: {v}, запросов {pg.evaluate("window.__ttsN")}')
    pg.evaluate("delete window.__shTtsSim")
    pg.evaluate("document.querySelector('#btn-home').click()")
    pg.wait_for_timeout(300)
    check(pg.evaluate("window.__ls.L===null||window.__ls.L===undefined"), 'домой — занятие остановлено')
    # отчёт в «Для взрослых»
    pg.evaluate("__ev('renderParent')()")
    check('Пятиминутка' in pg.inner_text('#sh-rep'), 'отчёт виден в «Для взрослых»')
    n = pg.evaluate("window.__ls.lsPhrases().length")
    check(0 < n <= 100, f'фраз для озвучки: {n} (не больше сотни)')
    b.close()

check(not errors, f'ошибок консоли нет {errors[:3]}')
print('ИТОГ:', 'всё прошло' if not fails else f'не прошло {len(fails)}')
sys.exit(1 if fails else 0)
