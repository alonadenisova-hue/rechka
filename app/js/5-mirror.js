/* «Речка»: «Зеркало с Шариком» — камера (MediaPipe).
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v30: «Зеркало с Шариком» — камера на телефоне (MediaPipe), шаг 1 проекта «ИИ‑Шарик»
   Артикуляционная гимнастика (улыбка, трубочка, «а‑а‑а», щёки, глазки, брови) и «Покажи на себе» (нос, рот, глаз, ухо,
   щёчка, голова). Видео обрабатывается на телефоне и никуда не отправляется. Засчитывается попытка: если поза
   держится ~0,5 с — похвала. Родитель всегда может нажать «Получилось» (и без камеры игра работает с этой кнопкой).
   Пороги — в MIRR_CFG, задания — в MIRR_EX (см. docs/ai-sharik/TASKS.md). */
const MIRR_CFG={hold:450,face:.30,ear:.40,top:.12,hintAfter:9000,okAfter:4000,
  /* v35, тело (в долях ширины плеч): рука у живота/коленки/плеча; помаши — 3 смены направления за 2,5 с; хлопок — руки сошлись 2 раза;
     присядь — угол в колене меньше 115°; смотрит на экран — нос не дальше четверти ширины лица от середины; отвлёкся — 5 с */
  belly:.5,knee:.45,shoulder:.4,waveAmp:.12,waveN:3,waveMs:2500,clapNear:.35,clapFar:.8,clapN:2,squatDeg:115,vis:.3,lookOff:.25,away:5000,farHint:4000};
const MIRR_EX={
  улыбка:{t:'art',say:'Улыбнись широко, как Шарик!',p:'Улыбнись!',ic:'😁',ok:b=>Math.min(b.mouthSmileLeft,b.mouthSmileRight)>.55},
  трубочка:{t:'art',say:'Вытяни губы трубочкой!',p:'Губы трубочкой!',ic:'😗',ok:b=>b.mouthPucker>.6},
  а:{t:'art',say:'Открой рот широко. Скажи: а‑а‑а!',p:'Открой рот: а‑а‑а!',ic:'😮',ok:b=>b.jawOpen>.4},
  щёки:{t:'art',say:'Надуй щёчки, как шарик!',p:'Надуй щёчки!',ic:'🐡',ok:b=>b.cheekPuff>.4},
  глазки:{t:'art',say:'Закрой глазки!',p:'Закрой глазки!',ic:'😌',ok:b=>Math.min(b.eyeBlinkLeft,b.eyeBlinkRight)>.55},
  брови:{t:'art',say:'Удивись! Подними брови!',p:'Удивись!',ic:'😲',ok:b=>b.browInnerUp>.5},
  нос:{t:'pt',say:'Покажи, где твой нос!',p:'Где твой нос?',pt:[1]},
  рот:{t:'pt',say:'Покажи, где твой рот!',p:'Где твой рот?',pt:[13,14]},
  глаз:{t:'pt',say:'Покажи, где твой глаз!',p:'Где твой глаз?',pt:[159,386]},
  ухо:{t:'pt',say:'Покажи, где твоё ушко!',p:'Где твоё ушко?',pt:[234,454],far:1},
  щёчка:{t:'pt',say:'Покажи, где твоя щёчка!',p:'Где твоя щёчка?',pt:[50,280]},
  голова:{t:'pt',say:'Положи руку на голову!',p:'Рука на голове!',top:1},
  /* v35: всё тело и движения (Pose Landmarker) — уровень 4, выключатель «Движения и всё тело» в «Для взрослых» */
  живот:{t:'bp',say:'Покажи, где твой живот!',p:'Где твой живот?',bp:'belly'},
  нога:{t:'bp',say:'Покажи, где твоя нога!',p:'Где твоя нога?',bp:'leg'},
  коленка:{t:'bp',say:'Покажи коленку!',p:'Где коленка?',bp:'knee'},
  плечи:{t:'bp',say:'Положи руки на плечи!',p:'Руки на плечи!',bp:'shoulder'},
  помаши:{t:'mv',say:'Помаши мне ручкой!',p:'Помаши!',ic:'👋',mv:'wave'},
  хлопни:{t:'mv',say:'Хлопни в ладоши!',p:'Хлопни в ладоши!',ic:'👏',mv:'clap'},
  'руки вверх':{t:'mv',say:'Подними руки вверх!',p:'Руки вверх!',ic:'🙌',mv:'up'},
  присядь:{t:'mv',say:'Присядь!',p:'Присядь!',ic:'⬇️',mv:'squat'}};
