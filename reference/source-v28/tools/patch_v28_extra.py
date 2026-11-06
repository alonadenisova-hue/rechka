# выполняется внутри patch_v28.py (переменная s, функция rep)
# плитки двух новых игр — в начало
rep('<div class="tiles">\n','<div class="tiles">\n    <button class="tile t38" data-game="home"><span class="lvl" data-lvl="home"></span><div class="art" id="art-home"></div><b>Собака дома</b><span class="newb">новое</span></button>\n    <button class="tile t36" data-game="draw"><span class="lvl" data-lvl="draw"></span><div class="art" id="art-draw"></div><b>Дорисуй</b><span class="newb">новое</span></button>\n')
rep('<b>Идёт — бежит</b>','<b>Идёт, бежит, стоит, сидит</b>') if s.count('<b>Идёт — бежит</b>')==1 else None
for k,v in (('lvl',1),('streak',0),('errs',0)):
    import re as _re
    m=_re.search(k+r':\{rh:',s);assert m,k
    s=s[:m.end()-3]+'home:%d,draw:%d,'%(v,v)+s[m.end()-3:]
rep("const MAXL={not:4,","const MAXL={home:4,draw:3,not:4,")
rep("const FIX7={not:10,","const FIX7={home:7,draw:6,not:10,")
rep("const GN={not:'Что не…?',","const GN={home:'Собака дома',draw:'Дорисуй',not:'Что не…?',")
rep("const MIXG=['dog',","const MIXG=['home','draw','dog',")
s=s.replace("\n  not:[","\n  home:['«Собака хочет спать» — 2 места: кровать, стол, дверь, ванна, телевизор','3 места + бассейн, туалет, рисовать','4 места + «Дай собаке миску / футболку»','6 мест, кошка, зайка, мишка, + чистить зубы, мыло'],\n  draw:['дорисуй прямую: ствол, стебелёк, ниточку','дорисуй дугу: круг, ротик, крышу, хвостик','дорисуй несколько линий: лучики, колёса, ушки'],\n  not:[",1)
m=_re.search(r"\n  ib:\[.*?\],\n",s);assert m
s=s[:m.start()]+"\n  ib:['2 человечка: идёт / бежит / стоит / сидит — пары чередуются','3 человечка','4 человечка, разные люди','+ настоящие фото и мультики'],\n"+s[m.end():]
# картинки на плитках
rep("$('#art-voice').innerHTML=VG_BIRD;","$('#art-voice').innerHTML=VG_BIRD;$('#art-home').innerHTML=`<img src=\"${I24('bed')}\" alt=\"\" style=\"width:56%;max-height:100%;object-fit:contain\"><img src=\"${I24('dog')}\" alt=\"\" style=\"width:56%;max-height:100%;object-fit:contain\">`;$('#art-draw').innerHTML=`<svg viewBox=\"0 0 120 100\"><path d=\"M60 18A32 32 0 0 0 60 82\" stroke=\"#ffb020\" stroke-width=\"7\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M60 18A32 32 0 0 1 60 82\" stroke=\"#9aa7b8\" stroke-width=\"5\" stroke-dasharray=\"2 8\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M96 70l10-28 6 4-10 28z\" fill=\"#7b61ff\"/></svg>`;try{$('#art-ib').innerHTML=figSvg('мальчик','бежит')+figSvg('девочка','сидит')}catch(_){}")
# ударение / прочее не трогаем
