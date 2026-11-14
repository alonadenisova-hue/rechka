/* «Речка»: игры версий 7–14.
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v7 ===================== */
const PIECE_D='M20 20h24a8 8 0 1 1 12 0h24v24a8 8 0 1 0 0 12v24H56a8 8 0 1 0-12 0H20V56a8 8 0 1 1 0-12z';
const MICSVG='<svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12z"/></svg>';
/* ---------- media store: own voice (rec), photos for «Я» (photo), child's attempts (lev) */
const MDB=(()=>{let p=null;const open=()=>p||(p=new Promise((res,rej)=>{try{const r=indexedDB.open('rechka-media',2);
  r.onupgradeneeded=()=>{const db=r.result;['rec','photo','lev','vid','wb'].forEach(n=>{if(!db.objectStoreNames.contains(n))db.createObjectStore(n)})};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}}));
  const tx=(n,m,f)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction(n,m);const q=f(t.objectStore(n));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}));
  return{get:(n,k)=>tx(n,'readonly',o=>o.get(k)),put:(n,k,v)=>tx(n,'readwrite',o=>o.put(v,k)),del:(n,k)=>tx(n,'readwrite',o=>o.delete(k)),keys:n=>tx(n,'readonly',o=>o.getAllKeys())}})();
MDB.keys('rec').then(k=>{REC=new Set(k||[])}).catch(()=>{});

/* ---------- microphone */
let MIC_OK=null; // null = не пробовали, false = нет доступа
async function getMic(){try{if(!navigator.mediaDevices||!window.MediaRecorder)return null;return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}})}catch(e){return null}}
function recordFor(ms,{onLevel,stopper}={}){return new Promise(async res=>{
  const st=await getMic();if(!st){MIC_OK=false;res(null);return}MIC_OK=true;
  let mr;try{mr=new MediaRecorder(st)}catch(e){st.getTracks().forEach(t=>t.stop());res(null);return}
  const ch=[];mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
  mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());res(ch.length?new Blob(ch,{type:mr.mimeType||'audio/webm'}):null)};
  mr.start();
  try{const a=ac();const src=a.createMediaStreamSource(st),an=a.createAnalyser();an.fftSize=512;src.connect(an);const d=new Uint8Array(an.fftSize);
    (function loop(){if(mr.state!=='recording'){onLevel&&onLevel(0);return}an.getByteTimeDomainData(d);let m=0;for(let i=0;i<d.length;i++)m=Math.max(m,Math.abs(d[i]-128));onLevel&&onLevel(m/128);requestAnimationFrame(loop)})()}catch(e){}
  const stop=()=>{try{if(mr.state==='recording')mr.stop()}catch(e){}};if(stopper)stopper.stop=stop;setTimeout(stop,ms)})}
async function saveLev(phrase,blob){try{await MDB.put('lev',Date.now(),{phrase,blob,g:G&&G.game});const ks=(await MDB.keys('lev')).sort((a,b)=>a-b);for(const k of ks.slice(0,Math.max(0,ks.length-60)))await MDB.del('lev',k)}catch(e){}}

/* ---------- «Скажи!»: ребёнок повторяет фразу, приложение записывает и проигрывает его голос */
let sayCount=0;
/* «Что делает лиса?» — сначала без вариантов, ребёнок пробует сказать сам */
async function askFirst(tv){
  let cand=D.actions.filter(a=>a.v===tv&&!a.o&&a.s&&!RARE.includes(a.s));if(!cand.length){const vs=MAIN.filter(v=>D.actions.some(a=>a.v===v&&!a.o&&a.s&&!RARE.includes(a.s)));tv=pick(vs);cand=D.actions.filter(a=>a.v===tv&&!a.o&&a.s&&!RARE.includes(a.s))}if(!cand.length)return;
  const a=pick(cand),R=G.round,q='Что делает '+a.s+'?';setPrompt(q);
  const st=$('#stage');st.innerHTML=`<div class="solo"><div class="pic">${img(a.i)}</div></div>`;
  await say(q);if(G.round!==R||R.dead)return;await wait(3500);if(G.round!==R||R.dead)return;
  await say(cap(a.s)+' '+tv+'!');await wait(300);
}

/* ---------- ПАЗЛ: кусочки за занятия → картинки-наклейки → один большой пазл */
const PZW=600;
const PZ_LIST=(()=>{const L=[],seen=new Set();const add=(i,n)=>{if(i&&IMG[i]&&!seen.has(n)){seen.add(n);L.push({i,n})}};
  ['собака','кошка','заяц','медведь','лошадь','курица','белка','ёж','мышь','гусь','корова','лиса','волк','тигр','енот'].forEach(n=>{const a=D.animals.find(x=>x.n===n);if(a)add(a.i,n)});
  ['машина','самолёт','мяч','бабочка','ракета','лодка','лягушка','вертолёт','цыплёнок','звезда','цветок','солнце'].forEach(n=>{const o=D3.cobj.find(x=>x.n===n);if(o)add(o.i,n)});
  D.animals.forEach(a=>{if(!['мальчик','девочка'].includes(a.n))add(a.i,a.n)});return L})();
const pzGrid=k=>k<3?[2,2]:k<8?[3,2]:[3,3];
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function jigsaw(cols,rows,W,H,seed){const r=rng(seed),Hh=[],Vv=[];
  for(let y=0;y<rows-1;y++){Hh[y]=[];for(let x=0;x<cols;x++)Hh[y][x]=r()<.5?1:-1}
  for(let y=0;y<rows;y++){Vv[y]=[];for(let x=0;x<cols-1;x++)Vv[y][x]=r()<.5?1:-1}
  const cw=W/cols,ch=H/rows;
  const edge=(x1,y1,x2,y2,sg)=>{if(!sg)return `L${x2} ${y2}`;const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),nx=dy/L*sg,ny=-dx/L*sg;
    const P=(t,o)=>`${(x1+dx*t+nx*o*L).toFixed(1)} ${(y1+dy*t+ny*o*L).toFixed(1)}`;
    return `L${P(.37,0)} C${P(.43,.02)} ${P(.31,.21)} ${P(.5,.22)} C${P(.69,.21)} ${P(.57,.02)} ${P(.63,0)} L${x2} ${y2}`};
  const out=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const x0=x*cw,y0=y*ch,x1=x0+cw,y1=y0+ch;
    const top=y>0?-Hh[y-1][x]:0,right=x<cols-1?Vv[y][x]:0,bottom=y<rows-1?Hh[y][x]:0,left=x>0?-Vv[y][x-1]:0;
    out.push({x0,y0,w:cw,h:ch,d:`M${x0} ${y0} ${edge(x0,y0,x1,y0,top)} ${edge(x1,y0,x1,y1,right)} ${edge(x1,y1,x0,y1,bottom)} ${edge(x0,y1,x0,y0,left)}Z`})}
  return out}
const PZBG=['#ffe9a8','#c9ecd9','#ffd3d0','#d5e4ff','#f3d9ff','#d7f3f7','#fde2c4'];
const pzPicCache={};
function pzPic(k){if(pzPicCache[k])return pzPicCache[k];const it=PZ_LIST[k%PZ_LIST.length];
  return pzPicCache[k]=new Promise(res=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=PZW;const x=c.getContext('2d');
    x.fillStyle=PZBG[k%PZBG.length];x.fillRect(0,0,PZW,PZW);
    x.fillStyle='#ffffff';x.beginPath();x.arc(PZW/2,PZW/2,PZW*.45,0,7);x.fill();
    x.globalCompositeOperation='multiply';const sc=Math.min(PZW*.84/im.width,PZW*.84/im.height),w=im.width*sc,h=im.height*sc;x.drawImage(im,(PZW-w)/2,(PZW-h)/2,w,h);
    res(c.toDataURL('image/jpeg',.88))}catch(e){res(IMG[it.i])}};im.onerror=()=>res(IMG[it.i]);im.src=IMG[it.i]})}
const pieceSvg=(p,href,uid,m,stroke=true)=>`<svg viewBox="${p.x0-m} ${p.y0-m} ${p.w+2*m} ${p.h+2*m}"><defs><clipPath id="${uid}"><path d="${p.d}"/></clipPath></defs><image href="${href}" x="0" y="0" width="${PZW}" height="${PZW}" clip-path="url(#${uid})" preserveAspectRatio="none"/>${stroke?`<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>`:''}</svg>`;
let PZS=null; // current puzzle screen state
function pzNow(){const k=S.pz.k,[c,r]=pzGrid(k);return{k,c,r,pieces:jigsaw(c,r,PZW,PZW,1000+k),it:PZ_LIST[k%PZ_LIST.length]}}
/* большой пазл: пейзаж «Речка», 12 кусочков; каждая собранная картинка = кусочек с наклейкой */
const SEASONS=[{n:'Лето',sky1:'#7cc8f5',sky2:'#dff4ff',h1:'#7ccf6b',h2:'#4fae55',g:'#9ddc7c',rv:'#4fb3ff',tr:'#3f9e4d',sun:'#ffd34d'},
  {n:'Осень',sky1:'#f5b98a',sky2:'#fff1dc',h1:'#e6b35a',h2:'#cf8f3e',g:'#f0c66e',rv:'#5fa8e8',tr:'#e07a2f',sun:'#ffb347'},
  {n:'Зима',sky1:'#a9cdee',sky2:'#f2f8ff',h1:'#ffffff',h2:'#dfeaf5',g:'#f6fbff',rv:'#9fd0f0',tr:'#4c8f6a',sun:'#fff3b0'},
  {n:'Весна',sky1:'#94dcff',sky2:'#f0fff4',h1:'#a9e38f',h2:'#86d27a',g:'#c4f0a6',rv:'#62c0ff',tr:'#ff9ecb',sun:'#ffe066'}];
