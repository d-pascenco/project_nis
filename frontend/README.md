# NextPath Frontend

React-приложение NextPath. Обслуживает два домена из одного бандла:

- **nextpath.su** — публичный лендинг + 5-шаговая онбординг-форма + просмотр роудмапа
- **my.nextpath.su** — личный кабинет (профиль, прогресс, визуальный граф)

## Стек

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · react-router-dom · @react-oauth/google · html2canvas · jspdf

## Разработка

```bash
npm install
npm run dev        # http://localhost:5173
```

В dev-режиме оба домена работают на одном `localhost:5173` — домен-разделение отключено.

## Сборка

```bash
NODE_OPTIONS="--max-old-space-size=512" npm run build
# dist/ → /var/www/html/
```

## Структура `src/`

```
pages/
  Index.tsx           — лендинг nextpath.su
  Onboarding.tsx      — 5-шаговая форма + показ роудмапа
  Profile.tsx         — личный кабинет my.nextpath.su

components/
  RoadmapPreview.tsx  — карточки роудмапа + PDF + Share
  RoadmapVisual.tsx   — fullscreen граф роудмапа (dark modal)
  ProfileEditForm.tsx — редактирование профиля в кабинете
  Autocomplete.tsx    — поле с подсказками (города, вузы, специальности)
  Logo.tsx            — логотип-ссылка на /
  steps/              — 5 шагов онбординга (BasicInfo, Education, Goals, Skills, Constraints)
  ui/                 — компоненты shadcn/ui

lib/
  auth.ts             — JWT в localStorage (getToken, setToken, authHeaders)
  urls.ts             — логика доменов (IS_CABINET_DOMAIN, goToCabinet)
  constants.ts        — PROFESSION_LABELS, TIMELINE_LABELS, STAGE_COLORS, getResourceUrl
  suggestions.ts      — данные для Autocomplete (CITIES, UNIVERSITIES, SPECIALIZATIONS, LANGUAGES)

types.ts              — RoadmapData, RoadmapStage, OnboardingFormData
App.tsx               — домен-aware роутинг (CabinetRoutes / MainRoutes)
```

## Переменные окружения (Vite)

Задаются в корневом `.env` с префиксом `VITE_` — Vite запекает их в бандл при сборке.

| Переменная | Значение в prod |
|------------|----------------|
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `VITE_CABINET_URL` | `https://my.nextpath.su` |
| `VITE_MAIN_URL` | `https://nextpath.su` |
