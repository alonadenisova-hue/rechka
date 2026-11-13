/* «Речка»: основа: состояние, сохранение, звук, речь, движок игр, первые игры.
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
const D=window.DATA, IMG=window.IMG;
/* extra pets for «Покорми»: animals sitting at the table, from «Сюжетные. Дикие животные» */
const EXTRA_PETS=[['корова','корове','hay','Му-у-у!'],['лиса','лисичке','fish','Тяв-тяв!'],['волк','волку','meat','У-у-у!'],['тигр','тигру','meat','Р-р-р!'],
  ['енот','еноту','apple','Ням-ням!'],['бобр','бобру','cabbage','Хрум-хрум!'],['бурундук','бурундуку','nuts','Цок-цок!'],['кабан','кабану','corn','Хрю-хрю!'],
  ['лось','лосю','grass','Ням-ням!'],['олень','оленю','carrot','Хрум-хрум!'],['рысь','рыси','meat','Р-р-мяу!'],['барсук','барсуку','mushroom','Фыр-фыр!']];
for(const [n,dat,f,snd] of EXTRA_PETS){const a=D.actions.find(x=>x.s===n&&x.v==='сидит'&&!x.o);if(a&&!D.animals.some(x=>x.n===n)&&D.foods[f])D.animals.push({n,dat,i:a.i,f,snd})}
/* extra 3-word phrases for «Кто что делает», level 5: «Где лиса сидит на стуле?» */
const CHAIR=D.actions.filter(a=>a.v==='сидит'&&!a.o&&a.s&&!['бабушка','мальчик'].includes(a.s)).map(a=>({i:a.i,s:a.s,v:'сидит',o:'на стуле',chair:true}));
/* logoped's verb-pair series: photos and drawings (стоит–идёт, стоит–сидит, идёт–бежит, спит–лежит) */
const D2=window.DATA2||{pairs:[],actions:[]};D.actions.push(...D2.actions);
const D3=window.DATA3||{cobj:[],size1:[],size2:[],anims:[]};D.anims.push(...D3.anims);
/* v7: в «Бежит 2» под именем «мышка» — крыса */
D.anims.forEach(a=>{if(a.a==='anim/a_e5df07c7c08c.webp')a.s='крыса'});
const D4=window.DATA4||{preps:[],daina:[],katya:{list:[]},many:[],fly:[],syl:[]};Object.assign(IMG,window.IMG4||{});D.preps.push(...D4.preps);D.daina=D4.daina;D.many=D4.many;
const RARE=['бобр','бурундук','кабан','лось','олень','рысь','барсук','соболь']; // редкие слова — с уровня 3
const $=s=>document.querySelector(s);
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- storage */
const KEY='rechka-v1';
const defaults={dogHi:0,voiceGame:true,sylMic:true,vthr:.03,vidFreq:'always',mirror:false,sayRec:false,wbOn:true,wbAsk:true,tipOn:true,voice:true,badSnd:'soft',bodyOn:true,mirrOn:true,shOn:false,shUrl:'',shCode:'',shMin:20,sayit:'some',askFirst:true,myVoice:true,name:'Лев',rate:0.85,rounds:15,anim:true,nextBtn:true,lvl:{home:1,draw:1,rh:1,pg:1,br:1,dogs:1,tr:1,yn:1,nes:1,sl:1,ib:1,food:1,odd:1,verb:1,color:1,feed:1,prep:1,pair:1,size:1,snd:1,syl:1,me:1,word:1,dai:1,many:1,fly:1,put:1,bal:1,world:1,dress:1,catch:1,num:1,seq:1,want:1,voice:1,make:1,dog:1,give:1,not:1,body:1,mirr:1},streak:{home:0,draw:0,rh:0,pg:0,br:0,dogs:0,tr:0,yn:0,nes:0,sl:0,ib:0,food:0,odd:0,verb:0,color:0,feed:0,prep:0,pair:0,size:0,snd:0,syl:0,me:0,word:0,dai:0,many:0,fly:0,put:0,bal:0,world:0,dress:0,catch:0,num:0,seq:0,want:0,voice:0,make:0,dog:0,give:0,not:0,body:0,mirr:0},errs:{home:0,draw:0,rh:0,pg:0,br:0,dogs:0,tr:0,yn:0,nes:0,sl:0,ib:0,food:0,odd:0,verb:0,color:0,feed:0,prep:0,pair:0,size:0,snd:0,syl:0,me:0,word:0,dai:0,many:0,fly:0,put:0,bal:0,world:0,dress:0,catch:0,num:0,seq:0,want:0,voice:0,make:0,dog:0,give:0,not:0,body:0,mirr:0},log:[],recent:[],pz:{k:0,placed:[],bank:0,done:[]}};
let S;
try{S=Object.assign(structuredClone(defaults),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S=structuredClone(defaults)}
for(const k of ['lvl','streak','errs','pz'])S[k]=Object.assign({},defaults[k],S[k]);
if((S.ver||0)<5){if(S.rounds<15)S.rounds=15;S.anim=true;S.ver=5}
if((S.ver||0)<14){S.lvl.seq=1;S.streak.seq=0;S.ver=14}
if((S.ver||0)<22){S.lvl.num=1;S.lvl.food=1;S.lvl.seq=Math.min(S.lvl.seq||1,3);S.ver=22}
if((S.ver||0)<21){S.sayit=S.sayit||'some';S.ver=Math.max(S.ver||0,21)}
if((S.ver||0)<18){if((S.dogL||0)>=4)S.dogL+=5;S.ver=18} /* v18: +5 лёгких уровней щенков после тренировки */ /* v14: «Повтори!» теперь начинается с 3 картинок */
const save=()=>{try{S.log=S.log.slice(-3000);localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const MAXL={mirr:4,body:3,home:4,draw:3,not:4,dog:6,voice:3,make:6,odd:4,verb:5,color:6,feed:4,prep:8,fly:3,pair:5,size:5,snd:3,syl:5,me:3,word:4,dai:4,many:3,put:4,bal:4,world:5,dress:4,catch:4,num:7,seq:3,want:4,rh:1,pg:1,br:1,dogs:1,tr:4,yn:2,nes:3,sl:1,ib:4,food:5};
for(const g in MAXL)if(S.lvl[g]>MAXL[g])S.lvl[g]=MAXL[g];
const UPG={syl:5,snd:4}; // для этих игр уровень поднимается медленнее
const UP=3; // верных подряд с первой попытки, чтобы уровень поднялся

/* ---------- speech + sounds */
let voice=null;
function pickVoice(){const vs=speechSynthesis.getVoices().filter(v=>/^ru/i.test(v.lang));voice=vs.find(v=>/google/i.test(v.name))||vs[0]||null;$('#voice-name').textContent=voice?voice.name:'Русский голос не найден';}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
let curAudio=null,sayGen=0;
function stopVoice(){sayGen++;try{speechSynthesis.cancel()}catch(e){}if(curAudio){const a=curAudio;curAudio=null;try{a.pause()}catch(e){}}}
function tts(text,{rate,pitch}={}){return new Promise(res=>{
  if(!('speechSynthesis' in window)){res();return}
  try{speechSynthesis.cancel()}catch(e){}const u=new SpeechSynthesisUtterance(fixStress(text));u.lang='ru-RU';if(voice)u.voice=voice;
  u.rate=rate||S.rate;u.pitch=pitch||1.1;let done=false;const fin=()=>{if(!done){done=true;res()}};
  u.onend=fin;u.onerror=fin;setTimeout(fin,600+text.length*120);speechSynthesis.speak(u);});}
/* v11: ударения в словах, которые синтез речи читает неправильно (стОит → стоИт) */
const STRESS=[['соску','со́ску'],['соска','со́ска'],['соски','со́ски'],['стоит','стои́т'],['стоишь','стои́шь'],['носки','носки́'],['трусы','трусы́'],['часы','часы́'],['сандалии','санда́лии'],['замок','замо́к'],['стою','стою́']];
const STRESS_RE=STRESS.map(([w,r])=>[new RegExp('(^|[^а-яё])'+w+'(?=[^а-яё]|$)','giu'),r]);
function fixStress(t){for(const [re,r] of STRESS_RE)t=t.replace(re,(m,p1)=>p1+(m.slice(p1.length)[0]===m.slice(p1.length)[0].toUpperCase()?r[0].toUpperCase()+r.slice(1):r));return t}
/* own-voice recordings: key = normalized phrase */
const nk=t=>t.toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const splitParts=t=>t.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
let REC=new Set();
function noteRecent(t){for(const p of splitParts(t)){if(p.length>60)continue;const i=S.recent.indexOf(p);if(i>=0)S.recent.splice(i,1);S.recent.unshift(p)}if(S.recent.length>60)S.recent.length=60}
function playURL(u){return new Promise(res=>{const a=new Audio(u);curAudio=a;let done=false;const fin=()=>{if(!done){done=true;try{URL.revokeObjectURL(u)}catch(e){}if(curAudio===a)curAudio=null;res()}};
  a.onended=fin;a.onerror=fin;a.onpause=fin;setTimeout(fin,15000);a.play().catch(fin)})}
function say(text,opt={}){
  if(!S.voice||!text)return Promise.resolve();
  noteRecent(text);stopVoice();const my=sayGen;const parts=splitParts(text);
  if(S.myVoice&&REC.size&&parts.some(p=>REC.has(nk(p))))return (async()=>{for(const p of parts){if(my!==sayGen)return;let b=null;
    if(REC.has(nk(p))){try{b=await MDB.get('rec',nk(p))}catch(e){}}if(my!==sayGen)return;if(b)await playURL(URL.createObjectURL(b));else await tts(p,opt)}})();
  return tts(text,opt);}
let AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,t0,dur,type='sine',vol=.18){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,a.currentTime+t0);
  g.gain.setValueAtTime(0,a.currentTime+t0);g.gain.linearRampToValueAtTime(vol,a.currentTime+t0+.02);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+t0+dur);
  o.connect(g).connect(a.destination);o.start(a.currentTime+t0);o.stop(a.currentTime+t0+dur+.05)}
