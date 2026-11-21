# Platform API (users, roles, teams, audit, notifications, settings, files)

Base: `/api/v1`. Response: `{ success, message, data, meta? }`. Errors: `{ success:false, code, message, errors?, requestId }`.
Sab endpoints ko `Authorization: Bearer <accessToken>` chahiye, jahan "public" likha ho wahan nahi.
List endpoints: `?page=1&limit=20&sort=-createdAt` (limit max 100) aur resource ke filters.

## Users  (`/users`)
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/users` | `user.read` | `?search&status&userType&role&module&isEmailVerified&sort`. Response me `data`, `meta` aur purana `pagination` dono. Har row me `roles` (naam), `profile` (module ka profile) |
| GET | `/users/:id` | `user.read` | + `profiles` (module-wise) |
| PATCH | `/users/:id` | `user.update` | `{ displayName?, email?, phone?, avatar?, status? }`. `status: blocked/pending` par user ke saare sessions band. Email/phone badalne par verified false |
| PUT | `/users/:id/roles` | `user.assign_role` | `{ roleIds: [1,2] }` ya `{ roles: ['counsellor'] }`. `[]` = saare roles hata do |
| POST | `/users/:id/reset-password` | `user.update` | `{ password }`. Sessions band + user ko notification |
| POST | `/users/:id/logout` | `user.update` | Saare devices se logout |
| POST | `/users/:id/unlock` | `user.update` | Failed-login lock hatao |
| DELETE | `/users/:id` | `user.delete` | Profile/tokens cascade; audit log bacha rehta hai |
| PATCH | `/users/me` | login | Apni `displayName` / `avatar` |

Naya user banana: `POST /auth/register` (admin) / `POST /auth/signup` (public userType).
**Guards:** apne aap par admin actions nahi (409); super admin ko sirf super admin; aakhri active super admin hat nahi sakta; `*` role sirf `*` wala de sakta hai.

## Roles  (`/roles`)
| Method | Path | Permission |
|---|---|---|
| GET | `/roles?search&module` | `role.read` (userCount ke saath) |
| GET | `/roles/permissions` | `role.read` (module-wise saari permissions + dataScopes: role editor ke liye) |
| POST | `/roles` | `role.create`: `{ name, label, module?, permissions[], dataScope? }` |
| PATCH | `/roles/:id` | `role.update` |
| DELETE | `/roles/:id` | `role.delete` (system role ya jis par users hon wo nahi) |
| GET / PUT | `/roles/:userId` ya `/user-roles/:userId` | `user.read` / `user.assign_role`: user ke roles dekhna / badalna (aapke purane endpoints) |

Permission format: `'*'`, `'lead.*'` (resource ki saari actions) ya `'lead.read'`; unknown permission 422.
**Privilege escalation roka:** role banate/badalte waqt sirf wahi *naye* permissions de sakte ho jo tumhare paas khud hain. `super_admin` role locked.

## Teams & Branches  (`/teams`, `/branches`)  — permissions `team.*`
- Branch: `{ name, code?, city?, address?, isActive }`. List me `teamCount`. Team wali branch delete nahi hoti (409).
- Team: `{ name, branchId?, leaderId?, memberIds? }`. List row: `{ id, name, branch (naam), branchId, leader:{id,displayName}, memberCount, isActive }`; `GET /teams/:id` me `members`.
- `PUT /teams/:id/members { userIds }` poori member list replace. **Ek user sirf ek team me** (DB primary key + 409 `ALREADY_IN_TEAM`). Leader/members active user hone chahiye.
- Data scope: role ka `dataScope` `team`/`branch` ho to `authenticate` me `req.user.teamMemberIds` / `branchMemberIds` aa jaate hain; `scopeWhere(req.user, { ownerField: 'assignedTo' })` unhi se filter banata hai.

## Audit  (`/audit`)  — `audit.read`
`GET /audit?actorId&action&entity&entityId&search&from&to` aur `GET /audit/:id`. Services me likhne ke liye:
`await auditService.record(ctx, { action: 'lead.updated', entity: 'Lead', entityId: id, meta: {...} })` (`ctx = ctxFrom(req)`).

## Notifications  (`/notifications`)  — sirf login (har user apni)
`GET /notifications?unread=true&type` (`meta.unread`), `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`, `DELETE /notifications/:id`.
Dusre modules se bhejne ke liye: `notificationService.notify(userId, { type, title, body, link })` / `notifyMany(userIds, payload)`.
Password/2FA change par security notification apne aap banti hai. Padhi hui 90 din purani maintenance job hatati hai.

## Settings  (`/settings`)
| Method | Path | Permission |
|---|---|---|
| GET | `/settings/public` | **public** (sirf `isPublic`: company naam, logo) |
| GET | `/settings?group=company`, `/settings/:key` | `setting.read` |
| PUT | `/settings/:key` `{ value }` | `setting.update` (type check: string/number/boolean/json) |
| PUT | `/settings` `{ settings: {key: value} }` | `setting.update` (sab ya koi nahi) |

Naya setting banana: module ke `module.manifest.js` me `settings: [{ key, group, label, type, default, isPublic }]` ek line, phir `npm run seed`. DB/API apne aap. Code me padhne ke liye: `await settingService.getValue('company.name')`.

## Files  (`/files`)
| Method | Path | Permission |
|---|---|---|
| POST | `/files` (multipart `file`, `entityType?`, `entityId?`) | `file.upload` |
| GET | `/files`, `/files/:id` | login: apni files; `file.read` / `*` wale ko sab |
| GET | `/files/:id/download[?inline=1]` | owner ya `file.read`. `inline` sirf image/pdf |
| POST | `/files/:id/signed-url` `{ ttlSeconds? }` | owner ya `file.read` -> `{ url, expiresAt }` |
| GET | `/files/signed/:token` | **public** (token hi permission; expire hota hai) |
| DELETE | `/files/:id` | owner ya `*` |

Allowed: png, jpg, jpeg, gif, webp, pdf, xlsx, docx, csv, txt. Extension + **magic bytes** dono check hote hain, mime server tay karta hai, disk par random naam, `UPLOAD_MAX_MB` (default 10) se bada 413.
Storage abhi local disk (`UPLOAD_DIR`, Docker me volume). S3 chahiye to `core/integrations/storage.js` ka interface (`put / createReadStream / exists / remove`) s3.js me implement karo, files module nahi badlega.
