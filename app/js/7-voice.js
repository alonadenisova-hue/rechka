/* «Речка»: голосовые игры (микрофон — только громкость), видеообразец, доска «Хочу», «Сегодня дома».
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v21: голосовые игры, видеообразец, «Сделай как скажу», «Хочу», «Сегодня дома» ===================== */
/* ---------- микрофон только для громкости: никакого распознавания речи */
const VMC={smooth:.35,hold:100,long:500,gap:[120,1500],fill:800,silence:6000,sylHi:1,sylLo:.55,sylDrop:.45,sylGap:120,sylWait:5000,sylEnd:1200}; // константы детектора (подстраивать здесь)
let MICX=null; // null — не знаем, true — микрофон есть, false — нет
async function micProbe(){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!(window.AudioContext||window.webkitAudioContext)){MICX=false;return false}
  try{if(document.featurePolicy&&!document.featurePolicy.allowsFeature('microphone')){MICX=false;return false}}catch(e){}
  try{const p=await navigator.permissions.query({name:'microphone'});if(p.state==='denied'){MICX=false;return false}}catch(e){}
  try{const ds=await navigator.mediaDevices.enumerateDevices();if(ds.length&&!ds.some(d=>d.kind==='audioinput')){MICX=false;return false}}catch(e){}
  if(MICX===null)MICX=true;return MICX}
const vthr=()=>Math.max(.006,Math.min(S.vthr,(VM.floor||0)*3+.005));
const VM={floor:null,st:null,src:null,proc:null,env:0,ring:null,rp:0,sr:48000,cb:null,mute:0,
  async start(){if(this.st)return true;let st=null;
    try{if(MICX!==false)st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:true}})}catch(e){}
    if(!st){MICX=false;MIC_OK=false;applyV21Home();return false}MICX=true;MIC_OK=true;
    const a=ac();if(!a){st.getTracks().forEach(t=>t.stop());return false}
    this.floor=null;this.sr=a.sampleRate;this.ring=new Float32Array(Math.round(a.sampleRate*6));this.rp=0;this.env=0;this.st=st;
    this.src=a.createMediaStreamSource(st);this.proc=a.createScriptProcessor(1024,1,1);const g=a.createGain();g.gain.value=0;
    this.proc.onaudioprocess=e=>{const d=e.inputBuffer.getChannelData(0),R=this.ring;if(!R)return;let s=0;for(let i=0;i<d.length;i++){s+=d[i]*d[i];R[this.rp]=d[i];this.rp=(this.rp+1)%R.length}
      const rms=Math.sqrt(s/d.length);this.env=this.env*VMC.smooth+rms*(1-VMC.smooth);const t=performance.now();if(t>=this.mute){this.floor=this.floor==null?rms:(rms<this.floor?this.floor*.7+rms*.3:this.floor+(rms-this.floor)*.003)}
      try{this.cb&&this.cb(t<this.mute?0:this.env,t)}catch(err){console.error(err)}};
    this.src.connect(this.proc);this.proc.connect(g);g.connect(a.destination);return true},
  stop(){try{this.proc&&(this.proc.onaudioprocess=null,this.proc.disconnect());this.src&&this.src.disconnect()}catch(e){}
    if(this.st)this.st.getTracks().forEach(t=>t.stop());this.st=this.src=this.proc=null;this.cb=null;this.env=0},
  clip(ms){if(!this.ring)return new Float32Array(0);const n=Math.min(this.ring.length,Math.round(this.sr*ms/1000)),out=new Float32Array(n);let p=(this.rp-n+this.ring.length)%this.ring.length;
    for(let i=0;i<n;i++){out[i]=this.ring[p];p=(p+1)%this.ring.length}return out}};
async function vsay(t){VM.mute=Infinity;await say(t);VM.mute=performance.now()+400}
async function vplay(p){VM.mute=Infinity;await p;VM.mute=performance.now()+400}
/* звук громче порога дольше 150 мс = «сработал голос»; конец — тишина 120 мс */
function segDetector(onStart,onEnd){let on=false,t0=0,above=0,below=0;
  return (v,t)=>{const thr=vthr();
    if(!on){if(v>thr){if(!above)above=t;if(t-above>=VMC.hold){on=true;t0=above;below=0;onStart&&onStart(t0)}}else above=0}
    else{if(v<thr*.6){if(!below)below=t;if(t-below>=120){on=false;above=0;const d=below-t0;below=0;onEnd&&onEnd(d,t)}}else below=0}
    return on?t-t0:-1}}
/* слоги: пик = рост выше порога после спада ниже порога (или ниже 45% от предыдущего пика), не чаще чем раз в 120 мс */
function peakDetector(onPeak){let armed=true,last=-1e9,pk=0;
  return (v,t)=>{const T=vthr(),hi=T*VMC.sylHi,lo=Math.max(T*VMC.sylLo,pk*VMC.sylDrop);
    if(armed){if(v>hi&&t-last>=VMC.sylGap){armed=false;last=t;pk=v;onPeak(t)}}else{pk=Math.max(pk,v);if(v<lo){armed=true;pk=0}}}}
