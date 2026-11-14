/* «Речка»: «Пятиминутка с Шариком» (версия 47, задача 11 в docs/ai-sharik/ROADMAP.md).
   Одно короткое занятие (около 5 минут) из трёх упражнений с героем-котом: выбор картинки («Что делает Шарик?»),
   попытка голоса («Позови Шарика», «Скажи как Шарик») и жест через камеру («Где твой нос?», «Улыбнись»).
   Ведёт телефон, без ожидания сервера. Каждое задание проходит этапы: показать → объяснить → ждать → заметить попытку →
   помочь → продолжить. Всё состояние — в одном объекте G.ls, всё, что случилось, — в одном журнале G.ls.log.
   Правило: хвалим ТОЛЬКО за событие — нажатие, голос, жест с камеры или кнопку мамы «Получилось». Нет события — герой
   помогает (повторяет, ждёт, показывает сам, убирает лишнюю картинку), но не хвалит.
   ИИ (если включён сервер) заранее, пока Лев думает, получает список разрешённых действий и выбирает одно (next.action);
   телефон проверяет его и выполняет. Не успел или ответил не по правилам — помощь по правилам телефона.
   Голос: перед началом скачиваются все фразы занятия (их меньше сотни) — герой говорит одним голосом всё занятие.
   Если Лев подал голос, пока герой говорит, — герой замолкает и слушает. Речь не оценивается: только громкость.
   Выключатели — «Для взрослых» → «Шарик» → «Пятиминутка». Без микрофона и камеры всё работает через кнопку мамы. */
