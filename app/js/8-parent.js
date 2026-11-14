/* «Речка»: главный экран, настройки, раздел для взрослых, запуск приложения.
   Часть кода приложения (раньше — один большой <script> в index.html). Файлы подключаются по порядку
   в index.html и делят общие переменные; порядок важен. */
/* таблица всех игр: ключ плитки → функция раунда (функции объявлены в файлах 1–7) */
const ROUNDS={cat:catRound,mirr:mirrRound,body:bodyRound,home:homeRound,draw:drawRound,not:notRound,give:giveRound,dog:dogRound,voice:voiceRound,make:makeRound,rh:rhRound,pg:pgRound,br:brRound,dogs:dogsRound,tr:trRound,yn:ynRound,nes:nesRound,sl:slRound,ib:ibRound,food:foodRound,seq:seqRound,want:wantRound,num:numRound,world:worldRound,dress:dressRound,catch:catchRound,bal:balRound,odd:oddRound,verb:verbRound,color:colorRound,feed:feedRound,prep:prepRound,pair:pairRound,size:sizeRound,snd:sndRound,syl:sylRound,me:meRound,word:wordRound,dai:daiRound,many:manyRound,fly:flyRound,put:putRound};
/* ---------- главный экран и настройки v21 */
function applyV21Home(){{const sb=$('#btn-sharik');if(sb){sb.hidden=!shOn();const ic=sb.querySelector('.shico');if(ic&&ic.dataset.hero!==heroKind()){ic.dataset.hero=heroKind();ic.innerHTML=heroSvg()}}}{const bt=$('.tile[data-game="body"]');if(bt)bt.hidden=S.bodyOn===false}{const ct=$('.tile[data-game="cat"]');if(ct){ct.hidden=!hgOn();const a=ct.querySelector('.art');if(a&&!a.innerHTML&&window.Cat2D)a.innerHTML=Cat2D.svg()}}{const mt=$('.tile[data-game="mirr"]');if(mt)mt.hidden=S.mirrOn===false}const vt=$('.tile[data-game="voice"]');if(vt)vt.hidden=true;const wb=$('#btn-wb');if(wb)wb.hidden=!S.wbOn;
  $('#home .toprow').classList.toggle('three',!!S.wbOn)}
let vthrTest=false;
function renderV21Parent(){
  $('#set-voicegame').checked=S.voiceGame;$('#set-sylmic').checked=S.sylMic;$('#set-vthr').value=S.vthr;$('#vthr-out').textContent=S.vthr.toFixed(3);
  $('#set-vidfreq').value=S.vidFreq;$('#set-mirror').checked=S.mirror;$('#set-sayrec').checked=S.sayRec;$('#set-sayit').value=S.sayit;$('#set-tip').checked=S.tipOn;
  $('#v21-mic').textContent=MICX===false?'Микрофон недоступен: игра «Скажи — и будет!» скрыта, уровень 5 «Слогов» не включается.':'';
  renderVid();renderWBEdit()}