function wavBlob(f32,sr){const k=Math.max(1,Math.round(sr/16000)),n=Math.floor(f32.length/k),rate=Math.round(sr/k),b=new ArrayBuffer(44+n*2),d=new DataView(b);
  const w=(o,s)=>{for(let i=0;i<s.length;i++)d.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');d.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);w(36,'data');d.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){let s=0;for(let j=0;j<k;j++)s+=f32[i*k+j];s=Math.max(-1,Math.min(1,s/k*1.6));d.setInt16(44+i*2,s*32767,true)}return new Blob([b],{type:'audio/wav'})}

/* ---------- ИГРА «Скажи — и будет!»: любой звук ребёнка сразу что-то делает на экране */
let VG_ANI=[['медведь','Р-р-р!','Скажи: р-р-р!'],['собака','Гав!','Скажи: гав!'],['кошка','Мяу!','Скажи: мяу!'],['корова','Му-у!','Скажи: му-у!']];
const VG_CAR='<svg viewBox="0 0 120 70"><path d="M8 52V40q0-6 6-8l16-4 14-16q4-4 10-4h22q6 0 10 4l12 16q12 2 12 12v12z" fill="#ef4a3d"/><path d="M38 28l10-12h12v12zM66 28V16h12q3 0 5 3l7 9z" fill="#dff1fb"/><rect x="100" y="38" width="10" height="5" rx="2" fill="#ffcf26"/><g class="wh"><circle cx="30" cy="54" r="12" fill="#24324a"/><path d="M30 44v20M20 54h20" stroke="#aab" stroke-width="3"/></g><g class="wh"><circle cx="88" cy="54" r="12" fill="#24324a"/><path d="M88 44v20M78 54h20" stroke="#aab" stroke-width="3"/></g></svg>';
const VG_CANDLE='<svg viewBox="0 0 100 160"><rect x="34" y="70" width="32" height="86" rx="6" fill="#ffd3e2"/><rect x="34" y="70" width="32" height="12" rx="6" fill="#ffb3cc"/><path d="M50 70v-10" stroke="#24324a" stroke-width="3"/><g class="flame"><path d="M50 8C38 28 36 40 40 50s16 12 20 0-2-24-10-42z" fill="#ffb020"/><path d="M50 26c-6 12-6 18-4 22s8 4 10-1-1-12-6-21z" fill="#fff2a8"/></g><g class="smoke"><circle cx="50" cy="44" r="7" fill="#c8cdd6"/><circle cx="44" cy="30" r="9" fill="#d5d9e0"/><circle cx="54" cy="16" r="10" fill="#e3e6eb"/></g></svg>';
const VG_DAND=()=>{let h='';for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=50+Math.cos(a)*26,y=48+Math.sin(a)*26;h+=`<g class="seed" style="--dx:${(Math.cos(a)*120+60).toFixed(0)}px;--dy:${(Math.sin(a)*80-90).toFixed(0)}px;--r:${(Math.random()*120-60).toFixed(0)}deg"><path d="M50 48L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#d6dbe3" stroke-width="1.6"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#fff" stroke="#d6dbe3"/></g>`}
  return `<svg viewBox="0 0 100 170"><path d="M50 52Q46 110 52 168" stroke="#4dbb3f" stroke-width="5" fill="none"/><path d="M50 130q-24-6-30-24 18 0 30 22z" fill="#4dbb3f"/>${h}<circle cx="50" cy="48" r="7" fill="#c9a96b"/></svg>`};
const VG_BIRD='<svg viewBox="0 0 120 140"><path d="M60 128c-26 0-40-22-40-50 0-30 18-52 40-52s40 22 40 52c0 28-14 50-40 50z" fill="#3cbf7a"/><path d="M60 128c-12 0-20-16-20-36s8-30 20-30 20 10 20 30-8 36-20 36z" fill="#bff0d4"/><path d="M24 66q-18 22-6 44 14-8 16-30z" fill="#2a9a5f"/><path d="M96 66q18 22 6 44-14-8-16-30z" fill="#2a9a5f"/><circle cx="46" cy="48" r="9" fill="#fff"/><circle cx="74" cy="48" r="9" fill="#fff"/><circle cx="47" cy="49" r="4.5" fill="#24324a"/><circle cx="73" cy="49" r="4.5" fill="#24324a"/><g class="beak"><path class="up" d="M50 58h20l-10 12z" fill="#ffb020"/><path class="lo" d="M52 70h16l-8 7z" fill="#e08a00"/></g><path d="M52 28q8-14 16 0" stroke="#ff6b5b" stroke-width="6" fill="none" stroke-linecap="round"/></svg>';
function vgScene(name,lvl){
  const el=document.createElement('div');el.className='vg vg-'+name;let p=0;const sc={el,name,fill:false};
  const meter=()=>`<div class="meter"><i></i></div>`;
  if(name==='want')return vgWant(el,sc,meter);
  if(name==='bal'){const c=pick(['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf']);
    el.innerHTML=`${meter()}<div class="vbal">${balloonSvg(c)}</div><div class="cap">У-у-у!</div>`;const b=el.querySelector('.vbal');
    Object.assign(sc,{q:'Надуй шарик! Скажи: у-у-у!',hint:'Скажи: у-у-у!',fill:true,
      level(v,on,dt){if(on>=0)p=Math.min(1.15,p+dt/VMC.fill);b.style.transform=`translateX(-50%) scale(${(.55+p*.55+(on>=0?Math.min(.15,v*.4):0)).toFixed(3)})`;return p>=1},
      call(){b.classList.remove('call');void b.offsetWidth;b.classList.add('call')},
      async win(){const r=b.getBoundingClientRect();sfx.pop();confetti(90,r.left+r.width/2,r.top+r.height/3);b.style.visibility='hidden';await wait(500)}})}
  else if(name==='ani'){const L=VG_ANI.filter(a=>hasSnd(a[0])&&(RPIC[a[0]]||picOf(a[0])));const a=pick(L.length?L:VG_ANI);const pic=(RPIC[a[0]]&&RPIC[a[0]][0])||picOf(a[0]);
    el.innerHTML=`${meter()}<div class="vani">${pic?img(pic):''}</div><div class="cap">${a[1]}</div>`;const an=el.querySelector('.vani');
    const hop=()=>{an.classList.remove('hop');void an.offsetWidth;an.classList.add('hop')};
    Object.assign(sc,{q:a[2]+' '+cap(a[0])+' ответит!',hint:a[2],who:a[0],
      start(){hop()},call(){hop()},
      async win(){an.classList.add('talk');await vplay(animalSound({n:a[0]}));an.classList.remove('talk')}})}
  else if(name==='car'){el.innerHTML=`${meter()}<div class="road"></div><div class="flag">🏁</div><div class="vcar">${VG_CAR}</div><div class="cap">Би-би!</div>`;const c=el.querySelector('.vcar');
    Object.assign(sc,{q:'Скажи: би-би! Машина поедет!',hint:'Скажи: би-би!',fill:true,
      level(v,on,dt){if(on>=0)p=Math.min(1,p+dt/1300);c.style.left=(4+p*58)+'%';c.classList.toggle('go',on>=0);return p>=1},
      call(){c.classList.remove('call');void c.offsetWidth;c.classList.add('call')},
      async win(){c.classList.add('go');[0,.22].forEach(t=>{tone(520,t,.16,'square',.08);tone(660,t,.16,'square',.06)});c.style.transition='left 1.1s ease-in';c.style.left='115%';await wait(1100)}})}
  else if(name==='fire'){const cand=Math.random()<.5;
    el.innerHTML=`${meter()}<div class="vfire ${cand?'candle':'dand'}">${cand?VG_CANDLE:VG_DAND()}</div><div class="cap">Ф-ф-ф!</div>`;const f=el.querySelector('.vfire');const seeds=[...el.querySelectorAll('.seed')];
    Object.assign(sc,{q:cand?'Подуй на свечку! Ф-ф-ф!':'Подуй на одуванчик! Ф-ф-ф!',hint:'Подуй: ф-ф-ф!',fill:true,
      level(v,on,dt){if(on>=0)p=Math.min(1,p+dt/900);
        if(cand){const fl=f.querySelector('.flame');fl.style.transform=`skewX(${(on>=0?-10-v*60:0).toFixed(1)}deg) scale(${(1-p*.55).toFixed(3)})`}
        else seeds.forEach((s,k)=>s.classList.toggle('fly',k<Math.floor(p*seeds.length*.6)));return p>=1},
      call(){f.classList.remove('call');void f.offsetWidth;f.classList.add('call')},
      async win(){if(cand){f.classList.add('out');tone(300,0,.25,'sine',.06)}else seeds.forEach(s=>s.classList.add('fly'));sfx.good();await wait(900)}})}
  else{ /* echo */
    el.innerHTML=`${meter()}<div class="vbird">${VG_BIRD}</div><div class="bubble" hidden>…</div><div class="cap">Скажи!</div>`;const b=el.querySelector('.vbird'),bub=el.querySelector('.bubble');
    let pend=Promise.resolve();
    Object.assign(sc,{q:'Скажи что-нибудь — попугай повторит!',hint:'Скажи: а-а-а!',
      call(){b.classList.remove('call');void b.offsetWidth;b.classList.add('call')},
      end(dur){const x=VM.clip(Math.min(4000,dur+380));if(x.length<200)return;pend=pend.then(()=>new Promise(res=>{const a=ac();if(!a)return res();
        try{const buf=a.createBuffer(1,x.length,VM.sr);buf.copyToChannel(x,0);const s=a.createBufferSource(),g=a.createGain();g.gain.value=2.2;s.buffer=buf;s.playbackRate.value=1.45;s.connect(g).connect(a.destination);
          VM.mute=Infinity;b.classList.add('talk');bub.hidden=false;s.onended=()=>{b.classList.remove('talk');bub.hidden=true;VM.mute=performance.now()+400;res()};s.start()}catch(e){res()}}))},
      async win(){await pend}})}
  return sc}
const VG_NAMES=['ani','bal','car','fire','echo'];const VG_RU={ani:'Животное',bal:'Шарик',car:'Машина',fire:'Свеча / одуванчик',echo:'Эхо (попугай)'};
async function voiceRound(lvl){
  const R=G.round;const st=$('#stage');
  if(!S.voiceGame||!await VM.start()){setPrompt('Нужен микрофон');st.innerHTML='<div class="vg"><div class="cap" style="top:38%;bottom:auto;font-size:26px;padding:0 20px">Микрофон недоступен. Игра работает в приложении на телефоне.</div></div>';
    await say('Нужен микрофон.');await wait(1500);if(G&&G.round===R){R.dead=true;G=null;renderHome()}return}
  if(R.dead||!G||G.round!==R){VM.stop();return}
  const name=G.vforce||(G.i===0&&!G.vfirst?(G.vfirst='ani'):VG_NAMES[rmode('voice',VG_NAMES.length)]);const sc=vgScene(name,lvl);st.innerHTML='';st.append(sc.el);
  const bar=sc.el.querySelector('.meter i');setPrompt(sc.q);G.round.replay=()=>vsay(sc.q);
  let done=false,hits=0,hints=0,lastAct=performance.now(),prevEnd=-1e9,last=performance.now(),goal;const goalP=new Promise(r=>goal=r);
  const fire=why=>{if(done)return;done=why||true;goal()};
  const det=segDetector(t=>{hits++;lastAct=t;sc.start&&sc.start();if(lvl===1&&!sc.fill&&name!=='echo')fire();if(lvl===3&&t-prevEnd>=VMC.gap[0]&&t-prevEnd<=VMC.gap[1])fire()},
    (d,t)=>{lastAct=t;prevEnd=t;sc.end&&sc.end(d);if(lvl===1&&name==='echo')fire()});
  VM.cb=(v,t)=>{const on=det(v,t);const dt=Math.min(80,t-last);last=t;if(on>=0)lastAct=t;bar.style.height=Math.min(100,v/vthr()*50)+'%';bar.classList.toggle('on',on>=0);
    const full=sc.level?sc.level(v,on,dt):false;if(done)return;if(lvl===1&&full)fire();if(lvl===2&&on>=VMC.long)fire()};
  await vsay(sc.q);lastAct=performance.now();
  (async()=>{while(!done&&!R.dead&&G&&G.round===R){await wait(400);if(done||R.dead)return;
    if(performance.now()-lastAct>VMC.silence){hints++;sc.call&&sc.call();await vsay(hints>=3?sc.hint+' Вместе с мамой!':sc.hint);lastAct=performance.now();if(hints>=4){fire('quiet');return}}}})();
  await goalP;
  if(R.dead||!G||G.round!==R){VM.stop();return}
  if(done==='quiet'){VM.cb=null;VM.stop();await say('Потом ещё поиграем!');return roundDone(false,{m:name,hits,hints})}
  if(name!=='echo')VM.cb=(v,t)=>{bar.style.height='0'};
  await sc.win();VM.cb=null;VM.stop();if(R.dead)return;
  sfx.good();confetti(60);R.good=pick(PRAISE);await say(R.good);
  return roundDone(true,{m:name,hits,hints,x:name==='ani'?sc.who:undefined})}

/* ---------- «Слоги», уровень 5 «Скажи сам»: барабан бьёт на каждый пик громкости */
async function sylSelf(w,st,R){
  const n=w.s.length,chips=[...st.querySelectorAll('.chips span')],drum=st.querySelector('.drum');const res=[];
  st.querySelector('.syl').classList.add('self');
  const hit=k=>{drum.classList.remove('hit');void drum.offsetWidth;drum.classList.add('hit');sfx.drum();if(chips[k])chips[k].classList.add('on')};
  for(let tr=1;tr<=2;tr++){
    chips.forEach(c=>c.classList.remove('on'));await vsay(tr===1?'Скажи сам!':'Ещё раз!');if(R.dead)return null;
    if(tr===2){for(let k=0;k<n;k++){hit(k);await wait(480)}await wait(350);chips.forEach(c=>c.classList.remove('on'));await vsay('Теперь ты!');if(R.dead)return null}
    if(!await VM.start())return null;
    let k=0,first=0,lastPk=0;const t0=performance.now();
    const pd=peakDetector(t=>{if(!first)first=t;lastPk=t;if(k<n)hit(k);k++});
    await new Promise(r=>{VM.cb=(v,t)=>{pd(v,t);if(R.dead)return r();if(t-t0>VMC.sylWait&&!first)return r();if(first&&(k>=n&&t-lastPk>500||t-lastPk>VMC.sylEnd||t-first>4500))r()}});
    VM.cb=null;const dur=first?Math.min(5500,performance.now()-first+500):1500;const clip=VM.clip(dur);VM.stop();if(R.dead)return null;
    res.push(k);if(first)saveLev(cap(w.w)+' · слогов: '+Math.min(k,9)+' из '+n,wavBlob(clip,VM.sr));
    if(k>=n)break}
  return res}

/* ---------- ИГРА «Сделай как скажу»: перетащить предмет по инструкции из нескольких признаков */
const MK_COL=['red','blue','green','yellow'];
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16);const f=x=>Math.max(0,Math.min(255,Math.round(x*k)));return '#'+[f(n>>16),f(n>>8&255),f(n&255)].map(x=>x.toString(16).padStart(2,'0')).join('')};
const MK_KIND={
  мяч:{g:'m',acc:'мяч',nom:'мяч',pad:.04,svg:c=>`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="${c}"/><path d="M8 44q42 22 84 0M8 58q42 22 84 0" stroke="#fff" stroke-width="8" fill="none"/><ellipse cx="34" cy="26" rx="10" ry="6" fill="#fff8" transform="rotate(-30 34 26)"/></svg>`},
  кубик:{g:'m',acc:'кубик',nom:'кубик',pad:.13,svg:c=>`<svg viewBox="0 0 100 100"><path d="M14 30 36 14h52L66 30z" fill="${shade(c,1.25)}"/><path d="M66 30 88 14v56L66 86z" fill="${shade(c,.75)}"/><rect x="14" y="30" width="52" height="56" rx="3" fill="${c}"/></svg>`},
  машинка:{g:'f',acc:'машинку',nom:'машинка',pad:.15,svg:c=>`<svg viewBox="0 0 100 100"><path d="M8 70V56q0-8 8-10l14-4 12-16q4-5 10-5h18q6 0 9 5l9 16q8 2 8 10v18z" fill="${c}"/><path d="M36 42l9-13h10v13zM60 42V29h10q3 0 5 3l6 10z" fill="#dff1fb"/><circle cx="28" cy="72" r="12" fill="#24324a"/><circle cx="28" cy="72" r="5" fill="#ccc"/><circle cx="74" cy="72" r="12" fill="#24324a"/><circle cx="74" cy="72" r="5" fill="#ccc"/></svg>`}};
