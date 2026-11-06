import re
src='/home/claude/rechka/src/'
s=open(src+'body.html').read()
def rep(a,b,c=1):
    global s
    n=s.count(a);assert n==c,(a[:160],n);s=s.replace(a,b)
def cutfn(name):
    global s
    m=re.search(r'\n(async function|function) '+re.escape(name)+r'\(',s);assert m,name
    i=m.start()+1;pat=re.compile(r'\n(?=(async function |function |const |let |/\*|\$\(|window\.|if\())');k=pat.search(s,i+5);s=s[:i]+s[k.start()+1:]
rep('</style>',open(src+'v26.css').read()+'</style>')
cutfn('numFindAll')
rep("const ROUNDS={not:notRound,","\n"+open(src+'v26.js').read()+"\nconst ROUNDS={not:notRound,")
# бонус каждые 5 заданий (в коротких играх — каждые 4)
rep("  await nextGate();if(!G||G.round!==R||R.dead)return;","  await nextGate();if(!G||G.round!==R||R.dead)return;\n  {const step=(G.max||S.rounds)>=10?5:4;if(G.i%step===0&&G.i<(G.max||S.rounds)&&S.bonus!==false){await bonusPop();if(!G||G.round!==R||R.dead)return}}")
# «Кто как говорит?»: без «Как говорит лиса?»
m=re.search(r"  if\(lvl>=3&&rmode\('snd',2\)===1\)\{const q='Как говорит '.*?return roundDone\(true,\{a:t\.n,x:1\}\)\}\n",s,re.S);assert m
s=s[:m.start()]+s[m.end():]
rep("const n=lvl===1?2:4;const CLASH=","const n=lvl===1?2:lvl===2?3:4;const CLASH=")
# «Повтори!»: часто 3 картинки
rep("  const R=G.round;const len=Math.min(5,2+lvl);\n  const names=shuffle(Object.keys(RPIC)","  const R=G.round;const len=lvl>1&&rmode('seq3',5)<2?3:Math.min(5,2+lvl);\n  const names=shuffle(Object.keys(RPIC)")
def desc(key,arr):
    global s
    m=re.search(r"\n  "+key+r":\[.*?\],\n",s);assert m,key
    s=s[:m.start()]+"\n  "+key+":["+",".join("'"+a+"'" for a in arr)+"],\n"+s[m.end():]
desc('snd',['«Кто так говорит?» — голос понятного животного (собака, кошка, корова, лошадь, свинья, коза, овца, курица, петух, утка, гусь, лягушка, медведь, слон), из 2','из 3','из 4'])
desc('seq',['3 картинки в ряд: 5 секунд посмотреть, потом перенести на пустые места','4 картинки (часто и по 3)','5 картинок (часто и по 3)'])
s=s.replace("window.__rechka={","window.__rechka={bonusPop,",1)
open(src+'body.html','w').write(s);print('ok')