function sceneSvg(b){const c=SEASONS[b%4];const tree=(x,y,k)=>`<rect x="${x-7}" y="${y}" width="14" height="${40*k}" fill="#8a5a2b"/><circle cx="${x}" cy="${y-6}" r="${34*k}" fill="${c.tr}"/><circle cx="${x-22*k}" cy="${y+8}" r="${22*k}" fill="${c.tr}"/><circle cx="${x+22*k}" cy="${y+8}" r="${22*k}" fill="${c.tr}"/>`;
  const cloud=(x,y)=>`<g fill="#fff" opacity=".95"><ellipse cx="${x}" cy="${y}" rx="60" ry="26"/><ellipse cx="${x+40}" cy="${y-16}" rx="40" ry="26"/><ellipse cx="${x-36}" cy="${y-8}" rx="30" ry="20"/></g>`;
  let flakes='';if(b%4===2){const r=rng(5);for(let i=0;i<40;i++)flakes+=`<circle cx="${(r()*1200).toFixed(0)}" cy="${(r()*900).toFixed(0)}" r="${(3+r()*4).toFixed(1)}" fill="#fff"/>`}
  else{const r=rng(9);const fc=['#ff6b5b','#ffc93c','#7b61ff','#fff'];for(let i=0;i<26;i++)flakes+=`<circle cx="${(r()*1200).toFixed(0)}" cy="${(560+r()*330).toFixed(0)}" r="${(5+r()*4).toFixed(1)}" fill="${fc[i%4]}"/>`}
  return `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky1}"/><stop offset="1" stop-color="${c.sky2}"/></linearGradient></defs>
  <rect width="1200" height="900" fill="url(#skyg)"/><g transform="translate(1040 130)"><circle r="70" fill="${c.sun}"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="86" y="-6" width="34" height="12" rx="6" fill="${c.sun}" transform="rotate(${i*45})"/>`).join('')}</g>
  ${cloud(240,120)}${cloud(640,90)}
  <path d="M0 470 Q200 330 420 440 T820 420 T1200 400 V900 H0Z" fill="${c.h1}"/><path d="M0 560 Q260 470 520 560 T1200 520 V900 H0Z" fill="${c.h2}"/><path d="M0 640 Q300 600 600 650 T1200 630 V900 H0Z" fill="${c.g}"/>
  <path d="M760 420 C700 520 980 560 820 660 C700 740 420 720 380 900 L560 900 C600 790 860 800 960 700 C1080 590 860 520 900 420Z" fill="${c.rv}"/>
  <path d="M790 520 q30 -12 60 0 M700 700 q30 -12 60 0 M520 840 q30 -12 60 0" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
  ${tree(110,470,1)}${tree(1120,500,1.1)}${tree(330,560,.8)}${flakes}`}
const BIG={c:4,r:3,W:1200,H:900};
/* ---------- «Занятие дня»: трудное вперемешку с лёгким */
const MIXG=['home','draw','dog','give','nes','not','want','verb','pair','color','prep','size','snd','odd','feed','put','bal','world','dress','catch','num','seq','nes','sl','ib','food','yn','tr'];
function startMix(){const week=Date.now()-7*864e5;const acc=g=>{const L=S.log.filter(x=>x.g===g&&x.t>week);return L.length>=3?L.filter(x=>x.ok).length/L.length:.7};
  const gs=MIXG.concat(Object.keys(PH).length>=2?['me']:[]).concat(D.daina&&D.daina.length?['dai']:[]);
  const weak=gs.filter(g=>g!=='syl').sort((a,b)=>acc(a)-acc(b)+(Math.random()-.5)*.05).slice(0,2);
  const easy=shuffle(gs.filter(g=>!weak.includes(g))).slice(0,3);
  /* v12: игры дня в случайном порядке, одна и та же игра не идёт два раза подряд */
  const bag=[];for(let i=0;i<S.rounds;i++)bag.push(i%2===0?easy[(i>>1)%3]:weak[(i>>1)%2]);let plan;
  for(let t=0;t<50;t++){plan=shuffle(bag);if(plan.every((g,k)=>k===0||g!==plan[k-1]))break}
  ac();G={t0:Date.now(),game:plan[0],i:0,results:[],seen:new Set(),plan};$('#game').classList.remove('withnext','sharik','lesson');shHostStart();show('game');renderDots();nextRound()}

/* ---------- GAME 8: кто как говорит (звукоподражания) */
const ONO={собака:'Гав-гав!',кошка:'Мяу!',лошадь:'И-го-го!',гусь:'Га-га-га!',корова:'Му-у!',курица:'Ко-ко-ко!',мышь:'Пи-пи-пи!',волк:'У-у-у!',медведь:'Р-р-р!',лиса:'Тяв-тяв!',
  коза:'Ме-е-е!',овца:'Бе-е-е!',свинья:'Хрю-хрю!',ослик:'И-а! И-а!',утка:'Кря-кря!',петух:'Ку-ка-ре-ку!',лягушка:'Ква-ква!'};
function picOf(n){const a=D.animals.find(x=>x.n===n);if(a)return a.i;const s=D.actions.find(x=>x.s===n&&!x.o&&['стоит','сидит','идёт'].includes(x.v))||D.actions.find(x=>x.s===n&&!x.o)||D.actions.find(x=>x.s===n);if(s)return s.i;
  const o=D3.cobj.find(x=>x.n===n);if(o)return o.i;const an=D.anims.find(x=>x.s===n);return an?an.a:((window.ANIPIC||{})[n]||null)}
let ONO_L=Object.keys(ONO).map(n=>({n,o:ONO[n],i:picOf(n)})).filter(x=>x.i&&hasSnd(x.n));
async function sndRound(lvl){
  const R=G.round;const t=fresh(()=>pick(ONO_L),x=>x.n);const play=()=>animalSound({n:t.n,snd:t.o});
  const n=lvl===1?2:lvl===2?3:4;const CLASH=[['курица','петух'],['гусь','утка'],['волк','собака'],['коза','овца']];const cl=(a,b)=>CLASH.some(p=>p.includes(a.n)&&p.includes(b.n));const others=[];for(const x of shuffle(ONO_L)){if(others.length>=n-1)break;const all=[t].concat(others);if(all.some(y=>y.n===x.n||y.o===x.o||cl(x,y)))continue;others.push(x)}
  setPrompt('Кто так говорит?');G.round.replay=play;
  if(!await ask('Кто так говорит?','Послушай! Кто так говорит?'))return;await play();if(R.dead)return;
  const ok=await choice(shuffle([t].concat(others).map(x=>({html:img(x.i),ok:x===t,key:x.n}))),{question:'Кто так говорит?',goodText:cap(t.n)+' говорит: '+t.o,sayit:t.o.replace(/!/g,''),onWrong:play});
  return roundDone(ok,{a:t.n});
}

/* ---------- GAME 9: слоги — стучим в барабан на каждый слог */
const SYLW=`мяч стул шкаф зонт стол гусь ёж волк тигр лось сыр мёд сок слон
ли-са ры-ба кош-ка бел-ка ве-дро шап-ка сум-ка лож-ка круж-ка вил-ка лод-ка кеп-ка ёл-ка сли-ва ку-бик со-вок ба-нан мя-со се-но ди-ван цве-ток пе-рец гри-бок е-нот за-яц звез-да сол-нце гор-ка пла-тье ко-за ов-ца ло-шадь
со-ба-ка ко-ро-ва ку-ри-ца ма-ши-на ра-ке-та ба-боч-ка ля-гуш-ка та-рел-ка ка-ран-даш по-ми-дор са-мо-лёт ка-пус-та мор-ков-ка бу-рун-дук вер-то-лёт цып-лё-нок об-ла-ко фут-бол-ка яб-ло-ко ку-ку-ру-за`;
const FOODW={сыр:'cheese',мёд:'honey',сок:'juice',рыба:'fish',мясо:'meat',сено:'hay',морковка:'carrot',грибок:'mushroom',банан:'banana',кукуруза:'corn',капуста:'cabbage',яблоко:'apple'};
function picWord(w){if(FOODW[w]&&D.foods[FOODW[w]])return D.foods[FOODW[w]].i;const o=D3.cobj.filter(x=>x.n===w);if(o.length)return pick(o).i;
  const s=[...D3.size1.flatMap(x=>[x.b,x.s]),...D3.size2].find(x=>x.n===w);if(s)return s.i||s.b;return picOf(w)}
const SYL=SYLW.split(/\s+/).filter(Boolean).map(x=>{const s=x.split('-');return{w:s.join(''),s,i:picWord(s.join(''))}}).filter(x=>x.i).concat(D4.syl.map(x=>({w:x.s.join(''),s:x.s,i:x.i})));
const DRUM='<svg viewBox="0 0 100 100"><ellipse cx="50" cy="72" rx="40" ry="14" fill="#c2453a"/><rect x="10" y="40" width="80" height="32" fill="#ff6b5b"/><g stroke="#ffc93c" stroke-width="3"><path d="M10 46l20 22M30 46l20 22M50 46l20 22M70 46l20 22M30 46 10 68M50 46 30 68M70 46 50 68M90 46 70 68"/></g><ellipse cx="50" cy="40" rx="40" ry="14" fill="#fff4e0" stroke="#c2453a" stroke-width="3"/><path d="M74 4 60 34M26 4l14 30" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><circle cx="74" cy="5" r="5" fill="#8a5a2b"/><circle cx="26" cy="5" r="5" fill="#8a5a2b"/></svg>';
async function sylRound(lvl){
  const R=G.round;const pool=SYL.filter(w=>lvl===1?w.s.length<=2:lvl===2?w.s.length===2:lvl===3?w.s.length>=3:true);
  const w=fresh(()=>pick(pool),x=>x.w);const word=cap(w.w),slow=w.s.join(', ')+'.';
  setPrompt(word);const st=$('#stage');
  st.innerHTML=`<div class="syl"><div class="pic">${img(w.i)}</div><div class="chips">${w.s.map(x=>`<span>${x}</span>`).join('')}</div><button class="drum" aria-label="Барабан">${DRUM}</button></div>`;
  /* v21: уровень 5 «Скажи сам» — барабан слушает микрофон (только громкость) */
  if(lvl===5&&S.sylMic&&MICX!==false){G.round.replay=()=>vsay('Скажи сам!');const r=await sylSelf(w,st,R);if(R.dead)return;
    if(r){sfx.good();confetti(70);R.good=pick(PRAISE);await say(R.good);if(R.dead)return;return roundDone(true,{n:w.s.length,w:w.w,m:'сам',k1:r[0],k2:r[1]})}
    st.querySelector('.syl').classList.remove('self')}
  /* v12: слово и слоги произносит взрослый, приложение только просит стучать */
  G.round.replay=()=>say('Стучи!');
  await say('Стучи!');if(R.dead||!st.querySelector('.drum'))return;
  await new Promise(res=>{let k=0;const chips=[...st.querySelectorAll('.chips span')],drum=st.querySelector('.drum');
    drum.onpointerdown=async e=>{e.preventDefault();if(k>=w.s.length)return;ac();drum.classList.remove('hit');void drum.offsetWidth;drum.classList.add('hit');sfx.drum();chips[k].classList.add('on');k++;
      if(k===w.s.length){await wait(900);res()}}});
  if(R.dead)return;sfx.good();confetti(70);R.good=pick(PRAISE);await say(R.good);if(R.dead)return;
  if(wantSayIt())await sayIt(word,img(w.i));
  return roundDone(true,{n:w.s.length,w:w.w});
}

/* ---------- GAME 10: «Я» — фото ребёнка: «Где ты ешь?» → «Я ем!» */
const ME_V=[['ест','ем','ешь'],['пьёт','пью','пьёшь'],['спит','сплю','спишь'],['сидит','сижу','сидишь'],['стоит','стою','стоишь'],['лежит','лежу','лежишь'],['идёт','иду','идёшь'],['бежит','бегу','бежишь'],
  ['прыгает','прыгаю','прыгаешь'],['рисует','рисую','рисуешь'],['играет','играю','играешь'],['моет руки','мою руки','моешь руки'],['читает','читаю','читаешь'],['смеётся','смеюсь','смеёшься']];
let PH={};
async function loadPhotos(){try{const ks=await MDB.keys('photo');const np={};for(const k of ks){const b=await MDB.get('photo',k);if(b)np[k]=URL.createObjectURL(b)}Object.values(PH).forEach(u=>URL.revokeObjectURL(u));PH=np}catch(e){}renderMeTile()}
function renderMeTile(){const t=$('.tile[data-game="me"]');if(!t)return;const ks=Object.keys(PH);
  $('#art-me').innerHTML=ks.length?`<img src="${PH[ks[0]]}" alt="" style="border-radius:18px;object-fit:cover">`:`<svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="18" fill="#ffb4a8"/><path d="M18 92c2-24 16-34 32-34s30 10 32 34z" fill="#7b61ff"/><text x="50" y="84" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" font-family="sans-serif">Я</text></svg>`;
  t.classList.toggle('off',ks.length<2)}
const meImg=v=>`<img src="${PH[v[0]]}" alt="" style="border-radius:16px">`;
async function meRound(lvl){
  const have=ME_V.filter(v=>PH[v[0]]);
  if(have.length<2){$('#stage').innerHTML='<div class="notice"><b>Здесь будут твои фото!</b><span class="note">Взрослому: подержите шестерёнку на главном экране → «Фото для игры „Я“» и сфотографируйте ребёнка в действии — хотя бы 2 фото.</span></div>';
    setPrompt('Я');say('Попроси маму сфотографировать тебя!');return}
  const t=fresh(()=>pick(have),x=>x[0]),nm=S.name||'Лев';let opts;
  if(lvl===1||have.length<3){opts=[{h:meImg(t),ok:true,k:t[0]},{h:meImg(pick(have.filter(v=>v!==t))),k:'me'}]}
  else if(lvl===2){opts=[{h:meImg(t),ok:true,k:t[0]}].concat(shuffle(have.filter(v=>v!==t)).slice(0,3).map(v=>({h:meImg(v),k:v[0]})))}
  else{const an=shuffle(D.actions.filter(a=>a.v===t[0]&&!a.o&&a.s)).slice(0,2);opts=[{h:meImg(t),ok:true,k:t[0]},{h:meImg(pick(have.filter(v=>v!==t))),k:'me'}].concat(an.map(a=>({h:img(a.i),k:a.s})));
    if(opts.length<4)opts=opts.concat(shuffle(have.filter(v=>v!==t)).slice(0,4-opts.length).map(v=>({h:meImg(v),k:v[0]})));
    opts=opts.filter((o,k,a)=>a.findIndex(y=>y.h===o.h)===k)}
  const q='Где ты '+t[2]+'?';if(!await ask(q))return;
  const ok=await choice(shuffle(opts.map(o=>({html:o.h,ok:!!o.ok,key:o.k}))),{question:q,goodText:nm+' '+t[0]+'.',sayit:'Я '+t[1],sayAlways:true});
  return roundDone(ok,{v:t[0]});
}

/* ---------- GAME 11: что это? — бытовые предметы (фото) */
const WGROUPS=[['кружка','ложка','тарелка','вилка'],['шапка','кепка','футболка','платье'],['стул','стол','шкаф','диван'],['машина','самолёт','вертолёт','лодка','ракета'],['яблоко','слива','банан','помидор','перец','капуста'],['мяч','кубик','совок','ведро','горка','карандаш'],['цветок','ёлка','облако','солнце','звезда'],['бабочка','лягушка','цыплёнок','сумка','зонт']];
const NOTREAL=['облако','солнце','звезда'];const WORDS=[...new Set(D3.cobj.map(o=>o.n))].filter(w=>!NOTREAL.includes(w));
const wpic=n=>pick(D3.cobj.filter(o=>o.n===n)).i;
async function wordRound(lvl){
  const t=fresh(()=>pick(WORDS),x=>x);let others;
  if(lvl<=3)others=shuffle(WORDS.filter(w=>w!==t)).slice(0,(lvl===1?2:lvl===2?4:6)-1);
  else{const g=WGROUPS.find(g=>g.includes(t))||[];let c=shuffle(g.filter(w=>w!==t&&WORDS.includes(w)));if(c.length<3)c=c.concat(shuffle(WORDS.filter(w=>w!==t&&!c.includes(w))).slice(0,3-c.length));others=c.slice(0,3)}
  const q='Где '+t+'?';if(!await ask(q))return;
  const ok=await choice(shuffle([t].concat(others).map(w=>({html:img(wpic(w)),ok:w===t,key:w}))),{question:q,goodText:'Это '+t+'.',sayit:cap(t)});
  return roundDone(ok,{n:t});
}
/* ===================== v7: игры по новым презентациям ===================== */
const COLW={red:'красный',green:'зелёный',blue:'синий',yellow:'жёлтый',orange:'оранжевый',grey:'серый'};
/* сцена 16:9 «на весь экран» (cover): переводит координаты слайда в пиксели сцены */
function sceneLayout(st,ar,contain){const W=st.clientWidth,H=st.clientHeight;const sw=contain?Math.min(W,H*ar):Math.max(W,H*ar),sh=sw/ar,ox=(W-sw)/2,oy=(H-sh)/2;
  return{W,H,port:W/H<1.2,map:(p,min=0)=>{let w=p[2]*sw,h=p[3]*sh;if(min&&Math.max(w,h)<min){const k=min/Math.max(w,h);w*=k;h*=k}
    let x=ox+p[0]*sw-(w-p[2]*sw)/2,y=oy+p[1]*sh-(h-p[3]*sh)/2;x=Math.max(4,Math.min(W-w-4,x));y=Math.max(4,Math.min(H-h-4,y));return{x,y,w,h}}}}
const place=(el,r)=>Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
function flyTo(el,target){return new Promise(res=>{const a=el.getBoundingClientRect(),b=target.getBoundingClientRect();el.style.transition='transform .6s cubic-bezier(.5,-0.3,.5,1.2),opacity .25s .5s';el.style.zIndex=30;
  el.style.transform=`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height*.55-a.top-a.height/2}px) scale(.4)`;el.style.opacity='0';setTimeout(res,650)})}