const MK_DEF={мяч:'red',кубик:'yellow',машинка:'blue'};
const MK_SIZE={b:{m:'большой',f:'большая',fa:'большую',pr:'большой'},s:{m:'маленький',f:'маленькая',fa:'маленькую',pr:'маленькой'}};
const mkAdjAcc=(c,g)=>g==='f'?adjEnd(c,'f'):adjNom(c,'m');
function mkName(o,cas,{col,size}){const K=MK_KIND[o.k];const w=[];if(size)w.push(K.g==='f'?(cas==='acc'?MK_SIZE[o.sz].fa:MK_SIZE[o.sz].f):MK_SIZE[o.sz].m);if(col)w.push(cas==='acc'?mkAdjAcc(o.c,K.g):adjNom(o.c,K.g));w.push(cas==='acc'?K.acc:K.nom);return w.join(' ')}
const MK_PL={коробка:{acc:{в:'в коробку'},pr:{в:'в коробке'},accS:{в:sz=>'в '+MK_SIZE[sz].fa+' коробку'},prS:{в:sz=>'в '+MK_SIZE[sz].pr+' коробке'}},
  стол:{acc:{на:'на стол',под:'под стол'},pr:{на:'на столе',под:'под столом'}},стул:{acc:{на:'на стул',под:'под стул'},pr:{на:'на стуле',под:'под стулом'}}};
