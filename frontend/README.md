# NextPath Frontend

React-приложение, обслуживающее два домена из одного бандла:

- **nextpath.su** — лендинг, форма онбординга, просмотр роудмапа
- **my.nextpath.su** — личный кабинет авторизованного пользователя

## Стек

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, react-router-dom, @react-oauth/google

## Разработка

```bash
npm install
npm run dev   # http://localhost:5173
```

В режиме разработки оба домена работают на одном `localhost:5173` — разделение по домену отключено.

## Сборка

```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
# результат: dist/ → /var/www/html/
```

## Структура `src/`

```
types.ts              — общие типы (RoadmapData, OnboardingFormData, ScheduleItem...)
lib/
  auth.ts             — хранение JWT в localStorage
  urls.ts             — логика доменов (IS_CABINET_DOMAIN, goToCabinet)
  constants.ts        — справочники, маппинг платформ, getResourceUrl
  suggestions.ts      — города по странам, университеты, профессии, языки
  generate-html.ts    — генератор интерактивного HTML-файла для скачивания
components/
  RoadmapPreview.tsx  — карточки роудмапа, скачивание, шаринг
  RoadmapVisual.tsx   — полноэкранный граф роудмапа
  RoadmapGenerating.tsx — экран загрузки при генерации
  ProfileEditForm.tsx — форма редактирования профиля в кабинете
  Autocomplete.tsx    — поле ввода с подсказками
  ErrorBoundary.tsx   — обработчик ошибок рендера
  steps/              — 6 шагов онбординга
pages/
  Index.tsx           — лендинг (nextpath.su)
  Onboarding.tsx      — форма и роудмап (nextpath.su)
  Profile.tsx         — личный кабинет (my.nextpath.su)
  Shared.tsx          — публичная страница роудмапа (/shared/:id)
App.tsx               — роутинг с учётом домена
```

## Переменные окружения (Vite)

Задаются в корневом `.env` с префиксом `VITE_` — бакунтируются в бандл при сборке.

| Переменная | Значение в prod |
|------------|----------------|
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `VITE_CABINET_URL` | `https://my.nextpath.su` |
| `VITE_MAIN_URL` | `https://nextpath.su` |