/* ---------- GAME 12: Дай — на («Катя, дай» и сцены «Дай-на») */
async function daiRound(lvl){
  const R=G.round,st=$('#stage');
  if(lvl===1){const k=fresh(()=>pick(D4.katya.list),x=>x.req);
    st.innerHTML='<div class="scene white"></div>';const sc=st.firstChild;const L=sceneLayout(sc,16/9,true);
    const kat=document.createElement('img');kat.src=IMG[D4.katya.katya];kat.className='hero';
    const req=document.createElement('img');req.src=IMG[k.req];req.className='hero';
    const it=document.createElement('button');it.className='it';it.innerHTML=`<img src="${IMG[k.item]}" alt="">`;
    if(L.port){const W=L.W,H=L.H,z=Math.min(W*.34,H*.2);place(req,{x:W*.3,y:6,w:W*.66,h:H*.44});place(kat,{x:4,y:H*.48,w:W*.58,h:H*.5});place(it,{x:W*.6,y:H*.6,w:z,h:z})}
    else{place(kat,L.map(k.kp));place(req,L.map(k.rp));place(it,L.map(k.ip,80))}
    it.style.visibility='hidden';sc.append(kat,req,it);
    setPrompt('Катя, дай!');G.round.replay=()=>tts('Катя, дай!',{pitch:1.3});G.round.good='На!';
    await tts('Катя, дай!',{pitch:1.3});if(R.dead)return;it.style.visibility='';
    const hint=setTimeout(()=>it.classList.add('hint'),6000);
    await new Promise(res=>{const go=async()=>{clearTimeout(hint);it.onclick=kat.onclick=null;it.classList.remove('hint');ac();sfx.click();await flyTo(it,req);res()};it.onclick=go;kat.onclick=go});
    if(R.dead)return;await say('На!');req.classList.add('yay');sfx.good();confetti(60);await tts('Спасибо!',{pitch:1.3});if(R.dead)return;
    if(wantSayIt())await sayIt('На',`<img src="${IMG[k.item]}" alt="">`);
    return roundDone(true,{who:k.who,m:'katya'})}
  const sc=fresh(()=>pick(D.daina),x=>x.bg);
  st.innerHTML=`<div class="scene" style="background-image:url(${IMG[sc.bg]})"></div>`;const box=st.firstChild;const L=sceneLayout(box,sc.ar);
  const hero=document.createElement('img');hero.src=IMG[sc.sad];hero.className='hero';box.append(hero);
  if(L.port)place(hero,{x:L.W*.2,y:L.H*.52,w:L.W*.6,h:L.H*.46});else place(hero,L.map(sc.hero));
  const colorMode=lvl>=4&&sc.items.filter(i=>i.c).length>=3;
  let pool=sc.items.map(x=>Object.assign({},x));
  if(lvl>=3){const other=pick(D.daina.filter(d=>d.acc!==sc.acc));const spots=[[.08,.12],[.82,.1],[.12,.78],[.85,.78],[.45,.08]];
    shuffle(other.items).slice(0,3).forEach((x,k)=>{const sp=spots[k];pool.push(Object.assign({},x,{p:[sp[0],sp[1],x.p[2],x.p[3]],foreign:true}))})}
  pool=shuffle(pool);const cols=3,rows=Math.ceil(pool.length/cols),cw=L.W/cols,ch=L.H*.5/rows,z=Math.min(cw,ch)*.8;
  const els=pool.map((x,k)=>{const b=document.createElement('button');b.className='it';b.innerHTML=`<img src="${IMG[x.i]}" alt="">`;
    if(L.port){const c=k%cols,r=Math.floor(k/cols);place(b,{x:c*cw+(cw-z)/2+(Math.random()-.5)*cw*.15,y:6+r*ch+(ch-z)/2+(Math.random()-.5)*ch*.15,w:z,h:z})}else place(b,L.map(x.p,64));
    b.style.visibility='hidden';box.append(b);b._x=x;return b});G.round.good='На!';
  const asks=[];if(colorMode){shuffle([...new Set(pool.filter(x=>x.c&&!x.foreign).map(x=>x.c))]).slice(0,3).forEach(c=>asks.push(c))}else asks.push(null,null,null);
  let wrong=0;const who=cap(sc.who);
  for(let k=0;k<asks.length;k++){if(R.dead)return;const c=asks[k];
    const ask=c?'Дай '+COLW[c]+' '+sc.acc+'!':(k===0?'Дай '+sc.acc+'!':'Дай ещё '+sc.acc+'!');setPrompt(ask);G.round.replay=()=>tts(ask,{pitch:1.3});
    await tts(ask,{pitch:1.3});if(R.dead)return;els.forEach(b=>b.style.visibility='');
    let miss=0;
    await new Promise(res=>{els.forEach(b=>{if(b.classList.contains('gone'))return;b.onclick=async()=>{const x=b._x;const ok=!x.foreign&&(!c||x.c===c);ac();
      if(ok){els.forEach(e=>{e.onclick=null;e.classList.remove('hint')});b.classList.add('gone');sfx.click();await flyTo(b,hero);hero.classList.remove('yum');void hero.offsetWidth;hero.classList.add('yum');sfx.chomp();await say('На!');res()}
      else{wrong++;miss++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');await wait(sfx.bad());if(R.dead)return;
        await tts('Нет, это '+(x.c&&!x.foreign?COLW[x.c]+' ':'')+x.n+'! '+ask,{pitch:1.3});
        if(miss>=2)els.forEach(e=>{const y=e._x;if(!e.classList.contains('gone')&&!y.foreign&&(!c||y.c===c))e.classList.add('hint')})}}})});
  }
  if(R.dead)return;hero.src=IMG[sc.happy];hero.classList.add('yay');sfx.up();confetti(120);await tts(who+' говорит: Спасибо!',{pitch:1.3});if(R.dead)return;
  if(lvl>=4&&S.sayit!=='off'||wantSayIt())await sayIt('На',`<img src="${IMG[sc.happy]}" alt="">`);
  return roundDone(wrong===0,{who:sc.who,m:'daina'});
}
/* ---------- GAME 13: один — много */
function manyQ(m,which){return which==='one'?'Где '+(m.g==='m'?'один ':'одна ')+m.n+'?':(which==='lot'?'Где много ':'Где мало ')+m.pl+'?'}
async function manyRound(lvl){
  const m=fresh(()=>pick(D.many),x=>x.n);const which=lvl===3?pick(['one','few','lot']):pick(['one','lot']);let opts;
  if(lvl===1)opts=['one','lot'].map(w=>({w,m}));
  else if(lvl===2){const m2=pick(D.many.filter(x=>x!==m));opts=['one','lot'].flatMap(w=>[{w,m},{w,m:m2}])}
  else opts=['one','few','lot'].map(w=>({w,m}));
  const q=manyQ(m,which);if(!await ask(q))return;
  const good=q.replace(/^Где /,'').replace('?','');
  const ok=await choice(shuffle(opts.map(o=>({html:img(o.m[o.w]),ok:o.m===m&&o.w===which,key:o.w}))),{question:q,goodText:cap(good)+'.',sayit:cap(good),wide:lvl===3});
  return roundDone(ok,{sz:which,n:m.n});
}
/* ---------- GAME 14: где муха? */
const flySvg=(f,cls='')=>{const H=100/f.ar;return `<svg viewBox="0 0 100 ${H.toFixed(1)}" class="${cls}"><image href="${IMG[f.o]}" width="100" height="${H.toFixed(1)}"/><image class="flyimg" href="${IMG[D4.flyimg]}" x="${(f.fx*100-f.fw*55).toFixed(1)}" y="${(f.fy*H-f.fw*45).toFixed(1)}" width="${(f.fw*110).toFixed(1)}" height="${(f.fw*90).toFixed(1)}"/></svg>`};
async function flyRound(lvl){
  const R=G.round,st=$('#stage');const f=fresh(()=>pick(D4.fly),x=>x.o);
  if(lvl===1){if(!await ask('Где муха?','Где муха? Покажи муху!'))return;G.round.replay=()=>say('Где муха? Покажи муху!');G.round.good='Муха на '+f.n+'.';
    st.innerHTML=`<div class="solo"><div class="pic flybox">${flySvg(f)}</div></div>`;const svg=st.querySelector('svg'),fl=svg.querySelector('.flyimg');
    const hit=document.createElementNS('http://www.w3.org/2000/svg','circle');const H=100/f.ar;hit.setAttribute('cx',f.fx*100);hit.setAttribute('cy',f.fy*H);hit.setAttribute('r',Math.max(11,f.fw*80));hit.setAttribute('fill','transparent');hit.style.cursor='pointer';svg.append(hit);
    let miss=0;
    await new Promise(res=>{hit.onclick=e=>{e.stopPropagation();res()};svg.onclick=()=>{miss++;tone(330,0,.12,'sine',.12);if(miss>=2){hit.setAttribute('fill','#ffc93c55');hit.classList.add('slot-hint')}}});
    if(R.dead)return;ac();svg.onclick=null;fl.classList.add('flyaway');sfx.good();confetti(50);await say('Вот муха! Муха на '+f.n+'.');if(R.dead)return;
    if(wantSayIt())await sayIt('Муха на '+f.n,flySvg(f));
    return roundDone(miss===0,{n:f.nom})}
  const n=lvl===2?2:4;const others=shuffle(D4.fly.filter(x=>x.nom!==f.nom)).filter((x,k,a)=>a.findIndex(y=>y.nom===x.nom)===k).slice(0,n-1);
  const q='Где муха на '+f.n+'?';if(!await ask(q))return;
  const ok=await choice(shuffle([f].concat(others).map(x=>({html:flySvg(x),ok:x===f,key:x.nom}))),{question:q,goodText:'Муха на '+f.n+'.'});
  return roundDone(ok,{n:f.nom});
}

/* ---------- GAME 15 (v8): «Положи» — ребёнок сам перетаскивает мяч / машинку / кубик НА, ПОД, В */
const WOOD='#c98a4b',WOOD2='#9c6233';
const FUR={
  стул:{w:100,h:140,acc:'стул',f:{на:'на стуле',под:'под стулом'},
    svg:`<svg viewBox="0 0 100 140"><rect x="18" y="2" width="9" height="62" rx="3" fill="${WOOD2}"/><rect x="73" y="2" width="9" height="62" rx="3" fill="${WOOD2}"/><rect x="16" y="2" width="68" height="12" rx="5" fill="${WOOD}"/><rect x="24" y="26" width="52" height="8" rx="3" fill="${WOOD}"/><rect x="24" y="42" width="52" height="8" rx="3" fill="${WOOD}"/><rect x="13" y="72" width="9" height="68" rx="3" fill="${WOOD2}"/><rect x="78" y="72" width="9" height="68" rx="3" fill="${WOOD2}"/><rect x="6" y="60" width="88" height="13" rx="5" fill="${WOOD}"/></svg>`,
    z:{на:{d:[-.1,-.7,1.1,.47],r:[.5,.43]},под:{d:[.1,.5,.9,1.15],r:[.5,1]}}},
  стол:{w:170,h:110,acc:'стол',f:{на:'на столе',под:'под столом'},
    svg:`<svg viewBox="0 0 170 110"><rect x="10" y="30" width="12" height="80" rx="3" fill="${WOOD2}"/><rect x="148" y="30" width="12" height="80" rx="3" fill="${WOOD2}"/><rect x="12" y="30" width="146" height="8" fill="${WOOD2}"/><rect x="0" y="16" width="170" height="16" rx="5" fill="#d99a55"/></svg>`,
    z:{на:{d:[-.05,-.9,1.05,.25],r:[.5,.15]},под:{d:[.08,.32,.92,1.15],r:[.5,1]}}},
  шкаф:{w:120,h:130,acc:'шкаф',f:{на:'на шкафу',в:'в шкафу'},
    svg:`<svg viewBox="0 0 120 130"><rect x="14" y="118" width="10" height="12" fill="${WOOD2}"/><rect x="96" y="118" width="10" height="12" fill="${WOOD2}"/><rect x="6" y="8" width="108" height="112" rx="6" fill="#e9a15a"/><rect x="2" y="2" width="116" height="12" rx="5" fill="${WOOD}"/><rect x="17" y="24" width="86" height="86" rx="5" fill="#7a4a22"/><rect x="17" y="24" width="86" height="8" fill="#5e3818"/></svg>`,
    z:{на:{d:[-.05,-.8,1.05,.12],r:[.5,.02]},в:{d:[.1,.15,.9,.9],r:[.5,.84]}}},
  коробка:{w:130,h:100,acc:'коробку',f:{в:'в коробке'},
    svg:`<svg viewBox="0 0 130 100"><path d="M18 30 L6 6 L44 14 L50 30Z" fill="#c78c4f"/><path d="M112 30 L124 6 L86 14 L80 30Z" fill="#c78c4f"/><path d="M14 30h102l-4 16H18z" fill="#8a5a2b"/></svg>`,
    front:`<svg viewBox="0 0 130 100"><rect x="10" y="44" width="110" height="56" rx="4" fill="#d9a066"/><rect x="58" y="44" width="14" height="56" fill="#e8c08e"/><path d="M10 44h110" stroke="#b07a40" stroke-width="3"/></svg>`,
    z:{в:{d:[-.05,-.6,1.05,1],r:[.5,.66]}}}};
