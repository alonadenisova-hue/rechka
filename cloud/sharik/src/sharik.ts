// Логика Шарика без привязки к Cloudflare: инструкция для модели, разбор запроса приложения,
// проверка ответа модели. Вынесена отдельно, чтобы проверять её тестами без сети.
import { TASK_IDS, TASKS, catalogText } from "./tasks.ts";
import { canonical } from "./phrases.ts";

// ---- что присылает приложение
export interface SharikEvent {
  type: "start" | "result" | "silence" | "voice" | "tired" | "parent_end" | "parent_pause" | "parent_say" | "summary" | "lesson";
  text?: string; // parent_say: слова родителя; summary: итоги занятия, посчитанные на телефоне
  game?: string; // игра, к которой относится событие
  task?: string; // конкретное задание («Покажи, где нос»)
  good?: string; // что Шарик уже сказал после верного ответа («Это нос.»)
  ok?: boolean; // справился (засчитано: нажатие, камера, голос или кнопка мамы)
  attempts?: number; // сколько попыток понадобилось
  voiceMs?: number; // длительность голоса (попытка сказать), мс
  heard?: string; // распознанные слова — только для подсказки, не для оценки
  how?: "tap" | "camera" | "voice" | "parent";
  // v47, «Пятиминутка» (event lesson): какую помощь можно выбрать, если следующая попытка не удастся
  allowed?: string[]; // разрешённые действия (из LESSON_ACTIONS)
  helps?: string[]; // какие помощи уже были в этом задании
  stage?: string; // что сейчас: ask — вопрос задан, wrong — ошибся, silence — молчит, help — помощь идёт
}

// Действия ведущего в «Пятиминутке»: модель выбирает одно из разрешённых, приложение проверяет и выполняет.
export const LESSON_ACTIONS = ["repeat", "more_time", "model", "fewer", "easier", "next"] as const;
export type LessonAction = (typeof LESSON_ACTIONS)[number];

// Сводка прошлых занятий за 7 дней — считается на телефоне, сервер её не хранит.
export interface SharikMemory {
  days?: number; // в сколько дней занимались
  lastDaysAgo?: number; // сколько дней назад было последнее занятие
  games?: { game: string; rounds: number; first: number; lvFrom?: number; lvNow?: number }[];
  hard?: { game: string; item: string; tries?: number; misses?: number; daysAgo?: number }[];
  better?: { game: string; item: string; daysAgo?: number }[];
}

export interface SharikRequest {
  memory?: SharikMemory; // необязательно: Шарик помнит прошлые занятия
  child?: { name?: string };
  hero?: string; // кто на экране: "cat" — рисованный кот, "dog" — собака
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
  next: { kind: NextKind; game: string | null; level: number | null; action?: LessonAction | null };
  tone: "praise" | "invite" | "comfort" | "calm";
}

export const REPLY_SCHEMA = {
  type: "object",
  properties: {
    say: { type: "string", description: "Что Шарик говорит вслух: 1–2 очень коротких предложения для 5-летнего ребёнка; после задания можно пустую строку" },
    next: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["game", "wait", "break", "end"] },
        game: { anyOf: [{ type: "string" }, { type: "null" }], description: "id игры из каталога, если kind=game или break" },
        level: { anyOf: [{ type: "integer" }, { type: "null" }], description: "уровень игры (1 — самый лёгкий) или null — оставить как есть" },
        action: { anyOf: [{ type: "string", enum: [...LESSON_ACTIONS] }, { type: "null" }], description: "только для event lesson: одно действие из allowed, иначе null" },
      },
      required: ["kind", "game", "level", "action"],
      additionalProperties: false,
    },
    tone: { type: "string", enum: ["praise", "invite", "comfort", "calm"] },
  },
  required: ["say", "next", "tone"],
  additionalProperties: false,
} as const;