const sfx={
  good(){[523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.25,'triangle',.38))},
  /* «проигрыш», как в играх: грустный тромбон «вау-вау-вау-ваааа» (4 нисходящих ноты, последняя с вибрато). Возвращает длительность в мс */
  bad(){if(S.badSnd==='off')return 0;
    if(S.badSnd==='soft'){tone(220,0,.18,'sine',.12);tone(196,.15,.25,'sine',.12);return 400}
    const a=ac();if(!a)return 0;const t=a.currentTime+.02;
    const out=a.createGain();out.gain.value=.22;const lp=a.createBiquadFilter();lp.type='lowpass';lp.Q.value=6;lp.connect(out).connect(a.destination);
    const notes=[[392,0,.26],[370,.3,.26],[349,.6,.26],[330,.9,.75]];
    for(const [f,t0,d] of notes){const o=a.createOscillator(),g=a.createGain();o.type='sawtooth';o.frequency.setValueAtTime(f,t+t0);
      if(d>.5){const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=6;lg.gain.value=7;lfo.connect(lg).connect(o.frequency);lfo.start(t+t0+.15);lfo.stop(t+t0+d);
        o.frequency.linearRampToValueAtTime(f*.94,t+t0+d)}
      /* «вау»: фильтр открывается и закрывается, как сурдина у тромбона */
      lp.frequency.setValueAtTime(400,t+t0);lp.frequency.linearRampToValueAtTime(1500,t+t0+.09);lp.frequency.linearRampToValueAtTime(600,t+t0+d);
      g.gain.setValueAtTime(0,t+t0);g.gain.linearRampToValueAtTime(1,t+t0+.04);g.gain.setValueAtTime(1,t+t0+d-.08);g.gain.linearRampToValueAtTime(0,t+t0+d);
      o.connect(g).connect(lp);o.start(t+t0);o.stop(t+t0+d+.02)}
    return 1700},
  pop(){const a=ac();if(!a)return;const b=a.createBuffer(1,a.sampleRate*.15,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
    const s=a.createBufferSource(),g=a.createGain();g.gain.value=.5;s.buffer=b;s.connect(g).connect(a.destination);s.start();tone(900,0,.08,'square',.06)},
  chomp(){[0,.18,.36].forEach(t=>tone(160,t,.1,'square',.25))},
  up(){[392,523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.07,.3,'triangle',.3))},
  drum(){tone(95,0,.28,'sine',.5);tone(150,0,.08,'triangle',.25);const a=ac();if(!a)return;const b=a.createBuffer(1,a.sampleRate*.08,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,4);const s=a.createBufferSource(),g=a.createGain();g.gain.value=.25;s.buffer=b;s.connect(g).connect(a.destination);s.start()},
  click(){tone(880,0,.06,'triangle',.45);tone(1320,.05,.08,'triangle',.3)}
};
/* v8: только настоящие записи; если записи нет — животное «не говорит» голосом телефона (только чавканье в «Покорми») */
const hasSnd=n=>!!(window.SND||{})[n];
function animalSound(who){const src=(window.SND||{})[who.n];
  if(!src)return wait(250);
  return new Promise(res=>{stopVoice();const a=new Audio(src);let done=false;const fin=()=>{if(!done){done=true;res()}};
    a.onended=fin;a.onerror=fin;setTimeout(fin,6000);a.play().catch(fin)})}
const PRAISE=['Молодец!','Умница!','Правильно!','Ура!','Супер!','Отлично!'];

/* ---------- confetti */
const cv=$('#confetti'),cx=cv.getContext('2d');let parts=[];
function confetti(n=70,x=innerWidth/2,y=innerHeight/2){cv.width=innerWidth;cv.height=innerHeight;const cols=['#ffc93c','#ff6b5b','#3cbf7a','#7b61ff','#2fa8e0'];
  for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,r:4+Math.random()*6,c:pick(cols),a:Math.random()*6,life:70+rnd(30)});if(parts.length===n)requestAnimationFrame(tick)}
