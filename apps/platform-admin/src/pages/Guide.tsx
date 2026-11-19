import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Card } from "@/components/ui"

/**
 * Step-by-step manual for the Emora team: local setup, databases and
 * migrations, starting everything, adding a shop, using this super admin and
 * fixing common problems. Commands are for Windows PowerShell.
 */

const ROOT = "C:\\Projects\\claude\\emora-bun"

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative my-2">
      <pre className="overflow-x-auto rounded-lg border border-line bg-soft px-3.5 py-2.5 pr-12 font-mono text-[12px] leading-relaxed whitespace-pre">
        {children}
      </pre>
      <button
        type="button"
        aria-label="Copy command"
        onClick={async () => {
          await navigator.clipboard.writeText(children)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        }}
        className="absolute top-2 right-2 grid size-7 place-items-center rounded-md border border-line bg-surface text-muted opacity-80 transition hover:text-ink group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative pl-9">
      <span aria-hidden="true" className="absolute top-0 left-0 grid size-6 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
        {n}
      </span>
      <p className="font-medium">{title}</p>
      <div className="mt-1 space-y-2 text-muted [&_strong]:text-ink">{children}</div>
    </li>
  )
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <Card title={title}>
        {intro && <p className="mb-4 text-muted">{intro}</p>}
        <ol className="space-y-5">{children}</ol>
      </Card>
    </section>
  )
}

const C = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-soft px-1 py-0.5 font-mono text-[12px] text-ink">{children}</code>

const SECTIONS = [
  ["overview", "1. What runs where"],
  ["once", "2. Set up a computer (once)"],
  ["database", "3. Start the database"],
  ["create-db", "4. Create databases and migrate"],
  ["catalogue", "5. Load a shop's catalogue"],
  ["logins", "6. Create logins"],
  ["start", "7. Start everything (daily)"],
  ["use", "8. Use the super admin"],
  ["new-shop", "9. Add a new shop"],
  ["updates", "10. After pulling new code"],
  ["trouble", "11. Troubleshooting"],
  ["razorpay", "12. Razorpay (later)"],
] as const

