import re
src='/home/claude/rechka/src/'
s=open(src+'body.html').read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(a[:160],n);s=s.replace(a,b)
def cut(start,end):
    """remove text from start marker up to (not including) end marker"""
    global s
    i=s.index(start);j=s.index(end,i+len(start));s=s[:i]+s[j:]
def cutfn(name):
    """remove a top-level function (declared at line start) up to the next line that starts a new top-level statement"""
    global s
    m=re.search(r'\n(async function|function) '+re.escape(name)+r'\(',s);assert m,name
    i=m.start()+1;j=i+5
    pat=re.compile(r'\n(?=(async function |function |const |let |/\*|\$\(|window\.|if\())')
    k=pat.search(s,j);assert k,name
    s=s[:i]+s[k.start()+1:]

# --- данные и стили
rep('<script src="data13.js" onerror="void 0"></script>','<script src="data13.js" onerror="void 0"></script>\n<script src="data14.js" onerror="void 0"></script>')
rep('<script src="sounds.js" onerror="void 0"></script>','<script src="sounds.js" onerror="void 0"></script>\n<script src="sounds2.js" onerror="void 0"></script>')
rep('</style>',open(src+'v24.css').read()+'</style>',1) if s.count('</style>')==1 else None
# --- плитки
rep('<button class="tile t9" data-game="syl">','<button class="tile t9" data-game="syl" hidden>')
rep('<button class="tile t11" data-game="word">','<button class="tile t11" data-game="word" hidden>')
rep('<b>Мир вокруг</b>','<b>Что это?</b>')
rep('<b>Идёт или бежит?</b>','<b>Идёт, бежит, стоит, сидит</b>')
rep('<button class="tile t27" data-game="yn">','<button class="tile t37" data-game="not"><span class="lvl" data-lvl="not"></span><div class="art" id="art-not"></div><b>Что не…?</b><span class="newb">новое</span></button>\n    <button class="tile t27" data-game="yn">')
rep('<b>Я хочу</b></button>','<b>Я хочу</b><span class="newb">новое</span></button>')
rep('<b>Пингвины</b><span class="newb">новое</span>','<b>Пингвины</b><span class="newb">труднее</span>')
# --- состояние
rep("give:1},streak:{","give:1,not:1},streak:{")
rep("give:0},errs:{","give:0,not:0},errs:{")
rep("give:0},log:[]","give:0,not:0},log:[]")
rep("const MAXL={give:4,","const MAXL={not:4,")
rep("seq:3,want:3,","seq:3,want:4,")
rep("ib:2,food:5}","ib:4,food:5}")
rep("world:4,dress:4","world:5,dress:4")
rep("const FIX7={give:7,","const FIX7={not:10,")
rep("const GN={dog:'Повторяй за Шариком',","const GN={not:'Что не…?',dog:'Повторяй за Шариком',")
rep("ib:'Идёт — бежит'","ib:'Идёт, бежит, стоит, сидит'")
rep("world:'Мир вокруг'","world:'Что это? (вещи, животные, еда)'")
rep("const MIXG=['dog','give','nes','verb','pair','color','prep','size','word','snd','odd','feed','syl','put',","const MIXG=['dog','give','nes','not','want','verb','pair','color','prep','size','snd','odd','feed','put',")
# --- описания уровней
def desc(key,arr):
    global s
    m=re.search(r"\n  "+key+r":\[.*?\],\n",s);assert m,key
    s=s[:m.start()]+"\n  "+key+":["+",".join("'"+a+"'" for a in arr)+"],\n"+s[m.end():]
