# Firestore Security Rules

This document explains the Firestore security rules for the Old Heck application and how to deploy them.

## Security Model

### Games Collection

The security rules implement the following permissions model:

#### Read Access (Public)
- **Anyone can read game documents** (authenticated or not)
- This allows view-only links to work without requiring authentication
- Users can share game URLs with others to view scores

#### Create Access (Authenticated Users Only)
- Only **authenticated users** can create new games
- The `createdBy` field must match the authenticated user's UID and email
- Required fields are validated: `createdBy`, `setup`, `rounds`, `createdAt`, `updatedAt`, `status`
- The `status` must be either `in_progress` or `completed`

#### Update Access (Owner Only)
- Only the **game creator** can update their games
- The creator is identified by matching `createdBy.uid` with the authenticated user's UID
- Critical fields cannot be modified:
  - `createdBy` (prevents ownership transfer)
  - `setup` (prevents changing game configuration after creation)
  - `createdAt` (prevents tampering with creation timestamp)
- Allowed updates: `rounds`, `inProgressRound`, `currentPhase`, `status`, `updatedAt`

#### Delete Access (Owner Only)
- Only the **game creator** can delete their games

### Security Validations

The rules enforce several security constraints:

1. **Creator Validation**: When creating a game, the `createdBy.uid` must match `request.auth.uid`
2. **Email Validation**: The `createdBy.email` must match `request.auth.token.email`
3. **Immutable Fields**: Once created, `createdBy`, `setup`, and `createdAt` cannot be changed
4. **Status Validation**: The `status` field must be either `in_progress` or `completed`
5. **Default Deny**: All other collections are denied by default

## Deploying Security Rules

### Option 1: Using Firebase CLI (Recommended)

This is the best way to deploy rules consistently across environments.

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

   This reads the `firestore.rules` file and deploys it to your Firebase project.

### Option 2: Manual Deployment via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## Testing Rules Locally

You can test rules locally using the Firebase Emulator Suite:

1. **Install emulator**:
   ```bash
   firebase init emulators
   ```

2. **Start emulator**:
   ```bash
   firebase emulators:start --only firestore
   ```

3. **Run your app against the emulator** by updating the Firebase config to point to localhost.

## Multiple Environments

To deploy rules across dev/staging/production:

1. **Commit the rules file**: `firestore.rules` is checked into source control
2. **Deploy to each environment**:
   ```bash
   # For development
   firebase use dev
   firebase deploy --only firestore:rules

   # For production
   firebase use production
   firebase deploy --only firestore:rules
   ```

## Common Issues

### "Permission denied" errors
- **For reads**: This shouldn't happen as all games are publicly readable
- **For creates**: User must be authenticated and include valid `createdBy` data
- **For updates/deletes**: User must be the game owner (matching `createdBy.uid`)

### Rules not taking effect
- Rules can take a few seconds to propagate after deployment
- Try refreshing your browser or clearing cache
- Verify deployment succeeded in Firebase Console → Firestore → Rules

### Testing rules
Check the Firebase Console → Firestore → Rules tab for a built-in simulator to test your rules before deploying.

## Security Best Practices

1. **Never trust client data**: The rules validate all incoming data
2. **Principle of least privilege**: Users can only access what they need
3. **Immutable creator**: Prevents games from being hijacked by changing ownership
4. **Public reads, private writes**: Anyone can view, only owners can modify
5. **Version control**: Keep rules in source control for audit trail

## Example Scenarios

### ✅ Allowed Operations

```javascript
// Authenticated user creates a game
createGame({
  createdBy: { uid: currentUser.uid, email: currentUser.email, ... },
  setup: { players: [...], decks: 2, maxRounds: 10 },
  rounds: [],
  status: 'in_progress',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
})

// Game owner updates round data
updateGame(gameId, {
  rounds: [...previousRounds, newRound],
  inProgressRound: null,
  currentPhase: 'completed',
  updatedAt: serverTimestamp()
})

// Anyone reads a game
getGame(gameId)
```

### ❌ Denied Operations

```javascript
// Unauthenticated user tries to create a game
// DENIED: Not signed in

// User tries to create a game with wrong createdBy
createGame({
  createdBy: { uid: 'someone-else', ... }
})
// DENIED: createdBy.uid doesn't match request.auth.uid

// User tries to update someone else's game
// DENIED: Not the game owner

// User tries to change the creator field
updateGame(gameId, {
  createdBy: { uid: 'different-user', ... }
})
// DENIED: Cannot modify createdBy field

// User tries to change game setup after creation
updateGame(gameId, {
  setup: { players: ['different', 'players'], ... }
})
// DENIED: Cannot modify setup field
```