function tick(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.life-->0);
  for(const p of parts){p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.a+=.2;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.r/2,-p.r/2,p.r,p.r*.6);cx.restore()}
  if(parts.length)requestAnimationFrame(tick);else cx.clearRect(0,0,cv.width,cv.height)}

/* ---------- shapes */
const SH={circle:'<circle cx="50" cy="50" r="40"/>',square:'<rect x="12" y="12" width="76" height="76" rx="6"/>',triangle:'<path d="M50 8 92 88H8z"/>',star:'<path d="M50 6l12 27 29 3-22 20 7 29-26-15-26 15 7-29L9 36l29-3z"/>'};
const SHC={red:'#e8423b',yellow:'#ffcd1c',green:'#4dbb3f',blue:'#2d7fd8'};
const shapeSvg=(s,c)=>`<svg viewBox="0 0 100 100"><g fill="${SHC[c]}" stroke="#0003" stroke-width="2">${SH[s]}</g></svg>`;
const img=id=>`<img src="${IMG[id]||id}" alt="">`;

/* ---------- screens */
function show(id){for(const s of document.querySelectorAll('.screen'))s.hidden=s.id!==id}
function renderHome(){
  for(const el of document.querySelectorAll('[data-lvl]')){el.textContent='ур. '+S.lvl[el.dataset.lvl];el.title='уровень '+S.lvl[el.dataset.lvl]}
  $('#art-odd').innerHTML=`<svg viewBox="-5 0 245 110">${[0,1,2].map(i=>`<g transform="translate(${i*72} 5)">${SH.circle.replace('<circle','<circle fill="'+(i==2?SHC.red:SHC.blue)+'"')}</g>`).join('')}</svg>`;
  const run=D.actions.find(a=>a.s==='заяц'&&a.v==='бежит')||D.actions[0];$('#art-verb').innerHTML=img(run.i);
  $('#art-color').innerHTML=balloonSvg('#ff6b5b');$('#art-body').innerHTML=boySvg('bt');$('#art-mirr').innerHTML=`<div style="position:absolute;inset:0;display:grid;place-items:center"><div style="width:78%;aspect-ratio:3/4;border-radius:22px;background:#bfe3f5;box-shadow:inset 0 0 0 6px #fff;display:grid;place-items:center;font-size:44px">😁</div></div>`;
  const dog=D.animals[0];$('#art-feed').innerHTML=img(dog.i);
  const pr=D.preps.find(x=>x.k==='osa2'&&x.p==='в')||D.preps[0];$('#art-prep').innerHTML=img(pr.i);
  const sp=D3.size1[3];if(sp)$('#art-size').innerHTML=simg(sp.b.i)+simg(sp.s.i,true);
  {const a=D2.pairs.find(p=>p.set==='sl'),b=D2.pairs.filter(p=>p.set==='ib')[1]||D2.pairs.find(p=>p.set==='ib');if(a)$('#art-sl').innerHTML=a.a.map(x=>img(x.i)).join('');if(b)$('#art-ib').innerHTML=b.a.map(x=>img(x.i)).join('');}
  $('#art-dogs').innerHTML=img('dg_face');$('#art-rh').innerHTML=`<div class="rhart">${rhCarSvg(2,'#e53935',true)}</div>`;$('#art-pg').innerHTML=`<div class="duo2">${img('pz_peng')}${img('pz_fish')}</div>`;$('#art-br').innerHTML=`<div class="duo2">${img('pz_mouse')}${img('pz_cheese')}</div>`;$('#art-tr').innerHTML='<div class="trart">'+['tr_00','tr_04','tr_17'].map(i=>img(i)).join('')+'</div>';$('#art-yn').innerHTML='<div class="ynart"><span class="y">ДА</span><span class="n">НЕТ</span></div>';
  {const n=NES[11];const H=(window.HOLDGIVE||{hold:[],give:[]});$('#art-nes').innerHTML=nesCard(n,'несёт')+(H.hold[1]?`<img src="${H.hold[1].i}" alt="">`:nesCard(n,'держит'));if(H.give[2])$('#art-give').innerHTML=`<img src="${H.hold[14].i}" alt=""><img src="${H.give[2].i}" alt="">`;$('#art-food').innerHTML=`<div class="foodart" style="background-image:url(${IMG.kitchen})">${img('f_05')}</div>`}
  const pp=D2.pairs.find(p=>p.set==='ib');if(pp)$('#art-pair').innerHTML=pp.a.map(a=>img(a.i)).join('');
  $('#art-snd').innerHTML=img(picOf('корова')||D.animals[0].i);
  $('#art-syl').innerHTML=DRUM;
  const wv=D3.cobj.find(o=>o.n==='ведро');if(wv)$('#art-word').innerHTML=img(wv.i);
  renderMeTile();renderPzHome();
  for(const t of document.querySelectorAll('.tile[data-game="dai"]'))t.hidden=!({dai:D4.daina,many:D4.many}[t.dataset.game]||[]).length;$('.tile[data-game="fly"]').hidden=true;
  if(D4.daina.length)$('#art-dai').innerHTML=`<img src="${IMG[D4.daina[0].happy]}" alt="">`;
  if(D4.many.length)$('#art-many').innerHTML=`<img src="${IMG[D4.many[4].lot]}" alt="">`;
  if(D4.fly.length)$('#art-fly').innerHTML=flySvg(D4.fly[2]);
  $('#art-put').innerHTML=putArt();$('#art-seq').innerHTML=`<div class="seqrow mini">${['яблоко','мяч','машина'].filter(n=>RPIC[n]).map(n=>`<img src="${IMG[RPIC[n][0]]}" alt="">`).join('')}</div>`;$('#art-want').innerHTML=`<img src="${(window.IMG24||{})['img24/fl_teddy.webp']||'img24/fl_teddy.webp'}" alt="">`;$('#art-num').innerHTML='<svg viewBox="0 0 120 100"><text x="60" y="80" text-anchor="middle" font-size="80" font-weight="700" fill="#7b61ff" font-family="Balsamiq Sans,sans-serif">123</text></svg>';$('#art-world').innerHTML=RPIC['дерево']?wimg({i:RPIC['дерево'][0]}):'';$('#art-dress').innerHTML=dressSvg({футболка:'red',шорты:'blue',кепка:'yellow'});$('#art-catch').innerHTML=`<svg viewBox="0 0 120 120"><g transform="translate(0 40)">${BASKET.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</g></svg>${W9.fruit?`<img src="${IMG[W9.fruit[1].i]}" alt="" style="inset:0 25% 50% 25%;width:50%;height:50%">`:''}`;$('#art-bal').innerHTML=['#ef4a3d','#ffcf26','#2f8be0'].map(c=>balloonSvg(c)).join('');
  $('#art-voice').innerHTML=VG_BIRD;$('#art-home').innerHTML=`<img src="${I24('bed')}" alt="" style="width:56%;max-height:100%;object-fit:contain"><img src="${I24('dog')}" alt="" style="width:56%;max-height:100%;object-fit:contain">`;$('#art-draw').innerHTML=`<svg viewBox="0 0 120 100"><path d="M60 18A32 32 0 0 0 60 82" stroke="#ffb020" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M60 18A32 32 0 0 1 60 82" stroke="#9aa7b8" stroke-width="5" stroke-dasharray="2 8" fill="none" stroke-linecap="round"/><path d="M96 70l10-28 6 4-10 28z" fill="#7b61ff"/></svg>`;try{$('#art-ib').innerHTML=figSvg('мальчик','бежит')+figSvg('девочка','сидит')}catch(_){}$('#art-not').innerHTML=`<svg viewBox="0 0 120 100"><text x="60" y="66" text-anchor="middle" font-size="44" font-weight="700" fill="#ff6b5b" font-family="Balsamiq Sans,sans-serif">НЕ</text><path d="M14 86 106 14" stroke="#ff6b5b" stroke-width="7" stroke-linecap="round" opacity=".35"/></svg>`;$('#art-dog').innerHTML=DOG_SVG;$('#art-make').innerHTML=makeArt();VM.stop();applyV21Home();
  show('home');if(TIP)setTimeout(showTip,300);
}
/* ---------- session engine */
let G=null; // {game, i, results[], round}
function fresh(gen,key){let c;for(let t=0;t<25;t++){c=gen();if(!G.seen.has(key(c)))break}G.seen.add(key(c));return c}
function startGame(game){ac();VM.stop();G={t0:Date.now(),game,i:0,results:[],seen:new Set(),max:FIX7[game]||S.rounds};$('#game').classList.remove('withnext','sharik');shHostStart();show('game');renderDots();nextRound()}
function renderDots(){$('#dots').innerHTML=Array.from({length:G.max||S.rounds},(_,k)=>`<i class="${G.results[k]===true?'on':G.results[k]===false?'miss':''}"></i>`).join('')}
async function nextRound(){
  if(!G)return;
  if(G.i>=(G.max||S.rounds)){finish();return}
  if(G.sharik){if(!await shStep())return}
  if(G.plan)G.game=G.plan[G.i%G.plan.length];
  if(G.host)shHostSync();
  const lvl=S.lvl[G.game];
  G.round={wrong:0,lvl,tStart:Date.now()};
  await ROUNDS[G.game](lvl);
}
/* v12: режим игры выбирается случайно (не по порядку), но не одинаковый много раз подряд */
function rmode(key,n){G.modes=G.modes||{};const last=G.modes[key]||[];let m;for(let t=0;t<10;t++){m=rnd(n);if(!(last.length>=2&&last[last.length-1]===m&&last[last.length-2]===m)&&!(t<4&&last[last.length-1]===m))break}last.push(m);G.modes[key]=last.slice(-4);return m}
function setPrompt(text){$('#prompt').textContent=text;G.round.prompt=text;}
/* v8: сначала звучит вопрос, картинки появляются только после него (ребёнок слушает, а не тычет сразу) */
const EAR='<svg viewBox="0 0 24 24"><path fill="#7b61ff" d="M3 9v6h4l5 5V4L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
async function ask(q,spoken,{clear=true}={}){
  if(!G||!G.round)return false;const R=G.round;setPrompt(q);
  if(clear){stageAnim();$('#stage').innerHTML=`<div class="listen" aria-hidden="true">${EAR}</div>`}
  await say(spoken||q);await wait(250);
  return !!G&&G.round===R&&!R.dead}
