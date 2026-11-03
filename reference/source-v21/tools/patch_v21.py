import sys
src='/home/claude/rechka/src/'
s=open(src+'body.html').read()
def rep(a,b,c=1):
    global s
    n=s.count(a)
    assert n==c,(a[:120],n)
    s=s.replace(a,b)
def cut(start,end,new,keep_end=True):
    global s
    i=s.index(start);j=s.index(end,i)
    s=s[:i]+new+(s[j:] if keep_end else s[j+len(end):])

# ---------- CSS
s=s.replace('</style>\n\n<div id="home"', open(src+'v21.css').read()+'</style>\n\n<div id="home"',1)
assert 'v21 =====' in s

# ---------- HTML: home
rep('''    <button class="bigtile pz" id="btn-album">''','''    <button class="bigtile wb" id="btn-wb"><svg viewBox="0 0 100 100"><path d="M14 18h72a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H44L24 92V74H14a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z" fill="#fff" stroke="#e05a8f" stroke-width="5"/><path d="M50 62s-16-9-16-20a8 8 0 0 1 16-3 8 8 0 0 1 16 3c0 11-16 20-16 20z" fill="#ff6b8f"/></svg><span><b>Хочу</b></span></button>
    <button class="bigtile pz" id="btn-album">''')
rep('''    <button class="tile t30" data-game="rh">''','''    <button class="tile t33" data-game="voice" data-say="Скажи — и будет!"><span class="lvl" data-lvl="voice"></span><div class="art" id="art-voice"></div><b>Скажи — и будет!</b><span class="newb">новое</span></button>
    <button class="tile t34" data-game="make"><span class="lvl" data-lvl="make"></span><div class="art" id="art-make"></div><b>Сделай как скажу</b><span class="newb">новое</span></button>
    <button class="tile t30" data-game="rh">''')
# ---------- HTML: «Скажи!» overlay with video + mirror
rep('''<div id="sayit" hidden>
  <div class="pic" id="sayit-pic"></div>''','''<div id="sayit" hidden>
  <div class="vrow"><div class="pic" id="sayit-pic"></div><div id="sayit-mirror" hidden><video playsinline muted></video></div></div>''')
# ---------- HTML: Хочу screen, video recorder, tip overlay (before parent screen)
rep('''<div id="parent" class="screen" hidden>''','''<div id="wbscr" class="screen" hidden>
  <div class="bar">
    <button class="round-btn" id="wb-home" aria-label="Домой"><svg viewBox="0 0 24 24"><path fill="#ff6b5b" d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg></button>
    <div class="prompt">Хочу</div>
    <span style="width:58px;flex:none"></span>
  </div>
  <div class="wb-grid" id="wb-grid"></div>
</div>

<div id="vrec" hidden>
  <div class="vph"></div>
  <div class="vbox"><video playsinline muted></video><div class="mouth"></div><div class="cnt"></div></div>
  <div class="msg"></div>
  <div class="row"><button class="big-btn" id="vrec-stop" hidden>Готово</button><button class="small-btn" id="vrec-save" hidden>Сохранить</button><button class="small-btn" id="vrec-again" hidden>Переснять</button><button class="small-btn" id="vrec-close">Закрыть</button></div>
</div>

<div id="tip" hidden><div class="card">
  <h2>Сегодня дома</h2>
  <p class="note">Для взрослого: одно задание на сегодня, по ошибкам этого занятия.</p>
  <div id="tip-text"></div>
  <div class="row"><button class="big-btn holdbtn" id="tip-done">Сделали ✓</button><button class="small-btn holdbtn" id="tip-close">Закрыть</button></div>
  <p class="note">Чтобы нажать, подержите кнопку секунду.</p>
</div></div>

<div id="parent" class="screen" hidden>''')
# ---------- HTML: parent settings
rep('''    <div class="row" hidden><label for="set-sayit">«Скажи!» после верного ответа: запись и повтор голоса ребёнка</label><select id="set-sayit"><option value="often">часто (каждый 2-й)</option><option value="some">иногда (каждый 4-й)</option><option value="off">не просить</option></select></div>
''','''    <div class="row"><label for="set-tip">После занятия — подсказка маме «Сегодня дома»</label><input type="checkbox" id="set-tip"></div>
''')
rep('''  <details class="panel" id="pn-lev" hidden>
    <summary>Записи ребёнка («Скажи!»)</summary>
    <p class="note">Последние попытки сказать фразу — их можно послушать вместе с логопедом. Хранятся 60 последних.</p>''','''  <details class="panel" id="pn-lev">
    <summary>Записи ребёнка</summary>
    <p class="note">Попытки ребёнка: «Слоги» на уровне 5 (с пометкой, сколько слогов насчитал барабан), а также «Скажи!» и «Хочу», если запись включена. Их можно послушать вместе с логопедом. Хранятся 60 последних.</p>''')
