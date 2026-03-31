#!/usr/bin/env bash
set -euo pipefail

# Deploy Next.js static export to AgentGate server
# Usage: REMOTE=user@host ./deploy.sh
# Requires: SSH key-based auth to your server

REMOTE="${REMOTE:?Set REMOTE=user@host before running}"
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