const OBJ={
  мяч:{acc:'мяч',nom:'мяч',pad:.04,svg:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#ef4a3d"/><path d="M8 44q42 22 84 0M8 58q42 22 84 0" stroke="#fff" stroke-width="8" fill="none"/><path d="M50 4v92" stroke="#ffcf26" stroke-width="7"/><ellipse cx="34" cy="26" rx="10" ry="6" fill="#fff8" transform="rotate(-30 34 26)"/></svg>`},
  машинка:{acc:'машинку',nom:'машинка',pad:.15,svg:`<svg viewBox="0 0 100 100"><path d="M8 70V56q0-8 8-10l14-4 12-16q4-5 10-5h18q6 0 9 5l9 16q8 2 8 10v18z" fill="#2f8be0"/><path d="M36 42l9-13h10v13zM60 42V29h10q3 0 5 3l6 10z" fill="#dff1fb"/><circle cx="28" cy="72" r="12" fill="#24324a"/><circle cx="28" cy="72" r="5" fill="#ccc"/><circle cx="74" cy="72" r="12" fill="#24324a"/><circle cx="74" cy="72" r="5" fill="#ccc"/><rect x="84" y="52" width="8" height="5" rx="2" fill="#ffcf26"/></svg>`},
  мишка:{acc:'мишку',nom:'мишка',pad:.04,svg:`<img src="${(window.IMG9||{})[((window.WORLD||{}).toys||[]).find(x=>x.n==='мишка')?.i]||''}" alt="" style="width:100%;height:100%;object-fit:contain">`},
  кубик:{acc:'кубик',nom:'кубик',pad:.13,svg:`<svg viewBox="0 0 100 100"><path d="M14 30 36 14h52L66 30z" fill="#ffe27a"/><path d="M66 30 88 14v56L66 86z" fill="#e0a800"/><rect x="14" y="30" width="52" height="56" rx="3" fill="#ffcf26"/><text x="40" y="72" text-anchor="middle" font-size="40" font-weight="700" fill="#ef4a3d" font-family="sans-serif">А</text></svg>`}};
/* что можно спросить на уровне: [мебель, предлог] */
const PUTL={1:[['стул','на'],['стол','на'],['коробка','в']],2:[['шкаф','в'],['шкаф','на'],['коробка','в']],3:[['стул','на'],['стул','под'],['стол','на'],['стол','под']]};
async function putRound(lvl){
  const R=G.round;let furs,task,objs;
  const ALL=[];for(const f in FUR)for(const p in FUR[f].f)ALL.push([f,p]);
  /* v12: всегда два места (на стол или на стул?); предлоги В и ПОД чередуются с НА */
  const lastP=G.lastP||'';const wantP=lastP==='на'?pick(lvl===1?['в']:['в','под']):(lastP?'на':pick(['на','в']));G.lastP=wantP;
  const c=fresh(()=>pick(ALL.filter(x=>x[1]===wantP)),x=>x.join());
  const other=pick(Object.keys(FUR).filter(f=>f!==c[0]));furs=shuffle([c[0],other]);task={f:c[0],p:c[1]};
  const on=Object.keys(OBJ);task.o=pick(on);const nObj=lvl>=4?3:lvl===3?2:1;objs=shuffle([task.o].concat(shuffle(on.filter(o=>o!==task.o)).slice(0,nObj-1)));
  const O=OBJ[task.o],F=FUR[task.f];
  const q='Положи '+O.acc+' '+task.p+' '+F.acc+'!';const good=cap(O.nom)+' '+F.f[task.p]+'.';
  if(!await ask(q))return;R.good=good;
  const st=$('#stage');st.innerHTML='<div class="put"></div>';const box=st.firstChild;const W=box.clientWidth,H=box.clientHeight;
  const floor=H*.95,n=furs.length;
  const k=Math.min(W/n*.96/Math.max(...furs.map(f=>FUR[f].w)),H*.55/Math.max(...furs.map(f=>FUR[f].h)));
  const fr={};
  furs.forEach((f,j)=>{const d=FUR[f],w=d.w*k,h=d.h*k,x=(j+.5)*W/n-w/2,y=floor-h;fr[f]={x,y,w,h};
    const el=document.createElement('div');el.className='fur';place(el,{x,y,w,h});el.innerHTML=d.svg;box.append(el);
    if(d.front){const fe=document.createElement('div');fe.className='front';place(fe,{x,y,w,h});fe.innerHTML=d.front;box.append(fe)}});
  const os=Math.max(64,42*k);
  const zoneRect=(f,p)=>{const z=FUR[f].z[p].d,r=fr[f];return{x:r.x+z[0]*r.w,y:r.y+z[1]*r.h,w:(z[2]-z[0])*r.w,h:(z[3]-z[1])*r.h}};
  const rest=(f,p,o)=>{const z=FUR[f].z[p].r,r=fr[f];return{x:r.x+z[0]*r.w-os/2,y:r.y+z[1]*r.h-os+os*(OBJ[o].pad||0)}};
  let wrong=0,hintEl=null;
  const showHint=()=>{if(hintEl)return;const zr=zoneRect(task.f,task.p);hintEl=document.createElement('div');hintEl.className='zone';
    const y=Math.max(4,zr.y),h=Math.min(zr.y+zr.h,floor)-y;place(hintEl,{x:zr.x,y,w:zr.w,h});box.append(hintEl)};
  const tm=setTimeout(()=>{if(G&&G.round===R&&lvl===1)showHint()},7000);
  await new Promise(res=>{
    objs.forEach((o,j)=>{const el=document.createElement('div');el.className='obj';el.innerHTML=OBJ[o].svg;el.setAttribute('aria-label',OBJ[o].nom);
      const home={x:(j+.5)*W/objs.length-os/2+(objs.length>1?0:-W*.18),y:H*.06};place(el,{x:home.x,y:home.y,w:os,h:os});box.append(el);
      let drag=null;
      el.onpointerdown=e=>{if(el.classList.contains('placed'))return;e.preventDefault();ac();el.setPointerCapture(e.pointerId);el.classList.remove('back','bad');el.classList.add('drag');sfx.click();
        const r=el.getBoundingClientRect();drag={dx:e.clientX-r.left-r.width/2,dy:e.clientY-r.top-r.height/2,sx:e.clientX,sy:e.clientY}};
      el.onpointermove=e=>{if(!drag)return;const b=box.getBoundingClientRect();el.style.left=(e.clientX-b.left-drag.dx-os/2)+'px';el.style.top=(e.clientY-b.top-drag.dy-os/2)+'px'};
      el.onpointerup=el.onpointercancel=async e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy);drag=null;el.classList.remove('drag');
        const cx=parseFloat(el.style.left)+os/2,cy=parseFloat(el.style.top)+os/2;
        let hit=null;zl:for(const f of furs)for(const p in FUR[f].z){const z=zoneRect(f,p);if(cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h){hit={f,p};break zl}}
        if(!hit){el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});if(moved<10)say(q);return}
        if(o===task.o&&hit.f===task.f&&hit.p===task.p){clearTimeout(tm);const rp=rest(hit.f,hit.p,o);el.classList.add('placed');place(el,{x:rp.x,y:rp.y,w:os,h:os});
          box.querySelectorAll('.obj').forEach(x=>x.onpointerdown=null);if(hintEl)hintEl.remove();sfx.good();
          const r=el.getBoundingClientRect();confetti(70,r.left+r.width/2,r.top+r.height/2);res();return}
        /* неверно: показываем, куда он положил, и возвращаем */
        wrong++;const rp=rest(hit.f,hit.p,o);el.classList.add('placed');place(el,{x:rp.x,y:rp.y,w:os,h:os});
        const badMs=sfx.bad();await wait(Math.max(700,badMs));if(!box.isConnected)return;
        const what=cap(OBJ[o].nom)+' '+FUR[hit.f].f[hit.p]+'.';
        el.classList.remove('placed');el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});
        if(wrong>=2)showHint();
        await say('Нет, это '+what.toLowerCase().replace(/\.$/,'')+'. '+q)};
    });
  });
  if(R.dead||!G)return;
  await say(pick(PRAISE)+' '+good);if(R.dead)return;
  if(wantSayIt())await sayIt(good.replace(/\.$/,''),OBJ[task.o].svg);
  return roundDone(wrong===0,{p:task.p,n:task.f,o:task.o});
}
const putArt=()=>`<svg viewBox="0 0 120 140"><g transform="translate(10 0)">${FUR.стул.svg.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g><g transform="translate(38 22) scale(.4)">${OBJ.мяч.svg.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>`;

/* ---------- GAME 16 (v9): «Шарики» — три игры по очереди:
   1) «Лопни только красные!»  2) «Что внутри?» — из последнего шарика выпадает картинка  3) слоги и ритмические ряды («мёд — дом — мёд — дом») */
/* ритмические ряды: t3 — 3 тип слоговой структуры (лев, кот), t5 — 5 тип (кошка, утка); src: logo — пары со слайдов логопеда, new — новые пары из тех же картинок */
const RHY=[
  ...[['лев','мышь'],['бык','жук'],['кит','конь'],['сом','кот'],['рак','лис'],['ёж','гусь'],['лось','моль']].map(w=>({w,t:3,a:1,src:'logo'})),
  ...[['лайка','кошка'],['утка','сойка'],['белка','зебра'],['семья','мошка'],['мышка','Настя'],['панда','зайка'],['мишка','Костя']].map(w=>({w,t:5,a:1,src:'logo'})),
  ...[['кот','кит'],['мышь','моль'],['лев','лис'],['рак','бык'],['конь','кот'],['жук','гусь'],['ёж','лось'],['сом','кит'],['лис','лось'],['бык','конь']].map(w=>({w,t:3,a:1,src:'new'})),
  ...[['кошка','мышка'],['мишка','мышка'],['зайка','сойка'],['мошка','кошка'],['Настя','Костя'],['утка','лайка'],['белка','панда'],['зебра','утка'],['лайка','зайка'],['мишка','белка']].map(w=>({w,t:5,a:1,src:'new'})),
  ...[['мёд','дом'],['мяч','дом'],['сок','сыр'],['мёд','сок']].map(w=>({w,t:3,a:0,src:'new'})),
  ...[['шапка','сумка'],['ложка','вилка'],['лодка','кепка'],['ёлка','шапка']].map(w=>({w,t:5,a:0,src:'new'}))];
const rpic=w=>(window.IMG8||{})[w]||picWord(w);
const balInner=(c,inner)=>`<svg viewBox="0 0 60 90">${balloonSvg(c,'').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>${inner?`<span class="bal-in">${inner}</span>`:''}`;
function popFx(b,c,box){const r=b.getBoundingClientRect(),sr=box.getBoundingClientRect();sfx.pop();
  for(let i=0;i<16;i++){const p=document.createElement('span');p.className='burst';p.style.background=c;p.style.left=(r.left-sr.left+r.width/2)+'px';p.style.top=(r.top-sr.top+r.height/3)+'px';
    const ang=i/16*Math.PI*2;p.style.setProperty('--dx',Math.cos(ang)*90+'px');p.style.setProperty('--dy',Math.sin(ang)*90+'px');box.append(p);setTimeout(()=>p.remove(),800)}}