desc('want',['голос просит «Хочу мишку!» — найти из 2 (еда, игрушки, «хочу в бассейн / в магазин / гулять», «включи мультик / пианино»)','из 3','из 4','из 6'])
desc('ib',['«Кто идёт?» / «Кто бежит?»','«Кто стоит?» / «Кто сидит?» (один и тот же зверь)','стоит, сидит, идёт — из 3','стоит, сидит, идёт, бежит — из 4'])
desc('world',['тема на выбор (животные, еда, дом, одежда, игрушки, природа, транспорт): «Где кошка?» из 2','из 4','из 6','из 6 похожих (фрукт к фрукту) + через раз «Что это?» — назвать самому','из 9'])
desc('seq',['3 картинки в ряд: 5 секунд посмотреть, потом перенести на пустые места по порядку','4 картинки','5 картинок'])
desc('num',['предметы → цифра: «Сколько здесь?» 1–3, из 2','ещё цифра → предметы: «Где два?» 1–3','предметы и иногда пальчики 1–3','предметы ↔ цифра 1–5, из 3','предметы, иногда пальчики, «столько же» 1–5','соедини цифру с предметами, обведи цифру','всё вперемешку, соседние числа'])
desc('pg',['22 задачи от 4 до 13 ходов; в каждой нужно сначала подвинуть другого пингвина — думать и планировать ходы'])
s=s.replace("\n  give:[","\n  not:['«Кто не собака?», «Что не мяч?» — из 2','из 3','из 3 + «Что не красного цвета?»','из 4'],\n  give:[",1)
# --- старые функции заменяются новыми из v24.js
cutfn('wantRound');cutfn('seqRound');cutfn('ibRound');cutfn('worldRound')
cut('async function openPuzzle(){','/* большой пазл: пейзаж')
cutfn('openAlbum');cutfn('renderPzHome');cutfn('finish')
# --- порядок карточек
rep("{const k=opts.findIndex(o=>o.ok);if(k>=0&&opts.length>1&&G.lastPos===k){const j=(k+1+rnd(opts.length-1))%opts.length;[opts[k],opts[j]]=[opts[j],opts[k]]}G.lastPos=opts.findIndex(o=>o.ok)}","opts=posFix(shuffle(opts.slice()),o=>o.ok);")
rep("{const k=opts.indexOf(n);if(opts.length>1&&G.lastPos===k){const j=(k+1)%opts.length;[opts[k],opts[j]]=[opts[j],opts[k]]}G.lastPos=opts.indexOf(n)}","posFix(opts,d=>d===n);")
# --- животные
rep("const ONO_L=Object.keys(ONO)","let ONO_L=Object.keys(ONO)")
rep("const VG_ANI=[","let VG_ANI=[")
rep("const an=D.anims.find(x=>x.s===n);return an?an.a:null}","const an=D.anims.find(x=>x.s===n);return an?an.a:((window.ANIPIC||{})[n]||null)}")
rep("  if(name==='bal'){const c=pick(","  if(name==='want')return vgWant(el,sc,meter);\n  if(name==='bal'){const c=pick(")
rep("lvl>=4?shuffle(PP).slice(0,2):[pick(PP)]","lvl>=4?twoDiff(PP):[pick(PP)]")
rep("const r=fresh(()=>pick(pool.length?pool:RHY_LOGO()),x=>x.w.join());","const r=dogDeck(pool.length?pool:RHY_LOGO(),L.t);")
# --- цифры: предметы вместо точек
m=re.search(r"const dotsSvg=\(n,c\)=>`.*?`;\n",s);assert m
s=s[:m.start()]+"const dotsSvg=(n,c)=>numCard(n,numObj());\n"+s[m.end():]
rep("q:'Сколько точек?',spoken:'Посчитай точки! Какая цифра?'","q:'Сколько здесь?',spoken:'Посчитай! Какая цифра?'")
rep("again:'Нет. Посчитай точки!',m:'точки → цифра'","again:'Нет. Посчитай ещё раз!',m:'предметы → цифра'")
rep("spoken:'Цифра '+NUMW[n]+'. Где столько точек?'","spoken:'Цифра '+NUMW[n]+'. Где столько?'")
rep("m:'цифра → точки'","m:'цифра → предметы'")
rep("'Найди, где столько же точек! Положи цифру на точки.'","'Найди, где столько же! Положи цифру на картинку.'")
rep("3:{pool:[1,2,3],k:2,modes:['fingers','count']}","3:{pool:[1,2,3],k:2,modes:['dots','count','dig2dots','fingers']}")
rep("5:{pool:[1,2,3,4,5],k:3,modes:['fingers','count','same']}","5:{pool:[1,2,3,4,5],k:3,modes:['count','same','dig2dots','fingers']}")
rep("modes:['dots','dig2dots','fingers','count','same','match']}","modes:['dots','dig2dots','count','same','match','fingers','count']}")
# --- съедобное: стол и коробка меняются местами
rep("const tz={x:ox+.11*sw,y:oy+.47*sh,w:.43*sw,h:.24*sh};tz.x=Math.max(0,tz.x);",
    "const tz={x:ox+.11*sw,y:oy+.47*sh,w:.43*sw,h:.24*sh};tz.x=Math.max(0,tz.x);const flip=rmode('foodside',2)===1;if(flip){kit.style.transform='scaleX(-1)';tz.x=Math.max(0,W-tz.x-tz.w)}")
