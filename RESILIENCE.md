# AgentGate Resilience & Disaster Recovery Plan

_Budget-conscious. No $80/mo overkill. Just smart practices that let us recover fast._

## Architecture Overview

```
Users → agentgate.online (A record)
         ↓
  DO Droplet 134.199.224.98 ($6/mo)
  ├── Nginx (static files + reverse proxy)
  ├── Landing page: /var/www/agentgate.online
  ├── api.agentgate.online → Railway (marketplace-api)
  └── fulfill.agentgate.online → Railway (fulfillment-api)

Railway (free/starter tier)
  ├── agentgate (marketplace-api, Hono)
  ├── fulfillment-api (Hono, Anthropic-powered)
  └── facilitator (Express, x402 payments)

Supabase (free tier)
  └── Postgres (sellers, endpoints, transactions, endpoint_health)
```

## What Can Break & How We Recover

### 1. Droplet Dies (Nginx / Static Site Down)

**Symptoms:** agentgate.online returns nothing or 502/503.

**Immediate Recovery (< 5 min):**
```bash
# Check if it's just Nginx
ssh root@134.199.224.98 "systemctl status nginx"

# Restart Nginx
ssh root@134.199.224.98 "systemctl restart nginx"

# If SSH works but Nginx won't start, check config
ssh root@134.199.224.98 "nginx -t"
```

**If Droplet Is Completely Dead:**
```bash
# Power cycle via DO API
DROPLET_ID=559773410
curl -s -X POST "https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"power_cycle"}'
```

**If Power Cycle Doesn't Fix It:**
1. Create new droplet from most recent snapshot (see Backup section below)
2. Update DNS A records for agentgate.online, api.agentgate.online, fulfill.agentgate.online → new IP
3. Run certbot for SSL

**Nuclear Option — Full Rebuild From Zero (~30 min):**
```bash
# 1. New droplet
doctl compute droplet create agentgate-recovery \
  --region sfo3 --size s-1vcpu-1gb --image ubuntu-24-04-x64 \
  --ssh-keys <key-fingerprint>

# 2. Install stack
ssh root@<new-ip> "apt update && apt install -y nginx certbot python3-certbot-nginx ufw fail2ban"
ssh root@<new-ip> "ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable"

# 3. Deploy landing page
cd ~/projects/agentgate/apps/web
npx next build
# Update deploy.sh with new IP, then:
./deploy.sh

# 4. Configure Nginx reverse proxies
# Copy configs from local backups (see below) or recreate:
#   api.agentgate.online → agentgate-production-3bf2.up.railway.app
#   fulfill.agentgate.online → fulfillment-api-production.up.railway.app

# 5. SSL
ssh root@<new-ip> "certbot --nginx -d agentgate.online -d api.agentgate.online -d fulfill.agentgate.online"

# 6. Update DNS to new IP
```

### 2. Railway Goes Down (APIs Unavailable)

**Symptoms:** api.agentgate.online and/or fulfill.agentgate.online return 502/504.

**This is mostly out of our hands.** Railway manages the infra. But:

- **Check Railway status:** https://status.railway.com
- **Check logs:** `railway logs -s agentgate` (if railway CLI is installed)
- **The landing page still works** — it's static on our droplet, independent of Railway
- **Railway has built-in auto-restart** for crashed services

