#!/usr/bin/env bash
# deploy-journal.sh — Deploy AgentGate journal to agentgate.online
# 
# SAFETY: Only deploys to /journal/ subdirectory. NEVER touches the web root index.html.
# The landing page (Next.js export) lives at /var/www/agentgate.online/index.html
# and must only be deployed via deploy-landing.sh or a full Next.js build.

set -euo pipefail

SERVER="root@134.199.224.98"
WEB_ROOT="/var/www/agentgate.online"
JOURNAL_DIR="$WEB_ROOT/journal"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOG_DIR="$SCRIPT_DIR/../blog"

# Safety check: blog/index.html must NEVER be deployed to the web root
if [ -f "$BLOG_DIR/index.html" ]; then
  echo "⚠️  blog/index.html exists — this is the build log page, NOT the landing page."
  echo "   It will NOT be deployed. The landing page is managed by deploy-landing.sh."
fi

echo "📡 Deploying journal to $SERVER..."

# Deploy journal index (journal.html only, NOT index.html)
scp "$BLOG_DIR/journal.html" "$SERVER:$WEB_ROOT/journal.html"

# Deploy journal entries
scp "$BLOG_DIR/journal/"*.html "$SERVER:$JOURNAL_DIR/"

# Fix permissions
ssh "$SERVER" "chmod 644 $WEB_ROOT/journal.html $JOURNAL_DIR/*.html && chown www-data:www-data $WEB_ROOT/journal.html $JOURNAL_DIR/*.html"

echo "✅ Journal deployed to https://agentgate.online/journal.html"
echo "   Entries: $(ssh "$SERVER" "ls $JOURNAL_DIR/*.html | wc -l") files"

# Verify landing page wasn't touched — check for Next.js build marker
if ssh "$SERVER" "head -1 $WEB_ROOT/index.html | grep -q 'XcTvtxJobaksaMNerptYS'"; then
  echo "🔒 Landing page intact (Next.js build hash verified)"
else
  echo "🚨 DANGER: Landing page index.html is NOT the Next.js export!"
  echo "   Restore from: apps/web/out/index.html"
  echo "   Or run: scripts/deploy-landing.sh"
  exit 1
fi
