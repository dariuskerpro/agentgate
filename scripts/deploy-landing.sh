#!/usr/bin/env bash
# deploy-landing.sh — Deploy AgentGate Next.js landing page
#
# Deploys the static export from apps/web/out/ to the web root.
# This is the ONLY script that should touch index.html on the server.

set -euo pipefail

SERVER="root@134.199.224.98"
WEB_ROOT="/var/www/agentgate.online"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../apps/web/out"

if [ ! -f "$OUT_DIR/index.html" ]; then
  echo "❌ No export found at apps/web/out/index.html"
  echo "   Run: cd apps/web && pnpm build"
  exit 1
fi

# Safety check: make sure it's actually the Next.js landing page
if ! grep -q "The Infrastructure Layer" "$OUT_DIR/index.html"; then
  echo "🚨 apps/web/out/index.html doesn't look like the landing page!"
  echo "   Expected to find 'The Infrastructure Layer' in the file."
  exit 1
fi

echo "📡 Deploying landing page to $SERVER..."

# Deploy everything from the Next.js export
rsync -avz --delete \
  --exclude='journal/' \
  --exclude='journal.html' \
  "$OUT_DIR/" "$SERVER:$WEB_ROOT/"

# Fix permissions
ssh "$SERVER" "chown -R www-data:www-data $WEB_ROOT/"

echo "✅ Landing page deployed to https://agentgate.online/"
