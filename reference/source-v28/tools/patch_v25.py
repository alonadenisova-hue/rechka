import re
src='/home/claude/rechka/src/'
s=open(src+'body.html').read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(a[:160],n);s=s.replace(a,b)
def cutfn(name,nth=0):
    global s
    ms=list(re.finditer(r'\n(async function|function) '+re.escape(name)+r'\(',s));assert ms,name
    m=ms[nth];i=m.start()+1;j=i+5
    pat=re.compile(r'\n(?=(async function |function |const |let |/\*|\$\(|window\.|if\())')
    k=pat.search(s,j);assert k,name
    s=s[:i]+s[k.start()+1:]

rep('</style>',open(src+'v25.css').read()+'</style>')
rep('<script src="data15.js" onerror="void 0"></script>','<script src="data15.js" onerror="void 0"></script>\n<script src="data16.js" onerror="void 0"></script>')
# плитки
rep('<button class="tile t33" data-game="voice"','<button class="tile t33" data-game="voice" hidden')
rep('<button class="tile t13" data-game="many">','<button class="tile t13" data-game="many" hidden>')
rep("for(const t of document.querySelectorAll('.tile[data-game=\"dai\"],.tile[data-game=\"many\"]'))","for(const t of document.querySelectorAll('.tile[data-game=\"dai\"]'))")
rep('<b>Большой — маленький</b>','<b>Большой — маленький, один — много</b>')
rep('<b>Повторяй за Шариком</b><span class="newb">новое</span>','<b>Повторяй за Шариком</b><span class="newb">звуки, слоги</span>')
rep("const vt=$('.tile[data-game=\"voice\"]');if(vt)vt.hidden=!S.voiceGame||MICX===false;","const vt=$('.tile[data-game=\"voice\"]');if(vt)vt.hidden=true;")
rep(".concat(D.many&&D.many.length?['many']:[])","")
rep("size:'Большой — маленький'","size:'Большой — маленький, один — много'")
rep("dog:'Повторяй за Шариком'","dog:'Повторяй за Шариком (звуки, слоги, слова)'")
# ударение: сОску
rep("const STRESS=[","const STRESS=[['соску','со́ску'],['соска','со́ска'],['соски','со́ски'],")
# старые функции → новые из v25.js
cutfn('balloonSvg');cutfn('balRound');cutfn('numTrace');cutfn('pgRound');cutfn('dogRound');cutfn('openReward');cutfn('finish')
rep("async function sizeRound(lvl){","async function sizeRound0(lvl){")
rep("const balInner=(c,inner)=>`<svg viewBox=\"0 0 60 90\">${balloonSvg(c).replace(","const balInner=(c,inner)=>`<svg viewBox=\"0 0 60 90\">${balloonSvg(c,'').replace(")
rep("const ROUNDS={not:notRound,","\n"+open(src+'v25.js').read()+"\nasync function balRound(lvl){const m=rmode('bal',5);return [balOnly,balInside,balSyl,balAni,balCount][m](lvl)}\nconst ROUNDS={not:notRound,")
# цифры: новые задания
rep("  if(m==='match')return numMatch(L);","  if(m==='findall')return numFindAll(n,L);if(m==='hidden')return numHidden(n,L);if(m==='peek')return numPeek(L);\n  if(m==='match')return numMatch(L);")
m=re.search(r"const NUMLV=\{.*?\}\};\n",s,re.S);assert m
s=s[:m.start()]+"""const NUMLV={1:{pool:[1,2,3],k:2,modes:['dots','findall']},2:{pool:[1,2,3],k:2,modes:['dots','dig2dots','findall','peek']},3:{pool:[1,2,3],k:2,modes:['dots','count','dig2dots','fingers','hidden','peek']},
  4:{pool:[1,2,3,4,5],k:3,modes:['dots','dig2dots','findall','hidden']},5:{pool:[1,2,3,4,5],k:3,modes:['count','same','dig2dots','fingers','peek','hidden']},6:{pool:[1,2,3,4,5],k:3,modes:['match','trace','findall','trace']},
  7:{pool:[1,2,3,4,5],k:3,near:true,modes:['dots','dig2dots','same','match','fingers','findall','hidden','peek','trace']}};
"""+s[m.end():]
# пазл: щелчок вместо «чавк»
rep("sfx.chomp();S.pz.placed.push(j);","sfx.snap();S.pz.placed.push(j);")
# «Лови!»
rep("setTimeout(()=>o.el.remove(),380);bk.classList.remove('yum');void bk.offsetWidth;bk.classList.add('yum');sfx.chomp();","catchFx(o,box,bk);setTimeout(()=>o.el.remove(),380);bk.classList.remove('yum');void bk.offsetWidth;bk.classList.add('yum');")
# переходы
rep("if(clear)$('#stage').innerHTML=`<div class=\"listen\"","if(clear){stageAnim();$('#stage').innerHTML=`<div class=\"listen\"")
rep("aria-hidden=\"true\">${EAR}</div>`;","aria-hidden=\"true\">${EAR}</div>`}")
# запуск: без «Сегодня дома»
rep("v24init();mig24();","v24init();mig24();mig25();")
rep("<p class=\"note\">За каждое занятие ребёнок получает кусочки пазла","<p class=\"note\" hidden>За каждое занятие ребёнок получает кусочки пазла")
s=s.replace("window.__rechka={openMaze,","window.__rechka={numFindAll,numHidden,numPeek,balAni,balCount,pgSolve2,",1)
# описания уровней
def desc(key,arr):
    global s
    m=re.search(r"\n  "+key+r":\[.*?\],\n",s);assert m,key
    s=s[:m.start()]+"\n  "+key+":["+",".join("'"+a+"'" for a in arr)+"],\n"+s[m.end():]
desc('dog',['звуки животных («му-у», «гав»), слоги («па-па»), ряды из 2 слов','+ «Хочу банан!»','слоги по 3, ряды из 4 слов (3 тип)','ряды 5 типа из 2 слов','ряды 5 типа из 4 слов','ряды 5 типа из 6 слов'])
desc('pg',['задачи от 6 до 14 ходов на поле 5×5, потом 6×6; есть полыньи — въехал в полынью, пингвин падает, начинаем сначала; всегда надо сначала подвинуть другого пингвина'])
desc('num',['предметы → цифра 1–3, «найди все единички»','+ цифра → предметы, «какая цифра спряталась?»','+ пальчики, цифры прячутся в траве и на дереве','1–5: предметы, найди все','1–5: столько же, пальчики, спряталась, в траве','соедини, обведи до конца, найди все','всё вперемешку, соседние числа'])
s=s.replace("\n  size:[","\n  size:['чередуется с «один — много»: '+",1) if False else s
open(src+'body.html','w').write(s);print('ok')