const LS_CSS=`
#btn-ls{width:100%;background:linear-gradient(135deg,#fff1d6,#ffe3ec);box-shadow:0 6px 0 #f0c9b8}
#game.lesson #dots{display:flex}
.ls{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;height:100%}
.ls .lscat{flex:1;min-height:130px;width:100%;position:relative;transition:transform .7s cubic-bezier(.3,1.4,.5,1)}
.ls .lscat.far{transform:scale(.4) translateY(-40%)}
.ls .lsrow{flex:none;display:flex;gap:12px;justify-content:center;align-items:center;width:100%;min-height:0}
.ls .hgopt{flex:1;max-width:170px;aspect-ratio:1;border:0;border-radius:24px;background:#fff;box-shadow:0 6px 0 var(--line);padding:0;position:relative;overflow:hidden;transition:opacity .3s,transform .3s}
.ls .hgopt.good{box-shadow:0 0 0 6px var(--leaf),0 6px 0 var(--line)}
.ls .hgopt.hint{box-shadow:0 0 0 6px var(--sun),0 6px 0 var(--line)}
.ls .hgopt.gone{opacity:0;transform:scale(.6);pointer-events:none}
.ls .hgopt.bad{animation:hgshake .4s}
.ls .lsbar{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;flex-wrap:wrap}
.ls .lsbar .big-btn{min-height:52px;padding:0 18px;font-size:18px}
.ls .lsbar .lsnext{background:#eef0f6;box-shadow:0 4px 0 var(--line)}
.ls .shear{display:flex;align-items:center;gap:8px;height:36px;opacity:.25;transition:opacity .3s}
.ls .shear.on{opacity:1}.ls .shear svg{width:28px;height:28px}
.ls .shear .lv{width:80px;height:10px;border-radius:5px;background:#e7e3f7;overflow:hidden}
.ls .shear .lv i{display:block;height:100%;width:0;background:#7b61ff;transition:width .08s}.ls .shear .lv i.on{background:#3cbf7a}
.ls .lsprep{margin:auto;text-align:center;font-size:20px;line-height:1.4;display:flex;flex-direction:column;gap:14px;align-items:center}
#shai{position:absolute;right:10px;top:64px;z-index:5;background:#fff3cd;color:#7a5a00;border-radius:12px;padding:3px 10px;font-size:13px;box-shadow:0 2px 0 #e9d48a;pointer-events:none}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+LS_CSS+'</style>');
function lsOn(){return !!S.shOn&&S.lsOn!==false&&!!window.Cat2D} /* нужен включённый Шарик; сервер — не обязательно */
const LS_ACTS=[['sleep','спит'],['eat','ест'],['jump','прыгает']];
const LS_SAYW=['Мяу!','Ам!'];
const LS_GEST=['нос','улыбка','глаз'];
const LS_GOOD=['Молодец!','Умница!','Ура!'];
/* все фразы занятия — по этому списку заранее скачивается голос (shTtsGet) */
const LS_T={
  hello:()=>`Привет, ${S.name||'Лев'}!`,start:'Поиграем со мной?',next:'А теперь другая игра!',bye:'Мы поиграли! Пока-пока!',
  wait:'Я жду.',skip:'Ничего! Давай дальше.',look:'Посмотри ещё.',
  doWho:'Что делает Шарик?',doQ:(a,b)=>`Шарик ${a} или ${b}?`,doThis:a=>`Тут Шарик ${a}.`,doModel:a=>`Смотри: Шарик ${a}.`,doWhere:a=>`Где Шарик ${a}?`,doGood:a=>`Да! Шарик ${a}.`,doEasy:a=>`Вот где Шарик ${a}!`,
  heardTap:'Я слышу! Покажи пальчиком.',
  callQ:'Шарик спит. Позови его: Шарик!',callRep:'Позови громко: Шарик!',callModel:'Слушай: Шарик! Шарик!',callEasy:'Можно просто постучать по мне.',callGood:'Мяу! Я тут! Ты меня позвал!',
  sayQ:w=>`${w} Теперь ты!`,sayRep:w=>`Скажи: ${w.toLowerCase()}`,sayModel:w=>`Смотри на мой рот. ${w}`,sayEasy:'Скажи что-нибудь! Любой звук!',sayGood:w=>`Ух ты! ${w} Я тебя слышу!`,
  gQ:k=>MIRR_EX[k].say,gRep:k=>MIRR_EX[k].p,gModel:k=>k==='улыбка'?'Смотри, как я улыбаюсь!':`Смотри, вот мой ${k}!`,gGood:k=>k==='улыбка'?'Какая улыбка!':`Да! Вот ${k}!`,
  gUnsure:'Почти! Ещё!',heardGest:'Я слышу! Покажи на себе.'};
function lsPhrases(){const T=LS_T,L=[T.hello(),T.start,T.next,T.bye,T.wait,T.skip,T.look,T.doWho,T.heardTap,T.callQ,T.callRep,T.callModel,T.callEasy,T.callGood,T.sayEasy,T.gUnsure,T.heardGest,...LS_GOOD];
  for(const [,a] of LS_ACTS){L.push(T.doThis(a),T.doModel(a),T.doWhere(a),T.doGood(a),T.doEasy(a));for(const [,b] of LS_ACTS)if(a!==b)L.push(T.doQ(a,b))}
  for(const w of LS_SAYW)L.push(T.sayQ(w),T.sayRep(w),T.sayModel(w),T.sayGood(w));
  for(const k of LS_GEST)L.push(T.gQ(k),T.gRep(k),T.gModel(k),T.gGood(k));
  return [...new Set(L.flatMap(splitParts))]}
/* ---------- журнал и события ---------- */
function lsLog(type,d){const L=G&&G.ls;if(!L)return;L.log.push(Object.assign({ms:Date.now()-L.t0,type},d||{}));if(L.log.length>600)L.log.splice(0,100)}
/* событие: записать в журнал и отдать тому, кто его ждёт */
function lsEmit(type,d){const L=G&&G.ls;if(!L)return;lsLog(type,d);const w=L.waiter,e=Object.assign({type},d||{});if(w&&w.types.includes(type)){L.waiter=null;w.res(e)}
  else if(['tap','parent','skip','camera'].includes(type))L.pend=e} /* нажали, пока герой говорил, — ответ не теряется */
function lsWaitEv(types,ms){const L=G.ls;if(L.pend&&types.includes(L.pend.type)){const e=L.pend;L.pend=null;return Promise.resolve(e)}return new Promise(res=>{const w={types,res:v=>{clearTimeout(t);res(v)}};const t=setTimeout(()=>{if(L.waiter===w){L.waiter=null;res(null)}},ms);L.waiter=w})}
function lsStage(st,d){const L=G.ls;L.stage=st;lsLog('stage',Object.assign({st},d||{}))}
/* ---------- микрофон: только громкость. Голос — событие; во время реплики героя — «перебил» ---------- */
async function lsMicStart(){const L=G.ls,mine=G;if(!shVoiceOn()||window.__shVoiceSim)return false;if(!await VM.start())return false;if(G!==mine){VM.stop();return false}
  const ear=document.querySelector('.ls .shear'),bar=ear&&ear.querySelector('.lv i');
  const det=segDetector(t=>{L.vT=t;lsEmit('voice_start')},d=>{L.vT=0;lsEmit('voice',{ms:Math.round(d)})});void ear,bar;
  VM.cb=(v,t)=>{if(G!==mine||!L.mic){VM.cb=null;return}
    const e=document.querySelector('.ls .shear .lv i');if(e){e.style.width=Math.min(100,v/vthr()*50)+'%'}
    if(L.speaking){ /* реплика героя: первые 0,6 с запоминаем, насколько громко микрофон слышит сам телефон (эхо) */
      const el=t-L.spT0;if(el<600){L.echo=Math.max(L.echo,v);return}
      if(S.lsBarge!==false&&v>Math.max(vthr()*2.5,L.echo*1.8)){if(!L.bA)L.bA=t;if(t-L.bA>300){L.bA=0;lsBarge()}}else L.bA=0;return}
    if(t<L.quiet)return; /* хвост эха после реплики */
    const on=det(v,t);if(e)e.classList.toggle('on',on>=0)};
  L.mic=true;return true}
function lsBarge(){const L=G.ls;if(!L.speaking)return;L.speaking=false;L.barged=true;L.quiet=0;L.n.barge++;stopVoice();lsEmit('barge')}
/* герой говорит; o.barge — можно перебить голосом. Возвращает 'barge', если перебили */
async function lsSay(text,o={}){const L=G.ls,mine=G;if(!text)return 'ok';
  L.barged=false;L.echo=0;L.bA=0;L.spT0=performance.now();L.speaking=!!(o.barge&&L.mic);
  lsLog('say',{text});const r=shSpeak(text,L.cel,{game:true});await r;
  if(G!==mine)return 'gone';L.speaking=false;L.quiet=performance.now()+350;return L.barged?'barge':'ok'}
/* ---------- ИИ выбирает помощь: спрашиваем заранее, пока Лев думает ---------- */
function lsAllowed(x,it){const a=['repeat','more_time','model'];if(x.kind==='pick'&&it.left>1)a.push('fewer');if(x.kind!=='gest')a.push('easier');a.push('next');return a}
function lsAiAsk(x,it,stage){const L=G.ls;if(!L.ai)return null;const ev={type:'lesson',game:x.game,task:x.task,stage,attempts:it.tries+1,allowed:lsAllowed(x,it),helps:it.helps.slice()};
  const r={t0:Date.now(),j:undefined};r.p=shAsk(ev).then(j=>{r.j=j;return j});lsLog('ai_ask',{stage});return r}
/* правила телефона: ошибка → тот же предмет с подсказкой; молчит → повторить, потом образец, потом проще; после трёх помощей — дальше */
function lsRule(x,it,stage,allowed){const n=it.helps.length,has=a=>allowed.includes(a);
  if(n>=3)return 'next';
  if(stage==='wrong')return n===0?'repeat':has('fewer')?'fewer':'model';
  return n===0?'repeat':n===1?'model':has('fewer')?'fewer':has('easier')?'easier':'more_time'}
async function lsChoose(x,it,stage){const L=G.ls,mine=G,allowed=lsAllowed(x,it),req=it.ai;it.ai=null;let act=null;
  if(it.helps.length>=3){L.n.local++;return 'next'} /* предел помощи — решает телефон, не ИИ */
  if(req){if(req.j===undefined){const left=Math.min(1500,7000-(Date.now()-req.t0));if(left>0)await shWait(req.p,left);if(G!==mine)return null}
    if(req.j===undefined){const s=shStat();if(s)s.late++;lsLog('ai_late')}
    else if(req.j&&req.j.next&&allowed.includes(req.j.next.action)){act=req.j.next.action;lsLog('ai_action',{act})}
    else lsLog('ai_none',{note:req.j?req.j.note||'':'net'})}
  if(act)L.n.ai++;else{act=lsRule(x,it,stage,allowed);L.n.local++}
  if(act!=='next')it.ai=lsAiAsk(x,it,'help'); /* про следующую помощь — тоже заранее */
  return act}
/* ---------- одно задание: показать → объяснить → ждать → заметить → помочь → продолжить ---------- */
async function lsItem(x){const L=G.ls,mine=G,it={tries:0,helps:[],left:x.opts||0};L.it=it;L.x=x;const gone=()=>G!==mine;
  L.pend=null;lsStage('show',{task:x.task});await x.show(it);if(gone())return null;
  it.ai=lsAiAsk(x,it,'ask');
  lsStage('explain');let r=await x.ask(it);if(gone())return null;
  let extra=0,heard=false,stage='silence';
  for(;;){
    lsStage('wait');
    let ev=r==='barge'?{type:'barge'}:await lsWaitEv(['tap','voice_start','voice','camera','parent','skip','unsure','barge'],shWaitMs()*(x.kind==='gest'&&!x.cam?1.6:1)+extra);if(gone())return null;
    extra=0;r='ok';
    if(ev&&ev.type==='barge'){ /* герой замолчал: голос правда продолжается? Нет за 1,2 с — это было эхо, просто ждём дальше */
      x.listen&&x.listen(true);const e1=await lsWaitEv(['voice_start','voice','tap','parent','camera','skip'],1200);if(gone())return null;
      if(!e1){x.listen&&x.listen(false);lsLog('barge_echo');extra=1500;continue}ev=e1}
    if(ev&&ev.type==='voice_start'){ /* Лев начал отвечать — дослушать до конца голоса */
      lsStage('notice',{by:'voice'});x.listen&&x.listen(true);
      const e2=L.vT?await lsWaitEv(['voice','tap','parent','camera','skip'],SHV.max):null;if(gone())return null;x.listen&&x.listen(false);
      if(!e2)lsLog('voice',{ms:0,cut:1}); /* голос уже кончился или не кончился за 6 с */
      ev=e2||{type:'voice',ms:0}}
    if(ev&&ev.type==='unsure'){if(!it.uns){it.uns=1;await lsSay(LS_T.gUnsure);if(gone())return null}extra=2500;continue}
    if(ev&&ev.type==='voice'){L.n.voice++;
      if(x.kind!=='voice'){if(!heard){heard=true;r=await lsSay(x.kind==='pick'?LS_T.heardTap:LS_T.heardGest,{barge:false});if(gone())return null}extra=2000;continue}}
    if(ev&&ev.type==='skip'){L.n.next++;lsStage('continue',{how:'skip'});await lsSay(LS_T.skip);return {ok:false,how:'skip',it}}
    const okEv=ev&&(ev.type==='parent'||ev.type==='camera'||ev.type==='voice'||(ev.type==='tap'&&ev.ok));
    if(okEv){lsStage('notice',{by:ev.type});if(ev.type==='parent')L.n.mom++;if(ev.type==='camera')L.n.camera++;if(ev.type==='tap')L.n.tap++;
      it.ai=null;lsLog('praise',{by:ev.type});await x.praise(ev,it);if(gone())return null;lsStage('continue',{how:ev.type});return {ok:true,how:ev.type==='tap'?'tap':ev.type,it}}
    if(ev&&ev.type==='tap'){it.tries++;L.n.tap++;stage='wrong';await x.wrong(ev,it);if(gone())return null}
    else stage='silence';
    const act=await lsChoose(x,it,stage);if(gone()||!act)return null;
    it.helps.push(act);lsStage('help',{act,stage});
    if(act==='next'){L.n.helpNext++;await lsSay(LS_T.skip);lsStage('continue',{how:'none'});return {ok:false,how:'none',it}}
    if(act==='more_time'){await lsSay(LS_T.wait);extra=3000;if(gone())return null;continue}
    r=await x.help(act,it);if(gone())return null}}
/* ---------- упражнение 1: «Что делает Шарик?» — выбор картинки ---------- */
function lsDo(t){const others=LS_ACTS.filter(a=>a!==t);const lv=S.lvl.cat>=2?3:2;const opts=[t,...shuffle(others).slice(0,lv-1)];const o=opts[1];
  const first=rmode('lsdo',2)===0,q=first?LS_T.doQ(t[1],o[1]):LS_T.doQ(o[1],t[1]);let cards=[];
  const x={kind:'pick',game:'cat',task:'Что делает Шарик? '+q,opts:opts.length,n:t[1],m:'do',
    async show(){const L=G.ls;setPrompt('Что делает Шарик?');L.box.innerHTML=lsFrame();lsMount();L.cat.act(t[0]);if(t[0]==='eat')L.cat.hold('🐟');await wait(700)},
    async ask(){const r=await lsSay(LS_T.doWho+' '+q,{barge:true});if(r==='gone')return r;lsCards();return r},
    async wrong(ev){const a=ev.item;const b=cards.find(c=>c.a===a);if(b){b.el.classList.remove('bad');void b.el.offsetWidth;b.el.classList.add('bad')}G.ls.cat.mood('comfort');await lsSay(LS_T.doThis(a[1]));G.ls.cat.mood('calm')},
    async help(act,it){const L=G.ls;
      if(act==='repeat')return lsSay(LS_T.doWhere(t[1]),{barge:true});
      if(act==='model'){L.cat.act(null);await wait(200);L.cat.act(t[0]);return lsSay(LS_T.doModel(t[1])+' '+LS_T.doWhere(t[1]),{barge:true})}
      if(act==='fewer'){const w=cards.filter(c=>c.a!==t&&!c.gone);if(w.length){const c=pick(w);c.gone=true;c.el.classList.add('gone');it.left--}return lsSay(LS_T.doWhere(t[1]),{barge:true})}
      if(act==='easier'){for(const c of cards)if(c.a===t)c.el.classList.add('hint');if(L.cat.point)L.cat.point('up');return lsSay(LS_T.doEasy(t[1]),{barge:true})}
      return lsSay(LS_T.look)},
    async praise(){const L=G.ls;for(const c of cards)if(c.a===t)c.el.classList.add('good');sfx.good();confetti(60);L.cat.point&&L.cat.point(null);L.cat.mood('praise');
      await lsSay(pick(LS_GOOD)+' '+LS_T.doGood(t[1]));L.cat.act(null).hold('')}};
  function lsCards(){const L=G.ls,row=L.box.querySelector('.lsrow');row.innerHTML='';cards=shuffle(opts.slice()).map(a=>{const b=document.createElement('button');b.className='hgopt';b.dataset.a=a[1];row.append(b);
      const m=Cat2D.mount(b);m.act(a[0]);if(a[0]==='eat')m.hold('🐟');const c={a,el:b};
      b.onclick=()=>{const L=G&&G.ls;if(!L||c.gone||!['wait','explain','help'].includes(L.stage)||L.it.done)return;ac();if(L.stage!=='wait')stopVoice();if(a===t)L.it.done=true;lsEmit('tap',{ok:a===t,item:a,n:a[1]})};return c})}
  return x}
/* ---------- упражнение 2: голос — «Позови Шарика!» и «Скажи как Шарик» (любой звук засчитан) ---------- */
function lsVoice(k){const sleepy=k==='call',w=sleepy?null:k;
  const x={kind:'voice',game:'cat',task:sleepy?'Позови Шарика (он спит)':'Скажи как Шарик: '+w,n:sleepy?'позови':w,m:'call',
    async show(){const L=G.ls;setPrompt(sleepy?'Позови Шарика!':'Скажи как Шарик!');L.box.innerHTML=lsFrame();lsMount();
      if(sleepy){L.cat.act('sleep');L.cel.classList.add('far')}await wait(500)},
    ask(){if(sleepy)return lsSay(LS_T.callQ,{barge:true});G.ls.cat.viseme('a');return lsSay(LS_T.sayQ(w),{barge:true}).then(r=>{if(G&&G.ls)G.ls.cat.viseme(null);return r})},
    listen(on){if(!sleepy&&G.ls)G.ls.cat.mood(on?'listen':'calm')},
    async wrong(){},
    async help(act){const L=G.ls;
      if(act==='repeat')return lsSay(sleepy?LS_T.callRep:LS_T.sayRep(w),{barge:true});
      if(act==='model'){if(!sleepy)L.cat.viseme('a');const r=await lsSay(sleepy?LS_T.callModel:LS_T.sayModel(w),{barge:true});if(G&&G.ls)L.cat.viseme(null);return r}
      if(act==='easier'){if(sleepy){L.cel.onclick=()=>{const M=G&&G.ls;if(M&&M.stage==='wait'&&!M.it.done){ac();M.it.done=true;lsEmit('tap',{ok:true,by:'hero'})}};return lsSay(LS_T.callEasy,{barge:true})}return lsSay(LS_T.sayEasy,{barge:true})}
      return lsSay(LS_T.look)},
    async praise(){const L=G.ls;L.cel.classList.remove('far');L.cel.onclick=null;L.cat.act(null);sfx.good();confetti(70);L.cat.mood('praise');
      await lsSay(sleepy?LS_T.callGood:LS_T.sayGood(w))}};
  return x}
/* ---------- упражнение 3: жест через камеру — «Где твой нос?», «Улыбнись» ---------- */
function lsGest(k){
  const x={kind:'gest',game:'mirr',task:MIRR_EX[k].p,n:k,cam:false,
    async show(){const L=G.ls;setPrompt(MIRR_EX[k].p);
      if(!L.gest){L.box.innerHTML=lsFrame();lsMount();const row=L.box.querySelector('.lsrow');const mine=G;
        L.gest=await mirrWatchStart(row,k,()=>G===mine&&!!G.ls,t=>lsEmit(t),{btn:false});if(G!==mine)return}
      else L.gest.setKey(k);
      x.cam=L.gest.cam;L.cat.pose(null).mood('invite');await wait(400)},
    ask(){return lsSay(LS_T.gQ(k),{barge:true})},
    async wrong(){},
    async help(act){const L=G.ls;
      if(act==='repeat')return lsSay(LS_T.gRep(k),{barge:true});
      if(act==='model'){L.cat.mood('calm');if(k==='улыбка')L.cat.mood('praise');else L.cat.pose(HG_POSE[k]||null);const r=await lsSay(LS_T.gModel(k)+' '+LS_T.gRep(k),{barge:true});return r}
      return lsSay(LS_T.look)},
    async praise(){const L=G.ls;sfx.good();confetti(70);L.cat.pose(null).mood('praise');await lsSay(pick(LS_GOOD)+' '+LS_T.gGood(k))}};
  return x}
/* ---------- разметка ---------- */
function lsFrame(){return `<div class="lscat"></div><div class="lsrow"></div><div class="lsbar"><span class="shear" aria-hidden="true">${EAR}<span class="lv"><i></i></span></span><button class="big-btn lsmom">Получилось ✓</button><button class="big-btn lsnext">Дальше ›</button></div>`}
function lsMount(){const L=G.ls;L.cel=L.box.querySelector('.lscat');L.cat=hgCat(L.cel);
  const live=()=>['wait','notice','explain','help'].includes(L.stage)&&L.it&&!L.it.done;
  L.box.querySelector('.lsmom').onclick=()=>{ac();if(live()){L.it.done=true;stopVoice();lsEmit('parent')}};
  L.box.querySelector('.lsnext').onclick=()=>{ac();if(live()){L.it.done=true;stopVoice();lsEmit('skip')}};
  const ear=L.box.querySelector('.shear');if(ear)ear.classList.toggle('on',!!L.mic)}
/* ---------- голос занятия: заранее скачать все фразы (один голос на всё занятие) ---------- */
async function lsVoicePrep(){const L=G.ls,mine=G;
  if(S.lsPre===false||!shTtsOn()){L.voice='phone';L.voiceWhy=!shOn()?'нет сервера':!S.voice?'звук выключен':S.shTts===false?'живой голос выключен':'выключена загрузка';G.shNoTts=true;return}
  const P=lsPhrases();L.phr=P.length;
  if(P.length>100){L.voice='phone';L.voiceWhy=`фраз ${P.length} — больше сотни, нужно согласие мамы`;G.shNoTts=true;return}
  L.box.innerHTML=`<div class="lsprep"><div class="lscat" style="width:180px;height:200px;flex:none"></div><div>Шарик готовит голос… <b class="n">0</b> из ${P.length}</div><button class="big-btn lsgo">Начать сразу</button></div>`;
  const c=hgCat(L.box.querySelector('.lscat'));c.mood('think');
  let done=0,ok=0,go=false,i=0;const nEl=L.box.querySelector('.n');L.box.querySelector('.lsgo').onclick=()=>{ac();go=true};
  const before=await shPhrasesCount();
  const worker=async()=>{while(i<P.length&&!go&&G===mine){const p=P[i++];if(await shTtsGet(p))ok++;done++;if(nEl)nEl.textContent=done}};
  await Promise.race([Promise.all([worker(),worker(),worker(),worker()]),new Promise(r=>{const t=setInterval(()=>{if(go||G!==mine){clearInterval(t);r()}},200)}),wait(20000)]);
  if(G!==mine)return;c.unmount&&c.unmount();
  L.phrNew=Math.max(0,(await shPhrasesCount())-before);
  if(ok===P.length){L.voice='tts'}else{L.voice='phone';L.voiceWhy=go?'начали, не дождавшись':`скачалось ${ok} из ${P.length}`;G.shNoTts=true}}
/* ---------- занятие целиком ---------- */
async function startLesson(){ac();stopVoice();shAbort();VM.stop();{const os=document.getElementById('sh-sum');if(os)os.remove()}
  const gm=$('#game');gm.classList.remove('withnext','sharik','withsh','shbig');gm.classList.add('lesson');{const o=document.getElementById('shc');if(o)o.remove()}{const b=document.getElementById('shai');if(b)b.hidden=true}
  G={t0:Date.now(),game:'cat',i:0,results:[],seen:new Set(),max:3,lesson:true,round:{wrong:0}};const mine=G;
  G.ls={t0:Date.now(),log:[],stage:'prep',ai:shOn()&&S.lsAi!==false,mic:false,speaking:false,quiet:0,box:$('#stage'),
    n:{mom:0,next:0,voice:0,camera:0,tap:0,barge:0,ai:0,local:0,helpNext:0}};
  $('#stage').innerHTML='<div class="ls"></div>';G.ls.box=$('#stage .ls');
  show('game');renderDots();$('#prompt').textContent='Пятиминутка';const L=G.ls;
  await lsVoicePrep();if(G!==mine)return;
  lsLog('voice',{kind:L.voice,why:L.voiceWhy||'',phrases:L.phr||0});
  L.box.innerHTML=lsFrame();lsMount();await lsMicStart();if(G!==mine)return;{const ear=L.box.querySelector('.shear');if(ear)ear.classList.toggle('on',!!L.mic)}
  setPrompt('Шарик');L.cat.mood('invite');
  await lsSay(LS_T.hello()+' '+LS_T.start,{barge:true});if(G!==mine)return;
  const min=Math.max(3,Math.min(10,+S.lsMin||5))*60000,per=+S.lsItems||3;
  const acts=shuffle(LS_ACTS.slice()),voices=shuffle(['call',...LS_SAYW]),gest=LS_GEST.slice();
  const EX=[n=>lsDo(acts[n%acts.length]),n=>lsVoice(voices[n%voices.length]),n=>lsGest(gest[n%gest.length])];
  for(let e=0;e<3;e++){
    if(e>0){L.box.innerHTML=lsFrame();lsMount();L.cat.mood('invite');await lsSay(LS_T.next);if(G!==mine)return}
    let any=false;
    for(let n=0;n<per;n++){
      if(n>0&&Date.now()-L.t0>min*(e+1)/3)break; /* у каждого упражнения своя треть времени; хотя бы одно задание */
      const x=EX[e](n);G.round={wrong:0,lvl:S.lvl.cat,tStart:Date.now()};
      const r=await lsItem(x);if(G!==mine||!r)return;
      any=any||r.ok;
      S.log.push({t:Date.now(),g:x.game,l:x.game==='cat'?S.lvl.cat:S.lvl.mirr,ok:r.ok,w:r.it.tries+r.it.helps.length,n:x.n,m:x.m,how:r.how==='tap'?'tap':r.how,ls:1});save();
      await wait(350);if(G!==mine)return}
    if(L.gest){L.gest.stop();L.gest=null}
    G.results[e]=any;G.i=e+1;renderDots()}
  L.box.innerHTML=lsFrame();lsMount();L.cat.mood('invite');await lsSay(LS_T.bye);if(G!==mine)return;
  lsFinish(mine)}
function lsFinish(mine){const L=mine.ls;L.mic=false;VM.stop();if(L.gest){L.gest.stop();L.gest=null}lsLog('end');
  finish();
  const box=$('#finish .finish');if(!box)return;const old=document.getElementById('sh-sum');if(old)old.remove();
  const items=S.log.filter(x=>x.ls&&x.t>=mine.t0),okN=items.filter(x=>x.ok).length;
  const local=`Пятиминутка: заданий ${items.length}, получилось ${okN}`+(items.length-okN?`, не вышло ${items.length-okN} (герой помогал, но не хвалил)`:'')+`. Минут: ${((Date.now()-mine.t0)/60000).toFixed(1)}.`;
  const vk=L.voice==='tts'?`один живой голос (фраз ${L.phr}${L.phrNew?`, новых озвучено ${L.phrNew}`:', все уже были на телефоне'})`:`голос телефона (${L.voiceWhy||'—'})`;
  const tech=shReport(mine,{mom:L.n.mom,next:L.n.next,voice:L.n.voice,camera:L.n.camera,tap:L.n.tap,barge:L.n.barge,aiUsed:L.ai?L.n.ai:undefined,localUsed:L.n.local,voiceKind:vk});
  box.insertAdjacentHTML('beforeend','<div class="shsum" id="sh-sum"><b>Маме</b><span></span><small style="display:block;color:#8a8fa3;margin-top:6px"></small></div>');
  box.querySelector('#sh-sum span').textContent=local;box.querySelector('#sh-sum small').textContent=tech;
  shRepSave('Пятиминутка',local+' '+tech);
  S.lsLog=L.log.slice(-300);save()} /* журнал последнего занятия — для разбора */
window.__ls={lsEmit,lsPhrases,lsRule,get L(){return G&&G.ls}};
/* ---------- главный экран и «Для взрослых» (этот файл грузится после 8-parent.js) ---------- */
{const a0=applyV21Home;applyV21Home=function(){a0.apply(this,arguments);const b=$('#btn-ls');if(!b)return;b.hidden=!lsOn();const ic=b.querySelector('.shico');if(ic&&!ic.innerHTML&&window.Cat2D)ic.innerHTML=Cat2D.svg()}}
{const s0=shSync;shSync=function(){s0.apply(this,arguments);const q=id=>$('#'+id);if(!q('set-lson'))return;
  q('set-lson').checked=S.lsOn!==false;q('set-lsai').checked=S.lsAi!==false;q('set-lspre').checked=S.lsPre!==false;q('set-lsbarge').checked=S.lsBarge!==false;
  q('set-lsmin').value=S.lsMin||5;q('set-shwait').value=S.shWaitS||5;q('set-shcam').checked=S.shCam!==false;q('set-shbadge').checked=S.shBadge!==false;q('sh-rep').textContent=shRepText()}}
{const ck=(id,k,f)=>{const e=$('#'+id);if(e)e.onchange=ev=>{S[k]=ev.target.checked;save();f&&f()}};
  ck('set-lson','lsOn',applyV21Home);ck('set-lsai','lsAi');ck('set-lspre','lsPre');ck('set-lsbarge','lsBarge');ck('set-shcam','shCam');ck('set-shbadge','shBadge');
  const n=(id,k,lo,hi,d)=>{const e=$('#'+id);if(e)e.onchange=ev=>{S[k]=Math.min(hi,Math.max(lo,Math.round(+ev.target.value)||d));ev.target.value=S[k];save()}};
  n('set-lsmin','lsMin',3,10,5);n('set-shwait','shWaitS',2,15,5);
  const b=$('#btn-ls');if(b)b.onclick=()=>{ac();startLesson()}}
applyV21Home();
