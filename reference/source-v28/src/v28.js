
/* ===================== v28: идёт/бежит/стоит/сидит — живые человечки; «Собака дома»; «Дорисуй»; шарики; фон ===================== */

/* ---------- человечки: одна фигурка, 4 позы, движение анимацией (идёт — медленно, бежит — быстро, наклон, пыль) */
const FIG_P={мальчик:{skin:'#f6cba4',hair:'#6b3e1f',st:'short',top:'#3b82f6',bot:'#2b3a67',shoe:'#e8452c'},
  девочка:{skin:'#f8d3b0',hair:'#b5651d',st:'tails',top:'#ff6fa3',bot:'#ff6fa3',skirt:1,shoe:'#7b61ff'},
  папа:{skin:'#eec19a',hair:'#2f2a26',st:'short',top:'#2fb37a',bot:'#3a3f4a',shoe:'#5a3a22',tall:1},
  мама:{skin:'#f6cba4',hair:'#e0a43a',st:'long',top:'#ffb020',bot:'#5b6bd6',shoe:'#c23b6b',tall:1},
  дедушка:{skin:'#efc6a4',hair:'#d9d9d9',st:'bald',top:'#a05a2c',bot:'#56606e',shoe:'#3a2a1a',tall:1},
  бабушка:{skin:'#f3cfb3',hair:'#e6e6e6',st:'bun',top:'#9b6bff',bot:'#9b6bff',skirt:1,shoe:'#5a3a22'}};
