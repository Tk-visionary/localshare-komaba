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

### 2. Gmail アプリパスワードの設定

Firebase Functions の環境変数として、Gmailのアプリパスワードを設定します：

```bash
firebase functions:config:set gmail.password="xrhg kocp matl trsd"
```

**重要**: スペースなしで16文字をそのまま入力してください（スペースがあっても動作しますが、なしの方が確実です）。

### 3. 環境変数の確認

設定されているか確認：

```bash
firebase functions:config:get
```

出力例：
```json
{
  "gmail": {
    "password": "xrhg kocp matl trsd"
  }
}
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
# 環境変数をローカルに保存
firebase functions:config:get > .runtimeconfig.json

# Emulator起動
npm run serve
```

## トラブルシューティング

### エラー: "gmail.password is not set"

環境変数が設定されていません。手順2を実行してください。

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

`src/index.ts` の以下の行を変更：

```typescript
const NOTIFICATION_EMAIL = 'taishi14ki@gmail.com';
```

複数のメールアドレスに送信する場合：

```typescript
const NOTIFICATION_EMAIL = 'email1@example.com, email2@example.com';
```

## コスト

- Cloud Functions: 月200万回の呼び出しまで無料
- 駒場祭期間中の商品登録数を考えると、ほぼ無料で運用可能

## セキュリティ

- Gmailアプリパスワードは Firebase Functions の環境変数として安全に保存
- コードにハードコードされていません
- アプリパスワードは Google アカウントの「セキュリティ」からいつでも削除可能
