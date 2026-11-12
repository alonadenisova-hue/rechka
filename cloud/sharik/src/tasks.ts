// Каталог заданий, которые Шарик может давать. Повторяет docs/ai-sharik/TASKS.md.
// Ноябрь 2026: примеры реплик и новые игры — по трём занятиям с логопедом (docs/logoped/2026-11-zanyatiya.md).
// Пока список — черновик: on=true у всего, что есть в TASKS.md. После утверждения мамой
// выключить отклонённые (on: false) — Шарик не сможет их выбрать, даже если модель попросит.

export type Answer = "tap" | "camera" | "voice" | "parent";

export interface Task {
  id: string; // ключ игры в приложении (data-game) или "talk"
  title: string;
  answer: Answer[];
  levels: number; // сколько уровней в игре
  example: string; // пример реплики Шарика
  reward?: boolean; // игра-перерыв, а не упражнение
  on: boolean;
}

export const TASKS: Task[] = [
  { id: "mirr", title: "Зеркало: артикуляционная гимнастика и «покажи на себе» (ур. 1–3 лицо; ур. 4 — всё тело и движения: живот, нога, коленка, плечи, помаши, хлопни, руки вверх, присядь)", answer: ["camera", "parent"], levels: 4, example: "Улыбнись широко, как я!", on: true },
  { id: "body", title: "Покажи, где… (части тела на мальчике; потом «а у тебя где?» — на себе и на маме)", answer: ["tap", "parent"], levels: 3, example: "Где у мальчика нога? А у тебя где ноги?", on: true },
  { id: "verb", title: "Кто что делает (образец — фраза из двух слов: кто + действие)", answer: ["tap", "voice"], levels: 5, example: "Кто спит? Найди! … Киса спит.", on: true },
  { id: "give", title: "Держит или даёт?", answer: ["tap"], levels: 1, example: "Кто даёт?", on: true },
  { id: "nes", title: "Несёт — держит", answer: ["tap"], levels: 3, example: "Кто несёт? … Папа несёт. Он несёт.", on: true },
  { id: "sl", title: "Спит — лежит", answer: ["tap"], levels: 1, example: "Кто спит?", on: true },
  { id: "ib", title: "Идёт, бежит, стоит, сидит", answer: ["tap"], levels: 4, example: "Кто сидит? … Ёжик сидит на стуле.", on: true },
  { id: "pair", title: "Похожие действия (стоит — сидит, идёт — бежит, спит — лежит)", answer: ["tap"], levels: 5, example: "Кто сидит, а кто стоит?", on: true },
  { id: "not", title: "Что не…?", answer: ["tap"], levels: 4, example: "Где не кошка? … Рыба — не кошка.", on: true },
  { id: "odd", title: "Другой (лишний)", answer: ["tap"], levels: 4, example: "Что лишнее? … Шапки одинаковые, а носки — другие.", on: true },
  { id: "yn", title: "Да или нет? (сначала с подсказкой-кивком, потом без)", answer: ["tap"], levels: 2, example: "Это слон? Да или нет? … Нет, не слон. Это корова.", on: true },
  { id: "color", title: "Цвета (и вопрос «Какой?» с выбором из двух цветов, мужской род)", answer: ["tap"], levels: 6, example: "Какой мяч? Зелёный или красный?", on: true },
  { id: "size", title: "Большой — маленький, один — много", answer: ["tap"], levels: 5, example: "Где одна корова? А где коровы?", on: true },
  { id: "many", title: "Один — много (окончание на слух: коза — козы)", answer: ["tap"], levels: 3, example: "Где коза? А где козы? Много!", on: true },
  { id: "prep", title: "Где? В, на, под (ур. 1–4 в/на, 5–7 на/под, 8 всё вместе)", answer: ["tap"], levels: 8, example: "Где оса — на стакане или в стакане?", on: true },
  { id: "fly", title: "Где муха? (муха на ком-то / на чём-то)", answer: ["tap"], levels: 3, example: "Где муха? … Муха на столе.", on: true },
  { id: "put", title: "Положи (на, под, в), потом «Что ты сделал? — Я положил»", answer: ["tap", "voice"], levels: 4, example: "Положи мяч под стол! … Что ты сделал? Я положил!", on: true },
  { id: "feed", title: "Покорми", answer: ["tap"], levels: 4, example: "Дай зайке морковку!", on: true },
  { id: "dai", title: "Дай — на", answer: ["tap"], levels: 4, example: "Дай маме мяч!", on: true },
  { id: "snd", title: "Кто как говорит?", answer: ["tap", "voice"], levels: 3, example: "Как говорит корова? Повтори: му-у!", on: true },
  { id: "dog", title: "Повторяй за Шариком (звуки, слоги, ритмические ряды логопеда: мак — дым, ком — бак, деда — баба)", answer: ["voice", "parent"], levels: 6, example: "Смотри на меня и слушай: ком — бак!", on: true },
  { id: "tr", title: "Летит, едет, плывёт", answer: ["tap", "voice"], levels: 4, example: "Самолёт летит или едет? … Самолёт летит!", on: true },
  { id: "world", title: "Что это? (назвать предмет или животное)", answer: ["tap", "voice"], levels: 5, example: "Что это? Лодка или самолёт?", on: false }, // выкл.: сначала просит выбрать тему — проверить в «Занятии с Шариком» (ROADMAP, задача 9)
  { id: "food", title: "Съедобное — несъедобное", answer: ["tap"], levels: 5, example: "Еду — на стол!", on: true },
  { id: "num", title: "Цифры", answer: ["tap"], levels: 7, example: "Сколько здесь яблок?", on: true },
  { id: "dress", title: "Одень мальчика", answer: ["tap"], levels: 4, example: "Что надеваем на ножки?", on: true },
  { id: "want", title: "Я хочу", answer: ["tap", "voice"], levels: 4, example: "Что ты хочешь? Покажи!", on: true },
  { id: "me", title: "Я (фото Льва: что я делаю)", answer: ["tap", "voice"], levels: 3, example: "Где ты сидишь? … Я сижу!", on: false }, // выкл.: без фото Льва игра пустая — включить, когда в телефоне есть фото (ROADMAP, задача 9)
  { id: "home", title: "Собака дома", answer: ["tap"], levels: 4, example: "Отведи собачку спать!", reward: true, on: true },
  { id: "draw", title: "Дорисуй", answer: ["tap"], levels: 3, example: "Дорисуй картинку пальчиком!", reward: true, on: true },
  { id: "bal", title: "Шарики", answer: ["tap"], levels: 4, example: "Лопни шарики!", reward: true, on: true },
  { id: "catch", title: "Лови!", answer: ["tap"], levels: 4, example: "Лови вишни в корзинку!", reward: true, on: true },
];

export const TASK_IDS = new Set(TASKS.filter((t) => t.on).map((t) => t.id));

export function catalogText(): string {
  return TASKS.filter((t) => t.on)
    .map((t) => `- ${t.id}: ${t.title}. Ответ: ${t.answer.join(", ")}. Уровней: ${t.levels}.${t.reward ? " Игра-перерыв." : ""} Пример: «${t.example}»`)
    .join("\n");
}
