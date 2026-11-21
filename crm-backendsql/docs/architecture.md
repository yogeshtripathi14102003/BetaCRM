# Architecture

## Layers
- `core/`  : infra (auth utils, rbac, middlewares, plugins, events, queue, cache, logger). Business logic nahi.
- `modules/platform` : User(auth only), roles, teams, audit... sab modules use karte hain.
- `modules/crm|hrms|erp` : business modules. Har module me `models/ controllers/ services/ routes/ validations/ permissions/ events/ jobs/`.

## Dynamic loading
`bootstrap/loadModules.js` har `modules/*/module.manifest.js` padhta hai. `enabled:false` = skip.
Manifest declare karta hai: basePath, routes, permissions, roles, registrations, registerEvents.

## Auth vs Profile
- `User` (platform) = login credentials, status, roles, modules, tokens.
- Profile (module me) = business data (naam, designation, team, GST ...).
- Naya userType = module me `registration/<x>.registration.js` + manifest.registrations me add.
- `displayName` / `avatar` User me denormalized (listing ke liye); profile update par sync karo.

## Rules
1. Controller sirf req/res. Logic service me.
2. Dusre module ka model direct import nahi. Service ya event use karo.
3. Cross-module kaam `eventBus` se (core/events/eventNames.js).
4. platform kisi module ko import nahi karta; modules khud ko registry me register karte hain.

## Auth flow
login -> (2FA ho to tempToken -> /auth/2fa/login) -> access JWT (15m) + refresh (opaque, DB me hash, httpOnly cookie)
refresh -> rotation; purana token dobara aaya to poori family revoke (reuse detection)
logout-all / password change -> tokenVersion bump (access tokens turant invalid)

## Database (MySQL)
- Sequelize 6 + mysql2. Single pool: `core/database/sequelize.js`. `underscored: true` (JS `createdAt` <-> DB `created_at`), UTC, utf8mb4.
- Schema ka source of truth migrations hain (`modules/*/migrations`, umzug, ek saath filename order me). Models sirf unhe map karte hain.
- Relations: `user_roles` join table (real FK), profiles me `user_id` FK + UNIQUE, `audit_logs.actor_id` ON DELETE SET NULL.
- JSON columns (roles.permissions, users.modules): MySQL 8 object deta hai, MariaDB string; `jsonColumn()` helper dono sambhalta hai.
- Registration (user + roles + profile) ek transaction me: kuch fail ho to sab rollback.
