/* ===================== v24: «Хочу», пазл из 10 кусочков и лабиринт, «Что не…», идёт/бежит/стоит/сидит, «Что это?» (вместе с «Мир вокруг»),
   новые животные со звуками, перемешивание карточек ===================== */
const P24=k=>'img24/fl_'+k+'.webp';Object.assign(IMG,window.IMG24||{});const I24=k=>IMG[P24(k)]||P24(k);
/* ---------- порядок карточек: правильный ответ не стоит на одном месте, позиции не повторяются по шаблону */
const POSH=[];
function posFix(arr,okFn){const n=arr.length;if(n<2||!G)return arr;const k=arr.findIndex(okFn);if(k<0)return arr;
  const H=POSH;G.posH=H;const all=[...Array(n).keys()];
  const bad=p=>n===2?(H.length>=2&&H[H.length-1]===p&&H[H.length-2]===p):(H[H.length-1]===p||(n>=4&&H[H.length-2]===p));
  const c=all.filter(p=>!bad(p));const want=pick(c.length?c:all);
  if(want!==k)[arr[k],arr[want]]=[arr[want],arr[k]];H.push(want);if(H.length>6)H.shift();return arr}

/* ---------- новые животные: картинки (если нет фото со слайдов), голоса, еда */
Object.assign(ONO,{слон:'Ту-ру-ру!',лев:'Р-р-р!',сова:'Ух-ух!',кукушка:'Ку-ку!',индюк:'Бал-бал-бал!',обезьяна:'У-а-а!',пчела:'Ж-ж-ж!',голубь:'Гуль-гуль!',цыплёнок:'Пи-пи-пи!',попугай:'Привет!'});
ONO_L=Object.keys(ONO).map(n=>({n,o:ONO[n],i:picOf(n)})).filter(x=>x.i&&hasSnd(x.n));
Object.assign(D.foods,{bread:{i:P24('bread'),acc:'хлеб'},milk:{i:P24('milk'),acc:'молоко'},watermelon:{i:P24('watermelon'),acc:'арбуз'},
  bug:{i:P24('bug'),acc:'жучка'},leafy:{i:P24('leafy'),acc:'листик'},pear:{i:P24('pear'),acc:'грушу'},strawberry:{i:P24('strawberry'),acc:'клубнику'}});
[['корова','корове','hay','cow'],['коза','козе','cabbage','goat'],['свинья','свинке','corn','pig'],['утка','уточке','bread','duck'],['обезьяна','обезьянке','banana','monkey'],
 ['слон','слону','watermelon','elephant'],['кролик','кролику','carrot','rabbit'],['овца','овечке','grass','ewe'],['петух','петушку','grain','rooster'],['лягушка','лягушке','bug','frog'],
 ['пингвин','пингвину','fish','penguin'],['тигр','тигру','meat','tiger'],['жираф','жирафу','leafy','giraffe'],['попугай','попугаю','pear','parrot'],['котёнок','котёнку','milk','cat'],
 ['ослик','ослику','hay','donkey'],['лев','льву','meat','lion'],['индюк','индюку','grain','turkey']]
  .forEach(([n,dat,f,k])=>{if(!D.animals.some(a=>a.n===n))D.animals.push({n,dat,f,i:picOf(n)||P24(k),snd:ONO[n]||'',v24:1})});
/* в «Покорми»: два зверя на экране всегда едят разное */
function twoDiff(L){for(let t=0;t<30;t++){const p=shuffle(L).slice(0,2);if(p.length<2||p[0].f!==p[1].f)return p}return shuffle(L).slice(0,2)}
/* «Скажи — и будет»: все животные с настоящим голосом */
function v24init(){VG_ANI=ONO_L.map(x=>[x.n,x.o,'Скажи: '+x.o.toLowerCase().replace(/!$/,'')+'!']);
  if(!VG_NAMES.includes('want'))VG_NAMES.push('want','ani','want');VG_RU.want='Хочу…'}

/* ---------- «ХОЧУ»: карточки доски (картинки) */
window.WBPIC24={хлеб:P24('bread'),палочки:P24('chopsticks'),пельмени:'fd_pelmeni',оладьи:'fd_oladi',гулять:P24('walk'),бассейн:P24('pool'),магазин:P24('cart'),
  пианино:P24('piano'),мультик:P24('tv'),сок:P24('juice'),шорты:P24('shorts'),мишка:P24('teddy'),молоко:P24('milk'),горка:P24('slide')};
function mig24(){
  if((S.ver||0)>=24)return;
  if(S.wb&&Array.isArray(S.wb.cards)){const L=S.wb.cards;
    for(let k=L.length-1;k>=0;k--)if(['мяч','мишка'].includes(L[k].w))L.splice(k,1);
    L.forEach(c=>{if(c.w==='телевизор'||/мультик/i.test(c.t)){c.t='Включи мультик!';c.w='мультик'}
      if(c.t==='Дай банан!')c.t='Хочу банан!';if(c.t==='Дай яблоко!')c.t='Хочу яблоко!';if(c.w==='дерево'&&/гулять/i.test(c.t))c.w='гулять'});
    WB_START.forEach(([t,w],k)=>{if(!L.some(c=>c.w===w))L.push({id:'v24_'+k,t,w})});
    const order=WB_START.map(x=>x[1]);L.sort((a,b)=>{const i=order.indexOf(a.w),j=order.indexOf(b.w);return (i<0?99:i)-(j<0?99:j)});
    S.wb.n=12}
  S.lvl.want=1;S.streak.want=0;S.lvl.pg=1;S.pzL=S.pzL||{};S.pzL.pg=0;S.lvl.ib=1;S.lvl.world=Math.min(S.lvl.world||1,3);S.lvl.not=S.lvl.not||1;
  S.pz.ready=true;S.pz.placed=[];S.pz.k=0;S.pz.ph=[];S.ver=24;save()}

