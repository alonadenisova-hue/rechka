// Проверка логики Шарика без сети: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { fallbackReply, parseRequest, sanitize, userMessage, SYSTEM_PROMPT, type SharikRequest } from "../src/sharik.ts";

const base: SharikRequest = { available: ["body", "mirr", "bal"], levels: { body: 2 }, event: { type: "result", game: "body", task: "Покажи, где нос", ok: true, attempts: 1, how: "tap" } };

test("инструкция содержит каталог игр", () => {
  assert.match(SYSTEM_PROMPT, /- body: Покажи, где/);
  assert.match(SYSTEM_PROMPT, /- mirr: Зеркало/);
});

test("ответ модели проходит, если игра из каталога и включена", () => {
  const r = sanitize({ say: "Да! Это нос! А где ушко?", next: { kind: "game", game: "body", level: 3 }, tone: "praise" }, base);
  assert.deepEqual(r.next, { kind: "game", game: "body", level: 3 });
  assert.equal(r.say, "Да! Это нос! А где ушко?");
});

test("игра не из списка включённых — Шарик её не включит", () => {
  const r = sanitize({ say: "Давай цифры!", next: { kind: "game", game: "num", level: 1 }, tone: "invite" }, base);
  assert.equal(r.next.game, null);
  assert.equal(r.say, fallbackReply(base).say, "слова про чужую игру не произносим");
});

test("выдуманная игра отбрасывается", () => {
  const r = sanitize({ say: "Ок", next: { kind: "game", game: "hack", level: 1 }, tone: "invite" }, { ...base, available: undefined });
  assert.equal(r.next.game, null);
});

test("уровень ограничен пределами игры", () => {
  const r = sanitize({ say: "Ок", next: { kind: "game", game: "body", level: 99 }, tone: "invite" }, base);
  assert.equal(r.next.level, 3);
});

test("мама нажала «хватит» — всегда конец, даже если модель хочет играть", () => {
  const req = { ...base, event: { type: "parent_end" as const } };
  const r = sanitize({ say: "Ещё!", next: { kind: "game", game: "body", level: 1 }, tone: "invite" }, req);
  assert.equal(r.next.kind, "end");
  assert.equal(r.next.game, null);
  assert.equal(r.say, fallbackReply(req).say, "прощаемся, а не зовём играть");
});

test("мусор вместо ответа — запасная реплика", () => {
  const r = sanitize("не json", base);
  assert.deepEqual(r, fallbackReply(base));
  assert.ok(r.say.length > 0);
});

test("слишком длинная реплика обрезается", () => {
  const r = sanitize({ say: "Молодец! ".repeat(60), next: { kind: "wait", game: null, level: null }, tone: "praise" }, base);
  assert.ok(r.say.length <= 220);
});

test("проверка входа", () => {
  assert.equal(parseRequest(null), null);
  assert.equal(parseRequest({ event: { type: "взлом" } }), null);
  assert.equal(parseRequest({ event: { type: "start" }, history: new Array(60).fill({ who: "event", text: "x" }) }), null);
  assert.ok(parseRequest({ event: { type: "start" } }));
});

test("сообщение для модели: имя, время, событие, только игры из каталога", () => {
  const m = userMessage({ ...base, child: { name: "Лев" }, minutes: 7, plannedMinutes: 20, available: ["body", "evil"], event: { ...base.event, heard: "нос" } });
  assert.match(m, /Имя ребёнка: Лев/);
  assert.match(m, /7 мин из 20/);
  assert.match(m, /Включённые игры: body\./);
  assert.match(m, /heard: «нос»/);
});

// ---- v32: голос Льва (событие voice) и распознавание /stt
import { cleanTranscript, looksLikeWav } from "../src/stt.ts";
import worker, { type Env } from "../src/index.ts";

test("событие voice: длительность и heard попадают в запрос к модели", () => {
  const m = userMessage({ ...base, event: { type: "voice", game: "body", voiceMs: 1200, heard: "нос" } });
  assert.match(m, /тип: voice/);
  assert.match(m, /голос: 1\.2 с/);
  assert.match(m, /heard: «нос»/);
  assert.match(SYSTEM_PROMPT, /никогда не поправляй/);
});

test("расшифровка: выдумки Whisper и мусор отбрасываются", () => {
  assert.equal(cleanTranscript("  Да!  "), "Да!");
  assert.equal(cleanTranscript("Продолжение следует..."), "");
  assert.equal(cleanTranscript("Субтитры сделал DimaTorzok"), "");
  assert.equal(cleanTranscript("..."), "");
  assert.equal(cleanTranscript("[музыка]"), "");
  assert.equal(cleanTranscript(null), "");
  const long = cleanTranscript(Array(40).fill("да").join(" "));
  assert.ok(long.length <= 81 && long.endsWith("…"));
});

function wav(bytes = 2000): ArrayBuffer {
  const b = new Uint8Array(bytes);
  b.set([..."RIFF"].map((c) => c.charCodeAt(0)), 0);
  b.set([..."WAVE"].map((c) => c.charCodeAt(0)), 8);
  return b.buffer;
}

test("WAV узнаётся по заголовку", () => {
  assert.ok(looksLikeWav(wav()));
  assert.ok(!looksLikeWav(new TextEncoder().encode("hello world, this is not a wav file at all!!!").buffer as ArrayBuffer));
});

const stt = (env: Partial<Env>, body: ArrayBuffer, code = "1234") =>
  worker.fetch(new Request("https://x/stt", { method: "POST", headers: { "X-Sharik-Code": code, "Content-Type": "audio/wav" }, body }), { ANTHROPIC_API_KEY: "", SHARIK_CODE: "1234", ...env } as Env);

test("/stt: распознаёт через Workers AI и чистит текст", async () => {
  let got: Record<string, unknown> = {};
  const AI = { run: async (_m: string, inp: Record<string, unknown>) => { got = inp; return { text: " Нос! " }; } } as unknown as Ai;
  const r = await stt({ AI }, wav());
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { text: "Нос!", note: "ok" });
  assert.equal(got.language, "ru");
  assert.equal(typeof got.audio, "string");
});

test("/stt: без привязки AI, с неверным кодом, с мусором", async () => {
  assert.deepEqual(await (await stt({}, wav())).json(), { text: "", note: "no_ai" });
  assert.equal((await stt({}, wav(), "0000")).status, 401);
  assert.equal((await stt({}, new ArrayBuffer(10))).status, 400);
  assert.equal((await stt({}, wav(500_000))).status, 413);
  const AI = { run: async () => { throw new Error("boom"); } } as unknown as Ai;
  assert.deepEqual(await (await stt({ AI }, wav())).json(), { text: "", note: "error" });
  const AI2 = { run: async () => ({ text: "Спасибо за просмотр!" }) } as unknown as Ai;
  assert.deepEqual(await (await stt({ AI: AI2 }, wav())).json(), { text: "", note: "empty" });
});
