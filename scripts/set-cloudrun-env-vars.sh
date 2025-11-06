#!/bin/bash

# Cloud Runに直接環境変数を設定するスクリプト
# Firebase App Hostingのapphosting.yamlバグの回避策

set -e

PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
SERVICE_NAME="localshare-komaba"
REGION="asia-east1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Setting Environment Variables Directly in Cloud Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Workaround for Firebase App Hosting apphosting.yaml bug"
echo "   GitHub Issue: firebase/firebase-tools#8307"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo ""

# Set project
echo "📝 Setting gcloud project..."
gcloud config set project ${PROJECT_ID}
echo ""

echo "🔍 Fetching current Cloud Run service configuration..."
echo ""

# Update Cloud Run service with environment variables
echo "📦 Updating Cloud Run service with environment variables..."
echo ""

gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --set-env-vars="NODE_ENV=production,ALLOWED_ORIGINS=https://komabasai.local-share.net;https://localshare-komaba--localshare-komaba-54c0d.asia-east1.hosted.app,GOOGLE_CLIENT_ID=371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com,GOOGLE_REDIRECT_URI=https://komabasai.local-share.net/auth/callback" \
  --update-secrets="GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,SESSION_SECRET=SESSION_SECRET:latest" \
  --quiet

echo ""
echo "✅ Environment variables updated in Cloud Run!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verifying Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show current environment variables
echo "Current environment variables in Cloud Run:"
gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format="value(spec.template.spec.containers[0].env)" | grep -E "name|value|valueFrom" | head -40

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Wait 1-2 minutes for Cloud Run to apply changes"
echo "2. Check logs: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/logs?project=${PROJECT_ID}"
echo "3. Look for '[App] DIAGNOSTIC - Variable details' in logs"
echo "4. Expected: All variables should show 'EXISTS (length: X)'"
echo "5. Test mobile login"
echo ""
echo "⚠️  Note: This is a workaround. Future Firebase App Hosting deployments"
echo "   may override these settings until the platform bug is fixed."
echo ""