/* ---------- «Я ХОЧУ»: голос просит («Хочу мишку!»), Лев находит и даёт */
const WANT24=[
  {n:'мишку',i:P24('teddy'),r:'На мишку!'},{n:'банан',i:P24('banana'),r:'На банан!'},{n:'хлеб',i:P24('bread'),r:'На хлеб!'},{n:'шорты',i:P24('shorts'),r:'На шорты!'},
  {n:'яблоко',i:P24('apple'),r:'На яблоко!'},{n:'сок',i:P24('juice'),r:'На сок!'},{n:'пельмени',i:'fd_pelmeni',r:'На пельмени!'},{n:'оладьи',i:'fd_oladi',r:'На оладьи!'},
  {n:'палочки',i:P24('chopsticks'),r:'На палочки!'},{n:'мяч',i:P24('ball'),r:'На мяч!'},{n:'машинку',i:P24('car'),r:'На машинку!'},{n:'молоко',i:P24('milk'),r:'На молоко!'},
  {n:'в бассейн',i:P24('pool'),r:'Пойдём в бассейн!',go:1},{n:'в магазин',i:P24('cart'),r:'Пойдём в магазин!',go:1},{n:'гулять',i:P24('walk'),r:'Пойдём гулять!',go:1},
  {n:'на горку',i:P24('slide'),r:'Пойдём на горку!',go:1},{n:'пианино',ph:'Включи пианино!',i:P24('piano'),r:'Включаю пианино!',go:1},{n:'мультик',ph:'Включи мультик!',i:P24('tv'),r:'Включаю мультик!',go:1}];
const wph=x=>x.ph||'Хочу '+x.n+'!';
async function wantRound(lvl){
  const n=lvl===1?2:lvl===2?3:lvl===3?4:6;
  /* бассейн, магазин, гулять — часто */
  const pool=rmode('wantgo',5)<2?WANT24.filter(x=>x.go):WANT24.filter(x=>!x.go);
  const t=fresh(()=>pick(pool),x=>'w'+x.n);const others=shuffle(WANT24.filter(x=>x!==t)).slice(0,n-1);
  const q=wph(t);if(!await ask(q,q))return;
  const ok=await choice([t].concat(others).map(x=>({html:img(x.i),ok:x===t,key:x.n})),{question:q,goodText:t.r,sayit:q.replace(/!$/,'')});
  return roundDone(ok,{n:t.n})}

/* ---------- «Скажи — и будет»: «Хочу банан!» — подарок открывается */
const VGW=WANT24.filter(x=>['банан','хлеб','яблоко','мишку','сок','пельмени','в бассейн','в магазин','гулять','машинку','мультик'].includes(x.n));
const GIFT_SVG='<svg viewBox="0 0 120 120"><rect x="14" y="48" width="92" height="64" rx="8" fill="#ff6b5b"/><rect x="52" y="48" width="16" height="64" fill="#ffc93c"/><g class="lid"><rect x="8" y="32" width="104" height="22" rx="6" fill="#ff8a7d"/><rect x="52" y="32" width="16" height="22" fill="#ffd95c"/><path d="M60 32q-26-30-30-8t30 8q26-30 30-8t-30 8z" fill="#ffc93c" stroke="#e0a800" stroke-width="3"/></g></svg>';
function vgWant(el,sc,meter){const x=pick(VGW);const ph=wph(x);
  el.innerHTML=`${meter()}<div class="vwant"><div class="vitem">${img(x.i)}</div><div class="vgift">${GIFT_SVG}</div></div><div class="cap">${ph}</div>`;
  const g=el.querySelector('.vgift'),it=el.querySelector('.vitem');const wig=()=>{g.classList.remove('wig');void g.offsetWidth;g.classList.add('wig')};
  return Object.assign(sc,{q:'Скажи: '+ph.toLowerCase(),hint:'Скажи: '+ph.toLowerCase(),who:x.n,start:wig,call:wig,
    async win(){g.classList.add('open');it.classList.add('show');tone(660,0,.12,'triangle',.12);tone(880,.12,.18,'triangle',.12);await wait(700);await say(x.r)}})}

/* ---------- «Повторяй за Шариком»: все ряды логопеда по кругу (ни один не пропускается) */
function dogDeck(pool,t){S.dogDk=S.dogDk||{};const key='t'+t;let d=(S.dogDk[key]||[]).filter(s=>pool.some(r=>r.w.join()===s));
  if(!d.length){d=shuffle(pool.map(r=>r.w.join()));if(G&&G.lastDog&&d[d.length-1]===G.lastDog&&d.length>1)[d[0],d[d.length-1]]=[d[d.length-1],d[0]]}
  const s=d.pop();S.dogDk[key]=d;save();if(G)G.lastDog=s;return pool.find(r=>r.w.join()===s)}

/* ---------- ЦИФРЫ: вместо точек — предметы (одинаковые на всём задании) */
function numObj(){const L=NUMOBJ.filter(x=>RPIC[x]);if(!G)return pick(RPIC[pick(L)]);if(!G.round.numPic)G.round.numPic=pick(RPIC[pick(L)]);return G.round.numPic}

