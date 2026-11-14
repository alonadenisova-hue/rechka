/* «Речка»: «Играем с Шариком» (версия 46) — задания, где сам герой и есть упражнение. Герой крупно в центре,
   Лев общается с ним напрямую: смотрит, что он делает, трогает его, кормит, сажает на стол и под стол, зовёт голосом.
   Приёмы логопеда (docs/logoped/2026-11-zanyatiya.md): вопрос с выбором из двух («спит или ест?», верный ответ то первым,
   то вторым), образец из двух слов («Шарик спит.»), фразы через «я» («Я ем рыбу.»), предлоги на / под, части тела
   «у него — у тебя», вызывание голоса (позвал — герой прибежал). Речь не оценивается: засчитывается любой голос,
   всегда есть кнопка для мамы. Игра выключается в «Для взрослых» → «Шарик». Значки предметов — обычные эмодзи телефона. */
const HG_CSS=`
.hg{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;height:100%}
.hg .hgcat{flex:1;min-height:120px;width:100%;position:relative;transition:transform .7s cubic-bezier(.3,1.4,.5,1)}
.hg .hgcat.far{transform:scale(.38) translateY(-40%)}
.hg .hgrow{flex:none;display:flex;gap:12px;justify-content:center;width:100%}
.hg .hgopt{flex:1;max-width:170px;aspect-ratio:1;border:0;border-radius:24px;background:#fff;box-shadow:0 6px 0 var(--line);font-size:clamp(44px,13vw,72px);line-height:1;padding:0;position:relative;overflow:hidden}
.hg .hgopt.good{box-shadow:0 0 0 6px var(--leaf),0 6px 0 var(--line)}
.hg .hgopt.hint{box-shadow:0 0 0 6px var(--sun),0 6px 0 var(--line)}
.hg .hgopt.bad{animation:hgshake .4s}
@keyframes hgshake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.hg .shear{display:flex;align-items:center;gap:10px;height:40px;opacity:0;transition:opacity .3s;flex:none}
.hg .shear.on{opacity:1}.hg .shear svg{width:32px;height:32px}
.hg .shear .lv{width:110px;height:12px;border-radius:6px;background:#e7e3f7;overflow:hidden}
.hg .shear .lv i{display:block;height:100%;width:0;background:#7b61ff;border-radius:6px;transition:width .08s}.hg .shear .lv i.on{background:#3cbf7a}
.hg .hgmom{flex:none}
.hg .hgscene{flex:1;min-height:200px;width:100%;position:relative}
.hg .hgscene .tbl{position:absolute;left:24%;top:47%;width:52%;height:50%}
.hg .hgscene .hgcat{position:absolute;flex:none;min-height:0;width:34%;height:44%;transition:left .6s,top .6s}
.hg .hgscene .hgcat.side{left:2%;top:54%}
.hg .hgscene .hgcat.on{left:33%;top:5%}
.hg .hgscene .hgcat.under{left:33%;top:55%}
.hg .hgscene .zone{position:absolute;left:20%;width:60%;border:4px dashed #7b61ff66;border-radius:22px;background:#7b61ff10}
.hg .hgscene .zone.on{top:0;height:46%}.hg .hgscene .zone.under{top:54%;height:44%}
.hg .hgscene .zone.hint{border-color:var(--sun);background:#ffc93c33}
`;
document.head.insertAdjacentHTML('beforeend','<style>'+HG_CSS+'</style>');
const HG_ACTS=[['sleep','спит'],['eat','ест'],['jump','прыгает'],['wave','машет'],['dance','танцует'],['wash','моется']];
const HG_ITEMS=[['🐟','рыбу','рыба',1],['🥛','молоко','молоко',1],['🧀','сыр','сыр',1],['🍎','яблоко','яблоко',1],['🍌','банан','банан',1],['🥕','морковку','морковка',1],['⚽','мяч','мяч',0],['🧸','мишку','мишка',0]]; /* значок, «дай…», «это…», съедобное */
const HG_PARTS={1:['ухо','хвост','нос','лапа'],2:['ухо','хвост','нос','лапа','глаз','рот','живот']};
const HG_MY={ухо:'моё',лапа:'моя'};const HG_POSE={нос:'nose',ухо:'ear',глаз:'eye',рот:'mouth',живот:'belly'};
const HG_TABLE='<svg class="tbl" viewBox="0 0 300 150" preserveAspectRatio="none"><rect x="6" y="6" width="288" height="26" rx="10" fill="#c98b4e" stroke="#5b3a22" stroke-width="4"/><rect x="24" y="32" width="20" height="112" rx="6" fill="#a86f3a" stroke="#5b3a22" stroke-width="4"/><rect x="256" y="32" width="20" height="112" rx="6" fill="#a86f3a" stroke="#5b3a22" stroke-width="4"/></svg>';
function hgOn(){return S.hgOn!==false&&!!window.Cat2D}
/* поставить героя (всегда рисованный кот: только он умеет действия и нажатия) */
function hgCat(el,opt){const h=Cat2D.mount(el,opt);el.classList.add('is3d');el._s3=h;return h}
async function catRound(lvl){
  const R=G.round,mine=G;lvl=lvl||1;
  /* v48: «Привет» первым заданием, «Пока» последним, перерыв каждым пятым (не в «Занятии с Шариком») */
  const own=!G.sharik&&!G.plan,last=G.i>=(G.max||S.rounds)-1;
  const first=own&&G.i===0&&!G.hgSeq&&hgK('hello');
  if(!G.hgSeq||!G.hgSeq.length){const all=hgKinds(lvl);if(!all.length)all.push('do');let q,t=0;do{q=shuffle(all.slice())}while(q[q.length-1]===G.hgLast&&all.length>1&&t++<20);G.hgSeq=q}
  let mode=first?'hello':own&&last&&hgK('hello')?'bye':own&&G.i%5===4&&!last&&hgK('rest')?'rest':G.hgSeq.pop();G.hgLast=mode;
  if(window.HGT&&(HGT[mode]||mode==='rest'))return hgtRound(mode,lvl); /* новые задания — app/js/hero-tasks.js */
  const st=$('#stage');stageAnim&&stageAnim();
  st.innerHTML=`<div class="hg">${mode==='where'?`<div class="hgscene"><div class="zone on"></div><div class="zone under"></div>${HG_TABLE}<div class="hgcat side"></div></div>`:'<div class="hgcat"></div>'}<div class="hgrow"></div><div class="shear" aria-hidden="true">${EAR}<span class="lv"><i></i></span></div></div>`;
  const box=st.firstChild,cel=box.querySelector('.hgcat'),row=box.querySelector('.hgrow'),cat=hgCat(cel);
  const dead=()=>R.dead||G!==mine||G.round!==R;
  const hsay=t=>shSpeak(t,cel,{game:true});
  const good=async(text,meta)=>{sfx.good();confetti(60);cat.mood('praise');R.good=text;await hsay(pick(PRAISE)+' '+text);if(dead())return;
    /* образец сказан — герой слушает; любой голос — радость (точность не оценивается) */
    if(shVoiceOn()&&meta.m!=='call'){cat.mood('listen');const v=await shListen(box,mine);if(dead())return;if(v){sfx.good();confetti(30);cat.mood('praise');await hsay(pick(['Ух ты! Ты сказал!','Я тебя слышу! Здорово!','Вот это голос!']));if(dead())return}}
    await wait(300);if(dead())return;return roundDone(R.wrong===0,meta)};
  const miss=async(text,el)=>{R.wrong++;if(el){el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad')}cat.mood('comfort');await wait(sfx.bad());if(dead())return;await hsay(text)};
  /* выбор из карточек: opts [{html|mount, ok, wrongText}] */
  const cards=(opts,onHint)=>new Promise(res=>{let lock=false;opts=shuffle(opts);
    opts.forEach(o=>{const b=document.createElement('button');b.className='hgopt';if(o.html)b.innerHTML=o.html;row.append(b);if(o.mount)o.mount(b);
      b.onclick=async()=>{if(lock||dead())return;lock=true;
        if(o.ok){b.classList.remove('hint');b.classList.add('good');res(o)}
        else{await miss(o.wrongText,b);if(R.wrong>=2){[...row.children].forEach((c,i)=>opts[i].ok&&c.classList.add('hint'));onHint&&onHint()}lock=false}}})});

  if(mode==='do'){ /* «Что делает Шарик?» — выбор из двух, образец из двух слов */
    const pool=HG_ACTS.slice(0,lvl>=3?6:lvl>=2?5:3),t=fresh(()=>pick(pool),x=>'hgdo'+x[0]);let o;do{o=pick(pool)}while(o===t);
    const q=rmode('hgdo',2)===0?`Шарик ${t[1]} или ${o[1]}?`:`Шарик ${o[1]} или ${t[1]}?`;
    setPrompt('Что делает Шарик?');cat.act(t[0]);if(t[0]==='eat')cat.hold('🐟');
    await wait(900);if(dead())return;await say0('Что делает Шарик? '+q);if(dead())return; /* спрашивает голос за кадром: герой занят делом */
    const mk=a=>({ok:a===t,wrongText:`Тут Шарик ${a[1]}. Посмотри на меня! ${q}`,mount:b=>{const m=Cat2D.mount(b);m.act(a[0]);if(a[0]==='eat')m.hold('🐟')}});
    await cards([mk(t),mk(o)]);if(dead())return;cat.act(null).hold('');
    return good(`Шарик ${t[1]}.`,{m:'do',n:t[1]})}

  if(mode==='give'){ /* «Дай Шарику…» — понимание просьбы, фраза через «я» */
    const items=shuffle(HG_ITEMS.slice()).slice(0,Math.min(4,lvl+1)),t=items[0];
    setPrompt('Дай Шарику '+t[1]+'!');cat.mood('invite');await wait(400);if(dead())return;
    const q=`Дай мне ${t[1]}!`;await hsay(pick(['Я хочу ','Мне нужно ','Хочу '])+t[1]+'! '+q);if(dead())return;cat.mood('calm');
    await cards(items.map(it=>({html:it[0],ok:it===t,wrongText:`Это ${it[2]}. ${q}`})),()=>cat.point&&cat.point('up'));if(dead())return;
    cat.point(null).hold(t[0]).act(t[3]?'eat':'dance');
    return good(t[3]?`Я ем ${t[1]}.`:'Я играю!',{m:'give',n:t[2]}).then(()=>{cat.hold('').act(null)})}

  if(mode==='part'){ /* «Покажи, где у Шарика…» — нажать на героя */
    const pool=HG_PARTS[lvl>=2?2:1],t=fresh(()=>pick(pool),x=>'hgp'+x),q=`Где у меня ${t}?`;
    setPrompt('Где у Шарика '+t+'?');await wait(400);if(dead())return;await hsay('Покажи! '+q);if(dead())return;
    await new Promise(res=>{let lock=false;cat.onPart(async p=>{if(lock||dead()||!p)return;lock=true;
      if(p===t){res();return}
      await miss(`Это ${p}. ${q}`);if(R.wrong>=2)HG_POSE[t]?cat.mood('calm').pose(HG_POSE[t]):cat.wave();lock=false})});
    if(dead())return;cat.pose(null);
    return good(`Это ${HG_MY[t]||'мой'} ${t}.`,{m:'part',n:t})}

  if(mode==='where'){ /* «Посади Шарика на стол / под стол» — предлоги действием */
    const p=fresh(()=>pick(['на','под']),x=>'hgw'+x+(G.i%2)),want=p==='на'?'on':'under',txt=x=>x==='on'?'на стол':'под стол',done=x=>x==='on'?'на столе':'под столом';
    setPrompt('Посади Шарика '+txt(want)+'!');await wait(400);if(dead())return;const q=`Посади меня ${txt(want)}!`;await hsay(q);if(dead())return;
    await new Promise(res=>{let lock=false;for(const z of box.querySelectorAll('.zone'))z.onclick=async()=>{if(lock||dead())return;lock=true;const k=z.classList.contains('on')?'on':'under';
      cel.classList.remove('side','on','under');cel.classList.add(k);cat.jump();await wait(700);if(dead())return;
      if(k===want){res();return}
      await miss(`Ой, я ${done(k)}. ${q}`);if(dead())return;cel.classList.remove('on','under');cel.classList.add('side');if(R.wrong>=2)box.querySelector('.zone.'+want).classList.add('hint');lock=false}});
    if(dead())return;for(const z of box.querySelectorAll('.zone'))z.style.visibility='hidden';
    return good(`Шарик ${done(want)}.`,{m:'where',p,n:done(want)})}

  /* mode==='call': «Позови Шарика!» / «Скажи как Шарик» — вызывание голоса; любой звук засчитывается, есть кнопка мамы */
  const sleepy=rmode('hgcall',2)===0,word=pick(['Мяу!','Мур-мур!','Кис-кис!','Ам!']);
  row.insertAdjacentHTML('beforeend','<button class="big-btn hgmom">'+(sleepy?'Позвал ✓':'Получилось ✓')+'</button>');
  let how=null,fin=null;const got=new Promise(r=>fin=r);row.querySelector('.hgmom').onclick=()=>{ac();how=how||'parent';fin()};
  if(sleepy){setPrompt('Позови Шарика!');cat.act('sleep');cel.classList.add('far');cel.onclick=()=>{how=how||'tap';fin()};
    await wait(700);if(dead())return;await say0('Шарик спит. Позови его: Шарик!');if(dead())return}
  else{setPrompt('Скажи как Шарик!');await wait(400);if(dead())return;cat.viseme('a');await hsay(word);cat.viseme(null);if(dead())return;await hsay('Теперь ты!');if(dead())return}
  (async()=>{for(let k=0;k<4&&!how&&shVoiceOn();k++){if(!sleepy)cat.mood('listen');const v=await shListen(box,mine);if(dead()||how)return;if(v){how='voice';fin();return}
      if(k===1){await say0(sleepy?'Позови громко: Шарик!':'Скажи: '+word);if(dead())return}}})();
  await got;if(dead())return;VM.stop();R.mirrHow=how;
  cel.classList.remove('far');cel.onclick=null;cat.act(null);row.innerHTML='';
  sfx.good();confetti(70);cat.mood('praise');R.good=sleepy?'Я тут!':word;
  await hsay(sleepy?pick(['Мяу! Я тут! Ты меня позвал!','Я проснулся! Привет!','Я бегу к тебе! Мяу!']):pick([word+' Здорово!','Ты как я! '+word,'Ух ты! '+word]));if(dead())return;
  await wait(300);if(dead())return;return roundDone(true,{m:'call',n:sleepy?'позови':word,how:how==='voice'?'voice':'parent'})}
