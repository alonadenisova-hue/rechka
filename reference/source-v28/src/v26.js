/* ===================== v26: бонус-шарики каждые 5 заданий, цифры на картинках (дерево, аквариум, поезд), понятные звуки животных ===================== */

/* ---------- только понятные животные со звуком (без лисы, волка, тигра, енота) */
const ONO_SKIP=['лиса','волк','тигр','енот','сова','индюк'];
ONO_L=ONO_L.filter(x=>!ONO_SKIP.includes(x.n));

/* ---------- БОНУС: 7 секунд лопаем шарики, из них сыплются конфеты, снежинки, звёзды */
const BONUS_FX=[['🍬','🍭','🍬','🍫'],['❄','❅','❆','❄'],['⭐','✨','🌟','⭐'],['🍓','🍎','🍌','🍒'],['💖','💜','💛','💚']];
async function bonusPop(){
  const R=G&&G.round;const ov=document.createElement('div');ov.className='bonus';
  ov.innerHTML=`<div class="bn-top"><b>Бонус!</b><span class="bn-cnt">0</span></div><div class="bn-time"><i></i></div><div class="bn-sky"></div>`;document.body.append(ov);
  const sky=ov.querySelector('.bn-sky'),cnt=ov.querySelector('.bn-cnt');let got=0,done=false;
  sfx.up();await say('Бонус! Лопай шарики!');if(!G)return ov.remove();
  ov.querySelector('.bn-time i').style.animation='bnt 7s linear forwards';
  const cols=['#ef4a3d','#2f8be0','#45b649','#ffcf26','#ff8fbf','#9b6bff','#ff9f43','#2ec4b6'];
  const spawn=()=>{if(done)return;const c=pick(cols);const b=document.createElement('button');b.className='balloon bn';b.style.left=(4+Math.random()*80)+'%';
    b.style.animationDuration=(3.6+Math.random()*2)+'s, '+(1.6+Math.random())+'s';b.innerHTML=balloonSvg(c);
    b.onpointerdown=e=>{if(b._p||done)return;b._p=1;ac();const r=b.getBoundingClientRect();sfx.pop();b.remove();got++;cnt.textContent=got;cnt.classList.remove('up');void cnt.offsetWidth;cnt.classList.add('up');
      const set=pick(BONUS_FX);for(let i=0;i<9;i++){const p=document.createElement('span');p.className='bn-fx';p.textContent=pick(set);
        p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/3)+'px';p.style.setProperty('--dx',(Math.random()*160-80)+'px');p.style.setProperty('--dy',(160+Math.random()*260)+'px');p.style.setProperty('--r',(Math.random()*720-360)+'deg');
        p.style.animationDuration=(1+Math.random()*.8)+'s';ov.append(p);setTimeout(()=>p.remove(),2000)}
      tone(880+got*30,0,.08,'triangle',.1)};
    b.addEventListener('animationend',ev=>{if(ev.animationName==='rise')b.remove()});sky.append(b)};
  for(let k=0;k<5;k++)setTimeout(spawn,k*200);const iv=setInterval(spawn,420);
  await wait(7000);done=true;clearInterval(iv);sky.querySelectorAll('.balloon').forEach(x=>x.classList.add('away'));
  confetti(120);await say(got?'Ура! '+got+' '+(got%10===1&&got%100!==11?'шарик':[2,3,4].includes(got%10)&&![12,13,14].includes(got%100)?'шарика':'шариков')+'!':'Ура!');
  ov.classList.add('out');await wait(450);ov.remove()}