const MIRR_LV={1:['улыбка','а','трубочка','глазки'],2:['улыбка','а','трубочка','глазки','щёки','брови','нос','рот','голова'],
  3:['нос','рот','глаз','ухо','щёчка','голова','улыбка','трубочка','щёки'],
  4:['живот','нога','коленка','плечи','помаши','хлопни','руки вверх','присядь']};
const MIRR_POSE={улыбка:'smile',трубочка:'tube',а:'open',щёки:'puff',глазки:'eyes',брови:'brows',нос:'nose',рот:'mouth',глаз:'eye',ухо:'ear',щёчка:'cheek',голова:'head'};
MIRR_POSE.живот='belly';MIRR_POSE.нога='leg';MIRR_POSE.коленка='knee';MIRR_POSE.плечи='shoulder';
MIRR_POSE.помаши='wave';MIRR_POSE.хлопни='clap';MIRR_POSE['руки вверх']='armsup';MIRR_POSE.присядь='squat';
const MIRR_GOOD=['Молодец!','Умница!','Вот это да!','Здорово!','Ура!'];
let MP=null,MPP=null;
/* загрузка MediaPipe один раз (из app/vendor/mediapipe, без интернета после первого раза) */
/* MediaPipe пишет служебные строки («INFO: Created TensorFlow Lite…») через console.error — это не ошибки, прячем их */
{const ce=console.error.bind(console);console.error=(...a)=>{if(typeof a[0]==='string'&&/^(INFO:|I\d{4} |W\d{4} )/.test(a[0]))return;ce(...a)}}
function mpLoad(){if(MPP)return MPP;MPP=(async()=>{const v=await import('./vendor/mediapipe/vision_bundle.mjs');
  const fs={wasmLoaderPath:new URL('vendor/mediapipe/wasm/vision_wasm_internal.js',location.href).href,wasmBinaryPath:new URL('vendor/mediapipe/wasm/vision_wasm_internal.wasm',location.href).href};
  const mk=async(C,path,extra)=>{for(const d of ['GPU','CPU']){try{return await C.createFromOptions(fs,Object.assign({baseOptions:{modelAssetPath:path,delegate:d},runningMode:'VIDEO'},extra))}catch(e){if(d==='CPU')throw e}}};
  const face=await mk(v.FaceLandmarker,'vendor/mediapipe/face_landmarker.task',{numFaces:1,outputFaceBlendshapes:true});
  const hand=await mk(v.HandLandmarker,'vendor/mediapipe/hand_landmarker.task',{numHands:2});
  MP={face,hand,v,mk};return MP})().catch(e=>{MPP=null;throw e});return MPP}
