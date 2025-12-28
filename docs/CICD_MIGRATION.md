# CI/CD Migration Guide

This document explains the changes from the old Firebase-generated workflows to the new comprehensive CI/CD pipeline.

## What Changed

### Old Workflow (Before)

**Two separate workflow files:**
1. `.github/workflows/firebase-hosting-merge.yml` - Deploys to prod on merge
2. `.github/workflows/firebase-hosting-pull-request.yml` - Preview deploys on PRs

**Limitations:**
- ❌ No staging environment
- ❌ No E2E tests before production deployment
- ❌ Only deploys hosting (not Firestore rules/indexes)
- ❌ No approval process for production
- ❌ Direct to production on merge (risky!)

### New Workflow (After)

**Single comprehensive workflow:**
- `.github/workflows/cicd.yml` - Full CI/CD pipeline

**Improvements:**
- ✅ Staging environment for testing
- ✅ E2E tests run against staging before prod
- ✅ Deploys all Firebase resources (hosting + rules + indexes)
- ✅ Manual approval required for production
- ✅ Better test coverage (lint + unit + E2E)
- ✅ Deployment summaries and artifacts

## Migration Steps

### Option 1: Quick Start (Single Project)

Use this if you want to start immediately with your existing Firebase project.

#### Step 1: Update GitHub Environment Variables

Go to GitHub → Settings → Environments → **prod**

Ensure these variables are set (they should already exist):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

And this secret:
- `FIREBASE_SERVICE_ACCOUNT`

#### Step 2: Create Staging Environment

Go to GitHub → Settings → Environments → New environment

Name: `staging`

**Copy all variables from prod environment:**
- Use the same Firebase project for now
- We'll separate them later if needed

**Copy the secret:**
- `FIREBASE_SERVICE_ACCOUNT` (same as prod for now)

#### Step 3: Enable Production Approval

Go to GitHub → Settings → Environments → **prod** → Configure

Under "Deployment protection rules":
- ✅ Enable "Required reviewers"
- Add yourself (and team members)
- Save

#### Step 4: Disable Old Workflows

Rename the old workflow files so they don't run:

```bash
mv .github/workflows/firebase-hosting-merge.yml .github/workflows/firebase-hosting-merge.yml.old
mv .github/workflows/firebase-hosting-pull-request.yml .github/workflows/firebase-hosting-pull-request.yml.old
```

Or delete them:
```bash
rm .github/workflows/firebase-hosting-merge.yml
rm .github/workflows/firebase-hosting-pull-request.yml
```

#### Step 5: Test the New Workflow

```bash
# Create test branch
git checkout -b test-new-cicd

# Make a small change
echo "# CI/CD Update" >> docs/CICD_MIGRATION.md

# Commit and push
git add .
git commit -m "test: new CI/CD pipeline"
git push origin test-new-cicd
```

Create a PR and watch it run!

### Option 2: Full Setup (Two Projects - Recommended)

For production use, create separate staging and production projects.

Follow the complete guide in [CICD_SETUP.md](./CICD_SETUP.md).

## Workflow Comparison

### Pipeline Flow

**Old:**
```
PR created
  ↓
Preview deploy to Firebase preview channel
  ↓
Merge to main
  ↓
Deploy directly to PRODUCTION ⚠️
```

**New:**
```
PR created
  ↓
Run tests (lint + unit)
  ↓
Preview deploy to Firebase preview channel
  ↓
Merge to main
  ↓
Deploy to STAGING
  ↓
Run E2E tests against STAGING
  ↓
Wait for manual approval 👤
  ↓
Deploy to PRODUCTION ✅
```

### Deployment Scope

**Old:**
```yaml
# Only deploys hosting
firebase deploy --only hosting
```

**New:**
```yaml
# Deploys all resources
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

### Environment Variables

**Old:**
```yaml
# Variables in workflow file (not secure)
env:
  VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
```

**New:**
```yaml
# Variables in GitHub Environments (secure, environment-specific)
environment:
  name: staging  # or prod
env:
  VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