/* ---------- ЦИФРЫ на красивой картинке: яблоки на дереве, рыбки в аквариуме, вагончики поезда */
const SC_TREE=`<svg class="scn" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="tsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e8f7ff"/></linearGradient></defs><rect width="100" height="100" fill="url(#tsk)"/>
  <circle cx="88" cy="12" r="7" fill="#ffd34d"/><g fill="#fff" opacity=".9"><ellipse cx="18" cy="12" rx="9" ry="3.5"/><ellipse cx="24" cy="10" rx="6" ry="3.5"/></g>
  <path d="M0 86Q30 80 60 86T100 84V100H0z" fill="#7cc95f"/><path d="M45 92 47 52h6l2 40z" fill="#8a5a2b"/><path d="M50 62 38 50M50 58l12-10" stroke="#8a5a2b" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="50" cy="34" r="28" fill="#3f9e4d"/><circle cx="30" cy="42" r="17" fill="#4fae55"/><circle cx="70" cy="42" r="17" fill="#4fae55"/><circle cx="40" cy="20" r="15" fill="#5fbf5f"/><circle cx="62" cy="20" r="15" fill="#5fbf5f"/><circle cx="50" cy="48" r="14" fill="#4fae55"/></svg>`;
const SC_AQUA=`<svg class="scn" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="aq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd6f5"/><stop offset="1" stop-color="#1f86c7"/></linearGradient></defs><rect width="100" height="100" fill="url(#aq)"/>
  <path d="M0 8Q10 5 20 8T40 8T60 8T80 8T100 8" stroke="#ffffff88" stroke-width="1.2" fill="none"/><path d="M0 90Q20 84 40 90T80 88T100 90V100H0z" fill="#f3d9a4"/>
  <path d="M10 92q-4-14 2-26q-6 12-2 26M16 92q4-18-2-32M84 92q-4-16 3-30M90 92q2-12-3-22" stroke="#2fa35a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="62" cy="91" rx="6" ry="3" fill="#c79b6b"/><ellipse cx="30" cy="93" rx="4" ry="2" fill="#e9a3b8"/></svg>`;
const SC_RAIL=`<svg class="scn" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7e0ff"/><stop offset="1" stop-color="#f0fbff"/></linearGradient></defs><rect width="100" height="100" fill="url(#rs)"/>
  <circle cx="14" cy="14" r="7" fill="#ffd34d"/><path d="M0 52Q20 36 40 50T80 44T100 48V100H0z" fill="#9ddc7c"/><path d="M0 64Q30 54 60 64T100 60V100H0z" fill="#7cc95f"/>
  <rect x="0" y="80" width="100" height="2.5" fill="#8a6a4a"/><rect x="0" y="86" width="100" height="2.5" fill="#8a6a4a"/>${Array.from({length:21},(_,k)=>`<rect x="${k*5}" y="79" width="2" height="11" fill="#a07850"/>`).join('')}</svg>`;
