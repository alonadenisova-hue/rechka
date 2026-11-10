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
