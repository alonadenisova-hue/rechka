// Объёмный Шарик для «Речки» (three.js, MIT). Персонаж собран из простых фигур прямо в коде —
// без файлов моделей, поэтому лёгкий, свободный от чужих лицензий и одинаково работает без интернета.
// Сборка: cd tools/sharik3d && npm install && npm run build  → app/vendor/sharik3d/sharik3d.js
// В приложении: window.Sharik3D.mount(элемент) → {mood, talk, viseme, level, jump, wave, unmount}
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, SphereGeometry, CapsuleGeometry, TorusGeometry,
  CylinderGeometry, PlaneGeometry, MeshToonMaterial, MeshBasicMaterial, HemisphereLight, DirectionalLight,
  DataTexture, RedFormat, NearestFilter, CanvasTexture, BackSide, SRGBColorSpace, Color, MathUtils,
} from "three";

const C = { fur: 0xd9a066, light: 0xf3d3a8, dark: 0x8a5a33, nose: 0x2a1a12, line: 0x4a2c18, white: 0xffffff,
  pupil: 0x24324a, collar: 0xff6b5b, tag: 0xffc93c, mouth: 0x7a1f2b, tongue: 0xff7f8f, blush: 0xff9aa2 };

let R = null; // общий рендерер (один WebGL на всё приложение)
let rafId = 0, last = 0, cur = null;

function supported() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch (e) { return false; }
}

function toonRamp() {
  const d = new Uint8Array([90, 170, 235, 255]);
  const t = new DataTexture(d, d.length, 1, RedFormat);
  t.minFilter = t.magFilter = NearestFilter; t.needsUpdate = true; return t;
}

