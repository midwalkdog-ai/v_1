# Push PulseBoard to GitHub

Your project is ready to push. Here's how:

## Prerequisites

Make sure you have:
1. GitHub account
2. Repository created at: `https://github.com/midwalkdog-ai/V_1`
3. Git installed locally
4. GitHub credentials configured

## Step 1: Clone the Project Locally

```bash
# Download the project
git clone <local-path-to-pulseboard> my-pulseboard
cd my-pulseboard
```

Or if you already have it locally:
```bash
cd /path/to/pulseboard
git status  # Should show the local repo
```

## Step 2: Configure Git Credentials

### Option A: HTTPS with Personal Access Token (Easiest)

```bash
# Generate token at: https://github.com/settings/tokens/new
# - Name: "PulseBoard"
# - Scope: repo
# - Copy the token

# Configure git to store credentials
git config --global credential.helper store

# On next push, you'll be asked for username + token
# Username: your-github-username
# Password: paste-the-token-here
```

### Option B: SSH (Recommended for automation)

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -f ~/.ssh/id_github -C "pulseboard"

# Add public key to GitHub
# Go to: https://github.com/settings/keys
# Click "New SSH key"
# Paste contents of ~/.ssh/id_github.pub

# Update remote URL
git remote set-url origin git@github.com:midwalkdog-ai/V_1.git
```

## Step 3: Push to GitHub

### Automated (Recommended)

```bash
# Run the included push script
./push.sh
```

### Manual

```bash
# Verify remote is set
git remote -v
# Should show: origin  https://github.com/midwalkdog-ai/V_1.git

# Push to main branch
git push -u origin main
```

## Verify It Worked

After pushing:

1. Visit: `https://github.com/midwalkdog-ai/V_1`
2. You should see all files uploaded
3. Check the commit: You should see the initial commit with all 46 files

## Next Steps

### Enable GitHub Actions (CI/CD)

Go to: `https://github.com/midwalkdog-ai/V_1/settings/secrets/actions`

Add these secrets (for auto-deployment):
- `DEPLOY_HOST` — Your server IP or domain
- `DEPLOY_USER` — SSH username (e.g., `ubuntu`)
- `DEPLOY_SSH_KEY` — Private SSH key
- `DEPLOY_PORT` — SSH port (default: 22)

See `DEPLOYMENT.md` for details.

### Develop Locally

```bash
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin main

# If using GitHub Actions, it auto-deploys
```

## Troubleshooting

### "remote rejected"
- Make sure the repo exists at: `https://github.com/midwalkdog-ai/V_1`
- Check you have push permissions

### "fatal: could not read Username"
- Configure credentials (see Step 2 above)
- Try: `git config credential.helper store`

### "fatal: unable to access"
- Check internet connection
- Try SSH instead of HTTPS

### "Please make sure you have the correct access rights"
- SSH key not configured
- Either use HTTPS or add SSH key to GitHub

## Quick Reference

```bash
# View current remote
git remote -v

# Change remote (HTTPS)
git remote set-url origin https://github.com/midwalkdog-ai/V_1.git

# Change remote (SSH)
git remote set-url origin git@github.com:midwalkdog-ai/V_1.git

# Push all branches
git push -u origin --all

# Push just main
git push -u origin main

# Check what would be pushed
git log origin/main..main
```

---

**Need help?** See `DEPLOYMENT.md` for production setup or `DEVELOPMENT.md` for development guidance.
