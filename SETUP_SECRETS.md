# Google Cloud Secret Manager セットアップ手順

このファイルには、OAuth認証に必要なシークレットをGoogle Cloud Secret Managerに作成する手順が記載されています。

## 必要なシークレット

以下の2つのシークレットを作成する必要があります：

1. **GOOGLE_CLIENT_SECRET**: `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`
2. **SESSION_SECRET**: `16b1f2cff8f05befd855af6028951622e5a8f8afee391bd7daa427c23b595291`

---

## 方法1: Google Cloud Console (GUI)

### 手順:

1. **Google Cloud Console** を開く
   - https://console.cloud.google.com/

2. **プロジェクトを選択**
   - `localshare-komaba-54c0d` を選択

3. **Secret Manager** に移動
   - 左メニューから「Security」→「Secret Manager」
   - または、検索バーで「Secret Manager」と入力

4. **GOOGLE_CLIENT_SECRET を作成**
   - 「CREATE SECRET」をクリック
   - **Name**: `GOOGLE_CLIENT_SECRET`
   - **Secret value**: `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`
   - 「CREATE SECRET」をクリック

5. **SESSION_SECRET を作成**
   - 「CREATE SECRET」をクリック
   - **Name**: `SESSION_SECRET`
   - **Secret value**: `16b1f2cff8f05befd855af6028951622e5a8f8afee391bd7daa427c23b595291`
   - 「CREATE SECRET」をクリック

---

## 方法2: gcloud CLI コマンド

ローカル環境でgcloud CLIを使用している場合は、以下のコマンドを実行してください：

```bash
# Google Cloud プロジェクトを設定
gcloud config set project localshare-komaba-54c0d

# GOOGLE_CLIENT_SECRET を作成
echo -n "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" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# SESSION_SECRET を作成
echo -n "16b1f2cff8f05befd855af6028951622e5a8f8afee391bd7daa427c23b595291" | gcloud secrets create SESSION_SECRET --data-file=-
```

### シークレットが既に存在する場合は、バージョンを追加：

```bash
# GOOGLE_CLIENT_SECRET を更新
echo -n "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" | gcloud secrets versions add GOOGLE_CLIENT_SECRET --data-file=-

# SESSION_SECRET を更新
echo -n "16b1f2cff8f05befd855af6028951622e5a8f8afee391bd7daa427c23b595291" | gcloud secrets versions add SESSION_SECRET --data-file=-
```

---

## 方法3: Firebase CLI

Firebase CLIを使用している場合：

```bash
# Firebase プロジェクトを設定
firebase use localshare-komaba-54c0d

# Secret Manager APIが有効になっていることを確認
gcloud services enable secretmanager.googleapis.com

# その後、方法2のgcloudコマンドを実行
```

---

## 確認

シークレットが正しく作成されたか確認するには：

### Google Cloud Console:
1. Secret Manager のページで、`GOOGLE_CLIENT_SECRET` と `SESSION_SECRET` が表示されることを確認

### gcloud CLI:
```bash
gcloud secrets list --project=localshare-komaba-54c0d
```

出力例：
```
NAME                    CREATED              REPLICATION_POLICY  LOCATIONS
FIREBASE_SERVICE_ACCOUNT  2024-xx-xx Txx:xx:xx  automatic           -
FIREBASE_WEBAPP_CONFIG    2024-xx-xx Txx:xx:xx  automatic           -
GOOGLE_CLIENT_SECRET      2024-xx-xx Txx:xx:xx  automatic           -
SESSION_SECRET            2024-xx-xx Txx:xx:xx  automatic           -
```

---

## 注意事項

- シークレットは機密情報です。絶対にGitにコミットしないでください
- `apphosting.yaml` には既にシークレットの参照が追加されています
- App Hostingが自動的にこれらのシークレットを環境変数として読み込みます

---

## トラブルシューティング

### エラー: "Permission denied"
→ プロジェクトに対する Secret Manager の権限があるか確認してください

### エラー: "Secret already exists"
→ `gcloud secrets versions add` を使用してバージョンを追加してください

### Secret Manager API が有効になっていない場合:
```bash
gcloud services enable secretmanager.googleapis.com --project=localshare-komaba-54c0d
```

---

**セットアップ完了後、このファイルは削除しても構いません。**
