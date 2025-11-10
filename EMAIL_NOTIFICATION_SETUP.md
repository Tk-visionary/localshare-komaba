# メール通知セットアップガイド

新商品が登録されたときに自動でメール通知を受け取る機能のセットアップ方法です。

## 概要

- **トリガー**: Firestore `items` コレクションに新しいドキュメントが追加されたとき
- **送信方法**: Gmail (nodemailer)
- **送信先**: taishi14ki@gmail.com
- **内容**: 商品の詳細情報（名前、価格、カテゴリ、出店情報、登録者情報など）

## セットアップ手順

### 1. functionsディレクトリに移動して依存関係をインストール

```bash
cd functions
npm install
```

### 2. Gmail アプリパスワードを環境変数ファイルに設定

`functions/.env` ファイルが既に作成されています。内容を確認してください：

```bash
cat functions/.env
```

以下の内容が含まれているはずです：
```
GMAIL_USER=taishi14ki@gmail.com
GMAIL_APP_PASSWORD=xrhgkopcmatltrsd
NOTIFICATION_EMAIL=taishi14ki@gmail.com
```

**注意**: このファイルは `.gitignore` に含まれているため、Gitにコミットされません。

### 3. 環境変数の確認

`.env` ファイルが正しく配置されていることを確認：

```bash
ls -la functions/.env
```

### 4. ビルド

```bash
cd functions
npm run build
```

### 5. デプロイ

**方法1: functions のみデプロイ**
```bash
firebase deploy --only functions
```

**方法2: functions ディレクトリから**
```bash
cd functions
npm run deploy
```

### 6. デプロイ完了を確認

Firebase Console で確認：
1. [Firebase Console](https://console.firebase.google.com/project/localshare-komaba-54c0d/functions)
2. Functions タブ
3. `onItemCreated` が表示されていればOK

## 動作確認

### テスト方法1: アプリから商品を登録

1. アプリにログイン
2. 新しい商品を登録
3. 数秒後に taishi14ki@gmail.com にメールが届く

### テスト方法2: Firebase Console から直接追加

1. [Firestore Console](https://console.firebase.google.com/project/localshare-komaba-54c0d/firestore)
2. `items` コレクションを選択
3. 「ドキュメントを追加」をクリック
4. 必要なフィールドを入力して保存
5. メールが届くことを確認

## メール内容

以下の情報が含まれます：

- 🎉 商品名（件名にも表示）
- 💰 価格
- 📦 カテゴリ
- 📝 商品説明
- 🏪 出店団体名
- 📍 エリア・場所
- 👤 登録者の名前
- 📧 登録者のメールアドレス
- 🕒 登録日時
- 売り切れバッジ（該当時）
- アプリへのリンク

HTMLメールで見やすく整形されています。

## トラブルシューティング

### メールが届かない

**1. Functions のログを確認**

```bash
firebase functions:log
```

または、[Firebase Console → Functions → ログ](https://console.firebase.google.com/project/localshare-komaba-54c0d/functions/logs)

**2. 環境変数を確認**

```bash
firebase functions:config:get
```

`gmail.password` が設定されているか確認。

**3. Gmail のセキュリティ設定を確認**

- アプリパスワードが有効か確認
- Google アカウント → セキュリティ → 2段階認証 → アプリパスワード

### デプロイエラー

**エラー: "Requires billing account"**

Cloud Functions（第2世代）は課金アカウントが必要です。
- [Firebase Console](https://console.firebase.google.com/project/localshare-komaba-54c0d/overview) → 左下の⚙️ → 使用量と請求額
- 「Blazeプランにアップグレード」

**注意**: Cloud Functions は月200万回まで無料なので、実質的なコストはほぼゼロです。

### ビルドエラー

```bash
cd functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

## カスタマイズ

### 通知先を変更

`functions/src/index.ts` の以下を編集：

```typescript
const NOTIFICATION_EMAIL = 'your-email@example.com';
```

### メール内容を変更

`functions/src/index.ts` の `mailOptions.html` セクションを編集。

### 複数宛先に送信

```typescript
const NOTIFICATION_EMAIL = 'email1@example.com, email2@example.com';
```

## コスト

- **Cloud Functions**: 月200万回まで無料
- **予想**: 駒場祭期間中、1日100商品登録としても無料枠内
- **Gmail**: 無料（アプリパスワード使用）

## セキュリティ

✅ **Gmailアプリパスワードは安全に保管**
- Firebase Functions の環境変数として暗号化保存
- コードにハードコードされていない
- Gitにコミットされない

✅ **アプリパスワードの無効化**
- いつでも [Googleアカウント](https://myaccount.google.com/apppasswords) から削除可能
- 削除すると即座にメール送信が停止

## サポート

問題が発生した場合：
1. Functions のログを確認
2. `functions/README.md` を参照
3. Firebase Console のエラーメッセージを確認
