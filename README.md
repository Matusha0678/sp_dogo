# IronTrack

Персональный трекер тренировок, питания и прогресса с ИИ-анализом.

## Стек

- Чистый HTML / CSS / JS — без фреймворков
- [Supabase](https://supabase.com) — база данных и авторизация
- [Groq API](https://groq.com) — ИИ-анализ (llama-3.3-70b)
- Google Fonts — Instrument Serif, DM Sans, DM Mono

## Страницы

| Файл | Описание |
|------|----------|
| `index.html` | Главная — дашборд со статистикой |
| `login.html` | Вход и регистрация |
| `workout.html` | Тренировки по дням недели |
| `nutrition.html` | Дневник питания и параметры тела |
| `progress.html` | Рекорды и рабочие веса |
| `ai.html` | ИИ-анализ всех данных |
| `_style.css` | Общие стили |
| `_supabase.js` | Supabase клиент и хелперы |

## Запуск

Просто открой `login.html` в браузере. Никакой сборки не нужно.

Для локальной разработки удобнее использовать live-сервер:

```bash
# через VS Code расширение Live Server
# или через npx
npx serve .
```

## Настройка

### 1. Supabase

Создай проект на [supabase.com](https://supabase.com) и создай таблицы:

```sql
-- Тренировки
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  day text not null,
  exercises jsonb default '[]',
  updated_at timestamptz default now()
);

-- Питание
create table nutrition (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  day text not null,
  meals jsonb default '[]',
  body_params jsonb default '{}',
  updated_at timestamptz default now()
);

-- Прогресс
create table progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  records jsonb default '[]',
  updated_at timestamptz default now()
);
```

Включи Row Level Security и добавь политики:

```sql
-- Для каждой таблицы (замени "workouts" на нужную)
alter table workouts enable row level security;

create policy "Users can manage own data"
  on workouts for all
  using (auth.uid() = user_id);
```

Вставь свои ключи в `_supabase.js`:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
```

### 2. Groq API (для ИИ-анализа)

Получи бесплатный ключ на [console.groq.com](https://console.groq.com).

Вставь в `ai.html`:

```js
const GROQ_KEY = 'YOUR_GROQ_KEY_HERE';
```

> ⚠️ Не коммить реальные ключи в публичный репозиторий.

## Функции

- **Тренировки** — план на каждый день недели, упражнения с подходами / повторами / весом / отдыхом
- **Питание** — дневник еды по дням, калории, расчёт ИМТ / TDEE / нормы белка
- **Прогресс** — рекорды и рабочие веса с историей изменений
- **ИИ-анализ** — персональные рекомендации на основе твоих данных через Groq
- **Авторизация** — регистрация и вход через Supabase Auth
- **Плавные переходы** — fade-анимация между страницами

## Структура данных

### Упражнение (в `workouts.exercises`)
```json
{
  "name": "Жим лёжа",
  "sets": 4,
  "reps": 8,
  "weight": 80,
  "rest": 90,
  "note": ""
}
```

### Блюдо (в `nutrition.meals`)
```json
{
  "name": "Овсянка",
  "kcal": 350,
  "time": "08:30"
}
```

### Рекорд (в `progress.records`)
```json
{
  "exercise": "Жим лёжа",
  "type": "record",
  "weight": 100,
  "reps": 5,
  "history": [
    { "weight": 90, "date": "1 янв" },
    { "weight": 100, "date": "15 янв" }
  ]
}
```