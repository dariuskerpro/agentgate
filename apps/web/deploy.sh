#!/usr/bin/env bash
set -euo pipefail

# Deploy Next.js static export to Plesk
# Usage: ./deploy.sh

REMOTE="admin@147.182.196.245"
SSH_KEY="$HOME/.ssh/id_ed25519"
WEBROOT="/var/www/vhosts/text2ai.com/httpdocs"
LOCAL_OUT="$(dirname "$0")/out"

if [ ! -d "$LOCAL_OUT" ]; then
  echo "❌ No out/ directory. Run 'npx next build' first."
  exit 1
fi

echo "📦 Packaging build..."
tar czf /tmp/web-deploy.tar.gz -C "$LOCAL_OUT" .

echo "📤 Uploading to server..."
scp -i "$SSH_KEY" /tmp/web-deploy.tar.gz "$REMOTE:/tmp/"

echo "🚀 Deploying..."
ssh -i "$SSH_KEY" "$REMOTE" "sudo bash -c '
  cd $WEBROOT

  # Extract new build
  tar xzf /tmp/web-deploy.tar.gz

  # Fix permissions (macOS tar creates 600)
  find . -type d -exec chmod 755 {} \;
  find . -type f -exec chmod 644 {} \;

  # Sync index.html into subdirectories
  # Next.js exports page.html but Apache serves page/index.html via .htaccess
  for f in *.html; do
    dir=\"\${f%.html}\"
    if [ -d \"\$dir\" ]; then
      cp \"\$f\" \"\$dir/index.html\"
      chmod 644 \"\$dir/index.html\"
    fi
  done

  # Handle nested routes (e.g. docs/getting-started)
  find . -name \"*.html\" -not -name \"index.html\" | while read -r htmlfile; do
    dir=\"\${htmlfile%.html}\"
    if [ -d \"\$dir\" ]; then
      cp \"\$htmlfile\" \"\$dir/index.html\"
      chmod 644 \"\$dir/index.html\"
    fi
  done

  rm -f /tmp/web-deploy.tar.gz
'"

echo "✅ Deployed to https://text2ai.com"
