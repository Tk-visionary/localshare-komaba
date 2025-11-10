# Cloud Functions セットアップガイド

このディレクトリには、Firestore itemsコレクションに新商品が追加されたときにメール通知を送信するCloud Functionsが含まれています。

## 機能

- **onItemCreated**: itemsコレクションに新しいドキュメントが作成されたときに自動実行
- 商品情報を整形してHTMLメールで送信
- Gmail経由でメール送信（nodemailer使用）

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd functions
npm install
```

### 2. 環境変数ファイルの設定

`functions/.env` ファイルを作成します（既に作成済みの場合はスキップ）：

```bash
# functions/.env
GMAIL_USER=taishi14ki@gmail.com
GMAIL_APP_PASSWORD=xrhgkopcmatltrsd
NOTIFICATION_EMAIL=taishi14ki@gmail.com
```

**重要**:
- `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません
- アプリパスワードはスペースなしで入力してください

### 3. 環境変数の確認

`.env` ファイルが正しく配置されていることを確認：

```bash
cat functions/.env
```

### 4. ビルド

```bash
npm run build
```

### 5. デプロイ

```bash
firebase deploy --only functions
```

または、プロジェクトルートから：

```bash
cd functions && npm run deploy
```

## ローカルテスト

Firebase Emulatorでローカルテスト：

```bash
# .env ファイルが配置されていることを確認
ls -la .env

# Emulator起動（.env ファイルは自動的に読み込まれます）
npm run serve
```

## トラブルシューティング

### エラー: "GMAIL_APP_PASSWORD is not set"

環境変数が設定されていません。`functions/.env` ファイルを確認してください。

### メールが送信されない

1. Gmailのアプリパスワードが正しいか確認
2. Cloud Functions のログを確認：
   ```bash
   npm run logs
   ```
   または Firebase Console → Functions → ログ

3. Gmail の「安全性の低いアプリのアクセス」設定を確認（通常はアプリパスワードを使用している場合は不要）

### デプロイエラー: "Requires billing account"

Cloud Functions（第2世代）は課金アカウントが必要です。Firebase Consoleで課金を有効化してください。

## メール内容のカスタマイズ

`src/index.ts` の `mailOptions.html` セクションを編集することで、メールの見た目や内容をカスタマイズできます。

## 通知先の変更

`functions/.env` ファイルの `NOTIFICATION_EMAIL` を変更：

```bash
NOTIFICATION_EMAIL=your-new-email@example.com
```

複数のメールアドレスに送信する場合：

```bash
NOTIFICATION_EMAIL=email1@example.com, email2@example.com
```

## コスト

- Cloud Functions: 月200万回の呼び出しまで無料
- 駒場祭期間中の商品登録数を考えると、ほぼ無料で運用可能

## セキュリティ

- Gmailアプリパスワードは `.env` ファイルに保存
- `.env` ファイルは `.gitignore` に含まれており、Gitにコミットされません
- デプロイ時に Firebase Functions の環境変数として自動的に設定されます
- アプリパスワードは Google アカウントの「セキュリティ」からいつでも削除可能
