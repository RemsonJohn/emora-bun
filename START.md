# Starting Emora on this Windows PC

How to start everything locally, day to day. For first-time setup (creating databases, migrations, seeding) see `SETUP.md` and `SHOPS.md`. For the production server, see the Guide → VPS tab in the super admin.

Use PowerShell. Open **one terminal per service** and leave it running. Press `Ctrl+C` in a terminal to stop that service.

---

## 1. Start the database (every time you restart the PC)

This project has its **own private Postgres** inside the repo:

| | |
|---|---|
| Data folder | `C:\Projects\claude\emora-bun\.local-data\postgres` |
| Port | **5433** |
| Log | `C:\Projects\claude\emora-bun\.local-data\postgres.log` |

It does **not** start by itself. Start it first:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D C:\Projects\claude\emora-bun\.local-data\postgres -l C:\Projects\claude\emora-bun\.local-data\postgres.log -o "-p 5433" start
```

Check that it's up:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h localhost -p 5433
```

You should see `localhost:5433 - accepting connections`.

Stop it (optional; it also stops when the PC shuts down):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D C:\Projects\claude\emora-bun\.local-data\postgres stop
```

> ⚠ The Postgres that Windows starts automatically (service `postgresql-x64-18`, port **5432**) is a **different** database with a different password. The shop databases are not in it. Do not point the `.env` files at 5432.

---

## 2. Start the shop backends (Medusa)

Each shop has its own backend and database. The settings come from `apps\backend\.env.sagar` and `apps\backend\.env.anushq`. These files are not in git; never commit them.

**Sagar Sportz** (port 9000):
```powershell
cd C:\Projects\claude\emora-bun\apps\backend; node scripts/shop.mjs sagar develop
```

**Anushq** (port 9001):
```powershell
cd C:\Projects\claude\emora-bun\apps\backend; node scripts/shop.mjs anushq develop
```

It's ready when you see `Server is ready on port 9000` (or 9001).

---

## 3. Start the storefronts (the shops customers see)

Start the matching backend (step 2) first. Each storefront reads `MEDUSA_BACKEND_URL`, `MEDUSA_PUBLISHABLE_KEY` and `STOREFRONT_SHARED_SECRET` from its own `.env.local`.

**Sagar Sportz** (port 3001):
```powershell
cd C:\Projects\claude\sagarsportz; npm run dev -- -p 3001
```

**Anushq** (port 3002):
```powershell
cd C:\Projects\claude\anushq\apps\web; npm run dev -- -p 3002
```

To test the fast production build instead, run `npm run build` once, then `npm run start -- -p 3001` (use `-p 3002` for Anushq).

---

## 4. Start the merchant dashboards (optional)

These are the custom shop-owner dashboards. They run from the same folder; only the backend and port change.

**Sagar** (port 5174, talks to backend 9000):
```powershell
cd C:\Projects\claude\emora-bun\apps\client-dashboard; bun run dev
```

**Anushq** (port 5176, talks to backend 9001):
```powershell
cd C:\Projects\claude\emora-bun\apps\client-dashboard; $env:DASHBOARD_BACKEND_URL="http://localhost:9001"; $env:DASHBOARD_PORT="5176"; bun run dev
```

---

## 5. Start the Emora super admin (optional)

The platform API stores the merchant list in its own database (`emora_platform`, in the same Postgres on 5433). Settings are in `apps\platform-api\.env`, which is not in git.

**Platform API** (port 9100):
```powershell
cd C:\Projects\claude\emora-bun\apps\platform-api; bun run dev
```

**Super admin website** (port 5175):
```powershell
cd C:\Projects\claude\emora-bun\apps\platform-admin; bun run dev
```

---

## Addresses

| What | Address | Needs running |
|---|---|---|
| Sagar shop | http://localhost:3001 | DB, Sagar backend, Sagar storefront |
| Anushq shop | http://localhost:3002 | DB, Anushq backend, Anushq storefront |
| Sagar Medusa Admin | http://localhost:9000/app | DB, Sagar backend |
| Anushq Medusa Admin | http://localhost:9001/app | DB, Anushq backend |
| Sagar merchant dashboard | http://localhost:5174 | DB, Sagar backend, dashboard |
| Anushq merchant dashboard | http://localhost:5176 | DB, Anushq backend, dashboard |
| Emora super admin | http://localhost:5175 | DB, platform API, super admin |

Sign-in details are not kept in this file. Keep them in your password manager.

**You only need what you're testing.** For example, to work on the Sagar shop: step 1, the Sagar backend, and the Sagar storefront.

---

## Do NOT use `bun run dev` at the repo root

The root `bun run dev` starts the original starter setup: one backend on 9000 using the plain `.env`, plus the starter storefronts on 8000/8001. It does not use the per-shop settings, and it does not start Anushq or the real storefronts. Use the commands above instead.

---

## Common problems

**`Pg connection failed … ECONNREFUSED`**
The project database isn't running. Do step 1.

**`password authentication failed for user "postgres"`**
The `.env` file points at the wrong Postgres (usually port 5432). The `DATABASE_URL` in `.env.sagar` / `.env.anushq` must use `localhost:5433`.

**`redisUrl not found. A fake redis instance will be used.`**
This is fine locally. The backend keeps that data in memory. The VPS uses real Redis.

**`Port 9000 is already in use`** (or another port)
Something else is using that port, often an old backend still running. See what it is:
```powershell
Get-NetTCPConnection -LocalPort 9000 -State Listen | Select-Object OwningProcess
Get-Process -Id <the number shown>
```
Stop it in its own terminal with `Ctrl+C`. If you're sure it's an old Emora process, run `Stop-Process -Id <number>`.

**Next.js warning `ignored package-lock.json in C:\Projects\claude`**
This is harmless. There's a stray `package-lock.json` in the parent folder `C:\Projects\claude`. Next.js ignores it and uses the right folder.

**Storefront shows no products or errors on cart**
Check that the matching backend is running and that the storefront's `.env.local` has the right `MEDUSA_BACKEND_URL` (9000 for Sagar, 9001 for Anushq) and publishable key.

**`db:create` added a `DB_NAME=` line to `apps\backend\.env`**
Medusa's `db:create` does this. Delete that line, because the per-shop files set the database.