/* ---------- ПОВТОРИ!: посмотрел 5 секунд — запомнил — перенёс картинки на пустые места (всё в ряд) */
async function seqRound(lvl){
  const R=G.round;const len=Math.min(5,2+lvl);
  const names=shuffle(Object.keys(RPIC).filter(n=>!['дом','холодильник','шкаф','стол'].includes(n)));const items=names.slice(0,len).map(n=>({n,i:pick(RPIC[n])}));
  if(!await ask('Запомни!','Смотри и запомни!'))return;
  const st=$('#stage');st.innerHTML=`<div class="sq sq24"><div class="seqbar"><i style="animation-duration:5s"></i></div><div class="sq-row"></div><p class="sq-note"></p></div>`;
  const area=st.querySelector('.sq-row'),bar=st.querySelector('.seqbar'),note=st.querySelector('.sq-note');
  const W=area.clientWidth,H=area.clientHeight,gap=10,cs=Math.min((W-gap*(len-1))/len,H*.42,170),x0=(W-(cs*len+gap*(len-1)))/2;
  const yS=(H/2-cs)/2,yT=H/2+(H/2-cs)/2;const sx=p=>x0+p*(cs+gap);
  const slots=items.map((_,p)=>{const s=document.createElement('div');s.className='sq-slot';Object.assign(s.style,{left:sx(p)+'px',top:yS+'px',width:cs+'px',height:cs+'px'});s.innerHTML=`<b>${p+1}</b>`;area.append(s);return s});
  const els=items.map((x,k)=>{const el=document.createElement('div');el.className='sq-c';el.innerHTML=wimg(x);Object.assign(el.style,{width:cs+'px',height:cs+'px',top:yS+'px',left:sx(k)+'px'});area.append(el);return el});
  await wait(5000);if(R.dead)return;bar.style.visibility='hidden';
  /* картинки уходят вниз, в другом порядке */
  let order;do{order=shuffle(items.map((_,k)=>k))}while(len>1&&order.every((v,k)=>v===k));
  const home=it=>({x:sx(order.indexOf(it)),y:yT});
  els.forEach((el,it)=>{el.classList.add('mov2');const h=home(it);el.style.left=h.x+'px';el.style.top=h.y+'px'});slots.forEach(s=>s.classList.add('empty'));
  await wait(450);if(R.dead)return;els.forEach(el=>el.classList.remove('mov2'));
  setPrompt('Повтори!');await say('Теперь поставь картинки по порядку!');if(R.dead)return;note.textContent='Перетащи картинку на пустое место';
  let wrong=0,left=len,busy=false;const placed=new Array(len).fill(false);const miss=new Array(len).fill(0);
  R.replay=async()=>{if(busy)return;busy=true;const gh=items.map((x,p)=>{if(placed[p])return null;const g=document.createElement('div');g.className='sq-ghost';g.innerHTML=wimg(x);Object.assign(g.style,{left:sx(p)+'px',top:yS+'px',width:cs+'px',height:cs+'px'});area.append(g);return g});
    await wait(2500);gh.forEach(g=>g&&g.remove());busy=false};
  await new Promise(res=>{els.forEach((el,it)=>{let s=null;
    el.onpointerdown=e=>{if(busy||el.classList.contains('lock'))return;e.preventDefault();ac();try{el.setPointerCapture(e.pointerId)}catch(_){}s={x:e.clientX,y:e.clientY,l:parseFloat(el.style.left),t:parseFloat(el.style.top)};el.classList.add('drag');sfx.click();slots.forEach(x=>x.classList.remove('hint'))};
    el.onpointermove=e=>{if(!s)return;el.style.left=(s.l+e.clientX-s.x)+'px';el.style.top=(s.t+e.clientY-s.y)+'px'};
    el.onpointerup=el.onpointercancel=async e=>{if(!s)return;const moved=Math.hypot(e.clientX-s.x,e.clientY-s.y);s=null;el.classList.remove('drag');
      const back=()=>{el.classList.add('mov2');const h=home(it);el.style.left=h.x+'px';el.style.top=h.y+'px';setTimeout(()=>el.classList.remove('mov2'),300)};
      if(moved<8){back();tts(items[it].n);return}
      const cx=parseFloat(el.style.left)+cs/2,cy=parseFloat(el.style.top)+cs/2;
      const p=slots.findIndex((_,q)=>!placed[q]&&Math.abs(cx-(sx(q)+cs/2))<cs*.62&&Math.abs(cy-(yS+cs/2))<cs*.75);
      if(p<0){back();return}
      if(p===it){placed[p]=true;el.classList.add('lock','mov2');el.style.left=sx(p)+'px';el.style.top=yS+'px';slots[p].classList.remove('empty');sfx.good();tts(items[it].n);
        if(--left===0)setTimeout(res,450);return}
      wrong++;G.round.wrong++;miss[it]++;slots[p].classList.remove('bad');void slots[p].offsetWidth;slots[p].classList.add('bad');tone(220,0,.18,'sine',.12);back();
      if(miss[it]>=2)slots[it].classList.add('hint')}})});
  if(R.dead||!G)return;els.forEach(el=>el.classList.add('ok'));note.textContent='';
  sfx.up();confetti(120);R.good=items.map(x=>x.n).join(', ')+'.';await say(pick(PRAISE)+' Всё правильно!');await wait(500);
  return roundDone(wrong<=1,{m:'длина '+len,n:len,w:wrong})}

/* ---------- ИДЁТ, БЕЖИТ, СТОИТ, СИДИТ */
const IBS=(()=>{const D2a=D2.actions||[];const out=[];
  const subs=[...new Set(D2a.filter(a=>a.v==='стоит').map(a=>a.s))];
  subs.forEach(s=>{const g=v=>(D2a.find(a=>a.s===s&&a.v===v)||{}).i;const run=(D.actions.find(a=>a.s===s&&a.v==='бежит'&&!a.o)||{}).i;
    const x={s,стоит:g('стоит'),сидит:g('сидит'),идёт:g('идёт'),бежит:run};if(x.стоит&&x.сидит)out.push(x)});return out})();