const mkPlace=(pl,p,cas,withSize)=>withSize&&pl.f==='коробка'?MK_PL.коробка[cas==='acc'?'accS':'prS'].в(pl.sz):MK_PL[pl.f][cas][p];
function mkTask(lvl){
  const kinds=Object.keys(MK_KIND);let objs=[],places,t,pp,col=false,size=false,plSize=false;
  if(lvl===1){const ks=shuffle(kinds).slice(0,2);objs=ks.map(k=>({k,c:MK_DEF[k],sz:'b'}));places=[{f:'коробка',sz:'b'}];t=objs[0];pp=[0,'в']}
  else if(lvl===2){const ks=shuffle(kinds).slice(0,2);objs=ks.map(k=>({k,c:MK_DEF[k],sz:'b'}));places=shuffle([{f:'коробка',sz:'b'},{f:pick(['стол','стул']),sz:'b'}]);t=objs[0];const j=rnd(2);pp=[j,places[j].f==='коробка'?'в':'на']}
  else if(lvl===3){const k=pick(kinds),cs=shuffle(MK_COL).slice(0,2);objs=cs.map(c=>({k,c,sz:'b'}));col=true;places=shuffle([{f:'коробка',sz:'b'},{f:pick(['стол','стул']),sz:'b'}]);t=objs[0];const j=rnd(2);pp=[j,places[j].f==='коробка'?'в':'на']}
  else if(lvl===4){const k=pick(kinds),cs=shuffle(MK_COL).slice(0,2);objs=[{k,c:cs[0],sz:'s'},{k,c:cs[0],sz:'b'},{k,c:cs[1],sz:'s'}];if(Math.random()<.5)objs.push({k,c:cs[1],sz:'b'});
    col=size=true;places=shuffle([{f:'коробка',sz:'b'},{f:pick(['стол','стул']),sz:'b'}]);t=pick(objs);const j=rnd(2);pp=[j,places[j].f==='коробка'?'в':'на']}
  else if(lvl===5){const k=pick(kinds),cs=shuffle(MK_COL).slice(0,2);objs=cs.map(c=>({k,c,sz:'b'}));col=true;plSize=true;places=shuffle([{f:'коробка',sz:'b'},{f:'коробка',sz:'s'}]);t=objs[0];pp=[rnd(2),'в']}
  else{const ks=shuffle(kinds).slice(0,2);objs=ks.map(k=>({k,c:MK_DEF[k],sz:'b'}));places=shuffle(['стол','стул']).map(f=>({f,sz:'b'}));t=objs[0];
    const lastP=G.mkLastP;const p=lastP==='под'?(Math.random()<.5?'на':'под'):'под';G.mkLastP=p;pp=[rnd(2),p]}
  return{objs:shuffle(objs),places,t,pi:pp[0],p:pp[1],col,size,plSize}}