/* 1) лопни только нужный цвет */
async function balOnly(lvl){
  const R=G.round,pal=lvl===1?['red','blue']:lvl===2?['red','yellow','green','blue']:Object.keys(CN);const col=pick(pal);const need=lvl===1?3:lvl===2?4:5;
  const q='Лопни только '+{red:'красные',yellow:'жёлтые',green:'зелёные',blue:'синие',pink:'розовые',white:'белые'}[col]+' шарики!';
  if(!await ask(q))return;R.good=q;
  const st=$('#stage');st.innerHTML=`<div class="sky"><div class="bcount">${Array.from({length:need},()=>`<svg viewBox="0 0 60 90">${balloonSvg(CB[col]).replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`).join('')}</div></div>`;const sky=st.firstChild;
  let got=0,wrong=0,done=false;
  await new Promise(res=>{
    const spawn=()=>{if(done||!sky.isConnected){done=true;return}const c=Math.random()<.45?col:pick(pal.filter(x=>x!==col));const b=document.createElement('button');b.className='balloon';
      b.style.left=(5+Math.random()*75)+'%';b.style.animationDuration=(5.5+Math.random()*3)+'s, '+(1.8+Math.random())+'s';b.innerHTML=balloonSvg(CB[c]);
      b.onpointerdown=async()=>{if(done||b._p)return;b._p=1;ac();
        if(c===col){popFx(b,CB[c],st);b.remove();const ic=sky.querySelectorAll('.bcount svg')[got];if(ic)ic.classList.add('on');got++;
          if(got>=need){done=true;sky.querySelectorAll('.balloon').forEach(x=>x.style.opacity='.3');setTimeout(res,600)}}
        else{wrong++;b._p=0;b.classList.add('nope');setTimeout(()=>b.classList.remove('nope'),500);tone(220,0,.18,'sine',.12);say('Нет, это '+CN[c]+'!');}};
      b.addEventListener('animationend',ev=>{if(ev.animationName==='rise')b.remove()});sky.append(b)};
    for(let k=0;k<5;k++)setTimeout(spawn,k*380);const iv=setInterval(()=>{if(done||!sky.isConnected){done=true;clearInterval(iv)}else spawn()},800)});
  if(R.dead||!G)return;sfx.good();confetti(90);await say(pick(PRAISE));
  return roundDone(wrong<=1,{m:'only',c:col})}
/* 2) что внутри? лопни 3 шарика — из последнего выпадает картинка, потом «Где кошка?» */
const INSIDE=()=>{const L=[];ONO_L.forEach(x=>L.push({n:x.n,i:x.i}));WORDS.forEach(w=>L.push({n:w,i:wpic(w)}));return L.filter((x,k,a)=>a.findIndex(y=>y.n===x.n)===k)};
async function balInside(lvl){
  const R=G.round;const pool=INSIDE();const t=fresh(()=>pick(pool),x=>'in'+x.n);
  if(!await ask('Что внутри? Лопни шарики!'))return;
  const st=$('#stage');const n=3;const cols=shuffle(['red','yellow','green','blue','pink']).slice(0,n);
  st.innerHTML=`<div class="sky bal-row">${cols.map((c,k)=>`<button class="balloon still" data-k="${k}" style="left:${8+k*30}%;animation-delay:${k*.3}s">${balInner(CB[c],k===n-1?'?':'')}</button>`).join('')}</div>`;
  const sky=st.firstChild;let left=n;
  await new Promise(res=>{sky.querySelectorAll('.balloon').forEach(b=>b.onpointerdown=()=>{if(b._p)return;b._p=1;ac();const c=CB[cols[+b.dataset.k]];popFx(b,c,st);b.remove();left--;
    if(left===1){const last=sky.querySelector('.balloon');last&&last.classList.add('hint')}
    if(left===0)res()})});
  if(R.dead)return;
  st.insertAdjacentHTML('beforeend',`<div class="drop">${img(t.i)}</div>`);await wait(900);if(R.dead)return;
  await say('Ой! Что это?');await wait(600);if(R.dead)return;
  const k=lvl===1?2:4;let others;
  if(lvl>=3){const g=WGROUPS.find(g=>g.includes(t.n));others=shuffle(pool.filter(x=>x.n!==t.n&&(!g||g.includes(x.n)))).slice(0,k-1);if(others.length<k-1)others=others.concat(shuffle(pool.filter(x=>x.n!==t.n&&!others.includes(x))).slice(0,k-1-others.length))}
  else others=shuffle(pool.filter(x=>x.n!==t.n)).slice(0,k-1);
  const q='Где '+t.n+'?';if(!await ask(q))return;
  const ok=await choice(shuffle([t].concat(others).map(x=>({html:img(x.i),ok:x===t,key:x.n}))),{question:q,goodText:'Это '+t.n+'.',sayit:cap(t.n)});
  return roundDone(ok,{m:'inside',n:t.n})}
/* 3) слоги и ритмические ряды: шарики стоят в ряд, лопаем по порядку — каждый говорит свой слог или слово */
async function balSyl(lvl){
  const R=G.round;let items,word,pic,say1;
  const rowMode=lvl!==2||Math.random()<.5;
  if(rowMode){const typ=lvl>=4&&Math.random()<.7?5:3;const len=lvl===1?2:lvl===2?4:6;
    const pr=fresh(()=>pick(RHY.filter(r=>r.t===typ&&r.w.every(rpic))),x=>'r'+x.w.join());
    items=Array.from({length:len},(_,k)=>pr.w[k%2]).map(w=>({t:w,pic:rpic(w)}));word=items.map(x=>x.t).join(' — ');say1=items.map(x=>x.t).join(', ');R.rowA=pr.a}
  else{const pool=SYL.filter(w=>lvl===2?w.s.length===2:w.s.length>=2);const w=fresh(()=>pick(pool),x=>'s'+x.w);items=w.s.map(s=>({t:s}));word=cap(w.w);pic=w.i;say1=w.s.join(', ')}
  const q=rowMode?(R.rowA?'Это кто? Лопай по очереди!':'Что это? Лопай по очереди!'):'Лопни слоги — получится слово!';
  if(!await ask(q,rowMode?'Слушай! '+cap(say1)+'. Лопай по очереди!':q))return;
  R.good=rowMode?say1+'.':word+'. '+say1+'.';
  const st=$('#stage');const n=items.length,cols=['red','yellow','green','blue','pink','white'];
  st.innerHTML=`<div class="sky bal-row">${pic?`<div class="bal-pic">${img(pic)}</div>`:''}${items.map((x,k)=>{const per=n>4?3:n,row=Math.floor(k/per),col=k%per;return `<button class="balloon still big" data-k="${k}" style="left:${(100/per)*col+(100/per-24)/2}%;top:${n>4?14+row*40:30}%;animation-delay:${k*.25}s">${balInner(CB[cols[k]],x.pic?`<img src="${IMG[x.pic]||x.pic}" alt="">`:x.t)}</button>`}).join('')}</div>`;
  const bs=[...st.querySelectorAll('.balloon')];let k=0;bs[0].classList.add('hint');
  await new Promise(res=>{bs.forEach((b,j)=>b.onpointerdown=()=>{ac();if(k>=n)return;if(j!==k){bs[k].classList.remove('hint');void bs[k].offsetWidth;bs[k].classList.add('hint');return}
    b.classList.remove('hint');popFx(b,CB[cols[j]],st);b.style.visibility='hidden';tts(items[j].t,{rate:.8});k++;
    if(k<n)bs[k].classList.add('hint');else setTimeout(res,700)})});
  if(R.dead)return;sfx.good();confetti(80);
  await say(rowMode?pick(PRAISE)+' '+say1+'!':pick(PRAISE)+' '+word+'!');if(R.dead)return;
  if(S.sayit!=='off'&&(lvl>=3||wantSayIt()))await sayIt(rowMode?items.map(x=>x.t).join(', '):word,pic?img(pic):`<img src="${IMG[items[0].pic]||items[0].pic}" alt="">`);
  return roundDone(true,{m:rowMode?'ряд':'слоги',w:word})}
/* ===================== v11: «Мир вокруг», «Одень мальчика», «Лови!» ===================== */
const W9=window.WORLD||{};Object.assign(IMG,window.IMG9||{});
const wimg=x=>`<img src="${IMG[x.i]||x.i}" alt="">`;
/* v12: «Мир вокруг» — только фото со слайдов логопеда (каждый раз другой цвет предмета) */
const RPIC=(()=>{const m={};const add=(n,i)=>{if(i)(m[n]=m[n]||[]).push(i)};
  D3.cobj.forEach(o=>{if(!['облако','солнце','звезда'].includes(o.n))add(o.n,o.i)});
  D3.size1.forEach(x=>{if(['дерево','дом','кастрюля','холодильник','шкаф','стол'].includes(x.b.n))add(x.b.n,x.b.i)});
  D3.size2.forEach(x=>{if(['утка','мишка'].includes(x.n))add(x.n,x.b)});
  [['corn','кукуруза','corn']].forEach(([_,n,f])=>{if(D.foods[f])add(n,D.foods[f].i)});
  return m})();
const WTOP={nature:{n:'Природа',w:['дерево','ёлка','цветок','травка','гриб','бабочка','лягушка','цыплёнок','утка']},
  home:{n:'Дом',w:['кружка','ложка','тарелка','вилка','кастрюля','ведро','стул','стол','шкаф','диван','холодильник','зонт','сумка','дом']},
  clothes:{n:'Одежда',w:['шапка','кепка','футболка','платье']},
  food:{n:'Еда',w:['яблоко','банан','слива','перец','помидор','капуста','кукуруза']},
  transport:{n:'Транспорт',w:['машина','самолёт','вертолёт','лодка','ракета']},
  toys:{n:'Игрушки',w:['мяч','кубик','мишка','совок','ведро','горка','карандаш']}};
WTOP.all={n:'Всё вместе',w:[...new Set(Object.values(WTOP).flatMap(t=>t.w))]};
const WSIM={home:[['кружка','ложка','тарелка','вилка','кастрюля','ведро'],['стул','стол','шкаф','диван','холодильник']],
  nature:[['дерево','ёлка','цветок','травка','гриб'],['бабочка','лягушка','цыплёнок','утка']],
  food:[['яблоко','банан','слива'],['перец','помидор','капуста','кукуруза']],clothes:[['шапка','кепка'],['футболка','платье']]};
const wlist=t=>WTOP[t].w.filter(n=>RPIC[n]).map(n=>({n,i:pick(RPIC[n])}));
function topicPick(){return new Promise(res=>{const st=$('#stage');setPrompt('Что будем учить?');
  st.innerHTML=`<div class="topics">${['nature','home','clothes','food','transport','toys','all'].map(t=>{const L=wlist(t);const ic=L.find(x=>['дерево','стул','футболка','яблоко','машина','мяч'].includes(x.n))||L[0];return `<button class="opt topic" data-t="${t}">${wimg(ic)}<b>${WTOP[t].n}</b></button>`}).join('')}</div>`;
  say('Что будем учить?');
  st.querySelectorAll('.topic').forEach(b=>b.onclick=()=>{ac();sfx.click();stopVoice();res(b.dataset.t)})})}
/* ---------- «Одень мальчика»: мальчик в майке; одежда разных цветов, выбор из 2–4 */
const DCOL={red:['#ef4a3d','красн'],blue:['#2f8be0','син'],green:['#45b649','зелён'],yellow:['#ffcf26','жёлт']};
const adjEnd=(c,g)=>{const soft=c==='blue';return DCOL[c][1]+(g==='f'?(soft?'юю':'ую'):g==='pl'?(soft?'ие':'ые'):(soft?'ий':'ый'))};
const adjNom=(c,g)=>{const soft=c==='blue';return DCOL[c][1]+(g==='f'?(soft?'яя':'ая'):g==='pl'?(soft?'ие':'ые'):(soft?'ий':'ый'))};
const DITEMS={
  трусы:{g:'pl',acc:'трусы',vb:'60 190 80 60',z:3,d:c=>`<path d="M72 200h56l2 26q-14 6-24 4l-6-12-6 12q-10 2-24-4z" fill="${c}" stroke="#0002" stroke-width="2"/>`},
  шорты:{g:'pl',acc:'шорты',vb:'55 190 90 100',z:4,d:c=>`<path d="M70 198h60l6 76h-30l-6-44-6 44H64z" fill="${c}" stroke="#0002" stroke-width="2"/><path d="M70 206h60" stroke="#0003" stroke-width="3"/>`},
  футболка:{g:'f',acc:'футболку',vb:'30 95 140 130',z:5,d:c=>`<path d="M74 104l-34 22 14 28 18-10v66h56v-66l18 10 14-28-34-22q-26 14-52 0z" fill="${c}" stroke="#0002" stroke-width="2"/><path d="M86 106q14 10 28 0" stroke="#0003" stroke-width="3" fill="none"/>`},
  носки:{g:'pl',acc:'носки',vb:'55 320 90 70',z:2,d:c=>`<path d="M74 330h16v38q0 8-8 8H66q-4-8 8-12z" fill="${c}" stroke="#0002" stroke-width="2"/><path d="M110 330h16v34q12 4 8 12h-16q-8 0-8-8z" fill="${c}" stroke="#0002" stroke-width="2"/><path d="M74 336h16M110 336h16" stroke="#fff8" stroke-width="3"/>`},
  сандалии:{g:'pl',acc:'сандалии',vb:'50 332 100 60',z:6,d:c=>`<path d="M56 374q24-6 42 0v10H56zM102 374q18-6 42 0v10h-42z" fill="#8a5a2b"/><path d="M62 374q16-24 34 0M106 374q16-24 34 0" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M66 362h26M110 362h26" stroke="${c}" stroke-width="6" stroke-linecap="round"/><circle cx="92" cy="362" r="3.5" fill="#ffcf26"/><circle cx="136" cy="362" r="3.5" fill="#ffcf26"/>`},
  кепка:{g:'f',acc:'кепку',vb:'50 0 110 60',z:7,d:c=>`<path d="M62 46q0-40 38-40t38 40z" fill="${c}" stroke="#0002" stroke-width="2"/><path d="M128 42q22 0 28 8h-30z" fill="${c}" stroke="#0002" stroke-width="2"/><circle cx="100" cy="8" r="4" fill="${c}"/>`},
  очки:{g:'pl',acc:'очки',vb:'60 40 80 40',z:8,d:c=>`<circle cx="84" cy="60" r="12" fill="#ffffff55" stroke="${c}" stroke-width="5"/><circle cx="116" cy="60" r="12" fill="#ffffff55" stroke="${c}" stroke-width="5"/><path d="M96 60h8" stroke="${c}" stroke-width="5"/>`}};
const BOY=`<g><path d="M76 104l-30 24 10 22 20-12z" fill="#f2c4a0"/><path d="M124 104l30 24-10 22-20-12z" fill="#f2c4a0"/><path d="M48 144l-6 70" stroke="#f2c4a0" stroke-width="15" stroke-linecap="round"/><path d="M152 144l6 70" stroke="#f2c4a0" stroke-width="15" stroke-linecap="round"/>
<rect x="72" y="100" width="56" height="112" rx="16" fill="#f2c4a0"/><path d="M74 104h52v100H74z" fill="#ffffff"/><path d="M84 104v14M116 104v14" stroke="#ddd" stroke-width="2"/>
<rect x="72" y="196" width="56" height="30" rx="8" fill="#f2c4a0"/><rect x="74" y="212" width="18" height="160" rx="9" fill="#f2c4a0"/><rect x="108" y="212" width="18" height="160" rx="9" fill="#f2c4a0"/>
<ellipse cx="80" cy="374" rx="16" ry="7" fill="#f2c4a0"/><ellipse cx="120" cy="374" rx="16" ry="7" fill="#f2c4a0"/>
<rect x="90" y="86" width="20" height="20" fill="#f2c4a0"/><circle cx="100" cy="56" r="38" fill="#f6cfaa"/><path d="M62 52q2-40 38-40t38 40q-10-18-38-18t-38 18z" fill="#7a4a22"/>
<circle cx="86" cy="60" r="4.5" fill="#24324a"/><circle cx="114" cy="60" r="4.5" fill="#24324a"/><path d="M88 76q12 10 24 0" stroke="#24324a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="78" cy="72" r="6" fill="#ff9c8a77"/><circle cx="122" cy="72" r="6" fill="#ff9c8a77"/></g>`;
const dressSvg=(on)=>`<svg viewBox="0 0 200 400">${BOY}${Object.keys(on).sort((a,b)=>DITEMS[a].z-DITEMS[b].z).map(k=>`<g class="worn" data-k="${k}">${DITEMS[k].d(DCOL[on[k]][0])}</g>`).join('')}</svg>`;
const itemSvg=(k,c)=>`<svg viewBox="${DITEMS[k].vb}">${DITEMS[k].d(DCOL[c][0])}</svg>`;
async function dressRound(lvl){
  const R=G.round;G.boy=G.boy||{};
  const left=Object.keys(DITEMS).filter(k=>!G.boy[k]);if(!left.length)G.boy={};
  const pool=Object.keys(DITEMS).filter(k=>!G.boy[k]);const k=pool.includes('трусы')&&Object.keys(G.boy).length===0?'трусы':pick(pool.filter(x=>x!=='трусы'||!G.boy.шорты));
  const cols=Object.keys(DCOL);const c=pick(cols);const it=DITEMS[k];
  let opts;const useCol=lvl>=3;
  if(lvl===1)opts=[{k,c},{k:pick(Object.keys(DITEMS).filter(x=>x!==k)),c:pick(cols)}];
  else if(lvl===2)opts=[{k,c}].concat(shuffle(Object.keys(DITEMS).filter(x=>x!==k)).slice(0,3).map(x=>({k:x,c:pick(cols)})));
  else if(lvl===3)opts=[{k,c}].concat(shuffle(cols.filter(x=>x!==c)).slice(0,3).map(x=>({k,c:x})));
  else{const k2=pick(Object.keys(DITEMS).filter(x=>x!==k));const c2=pick(cols.filter(x=>x!==c));opts=[{k,c},{k,c:c2},{k:k2,c},{k:k2,c:c2}]}
  const name=(useCol?adjEnd(c,it.g)+' ':'')+it.acc;const q='Дай мальчику '+name+'!';
  if(!await ask(q))return;
  const nom=(useCol?adjNom(c,it.g)+' ':'')+k;R.good=cap(nom)+'.';
  const st=$('#stage');st.innerHTML=`<div class="dress"><div class="boy">${dressSvg(G.boy)}</div><div class="grid n${opts.length} dopts">${shuffle(opts).map(o=>`<button class="opt" data-k="${o.k}" data-c="${o.c}">${itemSvg(o.k,o.c)}</button>`).join('')}</div></div>`;
  const boy=st.querySelector('.boy');let wrong=0;
  await new Promise(res=>{st.querySelectorAll('.dopts .opt').forEach(b=>b.onclick=async()=>{if(b._lock)return;ac();
    const ok=b.dataset.k===k&&b.dataset.c===c;
    if(ok){st.querySelectorAll('.dopts .opt').forEach(x=>x._lock=1);sfx.click();await flyTo(b,boy);G.boy[k]=c;boy.innerHTML=dressSvg(G.boy);const w=boy.querySelector(`.worn[data-k="${k}"]`);w&&w.classList.add('popin');sfx.good();confetti(60);res()}
    else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');await wait(sfx.bad());if(R.dead)return;
      const wk=b.dataset.k,wc=b.dataset.c,wi=DITEMS[wk];await say('Нет, это '+(useCol?adjNom(wc,wi.g)+' ':'')+wk+'. '+q);
      if(wrong>=2)st.querySelectorAll('.dopts .opt').forEach(x=>{if(x.dataset.k===k&&x.dataset.c===c)x.classList.add('hint')})}})});
  if(R.dead)return;await say(pick(PRAISE)+' '+cap(nom)+'!');if(R.dead)return;
  if(Object.keys(G.boy).length===Object.keys(DITEMS).length){sfx.up();confetti(160);await say('Мальчик оделся! Ура!');}
  if(wantSayIt())await sayIt(cap(nom),itemSvg(k,c));
  return roundDone(wrong===0,{n:k,c})}

