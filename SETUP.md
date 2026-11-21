# Local development on Windows

This workspace uses **Bun 1.4.4** (the root `packageManager` is authoritative)
and requires **Node.js >=22.23.4** and **PostgreSQL >=15**. Run workspace
commands with Bun, including commands in apps whose manifests still list npm.

## Runtime and dependencies

The workspace-local Bun runtime is in `.local-tools/bun-windows-x64`.
In each new PowerShell terminal at the repository root, run:

```powershell
$env:PATH = "${PWD}\.local-tools\bun-windows-x64;$env:PATH"
bun install --frozen-lockfile
```

Both `.local-tools` and `.local-data` are ignored by Git.

## Environment

Local configuration belongs in `apps/backend/.env` and each frontend's
`.env.local`. Never commit these files. Backend and primary storefront
templates are in `.env.template`; the other apps provide `.env.example`.
The backend's local secrets are generated randomly during initial setup.

The isolated PostgreSQL cluster lives in `.local-data/postgres` and uses port
5433. It does not use an existing system database. Start and stop it from the
repository root with:

```powershell
& "C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe" -D "$PWD/.local-data/postgres" -l "$PWD/.local-data/postgres.log" -o "-h 127.0.0.1 -p 5433" start
& "C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe" -D "$PWD/.local-data/postgres" stop -m fast
```

Once the `emora` database exists, run the migrations from `apps/backend`:

```powershell
node ../../node_modules/@medusajs/cli/cli.js db:migrate
```

Migrations also seed the starter store, its Europe region, and a publishable
API key. This project's staff access system requires invitation metadata
`emora_role` to be `admin`, `inventory_manager`, or `customer_support`.
The standard `medusa user --invite` command does not add this metadata and
its invitation will be rejected until a role is assigned. The initial local
invitation for `emovateio@gmail.com` has been assigned the `admin` role.
After registration, create further invitations through the project's staff
management flow with an explicit role.

The local seed's publishable key has been configured in both storefronts'
`.env.local`. For a new database, retrieve it from Medusa Admin > Settings >
Publishable API Keys. The default seed supports Denmark (`dk`); Sagar's `in` default
requires an India region and INR prices to be configured in Medusa.

Redis is optional for basic startup but required by the custom storefront
analytics endpoints. If using analytics, install Redis and configure
`REDIS_URL` in the backend environment.

## Start the apps

Run from the root in separate terminals with Bun on PATH:

```powershell
bun run backend:dev
bun run storefront:dev
bun run dashboard:dev
bun --cwd apps/sagar-storefront run dev
```

| App | Local URL |
| --- | --- |
| Medusa API | http://localhost:9000 |
| Medusa Admin | http://localhost:9000/app |
| Primary storefront | http://localhost:8000 |
| Sagar storefront | http://localhost:8001 |
| Client dashboard | http://localhost:5174 |

`bun run dev` now uses `scripts/dev.mjs`, a Node launcher that bypasses the
Turbo native executable and executable shims that fail on this Windows machine.
It starts the workspace backend, both workspace storefronts, merchant dashboard,
platform API (9100), and platform admin (5175). Occupied ports are reported and
left untouched; verify that the process on each port is the intended app.
Ctrl+C stops only processes started by that invocation. PostgreSQL must be
started separately. External Anushq/Sagar repositories and the static design
prototype are not included. The backend uses its default `.env`; use the shop
commands in `SHOPS.md` for isolated merchant backends. Startup skips Medusa lint;
run lint separately before development changes. `bun run dev --check` validates
the entry points without starting servers. Build/lint/test Turbo scripts are
unchanged by this development-startup fix.

Integration tests require the running
database. The root `test` task does not run backend suites; use the backend's
`test:unit`, `test:integration:modules`, or `test:integration:http` scripts.

### Windows command shim workaround

Bun's generated executable shims failed to launch in the setup environment.
The following direct Node commands successfully started the apps. Run each
from its app directory in a separate terminal:

```powershell
# apps/backend: startup only; run lint separately before development changes
node ../../node_modules/@medusajs/cli/cli.js develop --no-lint
# apps/storefront
node ../../node_modules/next/dist/bin/next dev -p 8000
# apps/client-dashboard
node node_modules/vite/bin/vite.js
# apps/sagar-storefront
node ../../node_modules/next/dist/bin/next dev -p 8001
```

Initial verification: dependency installation completed with the frozen Bun
lockfile, migrations and starter seed succeeded, backend health returned 200,
and the store API returned one region and four products. The primary
storefront and dashboard reached their ready states. Full builds and lint
were not run as part of environment setup.

The dashboard must use its own Vite 8 installation. The root Vite 7 belongs
to the backend; launching the dashboard with it causes JavaScript transform
errors and a blank page, even when the HTML request returns 200.

Bun blocked the optional install scripts for `esbuild` and `msgpackr-extract`.
The verified startup paths worked without enabling these scripts.

The admin invitation for `emovateio@gmail.com` is stored locally in
`.local-data/admin-invitation.txt`. It is not emailed. Open its URL to set a
password; invitation tokens expire, so create another invitation if needed.
