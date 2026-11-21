# CRM Backend (modular: platform + crm + hrms + erp)

## Start
```bash
cp .env.example .env          # secrets badlo (JWT_ACCESS_SECRET, ENCRYPTION_KEY)
npm install
docker compose -f docker/docker-compose.yml up -d mysql redis   # ya apna MySQL 8
npm run migrate               # tables banao (RUN_MIGRATIONS_ON_BOOT=true ho to dev me apne aap)
npm run dev                   # SEED_ON_BOOT=true ho to roles + super admin ban jata hai
npm test                      # DB ke bina
npm run test:db               # asli MySQL par poora auth flow (DB_* set ho; us DB ki saari tables DROP hoti hain!)
```
Default super admin: `.env` ke `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` (pehle login ke baad badlo).

## Auth APIs (`/api/v1/auth`)
| Method | Path | Access |
|---|---|---|
| POST | /signup | public (sirf `publicRegistration:true` userType) |
| POST | /login | public. Password login (`identifier` = email ya phone). 2FA ho to `{requires2FA, tempToken}` |
| POST | /otp/request | public. `{identifier}` par 6 digit OTP (email ya phone) |
| POST | /otp/login | public. `{identifier, code}` |
| POST | /google | public. `{idToken}` (Google Sign-In se mila ID token) |
| POST | /2fa/login | public (tempToken + 6 digit code) |
| POST | /refresh | refresh cookie ya body.refreshToken |
| POST | /logout, /logout-all | |
| POST | /forgot-password, /reset-password | public |
| POST | /verify-email | public |
| GET | /me | user + roles + permissions + module profiles |
| POST | /change-password | login |
| POST | /resend-verification | login |
| POST | /2fa/setup, /2fa/enable, /2fa/disable | login |
| POST | /register | admin (`user.create`): kisi bhi userType ka user |

## Login ke 3 tarike
Teeno ek hi jagah (`afterPrimaryAuth`) milte hain, to status check, TOTP 2FA aur token session sab me same rehta hai.
- **Password:** email ya phone + password.
- **OTP:** `/otp/request` phir `/otp/login`. 5 min valid, single use, 5 galat attempts par OTP band, 60 sec resend gap, max 5 OTP/ghanta. Email SMTP se jata hai. **Phone SMS ke liye `core/integrations/sms.js` me provider lagana hoga** (abhi dev me console me print hota hai).
- **Google:** `.env` me `GOOGLE_CLIENT_ID` do. Frontend se ID token aata hai, backend verify karta hai. Sirf existing user login hota hai (admin ne account banaya ho); pehli baar email match par `googleId` link ho jata hai.
- Account me password na ho (Google-only) to "forgot password" se set kar sakta hai.

Register body:
```json
{ "userType": "crm_counsellor", "email": "rahul@x.com", "password": "Secret@123",
  "roles": ["team_leader"],
  "profile": { "firstName": "Rahul", "employeeCode": "EMP101", "languages": ["hi","en"] } }
```
Web client refresh token httpOnly cookie me paata hai. Mobile: header `X-Client-Type: mobile` bhejo, refresh token body me milega.

## Naya feature (e.g. leads) kaise banayein
1. `crm/models/lead.model.js` (`sequelize.define`) -> `models/index.js` me export, aur `crm/migrations/<timestamp>-crm-create-leads.js` me table
2. `crm/validations/lead.validation.js` (zod)
3. `crm/services/lead.service.js` (logic, `eventBus.emit(...)`)
4. `crm/controllers/lead.controller.js` (asyncHandler + apiResponse)
5. `crm/routes/lead.routes.js`: `router.post('/', authorize('lead.create'), validate(schema), ctrl.create)`
   (authenticate + module check crm/routes/index.js me pehle se lagta hai)
6. Data scope: `Lead.findAll({ where: { ...scopeWhere(req.user, { ownerField: 'assignedTo' }) } })` (core/rbac/dataScope.js)
7. List endpoints: `paginate(Lead, { where, query: req.query, sortable: [...] })` (core/database/paginate.js)

## Naya module / userType
- Module: `modules/<name>/` + `module.manifest.js` (`enabled: true`). `app.js` me kuch nahi badalna.
- userType: `registration/<x>.registration.js` banao, manifest `registrations` me add karo.

## Notes
- **Database: MySQL 8** (Sequelize 6 + mysql2). MariaDB 10.6+ par bhi chalta hai. Transactions hamesha milte hain (InnoDB).
- **Schema = migrations.** Tables `modules/<name>/migrations/*.js` se bante hain (`npm run migrate`, `migrate:down`, `migrate:status`).
  Schema badalna ho to purani file edit mat karo, nayi file banao (naam timestamp se shuru: `20260215120000-crm-create-leads.js`).
  Pending migrations hon to server start hi nahi hota (production me galat schema par chalna data ke liye risky hai).
- Mongo ke TTL index ki jagah expired tokens/OTP har 6 ghante me cleanup job delete karti hai.
- IDs `BIGINT` hain; API me string ban ke aate hain (frontend ke liye same).
- Email/phone unique hain (email case-insensitive). Secrets (`passwordHash`, 2FA secret) default query me aate hi nahi: `User.scope('withSecrets')`.
- Platform stubs (users, roles, teams, notifications, settings, files) aur crm ki saari features me `// TODO` files hain.
- Super admin ke alawa har role seed me sirf pehli baar insert hota hai (admin ke edits overwrite nahi hote).


## Platform module (ab poora)
`users, roles, teams/branches, audit, notifications, settings, files` ke controller/service/route/validation sab likhe hain.
Poori endpoint list, permissions aur rules: **`docs/PLATFORM_API.md`**.

Pehli baar (ya update ke baad):
```bash
npm install            # multer naya dependency hai
npm run migrate        # 20260101000110: branches, teams, team_members, notifications, settings, files
npm run seed           # settings ki defaults (company.*) DB me
npm run test:db        # 105 tests (asli MySQL par)
```
Notes:
- Pehle `/roles/:userId` par login nahi lagta tha (koi bhi role de sakta tha). Ab har platform route par `authenticate` + `authorize`.
- Seed roles ki permissions sirf pehli baar set hoti hain: purane DB me naye permissions ka kaam role editor (`PATCH /roles/:id`) se hoga.
- Files ke liye server par `UPLOAD_DIR` writable hona chahiye (Docker me volume lagaya hai).
