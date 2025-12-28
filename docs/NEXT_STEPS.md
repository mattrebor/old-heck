# CI/CD Setup - Next Steps

## Current Status

✅ New CI/CD workflow created (`.github/workflows/cicd.yml`)
✅ Documentation created
✅ Package.json scripts added
⏳ Need to create staging Firebase project
⏳ Need to configure GitHub environments

## Your Current Setup

- **Production Project:** `oheck-ce403` (already exists)
- **Staging Project:** `old-heck-staging` (need to create)

## Implementation Steps

### Step 1: Create Staging Firebase Project

**Option A: Using Firebase Console (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `old-heck-staging`
4. Disable Google Analytics (or enable if you want staging analytics)
5. Create project

**Option B: Using Firebase CLI**

```bash
firebase projects:create old-heck-staging
```

### Step 2: Enable Services in Staging Project

In Firebase Console for your new staging project:

1. **Authentication** (click "Get started")
   - Enable Email/Password provider
   - Enable Google provider (if you use it in prod)

2. **Firestore Database** (click "Create database")
   - Start in production mode
   - Choose same region as production (for consistency)
   - Click "Create"

3. **Hosting** (will auto-enable on first deploy)

### Step 3: Add Staging Project to `.firebaserc`

```bash
# In your project directory
firebase use --add
```

When prompted:
- Select your new staging project ID (`old-heck-staging`)
- Enter alias: `staging`

Then add prod alias:
```bash
firebase use --add
```

When prompted:
- Select `oheck-ce403`
- Enter alias: `prod`

Your `.firebaserc` should look like:
```json
{
  "projects": {
    "default": "oheck-ce403",
    "staging": "old-heck-staging",
    "prod": "oheck-ce403"
  }
}
```

### Step 4: Get Staging Firebase Config

1. Go to Firebase Console → Select staging project
2. Click settings gear → Project settings
3. Scroll to "Your apps" section
4. Click web app icon (`</>`) or select existing web app
5. Copy the config values:

```javascript
const firebaseConfig = {
  apiKey: "...",           // → VITE_FIREBASE_API_KEY
  authDomain: "...",       // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "...",        // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "...",    // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "...", // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "...",            // → VITE_FIREBASE_APP_ID
  measurementId: "..."     // → VITE_FIREBASE_MEASUREMENT_ID (optional)
};
```

### Step 5: Get Staging Service Account

1. Firebase Console → Project settings → Service accounts tab
2. Click "Generate new private key"
3. Download the JSON file
4. **Save it securely** (don't commit it!)

### Step 6: Configure GitHub Environments

#### Create "staging" Environment

1. Go to GitHub repository → Settings → Environments
2. Click "New environment"
3. Name: `staging`
4. **Don't add protection rules** (auto-deploy)
5. Click "Configure environment"

**Add Environment Variables:**
- `VITE_FIREBASE_API_KEY` = [from Step 4]
- `VITE_FIREBASE_AUTH_DOMAIN` = [from Step 4]
- `VITE_FIREBASE_PROJECT_ID` = [from Step 4]
- `VITE_FIREBASE_STORAGE_BUCKET` = [from Step 4]
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = [from Step 4]
- `VITE_FIREBASE_APP_ID` = [from Step 4]
- `VITE_FIREBASE_MEASUREMENT_ID` = [from Step 4]

**Add Environment Secret:**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: [Paste entire contents of JSON from Step 5]

#### Update "prod" Environment

1. Go to GitHub repository → Settings → Environments
2. Click "prod" (should already exist)
3. **Add Protection Rules:**
   - ✅ Enable "Required reviewers"
   - Add yourself (and team members)
   - Click "Save protection rules"

**Verify Environment Variables exist:**
- These should already be set from your current workflow
- If missing, add them for production project `oheck-ce403`

**Verify Environment Secret exists:**
- `FIREBASE_SERVICE_ACCOUNT` should already be set
- If missing, generate new service account key for prod project

### Step 7: Deploy Firestore Rules to Staging

```bash
# Make sure rules file exists
cat firestore.rules

# Deploy to staging
firebase deploy --only firestore:rules,firestore:indexes --project staging
```

This ensures staging has the same security rules as production.

### Step 8: Test the Pipeline

#### Test 1: PR Preview
```bash
# Create test branch
git checkout -b test-cicd-pipeline

# Make small change
echo "# Testing CI/CD" >> docs/NEXT_STEPS.md

# Commit and push
git add .
git commit -m "test: CI/CD pipeline setup"
git push origin test-cicd-pipeline
```

Create a PR and verify:
- ✅ Tests run (lint + unit)
- ✅ Preview deploy succeeds
- ✅ Preview URL appears in PR comments

#### Test 2: Staging Deploy
```bash
# Merge the PR to main (on GitHub)
# Or locally:
git checkout main
git merge test-cicd-pipeline
git push origin main
```

Watch GitHub Actions and verify:
- ✅ Tests run
- ✅ Staging deploy succeeds
- ✅ Can access https://[staging-project-id].web.app
- ✅ E2E tests run against staging
- ✅ E2E tests pass
- ⏸️ Production deploy waits for approval

#### Test 3: Production Deploy
```bash
# In GitHub Actions:
# 1. Go to the workflow run
# 2. Click "Review deployments"
# 3. Select "prod"
# 4. Click "Approve and deploy"
```

Verify:
- ✅ Production deploy succeeds
- ✅ Production site updated
- ✅ No downtime

### Step 9: Disable Old Workflows

Once testing is successful:

```bash
# Delete old Firebase-generated workflows
git rm .github/workflows/firebase-hosting-merge.yml
git rm .github/workflows/firebase-hosting-pull-request.yml

# Or keep as backup
mv .github/workflows/firebase-hosting-merge.yml .github/workflows/firebase-hosting-merge.yml.old
mv .github/workflows/firebase-hosting-pull-request.yml .github/workflows/firebase-hosting-pull-request.yml.old

# Commit
git add .
git commit -m "chore: migrate to new CI/CD pipeline"
git push
```

## Quick Reference

### Manual Deployments (if needed)

```bash
# Deploy everything to staging
npm run deploy:staging

# Deploy everything to production
npm run deploy:prod

# Deploy only hosting to staging
npm run deploy:hosting:staging

# Deploy only Firestore rules to production
npm run deploy:rules:prod
```

### Check Deployment Status

```bash
# See current Firebase project
firebase use

# Switch to staging
firebase use staging

# Switch to production
firebase use prod

# List all projects
firebase projects:list
```

### Rollback Production

If production deploy has issues:

```bash
# Option 1: Revert the commit
git revert HEAD
git push origin main
# Pipeline will auto-deploy previous version

# Option 2: Firebase Console rollback
# Go to Firebase Console → Hosting → Release history
# Find previous version → Click "Rollback"
```

## Troubleshooting

### "Project not found" error

**Solution:** Make sure staging project is created and added to `.firebaserc`

```bash
firebase projects:list
firebase use --add
```

### E2E tests fail on staging

**Solutions:**
1. Verify Email/Password auth is enabled in staging project
2. Check Firestore rules are deployed: `firebase deploy --only firestore:rules --project staging`
3. Verify environment variables in GitHub staging environment match staging project

### Permission denied during deploy

**Solution:** Service account needs proper permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select staging project
3. IAM & Admin → Service Accounts
4. Find service account → Add roles:
   - Firebase Admin
   - Cloud Datastore User
   - Firebase Hosting Admin

## Success Criteria

✅ Staging Firebase project created
✅ `.firebaserc` configured with staging and prod aliases
✅ GitHub staging environment configured with all variables
✅ GitHub prod environment configured with approval rules
✅ Old workflows disabled
✅ PR preview deploys work
✅ Staging deploys work
✅ E2E tests pass on staging
✅ Production deploys work with approval
✅ Can rollback if needed

## Timeline Estimate

- **Step 1-3:** 10 minutes (create project, enable services, update config)
- **Step 4-6:** 15 minutes (get credentials, configure GitHub)
- **Step 7:** 2 minutes (deploy rules to staging)
- **Step 8:** 15 minutes (test all three scenarios)
- **Step 9:** 2 minutes (cleanup old workflows)

**Total:** ~45 minutes

## Need Help?

Refer to:
- [CICD_SETUP.md](./CICD_SETUP.md) - Complete setup guide
- [CICD_MIGRATION.md](./CICD_MIGRATION.md) - Migration guide with troubleshooting
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Firebase CI/CD Docs](https://firebase.google.com/docs/hosting/github-integration)
