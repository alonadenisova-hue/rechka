"""Автопроверка «Речки» v21 (Python Playwright).
Запуск: python3 tools/test.py [nomic|mic]
  nomic — без микрофона и камеры (как пробная версия внутри Claude);
  mic   — с поддельными микрофоном и камерой Chromium (звуковой сигнал «бип» вместо голоса).
Нужен локальный сервер: cd test && python3 -m http.server 8765
"""
import sys, json, time
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8765/index.html'
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
    check(pg.is_visible('.tile[data-game="make"]'), 'плитка «Сделай как скажу»')
    micx = pg.evaluate(R + '.MICX')
    vis = pg.is_visible('.tile[data-game="voice"]')
    if MODE == 'nomic':
        check(micx is False and not vis, f'без микрофона «Скажи — и будет!» скрыта (MICX={micx})')
    else:
        check(vis, 'с микрофоном «Скажи — и будет!» видна')

    # ---- все игры: каждая стартует на каждом уровне без ошибок
    games = pg.evaluate(R + '.ROUNDS && Object.keys(' + R + '.ROUNDS)')
    skip = {'voice'} if MODE == 'nomic' else set()
    for g in games:
        if g in skip: continue
        maxl = pg.evaluate(f"({{}}).constructor.keys({R}.S.lvl).includes('{g}')?null:null")
        n_err = len(errors)
        for lv in range(1, 7):
            ok = pg.evaluate(f"(()=>{{const S={R}.S;if(!S.lvl['{g}'])return false;S.lvl['{g}']={lv};return true}})()")
            pg.evaluate(f"document.querySelector('#btn-home').click()")
            pg.evaluate(f"(()=>{{const t=document.querySelector('.tile[data-game=\"{g}\"]');if(t&&!t.hidden){{t.hidden=false}}}})()")
            pg.evaluate(f"(()=>{{const S={R}.S;S.lvl['{g}']={lv};}})()")
            pg.evaluate(f"(()=>{{const t=document.querySelector('.tile[data-game=\"{g}\"]');t.click()}})()")
            pg.wait_for_timeout(900 if g not in ('make','voice','syl') else 1400)
        check(len(errors) == n_err, f'игра {g}: все уровни стартуют' + ('' if len(errors) == n_err else ' — ' + '; '.join(errors[n_err:])[:300]))
    pg.evaluate("document.querySelector('#btn-home').click()")

    # ---- «Сделай как скажу»: решаем перетаскиванием, на всех уровнях
    def drag_correct(lv, wrong_first=False):
        pg.evaluate(f"{R}.S.lvl.make={lv}")
        pg.evaluate("document.querySelector('#btn-home').click()")
        pg.click('.tile[data-game="make"]')
        pg.wait_for_selector('.put.mk .obj', timeout=8000)
        pg.wait_for_timeout(400)
        info = pg.evaluate(f"""(()=>{{const G={R}.G;return {{prompt:G.round.prompt}}}})()""")
        return info
    for lv in range(1, 7):
        info = drag_correct(lv)
        # найти правильный предмет и зону через состояние сцены: пробуем все предметы во все зоны по очереди
        # (проверяем, что хотя бы одно перетаскивание засчитано как верное)
        st = pg.evaluate(f"{R}.G.i")
        objs = pg.query_selector_all('.put.mk .obj')
        box = pg.query_selector('.put.mk').bounding_box()
        furs = pg.query_selector_all('.put.mk .fur')
        targets = []
        for f in furs:
            fb = f.bounding_box()
            targets += [(fb['x'] + fb['width'] / 2, fb['y'] + fb['height'] * .12),
                        (fb['x'] + fb['width'] / 2, fb['y'] + fb['height'] * .55),
                        (fb['x'] + fb['width'] / 2, fb['y'] + fb['height'] * .92),
                        (fb['x'] + fb['width'] / 2, fb['y'] - fb['height'] * .2)]
        done = False
        for oi in range(len(objs)):
            for (tx, ty) in targets:
                o = pg.query_selector_all('.put.mk .obj')[oi]
                if 'placed' in (o.get_attribute('class') or ''): continue
                ob = o.bounding_box()
                pg.mouse.move(ob['x'] + ob['width'] / 2, ob['y'] + ob['height'] / 2)
                pg.mouse.down(); pg.mouse.move(tx, ty, steps=6); pg.mouse.up()
                pg.wait_for_timeout(250)
                if pg.evaluate(f"{R}.G&&{R}.G.i") != st:
                    done = True; break
                if pg.query_selector('.put.mk .obj.placed'):
                    # верно положили — ждём завершения раунда
                    pg.wait_for_timeout(1500)
                    if pg.evaluate(f"{R}.G&&{R}.G.i") != st:
                        done = True; break
                    # неверно: ждём, пока предмет вернётся
                    pg.wait_for_timeout(2200)
            if done: break
        check(done, f'«Сделай как скажу» ур. {lv}: «{info["prompt"]}» решается перетаскиванием')
    last = pg.evaluate(f"{R}.S.log.filter(x=>x.g==='make').slice(-3)")
    check(len(last) > 0 and all('c' in x and 'o' in x for x in last), 'статистика «Сделай как скажу» пишется')
    pg.evaluate("document.querySelector('#btn-home').click()")

    # ---- грамматика инструкций
    phr = pg.evaluate(f"""(()=>{{const out=[];const G0={R}.G;return out}})()""")

    # ---- доска «Хочу»
    pg.click('#btn-wb'); pg.wait_for_timeout(1800)
    check(pg.is_visible('#wbscr') and len(pg.query_selector_all('.wbcard')) == 6, 'доска «Хочу»: 6 карточек')
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
            pg.evaluate(f"(()=>{{const b=document.querySelectorAll('#stage .opt')[{k}];b&&b.click()}})()")
            pg.wait_for_timeout(250)
        pg.wait_for_timeout(400)
    check(pg.is_visible('#finish'), 'занятие закончилось экраном «Молодец»' + ('' if pg.is_visible('#finish') else ' ' + str(pg.evaluate(f"JSON.stringify({{G:{R}.G&&{{i:{R}.G.i,max:{R}.G.max,game:{R}.G.game}},scr:[...document.querySelectorAll('.screen')].filter(x=>!x.hidden).map(x=>x.id),p:document.querySelector('#prompt').textContent}})"))))
    pg.click('#btn-finish-home'); pg.wait_for_timeout(800)
    check(pg.is_visible('#tip'), 'после занятия показан экран «Сегодня дома»')
    pg.click('#tip-close'); pg.wait_for_timeout(300)
    check(pg.is_visible('#tip'), 'короткое нажатие не закрывает (только взрослый)')
    bb = pg.query_selector('#tip-done').bounding_box()
    pg.mouse.move(bb['x'] + 20, bb['y'] + 10); pg.mouse.down(); pg.wait_for_timeout(1400); pg.mouse.up()
    pg.wait_for_timeout(300)
    check(not pg.is_visible('#tip') and pg.evaluate(f"{R}.S.tipLog.slice(-1)[0].done") is True, 'долгое нажатие «Сделали» закрывает и отмечает')

    # ---- раздел для взрослых и статистика
    pg.evaluate("document.querySelector('#gear').dispatchEvent(new PointerEvent('pointerdown'))"); pg.wait_for_timeout(1900)
    check(pg.is_visible('#parent'), 'раздел для взрослых открывается')
    html = pg.inner_html('#stats')
    check('Сделай как скажу' in html and 'Хочу' in html and 'Сегодня дома' in html, 'новое есть в статистике за 7 дней')
    check(len(pg.query_selector_all('#wb-list .wbrow')) == 8, 'редактор карточек «Хочу»: 8 карточек')
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
        # голосовая игра: поддельный микрофон даёт «бип» — сцена должна сработать
        pg.evaluate(f"{R}.S.vthr=0.004;{R}.S.lvl.voice=1")
        pg.click('.tile[data-game="voice"]')
        ok = False
        for _ in range(60):
            pg.wait_for_timeout(500)
            if pg.evaluate(f"{R}.S.log.some(x=>x.g==='voice'&&x.hits>0)"):
                ok = True; break
        check(ok, '«Скажи — и будет!»: голос (бип) вызывает реакцию и засчитывается')
        pg.evaluate("document.querySelector('#btn-home').click()")
        # слоги уровень 5
        pg.evaluate(f"{R}.S.lvl.syl=5")
        pg.click('.tile[data-game="syl"]')
        ok = False
        for _ in range(60):
            pg.wait_for_timeout(500)
            if pg.evaluate(f"{R}.S.log.some(x=>x.g==='syl'&&x.m==='сам')"):
                ok = True; break
        last = pg.evaluate(f"{R}.S.log.filter(x=>x.g==='syl'&&x.m==='сам').slice(-1)[0]")
        check(ok, f'«Слоги» ур. 5: барабан слушает микрофон ({last})')
        recs = pg.evaluate(f"{R}.MDB.keys('lev').then(k=>k.length)")
        check(recs > 0, f'попытка сохранена в «Записи ребёнка» ({recs})')
        pg.evaluate("document.querySelector('#btn-home').click()")
    else:
        # без микрофона: уровень 5 «Слогов» работает как 4 (барабан пальцем)
        pg.click('#btn-parent-close'); pg.wait_for_timeout(300)
        pg.evaluate(f"{R}.S.lvl.syl=5")
        pg.click('.tile[data-game="syl"]'); pg.wait_for_timeout(1500)
        check(pg.query_selector('.syl.self') is None and pg.query_selector('.syl .drum') is not None, 'без микрофона «Слоги» ур. 5 = барабан пальцем')
        pg.evaluate("document.querySelector('#btn-home').click()")
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

    check(not errors, 'ошибок в консоли нет' + ('' if not errors else ': ' + ' | '.join(errors[:5])[:600]))
    b.close()
print('\nИТОГ:', 'всё прошло' if not fails else f'{len(fails)} проблем(ы)')
sys.exit(1 if fails else 0)
