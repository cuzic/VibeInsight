# VibeInsight mise タスク

このディレクトリには、VibeInsightプロジェクトで使用するmiseタスクスクリプトが含まれています。

## 利用可能なタスク

### `update-claude-secrets`
Claude認証情報をGitHubシークレットに一括更新するスクリプトです。

**使用方法:**
```bash
mise run update-claude-secrets
```

**前提条件:**
- `jq` コマンドがインストールされていること
- `gh` (GitHub CLI) がインストール・認証されていること  
- `~/.claude/.credentials.json` にClaude認証情報が保存されていること

**更新される項目:**
- `CLAUDE_ACCESS_TOKEN`
- `CLAUDE_REFRESH_TOKEN` 
- `CLAUDE_EXPIRES_AT`

**処理内容:**
1. 認証情報ファイルの存在確認
2. 必要なコマンドの確認 (`jq`, `gh`)
3. JSON形式の認証情報をdotenv形式に変換
4. GitHub CLI経由でリポジトリシークレットを一括更新

## スクリプトの追加

新しいタスクを追加する場合：

1. `.mise/tasks/` ディレクトリにスクリプトファイルを作成
2. 実行権限を付与: `chmod +x .mise/tasks/your-script`
3. `.mise.toml` の `[tasks]` セクションにタスクを定義
4. ドキュメントを更新

## セキュリティ注意事項

- スクリプト内では機密情報をハードコードしない
- 必要に応じて環境変数や設定ファイルを使用
- GitHubシークレットへの書き込み権限に注意