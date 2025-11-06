# Secret Manager 権限設定ガイド

## 問題の原因
シークレットは作成されているが、App Hosting のサービスアカウントに読み取り権限がないため、
環境変数として読み込まれていない。

## 解決方法

### 方法1: gcloud CLI (推奨 - 最も確実)

以下のコマンドを実行して、App Hosting のサービスアカウントに権限を付与してください：

```bash
# プロジェクトIDを設定
PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"

# App Hosting の実際のサービスアカウント (Cloud Run ログから確認)
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"

# GOOGLE_CLIENT_SECRET への読み取り権限を付与
gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"

# SESSION_SECRET への読み取り権限を付与
gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}"

echo "✅ 権限設定完了！"
```

---

### 方法2: Google Cloud Console (GUI)

#### 手順:

1. **Secret Manager を開く**
   - https://console.cloud.google.com/security/secret-manager?project=localshare-komaba-54c0d

2. **GOOGLE_CLIENT_SECRET を選択**
   - リストから `GOOGLE_CLIENT_SECRET` をクリック

3. **PERMISSIONS タブをクリック**

4. **GRANT ACCESS をクリック**

5. **プリンシパルを追加:**
   ```
   New principals: service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com
   ```

6. **ロールを選択:**
   ```
   Role: Secret Manager Secret Accessor
   ```

7. **SAVE をクリック**

8. **同じ手順を SESSION_SECRET にも繰り返す**

---

### 方法3: すべてのシークレットに一括で権限付与 (最も簡単)

もし複数のシークレットがある場合、プロジェクトレベルで権限を付与することもできます：

```bash
PROJECT_ID="localshare-komaba-54c0d"
PROJECT_NUMBER="371696877911"
SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-firebaseapphosting.iam.gserviceaccount.com"

# プロジェクト全体の Secret Manager Accessor 権限を付与
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 確認方法

権限が正しく設定されているか確認するには：

```bash
# GOOGLE_CLIENT_SECRET の権限を確認
gcloud secrets get-iam-policy GOOGLE_CLIENT_SECRET --project=localshare-komaba-54c0d

# SESSION_SECRET の権限を確認
gcloud secrets get-iam-policy SESSION_SECRET --project=localshare-komaba-54c0d
```

以下のような出力が表示されれば成功：
```yaml
bindings:
- members:
  - serviceAccount:service-371696877911@gcp-sa-firebaseapphosting.iam.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
```

---

## 再デプロイ

権限を設定したら、**必ず再デプロイ**してください：

```bash
# 空のコミットでデプロイをトリガー
git commit --allow-empty -m "chore: trigger redeploy after secret permissions"
git push
```

または、Firebase Console から手動でロールアウトを実行。

---

## 期待される動作

再デプロイ後、Cloud Run ログに以下が表示されるはずです：

```
[App] OAuth Configuration Check: {
  NODE_ENV: 'production',
  hasGoogleClientId: true,       ← ✅ true になる
  hasGoogleClientSecret: true,   ← ✅ true になる
  hasSessionSecret: true,        ← ✅ true になる
  googleRedirectUri: 'https://komabasai.local-share.net/auth/callback'
}
```

そして、ログインボタンをクリックすると Google の認証画面に遷移します！
