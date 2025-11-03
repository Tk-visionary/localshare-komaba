# authDomain問題の修正方法

## 問題

現在の設定：
- **authDomain**: `localshare-komaba-54c0d.firebaseapp.com`
- **実際のアプリURL**: `komabasai.local-share.net`

`/__/auth/handler`はauthDomainのドメインでのみ動作するため、カスタムドメインでは機能しません。

## 解決方法1：環境変数を確認・修正（推奨）

authDomainをカスタムドメインに設定します。

### 手順

1. `.env`ファイル（または本番環境の環境変数）を確認

2. `VITE_FIREBASE_AUTH_DOMAIN`を以下に変更：
   ```
   VITE_FIREBASE_AUTH_DOMAIN=komabasai.local-share.net
   ```

3. アプリを再ビルド・再デプロイ

### 注意事項

⚠️ **authDomainをカスタムドメインに変更する場合、Firebase Hostingの設定が必要です**

Firebase ConsoleでCustom domainとして設定されていることを確認してください：
1. [Firebase Console](https://console.firebase.google.com/project/localshare-komaba-54c0d/hosting/sites)
2. Hosting → ドメイン
3. `komabasai.local-share.net` が接続済みであることを確認

## 解決方法2：デフォルトドメインを使用（一時的）

開発・テスト用に、カスタムドメインではなくFirebaseのデフォルトドメインを使う：

アプリのURL: `https://localshare-komaba-54c0d.firebaseapp.com` でアクセス

この場合、authDomainとアプリのドメインが一致するため、`/__/auth/handler`が正しく動作します。

## 解決方法3：signInWithRedirectに完全移行

ポップアップを諦めて、完全にリダイレクトフローに切り替える。

ただし、これも authDomain の問題があるため、方法1または2が必要です。

## 確認方法

修正後、以下のログを確認：

```javascript
// ブラウザのコンソールで実行
console.log('Auth Domain:', firebase.auth().app.options.authDomain);
console.log('Current Domain:', window.location.hostname);
```

これらが一致していれば、認証が正しく動作します。

## 推奨設定

本番環境：
```env
VITE_FIREBASE_AUTH_DOMAIN=komabasai.local-share.net
```

開発環境：
```env
VITE_FIREBASE_AUTH_DOMAIN=localshare-komaba-54c0d.firebaseapp.com
# または
VITE_FIREBASE_AUTH_DOMAIN=localhost:5151
```

## 参考

- [Firebase Auth - Custom Auth Domain](https://firebase.google.com/docs/auth/web/custom-auth-domain)
- [Firebase Hosting - Custom Domain](https://firebase.google.com/docs/hosting/custom-domain)
