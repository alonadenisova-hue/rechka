/* «Речка»: рисованный герой — добрый рыжий кот в синем шарфе (версия 43).
   Свой персонаж проекта: нарисован кодом (SVG), без чужих рисунков и библиотек; работает без интернета и без WebGL.
   Управляется так же, как объёмный Шарик (app/vendor/sharik3d): window.Cat2D.mount(элемент,{view:'full'|'face'}) →
   {mood, talk, level, viseme, pose, jump, wave, point, nod, shake, unmount, active}.
   Выбор героя — «Для взрослых» → «Шарик» → «Герой» (S.hero: 'cat' | 'dog'). */
(function(){
const C={fur:'#f2a55c',dark:'#d7813a',cream:'#fff4e0',pink:'#f6a5a8',line:'#5b3a22',eye:'#2b3a55',scarf:'#5aa9e6',scarf2:'#3d86c6',mouth:'#7a2330',tongue:'#ff8fa0'};
const SH={L:[76,140],R:[124,140]};            // плечи
const REST={L:[82,193],R:[118,193]};          // лапы внизу
/* куда тянется лапа в позах «покажи на себе» (правая — та, что справа на экране) */
const POINT={nose:[103,92],mouth:[104,106],eye:[124,80],cheek:[130,98],ear:[146,40],head:[124,32],belly:[100,170],leg:[130,198],knee:[128,190]};
const MOUTHS={a:[.95,0],o:[.65,-.7],u:[.4,-1],i:[.28,.9],e:[.5,.5],y:[.32,.35],m:[0,0]};
function markup(){return `
<ellipse cx="100" cy="209" rx="58" ry="7" fill="#3a2a4022"/>
<g class="c-all">
 <g class="c-tail" data-part="хвост"><path d="M136 190Q188 194 180 150Q176 132 162 140" fill="none" stroke="${C.line}" stroke-width="19" stroke-linecap="round"/><path d="M136 190Q188 194 180 150Q176 132 162 140" fill="none" stroke="${C.fur}" stroke-width="14" stroke-linecap="round"/><path d="M180 152Q176 132 162 140" fill="none" stroke="${C.dark}" stroke-width="14" stroke-linecap="round"/></g>
 <g class="c-body">
  <ellipse cx="100" cy="162" rx="43" ry="46" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <ellipse cx="100" cy="168" rx="26" ry="32" fill="${C.cream}" data-part="живот"/>
  <ellipse cx="72" cy="200" rx="19" ry="11" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/><ellipse cx="128" cy="200" rx="19" ry="11" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <path d="M62 198v6M70 200v6M130 200v6M138 198v6" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>
  <g class="w-socks" style="display:none"><ellipse cx="72" cy="199" rx="21" ry="13" fill="#7b61ff" stroke="${C.line}" stroke-width="3"/><ellipse cx="128" cy="199" rx="21" ry="13" fill="#7b61ff" stroke="${C.line}" stroke-width="3"/><path d="M56 194h32M112 194h32" stroke="#fff" stroke-width="4" opacity=".8"/></g>
 </g>
 <g class="c-scarf"><path d="M134 126l14 30q-8 6-16 2l-8-28z" fill="${C.scarf2}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M64 118Q100 140 136 118L138 130Q100 154 62 130Z" fill="${C.scarf}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/><path d="M80 130l-2 10M100 136v10M120 130l2 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>
 <g class="c-head">
  <g class="c-earL" data-part="ухо"><path d="M56 56L48 12L88 38Z" fill="${C.fur}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/><path d="M60 46L56 24L76 38Z" fill="${C.pink}"/></g>
  <g class="c-earR" data-part="ухо"><path d="M144 56L152 12L112 38Z" fill="${C.fur}" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/><path d="M140 46L144 24L124 38Z" fill="${C.pink}"/></g>
  <ellipse cx="100" cy="80" rx="53" ry="46" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <path d="M100 36v14M86 38l3 12M114 38l-3 12" stroke="${C.dark}" stroke-width="5" stroke-linecap="round"/>
  <path d="M50 78l12 3M51 90l11-1M150 78l-12 3M149 90l-11-1" stroke="${C.dark}" stroke-width="4" stroke-linecap="round"/>
  <circle class="c-blL" cx="64" cy="98" r="9" fill="${C.pink}" opacity=".55"/><circle class="c-blR" cx="136" cy="98" r="9" fill="${C.pink}" opacity=".55"/>
  <g class="c-chL"><ellipse cx="82" cy="100" rx="19" ry="15" fill="${C.cream}"/></g><g class="c-chR"><ellipse cx="118" cy="100" rx="19" ry="15" fill="${C.cream}"/></g>
  <g data-part="усы"><path d="M60 100h-22M62 106l-20 6M140 100h22M138 106l20 6" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/><path d="M62 103h-26M138 103h26" stroke="transparent" stroke-width="14"/></g>
  <g class="c-eyes">
   <g class="c-eyeL"><ellipse cx="80" cy="76" rx="11" ry="13" fill="#fff" stroke="${C.line}" stroke-width="2"/><g class="c-pup"><circle cx="81" cy="78" r="7" fill="${C.eye}"/><circle cx="84" cy="74" r="2.6" fill="#fff"/></g></g>
   <g class="c-eyeR"><ellipse cx="120" cy="76" rx="11" ry="13" fill="#fff" stroke="${C.line}" stroke-width="2"/><g class="c-pup"><circle cx="119" cy="78" r="7" fill="${C.eye}"/><circle cx="122" cy="74" r="2.6" fill="#fff"/></g></g>
  </g>
  <g class="c-happy" style="display:none"><path d="M69 79q11-13 22 0M109 79q11-13 22 0" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/></g>
  <g class="c-shut" style="display:none"><path d="M69 76q11 9 22 0M109 76q11 9 22 0" fill="none" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/></g>
  <path class="c-brL" d="M68 58q11-7 22-2" fill="none" stroke="${C.line}" stroke-width="3.5" stroke-linecap="round"/><path class="c-brR" d="M132 58q-11-7-22-2" fill="none" stroke="${C.line}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M94 89h12l-6 7z" fill="${C.pink}" stroke="${C.line}" stroke-width="2" stroke-linejoin="round"/>
  <g class="c-mouth"></g>
  <g class="w-teeth" style="display:none"><path d="M84 103Q100 122 116 103Z" fill="${C.mouth}" stroke="${C.line}" stroke-width="2.5"/><path d="M88 104h24l-2 5h-20z" fill="#fff" stroke="${C.line}" stroke-width="1.2"/></g>
  <circle cx="80" cy="76" r="15" fill="transparent" data-part="глаз"/><circle cx="120" cy="76" r="15" fill="transparent" data-part="глаз"/>
  <circle cx="100" cy="91" r="9" fill="transparent" data-part="нос"/><ellipse cx="100" cy="108" rx="17" ry="9" fill="transparent" data-part="рот"/>
  <ellipse cx="100" cy="44" rx="40" ry="12" fill="transparent" data-part="голова"/>
  <g class="w-glasses" style="display:none"><circle cx="80" cy="76" r="16" fill="#bfe3f555" stroke="#24324a" stroke-width="4"/><circle cx="120" cy="76" r="16" fill="#bfe3f555" stroke="#24324a" stroke-width="4"/><path d="M96 75q4-4 8 0M64 72l-14-4M136 72l14-4" fill="none" stroke="#24324a" stroke-width="4" stroke-linecap="round"/></g>
  <g class="w-hat" style="display:none"><path d="M48 54Q50 12 100 10Q150 12 152 54Z" fill="#e8423b" stroke="${C.line}" stroke-width="3"/><path d="M70 22q6 14 4 30M100 12v40M130 22q-6 14-4 30" stroke="#c22f29" stroke-width="3" fill="none"/><rect x="44" y="44" width="112" height="16" rx="8" fill="#ffcd1c" stroke="${C.line}" stroke-width="3"/><circle cx="100" cy="8" r="10" fill="#ffcd1c" stroke="${C.line}" stroke-width="3"/></g>
  <text class="c-zzz" x="150" y="40" font-size="26" font-weight="700" fill="#7b61ff" style="display:none">z z</text>
 </g>
 <g class="c-armL" data-part="лапа"><path class="o" fill="none" stroke="${C.line}" stroke-width="21" stroke-linecap="round"/><path class="f" fill="none" stroke="${C.fur}" stroke-width="15" stroke-linecap="round"/><circle class="p" r="10.5" fill="${C.cream}" stroke="${C.line}" stroke-width="3"/></g>
 <g class="c-armR" data-part="лапа"><path class="o" fill="none" stroke="${C.line}" stroke-width="21" stroke-linecap="round"/><path class="f" fill="none" stroke="${C.fur}" stroke-width="15" stroke-linecap="round"/><circle class="p" r="10.5" fill="${C.cream}" stroke="${C.line}" stroke-width="3"/></g>
 <text class="c-item" font-size="34" text-anchor="middle" style="display:none"></text>
</g>`}
function mouthSvg(open,wide){ /* open 0…1 — насколько открыт; wide −1 (трубочка) … +1 (улыбка) */
  const y=106;
  if(open<.07){ if(wide<-.5)return `<ellipse cx="100" cy="${y}" rx="5" ry="5" fill="${C.mouth}" stroke="${C.line}" stroke-width="2"/>`;
    const w=10+6*Math.max(0,wide),d=4+7*Math.max(0,wide);return `<path d="M${100-w} ${y-2}Q${100-w/2} ${y+d} 100 ${y-1}Q${100+w/2} ${y+d} ${100+w} ${y-2}" fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"/>`}
  const rx=Math.max(4,9+wide*5-(wide<0?wide*-3:0)*0.5),ry=3+open*11;
  return `<ellipse cx="100" cy="${y+ry*.45}" rx="${rx}" ry="${ry}" fill="${C.mouth}" stroke="${C.line}" stroke-width="2.5"/>`+(open>.35?`<ellipse cx="100" cy="${y+ry*1.05}" rx="${rx*.6}" ry="${ry*.38}" fill="${C.tongue}"/>`:'')}
const STATIC_ARMS=`<style>.herocat-static .c-armL,.herocat-static .c-armR{display:none}</style>`;
/* неподвижная картинка (значки на главном экране) */
function svg(){return `<svg viewBox="0 0 200 220" class="dogsvg herocat-static">${markup().replace('<g class="c-mouth"></g>','<g class="c-mouth">'+mouthSvg(0,.8)+'</g>')}
<path d="M76 140Q70 170 82 193" fill="none" stroke="${C.line}" stroke-width="21" stroke-linecap="round"/><path d="M76 140Q70 170 82 193" fill="none" stroke="${C.fur}" stroke-width="15" stroke-linecap="round"/><circle cx="82" cy="193" r="10.5" fill="${C.cream}" stroke="${C.line}" stroke-width="3"/>
<path d="M124 140Q130 170 118 193" fill="none" stroke="${C.line}" stroke-width="21" stroke-linecap="round"/><path d="M124 140Q130 170 118 193" fill="none" stroke="${C.fur}" stroke-width="15" stroke-linecap="round"/><circle cx="118" cy="193" r="10.5" fill="${C.cream}" stroke="${C.line}" stroke-width="3"/>${STATIC_ARMS}</svg>`}
const lerp=(a,b,k)=>a+(b-a)*k;
function mount(el,opt={}){
  if(!el)return null;
  const old=el.querySelector(':scope>.hero2d');if(old){old._kill&&old._kill();old.remove()}
  const box=document.createElement('div');box.className='sh3d hero2d';box.style.cssText='display:block;position:relative;width:100%;height:100%;min-height:0';
  const face=opt.view==='face';
  box.innerHTML=`<svg viewBox="${face?'28 2 144 132':'0 0 200 220'}" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;display:block;width:100%!important;height:100%!important;max-width:none;overflow:${face?'hidden':'visible'}" aria-hidden="true">${markup()}</svg>`;
  el.appendChild(box);
  const q=s=>box.querySelector(s);
  const P={all:q('.c-all'),tail:q('.c-tail'),body:q('.c-body'),head:q('.c-head'),earL:q('.c-earL'),earR:q('.c-earR'),chL:q('.c-chL'),chR:q('.c-chR'),eyes:q('.c-eyes'),eyeL:q('.c-eyeL'),eyeR:q('.c-eyeR'),
    pups:[...box.querySelectorAll('.c-pup')],happy:q('.c-happy'),shut:q('.c-shut'),brL:q('.c-brL'),brR:q('.c-brR'),mouth:q('.c-mouth'),armL:q('.c-armL'),armR:q('.c-armR'),zzz:q('.c-zzz'),item:q('.c-item')};
  const st={mood:'calm',moodT:0,talk:false,vis:null,lvl:0,lvlOn:false,pose:null,jumpT:9,waveT:9,nodT:9,shakeT:9,point:null,act:null,item:'',alive:true};
  /* текущие (сглаженные) значения */
  const cur={hL:REST.L.slice(),hR:REST.R.slice(),rot:0,hy:0,hx:0,jy:0,sq:0,open:0,wide:.5,eye:1,px:0,py:0,br:0,puff:1,tail:0,earR:0,lean:0};
  let t=0,last=0,blink=2+Math.random()*3,blinkT=9,mKey='',raf=0;
  function arm(g,sh,h,side){const mx=(sh[0]+h[0])/2+side*(10+Math.max(0,sh[1]-h[1])*.42),my=(sh[1]+h[1])/2+6;const d=`M${sh[0]} ${sh[1]}Q${mx.toFixed(1)} ${my.toFixed(1)} ${h[0].toFixed(1)} ${h[1].toFixed(1)}`;
    g.children[0].setAttribute('d',d);g.children[1].setAttribute('d',d);g.children[2].setAttribute('cx',h[0].toFixed(1));g.children[2].setAttribute('cy',h[1].toFixed(1))}
  function frame(now){
    if(!st.alive)return;if(!box.isConnected){st.alive=false;return}
    raf=requestAnimationFrame(frame);
    const dt=Math.min(.05,last?(now-last)/1000:.016);last=now;t+=dt;st.moodT+=dt;st.jumpT+=dt;st.waveT+=dt;st.nodT+=dt;st.shakeT+=dt;
    const k=1-Math.exp(-dt*11),m=st.mood,p=st.pose;
    /* цели */
    let hL=REST.L,hR=REST.R,rot=Math.sin(t*.9)*1.5,hy=Math.sin(t*1.8)*1.2,hx=0,sq=0,open=0,wide=.5,eye=1,px=0,py=0,br=0,puff=1,earR=0,lean=0,happy=false,shut=false;
    if(m==='praise'){happy=st.moodT<1.6;wide=1;if(st.moodT<1.2){hL=[46,84];hR=[154,84]}}
    else if(m==='invite'){wide=.9}
    else if(m==='comfort'){rot=-9;br=-3;wide=.2;hR=[104,150]}
    else if(m==='listen'){rot=10;earR=14;hR=[150,58];wide=.3}
    else if(m==='think'){rot=-7;px=3;py=-5;hR=[112,116];wide=0;br=2}
    if(st.waveT<1.8){hR=[158+Math.sin(st.waveT*14)*10,52];wide=1}
    if(st.point){const d=st.point==='left'?-1:1;const up=st.point==='up';hL=d<0&&!up?[30,120]:hL;hR=up?[150,40]:d>0?[170,120]:hR;px=up?0:d*4;py=up?-5:1;rot=up?0:d*5}
    if(p){ if(p==='smile'){wide=1;happy=false}else if(p==='tube'){wide=-1}else if(p==='open'){open=1;wide=0}else if(p==='puff'){puff=1.32;wide=-.2}
      else if(p==='eyes'){shut=true}else if(p==='brows'){br=7;eye=1.12}
      else if(POINT[p]){hR=POINT[p];if(p==='ear'||p==='head')rot=-5}
      else if(p==='shoulder'){hL=[68,128];hR=[132,128]}else if(p==='wave'){hR=[158+Math.sin(t*10)*11,50];wide=1}
      else if(p==='clap'){const c=Math.abs(Math.sin(t*6))*20;hL=[94-c,150];hR=[106+c,150];wide=.9}
      else if(p==='armsup'){hL=[44,62];hR=[156,62];wide=1}else if(p==='squat'){sq=(Math.sin(t*3.2)*.5+.5)*.16} }
    /* действия («Что делает Шарик?») */
    let zzz=false,sway=0;const a=st.act;
    if(a==='sleep'){shut=true;rot=13;hy=6;sq=.05+Math.sin(t*1.6)*.015;zzz=true;wide=.2}
    else if(a==='eat'){const c=Math.sin(t*7);hR=[112,112+c*5];open=.25+.35*(c>0?c:0);wide=.3}
    else if(a==='jump'){if(st.jumpT>.75)st.jumpT=0;hL=[50,96];hR=[150,96];wide=1}
    else if(a==='wave'){hR=[158+Math.sin(t*10)*11,50];wide=1}
    else if(a==='dance'){sway=Math.sin(t*5)*9;hL=[46,100+Math.sin(t*5)*26];hR=[154,100-Math.sin(t*5)*26];wide=1;happy=true}
    else if(a==='wash'){hR=[126+Math.cos(t*8)*7,92+Math.sin(t*8)*7];shut=true;wide=.8}
    /* речь */
    if(st.vis&&MOUTHS[st.vis]){open=MOUTHS[st.vis][0];wide=MOUTHS[st.vis][1]}
    else if(st.talk){open=st.lvlOn?Math.min(1,.12+st.lvl*1.15):.2+.5*Math.abs(Math.sin(t*9.5))*(.6+.4*Math.sin(t*3.1));if(wide>.6)wide=.6}
    /* кивок «да» и «нет» */
    if(st.nodT<1.4)hy+=Math.sin(st.nodT*13)*7*(1-st.nodT/1.4);
    if(st.shakeT<1.4){hx=Math.sin(st.shakeT*13)*8*(1-st.shakeT/1.4);rot+=hx*.4}
    /* моргание */
    blink-=dt;if(blink<0){blinkT=0;blink=2.5+Math.random()*3.5}blinkT+=dt;if(blinkT<.14)eye=Math.min(eye,.08);
    /* прыжок */
    const jy=st.jumpT<.6?-Math.sin(st.jumpT/.6*Math.PI)*22:0;
    cur.hL=[lerp(cur.hL[0],hL[0],k),lerp(cur.hL[1],hL[1],k)];cur.hR=[lerp(cur.hR[0],hR[0],k),lerp(cur.hR[1],hR[1],k)];
    cur.rot=lerp(cur.rot,rot,k);cur.hy=lerp(cur.hy,hy,k);cur.hx=lerp(cur.hx,hx,k*1.6);cur.sq=lerp(cur.sq,sq,k);cur.open=lerp(cur.open,open,Math.min(1,k*2.2));cur.wide=lerp(cur.wide,wide,k*1.5);
    cur.eye=lerp(cur.eye,eye,Math.min(1,k*3));cur.px=lerp(cur.px,px,k);cur.py=lerp(cur.py,py,k);cur.br=lerp(cur.br,br,k);cur.puff=lerp(cur.puff,puff,k);cur.earR=lerp(cur.earR,earR,k);cur.jy=jy;
    cur.tail=Math.sin(t*(m==='praise'?9:2.2))*(m==='praise'?12:6);
    /* применить */
    const sy=1-cur.sq,land=st.jumpT>.6&&st.jumpT<.78?.05:0;
    P.zzz.style.display=zzz?'':'none';if(zzz)P.zzz.setAttribute('opacity',(.55+.45*Math.sin(t*2.4)).toFixed(2));
    cur.sway=lerp(cur.sway||0,sway,k);
    P.all.setAttribute('transform',`rotate(${cur.sway.toFixed(2)} 100 205) translate(0 ${(cur.jy+208*(cur.sq+land)).toFixed(2)}) translate(100 0) scale(${(1+cur.sq*.5+land).toFixed(3)} ${(sy-land).toFixed(3)}) translate(-100 0)`);
    P.tail.setAttribute('transform',`rotate(${cur.tail.toFixed(2)} 136 190)`);
    P.body.setAttribute('transform',`translate(0 ${(Math.sin(t*1.8)*.6).toFixed(2)})`);
    P.head.setAttribute('transform',`translate(${cur.hx.toFixed(2)} ${cur.hy.toFixed(2)}) rotate(${cur.rot.toFixed(2)} 100 122)`);
    P.earR.setAttribute('transform',`rotate(${(cur.earR+Math.sin(t*2.3)*1.5).toFixed(2)} 130 48)`);P.earL.setAttribute('transform',`rotate(${(Math.sin(t*2.1+1)*1.5).toFixed(2)} 70 48)`);
    P.chL.setAttribute('transform',`translate(82 100) scale(${cur.puff.toFixed(3)}) translate(-82 -100)`);P.chR.setAttribute('transform',`translate(118 100) scale(${cur.puff.toFixed(3)}) translate(-118 -100)`);
    const hid=happy||shut;P.eyes.style.display=hid?'none':'';P.happy.style.display=happy&&!shut?'':'none';P.shut.style.display=shut?'':'none';
    if(!hid){P.eyeL.setAttribute('transform',`translate(80 76) scale(1 ${cur.eye.toFixed(3)}) translate(-80 -76)`);P.eyeR.setAttribute('transform',`translate(120 76) scale(1 ${cur.eye.toFixed(3)}) translate(-120 -76)`);
      for(const u of P.pups)u.setAttribute('transform',`translate(${cur.px.toFixed(2)} ${cur.py.toFixed(2)})`)}
    P.brL.setAttribute('transform',`translate(0 ${(-cur.br).toFixed(2)})`);P.brR.setAttribute('transform',`translate(0 ${(-cur.br).toFixed(2)})`);
    const key=(Math.round(cur.open*20))+'|'+(Math.round(cur.wide*10));if(key!==mKey){mKey=key;P.mouth.innerHTML=mouthSvg(cur.open,cur.wide)}
    /* лапы рисуются поверх головы и не наклоняются вместе с ней */
    arm(P.armL,SH.L,cur.hL,-1);arm(P.armR,SH.R,cur.hR,1);
    if(st.item){P.item.setAttribute('x',cur.hR[0].toFixed(1));P.item.setAttribute('y',(cur.hR[1]+8).toFixed(1))}
  }
  frame(performance.now());raf=requestAnimationFrame(frame);
  box._kill=()=>{st.alive=false;cancelAnimationFrame(raf)};
  const h={
    mood(m){if(st.mood!==m){st.mood=m;st.moodT=0}if(m==='praise')h.jump();if(m==='invite')h.wave();return h},
    talk(on){st.talk=!!on;if(!on){st.vis=null;st.lvl=0;st.lvlOn=false}return h},
    pose(p){st.pose=p||null;return h},
    viseme(v){st.vis=v||null;return h},
    level(v){st.lvl=Math.max(0,+v||0);st.lvlOn=st.talk&&st.lvl>=0;return h},
    jump(){st.jumpT=0;return h},wave(){st.waveT=0;return h},
    point(dir){st.point=dir||null;return h},      /* 'up' | 'left' | 'right' | null — показать лапой на картинку */
    nod(){st.nodT=0;return h},shake(){st.shakeT=0;return h},
    act(a){st.act=a||null;return h},              /* 'sleep' | 'eat' | 'jump' | 'wave' | 'dance' | 'wash' | null — что герой делает */
    /* v48: одежда (рисуется кодом поверх кота): 'hat' шапка, 'glasses' очки, 'socks' носки, 'scarf' шарф (по умолчанию надет) */
    wear(k,on){const e=k==='scarf'?box.querySelector('.c-scarf'):box.querySelector('.w-'+k);if(e)e.style.display=on?'':'none';return h},
    worn(k){const e=k==='scarf'?box.querySelector('.c-scarf'):box.querySelector('.w-'+k);return !!e&&e.style.display!=='none'},
    scarfColor(c,c2){const g=box.querySelector('.c-scarf');if(g){g.children[1].setAttribute('fill',c);g.children[0].setAttribute('fill',c2||c)}return h}, /* «Какой шарф?» */
    teeth(on){box.querySelector('.w-teeth').style.display=on?'':'none';P.mouth.style.display=on?'none':'';return h}, /* «Где у Шарика зубы?» — широкая улыбка с зубами */
    hold(ch){st.item=ch||'';P.item.textContent=st.item;P.item.style.display=st.item?'':'none';return h}, /* предмет в лапе (значок) */
    onPart(fn){box.querySelector('svg').style.pointerEvents='auto';box.onclick=e=>{const p=e.target.closest&&e.target.closest('[data-part]');fn(p?p.getAttribute('data-part'):null,e)};return h}, /* нажатие на часть тела */ /* «да» и «нет» головой */
    unmount(){st.alive=false;cancelAnimationFrame(raf);box.remove()},
    get active(){return st.alive&&box.isConnected},
    kind:'cat'};
  return h}
window.Cat2D={mount,svg,supported:()=>true,version:1};
})();
