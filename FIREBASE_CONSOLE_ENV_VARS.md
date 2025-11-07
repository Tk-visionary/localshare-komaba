# Firebase App Hosting: 環境変数の永続的な設定方法

## 問題

Cloud Runコンソールから環境変数を設定しても、Firebase App Hostingが新しいデプロイを行うたびに**新しいリビジョンが作成され、設定が上書きされます**。

**症状:**
- 起動時: 環境変数が存在 ✅
- リクエスト時: 環境変数が消失 ❌
- 原因: 異なるリビジョンが実行されている

---

## 解決策：Firebase Consoleから設定する

### 方法1: Firebase Console UI（推奨）

1. **Firebase Console を開く**
   https://console.firebase.google.com/project/localshare-komaba-54c0d/apphosting

2. **App Hosting バックエンドを選択**
   - `localshare-komaba` をクリック

3. **「Settings」または「Configuration」タブを探す**

4. **「Environment variables」セクションで設定**

   追加する環境変数:
   ```
   GOOGLE_CLIENT_ID = 371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com
   GOOGLE_REDIRECT_URI = https://komabasai.local-share.net/auth/callback
   ALLOWED_ORIGINS = https://komabasai.local-share.net,https://localshare-komaba--localshare-komaba-54c0d.asia-east1.hosted.app
   ```

5. **「Secrets」セクションでシークレットを追加**

   ```
   GOOGLE_CLIENT_SECRET → Secret Manager: GOOGLE_CLIENT_SECRET
   SESSION_SECRET → Secret Manager: SESSION_SECRET
   ```

6. **「Save」または「Deploy」をクリック**

---

### 方法2: Firebase CLI

```bash
# Firebase にログイン
firebase login

# プロジェクトを選択
firebase use localshare-komaba-54c0d

# App Hosting バックエンドの設定を更新
firebase apphosting:secrets:set GOOGLE_CLIENT_SECRET
firebase apphosting:secrets:set SESSION_SECRET
```

**注意:** Firebase CLI の App Hosting コマンドは比較的新しいため、バージョンによっては利用できない可能性があります。

---

### 方法3: gcloud CLI でサービスのデフォルト環境変数を設定

```bash
# 注意: この方法は Firebase App Hosting が上書きする可能性があります

gcloud run services update localshare-komaba \
  --region=asia-east1 \
  --project=localshare-komaba-54c0d \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLIENT_ID=371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com,GOOGLE_REDIRECT_URI=https://komabasai.local-share.net/auth/callback,ALLOWED_ORIGINS=https://komabasai.local-share.net;https://localshare-komaba--localshare-komaba-54c0d.asia-east1.hosted.app" \
  --update-secrets="GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,SESSION_SECRET=SESSION_SECRET:latest"
```

---

## apphosting.yaml が機能しない理由（再確認）

前述の通り、Firebase App Hosting には `apphosting.yaml` から環境変数を読み込まない**既知のバグ**があります（GitHub Issue #8307）。

したがって、現時点では：
1. ❌ `apphosting.yaml` に環境変数を定義 → 動作しない
2. ✅ Firebase Console から設定 → これが正しい方法
3. ⚠️ Cloud Run Console から設定 → 一時的に動作するが、次のデプロイで消える

---

## 最も確実な手順（推奨）

### ステップ1: Firebase Console で環境変数を設定

1. https://console.firebase.google.com/project/localshare-komaba-54c0d/apphosting
2. バックエンドを選択
3. Environment variables を設定
4. Secrets を追加
5. Save/Deploy

### ステップ2: 設定を確認

デプロイ後、Cloud Runログで確認:

```
[App] DIAGNOSTIC - Variable details: {
  GOOGLE_CLIENT_ID: 'EXISTS (length: 72)',     ✅
  GOOGLE_CLIENT_SECRET: 'EXISTS (length: 35)', ✅
  SESSION_SECRET: 'EXISTS (length: 64)',       ✅
}
```

### ステップ3: ログインをテスト

環境変数が正しく設定されていれば：

```
[Auth] === /auth/google endpoint HIT ===
[Auth] DETAILED Environment check: {
  hasClientId: true,        ✅
  hasClientSecret: true,    ✅
  ...
}
[Auth] OAuth2Client created successfully
[Auth] Redirecting to Google OAuth
```

---

## トラブルシューティング

### 問題: Firebase Console に環境変数設定が見つからない

**理由:** Firebase App Hosting の UI は頻繁に更新されています。

**解決策:**
1. 「Settings」「Configuration」「環境」「Variables」などのタブを探す
2. または、一時的に Cloud Run Console で設定し、すぐにテスト
3. その後、次回デプロイ前に Firebase Console で正式に設定

### 問題: 設定しても環境変数が読み込まれない

**確認事項:**
1. Secret Manager の権限は正しいか？
   - サービスアカウント: `service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com`
   - ロール: `roles/secretmanager.secretAccessor`

2. シークレットは存在するか？
   ```bash
   gcloud secrets list --project=localshare-komaba-54c0d
   ```

3. 正しいリビジョンが実行されているか？
   - Cloud Run Console で最新リビジョンを確認
   - トラフィックが100%最新リビジョンに向いているか確認

---

## まとめ

**問題:**
- Cloud Run Console で設定 → 次のデプロイで消える ❌
- apphosting.yaml で設定 → プラットフォームバグで動作しない ❌

**解決:**
- **Firebase Console で設定** → これが正しい方法 ✅

**手順:**
1. Firebase Console → App Hosting → Backend設定
2. Environment variables を追加
3. Secrets を追加
4. Save/Deploy
5. ログで確認
6. ログインをテスト

---

## 参考リンク

- Firebase Console: https://console.firebase.google.com/project/localshare-komaba-54c0d/apphosting
- Cloud Run Console: https://console.cloud.google.com/run/detail/asia-east1/localshare-komaba?project=localshare-komaba-54c0d
- Secret Manager: https://console.cloud.google.com/security/secret-manager?project=localshare-komaba-54c0d