function shadowTex() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, "rgba(40,30,60,.35)"); r.addColorStop(1, "rgba(40,30,60,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}

function build() {
  const ramp = toonRamp();
  const mats = {};
  const mat = (col) => mats[col] || (mats[col] = new MeshToonMaterial({ color: col, gradientMap: ramp }));
  const lineMat = new MeshBasicMaterial({ color: C.line, side: BackSide });
  const sph = new SphereGeometry(1, 32, 24), sphLo = new SphereGeometry(1, 16, 12);
  // фигура + тёмный контур (увеличенная копия, видна только изнутри) — «мультяшный» вид
  const part = (parent, geo, col, pos, scl, outline = true, rot) => {
    const m = new Mesh(geo, mat(col)); m.position.set(...pos); m.scale.set(...scl); if (rot) m.rotation.set(...rot);
    parent.add(m);
    if (outline) { const o = new Mesh(geo, lineMat); o.scale.setScalar(1.06); m.add(o); }
    return m;
  };
  const pivot = (parent, pos) => { const g = new Group(); g.position.set(...pos); parent.add(g); return g; };

  const root = new Group();
  const shadow = new Mesh(new PlaneGeometry(2.4, 1.2), new MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; root.add(shadow);

  const body = pivot(root, [0, 0, 0]);
  // туловище (сидит), животик, задние лапы
  part(body, sph, C.fur, [0, 0.7, -0.08], [0.56, 0.66, 0.5]);
  part(body, sph, C.light, [0, 0.72, 0.22], [0.34, 0.42, 0.26], false);
  part(body, sph, C.fur, [-0.42, 0.32, 0.05], [0.26, 0.3, 0.42]);
  part(body, sph, C.fur, [0.42, 0.32, 0.05], [0.26, 0.3, 0.42]);
  part(body, sph, C.light, [-0.45, 0.08, 0.36], [0.17, 0.09, 0.22]);
  part(body, sph, C.light, [0.45, 0.08, 0.36], [0.17, 0.09, 0.22]);
  // передние лапы: шарнир у плеча
  const leg = (x) => {
    const p = pivot(body, [x, 0.98, 0.3]);
    const cap = new CapsuleGeometry(0.11, 0.6, 6, 16);
    part(p, cap, C.fur, [0, -0.5, 0.12], [1, 1, 1], true, [0.12, 0, 0]);
    part(p, sph, C.light, [0, -0.88, 0.2], [0.14, 0.09, 0.17]);
    return p;
  };
  const legL = leg(-0.2), legR = leg(0.2);
  // хвост — цепочка из 4 звеньев
  const tail = [];
  let tp = pivot(body, [0, 0.3, -0.58]);
  tp.rotation.x = -0.9;
  for (let i = 0; i < 4; i++) {
    const r = 0.11 - i * 0.015;
    part(tp, sphLo, i === 3 ? C.light : C.fur, [0, 0.12, 0], [r, 0.16, r]);
    tail.push(tp);
    tp = pivot(tp, [0, 0.2, 0]); tp.rotation.x = 0.25;
  }
  // ошейник с медальоном
  const collar = new Mesh(new TorusGeometry(0.4, 0.07, 12, 40), mat(C.collar));
  collar.position.set(0, 1.08, 0.0); collar.rotation.x = Math.PI / 2 - 0.35; collar.scale.set(1, 0.95, 1); body.add(collar);
  const tag = new Mesh(new CylinderGeometry(0.09, 0.09, 0.03, 20), mat(C.tag));
  tag.rotation.x = Math.PI / 2 - 0.3; tag.position.set(0, 0.9, 0.44); body.add(tag);

  // голова
  const head = pivot(body, [0, 1.22, 0.05]);
  head.scale.setScalar(1.15); // крупная голова — «детские» пропорции
  part(head, sph, C.fur, [0, 0.42, 0], [0.6, 0.54, 0.54]);
  part(head, sph, C.fur, [-0.3, 0.6, -0.05], [0.28, 0.3, 0.3], false); // макушка круглее
  part(head, sph, C.fur, [0.3, 0.6, -0.05], [0.28, 0.3, 0.3], false);
  part(head, sph, C.light, [0, 0.27, 0.36], [0.33, 0.24, 0.3]); // мордочка
  const nose = part(head, sph, C.nose, [0, 0.38, 0.66], [0.11, 0.08, 0.07], false);
  part(nose, sphLo, C.white, [-0.35, 0.4, 0.7], [0.25, 0.22, 0.2], false);
  // рот: тёмная «пещерка» и нижняя челюсть с язычком; челюсть опускается при разговоре
  const mouthIn = part(head, sph, C.mouth, [0, 0.15, 0.55], [0.16, 0.02, 0.1], false);
  // закрытый рот — тёмная линия-улыбка (исчезает, когда рот открывается)
  const mouthLine = new Mesh(new TorusGeometry(0.12, 0.016, 6, 24, Math.PI * 0.8), new MeshBasicMaterial({ color: C.line, transparent: true }));
  mouthLine.position.set(0, 0.2, 0.63); mouthLine.rotation.set(-0.35, 0, Math.PI * 1.1); head.add(mouthLine);
  // губы «трубочкой» для у/о
  const lips = new Mesh(new TorusGeometry(0.075, 0.03, 10, 28), mat(0xc8735f));
  lips.position.set(0, 0.13, 0.62); lips.rotation.x = -0.3; lips.scale.setScalar(0.001); head.add(lips);
  const jaw = pivot(head, [0, 0.2, 0.3]);
  const jawM = part(jaw, sph, C.light, [0, -0.04, 0.2], [0.22, 0.09, 0.2]);
  const tongue = part(jaw, sphLo, C.tongue, [0, 0.0, 0.28], [0.11, 0.035, 0.1], false);
  // надутые щёки (для «Надуй щёчки!»): обычно спрятаны
  const puff = [-0.3, 0.3].map((x) => { const m = part(head, sph, C.light, [x, 0.24, 0.38], [0.001, 0.001, 0.001], false); return m; });
  // щёчки
  const blushMat = new MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.45, depthWrite: false });
  for (const x of [-0.36, 0.36]) { const b = new Mesh(sphLo, blushMat); b.position.set(x, 0.28, 0.4); b.scale.set(0.09, 0.05, 0.03); b.rotation.y = x * 1.4; head.add(b); }
  // глаза: белок, зрачок, блик; моргание — сжатие по высоте
  const eye = (x) => {
    const g = pivot(head, [x, 0.55, 0.42]);
    g.rotation.y = x * 0.9;
    part(g, sph, C.white, [0, 0, 0], [0.13, 0.15, 0.07]);
    const pu = part(g, sph, C.pupil, [0, -0.015, 0.05], [0.085, 0.1, 0.04], false);
    part(pu, sphLo, C.white, [0.3, 0.35, 0.9], [0.3, 0.27, 0.3], false);
    return { g, pu };
  };
  const eyeL = eye(-0.2), eyeR = eye(0.2);
  // брови
  const brow = (x) => { const p = pivot(head, [x, 0.75, 0.42]); p.rotation.y = x * 0.9; part(p, new CapsuleGeometry(0.025, 0.12, 4, 8), C.dark, [0, 0, 0], [1, 1, 1], false, [0, 0, Math.PI / 2]); return p; };
  const browL = brow(-0.2), browR = brow(0.2);
  // уши: висячие, шарнир сверху, качаются на «пружине»
  const ear = (x) => {
    const p = pivot(head, [x * 0.5, 0.78, -0.02]);
    part(p, sph, C.dark, [x * 0.05, -0.32, 0], [0.16, 0.36, 0.08], true, [0, 0, x * 0.15]);
    return p;
  };
  const earL = ear(-1), earR = ear(1);

  return { root, body, head, mouthLine, lips, puff, jaw, jawM, tongue, mouthIn, eyeL, eyeR, browL, browR, earL, earR, legL, legR, tail, shadow };
}

