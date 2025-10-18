#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables
PROJECT_ID="sample-ugip-ai-app"
FIRESTORE_HOST=${FIRESTORE_EMULATOR_HOST:-localhost:8181}

# Compile TypeScript
echo "--- Compiling TypeScript ---"
node_modules/typescript/bin/tsc

# Clear Firestore data using the REST API
echo "--- Clearing Firestore Emulator Data ---"
curl -s -X DELETE "http://${FIRESTORE_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents"

# Add a newline for better readability
echo -e "\n--- Running Jest Tests ---"

# Run Jest
# The --runInBand flag is often useful for CI/emulator environments to avoid parallelization issues
jest --runInBand