/* v8: после ответа — кнопка «Дальше» (можно обсудить картинку и повторить фразу) */
function nextGate(){if(true||!S.nextBtn||!G)return Promise.resolve();const R=G.round;
  return new Promise(res=>{const bar=$('#nextbar');bar.hidden=false;
    $('#nb-say').onclick=()=>{ac();const t=R.good||R.prompt;if(t)say(t)};
    $('#nb-next').onclick=()=>{ac();sfx.click();bar.hidden=true;stopVoice();res()};
    R.gateRes=()=>{bar.hidden=true;res()}})}
async function roundDone(ok,meta){
  if(!G||!G.round||G.round.dead)return;
  const R=G.round;if(R.finished)return;R.finished=true;
  const g=G.game;G.results[G.i]=ok;G.i++;renderDots();
  S.log.push(Object.assign({t:Date.now(),g,l:R.lvl,ok,w:R.wrong,picks:R.picks},meta));
  if(G.sharik)shFire(S.log[S.log.length-1]); /* v41: результат уходит Шарику в фоне */
  let up=false;
  if(ok){S.streak[g]++;S.errs[g]=0;if(S.streak[g]>=(UPG[g]||UP)&&S.lvl[g]<MAXL[g]){S.lvl[g]++;S.streak[g]=0;up=true}}
  else{S.streak[g]=0;S.errs[g]++;if(S.errs[g]>=2&&S.lvl[g]>1){S.lvl[g]--;S.errs[g]=0}}
  save();
  await nextGate();if(!G||G.round!==R||R.dead)return;
  {const step=(G.max||S.rounds)>=10?5:4;if(G.i%step===0&&G.i<(G.max||S.rounds)&&S.bonus!==false){await bonusPop();if(!G||G.round!==R||R.dead)return}}
  if(up)await levelUp();
  await wait(250);nextRound();
}
async function levelUp(){sfx.up();confetti(120);const d=document.createElement('div');d.className='levelup';d.textContent='Новый уровень!';document.body.append(d);await say('Новый уровень!');await wait(900);d.remove()}
/* generic choice: options [{html, ok, key}], cls grid n */
function choice(opts,{question,goodText,wide,sayit,sayAlways,onWrong}={}){
  const sp=sayit!==undefined?sayit:(goodText?goodText.replace(/[.!]+$/,''):null);const R0=G.round;if(goodText)R0.good=goodText;
  return new Promise(resolve=>{
    opts=posFix(shuffle(opts.slice()),o=>o.ok);
    const st=$('#stage');st.innerHTML='';const grid=document.createElement('div');grid.className='grid n'+opts.length+(wide?' wide':'');st.append(grid);
    let locked=false;
    opts.forEach((o,k)=>{const b=document.createElement('button');b.className='opt';b.innerHTML=o.html;b.setAttribute('aria-label','Вариант '+(k+1));
      b.onclick=async()=>{
        if(locked)return;
        if(o.ok){locked=true;b.classList.remove('hint');b.classList.add('good');sfx.good();const r=b.getBoundingClientRect();confetti(60,r.left+r.width/2,r.top+r.height/2);
          await say(pick(PRAISE)+(goodText?' '+goodText:''));
          if(sp&&G&&G.round===R0&&!R0.dead&&(sayAlways&&S.sayit!=='off'||wantSayIt()))await sayIt(sp,o.html);
          await wait(300);resolve(!!G&&G.round.wrong===0);}
        else{G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');(G.round.picks=G.round.picks||[]).push(o.key);
          locked=true;await wait(sfx.bad());locked=false;if(!grid.isConnected)return;
          if(G.round.wrong>=2){[...grid.children].forEach((c,j)=>{if(opts[j].ok)c.classList.add('hint')})}
          await say('Нет. '+question);if(onWrong&&G&&G.round===R0)await onWrong();}
      };grid.append(b)});
  });
}

