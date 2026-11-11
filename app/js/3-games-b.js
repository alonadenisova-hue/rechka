/* «Речка»: игры версий 20–26 (головоломки, цифры, «Хочу», пазл, «Повторяй за Шариком», бонусы).
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* ===================== v20: головоломки «Час пик», «Пингвины на льдине», «Мостик для мышки» ===================== */
const PZ=window.PZLV||{rh:[],pg:[],br:[]};if(window.PG24&&window.PG24.length)PZ.pg=window.PG24;
/* общая оболочка: уровни подряд, счётчик ходов, ‹ ›, подсказка-лампочка, «сначала», звёздочка за уровень, кубок в конце */
async function pzShell(key,cfg){
  const R=G.round;const L=PZ[key]||[];if(!L.length)return roundDone(true,{});
  S.pzL=S.pzL||{};const li=Math.min(S.pzL[key]||0,L.length-1);const lv=L[li];
  const first=!(S.pzSeen||{})[key];S.pzSeen=Object.assign(S.pzSeen||{},{[key]:1});save();
  if(!await ask('Уровень '+(li+1),first?cfg.intro:'Уровень '+(li+1)+'. '+cfg.again))return;
  setPrompt('Уровень '+(li+1)+' из '+L.length);
  const sg=$('#stage');sg.innerHTML=`<div class="dg pzg ${key}"><div class="dgbar"><button class="dgb dgprev" aria-label="Назад">‹</button><span class="dgsteps"></span><button class="dgb dgnext" aria-label="Вперёд">›</button><span class="dgbones"><img src="${IMG.pz_star}" alt=""><b>${S.stars||0}</b></span><button class="dgb dghint" aria-label="Подсказка"><img src="${IMG.dg_bulb}" alt=""></button><button class="dgb dgreset" aria-label="Сначала"><img src="${IMG.dg_reset}" alt=""></button></div><div class="dgboard pzb"></div></div>`;
  const wrap=sg.firstChild,area=wrap.querySelector('.pzb');let steps=0,done=false,hints=0,resolveWin;const winP=new Promise(r=>resolveWin=r);
  const ctx={area,lv,R,
    setSteps(n){steps=n;wrap.querySelector('.dgsteps').textContent=cfg.word+': '+n+(lv.m?' · можно за '+lv.m:'')},
    get steps(){return steps},
    win(){if(done)return;done=true;resolveWin()},
    get done(){return done},
    pulseReset(on){wrap.querySelector('.dgreset').classList.toggle('pulse',on!==false)},
    arrow(x,y,s,deg){const a=document.createElement('div');a.className='dgarrow';Object.assign(a.style,{left:x-s/2+'px',top:y-s/2+'px',width:s+'px',height:s+'px',transform:`rotate(${deg}deg)`});
      a.innerHTML='<svg viewBox="0 0 40 40"><path d="M4 15h20V6l14 14-14 14v-9H4z" fill="#ff6b5b" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';area.firstChild.append(a);setTimeout(()=>a.remove(),2600)}};
  const api=cfg.mount(ctx);ctx.setSteps(0);R.pz=api;
  wrap.querySelector('.dgreset').onclick=()=>{if(done)return;ac();sfx.click();ctx.pulseReset(false);api.reset();ctx.setSteps(0);say('Начнём сначала!')};
  wrap.querySelector('.dghint').onclick=()=>{if(done)return;ac();hints++;api.hint()};
  const go=k=>{ac();sfx.click();S.pzL[key]=Math.max(0,Math.min(L.length-1,li+k));save();R.dead=true;G.round={wrong:0,lvl:1,tStart:Date.now()};pzShell(key,cfg)};
  wrap.querySelector('.dgprev').onclick=()=>go(-1);wrap.querySelector('.dgnext').onclick=()=>go(1);
  await winP;if(R.dead||!G)return;
  sfx.up();confetti(160);S.stars=(S.stars||0)+1;const last=li+1>=L.length;S.pzL[key]=last?Math.floor(L.length/2):li+1;save();
  const pr=document.createElement('div');pr.className='dgprize';pr.innerHTML=`<img src="${IMG[last?'dg_trophy':'pz_star']}" alt=""><b>${last?'Ты чемпион!':'+1'}</b>`;wrap.append(pr);
  wrap.querySelector('.dgbones b').textContent=S.stars;
  await say(pick(PRAISE)+' '+cfg.winSay+' '+(last?'Ты прошёл все уровни! Держи кубок!':'Держи звёздочку!'));await wait(last?2500:1200);
  return roundDone(true,{n:li+1,steps,m:lv.m,hints})}
function pzSquare(area,n,padK=.05){const W=area.clientWidth,H=area.clientHeight;const size=Math.min(W,H)*.97;const pad=size*padK,cs=(size-2*pad)/n;
  const b=document.createElement('div');b.className='pztray';Object.assign(b.style,{width:size+'px',height:size+'px'});area.append(b);return{b,size,pad,cs}}

