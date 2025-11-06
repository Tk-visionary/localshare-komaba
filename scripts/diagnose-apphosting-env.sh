#!/bin/bash

# Comprehensive diagnostics for Firebase App Hosting environment variable issues
# This script checks all possible configuration problems

set -e

PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"
CLOUD_RUN_SERVICE="localshare-komaba"
REGION="asia-east1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Firebase App Hosting Environment Diagnostic"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Service Account: ${SERVICE_ACCOUNT}"
echo ""

# Set project
echo "📝 Setting gcloud project..."
gcloud config set project ${PROJECT_ID} 2>&1 | grep -v "Updated property"
echo ""

# ============================================================================
# 1. Check if secrets exist in Secret Manager
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Checking Secret Manager Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REQUIRED_SECRETS=("GOOGLE_CLIENT_SECRET" "SESSION_SECRET" "FIREBASE_SERVICE_ACCOUNT" "FIREBASE_WEBAPP_CONFIG")
MISSING_SECRETS=()

for SECRET in "${REQUIRED_SECRETS[@]}"; do
  echo -n "Checking ${SECRET}... "
  if gcloud secrets describe ${SECRET} --project=${PROJECT_ID} &> /dev/null; then
    echo "✅ EXISTS"
    # Get the latest version
    LATEST_VERSION=$(gcloud secrets versions list ${SECRET} --project=${PROJECT_ID} --limit=1 --format="value(name)")
    echo "   Latest version: ${LATEST_VERSION}"
  else
    echo "❌ MISSING"
    MISSING_SECRETS+=("${SECRET}")
  fi
done

echo ""

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo "⚠️  WARNING: Missing secrets detected!"
  echo "Missing: ${MISSING_SECRETS[*]}"
  echo ""
  echo "To create missing secrets, see SETUP_SECRETS.md"
  echo ""
fi

# ============================================================================
# 2. Check Secret Manager permissions
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Checking Secret Manager Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for SECRET in "${REQUIRED_SECRETS[@]}"; do
  if ! gcloud secrets describe ${SECRET} --project=${PROJECT_ID} &> /dev/null; then
    continue  # Skip if secret doesn't exist
  fi

  echo "Checking permissions for ${SECRET}:"
  POLICY=$(gcloud secrets get-iam-policy ${SECRET} --project=${PROJECT_ID} --format=json 2>&1)

  if echo "$POLICY" | grep -q "${SERVICE_ACCOUNT}"; then
    echo "  ✅ Service account has access"
    # Show the role
    ROLE=$(echo "$POLICY" | grep -A5 "${SERVICE_ACCOUNT}" | grep "role:" | head -1 | sed 's/.*role: //')
    echo "     Role: ${ROLE}"
  else
    echo "  ❌ Service account DOES NOT have access"
    echo "     Run: ./scripts/setup-secret-permissions.sh"
  fi
  echo ""
done

# ============================================================================
# 3. Check Cloud Run service configuration
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Checking Cloud Run Service Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Fetching Cloud Run service details..."
SERVICE_JSON=$(gcloud run services describe ${CLOUD_RUN_SERVICE} --region=${REGION} --project=${PROJECT_ID} --format=json 2>&1)

if [ $? -eq 0 ]; then
  echo "✅ Service found: ${CLOUD_RUN_SERVICE}"
  echo ""

  # Check service account
  echo "Service account:"
  echo "$SERVICE_JSON" | jq -r '.spec.template.spec.serviceAccountName' || echo "  Unable to extract"
  echo ""

  # Check environment variables
  echo "Environment variables configured in Cloud Run:"
  ENV_VARS=$(echo "$SERVICE_JSON" | jq -r '.spec.template.spec.containers[0].env[]? | "  - \(.name): \(if .value then "VALUE" elif .valueFrom.secretKeyRef then "SECRET:" + .valueFrom.secretKeyRef.name else "UNKNOWN" end)"' 2>/dev/null || echo "  None or unable to parse")
  echo "$ENV_VARS"
  echo ""

  # Check if our required vars are present
  echo "Checking for required environment variables in Cloud Run:"
  for VAR in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET SESSION_SECRET GOOGLE_REDIRECT_URI ALLOWED_ORIGINS; do
    if echo "$SERVICE_JSON" | jq -e ".spec.template.spec.containers[0].env[]? | select(.name==\"${VAR}\")" &> /dev/null; then
      echo "  ✅ ${VAR} is configured"
    else
      echo "  ❌ ${VAR} is NOT configured"
    fi
  done
else
  echo "❌ Failed to fetch Cloud Run service"
  echo "Service: ${CLOUD_RUN_SERVICE}"
  echo "Region: ${REGION}"
fi

echo ""

# ============================================================================
# 4. Check apphosting.yaml format
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Checking apphosting.yaml Format"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "apphosting.yaml" ]; then
  echo "✅ apphosting.yaml exists"
  echo ""

  # Check for env section
  if grep -q "^runConfig:" apphosting.yaml && grep -q "^  env:" apphosting.yaml; then
    echo "✅ Using 'env' format (correct for App Hosting)"
  elif grep -q "environmentVariables:" apphosting.yaml; then
    echo "⚠️  Using 'environmentVariables' format (old/incorrect format)"
    echo "   Should use 'env' format instead"
  else
    echo "❌ Unknown format in apphosting.yaml"
  fi
  echo ""

  # Show configured variables
  echo "Variables configured in apphosting.yaml:"
  if grep -q "^  env:" apphosting.yaml; then
    grep "variable:" apphosting.yaml | sed 's/.*variable: /  - /' | head -20
  else
    echo "  Unable to parse (non-standard format)"
  fi
else
  echo "❌ apphosting.yaml not found"
fi

echo ""

# ============================================================================
# 5. Check Firebase App Hosting backend status
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Checking Firebase App Hosting Backend Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Listing App Hosting backends..."
firebase apphosting:backends:list --project=${PROJECT_ID} 2>&1 || echo "Unable to list backends (firebase CLI may not be available)"

echo ""

# ============================================================================
# Summary and Recommendations
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary and Recommendations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo "🔴 Action Required: Create missing secrets"
  echo "   Missing: ${MISSING_SECRETS[*]}"
  echo "   Run: See SETUP_SECRETS.md for instructions"
  echo ""
fi

echo "📚 Next Steps:"
echo "1. Ensure all secrets exist in Secret Manager"
echo "2. Run ./scripts/setup-secret-permissions.sh to grant permissions"
echo "3. Verify apphosting.yaml uses correct 'env' format"
echo "4. Redeploy the application"
echo "5. Check Cloud Run logs for '[App] DIAGNOSTIC' messages"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Diagnostic complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