/* ---------- GAME 1: odd one / same pair */
const ANIMALS=D.animals.filter(a=>!['мальчик','девочка'].includes(a.n)).map(a=>a.i);
function shapeItem(){return{s:pick(Object.keys(SH)),c:pick(Object.keys(SHC))}}
async function oddRound(lvl){
  const mode=rmode('odd',2)===0?'odd':'same';
  if(mode==='odd'){
    let opts;
    if(lvl===1){const [a,b]=shuffle(D.objs.concat(ANIMALS)).slice(0,2);opts=[a,a,b].map((x,k)=>({html:img(x),ok:k===2,key:x}))}
    else if(lvl===2){const o=fresh(()=>pick(D.odd),x=>x.d);opts=[o.s,o.s,o.s,o.d].map((x,k)=>({html:img(x),ok:k===3,key:x}))}
    else{const a=shapeItem();let b;do{b=lvl===3?{s:pick(Object.keys(SH)),c:pick(Object.keys(SHC))}:(Math.random()<.5?{s:pick(Object.keys(SH)),c:a.c}:{s:a.s,c:pick(Object.keys(SHC))})}while(b.s===a.s&&b.c===a.c);
      opts=[a,a,a,b].map((x,k)=>({html:shapeSvg(x.s,x.c),ok:k===3,key:x.s+'-'+x.c}))}
    if(!await ask('Где другой?','Покажи, где другой?'))return;
    const ok=await choice(shuffle(opts),{question:'Где другой?'});
    return roundDone(ok,{m:'другой'});
  }
  // same pair
  const n=lvl>=3?6:4;let items,html;
  if(lvl===2||lvl===4){const pool=[];while(pool.length<n-1){const it=shapeItem();if(!pool.some(p=>p.s===it.s&&p.c===it.c))pool.push(it)}items=pool.concat([pool[0]]);html=x=>shapeSvg(x.s,x.c);items=items.map(x=>({v:x,k:x.s+x.c}))}
  else{const pool=shuffle(ANIMALS.concat(lvl>=3?D.objs:[])).slice(0,n-1);items=pool.concat([pool[0]]).map(x=>({v:x,k:x}));html=x=>img(x)}
  if(!await ask('Найди одинаковые','Найди одинаковые!'))return;
  const ok=await pairPick(shuffle(items),html);
  return roundDone(ok,{m:'одинаковые'});
}
function pairPick(items,html){return new Promise(resolve=>{
  const st=$('#stage');st.innerHTML='';const grid=document.createElement('div');grid.className='grid n'+items.length;st.append(grid);
  let first=null,locked=false;const target=items.find((x,i)=>items.findIndex(y=>y.k===x.k)!==i).k;
  items.forEach((it,k)=>{const b=document.createElement('button');b.className='opt';b.innerHTML=html(it.v);
    b.onclick=async()=>{if(locked)return;
      if(first===b){b.classList.remove('sel');first=null;return}
      if(!first){first=b;b.classList.add('sel');tone(660,0,.08,'triangle',.1);return}
      locked=true;const a=items[[...grid.children].indexOf(first)];
      if(a.k===it.k){first.classList.add('good');b.classList.add('good');first.classList.remove('sel');sfx.good();confetti(70);await say(pick(PRAISE)+' Одинаковые!');resolve(!!G&&G.round.wrong===0)}
      else{G.round.wrong++;[first,b].forEach(x=>{x.classList.remove('sel','bad');void x.offsetWidth;x.classList.add('bad')});first=null;await wait(sfx.bad());if(!grid.isConnected)return;
        if(G.round.wrong>=2)[...grid.children].forEach((c,j)=>{if(items[j].k===target)c.classList.add('hint')});
        await say('Нет. Найди одинаковые!');locked=false}
    };grid.append(b)})})}

/* ---------- GAME 2: who does what */
const FAMILIAR=['лиса','волк','заяц','медведь','ёж','белка','мышь','тигр','корова','собака','бабушка','мальчик','олень','енот'];
const CONFUSE=[['бежит','идёт'],['сидит','стоит'],['лежит','спит'],['сидит','лежит'],['идёт','стоит'],['падает','лежит'],['летит','плывёт'],['ест','пьёт']];
const MAIN=['бежит','идёт','сидит','лежит','ест','пьёт','спит','стоит','плывёт','летит','падает','моет','несёт','едет','прыгает','играет','рисует','плачет'];
const isConf=(a,b)=>CONFUSE.some(p=>(p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a));
/* v8: на картинках с этими действиями герой тоже лежит/сидит/стоит — их нельзя давать «неправильным» вариантом
   (спящий тоже лежит; кто ест или пьёт — обычно сидит или стоит) */
const OVERLAP={лежит:['спит'],сидит:['ест','пьёт','рисует','читает','играет','плачет','дует','моет'],стоит:['ест','пьёт','моет','несёт','дует','играет']};
const okOther=(tv,v)=>v!==tv&&!(OVERLAP[tv]||[]).includes(v);
function verbAcc(v){const L=S.log.filter(x=>x.g==='verb'&&x.v===v).slice(-10);if(!L.length)return .5;return L.filter(x=>x.ok).length/L.length}
function pickTargetVerb(cands){const w=cands.map(v=>1.4-verbAcc(v));let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let i=0;i<cands.length;i++){r-=w[i];if(r<=0)return cands[i]}return cands[0]}
function actImg(v,pAnim){const st=D.actions.filter(a=>a.v===v&&!a.o),an=S.anim?D.anims.filter(a=>a.v===v):[];
  if(an.length&&(!st.length||Math.random()<pAnim)){const a=pick(an);return{i:a.a,s:a.s,v:a.v}}return pick(st)}