/* ---------- «Час пик»: выведи красную машинку. Машинки ездят только вперёд-назад */
const RH_N=6,RH_EX=2;const RH_COL=['#2f8be0','#ffb020','#3cbf7a','#a066e0','#ff7ab6','#22b7c4','#8a6a4a','#5c6bc0','#f2711c','#7cb342','#ec407a','#26a69a'];
function rhCarSvg(len,col,red){const w=len*100,h=100;return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="6" y="10" width="${w-12}" height="80" rx="22" fill="${col}" stroke="#0003" stroke-width="3"/>
  <rect x="${w-58}" y="20" width="26" height="60" rx="8" fill="#dff1fb" opacity=".95"/><rect x="${len>2?70:30}" y="20" width="22" height="60" rx="8" fill="#dff1fb" opacity=".8"/>
  ${len>2?`<rect x="110" y="18" width="${w-190}" height="64" rx="10" fill="#fff" opacity=".25"/>`:''}<rect x="${w-14}" y="22" width="6" height="14" rx="2" fill="#ffe57a"/><rect x="${w-14}" y="64" width="6" height="14" rx="2" fill="#ffe57a"/>${red?'<circle cx="50" cy="50" r="13" fill="#fff" opacity=".9"/><text x="50" y="58" font-size="22" text-anchor="middle" font-weight="900" fill="#e53935" font-family="sans-serif">★</text>':''}</svg>`}
function rhGrid(vs){const g=Array.from({length:RH_N},()=>Array(RH_N).fill(-1));vs.forEach(([r,c,l,h],i)=>{for(let k=0;k<l;k++){const rr=h?r:r+k,cc=h?c+k:c;g[rr][cc]=i}});return g}
function rhRange(vs,i){const g=rhGrid(vs);const [r,c,l,h]=vs[i];let lo=0,hi=0;
  if(h){while(c+lo-1>=0&&g[r][c+lo-1]===-1)lo--;while(c+l+hi<RH_N&&g[r][c+l+hi]===-1)hi++}else{while(r+lo-1>=0&&g[r+lo-1][c]===-1)lo--;while(r+l+hi<RH_N&&g[r+l+hi][c]===-1)hi++}
  return[lo,hi]}
function rhSolve(vs0,limit=80000){const key=v=>v.map(x=>x[0]+','+x[1]).join(';');const win=v=>v[0][1]+v[0][2]===RH_N;
  if(win(vs0))return{first:null,d:0};const q=[[vs0,null,0]];const seen=new Set([key(vs0)]);let h=0;
  while(h<q.length&&seen.size<limit){const [v,f,d]=q[h++];
    for(let i=0;i<v.length;i++){const [lo,hi]=rhRange(v,i);for(let k=lo;k<=hi;k++){if(!k)continue;const n=v.map(x=>x.slice());if(n[i][3])n[i][1]+=k;else n[i][0]+=k;const kk=key(n);if(seen.has(kk))continue;seen.add(kk);
      const ff=f||{i,k};if(win(n))return{first:ff,d:d+1};q.push([n,ff,d+1])}}}
  return null}
async function rhRound(){return pzShell('rh',{word:'Ходы',intro:'Помоги красной машинке выехать! Двигай машинки пальцем. Они ездят только вперёд и назад.',again:'Выведи красную машинку!',winSay:'Красная машинка выехала!',
  mount(ctx){const lv=ctx.lv;const {b,pad,cs}=pzSquare(ctx.area,RH_N);b.classList.add('rh');let vs=lv.v.map(x=>x.slice());
    for(let r=0;r<RH_N;r++)for(let c=0;c<RH_N;c++){const d=document.createElement('div');d.className='rhcell';Object.assign(d.style,{left:pad+c*cs+'px',top:pad+r*cs+'px',width:cs+'px',height:cs+'px'});b.append(d)}
    const ex=document.createElement('div');ex.className='rhexit';Object.assign(ex.style,{left:pad+RH_N*cs-2+'px',top:pad+RH_EX*cs+'px',width:pad+4+'px',height:cs+'px'});ex.innerHTML=`<img src="${IMG.pz_flag}" alt="">`;b.append(ex);
    const els=vs.map(([r,c,l,h],i)=>{const e=document.createElement('div');e.className='rhcar'+(i===0?' red':'');const w=(h?l:1)*cs,hh=(h?1:l)*cs;e.style.padding=cs*.06+'px';
      Object.assign(e.style,{width:w+'px',height:hh+'px'});e.innerHTML=`<div class="rhbody" style="${h?'':`width:${hh-cs*.12}px;height:${w-cs*.12}px;transform:rotate(90deg) translateY(-100%);transform-origin:0 0;`}">${rhCarSvg(l,i===0?'#e53935':RH_COL[(i-1)%RH_COL.length],i===0)}</div>`;b.append(e);return e});
    const pos=(i,anim=true)=>{const [r,c]=vs[i];els[i].style.transition=anim?'left .15s,top .15s':'none';els[i].style.left=pad+c*cs+'px';els[i].style.top=pad+r*cs+'px'};
    const all=()=>vs.forEach((_,i)=>pos(i,false));all();
    els.forEach((e,i)=>{let d=null;
      e.onpointerdown=ev=>{if(ctx.done)return;ev.preventDefault();ac();e.setPointerCapture(ev.pointerId);b.querySelectorAll('.hint').forEach(x=>x.classList.remove('hint'));const [lo,hi]=rhRange(vs,i);d={x:ev.clientX,y:ev.clientY,lo,hi};e.classList.add('drag');e.style.transition='none'};
      e.onpointermove=ev=>{if(!d)return;const [r,c,l,h]=vs[i];let dd=(h?ev.clientX-d.x:ev.clientY-d.y)/cs;dd=Math.max(d.lo,Math.min(d.hi,dd));d.dd=dd;
        if(h)e.style.left=pad+(c+dd)*cs+'px';else e.style.top=pad+(r+dd)*cs+'px'};
      e.onpointerup=e.onpointercancel=async()=>{if(!d)return;const k=Math.round(d.dd||0);d=null;e.classList.remove('drag');
        if(k){if(vs[i][3])vs[i][1]+=k;else vs[i][0]+=k;ctx.setSteps(ctx.steps+1);tone(500,0,.06,'triangle',.1)}pos(i);
        if(i===0&&vs[0][1]+vs[0][2]===RH_N){await wait(160);e.style.transition='left .7s ease-in';e.style.left=pad+(RH_N+1)*cs+'px';tone(300,0,.5,'sawtooth',.06);await wait(650);ctx.win()}}});
    return{t:{get vs(){return vs},els,cs},reset(){vs=lv.v.map(x=>x.slice());all()},
      hint(){const s=rhSolve(vs);if(!s){ctx.pulseReset();say('Так не получится. Начнём сначала!');return}if(!s.first)return;const {i,k}=s.first;els[i].classList.add('hint');
        const [r,c,l,h]=vs[i];const cx=pad+(c+(h?l/2:.5))*cs,cy=pad+(r+(h?.5:l/2))*cs;ctx.arrow(cx+(h?Math.sign(k)*cs*.2:0),cy+(h?0:Math.sign(k)*cs*.2),cs*.75,h?(k>0?0:180):(k>0?90:-90));
        say(i===0?'Двигай красную машинку!':'Подвинь эту машинку '+(h?(k>0?'вправо':'влево'):(k>0?'вниз':'вверх'))+'!')}}}})}

/* ---------- «Пингвины на льдине»: пингвин скользит, пока не упрётся. Приведи пингвина с шарфиком к рыбке */
const PG_N=5;
function pgSlide(ps,rocks,i,dr,dc){let [r,c]=ps[i];const occ=new Set(ps.map(p=>p[0]*PG_N+p[1]).concat(rocks.map(p=>p[0]*PG_N+p[1])));
  while(r+dr>=0&&r+dr<PG_N&&c+dc>=0&&c+dc<PG_N&&!occ.has((r+dr)*PG_N+c+dc)){r+=dr;c+=dc}return[r,c]}
function pgSolve(ps0,lv,limit=60000){const key=v=>v.map(p=>p.join(',')).join(';');const q=[[ps0,null,0]];const seen=new Set([key(ps0)]);let h=0;
  while(h<q.length&&seen.size<limit){const [ps,f,d]=q[h++];
    for(let i=0;i<ps.length;i++)for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){const np=pgSlide(ps,lv.rocks,i,dr,dc);if(np[0]===ps[i][0]&&np[1]===ps[i][1])continue;
      const n=ps.map(p=>p.slice());n[i]=np;const k=key(n);if(seen.has(k))continue;seen.add(k);const ff=f||{i,dr,dc};
      if(i===0&&np[0]===lv.fish[0]&&np[1]===lv.fish[1])return{first:ff,d:d+1};q.push([n,ff,d+1])}}
  return null}
/* ---------- «Мостик для мышки»: поставь кубики, ступеньки и длинный брусок, чтобы мышка дошла до сыра (вид сбоку, детали падают вниз) */
const BR_H=5;
function brState(lv,pl){const t=lv.t.slice(),s=lv.t.map(()=>null),cells=[];
  for(const p of pl){if(p.type==='br'){const h=Math.max(t[p.c],t[p.c+1]);cells.push({...p,row:h});t[p.c]=t[p.c+1]=h+1;s[p.c]=s[p.c+1]=null}
    else{cells.push({...p,row:t[p.c]});t[p.c]+=1;s[p.c]=p.type==='cube'?null:p.type[1]}}
  return{t,s,cells}}
function brCanPlace(lv,st,type,c){const W=lv.t.length;if(c<=0||c>=W-1)return false;if(type==='br'){if(c+1>=W-1)return false;return Math.max(st.t[c],st.t[c+1])+1<=BR_H}return st.t[c]+1<=BR_H}
function brPath(t,s,a,b){const prev={[a]:-1},st=[a];while(st.length){const x=st.shift();if(x===b){const p=[];for(let y=b;y!==-1;y=prev[y])p.unshift(y);return p}
    for(const d of [-1,1]){const y=x+d;if(y<0||y>=t.length||y in prev||t[y]<=0)continue;
      if(t[y]===t[x]||(t[y]===t[x]+1&&s[y]===(d===1?'R':'L'))||(t[y]===t[x]-1&&s[x]===(d===1?'L':'R'))){prev[y]=x;st.push(y)}}}return null}
function brSolve(lv,pl,rem){const W=lv.t.length;const st=brState(lv,pl);if(brPath(st.t,st.s,0,W-1))return[];
  for(let i=0;i<rem.length;i++){if(rem.indexOf(rem[i])<i)continue;for(let c=1;c<W-1;c++){if(!brCanPlace(lv,st,rem[i],c))continue;const r=brSolve(lv,pl.concat([{type:rem[i],c}]),rem.filter((_,k)=>k!==i));if(r)return[{type:rem[i],c}].concat(r)}}
  return null}
const BR_SVG={cube:`<svg viewBox="0 0 40 40"><rect x="1.5" y="1.5" width="37" height="37" rx="5" fill="#e0a35a" stroke="#9c6233" stroke-width="3"/><path d="M6 6l28 28M34 6L6 34" stroke="#b97a3d" stroke-width="3"/></svg>`,
  sR:`<svg viewBox="0 0 40 40"><path d="M1.5 38.5V27h13V14h12V1.5h12v37z" fill="#ffcf5a" stroke="#c99a1f" stroke-width="3" stroke-linejoin="round"/></svg>`,
  sL:`<svg viewBox="0 0 40 40"><path d="M38.5 38.5V27h-13V14h-12V1.5h-12v37z" fill="#ffcf5a" stroke="#c99a1f" stroke-width="3" stroke-linejoin="round"/></svg>`,
  br:`<svg viewBox="0 0 80 40" preserveAspectRatio="none"><rect x="1.5" y="1.5" width="77" height="37" rx="5" fill="#c98a4b" stroke="#8a5a2b" stroke-width="3"/><path d="M8 14h64M8 27h64" stroke="#a46d36" stroke-width="2.5"/></svg>`};
const BR_NAME={cube:'кубик',sR:'ступеньки',sL:'ступеньки',br:'длинный брусок'};
async function brRound(){return pzShell('br',{word:'Детали',intro:'Мышка хочет сыр! Построй дорожку. Тащи кубики и ступеньки пальцем. Мышка не умеет прыгать, а по ступенькам может подняться.',again:'Построй мышке дорожку к сыру!',winSay:'Мышка добралась до сыра!',
  mount(ctx){const lv=ctx.lv;const W=lv.t.length;const A=ctx.area;const AW=A.clientWidth,AH=A.clientHeight;
    const rows=Math.min(BR_H,Math.max(...lv.t)+lv.inv.length)+1.3;const cs=Math.min(AW*.96/W,AH*.7/(rows+.6),130);const sw=cs*W,sh=cs*(rows+.6);
    const b=document.createElement('div');b.className='pztray brscene';Object.assign(b.style,{width:sw+'px',height:sh+'px'});A.append(b);
    const tray=document.createElement('div');tray.className='brtray';A.append(tray);
    const gy=sh-cs*.6; // уровень земли (низ ряда 0)
    const at=(c,row,w=1)=>({left:c*cs+'px',top:gy-(row+1)*cs+'px',width:w*cs+'px',height:cs+'px'});
    const terr=document.createElement('div');b.append(terr);const layer=document.createElement('div');b.append(layer);
    lv.t.forEach((h,c)=>{if(!h){const w=document.createElement('div');w.className='brwater';Object.assign(w.style,{left:c*cs+'px',top:gy-cs*.55+'px',width:cs+'px',height:cs*1.15+'px'});terr.append(w)}
      for(let r=0;r<h;r++){const d=document.createElement('div');d.className='brground'+(r===h-1?' top':'');Object.assign(d.style,at(c,r));terr.append(d)}});
    const base=document.createElement('div');base.className='brbase';Object.assign(base.style,{left:0,top:gy+'px',width:sw+'px',height:sh-gy+'px'});terr.append(base);
    const mouse=document.createElement('img');mouse.className='brmouse';mouse.src=IMG.pz_mouse;const cheese=document.createElement('img');cheese.className='brcheese';cheese.src=IMG.pz_cheese;b.append(mouse,cheese);
    let pl=[],inv=lv.inv.map((type,id)=>({type,id}));
    const standAt=(el,c,t,k=.8)=>Object.assign(el.style,{left:c*cs+cs*(1-k)/2+'px',top:gy-t*cs-cs*k+'px',width:cs*k+'px',height:cs*k+'px'});
    const render=()=>{const st=brState(lv,pl);layer.innerHTML='';
      st.cells.forEach((p,k)=>{const d=document.createElement('div');d.className='brpiece';Object.assign(d.style,at(p.c,p.row,p.type==='br'?2:1));d.innerHTML=BR_SVG[p.type];
        const topOk=p.type==='br'?(st.t[p.c]===p.row+1&&st.t[p.c+1]===p.row+1):st.t[p.c]===p.row+1;
        if(topOk&&!ctx.done){d.classList.add('can');d.onclick=()=>{ac();sfx.click();pl.splice(k,1);inv.push({type:p.type,id:p.id});ctx.setSteps(ctx.steps+1);render()}}layer.append(d)});
      standAt(mouse,0,st.t[0]);standAt(cheese,W-1,st.t[W-1],.7);
      tray.innerHTML='';inv.forEach(it=>{const d=document.createElement('div');d.className='brinv'+(it.type==='br'?' wide':'');d.innerHTML=BR_SVG[it.type];d.dataset.id=it.id;
        Object.assign(d.style,{width:(it.type==='br'?2:1)*cs*.8+'px',height:cs*.8+'px'});tray.append(d);drag(d,it)});
      return st};
    const check=async()=>{const st=brState(lv,pl);const path=brPath(st.t,st.s,0,W-1);if(path){ctx.done||0;for(const c of path.slice(1)){mouse.style.transition='left .35s,top .35s';standAt(mouse,c,st.t[c]);await wait(380)}
        cheese.classList.add('eaten');await wait(400);ctx.win();return}
      if(!inv.length){sfx.bad();ctx.pulseReset();await say('Дорожка не получилась. Нажми на деталь, чтобы убрать её, или начни сначала.')}};
    function drag(d,it){let g=null;
      d.onpointerdown=ev=>{if(ctx.done)return;ev.preventDefault();ac();d.setPointerCapture(ev.pointerId);const r=d.getBoundingClientRect();g={dx:ev.clientX-r.left,dy:ev.clientY-r.top};d.classList.add('drag');
        Object.assign(d.style,{position:'fixed',left:r.left+'px',top:r.top+'px',zIndex:50})};
      d.onpointermove=ev=>{if(!g)return;d.style.left=ev.clientX-g.dx+'px';d.style.top=ev.clientY-g.dy+'px';
        const br=b.getBoundingClientRect();const c=Math.floor((ev.clientX-g.dx+cs*.4-br.left)/cs);b.querySelectorAll('.brcol').forEach(x=>x.remove());
        const st=brState(lv,pl);if(ev.clientY<br.bottom&&brCanPlace(lv,st,it.type,c)){const h=document.createElement('div');h.className='brcol';Object.assign(h.style,{left:c*cs+'px',top:0,width:(it.type==='br'?2:1)*cs+'px',height:gy+'px'});b.append(h)}};
      d.onpointerup=d.onpointercancel=ev=>{if(!g)return;b.querySelectorAll('.brcol').forEach(x=>x.remove());const br=b.getBoundingClientRect();const c=Math.floor((ev.clientX-g.dx+cs*.4-br.left)/cs);g=null;
        const st=brState(lv,pl);
        if(ev.clientY<br.bottom&&brCanPlace(lv,st,it.type,c)){pl.push({type:it.type,c,id:it.id});inv=inv.filter(x=>x!==it);ctx.setSteps(ctx.steps+1);tone(330,0,.1,'triangle',.15);render();
          const nd=layer.lastChild;if(nd){nd.classList.add('fall')}check()}
        else{render();if(ev.clientY<br.bottom)say(c<=0||c>=W-1?'Сюда нельзя — тут мышка или сыр.':'Сюда не помещается.')}}}
    render();
    return{t:{get pl(){return pl},get inv(){return inv},tray,b,cs,gy},reset(){pl=[];inv=lv.inv.map((type,id)=>({type,id}));render()},
      hint(){const s=brSolve(lv,pl.map(p=>({type:p.type,c:p.c})),inv.map(x=>x.type));
        if(!s){ctx.pulseReset();say('Так не получится. Убери деталь или начни сначала.');return}if(!s.length)return;const n=s[0];
        const el=[...tray.children].find(x=>inv.find(i=>String(i.id)===x.dataset.id).type===n.type);if(el)el.classList.add('hint');
        const st=brState(lv,pl);const top=n.type==='br'?Math.max(st.t[n.c],st.t[n.c+1]):st.t[n.c];
        const ar=document.createElement('div');ar.className='dgarrow';const x=(n.c+(n.type==='br'?1:.5))*cs,y=gy-(top+1.5)*cs;Object.assign(ar.style,{left:x-cs*.35+'px',top:y-cs*.35+'px',width:cs*.7+'px',height:cs*.7+'px',transform:'rotate(90deg)'});
        ar.innerHTML='<svg viewBox="0 0 40 40"><path d="M4 15h20V6l14 14-14 14v-9H4z" fill="#ff6b5b" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>';b.append(ar);setTimeout(()=>ar.remove(),2600);
        say('Поставь '+(n.type==='br'?'длинный брусок':BR_NAME[n.type])+' сюда!')}}}})}


/* ===================== v22: «Цифры» (точки ↔ цифра, пальчики, предметы, соедини), «Повтори!» в ряд, «Летит, едет, плывёт» с перетаскиванием, знакомая еда ===================== */
/* ---------- ЦИФРЫ */
const DOTP={1:[[50,50]],2:[[30,30],[70,70]],3:[[25,25],[50,50],[75,75]],4:[[30,30],[70,30],[30,70],[70,70]],5:[[28,28],[72,28],[50,50],[28,72],[72,72]]};
const DOTC=['#ff6b5b','#2f8be0','#3cbf7a','#7b61ff','#ffb020'];
const dotsSvg=(n,c)=>numCard(n,numObj());
const NUMLV={1:{pool:[1,2,3],k:2,modes:['dots','findall']},2:{pool:[1,2,3],k:2,modes:['dots','dig2dots','findall','peek']},3:{pool:[1,2,3],k:2,modes:['dots','count','dig2dots','fingers','hidden','peek']},
  4:{pool:[1,2,3,4,5],k:3,modes:['dots','dig2dots','findall','hidden']},5:{pool:[1,2,3,4,5],k:3,modes:['count','same','dig2dots','fingers','peek','hidden']},6:{pool:[1,2,3,4,5],k:3,modes:['match','trace','findall','trace']},
  7:{pool:[1,2,3,4,5],k:3,near:true,modes:['dots','dig2dots','same','match','fingers','findall','hidden','peek','trace']}};
function numOth(n,L,k){const pool=L.pool.filter(x=>x!==n);if(L.near){const near=pool.filter(x=>Math.abs(x-n)===1);return shuffle(near).concat(shuffle(pool.filter(x=>!near.includes(x)))).slice(0,k)}return shuffle(pool).slice(0,k)}
/* общий выбор: сверху картинка (точки / пальчики / предметы / цифра), снизу варианты */
async function numPick({q,spoken,top,n,L,opt,again,m,wide}){
  if(!await ask(q,spoken))return;
  const st=$('#stage');st.innerHTML=`<div class="numwrap"><div class="countbox${wide?' hand':''}">${top}</div><div class="grid n${L.k} numopts"></div></div>`;
  let c=0;st.querySelectorAll('.countbox img,.countbox circle').forEach(im=>im.onpointerdown=()=>{if(im.classList.contains('counted'))return;im.classList.add('counted');c++;tone(500+c*80,0,.12,'triangle',.15);tts(NUMW[c])});
  const opts=shuffle([n].concat(numOth(n,L,L.k-1)));const box=st.querySelector('.numopts');
  posFix(opts,d=>d===n);
  const ok=await new Promise(res=>{let wrong=0;opts.forEach(d=>{const b=document.createElement('button');b.className='opt';b.innerHTML=opt(d);box.append(b);
    b.onclick=async()=>{if(b._l)return;ac();if(d===n){box.querySelectorAll('.opt').forEach(x=>x._l=1);b.classList.add('good');sfx.good();confetti(60);G.round.good=cap(NUMW[n])+'!';await say(pick(PRAISE)+' '+cap(NUMW[n])+'!');res(wrong===0)}
      else{wrong++;G.round.wrong++;b.classList.remove('bad');void b.offsetWidth;b.classList.add('bad');await wait(sfx.bad());await say(again);if(wrong>=2)box.querySelectorAll('.opt').forEach((x,k)=>{if(opts[k]===n)x.classList.add('hint')})}}})});
  return roundDone(ok,{m,n})}
/* соедини: перетащить цифру на карточку с точками */
async function numMatch(L){
  const R=G.round;const ns=shuffle(L.pool).slice(0,3);const col=shuffle(DOTC.slice());
  if(!await ask('Соедини!','Найди, где столько же! Положи цифру на картинку.'))return;
  const st=$('#stage');st.innerHTML=`<div class="nmatch"><div class="nm-cards">${shuffle(ns.slice()).map((d,k)=>`<div class="nm-card" data-n="${d}">${dotsSvg(d,col[k])}</div>`).join('')}</div><div class="nm-digs">${ns.map(d=>`<div class="nm-dig" data-n="${d}">${d}</div>`).join('')}</div></div>`;
  let wrong=0,left=ns.length;
  await new Promise(res=>{st.querySelectorAll('.nm-dig').forEach(el=>{let s=null;const n=+el.dataset.n;
    el.onpointerdown=e=>{if(el.classList.contains('done'))return;e.preventDefault();ac();try{el.setPointerCapture(e.pointerId)}catch(_){}s={x:e.clientX,y:e.clientY};el.classList.add('drag');sfx.click()};
    el.onpointermove=e=>{if(!s)return;el.style.transform=`translate(${e.clientX-s.x}px,${e.clientY-s.y}px) scale(1.1)`};
    el.onpointerup=el.onpointercancel=async e=>{if(!s)return;const moved=Math.hypot(e.clientX-s.x,e.clientY-s.y);s=null;el.classList.remove('drag');el.style.transform='';
      if(moved<10){tts(NUMW[n]);return}
      const card=[...st.querySelectorAll('.nm-card')].find(c=>{const r=c.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom});
      if(!card)return;
      if(+card.dataset.n===n&&!card.classList.contains('done')){card.classList.add('done');el.classList.add('done');card.insertAdjacentHTML('beforeend',`<b class="nm-put">${n}</b>`);sfx.good();
        const r=card.getBoundingClientRect();confetti(40,r.left+r.width/2,r.top+r.height/2);tts(NUMW[n]);if(--left===0)setTimeout(res,600);return}
      wrong++;G.round.wrong++;card.classList.remove('bad');void card.offsetWidth;card.classList.add('bad');tone(220,0,.18,'sine',.12);
      if(wrong>=2)st.querySelectorAll('.nm-card').forEach(c=>c.classList.toggle('hint',+c.dataset.n===n&&!c.classList.contains('done')))}})});
  if(R.dead||!G)return;st.querySelectorAll('.hint').forEach(h=>h.classList.remove('hint'));sfx.up();confetti(100);R.good='Всё соединил!';await say(pick(PRAISE)+' Всё правильно!');
  return roundDone(wrong<=1,{m:'соедини',n:ns.join(',')})}
async function numRound(lvl){
  const L=NUMLV[lvl]||NUMLV[1];const m=L.modes[rmode('num'+lvl,L.modes.length)];const col=pick(DOTC);
  const n=fresh(()=>pick(L.pool),x=>m+x);const w=pick(NUMOBJ.filter(x=>RPIC[x]));const pic=pick(RPIC[w]);
  if(m==='findall')return numFindAll(n,L);if(m==='hidden')return numHidden(n,L);if(m==='peek')return numPeek(L);
  if(m==='match')return numMatch(L);
  if(m==='trace')return numTrace(n,pic);
  if(m==='dots')return numPick({q:'Сколько здесь?',spoken:'Посчитай! Какая цифра?',top:dotsSvg(n,col),n,L,opt:digCard,again:'Нет. Посчитай ещё раз!',m:'предметы → цифра'});
  if(m==='dig2dots'){const q='Где '+NUMW[n]+'?';const r=await numPick({q,spoken:'Цифра '+NUMW[n]+'. Где столько?',top:digCard(n),n,L,opt:d=>dotsSvg(d,col),again:'Нет. Это цифра '+NUMW[n]+'. Найди '+NUMW[n]+'!',m:'цифра → предметы'});return r}
  if(m==='fingers')return numPick({q:'Сколько пальчиков?',spoken:'Посчитай пальчики! Сколько?',top:handSvg(n),n,L,opt:digCard,again:'Нет. Посчитай пальчики!',m:'пальчики',wide:true});
  if(m==='count')return numPick({q:'Сколько здесь?',spoken:'Посчитай! Сколько здесь?',top:numCard(n,pic),n,L,opt:digCard,again:'Нет. Посчитай ещё раз!',m:'сколько'});
  /* same: цифра → карточка с предметами */
  const q='Где '+NUMW[n]+'?';if(!await ask(q,'Найди, где '+NUMW[n]+'!'))return;$('#prompt').innerHTML=`<span class="digit sm">${n}</span>`;
  const ok=await choice(shuffle([n].concat(numOth(n,L,L.k-1)).map(d=>({html:numCard(d,pic),ok:d===n,key:'n'+d}))),{question:q,goodText:cap(NUMW[n])+'.'});
  return roundDone(ok,{m:'столько же',n})}

/* ---------- ПОВТОРИ!: картинки в ряд, потом ребёнок пальцем переставляет их в том же порядке */
/* ---------- ЛЕТИТ, ЕДЕТ, ПЛЫВЁТ: перетащить на небо, на дорогу, на речку (одну или несколько картинок) */
async function trSort(R,list,lvl){
  const one=list.length===1;const t0=list[0];
  const q=one?cap(t0.n)+' летит, едет или плывёт?':'Разложи! Что летит, что едет, что плывёт?';
  if(!await ask(q,one?q+' Отнеси!':'Что летит — на небо. Что едет — на дорогу. Что плывёт — на речку!'))return null;
  R.good=one?cap(t0.n)+' '+TRV[t0.c]+'.':'Всё на месте!';
  const st=$('#stage');st.innerHTML=`<div class="put trs"><div class="trhome"></div><div class="trzs"><div class="tz sky" data-c="fly"><i class="cl a"></i><i class="cl b"></i></div><div class="tz road" data-c="ride"><i class="lane"></i></div><div class="tz sea" data-c="swim"><i class="wv"></i></div></div></div>`;
  const box=st.firstChild;const BR=box.getBoundingClientRect(),rel=e=>{const r=e.getBoundingClientRect();return{x:r.left-BR.left,y:r.top-BR.top,w:r.width,h:r.height}};
  const HR=rel(box.querySelector('.trhome')),ZR=rel(box.querySelector('.trzs'));const k=list.length,horiz=HR.w>=HR.h;
  const os=Math.min(170,horiz?Math.min(HR.h*.85,HR.w/k*.92):Math.min(HR.w*.85,HR.h/k*.92));
  const objs=[];const zones=[...box.querySelectorAll('.tz')];const inZone={fly:0,ride:0,swim:0};let wrong=0,left=k;
  await new Promise(res=>{list.forEach((t,j)=>{const c=t.c,src=t.src;
    const el=document.createElement('div');el.className='obj trobj';el.innerHTML=`<img src="${IMG[src]||src}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain;pointer-events:none">`;
    const home=horiz?{x:HR.x+(j+.5)*HR.w/k-os/2,y:HR.y+(HR.h-os)/2}:{x:HR.x+(HR.w-os)/2,y:HR.y+(j+.5)*HR.h/k-os/2};
    place(el,{x:home.x,y:home.y,w:os,h:os});box.append(el);objs.push(el);let drag=null,miss=0;
    el.onpointerdown=e=>{if(el.classList.contains('placed'))return;e.preventDefault();ac();el.setPointerCapture(e.pointerId);el.classList.remove('back');el.classList.add('drag');sfx.click();
      const r=el.getBoundingClientRect();drag={dx:e.clientX-r.left-r.width/2,dy:e.clientY-r.top-r.height/2,sx:e.clientX,sy:e.clientY}};
    el.onpointermove=e=>{if(!drag)return;const b=box.getBoundingClientRect();el.style.left=(e.clientX-b.left-drag.dx-os/2)+'px';el.style.top=(e.clientY-b.top-drag.dy-os/2)+'px'};
    el.onpointerup=el.onpointercancel=async e=>{if(!drag)return;const moved=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy);drag=null;el.classList.remove('drag');
      if(moved<12){el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});say(cap(t.n)+'.');return}
      const cx=parseFloat(el.style.left)+os/2,cy=parseFloat(el.style.top)+os/2;
      if(cx>=HR.x&&cx<=HR.x+HR.w&&cy>=HR.y&&cy<=HR.y+HR.h){el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});return}
      const zr=zones.map(rel);let zi=zr.findIndex(r=>cy>=r.y&&cy<r.y+r.h);if(zi<0)zi=cy<zr[0].y?0:2;const zc=zones[zi].dataset.c;
      if(zc===c){el.classList.add('placed');const n=inZone[c]++;const s=one?os:Math.min(os,zr[zi].h*.9);const y=zr[zi].y+zr[zi].h/2-s/2-(c==='swim'?s*.12:0);
        place(el,{x:ZR.x+8+n*s*.9,y,w:s,h:s});sfx.good();zones.forEach(z=>z.classList.remove('hint'));left--;
        if(one){await wait(60);el.classList.add('go-'+c);res();return}
        say(cap(t.n)+' '+TRV[c]+'!');if(left===0)setTimeout(()=>{objs.forEach((o,q)=>o.classList.add('go-'+list[q].c));res()},900);return}
      wrong++;miss++;G.round.wrong++;el.classList.add('placed');const badMs=sfx.bad();await wait(Math.max(600,badMs));if(!box.isConnected)return;
      el.classList.remove('placed');el.classList.add('back');place(el,{x:home.x,y:home.y,w:os,h:os});
      if(miss>=2)box.querySelector(`.tz[data-c="${c}"]`).classList.add('hint');
      await say('Нет, '+t.n+' не '+TRV[zc]+'. '+cap(t.n)+' '+TRV[c]+'! Отнеси '+TRZ[c]+'.')}})});
  if(R.dead||!G)return null;await wait(one?0:600);
  return wrong}
async function trRound(lvl){
  const R=G.round;const cls=['fly','ride','swim'];
  const sortN=lvl>=4?5:lvl===3?3:1;const doSort=lvl>=3?rmode('trm',3)!==0:rmode('trm',2)===0;
  if(doSort){
    const list=[];if(sortN===1){const c=cls[rmode('trc',3)];const t=fresh(()=>pick(TRL.filter(x=>x.c===c)),x=>'trd'+x.n);list.push(t)}
    else{const cs=shuffle(cls.slice()).concat(shuffle(cls.slice())).slice(0,sortN);cs.forEach(c=>{const t=pick(TRL.filter(x=>x.c===c&&!list.includes(x)));if(t)list.push(t)});shuffle(list)}
    const L=list.map(t=>({n:t.n,c:t.c,src:sortN===1?t.e:t.i()}));
    const wrong=await trSort(R,L,lvl);if(wrong===null)return;
    const r=$('#stage .trobj').getBoundingClientRect();confetti(80,r.left+r.width/2,r.top+r.height/2);
    await say(pick(PRAISE)+' '+(sortN===1?cap(L[0].n)+' '+TRV[L[0].c]+'!':'Всё на своих местах!'));await wait(700);
    return roundDone(wrong===0,{m:sortN===1?'перенеси':'разложи '+sortN,v:sortN===1?TRV[L[0].c]:'все',n:L.map(x=>x.n).join(',')})}
  const c=cls[rmode('trc',3)];const t=fresh(()=>pick(TRL.filter(x=>x.c===c)),x=>'tr'+x.n);
  const n=lvl===1?2:lvl===2?3:4;let others;
  if(n===2)others=[pick(TRL.filter(x=>x.c!==c))];
  else{const oc=cls.filter(k=>k!==c);others=oc.map(k=>pick(TRL.filter(x=>x.c===k)));if(n===4)others.push(pick(TRL.filter(x=>x.c!==c&&!others.includes(x))))}
  const q='Что '+TRV[c]+'?';if(!await ask(q))return;
  const ok=await choice(shuffle([t].concat(others).map(x=>({html:wimg({i:x.i()}),ok:x===t,key:x.n}))),{question:q,goodText:cap(t.n)+' '+TRV[c]+'.'});
  return roundDone(ok,{m:'выбор',v:TRV[c],n:t.n})}

/* ---------- СЪЕДОБНОЕ: знакомая еда (банан, оладьи, пельмени, яблоко, манго, вода) и знакомые вещи */
Object.assign(IMG,window.IMG12||{});
const FAM_Y=[['банан',RPIC['банан']&&RPIC['банан'][0]],['яблоко',RPIC['яблоко']&&RPIC['яблоко'][0]],['оладьи','fd_oladi'],['пельмени','fd_pelmeni'],['манго','fd_mango'],['вода','fd_voda',{ok:'Воду можно пить!',bad:'Нет! Воду можно пить. Неси на стол!'}]]
  .filter(x=>x[1]&&IMG[x[1]]).map(([n,i,o])=>Object.assign({i,n,e:true},o||{}));
const FAM_N=['мяч','машина','кубик','мишка','шапка','телефон','пульт','кроссовки','книжки','ключ'].filter(n=>RPIC[n]).map(n=>({i:RPIC[n][0],n,e:false}));
const FOODLV={1:[['fy',1],['fn',1]],2:[['fy',2],['fn',2]],3:[['fy',3],['fn',3]],4:[['y',2],['n',2]],5:[['fy',2],['y',1],['fn',1],['n',2]]};


/* ---------- v22: «Повторяй за Шариком» — собака чётко проговаривает ритмические ряды логопеда, Лев повторяет */
const DOG_MOUTH={
  m:'<path d="M84 150q16 4 32 0" stroke="#5a2a1a" stroke-width="5" fill="none" stroke-linecap="round"/>',
  a:'<ellipse cx="100" cy="156" rx="20" ry="22" fill="#5a1a1a"/><ellipse cx="100" cy="168" rx="11" ry="8" fill="#ff7a8a"/><path d="M82 142h36" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
  o:'<ellipse cx="100" cy="155" rx="14" ry="17" fill="#5a1a1a" stroke="#8a4a2a" stroke-width="4"/>',
  u:'<ellipse cx="100" cy="153" rx="8" ry="9" fill="#5a1a1a" stroke="#8a4a2a" stroke-width="5"/>',
  i:'<path d="M78 148q22 14 44 0q-22 6-44 0z" fill="#5a1a1a" stroke="#8a4a2a" stroke-width="3"/><path d="M84 149h32" stroke="#fff" stroke-width="3"/>'};
const VOW={а:'a',я:'a',о:'o',ё:'o',у:'u',ю:'u',ы:'i',и:'i',е:'i',э:'i'};
const vowels=w=>[...w.toLowerCase()].map(ch=>VOW[ch]).filter(Boolean);
const DOG_SVG=`<svg viewBox="0 0 200 220" class="dogsvg"><path d="M40 60q-30 30-14 90q14 10 30-4q-6-50 10-74z" fill="#8a5a33"/><path d="M160 60q30 30 14 90q-14 10-30-4q6-50-10-74z" fill="#8a5a33"/>
<ellipse cx="100" cy="105" rx="68" ry="72" fill="#d9a066"/><ellipse cx="100" cy="148" rx="44" ry="36" fill="#f3d3a8"/>
<circle cx="74" cy="92" r="11" fill="#fff"/><circle cx="126" cy="92" r="11" fill="#fff"/><circle cx="76" cy="94" r="6" fill="#24324a"/><circle cx="124" cy="94" r="6" fill="#24324a"/>
<path d="M60 74q14-10 26-2M140 74q-14-10-26-2" stroke="#8a5a33" stroke-width="5" fill="none" stroke-linecap="round"/>
<ellipse cx="100" cy="124" rx="15" ry="10" fill="#3a2418"/><path d="M100 134v8" stroke="#3a2418" stroke-width="4"/>
<g class="dmouth">${DOG_MOUTH.m}</g><path d="M60 196q40 20 80 0" stroke="#ff6b5b" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="100" cy="204" r="8" fill="#ffc93c"/></svg>`;
/* v33: объёмный Шарик (three.js, MIT; app/vendor/sharik3d, исходник tools/sharik3d). Выключатель в «Для взрослых».
   Без WebGL, при ошибке или если выключен — прежний рисунок DOG_SVG. Холст один на всё приложение и переезжает. */
const SH3_CSS=`.is3d>svg{display:none!important}
.is3d>canvas.sh3d{display:block;width:100%;height:100%}
.shg .shdog.is3d{aspect-ratio:10/11;width:min(80%,340px)}.shg .shdog.is3d.talk{animation:none}
.dogbox.is3d{place-items:stretch;padding:0;overflow:hidden}
.mirr .msh.is3d{aspect-ratio:10/11}
.mirr .msh.big.is3d{right:auto;left:50%;transform:translateX(-50%);width:62%;max-width:300px;bottom:12px}`;
document.head.insertAdjacentHTML('beforeend','<style>'+SH3_CSS+'</style>');
let SH3P=null;
function sh3Load(){if(window.Sharik3D)return Promise.resolve(window.Sharik3D);if(SH3P)return SH3P;
  SH3P=new Promise(res=>{const s=document.createElement('script');s.src='vendor/sharik3d/sharik3d.js';s.onload=()=>res(window.Sharik3D||null);s.onerror=()=>{SH3P=null;res(null)};document.head.append(s)});return SH3P}
async function sh3(el,opt){if(!el||S.sh3d===false)return null;
  try{const L=await sh3Load();if(!L||!el.isConnected||S.sh3d===false||!L.supported())return null;const h=L.mount(el,opt);if(!h)return null;el.classList.add('is3d');el._s3=h;return h}
  catch(e){console.warn('Шарик 3D:',e);return null}}
const s3=el=>el&&el._s3&&el._s3.active?el._s3:null; /* управление Шариком, если он сейчас объёмный в этом месте */
async function dogSay(el,word,rate){
  const g=el.querySelector('.dmouth');const h3=s3(el);const vis=v=>{if(h3)h3.viseme(v)};const vs=vowels(word);let done=false;const p=say(word,{rate}).then(()=>{done=true});
  const t0=Date.now();
  const an=(async()=>{let k=0;while((!done||k<Math.max(1,vs.length))&&Date.now()-t0<6000){const v=vs[k%Math.max(1,vs.length)]||'a';
    if(/^[мбп]/i.test(word)&&k===0){g.innerHTML=DOG_MOUTH.m;vis('m');await wait(110)}
    g.innerHTML=DOG_MOUTH[v];vis(v);el.classList.add('talk');await wait(vs.length>1?260:420);g.innerHTML=DOG_MOUTH.m;vis('m');await wait(90);k++;if(k>=vs.length&&vs.length>1)await wait(150)}
    g.innerHTML=DOG_MOUTH.m;el.classList.remove('talk')})();
  await Promise.all([p,an]);await wait(120);g.innerHTML=DOG_MOUTH.m;vis(null);el.classList.remove('talk')}
const RHY_LOGO=()=>RHY.filter(r=>r.src==='logo'&&r.w.every(w=>rpic(w)));
const DOGLV={1:{t:3,n:2},2:{t:3,n:4},3:{t:3,n:6},4:{t:5,n:2},5:{t:5,n:4},6:{t:5,n:6}};
/* ===================== v23: «Несёт или держит» (держит — новые картинки: двумя руками, стоит) и «Держит или даёт» ===================== */
const HG=window.HOLDGIVE||{hold:[],give:[]};
const HOLD=HG.hold,GIVE=HG.give;
const hgCard=x=>`<img src="${x.i}" alt="">`;
const hgWide=cs=>cs.some(c=>/img13\/(gv_|hd_\d)/.test(c.i||''));
const nesWalk=x=>({i:x.walk,s:x.s,o:x.o,v:'несёт'});
const hgPick=(L,n,used)=>{const out=[];for(const x of shuffle(L)){if(out.length>=n)break;if(used.some(u=>u.o===x.o))continue;out.push(x);used.push(x)}return out};
/* НЕСЁТ (идёт с предметом) — ДЕРЖИТ (стоит и держит двумя руками) */
async function nesRound(lvl){
  if(!HOLD.length)return roundDone(true,{});
  const used=[];
  if(lvl<=2){const v=rmode('nesv',2)===0?'несёт':'держит';const k=lvl===1?1:2;
    const walks=hgPick(NES,k,used).map(nesWalk),holds=hgPick(HOLD,k,used).map(x=>Object.assign({v:'держит'},x));
    const t=pick(v==='несёт'?walks:holds);const cards=walks.concat(holds);
    const q='Кто '+v+'?';if(!await ask(q))return;
    const good=cap(t.s)+' '+v+' '+t.o+(v==='несёт'?' — идёт.':' — стоит.');
    const ok=await choice(shuffle(cards.map(c=>({html:hgCard(c),ok:c===t,key:c.v}))),{question:q,goodText:good,wide:hgWide(cards)});
    return roundDone(ok,{v,n:t.o})}
  /* уровень 3: действие + предмет: «Кто держит книгу?» — среди держит/несёт с разными предметами */
  const v=rmode('nesv',2)===0?'несёт':'держит';
  const walks=hgPick(NES,2,used).map(nesWalk),holds=hgPick(HOLD,2,used).map(x=>Object.assign({v:'держит'},x));
  const t=pick(v==='несёт'?walks:holds);const q='Кто '+v+' '+t.o+'?';if(!await ask(q))return;
  const ok=await choice(shuffle(walks.concat(holds).map(c=>({html:hgCard(c),ok:c===t,key:c.v+' '+c.o}))),{question:q,goodText:cap(t.s)+' '+v+' '+t.o+'.',wide:hgWide(walks.concat(holds))});
  return roundDone(ok,{v,n:t.o})}
/* ДЕРЖИТ — ДАЁТ */
async function giveRound(lvl){
  if(!GIVE.length||!HOLD.length)return roundDone(true,{});
  const used=[];const v=rmode('givev',2)===0?'даёт':'держит';
  const hold=n=>hgPick(HOLD,n,used).map(x=>Object.assign({v:'держит'},x)),give=n=>hgPick(GIVE,n,used).map(x=>Object.assign({v:'даёт'},x));
  let cards,t,q;
  if(lvl<=2){const k=lvl===1?1:2;const hs=hold(k),gs=give(k);cards=hs.concat(gs);t=pick(v==='даёт'?gs:hs);q='Кто '+v+'?'}
  else if(lvl===3){/* только «даёт»: кто даёт воду? */cards=give(4);t=pick(cards);q='Кто даёт '+t.o+'?'}
  else{const hs=hold(2),gs=give(2);cards=hs.concat(gs);t=pick(v==='даёт'?gs:hs);q='Кто '+t.v+' '+t.o+'?'}
  if(!await ask(q))return;
  const good=cap(t.s)+' '+t.v+' '+t.o+'.';
  const ok=await choice(shuffle(cards.map(c=>({html:hgCard(c),ok:c===t,key:c.v+' '+c.o}))),{question:q,goodText:good,wide:hgWide(cards)});
  return roundDone(ok,{v:t.v,n:t.o})}


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
  const R=G.round;const len=lvl>1&&rmode('seq3',5)<2?3:Math.min(5,2+lvl);
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
  st.innerHTML=`<div class="topics">${ts.map(t=>{const L=W24T[t];const ic=L.find(x=>['собака','яблоко','стул','футболка','мяч','дерево','машина'].includes(x.n))||L[0];return `<button class="opt topic" data-t="${t}">${img(ic.is[0]||ic.an[0])}<b>${W24N[t]}</b></button>`}).join('')}</div>`;
  say('Что будем учить?');st.querySelectorAll('.topic').forEach(b=>b.onclick=()=>{ac();sfx.click();stopVoice();res(b.dataset.t)})})}
async function worldRound(lvl){
  const R=G.round;if(!G.topic){G.topic=await topicPick24();if(!G||G.round!==R)return}
  const L=W24T[G.topic]||W24T.all;const t=fresh(()=>pick(L),x=>x.n);const ti=wPic(t);
  if(lvl>=4&&rmode('wq',3)===2){const q='Что это?';setPrompt(q);$('#stage').innerHTML=`<div class="solo"><div class="pic">${img(ti)}</div></div>`;R.replay=()=>say(q);
    await say(q);if(R.dead)return;await wait(2500);if(R.dead)return;R.good='Это '+t.n+'.';await say('Это '+t.n+'!');if(R.dead)return;
    if(S.sayit!=='off')await sayIt(cap(t.n),img(ti));return roundDone(true,{n:t.n,m:'назови',x:1})}
  const n=Math.min([0,2,4,6,6,9][lvl]||4,L.length);let others;
  if(lvl===4){const grp=(W24SIM[G.topic]||[]).find(g=>g.includes(t.n))||[];others=shuffle(L.filter(x=>x!==t&&grp.includes(x.n))).slice(0,n-1);
    if(others.length<n-1)others=others.concat(shuffle(L.filter(x=>x!==t&&!others.includes(x))).slice(0,n-1-others.length))}
  else others=shuffle(L.filter(x=>x!==t)).slice(0,n-1);
  const q='Где '+t.n+'?';if(!await ask(q))return;
  const ok=await choice([{html:img(ti),ok:true,key:t.n}].concat(others.map(x=>({html:img(wPic(x)),ok:false,key:x.n}))),{question:q,goodText:'Это '+t.n+'.',sayit:cap(t.n)});
  return roundDone(ok,{n:t.n,m:G.topic})}

/* ---------- НАГРАДА: настоящий пазл из 10 кусочков (фото), каждый третий раз — лабиринт */
const PZP=window.PZPHOTOS||[];const PZ_W=1000,PZ_H=600,PZ_C=5,PZ_R=2;
const pieceSvg24=(p,href,uid,m,stroke)=>`<svg viewBox="${p.x0-m} ${p.y0-m} ${p.w+2*m} ${p.h+2*m}"><defs><clipPath id="${uid}"><path d="${p.d}"/></clipPath></defs><image href="${href}" x="0" y="0" width="${PZ_W}" height="${PZ_H}" clip-path="url(#${uid})" preserveAspectRatio="none"/>${stroke?`<path d="${p.d}" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>`:''}</svg>`;
function pzCur(){const k=(S.pz.k||0)%Math.max(1,PZP.length);return{k,ph:PZP[k]||{f:'',n:''},pieces:jigsaw(PZ_C,PZ_R,PZ_W,PZ_H,2400+(S.pz.k||0))}}
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
        sfx.snap();S.pz.placed.push(j);save();board.querySelector(`[data-slot="${j}"]`)?.classList.remove('slot-hint');
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


/* ===================== v25: «Повторяй за Шариком» = звуки, слоги, слова, «хочу…»; «Большой — маленький, один — много»;
   глянцевые шарики, переходы карточек, «Лови!», новые шарики, пингвины с полыньями, цифры: обведи до конца, найди все, какая спряталась ===================== */

/* ---------- звук «щёлк» (кусочек пазла встал на место) */
sfx.snap=()=>{const a=ac();if(!a)return;const t=a.currentTime;
  const b=a.createBuffer(1,a.sampleRate*.03,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,6);
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='bandpass';f.frequency.value=3200;f.Q.value=1.2;g.gain.value=.85;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start(t);
  const o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(420,t+.01);o.frequency.exponentialRampToValueAtTime(140,t+.12);
  og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(.5,t+.015);og.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(og).connect(a.destination);o.start(t);o.stop(t+.18);
  tone(1650,.05,.05,'triangle',.1)};

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
  await Promise.race([sh3(dog,{view:'face'}),wait(1500)]);if(R.dead)return;
  const rate=Math.max(.55,(S.rate||.85)-.2);
  const model=async()=>{for(let k=0;k<row.length;k++){if(R.dead)return;cs.forEach(c=>c.classList.remove('on'));cs[k].classList.add('on');await dogSay(dog,row[k].t,rate);await wait(mode==='syl'?120:250)}cs.forEach(c=>c.classList.remove('on'))};
  R.replay=async()=>{if(R.busy)return;R.busy=1;await model();R.busy=0};
  R.busy=1;await model();R.busy=0;if(R.dead)return;
  await wait(300);await say('Теперь ты!');if(R.dead)return;setPrompt('Теперь ты!');hint.textContent='Повтори за Шариком';dog.classList.add('listen');s3(dog)&&s3(dog).mood('listen');
  let k=0;const light=()=>{cs.forEach(c=>c.classList.remove('on'));if(k<cs.length){cs[k].classList.add('on','said')}k++};
  let usedMic=false;
  if(S.voiceGame&&MICX!==false&&await VM.start()){usedMic=true;let last=performance.now();
    const det=segDetector(()=>{light();last=performance.now();tone(660,0,.08,'triangle',.1)},()=>{last=performance.now()});
    await new Promise(res=>{VM.cb=(v,t)=>{det(v,t);if(R.dead)return res();if(k>=cs.length&&t-last>700)return res();if(t-last>(k?3500:7000))return res()}});VM.cb=null;VM.stop()}
  else{for(let j=0;j<cs.length;j++){if(R.dead)return;light();await wait(mode==='syl'?800:1100)}}
  if(R.dead||!G)return;dog.classList.remove('listen');s3(dog)&&s3(dog).mood('praise');hint.textContent='';cs.forEach(c=>c.classList.add('ok'));
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
/* v26: звук при ошибке по умолчанию «тихий» (вместо грустного тромбона); выбор можно вернуть в разделе для взрослых */
function mig26(){if((S.ver||0)>=26)return;if((S.badSnd||'game')==='game')S.badSnd='soft';S.ver=26;save()}
function mig25(){if((S.ver||0)>=25)return;S.tipOn=false;S.pzL=S.pzL||{};S.pzL.pg=0;S.pz.maze=false;S.lvl.dog=Math.min(S.lvl.dog||1,3);S.ver=25;save()}

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



