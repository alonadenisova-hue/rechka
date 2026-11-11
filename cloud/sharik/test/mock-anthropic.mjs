// Поддельные API Anthropic и синтеза речи (OpenAI, ElevenLabs) для проверки сервера без ключей и без трат. Сценарий задаёт файл scenario.txt рядом.
import http from "node:http";
import fs from "node:fs";
const dir = new URL(".", import.meta.url).pathname;
const log = dir + "requests.log";
fs.writeFileSync(log, "");
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    fs.appendFileSync(log, JSON.stringify({ url: req.url, beta: req.headers["anthropic-beta"], key: req.headers["x-api-key"], body: JSON.parse(body || "{}") }) + "\n");
    if (req.url.startsWith("/v1/audio/speech") || req.url.startsWith("/v1/text-to-speech/")) {
      // голос: 0,6 с гудка в WAV (браузер проигрывает его и под видом audio/mpeg) — проверить звук и рот Шарика
      const sr = 16000, n = sr * 0.6, b = Buffer.alloc(44 + n * 2);
      b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
      b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
      for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((i / sr) * 2 * Math.PI * 220) * 12000), 44 + i * 2);
      res.writeHead(200, { "content-type": "audio/mpeg" });
      return res.end(b);
    }
    const sc = fs.existsSync(dir + "scenario.txt") ? fs.readFileSync(dir + "scenario.txt", "utf8").trim() : "ok";
    const msg = (content, stop = "end_turn") => ({ id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", content, stop_reason: stop, stop_sequence: null, usage: { input_tokens: 900, output_tokens: 40, cache_read_input_tokens: 0 } });
    if (sc === "error") { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ type: "error", error: { type: "api_error", message: "boom" } })); }
    if (sc === "badkey") { res.writeHead(401, { "content-type": "application/json" }); return res.end(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "bad key" } })); }
    let out;
    if (sc === "refusal") out = msg([], "refusal");
    else if (sc === "garbage") out = msg([{ type: "text", text: "я не json" }]);
    else if (sc === "wronggame") out = msg([{ type: "text", text: JSON.stringify({ say: "Давай цифры!", next: { kind: "game", game: "num", level: 9 }, tone: "invite" }) }]);
    else out = msg([{ type: "thinking", thinking: "", signature: "x" }, { type: "text", text: JSON.stringify({ say: "Да! Это нос! А теперь улыбнись!", next: { kind: "game", game: "mirr", level: 1 }, tone: "praise" }) }]);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(out));
  });
}).listen(8789, "127.0.0.1", () => console.log("mock on 8789"));
