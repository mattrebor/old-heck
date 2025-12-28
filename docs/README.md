# Documentation

This directory contains documentation for the Old Heck project.

## CI/CD Documentation

### 📚 [CICD_SETUP.md](./CICD_SETUP.md)
**Complete setup guide for the CI/CD pipeline**

Use this if you're:
- Setting up the pipeline for the first time
- Creating a staging Firebase project
- Configuring GitHub environments and secrets
- Understanding the full pipeline architecture

### 🔄 [CICD_MIGRATION.md](./CICD_MIGRATION.md)
**Migration guide from old Firebase workflows to new pipeline**

Use this if you're:
- Migrating from the auto-generated Firebase workflows
- Want a quick comparison of old vs new
- Need step-by-step migration instructions
- Troubleshooting migration issues

## Quick Start

### For Quick Testing (Single Project)

1. **Update GitHub environments:**
   ```bash
   # Go to GitHub → Settings → Environments
   # Ensure 'prod' environment exists with all variables
   # Create 'staging' environment with same variables
   ```

2. **Enable production approval:**
   ```bash
   # Go to prod environment settings
   # Enable "Required reviewers"
   # Add yourself as reviewer
   ```

3. **Disable old workflows:**
   ```bash
   git mv .github/workflows/firebase-hosting-merge.yml .github/workflows/firebase-hosting-merge.yml.old
   git mv .github/workflows/firebase-hosting-pull-request.yml .github/workflows/firebase-hosting-pull-request.yml.old
   ```

4. **Test it:**
   ```bash
   # Create a PR and watch the new workflow run
   git checkout -b test-cicd
   echo "test" >> README.md
   git commit -am "test: CI/CD"
   git push origin test-cicd
   ```

### For Production Use (Two Projects - Recommended)

Follow the complete guide in [CICD_SETUP.md](./CICD_SETUP.md).

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pull Request                                                       │
│    ↓                                                                │
│  Run Tests (Lint + Unit)                                           │
│    ↓                                                                │
│  Deploy to Preview Channel                                         │
│  (temporary URL for review)                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Merge to main                                                      │
│    ↓                                                                │
│  Run Tests                                                          │
│    ↓                                                                │
│  Deploy to STAGING                                                 │
│  (all Firebase resources)                                          │
│    ↓                                                                │
│  Run E2E Tests on Staging                                          │
│    ↓                                                                │
│  Wait for Manual Approval 👤                                        │
│    ↓                                                                │
│  Deploy to PRODUCTION                                              │
│  (all Firebase resources)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

✅ **Staging Environment** - Test before production
✅ **E2E Tests** - Run against real Firebase services
✅ **Manual Approval** - Prevent accidental production deploys
✅ **All Resources** - Deploys hosting + Firestore rules + indexes
✅ **PR Previews** - Temporary URLs for each PR
✅ **Rollback Support** - Easy to revert bad deploys

## Deployed Resources

The pipeline deploys:
- **Firebase Hosting** - Your built React app
- **Firestore Rules** - Security rules from `firestore.rules`
- **Firestore Indexes** - Indexes from `firestore.indexes.json`

## Useful Commands

```bash
# Manual deployment commands (if needed)
npm run deploy:staging          # Deploy all resources to staging
npm run deploy:prod             # Deploy all resources to production
npm run deploy:hosting:staging  # Deploy only hosting to staging
npm run deploy:rules:prod       # Deploy only rules to production

# Local testing
npm run test:e2e:emulator       # E2E tests with Firebase emulator
npm run test:e2e:real           # E2E tests against real Firebase
npm run emulator:start          # Start Firebase emulator
```

## Environment Variables

### GitHub Environment: `staging`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT` (secret)

### GitHub Environment: `prod`
- Same variables as staging
- Different values for production project

## Cost Estimates

### Single Project
- Free tier sufficient for most usage
- Preview channels auto-expire (free)

### Two Projects
- **Staging:** Spark plan (free tier)
- **Production:** Blaze plan (pay-as-you-go)
- **GitHub Actions:** 2,000 min/month free (sufficient)

## Security

🔒 **Service Account Keys**
- Stored only in GitHub secrets
- Environment-level (not repository)
- Never committed to code

🔒 **Branch Protection**
- Require PR reviews
- Require status checks
- No force pushes to main

🔒 **Firestore Rules**
- Always deployed with hosting
- Tested in staging first
- Never wide-open in production

## Monitoring

- **GitHub Actions:** Repository → Actions → View workflow runs
- **Firebase Console:** Hosting → Release history
- **Test Reports:** Workflow artifacts → playwright-report-staging

## Support

If you encounter issues:
1. Check [CICD_MIGRATION.md](./CICD_MIGRATION.md) troubleshooting section
2. Review workflow logs in GitHub Actions
3. Verify environment variables in GitHub settings
4. Check Firebase project permissions in Google Cloud Console

## Additional Resources

- [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Firebase CI/CD](https://firebase.google.com/docs/hosting/github-integration)
- [Playwright CI](https://playwright.dev/docs/ci)