/* v35: модель позы (всё тело) — загружается только для заданий «тело и движения» */
async function mpPose(){const M=await mpLoad();if(!M.poseP)M.poseP=M.mk(M.v.PoseLandmarker,'vendor/mediapipe/pose_landmarker_lite.task',{numPoses:1}).then(p=>M.pose=p).catch(e=>{M.poseP=null;throw e});return M.poseP}
/* один кадр → {b: blendshapes, f: точки лица, h: [кончики указательных пальцев]} (или подмена для автотеста) */
function mpFrame(video,t,ex){const sim=window.__mirrSim;if(sim)return typeof sim==='function'?sim(t):sim;if(!MP||!video.videoWidth)return null;
  const r={b:null,f:null,h:[],p:null};const fr=MP.face.detectForVideo(video,t);
  if(fr.faceLandmarks&&fr.faceLandmarks[0]){r.f=fr.faceLandmarks[0];const b={};(fr.faceBlendshapes[0]?.categories||[]).forEach(c=>b[c.categoryName]=c.score);r.b=b}
  /* руки — только для «покажи на себе» по лицу, поза тела — только для заданий тела (меньше работы слабому телефону) */
  if(!ex||ex.t==='pt'){const hr=MP.hand.detectForVideo(video,t);(hr.landmarks||[]).forEach(L=>{r.h.push(L[8],L[12])})}
  if(ex&&(ex.t==='bp'||ex.t==='mv')&&MP.pose){const pr=MP.pose.detectForVideo(video,t);if(pr.landmarks&&pr.landmarks[0])r.p=pr.landmarks[0]}
  return r}
/* смотрит ли на экран: лицо видно и не отвёрнуто (нос близко к середине между краями лица) */
function mirrLook(d){if(!d||!d.f)return false;const F=d.f,w=Math.abs(F[454].x-F[234].x)||.2;return Math.abs(F[1].x-(F[234].x+F[454].x)/2)/w<MIRR_CFG.lookOff}
/* тело: точки позы 0 нос, 11/12 плечи, 13/14 локти, 15/16 запястья, 19/20 указательные, 23/24 бёдра, 25/26 колени, 27/28 лодыжки */
const pv=(P,i)=>P[i]&&(P[i].visibility===undefined||P[i].visibility>=MIRR_CFG.vis)?P[i]:null;
const pd=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function poseSeen(P){return !!(P&&pv(P,11)&&pv(P,12))}
function mirrBody(ex,P,st,now){
  if(!poseSeen(P))return false;const C=MIRR_CFG,sw=pd(P[11],P[12])||.1;
  const hands=[15,16,19,20].map(i=>pv(P,i)).filter(Boolean);
  const near=(T,r)=>T&&hands.some(h=>pd(h,T)<sw*r);
  if(ex.bp==='belly'){const sm={x:(P[11].x+P[12].x)/2,y:(P[11].y+P[12].y)/2};const hm=pv(P,23)&&pv(P,24)?{x:(P[23].x+P[24].x)/2,y:(P[23].y+P[24].y)/2}:{x:sm.x,y:sm.y+sw*1.3};
    return near({x:sm.x+(hm.x-sm.x)*.55,y:sm.y+(hm.y-sm.y)*.55},C.belly)}
  if(ex.bp==='knee')return near(pv(P,25),C.knee)||near(pv(P,26),C.knee);
  if(ex.bp==='leg')return [25,26,27,28].some(i=>near(pv(P,i),C.knee));
  if(ex.bp==='shoulder')return [19,20,15,16].some(i=>{const h=pv(P,i);return h&&(pd(h,P[11])<sw*C.shoulder||pd(h,P[12])<sw*C.shoulder)&&h.y<P[11].y+sw*.3});
  const w1=pv(P,15),w2=pv(P,16);
  if(ex.mv==='up'){const top=Math.min(P[11].y,P[12].y)-sw*.3;return !!(w1&&w2&&w1.y<top&&w2.y<top)}
  if(ex.mv==='clap'){if(st.n>=C.clapN)return true;if(!w1||!w2)return false;const k=pd(w1,w2)/sw;
    if(k>C.clapFar)st.open=true;else if(k<C.clapNear&&st.open){st.open=false;st.n=(st.n||0)+1}return st.n>=C.clapN}
  if(ex.mv==='wave'){if(st.done)return true;
    const w=[[15,13,11],[16,14,12]].map(([a,b,c])=>({h:pv(P,a),e:pv(P,b),s:P[c]})).find(o=>o.h&&o.h.y<(o.e?o.e.y:o.s.y+sw*.5)&&o.h.y<o.s.y+sw*.3);
    if(!w)return false;const x=w.h.x;st.rev=(st.rev||[]).filter(t=>now-t<C.waveMs);
    if(st.ext===undefined){st.ext=x;st.dir=0}
    const dir=x>st.ext?1:-1;if(Math.abs(x-st.ext)>=sw*C.waveAmp){if(st.dir&&dir!==st.dir)st.rev.push(now);st.dir=dir;st.ext=x}
    else if(st.dir&&dir===st.dir&&(dir>0?x>st.ext:x<st.ext))st.ext=x;
    return st.done=st.rev.length>=C.waveN}
  if(ex.mv==='squat'){const ang=(a,b,c)=>{if(!a||!b||!c)return 180;const u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};return Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/((Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y))||1))))*180/Math.PI};
    return Math.min(ang(pv(P,23),pv(P,25),pv(P,27)),ang(pv(P,24),pv(P,26),pv(P,28)))<C.squatDeg}
  return false}
