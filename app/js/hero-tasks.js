/* «Речка»: новые задания с героем в «Играем с Шариком» (версия 48, задача 12 в docs/ai-sharik/ROADMAP.md).
   Все задания идут на управлении «Пятиминутки» (app/js/9-lesson.js, lsItem): показать → объяснить → ждать →
   заметить попытку → помочь (повтор того же, образец, убрать картинку, проще) → продолжить; похвала только за событие
   (нажатие, голос — любой звук, жест камерой, кнопка мамы). Приёмы логопеда (docs/logoped/2026-11-zanyatiya.md):
   вопрос-выбор из двух, верный ответ то первым, то вторым; образец из двух слов; фразы через «я»; не «скажи, скажи».
   Картинки рисуются кодом или это эмодзи телефона. Каждый вид выключается в «Для взрослых» → «Шарик». */
const HGT_CSS=`
.ls .hgtop{flex:1;min-height:150px;width:100%;position:relative;display:flex;align-items:flex-end;justify-content:center;gap:6px}
.ls .hgtop>.lscat{flex:1;min-height:0;height:100%}
.ls .hgobj{flex:none;width:34%;height:60%;display:grid;place-items:center}
.ls .hgobj svg{width:100%;height:100%}
.ls .hgopt .em{font-size:clamp(44px,13vw,72px);line-height:1}
.ls .hgopt .wd{position:absolute;left:0;right:0;bottom:6px;font-family:var(--display);font-size:18px;color:#24324a}
.ls .hgopt.txt{font-family:var(--display);font-size:clamp(30px,9vw,44px);color:#fff}
.ls .hgopt.yes{background:#3cbf7a}.ls .hgopt.no{background:#ff6b5b}
.ls .hgopt .dot{width:62%;aspect-ratio:1;border-radius:50%;margin:auto;border:4px solid #24324a22}
.ls .hgopt .sc{position:absolute;inset:6px}
.ls .hgopt .cats{display:flex;align-items:flex-end;justify-content:center;height:100%;padding:8px}
.ls .hgopt .cats svg{width:42%;height:auto}.ls .hgopt .cats.one svg{width:70%}
.hgsc{position:relative;width:100%;height:100%}
.hgsc .hgbx{position:absolute;left:28%;width:44%;bottom:4%;height:40%;z-index:2;transition:transform .6s,bottom .6s}
.ls .hgduo .lscat{flex:none;min-height:0}
.ls .hgsc .hgct{min-height:0;flex:none}.ls .hgscene .lscat{min-height:0;flex:none}
.hgsc .hgct{position:absolute;width:36%;height:48%;left:32%;bottom:20%;z-index:1;transition:left .6s,bottom .6s,height .6s,width .6s}
.hgsc .hgct>svg{width:100%;height:100%}
.hgsc.p-side .hgct{left:0;bottom:4%}
.hgsc.p-в .hgct{left:32%;bottom:18%}
.hgsc.p-за .hgct{left:56%;bottom:28%}
.hgsc.p-на .hgct{left:32%;bottom:40%;z-index:3}
.hgsc.p-под .hgbx{transform:rotate(-14deg);bottom:26%}.hgsc.p-под .hgct{left:30%;bottom:2%;height:34%;width:30%;z-index:1}
.hgsc.peek .hgct{animation:hgpeek .9s ease-out}
@keyframes hgpeek{40%{transform:translateY(-18%)}}
.ls .hgduo{flex:1;min-height:150px;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:4%}
.ls .hgduo>div{position:relative;cursor:pointer}
.ls .hgduo .big{width:52%;height:96%}.ls .hgduo .small{width:30%;height:52%}
.ls .hgduo .hint{outline:6px solid var(--sun);border-radius:24px}
.ls .hgspoon{position:absolute;right:4%;bottom:6%;font-size:clamp(44px,12vw,64px);transition:right .7s,bottom .7s,transform .7s;z-index:4}
.ls .hgspoon.eat{right:44%;bottom:44%;transform:rotate(-30deg) scale(.8)}
.ls .hgscene{flex:1;min-height:200px;width:100%;position:relative}
.ls .hgscene .tbl{position:absolute;left:24%;top:47%;width:52%;height:50%}
.ls .hgscene .zone{position:absolute;left:20%;width:60%;border:4px dashed #7b61ff66;border-radius:22px;background:#7b61ff10;z-index:3}
.ls .hgscene .zone.on{top:0;height:46%}.ls .hgscene .zone.under{top:54%;height:44%}
.ls .hgscene .zone.hint{border-color:var(--sun);background:#ffc93c33}
.ls .hgscene .it{position:absolute;font-size:clamp(40px,11vw,60px);line-height:1;transition:left .6s,top .6s;z-index:4;transform:translate(-50%,-50%)}
.ls .hgscene .it.side{left:88%;top:80%}.ls .hgscene .it.on{left:50%;top:36%}.ls .hgscene .it.under{left:50%;top:84%}
.ls .hgscene .lscat{position:absolute;left:0;top:44%;width:30%;height:54%}
.ls .hgscene .lscat.on{left:35%;top:2%;width:30%;height:46%}.ls .hgscene .lscat.under{left:35%;top:56%;width:30%;height:44%}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+HGT_CSS+'</style>');
const HGT_KINDS={dress:['Одень Шарика (шапка, очки, носки, шарф)',1],hide:['Шарик прячется (в, за, потом на, под)',1],big:['Большой и маленький Шарик (со 2 уровня: один — много)',1],
  feed:['Покорми с ложки: «ам!» и «открой рот — а-а-а»',1],yesno:['Да или нет? «Шарик спит?» (уровень 1 — с кивком, потом без)',1],chain:['Части тела по цепочке: у Шарика — у тебя (камера) — у мамы',1],
  color:['Какой? Цвет: «Какой шарф? Красный или синий?»',1],yaty:['Я — ты — он: «Я сплю. Он спит. А ты?»',2],put:['Положи с героем: на стол, под стол; «Кто под столом?»',2],
  rhythm:['Ритмические ряды за Шариком: «мак — дым»',2],hello:['Привет и пока: занятие начинается и кончается помахиванием',1],rest:['Перерыв: погладить, пощекотать, бросить мяч',1]};
const HG_OLD={do:'Что делает Шарик? (выбор из двух)',part:'Где у Шарика нос? (нажать на героя)',give:'Дай Шарику рыбу',where:'Посади Шарика на стол / под стол (со 2 уровня)',call:'Позови Шарика / Скажи как Шарик'};
function hgK(k){return !(S.hgK&&S.hgK[k]===false)}
/* какие виды заданий идут на этом уровне (старые пять + новые), без выключенных */
function hgKinds(lvl){const a=['do','part','give','call'].concat(lvl>=2?['where']:[]);
  for(const k in HGT_KINDS)if(!['hello','rest'].includes(k)&&HGT_KINDS[k][1]<=lvl)a.push(k);return a.filter(hgK)}
/* ---------- общее: занятие-управление внутри обычной игры ---------- */
function hgtCtx(){if(!G.ls)G.ls={t0:Date.now(),log:[],stage:'',ai:!!G.sharik&&shOn()&&S.lsAi!==false,mic:false,speaking:false,quiet:0,box:null,
  n:{mom:0,next:0,voice:0,camera:0,tap:0,barge:0,ai:0,local:0,helpNext:0}};return G.ls}
/* разметка задания: сверху сцена (в ней .lscat — главный герой), ниже ряд карточек, внизу кнопки мамы */
function hgtFrame(top){const st=$('#stage');stageAnim&&stageAnim();
  st.innerHTML=`<div class="ls">${top||'<div class="lscat"></div>'}<div class="lsrow"></div><div class="lsbar"><span class="shear" aria-hidden="true">${EAR}<span class="lv"><i></i></span></span><button class="big-btn lsmom">Получилось ✓</button><button class="big-btn lsnext">Дальше ›</button></div></div>`;
  const L=G.ls;L.box=st.firstChild;lsMount();return L}
const hgSay=(t,o)=>lsSay(t,o);
const hgGood=()=>pick(['Молодец!','Умница!','Да!','Ура!']);
/* выбор карточек: opts [{html|mount|cls, ok, wrong}], q — вопрос; карточки появляются после вопроса */
function hgtPick(o){let cards=[];
  const x={kind:'pick',game:'cat',task:o.task||o.q,opts:o.opts.length,n:o.n,m:o.m,
    async show(it){hgtFrame(o.top);if(o.prompt)setPrompt(o.prompt);o.setup&&o.setup(G.ls);await wait(o.pause||500)},
    async ask(){const r=await hgSay(o.say||o.q,{barge:true});if(r==='gone')return r;mk();return r},
    async wrong(ev){const c=cards.find(c=>c.o===ev.item);if(c){c.el.classList.remove('bad');void c.el.offsetWidth;c.el.classList.add('bad')}
      G.ls.cat&&G.ls.cat.mood('comfort');await hgSay(ev.item&&ev.item.wrong||'Посмотри ещё.');G.ls.cat&&G.ls.cat.mood('calm')},
    async help(act,it){
      if(act==='repeat')return hgSay(o.rep||o.q,{barge:true});
      if(act==='model'){if(o.model)return o.model(G.ls);return hgSay(o.rep||o.q,{barge:true})}
      if(act==='fewer'){const w=cards.filter(c=>!c.o.ok&&!c.gone);if(w.length){const c=pick(w);c.gone=true;c.el.classList.add('gone');it.left--}return hgSay(o.rep||o.q,{barge:true})}
      if(act==='easier'){for(const c of cards)if(c.o.ok)c.el.classList.add('hint');return hgSay(o.easy||o.rep||o.q,{barge:true})}
      return hgSay('Посмотри ещё.')},
    async praise(){for(const c of cards)if(c.o.ok)c.el.classList.add('good');sfx.good();confetti(60);const L=G.ls;L.cat&&L.cat.mood('praise');
      if(o.done)await o.done(L);else await hgSay(hgGood()+' '+o.good)}};
  function mk(){const row=G.ls.box.querySelector('.lsrow');row.innerHTML='';const list=o.keep?o.opts.slice():shuffle(o.opts.slice());
    cards=list.map(op=>{const b=document.createElement('button');b.className='hgopt'+(op.cls?' '+op.cls:'');if(op.ok)b.dataset.ok='1';if(op.html)b.innerHTML=op.html;row.append(b);if(op.mount)op.mount(b);
      const c={o:op,el:b};b.onclick=()=>hgtTap(c.gone,op.ok,op);return c})}
  return x}
/* нажатие — событие для управления (во время речи героя тоже: он замолкает) */
function hgtTap(gone,ok,item){const L=G&&G.ls;if(!L||gone||!L.it||L.it.done||!['wait','explain','help'].includes(L.stage))return;ac();if(L.stage!=='wait')stopVoice();if(ok)L.it.done=true;lsEmit('tap',{ok:!!ok,item})}
/* «голос»: любой звук (или кнопка мамы); камера может добавить жест (cam — ключ жеста «Зеркала») */
function hgtVoice(o){
  const x={kind:'voice',game:'cat',task:o.task,n:o.n,m:o.m,
    async show(){hgtFrame(o.top);setPrompt(o.prompt);o.setup&&o.setup(G.ls);
      if(o.cam&&S.shCam!==false){const mine=G;G.ls.gest=await mirrWatchStart(G.ls.box.querySelector('.lsrow'),o.cam,()=>G===mine&&!!G.ls,t=>{if(t==='camera')lsEmit(t)},{btn:false})}
      await wait(400)},
    ask(){return o.ask(G.ls)},listen(on){const c=G.ls.cat;if(c)c.mood(on?'listen':'calm')},
    async wrong(){},
    async help(act){const L=G.ls;if(act==='model'&&o.model)return o.model(L);if(act==='easier'&&o.easy)return o.easy(L);return hgSay(o.rep,{barge:true})},
    async praise(ev){const L=G.ls;if(L.gest){L.gest.stop();L.gest=null}sfx.good();confetti(70);L.cat&&L.cat.mood('praise');await o.done(L,ev)}};
  return x}
/* жест камерой (без камеры — кнопка мамы); key — жест «Зеркала» или null (только мама) */
function hgtGest(o){
  const x={kind:'gest',game:'cat',task:o.task,n:o.n,m:o.m,cam:false,
    async show(){hgtFrame(o.top);setPrompt(o.prompt);o.setup&&o.setup(G.ls);const mine=G;
      if(o.key){G.ls.gest=await mirrWatchStart(G.ls.box.querySelector('.lsrow'),o.key,()=>G===mine&&!!G.ls,t=>lsEmit(t),{btn:false});if(G!==mine)return;x.cam=G.ls.gest.cam}
      await wait(300)},
    ask(){return hgSay(o.q,{barge:true})},async wrong(){},
    async help(act){const L=G.ls;if(act==='model'&&o.model)return o.model(L);return hgSay(o.rep||o.q,{barge:true})},
    async praise(){const L=G.ls;if(L.gest){L.gest.stop();L.gest=null}sfx.good();confetti(70);L.cat&&L.cat.pose(null).mood('praise');await hgSay(hgGood()+' '+o.good)}};
  return x}
/* выполнить задания раунда по порядку; засчитано с первой попытки — если всё без ошибок и без помощи */
async function hgtRun(xs,meta){const mine=G,R=G.round;hgtCtx();await lsMicStart();if(G!==mine||R.dead)return;
  let ok=true,how='tap',any=false;
  for(const x of xs){if(!x)continue;
    if(x.auto){G.ls.it={tries:0,helps:[],done:true};await x.show();if(G!==mine||R.dead)return;await x.ask();await wait(400);if(G!==mine||R.dead)return;continue} /* герой только показывает — ответа не ждём */
    const r=await lsItem(x);if(G!==mine||R.dead||G.round!==R||!r)return;
    if(G.ls.gest){G.ls.gest.stop();G.ls.gest=null}
    R.wrong+=r.it.tries;if(!r.ok||r.it.tries||r.it.helps.length)ok=false;if(r.ok)any=true;how=r.how;await wait(250);if(G!==mine||R.dead)return}
  return roundDone(ok&&any,Object.assign({how:how==='camera'?'camera':how==='parent'?'parent':how==='voice'?'voice':'tap'},meta))}
const hgAlt=(key,a,b)=>rmode(key,2)===0?[a,b]:[b,a]; /* верный ответ то первым, то вторым */
const hgOrQ=(key,right,other,f)=>{const [a,b]=hgAlt(key,right,other);return f(a,b)};
/* ---------- А. «Одень Шарика» ---------- */
const HGT_WEAR=[{k:'hat',em:'🧢',w:'шапка',acc:'шапку',in:'в шапке'},{k:'glasses',em:'👓',w:'очки',acc:'очки',in:'в очках'},{k:'socks',em:'🧦',w:'носки',acc:'носки',in:'в носках'},{k:'scarf',em:'🧣',w:'шарф',acc:'шарф',in:'в шарфе'}];
function hgtDress(lvl){const nOpt=Math.min(4,lvl+1),t=fresh(()=>pick(HGT_WEAR),x=>'hgw'+x.k),others=shuffle(HGT_WEAR.filter(x=>x!==t)).slice(0,nOpt-1);
  const v=rmode('hgdress',lvl>=2?3:2),bare=L=>{for(const w of HGT_WEAR)L.cat.wear(w.k,false)};
  const card=w=>({html:`<span class="em">${w.em}</span><span class="wd">${w.w}</span>`,ok:w===t,wrong:`Это ${w.w}.`,w});
  if(v===0){const q=`Надень мне ${t.acc}!`; /* понимание просьбы → «Я в шапке.» */
    return hgtPick({q,say:q,prompt:`Надень Шарику ${t.acc}!`,n:t.w,m:'dress',opts:[t,...others].map(card),setup:L=>bare(L),rep:`Где ${t.w}? ${q}`,
      model:async L=>{L.cat.wear(t.k,true);await hgSay(`Вот ${t.w}!`);L.cat.wear(t.k,false);return hgSay(q,{barge:true})},
      done:async L=>{L.cat.wear(t.k,true);await hgSay(`${hgGood()} Я ${t.in}.`)}})}
  if(v===1){const o=others[0],q=hgOrQ('hgdq',t.w,o.w,(a,b)=>`Что на мне? ${a[0].toUpperCase()+a.slice(1)} или ${b}?`); /* вопрос-выбор */
    return hgtPick({q,prompt:'Что на Шарике?',n:t.w,m:'dress',opts:[card(t),card(o)],setup:L=>{bare(L);L.cat.wear(t.k,true)},rep:q,
      model:async L=>{L.cat.point&&L.cat.point('up');const r=await hgSay(`Смотри: ${t.w}. ${q}`,{barge:true});L.cat.point&&L.cat.point(null);return r},good:`Я ${t.in}.`})}
  /* «Сними шапку!» — на нём две вещи */
  const o=others[0],q=`Сними ${t.acc}!`;
  return hgtPick({q,prompt:q,n:t.w,m:'dress',opts:[card(t),card(o)],setup:L=>{bare(L);L.cat.wear(t.k,true).wear(o.k,true)},rep:`Где ${t.w}? ${q}`,
    done:async L=>{L.cat.wear(t.k,false);await hgSay(`${hgGood()} ${t.w[0].toUpperCase()+t.w.slice(1)} — нет!`)}})}
/* ---------- Б. «Шарик прячется» ---------- */
const HGT_BOX='<svg viewBox="0 0 120 90" preserveAspectRatio="none" style="width:100%;height:100%"><path d="M10 20h100l-6 66H16z" fill="#c98b4e" stroke="#5b3a22" stroke-width="4" stroke-linejoin="round"/><path d="M10 20l-8-14 30 2 10 12M110 20l8-14-30 2-10 12" fill="#e0a86e" stroke="#5b3a22" stroke-width="4" stroke-linejoin="round"/><path d="M40 50h40" stroke="#5b3a22" stroke-width="4" stroke-linecap="round" opacity=".4"/></svg>';
const HGT_POS={в:{acc:'в коробку',at:'в коробке'},за:{acc:'за коробку',at:'за коробкой'},на:{acc:'на коробку',at:'на коробке'},под:{acc:'под коробку',at:'под коробкой'}};
const hgtScene=(p,live)=>`<div class="hgsc p-${p}"><div class="hgbx">${HGT_BOX}</div><div class="hgct${live?' lscat':''}">${live?'':Cat2D.svg()}</div></div>`;
function hgtHide(lvl){const P=lvl>=3?['в','за','на','под']:lvl>=2?['в','за','на']:['в','за'],t=fresh(()=>pick(P),x=>'hgh'+x+G.i%2);let o;do{o=pick(P)}while(o===t);
  const word=x=>lvl>=2?HGT_POS[x].at[0].toUpperCase()+HGT_POS[x].at.slice(1):x[0].toUpperCase()+x.slice(1); /* образец: сначала только предлог, потом с окончанием */
  const card=x=>({html:`<div class="sc">${hgtScene(x)}</div>`,ok:x===t,wrong:`Тут Шарик ${HGT_POS[x].at}.`});
  const top=`<div class="hgtop" style="max-height:52%">${hgtScene('side',true)}</div>`;
  const peek=async L=>{const sc=L.box.querySelector('.hgsc');sc.classList.add('peek');L.cat.jump();await hgSay('Ку-ку!')};
  if(rmode('hghide',2)===0){const q=`Спрячь меня ${HGT_POS[t].acc}!`; /* понимание действием */
    return hgtPick({q,prompt:`Спрячь Шарика ${HGT_POS[t].acc}!`,n:t,m:'hide',top,opts:[card(t),card(o)],rep:q,
      model:async L=>{const sc=L.box.querySelector('.hgsc');sc.className='hgsc p-'+t;await wait(700);await hgSay(`Смотри: я ${HGT_POS[t].at}.`);sc.className='hgsc p-side';await wait(500);return hgSay(q,{barge:true})},
      done:async L=>{const sc=L.box.querySelector('.hgsc');sc.className='hgsc p-'+t;await wait(700);await peek(L);await hgSay(`${hgGood()} ${word(t)}!`)}})}
  const q=hgOrQ('hghq',HGT_POS[t].at,HGT_POS[o].at,(a,b)=>`Где Шарик? Я ${a} или ${b}?`);
  return hgtPick({q,prompt:'Где Шарик?',n:t,m:'hide',top:top.replace('p-side','p-'+t),opts:[card(t),card(o)],rep:q,
    done:async L=>{await peek(L);await hgSay(`${hgGood()} ${word(t)}!`)}})}
/* ---------- В. «Большой и маленький Шарик», один — много ---------- */
function hgtBig(lvl){const v=rmode('hgbig',lvl>=2?4:3);
  const duo=`<div class="hgduo"><div class="big lscat"></div><div class="small"></div></div>`;
  const tapCats=(L,want,onWrong)=>{const els={big:L.box.querySelector('.hgduo .big'),small:L.box.querySelector('.hgduo .small')};
    for(const k in els){const h=hgCat(els[k]);els[k]._h=h;if(k===want)els[k].dataset.ok='1';els[k].onclick=()=>hgtTap(false,k===want,{k,wrong:onWrong(k)})}
    L.cat=els[want]._h;L.cel=els[want];return els};
  if(v<=1){const want=v===0?'big':pick(['big','small']),q=v===0?`Где ${want==='big'?'большой':'маленький'} Шарик?`:`Дай ${want==='big'?'большому':'маленькому'} рыбу!`;
    const x=hgtPick({q,prompt:q,n:want==='big'?'большой':'маленький',m:'big',opts:[],top:duo,rep:q,
      setup:L=>tapCats(L,want,k=>k==='big'?'Это большой Шарик.':'Это маленький Шарик.'),
      model:async L=>{L.cel.classList.add('hint');L.cat.wave();return hgSay(`Вот ${want==='big'?'большой':'маленький'} Шарик! ${q}`,{barge:true})},
      done:async L=>{L.cel.classList.remove('hint');if(v===1){L.cat.hold('🐟').act('eat');await hgSay(`${hgGood()} Я ем рыбу.`);L.cat.act(null).hold('')}else await hgSay(`${hgGood()} ${want==='big'?'Большой':'Маленький'} Шарик.`)}});
    x.opts=0;return x}
  if(v===2){const want=pick(['big','small']),w=want==='big'?'большой':'маленький',q=hgOrQ('hgbq','большой','маленький',(a,b)=>`Шарик ${a} или ${b}?`);
    const icon=(k,ok)=>({html:`<div class="cats one" style="align-items:flex-end">${Cat2D.svg().replace('<svg ',`<svg style="width:${k==='big'?78:40}%" `)}</div><span class="wd">${k==='big'?'большой':'маленький'}</span>`,ok,wrong:`Это ${k==='big'?'большой':'маленький'}.`});
    return hgtPick({q,prompt:'Шарик какой?',n:w,m:'big',opts:[icon('big',want==='big'),icon('small',want==='small')],
      top:`<div class="hgtop"><div class="lscat" style="flex:none;width:${want==='big'?70:34}%;height:${want==='big'?100:50}%"></div></div>`,rep:q,good:`${w[0].toUpperCase()+w.slice(1)} Шарик.`})}
  /* один — много: «Где кот? А где коты?» */
  const many=rmode('hgmany',2)===1,q=many?'Где коты? Много!':'Где кот?';
  const grp=n=>({html:`<div class="cats${n===1?' one':''}">${Array(n).fill(Cat2D.svg()).join('')}</div>`,ok:(n>1)===many,wrong:n>1?'Тут коты. Много!':'Тут кот. Один.'});
  return hgtPick({q,say:many?'Где коты? Котов много!':'Где кот? Один кот.',prompt:many?'Где коты?':'Где кот?',n:many?'коты':'кот',m:'big',opts:[grp(1),grp(3)],rep:q,good:many?'Коты! Много!':'Кот. Один!'})}
/* ---------- Г. «Покорми с ложки: ам!» ---------- */
function hgtFeed(lvl){const food=pick(['🍓','🥕','🍌','🧀']);
  if(lvl>=2&&rmode('hgfeed',2)===1)return hgtGest({task:'Открой рот — а-а-а!',prompt:'Открой рот!',n:'а-а-а',m:'feed',key:'а',q:'Теперь я кормлю тебя! Открой рот — а-а-а!',rep:'Открой рот: а-а-а!',
    setup:L=>{L.cat.hold('🥄')},model:async L=>{L.cat.viseme('a');const r=await hgSay('Смотри: а-а-а!',{barge:true});L.cat.viseme(null);return r},good:'Ам! Вкусно?'});
  return hgtVoice({task:'Покорми Шарика: скажи «ам»',prompt:'Покорми Шарика!',n:'ам',m:'feed',top:`<div class="hgtop"><div class="lscat"></div><div class="hgspoon">🥄${food}</div></div>`,
    ask:L=>{L.cat.mood('invite');return hgSay('Я хочу есть! Скажи «ам» — и я съем!',{barge:true})},rep:'Скажи: ам!',
    model:async L=>{L.cat.viseme('a');const r=await hgSay('Ам! Ам!',{barge:true});L.cat.viseme(null);return r},
    easy:L=>{const s=L.box.querySelector('.hgspoon');s.onclick=()=>{const M=G&&G.ls;if(M&&M.stage==='wait'&&!M.it.done){ac();M.it.done=true;lsEmit('tap',{ok:true,by:'spoon'})}};return hgSay('Можно нажать на ложку!',{barge:true})},
    done:async L=>{const s=L.box.querySelector('.hgspoon');s.classList.add('eat');await wait(600);L.cat.viseme('a');await wait(350);s.textContent='🥄';L.cat.viseme(null).act('eat');
      await hgSay('Ам! Вкусно! Ещё?');L.cat.act(null)}})}
/* ---------- Д. «Я — ты — он» ---------- */
const HGT_ME=[{a:'sleep',me:'сплю',he:'спит',you:'спишь',key:'глазки'},{a:'eat',me:'ем',he:'ест',you:'ешь',key:'а'},{a:'wave',me:'машу',he:'машет',you:'машешь',key:'помаши'},{a:'jump',me:'прыгаю',he:'прыгает',you:'прыгаешь',key:null}];
function hgtYaty(){const t=fresh(()=>pick(HGT_ME),x=>'hgy'+x.a);let o;do{o=pick(HGT_ME)}while(o===t);
  const q=hgOrQ('hgyq',t.he,o.he,(a,b)=>`Что делает Шарик? Он ${a} или ${b}?`);
  const card=v=>({mount:b=>{const m=Cat2D.mount(b);m.act(v.a);if(v.a==='eat')m.hold('🐟')},ok:v===t,wrong:`Тут он ${v.he}.`});
  const x1=hgtPick({q,say:`Я ${t.me}! ${q}`,prompt:'Что делает Шарик?',n:t.he,m:'yaty',opts:[card(t),card(o)],setup:L=>{L.cat.act(t.a);if(t.a==='eat')L.cat.hold('🐟')},pause:1200,rep:q,
    model:async L=>hgSay(`Смотри: я ${t.me}. Он ${t.he}. ${q}`,{barge:true}),good:`Он ${t.he}.`});
  const x2=hgtGest({task:`Покажи, как ты ${t.you}`,prompt:`Покажи, как ты ${t.you}!`,n:t.me,m:'yaty',key:t.key&&MIRR_EX[t.key]&&(t.key!=='помаши'||S.mirrBody!==false)?t.key:null,
    q:`А ты? Покажи, как ты ${t.you}!`,rep:`Покажи, как ты ${t.you}!`,setup:L=>{L.cat.act(t.a)},model:async L=>{L.cat.act(null);await wait(150);L.cat.act(t.a);return hgSay(`Смотри: я ${t.me}! А ты?`,{barge:true})},good:`Я ${t.me}!`});
  return [x1,x2]}
/* ---------- Е. «Да — нет» и «не» ---------- */
function hgtYesNo(lvl){const acts=HG_ACTS.slice(0,4),t=pick(acts),yes=rmode('hgyn',2)===0;let ask=t;if(!yes)do{ask=pick(acts)}while(ask===t);
  const item=rmode('hgyni',3)===2;const IT=[['🐟','рыба'],['⚽','мяч'],['🧸','мишка'],['🍌','банан']];const ti=pick(IT);let ai=ti;if(!yes)do{ai=pick(IT)}while(ai===ti);
  const q=item?`Это ${ai[1]}? Да или нет?`:`Шарик ${ask[1]}? Да или нет?`;
  const ans=item?(yes?`Да! Это ${ti[1]}.`:`Нет, не ${ai[1]}. Это ${ti[1]}.`):(yes?`Да! Шарик ${t[1]}.`:`Нет, не ${ask[1]}. Шарик ${t[1]}.`);
  const yn=()=>{const [a,b]=hgAlt('hgynorder',{html:'ДА',cls:'txt yes',ok:yes,wrong:'Посмотри ещё.'},{html:'НЕТ',cls:'txt no',ok:!yes,wrong:'Посмотри ещё.'});return [a,b]};
  const setup=L=>{if(item)L.cat.hold(ti[0]).point('up');else{L.cat.act(t[0]);if(t[0]==='eat')L.cat.hold('🐟')}};
  const mk=nod=>hgtPick({q,prompt:q.replace(' Да или нет?',''),n:item?ti[1]:t[1],m:'yesno',opts:yn(),keep:true,setup,pause:1000,rep:q,
    say:q,model:async L=>{yes?L.cat.nod():L.cat.shake();return hgSay(q,{barge:true})},done:async()=>hgSay(ans),
});
  const x1=mk(true),x2=lvl<=1?mk(false):null;
  if(lvl<=1){const a0=x1.ask;x1.ask=async it=>{setTimeout(()=>{const c=G&&G.ls&&G.ls.cat;if(c)yes?c.nod():c.shake()},700);return a0(it)}} /* уровень 1: подсказка кивком, потом то же задание без кивка */
  return x2?[x1,x2]:[x1]}
/* ---------- Ж. «Положи» с героем ---------- */
function hgtPut(lvl){const IT=[['🐟','рыбу','рыба'],['⚽','мяч','мяч'],['🧸','мишку','мишка'],['🍎','яблоко','яблоко']],t=pick(IT),p=fresh(()=>pick(['на','под']),x=>'hgput'+x+G.i%2),
    want=p==='на'?'on':'under',to=p==='на'?'на стол':'под стол',at=p==='на'?'на столе':'под столом';
  const scene=`<div class="hgscene"><div class="zone on"></div><div class="zone under"></div>${HG_TABLE}<div class="it side">${t[0]}</div><div class="lscat"></div></div>`;
  if(lvl>=3&&rmode('hgput2',2)===1){ /* два предмета: «Кто под столом — Шарик или мишка?» */
    const catUnder=rmode('hgputc',2)===0,qp=pick(['на','под']),catAt=catUnder?'under':'on',who=(qp==='под')===catUnder?'cat':'bear';
    const q=hgOrQ('hgputq','Шарик','мишка',(a,b)=>`Кто ${qp==='на'?'на столе':'под столом'} — ${a} или ${b}?`);
    return hgtPick({q,prompt:`Кто ${qp==='на'?'на столе':'под столом'}?`,n:who==='cat'?'Шарик':'мишка',m:'put',
      top:`<div class="hgscene">${HG_TABLE}<div class="it ${catUnder?'on':'under'}">🧸</div><div class="lscat ${catAt}"></div></div>`,
      opts:[{mount:b=>Cat2D.mount(b),ok:who==='cat',wrong:'Это Шарик.'},{html:'<span class="em">🧸</span>',ok:who==='bear',wrong:'Это мишка.'}],rep:q,
      good:`${who==='cat'?'Шарик':'Мишка'} ${qp==='на'?'на столе':'под столом'}.`})}
  const x={kind:'pick',game:'cat',task:`Положи ${t[1]} ${to}`,opts:2,n:at,m:'put',
    async show(){hgtFrame(scene);setPrompt(`Положи ${t[1]} ${to}!`);await wait(400)},
    async ask(){const L=G.ls;const r=await hgSay(`Положи ${t[1]} ${to}!`,{barge:true});
      for(const z of L.box.querySelectorAll('.zone')){const k=z.classList.contains('on')?'on':'under';if(k===want)z.dataset.ok='1';z.onclick=()=>hgtTap(false,k===want,{k,wrong:`Ой, ${k==='on'?'на стол':'под стол'}. А надо ${to}!`})}return r},
    async wrong(ev){const L=G.ls,el=L.box.querySelector('.it');el.className='it '+ev.item.k;await wait(650);L.cat.mood('comfort');await hgSay(ev.item.wrong);el.className='it side';L.cat.mood('calm')},
    async help(act){const L=G.ls;if(act==='easier'||act==='model'){L.box.querySelector('.zone.'+want).classList.add('hint');L.cat.point&&L.cat.point(p==='на'?'up':'right')}
      return hgSay(`Положи ${t[1]} ${to}!`,{barge:true})},
    async praise(){const L=G.ls,el=L.box.querySelector('.it');el.className='it '+want;for(const z of L.box.querySelectorAll('.zone'))z.style.visibility='hidden';L.cat.point&&L.cat.point(null);
      sfx.good();confetti(60);L.cat.mood('praise');await wait(400);await hgSay(`${hgGood()} Что ты сделал? Я положил!`);await hgSay(`${t[2][0].toUpperCase()+t[2].slice(1)} ${at}.`)}};
  return x}
/* ---------- З. Части тела по цепочке: у Шарика → у тебя (камера) → у мамы ---------- */
const HGT_PARTS={нос:{key:'нос',my:'мой нос'},глаз:{key:'глаз',my:'мой глаз'},рот:{key:'рот',my:'мой рот'},ухо:{key:'ухо',my:'моё ухо'},голова:{key:'голова',my:'моя голова'},
  зубы:{key:'улыбка',my:'мои зубы',show:1},усы:{no:1,my:'мои усы',has:'усы',none:'усов'},хвост:{no:1,my:'мой хвост',has:'хвост',none:'хвоста'}};
function hgtChain(lvl){const pool=lvl>=2?Object.keys(HGT_PARTS):['нос','глаз','рот','ухо','зубы','хвост'],t=fresh(()=>pick(pool),x=>'hgc'+x),P=HGT_PARTS[t];
  const pl=['зубы','усы','очки'].includes(t);
  const x1=P.show?{kind:'gest',game:'cat',task:'Смотри: у Шарика зубы',n:t,m:'chain', /* «зубы» Шарик показывает сам, Льву нажимать не нужно */
      async show(){hgtFrame();setPrompt('Где у Шарика зубы?');G.ls.cat.teeth(true);await wait(300)},ask:()=>hgSay('Смотри: вот мои зубы!'),async wrong(){},help:()=>hgSay('Вот мои зубы!'),async praise(){}}
    :{kind:'pick',game:'cat',task:`Где у Шарика ${t}?`,opts:0,n:t,m:'chain',
      async show(){hgtFrame();setPrompt(`Где у Шарика ${t}?`);await wait(300)},
      async ask(){const L=G.ls;L.cat.onPart(p=>{if(p)hgtTap(false,p===t,{p,wrong:`Это ${p}. Где у меня ${t}?`})});return hgSay(`Где у меня ${t}? Покажи!`,{barge:true})},
      async wrong(ev){G.ls.cat.mood('comfort');await hgSay(ev.item.wrong);G.ls.cat.mood('calm')},
      async help(act){const L=G.ls;if(act==='model'||act==='easier'){const pz={нос:'nose',глаз:'eye',рот:'mouth',ухо:'ear',голова:'head'}[t];if(pz)L.cat.pose(pz);else L.cat.wave()}return hgSay(`Где у меня ${t}?`,{barge:true})},
      async praise(){const L=G.ls;sfx.good();confetti(50);L.cat.pose(null).mood('praise');await hgSay(`${hgGood()} Это ${P.my}.`)}};
  if(P.show)x1.auto=true;
  let x2;
  if(P.no){const q=hgOrQ('hgcq','да','нет',(a,b)=>`А у тебя есть ${P.has}? ${a[0].toUpperCase()+a.slice(1)} или ${b}?`);
    x2=hgtPick({q,prompt:`А у тебя есть ${P.has}?`,n:'нет '+P.none,m:'chain',keep:true,opts:hgAlt('hgcno',{html:'ДА',cls:'txt yes',ok:false,wrong:'Посмотри на себя!'},{html:'НЕТ',cls:'txt no',ok:true}),rep:q,
      model:async L=>{L.cat.shake();return hgSay(q,{barge:true})},done:async()=>hgSay(`Нет! У тебя нет ${P.none}.`)})}
  else x2=hgtGest({task:`А у тебя где ${t}?`,prompt:`А у тебя где ${t}?`,n:t,m:'chain',key:P.key,q:pl?`А у тебя где ${t}? Покажи!`:`А у тебя где ${t}? Покажи на себе!`,rep:`Где твой ${t}?`.replace('твой зубы','твои зубы').replace('твой голова','твоя голова').replace('твой ухо','твоё ухо'),
    setup:L=>{if(P.show)L.cat.teeth(true)},model:async L=>{const pz={нос:'nose',глаз:'eye',рот:'mouth',ухо:'ear',голова:'head'}[t];if(pz)L.cat.pose(pz);return hgSay(`Смотри, вот ${P.my}! А у тебя?`,{barge:true})},good:`Вот ${t}!`});
  const x3=P.no?null:{kind:'mom',game:'cat',task:`А у мамы где ${t}?`,n:t,m:'chain',
    async show(){hgtFrame();setPrompt(`А у мамы где ${t}?`);G.ls.box.querySelector('.lsmom').textContent='Показал ✓';if(P.show)G.ls.cat.teeth(true);await wait(300)},
    ask:()=>hgSay(`А у мамы где ${t}? Покажи!`,{barge:true}),async wrong(){},help:()=>hgSay(`Где у мамы ${t}?`,{barge:true}),
    async praise(){sfx.good();confetti(40);G.ls.cat.mood('praise');await hgSay(`${hgGood()} Вот у мамы ${t}!`)}};
  return [x1,x2,x3]}
/* ---------- И. «Какой?» — цвет, мужской род ---------- */
const HGT_COL=[['красный','#e8423b','#b8302a'],['синий','#2d7fd8','#1f5ea6'],['зелёный','#4dbb3f','#358a2b'],['жёлтый','#ffcd1c','#d9a800']];
const HGT_THING={шарф:null,мяч:c=>`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="${c[1]}" stroke="#24324a" stroke-width="4"/><path d="M14 40q36 16 72 0M14 60q36-16 72 0" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/></svg>`,
  дом:c=>`<svg viewBox="0 0 100 100"><path d="M10 48L50 12l40 36" fill="${c[2]}" stroke="#24324a" stroke-width="4" stroke-linejoin="round"/><rect x="20" y="46" width="60" height="46" fill="${c[1]}" stroke="#24324a" stroke-width="4"/><rect x="42" y="64" width="16" height="28" fill="#fff" stroke="#24324a" stroke-width="3"/></svg>`};
function hgtColor(lvl){const P=HGT_COL.slice(0,lvl>=2?4:3),t=fresh(()=>pick(P),x=>'hgcol'+x[0]);let o;do{o=pick(P)}while(o===t);
  const th=pick(lvl>=2?['шарф','мяч','дом']:['шарф','мяч']),q=hgOrQ('hgcolq',t[0],o[0],(a,b)=>`Какой ${th}? ${a[0].toUpperCase()+a.slice(1)} или ${b}?`);
  const top=th==='шарф'?'<div class="lscat"></div>':`<div class="hgtop"><div class="lscat"></div><div class="hgobj">${HGT_THING[th](t)}</div></div>`;
  const card=c=>({html:`<div class="dot" style="background:${c[1]}"></div><span class="wd">${c[0]}</span>`,ok:c===t,wrong:`Это ${c[0]}. ${q}`});
  return hgtPick({q,prompt:`Какой ${th}?`,n:t[0]+' '+th,m:'color',top,opts:[card(t),card(o)],setup:L=>{if(th==='шарф')L.cat.scarfColor(t[1],t[2]);else L.cat.point&&L.cat.point('right')},
    rep:q,model:async L=>hgSay(`Смотри: ${th} ${t[0]}. ${q}`,{barge:true}),good:`${t[0][0].toUpperCase()+t[0].slice(1)} ${th}.`})}
/* ---------- К. Ритмические ряды за героем ---------- */
const HGT_RH=['Мак — дым.','Дом — фен.','Ком — бак.','Ель — мёд.','Лук — сыр.','Деда — баба.','Муха — сова.','Ляля — киса.','Катя — Ваня.','Дядя — тётя.'];
function hgtRhythm(){const r=fresh(()=>pick(HGT_RH),x=>'hgr'+x);
  return hgtVoice({task:'Повтори за Шариком: '+r,prompt:r.replace('.',''),n:r.replace('.',''),m:'rhythm',top:'<div class="lscat" style="max-width:340px"></div>',
    setup:L=>{L.cel.innerHTML='';L.cat=Cat2D.mount(L.cel,{view:'face'});L.cel.classList.add('is3d');L.cel._s3=L.cat},
    ask:async L=>{const a=await hgSay('Смотри на меня! '+r,{barge:false});if(a==='gone')return a;await wait(300);return hgSay('Теперь ты!',{barge:true})},rep:r+' Теперь ты!',
    model:async L=>{const a=await hgSay(r);if(a==='gone')return a;return hgSay('Теперь ты!',{barge:true})},
    done:async()=>hgSay(pick(['Здорово!','Ух ты!','Я тебя слышу!'])+' '+r)})}
/* ---------- Л. Привет и пока ---------- */
function hgtHello(bye){const cam=S.mirrBody!==false?'помаши':null;
  return hgtVoice({task:bye?'Пока! Помаши Шарику':'Привет! Помаши Шарику',prompt:bye?'Пока!':'Привет!',n:bye?'пока':'привет',m:'hello',cam,
    ask:L=>{L.cat.mood('invite');L.cat.wave();return hgSay(bye?'Пока-пока! Помаши мне!':`Привет, ${S.name||'Лев'}! Помаши мне!`,{barge:true})},rep:bye?'Пока! Помаши мне!':'Привет! Помаши мне!',
    model:async L=>{L.cat.wave();return hgSay(bye?'Смотри: пока-пока!':'Смотри: привет!',{barge:true})},
    done:async(L,ev)=>hgSay(ev&&ev.type==='camera'?(bye?'Пока! Ты мне помахал!':'Привет! Ты мне помахал!'):(bye?'Пока-пока!':'Привет! Я тебя слышу!'))})}
/* ---------- М. Перерыв-награда: без задания ---------- */
async function hgtRest(){const R=G.round,mine=G;const dead=()=>R.dead||G!==mine||G.round!==R;
  setPrompt('Поиграй с Шариком!');const st=$('#stage');stageAnim&&stageAnim();
  st.innerHTML=`<div class="ls"><div class="hgtop"><div class="lscat"></div><div class="hgspoon" style="right:6%;bottom:4%">🎾</div></div><div class="lsbar"><button class="big-btn lsnext">Дальше ›</button></div></div>`;
  const cel=st.querySelector('.lscat'),cat=hgCat(cel),ball=st.querySelector('.hgspoon');let n=0,fin;const end=new Promise(r=>fin=r);
  const purr=()=>{for(let i=0;i<5;i++)tone(70+(i%2)*8,i*.12,.11,'sawtooth',.06)};
  const touch=async kind=>{if(dead())return;n++;
    if(kind==='ball'){ball.style.transition='right .5s,bottom .5s';ball.style.right='44%';ball.style.bottom='60%';cat.jump();sfx.pop();await wait(500);ball.style.right='6%';ball.style.bottom='4%';cat.mood('praise');say0('Поймал!')}
    else if(kind==='живот'){cat.mood('praise');sfx.pop();say0('Хи-хи! Щекотно!')}
    else{cat.mood('calm');purr();say0('Мур-мур!')}
    if(n>=4)setTimeout(fin,1500)};
  cat.onPart(p=>touch(p==='живот'?'живот':'pet'));ball.onclick=()=>{ac();touch('ball')};st.querySelector('.lsnext').onclick=()=>{ac();fin()};
  cat.mood('invite');await say0('Перерыв! Погладь меня, пощекочи или брось мяч!');
  await Promise.race([end,wait(25000)]);if(dead())return;stopVoice();
  return roundDone(true,{m:'rest',n:'перерыв',how:n?'tap':'none'})}
/* ---------- запуск вида задания из catRound ---------- */
const HGT={dress:l=>[hgtDress(l)],hide:l=>[hgtHide(l)],big:l=>[hgtBig(l)],feed:l=>[hgtFeed(l)],yaty:()=>hgtYaty(),yesno:l=>hgtYesNo(l),put:l=>[hgtPut(l)],chain:l=>hgtChain(l),
  color:l=>[hgtColor(l)],rhythm:()=>[hgtRhythm()],hello:()=>[hgtHello(false)],bye:()=>[hgtHello(true)]};
async function hgtRound(mode,lvl){if(mode==='rest')return hgtRest();const xs=HGT[mode](lvl);
  return hgtRun(xs,{m:mode==='bye'?'hello':mode,n:xs[0]&&xs[0].n})}
/* ---------- выключатели видов заданий в «Для взрослых» (этот файл грузится после 8-parent.js) ---------- */
{const box=$('#hg-kinds');if(box){const all=Object.assign({},HG_OLD,Object.fromEntries(Object.entries(HGT_KINDS).map(([k,v])=>[k,v[0]+(v[1]>1?' — со 2 уровня':'')])));
  box.innerHTML=Object.entries(all).map(([k,t])=>`<div class="row"><label for="set-hgk-${k}">${t}</label><input type="checkbox" id="set-hgk-${k}"></div>`).join('');
  for(const k in all)$('#set-hgk-'+k).onchange=e=>{S.hgK=Object.assign({},S.hgK,{[k]:e.target.checked});save()};
  const s0=shSync;shSync=function(){s0.apply(this,arguments);for(const k in all){const e=$('#set-hgk-'+k);if(e)e.checked=hgK(k)}}}}
window.__hgt={HGT,hgKinds,hgK};