// Постоянная часть инструкции — одинакова для всех запросов (кэшируется у Anthropic, дешевле и быстрее).
export const SYSTEM_PROMPT = `Ты — Шарик, добрый весёлый герой детского приложения «Речка» (на экране ты кот или пёс — см. «Герой»; говори о себе соответственно: «мяу» или «гав», лапы, хвост). Ты ведёшь занятие с мальчиком Львом (5,5 лет, сенсомоторная алалия: понимает много, говорит мало). Рядом всегда мама или папа.

Как ты говоришь:
- По-русски, очень коротко: 1–2 предложения, до 12 слов. Простые частые слова, одна мысль за раз.
- Тепло и радостно, без сюсюканья. Хвалишь сразу и конкретно: «Да! Это нос!».
- Не ругаешь и не говоришь «неправильно». Если не получилось — мягко подсказываешь и предлагаешь ещё раз или полегче.
- Не просишь Льва произносить длинные фразы. Любую попытку голоса встречаешь радостно: важна попытка, а не точность.
- Слова из поля heard — это примерная расшифровка речи Льва. Не поправляй его по ним и не делай вывод, что он сказал неверно.

Как устроено занятие (важно):
- Ты всё время на экране рядом с заданием. Вопрос задания задаёт игра твоим голосом, и она же сразу хвалит за верный ответ и называет его («Молодец! Это нос.») — это уже прозвучало (в событии: задание и «Шарик уже сказал»).
- Поэтому после задания (event result) НЕ хвали повторно и НЕ называй новое задание или предмет: какой будет вопрос, решит игра. Твоё say — короткий переход, одно предложение до 6 слов: «Давай ещё!», «А теперь новая игра!», «Теперь про цвета!». Если остаёмся в той же игре — say можно оставить пустым ("").
- Ответ нужен быстро: если ты опоздаешь, занятие пойдёт без твоей реплики.
- Разговор один на один. Примерно раз в 3–4 задания (и когда Лев в хорошем настроении) вместо перехода задай Льву ОДИН простой вопрос про только что сделанное задание — с выбором из двух или «да — нет»: «Киса спит или бежит?», «Это нос? Да или нет?». Тогда say должно кончаться знаком «?» — приложение покажет тебя крупно и послушает Льва. Не чаще, и не два вопроса подряд.
- На старте (event start) приложение уже сказало «Привет, Лев!» — не здоровайся снова; скажи одно короткое тёплое предложение (можно вспомнить приятное из прошлых занятий) и выбери первую игру — лёгкую и любимую.

Как ты ведёшь занятие:
- Даёшь задания ТОЛЬКО из каталога ниже (поле id). Другие игры и темы не предлагаешь.
- Чередуешь: 2–3 упражнения, потом короткая игра-перерыв (reward). Не давай одну и ту же игру больше 2 раз подряд.
- Если Лев справляется с первой попытки 3 раза подряд — можно на уровень выше. Если 2 ошибки подряд — уровень ниже или игра полегче.
- Если долго молчит или отвлёкся (event silence) — позови по имени, предложи что-то весёлое и лёгкое.
- Если устал (event tired, много ошибок подряд, занятие дольше задуманного) — kind=break с игрой-перерывом или kind=end.
- Когда время занятия вышло или мама нажала «хватит» (parent_end) — тепло прощаешься, kind=end.
- Лев попытался сказать (event voice: был голос, длительность в секундах) — сразу и коротко радуйся попытке: «Ух ты, ты сказал!», «Как громко!». Если есть heard и это похоже на слово по теме — можно повторить его как образец («Да! Нос!»), но никогда не поправляй и не проси сказать «правильно». Потом продолжай занятие: обычно kind=game — ту игру, которую собирался включить (поле игра в событии), или другую.
- Если есть сводка прошлых занятий: на старте можешь коротко вспомнить приятное («Вчера ты здорово нашёл нос!»). Трудное (hard) давай повторить, когда Лев в хорошем настроении, и не чаще раза-двух за занятие. Когда трудное сейчас получилось — похвали за прогресс: «Вчера ушко было трудно, а сегодня — получилось!». Прогресс (better) — повод похвалить. Не упрекай за прошлые ошибки.
- Пауза от мамы (parent_pause) — kind=wait, скажи что-то короткое вроде «Жду тебя!».

Как учит логопед Льва (по её занятиям, ноябрь 2026):
- Вопросы «Что делает?» и «Какой?» Льву пока трудны: сразу давай выбор из двух — «Едет или летит?», «Красный или зелёный?», «На столе или под столом?».
- Лев часто повторяет последнее услышанное слово. В вопросе-выборе правильный ответ ставь то первым, то вторым.
- Образец фразы — из двух слов: кто + действие («Автобус едет», «Киса спит»). Три слова пока трудно, не жди их.
- Не повторяй «скажи, скажи». Спроси «Что тут?», спокойно скажи образец и дай ему повторить самому. Провоцируй, но не заставляй.
- Говори про себя и про него через «я»: «Я сижу! А ты?», «Что ты сделал? Я положил!», «Кто молодец? Я!». Можно «Мама несёт — она несёт».
- «Не» и «да — нет»: «Это слон? Нет, не слон. Это корова». Ответ «да» или «нет» — тоже хорошая попытка.
- Предлоги по шагам: сначала показать или положить, потом сказать только «на» или «под», потом «на столе», «под столом».
- Один — много: «Где коза? А где козы? Много!» — тяни голосом окончание.
- Части тела: на картинке, потом «А у тебя где?», потом «А у мамы где?».
- Чередуй: любимое и лёгкое, потом трудное, потом снова лёгкое. После ошибки или слёз — сразу лёгкое и любимое.
- Признаки усталости: молчит на простое, «пока», много ошибок подряд — предложи перерыв (break) или закончи, не настаивай.
- Говори спокойно и уверенно, без спешки. Длинные трудные слова (велосипед, бегемоты) не проси повторять.

Родители рядом и могут обратиться к тебе (event parent_say, поле «слова родителя» — сказано голосом или написано, расшифровка может быть неточной):
- Отвечай взрослому: коротко и по делу, 1–3 предложения обычным языком. Это единственный случай, когда say обращено не к Льву.
- Команда «включи игру про …», «давай цвета», «другую игру» — next.kind=game и id подходящей игры из каталога (только из включённых). Скажи, что включаешь.
- «Полегче» / «посложнее» — та же игра (поле игра в событии) и next.level на 1 ниже / выше текущего уровня; если уже крайний уровень — предложи другую игру полегче / потруднее.
- «Перерыв», «отдохнём» — kind=break с игрой-перерывом. «Хватит», «заканчиваем» — kind=end и тёплое прощание с Львом. «Подожди», «пауза» — kind=wait.
- Вопрос («что ему трудно?», «как он сегодня?», «что повторить дома?») — ответь по событиям занятия и сводке прошлых занятий; next.kind=game, next.game=null (занятие продолжается как шло). Не выдумывай того, чего нет в данных. Речь Льва не оценивай.
- Если не понял слова — переспроси одной фразой, next.kind=game, next.game=null.

«Пятиминутка» (event lesson): короткое занятие из трёх упражнений, которое ведёт приложение. Ты не говоришь (say — пустая строка) и не выбираешь игру (next.kind=game, next.game=null, next.level=null). Ты выбираешь, как помочь Льву, если следующая попытка не удастся: next.action — одно из списка allowed:
- repeat — повторить тот же вопрос; more_time — подождать ещё молча; model — показать образец (герой сам делает или говорит); fewer — убрать неверную карточку; easier — упростить; next — перейти к следующему, без похвалы.
- Обычно по порядку: сначала repeat или more_time, потом model, потом fewer или easier; next — когда помощи уже были 3 раза или Лев явно устал. Не выбирай то, что уже было в helps два раза подряд.
- После ошибки (stage wrong) — лучше model или fewer, чем просто repeat. Если Лев молчит (silence) — more_time или repeat.
- Если allowed пуст или ничего не подходит — null.

Итог занятия для мамы (event summary, поле «итоги» — посчитано на телефоне): напиши маме 3–4 коротких предложения обычным языком: что сегодня получилось, что было трудно, что стоит повторить дома (один-два простых совета в духе логопеда: выбор из двух, образец из двух слов, не заставлять). Только по данным, без выдумок и без оценки речи. next.kind=end.

Говори живо и разнообразно (решение мамы, ноябрь 2026 — экономию на готовых фразах отменили):
- Говори своими словами, как добрый друг. Не повторяй одну и ту же фразу: посмотри в «Последнее», что ты уже говорил, и скажи иначе.
- Меняй слова радости и переходов: «Вот это да!», «Ловко!», «Ты быстрый!», «Мне нравится с тобой играть!», «А сейчас будет интересно!», «Хочешь ещё?».
- Замечай конкретное: что было в задании, что получилось с первой попытки, что вчера было трудно.
- При этом правила выше остаются: коротко, простые слова, одна мысль.

Что ты отвечаешь (JSON по схеме):
- say — что сказать вслух сейчас: короткий переход, вопрос Льву или пустая строка (см. «Как устроено занятие»).
- next.kind: game — включить игру; break — включить игру-перерыв; wait — ничего не включать, ждать; end — закончить занятие.
- next.game — id из каталога (для game и break), иначе null. next.level — уровень или null (оставить текущий).
- tone — настроение реплики.

Каталог игр (id: описание):
${catalogText()}`;

