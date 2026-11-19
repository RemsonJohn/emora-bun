import { Fragment } from "react"
import { Card } from "@/components/ui"
import { C, Code, Section, Step } from "@/components/guide-parts"

/**
 * Production on one Hostinger KVM 2 (Ubuntu 24.04): every shop backend, every
 * storefront, the platform API, the super admin and the merchant dashboards,
 * run as systemd services behind Nginx with Let's Encrypt HTTPS.
 * Addresses below are the agreed subdomain pattern; change them if yours differ.
 */

const APP = "/opt/emora"
const SAGAR = { key: "sagar", api: "api.sagarsportz.com", dash: "dashboard.sagarsportz.com", site: "sagarsportz.com", apiPort: 9000, sitePort: 3001, redisDb: 0 }
const ANUSHQ = { key: "anushq", api: "api.anushq.in", dash: "dashboard.anushq.in", site: "anushq.in", apiPort: 9001, sitePort: 3002, redisDb: 1 }
const ADMIN = "admin.emovate.in"

const SECTIONS = [
  ["vps-plan", "1. What runs where"],
  ["vps-before", "2. Before you start"],
  ["vps-server", "3. Prepare the server"],
  ["vps-software", "4. Install the software"],
  ["vps-code", "5. Get the code"],
  ["vps-db", "6. Databases"],
  ["vps-env", "7. Settings files"],
  ["vps-build", "8. Build"],
  ["vps-migrate", "9. Migrate and load data"],
  ["vps-services", "10. Run as services"],
  ["vps-nginx", "11. Nginx and HTTPS"],
  ["vps-platform", "12. Connect the platform"],
  ["vps-update", "13. Deploy updates"],
  ["vps-new-shop", "14. Add a shop"],
  ["vps-backup", "15. Backups"],
  ["vps-ops", "16. Logs and troubleshooting"],
  ["vps-golive", "17. Before go-live"],
] as const

const shopEnv = (s: typeof SAGAR, name: string) => `NODE_ENV=production
DATABASE_URL=postgres://emora:<db password>@127.0.0.1:5432/emora_${s.key}
PORT=${s.apiPort}
REDIS_URL=redis://127.0.0.1:6379/${s.redisDb}
STORE_CORS=https://${s.site},https://www.${s.site}
ADMIN_CORS=https://${s.api},https://${s.dash}
AUTH_CORS=https://${s.api},https://${s.dash},https://${s.site},https://www.${s.site}
JWT_SECRET=<random>
COOKIE_SECRET=<random>
STOREFRONT_SHARED_SECRET=<random>
PLATFORM_SHARED_SECRET=<random>
MERCHANT_DASHBOARD_URL=https://${s.dash}
EMORA_SHOP=${s.key}
EMORA_SHOP_NAME="${name}"
EMORA_WAREHOUSE_CITY="<city>"
EMORA_WAREHOUSE_PROVINCE="Kerala"
EMORA_WAREHOUSE_POSTAL_CODE=<pincode>
EMORA_WAREHOUSE_ADDRESS="<address>"
EMORA_SHIPPING_FLAT_INR=<charge>
EMORA_SHIPPING_FREE_ABOVE_INR=<threshold>
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=`