// ---------- состояние и анимация
function makeState() {
  return { pose: null, mood: "calm", moodT: 0, talk: false, vis: null, visT: 0, lvl: 0, open: 0, blinkAt: 1.5, blink: 0,
    jumpT: -1, waveT: -1, earV: [0, 0], earA: [0, 0], prevHeadZ: 0, prevY: 0 };
}

// «покажи на себе»: поворот правой лапы [вперёд-вверх, вбок]
// точки (в координатах Шарика), куда тянется правая лапа; углы считаются из направления от плеча
const TOUCH_PT = { nose: [0, 1.62, 0.98], mouth: [0, 1.36, 0.86], eye: [0.24, 1.84, 0.7], cheek: [0.42, 1.52, 0.66], ear: [0.78, 1.72, 0.45], head: [0.12, 2.2, 0.72] };
const SHOULDER = [0.2, 0.98, 0.3], LEG = 0.92;
const TOUCH = {};
for (const k in TOUCH_PT) {
  const d = TOUCH_PT[k].map((v, i) => v - SHOULDER[i]);
  const len = Math.hypot(...d), n = d.map((v) => v / len);
  const cb = Math.sqrt(1 - n[0] * n[0]);
  TOUCH[k] = [Math.atan2(-n[2] / cb, -n[1] / cb), Math.asin(n[0]), Math.min(1.35, Math.max(1, len / LEG))];
}
const VIS = { a: [1, 1], o: [0.75, 0.7], u: [0.4, 0.45], i: [0.45, 1.25], e: [0.6, 1.15], y: [0.45, 1], m: [0, 1] }; // [раскрытие, ширина]

