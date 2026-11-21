# CRM Frontend (Next.js 16 + React Query + Tailwind v4)

`crm-backend` (Express + MySQL) ke saath chalta hai. App Router, JavaScript.

## Start
```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
npm test             # 58 tests (vitest + Testing Library)
npm run lint         # eslint (next core-web-vitals + react-hooks rules)
npm run format       # prettier
npm run build
```
**Backend ke bina try karna ho:** `.env.local` me `NEXT_PUBLIC_USE_MOCKS=true`.
Login: koi bhi email + password (admin). `counsellor@demo.com` = limited role, `2fa@demo.com` = 2FA step, OTP / 2FA code = `123456`.
Data page reload par reset hota hai. Production build me mocks hamesha band.

## Features
- **Auth:** Password / OTP / Google login, 2FA, forgot/reset password, email verify, sessions
- **Dashboard:** KPI cards (pichle period se % badlaav), leads trend, sources donut, funnel, top counsellors, aaj ke followups, recent activity
- **Leads:** List **ya Kanban pipeline** (drag & drop, keyboard ke liye "Move" select), filters, search, sorting, **bulk assign/status/delete**, **CSV export**, detail page (call / WhatsApp / email quick actions, timeline, followups), create/edit forms
- **Followups** (Today / Overdue / Upcoming / Completed), Activities, Applications, Students, Payments, Documents (verify/reject), Templates, Imports (upload + live status polling), Reports
- **Admin:** Users (block/unblock, create), Roles, Teams, Audit logs
- **App shell:** collapsible sidebar, breadcrumbs, **Ctrl/Cmd+K command palette** (pages, actions, lead search), notifications bell (overdue/aaj ke followups, har 60s refresh), **dark mode** (light/dark/system), role-based menu

## Architecture (layers alag-alag)
```
src/
├── app/            Sirf routes. Page patla: hook + component jodta hai
├── services/       API calls (React ka kuch nahi). createCrudService(path) + resource-specific calls
├── features/<x>/   hooks.js (React Query), columns.js, schema.js (zod), components/
├── lib/            http/ (fetch + token refresh), query/ (client, keys, createCrudHooks), format, permissions, nav
├── components/     ui/ (Button, Input, Card, Avatar...), common/, data-table/, layout/
├── hooks/          useListParams (URL state), useCan, useDebounce, useIsClient
├── providers/      Query, Auth, Theme
├── config/         env.js (zod-validated env), endpoints.js (API paths)
└── mocks/          Mock backend (sirf NEXT_PUBLIC_USE_MOCKS=true par)
```
Flow: `page -> hook (useLeads) -> service (leadService.list) -> http client -> API`.
Component me kabhi fetch/axios nahi, hamesha hook. Hook me kabhi URL string nahi, hamesha service.

## Design system
Colors sirf tokens se (`app/globals.css`): `bg-surface`, `bg-subtle`, `text-fg`, `text-muted`, `border-line`, `bg-brand`...
Dark mode me tokens apne aap badalte hain, isliye component me `slate-*`/`indigo-*` jaisa hard-coded color mat likho.
Font Inter self-hosted (`next/font/local`). Charts bhi CSS variables use karte hain. `prefers-reduced-motion` respect hota hai.

## Env vs endpoints
- **Env me:** jo environment ke saath badalta hai (API base URL, Google client ID, mock flag).
- **Code me (`config/endpoints.js`):** API paths. Ye backend contract ka hissa hain.
- `NEXT_PUBLIC_*` browser me chala jaata hai, secret kabhi mat rakho. Env galat ho to build/start par hi error.

## React Query patterns
Query key factory, URL-synced list state, `keepPreviousData`, **optimistic updates** (lead status, Kanban move, followup done: fail par rollback),
polling (imports), global error toasts, retry policy (4xx par nahi), logout par cache clear, bell badge ke liye cheap `meta.total` queries.

## Naya resource kaise banayein
1. `config/endpoints.js` me path, `lib/query/keys.js` me key
2. `services/x.service.js`: `createCrudService(ENDPOINTS.x)`
3. `features/x/index.js`: `createCrudHooks({...})` + `columns`
4. `app/(app)/.../page.js`: `<ResourceListPage ... />` (10 line). Bulk actions chahiye to `bulkActions={...}`
5. `lib/nav.js` me menu item (palette aur breadcrumbs usi se bante hain)

## Backend contract
`docs/API_CONTRACT.md`: response shapes, list params, bulk/export/dashboard endpoints. Mock backend (`src/mocks/`) isi par bana hai.

## Production checklist
- Frontend + API same main domain (`app.x.com` + `api.x.com`): refresh cookie `sameSite=strict` hai
- `NEXT_PUBLIC_API_URL` **build time** par bundle hota hai (Docker me `--build-arg`)
- Security headers `next.config.mjs` me hain (HSTS, frame deny, nosniff...). **CSP abhi nahi**: nonce-based CSP alag se lagao (Google Sign-In allow karke)
- Error tracking: `app/(app)/error.js` me `console.error` ki jagah Sentry lagao
- `docker build -f Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.x.com/api/v1 -t crm-web .`
- CI: `.github/workflows/ci.yml` (lint, format, test, build)
