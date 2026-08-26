# Stabo Air — Air Waybill Tracker

Full-stack application for tracking air waybills (AWBs).

- **Backend** (`api/`) — Flask + PostgreSQL (SQLAlchemy, JWT auth), runs via Docker Compose
- **Frontend** (`client/`) — React (Vite), runs in its own Docker dev container with hot reload

The two stacks are **independent Docker Compose projects** — start and stop them separately.

```
AWB/
├── api/                    # Flask API (own compose stack)
│   ├── app/
│   │   ├── __init__.py     # app factory, blueprint registration
│   │   ├── config.py       # reads DB + JWT config from environment
│   │   ├── models.py       # User, AirWayBill (SQLAlchemy)
│   │   ├── middleware.py   # @token_required (JWT, x-access-token header)
│   │   ├── seed.py         # dev users (runs automatically on empty DB)
│   │   └── routes/         # auth.py, protected.py
│   ├── Dockerfile
│   ├── docker-compose.yml  # db + web + pgadmin
│   └── .env                # secrets — NOT committed (create your own, see below)
├── client/                 # React app (own compose stack)
│   ├── src/
│   │   ├── api.js          # fetch helper (token header, error handling)
│   │   ├── App.jsx         # auth state, login/logout handlers
│   │   ├── Login.jsx       # login form
│   │   └── Dashboard.jsx   # protected content demo
│   ├── Dockerfile.dev      # node:22-alpine running the Vite dev server
│   ├── docker-compose.yml  # dev container with live source mount
│   └── vite.config.js      # /api proxy + host + polling
├── .gitignore
└── README.md
```

## Prerequisites

| Tool | Needed for | Notes |
|---|---|---|
| Docker Desktop | Everything | WSL2 backend recommended. Both stacks run entirely in containers. |
| Git | Cloning | |
| Node.js (LTS) | Optional | Only for editor IntelliSense (`npm install` on host) and occasional host-side commands. Not required to run the app. |

> **Windows + PowerShell note:** if `npm` fails with *"running scripts is disabled on this system"*, run
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` once, or use Git Bash instead.

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/jake1808/Srabo-Air.git
cd AWB
```

### 2. Create the API environment file

Docker Compose reads secrets from `api/.env` (this file is gitignored — never commit it).
Copy the template below into `api/.env` and fill in your own values:

```env
# PostgreSQL container
POSTGRES_USER=myuser
POSTGRES_PASSWORD=<choose-a-password>
POSTGRES_DB=mydatabase

# Flask app (DB_HOST is the compose service name, NOT localhost)
DB_USER=myuser
DB_PASSWORD=<same-as-POSTGRES_PASSWORD>
DB_NAME=mydatabase
DB_HOST=db
DB_PORT=5432

# JWT signing secret (generate something long and random)
SECRET_KEY=<long-random-string>

# pgAdmin web UI
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=<choose-a-password>
```

`DB_USER/PASSWORD/NAME` must match `POSTGRES_USER/PASSWORD/DB` — the first three create
the database, the second three tell Flask how to connect to it.

### 3. Start the API stack

```bash
cd api
docker compose up
```

This starts three services:

| Service | Container | URL / port | Purpose |
|---|---|---|---|
| `db` | stabo-db | localhost:5432 | PostgreSQL 15, data persisted in the `postgres_data` volume |
| `web` | stabo-api | localhost:5000 | Flask API |
| `pgadmin` | — | localhost:5050 | Database web UI (log in with the `PGADMIN_*` values) |

On startup the API creates its tables automatically and, if the users table is empty,
seeds two development users:

| Email | Password | Role |
|---|---|---|
| admin@example.com | 123456 | admin |
| clerk@example.com | 123456 | clerk |

### 4. Start the client dev container

```bash
cd ../client
docker compose up --build
```

The first build installs dependencies inside the image; later starts are fast.
Open **http://localhost:5173** and log in with one of the seeded users.

## How the two stacks communicate

```
Browser (localhost:5173)
   │  fetch('/api/login')          ← same origin, so no CORS is possible
   ▼
Vite dev server (in stabo-client-dev)
   │  proxy: /api/* → http://host.docker.internal:5000/*
   │  (the /api prefix is stripped before forwarding)
   ▼
Flask API (stabo-api, port 5000)
   ▼
PostgreSQL (stabo-db)
```

- The browser **only ever talks to Vite**. All API calls use relative paths that start
  with `/api` — e.g. `api('/api/login')` from `src/api.js`.
- The proxy target is `host.docker.internal` because the client and API are separate
  compose projects on separate Docker networks — service names like `web` don't resolve
  across them, but the API publishes port 5000 to the host.
- **Do not set `VITE_API_URL`** and do not call `http://localhost:5000` from the
  frontend. Both bypass the proxy, make the request cross-origin, and fail with a CORS
  error (`Failed to fetch`) even though the API itself returns 200.

## Authentication quick reference