rep("const bx={x:W*.97-bw,y:SH*.97-bh,w:bw,h:bh};","const bx={x:flip?W*.03:W*.97-bw,y:SH*.97-bh,w:bw,h:bh};")
# --- пингвины: новые трудные уровни
rep("const PZ=window.PZLV||{rh:[],pg:[],br:[]};","const PZ=window.PZLV||{rh:[],pg:[],br:[]};if(window.PG24&&window.PG24.length)PZ.pg=window.PG24;")
# --- хочу: доска
m=re.search(r"const WB_START=\[.*?\];\n",s);assert m
s=s[:m.start()]+"const WB_START=[['Хочу банан!','банан'],['Хочу хлеб!','хлеб'],['Хочу палочки!','палочки'],['Хочу пельмени!','пельмени'],['Хочу оладьи!','оладьи'],['Хочу яблоко!','яблоко'],['Хочу гулять!','гулять'],['Хочу в бассейн!','бассейн'],['Хочу в магазин!','магазин'],['Включи пианино!','пианино'],['Включи мультик!','мультик'],['Дай сок!','сок'],['Дай машину!','машина']];\n"+s[m.end():]
rep("const wbPic=w=>{if(!w)return null;","const wbPic=w=>{if(!w)return null;if((window.WBPIC24||{})[w])return window.WBPIC24[w];")
rep("S.wb={n:6,cards:WB_START","S.wb={n:12,cards:WB_START")
rep('<option value="8">8</option></select>','<option value="8">8</option><option value="12">12</option></select>')
# --- запуск, кнопки
rep("wbInit();v21Wire();vidLoad();","v24init();mig24();wbInit();v21Wire();vidLoad();")
rep("$('#btn-album').onclick=()=>{ac();S.pz.bank>0?openPuzzle():openAlbum()};","$('#btn-album').onclick=()=>{ac();openReward()};")
rep("$('#btn-to-puz').onclick=()=>{ac();openPuzzle()};","")
rep("$('#album-puz').onclick=()=>openPuzzle();","$('#album-puz').onclick=()=>openReward();")
rep('id="pz-gift">Подарить кусочек</button>','id="pz-gift">Подарить пазл</button>')
rep("$('#pz-gift').onclick=()=>{S.pz.bank++;save();renderParent()};","$('#pz-gift').onclick=()=>{S.pz.ready=true;save();renderParent()};")
s=s.replace("$('#pz-info').textContent=`Собрано картинок: ${S.pz.done.length}. Кусочков в запасе: ${S.pz.bank}.`","$('#pz-info').textContent=`Собрано пазлов: ${(S.pz.ph||[]).length}. Лабиринтов: ${S.mzN||0}.${S.pz.ready?' Пазл ждёт.':''}${S.pz.maze?' Лабиринт ждёт.':''}`")
assert 'Собрано пазлов' in s
# --- картинки плиток
rep("$('#art-voice').innerHTML=VG_BIRD;","$('#art-voice').innerHTML=VG_BIRD;$('#art-not').innerHTML=`<svg viewBox=\"0 0 120 100\"><text x=\"60\" y=\"66\" text-anchor=\"middle\" font-size=\"44\" font-weight=\"700\" fill=\"#ff6b5b\" font-family=\"Balsamiq Sans,sans-serif\">НЕ</text><path d=\"M14 86 106 14\" stroke=\"#ff6b5b\" stroke-width=\"7\" stroke-linecap=\"round\" opacity=\".35\"/></svg>`;")
rep("$('#art-want').innerHTML=RPIC['мишка']?`<img src=\"${IMG[RPIC['мишка'][0]]}\" alt=\"\">`:'';","$('#art-want').innerHTML=`<img src=\"img24/fl_teddy.webp\" alt=\"\">`;")
# --- v24.js перед ROUNDS
rep("const ROUNDS={give:giveRound,","\n"+open(src+'v24.js').read()+"\nconst ROUNDS={not:notRound,give:giveRound,")
rep("window.__rechka={VM,","window.__rechka={openMaze,openReward,posFix,IBS,W24T,WANT24,PZP,VG_ANI:()=>VG_ANI,VM,")
rep(".t36{background:#eaf4ff}",".t36{background:#eaf4ff}.t37{background:#fff4d6}")
open(src+'body.html','w').write(s);print('ok')
