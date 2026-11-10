# MediaPipe (камера в «Зеркале с Шариком»)

Распознавание лица и рук прямо на телефоне — видео никуда не отправляется.

- `vision_bundle.mjs`, `wasm/vision_wasm_internal.*` — пакет `@mediapipe/tasks-vision` 1.1.1 с npm
  (https://www.npmjs.com/package/@mediapipe/tasks-vision), лицензия Apache-2.0, © Google.
- `face_landmarker.task`, `hand_landmarker.task` — модели MediaPipe Face Landmarker и Hand Landmarker (float16, версия 1)
  с https://storage.googleapis.com/mediapipe-models/, лицензия Apache-2.0, © Google
  (карточки моделей: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker,
  https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker).

Загружаются только при входе в «Зеркало с Шариком» (около 25 МБ один раз, дальше из кэша телефона).
