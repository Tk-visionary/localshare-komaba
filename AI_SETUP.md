# AI機能のセットアップガイド

このガイドでは、商品説明の自動生成機能（Vertex AI）のセットアップ方法を説明します。

## 機能概要

- **商品説明の自動生成**: 商品名、カテゴリ、価格などから魅力的な説明文を自動生成
- **使用モデル**: Gemini 1.5 Flash（高速で効率的なモデル）
- **認証方式**: Google Cloud のサービスアカウント認証（APIキー不要）
- **使用回数制限**: ユーザーあたり1日3回まで利用可能
- **プロンプトチューニング**: 駒場祭の雰囲気に合った文体で生成

## セットアップ手順

### 1. Vertex AI APIの有効化

[Vertex AI APIを有効化](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com) ← クリックして「有効にする」

または gcloud CLI から：

```bash
gcloud services enable aiplatform.googleapis.com
```

### 2. サービスアカウントの権限確認

Firebase App Hosting のサービスアカウントに Vertex AI へのアクセス権限が必要です。

**必要な権限**: `Vertex AI User` （通常は自動的に付与されています）

確認方法：
1. [IAM & Admin](https://console.cloud.google.com/iam-admin/iam) を開く
2. `firebase-app-hosting-compute@localshare-komaba-54c0d.iam.gserviceaccount.com` を探す
3. `Vertex AI User` または `Vertex AI Service Agent` ロールがあることを確認

もし権限がない場合は追加：

```bash
gcloud projects add-iam-policy-binding localshare-komaba-54c0d \
  --member="serviceAccount:firebase-app-hosting-compute@localshare-komaba-54c0d.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 3. 依存関係のインストール

```bash
npm install
```

これにより、`@google-cloud/vertexai` パッケージがインストールされます。

### 4. 動作確認

#### 本番環境（Firebase App Hosting）

1. コードをプッシュ（自動デプロイが開始）
2. デプロイ完了後、商品登録ページにアクセス
3. 商品名とカテゴリを入力
4. 「✨ AIで生成」ボタンをクリック
5. 説明文が自動生成されることを確認

#### ローカル開発環境

ローカルでテストする場合、Google Cloud の認証情報が必要です：

```bash
gcloud auth application-default login
```

その後、サーバーを起動：

```bash
npm run dev
```

## 使用方法

### フロントエンド（ユーザー視点）

1. 商品登録ページで商品名とカテゴリを入力
2. （推奨）価格や出店団体名も入力すると、より精度の高い説明が生成されます
3. 「✨ AIで生成」ボタンをクリック
4. 生成された説明文が自動で入力される
5. 必要に応じて編集可能
6. 1日3回まで利用可能

### API仕様

#### POST /api/ai/generate-description

**リクエスト**:
```json
{
  "name": "たこ焼き",
  "category": "飲食物",
  "price": 300,
  "exhibitorName": "駒場たこ焼き研究会"
}
```

**レスポンス**:
```json
{
  "description": "駒場祭名物のふわふわたこ焼きです。外はカリッと、中はトロッとした食感が特徴です。",
  "remaining": 2
}
```

**エラーレスポンス** (429 Too Many Requests):
```json
{
  "error": "本日の生成回数の上限に達しました。明日また利用できます。",
  "remaining": 0
}
```

#### GET /api/ai/usage

**レスポンス**:
```json
{
  "remaining": 2,
  "used": 1,
  "limit": 3
}
```

## プロンプトのカスタマイズ

`services/aiService.ts` の `createPrompt` 関数でプロンプトをカスタマイズできます。

駒場祭向けに最適化された現在のプロンプト：
- 2〜3文程度の簡潔な説明
- 親しみやすい「です・ます調」
- 商品の魅力を強調
- 実在しない詳細情報は追加しない

## トラブルシューティング

### 403 Forbidden エラー

**症状**: 「Method doesn't allow unregistered callers」エラー

**原因**:
1. Vertex AI API が有効化されていない
2. サービスアカウントに権限がない

**解決方法**:
1. [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com) を有効化
2. サービスアカウントに `Vertex AI User` ロールを付与（上記参照）
3. デプロイを待つ（設定変更後は再デプロイが必要）

### 認証エラー（ローカル開発時）

**症状**: 「Could not load the default credentials」エラー

**解決方法**:
```bash
gcloud auth application-default login
```

### 429エラー（制限超過）

**症状**: 「本日の生成回数の上限に達しました」エラー

**解決方法**:
1. 翌日まで待つ（日付が変わると自動リセット）
2. または `routes/ai.ts` の `MAX_GENERATIONS_PER_DAY` を変更（開発時のみ）

### 生成が遅い

**症状**: ボタンを押してから数秒かかる

**解決方法**:
- これは正常動作です（Vertex AI の応答時間: 通常 1-3秒）
- ローディングスピナーが表示されます

## コスト管理

### Vertex AI の料金

- **gemini-1.5-flash**: 入力 $0.075/100万文字、出力 $0.30/100万文字
- **この実装での使用量**: 約500文字/回（入力+出力）
- **想定**: 30ユーザー × 3回/日 = 90回/日 ≈ 45,000文字/日
- **月間コスト**: 約 $0.50 - $1.00 程度

### 無料枠

Google Cloudの新規アカウントには $300 の無料クレジットが付与されます。

### 使用量の監視

[Google Cloud Console の請求](https://console.cloud.google.com/billing) で使用量を確認できます。

## セキュリティ

### 認証方式の利点

- **APIキー不要**: Secret Manager の設定・管理が不要
- **IAMで管理**: Google Cloud の標準的な権限管理
- **漏洩リスクゼロ**: コードにもログにも認証情報が含まれない

### 使用回数制限

- Firestoreに記録（`ai_usage` コレクション）
- ユーザーIDと日付でドキュメント管理
- 自動的に日次リセット

### 認証

- すべてのAI APIエンドポイントは認証必須
- `authMiddleware` で保護

## 実装ファイル

- `services/aiService.ts`: Vertex AI呼び出しとプロンプト管理
- `routes/ai.ts`: APIエンドポイントと使用回数制限
- `services/itemApi.ts`: フロントエンドAPI呼び出し関数
- `components/ItemForm.tsx`: UI実装（生成ボタン）
- `app.ts`: ルート設定

## Vertex AI と Gemini API の比較

| 項目 | Vertex AI | Gemini API |
|------|-----------|------------|
| 認証方式 | サービスアカウント | APIキー |
| セットアップ | 簡単（権限のみ） | やや複雑（APIキー管理） |
| セキュリティ | 高い | 中程度（キー漏洩リスク） |
| 本番環境向け | ◎ | △ |
| 料金 | 従量課金 | 無料枠あり（制限付き） |

**このプロジェクトでは Vertex AI を採用しています。**

## サポート

問題が発生した場合は、以下を確認してください：

1. Cloud Logsでエラーメッセージを確認
2. IAM権限の確認
3. Vertex AI APIが有効化されているか
4. Firestore の `ai_usage` コレクション