/* ---------- «Лови!»: предметы падают сверху, ребёнок двигает корзинку (или нажимает на нужный предмет) */
const CATS={фрукты:'fruit',овощи:'veg',животных:'animals',одежду:'clothes',игрушки:'toys'};
const CATNOM={фрукты:'фрукт',овощи:'овощ',животных:'животное',одежду:'одежда',игрушки:'игрушка'};
const BASKET='<svg viewBox="0 0 120 80"><path d="M10 26h100l-12 50H22z" fill="#d9a066" stroke="#a8743c" stroke-width="3"/><path d="M20 40h80M24 56h72M40 26l4 50M60 26v50M80 26l-4 50" stroke="#a8743c" stroke-width="3"/><path d="M28 26q32-34 64 0" stroke="#a8743c" stroke-width="6" fill="none"/><rect x="6" y="20" width="108" height="10" rx="5" fill="#c98a4b"/></svg>';
async function catchRound(lvl){
  const R=G.round;const allItems=['fruit','veg','animals','clothes','toys','home','nature'].flatMap(c=>(W9[c]||[]).map(x=>Object.assign({c},x)));
  let target,q,isT,nameOf;
  if(lvl===1){const pool=(W9.fruit||[]).concat(W9.toys||[],W9.animals||[]);target=fresh(()=>pick(pool),x=>'c'+x.n);q='Лови '+(ACC1[target.n]||target.n)+'!';isT=x=>x.n===target.n}
  else{const cat=fresh(()=>pick(Object.keys(CATS)),x=>'k'+x);target={cat};q='Лови '+cat+'!';isT=x=>x.c===CATS[cat]}
  const need=lvl===1?3:lvl===2?4:5,speed=lvl<=2?7:lvl===3?5.5:4.5;
  if(!await ask(q))return;R.good=q;
  const st=$('#stage');st.innerHTML=`<div class="catch"><div class="bcount">${Array.from({length:need},()=>`<span class="cb">${BASKET}</span>`).join('')}</div><div class="basket">${BASKET}</div></div>`;
  const box=st.firstChild,bk=box.querySelector('.basket');const W=box.clientWidth,H=box.clientHeight;let bx=W/2;
  const placeB=()=>{bk.style.left=(bx-bk.offsetWidth/2)+'px'};placeB();
  box.onpointerdown=box.onpointermove=e=>{if(e.type==='pointermove'&&!e.buttons&&e.pointerType==='mouse')return;const r=box.getBoundingClientRect();bx=Math.max(40,Math.min(W-40,e.clientX-r.left));placeB()};
  let got=0,wrong=0,done=false;const falling=new Set();
  const distract=lvl>=4&&target.cat?allItems.filter(x=>!isT(x)&&(['fruit','veg'].includes(CATS[target.cat])?['fruit','veg'].includes(x.c):true)):allItems.filter(x=>!isT(x));
  const spawn=()=>{if(done||!box.isConnected)return;const good=Math.random()<.45;const it=good?pick(allItems.filter(isT)):pick(distract);
    const el=document.createElement('button');el.className='fall';el.innerHTML=wimg(it);const sz=Math.min(96,W*.22);el.style.width=el.style.height=sz+'px';
    const x=10+Math.random()*(W-sz-20);el.style.left=x+'px';el.style.top=(-sz)+'px';box.append(el);
    const o={el,it,x,y:-sz,sz,v:(H+sz)/(speed*60)};falling.add(o);
    el.onpointerdown=e=>{e.stopPropagation();if(o.done)return;if(isT(it))catchIt(o,true);else{wrongIt(o)}}};
  const catchIt=(o,tap)=>{o.done=true;falling.delete(o);const it=o.it;
    if(tap){o.el.style.transition='left .35s,top .35s,transform .35s';o.el.style.left=(bx-o.sz/2)+'px';o.el.style.top=(H-60)+'px';o.el.style.transform='scale(.4)'}else{o.el.style.transition='transform .25s';o.el.style.transform='scale(.3)'}
    catchFx(o,box,bk);setTimeout(()=>o.el.remove(),380);bk.classList.remove('yum');void bk.offsetWidth;bk.classList.add('yum');
    const ic=box.querySelectorAll('.bcount .cb')[got];if(ic)ic.classList.add('on');got++;say(cap(it.n)+'!');
    if(got>=need){done=true}};
  const wrongIt=o=>{o.done=true;falling.delete(o);wrong++;o.el.classList.add('nope');tone(220,0,.18,'sine',.12);
    say(target.cat?'Это '+o.it.n+' — не '+CATNOM[target.cat]+'!':'Это '+o.it.n+'!');setTimeout(()=>o.el.remove(),500)};
  await new Promise(res=>{let last=performance.now(),acc=0;const iv=setInterval(spawn,lvl<=2?1300:1000);spawn();
    const loop=t=>{if(!box.isConnected||R.dead){clearInterval(iv);res();return}const dt=Math.min(50,t-last)/16.7;last=t;
      for(const o of [...falling]){o.y+=o.v*dt;o.el.style.top=o.y+'px';
        const bw=bk.offsetWidth,by=H-bk.offsetHeight;if(o.y+o.sz*.7>by&&o.y<by+20&&Math.abs(o.x+o.sz/2-bx)<bw/2){if(isT(o.it))catchIt(o,false);else wrongIt(o)}
        else if(o.y>H){o.done=true;falling.delete(o);o.el.remove()}}
      if(done){clearInterval(iv);for(const o of falling)o.el.style.opacity='.3';setTimeout(res,700);return}
      requestAnimationFrame(loop)};requestAnimationFrame(loop)});
  if(R.dead||!G)return;sfx.good();confetti(100);await say(pick(PRAISE)+' Полная корзинка!');
  return roundDone(wrong<=1,{m:target.cat||'предмет',n:target.n||target.cat})}
const ACC1={собака:'собаку',кошка:'кошку',корова:'корову',свинья:'свинью',лягушка:'лягушку',курица:'курицу',утка:'утку',мышка:'мышку',лиса:'лису',обезьяна:'обезьяну',лошадь:'лошадь',груша:'грушу',вишня:'вишню',клубника:'клубнику',мишка:'мишку',зайчик:'зайчика',медведь:'медведя',лев:'льва',слон:'слона',тигр:'тигра',мяч:'мяч',шарик:'шарик',пазл:'пазл'};

/* ---------- GAME (v12): «Цифры» 1–5 — сколько? обведи цифру, найди столько же */
const NUMW=['ноль','один','два','три','четыре','пять'];
const NUMOBJ=['яблоко','мяч','кубик','машина','утка','кружка','цыплёнок','банан','лодка','бабочка'];
const DIGP={1:'M70 78 L118 34 L118 230',2:'M52 82 C52 18 158 18 152 86 C146 132 92 170 50 230 L162 230',
  3:'M52 56 C86 14 162 24 148 82 C138 118 104 122 92 122 C134 122 168 148 156 192 C144 246 74 246 48 210',
  4:'M120 30 L44 166 L168 166 M132 96 L132 232',5:'M152 36 L72 36 L64 116 C102 94 162 106 156 172 C150 236 80 246 50 212'};
const numCard=(n,pic)=>{const cols=n<=2?n:n<=4?2:3;return `<div class="cnt c${cols}${n<=2?' r1':''}">${Array.from({length:n},()=>`<img src="${IMG[pic]||pic}" alt="">`).join('')}</div>`};
const digCard=d=>`<span class="digit">${d}</span>`;
function numPool(lvl){return lvl===1?[1,2,3]:[1,2,3,4,5]}
function numOthers(n,lvl,k){const pool=numPool(lvl).filter(x=>x!==n);if(lvl>=3){const near=pool.filter(x=>Math.abs(x-n)===1);return shuffle(near).concat(shuffle(pool.filter(x=>!near.includes(x)))).slice(0,k)}return shuffle(pool).slice(0,k)}
/* ---------- v13: рука с пальчиками (1–5) */
function handSvg(n){const F=[[62,92,-28],[80,40,-8],[100,30,0],[120,38,8],[138,56,18]];const order=[1,2,3,4,0];const up=new Set(order.slice(0,n));if(n===5)up.add(0);
  const fing=(k)=>{const [x,top,rot]=F[k];const isUp=up.has(k);const len=isUp?(k===0?52:110-top+20):26;const w=k===0?22:19;
    return `<rect x="${x-w/2}" y="${isUp?(k===0?150-len:150-len):128}" width="${w}" height="${len+10}" rx="${w/2}" fill="#f6cfaa" stroke="#d9a47c" stroke-width="2.5" transform="rotate(${isUp?rot:rot/2} ${x} 150)"/>`+(isUp&&k?`<path d="M${x-5} ${150-len+12}h10" stroke="#e8b893" stroke-width="2" transform="rotate(${rot} ${x} 150)"/>`:'')};
  return `<svg viewBox="20 10 160 210">${[0,1,2,3,4].map(fing).join('')}<path d="M60 128q-4 60 18 80h56q22-20 20-74q-6-14-20-12z" fill="#f6cfaa" stroke="#d9a47c" stroke-width="2.5"/>${[1,2,3,4].filter(k=>!up.has(k)).map(k=>`<path d="M${F[k][0]-8} 140q8 6 16 0" stroke="#d9a47c" stroke-width="2.5" fill="none"/>`).join('')}<rect x="74" y="204" width="64" height="14" rx="6" fill="#7b61ff"/></svg>`}