function mirrHit(ex,d,st,now){if(!d)return false;
  if(ex.t==='art')return !!(d.b&&ex.ok(d.b));
  if(ex.t==='bp'||ex.t==='mv')return mirrBody(ex,d.p,st||{},now||performance.now());
  if(!d.f||!d.h.length)return false;const F=d.f,w=Math.hypot(F[234].x-F[454].x,F[234].y-F[454].y)||.2;
  if(ex.top){const top=F[10];return d.h.some(p=>p.y<top.y+w*MIRR_CFG.top&&Math.abs(p.x-top.x)<w*.9)}
  const R=w*(ex.far?MIRR_CFG.ear:MIRR_CFG.face);return d.h.some(p=>ex.pt.some(i=>Math.hypot(p.x-F[i].x,p.y-F[i].y)<R))}
const MIRR_CSS=`
.mirr{height:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.mirr .mv{position:relative;flex:1;min-height:0;width:100%;display:grid;place-items:center}
.mirr .mbox{position:relative;height:100%;max-height:100%;aspect-ratio:3/4;max-width:100%;border-radius:32px;overflow:hidden;background:#24324a;box-shadow:0 6px 0 var(--line)}
.mirr video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.mirr .ring{position:absolute;inset:0;border-radius:32px;box-shadow:inset 0 0 0 calc(var(--p,0)*14px) #3cbf7a;transition:box-shadow .1s;pointer-events:none}
.mirr .mico{position:absolute;left:12px;top:12px;font-size:56px;line-height:1;filter:drop-shadow(0 3px 4px #0005)}
.mirr .msh{position:absolute;right:6px;bottom:6px;width:34%;max-width:150px}
.mirr .msh svg{width:100%;height:auto}
.mirr .mnocam{color:#fff;text-align:center;padding:20px;font-size:18px;line-height:1.35}
.mirr .mbtn{display:flex;gap:12px;width:100%;justify-content:center}
.mirr .mbtn .big-btn{min-height:64px}
.mirr.win .mbox{box-shadow:0 0 0 8px #3cbf7a,0 6px 0 var(--line)}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+MIRR_CSS+'</style>');
let MIRR_STREAM=null,MIRR_WATCH=0;
function mirrStop(){clearInterval(MIRR_WATCH);MIRR_WATCH=0;if(MIRR_STREAM){MIRR_STREAM.getTracks().forEach(t=>t.stop());MIRR_STREAM=null}}
/* камера выключается, как только ушли из игры (домой, в другую игру «Занятия дня», экран «Молодец») */
function mirrWatch(){clearInterval(MIRR_WATCH);MIRR_WATCH=setInterval(()=>{if(!G||G.game!=='mirr'||$('#game').hidden)mirrStop()},800)}
async function mirrRound(lvl){
  const R=G.round;const L=MIRR_LV[lvl===4&&S.mirrBody===false?3:lvl]||MIRR_LV[1];const last=G.mirrLast||[];const pool=L.filter(k=>!last.includes(k));
  const key=pick(pool.length?pool:L);G.mirrLast=last.concat(key).slice(-2);const ex=MIRR_EX[key];
  if(!await ask(ex.p,ex.say))return;
  const st=$('#stage');
  st.innerHTML=`<div class="mirr"><div class="mv"><div class="mbox"><video playsinline muted autoplay></video><div class="ring"></div>${ex.ic?`<div class="mico">${ex.ic}</div>`:''}<div class="msh">${DOG_SVG}</div></div></div>
    <div class="mbtn"><button class="big-btn mok">Получилось ✓</button></div></div>`;
  const box=st.querySelector('.mirr'),video=st.querySelector('video'),ring=st.querySelector('.ring');
  const mSh=async()=>{const h=await sh3(st.querySelector('.msh'));if(h&&!R.dead)h.pose(MIRR_POSE[key]||null)}; /* объёмный Шарик показывает, как надо */
  mSh();
  let cam=!!window.__mirrSim;
  if(!cam){if(!MIRR_STREAM||!MIRR_STREAM.active)MIRR_STREAM=await getCam(false);if(R.dead||!G||G.round!==R)return;
    if(MIRR_STREAM){mirrWatch();video.srcObject=MIRR_STREAM;try{await video.play()}catch(e){}cam=true}}
  if(cam&&!window.__mirrSim){try{await mpLoad();if(ex.t==='bp'||ex.t==='mv')await mpPose()}catch(e){cam=false}}
  if(R.dead||!G||G.round!==R||!box.isConnected)return; /* ушли из игры, пока включалась камера */
  if(!cam){mirrStop();st.querySelector('.mbox').innerHTML=`<div class="mnocam">${ex.ic?`<div style="font-size:72px">${ex.ic}</div>`:''}Камера недоступна — повторяй за Шариком, а мама нажмёт «Получилось».</div><div class="msh big">${DOG_SVG}</div>`;mSh()}
  R.mirrReady=true;
  const ok=await new Promise(res=>{let done=false,held=0,lastT=performance.now(),t0=performance.now(),hinted=false;
    const mst={},body=ex.t==='bp'||ex.t==='mv';let lastLook=t0,lastSeen=t0,farSaid=false,away=0,busy=false;
    const finish=async(how)=>{if(done)return;done=true;box.classList.add('win');ring.style.setProperty('--p',1);sfx.good();confetti(70);
      R.mirrHow=how;const h3=s3(st.querySelector('.msh'));if(h3)h3.pose(null).mood('praise');const pr=pick(MIRR_GOOD);if(G&&G.sharik)await shSpeak(pr,st.querySelector('.msh'));else await say(pr);res(true)};
    st.querySelector('.mok').onclick=()=>{ac();finish('parent')};
    const loop=()=>{if(done||R.dead||!box.isConnected){return}
      const now=performance.now(),dt=now-lastT;lastT=now;
      if(cam||window.__mirrSim){let d=null;try{d=mpFrame(video,now,ex)}catch(e){}
        if(mirrHit(ex,d,mst,now))held+=dt;else held=Math.max(0,held-dt*.5);
        ring.style.setProperty('--p',Math.min(1,held/MIRR_CFG.hold));
        if(held>=MIRR_CFG.hold){finish('camera');return}
        /* тело не видно — попросить отойти подальше (один раз) */
        if(body){if(d&&poseSeen(d.p))lastSeen=now;else if(!farSaid&&!busy&&now-lastSeen>MIRR_CFG.farHint){farSaid=true;say('Отойди чуть подальше, чтобы я видел тебя всего!')}}
        /* «Занятие с Шариком»: отвлёкся дольше 5 с — событие silence, Шарик зовёт (не больше двух раз за задание) */
        if(d&&(mirrLook(d)||(body&&poseSeen(d.p))))lastLook=now;
        else if(G.sharik&&!busy&&away<2&&now-lastLook>MIRR_CFG.away){away++;busy=true;
          (async()=>{const h3=s3(st.querySelector('.msh'));const j=await shAsk({type:'silence',game:'mirr',task:ex.p});if(done||R.dead||!G||G.round!==R){busy=false;return}
            const t=j&&j.say||`${S.name||'Лев'}, я тут! ${ex.say}`;G.shHist&&G.shHist.push({who:'event',text:'отвлёкся от экрана'},{who:'sharik',text:t});
            if(h3)h3.mood(j&&j.tone||'invite');await shSpeak(t,st.querySelector('.msh'));if(s3(st.querySelector('.msh')))s3(st.querySelector('.msh')).pose(MIRR_POSE[key]||null);lastLook=performance.now();busy=false})()}}
      if(!hinted&&!busy&&now-t0>MIRR_CFG.hintAfter){hinted=true;say(ex.say)}
      requestAnimationFrame(loop)};
    requestAnimationFrame(loop)});
  if(R.dead||!G)return;await wait(500);
  return roundDone(ok,{n:key,how:R.mirrHow})}

/* v47: заметить жест камерой вне «Зеркала» — ход «А у тебя где нос?» и «Пятиминутка». Видео маленькое, на телефоне,
   никуда не отправляется. on(тип): 'camera' — жест держится ~0,5 с; 'unsure' — начал, но не удержал (один раз на жест);
   'parent' — мама нажала «Получилось». Без камеры (или выключено) — только кнопка мамы. Возвращает {cam, setKey, stop}. */
const MCHK_CSS=`.mchk{display:flex;align-items:center;justify-content:center;gap:12px;flex:none}
.mchk .mchkv{position:relative;width:96px;aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:#24324a;box-shadow:0 4px 0 var(--line);flex:none}
.mchk video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.mchk .ring{position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 calc(var(--p,0)*10px) #3cbf7a;pointer-events:none}
.mchk .big-btn{min-height:56px;pointer-events:auto}`;
document.head.insertAdjacentHTML('beforeend','<style>'+MCHK_CSS+'</style>');
async function mirrWatchStart(box,key,alive,on,o={}){
  box.insertAdjacentHTML('beforeend',`<div class="mchk"><div class="mchkv"><video playsinline muted autoplay></video><div class="ring"></div></div>${o.btn===false?'':'<button class="big-btn mchkok">Получилось ✓</button>'}</div>`);
  const w=box.lastElementChild,video=w.querySelector('video'),ring=w.querySelector('.ring');
  let ex=MIRR_EX[key],stream=null,stopped=false,cam=false,held=0,unsure=false,mst={},last=performance.now();
  const ctl={cam:false,setKey(k){ex=MIRR_EX[k];held=0;unsure=false;mst={};if(ring)ring.style.setProperty('--p',0)},
    stop(){stopped=true;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;w.remove()}};
  const ok=w.querySelector('.mchkok');if(ok)ok.onclick=e=>{e.stopPropagation();ac();on('parent')};
  if(S.shCam!==false){
    if(window.__mirrSim)cam=true;
    else{stream=await getCam(false);if(stopped||!alive()){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;return ctl}
      if(stream){video.srcObject=stream;try{await video.play()}catch(e){}
        try{await mpLoad();if(ex&&(ex.t==='bp'||ex.t==='mv'))await mpPose();cam=true}catch(e){cam=false}}}}
  if(stopped||!alive()){ctl.stop();return ctl}
  if(!cam){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;const v=w.querySelector('.mchkv');if(v)v.remove()}
  ctl.cam=cam;
  const tick=()=>{if(stopped)return;if(!alive()){ctl.stop();return}
    const now=performance.now(),dt=now-last;last=now;
    if(cam&&ex){let d=null;try{d=mpFrame(video,now,ex)}catch(e){}
      if(mirrHit(ex,d,mst,now))held+=dt;else held=Math.max(0,held-dt*.5);
      if(ring)ring.style.setProperty('--p',Math.min(1,held/MIRR_CFG.hold));
      if(held>=MIRR_CFG.hold){held=0;on('camera')}
      else if(!unsure&&held>MIRR_CFG.hold*.4){unsure=true;on('unsure')}}
    requestAnimationFrame(tick)};
  if(cam)requestAnimationFrame(tick);
  return ctl}
