# Firestore Setup Guide

This document explains how to set up and deploy Firestore indexes for the Old Heck application.

> **See also**: [FIRESTORE_RULES.md](./FIRESTORE_RULES.md) for security rules configuration and deployment.

## Composite Indexes

The application requires the following composite index for the "My Games" page:

- **Collection**: `games`
- **Fields**:
  - `createdBy.uid` (Ascending)
  - `updatedAt` (Descending)

## How to Deploy Indexes

### Option 1: Using Firebase CLI (Recommended)

This is the best way to ensure indexes are consistent across all environments.

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

   This command reads the `firestore.indexes.json` file and creates all defined indexes in your Firebase project.

### Option 2: Automatic Index Creation via Error Link

When you first access the "My Games" page without the index:

1. Open the browser console
2. You'll see a Firestore error with a link
3. Click the link to automatically create the index in the Firebase Console
4. Wait 1-2 minutes for the index to build

**Note**: This method only works for one environment at a time. You'll need to repeat for dev/staging/production separately.

### Option 3: Manual Creation in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Add Index**
5. Configure:
   - Collection ID: `games`
   - Add fields:
     - Field: `createdBy.uid`, Type: Ascending
     - Field: `updatedAt`, Type: Descending
   - Query scope: Collection
6. Click **Create**

## Verifying Index Status

After deploying, you can check index status:

```bash
firebase firestore:indexes
```

Or check in the Firebase Console under **Firestore Database** → **Indexes**.

## Multiple Environments

To replicate indexes across dev/staging/production:

1. **Commit the index file**: `firestore.indexes.json` is checked into source control
2. **Deploy to each environment**:
   ```bash
   # For development
   firebase use dev
   firebase deploy --only firestore:indexes

   # For production
   firebase use production
   firebase deploy --only firestore:indexes
   ```

## Adding New Indexes

If you add queries that require new indexes:

1. The Firebase error message will show the required index configuration
2. Add it to `firestore.indexes.json`
3. Commit the file
4. Deploy using `firebase deploy --only firestore:indexes`

## Common Issues

### "Index already exists"
This is fine - Firebase will skip indexes that already exist.

### "Index creation failed"
- Check that your Firebase CLI is authenticated
- Verify you have permission to modify indexes in the project
- Make sure the `firestore.indexes.json` file is valid JSON

### "Query requires an index"
- The index may still be building (can take a few minutes)
- Check index status in Firebase Console
- Verify the index definition matches your query exactly
