/* ===================== v25: «Повторяй за Шариком» = звуки, слоги, слова, «хочу…»; «Большой — маленький, один — много»;
   глянцевые шарики, переходы карточек, «Лови!», новые шарики, пингвины с полыньями, цифры: обведи до конца, найди все, какая спряталась ===================== */

/* ---------- звук «щёлк» (кусочек пазла встал на место) */
sfx.snap=()=>{const a=ac();if(!a)return;const t=a.currentTime;
  const b=a.createBuffer(1,a.sampleRate*.03,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,6);
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='bandpass';f.frequency.value=3200;f.Q.value=1.2;g.gain.value=.55;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start(t);
  const o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(420,t+.01);o.frequency.exponentialRampToValueAtTime(140,t+.12);
  og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.32,t+.015);og.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(og).connect(a.destination);o.start(t);o.stop(t+.18);
  tone(1650,.05,.05,'triangle',.06)};

/* ---------- глянцевые шарики: блик, объём, иногда звёздочки, сердечки или зверёк */
let BALN=0;
function shadeHex(h,p){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);let r=n>>16,g=n>>8&255,b=n&255;
  const f=v=>Math.max(0,Math.min(255,Math.round(p>0?v+(255-v)*p/100:v*(1+p/100))));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}
const BAL_ANI=['dog','cat','rabbit','bear','frog','penguin','chick','monkey','tiger','pig','cow','duck'];
function balDeco(kind){
  if(kind==='star')return `<g fill="#fff" opacity=".9">${[[30,28,5],[19,40,3.2],[41,44,3.6],[26,52,2.4],[40,22,2.2]].map(([x,y,r])=>`<path transform="translate(${x} ${y}) scale(${r/5})" d="M0-5l1.5 3.3 3.6.4-2.7 2.4.8 3.6L0 2.9l-3.2 1.8.8-3.6-2.7-2.4 3.6-.4z"/>`).join('')}</g>`;
  if(kind==='heart')return `<g fill="#fff" opacity=".85">${[[30,32,1],[18,46,.6],[42,46,.7]].map(([x,y,s])=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0 6C-9-1-6-9 0-5 6-9 9-1 0 6z"/>`).join('')}</g>`;
  if(kind==='dots')return `<g fill="#fff" opacity=".55">${[[22,24],[38,26],[30,38],[18,40],[42,42],[26,54],[36,54]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`;
  if(kind==='ani'){const k=pick(BAL_ANI);const src=(IMG['img24/fl_'+k+'.webp'])||('img24/fl_'+k+'.webp');return `<circle cx="30" cy="35" r="15" fill="#fff" opacity=".85"/><image href="${src}" x="17" y="22" width="26" height="26"/>`}
  return ''}
function balloonSvg(fill,deco){const id='bg'+(BALN++);const lt=shadeHex(fill,55),dk=shadeHex(fill,-38);
  const kind=deco===undefined?pick(['','star','heart','dots','ani','ani','']):deco;
  return `<svg viewBox="0 0 60 90"><defs><radialGradient id="${id}" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="${lt}"/><stop offset=".42" stop-color="${fill}"/><stop offset="1" stop-color="${dk}"/></radialGradient></defs>
  <path d="M30 2C14 2 4 15 4 30c0 18 15 32 26 36 11-4 26-18 26-36C56 15 46 2 30 2z" fill="url(#${id})"/>${balDeco(kind)}
  <path d="M26.5 66h7l-3.5 5.5z" fill="${dk}"/><path d="M30 71.5q-6 8 0 16" stroke="#8a97ab" stroke-width="1.2" fill="none"/>
  <ellipse cx="18.5" cy="17" rx="5.5" ry="10" fill="#fff" opacity=".6" transform="rotate(-28 18.5 17)"/><ellipse cx="16" cy="32" rx="2" ry="3.4" fill="#fff" opacity=".4"/><path d="M44 50q4-6 4-14" stroke="#fff" stroke-width="1.6" fill="none" opacity=".25" stroke-linecap="round"/></svg>`}

/* ---------- новые игры с шариками */
/* «Кто там?»: в шариках звери, слышен голос — лопни шарик с этим зверем */
async function balAni(lvl){
  const R=G.round;const pool=ONO_L.filter(x=>x.i);const t=fresh(()=>pick(pool),x=>'ba'+x.n);const n=lvl===1?2:lvl===2?3:4;
  const others=shuffle(pool.filter(x=>x.n!==t.n&&x.o!==t.o)).slice(0,n-1);const all=shuffle([t].concat(others));
  if(!await ask('Кто так говорит?','Послушай! Кто так говорит? Лопни шарик!'))return;
  const st=$('#stage');const cols=shuffle(['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf','#9b6bff']);
  st.innerHTML=`<div class="sky bal-row">${all.map((x,k)=>`<button class="balloon still big ani" data-k="${k}" style="left:${(100/n)*k+(100/n-24)/2}%;top:${18+(k%2)*14}%;animation-delay:${k*.3}s">${balInner(cols[k],`<img src="${IMG[x.i]||x.i}" alt="">`)}</button>`).join('')}</div>`;
  const play=()=>animalSound({n:t.n});R.replay=play;await play();if(R.dead)return;
  let wrong=0;await new Promise(res=>{st.querySelectorAll('.balloon').forEach(b=>b.onpointerdown=async()=>{if(b._p)return;ac();const x=all[+b.dataset.k];
    if(x===t){b._p=1;popFx(b,cols[+b.dataset.k],st);b.remove();st.insertAdjacentHTML('beforeend',`<div class="drop">${img(x.i)}</div>`);res()}
    else{wrong++;G.round.wrong++;b.classList.add('nope');setTimeout(()=>b.classList.remove('nope'),500);tone(220,0,.18,'sine',.12);await play()}})});
  if(R.dead||!G)return;await wait(500);await animalSound({n:t.n});R.good=cap(t.n)+' говорит: '+t.o;await say(pick(PRAISE)+' '+R.good);
  return roundDone(wrong===0,{m:'кто там',n:t.n})}
/* «Лопни столько, сколько скажу»: шарики летят, считаем вслух */
async function balCount(lvl){
  const R=G.round;const n=fresh(()=>pick(lvl===1?[1,2]:lvl===2?[2,3]:[3,4,5]),x=>'bc'+x);
  const q='Лопни '+['','один шарик','два шарика','три шарика','четыре шарика','пять шариков'][n]+'!';if(!await ask(q))return;R.good=q;
  const st=$('#stage');st.innerHTML=`<div class="sky"><div class="bcnt"><b>${n}</b><span class="bc-dots">${'<i></i>'.repeat(n)}</span></div></div>`;const sky=st.firstChild;
  let got=0,done=false;const cols=['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf','#9b6bff','#ff9f43'];
  await new Promise(res=>{const spawn=()=>{if(done||!sky.isConnected){done=true;return}const c=pick(cols);const b=document.createElement('button');b.className='balloon';
      b.style.left=(5+Math.random()*75)+'%';b.style.animationDuration=(6+Math.random()*3)+'s, '+(1.8+Math.random())+'s';b.innerHTML=balloonSvg(c);
      b.onpointerdown=()=>{if(done||b._p)return;b._p=1;ac();popFx(b,c,st);b.remove();got++;const d=sky.querySelectorAll('.bc-dots i')[got-1];if(d)d.classList.add('on');tts(NUMW[got]);
        if(got>=n){done=true;sky.querySelectorAll('.balloon').forEach(x=>x.classList.add('away'));setTimeout(res,900)}};
      b.addEventListener('animationend',ev=>{if(ev.animationName==='rise')b.remove()});sky.append(b)};
    for(let k=0;k<4;k++)setTimeout(spawn,k*350);const iv=setInterval(()=>{if(done||!sky.isConnected){done=true;clearInterval(iv)}else spawn()},850)});
  if(R.dead||!G)return;sfx.good();confetti(90);await say(pick(PRAISE)+' '+cap(NUMW[n])+'!');
  return roundDone(true,{m:'сколько',n})}

/* ---------- «Повторяй за Шариком»: звуки животных, слоги, слова (ритмические ряды), «Хочу…» */
const DOG_SYL=['па','ба','ма','та','да','на','ка','га','пу','бу','му','ту','ду','ну','пи','би','ми','по','бо','мо'];
const DOG_EXTRA=[{t:'би-би',o:'Би-би!',i:'img24/fl_car.webp',w:'машина'},{t:'ту-ту',o:'Ту-ту!',i:'img24/pz_tr1.jpg',w:'поезд'}];
const DOGMODES={1:['snd','syl','snd','row'],2:['snd','syl','row','want'],3:['syl','row','want','snd'],4:['row','syl','want','row'],5:['row','syl','want','row'],6:['row','want','row','syl']};
const DOGROW={1:{t:3,n:2},2:{t:3,n:2},3:{t:3,n:4},4:{t:5,n:2},5:{t:5,n:4},6:{t:5,n:6}};
async function dogRound(lvl){
  const R=G.round;const mode=(DOGMODES[lvl]||DOGMODES[1])[rmode('dogm'+lvl,4)];
  let row,intro,afterWin=null,meta;
  if(mode==='snd'){const L=ONO_L.filter(x=>x.i).map(x=>({n:x.n,o:x.o,i:IMG[x.i]||x.i})).concat(DOG_EXTRA.map(x=>({n:x.w,o:x.o,i:IMG[x.i]||x.i})));
    const a=fresh(()=>pick(L),x=>'ds'+x.n);const s=a.o.replace(/!$/,'');row=[{t:s.toLowerCase(),i:a.i}];
    intro=cap(a.n)+' говорит: '+s.toLowerCase()+'! Повтори за Шариком!';afterWin=async()=>{if(hasSnd(a.n))await animalSound({n:a.n})};meta={m:'звук',n:a.n}}
  else if(mode==='syl'){const s=fresh(()=>pick(DOG_SYL),x=>'dy'+x);const k=lvl<=2?2:3;row=Array.from({length:k},()=>({t:s}));intro='Слушай Шарика! Смотри на рот!';meta={m:'слоги',n:s}}
  else if(mode==='want'){const x=fresh(()=>pick(VGW),y=>'dw'+y.n);const ph=wph(x).replace(/!$/,'');row=[{t:ph.toLowerCase(),i:IMG[x.i]||x.i,show:ph}];intro='Повтори за Шариком!';afterWin=async()=>{await say(x.r)};meta={m:'хочу',n:x.n}}
  else{const L=DOGROW[lvl]||DOGROW[1];const pool=RHY_LOGO().filter(r=>r.t===L.t);const r=dogDeck(pool.length?pool:RHY_LOGO(),L.t);
    row=Array.from({length:L.n},(_,k)=>({t:r.w[k%2],i:IMG[rpic(r.w[k%2])]||rpic(r.w[k%2])}));intro='Слушай Шарика! Смотри на рот!';meta={m:'ряд '+L.t+' тип',n:r.w.join('–')}}
  const first=!S.dogHi;S.dogHi=1;save();
  if(!await ask('Слушай Шарика!',first?'Это Шарик. Слушай и смотри на рот! Потом повтори.':intro))return;
  const st=$('#stage');st.innerHTML=`<div class="dogg"><div class="dogbox">${DOG_SVG}</div><div class="dogrow n${row.length}">${row.map((w,k)=>`<div class="dogc${w.i?'':' txt'}" data-k="${k}" style="--d:${k*90}ms">${w.i?`<img src="${w.i}" alt="">`:''}<span>${w.show||w.t}</span></div>`).join('')}</div><div class="doghint"></div></div>`;
  const dog=st.querySelector('.dogbox'),cs=[...st.querySelectorAll('.dogc')],hint=st.querySelector('.doghint');
  const rate=Math.max(.55,(S.rate||.85)-.2);
  const model=async()=>{for(let k=0;k<row.length;k++){if(R.dead)return;cs.forEach(c=>c.classList.remove('on'));cs[k].classList.add('on');await dogSay(dog,row[k].t,rate);await wait(mode==='syl'?120:250)}cs.forEach(c=>c.classList.remove('on'))};
  R.replay=async()=>{if(R.busy)return;R.busy=1;await model();R.busy=0};
  R.busy=1;await model();R.busy=0;if(R.dead)return;
  await wait(300);await say('Теперь ты!');if(R.dead)return;setPrompt('Теперь ты!');hint.textContent='Повтори за Шариком';dog.classList.add('listen');
  let k=0;const light=()=>{cs.forEach(c=>c.classList.remove('on'));if(k<cs.length){cs[k].classList.add('on','said')}k++};
  let usedMic=false;
  if(S.voiceGame&&MICX!==false&&await VM.start()){usedMic=true;let last=performance.now();
    const det=segDetector(()=>{light();last=performance.now();tone(660,0,.08,'triangle',.1)},()=>{last=performance.now()});
    await new Promise(res=>{VM.cb=(v,t)=>{det(v,t);if(R.dead)return res();if(k>=cs.length&&t-last>700)return res();if(t-last>(k?3500:7000))return res()}});VM.cb=null;VM.stop()}
  else{for(let j=0;j<cs.length;j++){if(R.dead)return;light();await wait(mode==='syl'?800:1100)}}
  if(R.dead||!G)return;dog.classList.remove('listen');hint.textContent='';cs.forEach(c=>c.classList.add('ok'));
  sfx.good();confetti(80);R.good=row.map(x=>x.t).join(' — ');
  if(afterWin){cs[0].classList.add('win');await afterWin();if(R.dead)return}
  await dogSay(dog,pick(PRAISE),S.rate||.85);
  return roundDone(true,Object.assign(meta,{k:usedMic?Math.min(k,cs.length)+' из '+cs.length:null}))}

/* ---------- «Большой — маленький, один — много»: вопросы чередуются */
async function sizeRound(lvl){
  if(D.many&&D.many.length&&rmode('szm',2)===1)return manyRound(Math.min(lvl,3));
  return sizeRound0(lvl)}

/* ---------- награда: всегда пазл из 10 кусочков */
function finish(){VM.stop();show('finish');const okc=G.results.filter(Boolean).length;const great=okc>=(G.max||S.rounds)-1;$('#finish-title').textContent=great?'Молодец!':'Хорошо позанимались!';
  S.pz.ready=true;S.pz.maze=false;save();const ph=pzCur().ph;
  $('#earned').innerHTML=`<div class="rw24"><div class="rw-mini"${ph.f?` style="background-image:url('${ph.f}')"`:''}>${'<i></i>'.repeat(10)}</div><span>Пазл из 10 кусочков</span></div>`;
  const b=$('#btn-to-puz');b.hidden=false;b.textContent='Собрать пазл!';b.onclick=()=>{ac();openPuzzle()};
  sfx.up();confetti(160,innerWidth/2,innerHeight/3);say((great?'Молодец! Ты всё сделал!':'Хорошо позанимались!')+' Держи пазл!')}
function openReward(){if(S.pz.ready)return openPuzzle();return openAlbum()}

/* ---------- ЦИФРЫ: найди все, спрятались в траве / на дереве, какая цифра спряталась */
const NUMCOL=['#ff6b5b','#2f8be0','#3cbf7a','#7b61ff','#ff9f43'];
async function numFindAll(n,L){
  const R=G.round;const others=L.pool.filter(x=>x!==n).slice(0,lvlOthers(L));const cnt=L.pool.length>3?4:3;const total=L.pool.length>3?12:9;
  const cells=shuffle(Array(cnt).fill(n).concat(Array.from({length:total-cnt},()=>pick(others))));
  const q='Найди все цифры '+NUMW[n]+'!';if(!await ask(q,'Найди все цифры '+NUMW[n]+'! Нажми на каждую.'))return;$('#prompt').innerHTML=`Найди все <span class="digit sm">${n}</span>`;
  const st=$('#stage');st.innerHTML=`<div class="nfind"><div class="nf-grid c${total>9?4:3}">${cells.map((d,k)=>`<button class="nf" data-d="${d}" style="--d:${k*40}ms;color:${pick(NUMCOL)};transform:rotate(${(Math.random()*24-12).toFixed(0)}deg)">${d}</button>`).join('')}</div><div class="nf-left">${'<i></i>'.repeat(cnt)}</div></div>`;
  let got=0,wrong=0;await new Promise(res=>{st.querySelectorAll('.nf').forEach(b=>b.onclick=()=>{if(b._ok)return;ac();
    if(+b.dataset.d===n){b._ok=1;b.classList.add('found');st.querySelectorAll('.nf-left i')[got].classList.add('on');got++;sfx.snap();tts(cap(NUMW[n]));if(got>=cnt)setTimeout(res,500)}
    else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');tone(220,0,.18,'sine',.12);tts('Это '+NUMW[+b.dataset.d])}})});
  if(R.dead||!G)return;sfx.good();confetti(90);R.good='Все цифры '+NUMW[n]+'!';await say(pick(PRAISE)+' Все цифры '+NUMW[n]+'!');
  return roundDone(wrong<=1,{m:'найди все',n})}
const lvlOthers=L=>L.pool.length>3?3:2;
async function numHidden(n,L){
  const R=G.round;const scene=pick(['grass','tree']);const cnt=L.pool.length>3?4:3;const others=L.pool.filter(x=>x!==n);const dec=L.pool.length>3?3:2;
  const q='Найди цифры '+NUMW[n]+'!';if(!await ask(q,'Цифры '+NUMW[n]+' спрятались '+(scene==='grass'?'в траве':'на дереве')+'! Найди все!'))return;$('#prompt').innerHTML=`Где спряталась <span class="digit sm">${n}</span>?`;
  const spots=scene==='grass'?shuffle([[12,72],[28,80],[44,70],[60,82],[76,72],[88,84],[20,88],[52,90],[68,66],[36,62]]):shuffle([[30,24],[48,16],[66,26],[24,40],[42,34],[60,40],[76,38],[36,52],[56,54],[70,52]]);
  const items=Array(cnt).fill(n).concat(Array.from({length:dec},()=>pick(others)));
  const bg=scene==='grass'?`<svg class="scn" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#e8f7ff"/></linearGradient></defs><rect width="100" height="100" fill="url(#sk)"/><circle cx="84" cy="16" r="9" fill="#ffd34d"/><path d="M0 55Q25 45 50 55T100 52V100H0z" fill="#8fd16f"/><path d="M0 70Q30 60 60 70T100 66V100H0z" fill="#5fb65a"/></svg>`
    :`<svg class="scn" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="#dff4ff"/><rect x="0" y="84" width="100" height="16" fill="#8fd16f"/><rect x="45" y="50" width="10" height="38" rx="3" fill="#8a5a2b"/><ellipse cx="50" cy="34" rx="40" ry="26" fill="#4fae55"/><ellipse cx="30" cy="40" rx="18" ry="14" fill="#5fbf5f"/><ellipse cx="70" cy="40" rx="18" ry="14" fill="#5fbf5f"/><ellipse cx="50" cy="20" rx="20" ry="12" fill="#66c766"/></svg>`;
  const blades=scene==='grass'?Array.from({length:70},(_,k)=>{const x=(k*1.45+Math.random()*2).toFixed(1),h=(10+Math.random()*16).toFixed(1);return `<path d="M${x} 100 q${(Math.random()*4-2).toFixed(1)} -${h} ${(Math.random()*3-1.5).toFixed(1)} -${(+h+4).toFixed(1)}" stroke="${pick(['#3f9e4d','#4fb35a','#2f8a3f'])}" stroke-width="2.2" fill="none"/>`}).join(''):
    Array.from({length:30},()=>{const x=(14+Math.random()*72).toFixed(1),y=(10+Math.random()*44).toFixed(1);return `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.2" fill="${pick(['#3f9e4d','#4fb35a','#6bcf6b'])}" transform="rotate(${(Math.random()*90-45).toFixed(0)} ${x} ${y})"/>`}).join('');
  const st=$('#stage');st.innerHTML=`<div class="nhide ${scene}">${bg}${items.map((d,k)=>{const [x,y]=spots[k];return `<button class="nh" data-d="${d}" style="left:${x}%;top:${y}%;color:${pick(NUMCOL)};transform:translate(-50%,-50%) rotate(${(Math.random()*40-20).toFixed(0)}deg)">${d}</button>`}).join('')}<svg class="scn front" viewBox="0 0 100 100" preserveAspectRatio="none">${blades}</svg><div class="nf-left">${'<i></i>'.repeat(cnt)}</div></div>`;
  let got=0,wrong=0;const hintT=setTimeout(()=>{st.querySelectorAll('.nh').forEach(b=>{if(+b.dataset.d===n&&!b._ok)b.classList.add('peek')})},12000);
  await new Promise(res=>{st.querySelectorAll('.nh').forEach(b=>b.onclick=()=>{if(b._ok)return;ac();
    if(+b.dataset.d===n){b._ok=1;b.classList.add('found');st.querySelectorAll('.nf-left i')[got].classList.add('on');got++;sfx.snap();tts(cap(NUMW[n]));if(got>=cnt)setTimeout(res,500)}
    else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');tone(220,0,.18,'sine',.12);tts('Это '+NUMW[+b.dataset.d])}})});
  clearTimeout(hintT);if(R.dead||!G)return;sfx.good();confetti(90);R.good='Нашёл все цифры '+NUMW[n]+'!';await say(pick(PRAISE)+' Ты нашёл все цифры '+NUMW[n]+'!');
  return roundDone(wrong<=1,{m:'в траве',n})}
async function numPeek(L){
  const R=G.round;const len=L.pool.length>3?4:3;const row=shuffle(L.pool.slice()).slice(0,len);const hid=rnd(len),n=row[hid];
  if(!await ask('Запомни цифры!','Смотри и запомни цифры!'))return;
  const st=$('#stage');st.innerHTML=`<div class="npeek"><div class="np-row">${row.map((d,k)=>`<div class="np" data-k="${k}" style="color:${NUMCOL[k%5]}"><b>${d}</b><i class="cloud"></i></div>`).join('')}</div><div class="grid n${Math.min(3,L.k+1)} numopts"></div></div>`;
  for(const d of row){if(R.dead)return;await say(NUMW[d]);await wait(250)}await wait(1200);if(R.dead)return;
  st.querySelectorAll('.np')[hid].classList.add('hid');tone(500,0,.2,'sine',.08);
  const q='Какая цифра спряталась?';setPrompt(q);await say(q);if(R.dead)return;
  const opts=shuffle([n].concat(shuffle(L.pool.filter(x=>x!==n)).slice(0,Math.min(2,L.k))));posFix(opts,d=>d===n);
  const box=st.querySelector('.numopts');const ok=await new Promise(res=>{let wrong=0;opts.forEach((d,k)=>{const b=document.createElement('button');b.className='opt';b.style.setProperty('--i',k);b.innerHTML=digCard(d);box.append(b);
    b.onclick=async()=>{if(b._l)return;ac();if(d===n){box.querySelectorAll('.opt').forEach(x=>x._l=1);b.classList.add('good');st.querySelectorAll('.np')[hid].classList.remove('hid');st.querySelectorAll('.np')[hid].classList.add('show');sfx.good();confetti(60);R.good='Спряталась цифра '+NUMW[n]+'.';await say(pick(PRAISE)+' Спряталась цифра '+NUMW[n]+'!');res(wrong===0)}
      else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');await wait(sfx.bad());await say('Нет. '+q)}}})});
  return roundDone(ok,{m:'спряталась',n})}
/* обведи цифру — до самого конца: закрашивается то, что обвёл; засчитывается, когда обведено почти всё и дошёл до конца */
async function numTrace(n,pic){
  const q='Обведи цифру '+NUMW[n]+'!';if(!await ask(q,'Обведи пальчиком цифру '+NUMW[n]+'! Начни с зелёной точки.'))return;G.round.good='Это цифра '+NUMW[n]+'.';
  const st=$('#stage');st.innerHTML=`<div class="trace"><svg viewBox="0 0 210 260"><path class="tr-bg" d="${DIGP[n]}"/><path class="tr-guide" d="${DIGP[n]}"/><g class="tr-fill"></g><path class="tr-ink" d=""/><circle class="tr-start" r="12"/><circle class="tr-end" r="9"/></svg></div>`;
  const svg=st.querySelector('svg'),bg=svg.querySelector('.tr-bg'),ink=svg.querySelector('.tr-ink'),fillG=svg.querySelector('.tr-fill');
  const L=bg.getTotalLength(),N=80,pts=[];for(let k=0;k<=N;k++){const p=bg.getPointAtLength(L*k/N);pts.push({x:p.x,y:p.y,hit:false})}
  /* точки, где путь «прыгает» (у четвёрки две линии) — не соединяем */
  const jump=k=>k>0&&Math.hypot(pts[k].x-pts[k-1].x,pts[k].y-pts[k-1].y)>L/N*3;
  svg.querySelector('.tr-start').setAttribute('cx',pts[0].x);svg.querySelector('.tr-start').setAttribute('cy',pts[0].y);
  svg.querySelector('.tr-end').setAttribute('cx',pts[N].x);svg.querySelector('.tr-end').setAttribute('cy',pts[N].y);
  let d='',drawing=false;const R0=G.round;
  const hintT=setTimeout(()=>{if(G&&G.round===R0)svg.insertAdjacentHTML('beforeend',`<circle class="tr-dot" r="9"><animateMotion dur="3s" repeatCount="indefinite" path="${DIGP[n]}"/></circle>`)},6000);
  const redraw=()=>{let s='';for(let k=1;k<=N;k++)if(pts[k].hit&&pts[k-1].hit&&!jump(k))s+=`M${pts[k-1].x.toFixed(1)} ${pts[k-1].y.toFixed(1)}L${pts[k].x.toFixed(1)} ${pts[k].y.toFixed(1)}`;fillG.innerHTML=`<path d="${s}" class="tr-done"/>`};
  const ready=()=>pts.filter(p=>p.hit).length>=pts.length-3&&pts[N].hit;
  await new Promise(res=>{
    const P=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())};
    const mark=q=>{let ch=false;for(const p of pts)if(!p.hit&&Math.hypot(p.x-q.x,p.y-q.y)<28){p.hit=true;ch=true}if(ch)redraw();if(pts.every(p=>p.hit)){drawing=false;res()}};
    svg.onpointerdown=e=>{e.preventDefault();ac();try{svg.setPointerCapture(e.pointerId)}catch(_){}drawing=true;const q=P(e);d+=`M${q.x.toFixed(1)} ${q.y.toFixed(1)} `;ink.setAttribute('d',d);mark(q)};
    svg.onpointermove=e=>{if(!drawing)return;const q=P(e);d+=`L${q.x.toFixed(1)} ${q.y.toFixed(1)} `;ink.setAttribute('d',d);mark(q)};
    svg.onpointerup=svg.onpointercancel=()=>{drawing=false;if(ready())res()}});
  clearTimeout(hintT);if(R0.dead||!G)return;svg.onpointerdown=svg.onpointermove=null;pts.forEach(p=>p.hit=true);redraw();
  bg.classList.add('done');sfx.good();confetti(90);await say(pick(PRAISE)+' Это цифра '+NUMW[n]+'!');if(R0.dead)return;
  st.querySelector('.trace').insertAdjacentHTML('beforeend',`<div class="tr-count">${numCard(n,pic)}</div>`);await say(cap(NUMW[n])+'!');await wait(500);
  return roundDone(true,{m:'обведи',n})}

/* ---------- ПИНГВИНЫ: полыньи (упал — начинаем сначала), поле 5×5 и 6×6, задачи от 6 ходов */
function pgSlide2(N,ps,lv,i,dr,dc){let [r,c]=ps[i];const occ=new Set(ps.map(p=>p[0]*N+p[1]).concat(lv.rocks.map(p=>p[0]*N+p[1])));const hol=new Set((lv.holes||[]).map(p=>p[0]*N+p[1]));
  while(r+dr>=0&&r+dr<N&&c+dc>=0&&c+dc<N&&!occ.has((r+dr)*N+c+dc)){r+=dr;c+=dc;if(hol.has(r*N+c))return{r,c,sink:true}}return{r,c}}
function pgSolve2(ps0,lv,limit=150000){const N=lv.n||5;const key=v=>v.map(p=>p.join(',')).join(';');const q=[[ps0,null,0]];const seen=new Set([key(ps0)]);let h=0;
  while(h<q.length&&seen.size<limit){const [ps,f,d]=q[h++];
    for(let i=0;i<ps.length;i++)for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){const np=pgSlide2(N,ps,lv,i,dr,dc);if(np.sink||(np.r===ps[i][0]&&np.c===ps[i][1]))continue;
      const n=ps.map(p=>p.slice());n[i]=[np.r,np.c];const k=key(n);if(seen.has(k))continue;seen.add(k);const ff=f||{i,dr,dc};
      if(i===0&&np.r===lv.fish[0]&&np.c===lv.fish[1])return{first:ff,d:d+1};q.push([n,ff,d+1])}}
  return null}
async function pgRound(){return pzShell('pg',{word:'Ходы',intro:'Помоги пингвину с шарфиком добраться до рыбки! Смахни пингвина пальцем — он скользит, пока не упрётся. Осторожно: синие полыньи! Кто в них въедет — упадёт в воду.',again:'Веди пингвина к рыбке! Не упади в полынью!',winSay:'Пингвин поймал рыбку!',
  mount(ctx){const lv=ctx.lv;const N=lv.n||5;const {b,pad,cs}=pzSquare(ctx.area,N);b.classList.add('pg');let ps=lv.p.map(x=>x.slice());let busy=false;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){const d=document.createElement('div');d.className='pgcell';Object.assign(d.style,{left:pad+c*cs+'px',top:pad+r*cs+'px',width:cs+'px',height:cs+'px'});b.append(d)}
    const put=(el,[r,c])=>Object.assign(el.style,{left:pad+c*cs+'px',top:pad+r*cs+'px',width:cs+'px',height:cs+'px'});
    (lv.holes||[]).forEach(p=>{const e=document.createElement('div');e.className='pghole';e.innerHTML='<i></i><i></i>';put(e,p);b.append(e)});
    const fish=document.createElement('div');fish.className='pgfish';fish.innerHTML=`<img src="${IMG.pz_fish}" alt="">`;put(fish,lv.fish);b.append(fish);
    lv.rocks.forEach(p=>{const e=document.createElement('div');e.className='pgrock';e.innerHTML=`<img src="${IMG.pz_rock}" alt="">`;put(e,p);b.append(e)});
    const els=ps.map((p,i)=>{const e=document.createElement('div');e.className='pgpen'+(i===0?' main':'');e.innerHTML=`<img src="${IMG.pz_peng}" alt="">${i===0?'<i class="scarf"></i>':''}`;put(e,p);b.append(e);return e});
    const all=()=>ps.forEach((p,i)=>{els[i].style.transition='none';els[i].classList.remove('sink');put(els[i],p)});
    els.forEach((e,i)=>{let d=null;
      e.onpointerdown=ev=>{if(ctx.done||busy)return;ev.preventDefault();ac();e.setPointerCapture(ev.pointerId);b.querySelectorAll('.hint').forEach(x=>x.classList.remove('hint'));d={x:ev.clientX,y:ev.clientY}};
      e.onpointerup=e.onpointercancel=async ev=>{if(!d)return;const dx=ev.clientX-d.x,dy=ev.clientY-d.y;d=null;
        if(Math.max(Math.abs(dx),Math.abs(dy))<cs*.3){say(i===0?'Смахни пингвина пальцем в сторону!':'Этого пингвина тоже можно двигать!');return}
        const [dr,dc]=Math.abs(dx)>Math.abs(dy)?[0,Math.sign(dx)]:[Math.sign(dy),0];const np=pgSlide2(N,ps,lv,i,dr,dc);
        if(np.r===ps[i][0]&&np.c===ps[i][1]){e.classList.remove('bump');void e.offsetWidth;e.classList.add('bump');return}
        const dist=Math.abs(np.r-ps[i][0])+Math.abs(np.c-ps[i][1]);busy=true;ctx.setSteps(ctx.steps+1);
        e.style.transition=`left ${.12*dist+.1}s ease-out,top ${.12*dist+.1}s ease-out`;put(e,[np.r,np.c]);tone(700,0,.12*dist,'sine',.05);await wait(120*dist+120);
        if(np.sink){e.classList.add('sink');tone(300,0,.4,'sine',.1);tone(180,.15,.4,'sine',.08);await say('Ой! Пингвин упал в воду! Начнём сначала.');ps=lv.p.map(x=>x.slice());all();ctx.setSteps(0);busy=false;return}
        ps[i]=[np.r,np.c];busy=false;
        if(i===0&&np.r===lv.fish[0]&&np.c===lv.fish[1]){fish.classList.add('eaten');e.classList.add('happy');await wait(500);ctx.win()}}});
    return{t:{get ps(){return ps},els,cs},reset(){ps=lv.p.map(x=>x.slice());all()},
      hint(){const s=pgSolve2(ps,lv);if(!s){ctx.pulseReset();say('Так не получится. Начнём сначала!');return}const {i,dr,dc}=s.first;els[i].classList.add('hint');
        const [r,c]=ps[i];ctx.arrow(pad+(c+.5+dc*.75)*cs,pad+(r+.5+dr*.75)*cs,cs*.7,dc===1?0:dc===-1?180:dr===1?90:-90);
        say((i===0?'Смахни пингвина с шарфиком ':'Смахни этого пингвина ')+(dc===1?'вправо':dc===-1?'влево':dr===1?'вниз':'вверх')+'!')}}}})}
if(window.PG25&&window.PG25.length)PZ.pg=window.PG25;

/* ---------- «Лови!»: звёздочки, +1, пойманное видно в корзинке */
function catchFx(o,box,bk){const r=o.el.getBoundingClientRect(),br=box.getBoundingClientRect();const cx=r.left-br.left+r.width/2,cy=r.top-br.top+r.height/2;
  for(let i=0;i<10;i++){const p=document.createElement('span');p.className='cstar';p.textContent=pick(['★','✦','✶']);p.style.left=cx+'px';p.style.top=cy+'px';p.style.color=pick(['#ffc93c','#ff6b5b','#7b61ff','#3cbf7a']);
    const a=i/10*Math.PI*2;p.style.setProperty('--dx',Math.cos(a)*70+'px');p.style.setProperty('--dy',Math.sin(a)*70-30+'px');box.append(p);setTimeout(()=>p.remove(),900)}
  const pl=document.createElement('span');pl.className='cplus';pl.textContent='+1';pl.style.left=(parseFloat(bk.style.left)+bk.offsetWidth/2)+'px';box.append(pl);setTimeout(()=>pl.remove(),1000);
  const pile=bk.querySelector('.pile')||bk.appendChild(Object.assign(document.createElement('div'),{className:'pile'}));if(pile.children.length<6)pile.insertAdjacentHTML('beforeend',wimg(o.it));
  sfx.snap();tone(880,.06,.12,'triangle',.1);tone(1320,.12,.14,'triangle',.08)}
/* ---------- переходы: каждое задание карточки появляются по-новому */
const CARD_ANIM=['pop','up','flip','side','zoom'];
function stageAnim(){const st=$('#stage');if(st)st.dataset.anim=CARD_ANIM[rnd(CARD_ANIM.length)]}
function mig25(){if((S.ver||0)>=25)return;S.tipOn=false;S.pzL=S.pzL||{};S.pzL.pg=0;S.pz.maze=false;S.lvl.dog=Math.min(S.lvl.dog||1,3);S.ver=25;save()}
