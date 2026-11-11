// Голос Шарика (маршрут /tts): облачный синтез речи. Ключ сервиса — секрет Cloudflare, в приложение не попадает.
// Сервис выбирается настройкой TTS_PROVIDER: "openai" (gpt-4o-mini-tts, характер голоса задаётся словами)
// или "elevenlabs" (голос из библиотеки ElevenLabs по TTS_VOICE). Одинаковые фразы берутся из кэша Cloudflare.

export interface TtsEnv {
  TTS_PROVIDER?: string; // openai | elevenlabs (пусто — голос выключен, приложение говорит голосом телефона)
  OPENAI_API_KEY?: string; // секрет, для openai
  ELEVENLABS_API_KEY?: string; // секрет, для elevenlabs
  TTS_VOICE?: string; // openai: coral, sage, shimmer…; elevenlabs: id голоса из библиотеки
  TTS_MODEL?: string; // openai: gpt-4o-mini-tts; elevenlabs: eleven_flash_v2_5
  TTS_STYLE?: string; // openai: как говорить (по умолчанию — добрый мультяшный щенок)
  OPENAI_BASE_URL?: string; // только для тестов
  ELEVENLABS_BASE_URL?: string; // только для тестов
}

export const TTS_MAX_CHARS = 300;
export const TTS_TIMEOUT_MS = 6000;

export const TTS_DEFAULTS = {
  openai: { model: "gpt-4o-mini-tts", voice: "coral" },
  // «Charlie» из стандартных голосов ElevenLabs — живой, весёлый; маме лучше выбрать свой мультяшный голос в библиотеке
  elevenlabs: { model: "eleven_flash_v2_5", voice: "IKne3meq5aSn9XLyUdCD" },
} as const;

export const TTS_STYLE_DEFAULT =
  "Ты — Шарик, добрый весёлый мультяшный щенок. Говори по-русски тепло, радостно и с улыбкой, " +
  "чуть выше обычного голоса, медленно и очень чётко, как для маленького ребёнка. Короткие паузы между фразами.";

export type Provider = keyof typeof TTS_DEFAULTS;

export function ttsProvider(env: TtsEnv): Provider | null {
  const p = (env.TTS_PROVIDER || "").trim().toLowerCase();
  if (p === "openai" && env.OPENAI_API_KEY) return "openai";
  if (p === "elevenlabs" && env.ELEVENLABS_API_KEY) return "elevenlabs";
  return null;
}

// Текст для синтеза: одна строка, без знаков ударения из приложения и без разметки, не длиннее 300 символов.
export function cleanTtsText(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let t = raw.normalize("NFC").replace(/́/g, "").replace(/[<>{}\[\]\\]/g, " ").replace(/\s+/g, " ").trim();
  if (t.length > TTS_MAX_CHARS) t = t.slice(0, TTS_MAX_CHARS).replace(/[^.!?…]*$/, "") || t.slice(0, TTS_MAX_CHARS);
  return t;
}

async function sha256(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Ключ кэша: сервис + голос + модель + стиль + текст. Одна и та же фраза тем же голосом синтезируется один раз.
export async function ttsCacheKey(env: TtsEnv, p: Provider, text: string): Promise<string> {
  const d = TTS_DEFAULTS[p];
  const id = [p, env.TTS_VOICE || d.voice, env.TTS_MODEL || d.model, p === "openai" ? env.TTS_STYLE || TTS_STYLE_DEFAULT : "", text].join("|");
  return `https://tts-cache.rechka.invalid/${p}/${await sha256(id)}.mp3`;
}

// Запрос к сервису синтеза. Возвращает MP3 или бросает ошибку.
export async function synthesize(env: TtsEnv, p: Provider, text: string, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  const d = TTS_DEFAULTS[p];
  const signal = AbortSignal.timeout(TTS_TIMEOUT_MS);
  let r: Response;
  if (p === "openai") {
    r = await fetchImpl((env.OPENAI_BASE_URL || "https://api.openai.com") + "/v1/audio/speech", {
      method: "POST", signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.TTS_MODEL || d.model, voice: env.TTS_VOICE || d.voice, input: text, instructions: env.TTS_STYLE || TTS_STYLE_DEFAULT, response_format: "mp3" }),
    });
  } else {
    const voice = encodeURIComponent(env.TTS_VOICE || d.voice);
    r = await fetchImpl(`${env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io"}/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: "POST", signal,
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY || "", "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: env.TTS_MODEL || d.model, language_code: "ru", voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, speed: 0.9 } }),
    });
  }
  if (!r.ok) throw new TtsError(r.status === 401 || r.status === 403 ? "bad_key" : r.status === 429 ? "rate_limited" : `api_${r.status}`);
  const buf = await r.arrayBuffer();
  if (buf.byteLength < 200) throw new TtsError("empty");
  return buf;
}

export class TtsError extends Error {
  note: string;
  constructor(note: string) { super(note); this.note = note; }
}
