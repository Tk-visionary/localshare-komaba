# Firebase App Hosting Bug: Environment Variables Not Loading

## Issue Summary

Firebase App Hosting has a **confirmed bug** where environment variables defined in `apphosting.yaml` are not being bound to the Cloud Run container at runtime.

**GitHub Issue**: [firebase/firebase-tools#8307](https://github.com/firebase/firebase-tools/issues/8307)

**Status**: Unresolved (as of November 2025)

**Affected**: Multiple users since March 2025

---

## Symptoms

1. Environment variables are defined correctly in `apphosting.yaml`
2. Variables appear in Cloud Build logs during build time
3. **Variables are NOT available in the Cloud Run container at runtime**
4. Application logs show: `UNDEFINED` for all custom environment variables
5. Only `FIREBASE_CONFIG` and `NODE_ENV` are available

---

## Our Experience

### What We Tried (All Failed):

1. ✅ Fixed dotenv configuration - Didn't help
2. ✅ Corrected service account permissions - Didn't help
3. ✅ Rewrote `apphosting.yaml` to use `env` format - Didn't help
4. ✅ Changed from `environmentVariables`/`secrets` to `env` array format - Didn't help

### Logs Showing the Problem:

```
[App] DIAGNOSTIC - Total environment variables: 41
[App] DIAGNOSTIC - Environment variable keys: [ 'FIREBASE_CONFIG', 'NODE_ENV' ]
[App] DIAGNOSTIC - Variable details: {
  GOOGLE_CLIENT_ID: 'UNDEFINED',       ❌
  GOOGLE_CLIENT_SECRET: 'UNDEFINED',   ❌
  SESSION_SECRET: 'UNDEFINED',         ❌
  GOOGLE_REDIRECT_URI: 'UNDEFINED',    ❌
  ALLOWED_ORIGINS: 'UNDEFINED'         ❌
}
```

Even though `apphosting.yaml` defines:
```yaml
runConfig:
  env:
    - variable: GOOGLE_CLIENT_ID
      value: 371696877911-...
    - variable: GOOGLE_CLIENT_SECRET
      secret: GOOGLE_CLIENT_SECRET
    ...
```

**Result**: None of these variables are injected into the runtime environment.

---

## Root Cause

This is a **Firebase App Hosting platform bug**, not a configuration issue.

According to GitHub Issue #8307:
- The bug was introduced around March 2025
- It affects the binding of environment variables from `apphosting.yaml` to Cloud Run
- Variables work during build time but not at runtime
- Firebase team is aware but no fix timeline provided

---

## Workaround: Direct Cloud Run Configuration

Since `apphosting.yaml` doesn't work, we must configure Cloud Run directly.

### Option 1: Use the Automated Script

```bash
cd /path/to/localshare-komaba
./scripts/set-cloudrun-env-vars.sh
```

This script:
1. Sets environment variables directly in Cloud Run service
2. Links Secret Manager secrets
3. Verifies the configuration

### Option 2: Manual Configuration via Console

1. Go to Cloud Run Console:
   https://console.cloud.google.com/run/detail/asia-east1/localshare-komaba?project=localshare-komaba-54c0d

2. Click **"EDIT & DEPLOY NEW REVISION"**

3. Go to **"Variables & Secrets"** tab

4. Add environment variables:
   | Name | Value |
   |------|-------|
   | `NODE_ENV` | `production` |
   | `ALLOWED_ORIGINS` | `https://komabasai.local-share.net,https://localshare-komaba--localshare-komaba-54c0d.asia-east1.hosted.app` |
   | `GOOGLE_CLIENT_ID` | `371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com` |
   | `GOOGLE_REDIRECT_URI` | `https://komabasai.local-share.net/auth/callback` |

5. Add secret references:
   | Variable Name | Secret | Version |
   |---------------|--------|---------|
   | `GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` | `latest` |
   | `SESSION_SECRET` | `SESSION_SECRET` | `latest` |

6. Click **"DEPLOY"**

7. Wait 1-2 minutes for deployment

### Option 3: Using gcloud CLI

```bash
PROJECT_ID="localshare-komaba-54c0d"
SERVICE_NAME="localshare-komaba"
REGION="asia-east1"

gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --set-env-vars="NODE_ENV=production,ALLOWED_ORIGINS=https://komabasai.local-share.net;https://localshare-komaba--localshare-komaba-54c0d.asia-east1.hosted.app,GOOGLE_CLIENT_ID=371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com,GOOGLE_REDIRECT_URI=https://komabasai.local-share.net/auth/callback" \
  --update-secrets="GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,SESSION_SECRET=SESSION_SECRET:latest"
```

---

## Verification

After applying the workaround, check Cloud Run logs:

**Expected Output:**
```
[App] DIAGNOSTIC - Total environment variables: 45+
[App] DIAGNOSTIC - Environment variable keys: [
  'NODE_ENV',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET',
  'GOOGLE_REDIRECT_URI',
  'ALLOWED_ORIGINS',
  ...
]
[App] DIAGNOSTIC - Variable details: {
  GOOGLE_CLIENT_ID: 'EXISTS (length: 72)',     ✅
  GOOGLE_CLIENT_SECRET: 'EXISTS (length: 35)', ✅
  SESSION_SECRET: 'EXISTS (length: 64)',       ✅
  GOOGLE_REDIRECT_URI: 'EXISTS (length: 51)',  ✅
  ALLOWED_ORIGINS: 'EXISTS (length: 120)'      ✅
}
[App] OAuth Configuration Check: {
  hasGoogleClientId: true,
  hasGoogleClientSecret: true,
  hasSessionSecret: true,
  googleRedirectUri: 'https://komabasai.local-share.net/auth/callback'
}
```

---

## Important Notes

### ⚠️ Limitations of This Workaround:

1. **Future Firebase App Hosting deployments may override these settings**
   - Each time you deploy via Firebase App Hosting, you may need to re-apply the Cloud Run configuration
   - The `apphosting.yaml` file is still necessary for other settings

2. **This is a temporary solution**
   - Once Firebase fixes the bug, we should revert to using `apphosting.yaml` only
   - Keep monitoring the GitHub issue for updates

3. **Environment-specific configuration**
   - If you have multiple environments (staging, production), you'll need to configure each Cloud Run service separately

### ✅ Advantages:

1. **Immediate fix** - Works right away
2. **Direct control** - No dependency on Firebase App Hosting bug fixes
3. **Reliable** - Cloud Run's native configuration is stable
4. **Easy to verify** - Can see configuration directly in Cloud Run console

---

## Timeline

- **March 2025**: Bug first reported on GitHub
- **March 12, 2025**: Firebase status page incident (related)
- **November 2025**: Still unresolved, affecting our deployment
- **November 7, 2025**: Implemented Cloud Run workaround for localshare-komaba

---

## Related Resources

- [GitHub Issue #8307](https://github.com/firebase/firebase-tools/issues/8307) - Main bug report
- [Firebase App Hosting Configuration Docs](https://firebase.google.com/docs/app-hosting/configure)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Cloud Run Secrets](https://cloud.google.com/run/docs/configuring/secrets)

---

## When to Revisit

Check the GitHub issue periodically for updates. When the bug is fixed:

1. Remove the manual Cloud Run configuration
2. Rely solely on `apphosting.yaml`
3. Delete this workaround documentation
4. Update deployment procedures

---

## Summary

**Problem**: Firebase App Hosting doesn't inject environment variables from `apphosting.yaml` into Cloud Run.

**Solution**: Configure environment variables directly in Cloud Run service.

**Status**: Temporary workaround until Firebase fixes the platform bug.
