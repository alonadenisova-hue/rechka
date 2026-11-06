import re
src='/home/claude/rechka/src/'
s=open(src+'body_v26.html').read()
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
JS=open(src+'v28.js').read()
NEW=[g for g in ('home','draw') if ('async function '+g+'Round(') in JS]

rep('</style>',open(src+'v28.css').read()+'</style>')
# цифры: предметы всегда видны целиком
rep('return `<div class="cnt c${cols}">','return `<div class="cnt c${cols}${n<=2?\' r1\':\'\'}">')
# старые функции → новые из v28.js
for f in ['ibRound']+[x for x in ['balRound'] if 'async function '+x+'(' in JS]: cutfn(f)
rep("const ROUNDS={not:notRound,","\n"+JS+"\nconst ROUNDS={"+''.join(g+':'+g+'Round,' for g in NEW)+"not:notRound,")
s=s.replace("window.__rechka={","window.__ev=s=>eval(s);window.__rechka={figSvg,balFeed,balDigit,homeRound,drawRound,",1)
# «Что это?»: живые картинки
rep("const L=W24T[G.topic]||W24T.all;const t=fresh(()=>pick(L),x=>x.n);const ti=pick(t.is);","const L=W24T[G.topic]||W24T.all;const t=fresh(()=>pick(L),x=>x.n);const ti=wPic(t);")
rep("others.map(x=>({html:img(pick(x.is)),ok:false,key:x.","others.map(x=>({html:img(wPic(x)),ok:false,key:x.")
rep("return `<button class=\"opt topic\" data-t=\"${t}\">${img(ic.is[0])}","return `<button class=\"opt topic\" data-t=\"${t}\">${img(ic.is[0]||ic.an[0])}")
exec(open('/home/claude/rechka/tools/patch_v28_extra.py').read()) if __import__('os').path.exists('/home/claude/rechka/tools/patch_v28_extra.py') else None
open(src+'body.html','w').write(s);print('ok',NEW)