**If Railway has extended outage:**
- The marketplace API and fulfillment API have no local fallback (they need Railway's runtime)
- We'd need to deploy them elsewhere (Fly.io, Render, etc.) — but this is unlikely
- Source code is in the monorepo: `apps/marketplace-api/`, `apps/fulfillment-api/`, `apps/facilitator/`
- All Railway env vars are in Keychain (account: agentgate)

### 3. Supabase Goes Down (Database Unavailable)

**Symptoms:** API calls return 500s, marketplace shows no endpoints.

- **Check Supabase status:** https://status.supabase.com
- **Supabase has 99.9% SLA** on paid plans (we're on free, so no SLA)
- **The landing page is unaffected** — all marketplace data shown on the landing page is fetched client-side; if it fails, cards just don't load
- **Recovery:** Wait for Supabase to come back. Data is persistent.

### 4. Bad Deploy (Site Broken After Push)

**Symptoms:** Site looks wrong or errors after a deploy.

**Immediate Rollback (< 1 min):**
```bash
# SSH and restore from the pre-deploy state
# Our deploy.sh extracts a tarball, so we need a backup strategy

# Option A: If the old out/ directory is still on local machine
# Just re-run deploy.sh with the old build

# Option B: Git revert
cd ~/projects/agentgate/apps/web
git stash  # or git checkout HEAD~1
npx next build
./deploy.sh
git stash pop  # or git checkout -
```

### 5. SSL Certificate Expires

**Symptoms:** Browser shows "Not Secure" warning.

```bash
# Certbot auto-renew should handle this, but if it doesn't:
ssh root@134.199.224.98 "certbot renew --force-renewal"
ssh root@134.199.224.98 "systemctl reload nginx"
```

Current cert expires: **2026-06-18** (auto-renew enabled).

### 6. DNS Issues

**Symptoms:** Domain doesn't resolve.

- DNS is managed at the registrar (admin controls this)
- Current A records: agentgate.online, api.agentgate.online, fulfill.agentgate.online → 134.199.224.98
- If we change droplet IP, all three A records need updating

---

## Backup Strategy (Free / Minimal Cost)

### What We Back Up

| Asset | Where It Lives | Backup Method | Frequency |
|-------|---------------|---------------|-----------|
| Landing page source | Git (local + GitHub) | `git push` | Every deploy |
| Static build (out/) | Droplet /var/www/agentgate.online | Rebuilt from source | On demand |
| Nginx configs | Droplet /etc/nginx/sites-available/ | Local copy (see below) | After changes |
| API source code | Git (local + GitHub) | `git push` | Every change |
| Database (Supabase) | Supabase cloud | Supabase daily backups (free tier: 7 days) | Automatic |
| Env vars / secrets | macOS Keychain (account: agentgate) | Keychain is backed up with Time Machine | Automatic |

### Local Nginx Config Backups

After any Nginx config change on the droplet:
```bash
# Pull configs locally
mkdir -p ~/projects/agentgate/infra/nginx-configs
scp root@134.199.224.98:/etc/nginx/sites-available/agentgate.online ~/projects/agentgate/infra/nginx-configs/
scp root@134.199.224.98:/etc/nginx/sites-available/api.agentgate.online ~/projects/agentgate/infra/nginx-configs/
scp root@134.199.224.98:/etc/nginx/sites-available/fulfill.agentgate.online ~/projects/agentgate/infra/nginx-configs/
git add infra/nginx-configs && git commit -m "backup: nginx configs"
```

### DO Snapshots (On-Demand, Not Recurring)

Monthly snapshots cost ~$0.60/mo per snapshot retained. Take one before major changes:
```bash
DROPLET_ID=559773410
curl -s -X POST "https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions" \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"snapshot","name":"agentgate-pre-<change-description>"}'
```

---

## Deploy Checklist

Before every deploy:
1. ✅ All tests pass (`npx vitest run`)
2. ✅ Build succeeds (`npx next build`)
3. ✅ Quick visual check of out/index.html locally
4. ✅ Note the current git commit hash (rollback target)

After every deploy:
1. ✅ Check https://agentgate.online loads
2. ✅ Check https://api.agentgate.online/health returns 200
3. ✅ Check https://fulfill.agentgate.online/health returns 200
4. ✅ Spot-check on mobile

---

## Monitoring (Free)

### Option A: OpenClaw Health Cron (Recommended)
Similar to TBCPS health monitor. Every 5 minutes:
```bash
# Check landing page
curl -sf https://agentgate.online > /dev/null

# Check API health
curl -sf https://api.agentgate.online/health > /dev/null

# Check fulfillment health
curl -sf https://fulfill.agentgate.online/health > /dev/null
```
If any fail → alert the team.

### Option B: UptimeRobot (Free Tier)
- 50 free monitors, 5-min intervals
- Email + push notifications on downtime
- https://uptimerobot.com — no cost

---

## Cost Summary

| Item | Monthly Cost |
|------|-------------|
| DO Droplet (s-1vcpu-1gb) | $6.00 |
| Railway (3 services, starter) | ~$0 (hobby tier) |
| Supabase (free tier) | $0 |
| Domain (agentgate.online) | ~$1/mo amortized |
| SSL (Let's Encrypt) | $0 |
| Monitoring (OpenClaw cron or UptimeRobot) | $0 |
| Snapshots (1-2 retained) | ~$0.60-1.20 |
| **Total** | **~$7-8/mo** |

No $80/mo surprises. Everything is either free tier or the minimum viable paid tier.

---

## Key Contacts & Access

- **Droplet SSH:** See deploy docs (key-based auth)
- **Railway dashboard:** railway.app (dkerpalprofessional@gmail.com)
- **Supabase dashboard:** supabase.com (remotebb email)
- **DNS/Domain:** Managed at registrar
- **Secrets:** All in macOS Keychain under account `agentgate`
- **Source code:** This repository

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Dedicated droplet ($6/mo) over shared Plesk | Plesk lockout incident taught us: isolate production services |
| 2026-03-21 | No managed backups (unlike TBCPS) | Landing page is rebuildable from git in minutes. TBCPS has customer payment data — different risk profile. |
| 2026-03-21 | On-demand snapshots only | Monthly auto-snapshots ($0.80/mo) not worth it when we can rebuild from source. Take snapshots before big changes only. |
| 2026-03-21 | mailto: for feedback (no backend) | Static site, no runtime. Email is zero-cost and works. Can upgrade to a form service later if volume warrants it. |
