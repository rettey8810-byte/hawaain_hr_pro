# Git Push Guide (Windows / PowerShell)

This file explains how to save your code changes to Git and push them to GitHub.

## 1) Check what changed

```powershell
git status
```

- If you see **modified** files, you have local changes.
- If you see **Untracked files**, they are new files that must be added.

## 2) See what exactly changed (optional)

```powershell
git diff
```

## 3) Add files to staging

### Add everything

```powershell
git add -A
```

### OR add specific files

```powershell
git add web/src/components/ManpowerBudget.jsx
```

## 4) Commit the changes

```powershell
git commit -m "your message here"
```

Example:

```powershell
git commit -m "fix: manpower budget salary and dashboard totals"
```

## 5) Push to GitHub

Push current branch to origin:

```powershell
git push origin main
```

If your branch is not `main`, check your branch name:

```powershell
git branch
```

Then push that branch:

```powershell
git push origin <branch-name>
```

## 6) Confirm it is pushed

```powershell
git log --oneline -5
```

You can also compare local vs remote:

```powershell
git fetch origin
git show -s --oneline HEAD
git show -s --oneline origin/main
```

## Common issues

### A) "Everything up-to-date" but Vercel didn’t update

- This usually means there were no new commits pushed.
- Run:

```powershell
git status
```

If there are changes, you still need to `git add` + `git commit` + `git push`.

### B) PowerShell error: `&&` not working

In PowerShell, avoid `&&`.

Do commands one by one:

```powershell
git add -A
git commit -m "message"
git push origin main
```

### C) I committed with the wrong Git user

Fix the commit author (last commit):

```powershell
git commit --amend --reset-author
```

Then push again:

```powershell
git push origin main
```

### D) Undo local changes (be careful)

Discard changes in a single file:

```powershell
git restore path/to/file
```

Discard all local changes:

```powershell
git restore .
```

### E) Remove file from staging (unstage)

```powershell
git restore --staged path/to/file
```

---

## Latest Changes (Auto-deployed to Vercel)

### 2025-01-XX Updates

**Leave Application Form**
- Reason and Destination fields are now optional (no longer required)
- Removed validation checks for empty reason/destination
- Updated labels to show "(optional)" indicator

**Leave Planner**
- Now shows only active leaves by default (pending and approved)
- Rejected and cancelled leaves are filtered out unless specific status filter is selected
- Status filter "all" now means "all active leaves"

**Medicals Page**
- Removed FirebaseDataChecker debug component
- Cleaned up production code

**How to Deploy**
All changes are automatically deployed to Vercel when pushed to main branch.

Quick deploy command:
```powershell
git add -A; git commit -m "your message"; git push origin main
```

If Vercel doesn't auto-deploy (no new commits):
```powershell
git commit --allow-empty -m "trigger: force vercel deploy"; git push origin main
```