async function makeRound(lvl){
  const R=G.round;const T=fresh(()=>mkTask(lvl),x=>x.t.k+x.t.c+x.t.sz+x.places[x.pi].f+x.places[x.pi].sz+x.p+x.places.length);
  const opt={col:T.col,size:T.size};const tp=T.places[T.pi];
  const q='Положи '+mkName(T.t,'acc',opt)+' '+mkPlace(tp,T.p,'acc',T.plSize)+'!';const good=cap(mkName(T.t,'nom',opt))+' '+mkPlace(tp,T.p,'pr',T.plSize)+'.';
  if(!await ask(q))return;R.good=good;R.picks=[];
  const st=$('#stage');st.innerHTML='<div class="put mk"></div>';const box=st.firstChild;const W=box.clientWidth,H=box.clientHeight;
  const floor=H*.95,n=T.places.length,SC=pl=>pl.sz==='s'?.62:1;
  const k=Math.min(W/n*.9/Math.max(...T.places.map(pl=>FUR[pl.f].w*SC(pl))),H*.5/Math.max(...T.places.map(pl=>FUR[pl.f].h*SC(pl))));
  const fr=T.places.map((pl,j)=>{const d=FUR[pl.f],w=d.w*k*SC(pl),h=d.h*k*SC(pl),x=(j+.5)*W/n-w/2,y=floor-h;
    const el=document.createElement('div');el.className='fur';place(el,{x,y,w,h});el.innerHTML=d.svg;box.append(el);
    if(d.front){const fe=document.createElement('div');fe.className='front';place(fe,{x,y,w,h});fe.innerHTML=d.front;box.append(fe)}return{x,y,w,h}});
  const base=Math.min(W/(T.objs.length+.3),Math.max(78,52*k)),osz=o=>o.sz==='s'?base*.66:base;
  const zoneRect=(j,p)=>{const z=FUR[T.places[j].f].z[p].d,r=fr[j];return{x:r.x+z[0]*r.w,y:r.y+z[1]*r.h,w:(z[2]-z[0])*r.w,h:(z[3]-z[1])*r.h}};
  const rest=(j,p,o)=>{const z=FUR[T.places[j].f].z[p].r,r=fr[j],s=osz(o);return{x:r.x+z[0]*r.w-s/2,y:r.y+z[1]*r.h-s+s*(MK_KIND[o.k].pad||0)}};
  let wrong=0,hintEl=null;const els=[];
  const showHint=()=>{els.forEach(e=>e.o===T.t&&e.el.classList.add('blink'));if(hintEl)return;const zr=zoneRect(T.pi,T.p);hintEl=document.createElement('div');hintEl.className='zone';
    const y=Math.max(4,zr.y),h=Math.min(zr.y+zr.h,floor)-y;place(hintEl,{x:zr.x,y,w:zr.w,h});box.append(hintEl)};
  const tm=setTimeout(()=>{if(G&&G.round===R&&lvl===1)showHint()},8000);
  await new Promise(res=>{
    T.objs.forEach((o,j)=>{const s=osz(o),el=document.createElement('div');el.className='obj';el.innerHTML=MK_KIND[o.k].svg(DCOL[o.c][0]);el.setAttribute('aria-label',mkName(o,'nom',{col:1,size:1}));el.dataset.mk=j;
      const cw=W/T.objs.length;const home={x:(j+.5)*cw-s/2,y:H*.04+(base-s)};place(el,{x:home.x,y:home.y,w:s,h:s});box.append(el);els.push({el,o});
      let drag=null;
      el.onpointerdown=e=>{if(el.classList.contains('placed'))return;e.preventDefault();ac();try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.remove('back','bad','blink');el.classList.add('drag');sfx.click();
        const r=el.getBoundingClientRect();drag={dx:e.clientX-r.left-r.width/2,dy:e.clientY-r.top-r.height/2,sx:e.clientX,sy:e.clientY}};
      el.onpointermove=e=>{if(!drag)return;const b=box.getBoundingClientRect();el.style.left=(e.clientX-b.left-drag.dx-s/2)+'px';el.style.top=(e.clientY-b.top-drag.dy-s/2)+'px'};
      el.onpointerup=el.onpointercancel=async e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy);drag=null;el.classList.remove('drag');
        const cx=parseFloat(el.style.left)+s/2,cy=parseFloat(el.style.top)+s/2;
        let hit=null;zl:for(let pj=0;pj<T.places.length;pj++)for(const p in FUR[T.places[pj].f].z){const z=zoneRect(pj,p);if(cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h){hit={j:pj,p};break zl}}
        if(!hit){el.classList.add('back');place(el,{x:home.x,y:home.y,w:s,h:s});if(moved<10)say(q);return}
        if(o===T.t&&hit.j===T.pi&&hit.p===T.p){clearTimeout(tm);const rp=rest(hit.j,hit.p,o);el.classList.add('placed');place(el,{x:rp.x,y:rp.y,w:s,h:s});
          box.querySelectorAll('.obj').forEach(x=>{x.onpointerdown=null;x.classList.remove('blink')});if(hintEl)hintEl.remove();sfx.good();
          const r=el.getBoundingClientRect();confetti(70,r.left+r.width/2,r.top+r.height/2);res();return}
        wrong++;G.round.wrong++;
        const why=o!==T.t?(o.k!==T.t.k?'предмет':o.c!==T.t.c?'цвет':'размер'):(hit.j!==T.pi&&T.places[hit.j].f===tp.f?'размер':hit.p!==T.p&&T.places[hit.j].f===tp.f?'предлог':'место');R.picks.push(why);
        const rp=rest(hit.j,hit.p,o);el.classList.add('placed');place(el,{x:rp.x,y:rp.y,w:s,h:s});
        const badMs=sfx.bad();await wait(Math.max(700,badMs));if(!box.isConnected)return;
        const what=mkName(o,'nom',{col:T.col||T.size,size:T.size})+' '+mkPlace(T.places[hit.j],hit.p,'pr',T.plSize);
        el.classList.remove('placed');el.classList.add('back');place(el,{x:home.x,y:home.y,w:s,h:s});
        if(wrong>=2)showHint();
        await say('Нет, это '+what+'. '+q)};
    });
  });
  if(R.dead||!G)return;
  await say(pick(PRAISE)+' '+good);if(R.dead)return;
  if(wantSayIt())await sayIt(good.replace(/\.$/,''),MK_KIND[T.t.k].svg(DCOL[T.t.c][0]));
  return roundDone(wrong===0,{p:T.p,n:tp.f,o:T.t.k,c:T.t.c,sz:T.t.sz})}
const makeArt=()=>`<svg viewBox="0 0 130 120"><g transform="translate(0 20)">${FUR.коробка.svg.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(40 4) scale(.5)">${MK_KIND.мяч.svg('#2f8be0').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(0 20)">${FUR.коробка.front.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>`;

/* ---------- ВИДЕООБРАЗЕЦ: мамины видео перед «Скажи!» (хранятся только на телефоне) */
let VIDK=new Set();
const vidLoad=()=>MDB.keys('vid').then(k=>{VIDK=new Set(k||[])}).catch(()=>{});
const VREC_MIME=()=>['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm','video/mp4'].find(m=>{try{return window.MediaRecorder&&MediaRecorder.isTypeSupported(m)}catch(e){return false}});
async function getCam(audio){try{if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return null;
  return await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:360},frameRate:{ideal:24}},audio:audio?{echoCancellation:true,noiseSuppression:true}:false})}catch(e){return null}}
/* «Скажи!» (v21): если для фразы есть мамино видео — сначала видео, потом пауза на повтор (с зеркалом, если включено).
   Запись голоса ребёнка — только если взрослый включил её в настройках (в v12 запись выключили). */
