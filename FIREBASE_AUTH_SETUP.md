# Firebase認証の設定と動作

## アプリの認証方式

このアプリは**Firebase App Hosting**を使用しています。App Hostingでは`/__/auth/handler`が提供されないため、**ポップアップ認証のみ**を使用します。

## 認証フロー

### ログインボタンをクリック
1. ユーザーアクションから**即座に**ポップアップが開きます
2. Googleアカウント選択画面が表示されます
3. アカウントを選択するとポップアップが閉じます
4. ログイン完了

### 認証状態の永続化

- アプリ起動時に`setPersistence(browserLocalPersistence)`を実行
- これにより、ページリロードやブラウザ再起動後もログイン状態が維持されます

## ポップアップがブロックされる場合

モバイルブラウザでポップアップがブロックされる場合：

1. **ブラウザの設定を確認**
   - サイトのポップアップを許可に設定してください
   - Chrome (Android): 設定 > サイトの設定 > ポップアップとリダイレクト
   - Safari (iOS): 設定 > Safari > ポップアップブロック

2. **プライベートモード/シークレットモードを使用しない**
   - これらのモードではポップアップがより厳しくブロックされます

3. **別のブラウザを試す**
   - Chrome、Safari、Firefoxなど、別のブラウザで試してください

## Firebase Console設定

### 承認済みドメイン

カスタムドメインを使用する場合は、Firebase Consoleで承認済みドメインに追加してください：

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `localshare-komaba-54c0d` を選択
3. Authentication > Settings > Authorized domains
4. `komabasai.local-share.net` を追加

**注意**: App Hostingではリダイレクト認証は使用できません。承認済みドメインの追加は、ポップアップ認証の正常動作に必要です。

## トラブルシューティング

### `auth/popup-closed-by-user` エラー

**原因**: ポップアップがブラウザによってブロックされています

**解決策**:
1. サイトのポップアップを許可
2. HTTPSを使用（ローカル開発では`localhost`を使用）
3. ユーザーアクションから直接認証を開始（ボタンクリック等）

### ログイン状態が維持されない

**原因**: `setPersistence`が失敗している可能性があります

**解決策**:
1. ブラウザのコンソールでエラーを確認
2. ローカルストレージが有効か確認
3. プライベートモードを使用していないか確認

## 開発者向け情報

### 認証フローの実装

```typescript
// アプリ起動時
await setPersistence(auth, browserLocalPersistence);

// ログイン時
const result = await signInWithPopup(auth, googleProvider);
```

### なぜリダイレクト方式を使わないのか

1. **App Hostingの制約**: `/__/auth/handler`が提供されない
2. **シンプルさ**: ポップアップのみの方が実装がシンプル
3. **ユーザー体験**: 最新のモバイルブラウザはポップアップをサポート

## 参考リンク

- [Firebase Authentication - Popup](https://firebase.google.com/docs/auth/web/google-signin#popup)
- [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