- `POST /api/register` — `{ name, email, password, role }` → creates a user
- `POST /api/login` — `{ email, password }` → `{ token, user }` (JWT, expires after 30 minutes)
- Protected routes require the JWT in a custom header: `x-access-token: <token>`
- Logout is client-side: delete the token from `localStorage` (JWTs are stateless)

## Day-to-day development

- **Editing files in `client/src`** — hot reloads automatically (the folder is
  bind-mounted into the container; polling is enabled for Windows file watching).
- **Changing dependencies (`package.json`)** — rebuild: `docker compose up --build` in `client/`.
  `node_modules` lives only inside the container, so host installs are just for editor tooling.
- **Changing `vite.config.js` or env files** — restart: `docker compose restart` in `client/`.
  Vite reads both once at startup; edits have no effect until restart.
- **Resetting the database** — `docker compose down -v` in `api/` removes the data volume;
  the next `up` re-creates and re-seeds it.

## Troubleshooting

**Login fails with "Failed to fetch" / CORS error, but the API log shows 200.**
The browser called `localhost:5000` directly instead of going through the proxy. Two usual
causes: a `client/.env` containing `VITE_API_URL=http://localhost:5000` (delete it — env
variables override the empty fallback in `src/api.js`), or an API call missing the `/api`
prefix. After fixing, restart the client container and hard-refresh (Ctrl+Shift+R).

**Edits to `.env` or `vite.config.js` seem to do nothing.**
Vite bakes them in at startup — `docker compose restart` in `client/`.

**Hot reload is slow or misses file changes.**
The project lives in an OneDrive-synced folder, which sits between Docker's file sharing
and the editor. Polling is already enabled in `vite.config.js`; if problems persist,
move the project outside OneDrive (e.g. `C:\dev\AWB`).

**`npm` blocked by PowerShell execution policy.**
See the note under Prerequisites.

**API returns 401 "Token has expired".**
JWTs expire after 30 minutes — log in again.

## Production deployment (VPS — awb.stabo.com)

The production stack is three containers started from one compose file:
**nginx** serving the built React app (`client/`), **gunicorn/Flask** (`api/`), and
**PostgreSQL** — plus the VPS's own nginx with a Let's Encrypt certificate in front
for HTTPS. Only the client container is published (port 8080); the API and database
are reachable only inside the Docker network.

### 1. Point the domain at the VPS

In your DNS panel, add an **A record**: `awb.stabo.com` → your VPS IP address.
Wait for it to resolve (`nslookup awb.stabo.com` shows the VPS IP) before issuing
the certificate in step 6.

### 2. Prepare the VPS (Ubuntu example)

```bash
ssh root@<VPS-IP>
apt update && apt upgrade -y

# Docker Engine + compose plugin (official script)
curl -fsSL https://get.docker.com | sh

# basic firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 3. Get the code and configure secrets

```bash
cd /opt
git clone https://github.com/jake1808/Srabo-Air.git awb
cd awb

cp .env.production.example .env.production
nano .env.production   # set strong POSTGRES_PASSWORD + SECRET_KEY
```

Generate the JWT secret with:
`python3 -c "import secrets; print(secrets.token_hex(32))"` (or any long random string).

### 4. Start the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Check it: `docker compose -f docker-compose.prod.yml ps` — all three containers
should be `Up`. The app is now reachable on `http://<VPS-IP>:8080`.

> On first start the database is created and seeded with the default users
> (`admin@example.com` / `123456`) and sample waybills. **Sign in immediately and
> change the admin password** (Admin panel → Change password), then delete the
> sample data you don't want.

### 5. Host nginx as HTTPS front

```bash
apt install -y nginx
```

Create `/etc/nginx/sites-available/awb.stabo.com`:

```nginx
server {
    listen 80;
    server_name awb.stabo.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20m;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/awb.stabo.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. HTTPS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d awb.stabo.com
```

Certbot rewrites the site to HTTPS and sets up automatic renewal. Done —
**https://awb.stabo.com** is live.

### 7. Day-2 operations

**Deploy an update** (after pushing to GitHub):

```bash
cd /opt/awb
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

**Logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

**Database backup:**

```bash
docker exec stabo-prod-db pg_dump -U <POSTGRES_USER> <POSTGRES_DB> > backup_$(date +%F).sql
```

**Restore into a fresh stack:**

```bash
cat backup_2026-08-24.sql | docker exec -i stabo-prod-db psql -U <POSTGRES_USER> <POSTGRES_DB>
```

**Note on uploaded PDFs:** they are stored inside the database (base64), so
`pg_dump` backups include them. The database volume is `prod_postgres_data` —
do not delete it.

### Production vs development

| | Development | Production |
|---|---|---|
| Compose file | `api/docker-compose.yml` + `client/docker-compose.yml` | `docker-compose.prod.yml` |
| Frontend | Vite dev server, hot reload (`Dockerfile.dev`) | nginx serving the built bundle (`client/Dockerfile`) |
| API server | same image | gunicorn, 4 workers |
| Database | port 5432 published, pgAdmin available | internal only, no pgAdmin |
| TLS | none | VPS nginx + Let's Encrypt |

