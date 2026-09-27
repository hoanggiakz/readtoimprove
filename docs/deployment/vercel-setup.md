# Vercel & Production Infrastructure Setup Runbook

**Project:** ReadToImprove  
**Phase:** 12 — Deployment & Production Verification  
**Target Environment:** Production (Vercel + Neon + Upstash)  

---

## 1. Neon Serverless PostgreSQL Provisioning

1. Log in to [Neon Console](https://console.neon.tech/).
2. Create a new project:
   - **Project Name:** `readtoimprove`
   - **Database Name:** `neondb`
   - **Region:** `Asia Pacific (Singapore) - ap-southeast-1`
   - **Postgres Version:** 16
3. Navigate to **Connection Details**:
   - Select **Pooled connection**: Copy the connection string. This is your `DATABASE_URL`.
     - Ensure `?sslmode=require&pgbouncer=true` is appended.
   - Select **Direct connection**: Copy the connection string. This is your `DIRECT_URL`.
     - Ensure `?sslmode=require` is appended.
4. Save both strings securely in your password manager.

---

## 2. Upstash Redis Production Provisioning

1. Log in to [Upstash Console](https://console.upstash.com/).
2. Create a new Redis database:
   - **Name:** `readtoimprove-redis`
   - **Region:** `AP-SOUTHEAST-1 (Singapore)`
   - **Type:** Serverless / Regional
   - **Eviction:** Enabled (volatile-lru or allkeys-lru)
3. Navigate to the **REST API** section of your database page:
   - Copy `UPSTASH_REDIS_REST_URL`.
   - Copy `UPSTASH_REDIS_REST_TOKEN`.

---

## 3. Cryptographic Secrets Generation

Run the following commands locally to generate high-entropy production secrets:

```bash
# Generate 256-bit AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CRON_SECRET:
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

---

## 4. Vercel Project Linking & Environment Variables

### Option A: Using Vercel Dashboard (Recommended)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New... -> Project**.
2. Select your `readtoimprove` GitHub repository.
3. Configure Project Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `next build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm ci`
4. Expand **Environment Variables** and add the following keys for **Production** and **Preview**:

| Variable Name | Environment | Value Description |
|---|:---:|---|
| `DATABASE_URL` | Production, Preview | Neon pooled connection string |
| `DIRECT_URL` | Production, Preview | Neon direct connection string |
| `AUTH_SECRET` | Production, Preview | 256-bit random hex string |
| `AUTH_URL` | Production | Canonical production URL (e.g. `https://readtoimprove.com`) |
| `NEXT_PUBLIC_APP_URL` | Production | Canonical production URL |
| `ADMIN_EMAIL` | Production | Production administrator email |
| `ADMIN_INITIAL_PASSWORD` | Production | Strong password ($\ge 16$ characters) |
| `ADMIN_ROUTE_PATH` | Production | Stealth admin route (e.g. `/secure-console-x7`) |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN`| Production, Preview | Upstash REST Token |
| `CRON_SECRET` | Production | Vercel Cron bearer token |

5. Click **Deploy**.

---

## 5. Applying Database Migrations to Neon

Once credentials are set, apply all initial Prisma migrations to Neon using the unpooled `DIRECT_URL`:

```bash
# Using direct connection string
DATABASE_URL="<NEON_DIRECT_URL>" npx prisma migrate deploy
```

Verify that all 4 migrations succeed:
- `20260911131715_init_schema`
- `20260913130000_add_trigram_search`
- `20260914140000_add_article_full_text_search`
- `20260922000000_add_user_history_and_goals`

---

## 6. (Optional) Seeding Initial Educational Content

To populate the 3 initial bilingual articles, 5 categories, and 18 vocabulary words:

```bash
DATABASE_URL="<NEON_DIRECT_URL>" npx prisma db seed
```