rep('''  <div class="panel">
    <h3>Пазл</h3>''','''  <details class="panel" id="pn-v21">
    <summary>Голосовые игры</summary>
    <p class="note">Микрофон нужен только для громкости: приложение не распознаёт слова и не оценивает произношение. Есть звук — что-то происходит на экране.</p>
    <div class="row"><label for="set-voicegame">Игра «Скажи — и будет!» на главном экране</label><input type="checkbox" id="set-voicegame"></div>
    <div class="row"><label for="set-sylmic">«Слоги», уровень 5 «Скажи сам»: барабан бьёт на каждый слог ребёнка</label><input type="checkbox" id="set-sylmic"></div>
    <div class="row"><label for="set-vthr">Порог громкости</label><input type="range" id="set-vthr" min="0.005" max="0.15" step="0.005"><output id="vthr-out"></output></div>
    <div class="row"><button class="small-btn" id="vthr-test">Слушать</button><div class="vthr"><i id="vthr-bar"></i><i id="vthr-line"></i></div><span class="pill" id="vthr-hit"></span></div>
    <p class="note">Как подобрать порог: нажмите «Слушать» и помолчите — серая полоска (шум комнаты) должна оставаться левее красной черты. Скажите «а-а» обычным голосом — полоска заходит за черту и становится зелёной. Срабатывает от шума — сдвиньте порог вправо, не слышит ребёнка — влево.</p>
    <p class="note" id="v21-mic"></p>
  </details>
  <details class="panel" id="pn-vid">
    <summary>Видео для «Скажи!»</summary>
    <p class="note">Запишите на фронтальную камеру, как вы говорите слово или фразу: 2–5 секунд, рот крупно. После верного ответа ребёнок сначала увидит ваше видео со звуком, потом будет пауза, чтобы повторить. Если видео нет, всё как раньше. Видео хранятся только на этом телефоне.</p>
    <div class="row"><label for="set-vidfreq">Показывать видео после верного ответа</label><select id="set-vidfreq"><option value="always">каждый раз, когда есть видео</option><option value="some">через раз</option><option value="off">не показывать</option></select></div>
    <div class="row"><label for="set-mirror">Зеркало: во время паузы ребёнок видит своё лицо рядом с вашим (не записывается)</label><input type="checkbox" id="set-mirror"></div>
    <div class="row"><label for="set-sayrec">Записывать, как ребёнок повторяет (4 секунды, в «Записи ребёнка»)</label><input type="checkbox" id="set-sayrec"></div>
    <div class="row"><label for="set-sayit">«Скажи!» без видео (только когда запись включена)</label><select id="set-sayit"><option value="often">часто (каждый 2-й)</option><option value="some">иногда (каждый 4-й)</option><option value="off">не просить</option></select></div>
    <div class="row"><button class="small-btn" data-vidtab="need">Самые нужные</button><button class="small-btn" data-vidtab="ph">Фразы</button><button class="small-btn" data-vidtab="w">Слова</button><button class="small-btn" data-vidtab="mine">Записанные</button><span class="pill" id="vid-size"></span></div>
    <div id="vid-list"></div>
    <div class="row"><input type="text" id="vid-own-t" placeholder="Своя фраза" maxlength="40" style="flex:1;min-width:0;font:inherit;padding:8px;border-radius:10px;border:2px solid var(--line)"><button class="small-btn" id="vid-own">🎥 Записать</button></div>
  </details>
  <details class="panel" id="pn-wb">
    <summary>Доска «Хочу»</summary>
    <p class="note">Кнопка «Хочу» на главном экране — не игра: в ней нет заданий и оценок. Ребёнок нажимает карточку, телефон говорит просьбу, взрослый её выполняет. В статистике видно, что ребёнок просил сам.</p>
    <div class="row"><label for="set-wbon">Кнопка «Хочу» на главном экране</label><input type="checkbox" id="set-wbon"></div>
    <div class="row"><label for="set-wbask">Через секунду мягко предлагать: «Скажи: дай сок!»</label><input type="checkbox" id="set-wbask"></div>
    <div class="row"><label for="set-wbn">Карточек на экране</label><select id="set-wbn"><option value="4">4</option><option value="6">6</option><option value="8">8</option></select></div>
    <div id="wb-list"></div>
    <div class="row"><button class="small-btn" id="wb-add">+ Добавить карточку</button></div>
    <p class="note" id="wb-note"></p>
  </details>
  <div class="panel">
    <h3>Пазл</h3>''')
