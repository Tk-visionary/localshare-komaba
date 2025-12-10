# LocalShare 駒場祭ver

駒場祭でフードロス削減を実現するプラットフォーム。屋台運営者が余剰食材・物品を簡単出品、購入者はログイン不要で対面取引。

## 技術スタック

- **フロントエンド**: React, TypeScript, Tailwind CSS, TanStack Query
- **バックエンド**: Express.js, TypeScript
- **インフラ**: Firebase (Auth, Firestore, Storage, App Hosting, Functions)
- **画像処理**: Sharp (WebP変換・圧縮)

## ローカル開発

### 前提条件

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### セットアップ

```bash
# 依存関係インストール
npm install

# Firebase設定ファイルを配置
# firebase-client-config.json をプロジェクトルートに配置

# 開発サーバー起動
npm run dev
```

## デプロイ

Firebase App Hostingで自動デプロイ。mainブランチへのpushでデプロイがトリガーされる。

---

## 環境構築ガイド（初回のみ）

### 1. Google Cloud Secret Manager

以下のシークレットをSecret Managerに作成：

| シークレット名 | 用途 |
|----------------|------|
| `GOOGLE_CLIENT_SECRET` | OAuth認証用 |
| `SESSION_SECRET` | セッション暗号化用 |

#### gcloud CLIでの作成

```bash
# プロジェクト設定
gcloud config set project <YOUR_PROJECT_ID>

# シークレット作成
echo -n "<YOUR_CLIENT_SECRET>" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
echo -n "<YOUR_SESSION_SECRET>" | gcloud secrets create SESSION_SECRET --data-file=-
```

#### 確認

```bash
gcloud secrets list --project=<YOUR_PROJECT_ID>
```

---

### 2. Firebase App Hosting 環境変数

**重要**: `apphosting.yaml`での環境変数設定は既知のバグで動作しない。Firebase Consoleから設定する。

#### 設定手順

1. Firebase Console → App Hosting → バックエンド選択
2. 「Environment variables」セクションで以下を追加：

| 変数名 | 値 |
|--------|-----|
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_REDIRECT_URI` | `https://your-domain.com/auth/callback` |
| `ALLOWED_ORIGINS` | 許可するオリジン（カンマ区切り） |

3. 「Secrets」セクションでSecret Managerのシークレットを参照：
   - `GOOGLE_CLIENT_SECRET` → Secret Manager
   - `SESSION_SECRET` → Secret Manager

4. Save/Deploy

---

### 3. メール通知（Firebase Functions）

新商品登録時にメール通知を送信する機能。

#### セットアップ

```bash
cd functions
npm install
```

#### 環境変数設定

`functions/.env` を作成：

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=<YOUR_APP_PASSWORD>
NOTIFICATION_EMAIL=notification-recipient@example.com
```

**Gmailアプリパスワードの取得**:
1. Googleアカウント → セキュリティ → 2段階認証を有効化
2. アプリパスワード → 新規作成

#### デプロイ

```bash
cd functions
npm run build
firebase deploy --only functions
```

#### 確認

Firebase Console → Functions → `onItemCreated` が表示されていればOK

---

## トラブルシューティング

### 環境変数が読み込まれない

1. Secret Managerの権限を確認
   - サービスアカウントに `roles/secretmanager.secretAccessor` が必要
2. 正しいリビジョンが実行されているか確認（Cloud Run Console）

### メールが届かない

```bash
firebase functions:log
```

でログを確認。

### ビルドエラー

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## プロジェクト構成

```
├── components/       # Reactコンポーネント
├── pages/           # ページコンポーネント
├── services/        # API・Firebase関連
├── contexts/        # React Context
├── routes/          # Express APIルート
├── functions/       # Firebase Functions
├── types/           # TypeScript型定義
└── app.ts           # Expressサーバー
```

---

## ライセンス

MIT License

&copy; 2025 LocalShare Project
