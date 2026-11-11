/* «Речка»: «Занятие с Шариком» — ИИ‑Шарик (сервер cloud/sharik) и таблица игр ROUNDS.
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v31: «Занятие с Шариком» — ИИ‑Шарик ведёт занятие (сервер cloud/sharik, docs/ai-sharik)
   После каждого задания приложение сообщает серверу результат, сервер (Claude) отвечает репликой Шарика и следующей
   игрой. Без интернета или при ошибке сервера Шарик хвалит сам и игры выбираются по кругу — занятие не прерывается. */
const SH_CSS=`
#btn-sharik{width:100%;background:linear-gradient(135deg,#dff1ff,#e9e3ff);box-shadow:0 6px 0 #c6c9f0}
.shg{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
.shg .shdog{width:min(62%,280px)}
.shg .shdog svg{width:100%;height:auto}
.shg .shbub{position:relative;background:#fff;border-radius:24px;padding:16px 20px;font-family:var(--display);font-size:clamp(22px,6vw,32px);text-align:center;box-shadow:0 6px 0 var(--line);max-width:92%;min-height:1.4em}
.shg .shbub:empty{visibility:hidden}
.shg .shbub::after{content:'';position:absolute;left:50%;top:-14px;margin-left:-14px;border:14px solid transparent;border-top:0;border-bottom-color:#fff}
.shg .shdog.talk{animation:shtalk .5s ease-in-out infinite}
@keyframes shtalk{50%{transform:translateY(-6px) rotate(-2deg)}}
#game.sharik .dots{display:none}
.shg .shear{display:flex;align-items:center;gap:10px;height:44px;opacity:0;transition:opacity .3s}
.shg .shear.on{opacity:1}
.shg .shear svg{width:36px;height:36px}
.shg .shear .lv{width:110px;height:12px;border-radius:6px;background:#e7e3f7;overflow:hidden}
.shg .shear .lv i{display:block;height:100%;width:0;background:#7b61ff;border-radius:6px;transition:width .08s}
.shg .shear .lv i.on{background:#3cbf7a}
.shg .shdog.hop{animation:shhop .6s ease-out}
@keyframes shhop{30%{transform:translateY(-26px) scale(1.04)}60%{transform:translateY(0) scale(.98)}}
.shg .shheard{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:13px;color:#8a8fa3;padding:0 12px}
.shg .shheard:empty{display:none}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+SH_CSS+'</style>');
const SH_LOCAL=['body','mirr','verb','color','size','prep','feed','snd','yn','ib','dress','bal'];
function shOn(){return !!(S.shOn&&S.shUrl)}
function shAvail(){return [...document.querySelectorAll('.tile[data-game]')].filter(t=>!t.hidden).map(t=>t.dataset.game)}
async function shAsk(ev){if(window.__shSim)return window.__shSim(ev);
  const body={child:{name:S.name||'Лев'},minutes:(Date.now()-G.t0)/60000,plannedMinutes:+S.shMin||20,levels:S.lvl,available:shAvail(),history:(G.shHist||[]).slice(-12),event:ev};
  if(G.shMem===undefined)G.shMem=shMemory();if(G.shMem)body.memory=G.shMem;
  try{const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),9000);
    const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/sharik',{method:'POST',headers:{'Content-Type':'application/json','X-Sharik-Code':S.shCode||''},body:JSON.stringify(body),signal:ctl.signal});
    clearTimeout(tm);if(r.ok){const j=await r.json();if(j&&typeof j.say==='string'&&j.next)return j}}catch(e){}
  return null}
/* v32: Шарик слушает Льва после своей реплики. Засчитывается сама попытка (голос громче порога), слова не оцениваются.
   Распознавание (по желанию мамы) — только подсказка ей внизу экрана и поле heard для сервера. */
const SHV={wait:3000,max:6000,tail:800,stt:5000}; // сколько ждать голос, максимум слушать, тишина после голоса, ожидание распознавания (мс)
function shVoiceOn(){return S.shVoice!==false&&(MICX!==false||!!window.__shVoiceSim)}
async function shListen(st,mine){
  if(window.__shVoiceSim){const r=await window.__shVoiceSim();if(r&&S.shStt)r.heard=await shStt(new Float32Array(16000));return r}
  if(!await VM.start())return null;
  if(G!==mine){VM.stop();return null}
  VM.mute=performance.now()+300;
  const ear=st.querySelector('.shear');const bar=ear&&ear.querySelector('.lv i');if(ear)ear.classList.add('on');
  const r=await new Promise(res=>{let first=-1,lastEnd=-1,ms=0,skip=false;const t0=performance.now();
    const det=segDetector(t=>{if(first<0)first=t},(d,t)=>{ms+=d;lastEnd=t});
    st.onclick=()=>{skip=true};
    const safe=setTimeout(()=>{VM.cb=null;res(null)},SHV.max+2000); /* микрофон замолчал или ушли из занятия */
    VM.cb=(v,t)=>{const on=det(v,t);if(bar){bar.style.width=Math.min(100,v/vthr()*50)+'%';bar.classList.toggle('on',on>=0)}
      const done=G!==mine||skip||(first<0&&t-t0>SHV.wait)||(on<0&&lastEnd>0&&t-lastEnd>SHV.tail)||t-t0>SHV.max;
      if(!done)return;VM.cb=null;clearTimeout(safe);if(on>=0)ms+=on; /* голос ещё звучит — добавить текущий кусок */
      res(first<0||G!==mine?null:{ms:Math.round(ms),span:Math.round(t-first+250)})}});
  st.onclick=null;if(ear)ear.classList.remove('on');
  let clip=null;if(r&&S.shStt)clip=VM.clip(Math.min(SHV.max,r.span+300));
  VM.stop();
  if(r&&clip&&clip.length>1000)r.heard=await shStt(clip);
  return r}
async function shStt(f32){if(window.__shSttSim)return window.__shSttSim();
  try{const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),SHV.stt);
    const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/stt',{method:'POST',headers:{'Content-Type':'audio/wav','X-Sharik-Code':S.shCode||''},body:wavBlob(f32,VM.sr),signal:ctl.signal});
    clearTimeout(tm);if(r.ok){const j=await r.json();if(j&&typeof j.text==='string')return j.text.slice(0,80)}}catch(e){}
  return ''}
/* v34: память между занятиями. Сводка за 7 дней считается здесь, на телефоне, по журналу S.log (до начала этого
   занятия) и уходит на сервер вместе с запросом; сервер её не хранит. Выключатель в «Для взрослых». */
function shMemory(now=Date.now()){
  if(S.shMem===false)return null;
  const from=now-7*864e5,t0=(G&&G.t0)||now;
  const L=(S.log||[]).filter(x=>x&&x.t>=from&&x.t<t0&&ROUNDS[x.g]&&x.g!=='voice');if(!L.length)return null;
  const dayN=t=>Math.floor((new Date(t).setHours(0,0,0,0))/864e5),today=dayN(now);
  const miss=x=>!x.ok||(typeof x.w==='number'&&x.w>0);
  const item=x=>{const v=typeof x.n==='string'||typeof x.n==='number'?x.n:typeof x.c==='string'?x.c:null;return v===null?null:String(v).slice(0,24)};
  const byG={},byI={};
  for(const x of L){const g=byG[x.g]||(byG[x.g]={game:x.g,rounds:0,first:0,lvFrom:x.l||1,lvNow:S.lvl[x.g]||x.l||1});g.rounds++;if(!miss(x))g.first++;
    const it=item(x);if(it!==null){const k=x.g+'|'+it;(byI[k]||(byI[k]={game:x.g,item:it,a:[]})).a.push({t:x.t,m:miss(x)})}}
  const hard=[],better=[];
  for(const k in byI){const I=byI[k],m=I.a.filter(a=>a.m);if(!m.length)continue;
    const last2=I.a.slice(-2);const lastMiss=m[m.length-1].t;
    if(I.a.length>=3&&last2.length===2&&last2.every(a=>!a.m)&&m.length>=1)better.push({game:I.game,item:I.item,daysAgo:today-dayN(I.a[I.a.length-1].t)});
    else if(m.length>=2&&m.length/I.a.length>=.4)hard.push({game:I.game,item:I.item,tries:I.a.length,misses:m.length,daysAgo:today-dayN(lastMiss)})}
  hard.sort((a,b)=>a.daysAgo-b.daysAgo||b.misses-a.misses);better.sort((a,b)=>a.daysAgo-b.daysAgo);
  const games=Object.values(byG).sort((a,b)=>b.rounds-a.rounds).slice(0,8);
  return {days:new Set(L.map(x=>dayN(x.t))).size,lastDaysAgo:today-dayN(L[L.length-1].t),games,hard:hard.slice(0,4),better:better.slice(0,3)}}
function shPickLocal(){const av=new Set(shAvail());const L=SH_LOCAL.filter(g=>av.has(g)&&ROUNDS[g]&&g!==G.game);return pick(L.length?L:SH_LOCAL.filter(g=>ROUNDS[g]))}
/* экран Шарика между заданиями: говорит и решает, что дальше. Возвращает false, если занятие закончилось */
async function shStep(){
  const first=!G.shStarted;G.shStarted=true;const mine=G;
  let ev;
  if(first)ev={type:'start'};
  else{const last=[...S.log].reverse().find(x=>x.t>=G.t0)||{};ev={type:'result',game:last.g,task:G.shTask||'',ok:!!last.ok,attempts:(last.w||0)+1,how:last.how==='camera'?'camera':last.how==='parent'?'parent':'tap'};
    G.shHist.push({who:'event',text:`${last.g||''}: ${G.shTask||''} — ${last.ok?'справился':'не справился'}${last.w?`, ошибок ${last.w}`:''}`})}
  const min=(Date.now()-G.t0)/60000;if(!first&&min>(+S.shMin||20)+5)ev={type:'parent_end'};
  $('#prompt').textContent='Шарик';const st=$('#stage');
  st.innerHTML=`<div class="shg"><div class="shdog">${DOG_SVG}</div><div class="shbub"></div><div class="shear" aria-hidden="true">${EAR}<span class="lv"><i></i></span></div><div class="shheard"></div></div>`;
  const dog=st.querySelector('.shdog'),bub=st.querySelector('.shbub'),heard=st.querySelector('.shheard');
  sh3(dog);const h3=()=>s3(dog); /* объёмный Шарик: эмоция по tone ответа, рот — пока звучит речь */
  let j=await shAsk(ev);if(G!==mine)return false;
  if(!j)j={say:ev.type==='start'?`Привет, ${S.name||'Лев'}! Я Шарик. Давай играть!`:ev.type==='parent_end'?'Ты молодец! Пока-пока!':pick(PRAISE)+' Играем дальше!',next:{kind:ev.type==='parent_end'?'end':'game',game:null,level:null},local:true};
  for(let nv=0;;nv++){
    G.shHist.push({who:'sharik',text:j.say});bub.textContent=j.say;dog.classList.add('talk');
    if(h3())h3().mood(['praise','invite','comfort','calm'].includes(j.tone)?j.tone:'calm').talk(true);
    await say(j.say);dog.classList.remove('talk');if(h3())h3().talk(false);if(G!==mine)return false;
    /* после реплики Шарик слушает (не больше двух раз подряд, не на паузе и не в конце) */
    if(nv>=2||j.next.kind==='end'||j.next.kind==='wait'||!shVoiceOn())break;
    if(h3())h3().mood('listen');
    const v=await shListen(st,mine);if(G!==mine)return false;
    if(h3())h3().mood(v?'praise':'calm');
    if(!v)break;
    /* мгновенная похвала за попытку — до ответа сервера */
    sfx.good();if(!h3()){dog.classList.remove('hop');void dog.offsetWidth;dog.classList.add('hop')}confetti(30);
    if(v.heard)heard.textContent='Маме: слышно «'+v.heard+'» (не оценивается)';
    const plan=j.next;G.shVoiceN=(G.shVoiceN||0)+1;
    G.shHist.push({who:'event',text:`Лев попытался сказать (голос ${(v.ms/1000).toFixed(1)} с)${v.heard?`, слышно «${v.heard}»`:''}`});
    const ve={type:'voice',voiceMs:v.ms};if(plan.game)ve.game=plan.game;if(v.heard)ve.heard=v.heard;
    let j2=await shAsk(ve);if(G!==mine)return false;
    if(!j2)j2={say:pick(['Ух ты! Как здорово!','Ура! Ты сказал!','Как громко! Молодец!']),next:plan,local:true};
    if((j2.next.kind==='game'||j2.next.kind==='break')&&!j2.next.game&&plan.game)j2.next={...j2.next,game:plan.game,level:j2.next.level??plan.level};
    j=j2}
  const k=j.next.kind;
  if(k==='end'){await wait(400);if(G===mine)finish();return false}
  if(k==='wait'){bub.insertAdjacentHTML('afterend','<button class="big-btn shgo">Продолжить ›</button>');
    await new Promise(r=>st.querySelector('.shgo').onclick=()=>{ac();r()});if(G!==mine)return false}
  const av=new Set(shAvail());let g=j.next.game&&ROUNDS[j.next.game]&&av.has(j.next.game)?j.next.game:shPickLocal();
  if(j.next.level&&MAXL[g]){const cur=S.lvl[g]||1;const want=Math.min(MAXL[g],Math.max(1,j.next.level|0));if(Math.abs(want-cur)<=1)S.lvl[g]=want}
  G.game=g;G.shTask=GN[g]||g;await wait(300);return G===mine}
function startSharik(){ac();G={t0:Date.now(),game:null,i:0,results:[],seen:new Set(),sharik:true,max:200,shHist:[]};
  $('#game').classList.remove('withnext');$('#game').classList.add('sharik');show('game');renderDots();nextRound()}
/* настройки в разделе для взрослых */
function shSync(){const q=id=>$('#'+id);if(!q('set-shon'))return;q('set-shon').checked=!!S.shOn;q('set-shurl').value=S.shUrl||'';q('set-shcode').value=S.shCode||'';q('set-shmin').value=S.shMin||20;q('set-shvoice').checked=S.shVoice!==false;q('set-shstt').checked=!!S.shStt;q('set-sh3d').checked=S.sh3d!==false;q('set-shmem').checked=S.shMem!==false;q('set-mirrbody').checked=S.mirrBody!==false}


