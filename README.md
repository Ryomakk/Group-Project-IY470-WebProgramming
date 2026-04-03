# 🚀 Group Project Git Guide

Hey team! Follow this guide to keep our project clean and conflict-free.

---

### 🔗 1. One-Time Setup (Do This Once)

Connect your fork to the main repository so you can sync updates:
```bash
git remote add upstream https://github.com/FangZxuan/Group-Project-IY470-WebProgramming.git
```
Verify it worked:
```bash
git remote -v
```

You should see both origin (your fork) and upstream (main repo).

---

### 🔄 2. Daily Workflow (Do This Every Time You Start Working)

Step 1: Sync with Main Repository

Always sync before starting work to avoid conflicts:
```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

💡 Tip: If this fails, make sure you're on the main branch first (git checkout main)

Step 2: Create & Switch to Your Branch

Never work directly on main!
```bash
git checkout -b your-branch-name
```

Examples:
```bash
git checkout -b homepage
git checkout -b payment-page
git checkout -b fix-navbar
```

Step 3: Work & Commit

Make your changes, then:
```bash
git add .
git commit -m "Clear description of what you changed"
```

Examples:
```bash
git commit -m "Add payment confirmation modal"
git commit -m "Fix responsive layout on mobile"
git commit -m "Update database connection settings"
```

Step 4: Push & Create Pull Request

Push your branch to your fork:
```bash
git push origin your-branch-name
```

Then go to GitHub → your fork → Compare & pull request and create a PR to the main repo's main branch.

---

### 📋 3. Useful Git Commands (Quick Reference)

Branch Management

```bash
# See all branches (* shows current branch)
git branch

# Create new branch and switch to it
git checkout -b branch-name

# Switch to existing branch
git checkout branch-name

# Delete local branch (after merging)
git branch -d branch-name

# Force delete branch (if not merged)
git branch -D branch-name

# Rename current branch
git branch -m new-name
Status & Navigation

# Fetch updates from upstream (without merging)
git fetch upstream

# Push local branch to your fork
git push origin branch-name

# Delete remote branch
git push origin --delete branch-name

# Pull latest changes for current branch
git pull origin branch-name
Fixing Mistakes

# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes
git reset --hard HEAD~1

# Add file to previous commit
git commit --amend --no-edit

# Stash changes temporarily
git stash

# Get stashed changes back
git stash pop
```

---

LETS GO GET 100% GUYS!!! 🎉💪
