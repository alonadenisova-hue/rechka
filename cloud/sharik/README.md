# Сервер ИИ‑Шарика

Маленькая программа на Cloudflare Workers. Через неё приложение «Речка» разговаривает с ИИ (Claude):
приложение рассказывает, что происходит на занятии, а Шарик отвечает, что сказать и какую игру включить дальше.
Ключи хранятся только здесь, в секретах Cloudflare, — не в приложении и не в репозитории.

План и решения — в `docs/ai-sharik/README.md`, задания — в `docs/ai-sharik/TASKS.md`
(в коде сервера — `src/tasks.ts`; у отклонённых заданий поставить `on: false`).

## Как запустить (один раз, ~15 минут)

Нужен компьютер с Node.js 22 или новее (https://nodejs.org).

1. **Ключ Anthropic.** На https://console.anthropic.com создать ключ API (Settings → API Keys),
   пополнить баланс на небольшую сумму и в Settings → Limits поставить месячный лимит расходов.
2. **Аккаунт Cloudflare** (бесплатный): https://dash.cloudflare.com/sign-up.
3. В терминале, в папке `cloud/sharik` репозитория:
   ```bash
   npm install
   ```
   ```bash
   npx wrangler login
   ```
   ```bash
   npx wrangler kv namespace create USAGE
   ```
   Последняя команда напечатает `id = "…"` — вписать его в `wrangler.toml` в блок `[[kv_namespaces]]`
   и убрать `#` в начале трёх строк этого блока (это счётчик, который не даст потратить больше дневного лимита).
4. Секреты (каждая команда спросит значение — вставить и нажать Enter):
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
   ```bash
   npx wrangler secret put SHARIK_CODE
   ```
   `SHARIK_CODE` — «семейный код», любое слово или число, например `lev-2026`. Его же вписать в приложении.
5. В `wrangler.toml` в `ALLOWED_ORIGINS` вписать адрес сайта «Речки», например
   `ALLOWED_ORIGINS = "https://rechka.netlify.app,https://rechka.pages.dev"`.
6. Выложить:
   ```bash
   npx wrangler deploy
   ```
   Команда напечатает адрес вида `https://rechka-sharik.<имя>.workers.dev`. Проверка: открыть
   `…/health` в браузере — должно быть `{"ok":true,…,"key":true}`.
7. В приложении: «Для взрослых» → «Занятие с Шариком» — включить, вписать адрес сервера и семейный код.
   На главном экране появится кнопка «Занятие с Шариком».

## Настройки (`wrangler.toml`, раздел `[vars]`)

| Настройка | Что значит | По умолчанию |
|---|---|---|
| `MODEL` | модель Claude | `claude-opus-5-5` |
| `EFFORT` | насколько долго модель думает: `low` быстрее, `high` вдумчивее | `low` |
| `DAILY_LIMIT` | сколько обращений к модели в сутки (одно занятие — примерно 20–60) | `600` |
| `ALLOWED_ORIGINS` | с каких сайтов можно обращаться к серверу | пусто (с любых — только для проверки) |

Если ответы Шарика приходят слишком медленно (Лев успевает отвлечься), можно попробовать более быструю
модель: `MODEL = "claude-haiku-5-5"` — она заметно дешевле, но реплики могут быть проще. Сравним на пробе.

Посмотреть, что происходит на сервере (время ответа, ошибки), можно командой `npx wrangler tail`.

## Что если что-то сломалось
Приложение никогда не «зависает» из‑за сервера: если сервер недоступен, ключ неверный, кончился лимит
или модель ответила не по правилам, Шарик говорит короткую похвалу сам, а игры выбираются по кругу.
В ответе сервера поле `note` подсказывает причину: `ok`, `no_key`, `bad_key`, `daily_limit`, `refusal`,
`bad_json`, `rate_limited`, `connection`, `api_NNN`.

## Для разработчика
- `src/index.ts` — сервер (маршруты `/sharik` и `/health`, семейный код, лимит, обращение к Claude).
- `src/sharik.ts` — инструкция для модели, разбор запроса, проверка ответа (только игры из каталога).
- `src/tasks.ts` — каталог заданий.
- Проверки: `npm run check` (типы), `npm test` (логика).
  Весь сервер без ключа: `node test/mock-anthropic.mjs` (поддельный API на порту 8789), в `.dev.vars` —
  `ANTHROPIC_API_KEY=test`, `ANTHROPIC_BASE_URL=http://127.0.0.1:8789`, `SHARIK_CODE=1234`, затем `npx wrangler dev`;
  сценарий ответа задаётся в `test/scenario.txt` (`ok`, `refusal`, `garbage`, `error`, `badkey`, `wronggame`).

### Запрос приложения (`POST /sharik`, заголовок `X-Sharik-Code`)
```json
{"child":{"name":"Лев"},"minutes":3,"plannedMinutes":20,"levels":{"body":1},
 "available":["body","mirr","bal"],"history":[{"who":"sharik","text":"Покажи, где нос!"}],
 "event":{"type":"result","game":"body","task":"Покажи, где нос","ok":true,"attempts":1,"how":"tap"}}
```
`event.type`: `start`, `result`, `silence`, `voice`, `tired`, `parent_end`, `parent_pause`.

### Ответ
```json
{"say":"Да! Это нос! А теперь улыбнись!","next":{"kind":"game","game":"mirr","level":1},"tone":"praise","note":"ok"}
```
`next.kind`: `game`, `break` (игра‑перерыв), `wait`, `end`.
