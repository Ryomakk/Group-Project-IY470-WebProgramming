Hi everyone,

Please follow these steps exactly when working on our group project on GitHub.
This keeps the project clean and avoids conflicts.

---

### STEP 1: Clone **your own fork**

(Do NOT clone the main repo(my repo))

Clone the repo you forked which is your repo.

---

### STEP 2: Connect your fork to the main repo (DO THIS ONCE ONLY)

```bash
git remote add upstream https://github.com/FangZxuan/Group-Project-IY470-WebProgramming.git
```

Check it worked:

```bash
git remote -v
```

---

### STEP 3: Sync before starting any work (DO THIS EVERY TIME)

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

---

### STEP 4: Create a new branch (REQUIRED)

❌ Never work on `main`

```bash
git checkout -b name
```

Example:
```bash
git checkout -b homepage
```

---

### STEP 5: Do your assigned work

* Edit files
* Add files
* Test your changes

---

### STEP 6: Commit your changes

```bash
git add .
git commit -m "Short description of what you did"
```

Example:

```bash
git commit -m "Add homepage layout"
```

---

### STEP 7: Push your branch to your fork

```bash
git push origin feature-name
```

if you don't know your branch name or what branch you are at - git branch (eg. *main, *blabla *mean the current branch)
Example:

```bash
git push origin homepage(the branch name you are working on)
```
---

### STEP 8: Create a Pull Request (GitHub website)

1. Go to **your fork**
2. Click **Compare & pull request**
3. Base repo → main project repo
4. Base branch → `main`
5. Head branch → your feature branch
6. Click **Create Pull Request**

Then wait for approval.

---

### IMPORTANT RULES

* ❌ Do NOT push to `main`
* ✔ One task = one branch
* ✔ Always sync before starting
* ✔ Clear commit messages

---
LETS GO GET 100% GUYS!!!
