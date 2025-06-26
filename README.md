# 日本語テキスト入力ページ

このアプリケーションは、日本語テキストを入力・保存・管理するためのWebアプリケーションです。

## 機能

- ユーザー認証（サインアップ・サインイン）
- 日本語テキストの入力・保存
- 保存されたテキストの一覧表示
- テキストエントリーの削除

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **アイコン**: Lucide React
- **バックエンド**: Supabase
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://app.supabase.com) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトの設定から以下の情報を取得：
   - Project URL (例: https://your-project.supabase.co)
   - Project API Key (anon public)

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**重要**: 
- URLは `https://your-project.supabase.co` の形式である必要があります
- Anon Keyは50文字以上の長い文字列です
- これらの値はSupabaseプロジェクトの「Settings > API」で確認できます

### 3. データベースの設定

Supabaseのマイグレーションファイルが自動的に適用され、以下のテーブルが作成されます：

- `profiles`: ユーザープロファイル情報
- `text_entries`: テキストエントリー

### 4. 開発サーバーの起動

```bash
npm install
npm run dev
```

## トラブルシューティング

### "Failed to fetch" エラーが表示される場合

1. **環境変数を確認**:
   - `.env`ファイルが存在するか
   - `VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が正しく設定されているか

2. **Supabaseプロジェクトを確認**:
   - プロジェクトが一時停止されていないか
   - URLとキーが正しいか

3. **ネットワーク接続を確認**:
   - インターネット接続が正常か
   - ファイアウォールがSupabaseをブロックしていないか

### 接続テスト

アプリケーション内で「再確認」ボタンをクリックして接続状態を確認できます。

## デプロイ

### Netlifyへのデプロイ

1. プロジェクトをGitリポジトリにプッシュ
2. Netlifyでサイトを作成
3. 環境変数を設定：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ

## 使用方法

1. アプリケーションにアクセス
2. 新規ユーザーの場合は「新規登録」でアカウントを作成
3. 既存ユーザーの場合は「サインイン」でログイン
4. テキスト入力フォームに日本語テキストを入力
5. 「保存」ボタンでテキストを保存
6. 保存されたテキストは下部の一覧に表示
7. 不要なテキストは削除ボタンで削除可能

## 開発

### テストの実行

```bash
npm run test
```

### ビルド

```bash
npm run build
```

## ライセンス

MIT License