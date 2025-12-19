#!/bin/bash
set -e

echo "🔥 Firebase クライアント設定を準備中..."

# Debug: 環境変数の確認
echo "📊 デバッグ: 環境変数の確認"
if [ -n "$FIREBASE_CLIENT_CONFIG" ]; then
  echo "  FIREBASE_CLIENT_CONFIG: 設定済み (長さ: ${#FIREBASE_CLIENT_CONFIG})"
else
  echo "  FIREBASE_CLIENT_CONFIG: 未設定"
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