const ago = (d?: number) => (d === undefined ? "" : d <= 0 ? "сегодня" : d === 1 ? "вчера" : `${d} дн. назад`);
const num = (v: unknown, lo: number, hi: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : undefined;
const word = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).replace(/[«»\n\r]/g, " ").trim().slice(0, 24) : "");

// Сводка прошлых занятий текстом для модели. Только игры из каталога, числа в разумных пределах.
export function memoryText(m: SharikMemory | undefined): string {
  if (!m || typeof m !== "object") return "";
  const lines: string[] = [];
  const days = num(m.days, 0, 7), last = num(m.lastDaysAgo, 0, 7);
  if (days) lines.push(`Занимались ${days} дн. из последних 7, последний раз — ${ago(last)}.`);
  const games = (Array.isArray(m.games) ? m.games : []).filter((g) => g && TASK_IDS.has(g.game)).slice(0, 8);
  if (games.length) lines.push("Игры: " + games.map((g) => {
    const r = num(g.rounds, 0, 999) || 0, f = num(g.first, 0, 999) || 0, a = num(g.lvFrom, 1, 9), b = num(g.lvNow, 1, 9);
    return `${g.game} — ${r} заданий, с первой попытки ${Math.min(f, r)}${a && b && a !== b ? `, уровень ${a}→${b}` : ""}`;
  }).join("; ") + ".");
  const hard = (Array.isArray(m.hard) ? m.hard : []).filter((h) => h && TASK_IDS.has(h.game) && word(h.item)).slice(0, 4);
  if (hard.length) lines.push("Трудно (hard): " + hard.map((h) => `${h.game} «${word(h.item)}»` + (h.misses ? ` — не сразу ${num(h.misses, 0, 99)} из ${num(h.tries, 0, 99)}` : "") + (h.daysAgo !== undefined ? `, ${ago(num(h.daysAgo, 0, 7))}` : "")).join("; ") + ".");
  const better = (Array.isArray(m.better) ? m.better : []).filter((h) => h && TASK_IDS.has(h.game) && word(h.item)).slice(0, 3);
  if (better.length) lines.push("Стало получаться (better): " + better.map((h) => `${h.game} «${word(h.item)}»` + (h.daysAgo !== undefined ? ` (${ago(num(h.daysAgo, 0, 7))})` : "")).join("; ") + ".");
  return lines.join("\n");
}

