# CI/CD Pipeline Setup Guide

This document explains how to set up the complete CI/CD pipeline for Old Heck with staging and production environments.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  PR Created                                                         │
│    ↓                                                                │
│  Run Tests (Lint + Unit Tests)                                     │
│    ↓                                                                │
│  Deploy to Firebase Preview Channel (temporary URL)                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Merged to main                                                     │
│    ↓                                                                │
│  Run Tests (Lint + Unit Tests)                                     │
│    ↓                                                                │
│  Deploy to STAGING (all Firebase resources)                        │
│    ↓                                                                │
│  Run E2E Tests against STAGING                                     │
│    ↓                                                                │
│  Deploy to PRODUCTION (requires manual approval)                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Current Setup (Single Project)

If you want to use a **single Firebase project** with staging and production environments:

### Option A: Use Firebase Hosting Channels

This approach uses one Firebase project but deploys to different channels:
- **Staging:** `https://PROJECT_ID--staging.web.app`
- **Production:** `https://PROJECT_ID.web.app`

**Pros:**
- Simple setup - only one Firebase project
- No additional costs
- Shares same Firestore/Auth (good for testing with real data)

**Cons:**
- Staging and production share the same database (can be risky)
- Cannot fully test Firestore rules changes in isolation

### Current Workflow (Single Project)

The new `.github/workflows/cicd.yml` workflow is configured for a **single project** approach where:
1. **Staging environment** = your current Firebase project
2. **Production environment** = same Firebase project, just a different deployment step with approval

## Recommended Setup (Two Projects)

For production use, it's better to have **separate Firebase projects**:

### Step 1: Create a Staging Firebase Project

**Option 1: Using Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it: `old-heck-staging` (or similar)
4. Enable Google Analytics (optional)
5. Create project

**Option 2: Using Firebase CLI**
```bash
# This will open browser for project creation
firebase projects:create old-heck-staging
```

### Step 2: Enable Required Services in Staging

In the Firebase Console for your staging project:

1. **Authentication**
   - Enable Email/Password authentication
   - Enable Google authentication (if used)

2. **Firestore Database**
   - Create database in production mode
   - Choose region (same as prod for consistency)

3. **Hosting**
   - Enable Firebase Hosting (happens automatically on first deploy)

### Step 3: Update `.firebaserc`

Add the staging project alias:

```bash
firebase use --add
# When prompted:
# - Select your staging project ID
# - Enter alias: staging

firebase use --add
# When prompted:
# - Select your production project ID
# - Enter alias: prod
```

Your `.firebaserc` should now look like:

```json
{
  "projects": {
    "default": "oheck-ce403",
    "staging": "old-heck-staging",
    "prod": "oheck-ce403"
  }
}
```

### Step 4: Set Up GitHub Environments

Go to your GitHub repository → Settings → Environments

#### Create "staging" Environment

1. Click "New environment"
2. Name: `staging`
3. **No protection rules** (deploys automatically)
4. Add environment variables:
   - `VITE_FIREBASE_API_KEY` - Staging Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - `old-heck-staging.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` - `old-heck-staging`
   - `VITE_FIREBASE_STORAGE_BUCKET` - `old-heck-staging.appspot.com`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Staging sender ID
   - `VITE_FIREBASE_APP_ID` - Staging app ID
   - `VITE_FIREBASE_MEASUREMENT_ID` - Staging measurement ID (optional)

5. Add environment secrets:
   - `FIREBASE_SERVICE_ACCOUNT` - Staging service account JSON (see below)

#### Create/Update "prod" Environment

1. If "prod" doesn't exist, click "New environment", otherwise edit existing
2. Name: `prod`
3. **Configure protection rules:**
   - ✅ **Required reviewers** - Add yourself and/or team members
   - ✅ **Wait timer** - 0 minutes (or add a delay if you want)
   - ✅ **Deployment branches** - Only `main` branch

4. Add environment variables (if not already set):
   - `VITE_FIREBASE_API_KEY` - Production Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - `oheck-ce403.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID` - `oheck-ce403`
   - `VITE_FIREBASE_STORAGE_BUCKET` - `oheck-ce403.appspot.com`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Production sender ID
   - `VITE_FIREBASE_APP_ID` - Production app ID
   - `VITE_FIREBASE_MEASUREMENT_ID` - Production measurement ID (optional)

5. Add environment secrets:
   - `FIREBASE_SERVICE_ACCOUNT` - Production service account JSON

### Step 5: Get Firebase Service Account Keys

For each environment (staging and prod):

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the **entire contents** of the JSON file
5. In GitHub: Settings → Environments → [staging/prod] → Environment secrets
6. Create secret named `FIREBASE_SERVICE_ACCOUNT`
7. Paste the entire JSON contents

**Security Note:** The JSON contains sensitive credentials. Never commit it to your repository.

### Step 6: Get Firebase Configuration Values

For each environment:

1. Go to Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Click the web app (</> icon) or create one if needed
4. Copy the config values:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",           // → VITE_FIREBASE_API_KEY
     authDomain: "...",       // → VITE_FIREBASE_AUTH_DOMAIN
     projectId: "...",        // → VITE_FIREBASE_PROJECT_ID
     storageBucket: "...",    // → VITE_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "...", // → VITE_FIREBASE_MESSAGING_SENDER_ID
     appId: "...",            // → VITE_FIREBASE_APP_ID
     measurementId: "..."     // → VITE_FIREBASE_MEASUREMENT_ID
   };
   ```

5. Add these as environment variables in GitHub (see Step 4)

## Testing the Pipeline

### Test PR Preview Deployment

1. Create a new branch:
   ```bash
   git checkout -b test-cicd
   ```

2. Make a small change (e.g., update README)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: CI/CD pipeline"
   git push origin test-cicd
   ```

