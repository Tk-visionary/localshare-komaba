#!/bin/bash

# Firebase OAuth設定確認スクリプト
# このスクリプトはgcloud CLIを使用してOAuth 2.0クライアントIDの設定を確認します

echo "🔍 Firebase OAuth設定チェック"
echo "================================"
echo ""

# プロジェクトIDを設定
PROJECT_ID="localshare-komaba-54c0d"

# 現在のプロジェクトを設定
echo "📌 プロジェクトを設定中: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo ""
echo "🔑 OAuth 2.0クライアントIDの一覧を取得中..."
echo ""

# OAuth clientsの一覧を取得
# 注意: この情報はAPI経由でのみアクセス可能です
# gcloud alpha iap oauth-clients list を使用

# まず、利用可能なOAuth clientsを確認
# OAuth clients は secrets manager や Identity Platform APIを通じて管理されています
# 直接的なgcloudコマンドはないため、APIを使用する必要があります

echo "⚠️  注意: OAuth 2.0クライアントIDの詳細設定は、gcloud CLIでは直接取得できません。"
echo "以下の方法で確認してください："
echo ""
echo "方法1: Google Cloud Console（推奨）"
echo "  1. https://console.cloud.google.com/ を開く"
echo "  2. プロジェクト '$PROJECT_ID' を選択"
echo "  3. 左メニュー「APIとサービス」→「認証情報」"
echo "  4. OAuth 2.0 クライアントIDをクリック"
echo ""
echo "方法2: REST APIを使用"
echo "  以下のコマンドでプロジェクトの認証情報を取得できます："
echo ""
echo "  gcloud auth application-default print-access-token | \\"
echo "    xargs -I {} curl -H \"Authorization: Bearer {}\" \\"
echo "    \"https://oauth2.googleapis.com/tokeninfo\""
echo ""
echo "方法3: Firebase CLI"
echo "  firebase projects:list"
echo ""

# プロジェクトの基本情報を表示
echo "📋 プロジェクト基本情報:"
gcloud projects describe $PROJECT_ID --format="table(projectId,name,projectNumber)"

echo ""
echo "🌐 Firebase Hosting ドメイン:"
# Firebase CLIが利用可能な場合
if command -v firebase &> /dev/null; then
    firebase hosting:sites:list --project=$PROJECT_ID
else
    echo "⚠️  Firebase CLIがインストールされていません"
    echo "インストール: npm install -g firebase-tools"
fi

echo ""
echo "================================"
echo "✅ 確認を完了しました"
echo ""
echo "OAuth設定の詳細確認は、Google Cloud Consoleで行ってください。"
echo "FIREBASE_CONSOLE_CHECK.md を参照してください。"