export function Guide() {
  return (
    <div>
      <h1 className="text-[24px] leading-tight font-semibold tracking-tight">Guide</h1>
      <p className="mt-0.5 max-w-2xl text-muted">
        Step-by-step manual for running Emora locally and using this super admin. Commands are for Windows PowerShell; use the copy button on each one.
        Never paste passwords or secrets into chat or commit them to git.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Guide contents" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="space-y-0.5 rounded-xl border border-line bg-surface p-2">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 text-muted transition-colors hover:bg-soft hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5">
          <section id="overview" className="scroll-mt-6">
            <Card title="1. What runs where">
              <p className="mb-3 text-muted">
                Each shop has its own backend and database. The Emora platform (this super admin) is separate and talks to the shops only through a signed connection.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="text-[12px] text-muted">
                    <tr className="border-b border-line">
                      <th className="py-2 pr-3 font-medium">App</th>
                      <th className="py-2 pr-3 font-medium">Address</th>
                      <th className="py-2 pr-3 font-medium">Folder</th>
                      <th className="py-2 font-medium">Database</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_tr]:border-b [&_tr]:border-line">
                    <tr><td>PostgreSQL</td><td>localhost:5433</td><td>.local-data/postgres</td><td>all databases</td></tr>
                    <tr><td>Sagar backend + Medusa Admin</td><td>http://localhost:9000 (/app)</td><td>emora-bun/apps/backend</td><td>emora_sagar</td></tr>
                    <tr><td>Anushq backend + Medusa Admin</td><td>http://localhost:9001 (/app)</td><td>emora-bun/apps/backend</td><td>emora_anushq</td></tr>
                    <tr><td>Platform API</td><td>http://localhost:9100</td><td>emora-bun/apps/platform-api</td><td>emora_platform</td></tr>
                    <tr><td>Super admin (this app)</td><td>http://localhost:5175</td><td>emora-bun/apps/platform-admin</td><td>(uses Platform API)</td></tr>
                    <tr><td>Merchant dashboard, Sagar</td><td>http://localhost:5174</td><td>emora-bun/apps/client-dashboard</td><td>(uses Sagar backend)</td></tr>
                    <tr><td>Merchant dashboard, Anushq</td><td>http://localhost:5176</td><td>emora-bun/apps/client-dashboard</td><td>(uses Anushq backend)</td></tr>
                    <tr><td>Sagar storefront</td><td>http://localhost:3001</td><td>sagarsportz</td><td>(uses Sagar backend)</td></tr>
                    <tr><td>Anushq storefront</td><td>http://localhost:3002</td><td>anushq/apps/web</td><td>(uses Anushq backend)</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[12px] text-muted">
                Settings live in files that are never committed: <C>apps/backend/.env.sagar</C>, <C>apps/backend/.env.anushq</C>, <C>apps/platform-api/.env</C>, and each storefront's <C>.env.local</C>. Templates show what each needs.
              </p>
            </Card>
          </section>

          <Section id="once" title="2. Set up a computer (once)" intro="Needed only on a new computer.">
            <Step n={1} title="Install the tools">
              <p>Node.js 22.23 or newer, Git, and PostgreSQL 18 (installed to <C>C:\Program Files\PostgreSQL\18</C>).</p>
            </Step>
            <Step n={2} title="Put Bun on the path (in every new terminal)">
              <Code>{`$env:PATH = "${ROOT}\\.local-tools\\bun-windows-x64;$env:PATH"`}</Code>
            </Step>
            <Step n={3} title="Install the platform's packages">
              <Code>{`cd ${ROOT}\nbun install --frozen-lockfile`}</Code>
            </Step>
            <Step n={4} title="Install the storefronts' packages">
              <Code>{`cd C:\\Projects\\claude\\sagarsportz\nnpm install`}</Code>
              <Code>{`cd C:\\Projects\\claude\\anushq\nnpm install`}</Code>
            </Step>
            <Step n={5} title="Know this about Windows">
              <p>
                Windows Smart App Control blocks a compiler Medusa uses (SWC). The commands in this guide avoid it. Messages mentioning SWC or "native binding" are harmless. Do not run <C>bun run dev</C> at the repo root: it starts the old single-store setup on port 9000.
              </p>
            </Step>
          </Section>

          <Section id="database" title="3. Start the database" intro="PostgreSQL runs from the repo's .local-data folder on port 5433. Start it before anything else.">
            <Step n={1} title="Start">
              <Code>{`cd ${ROOT}\n& "C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe" -D "$PWD/.local-data/postgres" -l "$PWD/.local-data/postgres.log" -o "-h 127.0.0.1 -p 5433" start`}</Code>
            </Step>
            <Step n={2} title="Stop (when you are done)">
              <Code>{`cd ${ROOT}\n& "C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe" -D "$PWD/.local-data/postgres" stop -m fast`}</Code>
            </Step>
          </Section>

          <Section id="create-db" title="4. Create databases and migrate" intro="First time only. Migrating also sets each shop up for India: INR, GST-inclusive prices, India and International regions, delivery options, cash on delivery and pay later.">
            <Step n={1} title="Make a random secret (repeat for each secret you need)">
              <Code>{`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`}</Code>
            </Step>
            <Step n={2} title="Create the shop's settings file">
              <Code>{`cd ${ROOT}\\apps\\backend\nCopy-Item .env.shop.template .env.sagar`}</Code>
              <p>
                Open <C>.env.sagar</C> and fill in: <strong>DATABASE_URL</strong> (ending in <C>/emora_sagar</C>), <strong>PORT</strong> (9000), the CORS lines (storefront 3001, dashboard 5174), random <strong>JWT_SECRET</strong>, <strong>COOKIE_SECRET</strong>, <strong>STOREFRONT_SHARED_SECRET</strong> and <strong>PLATFORM_SHARED_SECRET</strong>, <strong>MERCHANT_DASHBOARD_URL</strong>, the shop name, warehouse address and the delivery charge and free-delivery threshold. For Anushq use <C>.env.anushq</C>, port 9001, storefront 3002, dashboard 5176.
              </p>
            </Step>
            <Step n={3} title="Create the shop's database">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar db:create --db emora_sagar`}</Code>
              <p>
                This also adds a <C>DB_NAME=</C> line to <C>apps/backend/.env</C>. Delete that line afterwards.
              </p>
            </Step>
            <Step n={4} title="Run the migrations">
              <Code>{`node scripts/shop.mjs sagar db:migrate`}</Code>
              <p>
                At the end it prints <strong>"Publishable key: pk_…"</strong>. Copy it; the storefront needs it. You can also find it later in Medusa Admin under Settings, Publishable API Keys.
              </p>
            </Step>
            <Step n={5} title="Repeat for Anushq">
              <Code>{`node scripts/shop.mjs anushq db:create --db emora_anushq\nnode scripts/shop.mjs anushq db:migrate`}</Code>
            </Step>
            <Step n={6} title="Create the platform's settings and database">
              <Code>{`cd ${ROOT}\\apps\\platform-api\nCopy-Item .env.template .env`}</Code>
              <p>
                Fill in <C>.env</C>: <strong>DATABASE_URL</strong> ending in <C>/emora_platform</C>, random <strong>JWT_SECRET</strong>, <strong>COOKIE_SECRET</strong> and <strong>AUTH_MFA_ENCRYPTION_KEY</strong>, <strong>PLATFORM_SECRETS_KEY</strong> (exactly 64 hex characters, from <C>{`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}</C>) and <strong>ALLOWED_SHOP_ORIGINS</strong> listing the shop backends (for example <C>http://localhost:9000,http://localhost:9001</C>).
              </p>
              <Code>{`node scripts/medusa.mjs db:create --db emora_platform\nnode scripts/medusa.mjs db:migrate`}</Code>
              <p>Delete the <C>DB_NAME=</C> line it adds to <C>apps/platform-api/.env</C>.</p>
            </Step>
          </Section>

          <Section id="catalogue" title="5. Load a shop's catalogue" intro="First time only. After this, products are managed in Medusa Admin. Running the import again skips products that already exist.">
            <Step n={1} title="Export the catalogue from the storefront">
              <Code>{`cd C:\\Projects\\claude\\sagarsportz\nnode scripts/export-catalogue.mjs`}</Code>
              <Code>{`cd C:\\Projects\\claude\\anushq\\apps\\web\nnode scripts/export-catalogue.mjs`}</Code>
            </Step>
            <Step n={2} title="Import it into the shop's backend">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar exec ./src/scripts/import-catalogue.ts C:/Projects/claude/sagarsportz/catalogue.json`}</Code>
              <Code>{`node scripts/shop.mjs anushq exec ./src/scripts/import-catalogue.ts C:/Projects/claude/anushq/apps/web/catalogue.json`}</Code>
            </Step>
          </Section>

          <Section id="logins" title="6. Create logins" intro="Use passwords made of letters and digits only: the command line can misread passwords that contain a dash.">
            <Step n={1} title="First admin of a shop (Medusa Admin and merchant dashboard)">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar user -e owner@example.com -p ChooseAPassword123\nnode scripts/shop.mjs sagar exec ./src/access-control/bootstrap-existing-users.ts`}</Code>
              <p>
                The second command gives existing users the admin staff role. It works once per shop, for the first admin. Add later staff through invitations (merchant dashboard, Settings, or Owner &amp; access in this super admin).
              </p>
            </Step>
            <Step n={2} title="Emora staff (this super admin)">
              <Code>{`cd ${ROOT}\\apps\\platform-api\nnode scripts/medusa.mjs user -e you@example.com -p ChooseAPassword123\nnode scripts/medusa.mjs exec ./src/scripts/set-staff-role.ts you@example.com admin`}</Code>
              <p>
                Roles: <strong>admin</strong> can change everything; <strong>operator</strong> can view and run checks. At first sign-in everyone sets up two-factor sign-in with an authenticator app and saves recovery codes.
              </p>
            </Step>
          </Section>

          <Section id="start" title="7. Start everything (daily)" intro="Open one PowerShell window per item and leave it running. Start the database first, then the backends.">
            <Step n={1} title="Database">
              <p>See section 3.</p>
            </Step>
            <Step n={2} title="Sagar backend (port 9000)">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar develop`}</Code>
            </Step>
            <Step n={3} title="Anushq backend (port 9001)">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs anushq develop`}</Code>
            </Step>
            <Step n={4} title="Platform API (port 9100)">
              <Code>{`cd ${ROOT}\\apps\\platform-api\nnode scripts/medusa.mjs develop`}</Code>
            </Step>
            <Step n={5} title="Super admin (port 5175)">
              <Code>{`cd ${ROOT}\\apps\\platform-admin\nnode node_modules/vite/bin/vite.js`}</Code>
            </Step>
            <Step n={6} title="Storefronts (ports 3001 and 3002)">
              <p>
                Each needs a <C>.env.local</C> with <C>MEDUSA_BACKEND_URL</C>, <C>MEDUSA_PUBLISHABLE_KEY</C> and <C>STOREFRONT_SHARED_SECRET</C> (same value as in the shop's backend file). Build once after code changes, then start. The backend must be running while it builds.
              </p>
              <Code>{`cd C:\\Projects\\claude\\sagarsportz\nnpm run build\nnpx next start -p 3001`}</Code>
              <Code>{`cd C:\\Projects\\claude\\anushq\\apps\\web\nnpm run build\nnpx next start -p 3002`}</Code>
              <p>While editing code, use <C>npx next dev -p 3001</C> (or 3002) instead for live reload.</p>
            </Step>
            <Step n={7} title="Merchant dashboards (optional)">
              <Code>{`cd ${ROOT}\\apps\\client-dashboard\nnode node_modules/vite/bin/vite.js`}</Code>
              <p>That is Sagar on 5174. For Anushq on 5176:</p>
              <Code>{`cd ${ROOT}\\apps\\client-dashboard\n$env:DASHBOARD_BACKEND_URL = "http://localhost:9001"; $env:DASHBOARD_PORT = "5176"; node node_modules/vite/bin/vite.js`}</Code>
            </Step>
          </Section>

          <Section id="use" title="8. Use the super admin">
            <Step n={1} title="Sign in">
              <p>
                Email and password, then the 6-digit code from your authenticator app. Lost your phone? Choose "Use a recovery code" and enter one of your saved codes.
              </p>
            </Step>
            <Step n={2} title="Merchants">
              <p>
                The list shows each shop's storefront, connection status, hosting and when it was last checked. Use the filter pills (All, Needs attention, Setting up) and the search box. The <strong>⋯</strong> menu on a row opens the merchant, its storefront, or runs a check.
              </p>
            </Step>
            <Step n={3} title="Add a merchant">
              <p>
                Click <strong>Add merchant</strong> and enter the business name, owner email, storefront address, the shop backend address and hosting. The backend address must be listed in <C>ALLOWED_SHOP_ORIGINS</C> in <C>apps/platform-api/.env</C> (restart the Platform API after editing it).
              </p>
            </Step>
            <Step n={4} title="Connect it">
              <p>
                On the merchant's Overview, click <strong>Add shared secret</strong> and paste the <C>PLATFORM_SHARED_SECRET</C> from that shop's backend file. It is stored encrypted and can only be replaced, never shown again. The connection is then checked automatically, and again every 10 minutes. <strong>Recheck now</strong> runs it straight away.
              </p>
            </Step>
            <Step n={5} title="Read the figures">
              <p>
                "Last 30 days" shows orders, order value, payment collected, cash on delivery still to collect, custom orders awaiting review and open bulk enquiries. Only counts and totals come to the platform, never customer details.
              </p>
            </Step>
            <Step n={6} title="Switch features">
              <p>
                On the <strong>Features</strong> tab, turn product customisation, Complete the Look, bulk team orders, reviews, wishlist and the video spotlight on or off. The shop's backend applies it at once; storefronts update within about a minute. Only platform admins can change features.
              </p>
            </Step>
            <Step n={7} title="Invite the shop owner">
              <p>
                On <strong>Owner &amp; access</strong>, enter the owner's email and click <strong>Create invitation link</strong>. Copy the link and send it to them yourself; it is shown once and expires after a day. They open it, choose their password and sign in to their merchant dashboard. Emora never sees their password.
              </p>
            </Step>
            <Step n={8} title="Activity and Security">
              <p>
                <strong>Activity</strong> lists every change made on the platform (who and when; never secrets or links). <strong>Security</strong> shows your two-factor status and creates new recovery codes, which replace the old ones.
              </p>
            </Step>
          </Section>

          <Section id="new-shop" title="9. Add a new shop" intro="The full checklist, in order.">
            <Step n={1} title="Backend settings and database">
              <p>Section 4, steps 1 to 4, with a new shop name, port, database name and secrets. Add the new storefront and dashboard addresses to its CORS lines.</p>
            </Step>
            <Step n={2} title="Catalogue">
              <p>Section 5, or add products in Medusa Admin.</p>
            </Step>
            <Step n={3} title="First admin login">
              <p>Section 6, step 1.</p>
            </Step>
            <Step n={4} title="Allow the platform to reach it">
              <p>Add its backend address to <C>ALLOWED_SHOP_ORIGINS</C> in <C>apps/platform-api/.env</C> and restart the Platform API.</p>
            </Step>
            <Step n={5} title="Register and connect it here">
              <p>Section 8, steps 3 and 4. Check the status shows Connected.</p>
            </Step>
            <Step n={6} title="Storefront">
              <p>Fill its <C>.env.local</C> (publishable key, backend address, storefront shared secret), build and start it.</p>
            </Step>
            <Step n={7} title="Invite the owner">
              <p>Section 8, step 7.</p>
            </Step>
          </Section>

          <Section id="updates" title="10. After pulling new code" intro="Run these whenever someone else's changes come in.">
            <Step n={1} title="Packages">
              <Code>{`cd ${ROOT}\nbun install --frozen-lockfile`}</Code>
            </Step>
            <Step n={2} title="Database changes (safe to run any time)">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar db:migrate\nnode scripts/shop.mjs anushq db:migrate`}</Code>
              <Code>{`cd ${ROOT}\\apps\\platform-api\nnode scripts/medusa.mjs db:migrate`}</Code>
            </Step>
            <Step n={3} title="Restart">
              <p>Restart the backends, then rebuild and restart the storefronts.</p>
            </Step>
          </Section>

          <Section id="trouble" title="11. Troubleshooting">
            <Step n={1} title='"Port 9000 is already in use" or the wrong shop answers'>
              <p>Find what is using the port, check it, then stop it:</p>
              <Code>{`Get-NetTCPConnection -LocalPort 9000 -State Listen | Select-Object OwningProcess\nGet-CimInstance Win32_Process -Filter "ProcessId=<number>" | Format-List ParentProcessId, CommandLine`}</Code>
              <Code>{`Stop-Process -Id <parent number>, <number>`}</Code>
            </Step>
            <Step n={2} title="A site looks unstyled or buttons do nothing">
              <p>Hard-reload the page with <strong>Ctrl+Shift+R</strong>. If it persists, rebuild and restart that storefront.</p>
            </Step>
            <Step n={3} title='Medusa Admin shows "Tooltip must be used within TooltipProvider"'>
              <p>Run <C>bun install --frozen-lockfile</C> at the repo root, restart the shop backend and hard-reload the admin.</p>
            </Step>
            <Step n={4} title="A merchant shows Needs attention">
              <p>
                Open it and read the message under Connection. "Rejected the platform's signature" means the shared secret here differs from the shop's <C>PLATFORM_SHARED_SECRET</C>: paste it again. "Not on the allowed list" means the backend address is missing from <C>ALLOWED_SHOP_ORIGINS</C>. "Could not reach the shop" means its backend is not running.
              </p>
            </Step>
            <Step n={5} title="Someone lost their phone and recovery codes">
              <p>Turn their two-factor sign-in off; they set it up again at next sign-in:</p>
              <Code>{`cd ${ROOT}\\apps\\platform-api\nnode scripts/medusa.mjs exec ./src/scripts/reset-staff-2fa.ts person@example.com`}</Code>
            </Step>
            <Step n={6} title="A shop admin forgot their password">
              <p>Create a new invitation for them from Owner &amp; access, or reset it from Medusa Admin.</p>
            </Step>
            <Step n={7} title="The owner invitation fails">
              <p>That shop's backend file needs <C>MERCHANT_DASHBOARD_URL</C> set to its merchant dashboard address. Restart the backend after setting it.</p>
            </Step>
          </Section>

          <Section id="razorpay" title="12. Razorpay (later)" intro="Online payments are built but switched off until the shop's Razorpay account is ready.">
            <Step n={1} title="Add the test keys">
              <p>
                In the shop's backend file, set <C>RAZORPAY_KEY_ID</C>, <C>RAZORPAY_KEY_SECRET</C> and <C>RAZORPAY_WEBHOOK_SECRET</C> (test mode keys from the Razorpay dashboard). Point the Razorpay webhook at <C>&lt;backend address&gt;/hooks/payment/razorpay_razorpay</C>.
              </p>
            </Step>
            <Step n={2} title="Restart the backend and offer Razorpay in India">
              <Code>{`cd ${ROOT}\\apps\\backend\nnode scripts/shop.mjs sagar exec ./src/scripts/enable-razorpay.ts`}</Code>
            </Step>
          </Section>
        </div>
      </div>
    </div>
  )
}