async function numFingers(lvl,n,nOpt){
  const q='Сколько пальчиков?';if(!await ask(q,'Посчитай пальчики! Сколько?'))return;
  const st=$('#stage');st.innerHTML=`<div class="numwrap"><div class="countbox hand">${handSvg(n)}</div><div class="grid n${nOpt} numopts"></div></div>`;
  const opts=shuffle([n].concat(numOthers(n,lvl,nOpt-1)));const box=st.querySelector('.numopts');
  const ok=await new Promise(res=>{let wrong=0;opts.forEach(d=>{const b=document.createElement('button');b.className='opt';b.innerHTML=digCard(d);box.append(b);
    b.onclick=async()=>{if(b._l)return;ac();if(d===n){box.querySelectorAll('.opt').forEach(x=>x._l=1);b.classList.add('good');sfx.good();confetti(60);G.round.good=cap(NUMW[n])+'!';await say(pick(PRAISE)+' '+cap(NUMW[n])+'!');res(wrong===0)}
      else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');await wait(sfx.bad());await say('Нет. Посчитай пальчики!');if(wrong>=2)box.querySelectorAll('.opt').forEach((x,k)=>{if(opts[k]===n)x.classList.add('hint')})}}})});
  return roundDone(ok,{m:'пальчики',n})}

/* ---------- v13: «Повтори!» — 3–7 картинок показываются 3 секунды, потом ребёнок выкладывает их по порядку */
/* ---------- v13: «Хочу» — ребёнок выбирает, что он хочет; приложение говорит образец «Я хочу мячик!» */
const ACCW=n=>/[ая]$/.test(n)&&!['дерево'].includes(n)?n.replace(/а$/,'у').replace(/я$/,'ю'):n;
const WANT=['яблоко','банан','слива','мяч','кубик','мишка','машина','самолёт','вертолёт','лодка','ракета','шапка','кепка','футболка','платье','кружка','горка','совок','ведро','карандаш','помидор','капуста','перец','кукуруза','цыплёнок','бабочка'];
/* ===================== v14: игры по новым презентациям (несёт/держит, спит/лежит, идёт/бежит, съедобное) ===================== */
const FIX7={home:7,draw:6,not:10,dog:5,voice:5,rh:3,pg:3,br:3,dogs:3,tr:10,yn:10,nes:7,sl:7,ib:7,food:7}; // в этих играх 7 заданий
/* НЕСЁТ (идёт с предметом — анимация) / ДЕРЖИТ (стоит с тем же предметом — неподвижный кадр) */
const NES=[['24cae7ddc528','собака','кость'],['3cb5cc83ea20','медведь','мёд'],['66c419d89c0b','дедушка','ведро'],['69c2781ebf0e','ослик','мешки'],['7040b4184ec1','белка','орехи'],
  ['922d56534f4e','обезьянка','бананы'],['9f1a0cb62cd1','почтальон','коробку'],['a5b8d2ebf749','слон','бревно'],['b04be4281ac6','девочка','пиццу'],['bc1d1f9df199','зайчик','морковку'],
  ['be420abe8a07','панда','бамбук'],['c99eaad4b47f','мальчик','мяч'],['e84738248259','девочка','цветы'],['f0150d15772d','кошка','мышку'],['f85223bf64cd','бабушка','корзинку']]
  .map(([h,s,o])=>({h,s,o,walk:'anim/a_'+h+'.webp',hold:'h_'+h}));
const nesCard=(x,v)=>`<img src="${v==='несёт'?x.walk:IMG[x.hold]}" alt="">`;
/* СПИТ / ЛЕЖИТ и ИДЁТ / БЕЖИТ: на одной паре картинок два вопроса в случайном порядке */
async function twoQ(opts,verbs,setKey){
  const order=rmode(setKey,2)===0?verbs:[verbs[1],verbs[0]];let all=true;
  for(const v of order){const t=opts.find(o=>o.v===v);const q='Кто '+v+'?';if(!await ask(q))return null;
    let good=cap(t.s)+' '+v+'.';
    if(v==='спит')good=cap(t.s)+' спит — глазки закрыты.';
    if(v==='лежит'&&opts.some(o=>o.v==='спит'))good=cap(t.s)+' лежит — не спит, глазки открыты.';
    const ok=await choice(shuffle(opts.map(a=>({html:img(a.i),ok:a===t,key:a.v}))),{question:q,goodText:good});
    if(!ok)all=false;if(!G||G.round.dead)return null;await wait(350)}
  return all}
async function slRound(lvl){
  const P=D2.pairs.filter(p=>p.set==='sl');const pr=fresh(()=>pick(P),x=>x.a[0].i);
  const ok=await twoQ(pr.a,['спит','лежит'],'slq');if(ok===null)return;
  return roundDone(ok,{v:'спит/лежит',n:pr.a[0].s})}
/* СЪЕДОБНОЕ — НЕСЪЕДОБНОЕ: еду тащим на стол, всё остальное — в коробку (картинки со слайда «Буду — не буду») */
const FOOD_Y=[['05','сыр'],['08','суп'],['09','мёд'],['13','хлеб'],['15','лимон'],['16','салат'],['19','горох'],['21','перец'],['22','пирог']].map(([k,n])=>({i:'f_'+k,n,e:true}));
const FOOD_N=[['04','кошка'],['06','дом'],['07','жук'],['12','вагон'],['14','сапог'],['17','жираф'],['18','утюг'],['20','сачок'],['23','пень'],['24','цветы']].map(([k,n])=>({i:'f_'+k,n,e:false}));
function foodBag(key,pool){G.fb=G.fb||{};let b=G.fb[key];if(!b||!b.length)b=G.fb[key]=shuffle(pool.slice());return b.pop()}
async function foodRound(lvl){
  const R=G.round;const spec=FOODLV[lvl]||FOODLV[1];const pools={fy:FAM_Y,fn:FAM_N,y:FOOD_Y,n:FOOD_N};const items=[];
  for(const [p,c] of spec){let got=0,t=0;while(got<c&&t<60){t++;const x=foodBag(p,pools[p]);if(x&&!items.some(y=>y.n===x.n)){items.push(x);got++}}}
  shuffle(items);
  const q='Еду — на стол, остальное — в коробку!';const first=!G.foodAsked;G.foodAsked=true;
  if(!await ask(q,first?'Что можно есть — неси на стол. Что нельзя есть — в коробку!':'Что можно есть — на стол. Что нельзя — в коробку!'))return;R.good=q;
  const st=$('#stage');st.innerHTML='<div class="put food"><div class="kit"></div></div>';const box=st.firstChild,kit=box.firstChild;
  const W=box.clientWidth,H=box.clientHeight,SH=H*.74;
  /* кухня (картинка 3:2) «cover», стол слева всегда виден */
  const sw=Math.max(W,SH*1.5),sh=sw/1.5;const ox=Math.max(W-sw,Math.min(0,W*.3-.32*sw)),oy=Math.max(SH-sh,Math.min(0,SH*.62-.6*sh));
  Object.assign(kit.style,{height:SH+'px',backgroundImage:`url(${IMG.kitchen})`,backgroundSize:sw+'px '+sh+'px',backgroundPosition:ox+'px '+oy+'px'});
  const os=Math.min(H*.2,W/(items.length+.6)*.9,140);
  const tz={x:ox+.11*sw,y:oy+.47*sh,w:.43*sw,h:.24*sh};tz.x=Math.max(0,tz.x);const flip=rmode('foodside',2)===1;if(flip){kit.style.transform='scaleX(-1)';tz.x=Math.max(0,W-tz.x-tz.w)}
  const bw=Math.min(W*.34,SH*.5*1.3),bh=bw/1.3;const bx={x:flip?W*.03:W*.97-bw,y:SH*.97-bh,w:bw,h:bh};
  const bEl=document.createElement('div');bEl.className='fur';place(bEl,bx);bEl.innerHTML=FUR.коробка.svg;box.append(bEl);
  const bFr=document.createElement('div');bFr.className='front';place(bFr,bx);bFr.innerHTML=FUR.коробка.front;box.append(bFr);
  const bz={x:bx.x-bw*.08,y:bx.y-bh*.7,w:bw*1.16,h:bh*1.7};
  const slots={t:0,b:0};
  const rest=(where,el)=>{if(where==='t'){const k=slots.t++;const cx=tz.x+tz.w*(.15+((k*.27)%0.75));return{x:cx-os*.4,y:oy+.6*sh-os*.75,w:os*.8,h:os*.8}}
    const k=slots.b++;const cx=bx.x+bw*(.3+((k*.2)%0.5));return{x:cx-os*.35,y:bx.y+bh*.48-os*.55,w:os*.7,h:os*.7}};
  const tHint=document.createElement('div');tHint.className='zone';place(tHint,tz);tHint.hidden=true;box.append(tHint);
  const bHint=document.createElement('div');bHint.className='zone';place(bHint,bz);bHint.hidden=true;box.append(bHint);
  let wrong=0,left=items.length;
  await new Promise(res=>{
    items.forEach((it,j)=>{const el=document.createElement('div');el.className='obj';el.innerHTML=`<img src="${IMG[it.i]||it.i}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`;el.setAttribute('aria-label',it.n);
      const home={x:(j+.5)*W/items.length-os/2,y:SH+(H-SH-os)/2};place(el,{x:home.x,y:home.y,w:os,h:os});box.append(el);
      let drag=null,miss=0;
      el.onpointerdown=e=>{if(el.classList.contains('placed'))return;e.preventDefault();ac();el.setPointerCapture(e.pointerId);el.classList.remove('back');el.classList.add('drag');sfx.click();
        const r=el.getBoundingClientRect();drag={dx:e.clientX-r.left-r.width/2,dy:e.clientY-r.top-r.height/2,sx:e.clientX,sy:e.clientY}};
      el.onpointermove=e=>{if(!drag)return;const b=box.getBoundingClientRect();el.style.left=(e.clientX-b.left-drag.dx-os/2)+'px';el.style.top=(e.clientY-b.top-drag.dy-os/2)+'px'};
      el.onpointerup=el.onpointercancel=async e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy);drag=null;el.classList.remove('drag');
        const cx=parseFloat(el.style.left)+os/2,cy=parseFloat(el.style.top)+os/2;const inR=z=>cx>=z.x&&cx<=z.x+z.w&&cy>=z.y&&cy<=z.y+z.h;
        const hit=inR(bz)?'b':inR(tz)?'t':null;
        if(!hit){el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});if(moved<10)say(cap(it.n)+'.');return}
        if((hit==='t')===it.e){el.classList.add('placed');place(el,rest(hit,el));if(hit==='b')el.style.zIndex=2;sfx.good();tHint.hidden=bHint.hidden=true;
          const r=el.getBoundingClientRect();confetti(40,r.left+r.width/2,r.top+r.height/2);left--;
          if(left===0){res();return}
          say(it.e?(it.ok||cap(it.n)+' можно есть!'):cap(it.n)+' — нельзя есть!');return}
        wrong++;miss++;el.classList.add('placed');place(el,{x:cx-os/2,y:cy-os/2,w:os,h:os});
        const badMs=sfx.bad();await wait(Math.max(600,badMs));if(!box.isConnected)return;
        el.classList.remove('placed');el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});
        if(miss>=2)(it.e?tHint:bHint).hidden=false;
        await say(it.e?(it.bad||'Нет! '+cap(it.n)+' можно есть. Неси на стол!'):'Нет! '+cap(it.n)+' нельзя есть. Положи в коробку!')};
    });
  });
  if(R.dead||!G)return;
  await wait(300);await say(pick(PRAISE)+' '+(items.length>2?'Еда на столе!':cap(items.find(x=>x.e).n)+' на столе, '+items.find(x=>!x.e).n+' в коробке.'));
  return roundDone(wrong===0,{n:items.map(x=>x.n).join(','),w:wrong})}

/* ---------- v16: «Да или нет?» — картинка и вопрос «Это коза?»; вверху ДА, внизу НЕТ (можно и смахнуть картинку вверх/вниз) */
const YN_ANI=['собака','кошка','лошадь','гусь','медведь','заяц','мышь','курица','ёж','белка','корова','лиса','волк','тигр','коза','овца','свинья','петух','утка','лягушка'];
let YN=null;
function ynPool(){if(YN)return YN;const L=[];
  YN_ANI.forEach(n=>{const a=D.animals.find(x=>x.n===n);const i=a?a.i:(RPIC[n]?RPIC[n][0]:picOf(n));if(i)L.push({n,i:()=>i,c:'ani'})});
  for(const k in WTOP){if(k==='all'||k==='nature')continue;WTOP[k].w.forEach(n=>{if(RPIC[n]&&!L.some(x=>x.n===n))L.push({n,i:()=>pick(RPIC[n]),c:k})})}
  ['дерево','ёлка','цветок','гриб','бабочка'].forEach(n=>{if(RPIC[n]&&!L.some(x=>x.n===n))L.push({n,i:()=>pick(RPIC[n]),c:'nature'})});
  return YN=L}
const YN_UP=`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 21h4V9H2zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6C6.2 8 6 8.5 6 9v10a2 2 0 0 0 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1.2-.7z"/></svg>`;
async function ynRound(lvl){
  const R=G.round;const P=ynPool();
  const t=fresh(()=>pick(P),x=>'yn'+x.n);const yes=rmode('yn',2)===0;
  let ask_n=t.n;
  if(!yes){const same=P.filter(x=>x.c===t.c&&x.n!==t.n),diff=P.filter(x=>x.c!==t.c);const SIMN=[['мишка','медведь'],['курица','петух'],['гусь','утка'],['заяц','мышь'],['ёлка','дерево'],['шапка','кепка'],['машина','автобус']];const near=x=>SIMN.some(p=>p.includes(x.n)&&p.includes(t.n));
    ask_n=pick((lvl>=2&&same.length?same:diff).filter(x=>!near(x))).n}
  const q='Это '+ask_n+'?';const src=t.i();
  setPrompt(q);const st=$('#stage');
  st.innerHTML=`<div class="yn"><button class="ynb yes" disabled>${YN_UP}<b>ДА</b></button><div class="yncard"><img src="${IMG[src]||src}" alt=""></div><button class="ynb no" disabled>${YN_UP}<b>НЕТ</b></button></div>`;
  const box=st.firstChild,card=box.querySelector('.yncard'),bY=box.querySelector('.yes'),bN=box.querySelector('.no');
  await wait(500);if(R.dead)return;await say(q);if(R.dead||!G)return;
  if(lvl===1)shNod(yes); /* v44: герой подсказывает кивком (выключатель «Ходы Шарика») */
  bY.disabled=bN.disabled=false;R.good=yes?'Да, это '+t.n+'.':'Нет, это не '+ask_n+'. Это '+t.n+'.';
  let wrong=0,locked=false;
  const ok=await new Promise(res=>{
    const answer=async a=>{if(locked)return;locked=true;ac();const btn=a?bY:bN;
      if(a===yes){btn.classList.add('good');card.classList.add(a?'flyup':'flydown');sfx.good();const r=btn.getBoundingClientRect();confetti(60,r.left+r.width/2,r.top+r.height/2);
        await say(yes?'Да! Это '+t.n+'!':'Нет! Это не '+ask_n+'. Это '+t.n+'!');res(wrong===0);return}
      wrong++;G.round.wrong++;btn.classList.remove('bad');void btn.offsetWidth;btn.classList.add('bad');card.classList.remove('back');
      await say(a?'Да?':'Нет?');await wait(sfx.bad());
      if(!box.isConnected)return;if(wrong>=2)(yes?bY:bN).classList.add('hint');
      await say('Посмотри ещё. '+q);locked=false};
    bY.onclick=()=>answer(true);bN.onclick=()=>answer(false);
    /* смахнуть картинку: вверх — да, вниз — нет */
    let sy=null;card.onpointerdown=e=>{if(bY.disabled)return;sy=e.clientY;card.setPointerCapture(e.pointerId);card.style.transition='none'};
    card.onpointermove=e=>{if(sy===null)return;const d=Math.max(-90,Math.min(90,e.clientY-sy));card.style.transform=`translateY(${d}px)`};
    card.onpointerup=card.onpointercancel=e=>{if(sy===null)return;const d=e.clientY-sy;sy=null;card.style.transition='';card.style.transform='';
      if(d<-50)answer(true);else if(d>50)answer(false);else say(q)};
  });
  if(R.dead||!G)return;await wait(400);
  return roundDone(ok,{n:t.n,v:yes?'да':'нет'})}

/* ---------- v17: «Что летит? Что едет? Что плывёт?» — транспорт */
const TRV={fly:'летит',ride:'едет',swim:'плывёт'};
const TRL=(()=>{const L=(window.TRANS||[]).filter(x=>!['парашют','пароход'].includes(x.n)).map(x=>({n:x.n,c:x.c,e:x.i,i:()=>x.i}));
  [['самолёт','fly'],['вертолёт','fly'],['ракета','fly'],['машина','ride'],['лодка','swim']].forEach(([n,c])=>{const t=L.find(x=>x.n===n);if(t&&RPIC[n]){const e=t.i();t.i=()=>Math.random()<.5?e:pick(RPIC[n])}});
  return L})();