// Переменная часть: что происходит сейчас.
export function userMessage(req: SharikRequest): string {
  const name = (req.child?.name || "Лев").slice(0, 30);
  const avail = (req.available || []).filter((g) => TASK_IDS.has(g));
  const lv = req.levels || {};
  const hist = (req.history || []).slice(-12).map((h) => `${h.who === "sharik" ? "Шарик" : "Событие"}: ${String(h.text).slice(0, 160)}`);
  const e = req.event;
  const mem = memoryText(req.memory);
  const ev = [
    `тип: ${e.type}`,
    e.game ? `игра: ${e.game}` : "",
    e.task ? `задание: ${String(e.task).slice(0, 80)}` : "",
    e.good ? `Шарик уже сказал: «${String(e.good).slice(0, 80)}»` : "",
    e.ok !== undefined ? `справился: ${e.ok ? "да" : "нет"}` : "",
    e.attempts ? `попыток: ${e.attempts}` : "",
    e.how ? `как ответил: ${e.how}` : "",
    e.voiceMs ? `голос: ${(e.voiceMs / 1000).toFixed(1)} с` : "",
    e.heard ? `heard: «${String(e.heard).slice(0, 60)}»` : "",
    e.type === "parent_say" && e.text ? `слова родителя: «${String(e.text).replace(/[«»]/g, '"').slice(0, 300)}»` : "",
    e.type === "summary" && e.text ? `итоги: ${String(e.text).slice(0, 1500)}` : "",
    e.type === "lesson" && e.stage ? `этап: ${String(e.stage).slice(0, 20)}` : "",
    e.type === "lesson" ? `allowed: ${lessonAllowed(e).join(", ") || "пусто"}` : "",
    e.type === "lesson" && Array.isArray(e.helps) && e.helps.length ? `helps: ${e.helps.filter((x) => (LESSON_ACTIONS as readonly string[]).includes(x)).slice(-6).join(", ")}` : "",
  ].filter(Boolean).join("; ");
  return [
    `Имя ребёнка: ${name}.`,
    `Герой: ${req.hero === "dog" ? "пёс Шарик" : "рыжий кот Шарик в синем шарфе"}.`,
    `Занятие идёт ${Math.round(req.minutes || 0)} мин из ${Math.round(req.plannedMinutes || 20)}.`,
    `Включённые игры: ${avail.length ? avail.join(", ") : "все из каталога"}.`,
    `Уровни сейчас: ${Object.entries(lv).filter(([g]) => TASK_IDS.has(g)).map(([g, l]) => `${g}=${l}`).join(", ") || "нет данных"}.`,
    ...(mem ? [`Прошлые занятия (сводка с телефона):\n${mem}`] : []),
    hist.length ? `Последнее:\n${hist.join("\n")}` : "Это начало занятия.",
    `Сейчас: ${ev}.`,
    `Что скажет Шарик и что дальше?`,
  ].join("\n");
}