const IB_S={бобр:'бобр',медведь:'медведь',мышь:'мышка',крот:'крот',кабан:'кабан',волк:'волк',зубр:'зубр',ёж:'ёжик',рысь:'рысь',лось:'лось',белка:'белка',заяц:'зайчик',олень:'олень',енот:'енот',барсук:'барсук'};
async function ibRound(lvl){
  const mode=lvl===1?'ib':lvl===2?'ss':lvl===3?['ib','ss3','ss3'][rmode('ib3',3)]:['all','all','ss3'][rmode('ib4',3)];
  if(mode==='ib'||!IBS.length){let opts;
    const subs=[...new Set(D.anims.filter(a=>a.s&&a.v==='идёт').map(a=>a.s))].filter(s=>D.anims.some(a=>a.s===s&&a.v==='бежит'));
    if(subs.length&&Math.random()<.5){const s=fresh(()=>pick(subs),x=>'ibA'+x);const A=v=>{const a=pick(D.anims.filter(x=>x.s===s&&x.v===v));return{i:a.a,s,v}};opts=[A('идёт'),A('бежит')]}
    else{const P=D2.pairs.filter(p=>p.set==='ib');const pr=fresh(()=>pick(P),x=>x.a[0].i+x.a[1].i);opts=pr.a}
    const ok=await twoQ(opts,['идёт','бежит'],'ibq');if(ok===null)return;return roundDone(ok,{v:'идёт/бежит',n:opts[0].s})}
  const pool=mode==='all'?IBS.filter(x=>x.идёт&&x.бежит):mode==='ss3'?IBS.filter(x=>x.идёт):IBS;
  const x=fresh(()=>pick(pool.length?pool:IBS),y=>'ib'+mode+y.s);const nm=IB_S[x.s]||x.s;
  const verbs=mode==='ss'?['стоит','сидит']:mode==='ss3'?['стоит','сидит','идёт']:['стоит','сидит','идёт','бежит'];
  const opts=verbs.filter(v=>x[v]).map(v=>({i:x[v],s:nm,v}));
  const ask2=mode==='ss'?verbs:shuffle(verbs.filter(v=>x[v])).slice(0,2);
  const ok=await twoQ(opts,ask2,'ibq'+mode);if(ok===null)return;
  return roundDone(ok,{v:verbs.join('/'),n:nm})}

/* ---------- «ЧТО НЕ…?»: «Кто не собака?», «Что не мяч?», «Что не красного цвета?» */
const NOT_ANI=['белка','волк','ёж','заяц','лиса','медведь','мышь','тигр','корова','собака','енот','барсук'];
const notPics=n=>[...new Set(D.actions.filter(a=>a.s===n).map(a=>a.i).concat((D2.actions||[]).filter(a=>a.s===n).map(a=>a.i)))].filter(i=>IMG[i]);
const NOT_OBJ=[...new Set(D3.cobj.map(o=>o.n))].filter(n=>D3.cobj.filter(o=>o.n===n).length>=3&&!['звезда'].includes(n));
const NOT_COL={red:'красного',green:'зелёного',blue:'синего',yellow:'жёлтого',pink:'розового',white:'белого'};
const NOT_NOM={ёж:'ёжик',мышь:'мышка',заяц:'зайчик'};
async function notRound(lvl){
  const n=lvl===1?2:lvl===4?4:3;const kinds=lvl>=3?['ani','obj','col']:['ani','obj'];const kind=kinds[rmode('notk',kinds.length)];
  let same=[],other,q,good;
  if(kind==='ani'){const L=NOT_ANI.filter(a=>notPics(a).length>=n-1);const a=fresh(()=>pick(L),x=>'na'+x);same=shuffle(notPics(a)).slice(0,n-1);
    const b=pick(L.filter(x=>x!==a));other=pick(notPics(b));const A=NOT_NOM[a]||a,B=NOT_NOM[b]||b;q='Кто не '+A+'?';good='Это '+B+'. Не '+A+'!'}
  else if(kind==='obj'){const o=fresh(()=>pick(NOT_OBJ),x=>'no'+x);same=shuffle(D3.cobj.filter(x=>x.n===o)).slice(0,n-1).map(x=>x.i);
    const b=pick(D3.cobj.filter(x=>x.n!==o&&!['облако','солнце','звезда'].includes(x.n)));other=b.i;q='Что не '+o+'?';good='Это '+b.n+'. Не '+o+'!'}
  else{const c=fresh(()=>pick(Object.keys(NOT_COL).filter(c=>D.colors.filter(x=>x.c===c).length>=n)),x=>'nc'+x);const sm=shuffle(D.colors.filter(x=>x.c===c)).slice(0,n-1);same=sm.map(x=>x.i);
    const b=pick(D.colors.filter(x=>x.c!==c&&!sm.some(y=>y.o===x.o)));other=b.i;q='Что не '+NOT_COL[c]+' цвета?';good=cap(b.o)+' — не '+NOT_COL[c]+' цвета!'}
  if(!await ask(q))return;
  const ok=await choice([{html:img(other),ok:true,key:'not'}].concat(same.map((i,k)=>({html:img(i),ok:false,key:'same'+k}))),{question:q,goodText:good});
  return roundDone(ok,{m:kind,n:q})}

