# OAuth設定確認スクリプト

## 最も簡単な方法：直接リンクで確認

以下のリンクを開くだけで、OAuth設定画面に直接アクセスできます：

**Google Cloud Console - OAuth 2.0 設定**
```
https://console.cloud.google.com/apis/credentials?project=localshare-komaba-54c0d
```

このページで「OAuth 2.0 クライアントID」セクションを確認してください。

## 確認すべき項目

### 承認済みのJavaScript生成元

以下がすべて含まれているか確認：
- ✅ `https://komabasai.local-share.net`
- ✅ `https://localshare-komaba-54c0d.firebaseapp.com`
- ✅ `http://localhost:5151` (開発用)

### 承認済みのリダイレクトURI

以下がすべて含まれているか確認：
- ✅ `https://komabasai.local-share.net/__/auth/handler`
- ✅ `https://localshare-komaba-54c0d.firebaseapp.com/__/auth/handler`
- ✅ `http://localhost:5151/__/auth/handler` (開発用)

## gcloudを使った確認（参考）

### 前提条件

1. gcloud CLIがインストールされている
2. 認証済み：`gcloud auth login`
3. 正しいプロジェクトを選択：`gcloud config set project localshare-komaba-54c0d`

### スクリプト使用方法

#### 基本情報確認
```bash
./scripts/check-oauth-config.sh
```

#### API経由での詳細確認（要：application-default認証）
```bash
# 最初に認証
gcloud auth application-default login

# スクリプト実行
./scripts/check-oauth-api.sh
```

## 重要な注意点

⚠️ **OAuth 2.0クライアントIDの詳細設定（承認済みドメイン、リダイレクトURIなど）は、gcloud CLIやAPIでは完全には取得できません。**

最も確実な確認方法は、**Google Cloud Consoleで直接確認すること**です。

## トラブルシューティング

### スクリプトが動かない場合

1. **gcloud CLIがインストールされているか確認**
   ```bash
   gcloud --version
   ```

2. **ログインしているか確認**
   ```bash
   gcloud auth list
   ```

3. **プロジェクトが正しく設定されているか確認**
   ```bash
   gcloud config get-value project
   ```

### 設定を変更した後

1. Google Cloud Consoleで変更を保存
2. **5-10分待つ**（設定の反映に時間がかかります）
3. ブラウザのキャッシュをクリア
4. アプリをリロードして再度ログインを試す

## 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials?project=localshare-komaba-54c0d)
- [Firebase Console - プロジェクト設定](https://console.firebase.google.com/project/localshare-komaba-54c0d/settings/general)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/localshare-komaba-54c0d/authentication/providers)

## クイックチェックコマンド

現在のドメインを確認（ブラウザのコンソールで実行）：
```javascript
console.log(window.location.origin);
```

このドメインが、Google Cloud ConsoleのOAuth設定に含まれている必要があります。