function v21Wire(){
  $('#set-voicegame').onchange=e=>{S.voiceGame=e.target.checked;save();applyV21Home()};
  $('#set-sylmic').onchange=e=>{S.sylMic=e.target.checked;save()};
  $('#set-vthr').oninput=e=>{S.vthr=+e.target.value;$('#vthr-out').textContent=S.vthr.toFixed(3);$('#vthr-line').style.left=Math.min(100,S.vthr/.2*100)+'%';save()};
  $('#vthr-test').onclick=async()=>{if(vthrTest){vthrTest=false;VM.stop();$('#vthr-test').textContent='Слушать';return}
    if(!await VM.start()){$('#v21-mic').textContent='Микрофон недоступен. Разрешите доступ к микрофону.';return}vthrTest=true;$('#vthr-test').textContent='Стоп';
    const bar=$('#vthr-bar');const det=segDetector(()=>{$('#vthr-hit').textContent='сработал!';setTimeout(()=>$('#vthr-hit').textContent='',700)});
    VM.cb=(v,t)=>{$('#vthr-line').style.left=Math.min(100,vthr()/.2*100)+'%';bar.style.width=Math.min(100,v/.2*100)+'%';bar.classList.toggle('on',v>vthr());det(v,t)}};
  $('#set-vidfreq').onchange=e=>{S.vidFreq=e.target.value;save()};
  $('#set-mirror').onchange=e=>{S.mirror=e.target.checked;save()};
  $('#set-sayrec').onchange=e=>{S.sayRec=e.target.checked;save()};
  $('#set-tip').onchange=e=>{S.tipOn=e.target.checked;save()};
  $('#set-wbon').onchange=e=>{S.wbOn=e.target.checked;save();applyV21Home()};
  $('#set-body').onchange=e=>{S.bodyOn=e.target.checked;save();applyV21Home()};
  $('#set-mirr').onchange=e=>{S.mirrOn=e.target.checked;save();applyV21Home()};
  $('#set-wbask').onchange=e=>{S.wbAsk=e.target.checked;save()};
  $('#set-wbn').onchange=e=>{S.wb.n=+e.target.value;save();renderWBEdit()};
  $('#wb-add').onclick=()=>{wbInit();S.wb.cards.push({id:'c'+Date.now().toString(36),t:'Хочу …',w:null});save();renderWBEdit();const ins=document.querySelectorAll('[data-wbt]');const i=ins[ins.length-1];if(i){i.focus();i.select()}};
  document.querySelectorAll('[data-vidtab]').forEach(b=>b.onclick=()=>{vidtab=b.dataset.vidtab;renderVid()});
  $('#vid-own').onclick=async()=>{const t=$('#vid-own-t').value.trim();if(!t)return;await recordVideo(t.replace(/[.!?]+$/,''));$('#vid-own-t').value='';vidtab='mine';renderVid()};
  $('#btn-wb').onclick=async()=>{ac();await Promise.race([say('Хочу!'),wait(1200)]);openWB()};
  $('#wb-home').onclick=()=>{wbGen++;stopVoice();renderHome()};
  $('#pn-v21').addEventListener('toggle',e=>{if(!e.target.open&&vthrTest){vthrTest=false;VM.stop();$('#vthr-test').textContent='Слушать'}});
}
/* статистика v21 */
function v21Stats(L){let h='';const esc=s=>String(s).replace(/</g,'&lt;');
  const V=L.filter(x=>x.g==='voice');if(V.length){const m={};V.forEach(x=>{const r=m[x.m]=m[x.m]||[0,0,0,0];r[0]++;r[1]+=x.hits||0;r[2]+=x.hints||0;r[3]+=x.ok?1:0});
    h+=`<h3 style="margin-top:10px">Скажи — и будет!</h3><div class="tablewrap"><table><tr><th>Сцена</th><th>Раз</th><th>Сработал голос</th><th>Подсказок</th></tr>${Object.entries(m).map(([k,r])=>`<tr><td>${VG_RU[k]||k}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table></div>`}
  const SS=L.filter(x=>x.g==='syl'&&x.m==='сам');if(SS.length){const full=SS.filter(x=>x.k1>=x.n).length;h+=`<h3 style="margin-top:10px">Слоги: «Скажи сам»</h3><p class="note">Попыток: ${SS.length}. Барабан насчитал все слоги с первого раза: ${full}. Последние: ${SS.slice(-6).map(x=>esc(x.w)+' '+(x.k1??0)+(x.k2!=null?'→'+x.k2:'')+' из '+x.n).join(', ')}.</p>`}
  const MK=L.filter(x=>x.g==='make');if(MK.length){const m={};MK.forEach(x=>{const k='уровень '+x.l;(m[k]=m[k]||[0,0])[0]++;if(x.ok)m[k][1]++});
    const why={};MK.forEach(x=>(x.picks||[]).forEach(p=>why[p]=(why[p]||0)+1));
    h+=`<h3 style="margin-top:10px">Сделай как скажу</h3><div class="tablewrap"><table><tr><th></th><th>Попыток</th><th>Сразу верно</th></tr>${Object.entries(m).sort().map(([k,r])=>`<tr><td>${k}</td><td>${r[0]}</td><td>${Math.round(r[1]/r[0]*100)}%</td></tr>`).join('')}</table></div>${Object.keys(why).length?`<p class="note">Ошибки: ${Object.entries(why).sort((a,b)=>b[1]-a[1]).map(([k,n])=>k+' — '+n).join(', ')}</p>`:''}`}
  const VD=L.filter(x=>x.g==='vid');if(VD.length){const m={};VD.forEach(x=>m[x.n]=(m[x.n]||0)+1);h+=`<h3 style="margin-top:10px">Видеообразец</h3><p class="note">Показано ${VD.length} раз: ${Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,n])=>'«'+esc(k)+'» '+n).join(', ')}</p>`}
  const WB=L.filter(x=>x.g==='wb');if(WB.length){const m={};WB.forEach(x=>m[x.n]=(m[x.n]||0)+1);
    h+=`<h3 style="margin-top:10px">Хочу (что Лев просил сам)</h3><p class="note">${Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,n])=>esc(k)+' — '+n).join('<br>')}</p><p class="note">Последние: ${WB.slice(-8).reverse().map(x=>esc(x.n)+' '+new Date(x.t).toLocaleString('ru-RU',{weekday:'short',hour:'2-digit',minute:'2-digit'})).join('; ')}</p>`}
  const week=Date.now()-7*864e5,TL=(S.tipLog||[]).filter(x=>x.at>week);if(TL.length)h+=`<h3 style="margin-top:10px">Сегодня дома</h3><p class="note">Подсказок: ${TL.length}, сделали: ${TL.filter(x=>x.done).length}.${TL.filter(x=>x.done).length?'<br>Сделали: '+TL.filter(x=>x.done).slice(-5).map(x=>'«'+esc(x.t.replace(/\{name\}/g,S.name||'Лев').slice(0,60))+'…»').join('<br>'):''}</p>`;
  return h}

/* ---------- parent area */
const GN={cat:'Играем с Шариком (что делает, нос, дай, одень, прячется, покорми, да — нет…)',mirr:'Зеркало с Шариком (камера: гимнастика, «покажи на себе»)',body:'Покажи, где… (части тела)',home:'Собака дома',draw:'Дорисуй',not:'Что не…?',dog:'Повторяй за Шариком (звуки, слоги, слова)',give:'Держит или даёт?',voice:'Скажи — и будет!',rh:'Час пик',pg:'Пингвины на льдине',tr:'Летит, едет, плывёт',yn:'Да или нет?',nes:'Несёт — держит',sl:'Спит — лежит',ib:'Идёт, бежит, стоит, сидит',food:'Съедобное — несъедобное',odd:'Другой / одинаковые',verb:'Кто что делает',color:'Цвета',feed:'Покорми',prep:'Где? В или на',pair:'Похожие действия (все пары)',size:'Большой — маленький, один — много',snd:'Кто как говорит?',syl:'Слоги',me:'Я',word:'Что это? (предметы)',dai:'Дай — на',many:'Один — много',put:'Положи (на, под, в)',bal:'Шарики',seq:'Повтори!',want:'Я хочу',num:'Цифры',world:'Что это? (вещи, животные, еда)',dress:'Одень мальчика',catch:'Лови!'};
const LVLDESC={
  cat:['что делает (спит, ест, прыгает); где у Шарика нос; дай из двух; позови; одень (из двух); прячется в / за; большой — маленький; покорми «ам»; да — нет с кивком; части тела по цепочке; какой шарф, мяч; привет — пока, перерыв','+ танцует, машет; посади на стол / под стол; одень из трёх, «сними»; прячется ещё на; один — много; «открой рот»; я — ты — он; положи на / под; ритмические ряды; усы, голова; дом','+ моется; дай и одень из четырёх; прячется ещё под; «Кто под столом — Шарик или мишка?»'],mirr:['улыбка, «а-а-а», трубочка, глазки','ещё щёки, брови, нос, рот, рука на голове','покажи на себе: нос, рот, глаз, ушко, щёчка, голова + гимнастика','всё тело и движения: живот, нога, коленка, плечи, помаши, хлопни, руки вверх, присядь (если выключено — как уровень 3)'],body:['голова, рука, нога, живот','ещё глаз, нос, рот, ухо','ещё волосы, шея, ладошка, колено'],
  dog:['звуки животных («му-у», «гав»), слоги («па-па»), ряды из 2 слов','+ «Хочу банан!»','слоги по 3, ряды из 4 слов (3 тип)','ряды 5 типа из 2 слов','ряды 5 типа из 4 слов','ряды 5 типа из 6 слов'],
  voice:['любой звук — шарик надувается, животное отвечает, машина едет, свечка гаснет, попугай повторяет','звук дольше полсекунды («у-у-у», «р-р-р»)','два звука подряд с паузой («ав-ав», «би-би»)'],
  make:['«Положи мяч в коробку» — 2 предмета, одно место','предмет + место из двух: «Положи кубик на стол»','цвет: «Положи красный мяч в коробку» — мячи разного цвета','размер и цвет: «Положи маленький красный мяч в коробку»','две коробки: «Положи синий кубик в большую коробку»','ПОД: «Положи мяч под стол» (стол и стул, под и на)'],
  rh:['поле 6×6: двигать машинки вперёд-назад, вывести красную к флажку. 21 уровень от 1 до 24 ходов, идут подряд сами'],
  pg:['задачи от 6 до 14 ходов на поле 5×5, потом 6×6; есть полыньи — въехал в полынью, пингвин падает, начинаем сначала; всегда надо сначала подвинуть другого пингвина'],
  br:['вид сбоку: поставить кубики, ступеньки и длинный брусок (детали падают вниз), чтобы мышка дошла до сыра. Мышка ходит по ровному и поднимается только по ступенькам. 22 уровня от 1 до 4 деталей'],
  dogs:['головоломка 4×4: двигать собачек, чтобы мячики упали в ямки. 27 уровней идут подряд сами (4 тренировочных с одной собачкой, 5 лёгких с двумя, 10 из буклета, 8 новых), за каждый — косточка, в конце — кубок. Стрелки ‹ › у счётчика шагов — выбрать уровень вручную'],
  tr:['«Что летит?» из 2 или перетащить одну картинку на небо, на дорогу, на речку','из 3 или одна картинка','разложить 3 картинки: на небо, на дорогу, на речку','разложить 5 картинок; иногда выбор из 4'],
  yn:['«Это коза?» — на картинке совсем другое (мяч, машина…) или правда коза; вверху ДА, внизу НЕТ, можно смахнуть картинку','похожее: «Это корова?» на картинке коза, «Это ложка?» — вилка'],
  nes:['«Кто несёт?» / «Кто держит?» из 2: несёт — идёт с предметом, держит — стоит и держит двумя руками (девочка, котик)','из 4','действие + предмет: «Кто держит книгу?», «Кто несёт мяч?» из 4'],
  home:['«Собака хочет спать» — 2 места: кровать, стол, дверь, ванна, телевизор','3 места + бассейн, туалет, рисовать','4 места + «Дай собаке миску / футболку»','6 мест, кошка, зайка, мишка, + чистить зубы, мыло'],
  draw:['дорисуй прямую: ствол, стебелёк, ниточку','дорисуй дугу: круг, ротик, крышу, хвостик','дорисуй несколько линий: лучики, колёса, ушки'],
  not:['«Кто не собака?», «Что не мяч?» — из 2','из 3','из 3 + «Что не красного цвета?»','из 4'],
  give:['«Кто даёт?» / «Кто держит?» из 2','из 4','«Кто даёт воду?» — 4 картинки «даёт», слушать предмет','«Кто держит ложку?», «Кто даёт траву?» — действие + предмет из 4'],
  sl:['пары со слайдов: «Кто спит?» и «Кто лежит?» на одной картинке, порядок вопросов меняется'],
  ib:['2 человечка: идёт / бежит / стоит / сидит — пары чередуются','3 человечка','4 человечка, разные люди','+ настоящие фото и мультики'],
  food:['знакомая еда (банан, яблоко, оладьи, пельмени, манго, вода): 1 еда + 1 вещь','2 + 2','3 + 3','картинки со слайдов «Буду — не буду»: 2 + 2','всё вместе: 3 еды + 3 вещи'],
  odd:['3 картинки, одна другая','4 картинки «Что не…»; одинаковые — фигуры','другая фигура; одинаковые — 6 картинок','отличие только в цвете или форме; одинаковые — 6 фигур'],
  verb:['«Кто бежит?» из 2, действия разные','из 2, похожие действия (идёт/бежит, сидит/стоит, лежит/спит)','из 4 картинок','фраза из 2 слов: «Где лиса бежит?» из 4','фраза из 3 слов: «Где корова ест сено?», «Где лиса сидит на стуле?» из 4'],
  color:['сначала лопнуть 4–5 шариков, цвет последнего — задание. «Где красный?» — разные предметы','«Где красный зонтик?» — 4 цвета','6 цветов','цвет + предмет из 4 (путаем и цвет, и предмет)','цвет + предмет из 6','все предметы одного цвета: «Где красное яблоко?» из 4'],
  prep:['оса: «Где оса в стакане?» из 2','дядя и транспорт: «Где дядя на автобусе?» из 2','оса, из 4: два предмета, в и на','оса и транспорт вместе, из 4','ПОД и НА, белочка: «Где белочка под стулом?» из 2','ПОД и НА, котёнок, из 2','ПОД и НА, из 4: два предмета мебели','всё вместе: в, на, под — из 4'],
  fly:['«Где муха?» — найди и покажи муху','«Где муха на ёлке?» из 2','из 4'],
  size:['«Что большое?» — слон и заяц, дом и котёнок, из 2','«Где большой дом?» — один предмет, большой и маленький','из 4: два предмета, большие и маленькие','из 6: три предмета','размер + цвет: «Где маленький красный мяч?» из 4'],
  pair:['стоит или идёт: животные, фото, из 2','стоит или сидит: животные, фото, из 2','идёт или бежит: люди (фото) и животные (анимация), из 2','спит или лежит: всегда «Кто спит?» (спящий тоже лежит), рисунки, из 2','все пары вперемешку, из 4'],
  snd:['«Кто так говорит?» — голос понятного животного (собака, кошка, корова, лошадь, свинья, коза, овца, курица, петух, утка, гусь, лягушка, медведь, слон), из 2','из 3','из 4'],
  syl:['1–2 слога: мяч, ли-са','2 слога','3 слога: со-ба-ка','всё вперемешку','«Скажи сам»: ребёнок говорит слово, барабан бьёт на каждый слог (нужен микрофон; без него — как уровень 4)'],
  me:['«Где ты ешь?» — 2 фото ребёнка','из 4 фото ребёнка','фото ребёнка среди животных, которые делают то же самое'],
  word:['«Где ведро?» — 2 реальных предмета','из 4','из 6','из 4 похожих: посуда, одежда, мебель, транспорт'],
  dai:['«Катя, дай!» — отдай предмет, «На!»','«Дай сыр!» — 3 раза отдать герою его еду','среди чужих предметов: найди нужный','«Дай синий клубок!» — по цвету, в конце «Скажи: на!»'],
  many:['один или много, из 2','из 4: два предмета, один и много','один — мало — много, из 3'],
  seq:['3 картинки в ряд: 5 секунд посмотреть, потом перенести на пустые места','4 картинки (часто и по 3)','5 картинок (часто и по 3)'],
  want:['голос просит «Хочу мишку!» — найти из 2 (еда, игрушки, «хочу в бассейн / в магазин / гулять», «включи мультик / пианино»)','из 3','из 4','из 6'],
  num:['предметы → цифра 1–3, «найди все единички»','+ цифра → предметы, «какая цифра спряталась?»','+ пальчики, цифры прячутся в траве и на дереве','1–5: предметы, найди все','1–5: столько же, пальчики, спряталась, в траве','соедини, обведи до конца, найди все','всё вперемешку, соседние числа'],
  world:['тема на выбор (животные, еда, дом, одежда, игрушки, природа, транспорт): «Где кошка?» из 2','из 4','из 6','из 6 похожих (фрукт к фрукту) + через раз «Что это?» — назвать самому','из 9'],
  dress:['«Дай мальчику кепку!» из 2','из 4 разных вещей','по цвету: «Дай мальчику синие шорты!» из 4','вещь + цвет вперемешку из 4'],
  catch:['«Лови банан!» — 3 штуки, медленно','«Лови фрукты!» — 4 штуки','5 штук, быстрее','фрукты среди овощей — быстро'],
  bal:['по очереди: «Лопни только красные!» (2 цвета), «Что внутри?» (из 2), ритмический ряд из 2: «лев — мышь»','4 цвета; «Что внутри?» из 4; ряд из 4 или слоги слова: ли-са','6 цветов; ряд из 6, как у логопеда: «лев — мышь — лев — мышь — лев — мышь» (3 тип) + «Скажи!»','похожие картинки в «Что внутри?»; ряды 5 типа: «кошка — лайка — кошка…»'],
  put:['всегда два места: «на стол или на стул?»; НА и В по очереди','НА, В и ПОД по очереди','ещё выбрать, что взять: «Положи машинку в коробку!» — рядом мяч','выбрать из трёх предметов'],
  feed:['2 вида еды, обычная еда (24 животных)','3 вида еды','3 вида, иногда необычная еда (слушать слово)','2 животных: выбрать еду, потом кого кормить']};
function renderParent(){
  const PV=[...new Set(D.animals.map(a=>a.n).concat(Object.keys(ONO)))].filter(n=>!['мальчик','девочка'].includes(n));
  $('#pet-voices').innerHTML=PV.map((n,k)=>`<button class="small-btn" data-pv="${k}"${hasSnd(n)?'':' style="opacity:.45"'}>${hasSnd(n)?'♪ ':''}${n}</button>`).join('');
  document.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>{ac();const n=PV[+b.dataset.pv];hasSnd(n)?animalSound({n}):say(cap(n)+'. Записи голоса пока нет.')});
  $('#set-sayit').value=S.sayit;$('#set-ask').checked=S.askFirst;$('#set-name').value=S.name||'';shSync();$('#set-myvoice').checked=S.myVoice;renderVoice();renderPhotos();renderLev();renderV21Parent();$('#pz-info').textContent=`Собрано пазлов: ${(S.pz.ph||[]).length}. Лабиринтов: ${S.mzN||0}.${S.pz.ready?' Пазл ждёт.':''}${S.pz.maze?' Лабиринт ждёт.':''}`;
  $('#set-voice').checked=S.voice;$('#set-bad').value=S.badSnd||'soft';$('#set-anim').checked=S.anim;$('#set-next').checked=S.nextBtn!==false;$('#set-rate').value=S.rate;$('#rate-out').textContent=S.rate.toFixed(2);$('#rounds-out').textContent=S.rounds;
  $('#levels').innerHTML=Object.keys(GN).map(g=>`<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><label><b>${GN[g]}</b><br><span class="note">${(LVLDESC[g]||[])[S.lvl[g]-1]||''}</span></label>
    <div class="stepper"><button data-ld="${g}" data-d="-1" aria-label="Ниже">−</button><output>${S.lvl[g]} из ${MAXL[g]}</output><button data-ld="${g}" data-d="1" aria-label="Выше">+</button></div></div>`).join('');
  document.querySelectorAll('[data-ld]').forEach(b=>b.onclick=()=>{const g=b.dataset.ld;S.lvl[g]=Math.min(MAXL[g],Math.max(1,S.lvl[g]+ +b.dataset.d));S.streak[g]=0;S.errs[g]=0;save();renderParent()});
  const week=Date.now()-7*864e5,L=S.log.filter(x=>x.t>week);
  const bar=p=>`<span class="barc ${p<.5?'low':p<.8?'mid':''}" style="width:${Math.max(4,p*80)}px"></span>${Math.round(p*100)}%`;
  const tbl=(title,rows)=>rows.length?`<h3 style="margin-top:10px">${title}</h3><div class="tablewrap"><table><tr><th></th><th>Попыток</th><th>Сразу верно</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${bar(r[2])}</td></tr>`).join('')}</table></div>`:'';
  const group=(arr,key)=>{const m={};arr.forEach(x=>{const k=x[key];if(!k)return;(m[k]=m[k]||[]).push(x)});return Object.entries(m).map(([k,v])=>[k,v.length,v.filter(y=>y.ok).length/v.length]).sort((a,b)=>a[2]-b[2])};
  if(!L.length){$('#stats').innerHTML='<p class="note">За последние 7 дней занятий не было. Здесь появятся проценты по каждой игре, по глаголам и по цветам.</p>';return}
  let h=tbl('Игры за 7 дней',Object.keys(GN).map(g=>{const v=L.filter(x=>x.g===g);return[GN[g],v.length,v.length?v.filter(x=>x.ok).length/v.length:0]}).filter(r=>r[1]));
  h+=tbl('Глаголы (сначала трудные)',group(L.filter(x=>x.g==='verb'),'v'));
  h+=tbl('Похожие действия',group(L.filter(x=>x.g==='pair'),'v'));
  h+=tbl('Большой — маленький',group(L.filter(x=>x.g==='size'),'sz').map(r=>[r[0]==='b'?'большой':'маленький',r[1],r[2]]));
  h+=tbl('Цвета',group(L.filter(x=>x.g==='color'),'c').map(r=>[CN[r[0]],r[1],r[2]]));
  h+=tbl('Кормление: кому',group(L.filter(x=>x.g==='feed'),'a'));
  h+=tbl('Другой / одинаковые',group(L.filter(x=>x.g==='odd'),'m'));
  h+=tbl('Кто как говорит',group(L.filter(x=>x.g==='snd'&&!x.x),'a'));
  h+=tbl('Что это? (предметы)',group(L.filter(x=>x.g==='word'),'n'));
  h+=tbl('Я (фото ребёнка)',group(L.filter(x=>x.g==='me'),'v'));
  h+=tbl('Слоги',group(L.filter(x=>x.g==='syl'),'n').map(r=>[r[0]+' слог'+(r[0]==1?'':'а'),r[1],r[2]]));
  h+=tbl('Один — много',group(L.filter(x=>x.g==='many'),'sz').map(r=>[{one:'один',few:'мало',lot:'много'}[r[0]]||r[0],r[1],r[2]]));
  h+=tbl('Где муха',group(L.filter(x=>x.g==='fly'),'n'));
  h+=tbl('Дай — на',group(L.filter(x=>x.g==='dai'),'who'));
  h+=tbl('Предлоги',group(L.filter(x=>x.g==='prep'),'p').map(r=>['«'+r[0]+'»',r[1],r[2]]));
  h+=tbl('Час пик (уровень)',group(L.filter(x=>x.g==='rh'),'n'));
  h+=tbl('Пингвины (уровень)',group(L.filter(x=>x.g==='pg'),'n'));
  h+=tbl('Мостик для мышки (уровень)',group(L.filter(x=>x.g==='br'),'n'));
  h+=tbl('Озорные щенки (уровень)',group(L.filter(x=>x.g==='dogs'),'n'));
  h+=tbl('Летит, едет, плывёт',group(L.filter(x=>x.g==='tr'),'v'));
  h+=tbl('Да или нет',group(L.filter(x=>x.g==='yn'),'v'));
  h+=tbl('Несёт — держит',group(L.filter(x=>x.g==='nes'),'v'));
  h+=tbl('Съедобное',group(L.filter(x=>x.g==='food'&&x.w),'n').slice(0,10));
  h+=tbl('Повтори!',group(L.filter(x=>x.g==='seq'),'n').map(r=>[r[0]+' картинок',r[1],r[2]]));
  h+=tbl('Цифры',group(L.filter(x=>x.g==='num'),'n').map(r=>['цифра '+r[0],r[1],r[2]]));
  h+=tbl('Мир вокруг',group(L.filter(x=>x.g==='world'),'n'));
  h+=tbl('Одень мальчика',group(L.filter(x=>x.g==='dress'),'n'));
  h+=tbl('Лови!',group(L.filter(x=>x.g==='catch'),'m'));
  h+=tbl('Шарики',group(L.filter(x=>x.g==='bal'),'m'));
  h+=tbl('Положи (перетаскивание)',group(L.filter(x=>x.g==='put'),'p').map(r=>['«'+r[0]+'»',r[1],r[2]]));
  h+=v21Stats(L);
  const conf={};L.filter(x=>(x.g==='verb'||x.g==='pair')&&x.picks).forEach(x=>x.picks.forEach(p=>{const k=x.v+' → '+p;conf[k]=(conf[k]||0)+1}));
  const ce=Object.entries(conf).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(ce.length)h+=`<h3 style="margin-top:10px">Частые путаницы</h3><p class="note">${ce.map(([k,n])=>`просили «${k.split(' → ')[0]}», выбрал «${k.split(' → ')[1]}» — ${n} раз`).join('<br>')}</p>`;
  $('#stats').innerHTML=h;
}

