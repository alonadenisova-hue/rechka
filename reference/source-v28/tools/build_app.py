"""Собирает папку app/ для Netlify (PWA: manifest, иконки, кеш без интернета) и архив."""
import os,json,shutil,sys
from PIL import Image,ImageDraw,ImageFont
VER=sys.argv[1]
A='/home/claude/rechka/app/';S='/home/claude/rechka/src/'
shutil.rmtree(A,ignore_errors=True);os.makedirs(A)
for f in os.listdir(S):
    if (f.startswith('data') and f.endswith('.js')) or f.startswith('sounds'): shutil.copy(S+f,A+f)
for d in ['anim','anim2','img7','img8','img13','img24']: shutil.copytree(S+d,A+d)
for n in (192,512):
    im=Image.new('RGB',(n,n),'#dff1fb');d=ImageDraw.Draw(im)
    d.rounded_rectangle([n*.08,n*.08,n*.92,n*.92],radius=n*.2,fill='#ffc93c')
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',int(n*.5))
    d.text((n/2,n/2),'Р',font=f,fill='#ff6b5b',anchor='mm');im.save(f'{A}icon-{n}.png')
json.dump({"name":"Речка","short_name":"Речка","start_url":"./index.html","scope":"./","display":"standalone","orientation":"any","background_color":"#dff1fb","theme_color":"#dff1fb","lang":"ru",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},open(A+'manifest.webmanifest','w'),ensure_ascii=False,indent=1)
head='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#dff1fb"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes">\n'
body=open(S+'body.html').read().replace('id="home" class="screen">','id="home" class="screen"><div style="position:fixed;left:8px;bottom:4px;font:12px sans-serif;opacity:.45;pointer-events:none;z-index:1">версия %s</div>'%VER,1)
open(A+'index.html','w').write(head+body+'<script>if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rl){rl=true;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{}))}</script>\n</body></html>\n')
files=['./']+sorted(os.path.relpath(os.path.join(r,f),A) for r,_,fs in os.walk(A) for f in fs)
open(A+'sw.js','w').write("""const CACHE='rechka-v%s';
const FILES=%s;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(FILES.map(f=>fetch(f,{cache:'reload'}).then(r=>{if(r.ok)return c.put(f,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const fresh=u=>u.origin===location.origin&&(/\\/$|\\.html$|\\.js$|\\.webmanifest$/.test(u.pathname));
const put=(req,res)=>{const u=new URL(req.url);if((res.ok&&u.origin===location.origin)||(/^fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)&&(res.ok||res.type==='opaque'))){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res};
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;const u=new URL(q.url);
 if(q.mode==='navigate'||fresh(u)){e.respondWith(new Promise(ok=>{let done=false;const fin=r=>{if(!done){done=true;ok(r)}};
  fetch(q,{cache:'no-store'}).then(r=>fin(put(q,r))).catch(()=>caches.match(q,{ignoreSearch:true}).then(c=>fin(c||caches.match('index.html'))));
  setTimeout(()=>caches.match(q,{ignoreSearch:true}).then(c=>{if(c)fin(c)}),5000)}));return}
 e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q).then(res=>put(q,res)).catch(()=>caches.match('index.html'))))});
"""%(VER,json.dumps(files,ensure_ascii=False)))
z='/mnt/user-data/outputs/rechka-app-v%s.zip'%VER
if os.path.exists(z):os.remove(z)
os.system(f'cd {A} && zip -qr {z} .');print(z,os.path.getsize(z),len(files))