async function sayIt(phrase,picHtml){
  if(!phrase||!G||!G.round)return;const R0=G.round;const key=nk(phrase);
  S.sf=S.sf||{};S.sf[phrase]=(S.sf[phrase]||0)+1;const sk=Object.keys(S.sf);if(sk.length>300){sk.sort((a,b)=>S.sf[a]-S.sf[b]).slice(0,100).forEach(k=>delete S.sf[k])}
  const hasV=S.vidFreq!=='off'&&VIDK.has(key);
  if(hasV){G.vidN=(G.vidN||0)+1;if(S.vidFreq==='some'&&G.vidN%2===0)return}
  else{if(!S.sayRec||S.sayit==='off'||MIC_OK===false)return;sayCount++;if(sayCount%(S.sayit==='often'?2:4)!==0)return}
  let vrec=null;if(hasV){try{vrec=await MDB.get('vid',key)}catch(e){}if(!vrec||!vrec.blob){if(!S.sayRec)return}}
  if(!G||G.round!==R0||R0.dead)return;
  const ov=$('#sayit'),mic=$('#sayit-mic'),ring=$('#sayit-ring'),ph=$('#sayit-phrase'),pic=$('#sayit-pic'),mir=$('#sayit-mirror');
  pic.innerHTML=picHtml||'';pic.hidden=!picHtml&&!vrec;ph.textContent=phrase+'!';mic.className='mic';mic.hidden=!S.sayRec;ov.hidden=false;mir.hidden=true;ov.classList.toggle('withvid',!!vrec);
  const stopper={};let skipped=false,cam=null,vurl=null;
  const skipP=new Promise(r=>{$('#sayit-skip').onclick=()=>{skipped=true;stopVoice();stopper.stop&&stopper.stop();const v=pic.querySelector('video');if(v)try{v.pause()}catch(e){}r()}});
  const run=(async()=>{
    if(vrec&&vrec.blob){vurl=URL.createObjectURL(vrec.blob);pic.innerHTML=`<video playsinline src="${vurl}"></video>`;pic.hidden=false;const v=pic.querySelector('video');
      stopVoice();await new Promise(res=>{let ok=false;const fin=()=>{if(!ok){ok=true;res()}};v.onended=fin;v.onerror=fin;setTimeout(fin,8000);v.play().catch(()=>{v.muted=true;v.play().catch(fin)})});
      S.log.push({t:Date.now(),g:'vid',n:phrase,ok:true});save()}
    else await say('Скажи! '+phrase+'!');
    if(skipped)return;
    if(vrec&&S.mirror){cam=await getCam(false);if(cam&&!skipped){mir.hidden=false;const mv=mir.querySelector('video');mv.srcObject=cam;mv.play().catch(()=>{})}}
    let blob=null;
    if(S.sayRec&&MIC_OK!==false){mic.hidden=false;mic.classList.add('rec');mic.onclick=()=>stopper.stop&&stopper.stop();
      blob=await recordFor(4000,{onLevel:v=>{ring.style.transform='scale('+(1+Math.min(.7,v*2.5))+')'},stopper});mic.classList.remove('rec');ring.style.transform='';mic.onclick=null}
    else{ph.textContent='Повтори: '+phrase+'!';await wait(4000)}
    if(cam){cam.getTracks().forEach(t=>t.stop());cam=null;mir.hidden=true}
    if(skipped)return;
    if(blob&&blob.size>1200){mic.classList.add('play');await playURL(URL.createObjectURL(blob));mic.classList.remove('play');saveLev(phrase,blob)}
    if(skipped)return;
    sfx.good();confetti(50);await say(pick(['Молодец!','Умница!','Хорошо сказал!','Ура!']));
  })();
  await Promise.race([run,skipP]);if(cam)cam.getTracks().forEach(t=>t.stop());mir.hidden=true;ov.hidden=true;ov.classList.remove('withvid');if(vurl)setTimeout(()=>URL.revokeObjectURL(vurl),1000);
}
function wantSayIt(){return true} /* решение принимает sayIt: есть видео — показать, иначе запись (если включена) */
/* запись видео взрослым: обратный отсчёт 3-2-1, 2–5 секунд */
async function recordVideo(phrase){
  const ov=$('#vrec'),v=ov.querySelector('video'),cnt=ov.querySelector('.cnt'),btn=$('#vrec-stop'),msg=ov.querySelector('.msg');
  ov.querySelector('.vph').textContent=phrase;msg.textContent='Держите телефон так, чтобы рот был крупно';cnt.textContent='';btn.hidden=true;ov.hidden=false;
  $('#vrec-save').hidden=true;$('#vrec-again').hidden=true;stopVoice();
  const cam=await getCam(true);const mime=VREC_MIME();
  if(!cam||!mime){if(cam)cam.getTracks().forEach(t=>t.stop());msg.textContent='Камера недоступна. Разрешите доступ к камере и микрофону. В пробной версии внутри Claude запись видео не работает — откройте приложение на телефоне.';
    await new Promise(r=>{$('#vrec-close').onclick=r});ov.hidden=true;return null}
  v.srcObject=cam;v.muted=true;v.classList.add('live');v.play().catch(()=>{});
  let result=null;
  const once=()=>new Promise(async done=>{
    for(const c of ['3','2','1']){cnt.textContent=c;tone(660,0,.12,'sine',.12);await wait(800);if(ov.hidden)return done(null)}
    cnt.textContent='●';const ch=[];let mr;try{mr=new MediaRecorder(cam,{mimeType:mime,videoBitsPerSecond:350000,audioBitsPerSecond:48000})}catch(e){try{mr=new MediaRecorder(cam)}catch(e2){return done(null)}}
    mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};const t0=Date.now();
    mr.onstop=()=>done(ch.length?new Blob(ch,{type:(mr.mimeType||mime).split(';')[0]}):null);mr.start(250);
    btn.hidden=false;btn.disabled=true;setTimeout(()=>{btn.disabled=false},2000);
    const stop=()=>{if(mr.state==='recording')mr.stop();btn.hidden=true;cnt.textContent=''};btn.onclick=stop;setTimeout(stop,5000);$('#vrec-close').onclick=()=>{stop();ov.hidden=true}});
  for(;;){$('#vrec-close').onclick=()=>{ov.hidden=true};const b=await once();if(ov.hidden||!b){result=null;break}
    v.srcObject=null;v.classList.remove('live');v.muted=false;v.src=URL.createObjectURL(b);v.play().catch(()=>{});
    $('#vrec-save').hidden=false;$('#vrec-again').hidden=false;msg.textContent='Посмотрите. Сохранить?';
    const act=await new Promise(r=>{$('#vrec-save').onclick=()=>r('save');$('#vrec-again').onclick=()=>r('again');$('#vrec-close').onclick=()=>r('close')});
    URL.revokeObjectURL(v.src);v.removeAttribute('src');$('#vrec-save').hidden=true;$('#vrec-again').hidden=true;
    if(act==='save'){result=b;break}if(act==='close')break;
    v.srcObject=cam;v.muted=true;v.classList.add('live');v.play().catch(()=>{});msg.textContent='Держите телефон так, чтобы рот был крупно'}
  cam.getTracks().forEach(t=>t.stop());v.srcObject=null;ov.hidden=true;
  if(result){try{await MDB.put('vid',nk(phrase),{phrase,blob:result,t:Date.now()});VIDK.add(nk(phrase))}catch(e){}}
  return result}