export function VpsGuide() {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="VPS guide contents" className="lg:sticky lg:top-8 lg:self-start">
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
        <section id="vps-plan" className="scroll-mt-6">
          <Card title="1. What runs where">
            <p className="mb-3 text-muted">
              One Hostinger KVM 2 (2 vCPU, 8 GB RAM, Ubuntu 24.04) runs everything. Each shop has its own backend, database and storefront. Only Nginx is reachable from the internet; every app listens on 127.0.0.1.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="text-[12px] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 font-medium">Address</th>
                    <th className="py-2 pr-3 font-medium">What</th>
                    <th className="py-2 pr-3 font-medium">Service</th>
                    <th className="py-2 font-medium">Internal port</th>
                  </tr>
                </thead>
                <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_tr]:border-b [&_tr]:border-line">
                  {[SAGAR, ANUSHQ].map((s) => (
                    <Fragment key={s.key}>
                      <tr key={`${s.key}-site`}><td>https://{s.site}</td><td>{s.key === "sagar" ? "Sagar" : "Anushq"} storefront</td><td>emora-storefront-{s.key}</td><td>{s.sitePort}</td></tr>
                      <tr key={`${s.key}-api`}><td>https://{s.api}</td><td>Shop backend + Medusa Admin (/app)</td><td>emora-shop@{s.key}</td><td>{s.apiPort}</td></tr>
                      <tr key={`${s.key}-dash`}><td>https://{s.dash}</td><td>Merchant dashboard</td><td>Nginx (static files)</td><td>uses {s.apiPort}</td></tr>
                    </Fragment>
                  ))}
                  <tr><td>https://{ADMIN}</td><td>Super admin</td><td>Nginx (static) + emora-platform</td><td>9100</td></tr>
                  <tr><td>(internal)</td><td>PostgreSQL, Redis</td><td>postgresql, redis-server</td><td>5432, 6379</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              Capacity estimate for KVM 2 with storefronts on the server: about 4 to 6 shops. Watch memory (section 16) and upgrade or move storefronts to Vercel/Netlify before it runs low.
            </p>
          </Card>
        </section>

        <Section id="vps-before" title="2. Before you start">
          <Step n={1} title="Have these ready">
            <p>
              The VPS (Ubuntu 24.04) and its IP address; access to the DNS of <C>sagarsportz.com</C>, <C>anushq.in</C> and <C>{ADMIN.split(".").slice(1).join(".")}</C>; read access to the three GitHub repositories; an email address for Let's Encrypt.
            </p>
          </Step>
          <Step n={2} title="Create the DNS records (A records to the VPS IP)">
            <Code>{`${SAGAR.api}\n${SAGAR.dash}\n${ANUSHQ.api}\n${ANUSHQ.dash}\n${ADMIN}`}</Code>
            <p>
              Point <C>{SAGAR.site}</C>, <C>www.{SAGAR.site}</C>, <C>{ANUSHQ.site}</C> and <C>www.{ANUSHQ.site}</C> at the VPS only at cut-over (section 17), so the live Vercel/Netlify sites keep working until the new ones are tested.
            </p>
          </Step>
        </Section>

        <Section id="vps-server" title="3. Prepare the server" intro="Run as root (or with sudo) over SSH.">
          <Step n={1} title="Update and set the time zone">
            <Code>{`apt update && apt -y upgrade\ntimedatectl set-timezone Asia/Kolkata`}</Code>
          </Step>
          <Step n={2} title="Create an admin user and an app user">
            <Code>{`adduser deploy && usermod -aG sudo deploy\nadduser --system --group --home ${APP} emora`}</Code>
            <p>Log in as <C>deploy</C> with an SSH key from now on. The apps run as <C>emora</C>, which cannot log in.</p>
          </Step>
          <Step n={3} title="Lock down SSH (after your key login works)">
            <Code>{`sudo sed -i 's/^#\\?PasswordAuthentication .*/PasswordAuthentication no/; s/^#\\?PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config\nsudo systemctl restart ssh`}</Code>
          </Step>
          <Step n={4} title="Firewall: only SSH, HTTP and HTTPS">
            <Code>{`sudo apt -y install ufw fail2ban\nsudo ufw allow OpenSSH\nsudo ufw allow 'Nginx Full'\nsudo ufw enable`}</Code>
            <p>(The 'Nginx Full' rule exists after Nginx is installed in the next section; run that line again then if it fails now.)</p>
          </Step>
          <Step n={5} title="Swap space (builds need extra memory)">
            <Code>{`sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile\nsudo mkswap /swapfile && sudo swapon /swapfile\necho '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`}</Code>
          </Step>
        </Section>

        <Section id="vps-software" title="4. Install the software">
          <Step n={1} title="Node.js 22 and Git">
            <Code>{`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -\nsudo apt -y install nodejs git build-essential\nnode -v   # must be 22.23 or newer`}</Code>
          </Step>
          <Step n={2} title="Bun 1.4.4 (for the emora-bun repository)">
            <Code>{`curl -fsSL https://bun.sh/install | sudo env BUN_INSTALL=/usr/local bash -s "bun-v1.4.4"\nbun --version`}</Code>
          </Step>
          <Step n={3} title="PostgreSQL 18">
            <Code>{`sudo apt -y install postgresql-common\nsudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y\nsudo apt -y install postgresql-18`}</Code>
            <p>It listens on 127.0.0.1 only by default. Keep it that way.</p>
          </Step>
          <Step n={4} title="Redis">
            <Code>{`sudo apt -y install redis-server\nsudo systemctl enable --now redis-server`}</Code>
          </Step>
          <Step n={5} title="Nginx and Certbot">
            <Code>{`sudo apt -y install nginx certbot python3-certbot-nginx\nsudo systemctl enable --now nginx`}</Code>
          </Step>
        </Section>

        <Section id="vps-code" title="5. Get the code" intro="The repositories are private: add a read-only deploy key on GitHub for each (repository Settings, Deploy keys).">
          <Step n={1} title="Create a key for the emora user">
            <Code>{`sudo -u emora ssh-keygen -t ed25519 -N "" -f ${APP}/.ssh/id_ed25519\nsudo cat ${APP}/.ssh/id_ed25519.pub`}</Code>
            <p>Add that public key as a deploy key (read access) to the three repositories.</p>
          </Step>
          <Step n={2} title="Clone the agreed branches">
            <Code>{`cd ${APP}\nsudo -u emora git clone -b feat/platform-guide git@github.com:RemsonJohn/emora-bun.git\nsudo -u emora git clone -b feat/storefront-polish git@github.com:beingmaneesh/sagarsportz.git\nsudo -u emora git clone -b feat/storefront-polish git@github.com:beingmaneesh/anushq.git`}</Code>
            <p>After the pull requests are merged, use <C>main</C> instead of these branch names.</p>
          </Step>
          <Step n={3} title="Install packages">
            <Code>{`cd ${APP}/emora-bun && sudo -u emora bun install --frozen-lockfile\ncd ${APP}/sagarsportz && sudo -u emora npm ci\ncd ${APP}/anushq && sudo -u emora npm ci`}</Code>
          </Step>
        </Section>

        <Section id="vps-db" title="6. Databases" intro="One PostgreSQL server, one database per shop plus one for the platform.">
          <Step n={1} title="Create a database user and the databases">
            <Code>{`sudo -u postgres createuser --pwprompt emora\nsudo -u postgres createdb -O emora emora_sagar\nsudo -u postgres createdb -O emora emora_anushq\nsudo -u postgres createdb -O emora emora_platform`}</Code>
            <p>Use a long random password and keep it for the settings files.</p>
          </Step>
        </Section>

        <Section id="vps-env" title="7. Settings files" intro="Secrets live in /etc/emora, readable only by the app user. Never commit them.">
          <Step n={1} title="Make random secrets (one per <random>)">
            <Code>{`openssl rand -hex 48`}</Code>
            <p>
              <C>PLATFORM_SECRETS_KEY</C> must be exactly 64 hex characters: <C>openssl rand -hex 32</C>.
            </p>
          </Step>
          <Step n={2} title="Create the folder">
            <Code>{`sudo mkdir -p /etc/emora && sudo chown root:emora /etc/emora && sudo chmod 750 /etc/emora`}</Code>
          </Step>
          <Step n={3} title="Sagar backend: /etc/emora/sagar.env">
            <Code>{shopEnv(SAGAR, "Sagar Sportz")}</Code>
          </Step>
          <Step n={4} title="Anushq backend: /etc/emora/anushq.env">
            <Code>{shopEnv(ANUSHQ, "Anushq by Dhaksha")}</Code>
          </Step>
          <Step n={5} title="Platform API: /etc/emora/platform.env">
            <Code>{`NODE_ENV=production
DATABASE_URL=postgres://emora:<db password>@127.0.0.1:5432/emora_platform
PORT=9100
REDIS_URL=redis://127.0.0.1:6379/9
ADMIN_CORS=https://${ADMIN}
AUTH_CORS=https://${ADMIN}
JWT_SECRET=<random>
COOKIE_SECRET=<random>
AUTH_MFA_ENCRYPTION_KEY=<random>
PLATFORM_SECRETS_KEY=<64 hex characters>
ALLOWED_SHOP_ORIGINS=http://127.0.0.1:${SAGAR.apiPort},http://127.0.0.1:${ANUSHQ.apiPort}`}</Code>
          </Step>
          <Step n={6} title="Storefronts: .env.local in each storefront folder">
            <Code>{`# ${APP}/sagarsportz/.env.local
MEDUSA_BACKEND_URL=http://127.0.0.1:${SAGAR.apiPort}
MEDUSA_PUBLISHABLE_KEY=<from section 9>
STOREFRONT_SHARED_SECRET=<same as in sagar.env>`}</Code>
            <Code>{`# ${APP}/anushq/apps/web/.env.local
MEDUSA_BACKEND_URL=http://127.0.0.1:${ANUSHQ.apiPort}
MEDUSA_PUBLISHABLE_KEY=<from section 9>
STOREFRONT_SHARED_SECRET=<same as in anushq.env>`}</Code>
          </Step>
          <Step n={7} title="Lock the files down">
            <Code>{`sudo chown root:emora /etc/emora/*.env && sudo chmod 640 /etc/emora/*.env\nsudo chown emora:emora ${APP}/sagarsportz/.env.local ${APP}/anushq/apps/web/.env.local\nsudo chmod 600 ${APP}/sagarsportz/.env.local ${APP}/anushq/apps/web/.env.local`}</Code>
          </Step>
        </Section>

        <Section id="vps-build" title="8. Build" intro="One backend build serves every shop. Storefronts are built in section 9, after the backends have data.">
          <Step n={1} title="Shop backend">
            <Code>{`cd ${APP}/emora-bun/apps/backend\nsudo -u emora node ../../node_modules/@medusajs/cli/cli.js build\ncd .medusa/server && sudo -u emora npm install --omit=dev`}</Code>
          </Step>
          <Step n={2} title="Platform API">
            <Code>{`cd ${APP}/emora-bun/apps/platform-api\nsudo -u emora node ../../node_modules/@medusajs/cli/cli.js build\ncd .medusa/server && sudo -u emora npm install --omit=dev`}</Code>
          </Step>
          <Step n={3} title="Super admin and merchant dashboard (static files)">
            <Code>{`cd ${APP}/emora-bun/apps/platform-admin && sudo -u emora bun run build\ncd ${APP}/emora-bun/apps/client-dashboard && sudo -u emora bun run build`}</Code>
          </Step>
        </Section>

        <Section id="vps-migrate" title="9. Migrate and load data" intro="First time only (and after updates, see section 13). The first migration sets each shop up for India and prints its publishable key.">
          <Step n={1} title="Shop databases">
            <Code>{`cd ${APP}/emora-bun/apps/backend/.medusa/server\nsudo -u emora node --env-file=/etc/emora/sagar.env node_modules/@medusajs/cli/cli.js db:migrate\nsudo -u emora node --env-file=/etc/emora/anushq.env node_modules/@medusajs/cli/cli.js db:migrate`}</Code>
            <p>Copy each <strong>Publishable key: pk_…</strong> into that storefront's <C>.env.local</C>.</p>
          </Step>
          <Step n={2} title="Platform database">
            <Code>{`cd ${APP}/emora-bun/apps/platform-api/.medusa/server\nsudo -u emora node --env-file=/etc/emora/platform.env node_modules/@medusajs/cli/cli.js db:migrate`}</Code>
          </Step>
          <Step n={3} title="Catalogues">
            <Code>{`cd ${APP}/sagarsportz && sudo -u emora node scripts/export-catalogue.mjs\ncd ${APP}/anushq/apps/web && sudo -u emora node scripts/export-catalogue.mjs\ncd ${APP}/emora-bun/apps/backend\nsudo -u emora node --env-file=/etc/emora/sagar.env ../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/import-catalogue.ts ${APP}/sagarsportz/catalogue.json\nsudo -u emora node --env-file=/etc/emora/anushq.env ../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/import-catalogue.ts ${APP}/anushq/apps/web/catalogue.json`}</Code>
          </Step>
          <Step n={4} title="First shop admins">
            <Code>{`cd ${APP}/emora-bun/apps/backend\nsudo -u emora node --env-file=/etc/emora/sagar.env ../../node_modules/@medusajs/cli/cli.js user -e <owner email> -p <password>\nsudo -u emora node --env-file=/etc/emora/sagar.env ../../node_modules/@medusajs/cli/cli.js exec ./src/access-control/bootstrap-existing-users.ts`}</Code>
            <p>Repeat with <C>anushq.env</C>. Use letters and digits only in passwords typed on the command line. Later staff join by invitation.</p>
          </Step>
          <Step n={5} title="First Emora staff">
            <Code>{`cd ${APP}/emora-bun/apps/platform-api\nsudo -u emora node --env-file=/etc/emora/platform.env ../../node_modules/@medusajs/cli/cli.js user -e <your email> -p <password>\nsudo -u emora node --env-file=/etc/emora/platform.env ../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/set-staff-role.ts <your email> admin`}</Code>
          </Step>
          <Step n={6} title="Build the storefronts (needs the shop backends running: do section 10 first, then come back)">
            <Code>{`cd ${APP}/sagarsportz && sudo -u emora npm run build\ncd ${APP}/anushq/apps/web && sudo -u emora npm run build`}</Code>
          </Step>
        </Section>

        <Section id="vps-services" title="10. Run as services" intro="systemd starts every app at boot, restarts it if it crashes and caps its memory so one shop cannot starve the others.">
          <Step n={1} title="Shop backends: /etc/systemd/system/emora-shop@.service">
            <Code>{`[Unit]
Description=Emora shop backend (%i)
After=network.target postgresql.service redis-server.service

[Service]
User=emora
WorkingDirectory=${APP}/emora-bun/apps/backend/.medusa/server
EnvironmentFile=/etc/emora/%i.env
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/usr/bin/node node_modules/@medusajs/cli/cli.js start
Restart=always
RestartSec=5
MemoryMax=900M

[Install]
WantedBy=multi-user.target`}</Code>
          </Step>
          <Step n={2} title="Storefronts: one service file each">
            <p>/etc/systemd/system/emora-storefront-sagar.service</p>
            <Code>{`[Unit]
Description=Emora storefront (Sagar)
After=network.target emora-shop@sagar.service

[Service]
User=emora
WorkingDirectory=${APP}/sagarsportz
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${SAGAR.sitePort}
Restart=always
RestartSec=5
MemoryMax=450M

[Install]
WantedBy=multi-user.target`}</Code>
            <p>/etc/systemd/system/emora-storefront-anushq.service</p>
            <Code>{`[Unit]
Description=Emora storefront (Anushq)
After=network.target emora-shop@anushq.service

[Service]
User=emora
WorkingDirectory=${APP}/anushq/apps/web
ExecStart=/usr/bin/node ${APP}/anushq/node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${ANUSHQ.sitePort}
Restart=always
RestartSec=5
MemoryMax=450M

[Install]
WantedBy=multi-user.target`}</Code>
          </Step>
          <Step n={3} title="Platform API: /etc/systemd/system/emora-platform.service">
            <Code>{`[Unit]
Description=Emora platform API
After=network.target postgresql.service redis-server.service

[Service]
User=emora
WorkingDirectory=${APP}/emora-bun/apps/platform-api/.medusa/server
EnvironmentFile=/etc/emora/platform.env
ExecStart=/usr/bin/node node_modules/@medusajs/cli/cli.js start
Restart=always
RestartSec=5
MemoryMax=700M

[Install]
WantedBy=multi-user.target`}</Code>
          </Step>
          <Step n={4} title="Start them">
            <Code>{`sudo systemctl daemon-reload\nsudo systemctl enable --now emora-shop@sagar emora-shop@anushq emora-platform\n# after building the storefronts (section 9, step 6):\nsudo systemctl enable --now emora-storefront-sagar emora-storefront-anushq\nsystemctl status 'emora-*' --no-pager`}</Code>
          </Step>
        </Section>

        <Section id="vps-nginx" title="11. Nginx and HTTPS" intro="Nginx is the only public entry point. It sets the visitor's real IP (rate limits rely on it) and serves the static apps.">
          <Step n={1} title="Shared proxy settings: /etc/nginx/snippets/emora-proxy.conf">
            <Code>{`proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
# Overwrite (never append) so visitors cannot fake their IP.
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
client_max_body_size 20m;`}</Code>
          </Step>
          <Step n={2} title="Sites: /etc/nginx/sites-available/emora">
            <Code>{`# Shop backends (API + Medusa Admin at /app)
server { listen 80; server_name ${SAGAR.api};  location / { proxy_pass http://127.0.0.1:${SAGAR.apiPort};  include snippets/emora-proxy.conf; } }
server { listen 80; server_name ${ANUSHQ.api}; location / { proxy_pass http://127.0.0.1:${ANUSHQ.apiPort}; include snippets/emora-proxy.conf; } }

# Merchant dashboards: one static build, each proxying to its own shop
server {
  listen 80; server_name ${SAGAR.dash};
  root ${APP}/emora-bun/apps/client-dashboard/dist;
  location ~ ^/(admin|auth|static|uploads)/ { proxy_pass http://127.0.0.1:${SAGAR.apiPort}; include snippets/emora-proxy.conf; }
  location / { try_files $uri /index.html; }
}
server {
  listen 80; server_name ${ANUSHQ.dash};
  root ${APP}/emora-bun/apps/client-dashboard/dist;
  location ~ ^/(admin|auth|static|uploads)/ { proxy_pass http://127.0.0.1:${ANUSHQ.apiPort}; include snippets/emora-proxy.conf; }
  location / { try_files $uri /index.html; }
}

# Storefronts
server { listen 80; server_name ${SAGAR.site} www.${SAGAR.site};   location / { proxy_pass http://127.0.0.1:${SAGAR.sitePort};  include snippets/emora-proxy.conf; } }
server { listen 80; server_name ${ANUSHQ.site} www.${ANUSHQ.site}; location / { proxy_pass http://127.0.0.1:${ANUSHQ.sitePort}; include snippets/emora-proxy.conf; } }

# Super admin: static app + platform API on the same address (session cookie)
server {
  listen 80; server_name ${ADMIN};
  root ${APP}/emora-bun/apps/platform-admin/dist;
  location ~ ^/(admin|auth)/ { proxy_pass http://127.0.0.1:9100; include snippets/emora-proxy.conf; }
  location / { try_files $uri /index.html; }
}`}</Code>
          </Step>
          <Step n={3} title="Turn it on and check">
            <Code>{`sudo ln -s /etc/nginx/sites-available/emora /etc/nginx/sites-enabled/emora\nsudo rm -f /etc/nginx/sites-enabled/default\nsudo nginx -t && sudo systemctl reload nginx`}</Code>
          </Step>
          <Step n={4} title="HTTPS certificates (renew automatically)">
            <Code>{`sudo certbot --nginx -m <your email> --agree-tos --redirect -d ${SAGAR.api} -d ${SAGAR.dash} -d ${ANUSHQ.api} -d ${ANUSHQ.dash} -d ${ADMIN}`}</Code>
            <p>Run it again with <C>-d {SAGAR.site} -d www.{SAGAR.site}</C> (and the same for Anushq) at cut-over, once those domains point here.</p>
          </Step>
        </Section>

        <Section id="vps-platform" title="12. Connect the platform">
          <Step n={1} title="Sign in to the super admin">
            <p>Open <C>https://{ADMIN}</C>, sign in and set up two-factor sign-in. Save the recovery codes.</p>
          </Step>
          <Step n={2} title="Add each merchant">
            <p>
              Add merchant, with the backend address <C>http://127.0.0.1:{SAGAR.apiPort}</C> (Sagar) or <C>http://127.0.0.1:{ANUSHQ.apiPort}</C> (Anushq): the platform calls shops inside the server. Dashboard address: <C>https://{SAGAR.dash}</C> / <C>https://{ANUSHQ.dash}</C>.
            </p>
          </Step>
          <Step n={3} title="Add the shared secret">
            <p>Paste each shop's <C>PLATFORM_SHARED_SECRET</C> under Connection. The status turns Connected and the 30-day figures appear.</p>
          </Step>
        </Section>

        <Section id="vps-update" title="13. Deploy updates" intro="Run as deploy, in this order. Back up first (section 15).">
          <Step n={1} title="Platform and backends">
            <Code>{`cd ${APP}/emora-bun && sudo -u emora git pull && sudo -u emora bun install --frozen-lockfile
cd apps/backend && sudo -u emora node ../../node_modules/@medusajs/cli/cli.js build && (cd .medusa/server && sudo -u emora npm install --omit=dev)
cd .medusa/server
sudo -u emora node --env-file=/etc/emora/sagar.env node_modules/@medusajs/cli/cli.js db:migrate
sudo -u emora node --env-file=/etc/emora/anushq.env node_modules/@medusajs/cli/cli.js db:migrate
cd ${APP}/emora-bun/apps/platform-api && sudo -u emora node ../../node_modules/@medusajs/cli/cli.js build && (cd .medusa/server && sudo -u emora npm install --omit=dev)
(cd .medusa/server && sudo -u emora node --env-file=/etc/emora/platform.env node_modules/@medusajs/cli/cli.js db:migrate)
cd ${APP}/emora-bun/apps/platform-admin && sudo -u emora bun run build
cd ${APP}/emora-bun/apps/client-dashboard && sudo -u emora bun run build
sudo systemctl restart emora-shop@sagar emora-shop@anushq emora-platform`}</Code>
          </Step>
          <Step n={2} title="Storefronts (after the backends are back up)">
            <Code>{`cd ${APP}/sagarsportz && sudo -u emora git pull && sudo -u emora npm ci && sudo -u emora npm run build && sudo systemctl restart emora-storefront-sagar
cd ${APP}/anushq && sudo -u emora git pull && sudo -u emora npm ci && (cd apps/web && sudo -u emora npm run build) && sudo systemctl restart emora-storefront-anushq`}</Code>
            <p>A storefront build uses a lot of memory for a minute or two. Deploy outside busy hours, one storefront at a time.</p>
          </Step>
        </Section>

        <Section id="vps-new-shop" title="14. Add a shop">
          <Step n={1} title="Pick its ports and Redis number">
            <p>Next free backend port (9002…), storefront port (3003…) and Redis database number (2…).</p>
          </Step>
          <Step n={2} title="Database, settings, migration, catalogue, first admin">
            <p>Sections 6, 7, 9 with the new shop's name (<C>/etc/emora/&lt;shop&gt;.env</C>).</p>
          </Step>
          <Step n={3} title="Services, Nginx, certificates">
            <Code>{`sudo systemctl enable --now emora-shop@<shop>\n# storefront: clone it, add .env.local, build, copy a storefront service file
sudo systemctl enable --now emora-storefront-<shop>`}</Code>
            <p>Add its three Nginx server blocks (API, dashboard, storefront) and run Certbot for the new names.</p>
          </Step>
          <Step n={4} title="Platform">
            <p>Add <C>http://127.0.0.1:&lt;port&gt;</C> to <C>ALLOWED_SHOP_ORIGINS</C> in <C>/etc/emora/platform.env</C>, <C>sudo systemctl restart emora-platform</C>, then add the merchant and its secret in the super admin.</p>
          </Step>
        </Section>

        <Section id="vps-backup" title="15. Backups" intro="One server holds every shop, so backups are essential. Copy them off the server: the destination is still to be decided (for example Cloudflare R2 or Backblaze B2).">
          <Step n={1} title="Nightly database dumps: /usr/local/bin/emora-backup">
            <Code>{`#!/bin/sh
set -e
DIR=/var/backups/emora/$(date +%F)
mkdir -p "$DIR"
for db in emora_sagar emora_anushq emora_platform; do
  sudo -u postgres pg_dump -Fc "$db" > "$DIR/$db.dump"
done
cp -a /etc/emora "$DIR/settings"
find /var/backups/emora -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +`}</Code>
            <Code>{`sudo chmod 700 /usr/local/bin/emora-backup\necho '30 2 * * * root /usr/local/bin/emora-backup' | sudo tee /etc/cron.d/emora-backup`}</Code>
            <p>The settings copy contains secrets: keep the backup folder and its off-server copy private.</p>
          </Step>
          <Step n={2} title="Restore one database (test this before go-live)">
            <Code>{`sudo systemctl stop emora-shop@sagar\nsudo -u postgres pg_restore --clean --if-exists -d emora_sagar /var/backups/emora/<date>/emora_sagar.dump\nsudo systemctl start emora-shop@sagar`}</Code>
          </Step>
        </Section>

        <Section id="vps-ops" title="16. Logs and troubleshooting">
          <Step n={1} title="Status and logs">
            <Code>{`systemctl status 'emora-*' --no-pager\nsudo journalctl -u emora-shop@sagar -f\nsudo journalctl -u emora-storefront-anushq --since "1 hour ago"\nsudo tail -f /var/log/nginx/error.log`}</Code>
          </Step>
          <Step n={2} title="Memory and disk">
            <Code>{`free -h\nsystemctl status emora-shop@sagar | grep Memory\ndf -h /`}</Code>
            <p>If free memory stays under about 1 GB, stop adding shops and plan an upgrade.</p>
          </Step>
          <Step n={3} title="A merchant shows Needs attention in the super admin">
            <p>
              "Could not reach the shop": its <C>emora-shop@…</C> service is down. "Rejected the signature": the secret here differs from the shop's <C>PLATFORM_SHARED_SECRET</C>. "Not on the allowed list": add it to <C>ALLOWED_SHOP_ORIGINS</C>.
            </p>
          </Step>
          <Step n={4} title="502 Bad Gateway">
            <p>The app behind that address is not running. Check its service status and log.</p>
          </Step>
          <Step n={5} title="A staff member lost their phone and recovery codes">
            <Code>{`cd ${APP}/emora-bun/apps/platform-api\nsudo -u emora node --env-file=/etc/emora/platform.env ../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/reset-staff-2fa.ts person@example.com`}</Code>
          </Step>
        </Section>

        <Section id="vps-golive" title="17. Before go-live" intro="Open items to settle before customers use the VPS.">
          <Step n={1} title="Product image storage">
            <p>
              Images uploaded in Medusa Admin are stored next to the build and would be lost on the next build. Configure file storage per shop (the plan names Cloudflare R2) before merchants upload photos.
            </p>
          </Step>
          <Step n={2} title="Off-server backups and a restore test">
            <p>Choose the backup destination, copy the nightly folder there and restore once into a test database.</p>
          </Step>
          <Step n={3} title="Monitoring">
            <p>Uptime alerts and error tracking are still to be chosen. At minimum, an external uptime check on each public address.</p>
          </Step>
          <Step n={4} title="Email, captcha, Razorpay">
            <p>Email sending (owner invitations, order emails), the captcha provider and live Razorpay keys are still open decisions.</p>
          </Step>
          <Step n={5} title="Cut-over of the storefront domains">
            <p>
              Test each storefront on the VPS first (for example via a temporary hosts-file entry), then point <C>{SAGAR.site}</C> / <C>{ANUSHQ.site}</C> and their <C>www</C> names at the VPS, run Certbot for them, and keep Vercel/Netlify available for a quick switch back.
            </p>
          </Step>
        </Section>
      </div>
    </div>
  )
}