/* ---------- «ЧТО ЭТО?» (вместе с «Мир вокруг»): много тем, много карточек */
const W24T=(()=>{const T={};const add=(t,n,i)=>{if(!i||!IMG[i]&&!/^img/.test(i))return;const m=T[t]=T[t]||{};(m[n]=m[n]||[]).includes(i)||m[n].push(i)};
  Object.entries(WTOP).forEach(([t,o])=>{if(t==='all')return;o.w.forEach(n=>(RPIC[n]||[]).forEach(i=>add(t,n,i)))});
  const map={nature:'nature',home:'home',clothes:'clothes',fruit:'food',veg:'food',toys:'toys',animals:'animals'};
  Object.entries(W9).forEach(([k,L])=>{const t=map[k];if(t)L.forEach(x=>add(t,x.n,x.i))});
  D.animals.forEach(a=>{if(!['мальчик','девочка'].includes(a.n)&&!a.v24)add('animals',a.n,a.i)});
  ['слон','лев','обезьяна','жираф','зебра','пингвин','попугай','сова','верблюд'].forEach(n=>{if(!(T.animals||{})[n])add('animals',n,(window.ANIPIC||{})[n])});
  const out={};Object.entries(T).forEach(([t,m])=>out[t]=Object.entries(m).map(([n,is])=>({n,is})));out.all=Object.values(out).flat();return out})();
const W24N={animals:'Животные',nature:'Природа',home:'Дом',clothes:'Одежда',food:'Еда',transport:'Транспорт',toys:'Игрушки',all:'Всё вместе'};
const W24SIM={home:[['кружка','ложка','тарелка','вилка','кастрюля','чашка','чайник','сковородка','миска','стакан'],['стул','стол','шкаф','диван','холодильник','кровать']],
  food:[['яблоко','банан','слива','груша','мандарин','виноград','клубника','арбуз','вишня','лимон','ананас'],['перец','помидор','капуста','кукуруза','морковка','огурец','картошка','лук','баклажан','чеснок','брокколи']],
  clothes:[['шапка','кепка'],['футболка','платье','куртка','джинсы','шорты','трусы'],['носки','кроссовки','ботинки','шлёпанцы']],
  animals:[['собака','кошка','корова','свинья','лошадь','курица','утка','гусь','коза','овца'],['лиса','волк','медведь','заяц','зайчик','ёж','белка','мышь','мышка'],['лев','тигр','слон','обезьяна','жираф','зебра']]};
function topicPick24(){return new Promise(res=>{const st=$('#stage');setPrompt('Что будем учить?');
  const ts=['animals','food','home','clothes','toys','nature','transport','all'].filter(t=>W24T[t]&&W24T[t].length>=4);
  st.innerHTML=`<div class="topics">${ts.map(t=>{const L=W24T[t];const ic=L.find(x=>['собака','яблоко','стул','футболка','мяч','дерево','машина'].includes(x.n))||L[0];return `<button class="opt topic" data-t="${t}">${img(ic.is[0])}<b>${W24N[t]}</b></button>`}).join('')}</div>`;
  say('Что будем учить?');st.querySelectorAll('.topic').forEach(b=>b.onclick=()=>{ac();sfx.click();stopVoice();res(b.dataset.t)})})}
async function worldRound(lvl){
  const R=G.round;if(!G.topic){G.topic=await topicPick24();if(!G||G.round!==R)return}
  const L=W24T[G.topic]||W24T.all;const t=fresh(()=>pick(L),x=>x.n);const ti=pick(t.is);
  if(lvl>=4&&rmode('wq',3)===2){const q='Что это?';setPrompt(q);$('#stage').innerHTML=`<div class="solo"><div class="pic">${img(ti)}</div></div>`;R.replay=()=>say(q);
    await say(q);if(R.dead)return;await wait(2500);if(R.dead)return;R.good='Это '+t.n+'.';await say('Это '+t.n+'!');if(R.dead)return;
    if(S.sayit!=='off')await sayIt(cap(t.n),img(ti));return roundDone(true,{n:t.n,m:'назови',x:1})}
  const n=Math.min([0,2,4,6,6,9][lvl]||4,L.length);let others;
  if(lvl===4){const grp=(W24SIM[G.topic]||[]).find(g=>g.includes(t.n))||[];others=shuffle(L.filter(x=>x!==t&&grp.includes(x.n))).slice(0,n-1);
    if(others.length<n-1)others=others.concat(shuffle(L.filter(x=>x!==t&&!others.includes(x))).slice(0,n-1-others.length))}
  else others=shuffle(L.filter(x=>x!==t)).slice(0,n-1);
  const q='Где '+t.n+'?';if(!await ask(q))return;
  const ok=await choice([{html:img(ti),ok:true,key:t.n}].concat(others.map(x=>({html:img(pick(x.is)),ok:false,key:x.n}))),{question:q,goodText:'Это '+t.n+'.',sayit:cap(t.n)});
  return roundDone(ok,{n:t.n,m:G.topic})}