const TRZ={fly:'на небо',ride:'на дорогу',swim:'на речку'};
/* ---------- v18: «Озорные щенки» — двигай собачек, чтобы мячики упали в ямки (по игре-головоломке с поля 4×4).
   Уровни выставляются сами: 4 тренировочных, 10 из буклета, 8 новых (все проверены решателем, m — минимум шагов). */
const DG_HOLES=[[0,2],[1,0],[2,1],[3,3]];const DGH=new Set(DG_HOLES.map(h=>h[0]*4+h[1]));
const DG_LV=window.DOGLV||[];
const DG_FILTER={pug:'',grey:'grayscale(1) brightness(1.08)',orange:'saturate(2.4) hue-rotate(-18deg) brightness(1.02)'};
const DG_BALL=`<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f4f1e8" stroke="#cfc8b4" stroke-width="2"/><circle cx="13" cy="14" r="2" fill="#b9b19c"/><circle cx="24" cy="11" r="1.6" fill="#b9b19c"/><circle cx="26" cy="24" r="2.2" fill="#b9b19c"/><circle cx="15" cy="27" r="1.7" fill="#b9b19c"/><ellipse cx="14" cy="11" rx="5" ry="3" fill="#fff" opacity=".8"/></svg>`;
const DG_BUSH=`<svg viewBox="0 0 40 40"><g fill="#7cc242" stroke="#5a9a2a" stroke-width="1.5"><circle cx="14" cy="22" r="8"/><circle cx="26" cy="22" r="8"/><circle cx="20" cy="14" r="8"/><circle cx="20" cy="26" r="8"/></g><circle cx="17" cy="16" r="2.5" fill="#a6dd6e"/></svg>`;
/* состояние: off[i]=[dr,dc], ball[i]=true/false, filled — Set номеров ямок */
function dgCells(lv,i,off){return lv.p[i].cells.map(([r,c,ro])=>[r+off[0],c+off[1],ro])}
function dgMovable(lv){return lv.p.map((p,i)=>p.c!=='S'?i:-1).filter(i=>i>=0)}
function dgStatic(lv){const s=new Set();lv.p.forEach(p=>{if(p.c==='S')p.cells.forEach(([r,c])=>s.add(r*4+c))});return s}
function dgTry(lv,st,i,dr,dc){ // один шаг; вернёт новое состояние или null
  const off=[st.off[i][0]+dr,st.off[i][1]+dc];const cs=dgCells(lv,i,off);const stat=dgStatic(lv);
  const occ=new Set(stat);dgMovable(lv).forEach(j=>{if(j!==i)dgCells(lv,j,st.off[j]).forEach(([r,c])=>occ.add(r*4+c))});
  if(cs.some(([r,c])=>r<0||r>3||c<0||c>3||occ.has(r*4+c)))return null;
  const n={off:st.off.map((o,k)=>k===i?off:o),ball:st.ball.slice(),filled:new Set(st.filled),drops:[]};
  dgMovable(lv).forEach(j=>{if(!n.ball[j])return;dgCells(lv,j,n.off[j]).forEach(([r,c,ro])=>{const k=r*4+c;
    if(ro==='B'&&n.ball[j]&&DGH.has(k)&&!n.filled.has(k)&&!stat.has(k)){n.ball[j]=false;n.filled.add(k);n.drops.push({j,k})}})});
  return n}
const dgKey=st=>st.off.map(o=>o.join(',')).join(';')+'|'+st.ball.map(b=>b?1:0).join('')+'|'+[...st.filled].sort().join(',');
const dgWin=(lv,st)=>dgMovable(lv).every(j=>!st.ball[j]||!lv.p[j].cells.some(x=>x[2]==='B'));
function dgSolve(lv,st0,limit=60000){ // поиск в ширину: первый шаг кратчайшего решения или null
  if(dgWin(lv,st0))return{first:null,d:0};const q=[[st0,null,0]];const seen=new Set([dgKey(st0)]);let h=0;
  while(h<q.length&&seen.size<limit){const [st,first,d]=q[h++];
    for(const i of dgMovable(lv))for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=dgTry(lv,st,i,dr,dc);if(!n)continue;const k=dgKey(n);if(seen.has(k))continue;seen.add(k);
      const f=first||{i,dr,dc};if(dgWin(lv,n))return{first:f,d:d+1};q.push([n,f,d+1])}}
  return null}
async function dogsRound(){
  const R=G.round;if(!DG_LV.length)return roundDone(true,{});
  let li=Math.min(S.dogL||0,DG_LV.length-1);const lv=DG_LV[li];
  const init=()=>({off:lv.p.map(()=>[0,0]),ball:lv.p.map(p=>p.c!=='S'),filled:new Set(),drops:[]});
  let st=init(),steps=0,resets=0,hints=0,busy=false;
  const first=!S.dogSeen;S.dogSeen=1;save();
  if(!await ask('Уровень '+(li+1),first?'Помоги собачкам! Двигай собачек пальцем, чтобы мячики упали в ямки.':'Уровень '+(li+1)+'. Помоги собачкам!'))return;
  setPrompt('Уровень '+(li+1)+' из '+DG_LV.length);
  const sg=$('#stage');sg.innerHTML=`<div class="dg"><div class="dgbar"><button class="dgb dgprev" aria-label="Назад">‹</button><span class="dgsteps"></span><button class="dgb dgnext" aria-label="Вперёд">›</button><span class="dgbones"><img src="${IMG.dg_bone}" alt=""><b>${S.bones||0}</b></span><button class="dgb dghint" aria-label="Подсказка"><img src="${IMG.dg_bulb}" alt=""></button><button class="dgb dgreset" aria-label="Сначала"><img src="${IMG.dg_reset}" alt=""></button></div><div class="dgboard"></div></div>`;
  const wrap=sg.firstChild,bd=wrap.querySelector('.dgboard');
  const Wb=bd.clientWidth,Hb=bd.clientHeight;const size=Math.min(Wb,Hb)*.97;const pad=size*.05,cs=(size-2*pad)/4;
  Object.assign(bd.style,{});const board=document.createElement('div');board.className='dgtray';Object.assign(board.style,{width:size+'px',height:size+'px'});bd.append(board);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){const d=document.createElement('div');d.className='dgcell'+(DGH.has(r*4+c)?' hole':'');d.dataset.k=r*4+c;Object.assign(d.style,{left:pad+c*cs+'px',top:pad+r*cs+'px',width:cs+'px',height:cs+'px'});board.append(d)}
  const stat=dgStatic(lv);const pEls=[];
  lv.p.forEach((p,i)=>{const el=document.createElement('div');el.className='dgpc'+(p.c==='S'?' st':'');
    const set=new Set(p.cells.map(([r,c])=>r*4+c));
    p.cells.forEach(([r,c,ro])=>{const d=document.createElement('div');d.className='dgpcell';
      /* соседние клетки одной детали без щели */
      const g=cs*.06;const L=set.has(r*4+c-1)&&c>0,Rr=set.has(r*4+c+1)&&c<3,U=set.has((r-1)*4+c),Dn=set.has((r+1)*4+c);
      Object.assign(d.style,{left:c*cs+(L?0:g)+'px',top:r*cs+(U?0:g)+'px',width:cs-(L?0:g)-(Rr?0:g)+'px',height:cs-(U?0:g)-(Dn?0:g)+'px',borderRadius:`${U||L?0:12}px ${U||Rr?0:12}px ${Dn||Rr?0:12}px ${Dn||L?0:12}px`});
      if(ro==='G')d.innerHTML=DG_BUSH;
      else if(ro==='D')d.innerHTML=`<img class="dgdog" src="${IMG.dg_face}" alt="" style="filter:${DG_FILTER[p.c]||''}">`;
      else{d.classList.add('cut');d.innerHTML=`<span class="dgball">${DG_BALL}</span>`}
      el.append(d)});
    Object.assign(el.style,{left:pad+'px',top:pad+'px',width:cs*4+'px',height:cs*4+'px'});board.append(el);pEls.push(el)});
  const render=()=>{lv.p.forEach((p,i)=>{pEls[i].style.transform=`translate(${st.off[i][1]*cs}px,${st.off[i][0]*cs}px)`;const b=pEls[i].querySelector('.dgball');if(b){const bc=p.cells.find(x=>x[2]==='B');const k=(bc[0]+st.off[i][0])*4+bc[1]+st.off[i][1];const inHole=!st.ball[i]&&st.filled.has(k);b.style.visibility=st.ball[i]||inHole?'visible':'hidden';b.classList.toggle('down',inHole)}});
    board.querySelectorAll('.dgcell.hole').forEach(h=>h.classList.toggle('full',st.filled.has(+h.dataset.k)));
    wrap.querySelector('.dgsteps').textContent='Шаги: '+steps+(lv.m?' · можно за '+lv.m:'')};
  render();R.dg={get st(){return st},lv,pEls,cs};
  let done=false,resolveWin;const winP=new Promise(r=>resolveWin=r);
  const doReset=async(say1)=>{st=init();steps=0;resets++;render();board.querySelectorAll('.hint').forEach(x=>x.classList.remove('hint'));wrap.querySelector('.dgreset').classList.remove('pulse');if(say1)await say(say1)};
  const afterDrop=async drops=>{for(const d of drops){const h=board.querySelector(`.dgcell[data-k="${d.k}"]`);h.classList.add('plop');setTimeout(()=>h.classList.remove('plop'),700);
      tone(880,0,.08,'sine',.15);tone(440,.08,.18,'sine',.15)}
    if(dgWin(lv,st)){done=true;resolveWin();return}
    say(st.filled.size>=1?'Мячик в ямке!':'');
    busy=true;await wait(30);const sol=dgSolve(lv,st);busy=false;
    if(!sol){await wait(500);if(done||R.dead)return;sfx.bad();wrap.querySelector('.dgreset').classList.add('pulse');
      await say('Ой! Мячик упал не в ту ямку. Нажми стрелочки — начнём сначала!')}};
  const step=(i,dr,dc)=>{const n=dgTry(lv,st,i,dr,dc);if(!n)return false;st=n;steps++;render();if(n.drops.length)afterDrop(n.drops);return true};
  /* перетаскивание: деталь едет по клеткам за пальцем */
  pEls.forEach((el,i)=>{if(lv.p[i].c==='S')return;let dr=null;
    el.onpointerdown=e=>{if(done||busy)return;e.preventDefault();ac();el.setPointerCapture(e.pointerId);el.classList.add('drag');board.querySelectorAll('.hint').forEach(x=>x.classList.remove('hint'));
      dr={x:e.clientX,y:e.clientY,o:st.off[i].slice()}};
    el.onpointermove=e=>{if(!dr||done)return;
      for(let g=0;g<6;g++){const ax=dr.x+(st.off[i][1]-dr.o[1])*cs,ay=dr.y+(st.off[i][0]-dr.o[0])*cs;const dx=e.clientX-ax,dy=e.clientY-ay;
        let moved=false;if(Math.abs(dx)>=Math.abs(dy)){if(Math.abs(dx)>cs*.5)moved=step(i,0,Math.sign(dx))}else if(Math.abs(dy)>cs*.5)moved=step(i,Math.sign(dy),0);
        if(!moved){/* попробовать вторую ось */if(Math.abs(dx)<Math.abs(dy)){if(Math.abs(dx)>cs*.5)moved=step(i,0,Math.sign(dx))}else if(Math.abs(dy)>cs*.5)moved=step(i,Math.sign(dy),0)}
        if(!moved)break;if(done)break}};
    el.onpointerup=el.onpointercancel=()=>{dr=null;el.classList.remove('drag')}});
  wrap.querySelector('.dgreset').onclick=()=>{ac();sfx.click();doReset('Начнём сначала!')};
  wrap.querySelector('.dghint').onclick=async()=>{if(done||busy)return;ac();busy=true;const sol=dgSolve(lv,st);busy=false;hints++;
    if(!sol){wrap.querySelector('.dgreset').classList.add('pulse');say('Так уже не получится. Начнём сначала!');return}
    const {i,dr:a,dc:b}=sol.first;pEls[i].classList.add('hint');const ar=document.createElement('div');ar.className='dgarrow';
    const cells=dgCells(lv,i,st.off[i]);const r=cells.reduce((s,x)=>s+x[0],0)/cells.length,c=cells.reduce((s,x)=>s+x[1],0)/cells.length;
    Object.assign(ar.style,{left:pad+(c+.5+b*.9)*cs-cs*.35+'px',top:pad+(r+.5+a*.9)*cs-cs*.35+'px',width:cs*.7+'px',height:cs*.7+'px',transform:`rotate(${b===1?0:b===-1?180:a===1?90:-90}deg)`});
    ar.innerHTML='<svg viewBox="0 0 40 40"><path d="M4 15h20V6l14 14-14 14v-9H4z" fill="#ff6b5b" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';board.append(ar);setTimeout(()=>ar.remove(),2600);
    say('Подвинь эту собачку '+(b===1?'вправо':b===-1?'влево':a===1?'вниз':'вверх')+'!')};
  const go=k=>{ac();sfx.click();S.dogL=Math.max(0,Math.min(DG_LV.length-1,li+k));save();R.dead=true;G.round={wrong:0,lvl:1,tStart:Date.now()};dogsRound()};
  wrap.querySelector('.dgprev').onclick=()=>go(-1);wrap.querySelector('.dgnext').onclick=()=>go(1);
  await winP;if(R.dead||!G)return;
  /* победа: косточка-приз */
  sfx.up();confetti(160);S.bones=(S.bones||0)+1;S.dogL=li+1;const last=li+1>=DG_LV.length;if(last)S.dogL=Math.max(0,DG_LV.findIndex(l=>l.src==='book1'));save();
  const pr=document.createElement('div');pr.className='dgprize';pr.innerHTML=`<img src="${IMG[last?'dg_trophy':'dg_bone']}" alt=""><b>${last?'Ты чемпион!':'+1'}</b>`;wrap.append(pr);
  wrap.querySelector('.dgbones b').textContent=S.bones;
  await say(pick(PRAISE)+' Все мячики в ямках! '+(last?'Ты прошёл все уровни! Держи кубок!':'Держи косточку для собачек!'));await wait(last?2500:1200);
  return roundDone(true,{n:li+1,steps,m:lv.m,hints,resets})}

