#!/bin/bash

# PulseBoard — GitHub Push Script
# 
# This script pushes the PulseBoard project to GitHub
#
# SETUP (one-time):
# 1. Generate GitHub Personal Access Token:
#    - Go to https://github.com/settings/tokens
#    - Create new token (classic)
#    - Give it 'repo' scope
#    - Copy the token
#
# 2. Configure git credentials (choose one):
#    
#    Option A: Via HTTPS with token
#      git config --global credential.helper store
#      # Will prompt you to enter username + token on first push
#    
#    Option B: Via SSH (recommended)
#      ssh-keygen -t ed25519 -f ~/.ssh/id_github
#      # Upload ~/.ssh/id_github.pub to https://github.com/settings/keys
#      git remote set-url origin git@github.com:midwalkdog-ai/V_1.git
#
# 3. Run this script:
#    ./push.sh

set -e

echo "🚀 PulseBoard — Pushing to GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Not in PulseBoard root directory"
    echo "   Run this script from the pulseboard/ folder"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git not initialized"
    echo "   Run: git init"
    exit 1
fi

# Show current status
echo "📊 Repository Status:"
echo "---"
git status --short | head -20
echo ""

# Check remote
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
    echo "❌ Error: No remote configured"
    echo "   Run: git remote add origin https://github.com/midwalkdog-ai/V_1.git"
    exit 1
fi

echo "🔗 Remote: $REMOTE"
echo ""

# Try to push
echo "📤 Pushing to GitHub..."
echo "---"

if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Success! Repository pushed to:"
    echo "   https://github.com/midwalkdog-ai/V_1"
    echo ""
    echo "📚 Next steps:"
    echo "   1. View your repo: https://github.com/midwalkdog-ai/V_1"
    echo "   2. Set up GitHub secrets for CI/CD (see DEPLOYMENT.md)"
    echo "   3. Start developing!"
else
    echo ""
    echo "❌ Push failed. Possible causes:"
    echo "   - No internet connection"
    echo "   - GitHub credentials not configured"
    echo "   - Repository doesn't exist (create it first)"
    echo ""
    echo "💡 Fix authentication:"
    echo "   Option 1 (HTTPS): git config credential.helper store"
    echo "   Option 2 (SSH):   git remote set-url origin git@github.com:midwalkdog-ai/V_1.git"
    exit 1
fi
