# ログイン問題のデバッグ手順

## 現在の状況
- ログインボタンをクリックするとホームに戻る
- `/auth/me` で 401 エラー（これは正常 - ログインしていないため）

## 問題の原因
`/auth/google` エンドポイントが環境変数の不足により失敗している可能性が高いです。

---

## デバッグ手順

### 1. ブラウザの開発者ツールで確認

#### Networkタブを確認:
1. ブラウザで開発者ツールを開く (F12 または 右クリック → 検証)
2. **Network** タブをクリック
3. ログインボタンをクリック
4. `/auth/google` リクエストを探す

**確認ポイント:**
- `/auth/google` のステータスコード: `302` (正常) か `500` (エラー) か
- もし `302` で、Location ヘッダーが `/?auth=config_error` なら → 環境変数が設定されていない
- もし `302` で、Location ヘッダーが Google のURL (accounts.google.com) なら → 正常

#### Consoleタブを確認:
以下のようなログが表示されるはずです:
```
[AuthContext] Redirecting to Google OAuth...
[AuthContext] Target URL: /auth/google
[AuthContext] Executing redirect now...
```

その後、以下のいずれかが表示されます:
```
# エラーの場合:
[AuthContext] User is not logged in

# または、エラーメッセージ:
サーバーの設定エラーです。管理者に連絡してください。
```

---

### 2. サーバーログを確認 (重要！)

#### Cloud Run のログを確認:

1. **Cloud Run Console を開く**
   - https://console.cloud.google.com/run?project=localshare-komaba-54c0d

2. **サービスを選択**
   - `localshare-komaba` サービスをクリック

3. **LOGS タブをクリック**

4. **以下のログを探す:**

**起動時のログ (正常な場合):**
```
[App] OAuth Configuration Check: {
  NODE_ENV: 'production',
  hasGoogleClientId: true,
  hasGoogleClientSecret: true,
  hasSessionSecret: true,
  googleRedirectUri: 'https://komabasai.local-share.net/auth/callback'
}
```

**起動時のログ (問題がある場合):**
```
[App] OAuth Configuration Check: {
  NODE_ENV: 'production',
  hasGoogleClientId: false,  ← ❌ これが false
  hasGoogleClientSecret: false,
  hasSessionSecret: false,
  ...
}
```

**ログインボタンをクリックした時のログ:**
```
# 正常な場合:
[Auth] Initiating Google OAuth flow...
[Auth] Environment check: {
  hasClientId: true,
  hasClientSecret: true,
  redirectUri: 'https://komabasai.local-share.net/auth/callback',
  clientIdPrefix: '371696877911-5bvpkb4...'
}
[Auth] Redirecting to Google OAuth

# 問題がある場合:
[Auth] Initiating Google OAuth flow...
[Auth] Environment check: {
  hasClientId: false,  ← ❌
  hasClientSecret: false,
  redirectUri: 'https://komabasai.local-share.net/auth/callback',
  clientIdPrefix: 'undefined'
}
[Auth] Missing OAuth credentials: {
  GOOGLE_CLIENT_ID: 'MISSING',
  GOOGLE_CLIENT_SECRET: 'MISSING'
}
[Auth] Error generating auth URL: Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set
```

---

### 3. 環境変数の確認

もしサーバーログで `hasGoogleClientId: false` と表示されている場合:

#### 確認A: Secret Manager にシークレットが作成されているか

1. **Secret Manager を開く**
   - https://console.cloud.google.com/security/secret-manager?project=localshare-komaba-54c0d

2. **以下のシークレットが存在するか確認:**
   - ✅ `GOOGLE_CLIENT_SECRET`
   - ✅ `SESSION_SECRET`

**もし存在しない場合:**

```bash
# Secret Manager に作成する
gcloud config set project localshare-komaba-54c0d

echo -n "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" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

echo -n "16b1f2cff8f05befd855af6028951622e5a8f8afee391bd7daa427c23b595291" | \
  gcloud secrets create SESSION_SECRET --data-file=-
```

または、Google Cloud Console で手動で作成してください。

#### 確認B: App Hosting が apphosting.yaml を認識しているか

**apphosting.yaml** が正しく設定されているか確認:

```yaml
runConfig:
  environmentVariables:
    GOOGLE_CLIENT_ID: 371696877911-5bvpkb4laa0evuvm21ad7ftm4t4m6npp.apps.googleusercontent.com
    GOOGLE_REDIRECT_URI: https://komabasai.local-share.net/auth/callback
  secrets:
    - secret: GOOGLE_CLIENT_SECRET
    - secret: SESSION_SECRET
```

#### 確認C: 再デプロイ

シークレットを作成した後、再デプロイが必要です:

```bash
# ブランチに空のコミットをプッシュして再デプロイをトリガー
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

または、Firebase Console から手動で再デプロイを実行してください。

---

## 次のステップ

1. **ブラウザのNetworkタブ**で `/auth/google` のレスポンスを確認
2. **Cloud Run のログ**で環境変数の状態を確認
3. **Secret Manager**でシークレットが存在するか確認
4. もし存在しない場合は作成
5. 再デプロイ
6. もう一度テスト

---

## 確認してほしい情報

以下の情報を教えてください:

1. ブラウザのNetworkタブで `/auth/google` のステータスコードは？
2. Cloud Run のログに表示されている `[App] OAuth Configuration Check` の内容は？
3. Secret Manager に `GOOGLE_CLIENT_SECRET` と `SESSION_SECRET` は存在しますか？

これらの情報があれば、正確な原因を特定できます！
