# Build Errors and Resolutions

This document records the build errors encountered during the deployment of the `localshare-komaba` application and the steps taken to resolve them.

## Error 1: `FIREBASE_SERVICE_ACCOUNT environment variable is not set.`

- **Symptom:** The application would fail to start with the error message `CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set.`.
- **Cause:** The application was trying to initialize the Firebase Admin SDK using a service account from the `FIREBASE_SERVICE_ACCOUNT` environment variable, which was not set in the Cloud Run environment.
- **Resolution:** The `app.ts` file was modified to initialize the Firebase Admin SDK without any arguments, allowing it to use the default application credentials available in the Cloud Run environment.

## Error 2: `failed to build: executing lifecycle: failed with status code: 51` and `sh: 1: Unknown: not found`

- **Symptom:** The build would fail with the error message `failed to build: executing lifecycle: failed with status code: 51` and `sh: 1: Unknown: not found`.
- **Cause:** The `build` script in `package.json` was using `$(npm bin)/tsc`, which is a command substitution that is not supported by the shell used in the build environment.
- **Resolution:** The `build` script in `package.json` was modified to use `npx tsc` instead of `$(npm bin)/tsc`.

## Error 3: `[vite:css] [postcss] It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin.`

- **Symptom:** The build would fail with an error message indicating that the `tailwindcss` PostCSS plugin has been moved to a separate package.
- **Cause:** The `tailwindcss` package was updated, and the PostCSS plugin was moved to a separate package called `@tailwindcss/postcss`.
- **Resolution:**
    1. The `@tailwindcss/postcss` package was installed.
    2. The `postcss.config.js` file was updated to use `@tailwindcss/postcss` instead of `tailwindcss`.