rep('''<script src="data10.js" onerror="void 0"></script>''','''<script src="data10.js" onerror="void 0"></script>
<script src="data11.js" onerror="void 0"></script>''')

# ---------- JS: storage + defaults
rep("const r=indexedDB.open('rechka-media',1);","const r=indexedDB.open('rechka-media',2);")
rep("['rec','photo','lev'].forEach(n=>","['rec','photo','lev','vid','wb'].forEach(n=>")
rep("const defaults={voice:true,","const defaults={voiceGame:true,sylMic:true,vthr:.03,vidFreq:'always',mirror:false,sayRec:false,wbOn:true,wbAsk:true,tipOn:true,voice:true,")
rep("seq:1,want:1},streak:{","seq:1,want:1,voice:1,make:1},streak:{")
rep("seq:0,want:0},errs:{","seq:0,want:0,voice:0,make:0},errs:{")
rep("seq:0,want:0},log:[]","seq:0,want:0,voice:0,make:0},log:[]")
rep("if((S.ver||0)<18){","if((S.ver||0)<21){S.sayit=S.sayit||'some';S.ver=Math.max(S.ver||0,21)}\nif((S.ver||0)<18){")
rep("const MAXL={odd:4,","const MAXL={voice:3,make:6,odd:4,")
rep("snd:3,syl:4,","snd:3,syl:5,")
rep("const FIX7={rh:3,","const FIX7={voice:5,rh:3,")

# ---------- JS: remove old «Скажи!» (replaced in v21 block)
cut("let sayCount=0;\nfunction wantSayIt(){","/* «Что делает лиса?»","let sayCount=0;\n")

# ---------- JS: session start time, finish → tip, home
rep("function startGame(game){ac();G={game,","function startGame(game){ac();VM.stop();G={t0:Date.now(),game,")
rep("ac();G={game:plan[0],i:0,","ac();G={t0:Date.now(),game:plan[0],i:0,")
rep("function finish(){show('finish');","function finish(){VM.stop();if(S.tipOn)TIP=chooseTip();show('finish');")
rep("""  show('home');
}
function balloonSvg""","""  $('#art-voice').innerHTML=VG_BIRD;$('#art-make').innerHTML=makeArt();VM.stop();applyV21Home();
  show('home');if(TIP)setTimeout(showTip,300);
}
function balloonSvg""")
rep("$('#btn-home').onclick=()=>{stopVoice();","$('#btn-home').onclick=()=>{stopVoice();VM.stop();")
rep("await Promise.race([say(t.querySelector('b').textContent.replace('?','').replace(' — ',' или ')),wait(2000)]);","await Promise.race([say(t.dataset.say||t.querySelector('b').textContent.replace('?','').replace(' — ',' или ')),wait(2000)]);")

