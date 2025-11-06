# Mobile Login Issue - Root Cause and Fix

## Problem Summary

Mobile login is not working because OAuth credentials are not being loaded into the application. The production logs show:

```
[App] OAuth Configuration Check: {
  NODE_ENV: 'production',
  hasGoogleClientId: false,    ❌
  hasGoogleClientSecret: false, ❌
  hasSessionSecret: false,      ❌
  googleRedirectUri: 'not set (will use default)'
}
```

Additionally, the app is using MemoryStore for sessions, which causes:
- Session data loss on container restarts
- Memory leaks in production
- Sessions not persisting across multiple Cloud Run instances

## Root Causes

There were **THREE CRITICAL ISSUES** preventing environment variables from loading:

### Issue 1: dotenv Interfering with Platform Environment Variables (CRITICAL!)

The app was trying to load environment variables from a `.env.prod` file that doesn't exist:

```
[dotenv@17.2.3] injecting env (0) from .env.prod
```

The "(0)" means **zero environment variables** were loaded. The `app.ts` file was calling:

```typescript
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: envFile });
```

**Why this breaks everything:**
- In Cloud Run/Firebase App Hosting, environment variables are provided by the platform via `apphosting.yaml`
- The `.env.prod` file doesn't exist in the deployed container (and shouldn't - secrets must never be in git)
- dotenv's config call was preventing the platform environment variables from being used
- Even the `GOOGLE_CLIENT_ID` (which was hardcoded in `apphosting.yaml`) wasn't available

**The Fix:**
Only use dotenv in development mode. In production, Cloud Run provides environment variables directly:

```typescript
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env' });
} else {
  console.log('[App] Running in production - using platform-provided environment variables');
}
```

### Issue 2: Wrong Service Account for Secret Manager Permissions

Even after fixing the dotenv issue, secrets still need proper permissions. The permission script was using the wrong service account:

- ❌ OLD: `firebase-app-hosting-compute@localshare-komaba-54c0d.iam.gserviceaccount.com`
- ✅ NEW: `service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com`

This was confirmed by the Cloud Run logs showing:
```
Cloud Run UpdateService asia-east1:localshare-komaba service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com
```

### Issue 3: Completely Wrong apphosting.yaml Format (CRITICAL!)

The **entire structure** of `apphosting.yaml` was incorrect. We were using:

```yaml
runConfig:
  environmentVariables:
    GOOGLE_CLIENT_ID: value
  secrets:
    - GOOGLE_CLIENT_SECRET
```

But Firebase App Hosting actually requires the **`env` format**:

```yaml
runConfig:
  env:
    - variable: GOOGLE_CLIENT_ID
      value: 371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com
      availability:
        - RUNTIME
    - variable: GOOGLE_CLIENT_SECRET
      secret: GOOGLE_CLIENT_SECRET
      availability:
        - RUNTIME
```

**Why this matters:**
- The `environmentVariables` and `secrets` format is NOT recognized by Firebase App Hosting
- Even the hardcoded `GOOGLE_CLIENT_ID` wasn't loading because of the wrong format
- The `env` array format with `variable`, `value`/`secret`, and `availability` is the documented standard

**Reference:** Firebase App Hosting configuration documentation (2025 format)

## Fix Steps

### Step 0: Automatic Fixes (Already Applied)

The following fixes have been committed and pushed automatically:

1. ✅ **dotenv disabled in production** - `app.ts` updated to skip dotenv.config() when NODE_ENV=production
2. ✅ **apphosting.yaml COMPLETELY REWRITTEN** - Changed from `environmentVariables`/`secrets` format to correct `env` array format
3. ✅ **Comprehensive diagnostic logging added** - `app.ts` now logs all env var keys and detailed status
4. ✅ **Permissions script updated** - Now uses correct service account
5. ✅ **Diagnostic tool created** - `scripts/diagnose-apphosting-env.sh` checks all configuration

These changes will be deployed automatically. However, **you still need to manually grant Secret Manager permissions** (see Step 1 below).

### Step 1: Run Diagnostic Script (Optional but Recommended)

First, run the diagnostic script to check your current configuration:

```bash
cd /home/user/localshare-komaba
./scripts/diagnose-apphosting-env.sh
```

This will check:
- ✅ If all required secrets exist in Secret Manager
- ✅ If the service account has proper permissions
- ✅ If Cloud Run service is configured correctly
- ✅ If apphosting.yaml format is correct
- ✅ Current Firebase backend status

The output will tell you exactly what needs to be fixed.

### Step 2: Grant Secret Manager Permissions (REQUIRED - Manual Step)

The permissions script has been updated with the correct service account. Run it:

```bash
cd /home/user/localshare-komaba
./scripts/setup-secret-permissions.sh
```

Or manually grant permissions:

