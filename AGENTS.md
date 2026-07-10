<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Project State

## Completed

- **Step 1**: OpenCode config (opencode.json, tools)
- **Step 2**: Base optimizations (dashboard, apiCache, errorHandler, analytics)
- **Step 3**: IndexedDB history store (types, fortuneStore, 100-record in-memory cache, dedup by date+userProfileHash)
- **Step 4**: Auto-record fortune calculation results to IndexedDB
- **Step 5**: History page at `/history` using `FortuneLogViewer` component (filters, pagination 30/page, search hints, stats); removed inline toggle from Dashboard
- **Step 6**: Performance monitor page at `/dev/perf` (developer tool, not in NavBar)
- **Step 7**: API monitor page at `/dev/api` (developer tool, not in NavBar)
- **Step 8**: Final UI Polish & Consistency Pass — All 4 main pages unified layout (full-width cards, responsive spacing), 195 tests pass ✅

## Routes

| Path         | Name         | NavBar     |
| ------------ | ------------ | ---------- |
| `/`          | home         | 首頁       |
| `/dashboard` | dashboard    | 投資儀表板 |
| `/history`   | history      | 運勢歷史   |
| `/analytics` | analytics    | 數據分析   |
| `/profile`   | profile      | 個人設定   |
| `/dev/perf`  | perf-monitor | ❌ 隱藏    |
| `/dev/api`   | api-monitor  | ❌ 隱藏    |

## Dev Tools Access

- Performance monitor: `window.__perfMonitor.start(label)`, `window.__perfMonitor.end(label)` then navigate to `/dev/perf`
- API monitor: `window.__apiMonitor.record(endpoint, method, status, duration)` then navigate to `/dev/api`

## Tests

- 198 tests across 13 test files
- Key: `fortuneStore.test.ts` (12), `fortuneLogViewer.test.ts` (8), `dashboard.test.ts` (18), `analytics.test.ts` (17), `user.test.ts` (15)

## Tech Stack

Vue 3.5 + TypeScript 5.9 + Vite 8.1 + Pinia 3.0 + TailwindCSS 3.3 + Vitest 4.1
