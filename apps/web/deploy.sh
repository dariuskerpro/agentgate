#!/usr/bin/env bash
set -euo pipefail

# Deploy Next.js static export to AgentGate dedicated droplet
# Usage: ./deploy.sh
# Server: 134.199.224.98 (DO droplet "agentgate", SFO3, $6/mo)
# ⚠️ This is a DEDICATED AgentGate server — NOT the RemoteBB Plesk box

REMOTE="root@134.199.224.98"
WEBROOT="/var/www/agentgate.online"
LOCAL_OUT="$(dirname "$0")/out"

if [ ! -d "$LOCAL_OUT" ]; then
  echo "❌ No out/ directory. Run 'npx next build' first."
  exit 1
fi

echo "📦 Packaging build..."
tar czf /tmp/agentgate-web.tar.gz -C "$LOCAL_OUT" .

echo "📤 Uploading to server..."
scp /tmp/agentgate-web.tar.gz "$REMOTE:/tmp/"

echo "🚀 Deploying..."
ssh "$REMOTE" "bash -c '
  cd $WEBROOT
  tar xzf /tmp/agentgate-web.tar.gz
  find . -type d -exec chmod 755 {} \;
  find . -type f -exec chmod 644 {} \;
  chown -R www-data:www-data .
  rm -f /tmp/agentgate-web.tar.gz
'"

echo "✅ Deployed to https://agentgate.online"