/* ---------- parent: own voice, photos, child's recordings */
let vtab='main';
const VMAIN=()=>PRAISE.concat(['Нет.','Скажи!','Хорошо сказал!','Новый уровень!','Молодец! Ты всё сделал!','Хорошо позанимались!','Держи кусочки пазла!','Собери пазл! Перетащи кусочки.','Новая наклейка в большом пазле!','Лопни шарики!','Красный!','Жёлтый!','Зелёный!','Синий!','Покажи, где другой?','Найди одинаковые!','Послушай!','Кто так говорит?','Стучи!']);
const VQ=()=>MAIN.map(v=>'Кто '+v+'?').concat(Object.keys(CN).map(c=>'Где '+CN[c]+'?'),ME_V.map(v=>'Где ты '+v[2]+'?'),ME_V.map(v=>'Я '+v[1]+'!'),Object.values(GN).filter(x=>!/[(/]/.test(x)).map(x=>x.replace(/\?$/,'')+(/\?$/.test(x)?'?':'.')));
function renderVoice(){
  const list=vtab==='main'?VMAIN():vtab==='q'?VQ():S.recent.slice(0,40);
  $('#rec-count').textContent='записано: '+REC.size;
  document.querySelectorAll('[data-vtab]').forEach(b=>b.style.outline=b.dataset.vtab===vtab?'3px solid var(--plum)':'');
  $('#voice-list').innerHTML=list.length?list.map((t,k)=>{const has=REC.has(nk(t));return `<div class="rec-row"><span>${t.replace(/</g,'&lt;')}</span><button data-vr="${k}" class="${has?'has':''}" aria-label="Записать">●</button><button data-vp="${k}" ${has?'':'disabled style="opacity:.3"'} aria-label="Послушать">▶</button><button data-vd="${k}" ${has?'':'disabled style="opacity:.3"'} aria-label="Удалить">✕</button></div>`}).join(''):'<p class="note">Пока пусто — поиграйте, и здесь появятся фразы.</p>';
  const T=k=>list[+k];let stopper=null;
  document.querySelectorAll('[data-vr]').forEach(b=>b.onclick=async()=>{
    if(stopper){stopper.stop&&stopper.stop();return}
    stopVoice();stopper={};b.classList.add('on');b.textContent='■';
    const blob=await recordFor(6000,{stopper});stopper=null;b.classList.remove('on');b.textContent='●';
    if(!blob){$('#mic-note').textContent='Микрофон недоступен. Разрешите доступ к микрофону в браузере. В пробной версии внутри Claude запись может не работать — используйте приложение на телефоне.';return}
    try{await MDB.put('rec',nk(T(b.dataset.vr)),blob);REC.add(nk(T(b.dataset.vr)))}catch(e){}renderVoice()});
  document.querySelectorAll('[data-vp]').forEach(b=>b.onclick=async()=>{const x=await MDB.get('rec',nk(T(b.dataset.vp))).catch(()=>null);if(x){stopVoice();playURL(URL.createObjectURL(x))}});
  document.querySelectorAll('[data-vd]').forEach(b=>b.onclick=async()=>{try{await MDB.del('rec',nk(T(b.dataset.vd)));REC.delete(nk(T(b.dataset.vd)))}catch(e){}renderVoice()});
}
document.querySelectorAll('[data-vtab]').forEach(b=>b.onclick=()=>{vtab=b.dataset.vtab;renderVoice()});
function shrink(file){return new Promise(res=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{const k=Math.min(1,720/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>res(b),'image/jpeg',.85)};im.onerror=()=>{URL.revokeObjectURL(u);res(null)};im.src=u})}
function renderPhotos(){
  $('#ph-grid').innerHTML=ME_V.map(v=>`<label class="ph"><div class="im" style="${PH[v[0]]?`background-image:url(${PH[v[0]]})`:''}">${PH[v[0]]?'':'+'}</div>${cap(v[0])}<input type="file" accept="image/*" data-ph="${v[0]}">${PH[v[0]]?`<button class="x" data-phx="${v[0]}" aria-label="Удалить фото">✕</button>`:''}</label>`).join('');
  document.querySelectorAll('[data-ph]').forEach(i=>i.onchange=async()=>{const f=i.files&&i.files[0];if(!f)return;const b=await shrink(f);if(b){try{await MDB.put('photo',i.dataset.ph,b)}catch(e){}await loadPhotos();renderPhotos()}});
  document.querySelectorAll('[data-phx]').forEach(b=>b.onclick=async e=>{e.preventDefault();e.stopPropagation();try{await MDB.del('photo',b.dataset.phx)}catch(e){}await loadPhotos();renderPhotos()});
}
async function renderLev(){let ks=[];try{ks=(await MDB.keys('lev')).sort((a,b)=>b-a)}catch(e){}
  if(!ks.length){$('#lev-list').innerHTML='<p class="note">Записей пока нет. Они появятся, когда ребёнок будет повторять фразы в «Скажи!».</p>';return}
  const rows=[];for(const k of ks){const r=await MDB.get('lev',k).catch(()=>null);if(r)rows.push([k,r])}
  $('#lev-list').innerHTML=rows.map(([k,r])=>`<div class="rec-row"><span><b>${(r.phrase||'').replace(/</g,'&lt;')}</b><br><span class="note">${new Date(k).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></span><button data-lp="${k}" aria-label="Послушать">▶</button></div>`).join('')+'<div class="row" style="margin-top:8px"><button class="small-btn danger" id="lev-clear">Удалить все записи</button></div>';
  document.querySelectorAll('[data-lp]').forEach(b=>b.onclick=async()=>{const r=await MDB.get('lev',+b.dataset.lp).catch(()=>null);if(r&&r.blob){stopVoice();playURL(URL.createObjectURL(r.blob))}});
  $('#lev-clear').onclick=async()=>{for(const k of ks)await MDB.del('lev',k).catch(()=>{});renderLev()};
}
$('#set-sayit').onchange=e=>{S.sayit=e.target.value;save()};
$('#set-ask').onchange=e=>{S.askFirst=e.target.checked;save()};
$('#set-name').onchange=e=>{S.name=e.target.value.trim()||'Лев';save()};
$('#set-shon').onchange=e=>{S.shOn=e.target.checked;save();applyV21Home()};
$('#set-hgon').onchange=e=>{S.hgOn=e.target.checked;save();applyV21Home()};
$('#set-shhost').onchange=e=>{S.shHost=e.target.checked;save()};
{const box=$('#sh-moves');if(box){box.innerHTML=Object.entries(SH_MOVES).map(([k,t])=>`<div class="row"><label for="set-mv-${k}">${t}</label><input type="checkbox" id="set-mv-${k}"></div>`).join('');
  for(const k in SH_MOVES)$('#set-mv-'+k).onchange=e=>{S.shMv=Object.assign({},S.shMv,{[k]:e.target.checked});save()}}}
