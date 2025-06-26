# Supabase設定ガイド

このアプリケーションを動作させるには、Supabaseプロジェクトの設定が必要です。

## 1. Supabaseアカウントの作成

1. [Supabase](https://app.supabase.com) にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）

## 2. 新しいプロジェクトの作成

1. ダッシュボードで「New project」をクリック
2. 以下の情報を入力：
   - **Name**: `japanese-text-app`（または任意の名前）
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` または `Southeast Asia (Singapore)`
3. 「Create new project」をクリック
4. プロジェクトの作成完了まで1-2分待機

## 3. API設定の取得

1. プロジェクトダッシュボードで左サイドバーの「Settings」をクリック
2. 「API」タブを選択
3. 以下の値をコピー：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（非常に長い文字列）

## 4. 環境変数の設定

1. プロジェクトルートの `.env` ファイルを開く
2. 以下の値を実際の値に置き換え：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. 開発サーバーの再起動

```bash
# 現在のサーバーを停止（Ctrl+C）
# 再度起動
npm run dev
```

## 6. 動作確認

1. ブラウザでアプリケーションにアクセス
2. 接続状態が「Supabase接続済み」と表示されることを確認
3. 新規登録またはサインインを試行

## トラブルシューティング

### "Failed to fetch" エラー

- 環境変数が正しく設定されているか確認
- 開発サーバーを再起動
- Supabaseプロジェクトが一時停止されていないか確認

### "Invalid API key" エラー

- anon public keyが正しくコピーされているか確認
- キーに余分なスペースや改行が含まれていないか確認

### 接続タイムアウト

- インターネット接続を確認
- Supabaseのステータスページを確認: https://status.supabase.com

## データベーススキーマ

プロジェクトには以下のテーブルが自動的に作成されます：

- `profiles`: ユーザープロファイル情報
- `text_entries`: テキストエントリー

これらのテーブルは既存のマイグレーションファイルによって自動的に作成されます。

## セキュリティ設定

- Row Level Security (RLS) が有効化されています
- 認証されたユーザーのみがデータにアクセス可能
- ユーザーは自分のデータのみ操作可能

## サポート

問題が発生した場合は、以下を確認してください：

1. ブラウザの開発者ツールでコンソールエラーを確認
2. Supabaseダッシュボードでプロジェクトの状態を確認
3. 環境変数が正しく設定されているか再確認