let vidtab='need';
const VID_STATIC=()=>{const L=[];ME_V.forEach(v=>L.push('Я '+v[1]));L.push('На','Дай');Object.values(ONO).forEach(o=>L.push(o.replace(/!$/,'')));return[...new Set(L)]};
const VID_WORDS=()=>[...new Set(SYL.filter(w=>w.s.length<=2).map(w=>cap(w.w)))];
async function renderVid(){const box=$('#vid-list');if(!box)return;
  const need=Object.entries(S.sf||{}).sort((a,b)=>b[1]-a[1]).slice(0,20).map(x=>x[0]);
  let list=vidtab==='need'?need:vidtab==='ph'?VID_STATIC():vidtab==='w'?VID_WORDS():[];
  if(vidtab==='mine'){list=[];for(const k of VIDK){const r=await MDB.get('vid',k).catch(()=>null);if(r)list.push(r.phrase)}}
  document.querySelectorAll('[data-vidtab]').forEach(b=>b.style.outline=b.dataset.vidtab===vidtab?'3px solid var(--plum)':'');
  let bytes=0;for(const k of VIDK){const r=await MDB.get('vid',k).catch(()=>null);if(r&&r.blob)bytes+=r.blob.size}
  $('#vid-size').textContent=`видео: ${VIDK.size}, занято ${(bytes/1048576).toFixed(1).replace('.',',')} МБ`;
  box.innerHTML=list.length?list.map((t,k)=>{const has=VIDK.has(nk(t));return `<div class="rec-row"><span>${t.replace(/</g,'&lt;')}${vidtab==='need'?` <span class="note">×${S.sf[t]}</span>`:''}</span><button data-vidr="${k}" class="${has?'has':''}" aria-label="Записать видео">🎥</button><button data-vidp="${k}" ${has?'':'disabled style="opacity:.3"'} aria-label="Посмотреть">▶</button><button data-vidd="${k}" ${has?'':'disabled style="opacity:.3"'} aria-label="Удалить">✕</button></div>`}).join('')
    :`<p class="note">${vidtab==='need'?'Здесь появятся фразы, которые чаще всего звучат после верных ответов. Поиграйте немного — или запишите видео из вкладок «Фразы» и «Слова».':'Пока пусто.'}</p>`;
  const T=k=>list[+k];
  box.querySelectorAll('[data-vidr]').forEach(b=>b.onclick=async()=>{await recordVideo(T(b.dataset.vidr));renderVid()});
  box.querySelectorAll('[data-vidp]').forEach(b=>b.onclick=async()=>{const r=await MDB.get('vid',nk(T(b.dataset.vidp))).catch(()=>null);if(!r)return;const ov=$('#vrec'),v=ov.querySelector('video');
    ov.querySelector('.vph').textContent=r.phrase;ov.querySelector('.msg').textContent='';ov.querySelector('.cnt').textContent='';$('#vrec-stop').hidden=true;$('#vrec-save').hidden=true;$('#vrec-again').hidden=true;
    v.classList.remove('live');v.srcObject=null;v.muted=false;const u=URL.createObjectURL(r.blob);v.src=u;ov.hidden=false;v.play().catch(()=>{});$('#vrec-close').onclick=()=>{v.pause();URL.revokeObjectURL(u);ov.hidden=true}});
  box.querySelectorAll('[data-vidd]').forEach(b=>b.onclick=async()=>{const k=nk(T(b.dataset.vidd));try{await MDB.del('vid',k)}catch(e){}VIDK.delete(k);renderVid()});
}

/* ---------- ДОСКА «ХОЧУ»: реальные просьбы, без заданий и оценок */
const WB_START=[['Хочу банан!','банан'],['Хочу хлеб!','хлеб'],['Хочу палочки!','палочки'],['Хочу пельмени!','пельмени'],['Хочу оладьи!','оладьи'],['Хочу яблоко!','яблоко'],['Хочу гулять!','гулять'],['Хочу в бассейн!','бассейн'],['Хочу в магазин!','магазин'],['Включи пианино!','пианино'],['Включи мультик!','мультик'],['Дай сок!','сок'],['Дай машину!','машина']];
const wbPic=w=>{if(!w)return null;if((window.WBPIC24||{})[w])return window.WBPIC24[w];if(FOODW[w]&&D.foods[FOODW[w]])return D.foods[FOODW[w]].i;if(RPIC[w])return RPIC[w][0];return picWord(w)};
let WBP={};
function wbInit(){if(!S.wb||!Array.isArray(S.wb.cards)){S.wb={n:12,cards:WB_START.map(([t,w],k)=>({id:'s'+k,t,w}))};save()}}
async function wbLoad(){const np={};try{for(const k of await MDB.keys('wb')){if(!/:p$/.test(k))continue;const b=await MDB.get('wb',k);if(b)np[k.slice(0,-2)]=URL.createObjectURL(b)}}catch(e){}Object.values(WBP).forEach(u=>URL.revokeObjectURL(u));WBP=np}
const wbImg=c=>WBP[c.id]?`<img src="${WBP[c.id]}" alt="">`:(wbPic(c.w)?img(wbPic(c.w)):`<span class="wbtxt">${c.t.replace(/</g,'&lt;')}</span>`);
let wbGen=0;
function openWB(){wbInit();stopVoice();const cards=S.wb.cards.slice(0,S.wb.n);const g=$('#wb-grid');g.className='wb-grid n'+cards.length;
  g.innerHTML=cards.map((c,k)=>`<button class="wbcard" data-wb="${k}"><div class="im">${wbImg(c)}</div><b>${c.t.replace(/</g,'&lt;')}</b></button>`).join('');
  g.querySelectorAll('[data-wb]').forEach(b=>b.onclick=()=>wbTap(cards[+b.dataset.wb],b));show('wbscr')}
async function wbTap(c,b){ac();const my=++wbGen;stopVoice();VM.stop();
  document.querySelectorAll('.wbcard.big').forEach(x=>x.classList.remove('big'));b.classList.add('big');sfx.click();
  S.log.push({t:Date.now(),g:'wb',n:c.t,ok:true});save();
  let a=null;try{a=await MDB.get('wb',c.id+':a')}catch(e){}if(my!==wbGen)return;
  if(a)await playURL(URL.createObjectURL(a));else await say(c.t);if(my!==wbGen)return;
  if(S.wbAsk){await wait(1000);if(my!==wbGen)return;const ph=c.t.charAt(0).toLowerCase()+c.t.slice(1);await say('Скажи: '+ph);if(my!==wbGen)return;
    if(S.sayRec&&MIC_OK!==false){const st={};b._st=st;b.classList.add('rec');const blob=await recordFor(4000,{stopper:st});b.classList.remove('rec');if(blob&&blob.size>1200)saveLev('Хочу: '+c.t,blob)}}
  if(my===wbGen)setTimeout(()=>{if(my===wbGen)b.classList.remove('big')},600)}