/* ---------- НАГРАДА: настоящий пазл из 10 кусочков (фото), каждый третий раз — лабиринт */
const PZP=window.PZPHOTOS||[];const PZ_W=1000,PZ_H=600,PZ_C=5,PZ_R=2;
const pieceSvg24=(p,href,uid,m,stroke)=>`<svg viewBox="${p.x0-m} ${p.y0-m} ${p.w+2*m} ${p.h+2*m}"><defs><clipPath id="${uid}"><path d="${p.d}"/></clipPath></defs><image href="${href}" x="0" y="0" width="${PZ_W}" height="${PZ_H}" clip-path="url(#${uid})" preserveAspectRatio="none"/>${stroke?`<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>`:''}</svg>`;
function pzCur(){const k=(S.pz.k||0)%Math.max(1,PZP.length);return{k,ph:PZP[k]||{f:'',n:''},pieces:jigsaw(PZ_C,PZ_R,PZ_W,PZ_H,2400+(S.pz.k||0))}}
function openReward(kind){if(kind==='maze'||(!kind&&S.pz.maze))return openMaze();if(S.pz.ready||kind==='puzzle')return openPuzzle();return openAlbum()}
function finish(){VM.stop();if(S.tipOn)TIP=chooseTip();show('finish');const okc=G.results.filter(Boolean).length;const great=okc>=(G.max||S.rounds)-1;$('#finish-title').textContent=great?'Молодец!':'Хорошо позанимались!';
  S.rwN=(S.rwN||0)+1;const maze=S.rwN%3===0;if(maze)S.pz.maze=true;else S.pz.ready=true;save();G.reward=maze?'maze':'puzzle';
  $('#earned').innerHTML=maze?`<div class="rw24">${MZ_ICON}<span>Лабиринт</span></div>`:`<div class="rw24"><svg viewBox="0 0 100 100"><path d="${PIECE_D}" fill="#3cbf7a"/></svg><span>Пазл из 10 кусочков</span></div>`;
  const b=$('#btn-to-puz');b.hidden=false;b.textContent=maze?'Пройти лабиринт!':'Собрать пазл!';b.onclick=()=>{ac();openReward(maze?'maze':'puzzle')};
  sfx.up();confetti(160,innerWidth/2,innerHeight/3);say((great?'Молодец! Ты всё сделал!':'Хорошо позанимались!')+(maze?' Держи лабиринт!':' Держи пазл!'))}
function pzLayout(){const scr=$('#puz'),board=$('#pz-board'),tray=$('#pz-tray');tray.hidden=false;scr.classList.remove('mz');
  const land=innerWidth>innerHeight;const Bw=Math.floor(land?Math.min(innerWidth*.6,(innerHeight-110)*PZ_W/PZ_H):Math.min(innerWidth-32,innerHeight*.4*PZ_W/PZ_H));
  board.style.width=Bw+'px';board.style.height=Math.round(Bw*PZ_H/PZ_W)+'px';return Bw/PZ_W}
async function openPuzzle(){
  stopVoice();show('puz');const scr=$('#puz'),board=$('#pz-board'),tray=$('#pz-tray');scr.querySelectorAll('.pc,.pz-done,.mz-hero').forEach(e=>e.remove());
  $('#puz .prompt').textContent='Собери пазл!';const s=pzLayout();const {k,ph,pieces}=pzCur();const href=ph.f;const m=.22*Math.max(PZ_W/PZ_C,PZ_H/PZ_R);
  board.innerHTML=`<svg class="ghost" viewBox="0 0 ${PZ_W} ${PZ_H}"><image href="${href}" width="${PZ_W}" height="${PZ_H}" opacity=".16"/>${pieces.map((p,j)=>`<path data-slot="${j}" d="${p.d}" fill="#ffffff44" stroke="#9fb9cc" stroke-width="3" stroke-dasharray="8 6"/>`).join('')}</svg>`;tray.innerHTML='';
  if(!S.pz.ready){tray.innerHTML='<div class="pz-empty">Новый пазл — после занятия!<br>Поиграй, и будет пазл.</div>';say('Новый пазл — после занятия!');return}
  const sr=()=>scr.getBoundingClientRect(),br=()=>board.getBoundingClientRect();
  const target=j=>{const p=pieces[j],b=br(),o=sr();return{x:b.left-o.left+(p.x0-m)*s,y:b.top-o.top+(p.y0-m)*s}};
  const mk=(j,placed)=>{const p=pieces[j],el=document.createElement('div');el.className='pc'+(placed?' placed':'');el.dataset.j=j;
    el.style.width=(p.w+2*m)*s+'px';el.style.height=(p.h+2*m)*s+'px';el.innerHTML=pieceSvg24(p,href,'pz24_'+j+'_'+k,m,!placed);scr.append(el);return el};
  S.pz.placed=(S.pz.placed||[]).filter(j=>j<pieces.length);
  S.pz.placed.forEach(j=>{const el=mk(j,true),t=target(j);el.style.left=t.x+'px';el.style.top=t.y+'px'});
  const left=shuffle(pieces.map((_,j)=>j).filter(j=>!S.pz.placed.includes(j)));if(!left.length){pzDone();return}
  const tr=tray.getBoundingClientRect(),o=sr();const n=left.length;const pw=(PZ_W/PZ_C+2*m)*s,phh=(PZ_H/PZ_R+2*m)*s;
  let cols=1,ts=0;for(let c=1;c<=n;c++){const rr=Math.ceil(n/c),t=Math.min(1,.96*(tr.width/c)/pw,.96*(tr.height/rr)/phh);if(t>ts){ts=t;cols=c}}const rows=Math.ceil(n/cols);
  left.forEach((j,q)=>{const el=mk(j,false);const cx=tr.left-o.left+(q%cols+.5)*tr.width/cols,cy=tr.top-o.top+(Math.floor(q/cols)+.5)*tr.height/rows;
    const home={x:cx-pw*ts/2,y:cy-phh*ts/2};el.style.left=home.x+'px';el.style.top=home.y+'px';el.style.transformOrigin='0 0';el.style.transform=`scale(${ts})`;
    let drag=null,fails=0;
    el.onpointerdown=e=>{if(el.classList.contains('placed'))return;e.preventDefault();el.setPointerCapture(e.pointerId);el.classList.remove('back');el.classList.add('drag');el.style.transform='';ac();sfx.click();
      const r=sr();drag={ox:pw/2,oy:phh/2,sx:e.clientX,sy:e.clientY};el.style.left=(e.clientX-r.left-drag.ox)+'px';el.style.top=(e.clientY-r.top-drag.oy)+'px'};
    el.onpointermove=e=>{if(!drag)return;const r=sr();el.style.left=(e.clientX-r.left-drag.ox)+'px';el.style.top=(e.clientY-r.top-drag.oy)+'px'};
    el.onpointerup=el.onpointercancel=async e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy);drag=null;el.classList.remove('drag');
      const t=target(j),x=parseFloat(el.style.left),y=parseFloat(el.style.top);
      if(Math.hypot(x-t.x,y-t.y)<PZ_W/PZ_C*s*.4){el.classList.add('snap','placed');el.style.left=t.x+'px';el.style.top=t.y+'px';el.innerHTML=pieceSvg24(pieces[j],href,'pz24_'+j+'_'+k,m,false);
        sfx.chomp();S.pz.placed.push(j);save();board.querySelector(`[data-slot="${j}"]`)?.classList.remove('slot-hint');
        if(S.pz.placed.length===pieces.length){await wait(400);pzDone()}}
      else{fails++;el.classList.add('back');el.style.left=home.x+'px';el.style.top=home.y+'px';el.style.transform=`scale(${ts})`;
        if(moved<10||fails>=2){const sl=board.querySelector(`[data-slot="${j}"]`);if(sl){sl.classList.add('slot-hint');sl.setAttribute('fill','#ffc93c88')}}
        if(moved>=10)tone(300,0,.12,'sine',.1)}}});
  if(!S.pz.placed.length)say('Собери пазл! Перетащи кусочки.')}
