/* «Речка»: «Занятие с Шариком» — ИИ‑Шарик (сервер cloud/sharik) и таблица игр ROUNDS.
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v31: «Занятие с Шариком» — ИИ‑Шарик ведёт занятие (сервер cloud/sharik, docs/ai-sharik)
   v41: Шарик — ведущий ВНУТРИ задания. Он всё занятие на экране (внизу, #shc): сам задаёт вопрос игры, сразу
   радуется верному ответу и сочувствует ошибке — без сервера и без ожидания. Серверу результат уходит в фоне
   (с настоящим текстом задания); ответ — короткий переход и следующая игра. Не успел ответ — занятие идёт дальше.
   Крупно Шарик выходит только поговорить один на один: приветствие, его вопрос Льву, перерыв, прощание.
   Без интернета или при ошибке сервера игры выбираются на телефоне — занятие не прерывается. */
const SH_CSS=`
#btn-sharik{width:100%;background:linear-gradient(135deg,#dff1ff,#e9e3ff);box-shadow:0 6px 0 #c6c9f0}
#game.sharik .dots{display:none}
#shc{display:none}
#game.sharik #shc{display:flex;flex:none;align-items:center;gap:14px;height:128px;position:relative;transition:height .25s}
#game.sharik #shc.own{display:none}
#shc .shdog{flex:none;width:116px;height:128px}
#shc .shdog svg{width:100%;height:100%}
#shc .shdog.is3d>svg{display:none}
#shc .shdog.is3d.talk{animation:none}
#shc .shbub{position:relative;flex:1;min-width:0;background:#fff;border-radius:20px;padding:10px 14px;font-family:var(--display);font-size:clamp(16px,4.2vw,22px);line-height:1.15;text-align:center;box-shadow:0 5px 0 var(--line);max-height:96px;overflow:hidden}
#shc .shbub:empty{visibility:hidden}
#shc .shbub::after{content:'';position:absolute;left:-11px;top:50%;margin-top:-10px;border:10px solid transparent;border-left:0;border-right-color:#fff}
#shc .shdog.talk{animation:shtalk .5s ease-in-out infinite}
@keyframes shtalk{50%{transform:translateY(-6px) rotate(-2deg)}}
#shc .shear{display:none;align-items:center;gap:10px;height:44px;opacity:0;transition:opacity .3s}
#shc .shear.on{opacity:1}
#shc .shear svg{width:36px;height:36px}
#shc .shear .lv{width:110px;height:12px;border-radius:6px;background:#e7e3f7;overflow:hidden}
#shc .shear .lv i{display:block;height:100%;width:0;background:#7b61ff;border-radius:6px;transition:width .08s}
#shc .shear .lv i.on{background:#3cbf7a}
#shc .shbub.think{visibility:visible!important}
#shc .shbub .thd{display:inline-flex;gap:10px;align-items:center;height:1em}
#shc .shbub .thd i{width:12px;height:12px;border-radius:50%;background:#7b61ff;opacity:.35;animation:shdot 1.2s ease-in-out infinite}
#shc .shbub .thd i:nth-child(2){animation-delay:.2s}#shc .shbub .thd i:nth-child(3){animation-delay:.4s}
@keyframes shdot{40%{opacity:1;transform:translateY(-6px)}}
#shc .shdog.think:not(.is3d){animation:shthink 2.4s ease-in-out infinite}
@keyframes shthink{50%{transform:rotate(-6deg) translateY(-3px)}}
#shc .shdog.hop{animation:shhop .6s ease-out}
@keyframes shhop{30%{transform:translateY(-26px) scale(1.04)}60%{transform:translateY(0) scale(.98)}}
#shc .shheard{position:absolute;left:0;right:0;bottom:-8px;text-align:center;font-size:13px;color:#8a8fa3;padding:0 12px}
#shc .shheard:empty{display:none}
/* разговор один на один: Шарик крупно, задание скрыто */
#game.sharik.shbig .stage{display:none}
#game.sharik.shbig #shc{flex:1;height:auto;min-height:0;flex-direction:column;justify-content:center;gap:16px}
#game.sharik.shbig #shc .shdog{width:min(62%,280px);height:auto}
#game.sharik.shbig #shc .shdog.is3d{width:min(80%,340px);aspect-ratio:10/11}
#game.sharik.shbig #shc .shbub{flex:none;max-width:92%;max-height:none;padding:16px 20px;font-size:clamp(22px,6vw,32px);border-radius:24px;min-height:1.4em}
#game.sharik.shbig #shc .shbub::after{left:50%;top:-14px;margin:0 0 0 -14px;border:14px solid transparent;border-top:0;border-bottom-color:#fff}
#game.sharik.shbig #shc .shear{display:flex}
#game.sharik.shbig #shc .shheard{bottom:6px}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+SH_CSS+'</style>');
const SH_LOCAL=['body','mirr','verb','color','size','prep','feed','snd','yn','ib','dress','bal'];
function shOn(){return !!(S.shOn&&S.shUrl)}
function shAvail(){return [...document.querySelectorAll('.tile[data-game]')].filter(t=>!t.hidden).map(t=>t.dataset.game)}
/* v40: запросы занятия отменяются при выходе домой и при новом занятии; поздние ответы не используются (G!==mine) */
let SH_CTL=new AbortController();
function shAbort(){try{SH_CTL.abort()}catch(e){}SH_CTL=new AbortController()}
/* сигнал запроса: тайм-аут ms или отмена занятия — что раньше */
function shSignal(ms){const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),ms),own=SH_CTL.signal;
  if(own.aborted)ctl.abort();else own.addEventListener('abort',()=>ctl.abort(),{once:true});return {signal:ctl.signal,done:()=>clearTimeout(tm)}}
const SH_WAIT=9000; /* сколько приложение ждёт ответа /sharik (сервер сдаётся раньше — через ~6,5 с — и присылает запасную реплику) */
async function shAsk(ev){if(window.__shSim){const own=SH_CTL.signal,j=await window.__shSim(ev);return own.aborted?null:j}
  const body={child:{name:S.name||'Лев'},minutes:(Date.now()-G.t0)/60000,plannedMinutes:+S.shMin||20,levels:S.lvl,available:shAvail(),history:(G.shHist||[]).slice(-12),event:ev};
  if(G.shMem===undefined)G.shMem=shMemory();if(G.shMem)body.memory=G.shMem;
  const q=shSignal(SH_WAIT);
  try{const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/sharik',{method:'POST',headers:{'Content-Type':'application/json','X-Sharik-Code':S.shCode||''},body:JSON.stringify(body),signal:q.signal});
    if(r.ok){const j=await r.json();if(j&&typeof j.say==='string'&&j.next)return j}}catch(e){}finally{q.done()}
  return null}
/* Шарик думает, пока ждёт ответ: «…» в облачке, объёмный — наклон головы, глаза вверх, лапа у подбородка */
function shThink(dog,bub,on){bub.classList.toggle('think',on);dog.classList.toggle('think',on);if(on)bub.innerHTML='<span class="thd" aria-label="Шарик думает"><i></i><i></i><i></i></span>';
  const h=s3(dog);if(h&&on)h.mood('think');else if(on)sh3Ready(dog).then(x=>{if(x&&dog.classList.contains('think'))x.mood('think')})}
function sh3Ready(el){return el._s3p||Promise.resolve(s3(el))}
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
  const q=shSignal(SHV.stt);
  try{const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/stt',{method:'POST',headers:{'Content-Type':'audio/wav','X-Sharik-Code':S.shCode||''},body:wavBlob(f32,VM.sr),signal:q.signal});
    if(r.ok){const j=await r.json();if(j&&typeof j.text==='string')return j.text.slice(0,80)}}catch(e){}finally{q.done()}
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
/* v37: живой голос Шарика — облачный синтез через свой сервер (/tts, тот же семейный код).
   Записи мамы главнее; нет ответа за SHT.wait мс, ошибка или нет интернета — голос телефона, как раньше.
   Объёмный Шарик открывает рот, только когда звук действительно зазвучал, и по его громкости (AnalyserNode);
   конец, ошибка, остановка (stopVoice) или уход с экрана — рот закрыт. Слушать Льва — только после конца звука. */
const SHT={wait:3500,tick:50,gain:5}; // ждать сервер (мс), как часто мерить громкость (мс), чувствительность рта
const SH_HOW=[]; /* чем говорил Шарик последние разы: tts:ok / tts:stop / phone / mom (для проверки) */
const SHT_MEM=new Map(); // фраза → MP3 (пока приложение открыто); на диске — Cache Storage «sharik-tts»
function shTtsOn(){return S.shTts!==false&&shOn()&&!!S.voice&&!(G&&G.shNoTts)}
async function shTtsGet(text,memOnly){ /* memOnly — только то, что уже записано на телефоне (фразы игр): в сеть не ходим */
  if(window.__shTtsSim)return memOnly?null:window.__shTtsSim(text);
  const key=text.trim();if(SHT_MEM.has(key))return SHT_MEM.get(key);
  let cache=null;try{cache=await caches.open('sharik-tts')}catch(e){}
  const req=new Request(location.origin+'/__sharik_tts/'+encodeURIComponent(key).slice(0,1800));
  if(cache){try{const c=await cache.match(req);if(c){const b=await c.blob();SHT_MEM.set(key,b);return b}}catch(e){}}
  if(memOnly)return null;
  const ctl=shSignal(SHT.wait);
  try{const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/tts',{method:'POST',headers:{'Content-Type':'application/json','X-Sharik-Code':S.shCode||''},body:JSON.stringify({text:key}),signal:ctl.signal});
    if(!r.ok||!/audio/.test(r.headers.get('Content-Type')||'')){
      if(r.status===503){try{const j=await r.json();if(j&&j.note==='no_tts'&&G)G.shNoTts=true}catch(e){}} /* на сервере голос не настроен — больше не спрашивать */
      return null}
    const b=await r.blob();if(b.size<200)return null;
    SHT_MEM.set(key,b);if(SHT_MEM.size>80)SHT_MEM.delete(SHT_MEM.keys().next().value);
    if(cache)cache.put(req,new Response(b,{headers:{'Content-Type':'audio/mpeg'}})).catch(()=>{});
    return b}
  catch(e){return null}finally{ctl.done()}}
/* проиграть MP3 Шарика: 'ok' — дослушали, 'stop' — остановили, 'fail' — не заиграло (тогда голос телефона) */
function shPlay(blob,el,onStart){return new Promise(res=>{
  stopVoice();const my=sayGen;const u=URL.createObjectURL(blob);const a=new Audio();a.preload='auto';a.src=u;curAudio=a;
  let an=null,src=null,tm=0,started=false,done=false;const h3=()=>s3(el);
  const fin=r=>{if(done)return;done=true;clearInterval(tm);el.classList.remove('talk');const h=h3();if(h)h.level(0).talk(false);
    try{src&&src.disconnect()}catch(e){}try{URL.revokeObjectURL(u)}catch(e){}if(curAudio===a)curAudio=null;res(started&&r==='fail'?'ok':r)};
  const A=ac();if(A){try{src=A.createMediaElementSource(a);an=A.createAnalyser();an.fftSize=512;src.connect(an);an.connect(A.destination)}catch(e){an=null}}
  const buf=an?new Uint8Array(an.fftSize):null;
  a.onplaying=()=>{if(my!==sayGen||!el.isConnected){a.pause();return}if(started)return;started=true;onStart&&onStart();
    el.classList.add('talk');const h=h3();if(h)h.talk(true);
    if(an)tm=setInterval(()=>{if(my!==sayGen||!el.isConnected){a.pause();return}an.getByteTimeDomainData(buf);let q=0;for(let i=0;i<buf.length;i++){const d=(buf[i]-128)/128;q+=d*d}
      const h=h3();if(h)h.level(Math.min(1,Math.sqrt(q/buf.length)*SHT.gain))},SHT.tick)};
  a.onended=()=>fin('ok');a.onerror=()=>fin('fail');a.onpause=()=>fin(my!==sayGen?'stop':'ok');
  setTimeout(()=>{if(!started)fin('fail')},8000);setTimeout(()=>fin('ok'),60000); /* не заиграло за 8 с — голос телефона; страховка 60 с */
  a.play().catch(()=>fin(my!==sayGen?'stop':'fail'))})}
/* Шарик говорит фразу: записи мамы → облачный голос → голос телефона. Возвращается после настоящего конца звука.
   o.game — фраза самой игры (вопрос, похвала): облачный голос только если он уже записан на телефоне. */
async function shSpeak(text,el,o={}){
  if(!text)return;const h3=()=>s3(el);const t0=!o.game&&G&&G.shT0;let first=false;
  const mark=()=>{if(first||!t0)return;first=true;const ms=Date.now()-t0;G.shT0=0;S.shLat=(S.shLat||[]).concat(ms).slice(-20);save()}; /* задержка до первого звука */
  const how=x=>{if(o.game)return;SH_HOW.push(x);if(SH_HOW.length>20)SH_HOW.splice(0,SH_HOW.length-20)};
  const mom=S.myVoice&&REC.size&&splitParts(text).some(p=>REC.has(nk(p)));
  /* v39: голос по предложениям — готовые фразы («Молодец!») берутся из памяти, синтезируется только новое */
  if(!mom&&shTtsOn()){const my=sayGen;const parts=splitParts(text);const bs=await Promise.all(parts.map(p=>shTtsGet(p,!!o.game)));if(my!==sayGen)return; /* пока ждали — остановили */
    if(bs.length&&bs.every(Boolean)){let r='ok';for(const b of bs){r=await shPlay(b,el,mark);if(r!=='ok')break}how('tts:'+r);if(r!=='fail')return}}
  how(mom?'mom':'phone');
  mark();el.classList.add('talk');if(h3())h3().talk(true);
  try{await say0(text,o.opt||{})}finally{el.classList.remove('talk');if(h3())h3().talk(false)}}
/* v39: заранее скачать голос готовых фраз (список — на сервере, GET /phrases): дальше они звучат с телефона,
   без обращения к сервису голоса и даже без интернета. Хранятся в Cache Storage «sharik-tts» (не стираются при обновлении). */
async function shPhrasesGet(){if(window.__shPhrasesSim)return window.__shPhrasesSim();
  const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(String(S.shUrl).replace(/\/+$/,'')+'/phrases',{headers:{'X-Sharik-Code':S.shCode||''},signal:ctl.signal});
    if(!r.ok)return null;const j=await r.json();return Array.isArray(j.phrases)?j.phrases.filter(x=>typeof x==='string').slice(0,300):null}
  catch(e){return null}finally{clearTimeout(tm)}}
async function shPhrasesDownload(onProgress){
  const L=await shPhrasesGet();if(!L)return {ok:0,all:0,err:'no_list'};
  const name=S.name||'Лев';const all=[...new Set(L.concat(`Привет, ${name}!`,`${name}, смотри!`,`${name}, я тут!`))];
  try{navigator.storage&&navigator.storage.persist&&await navigator.storage.persist()}catch(e){} /* попросить телефон не чистить */
  let ok=0;for(let i=0;i<all.length;i++){const b=await shTtsGet(all[i]);if(b)ok++;onProgress&&onProgress(i+1,all.length,ok)}
  return {ok,all:all.length}}
async function shPhrasesCount(){try{const c=await caches.open('sharik-tts');return (await c.keys()).length}catch(e){return 0}}
function shLatText(){const L=(S.shLat||[]).slice().sort((a,b)=>a-b);if(!L.length)return 'ещё не было занятий';
  return `обычно ${(L[L.length>>1]/1000).toFixed(1)} с, самое долгое ${(L[L.length-1]/1000).toFixed(1)} с (последние ${L.length})`}
/* ---------- v41: Шарик — ведущий внутри задания ---------- */
const SH_OWN=['dog','mirr']; /* в этих играх на экране свой Шарик — нижний прячется */
const SH_GRACE={start:4000,result:2500,slow:700,voice:4000}; /* сколько ждём ответ сервера от момента запроса (мс); дальше — без него */
function shC(){return G&&G.sharik?document.getElementById('shc'):null}
function shDogEl(){const c=shC();return c&&!c.classList.contains('own')?c.querySelector('.shdog'):null}
function shBig(on){$('#game').classList.toggle('shbig',!!on);if(on)$('#prompt').textContent='Шарик'}
/* настроение Шарика-ведущего; back — через сколько мс вернуться к спокойному */
function shMood(m,back){const d=shDogEl();if(!d)return;const h=s3(d);if(h)h.mood(m);else if(m==='praise'){d.classList.remove('hop');void d.offsetWidth;d.classList.add('hop')}
  clearTimeout(shMood.t);if(back)shMood.t=setTimeout(()=>{const x=s3(d);if(x&&d.isConnected)x.mood('calm')},back)}
/* всё, что говорит игра на занятии, говорит Шарик: рот двигается, слова — в облачке */
const say0=say;
say=function(text,opt){const d=shDogEl();
  if(!d||!text||!S.voice||(opt&&Object.keys(opt).length))return say0(text,opt||{});
  noteRecent(text);const b=shC().querySelector('.shbub');const t=text.replace(/\u0301/g,'').trim();b.classList.remove('think');b.textContent=t===$('#prompt').textContent.trim()?'':t; /* вопрос уже написан сверху — в облачке только слова самого Шарика */
  return shSpeak(text,d,{game:true})};
/* мгновенная реакция на ответ Льва: верно — радуется, ошибка — сочувствует (звуки игры остаются прежними) */
{const g0=sfx.good,b0=sfx.bad;sfx.good=function(){shMood('praise',1800);return g0.apply(sfx,arguments)};sfx.bad=function(){shMood('comfort',1800);return b0.apply(sfx,arguments)}}
/* задание закончено (вызывается из roundDone): результат уходит серверу в фоне, занятие не ждёт */
function shFire(e){if(!G||!G.sharik||!e)return;const R=G.round||{};
  let ev={type:'result',game:e.g,task:String(R.prompt||GN[e.g]||e.g||'').slice(0,80),ok:!!e.ok,attempts:(e.w||0)+1,how:e.how==='camera'?'camera':e.how==='parent'?'parent':'tap'};
  if(R.good)ev.good=String(R.good).slice(0,80);
  G.shHist.push({who:'event',text:`${GN[e.g]||e.g||''}: «${ev.task}» — ${e.ok?'справился':'не справился'}${e.w?`, ошибок ${e.w}`:''}${R.good?`. Шарик уже сказал: «${R.good}»`:''}`.slice(0,160)});
  if((Date.now()-G.t0)/60000>(+S.shMin||20)+5)ev={type:'parent_end'};
  G.shEv=ev;G.shT0=G.shPendT=Date.now();G.shPend=shAsk(ev)}
function shWait(p,ms){return Promise.race([p,wait(Math.max(0,ms)).then(()=>undefined)])}
function shPickLocal(){const av=new Set(shAvail());const L=SH_LOCAL.filter(g=>av.has(g)&&ROUNDS[g]&&g!==G.game);return pick(L.length?L:SH_LOCAL.filter(g=>ROUNDS[g]))}
/* шаг между заданиями: переход и выбор следующей игры. Возвращает false, если занятие закончилось */
async function shStep(){
  const mine=G,c=shC();if(!c)return true;
  const dog=c.querySelector('.shdog'),bub=c.querySelector('.shbub'),heard=c.querySelector('.shheard');
  const first=!G.shStarted;G.shStarted=true;
  c.classList.remove('own');if(!s3(dog)){dog.classList.remove('is3d');dog._s3p=sh3(dog)} /* вернуть объёмного Шарика после игры со своим */
  const h3=()=>s3(dog);const think=on=>{shThink(dog,bub,on);if(!on)bub.textContent=''};
  let j=null,ev;
  if(first){ev={type:'start'};shBig(true);G.shT0=Date.now();const t0=Date.now(),p=shAsk(ev);
    /* здоровается сразу, не дожидаясь сервера */
    const hello=`Привет, ${S.name||'Лев'}!`;G.shHist.push({who:'sharik',text:hello});bub.textContent=hello;
    sh3Ready(dog).then(h=>{if(h&&G===mine&&!dog.classList.contains('think'))h.mood('invite')});
    await shSpeak(hello,dog);if(G!==mine)return false;
    think(true);j=await shWait(p,SH_GRACE.start-(Date.now()-t0));if(G!==mine)return false;think(false);
    if(j)j={...j,say:splitParts(j.say).filter(x=>!/^привет/i.test(x)).join(' ')};
    else j={say:'Я Шарик. Давай играть!',next:{kind:'game',game:null,level:null},local:true}}
  else{ev=G.shEv||{type:'result'};const p=G.shPend;G.shPend=null;
    if(p){const tm=setTimeout(()=>{if(G===mine)think(true)},350);
      j=await shWait(p,(G.shMiss>=2?SH_GRACE.slow:SH_GRACE.result)-(Date.now()-G.shPendT));clearTimeout(tm);if(G!==mine)return false;think(false);
      if(j)G.shMiss=0;else{G.shMiss=(G.shMiss||0)+1;p.then(x=>{if(G===mine&&x)G.shLate=x})}} /* опоздавший ответ пригодится для выбора следующей игры */
    if(!j){const end=ev.type==='parent_end',late=G.shLate;G.shLate=null;
      const g=late&&late.next&&late.next.kind!=='end'&&late.next.game||((G.shSame||0)<3?G.game:null);
      j={say:end?'Ты молодец! Пока-пока!':g===G.game?'':'А теперь новая игра!',next:{kind:end?'end':'game',game:g,level:late&&late.next?late.next.level:null},local:true}}}
  const ask1=t=>/\?\s*$/.test(t||''); /* Шарик сам спросил Льва — разговор один на один */
  if(j.say&&(first||j.next.kind==='end'||j.next.kind==='wait'||(ask1(j.say)&&shVoiceOn())))shBig(true);
  for(let nv=0;;nv++){
    if(j.say){G.shHist.push({who:'sharik',text:j.say});bub.textContent=j.say;
      if(h3())h3().mood(['praise','invite','comfort','calm'].includes(j.tone)?j.tone:'calm');
      await shSpeak(j.say,dog);if(G!==mine)return false}
    /* слушает после приветствия и после своего вопроса (не больше двух раз подряд, не на паузе и не в конце) */
    if(nv>=2||!j.say||j.next.kind==='end'||j.next.kind==='wait'||!shVoiceOn()||!((first&&nv===0)||ask1(j.say)))break;
    if(h3())h3().mood('listen');
    const v=await shListen(c,mine);if(G!==mine)return false;
    if(h3())h3().mood(v?'praise':'calm');
    if(!v)break;
    /* мгновенная похвала за попытку — до ответа сервера */
    sfx.good();if(!h3()){dog.classList.remove('hop');void dog.offsetWidth;dog.classList.add('hop')}confetti(30);
    if(v.heard)heard.textContent='Маме: слышно «'+v.heard+'» (не оценивается)';
    const plan=j.next;G.shVoiceN=(G.shVoiceN||0)+1;
    G.shHist.push({who:'event',text:`Лев попытался сказать (голос ${(v.ms/1000).toFixed(1)} с)${v.heard?`, слышно «${v.heard}»`:''}`});
    const ve={type:'voice',voiceMs:v.ms};if(plan.game)ve.game=plan.game;if(v.heard)ve.heard=v.heard;
    think(true);let j2=await shWait(shAsk(ve),SH_GRACE.voice);if(G!==mine)return false;think(false);
    if(!j2)j2={say:pick(['Ух ты! Как здорово!','Ура! Ты сказал!','Как громко! Молодец!']),next:plan,local:true};
    if((j2.next.kind==='game'||j2.next.kind==='break')&&!j2.next.game&&plan.game)j2.next={...j2.next,game:plan.game,level:j2.next.level??plan.level};
    j=j2}
  heard.textContent='';
  const k=j.next.kind;
  if(k==='end'){await wait(400);if(G===mine){shBig(false);finish()}return false}
  if(k==='wait'){shBig(true);c.insertAdjacentHTML('beforeend','<button class="big-btn shgo">Продолжить ›</button>');
    await new Promise(r=>c.querySelector('.shgo').onclick=()=>{ac();r()});const b=c.querySelector('.shgo');if(b)b.remove();if(G!==mine)return false}
  const av=new Set(shAvail());const g=j.next.game&&ROUNDS[j.next.game]&&av.has(j.next.game)?j.next.game:shPickLocal();
  if(j.next.level&&MAXL[g]){const cur=S.lvl[g]||1;const want=Math.min(MAXL[g],Math.max(1,j.next.level|0));if(Math.abs(want-cur)<=1)S.lvl[g]=want}
  G.shSame=g===G.game?(G.shSame||0)+1:1;G.game=g;
  if(h3())h3().mood('calm');
  if($('#game').classList.contains('shbig')){await wait(300);if(G!==mine)return false;shBig(false)}
  c.classList.toggle('own',SH_OWN.includes(g));
  return G===mine}
function startSharik(){ac();shAbort();G={t0:Date.now(),game:null,i:0,results:[],seen:new Set(),sharik:true,max:200,shHist:[]};
  const gm=$('#game');gm.classList.remove('withnext','shbig');gm.classList.add('sharik');
  const old=document.getElementById('shc');if(old)old.remove();$('#stage').innerHTML='';
  gm.insertAdjacentHTML('beforeend',`<div id="shc"><div class="shdog">${DOG_SVG}</div><div class="shbub"></div><div class="shear" aria-hidden="true">${EAR}<span class="lv"><i></i></span></div><div class="shheard"></div></div>`);
  show('game');renderDots();nextRound()}
/* настройки в разделе для взрослых */
function shSync(){const q=id=>$('#'+id);if(!q('set-shon'))return;q('set-shon').checked=!!S.shOn;q('set-shurl').value=S.shUrl||'';q('set-shcode').value=S.shCode||'';q('set-shmin').value=S.shMin||20;q('set-shvoice').checked=S.shVoice!==false;q('set-shstt').checked=!!S.shStt;q('set-sh3d').checked=S.sh3d!==false;q('set-shmem').checked=S.shMem!==false;q('set-mirrbody').checked=S.mirrBody!==false;q('set-shtts').checked=S.shTts!==false;const l=q('sh-lat');if(l)l.textContent=shLatText();const pc=q('sh-phn');if(pc)shPhrasesCount().then(n=>pc.textContent=n?`на телефоне записано фраз: ${n}`:'')}