```bash
PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"

# Grant permissions to all secrets
for SECRET_NAME in FIREBASE_SERVICE_ACCOUNT FIREBASE_WEBAPP_CONFIG GOOGLE_CLIENT_SECRET SESSION_SECRET; do
  gcloud secrets add-iam-policy-binding ${SECRET_NAME} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}"
done
```

### Step 3: Verify Permissions

Check that permissions were granted successfully:

```bash
gcloud secrets get-iam-policy GOOGLE_CLIENT_SECRET --project=localshare-komaba-54c0d
gcloud secrets get-iam-policy SESSION_SECRET --project=localshare-komaba-54c0d
```

Expected output should include:
```yaml
bindings:
- members:
  - serviceAccount:service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

### Step 4: Wait for Automatic Deployment

The latest commit with the dotenv fix will be automatically deployed by Firebase App Hosting.

You can monitor the deployment:
1. Go to Firebase Console: https://console.firebase.google.com/project/localshare-komaba-54c0d/apphosting
2. Check the deployment status
3. Once deployed, the new version should use platform environment variables correctly

### Step 5: Verify the Fix with Diagnostic Logs

After redeployment, check the Cloud Run logs for the new diagnostic output:

1. Go to: https://console.cloud.google.com/run?project=localshare-komaba-54c0d
2. Click on `localshare-komaba` service
3. Click on the **LOGS** tab
4. Look for diagnostic messages:

**Expected diagnostic output (after fix):**
```
[App] Running in production - using platform-provided environment variables
[App] DIAGNOSTIC - Total environment variables: 50+
[App] DIAGNOSTIC - Environment variable keys: [
  'NODE_ENV',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ALLOWED_ORIGINS',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_WEBAPP_CONFIG'
]
[App] DIAGNOSTIC - Variable details: {
  GOOGLE_CLIENT_ID: 'EXISTS (length: 72)',
  GOOGLE_CLIENT_SECRET: 'EXISTS (length: 35)',
  SESSION_SECRET: 'EXISTS (length: 64)',
  GOOGLE_REDIRECT_URI: 'EXISTS (length: 51)',
  ALLOWED_ORIGINS: 'EXISTS (length: 120)'
}
[App] OAuth Configuration Check: {
  NODE_ENV: 'production',
  hasGoogleClientId: true,     ✅
  hasGoogleClientSecret: true,  ✅
  hasSessionSecret: true,       ✅
  googleRedirectUri: 'https://komabasai.local-share.net/auth/callback'
}
```

If you see **UNDEFINED** or **EMPTY_STRING** in the diagnostic output, there's still a configuration issue.

## Testing Mobile Login

After the fix is deployed:

1. Open the app on a mobile device: https://komabasai.local-share.net
2. Click the login button
3. You should be redirected to Google's OAuth consent screen
4. After granting permission, you should be logged in
5. Test that the session persists after:
   - Closing and reopening the browser
   - Waiting a few minutes
   - Refreshing the page

## Known Limitations

### MemoryStore Warning

The app is currently using the default in-memory session store. While this works, it has limitations:

- Sessions are lost when the container restarts
- Not suitable for multi-instance deployments
- Memory leaks over time

**Future improvement:** Consider implementing a persistent session store like:
- Firebase Firestore Session Store
- Redis (requires Cloud Memorystore)
- Cloud SQL (PostgreSQL/MySQL)

For now, the MemoryStore is acceptable for a single-instance deployment with infrequent restarts.

### Session Cookie Configuration

The current session configuration in `app.ts`:

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  },
}));
```

This should work for mobile browsers. The key settings:
- `secure: true` in production (HTTPS required)
- `httpOnly: true` (prevents XSS attacks)
- `sameSite: 'lax'` (allows cookies in same-site and top-level navigation)
- 7-day expiration

## Troubleshooting

### If login still doesn't work:

1. **Check browser console** for any CORS errors
2. **Check Network tab** for the `/auth/google` request status
3. **Verify cookies** are being set (Developer Tools → Application → Cookies)
4. **Check Cloud Run logs** for any OAuth errors
5. **Verify secrets exist** in Secret Manager:
   ```bash
   gcloud secrets list --project=localshare-komaba-54c0d
   ```

### If you see "config_error" in the URL:

This means the OAuth credentials are still not loaded. Double-check:
1. Permissions were granted to the correct service account
2. The app was redeployed after granting permissions
3. The secrets exist in Secret Manager with the correct names

## Files Modified

1. `scripts/setup-secret-permissions.sh` - Updated service account and added all secrets
2. `FIX_SECRET_PERMISSIONS.md` - Updated documentation with correct service account
3. `MOBILE_LOGIN_FIX.md` - This comprehensive fix document

## References

- [Cloud Run Service Accounts](https://cloud.google.com/run/docs/securing/service-identity)
- [Secret Manager IAM](https://cloud.google.com/secret-manager/docs/access-control)
- [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
