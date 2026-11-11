// Распознавание речи для ИИ‑Шарика (маршрут /stt). Только подсказка для мамы и поле heard —
// речь Льва НЕ оценивается: Шарик засчитывает попытку сказать, а не точность.
// Распознаёт Whisper large‑v3‑turbo на Cloudflare Workers AI (привязка AI, отдельный ключ не нужен).

export const STT_MODEL = "@cf/openai/whisper-large-v3-turbo";
export const STT_MAX_BYTES = 400_000; // ~12 с звука WAV 16 кГц; приложение присылает до 6 с

// Whisper на тишине и коротких звуках иногда «додумывает» фразы из субтитров. Такие ответы выбрасываем.
const HALLUCINATIONS = [
  /субтитр/i, /продолжение следует/i, /спасибо за просмотр/i, /подпис(ыва)?йтесь/i, /ставьте лайк/i,
  /редактор/i, /корректор/i, /dimatorzok/i, /amara\.org/i, /\bсинхрониз/i, /до новых встреч/i, /всем пока/i,
  /^\s*(music|музыка)\s*$/i, /^\s*\[.*\]\s*$/, /^\s*\(.*\)\s*$/,
];

// Чистит расшифровку: одна строка, без мусора, не длиннее 80 символов. Пустая строка — ничего не услышано.
export function cleanTranscript(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (HALLUCINATIONS.some((re) => re.test(t))) return "";
  if (!/[\p{L}\p{N}]/u.test(t)) return ""; // только знаки препинания
  // зацикленные повторы («да да да да да …» на 30 слов) — сокращаем
  const words = t.split(" ");
  if (words.length > 12) t = words.slice(0, 12).join(" ") + "…";
  if (t.length > 80) t = t.slice(0, 80).replace(/\s+\S*$/, "") + "…";
  return t;
}

// Проверка, что прислан WAV (RIFF…WAVE), — защищает от мусора.
export function looksLikeWav(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 44) return false;
  const b = new Uint8Array(buf, 0, 12);
  const s = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  return s(0, 4) === "RIFF" && s(8, 4) === "WAVE";
}

export function toBase64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

// Подсказка модели: детская речь, короткие слова и звукоподражания.
export const STT_PROMPT = "Ребёнок пяти лет говорит отдельные слова и звуки: да, нет, мама, нос, гав, му, би-би, а-а-а.";
