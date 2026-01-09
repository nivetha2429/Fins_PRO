#!/bin/bash

# 🚀 DEPLOYMENT SCRIPT - EMI PRO
# Checks changes, commits, and deploys to production

set -e

echo "🚀 EMI PRO - DEPLOYMENT SCRIPT"
echo "==============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_pass() { echo -e "${GREEN}✅${NC} $1"; }
check_fail() { echo -e "${RED}❌${NC} $1"; }
check_warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
check_info() { echo -e "${BLUE}ℹ️${NC}  $1"; }

echo "📋 PHASE 1: PRE-DEPLOYMENT CHECKS"
echo "=================================="
echo ""

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    check_warn "Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "Aborted."
        exit 1
    fi
else
    check_pass "On main branch"
fi

# Check git status
echo ""
echo "1️⃣  Checking for uncommitted changes..."
if git diff-index --quiet HEAD --; then
    check_pass "No uncommitted changes"
    CHANGES=false
else
    check_info "Uncommitted changes found"
    CHANGES=true
fi

# Show modified files
if [ "$CHANGES" = true ]; then
    echo ""
    echo "📝 Modified Files:"
    echo "=================="
    git status --short | grep "^ M" | while read line; do
        echo "  $line"
    done
    
    echo ""
    echo "📝 New Files:"
    echo "============="
    git status --short | grep "^??" | while read line; do
        echo "  $line"
    done
fi

echo ""
echo "📋 PHASE 2: CRITICAL FILES CHECK"
echo "================================="
echo ""

# Check version.json
echo "2️⃣  Checking version.json..."
if git diff --name-only | grep -q "backend/public/downloads/version.json"; then
    check_info "version.json has changes"
    echo ""
    echo "Changes in version.json:"
    git diff backend/public/downloads/version.json | grep "^[+-]" | grep -v "^[+-][+-][+-]"
    echo ""
    VERSION_CHANGED=true
else
    check_pass "version.json unchanged"
    VERSION_CHANGED=false
fi

# Check APK files
echo "3️⃣  Checking APK files..."
APK_CHANGED=false
if git diff --name-only | grep -q "\.apk$"; then
    check_info "APK files have changes"
    git diff --name-only | grep "\.apk$" | while read apk; do
        SIZE=$(ls -lh "$apk" 2>/dev/null | awk '{print $5}' || echo "N/A")
        echo "  - $apk ($SIZE)"
    done
    APK_CHANGED=true
else
    check_pass "No APK changes"
fi

# Check backend code
echo "4️⃣  Checking backend code..."
if git diff --name-only | grep -q "^backend/"; then
    check_info "Backend code has changes"
    git diff --name-only | grep "^backend/" | head -5 | while read file; do
        echo "  - $file"
    done
else
    check_pass "No backend changes"
fi

# Check frontend code
echo "5️⃣  Checking frontend code..."
if git diff --name-only | grep -q "^src/"; then
    check_info "Frontend code has changes"
    git diff --name-only | grep "^src/" | head -5 | while read file; do
        echo "  - $file"
    done
else
    check_pass "No frontend changes"
fi

echo ""
echo "📋 PHASE 3: DEPLOYMENT SUMMARY"
echo "=============================="
echo ""

echo "Files to be deployed:"
echo "--------------------"
git status --short | wc -l | xargs echo "Total files changed:"

echo ""
echo "Critical updates:"
if [ "$VERSION_CHANGED" = true ]; then
    echo "  ✅ version.json updated (auto-update will detect new version)"
fi
if [ "$APK_CHANGED" = true ]; then
    echo "  ✅ APK files updated (new versions available for download)"
fi

echo ""
echo "📋 PHASE 4: COMMIT & DEPLOY"
echo "==========================="
echo ""

if [ "$CHANGES" = false ]; then
    check_info "No changes to deploy"
    echo ""
    echo "Current deployment status:"
    git log -1 --oneline
    echo ""
    echo "Last deployment:"
    git log -1 --format="%ar by %an"
    exit 0
fi

# Ask for commit message
echo "Enter commit message (or press Enter for default):"
read -p "> " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Update APKs and version.json - $(date +%Y-%m-%d)"
fi

echo ""
echo "Commit message: $COMMIT_MSG"
echo ""

read -p "Proceed with deployment? (yes/no): " DEPLOY
if [ "$DEPLOY" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Deploying..."
echo "==============="
echo ""

# Add all changes
echo "1️⃣  Adding files..."
git add .

# Commit
echo "2️⃣  Committing..."
git commit -m "$COMMIT_MSG"

# Push
echo "3️⃣  Pushing to origin/main..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    check_pass "Deployment successful!"
    echo ""
    echo "📊 Deployment Info:"
    echo "==================="
    echo "Branch: $CURRENT_BRANCH"
    echo "Commit: $(git log -1 --oneline)"
    echo "Time: $(date)"
    echo ""
    echo "🔄 Render will auto-deploy in ~2-3 minutes"
    echo ""
    echo "📋 Post-Deployment Checklist:"
    echo "=============================="
    echo "1. Wait 2-3 minutes for Render to deploy"
    echo "2. Check deployment status: https://dashboard.render.com"
    echo "3. Verify version endpoint:"
    echo "   curl https://emi-pro-app.onrender.com/version | jq"
    echo "4. Test auto-update on provisioned device"
    echo "5. Check logs: adb logcat | grep AutoUpdateManager"
    echo ""
else
    check_fail "Deployment failed!"
    echo ""
    echo "Check git status and try again:"
    echo "  git status"
    echo "  git log"
    exit 1
fi