$('#set-shask').onchange=e=>{S.shAskBtn=e.target.checked;save()};$('#set-shsum').onchange=e=>{S.shSum=e.target.checked;save()};
$('#set-hero').onchange=e=>{S.hero=e.target.value==='dog'?'dog':'cat';save();applyV21Home();$('#art-dog').innerHTML=heroSvg()};
$('#set-shurl').onchange=e=>{S.shUrl=e.target.value.trim();save();applyV21Home()};
$('#set-shcode').onchange=e=>{S.shCode=e.target.value.trim();save()};
$('#set-shmin').onchange=e=>{S.shMin=Math.min(45,Math.max(5,+e.target.value||20));save()};
$('#set-shvoice').onchange=e=>{S.shVoice=e.target.checked;save()};
$('#set-shstt').onchange=e=>{S.shStt=e.target.checked;save()};
$('#set-shtts').onchange=e=>{S.shTts=e.target.checked;save()};
$('#sh-phdl').onclick=async e=>{ac();const b=e.target;if(!shOn()){b.textContent='Сначала включите «Занятие с Шариком»';return}b.disabled=true;b.textContent='Получаю список…';
  try{const r=await shPhrasesDownload((i,n)=>{b.textContent=`Скачиваю ${i} из ${n}…`});
    b.textContent=r.err?'Нет связи с сервером — попробуйте позже':r.ok===r.all?`✓ Готово: ${r.ok} фраз`:`Скачано ${r.ok} из ${r.all} — нажмите ещё раз`}
  finally{b.disabled=false;const pc=$('#sh-phn');if(pc)shPhrasesCount().then(n=>pc.textContent=n?`на телефоне записано фраз: ${n}`:'')}};
