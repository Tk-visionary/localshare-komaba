#!/bin/bash

# Secret Manager の権限設定スクリプト
# App Hosting のサービスアカウントにシークレットへの読み取り権限を付与

set -e  # エラーが発生したら停止

PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
SERVICE_ACCOUNT="firebase-app-hosting-compute@${PROJECT_ID}.iam.gserviceaccount.com"

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

# GOOGLE_CLIENT_SECRET への権限付与
echo "🔑 GOOGLE_CLIENT_SECRET への権限を付与中..."
gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"
echo "✅ GOOGLE_CLIENT_SECRET の権限設定完了"
echo ""

# SESSION_SECRET への権限付与
echo "🔑 SESSION_SECRET への権限を付与中..."
gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"
echo "✅ SESSION_SECRET の権限設定完了"
echo ""

# 権限の確認
echo "📋 設定された権限を確認中..."
echo ""
echo "--- GOOGLE_CLIENT_SECRET の権限 ---"
gcloud secrets get-iam-policy GOOGLE_CLIENT_SECRET --project=${PROJECT_ID}
echo ""
echo "--- SESSION_SECRET の権限 ---"
gcloud secrets get-iam-policy SESSION_SECRET --project=${PROJECT_ID}
echo ""

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