async function verbRound(lvl){
  let opts,q,good,meta;
  if(lvl<=3){
    const avail=MAIN.filter(v=>D.actions.some(a=>a.v===v&&!a.o)||(S.anim&&D.anims.some(a=>a.v===v)));const pA=1;
    const tv=pickTargetVerb(avail);let others;
    if(S.askFirst&&rmode('ask',4)===0){const R=G.round;await askFirst(tv);if(!G||G.round!==R||R.dead)return}
    const av2=avail.filter(v=>okOther(tv,v));
    if(lvl===1){const c=av2.filter(v=>!isConf(v,tv));others=[pick(c.length?c:av2)]}
    else if(lvl===2){const c=av2.filter(v=>isConf(v,tv));others=[c.length?pick(c):pick(av2)]}
    else{const c=av2.filter(v=>isConf(v,tv));others=shuffle(c).slice(0,1).concat(shuffle(av2.filter(v=>!c.includes(v))).slice(0,3)).slice(0,3)}
    const t=fresh(()=>actImg(tv,pA),x=>x.i);opts=[{a:t,ok:true}].concat(others.map(v=>({a:actImg(v,pA),ok:false})));
    q='Кто '+tv+'?';good=t.s?cap(t.s)+' '+tv+'.':cap(tv)+'.';meta={v:tv};
  }else if(lvl===4&&S.anim&&Math.random()<.75){
    const two=s=>D.anims.find(a=>a.s===s&&a.v==='идёт')&&D.anims.find(a=>a.s===s&&a.v==='бежит');
    const subs=[...new Set(D.anims.filter(a=>a.s).map(a=>a.s))].filter(two);
    const c=fresh(()=>{const [s1,s2]=shuffle(subs).slice(0,2);return{s1,s2,v:pick(['идёт','бежит'])}},x=>x.s1+x.v);
    const A=(s,v)=>{const a=pick(D.anims.filter(x=>x.s===s&&x.v===v));return{i:a.a,s,v}};const v2=c.v==='идёт'?'бежит':'идёт';
    opts=[{a:A(c.s1,c.v),ok:true},{a:A(c.s1,v2),ok:false},{a:A(c.s2,c.v),ok:false},{a:A(c.s2,v2),ok:false}];
    q='Где '+c.s1+' '+c.v+'?';good=cap(c.s1)+' '+c.v+'.';meta={v:c.v,s:c.s1};
  }else if(lvl===4){
    const subs=FAMILIAR.filter(s=>D.actions.filter(a=>a.s===s&&!a.o&&!a.ph).length>=2);
    let s1,s2,v1,v2,tries=0;
    do{[s1,s2]=shuffle(subs).slice(0,2);if(tries<20&&G.seen.has(s1)){tries++;continue}const vs1=D.actions.filter(a=>a.s===s1&&!a.o&&!a.ph).map(a=>a.v),vs2=D.actions.filter(a=>a.s===s2&&!a.o&&!a.ph).map(a=>a.v);
      const common=shuffle(vs1.filter(v=>vs2.includes(v)));v1=common[0];v2=common.slice(1).find(v=>okOther(v1,v)&&okOther(v,v1));tries++}while((!v1||!v2)&&tries<50);
    const f=(s,v)=>D.actions.find(a=>a.s===s&&a.v===v&&!a.o&&!a.ph);
    opts=[{a:f(s1,v1),ok:true},{a:f(s1,v2),ok:false},{a:f(s2,v1),ok:false},{a:f(s2,v2),ok:false}];
    G.seen.add(s1+v1);q='Где '+s1+' '+v1+'?';good=cap(s1)+' '+v1+'.';meta={v:v1,s:s1};
  }else{
    const three=D.actions.filter(a=>a.o);const t=fresh(()=>Math.random()<.4?pick(three):pick(CHAIR),x=>x.i);let others;
    if(!t.chair)others=shuffle(three.filter(a=>a.s!==t.s)).slice(0,3);
    else{const other=pick(CHAIR.filter(c=>c.s!==t.s));const sameDiff=pick(D.actions.filter(a=>a.s===t.s&&okOther('сидит',a.v)&&!a.o&&!a.ph));const otherDiff=pick(D.actions.filter(a=>a.s===other.s&&okOther('сидит',a.v)&&!a.o&&!a.ph));
      others=[other,sameDiff,otherDiff].filter(Boolean)}
    opts=[{a:t,ok:true}].concat(others.map(a=>({a,ok:false})));q='Где '+t.s+' '+t.v+' '+t.o+'?';good=cap(t.s)+' '+t.v+' '+t.o+'.';meta={v:t.v,s:t.s};
  }
  if(!await ask(q))return;
  const ok=await choice(shuffle(opts.map(o=>({html:img(o.a.i),ok:o.ok,key:o.a.v}))),{question:q,goodText:good,wide:lvl>=4});
  return roundDone(ok,meta);
}

