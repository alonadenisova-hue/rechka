// Логика Шарика без привязки к Cloudflare: инструкция для модели, разбор запроса приложения,
// проверка ответа модели. Вынесена отдельно, чтобы проверять её тестами без сети.
import { TASK_IDS, TASKS, catalogText } from "./tasks.ts";

// ---- что присылает приложение
export interface SharikEvent {
  type: "start" | "result" | "silence" | "voice" | "tired" | "parent_end" | "parent_pause";
  game?: string; // игра, к которой относится событие
  task?: string; // конкретное задание («Покажи, где нос»)
  ok?: boolean; // справился (засчитано: нажатие, камера, голос или кнопка мамы)
  attempts?: number; // сколько попыток понадобилось
  voiceMs?: number; // длительность голоса (попытка сказать), мс
  heard?: string; // распознанные слова — только для подсказки, не для оценки
  how?: "tap" | "camera" | "voice" | "parent";
}

export interface SharikRequest {
  child?: { name?: string };
  minutes?: number; // сколько минут идёт занятие
  plannedMinutes?: number; // сколько минут задумано
  levels?: Record<string, number>; // текущий уровень по играм
  available?: string[]; // какие игры включены в приложении
  history?: { who: "sharik" | "event"; text: string }[]; // последние реплики и события
  event: SharikEvent;
}

// ---- что возвращаем приложению
export type NextKind = "game" | "wait" | "break" | "end";
export interface SharikReply {
  say: string; // что сказать вслух (коротко)
  next: { kind: NextKind; game: string | null; level: number | null };
  tone: "praise" | "invite" | "comfort" | "calm";
}

export const REPLY_SCHEMA = {
  type: "object",
  properties: {
    say: { type: "string", description: "Что Шарик говорит вслух: 1–2 очень коротких предложения для 5-летнего ребёнка" },
    next: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["game", "wait", "break", "end"] },
        game: { anyOf: [{ type: "string" }, { type: "null" }], description: "id игры из каталога, если kind=game или break" },
        level: { anyOf: [{ type: "integer" }, { type: "null" }], description: "уровень игры (1 — самый лёгкий) или null — оставить как есть" },
      },
      required: ["kind", "game", "level"],
      additionalProperties: false,
    },
    tone: { type: "string", enum: ["praise", "invite", "comfort", "calm"] },
  },
  required: ["say", "next", "tone"],
  additionalProperties: false,
} as const;

// Постоянная часть инструкции — одинакова для всех запросов (кэшируется у Anthropic, дешевле и быстрее).
export const SYSTEM_PROMPT = `Ты — Шарик, добрый весёлый пёс из детского приложения «Речка». Ты ведёшь занятие с мальчиком Львом (5,5 лет, сенсомоторная алалия: понимает много, говорит мало). Рядом всегда мама или папа.

Как ты говоришь:
- По-русски, очень коротко: 1–2 предложения, до 12 слов. Простые частые слова, одна мысль за раз.
- Тепло и радостно, без сюсюканья. Хвалишь сразу и конкретно: «Да! Это нос!».
- Не ругаешь и не говоришь «неправильно». Если не получилось — мягко подсказываешь и предлагаешь ещё раз или полегче.
- Не просишь Льва произносить длинные фразы. Любую попытку голоса встречаешь радостно: важна попытка, а не точность.
- Слова из поля heard — это примерная расшифровка речи Льва. Не поправляй его по ним и не делай вывод, что он сказал неверно.

Как ты ведёшь занятие:
- Даёшь задания ТОЛЬКО из каталога ниже (поле id). Другие игры и темы не предлагаешь.
- Чередуешь: 2–3 упражнения, потом короткая игра-перерыв (reward). Не давай одну и ту же игру больше 2 раз подряд.
- Если Лев справляется с первой попытки 3 раза подряд — можно на уровень выше. Если 2 ошибки подряд — уровень ниже или игра полегче.
- Если долго молчит или отвлёкся (event silence) — позови по имени, предложи что-то весёлое и лёгкое.
- Если устал (event tired, много ошибок подряд, занятие дольше задуманного) — kind=break с игрой-перерывом или kind=end.
- Когда время занятия вышло или мама нажала «хватит» (parent_end) — тепло прощаешься, kind=end.
- Лев попытался сказать (event voice: был голос, длительность в секундах) — сразу и коротко радуйся попытке: «Ух ты, ты сказал!», «Как громко!». Если есть heard и это похоже на слово по теме — можно повторить его как образец («Да! Нос!»), но никогда не поправляй и не проси сказать «правильно». Потом продолжай занятие: обычно kind=game — ту игру, которую собирался включить (поле игра в событии), или другую.
- Пауза от мамы (parent_pause) — kind=wait, скажи что-то короткое вроде «Жду тебя!».

Что ты отвечаешь (JSON по схеме):
- say — что сказать вслух сейчас (похвала за прошлое + приглашение к следующему, если оно есть).
- next.kind: game — включить игру; break — включить игру-перерыв; wait — ничего не включать, ждать; end — закончить занятие.
- next.game — id из каталога (для game и break), иначе null. next.level — уровень или null (оставить текущий).
- tone — настроение реплики.

Каталог игр (id: описание):
${catalogText()}`;