function animate(P, st, t, dt) {
  const m = st.mood;
  st.moodT += dt;
  // прыжок (радость) и взмах лапой (приглашение)
  let jumpY = 0, squash = 1;
  if (st.jumpT >= 0) {
    st.jumpT += dt;
    const k = st.jumpT / 0.55;
    if (k < 2) { const f = k % 1; jumpY = Math.sin(f * Math.PI) * 0.28; squash = f < 0.12 || f > 0.9 ? 0.9 : 1.04; }
    else st.jumpT = -1;
  }
  let wave = 0;
  if (st.waveT >= 0) { st.waveT += dt; if (st.waveT < 2.2) wave = Math.min(1, st.waveT * 4, (2.2 - st.waveT) * 4); else st.waveT = -1; }

  const breathe = Math.sin(t * 2.2) * 0.015;
  P.body.position.y = jumpY;
  P.body.scale.set(1 + (1 - squash) * 0.5, squash + breathe, 1 + (1 - squash) * 0.5);
  const sh = 1 - jumpY * 0.8; P.shadow.scale.set(sh, sh, 1);

  // голова: покачивание, наклон по настроению
  const tilt = m === "listen" ? 0.28 : m === "comfort" ? 0.18 : m === "invite" ? -0.1 : 0;
  const nod = m === "comfort" ? Math.sin(t * 3) * 0.06 : 0;
  const hz = MathUtils.lerp(P.head.rotation.z, tilt + Math.sin(t * 0.7) * 0.04, Math.min(1, dt * 5));
  P.head.rotation.z = hz;
  P.head.rotation.y = Math.sin(t * 0.45) * 0.15 + (st.talk ? Math.sin(t * 2.7) * 0.05 : 0);
  P.head.rotation.x = -0.05 + nod + (st.talk ? Math.sin(t * 5.3) * 0.03 : 0) + (m === "praise" ? -0.08 : 0);

  // рот: по визему (слог), по громкости или «болтовня», пока звучит речь
  let target = 0, width = 1;
  const pose = st.pose;
  const vis = st.vis || (pose === "tube" ? "u" : pose === "open" ? "a" : pose === "puff" ? "m" : null);
  if (pose === "smile" && !st.vis && !st.talk) { target = 0; width = 1.8; }
  else if (vis && VIS[vis]) { [target, width] = VIS[vis]; if (pose === "puff") width = 0.5; }
  else if (st.lvl > 0) target = Math.min(1, st.lvl);
  else if (st.talk) target = 0.25 + 0.75 * Math.abs(Math.sin(t * 9.5)) * (0.6 + 0.4 * Math.sin(t * 3.1));
  else if (m === "praise") { target = 0.3; width = 1.4; } // широкая улыбка // радостная улыбка с приоткрытым ртом
  st.open += (target - st.open) * Math.min(1, dt * 18);
  const o = Math.max(0, st.open);
  P.jaw.rotation.x = o * 0.55;
  P.mouthIn.scale.set(0.16 * width, 0.02 + o * 0.12, 0.1);
  P.mouthIn.position.y = 0.15 - o * 0.04;
  P.mouthLine.material.opacity = Math.max(0, 1 - o * 6);
  P.mouthLine.scale.set(width, 1, 1);
  const pk = vis === "u" ? 1 : vis === "o" ? 0.75 : 0;
  st.pk = (st.pk || 0) + (pk - (st.pk || 0)) * Math.min(1, dt * 18);
  P.lips.scale.set(Math.max(0.001, st.pk * (vis === "o" ? 1.5 : 1)), Math.max(0.001, st.pk * (vis === "o" ? 1.7 : 1.1)), Math.max(0.001, st.pk));
  const pf = pose === "puff" ? 1 : 0;
  st.pf = (st.pf || 0) + (pf - (st.pf || 0)) * Math.min(1, dt * 8);
  P.puff.forEach((c) => c.scale.set(0.001 + st.pf * 0.2, 0.001 + st.pf * 0.17, 0.001 + st.pf * 0.16));
  P.lips.position.z = 0.6 + st.pk * 0.05;

  // глаза: моргание и радостный прищур
  st.blinkAt -= dt;
  if (st.blinkAt <= 0) { st.blink = 0.16; st.blinkAt = 2 + Math.random() * 3.5; }
  let ey = 1;
  if (st.blink > 0) { st.blink -= dt; ey = Math.abs(st.blink - 0.08) / 0.08 * 0.9 + 0.1; }
  if (m === "praise" && st.moodT < 2.5) ey *= 1.08;
  if (m === "listen") ey = Math.min(1.12, ey * 1.12);
  if (pose === "eyes") ey = 0.06;
  if (pose === "brows") ey = Math.max(ey, 1.18);
  if (pose === "smile") ey = Math.min(ey, 0.8);
  for (const e of [P.eyeL, P.eyeR]) {
    e.g.scale.y = MathUtils.lerp(e.g.scale.y, ey, Math.min(1, dt * 25));
    e.pu.position.x = Math.sin(t * 0.45) * 0.015; // взгляд чуть следует за поворотом головы
  }
  // брови: радость — выше, утешение — «домиком», слушает — одна выше
  const bL = pose === "brows" ? [0.14, -0.1] : m === "praise" ? [0.08, -0.25] : m === "comfort" ? [0.03, 0.3] : m === "listen" ? [0.08, -0.15] : [0, -0.15];
  const bR = pose === "brows" ? [0.14, 0.1] : m === "praise" ? [0.08, 0.25] : m === "comfort" ? [0.03, -0.3] : m === "listen" ? [0, 0.1] : [0, 0.15];
  P.browL.position.y = MathUtils.lerp(P.browL.position.y, 0.75 + bL[0], dt * 8); P.browL.rotation.z = MathUtils.lerp(P.browL.rotation.z, bL[1], dt * 8);
  P.browR.position.y = MathUtils.lerp(P.browR.position.y, 0.75 + bR[0], dt * 8); P.browR.rotation.z = MathUtils.lerp(P.browR.rotation.z, bR[1], dt * 8);

  // уши: пружина — реагируют на прыжки и повороты головы
  const accY = (jumpY - st.prevY) / Math.max(dt, 1e-3); st.prevY = jumpY;
  const accZ = (hz - st.prevHeadZ) / Math.max(dt, 1e-3); st.prevHeadZ = hz;
  // a — отклонение уха наружу (рад); слушает — правое ухо приподнято, утешает — уши опущены
  [P.earL, P.earR].forEach((e, i) => {
    const s = i ? 1 : -1;
    const rest = m === "listen" ? (i ? 0.6 : 0.1) : m === "comfort" ? -0.08 : m === "praise" ? 0.25 : 0.06;
    const force = (rest - st.earA[i]) * 70 - st.earV[i] * 7 - accY * 0.9 + accZ * 0.7 * s;
    st.earV[i] += force * dt; st.earA[i] = MathUtils.clamp(st.earA[i] + st.earV[i] * dt, -0.4, 1.4);
    e.rotation.z = st.earA[i] * s;
  });

  // хвост: виляет — быстрее, когда радуется
  const wagSpeed = m === "praise" ? 16 : m === "invite" ? 10 : m === "listen" ? 7 : m === "comfort" ? 3 : 5;
  const wagAmp = m === "praise" ? 0.7 : m === "comfort" ? 0.25 : 0.45;
  st.wag = (st.wag || 0) + dt * wagSpeed;
  P.tail.forEach((s, i) => { s.rotation.z = Math.sin(st.wag - i * 0.6) * wagAmp * (0.6 + i * 0.25); });

  // лапы: взмах правой (машет), при радости обе чуть вверх; «покажи на себе» — правая лапа к части тела
  const touch = pose && TOUCH[pose];
  if (touch && !wave) {
    P.legR.rotation.x = MathUtils.lerp(P.legR.rotation.x, touch[0], Math.min(1, dt * 8));
    P.legR.rotation.z = MathUtils.lerp(P.legR.rotation.z, touch[1] + Math.sin(t * 6) * 0.03, Math.min(1, dt * 8));
    P.legR.scale.y = MathUtils.lerp(P.legR.scale.y, touch[2], Math.min(1, dt * 8));
  } else {
    P.legR.rotation.x = MathUtils.lerp(P.legR.rotation.x, -wave * 2.2 + (m === "praise" && st.jumpT >= 0 ? -0.5 : 0), Math.min(1, dt * 10));
    P.legR.rotation.z = wave * (0.5 + Math.sin(t * 12) * 0.35);
    P.legR.scale.y = MathUtils.lerp(P.legR.scale.y, 1, Math.min(1, dt * 8));
  }
  P.legL.rotation.x = MathUtils.lerp(P.legL.rotation.x, m === "praise" && st.jumpT >= 0 ? -0.5 : 0, Math.min(1, dt * 10));
  // утешение — «гладит»: левая лапа поднимается и медленно двигается
  if (m === "comfort" && st.moodT < 3) { P.legL.rotation.x = -1.2; P.legL.rotation.z = -0.3 + Math.sin(t * 4) * 0.25; }
  else P.legL.rotation.z = MathUtils.lerp(P.legL.rotation.z, 0, dt * 8);
}

