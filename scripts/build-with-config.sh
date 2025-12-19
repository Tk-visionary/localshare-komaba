#!/bin/bash
set -e

echo "🔥 Firebase クライアント設定を準備中..."

# Debug: 環境変数の確認
echo "📊 デバッグ: 環境変数の確認"

# Workaround: If FIREBASE_CLIENT_CONFIG is not set, use hardcoded config with new API key
# Note: Firebase client API keys are meant to be public (used in browser), so this is acceptable
if [ -z "$FIREBASE_CLIENT_CONFIG" ]; then
  echo "  FIREBASE_CLIENT_CONFIG: 未設定 - ハードコードされた設定を使用します..."
  FIREBASE_CLIENT_CONFIG='{"apiKey":"AIzaSyDPP9SpoyKHL57mA5hvnYYgYMYH3uUyK6Q","authDomain":"localshare-komaba-54c0d.firebaseapp.com","projectId":"localshare-komaba-54c0d","storageBucket":"localshare-komaba-54c0d.firebasestorage.app","messagingSenderId":"371696877911","appId":"1:371696877911:web:d29c5fc0c892242741fe12","measurementId":"G-87V6HZ6G17"}'
  echo "  ✅ ハードコード設定を適用"
else
  echo "  FIREBASE_CLIENT_CONFIG: 設定済み (長さ: ${#FIREBASE_CLIENT_CONFIG})"
fi

if [ -n "$FIREBASE_WEBAPP_CONFIG" ]; then
  echo "  FIREBASE_WEBAPP_CONFIG: 設定済み (長さ: ${#FIREBASE_WEBAPP_CONFIG})"
else
  echo "  FIREBASE_WEBAPP_CONFIG: 未設定"
fi

# Secret Managerから設定を取得してファイルに書き出す
if [ -n "$FIREBASE_CLIENT_CONFIG" ]; then
  echo "✅ FIREBASE_CLIENT_CONFIG を使用（本番環境）"
  echo "$FIREBASE_CLIENT_CONFIG" > firebase-client-config.json
elif [ -n "$FIREBASE_WEBAPP_CONFIG" ]; then
  echo "✅ FIREBASE_WEBAPP_CONFIG を使用（ローカル開発）"
  echo "$FIREBASE_WEBAPP_CONFIG" > firebase-client-config.json
else
  echo "⚠️  Firebase設定が見つかりません。デフォルト設定を使用します。"
  echo '{}' > firebase-client-config.json
fi

# 設定内容を確認（authDomainのみ表示）
echo "📝 設定内容:"
cat firebase-client-config.json | grep -o '"authDomain":"[^"]*"' || echo "authDomain not found"

echo ""
echo "🏗️  Viteビルドを開始..."
npx vite build

echo ""
echo "🏗️  サーバービルドを開始..."
npx tsc --project tsconfig.server.json

echo "✅ ビルド完了！"
