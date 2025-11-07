#!/bin/bash

# Cloud Run サービスをYAMLから直接デプロイするスクリプト
# Firebase App Hostingのapphosting.yamlバグを回避するための恒久的な解決策

set -e

PROJECT_ID="localshare-komaba-54c0d"
REGION="asia-east1"
SERVICE_NAME="localshare-komaba"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying Cloud Run Service from YAML"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Service: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "Project: ${PROJECT_ID}"
echo ""

# Check if YAML file exists
if [ ! -f "cloudrun-service.yaml" ]; then
  echo "❌ Error: cloudrun-service.yaml not found"
  echo "   Make sure you're running this script from the project root"
  exit 1
fi

# Set project
echo "📝 Setting gcloud project..."
gcloud config set project ${PROJECT_ID}
echo ""

# Deploy the service from YAML
echo "🔄 Deploying Cloud Run service from YAML..."
echo ""

gcloud run services replace cloudrun-service.yaml \
  --region=${REGION} \
  --project=${PROJECT_ID}

echo ""
echo "✅ Deployment complete!"
echo ""

# Show the service URL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Service Information"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="value(status.url)")

echo "Service URL: ${SERVICE_URL}"
echo ""

# Verify environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verifying Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Environment variables configured:"
gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(spec.template.spec.containers[0].env[].name, spec.template.spec.containers[0].env[].value)" | head -20

echo ""
echo "Secrets configured:"
gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --project=${PROJECT_ID} \
  --format="table(spec.template.spec.containers[0].env[].name, spec.template.spec.containers[0].env[].valueFrom.secretKeyRef.name)" | grep -v "^$" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Wait 1-2 minutes for the new revision to receive traffic"
echo "2. Check logs: https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/logs?project=${PROJECT_ID}"
echo "3. Look for '[App] DIAGNOSTIC - Variable details' in logs"
echo "4. Test mobile login at: https://komabasai.local-share.net"
echo ""
echo "⚠️  Important: Run this script after each Firebase App Hosting deployment"
echo "   to ensure environment variables are preserved."
echo ""
