#!/bin/bash

# Secret Manager の権限設定スクリプト
# App Hosting のサービスアカウントにシークレットへの読み取り権限を付与

set -e  # エラーが発生したら停止

PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
# Firebase App Hosting uses this service account format
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"

echo "🔐 Secret Manager 権限設定を開始..."
echo ""
echo "プロジェクト: ${PROJECT_ID}"
echo "サービスアカウント: ${SERVICE_ACCOUNT}"
echo ""

# プロジェクトを設定
echo "📝 プロジェクトを設定中..."
gcloud config set project ${PROJECT_ID}
echo "✅ プロジェクト設定完了"
echo ""

# All secrets used in apphosting.yaml
SECRETS=("FIREBASE_SERVICE_ACCOUNT" "FIREBASE_CLIENT_CONFIG" "GOOGLE_CLIENT_SECRET" "SESSION_SECRET")

for SECRET_NAME in "${SECRETS[@]}"; do
  echo "🔑 ${SECRET_NAME} への権限を付与中..."
  gcloud secrets add-iam-policy-binding ${SECRET_NAME} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}" 2>&1 | grep -v "Policy update failed" || echo "  ℹ️  権限は既に設定されているか、シークレットが存在しません"
  echo "✅ ${SECRET_NAME} の権限設定完了"
  echo ""
done

# 権限の確認
echo "📋 設定された権限を確認中..."
echo ""
for SECRET_NAME in "${SECRETS[@]}"; do
  echo "--- ${SECRET_NAME} の権限 ---"
  gcloud secrets get-iam-policy ${SECRET_NAME} --project=${PROJECT_ID} 2>&1 | head -n 10 || echo "  ℹ️  シークレットが存在しないか、権限がありません"
  echo ""
done

echo "✅ すべての権限設定が完了しました！"
echo ""
echo "次のステップ:"
echo "1. アプリを再デプロイしてください"
echo "   git commit --allow-empty -m 'chore: trigger redeploy after secret permissions'"
echo "   git push"
echo ""
echo "2. デプロイ後、Cloud Run のログで以下を確認:"
echo "   hasGoogleClientId: true"
echo "   hasGoogleClientSecret: true"
echo "   hasSessionSecret: true"
echo ""
