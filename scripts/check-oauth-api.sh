#!/bin/bash

# OAuth 2.0クライアント設定をAPIで確認するスクリプト
# Google Cloud Console APIを使用して、OAuth設定を取得します

PROJECT_ID="localshare-komaba-54c0d"

echo "🔍 OAuth 2.0 設定チェック（API使用）"
echo "================================"
echo ""

# アクセストークンを取得
echo "🔑 アクセストークンを取得中..."
ACCESS_TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ エラー: アクセストークンの取得に失敗しました"
    echo ""
    echo "以下のコマンドで認証してください："
    echo "  gcloud auth application-default login"
    exit 1
fi

echo "✅ アクセストークン取得成功"
echo ""

# プロジェクト番号を取得
echo "📋 プロジェクト情報を取得中..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null)

if [ -z "$PROJECT_NUMBER" ]; then
    echo "❌ エラー: プロジェクト番号の取得に失敗しました"
    echo "プロジェクトID '$PROJECT_ID' が正しいか確認してください"
    exit 1
fi

echo "✅ プロジェクト番号: $PROJECT_NUMBER"
echo ""

# Firebase Web App の設定を取得
echo "🔥 Firebase Web App 設定を取得中..."
echo ""

# Firebase Management APIを使用
FIREBASE_API="https://firebase.googleapis.com/v1beta1/projects/$PROJECT_ID/webApps"

RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" "$FIREBASE_API")

echo "Firebase Web Apps:"
echo "$RESPONSE" | jq -r '.apps[]? | "- App ID: \(.appId)\n  Name: \(.displayName // "N/A")"' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "================================"
echo ""
echo "⚠️  OAuth 2.0クライアントIDの詳細設定（承認済みのドメイン、リダイレクトURIなど）は、"
echo "Google Cloud Consoleで直接確認する必要があります："
echo ""
echo "1. https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "2. 「OAuth 2.0 クライアントID」セクションを確認"
echo "3. ウェブクライアントをクリックして詳細を表示"
echo ""
echo "確認すべき項目："
echo "  ✓ 承認済みのJavaScript生成元"
echo "    - https://komabasai.local-share.net"
echo "    - https://localshare-komaba-54c0d.firebaseapp.com"
echo ""
echo "  ✓ 承認済みのリダイレクトURI"
echo "    - https://komabasai.local-share.net/__/auth/handler"
echo "    - https://localshare-komaba-54c0d.firebaseapp.com/__/auth/handler"
echo ""
