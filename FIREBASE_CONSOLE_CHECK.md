# Firebase Console設定チェックリスト

同意画面が表示されているのに`auth/popup-closed-by-user`エラーが出る場合、Firebase Consoleの設定に問題がある可能性があります。

## 確認手順

### 1. Firebase Console - Authentication設定

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `localshare-komaba-54c0d` を選択
3. 左メニュー「Authentication」をクリック
4. 上部タブ「Sign-in method」をクリック

#### 確認項目：

**Google プロバイダー**
- ✅ Googleが「Enabled（有効）」になっているか
- ✅ サポートメールアドレスが設定されているか
- ✅ 「Web SDK configuration」セクションの「Web client ID」が表示されているか

**承認済みドメイン（Authorized domains）**

「Settings」タブ → 「Authorized domains」で以下が含まれているか確認：
- ✅ `localhost`
- ✅ `localshare-komaba-54c0d.firebaseapp.com`
- ✅ `komabasai.local-share.net`

### 2. Google Cloud Console - OAuth設定

これが最も重要です！

1. [Google Cloud Console](https://console.cloud.google.com/) を開く
2. プロジェクト `localshare-komaba-54c0d` を選択
3. 左メニュー「APIとサービス」→「認証情報」をクリック

#### 確認項目：

**OAuth 2.0 クライアントID**

「ウェブ アプリケーション」タイプのクライアントIDを見つけて、以下を確認：

**承認済みのJavaScript生成元**に以下がすべて含まれているか：
- ✅ `https://komabasai.local-share.net`
- ✅ `https://localshare-komaba-54c0d.firebaseapp.com`
- ✅ `http://localhost:5151` (開発用)
- ✅ `http://localhost:5173` (開発用、Viteのデフォルト)

**承認済みのリダイレクトURI**に以下が含まれているか：
- ✅ `https://localshare-komaba-54c0d.firebaseapp.com/__/auth/handler`
- ✅ `https://komabasai.local-share.net/__/auth/handler` ← これが重要！
- ✅ `http://localhost:5151/__/auth/handler` (開発用)
- ✅ `http://localhost:5173/__/auth/handler` (開発用)

### 3. 設定を追加する方法

もし上記のいずれかが不足している場合：

#### Google Cloud Consoleで追加：

1. OAuth 2.0 クライアントIDをクリック
2. 「承認済みのJavaScript生成元」セクションで「URIを追加」
3. 不足しているURIを追加（例：`https://komabasai.local-share.net`）
4. 「承認済みのリダイレクトURI」セクションで「URIを追加」
5. 不足しているリダイレクトURIを追加（例：`https://komabasai.local-share.net/__/auth/handler`）
6. 「保存」をクリック

**重要**: 保存後、設定が反映されるまで数分かかる場合があります。

### 4. トラブルシューティング

#### エラーが続く場合

1. **ブラウザのキャッシュをクリア**
   - モバイルの場合：設定 → Safari/Chrome → 履歴とWebサイトデータを消去

2. **シークレット/プライベートモードで試す**
   - キャッシュの影響を排除できます

3. **設定反映を待つ**
   - Google Cloud Consoleで設定変更後、5-10分待ってから再度試す

#### デバッグ方法

ブラウザの開発者ツール（コンソール）で以下を確認：

```javascript
// 現在のドメインを確認
console.log(window.location.origin);
// 出力例: https://komabasai.local-share.net
```

このドメインが、Google Cloud ConsoleのOAuth設定に含まれている必要があります。

### 5. 最も可能性が高い問題

**カスタムドメイン（`komabasai.local-share.net`）がGoogle Cloud ConsoleのOAuth設定に追加されていない**

Firebase Consoleの「承認済みドメイン」に追加するだけでは不十分です。**Google Cloud ConsoleのOAuth 2.0クライアントID設定にも追加する必要があります**。

特に：
```
承認済みのJavaScript生成元:
https://komabasai.local-share.net

承認済みのリダイレクトURI:
https://komabasai.local-share.net/__/auth/handler
```

この2つが設定されているか必ず確認してください。

## 設定後のテスト

1. Google Cloud Consoleで設定を保存
2. 5分待つ
3. ブラウザのキャッシュをクリア
4. アプリをリロード
5. ログインを試す

設定が正しければ、同意画面で「許可」をクリックした後、正常にログインできるはずです。