const FIG_W=Object.keys(FIG_P);
let FIG_N=0;
function figSvg(who,pose){const P=FIG_P[who]||FIG_P.мальчик;const id='f'+(++FIG_N);const L=P.tall?41:35,T=P.tall?56:48;
  const hipY=200-2*L-6,shY=hipY-T,hx=100,hy=shY-24;
  const leg=(c,dark)=>`<g class="th ${c}" style="transform-origin:${hx}px ${hipY}px"><line x1="${hx}" y1="${hipY}" x2="${hx}" y2="${hipY+L}" stroke="${dark?fshade(P.bot):P.bot}" stroke-width="15" stroke-linecap="round"/>
    <g class="sh" style="transform-origin:${hx}px ${hipY+L}px"><line x1="${hx}" y1="${hipY+L}" x2="${hx}" y2="${hipY+2*L}" stroke="${P.skirt?P.skin:(dark?fshade(P.bot):P.bot)}" stroke-width="${P.skirt?10:14}" stroke-linecap="round"/><ellipse cx="${hx+7}" cy="${hipY+2*L+3}" rx="13" ry="7" fill="${dark?fshade(P.shoe):P.shoe}"/></g></g>`;
  const arm=(c,dark)=>`<g class="ua ${c}" style="transform-origin:${hx}px ${shY+6}px"><line x1="${hx}" y1="${shY+6}" x2="${hx}" y2="${shY+6+T*.48}" stroke="${dark?fshade(P.top):P.top}" stroke-width="12" stroke-linecap="round"/>
    <g class="fa" style="transform-origin:${hx}px ${shY+6+T*.48}px"><line x1="${hx}" y1="${shY+6+T*.48}" x2="${hx}" y2="${shY+6+T*.92}" stroke="${P.skin}" stroke-width="10" stroke-linecap="round"/><circle cx="${hx}" cy="${shY+8+T*.92}" r="6.5" fill="${P.skin}"/></g></g>`;
  const hair={short:`<path d="M${hx-22} ${hy-2}q2-26 24-26q22 0 22 22q-10-10-24-8q-12 2-22 12z" fill="${P.hair}"/>`,
    tails:`<path d="M${hx-23} ${hy+2}q0-28 25-28q22 0 22 24q-12-12-26-10q-12 2-21 14z" fill="${P.hair}"/><circle cx="${hx-24}" cy="${hy-6}" r="9" fill="${P.hair}"/><path d="M${hx-30} ${hy}q-8 14-2 26q8-10 6-22z" fill="${P.hair}"/>`,
    long:`<path d="M${hx-24} ${hy+20}q-6-46 26-46q24 0 22 26q-12-12-28-8q-8 4-12 12q-2 10 2 22z" fill="${P.hair}"/>`,
    bald:`<path d="M${hx-23} ${hy+4}q-2-12 6-14l2 10z" fill="${P.hair}"/><path d="M${hx+6} ${hy+10}q10 2 14 -2" stroke="${P.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    bun:`<circle cx="${hx-14}" cy="${hy-22}" r="10" fill="${P.hair}"/><path d="M${hx-23} ${hy+2}q0-26 24-26q22 0 22 20q-12-10-26-8q-12 2-20 14z" fill="${P.hair}"/>`}[P.st];
  const body=P.skirt?`<path d="M${hx-14} ${shY}h28l${P.st==='bun'?10:8} ${T+10}h-${P.st==='bun'?56:52}z" fill="${P.top}"/>`
    :`<rect x="${hx-14}" y="${shY-2}" width="28" height="${T+8}" rx="12" fill="${P.top}"/>`;
  const head=`<circle cx="${hx}" cy="${hy}" r="22" fill="${P.skin}"/>${hair}<ellipse class="eye" cx="${hx+10}" cy="${hy-2}" rx="3" ry="3.6" fill="#2a2a2a"/><path d="M${hx+19} ${hy+2}q5 3 0 6" stroke="#d99a72" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M${hx+6} ${hy+12}q6 4 11 0" stroke="#b5533c" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="${hx+3}" cy="${hy+6}" r="4" fill="#ff9b8a" opacity=".45"/>`;
  const dy=L-2,sy=hipY+dy;const chair=pose==='сидит'?`<g class="chair"><rect x="${hx-40}" y="${sy-58}" width="10" height="${200-sy+58}" rx="4" fill="#a0612c"/><rect x="${hx-40}" y="${sy+5}" width="70" height="11" rx="5" fill="#c27a3a"/><rect x="${hx+18}" y="${sy+12}" width="9" height="${200-sy-12}" rx="4" fill="#a0612c"/></g>`:'';
  const fx=pose==='бежит'?`<g class="spd"><path d="M30 ${shY+10}h-22M38 ${shY+30}h-30M28 ${hipY}h-20" stroke="#9cc3ff" stroke-width="5" stroke-linecap="round"/></g><g class="dust"><circle cx="62" cy="196" r="7" fill="#d8c7a8"/><circle cx="48" cy="192" r="5" fill="#e3d6bd"/><circle cx="36" cy="197" r="4" fill="#ece2cf"/></g>`:'';
  const ground=`<rect x="0" y="${pose==='сидит'?200:200}" width="200" height="20" fill="#bde39b"/><g class="gr"><path d="${Array.from({length:12},(_,k)=>`M${k*40} 206h14`).join('')}" stroke="#8cc96a" stroke-width="4" stroke-linecap="round"/></g>`;
  return `<svg class="fig p-${{идёт:'walk',бежит:'run',стоит:'stand',сидит:'sit'}[pose]}" viewBox="0 -14 200 234" role="img" aria-label="${who} ${pose}"><rect y="-14" width="200" height="234" fill="#f3f8ff"/>${ground}${chair}${fx}
    <g class="bd" style="transform-origin:${hx}px ${hipY}px${pose==='сидит'?';--sitdy:'+dy+'px':''}">${arm('b',1)}${leg('b',1)}${body}${leg('f')}${head}${arm('f')}</g></svg>`}
function fshade(h){const v=parseInt(h.slice(1),16);const f=c=>Math.round(c*.78).toString(16).padStart(2,'0');return '#'+f(v>>16)+f((v>>8)&255)+f(v&255)}

/* «идёт / бежит / стоит / сидит»: 1 ур. — 2 карточки, 2 — 3, 3 — 4; потом фото и мультики; вопросы чередуются */
const IB_V=['идёт','бежит','стоит','сидит'];
async function ibRound(lvl){
  const R=G.round;
  if(lvl>=4&&rmode('ibph',3)===2){/* перенос: настоящие фото людей и мультики животных (идёт / бежит) */
    let opts;const subs=[...new Set(D.anims.filter(a=>a.s&&a.v==='идёт').map(a=>a.s))].filter(s=>D.anims.some(a=>a.s===s&&a.v==='бежит'));
    if(subs.length&&Math.random()<.5){const s=fresh(()=>pick(subs),x=>'ibA'+x);const A=v=>{const a=pick(D.anims.filter(x=>x.s===s&&x.v===v));return{i:a.a,s,v}};opts=[A('идёт'),A('бежит')]}
    else{const P=D2.pairs.filter(p=>p.set==='ib');const pr=fresh(()=>pick(P),x=>x.a[0].i+x.a[1].i);opts=pr.a}
    const ok=await twoQ(opts,['идёт','бежит'],'ibq');if(ok===null)return;return roundDone(ok,{v:'идёт/бежит (фото)',n:opts[0].s})}
  const n=lvl===1?2:lvl===2?3:4;
  /* набор глаголов: на 1 уровне пары чередуются (идёт–сидит, бежит–стоит, идёт–бежит, стоит–сидит…) */
  const PAIRS=[['идёт','сидит'],['бежит','стоит'],['идёт','бежит'],['стоит','сидит'],['бежит','сидит'],['идёт','стоит']];
  const verbs=n===2?PAIRS[rmode('ibpair',PAIRS.length)]:n===3?shuffle(IB_V.slice()).slice(0,3):IB_V.slice();
  /* на 1–2 уровне все карточки — один и тот же человек, потом разные */
  const same=lvl<=2||Math.random()<.4;const who0=fresh(()=>pick(FIG_W),x=>'ibw'+x);const ws=same?verbs.map(()=>who0):shuffle(FIG_W.slice()).slice(0,n);
  const opts=verbs.map((v,k)=>({v,s:ws[k]}));
  const ask2=shuffle(verbs.slice()).slice(0,2);let all=true;
  for(const v of ask2){const t=opts.find(o=>o.v===v);const q='Кто '+v+'?';if(!await ask(q))return;
    const ok=await choice(shuffle(opts.map(a=>({html:figSvg(a.s,a.v),ok:a===t,key:a.v}))),{question:q,goodText:cap(t.s)+' '+v+'.',sayit:cap(t.s)+' '+v});
    if(!ok)all=false;if(!G||G.round!==R||R.dead)return;await wait(300)}
  return roundDone(all,{v:verbs.join('/'),n:ws[0]})}

/* ---------- «Что это?»: живые картинки из презентаций (мультики животных и транспорта), без непонятных значков */
(function fixW28(){try{
  const AN={кот:'кошка',конь:'лошадь',цыпа:'цыплёнок',свинка:'свинья',овечка:'овца',ёжик:'ёж',мышка:'мышь',зайка:'заяц',козлик:'коза',ослик:'ослик',крыса:'крыса',птица:'птица'};
  const BAD=['подушка','пульт','телефон','дом','бревно','палка','росток','перо'];
  const MERGE={зайчик:'заяц',мышка:'мышь'};
  for(const [t,L] of Object.entries(W24T)){if(t==='all')continue;
    for(let k=L.length-1;k>=0;k--){const x=L[k];if(BAD.includes(x.n)){L.splice(k,1);continue}
      if(MERGE[x.n]){const y=L.find(z=>z.n===MERGE[x.n]);if(y){x.is.forEach(i=>y.is.includes(i)||y.is.push(i));L.splice(k,1);continue}x.n=MERGE[x.n]}
      const ph=x.is.filter(i=>!String(i).includes('fl_'));if(ph.length)x.is=ph}}
  /* животные: только понятные картинки со слайдов (мультяшные целиком, фото «стоит»), без мордочек-значков и зверей на стульях */
  const CHAIR=['корова','лиса','волк','тигр','енот','бобр','бурундук','кабан','лось','олень','рысь','барсук'];
  const SCENE=/ebed5a3c24|021c36ef57|611feaf0a5/;
  const apics=n=>{const out=[];const ad=i=>{if(i&&!out.includes(i)&&!SCENE.test(String(i)))out.push(i)};
    D.animals.filter(a=>a.n===n&&!(CHAIR.includes(n)&&!a.v24)).forEach(a=>ad(a.i));
    const ib=(IBS||[]).find(x=>x.s===n||IB_S[x.s]===n);if(ib)ad(ib.стоит);
    if(!out.length&&(window.ANIPIC||{})[n])ad(ANIPIC[n]);return out.filter(i=>!/e9_/.test(String(i)))};
  if(W24T.animals)W24T.animals.forEach(x=>{const ps=apics(x.n);x.is=ps});
  const add=(t,n,a)=>{const L=W24T[t];if(!L)return;let x=L.find(z=>z.n===n);if(!x){x={n,is:[]};L.push(x)}x.an=x.an||[];x.an.includes(a)||x.an.push(a)};
  const UNCLEAR=['anim2/image25.webp','anim/a_53318bbab361.webp','anim/a_fd7e773509c8.webp','anim/a_607bd9df7d49.webp'];
  (D.anims||[]).concat(D3.anims||[]).forEach(a=>{if(!a.s||!a.a||UNCLEAR.includes(a.a))return;const n=AN[a.s]||a.s;
    if(['самолёт','машина','лодка'].includes(n))add('transport',n,a.a);
    else if(!['девочка','мальчик','тётя','малыш','null','лама','птица','крыса','козёл'].includes(n))add('animals',n,a.a)});
  if(W24T.animals)W24T.animals.forEach(x=>{if(['лиса','волк'].includes(x.n)&&(x.an||[]).length)x.is=[]});
  if(W24T.animals)for(let k=W24T.animals.length-1;k>=0;k--){const x=W24T.animals[k];if(!x.is.length&&!(x.an||[]).length)W24T.animals.splice(k,1)}
  W24T.all=Object.entries(W24T).filter(([t])=>t!=='all').flatMap(([,L])=>L);
}catch(e){console.warn('fixW28',e)}})();
/* картинка для карточки: если есть «живая» (анимация со слайда) — чаще её */
const wPic=x=>x.an&&x.an.length&&(!x.is.length||Math.random()<.6)?pick(x.an):pick(x.is);

/* ---------- «СОБАКА ДОМА»: «Собака хочет спать» → тащим на кровать → «Собака спит!» */
const HM_PL={
  bed:{n:'кровать',ic:['bed'],bg:'#ece6ff'},
  table:{n:'стол',ic:['plate'],bg:'#fff0d4'},
  toilet:{n:'туалет',ic:['toilet'],bg:'#e4f3ff'},
  bath:{n:'ванна',ic:['bathtub'],bg:'#dcf5ff'},
  door:{n:'дверь',ic:['door'],bg:'#ffe9d9'},
  pool:{n:'бассейн',svg:'<svg viewBox="0 0 120 80"><rect x="6" y="16" width="108" height="58" rx="18" fill="#7fd0ff" stroke="#e9f6ff" stroke-width="7"/><path class="wv" d="M18 40q8-6 16 0t16 0 16 0 16 0 16 0 16 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path class="wv" d="M18 56q8-6 16 0t16 0 16 0 16 0 16 0 16 0" stroke="#d6f1ff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M98 6v34M110 6v34M98 14h12M98 26h12" stroke="#b0bccb" stroke-width="4" stroke-linecap="round"/></svg>',bg:'#d8f3e6'},
  closet:{n:'шкаф',ic:['coat'],bg:'#f1e9de'},
  art:{n:'краски',ic:['palette','crayon'],bg:'#ffe6f1'},
  tv:{n:'телевизор',ic:['television'],bg:'#e6ecff'},
  sink:{n:'зубная щётка',ic:['toothbrush'],bg:'#e9fbff'}};
const HM_T=[
  {k:'sleep',want:'спать',pl:'bed',done:'спит',lv:1},
  {k:'eat',want:'есть',pl:'table',done:'ест',lv:1,item:{ic:'bowl',n:'миску',lv:3}},
  {k:'walk',want:'гулять',pl:'door',done:'гуляет',lv:1},
  {k:'wash',want:'мыться',pl:'bath',done:'моется',lv:1,item:{ic:'soap',n:'мыло',lv:4}},
  {k:'tv',want:'смотреть мультик',pl:'tv',done:'смотрит мультик',lv:1},
  {k:'pool',want:'в бассейн',pl:'pool',done:'плавает',lv:2},
  {k:'toilet',want:'в туалет',pl:'toilet',done:'в туалете',lv:2},
  {k:'draw',want:'рисовать',pl:'art',done:'рисует',lv:2},
  {k:'dress',want:'одеться',pl:'closet',done:'одевается',lv:3,item:{ic:'t-shirt',n:'футболку',lv:3}},
  {k:'teeth',want:'чистить зубы',pl:'sink',done:'чистит зубы',lv:4}];
const HM_HERO=[{n:'собака',ic:'dog',dat:'собаке'},{n:'кошка',ic:'cat',dat:'кошке'},{n:'зайка',ic:'rabbit',dat:'зайке'},{n:'мишка',ic:'teddy2',dat:'мишке'}];
async function homeRound(lvl){
  const R=G.round;const nPl=[0,2,3,4,6][lvl]||4;
  const T=fresh(()=>pick(HM_T.filter(t=>t.lv<=Math.min(lvl,4))),t=>'hm'+t.k);
  const hero=lvl>=4&&Math.random()<.6?pick(HM_HERO.slice(1)):HM_HERO[0];const H=cap(hero.n);
  const others=shuffle(Object.keys(HM_PL).filter(p=>p!==T.pl)).slice(0,nPl-1);const pls=shuffle([T.pl].concat(others));posFix(pls,p=>p===T.pl);
  const q=H+' хочет '+T.want+'!';const how=T.pl==='door'?'Веди '+hero.n.replace(/а$/,'у')+' к двери!':'Где '+HM_PL[T.pl].n+'?';
  if(!await ask(q,q))return;R.good=H+' '+T.done+'.';R.replay=()=>say(q);
  const st=$('#stage');
  const plHtml=p=>{const P=HM_PL[p];return `<button class="hm-pl pl-${p}" data-p="${p}" style="--bg:${P.bg}" aria-label="${P.n}"><span class="hm-ic">${P.svg||P.ic.map(k=>`<img src="${I24(k)}" alt="" draggable="false">`).join('')}</span><span class="hm-fx"></span></button>`};
  st.innerHTML=`<div class="home28 n${nPl}"><div class="hm-house"><div class="hm-roof"></div><div class="hm-rooms">${pls.map(plHtml).join('')}</div></div>
    <div class="hm-floor"><div class="hm-hero" aria-label="${hero.n}"><img src="${I24(hero.ic)}" alt="" draggable="false"><i class="hm-bub">${{sleep:'💤',eat:'🍽️',walk:'🌳',wash:'🧼',tv:'📺',pool:'🌊',toilet:'🚽',draw:'🎨',dress:'👕',teeth:'🦷'}[T.k]}</i></div><div class="hm-tray"></div></div></div>`;
  const box=st.firstChild,heroEl=box.querySelector('.hm-hero');let wrong=0,done=false;
  const hintT=setTimeout(()=>{if(done)return;box.querySelector('.pl-'+T.pl).classList.add('hint');say(how)},9000);
  /* шаг 1: отвести героя */
  const res1=await new Promise(res=>{
    const tryPlace=async p=>{if(done)return;const el=box.querySelector('.pl-'+p);
      if(p===T.pl){done=true;clearTimeout(hintT);el.classList.remove('hint');sfx.snap();flyInto(heroEl,el,T.k);res(true);return}
      wrong++;G.round.wrong=(G.round.wrong||0)+1;el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad');heroBack();const ms=sfx.bad();await wait(Math.max(400,ms));
      if(!done)say('Нет, это '+HM_PL[p].n+'. '+q);if(wrong>=2)box.querySelector('.pl-'+T.pl).classList.add('hint')};
    const heroBack=()=>{heroEl.classList.add('back');heroEl.style.transform=''};
    let d=null;
    heroEl.onpointerdown=e=>{if(done)return;e.preventDefault();ac();try{heroEl.setPointerCapture(e.pointerId)}catch(_){}heroEl.classList.remove('back');heroEl.classList.add('drag');d={x:e.clientX,y:e.clientY};sfx.click()};
    heroEl.onpointermove=e=>{if(!d)return;heroEl.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px) scale(1.08)`};
    heroEl.onpointerup=heroEl.onpointercancel=e=>{if(!d)return;const moved=Math.hypot(e.clientX-d.x,e.clientY-d.y);d=null;heroEl.classList.remove('drag');
      if(moved<12){heroBack();say(q);return}
      const hit=[...box.querySelectorAll('.hm-pl')].find(b=>{const r=b.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom});
      if(!hit){heroBack();return}tryPlace(hit.dataset.p)};
    box.querySelectorAll('.hm-pl').forEach(b=>b.onclick=()=>{if(!done){ac();tryPlace(b.dataset.p)}})});
  clearTimeout(hintT);if(!res1||R.dead||!G||G.round!==R)return;await wait(650);if(R.dead)return;
  /* шаг 2 (со 3 уровня): дать миску / футболку / мыло */
  if(T.item&&lvl>=T.item.lv){const tray=box.querySelector('.hm-tray');const it=document.createElement('div');it.className='hm-item';it.innerHTML=`<img src="${I24(T.item.ic)}" alt="" draggable="false">`;tray.append(it);
    const q2='Дай '+hero.dat+' '+T.item.n+'!';setPrompt(q2);await say(q2);if(R.dead)return;const tgt=box.querySelector('.pl-'+T.pl);
    await new Promise(res=>{let d=null,ok=false;const fin=()=>{if(ok)return;ok=true;sfx.snap();tgt.querySelector('.hm-fx').insertAdjacentHTML('beforeend',`<img class="hm-given" src="${I24(T.item.ic)}" alt="">`);it.remove();res()};
      const h2=setTimeout(()=>{it.classList.add('hint');tgt.classList.add('hint')},8000);
      it.onclick=()=>{ac();clearTimeout(h2);fin()};
      it.onpointerdown=e=>{e.preventDefault();ac();try{it.setPointerCapture(e.pointerId)}catch(_){}d={x:e.clientX,y:e.clientY}};
      it.onpointermove=e=>{if(d)it.style.transform=`translate(${e.clientX-d.x}px,${e.clientY-d.y}px)`};
      it.onpointerup=e=>{if(!d)return;const r=tgt.getBoundingClientRect();const inT=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;const mv=Math.hypot(e.clientX-d.x,e.clientY-d.y);d=null;it.style.transform='';if(inT||mv<12){clearTimeout(h2);fin()}}});
    if(R.dead)return;await wait(300)}
  /* результат: анимация + голос «Собака спит!» */
  box.querySelector('.pl-'+T.pl).classList.add('fx-'+T.k);confetti(50);
  await say(pick(PRAISE)+' '+H+' '+T.done+'!');if(R.dead)return;await wait(1100);if(R.dead)return;
  if(S.sayit!=='off'&&Math.random()<.5)await sayIt(H+' '+T.done,`<img src="${I24(hero.ic)}" alt="">`);
  return roundDone(wrong===0,{n:T.k,m:hero.n,w:wrong})}
function flyInto(heroEl,pl,k){const a=heroEl.getBoundingClientRect(),b=pl.getBoundingClientRect();const fx=pl.querySelector('.hm-fx');
  const img=heroEl.querySelector('img').cloneNode();img.className='hm-in';fx.prepend(img);
  const c=img.getBoundingClientRect();img.animate([{transform:`translate(${a.left+a.width/2-(c.left+c.width/2)}px,${a.top+a.height/2-(c.top+c.height/2)}px) scale(1.6)`},{transform:'none'}],{duration:520,easing:'cubic-bezier(.3,1.3,.5,1)'});
  heroEl.style.visibility='hidden'}

/* ---------- «ДОРИСУЙ»: пунктир → провести пальчиком → картинка оживает */
const DRW_C=(cx,cy,r)=>`M${cx} ${cy-r}A${r} ${r} 0 1 1 ${cx-.1} ${cy-r}`;
const DRAW28=[
  /* 1: прямые линии */
  {lv:1,n:'дерево',q:'Дорисуй ствол!',base:'<circle cx="100" cy="72" r="50" fill="#7cc96b"/><circle cx="72" cy="86" r="26" fill="#6bbd5b"/><circle cx="128" cy="86" r="26" fill="#6bbd5b"/>',miss:'M100 120V188',done:'<rect x="88" y="112" width="24" height="78" rx="6" fill="#9a5b2e"/><circle cx="100" cy="72" r="50" fill="#5fbf5f"/><circle cx="72" cy="86" r="26" fill="#4fae55"/><circle cx="128" cy="86" r="26" fill="#4fae55"/><circle cx="84" cy="60" r="7" fill="#ef4a3d"/><circle cx="118" cy="78" r="7" fill="#ef4a3d"/>'},
  {lv:1,n:'цветок',q:'Дорисуй стебелёк!',base:'<g fill="#ff7eb3">'+[0,72,144,216,288].map(a=>`<ellipse cx="100" cy="38" rx="15" ry="22" transform="rotate(${a} 100 62)"/>`).join('')+'</g><circle cx="100" cy="62" r="13" fill="#ffd23f"/>',miss:'M100 84V188',done:'<path d="M100 84V188" stroke="#4fae55" stroke-width="9" stroke-linecap="round"/><ellipse cx="122" cy="140" rx="20" ry="9" fill="#5fbf5f" transform="rotate(-30 122 140)"/><g fill="#ff5c9a">'+[0,72,144,216,288].map(a=>`<ellipse cx="100" cy="38" rx="15" ry="22" transform="rotate(${a} 100 62)"/>`).join('')+'</g><circle cx="100" cy="62" r="13" fill="#ffc21a"/>'},
  {lv:1,n:'шарик',q:'Дорисуй ниточку!',base:'<ellipse cx="100" cy="72" rx="44" ry="54" fill="#ff6b5b"/><path d="M94 126h12l-6 8z" fill="#e24a3b"/>',miss:'M100 134V192',done:'<path d="M100 134q-10 14 0 28t0 30" stroke="#666" stroke-width="3" fill="none"/><ellipse cx="100" cy="72" rx="44" ry="54" fill="#ff5b4b"/><ellipse cx="84" cy="50" rx="10" ry="16" fill="#fff" opacity=".5"/><path d="M94 126h12l-6 8z" fill="#e24a3b"/>'},
  {lv:1,n:'квадрат',q:'Дорисуй квадрат!',base:'<path d="M150 46H50V154H150" stroke="#7b61ff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',miss:'M150 46V154',done:'<rect x="50" y="46" width="100" height="108" rx="4" fill="#ffd23f" stroke="#7b61ff" stroke-width="9"/>'},
  {lv:1,n:'флажок',q:'Дорисуй палочку!',base:'<path d="M60 34h80l-18 24 18 24H60z" fill="#ef4a3d"/>',miss:'M60 30V190',done:'<path d="M60 26V192" stroke="#8a5a2b" stroke-width="9" stroke-linecap="round"/><path d="M60 34h80l-18 24 18 24H60z" fill="#ef4a3d"/><circle cx="60" cy="24" r="7" fill="#ffc21a"/>'},
  {lv:1,n:'леденец',q:'Дорисуй палочку!',base:'<circle cx="100" cy="70" r="46" fill="#ff7eb3"/><path d="M100 70m-30 0a30 30 0 1 1 30 30a18 18 0 1 1 -12-18" stroke="#fff" stroke-width="7" fill="none"/>',miss:'M100 118V192',done:'<rect x="94" y="112" width="12" height="82" rx="6" fill="#f0e6d8"/><circle cx="100" cy="70" r="46" fill="#ff5c9a"/><path d="M100 70m-30 0a30 30 0 1 1 30 30a18 18 0 1 1 -12-18" stroke="#fff" stroke-width="7" fill="none"/>'},
  /* 2: дуги и уголки */
  {lv:2,n:'солнышко',q:'Дорисуй круг!',base:'<path d="M100 40A60 60 0 0 0 100 160" stroke="#ffb020" stroke-width="9" fill="none" stroke-linecap="round"/>',miss:'M100 40A60 60 0 0 1 100 160',done:'<g stroke="#ffb020" stroke-width="8" stroke-linecap="round">'+[0,45,90,135,180,225,270,315].map(a=>`<path d="M100 18V2" transform="rotate(${a} 100 100)"/>`).join('')+'</g><circle cx="100" cy="100" r="60" fill="#ffd23f"/><circle cx="80" cy="92" r="6" fill="#5a3a22"/><circle cx="120" cy="92" r="6" fill="#5a3a22"/><path d="M78 118q22 18 44 0" stroke="#5a3a22" stroke-width="5" fill="none" stroke-linecap="round"/>'},
  {lv:2,n:'мячик',q:'Дорисуй круг!',base:'<path d="M100 40A60 60 0 0 1 100 160" stroke="#2f8be0" stroke-width="9" fill="none" stroke-linecap="round"/>',miss:'M100 40A60 60 0 0 0 100 160',done:'<circle cx="100" cy="100" r="60" fill="#2f8be0"/><path d="M40 100h120" stroke="#fff" stroke-width="10"/><path d="M100 40q-36 60 0 120" stroke="#ffd23f" stroke-width="10" fill="none"/><ellipse cx="78" cy="70" rx="10" ry="16" fill="#fff" opacity=".4"/>'},
  {lv:2,n:'улыбка',q:'Дорисуй ротик!',base:'<circle cx="100" cy="100" r="74" fill="#ffe0b8" stroke="#e8b48a" stroke-width="5"/><circle cx="74" cy="84" r="9" fill="#3a2a1a"/><circle cx="126" cy="84" r="9" fill="#3a2a1a"/>',miss:'M66 122Q100 158 134 122',done:'<circle cx="100" cy="100" r="74" fill="#ffd8a8" stroke="#e8b48a" stroke-width="5"/><circle cx="74" cy="84" r="9" fill="#3a2a1a"/><circle cx="126" cy="84" r="9" fill="#3a2a1a"/><circle cx="60" cy="112" r="10" fill="#ff9b8a" opacity=".6"/><circle cx="140" cy="112" r="10" fill="#ff9b8a" opacity=".6"/><path d="M66 122Q100 158 134 122" stroke="#c0392b" stroke-width="8" fill="none" stroke-linecap="round"/>'},
  {lv:2,n:'домик',q:'Дорисуй крышу!',base:'<rect x="50" y="92" width="100" height="92" fill="#ffd9a0" stroke="#c98b4a" stroke-width="5"/><rect x="88" y="136" width="26" height="48" fill="#9a5b2e"/><rect x="62" y="108" width="22" height="22" fill="#9fd8ff"/>',miss:'M38 94L100 34L162 94',done:'<path d="M34 96L100 30L166 96z" fill="#ef4a3d"/><rect x="50" y="92" width="100" height="92" fill="#ffd9a0" stroke="#c98b4a" stroke-width="5"/><rect x="88" y="136" width="26" height="48" fill="#9a5b2e"/><rect x="62" y="108" width="22" height="22" fill="#9fd8ff"/><rect x="118" y="108" width="22" height="22" fill="#9fd8ff"/>'},
  {lv:2,n:'рыбка',q:'Дорисуй хвостик!',base:'<ellipse cx="112" cy="100" rx="56" ry="36" fill="#ff9f43"/><circle cx="142" cy="92" r="7" fill="#fff"/><circle cx="144" cy="92" r="4" fill="#222"/>',miss:'M58 100L24 70V130Z',done:'<path d="M60 100L22 66V134Z" fill="#ff7b1c"/><ellipse cx="112" cy="100" rx="56" ry="36" fill="#ff9f43"/><path d="M100 76q12 24 0 48" stroke="#ff7b1c" stroke-width="5" fill="none"/><circle cx="142" cy="92" r="7" fill="#fff"/><circle cx="144" cy="92" r="4" fill="#222"/>'},
  {lv:2,n:'грибок',q:'Дорисуй ножку!',base:'<path d="M36 100Q100 10 164 100Z" fill="#ef4a3d"/><circle cx="80" cy="74" r="8" fill="#fff"/><circle cx="118" cy="64" r="9" fill="#fff"/>',miss:'M84 102V176H116V102',done:'<rect x="84" y="98" width="32" height="80" rx="10" fill="#fff3dc" stroke="#e8c89a" stroke-width="4"/><path d="M36 100Q100 10 164 100Z" fill="#ef4a3d"/><circle cx="80" cy="74" r="8" fill="#fff"/><circle cx="118" cy="64" r="9" fill="#fff"/><circle cx="138" cy="86" r="6" fill="#fff"/>'},
  /* 3: несколько линий */
  {lv:3,n:'солнышко с лучиками',q:'Дорисуй лучики!',base:'<circle cx="100" cy="100" r="44" fill="#ffd23f"/>',miss:[0,60,120,180,240,300].map(a=>{const r=Math.PI*a/180;return `M${(100+56*Math.cos(r)).toFixed(1)} ${(100+56*Math.sin(r)).toFixed(1)}L${(100+86*Math.cos(r)).toFixed(1)} ${(100+86*Math.sin(r)).toFixed(1)}`}).join(''),done:'<g stroke="#ffb020" stroke-width="9" stroke-linecap="round">'+[0,60,120,180,240,300].map(a=>{const r=Math.PI*a/180;return `<path d="M${(100+56*Math.cos(r)).toFixed(1)} ${(100+56*Math.sin(r)).toFixed(1)}L${(100+86*Math.cos(r)).toFixed(1)} ${(100+86*Math.sin(r)).toFixed(1)}"/>`}).join('')+'</g><circle cx="100" cy="100" r="44" fill="#ffd23f"/><circle cx="86" cy="94" r="5" fill="#5a3a22"/><circle cx="114" cy="94" r="5" fill="#5a3a22"/><path d="M86 112q14 12 28 0" stroke="#5a3a22" stroke-width="4" fill="none" stroke-linecap="round"/>'},
  {lv:3,n:'машина',q:'Дорисуй колёса!',base:'<path d="M24 136V108q0-10 10-12l26-4 20-26h50l22 26 18 4q8 2 8 12v28z" fill="#2f8be0"/><path d="M86 72h20v22H70zM114 72h14l16 22h-30z" fill="#cdeaff"/>',miss:DRW_C(64,142,18)+DRW_C(140,142,18),done:'<path d="M24 136V108q0-10 10-12l26-4 20-26h50l22 26 18 4q8 2 8 12v28z" fill="#2f8be0"/><path d="M86 72h20v22H70zM114 72h14l16 22h-30z" fill="#cdeaff"/><circle cx="64" cy="142" r="20" fill="#333"/><circle cx="64" cy="142" r="8" fill="#ccc"/><circle cx="140" cy="142" r="20" fill="#333"/><circle cx="140" cy="142" r="8" fill="#ccc"/>'},
  {lv:3,n:'снеговик',q:'Дорисуй голову!',base:'<circle cx="100" cy="146" r="44" fill="#fff" stroke="#b9d3e8" stroke-width="5"/><circle cx="100" cy="130" r="5" fill="#333"/><circle cx="100" cy="150" r="5" fill="#333"/>',miss:DRW_C(100,72,32),done:'<circle cx="100" cy="146" r="44" fill="#fff" stroke="#b9d3e8" stroke-width="5"/><circle cx="100" cy="72" r="32" fill="#fff" stroke="#b9d3e8" stroke-width="5"/><circle cx="88" cy="66" r="4.5" fill="#333"/><circle cx="112" cy="66" r="4.5" fill="#333"/><path d="M100 74l22 6-22 4z" fill="#ff8c1a"/><path d="M76 46h48l-6-26H82z" fill="#333"/><circle cx="100" cy="130" r="5" fill="#333"/><circle cx="100" cy="150" r="5" fill="#333"/>'},
  {lv:3,n:'кошечка',q:'Дорисуй ушки!',base:'<circle cx="100" cy="112" r="58" fill="#ffb366"/><circle cx="80" cy="104" r="7" fill="#333"/><circle cx="120" cy="104" r="7" fill="#333"/><path d="M100 118l-7 7h14z" fill="#ff7b9c"/><path d="M60 126h-28M60 134l-26 6M140 126h28M140 134l26 6" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/>',miss:'M58 82L54 30L92 58M108 58L146 30L142 82',done:'<path d="M56 86L50 24L96 58zM104 58L150 24L144 86z" fill="#ff9a3c"/><path d="M62 72L60 40L84 58zM116 58L140 40L138 72z" fill="#ffc9d8"/><circle cx="100" cy="112" r="58" fill="#ffb366"/><circle cx="80" cy="104" r="7" fill="#333"/><circle cx="120" cy="104" r="7" fill="#333"/><path d="M100 118l-7 7h14z" fill="#ff7b9c"/><path d="M92 132q8 6 16 0" stroke="#8a5a2b" stroke-width="3" fill="none"/><path d="M60 126h-28M60 134l-26 6M140 126h28M140 134l26 6" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/>'}];
async function drawRound(lvl){
  const R=G.round;const it=fresh(()=>pick(DRAW28.filter(x=>x.lv===Math.min(lvl,3))),x=>'dr'+x.n);
  if(!await ask(it.q,it.q+' Веди пальчиком по точкам.'))return;R.good=cap(it.n)+'!';R.replay=()=>say(it.q);
  const st=$('#stage');st.innerHTML=`<div class="draw28"><svg viewBox="0 0 200 200"><rect width="200" height="200" rx="18" fill="#fffdf6"/><g class="dr-base">${it.base}</g><path class="dr-miss" d="${it.miss}"/><g class="dr-fill"></g><path class="dr-ink" d=""/></svg></div>`;
  const svg=st.querySelector('svg'),miss=svg.querySelector('.dr-miss'),ink=svg.querySelector('.dr-ink'),fillG=svg.querySelector('.dr-fill');
  const L=miss.getTotalLength(),N=Math.max(30,Math.round(L/5)),pts=[];for(let k=0;k<=N;k++){const p=miss.getPointAtLength(L*k/N);pts.push({x:p.x,y:p.y,hit:false})}
  const jump=k=>k>0&&Math.hypot(pts[k].x-pts[k-1].x,pts[k].y-pts[k-1].y)>L/N*2.5;
  const hintT=setTimeout(()=>{if(G&&G.round===R)svg.insertAdjacentHTML('beforeend',`<circle class="tr-dot" r="7"><animateMotion dur="${Math.max(2,L/60).toFixed(1)}s" repeatCount="indefinite" path="${it.miss}"/></circle>`)},5000);
  const redraw=()=>{let s='';for(let k=1;k<=N;k++)if(pts[k].hit&&pts[k-1].hit&&!jump(k))s+=`M${pts[k-1].x.toFixed(1)} ${pts[k-1].y.toFixed(1)}L${pts[k].x.toFixed(1)} ${pts[k].y.toFixed(1)}`;fillG.innerHTML=`<path d="${s}" class="dr-done"/>`};
  let d='',drawing=false,last=0;
  await new Promise(res=>{
    const P=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())};
    const ready=()=>pts.filter(p=>p.hit).length>=pts.length*.9;
    const mark=q=>{let ch=false;for(const p of pts)if(!p.hit&&Math.hypot(p.x-q.x,p.y-q.y)<20){p.hit=true;ch=true}if(ch){redraw();const t=Date.now();if(t-last>90){last=t;tone(420+pts.filter(p=>p.hit).length/pts.length*500,0,.06,'triangle',.06)}}if(ready()){drawing=false;res()}};
    svg.onpointerdown=e=>{e.preventDefault();ac();try{svg.setPointerCapture(e.pointerId)}catch(_){}drawing=true;const q=P(e);d+=`M${q.x.toFixed(1)} ${q.y.toFixed(1)} `;ink.setAttribute('d',d);mark(q)};
    svg.onpointermove=e=>{if(!drawing)return;const q=P(e);d+=`L${q.x.toFixed(1)} ${q.y.toFixed(1)} `;ink.setAttribute('d',d);mark(q)};
    svg.onpointerup=svg.onpointercancel=()=>{drawing=false}});
  clearTimeout(hintT);if(R.dead||!G)return;svg.onpointerdown=svg.onpointermove=null;
  svg.querySelectorAll('.dr-base,.dr-miss,.dr-fill,.dr-ink,.tr-dot').forEach(e=>e.remove());svg.insertAdjacentHTML('beforeend',`<g class="dr-final">${it.done}</g>`);
  sfx.good();confetti(90);await say(pick(PRAISE)+' '+cap(it.n)+'!');if(R.dead)return;await wait(700);
  return roundDone(true,{n:it.n})}

/* ---------- ШАРИКИ: без «по очереди»; новые — «Покорми» и «Лопни цифру» */
async function balFeed(lvl){
  const R=G.round;const PP=D.animals.filter(a=>a.f&&D.foods[a.f]&&!['мальчик','девочка'].includes(a.n)&&(lvl>=3||!RARE.includes(a.n)));
  const t=fresh(()=>pick(PP),x=>'bf'+x.n);const n=lvl===1?2:lvl===2?3:4;
  const fs=shuffle([t.f].concat(shuffle(Object.keys(D.foods).filter(f=>f!==t.f)).slice(0,n-1)));
  const q='Дай '+t.dat+' '+D.foods[t.f].acc+'!';if(!await ask(q,q+' Лопни шарик!'))return;R.good=q;R.replay=()=>say(q);
  const st=$('#stage');const cols=shuffle(['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf','#9b6bff']);
  st.innerHTML=`<div class="sky bal-row bfeed">${fs.map((f,k)=>`<button class="balloon still big ani" data-k="${k}" style="left:${(100/n)*k+(100/n-24)/2}%;top:${8+(k%2)*10}%;animation-delay:${k*.3}s">${balInner(cols[k],`<img src="${IMG[D.foods[f].i]||D.foods[f].i}" alt="">`)}</button>`).join('')}<div class="bf-pet">${img(t.i)}</div></div>`;
  let wrong=0;await new Promise(res=>{st.querySelectorAll('.balloon').forEach(b=>b.onpointerdown=async()=>{if(b._p)return;ac();const f=fs[+b.dataset.k];
    if(f===t.f){b._p=1;popFx(b,cols[+b.dataset.k],st);const r=b.getBoundingClientRect(),pr=st.querySelector('.bf-pet').getBoundingClientRect();b.remove();
      const fl=document.createElement('img');fl.className='bf-fly';fl.src=IMG[D.foods[f].i]||D.foods[f].i;Object.assign(fl.style,{left:r.left+r.width*.2+'px',top:r.top+'px',width:r.width*.6+'px'});document.body.append(fl);
      fl.animate([{transform:'none'},{transform:`translate(${pr.left+pr.width/2-r.left-r.width/2}px,${pr.top+pr.height*.4-r.top}px) scale(.6)`,opacity:.2}],{duration:700,easing:'ease-in'}).onfinish=()=>fl.remove();
      await wait(700);st.querySelector('.bf-pet').classList.add('eat');sfx.chomp();res()}
    else{wrong++;G.round.wrong++;b.classList.add('nope');setTimeout(()=>b.classList.remove('nope'),500);tone(220,0,.18,'sine',.12);say('Нет. Это '+(D.foods[f].acc||'')+'. '+q)}})});
  if(R.dead||!G)return;await animalSound(t);confetti(70);await say(pick(PRAISE));
  return roundDone(wrong===0,{m:'покорми',n:t.n})}
async function balDigit(lvl){
  const R=G.round;const pool=lvl===1?[1,2]:lvl===2?[1,2,3]:[1,2,3,4,5];const n=fresh(()=>pick(pool),x=>'bd'+x);const need=lvl===1?2:3;
  const q='Лопни шарики с цифрой '+NUMW[n]+'!';if(!await ask(q))return;R.good=q;$('#prompt').innerHTML=`Лопни <span class="digit sm">${n}</span>`;
  const st=$('#stage');st.innerHTML=`<div class="sky"><div class="bcount">${Array.from({length:need},()=>`<b class="bdg">${n}</b>`).join('')}</div></div>`;const sky=st.firstChild;
  const cols=['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf','#9b6bff','#ff9f43'];let got=0,wrong=0,done=false;
  await new Promise(res=>{const spawn=()=>{if(done||!sky.isConnected){done=true;return}const d=Math.random()<.45?n:pick(pool.filter(x=>x!==n));const c=pick(cols);const b=document.createElement('button');b.className='balloon big';
      b.style.left=(5+Math.random()*72)+'%';b.style.animationDuration=(6.5+Math.random()*3)+'s, '+(1.8+Math.random())+'s';b.innerHTML=balInner(c,`<b class="bdn">${d}</b>`);
      b.onpointerdown=()=>{if(done||b._p)return;ac();if(d===n){b._p=1;popFx(b,c,st);b.remove();const ic=sky.querySelectorAll('.bcount .bdg')[got];if(ic)ic.classList.add('on');got++;tts(cap(NUMW[n]));
          if(got>=need){done=true;sky.querySelectorAll('.balloon').forEach(x=>x.classList.add('away'));setTimeout(res,800)}}
        else{wrong++;b.classList.add('nope');setTimeout(()=>b.classList.remove('nope'),500);tone(220,0,.18,'sine',.12);tts('Это '+NUMW[d])}};
      b.addEventListener('animationend',ev=>{if(ev.animationName==='rise')b.remove()});sky.append(b)};
    for(let k=0;k<4;k++)setTimeout(spawn,k*400);const iv=setInterval(()=>{if(done||!sky.isConnected){done=true;clearInterval(iv)}else spawn()},900)});
  if(R.dead||!G)return;sfx.good();confetti(90);await say(pick(PRAISE)+' Это цифра '+NUMW[n]+'!');
  return roundDone(wrong<=1,{m:'цифры',n})}
async function balRound(lvl){const M=[balOnly,balInside,balAni,balFeed,balCount,balDigit];return M[rmode('bal28',M.length)](lvl)}
try{document.body.dataset.bg=String(Math.floor(Math.random()*3))}catch(_){}