async function pzDone(){const {k,ph}=pzCur();const scr=$('#puz'),board=$('#pz-board');stopVoice();
  board.insertAdjacentHTML('beforeend',`<img src="${ph.f}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:6;border-radius:12px;animation:pop2 .6s">`);
  scr.querySelectorAll('.pc').forEach(e=>e.remove());sfx.up();confetti(180);
  S.pz.ph=S.pz.ph||[];if(!S.pz.ph.includes(k))S.pz.ph.push(k);S.pz.k=(S.pz.k||0)+1;S.pz.placed=[];S.pz.ready=false;save();
  $('#pz-tray').innerHTML=`<div class="pz-empty"><b style="font-size:28px">${cap(ph.n)}!</b></div>`;
  await say('Ура! Пазл собран! '+cap(ph.n)+'!');if(ph.a&&hasSnd(ph.a))await animalSound({n:ph.a})}
function openAlbum(){stopVoice();show('album');const L=(S.pz.ph||[]).filter(k=>PZP[k]);const wrap=$('#big-wrap');
  const Wp=Math.min(innerWidth-32,(innerHeight-(innerWidth>innerHeight?120:300))*PZ_W/PZ_H);wrap.style.width=Wp+'px';wrap.style.height=Wp*PZ_H/PZ_W+'px';
  const showBig=k=>{wrap.innerHTML=`<img src="${PZP[k].f}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:16px">`};
  $('#album-title').textContent=L.length?'Мои пазлы: '+L.length:'Мои пазлы';
  if(L.length)showBig(L[L.length-1]);else wrap.innerHTML='<div class="pz-empty">Собирай пазлы — и здесь будут картинки!</div>';
  $('#stickers').innerHTML=L.slice().reverse().map(k=>`<button class="stk ph" data-k="${k}"><img src="${PZP[k].f}" alt="${PZP[k].n}"></button>`).join('');
  document.querySelectorAll('#stickers .stk').forEach(b=>b.onclick=()=>{ac();const k=+b.dataset.k;showBig(k);say(cap(PZP[k].n)+'!').then(()=>{if(PZP[k].a&&hasSnd(PZP[k].a))animalSound({n:PZP[k].a})})});
  $('#album-puz').style.visibility=S.pz.ready||S.pz.maze?'visible':'hidden';
  if(!L.length)say('Собирай пазлы — и здесь будут картинки!')}
function renderPzHome(){$('#pz-icon').innerHTML=`<path d="${PIECE_D}" fill="#3cbf7a"/><circle cx="50" cy="50" r="12" fill="#fff"/>`;const n=(S.pz.ph||[]).length;
  $('#pz-sub').textContent=S.pz.maze?'лабиринт ждёт!':S.pz.ready?'новый пазл!':'собрано: '+n;$('#pz-badge').textContent=S.pz.ready||S.pz.maze?'!':''}

/* ---------- ЛАБИРИНТ: проведи пальцем героя к угощению */
const MZ_ICON='<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="12" fill="#fff" stroke="#7b61ff" stroke-width="6"/><path d="M28 6v40h22M72 94V54H50M28 70h22v24M72 30H50V6" stroke="#7b61ff" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="7" fill="#ff6b5b"/><circle cx="84" cy="84" r="7" fill="#3cbf7a"/></svg>';
const MZ_HERO=[['dog','bone','Шарик','косточку'],['mouse','cheese','Мышка','сыр'],['rabbit','carrot','Зайка','морковку'],['monkey','banana','Обезьянка','банан'],['bear','honey','Мишка','мёд'],['cat','fish','Котик','рыбку']];
function mazeGen(c,r,seed){const R=rng(seed);const W=[];for(let y=0;y<r;y++){W[y]=[];for(let x=0;x<c;x++)W[y][x]={n:1,e:1,s:1,w:1}}
  const seen=new Set(['0,0']);const st=[[0,0]];const D4=[[0,-1,'n','s'],[1,0,'e','w'],[0,1,'s','n'],[-1,0,'w','e']];
  while(st.length){const [x,y]=st[st.length-1];const nb=D4.filter(([dx,dy])=>x+dx>=0&&x+dx<c&&y+dy>=0&&y+dy<r&&!seen.has((x+dx)+','+(y+dy)));
    if(!nb.length){st.pop();continue}const [dx,dy,a,b]=nb[Math.floor(R()*nb.length)];W[y][x][a]=0;W[y+dy][x+dx][b]=0;seen.add((x+dx)+','+(y+dy));st.push([x+dx,y+dy])}
  return W}