# ---------- JS: «Слоги» level 5
rep("""  /* v12: слово и слоги произносит взрослый, приложение только просит стучать */
  G.round.replay=()=>say('Стучи!');
  await say('Стучи!');
  await new Promise(res=>{""","""  /* v21: уровень 5 «Скажи сам» — барабан слушает микрофон (только громкость) */
  if(lvl===5&&S.sylMic&&MICX!==false){G.round.replay=()=>vsay('Скажи сам!');const r=await sylSelf(w,st,R);if(R.dead)return;
    if(r){sfx.good();confetti(70);R.good=pick(PRAISE);await say(R.good);if(R.dead)return;return roundDone(true,{n:w.s.length,w:w.w,m:'сам',k1:r[0],k2:r[1]})}
    st.querySelector('.syl').classList.remove('self')}
  /* v12: слово и слоги произносит взрослый, приложение только просит стучать */
  G.round.replay=()=>say('Стучи!');
  await say('Стучи!');
  await new Promise(res=>{""")
rep("  if(lvl>=4&&S.sayit!=='off'||wantSayIt())await sayIt(word,img(w.i));\n  return roundDone(true,{n:w.s.length,w:w.w});",
    "  if(wantSayIt())await sayIt(word,img(w.i));\n  return roundDone(true,{n:w.s.length,w:w.w});")

# ---------- JS: registry
rep("const ROUNDS={rh:rhRound,","const ROUNDS={voice:voiceRound,make:makeRound,rh:rhRound,")
rep("const GN={rh:'Час пик',","const GN={voice:'Скажи — и будет!',make:'Сделай как скажу',rh:'Час пик',")
rep("const LVLDESC={\n","""const LVLDESC={
  voice:['любой звук — шарик надувается, животное отвечает, машина едет, свечка гаснет, попугай повторяет','звук дольше полсекунды («у-у-у», «р-р-р»)','два звука подряд с паузой («ав-ав», «би-би»)'],
  make:['«Положи мяч в коробку» — 2 предмета, одно место','предмет + место из двух: «Положи кубик на стол»','цвет: «Положи красный мяч в коробку» — мячи разного цвета','размер и цвет: «Положи маленький красный мяч в коробку»','две коробки: «Положи синий кубик в большую коробку»','ПОД: «Положи мяч под стол» (стол и стул, под и на)'],
""")
rep("syl:['1–2 слога: мяч, ли-са','2 слога','3 слога: со-ба-ка','всё вперемешку + «Скажи!» после каждого слова'],",
    "syl:['1–2 слога: мяч, ли-са','2 слога','3 слога: со-ба-ка','всё вперемешку','«Скажи сам»: ребёнок говорит слово, барабан бьёт на каждый слог (нужен микрофон; без него — как уровень 4)'],")
rep("const MIXG=['verb',","const MIXG=['make','verb',")

# ---------- JS: parent
rep("renderVoice();renderPhotos();renderLev();","renderVoice();renderPhotos();renderLev();renderV21Parent();")
rep("  const conf={};L.filter(x=>(x.g==='verb'||x.g==='pair')&&x.picks)","  h+=v21Stats(L);\n  const conf={};L.filter(x=>(x.g==='verb'||x.g==='pair')&&x.picks)")

# ---------- JS: insert v21 block before parent area
rep("/* ---------- parent area */\nconst GN=", open(src+'v21.js').read()+"\n/* ---------- parent area */\nconst GN=")
# ---------- init
rep("loadPhotos();\nrenderHome();\nwindow.__rechka={","wbInit();v21Wire();vidLoad();wbLoad();micProbe().then(applyV21Home);\nloadPhotos();\nrenderHome();\nwindow.__rechka={VM,VMC,chooseTip,mkTask,get TIP(){return TIP},showTip,openWB,recordVideo,get VIDK(){return VIDK},sayIt,segDetector,peakDetector,get MICX(){return MICX},")
open(src+'body.html.v21','w').write(s)
print('ok',len(s))
