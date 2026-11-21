# API contract (frontend jo expect karta hai)

Backend ke existing conventions jaisa. Ye follow karoge to frontend bina badlaav ke chalega.
Mock backend (`src/mocks/`) bhi isi contract par bana hai, use reference ki tarah dekh sakte ho.

## Response shapes
```jsonc
// success
{ "success": true, "message": "OK", "data": <obj | array | null>, "meta": { ... } }
// list: data = array, meta = { total, page, limit, totalPages, hasNext, hasPrev }
// error (HTTP 4xx/5xx)
{ "success": false, "code": "VALIDATION_ERROR", "message": "...", "errors": [{ "path": "phone", "message": "..." }], "requestId": "..." }
```
Special codes jo frontend use karta hai: `TOKEN_EXPIRED`, `TOKEN_MISSING` (auto refresh + retry), `REFRESH_INVALID` (login par bhejna).

## List query params (sab list endpoints)
`page`, `limit` (max 100), `sort` (`-createdAt`, `name`), `search`, aur resource ke filters (`status`, `source`, `role`, `type`, `channel`, `leadId`, `bucket`...).
Khali params frontend bhejta hi nahi.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| GET/POST | /users, PATCH /users/:id | `?role=counsellor&status=active`; PATCH `{status}` block/unblock |
| GET | /roles, /teams, /audit | read-only lists |
| GET/POST | /crm/leads | create body: `name, phone, source` (+ optional `email, city, course, notes, assignedTo` userId) |
| GET | /crm/leads/export | Same filters (`status, source, search...`), pagination ignore. Response: `text/csv` file, `Content-Disposition: attachment; filename="leads-2026-10-24.csv"`. Columns: Name, Phone, Email, City, Source, Course, Status, Assigned to, Created |
| POST | /crm/leads/bulk | `{ action:'assign'\|'status'\|'delete', ids:[...], userId?, status? }` -> `{ affected }`. `status` badalne par har lead ki `status_change` activity bane |
| GET/PATCH/DELETE | /crm/leads/:id | PATCH `{status}` ya poori form (khali string = clear) |
| POST | /crm/leads/:id/assign | `{ userId }` -> updated lead |
| GET/POST | /crm/followups | `?leadId=`, `?bucket=today\|overdue\|upcoming\|done`; create `{ leadId, dueAt(ISO), note }` |
| POST | /crm/followups/:id/complete | -> updated followup |
| GET/POST | /crm/activities | `?leadId=`; create `{ leadId, type:'note', note }`. Status change par backend khud `status_change` activity banaye |
| GET | /crm/applications, /crm/students, /crm/payments | lists |
| GET | /crm/documents | list |
| POST | /crm/documents/:id/verify, /reject | -> updated document |
| GET | /crm/communication/templates | list |
| GET/POST | /crm/imports | POST multipart `file` (csv/xlsx) -> job `{ id, status:'queued'\|'processing'\|'completed'\|'failed', total, success, failed }`. Frontend active jobs ko har 3s poll karta hai |
| GET | /crm/reports/dashboard | `?range=7d\|30d\|90d` (ya `from&to`) -> `{ kpis:{ totalLeads, converted, conversionRate, revenue, pendingFollowups }, deltas:{ totalLeads, converted, conversionRate, revenue }, trend:[{date:'YYYY-MM-DD',leads,converted}], sources:[{source,count}], funnel:[{stage,count}], counsellors:[{id,name,leads,converted,conversionRate}] }`. `deltas` = pichle barabar ke period se % badlaav (`null` agar pichle period me data nahi) |

## Row shapes (list me jo fields chahiye)
- lead: `id, name, email, phone, city, source, course, status, notes, assignedTo:{id,displayName}|null, createdAt`
- followup: `id, lead:{id,name}, assignedTo:{id,displayName}, dueAt, note, status:'pending'|'done'`
- activity: `id, lead:{id,name}, type, note, by:{id,displayName}, createdAt`
- user: `id, email, phone, displayName, roles:[names], status, isEmailVerified, createdAt`
- role: `id, name, label, module, permissions:[...], dataScope, isSystem`
Baaki (application, student, payment, document, template, audit, import) ke fields `src/features/*/index.js` ke columns me dikhte hain.

## Permissions (UI gating, asli check backend)
`lead.read/create/update/delete/assign/import`, `followup.*`, `activity.*`, `application.read`, `student.read`, `payment.read`,
`lead.export`, `document.read/verify`, `communication.send`, `report.read`, `user.read/create/update`, `role.read`, `team.read`, `audit.read`.

## Kanban board ke liye
Board har status column ke liye alag list mangta hai: `GET /crm/leads?status=new&limit=10&sort=-updatedAt` (+ `search`, `source`).
`meta.total` column ka count dikhata hai. `sort` me `updatedAt` allowed hona chahiye.