/* ---------- GAME 3: colors with balloons */
const CN={red:'красный',yellow:'жёлтый',green:'зелёный',blue:'синий',pink:'розовый',white:'белый'};
const CB={red:'#ef4a3d',yellow:'#ffcf26',green:'#45b649',blue:'#2f8be0',pink:'#ff8fbf',white:'#f4f1ea'};
/* v8: перед заданием лопаем 4–5 шариков; каждый шарик называет свой цвет, цвет последнего — задание */
function balloons(colors){return new Promise(resolve=>{
  const need=4+rnd(2);let popped=0;
  const st=$('#stage');st.innerHTML=`<div class="sky"><div class="bcount">${Array.from({length:need},()=>`<svg viewBox="0 0 60 90">${balloonSvg('#ff6b5b').replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`).join('')}</div></div>`;const sky=st.firstChild;let done=false;
  const R=G.round;setPrompt('Лопни '+need+' шарик'+(need===5?'ов':'а')+'!');say('Лопни шарики!');R.replay=()=>say('Лопни шарики!');
  const spawn=()=>{if(done||!sky.isConnected){done=true;return}const c=pick(colors);const b=document.createElement('button');b.className='balloon';b.setAttribute('aria-label','Шарик');
    b.style.left=(5+Math.random()*75)+'%';b.style.animationDuration=(5.5+Math.random()*3)+'s, '+(1.8+Math.random())+'s';b.innerHTML=balloonSvg(CB[c]);
    b.onpointerdown=e=>{if(done||b._p)return;b._p=1;ac();sfx.pop();const r=b.getBoundingClientRect(),sr=st.getBoundingClientRect();
      for(let i=0;i<16;i++){const p=document.createElement('span');p.className='burst';p.style.background=CB[c];p.style.left=(r.left-sr.left+r.width/2)+'px';p.style.top=(r.top-sr.top+r.height/3)+'px';
        const ang=i/16*Math.PI*2;p.style.setProperty('--dx',Math.cos(ang)*90+'px');p.style.setProperty('--dy',Math.sin(ang)*90+'px');sky.append(p);setTimeout(()=>p.remove(),800)}
      b.remove();const ic=sky.querySelectorAll('.bcount svg')[popped];if(ic){ic.classList.add('on');ic.querySelectorAll('path')[0].setAttribute('fill',CB[c]);ic.querySelectorAll('path')[1].setAttribute('fill',CB[c])}
      popped++;
      if(popped>=need){done=true;sky.querySelectorAll('.balloon').forEach(x=>x.style.opacity='.3');setTimeout(()=>resolve(c),700)}
      };
    b.addEventListener('animationend',ev=>{if(ev.animationName==='rise')b.remove()});sky.append(b)};
  for(let k=0;k<5;k++)setTimeout(spawn,k*400);const iv=setInterval(()=>{if(done||!sky.isConnected){done=true;clearInterval(iv)}else spawn()},850);
})}
const CADJ={red:{m:'красный',f:'красная',n:'красное'},blue:{m:'синий',f:'синяя',n:'синее'},green:{m:'зелёный',f:'зелёная',n:'зелёное'},yellow:{m:'жёлтый',f:'жёлтая',n:'жёлтое'}};
async function colorRound(lvl){
  if(lvl>=6){const col=await balloons(['red','yellow','green','blue']);
    const pool=D3.cobj.filter(o=>o.c===col);const t=fresh(()=>pick(pool),x=>col+x.n);
    const others=shuffle(pool.filter(o=>o.n!==t.n)).filter((o,k,a)=>a.findIndex(y=>y.n===o.n)===k).slice(0,3);
    const q='Где '+CADJ[col][t.g]+' '+t.n+'?';if(!await ask(q))return;
    const ok=await choice(shuffle([t].concat(others).map(o=>({html:img(o.i),ok:o===t,key:o.n}))),{question:q,goodText:cap(CADJ[col][t.g])+' '+t.n+'.'});
    return roundDone(ok,{c:col});}
  const palette=lvl>=3?Object.keys(CN):['red','yellow','green','blue'];
  const col=await balloons(palette);
  const objs=[...new Set(D.colors.map(c=>c.o))];
  const find=(o,c)=>D.colors.find(x=>x.o===o&&x.c===c);
  let opts,q,good;
  if(lvl===1){const os=shuffle(objs).slice(0,4);const cs=[col].concat(shuffle(palette.filter(c=>c!==col)).slice(0,3));
    opts=os.map((o,k)=>({it:find(o,cs[k]),ok:k===0}));q='Где '+CN[col]+'?';good=cap(CN[col])+' '+os[0]+'.';}
  else if(lvl===2||lvl===3){const o=fresh(()=>pick(objs),x=>col+x);const n=lvl===2?4:6;const cs=[col].concat(shuffle(palette.filter(c=>c!==col)).slice(0,n-1));
    opts=cs.map((c,k)=>({it:find(o,c),ok:k===0}));q='Где '+CN[col]+' '+o+'?';good=cap(CN[col])+' '+o+'.';}
  else{const n=lvl===4?4:6;const o=fresh(()=>pick(objs),x=>col+x);const others=shuffle(objs.filter(x=>x!==o));const oc=shuffle(palette.filter(c=>c!==col));
    const list=[{it:find(o,col),ok:true},{it:find(others[0],col),ok:false},{it:find(o,oc[0]),ok:false},{it:find(others[1],oc[1]),ok:false}];
    if(n===6)list.push({it:find(others[2],col),ok:false},{it:find(o,oc[2]),ok:false});
    opts=list;q='Где '+CN[col]+' '+o+'?';good=cap(CN[col])+' '+o+'.';}
  if(!await ask(q))return;
  const ok=await choice(shuffle(opts.map(x=>({html:img(x.it.i),ok:x.ok,key:x.it.c+'-'+x.it.o}))),{question:q,goodText:good});
  return roundDone(ok,{c:col});
}

/* ---------- GAME 4: feed the animal */
async function feedRound(lvl){
  const PP=lvl<=2?D.animals.filter(a=>!RARE.includes(a.n)):D.animals;const pets=fresh(()=>lvl>=4?twoDiff(PP):[pick(PP)],x=>x[0].n);
  const target=pets[0];
  const allF=Object.keys(D.foods);
  const fkey=lvl>=3&&Math.random()<.5?pick(allF):target.f;
  const nF=lvl===1?2:3;
  const avoid=pets.map(p=>p.f);
  const foods=shuffle([fkey].concat(shuffle(allF.filter(f=>f!==fkey&&!avoid.includes(f))).slice(0,nF-1)));
  const q='Дай '+target.dat+' '+D.foods[fkey].acc+'!';
  if(!await ask(q))return;G.round.good=q;
  const st=$('#stage');
  st.innerHTML=`<div class="feed"><div class="pets">${shuffle(pets).map(p=>`<button class="pet" data-n="${p.n}" aria-label="${p.n}">${img(p.i)}</button>`).join('')}</div><div class="foods grid" style="--n:${foods.length}">${foods.map(f=>`<button class="opt" data-f="${f}" aria-label="${D.foods[f].acc}">${img(D.foods[f].i)}</button>`).join('')}</div></div>`;
  const petEls=[...st.querySelectorAll('.pet')],foodEls=[...st.querySelectorAll('.foods .opt')];
  const ok=await new Promise(resolve=>{
    let selected=null,locked=false;
    const deliver=async(fEl,pEl)=>{locked=true;
      const fr=fEl.getBoundingClientRect(),pr=pEl.getBoundingClientRect();const fl=fEl.cloneNode(true);fl.className='opt flyer';
      Object.assign(fl.style,{left:fr.left+'px',top:fr.top+'px',width:fr.width+'px',height:fr.height+'px'});document.body.append(fl);fEl.classList.add('gone');
      requestAnimationFrame(()=>{fl.style.transform=`translate(${pr.left+pr.width/2-fr.left-fr.width/2}px,${pr.top+pr.height*.45-fr.top-fr.height/2}px) scale(.45)`;fl.style.opacity='0'});
      await wait(600);fl.remove();
      const right=fEl.dataset.f===fkey&&pEl.dataset.n===target.n;
      if(right){pEl.classList.add('eat');sfx.chomp();for(let i=0;i<4;i++){const h=document.createElement('span');h.className='heart';h.textContent='♥';h.style.left=(20+Math.random()*60)+'%';h.style.top='40%';h.style.animationDelay=i*.15+'s';pEl.append(h)}
        const who=D.animals.find(a=>a.n===pEl.dataset.n);await animalSound(who);confetti(80);await say(pick(PRAISE));
        if(G&&!G.round.dead&&wantSayIt())await sayIt('Дай '+D.foods[fkey].acc,img(D.foods[fkey].i));resolve(!!G&&G.round.wrong===0)}
      else{G.round.wrong++;const badMs=sfx.bad();pEl.classList.remove('no');void pEl.offsetWidth;pEl.classList.add('no');fEl.classList.remove('gone');fEl.classList.remove('sel');selected=null;
        (G.round.picks=G.round.picks||[]).push(fEl.dataset.f);
        if(G.round.wrong>=2){foodEls.forEach(f=>{if(f.dataset.f===fkey)f.classList.add('hint')});if(pets.length>1)petEls.forEach(p=>{if(p.dataset.n===target.n)p.classList.add('target-hint')})}
        await wait(badMs);if(!st.isConnected||!G)return;await say('Нет. '+q);locked=false}
    };
    foodEls.forEach(f=>f.onclick=()=>{if(locked)return;if(pets.length===1){deliver(f,petEls[0]);return}
      foodEls.forEach(x=>x.classList.remove('sel'));selected=f;f.classList.add('sel');tone(660,0,.08,'triangle',.1)});
    petEls.forEach(p=>p.onclick=()=>{if(locked)return;if(pets.length>1&&selected)deliver(selected,p);else if(pets.length>1){p.classList.remove('no');void p.offsetWidth;p.classList.add('no')}else{tone(660,0,.08,'triangle',.1);say(q)}}); /* v26: нажал на животное — повторяем задание, чтобы не казалось, что игра «сломалась» */
  });
  return roundDone(ok,{a:target.n,f:fkey});
}
/* ---------- GAME 5: prepositions */
function prepPairs(set,a='в',b='на'){const m={};D.preps.filter(p=>!set||p.set===set).forEach(p=>{(m[p.k]=m[p.k]||{})[p.p]=p});return Object.values(m).filter(x=>x[a]&&x[b])}
async function prepRound(lvl){
  let opts,t;
  if(lvl<=2){const pr=fresh(()=>pick(prepPairs(lvl===1?'osa':'tr')),x=>x['в'].n);t=pr[pick(['в','на'])];opts=[pr['в'],pr['на']]}
  else if(lvl<=4){const pool=prepPairs(lvl===3?'osa':null);let a,b,k=0;do{[a,b]=shuffle(pool).slice(0,2);k++}while(a['в'].n===b['в'].n||(k<25&&G.seen.has(a['в'].n)));G.seen.add(a['в'].n);
    t=a[pick(['в','на'])];opts=[a['в'],a['на'],b['в'],b['на']]}
  else if(lvl<=6){const pr=fresh(()=>pick(prepPairs(lvl===5?'bel':'kot','под')),x=>x['под'].k);t=pr[pick(['под','на'])];opts=[pr['под'],pr['на']]}
  else if(lvl===7){const pool=prepPairs(pick(['bel','kot']),'под');let a,b,k=0;do{[a,b]=shuffle(pool).slice(0,2);k++}while(a['под'].nn===b['под'].nn||(k<25&&G.seen.has(a['под'].k)));G.seen.add(a['под'].k);
    t=a[pick(['под','на'])];opts=[a['под'],a['на'],b['под'],b['на']]}
  else{const vn=prepPairs(null),pn=prepPairs(null,'под');const useP=Math.random()<.5;const a=fresh(()=>pick(useP?pn:vn),x=>(useP?x['под']:x['в']).k);const b=pick(useP?vn:pn);
    t=useP?a[pick(['под','на'])]:a[pick(['в','на'])];opts=(useP?[a['под'],a['на']]:[a['в'],a['на']]).concat(useP?[b['в'],b['на']]:[b['под'],b['на']])}
  const q='Где '+t.w+' '+t.p+' '+t.n+'?';
  if(!await ask(q))return;
  const ok=await choice(shuffle(opts.map(o=>({html:img(o.i),ok:o===t,key:o.p+' '+o.n}))),{question:q,goodText:cap(t.w)+' '+t.p+' '+t.n+'.',wide:opts.length===4&&t.set==='tr'});
  return roundDone(ok,{p:t.p,n:t.n});
}
/* ---------- GAME 6: look-alike actions, pairs from the logoped's slides */
const PSET={1:'si',2:'ss',3:'ib',4:'sl'};
const PVERBS={si:['стоит','идёт'],ss:['стоит','сидит'],ib:['идёт','бежит'],sl:['спит','лежит']};
async function pairRound(lvl){
  const P=D2.pairs,pk=x=>x.a[0].i+x.a[1].i;let t,opts;
  if(lvl===3&&S.anim&&Math.random()<.5){const subs=[...new Set(D.anims.filter(a=>a.s&&a.v==='идёт').map(a=>a.s))].filter(s=>D.anims.some(a=>a.s===s&&a.v==='бежит'));
    const c=fresh(()=>({s:pick(subs),v:pick(['идёт','бежит'])}),x=>'a'+x.s+x.v);const A=v=>{const a=pick(D.anims.filter(x=>x.s===c.s&&x.v===v));return{i:a.a,s:c.s,v}};
    opts=[A('идёт'),A('бежит')];t=opts.find(o=>o.v===c.v)}
  else if(lvl<=4){const c=fresh(()=>{const pr=pick(P.filter(p=>p.set===PSET[lvl]));return{pr,t:pick(pr.a)}},x=>pk(x.pr)+x.t.i);t=c.t;opts=c.pr.a}
  else{const c=fresh(()=>{const pr=pick(P);return{pr,t:pick(pr.a)}},x=>pk(x.pr)+x.t.i);const p1=c.pr;t=c.t;const sets=Object.keys(PVERBS).filter(k=>k!==p1.set&&!PVERBS[k].includes(t.v));
    const p2=pick(P.filter(p=>p.set===pick(sets)));opts=p1.a.concat(p2.a)}
  if(t.v==='лежит'&&opts.some(o=>o.v==='спит'))t=opts.find(o=>o.v==='спит');
  const q='Кто '+t.v+'?';if(!await ask(q))return;
  const ok=await choice(shuffle(opts.map(a=>({html:img(a.i),ok:a===t,key:a.v}))),{question:q,goodText:cap(t.s)+' '+t.v+'.'});
  return roundDone(ok,{v:t.v,s:t.s});
}
/* ---------- GAME 7: big and small (logoped's «Размер» series + coloured objects) */
const SADJ={b:{m:'большой',f:'большая',n:'большое'},s:{m:'маленький',f:'маленькая',n:'маленькое'}};
const simg=(i,small)=>`<img src="${IMG[i]||i}" alt=""${small?' class="sm"':''}>`;
function sizeItems(){ // same picture shown big and small: logoped pairs + coloured objects + feed animals
  const L=D3.size2.map(x=>({b:x.b,s:x.s,n:x.n,g:x.g}));
  D3.cobj.forEach(o=>L.push({b:o.i,s:o.i,n:o.n,g:o.g,c:o.c}));
  return L}
async function sizeRound0(lvl){
  let opts,q,good,meta;const which=pick(['b','s']);
  if(lvl===1){const pr=fresh(()=>pick(D3.size1),x=>x.b.i+which);const t=pr[which];
    q=which==='b'?'Что большое?':'Что маленькое?';good=cap(SADJ[which][t.g])+' '+t.n+'.';
    opts=[{html:simg(pr.b.i,false),ok:which==='b',key:'b'},{html:simg(pr.s.i,true),ok:which==='s',key:'s'}];meta={sz:which,n:t.n}}
  else{const items=sizeItems();const n=lvl===2?1:lvl===4?3:2;
    if(lvl===5){const nouns=[...new Set(D3.cobj.map(o=>o.n))].filter(nn=>new Set(D3.cobj.filter(o=>o.n===nn).map(o=>o.c)).size>=2);
      const c=fresh(()=>{const nn=pick(nouns);const two=shuffle(D3.cobj.filter(o=>o.n===nn)).filter((o,k,a)=>a.findIndex(y=>y.c===o.c)===k).slice(0,2);return{nn,two,t:pick(two)}},x=>x.t.i+which);
      const t=c.t;q='Где '+SADJ[which][t.g]+' '+CADJ[t.c][t.g]+' '+t.n+'?';good=cap(SADJ[which][t.g])+' '+CADJ[t.c][t.g]+' '+t.n+'.';
      opts=[];c.two.forEach(o=>['b','s'].forEach(z=>opts.push({html:simg(o.i,z==='s'),ok:o===t&&z===which,key:z})));meta={sz:which,n:t.n}}
    else{const t=fresh(()=>pick(items),x=>x.n+which);const others=shuffle(items.filter(x=>x.n!==t.n)).filter((o,k,a)=>a.findIndex(y=>y.n===o.n)===k).slice(0,n-1);
      q='Где '+SADJ[which][t.g]+' '+t.n+'?';good=cap(SADJ[which][t.g])+' '+t.n+'.';
      opts=[];[t].concat(others).forEach(o=>['b','s'].forEach(z=>opts.push({html:simg(z==='b'?o.b:o.s,z==='s'),ok:o===t&&z===which,key:z})));meta={sz:which,n:t.n}}}
  if(!await ask(q))return;
  const ok=await choice(shuffle(opts),{question:q,goodText:good});
  return roundDone(ok,meta);
}
