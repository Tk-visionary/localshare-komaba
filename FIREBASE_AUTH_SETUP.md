# Firebase認証でカスタムドメインを使用するための設定

## 問題

カスタムドメイン（`komabasai.local-share.net`）でGoogle認証のリダイレクトを使用すると、`/__/auth/handler`が正しく動作せず、認証が失敗します。

## 解決方法

Firebase Consoleでカスタムドメインを「承認済みドメイン」に追加する必要があります。

## 設定手順

### 1. Firebase Consoleにアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `localshare-komaba-54c0d` を選択

### 2. 認証設定を開く

1. 左側メニューから「Authentication」（認証）をクリック
2. 上部タブから「Settings」（設定）をクリック
3. 「Authorized domains」（承認済みドメイン）セクションまでスクロール

### 3. カスタムドメインを追加

1. 「Add domain」（ドメインを追加）ボタンをクリック
2. カスタムドメインを入力：`komabasai.local-share.net`
3. 「Add」（追加）ボタンをクリック

### 4. 確認

承認済みドメインリストに以下が含まれていることを確認：
- `localhost`
- `localshare-komaba-54c0d.firebaseapp.com`
- `komabasai.local-share.net` ← 新しく追加

## 設定後の動作

この設定により：
1. カスタムドメインで`/__/auth/handler`が正しく動作するようになります
2. モバイルでポップアップがブロックされた場合、リダイレクト方式が自動的に使用されます
3. リダイレクト後、正しくログイン状態が維持されます

## 注意事項

- ドメインの追加には管理者権限が必要です
- 変更は即座に反映されます（再デプロイ不要）
- 複数のカスタムドメインがある場合は、すべて追加してください

## トラブルシューティング

### ポップアップがブロックされる場合

モバイルブラウザでポップアップがブロックされた場合、自動的にリダイレクト方式にフォールバックします。ログに以下が表示されます：

```
[AuthContext] Popup blocked or closed, falling back to redirect...
```

### リダイレクトが失敗する場合

カスタムドメインが承認済みドメインに追加されていることを確認してください。追加されていない場合、Firebase認証エラーが発生します。

## 参考リンク

- [Firebase Authentication - Authorized Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices#proxy-requests)
- [Custom Domain Setup](https://firebase.google.com/docs/hosting/custom-domain)