4. Create a pull request on GitHub

5. Watch the workflow:
   - ✅ Tests should run
   - ✅ Preview deployment should succeed
   - 📝 Check the PR comment for the preview URL

### Test Staging Deployment

1. Merge the PR to `main`

2. Watch the workflow:
   - ✅ Tests should run
   - ✅ Staging deployment should succeed
   - ✅ E2E tests should run against staging
   - ⏸️ Production deployment should wait for approval

### Test Production Deployment

1. After staging E2E tests pass:
   - Go to GitHub Actions → Your workflow run
   - Click "Review deployments"
   - Select "prod" environment
   - Click "Approve and deploy"

2. Production deployment should proceed

## Workflow Features

### Automatic Steps

- ✅ Linting on every PR and push
- ✅ Unit tests on every PR and push
- ✅ Preview deployments for PRs
- ✅ Automatic staging deployment on merge to main
- ✅ E2E tests against staging environment
- ✅ Deploys all Firebase resources (hosting, Firestore rules, indexes)

### Manual Steps

- 👤 Production deployment requires manual approval
- 👤 Reviewers can reject deployments

### Deployed Resources

The workflow deploys:
- **Hosting** - Your built application
- **Firestore Rules** - `firestore.rules`
- **Firestore Indexes** - `firestore.indexes.json`

To add more resources:
```yaml
npx firebase-tools deploy \
  --only hosting,firestore:rules,firestore:indexes,storage \
  --project ${{ vars.VITE_FIREBASE_PROJECT_ID }}
```

## Monitoring and Debugging

### View Workflow Runs

Go to: GitHub → Actions → Select workflow run

You can see:
- Step-by-step execution
- Logs for each step
- Deployment summaries
- Test reports

### Download Test Results

After E2E tests run:
1. Go to workflow run
2. Scroll to "Artifacts"
3. Download `playwright-report-staging`
4. Unzip and open `index.html` in browser

### Failed Deployments

If deployment fails:
1. Check the logs in GitHub Actions
2. Common issues:
   - Missing environment variables
   - Invalid service account JSON
   - Firestore rules syntax errors
   - Firestore index conflicts

## Cost Considerations

### Single Project Approach
- Free tier should be sufficient for staging/prod in one project
- Preview channels are free (auto-expire after 7 days)

### Two Project Approach
- **Staging:** Use Spark (free) plan if possible
- **Production:** Blaze (pay-as-you-go) plan recommended
- Set up billing alerts in both projects

### GitHub Actions Usage
- Free tier: 2,000 minutes/month (private repos)
- Typical workflow: ~10-15 minutes
- Should handle 100-200 deployments/month within free tier

## Rollback Strategy

If production deployment has issues:

**Option 1: Revert the commit**
```bash
git revert HEAD
git push origin main
# Workflow will deploy previous version
```

**Option 2: Manual rollback via Firebase Console**
1. Go to Firebase Console → Hosting
2. Click "Release history"
3. Find previous working version
4. Click "Rollback"

**Option 3: Deploy specific commit**
```bash
git checkout <good-commit-hash>
npm run build
firebase deploy --only hosting --project prod
```

## Security Best Practices

1. **Service Account Keys**
   - Store only in GitHub secrets (environment-level)
   - Rotate keys periodically
   - Never commit to repository

2. **Environment Variables**
   - Use GitHub environment variables (not repository secrets)
   - Different values for staging/prod
   - API keys are public (that's OK for Firebase web apps)

3. **Branch Protection**
   - Require PR reviews before merging to main
   - Require status checks to pass
   - Prevent force pushes to main

4. **Firestore Rules**
   - Always deploy rules with hosting
   - Test rules in staging first
   - Never use `allow read, write: if true` in production

## Troubleshooting

### "Permission denied" during deployment

**Cause:** Service account doesn't have correct permissions

**Fix:**
1. Go to Google Cloud Console
2. IAM & Admin → Service Accounts
3. Find your service account
4. Grant roles:
   - Firebase Admin
   - Cloud Datastore User
   - Firebase Hosting Admin

### E2E tests fail on staging but pass locally

**Cause:** Different Firebase configuration

**Fix:**
1. Check environment variables in GitHub
2. Verify Firebase project has email/password auth enabled
3. Check if test data exists in staging Firestore

### Production approval timeout

**Cause:** Workflow has 30-day approval timeout by default

**Fix:** Approve within 30 days or re-run workflow

## Next Steps

1. ✅ Set up staging Firebase project
2. ✅ Configure GitHub environments and secrets
3. ✅ Test PR preview deployment
4. ✅ Test full staging → production flow
5. ✅ Add branch protection rules
6. ✅ Set up Firebase billing alerts
7. ✅ Document deployment procedures for team

## Additional Resources

- [Firebase CI/CD Documentation](https://firebase.google.com/docs/hosting/github-integration)
- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Playwright in CI](https://playwright.dev/docs/ci)