function frame(now) {
  rafId = 0;
  if (!cur || !R.canvas.isConnected) { cur = cur && !R.canvas.isConnected ? null : cur; return; }
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
  if (!document.hidden) {
    animate(R.P, cur.st, now / 1000, dt);
    resize();
    R.renderer.render(R.scene, R.camera);
  }
  rafId = requestAnimationFrame(frame);
}

// full — весь Шарик; face — крупно мордочка (чтобы ребёнок видел рот: «Повторяй за Шариком»)
const VIEWS = { full: { pos: [0, 1.5, 6.6], look: [0, 1.25, 0], fov: 30, need: 0.9 }, face: { pos: [0, 1.85, 3.6], look: [0, 1.66, 0], fov: 30, need: 1.05 } };
function resize() {
  const el = R.canvas.parentElement; if (!el) return;
  const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight || el.clientWidth * 1.1);
  const v = VIEWS[cur.view] || VIEWS.full;
  if (w === R.w && h === R.h && R.v === v) return;
  R.w = w; R.h = h; R.v = v;
  R.renderer.setSize(w, h, false);
  R.camera.position.set(...v.pos); R.camera.lookAt(...v.look);
  R.camera.aspect = w / h;
  // весь Шарик (или вся мордочка) в кадре при любой форме контейнера
  R.camera.fov = w / h < v.need ? v.fov / Math.max(0.5, w / h / v.need) : v.fov;
  R.camera.updateProjectionMatrix();
}

