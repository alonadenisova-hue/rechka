// Сервер ИИ‑Шарика (Cloudflare Worker).
//   POST /sharik  — приложение присылает, что происходит на занятии, получает реплику Шарика и следующий шаг.
//   POST /stt     — распознать короткую запись голоса Льва (WAV) — только подсказка для мамы, не оценка.
//   GET  /health  — проверка, что сервер жив (без обращения к модели).
// Ключи хранятся в секретах Cloudflare (wrangler secret put …), не в коде и не в приложении.
import Anthropic from "@anthropic-ai/sdk";
import { STT_MAX_BYTES, STT_MODEL, STT_PROMPT, cleanTranscript, looksLikeWav, toBase64 } from "./stt.ts";
import { REPLY_SCHEMA, SYSTEM_PROMPT, fallbackReply, parseRequest, sanitize, userMessage, type SharikRequest } from "./sharik.ts";

export interface Env {
  ANTHROPIC_API_KEY: string; // секрет
  SHARIK_CODE?: string; // секрет: «семейный код», его вводят в приложении в разделе для взрослых
  MODEL?: string; // по умолчанию claude-opus-5-5
  EFFORT?: string; // low | medium | high … (по умолчанию low — быстрее ответ)
  ALLOWED_ORIGINS?: string; // адреса сайта через запятую, например https://rechka.netlify.app
  DAILY_LIMIT?: string; // сколько обращений к модели в сутки (по умолчанию 600)
  ANTHROPIC_BASE_URL?: string; // только для тестов
  USAGE?: KVNamespace; // счётчик обращений за день (необязательно)
  AI?: Ai; // Workers AI — распознавание речи для /stt (необязательно; без него /stt отвечает note: no_ai)
  STT_LIMIT?: string; // сколько распознаваний в сутки (по умолчанию 400)
}

const MODEL_DEFAULT = "claude-opus-5-5";

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ok = !allowed.length || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sharik-Code",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...headers } });
}

// Простое сравнение без утечки по времени.
function sameCode(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function underLimit(env: Env, kind: "day" | "stt" = "day"): Promise<boolean> {
  if (!env.USAGE) return true;
  const key = kind + ":" + new Date().toISOString().slice(0, 10);
  const n = parseInt((await env.USAGE.get(key)) || "0", 10);
  const lim = parseInt((kind === "stt" ? env.STT_LIMIT || "400" : env.DAILY_LIMIT || "600"), 10);
  if (n >= lim) return false;
  await env.USAGE.put(key, String(n + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

export async function askModel(env: Env, req: SharikRequest) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}), maxRetries: 1, timeout: 15000 });
  const effort = (["low", "medium", "high", "xhigh", "max"].includes(env.EFFORT || "") ? env.EFFORT : "low") as "low" | "medium" | "high" | "xhigh" | "max";
  const res = await client.beta.messages.create({
    model: env.MODEL || MODEL_DEFAULT,
    max_tokens: 4000,
    // если модель откажет по правилам безопасности, сервер Anthropic сам повторит запрос на запасной модели
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema: REPLY_SCHEMA as unknown as Record<string, unknown> } },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMessage(req) }],
  });
  if (res.stop_reason === "refusal") return { reply: fallbackReply(req), note: "refusal", usage: res.usage };
  const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
  let parsed: unknown = null;
  try { parsed = JSON.parse(text); } catch { /* разберём как запасной ответ */ }
  return { reply: sanitize(parsed, req), note: parsed ? "ok" : "bad_json", usage: res.usage };
}

// Распознавание: приложение присылает WAV (моно, 16 кГц, до 6 с), получает {text, note}.
// Текст показывается маме мелко и уходит в поле heard. Шарик по нему не поправляет и не оценивает Льва.
export async function transcribe(env: Env, wav: ArrayBuffer): Promise<{ text: string; note: string }> {
  if (!env.AI) return { text: "", note: "no_ai" };
  const r = (await env.AI.run(STT_MODEL, {
    audio: toBase64(wav),
    language: "ru",
    task: "transcribe",
    vad_filter: true,
    initial_prompt: STT_PROMPT,
    condition_on_previous_text: false,
  })) as { text?: string };
  const text = cleanTranscript(r?.text);
  return { text, note: text ? "ok" : "empty" };
}

async function sttRoute(request: Request, env: Env, h: Record<string, string>): Promise<Response> {
  const len = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (len > STT_MAX_BYTES) return json({ error: "too_big" }, 413, h);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > STT_MAX_BYTES) return json({ error: "too_big" }, 413, h);
  if (!looksLikeWav(buf)) return json({ error: "bad_audio" }, 400, h);
  if (!env.AI) return json({ text: "", note: "no_ai" }, 200, h);
  if (!(await underLimit(env, "stt"))) return json({ text: "", note: "daily_limit" }, 200, h);
  const t0 = Date.now();
  try {
    const r = await transcribe(env, buf);
    console.log(JSON.stringify({ ev: "stt", ms: Date.now() - t0, bytes: buf.byteLength, note: r.note }));
    return json(r, 200, h);
  } catch (e) {
    console.log(JSON.stringify({ ev: "stt", ms: Date.now() - t0, note: "error", err: String(e).slice(0, 200) }));
    return json({ text: "", note: "error" }, 200, h);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const h = cors(request, env);
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (url.pathname === "/health") return json({ ok: true, model: env.MODEL || MODEL_DEFAULT, key: !!env.ANTHROPIC_API_KEY, stt: !!env.AI }, 200, h);
    if ((url.pathname !== "/sharik" && url.pathname !== "/stt") || request.method !== "POST") return json({ error: "not_found" }, 404, h);
    if (h["Access-Control-Allow-Origin"] === "null") return json({ error: "origin" }, 403, h);
    if (env.SHARIK_CODE && !sameCode(request.headers.get("X-Sharik-Code") || "", env.SHARIK_CODE)) return json({ error: "code" }, 401, h);
    if (url.pathname === "/stt") return sttRoute(request, env, h);
    const len = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (len > 32000) return json({ error: "too_big" }, 413, h);
    let body: unknown;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, h); }
    const req = parseRequest(body);
    if (!req) return json({ error: "bad_request" }, 400, h);
    if (!env.ANTHROPIC_API_KEY) return json({ ...fallbackReply(req), note: "no_key" }, 200, h);
    if (!(await underLimit(env))) return json({ ...fallbackReply(req), note: "daily_limit" }, 200, h);
    const t0 = Date.now();
    try {
      const { reply, note, usage } = await askModel(env, req);
      console.log(JSON.stringify({ ev: req.event.type, ms: Date.now() - t0, note, in: usage?.input_tokens, cached: usage?.cache_read_input_tokens, out: usage?.output_tokens }));
      return json({ ...reply, note }, 200, h);
    } catch (e) {
      // приложение получает запасную реплику и продолжает занятие само
      let note = "error";
      if (e instanceof Anthropic.AuthenticationError) note = "bad_key";
      else if (e instanceof Anthropic.RateLimitError) note = "rate_limited";
      else if (e instanceof Anthropic.APIConnectionError) note = "connection"; // проверять до APIError: это его подкласс
      else if (e instanceof Anthropic.APIError) note = `api_${e.status}`;
      console.log(JSON.stringify({ ev: req.event.type, ms: Date.now() - t0, note, err: String(e).slice(0, 200) }));
      return json({ ...fallbackReply(req), note }, 200, h);
    }
  },
};