// Переменная часть: что происходит сейчас.
export function userMessage(req: SharikRequest): string {
  const name = (req.child?.name || "Лев").slice(0, 30);
  const avail = (req.available || []).filter((g) => TASK_IDS.has(g));
  const lv = req.levels || {};
  const hist = (req.history || []).slice(-12).map((h) => `${h.who === "sharik" ? "Шарик" : "Событие"}: ${String(h.text).slice(0, 160)}`);
  const e = req.event;
  const ev = [
    `тип: ${e.type}`,
    e.game ? `игра: ${e.game}` : "",
    e.task ? `задание: ${String(e.task).slice(0, 80)}` : "",
    e.ok !== undefined ? `справился: ${e.ok ? "да" : "нет"}` : "",
    e.attempts ? `попыток: ${e.attempts}` : "",
    e.how ? `как ответил: ${e.how}` : "",
    e.voiceMs ? `голос: ${(e.voiceMs / 1000).toFixed(1)} с` : "",
    e.heard ? `heard: «${String(e.heard).slice(0, 60)}»` : "",
  ].filter(Boolean).join("; ");
  return [
    `Имя ребёнка: ${name}.`,
    `Занятие идёт ${Math.round(req.minutes || 0)} мин из ${Math.round(req.plannedMinutes || 20)}.`,
    `Включённые игры: ${avail.length ? avail.join(", ") : "все из каталога"}.`,
    `Уровни сейчас: ${Object.entries(lv).filter(([g]) => TASK_IDS.has(g)).map(([g, l]) => `${g}=${l}`).join(", ") || "нет данных"}.`,
    hist.length ? `Последнее:\n${hist.join("\n")}` : "Это начало занятия.",
    `Сейчас: ${ev}.`,
    `Что скажет Шарик и что дальше?`,
  ].join("\n");
}

const FALLBACK_SAY: Record<SharikEvent["type"], string> = {
  start: "Привет! Я Шарик. Давай играть!",
  result: "Молодец! Играем дальше!",
  silence: "Эй, я тут! Поиграем?",
  voice: "Ух ты, как здорово!",
  tired: "Давай отдохнём!",
  parent_end: "Ты молодец! Пока-пока!",
  parent_pause: "Жду тебя!",
};

// Запасной ответ, если модель недоступна или ответила не по правилам: приложение продолжает само.
export function fallbackReply(req: SharikRequest): SharikReply {
  const t = req.event?.type || "result";
  const end = t === "parent_end";
  return { say: FALLBACK_SAY[t] || FALLBACK_SAY.result, next: { kind: end ? "end" : t === "parent_pause" ? "wait" : "game", game: null, level: null }, tone: end ? "calm" : "praise" };
}

// Проверка ответа модели: только игры из каталога и включённые в приложении, уровень в допустимых пределах.
export function sanitize(raw: unknown, req: SharikRequest): SharikReply {
  const fb = fallbackReply(req);
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Partial<SharikReply>;
  let say = typeof r.say === "string" ? r.say.replace(/\s+/g, " ").trim() : "";
  if (!say) say = fb.say;
  if (say.length > 220) say = say.slice(0, 220).replace(/[^.!?…]*$/, "") || say.slice(0, 220);
  const kinds: NextKind[] = ["game", "wait", "break", "end"];
  let kind: NextKind = r.next && kinds.includes(r.next.kind as NextKind) ? (r.next.kind as NextKind) : fb.next.kind;
  const avail = new Set((req.available && req.available.length ? req.available : [...TASK_IDS]).filter((g) => TASK_IDS.has(g)));
  let game = r.next && typeof r.next.game === "string" && avail.has(r.next.game) ? r.next.game : null;
  // модель позвала в игру не из списка — её слова про эту игру не подходят, говорим нейтрально, игру выберет приложение
  const wanted = r.next && typeof r.next.game === "string" && r.next.game ? r.next.game : null;
  if ((kind === "game" || kind === "break") && wanted && !game) say = fb.say;
  let level: number | null = null;
  if (game && r.next && Number.isInteger(r.next.level)) {
    const max = TASKS.find((t) => t.id === game)?.levels || 1;
    level = Math.min(max, Math.max(1, r.next.level as number));
  }
  if (req.event?.type === "parent_end") { if (kind !== "end") say = fb.say; kind = "end"; }
  if (req.event?.type === "parent_pause") kind = "wait";
  const tones = ["praise", "invite", "comfort", "calm"] as const;
  const tone = tones.includes(r.tone as (typeof tones)[number]) ? (r.tone as SharikReply["tone"]) : fb.tone;
  return { say, next: { kind, game: kind === "game" || kind === "break" ? game : null, level: kind === "game" || kind === "break" ? level : null }, tone };
}

// Проверка входа: защищает от мусора и слишком больших запросов.
export function parseRequest(body: unknown): SharikRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as SharikRequest;
  const types = ["start", "result", "silence", "voice", "tired", "parent_end", "parent_pause"];
  if (!b.event || !types.includes(b.event.type)) return null;
  if (b.history && (!Array.isArray(b.history) || b.history.length > 50)) return null;
  if (b.available && !Array.isArray(b.available)) return null;
  return b;
}
