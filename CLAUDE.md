# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 18 + Vite frontend for a thesis project (UPC): a security/audit analytics dashboard over document-access events. It has anomaly detection on CSV uploads, a risk dashboard per user, a live SOC-style detection engine, and an incident training/calibration module. The UI text and most identifiers are in Spanish. The backend is a separate service (FastAPI/Python with PostgreSQL, judging by `src/modules/eventos/task.md`) that is not in this repo.

## Commands

Node >= 22.12 is required (`engines` in package.json).

- `npm run dev`: Vite dev server
- `npm run build`: production build to `dist/`
- `npm run lint`: ESLint (flat config; `no-unused-vars` ignores names starting with a capital letter or `_`)
- `npm run preview`: serve the built bundle

There is no test runner script configured in package.json.


Prettier uses `printWidth: 120` (`.prettierrc`). The codebase is plain JS/JSX (no TypeScript).

## Configuration

`VITE_BACKEND_URL_MACHINE` (in `.env`) is the backend base URL. It falls back to `http://localhost:4000` (see `src/api/apiRestMachine.jsx`). The WebSocket URL is derived from the same value, so there is no separate WS setting.

## Architecture

**Provider stack** (`src/main.jsx`): Redux `Provider` → React Query `QueryClientProvider` → `AuthProvider` → `RouterProvider`. `AuthProvider` blocks rendering ("Verificando sesión...") until `GET /auth/verify` resolves. It then dispatches the result into the `USER_AUTH` slice.

**Auth** uses an httpOnly cookie. The shared axios instance (`src/api/apiRestMachine.jsx`) sets `withCredentials: true`, and no token is ever stored client-side. `USER_AUTH` holds `auth`, `user` and `roles_user` (`user.rol`, an array of objects with `rol_id`). `PrivateRoute`/`PublicRoute` in `src/config/PrivateRoutes.jsx` gate on that state. `PrivateRoute allowedRoles={[...]}` redirects to `/no-autorizado`, which has no matching route and falls through to the `*` placeholder.

**Routing** is a single `createBrowserRouter` in `src/config/routes.jsx`. Most pages sit under the first `PrivateRoute` with no role restriction. Role-restricted blocks (`[1]`, `[2]`) exist below it, and they re-register `/` and `/dashboard` as `ComingSoon` placeholders. `MainLayout` and `SidebarAdmin` live in `src/layout/admin_layout/`. When adding a page, register the route and add a sidebar entry.

**Data layer**: all HTTP goes through `src/api/api*.jsx`. Each file holds raw async functions plus React Query hooks (`useXxx`) in the same file. Query keys follow the `"anomalias_<name>"` convention with the filter object as the second element, and mutations invalidate groups of those keys. For example, `useSubirCSVAnomalias` invalidates every `anomalias_*` key after a CSV upload. Check existing keys before adding hooks, so new queries get invalidated correctly. Date filtering is shared through the `FILTRO_FECHAS` Redux slice (`fechaInicio`/`fechaFin`, sent as `fecha_inicio`/`fecha_fin`).

**Redux** (`src/Redux/store.jsx`) holds only cross-cutting UI state: `USER_AUTH`, `SETTING_APP`, `FILTRO_FECHAS` and `CART_APP`. `CART_APP` and `apiProducto.jsx` are template leftovers. Server data belongs in React Query, not Redux.

**Feature modules** (`src/modules/<feature>/{pages,components|componentes}`) use co-located CSS Modules (`*.module.css`), with one folder per component. The feature areas are:
- `anomalias`: CSV upload, an anomaly-score dashboard (Recharts), a paginated table and a timeline. It has document traceability and statistical-rarity (XAI) modals.
- `eventos`: risk dashboards built from uploaded event CSVs (users, classification, heatmaps, EWMA profiles).
- `MotorDeteccion`: the live monitoring engine (see below).
- `entrenamiento`: incident list and forensic detail (`IncidenteDetallePage`), also mounted at `/incidentes`. Several routes deliberately render the same component under different paths (`/eventos/motor-deteccion` and `/eventos/monitoreo-vivo`, and the `/entrenamiento` and `/incidentes` pairs). Keep the aliases in sync when changing them.
- `auth`: login pages and `AuthProvider`.

**Live monitoring** (`src/modules/MotorDeteccion/MotorDeteccion.jsx`) opens a WebSocket to `${API_MACHINE as ws}/eventos/ws/monitoreo`, reconnecting every 3s. Incoming events are passed through the pure functions in `telemetria.js` (`acumularEvento`, `combinarResumenSOC`, `correlacionarEnVivo`, `listarIncidentesEnVivo`, ...). Those functions keep cumulative counters and incident correlation, with a threat defined as a (documento, usuario) pair. The counters are kept separate from the capped (300-row) live feed on purpose, so totals must not be derived from the feed. `telemetria.js` has no React or DOM dependencies, so it stays testable with plain Node. Put logic changes there.

Other notes:
- `src/modules/eventos/task.md` and `walkthrough.md` document the backend/frontend design of the risk dashboard. They are useful background for the event pipeline (ETL, Isolation Forest, hybrid score, EWMA profiles).
- `src/tools/` has shared helpers (`Toasting.jsx` for sonner toasts, `xlsx.jsx`). PDF export uses `jspdf` + `html2canvas`.
- `.opencode/` and `bash.exe.stackdump` are tooling artifacts, not part of the app.