const FISH=(c,d)=>`<svg viewBox="0 0 120 70"><path d="M100 35 L120 15 L118 55Z" fill="${shadeHex(c,-20)}"/><ellipse cx="55" cy="35" rx="48" ry="30" fill="${c}"/><path d="M40 8q12-10 26 0" fill="${shadeHex(c,-15)}"/><circle cx="24" cy="28" r="6" fill="#fff"/><circle cx="22" cy="28" r="3" fill="#24324a"/><path d="M12 42q6 4 12 0" stroke="#24324a" stroke-width="2" fill="none"/></svg><b class="fd" style="-webkit-text-stroke:2px ${shadeHex(c,-35)}">${d}</b>`;
const APPLE=(d)=>`<svg viewBox="0 0 60 64"><path d="M30 12q2-9 9-11" stroke="#6b4a2a" stroke-width="3" fill="none"/><path d="M33 8q10-6 16 2q-8 4-16-2z" fill="#4fae55"/><path d="M30 14C18 6 4 14 5 32c1 18 14 30 25 28 11 2 24-10 25-28C56 14 42 6 30 14z" fill="#e23b3b"/><ellipse cx="18" cy="24" rx="4" ry="7" fill="#fff" opacity=".45"/><text x="30" y="47" text-anchor="middle" font-size="28" font-weight="700" fill="#fff" font-family="Balsamiq Sans,sans-serif">${d}</text></svg>`;
const WAGON=(c,d,first)=>`<svg viewBox="0 0 90 70">${first?`<rect x="4" y="10" width="44" height="42" rx="6" fill="#ef4a3d"/><rect x="48" y="26" width="38" height="26" rx="5" fill="#ef4a3d"/><rect x="58" y="6" width="12" height="22" fill="#24324a"/><rect x="12" y="18" width="26" height="18" rx="4" fill="#bfe8ff"/>`:`<rect x="6" y="14" width="78" height="38" rx="7" fill="${c}"/><rect x="2" y="10" width="86" height="8" rx="4" fill="${shadeHex(c,-25)}"/><text x="45" y="47" text-anchor="middle" font-size="34" font-weight="700" fill="#fff" font-family="Balsamiq Sans,sans-serif" stroke="${shadeHex(c,-40)}" stroke-width="2" paint-order="stroke">${d}</text>`}<circle cx="22" cy="56" r="9" fill="#24324a"/><circle cx="68" cy="56" r="9" fill="#24324a"/><circle cx="22" cy="56" r="3.5" fill="#ccc"/><circle cx="68" cy="56" r="3.5" fill="#ccc"/></svg>`;
async function numFindAll(n,L){
  const R=G.round;const kind=['tree','aqua','train'][rmode('nscene',3)];const others=L.pool.filter(x=>x!==n);
  const cnt=L.pool.length>3?3:3,total=kind==='tree'?8:kind==='aqua'?7:8;
  const items=shuffle(Array(cnt).fill(n).concat(Array.from({length:total-cnt},()=>pick(others))));
  const where={tree:'на дереве',aqua:'в аквариуме',train:'в поезде'}[kind];
  const q='Найди все цифры '+NUMW[n]+'!';if(!await ask(q,'Цифры '+NUMW[n]+' спрятались '+where+'! Найди все!'))return;$('#prompt').innerHTML=`Найди все <span class="digit sm">${n}</span>`;
  const st=$('#stage');let body='';
  if(kind==='tree'){const spots=shuffle([[30,22],[50,12],[68,22],[22,40],[40,34],[60,36],[78,40],[50,50],[34,52],[66,54]]);
    body=SC_TREE+items.map((d,k)=>`<button class="ni apple" data-d="${d}" style="left:${spots[k][0]}%;top:${spots[k][1]}%;--d:${k*60}ms">${APPLE(d)}</button>`).join('')}
  else if(kind==='aqua'){const ys=shuffle([16,26,36,46,56,66,74]);const cs=['#ff9f43','#ff6b9e','#ffd23f','#7b61ff','#2ec4b6','#ef4a3d','#5aa9ff'];
    body=SC_AQUA+items.map((d,k)=>`<button class="ni fish" data-d="${d}" style="top:${ys[k%ys.length]}%;--sw:${(5+Math.random()*4).toFixed(1)}s;--dl:-${(Math.random()*6).toFixed(1)}s">${FISH(cs[k%cs.length],d)}</button>`).join('')+'<i class="bub b1"></i><i class="bub b2"></i><i class="bub b3"></i>'}
  else{const cs=['#2f8be0','#45b649','#ffb020','#9b6bff','#ff6b9e','#2ec4b6'];
    body=SC_RAIL+`<div class="trainrow"><div class="train">${`<span class="wg loco">${WAGON('#ef4a3d',0,true)}</span>`+items.map((d,k)=>`<button class="ni wg" data-d="${d}">${WAGON(cs[k%cs.length],d)}</button>`).join('')}</div></div>`}
  st.innerHTML=`<div class="nscene sc-${kind}">${body}<div class="nf-left">${'<i></i>'.repeat(cnt)}</div></div>`;
  let got=0,wrong=0;await new Promise(res=>{st.querySelectorAll('.ni').forEach(b=>b.onclick=()=>{if(b._ok)return;ac();
    if(+b.dataset.d===n){b._ok=1;b.classList.add('found');st.querySelectorAll('.nf-left i')[got].classList.add('on');got++;sfx.snap();tts(cap(NUMW[n]));if(got>=cnt)setTimeout(res,600)}
    else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');tone(220,0,.18,'sine',.12);tts('Это '+NUMW[+b.dataset.d])}})});
  if(R.dead||!G)return;sfx.good();confetti(90);R.good='Все цифры '+NUMW[n]+'!';await say(pick(PRAISE)+' Ты нашёл все цифры '+NUMW[n]+'!');
  return roundDone(wrong<=1,{m:'найди все: '+kind,n})}
