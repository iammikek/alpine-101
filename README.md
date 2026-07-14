# Getting Fast at Alpine.js

A step-by-step **Alpine.js + TypeScript** SPA client for the *-101 items API — same JSON contract as [fastAPI-101](https://github.com/iammikek/fastAPI-101), with parity to [vue-101](https://github.com/iammikek/vue-101) and [react-101](https://github.com/iammikek/react-101) on the web.

**Audience:** Frontend developers learning how a Laravel-style API maps to a lightweight browser SPA (JWT auth, categories, paginated items, stats) without a heavy framework.

**Client-only:** This repo does not run a backend. Point it at any *-101 API (or use **mock mode** for UI work without a server).

---

## What's Included

1. **Vite + vanilla TypeScript** — fast dev server and production build
2. **Alpine.js** — reactive UI with a single `x-data` app
3. **Hash routing** — `#/items`, `#/categories`, `#/stats`, `#/login`, `#/settings`
4. **JWT auth** — register, login (form-urlencoded), Bearer token on write endpoints
5. **Categories** — list, detail, create, edit, delete
6. **Items** — list with filters + load-more pagination, detail, create, edit, delete
7. **Stats** — `GET /items/stats/summary`
8. **Mock mode** — in-memory fake API (default) for offline UI work
9. **Live mode** — calls a real *-101 backend via `VITE_BASE_URL`
10. **Vitest** — API client + mock tests

---

## Quick Start

### Mock mode (no backend)

```bash
cd alpine-101
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5180** — browse items, categories, and stats with fake data. Writes work without signing in.

### Live mode (fastAPI-101)

```bash
# Terminal 1 — backend
cd ../fastAPI-101
uvicorn main:app --reload --port 8000

# Terminal 2 — SPA
cd ../alpine-101
# .env: VITE_USE_MOCK=false, VITE_BASE_URL=http://localhost:8000
npm run dev
```

Register at `#/login`, then create categories and items.

### Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
alpine-101/
├── src/
│   ├── api/           # HTTP client + mock implementation
│   ├── app.ts         # Alpine state, hash router, actions
│   ├── main.ts        # Alpine bootstrap
│   └── style.css
├── tests/api/         # Vitest coverage for client + mock
├── index.html         # Single-page templates by route
├── .env.example
├── package.json
└── vite.config.ts     # server.port 5180
```

---

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_BASE_URL` | `http://localhost:8000` | API root |
| `VITE_USE_MOCK` | `true` | Mock data vs live API |

JWT token is stored in `localStorage` under `alpine-101-token`.

---

## API Endpoints (client coverage)

| Path | Method | Auth | UI |
|------|--------|------|-----|
| `/` | GET | — | (health via API client) |
| `/health` | GET | — | (health via API client) |
| `/auth/register` | POST | — | `#/login` (register) |
| `/auth/login` | POST | — | `#/login` |
| `/auth/me` | GET | JWT | after sign-in |
| `/categories` | GET/POST | JWT on POST | `#/categories` |
| `/categories/{id}` | GET/PATCH/DELETE | JWT on writes | detail + forms |
| `/items` | GET/POST | JWT on POST | `#/items` + create |
| `/items/stats/summary` | GET | — | `#/stats` |
| `/items/{id}` | GET/PATCH/DELETE | JWT on writes | detail + edit |

Query params on `GET /items`: `skip`, `limit`, `category_id`, `name_contains`, `min_price`, `max_price`.

---

## Laravel → Alpine Mapping

| Laravel | alpine-101 |
|---------|------------|
| Sanctum personal access token | JWT `Authorization: Bearer` |
| Blade views | Alpine `x-show` route panels |
| Form Request validation | Client forms + API 422 |
| Eloquent `category_id` | `category_id` + nested `category` |
| `paginate()` | `{ items, total, skip, limit }` + load more |
| `@auth` middleware | `canWrite` (auth **or** mock mode) |

---

## *-101 Family

### API backends (pair with this client)

| Repo | Port | Type | Stack |
|------|------|------|-------|
| [fastAPI-101](https://github.com/iammikek/fastAPI-101) | 8000 | API-only | FastAPI, SQLAlchemy |
| [django-101](https://github.com/iammikek/django-101) | 8001 | Monolith | Django + DRF + shop |
| [symfony-101](https://github.com/iammikek/symfony-101) | 8002 | Monolith | Symfony + shop |
| [laravel-101](https://github.com/iammikek/laravel-101) | 8003 | Monolith | Laravel + shop |
| [framework-x-101](https://github.com/iammikek/framework-x-101) | 8004 | Monolith | Framework X + shop |
| [orchestr-101](https://github.com/iammikek/orchestr-101) | 8005 | Monolith | Orchestr + shop |
| [nest-101](https://github.com/iammikek/nest-101) | 8006 | API-only | NestJS, TypeScript |
| [express-101](https://github.com/iammikek/express-101) | 8007 | API-only | Express, Vitest |
| [go-101](https://github.com/iammikek/go-101) | 8000* | API-only | Gin, GORM |
| [fortran-101](https://github.com/iammikek/fortran-101) | 8008 | API-only | Fortran, fpm |
| [java-101](https://github.com/iammikek/java-101) | 8009 | API-only | Spring Boot, JPA, Flyway |
| [dotNet-101](https://github.com/iammikek/dotNet-101) | 8010 | API-only | ASP.NET Core, xUnit |

| [flask-101](https://github.com/iammikek/flask-101) | 8011 | API-only | Flask, pytest |
\* go-101 also uses port 8000 — run one backend at a time, or change port in config.

### Other clients

| Repo | Platform | Stack |
|------|----------|-------|
| [flutter-101](https://github.com/iammikek/flutter-101) | Mobile / desktop | Flutter (iOS, macOS, Android) |
| [react-101](https://github.com/iammikek/react-101) | Web browser | React 19, Vite, Vitest |
| [vue-101](https://github.com/iammikek/vue-101) | Web browser | Vue 3, Vite, Pinia |
| [**alpine-101**](https://github.com/iammikek/alpine-101) | Web browser | Alpine.js, Vite, Vitest |

### Suggested pairing

- **Learning the API:** [fastAPI-101](https://github.com/iammikek/fastAPI-101) (8000) + alpine-101 mock off
- **Compare SPA styles:** alpine-101 vs [vue-101](https://github.com/iammikek/vue-101) vs [react-101](https://github.com/iammikek/react-101) against the same backend
- **Monolith + separate UI:** Use [laravel-101](https://github.com/iammikek/laravel-101) for `/shop`; use alpine-101 for the JSON API only

Catalogue: [automica.io/learning-101](https://automica.io/learning-101.html)

---

## Quick Reference

| Goal | Command |
|------|---------|
| Copy env | `cp .env.example .env` |
| Install | `npm install` |
| Dev server | `npm run dev` → http://localhost:5180 |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Run tests | `npm run test:run` |
| Pair with API | Set `VITE_USE_MOCK=false`, `VITE_BASE_URL=http://localhost:8000` |