$('#sh-ttstest').onclick=async e=>{ac();const b=e.target;if(!shOn()){b.textContent='Сначала включите «Занятие с Шариком»';return}b.disabled=true;b.textContent='Шарик говорит…';
  SH_HOW.length=0;const el=document.createElement('div');el.style.cssText='position:fixed;left:-9999px;width:10px;height:10px';document.body.append(el);
  try{await shSpeak('Привет, Лев! Я Шарик. Покажи, где у мальчика нос? Ура! Молодец!',el)}finally{el.remove();b.disabled=false}
  const w=SH_HOW[0]||'';b.textContent=w==='tts:ok'?'✓ Живой голос с сервера':w==='mom'?'Звучала запись мамы':'Голос телефона (на сервере нет голоса или нет связи)'};
$('#set-sh3d').onchange=e=>{S.sh3d=e.target.checked;save()};
$('#set-shmem').onchange=e=>{S.shMem=e.target.checked;save()};
$('#set-mirrbody').onchange=e=>{S.mirrBody=e.target.checked;save()};
$('#btn-sharik').onclick=async()=>{ac();startSharik()};
$('#set-myvoice').onchange=e=>{S.myVoice=e.target.checked;save()};
$('#pz-gift').onclick=()=>{S.pz.ready=true;save();renderParent()};
/* hold-to-open gear */
let holdT=null;const gear=$('#gear');
gear.addEventListener('pointerdown',()=>{gear.classList.add('holding');holdT=setTimeout(()=>{gear.classList.remove('holding');renderParent();show('parent')},1700)});
['pointerup','pointerleave','pointercancel'].forEach(e=>gear.addEventListener(e,()=>{clearTimeout(holdT);gear.classList.remove('holding')}));
gear.addEventListener('contextmenu',e=>e.preventDefault());
$('#btn-parent-close').onclick=renderHome;
$('#set-voice').onchange=e=>{S.voice=e.target.checked;save()};
$('#set-bad').onchange=e=>{S.badSnd=e.target.value;save()};
$('#btn-test-bad').onclick=()=>sfx.bad();
$('#set-anim').onchange=e=>{S.anim=e.target.checked;save()};
$('#set-next').onchange=e=>{S.nextBtn=e.target.checked;save()};
$('#set-rate').oninput=e=>{S.rate=+e.target.value;$('#rate-out').textContent=S.rate.toFixed(2);save()};
$('#rounds-minus').onclick=()=>{S.rounds=Math.max(5,S.rounds-5);save();renderParent()};
$('#rounds-plus').onclick=()=>{S.rounds=Math.min(30,S.rounds+5);save();renderParent()};
$('#btn-test-voice').onclick=()=>say('Привет, Лев! Где лиса бежит?');
$('#btn-reset').onclick=()=>{$('#btn-reset-yes').hidden=false};
$('#btn-reset-yes').onclick=()=>{S.log=[];Object.keys(S.lvl).forEach(g=>{S.lvl[g]=1;S.streak[g]=0;S.errs[g]=0});save();$('#btn-reset-yes').hidden=true;renderParent()};