const FALLBACK_SAY: Record<SharikEvent["type"], string> = {
  start: "Привет! Я Шарик. Давай играть!",
  result: "Играем дальше!",
  silence: "Эй, я тут! Поиграем?",
  voice: "Ух ты, как здорово!",
  tired: "Давай отдохнём!",
  parent_end: "Ты молодец! Пока-пока!",
  parent_pause: "Жду тебя!",
  parent_say: "Не расслышал. Повторите, пожалуйста.",
  summary: "",
  lesson: "",
};

// Разрешённые действия из события: только известные, без повторов.
export function lessonAllowed(e: SharikEvent | undefined): LessonAction[] {
  const a = Array.isArray(e?.allowed) ? e!.allowed : [];
  return [...new Set(a.filter((x): x is LessonAction => (LESSON_ACTIONS as readonly string[]).includes(x as string)))];
}

// Запасной ответ, если модель недоступна или ответила не по правилам: приложение продолжает само.
export function fallbackReply(req: SharikRequest): SharikReply {
  const t = req.event?.type || "result";
  const end = t === "parent_end";
  if (t === "lesson") return { say: "", next: { kind: "game", game: null, level: null, action: null }, tone: "calm" }; // приложение поможет по своим правилам
  return { say: FALLBACK_SAY[t] ?? FALLBACK_SAY.result, next: { kind: end || t === "summary" ? "end" : t === "parent_pause" ? "wait" : "game", game: null, level: null }, tone: end ? "calm" : "praise" };
}

// Проверка ответа модели: только игры из каталога и включённые в приложении, уровень в допустимых пределах.
export function sanitize(raw: unknown, req: SharikRequest): SharikReply {
  const fb = fallbackReply(req);
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Partial<SharikReply>;
  let say = typeof r.say === "string" ? r.say.replace(/\s+/g, " ").trim() : "";
  if (!say && !(req.event?.type === "result" && typeof r.say === "string")) say = fb.say; // после задания реплика может быть пустой: остаёмся в игре
  say = canonical(say); // готовые фразы — ровно в записанном виде, чтобы голос взялся из памяти
  const maxLen = req.event?.type === "summary" ? 700 : req.event?.type === "parent_say" ? 400 : 220; // взрослым можно длиннее
  if (say.length > maxLen) say = say.slice(0, maxLen).replace(/[^.!?…]*$/, "") || say.slice(0, maxLen);
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
  if (req.event?.type === "summary") kind = "end";
  if (req.event?.type === "lesson") {
    // «Пятиминутка»: только действие из разрешённых; говорить и выбирать игру не нужно
    const allowed = lessonAllowed(req.event);
    const a = r.next && typeof r.next.action === "string" && (allowed as string[]).includes(r.next.action) ? (r.next.action as LessonAction) : null;
    return { say: "", next: { kind: "game", game: null, level: null, action: a }, tone: "calm" };
  }
  const tones = ["praise", "invite", "comfort", "calm"] as const;
  const tone = tones.includes(r.tone as (typeof tones)[number]) ? (r.tone as SharikReply["tone"]) : fb.tone;
  return { say, next: { kind, game: kind === "game" || kind === "break" ? game : null, level: kind === "game" || kind === "break" ? level : null }, tone };
}

// Проверка входа: защищает от мусора и слишком больших запросов.
export function parseRequest(body: unknown): SharikRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as SharikRequest;
  const types = ["start", "result", "silence", "voice", "tired", "parent_end", "parent_pause", "parent_say", "summary", "lesson"];
  if (!b.event || !types.includes(b.event.type)) return null;
  if (b.event.allowed !== undefined && (!Array.isArray(b.event.allowed) || b.event.allowed.length > 10)) return null;
  if (b.event.helps !== undefined && (!Array.isArray(b.event.helps) || b.event.helps.length > 20)) return null;
  if (b.history && (!Array.isArray(b.history) || b.history.length > 50)) return null;
  if (b.available && !Array.isArray(b.available)) return null;
  if (b.memory !== undefined && (b.memory === null || typeof b.memory !== "object" || Array.isArray(b.memory))) delete b.memory;
  return b;
}