function renderWBEdit(){wbInit();const box=$('#wb-list');if(!box)return;$('#set-wbon').checked=S.wbOn;{const b=$('#set-body');if(b)b.checked=S.bodyOn!==false}{const m=$('#set-mirr');if(m)m.checked=S.mirrOn!==false}$('#set-wbask').checked=S.wbAsk;$('#set-wbn').value=String(S.wb.n);
  box.innerHTML=S.wb.cards.map((c,k)=>`<div class="rec-row wbrow${k<S.wb.n?'':' off'}"><label class="wbth">${wbImg(c)}<input type="file" accept="image/*" data-wbph="${k}"></label><input type="text" value="${c.t.replace(/"/g,'&quot;')}" data-wbt="${k}" maxlength="40"><button data-wba="${k}" aria-label="Записать голос">●</button><button data-wbp="${k}" aria-label="Послушать">▶</button><button data-wbup="${k}" aria-label="Выше" ${k?'':'disabled style="opacity:.3"'}>↑</button><button data-wbd="${k}" aria-label="Удалить">✕</button></div>`).join('')+
    `<p class="note">На экране — первые ${S.wb.n} карточек (остальные в запасе, бледные). Нажмите на картинку, чтобы поставить своё фото (камера или галерея). ● — записать фразу своим голосом.</p>`;
  const C=k=>S.wb.cards[+k];
  box.querySelectorAll('[data-wbt]').forEach(i=>i.onchange=()=>{C(i.dataset.wbt).t=i.value.trim()||C(i.dataset.wbt).t;save()});
  box.querySelectorAll('[data-wbph]').forEach(i=>i.onchange=async()=>{const f=i.files&&i.files[0];if(!f)return;const b=await shrink(f);if(b){try{await MDB.put('wb',C(i.dataset.wbph).id+':p',b)}catch(e){}await wbLoad();renderWBEdit()}});
  let stopper=null;
  box.querySelectorAll('[data-wba]').forEach(b=>b.onclick=async()=>{if(stopper){stopper.stop&&stopper.stop();return}stopVoice();stopper={};b.classList.add('on');b.textContent='■';
    const blob=await recordFor(5000,{stopper});stopper=null;b.classList.remove('on');b.textContent='●';if(!blob){$('#wb-note').textContent='Микрофон недоступен. Фраза будет звучать голосом приложения (или из «Свой голос»).';return}
    try{await MDB.put('wb',C(b.dataset.wba).id+':a',blob)}catch(e){}b.classList.add('has')});
  box.querySelectorAll('[data-wbp]').forEach(b=>b.onclick=async()=>{const c=C(b.dataset.wbp);const a=await MDB.get('wb',c.id+':a').catch(()=>null);stopVoice();a?playURL(URL.createObjectURL(a)):say(c.t)});
  box.querySelectorAll('[data-wbup]').forEach(b=>b.onclick=()=>{const k=+b.dataset.wbup;if(!k)return;const L=S.wb.cards;[L[k-1],L[k]]=[L[k],L[k-1]];save();renderWBEdit()});
  box.querySelectorAll('[data-wbd]').forEach(b=>b.onclick=async()=>{const k=+b.dataset.wbd,c=S.wb.cards[k];S.wb.cards.splice(k,1);save();for(const s of [':p',':a'])await MDB.del('wb',c.id+s).catch(()=>{});await wbLoad();renderWBEdit()});
  (async()=>{for(const [k,c] of S.wb.cards.entries()){const a=await MDB.get('wb',c.id+':a').catch(()=>null);const b=box.querySelector(`[data-wba="${k}"]`);if(a&&b)b.classList.add('has')}})();
}

/* ---------- «СЕГОДНЯ ДОМА»: одна подсказка маме после занятия */
let TIP=null;
function tipSignals(L){const sig={};const add=(k,w)=>{sig[k]=(sig[k]||0)+w};
  for(const x of L){if(x.ok&&!x.w)continue;const g=x.g;
    if((g==='verb'||g==='pair')&&x.v&&x.picks)x.picks.forEach(p=>{if(typeof p==='string'&&MAIN.concat(['держит','несёт']).includes(p))add('conf:'+[x.v,p].sort().join('|'),3)});
    if(g==='sl')add('conf:лежит|спит',3);if(g==='ib')add('conf:бежит|идёт',3);if(g==='nes')add('conf:держит|несёт',3);
    if((g==='prep'||g==='put'||g==='make')&&x.p)add('prep:'+x.p,g==='make'?1:2);
    if(g==='make'&&x.picks)x.picks.forEach(p=>add('make:'+p,3));
    if(g==='voice'&&(x.hints||0)>=2)add('g:voice',3);
    add('g:'+g,1)}
  return sig}
function chooseTip(){const H=window.HINTS||[];if(!H.length)return null;const name=S.name||'Лев';
  const has=k=>H.some(h=>h.k===k);const t0=G&&G.t0||Date.now()-36e5;const L=S.log.filter(x=>x.t>=t0&&GN[x.g]);
  const sig=tipSignals(L);let key=Object.entries(sig).filter(([k])=>has(k)).sort((a,b)=>b[1]-a[1])[0];key=key&&key[0];
  if(!key){const week=Date.now()-7*864e5;const acc=Object.keys(GN).map(g=>{const v=S.log.filter(x=>x.g===g&&x.t>week);return[g,v.length,v.length?v.filter(x=>x.ok).length/v.length:1]}).filter(r=>r[1]>=3&&has('g:'+r[0])).sort((a,b)=>a[2]-b[2])[0];
    if(acc&&acc[2]<.9)key='g:'+acc[0];else if(S.wbOn&&has('wb')&&S.log.filter(x=>x.g==='wb'&&x.t>week).length<5)key='wb';else key='g:any'}
  const recent=(S.tipLog||[]).slice(-6).map(x=>x.t);const opts=H.filter(h=>h.k===key);const fresh=opts.filter(h=>!recent.includes(h.t));const h=pick(fresh.length?fresh:opts)||pick(H.filter(h=>h.k==='g:any'))||H[0];
  return{k:h.k,raw:h.t,t:h.t.replace(/\{name\}/g,name)}}
function showTip(){if(!TIP)return;const tp=TIP;TIP=null;const ov=$('#tip');$('#tip-text').textContent=tp.t;ov.hidden=false;
  S.tipLog=(S.tipLog||[]).concat([{t:tp.raw,k:tp.k,at:Date.now(),done:false}]).slice(-60);save();
  const close=done=>{if(done){const e=S.tipLog[S.tipLog.length-1];if(e)e.done=true;save();sfx.good()}ov.hidden=true};
  holdBtn($('#tip-done'),()=>close(true));holdBtn($('#tip-close'),()=>close(false))}
function holdBtn(b,fn){let t=null;const clr=()=>{clearTimeout(t);b.classList.remove('holding')};
  b.onpointerdown=e=>{e.preventDefault();b.classList.add('holding');t=setTimeout(()=>{b.classList.remove('holding');fn()},1200)};b.onpointerup=b.onpointerleave=b.onpointercancel=clr;b.oncontextmenu=e=>e.preventDefault()}