let tileBusy=false;
document.querySelectorAll('.tile').forEach(t=>t.onclick=async()=>{if(tileBusy)return;tileBusy=true;ac();t.style.transform='scale(.96)';
  await Promise.race([say(t.dataset.say||t.querySelector('b').textContent.replace('?','').replace(' — ',' или ')),wait(2000)]);t.style.transform='';tileBusy=false;if(!$('#home').hidden)startGame(t.dataset.game)});
$('#btn-mix').onclick=async()=>{ac();await Promise.race([say('Занятие дня!'),wait(1500)]);startMix()};
$('#btn-album').onclick=()=>{ac();openReward()};

$('#puz-home').onclick=()=>{stopVoice();renderHome()};
$('#puz-album').onclick=()=>openAlbum();
$('#album-home').onclick=()=>{stopVoice();renderHome()};
$('#album-puz').onclick=()=>openReward();
$('#btn-home').onclick=()=>{stopVoice();shAbort();shParentClose();VM.stop();$('#sayit').hidden=true;$('#nextbar').hidden=true;if(G&&G.round)G.round.dead=true;$('#stage').innerHTML='';G=null;renderHome()};
$('#btn-say').onclick=()=>{if(G&&G.round&&G.round.replay){G.round.replay();return}if(G&&G.round&&G.round.prompt)say(G.round.prompt==='Лопни шарик!'?'Лопни шарик!':G.round.prompt)};
$('#btn-again').onclick=()=>G&&G.plan?startMix():startGame(G.game);
$('#btn-finish-home').onclick=renderHome;
v24init();mig24();mig25();mig26();wbInit();v21Wire();vidLoad();wbLoad();micProbe().then(applyV21Home);
loadPhotos();
renderHome();
window.__ev=s=>eval(s);window.__rechka={figSvg,balFeed,balDigit,homeRound,drawRound,sfx,bonusPop,numFindAll,numHidden,numPeek,balAni,balCount,pgSolve2,openReward,posFix,IBS,W24T,WANT24,PZP,VG_ANI:()=>VG_ANI,VM,VMC,chooseTip,mkTask,get TIP(){return TIP},showTip,openWB,recordVideo,get VIDK(){return VIDK},sayIt,segDetector,peakDetector,get MICX(){return MICX},dgSolve,rhSolve,pgSolve,brSolve,brState,dgCells,get G(){return G},handSvg,ROUNDS,RHY,rpic,S,D,PZ_LIST,SYL,ONO_L,MDB,openPuzzle,openAlbum,startMix,get PH(){return PH}};