function init() {
  if (R) return true;
  if (!supported()) return false;
  const canvas = document.createElement("canvas");
  canvas.className = "sh3d";
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:manipulation";
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" }); }
  catch (e) { return false; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0xb59a85, 1.6));
  const key = new DirectionalLight(0xffffff, 2.2); key.position.set(2, 4, 5); scene.add(key);
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.5, 6.6); camera.lookAt(0, 1.25, 0);
  const P = build(); scene.add(P.root);
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); R.lost = true; });
  R = { canvas, renderer, scene, camera, P, w: 0, h: 0, lost: false };
  return true;
}

function api(st) {
  const h = {
    mood(m) { if (st.mood !== m) { st.mood = m; st.moodT = 0; } if (m === "praise") h.jump(); if (m === "invite") h.wave(); return h; },
    talk(on) { st.talk = !!on; if (!on) { st.vis = null; st.lvl = 0; } return h; },
    pose(p) { st.pose = p || null; return h; }, // smile, tube, open, puff, eyes, brows, nose, mouth, eye, cheek, ear, head
    viseme(v) { st.vis = v || null; return h; }, // 'a','o','u','i','e','y','m' или null
    level(v) { st.lvl = Math.max(0, +v || 0); return h; }, // громкость звука речи 0…1
    jump() { st.jumpT = 0; return h; },
    wave() { st.waveT = 0; return h; },
    unmount() { if (cur && cur.st === st) { cur = null; R.canvas.remove(); } },
    get active() { return !!cur && cur.st === st && R.canvas.isConnected; },
  };
  return h;
}

// Поместить Шарика в элемент (холст переезжает туда; одновременно Шарик живёт в одном месте).
function mount(el, opt = {}) {
  if (!init() || R.lost) return null;
  const st = makeState();
  el.appendChild(R.canvas);
  R.w = R.h = 0;
  cur = { st, el, view: opt.view || "full" };
  if (!rafId) { last = 0; rafId = requestAnimationFrame(frame); }
  return api(st);
}

window.Sharik3D = { supported, mount, version: 1 };
