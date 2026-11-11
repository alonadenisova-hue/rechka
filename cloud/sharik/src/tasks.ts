// Каталог заданий, которые Шарик может давать. Повторяет docs/ai-sharik/TASKS.md.
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
  { id: "body", title: "Покажи, где… (части тела на мальчике)", answer: ["tap"], levels: 3, example: "Где у мальчика нога? Покажи!", on: true },
  { id: "verb", title: "Кто что делает", answer: ["tap"], levels: 5, example: "Кто спит? Найди!", on: true },
  { id: "give", title: "Держит или даёт?", answer: ["tap"], levels: 1, example: "Кто даёт?", on: true },
  { id: "nes", title: "Несёт — держит", answer: ["tap"], levels: 3, example: "Кто несёт?", on: true },
  { id: "sl", title: "Спит — лежит", answer: ["tap"], levels: 1, example: "Кто спит?", on: true },
  { id: "ib", title: "Идёт, бежит, стоит, сидит", answer: ["tap"], levels: 4, example: "Кто бежит быстро-быстро?", on: true },
  { id: "not", title: "Что не…?", answer: ["tap"], levels: 4, example: "Что не кошка?", on: true },
  { id: "odd", title: "Другой", answer: ["tap"], levels: 4, example: "Какая картинка другая?", on: true },
  { id: "yn", title: "Да или нет?", answer: ["tap"], levels: 2, example: "Это кошка? Да или нет?", on: true },
  { id: "color", title: "Цвета", answer: ["tap"], levels: 6, example: "Где красный шарик?", on: true },
  { id: "size", title: "Большой — маленький, один — много", answer: ["tap"], levels: 5, example: "Где большой мяч?", on: true },
  { id: "prep", title: "Где? В или на", answer: ["tap"], levels: 8, example: "Где мишка — в коробке или на коробке?", on: true },
  { id: "put", title: "Положи (на, под, в)", answer: ["tap"], levels: 4, example: "Положи мишку на стул!", on: true },
  { id: "feed", title: "Покорми", answer: ["tap"], levels: 4, example: "Дай зайке морковку!", on: true },
  { id: "dai", title: "Дай — на", answer: ["tap"], levels: 4, example: "Дай маме мяч!", on: true },
  { id: "snd", title: "Кто как говорит?", answer: ["tap", "voice"], levels: 3, example: "Как говорит корова? Повтори: му-у!", on: true },
  { id: "dog", title: "Повторяй за Шариком (звуки, слоги)", answer: ["voice", "parent"], levels: 6, example: "Скажи как я: па-па!", on: true },
  { id: "tr", title: "Летит, едет, плывёт", answer: ["tap"], levels: 4, example: "Что плывёт?", on: true },
  { id: "food", title: "Съедобное — несъедобное", answer: ["tap"], levels: 5, example: "Еду — на стол!", on: true },
  { id: "num", title: "Цифры", answer: ["tap"], levels: 7, example: "Сколько здесь яблок?", on: true },
  { id: "dress", title: "Одень мальчика", answer: ["tap"], levels: 4, example: "Что надеваем на ножки?", on: true },
  { id: "want", title: "Я хочу", answer: ["tap", "voice"], levels: 4, example: "Что ты хочешь? Покажи!", on: true },
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