```

## Testing Checklist

After migration, test these scenarios:

### ✅ PR Preview Deploy
- [ ] Create a PR
- [ ] Workflow runs automatically
- [ ] Tests pass (lint + unit)
- [ ] Preview deploy succeeds
- [ ] Preview URL posted in PR comment
- [ ] Can access preview URL

### ✅ Staging Deploy
- [ ] Merge PR to main
- [ ] Staging deploy runs automatically
- [ ] All resources deploy (hosting + rules + indexes)
- [ ] E2E tests run against staging
- [ ] E2E tests pass

### ✅ Production Deploy
- [ ] After E2E tests pass, approval required
- [ ] Notification sent to reviewers
- [ ] Can approve deployment
- [ ] Production deploy succeeds after approval
- [ ] Production site updated
- [ ] No downtime during deployment

### ✅ Rollback
- [ ] Can revert a commit
- [ ] Workflow redeploys previous version
- [ ] Site rolls back successfully

## Troubleshooting

### Old workflows still running

**Problem:** Both old and new workflows run simultaneously

**Solution:**
```bash
# Delete or rename old workflow files
git rm .github/workflows/firebase-hosting-merge.yml
git rm .github/workflows/firebase-hosting-pull-request.yml
git commit -m "chore: remove old Firebase workflows"
git push
```

### Missing environment variables

**Problem:** Build fails with "VITE_FIREBASE_API_KEY is not defined"

**Solution:**
1. Go to GitHub → Settings → Environments
2. Select environment (staging or prod)
3. Add missing variable under "Environment variables"

### Production deploy doesn't wait for approval

**Problem:** Deploy goes straight to production

**Solution:**
1. Go to GitHub → Settings → Environments → prod
2. Enable "Required reviewers"
3. Add yourself and team members
4. Save

### E2E tests fail on staging

**Problem:** Tests pass locally with emulator but fail on staging

**Solutions:**
1. Check Firebase project has auth enabled:
   - Email/Password authentication
   - Google authentication (if used)

2. Verify environment variables:
   - `VITE_FIREBASE_PROJECT_ID` matches staging project
   - All other vars correct for staging

3. Check Firestore rules:
   - Rules allow test user access
   - Indexes are deployed

### Service account permission denied

**Problem:** "Permission denied" during deployment

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. IAM & Admin → Service Accounts
4. Find the service account (from FIREBASE_SERVICE_ACCOUNT secret)
5. Grant these roles:
   - Firebase Admin
   - Cloud Datastore User
   - Firebase Hosting Admin

## Reverting to Old Workflows

If you need to revert:

```bash
# Restore old workflow files
git mv .github/workflows/firebase-hosting-merge.yml.old .github/workflows/firebase-hosting-merge.yml
git mv .github/workflows/firebase-hosting-pull-request.yml.old .github/workflows/firebase-hosting-pull-request.yml

# Remove new workflow
git rm .github/workflows/cicd.yml

# Commit
git add .
git commit -m "revert: back to old Firebase workflows"
git push
```

## Next Steps

After successful migration:

1. **Monitor first few deployments**
   - Watch workflow runs closely
   - Check logs for any issues
   - Verify staging and production work correctly

2. **Set up alerts**
   - Firebase Console → Usage and Billing → Set budget alerts
   - GitHub → Settings → Notifications → Watch workflow failures

3. **Document for team**
   - Share CICD_SETUP.md with team
   - Train team on approval process
   - Establish deployment schedule/policies

4. **Optimize**
   - Consider separating staging/prod projects
   - Add more test coverage
   - Tune approval requirements

## Benefits Recap

✅ **Safety:** Staging environment catches issues before production
✅ **Testing:** E2E tests validate real Firebase integration
✅ **Infrastructure:** Firestore rules and indexes deploy automatically
✅ **Control:** Manual approval prevents accidental production deploys
✅ **Visibility:** Deployment summaries and artifacts for debugging
✅ **Rollback:** Easy to revert bad deployments

## Questions?

Refer to:
- [CICD_SETUP.md](./CICD_SETUP.md) - Complete setup guide
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Firebase CI/CD Docs](https://firebase.google.com/docs/hosting/github-integration)