function openMaze(){
  stopVoice();show('puz');const scr=$('#puz'),board=$('#pz-board'),tray=$('#pz-tray');scr.querySelectorAll('.pc,.pz-done,.mz-hero').forEach(e=>e.remove());tray.hidden=true;scr.classList.add('mz');
  const N=S.mzN||0;const c=Math.min(8,4+Math.floor(N/2)),r=c;const seed=7000+N;const Wm=mazeGen(c,r,seed);const [hk,gk,hn,gn]=MZ_HERO[N%MZ_HERO.length];
  $('#puz .prompt').textContent=hn+' — к угощению!';
  const B=Math.floor(Math.min(innerWidth-32,innerHeight-130));board.style.width=board.style.height=B+'px';const cs=B/c;
  let walls='';for(let y=0;y<r;y++)for(let x=0;x<c;x++){const w=Wm[y][x],X=x*cs,Y=y*cs;
    if(w.n)walls+=`M${X} ${Y}h${cs}`;if(w.w)walls+=`M${X} ${Y}v${cs}`;if(y===r-1&&w.s)walls+=`M${X} ${Y+cs}h${cs}`;if(x===c-1&&w.e)walls+=`M${X+cs} ${Y}v${cs}`}
  board.innerHTML=`<svg class="mz" viewBox="0 0 ${B} ${B}"><rect width="${B}" height="${B}" rx="14" fill="#fffdf4"/><path class="trail" d="" fill="none" stroke="#ffc93c" stroke-width="${cs*.32}" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/><path d="${walls}" stroke="#7b61ff" stroke-width="${Math.max(4,cs*.1)}" stroke-linecap="round" fill="none"/></svg><img class="mz-goal" src="${I24(gk)}" alt="" style="left:${(c-1)*cs+cs*.1}px;top:${(r-1)*cs+cs*.1}px;width:${cs*.8}px;height:${cs*.8}px"><img class="mz-hero" src="${I24(hk)}" alt="">`;
  const hero=board.querySelector('.mz-hero'),trail=board.querySelector('.trail');board._mz={Wm,c,r,cs};let cur=[0,0],path=[[0,0]],done=false;
  const put=()=>{Object.assign(hero.style,{left:cur[0]*cs+cs*.08+'px',top:cur[1]*cs+cs*.08+'px',width:cs*.84+'px',height:cs*.84+'px'});trail.setAttribute('d','M'+path.map(([x,y])=>`${x*cs+cs/2} ${y*cs+cs/2}`).join('L'))};put();
  const open=(x,y,dx,dy)=>{const w=Wm[y][x];return dx===1?!w.e:dx===-1?!w.w:dy===1?!w.s:!w.n};
  const step=(tx,ty)=>{let moved=false;for(let g=0;g<c*r&&!(cur[0]===tx&&cur[1]===ty);g++){const [x,y]=cur;const ddx=Math.sign(tx-x),ddy=Math.sign(ty-y);
      const tries=Math.abs(tx-x)>=Math.abs(ty-y)?[[ddx,0],[0,ddy]]:[[0,ddy],[ddx,0]];const mv=tries.find(([dx,dy])=>(dx||dy)&&open(x,y,dx,dy));if(!mv)break;
      cur=[x+mv[0],y+mv[1]];const pi=path.findIndex(p=>p[0]===cur[0]&&p[1]===cur[1]);if(pi>=0)path=path.slice(0,pi+1);else path.push(cur.slice());moved=true}
    if(moved){put();tone(520+path.length*12,0,.06,'triangle',.08)}
    if(!done&&cur[0]===c-1&&cur[1]===r-1)win()};
  let dragging=false;const cell=e=>{const b=board.getBoundingClientRect();return[Math.max(0,Math.min(c-1,Math.floor((e.clientX-b.left)/cs))),Math.max(0,Math.min(r-1,Math.floor((e.clientY-b.top)/cs)))]};
  board.onpointerdown=e=>{if(done)return;const [x,y]=cell(e);if(Math.abs(x-cur[0])+Math.abs(y-cur[1])>1){hero.classList.remove('call');void hero.offsetWidth;hero.classList.add('call');return}
    e.preventDefault();ac();dragging=true;try{board.setPointerCapture(e.pointerId)}catch(_){}step(x,y)};
  board.onpointermove=e=>{if(!dragging||done)return;const [x,y]=cell(e);step(x,y)};
  board.onpointerup=board.onpointercancel=()=>{dragging=false};
  async function win(){done=true;hero.classList.add('happy');sfx.up();confetti(160);S.pz.maze=false;S.mzN=N+1;save();await say('Ура! '+hn+' нашёл '+gn+'!');}
  say(N===0?'Лабиринт! Веди пальцем '+(hn==='Шарик'?'Шарика':hn.toLowerCase())+' к '+(gk==='bone'?'косточке':'угощению')+'!':'Проведи пальцем по дорожке!')}
