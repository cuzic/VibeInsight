# VibeInsight 更新されたプロジェクトロードマップ

## 🔄 アーキテクチャ変更による影響

**重要な変更**: 音声処理をFly.io Docker上で実行することで、Supabase Edge Functionsの制約を回避し、より安定した処理を実現します。

### 変更前後の比較

| 項目 | 従来計画 | 新アーキテクチャ |
|------|----------|------------------|
| **音声処理** | Supabase Edge Functions | ✅ Fly.io Docker Container |
| **CPU制限** | 2秒制限 | ✅ 無制限 |
| **メモリ制限** | 150MB | ✅ 最大8GB |
| **処理時間** | タイムアウトリスク | ✅ 長時間処理対応 |
| **依存関係** | 限定的 | ✅ ffmpeg, pyannote等自由 |
| **監視** | 基本的なログ | ✅ 詳細メトリクス |

## 📋 更新された開発フェーズ

### Phase 1: 基盤整備（1-2週間）

#### 1.1 Fly.io Docker環境構築
- **Dockerfile作成**: Python + FastAPI + 音声処理ライブラリ
- **fly.toml設定**: リソース、ヘルスチェック、スケーリング
- **依存関係整備**: whisper, gemini, ffmpeg, pyannote.audio
- **環境変数管理**: API キー、認証情報の安全な管理

#### 1.2 データモデルの更新
```sql
-- 処理状況テーブルの拡張
ALTER TABLE processing_status ADD COLUMN 
  docker_container_id TEXT,
  processing_node TEXT,
  resource_usage JSONB;

-- 音声処理メタデータの追加
ALTER TABLE sessions ADD COLUMN
  audio_format TEXT,
  audio_duration_seconds INTEGER,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE;
```

#### 1.3 Supabase ↔ Fly.io 連携
- **軽量Edge Function**: 処理トリガー専用に簡素化
- **認証設定**: Fly.io Docker への安全なAPI呼び出し
- **進捗追跡**: Supabase Realtime経由での状況更新

### Phase 2: Docker音声処理パイプライン（2-3週間）

#### 2.1 音声前処理システム
```python
# 実装予定の機能
- 音声フォーマット変換 (ffmpeg)
- ノイズ除去とレベル正規化
- 大容量ファイルの分割処理
- 品質チェックと最適化
```

#### 2.2 並列処理とスケーリング
- **並列文字起こし**: 大容量ファイルの分割処理
- **リソース管理**: CPU/メモリ使用量の最適化
- **Auto-scaling**: 負荷に応じた自動スケーリング
- **Queue管理**: 同時処理数の制御

#### 2.3 話者分離の高精度化
- **pyannote.audio統合**: プロフェッショナルな話者分離
- **話者ラベリング**: coach/client の自動識別
- **エラーハンドリング**: 分離失敗時のフォールバック

### Phase 3: 高度な分析機能（2-3週間）

#### 3.1 音響特徴抽出
```python
# 新たに追加される分析
- 話速変化の検出 (librosa)
- 音量・抑揚の分析
- 感情的な声の特徴抽出
- 沈黙パターンの分析
```

#### 3.2 Gemini分析の最適化
- **プロンプトエンジニアリング**: より正確な診断のためのプロンプト設計
- **段階的分析**: 基本→詳細→診断の段階的処理
- **エラー回復**: API失敗時の再試行とフォールバック

#### 3.3 診断アルゴリズムの改良
- **機械学習要素**: 音響特徴 + テキスト分析の組み合わせ
- **診断精度向上**: より多様なコミュニケーションスタイルの検出
- **処方箋のパーソナライゼーション**: ユーザー履歴に基づく推奨

### Phase 4: UI/UX とリアルタイム体験（2週間）

#### 4.1 リアルタイム進捗表示
```typescript
// WebSocket経由のリアルタイム更新
const processingStages = [
  { name: 'uploading', duration: 30, message: 'ファイルをアップロード中...' },
  { name: 'preprocessing', duration: 45, message: '音声を前処理中...' },
  { name: 'transcribing', duration: 180, message: '音声を文字に変換中...' },
  { name: 'diarization', duration: 60, message: '話者を識別中...' },
  { name: 'analyzing', duration: 90, message: 'AIが会話を分析中...' },
  { name: 'completed', duration: 0, message: '分析完了！' }
];
```

#### 4.2 分析レポート画面
- **イベントタイムライン**: 音響イベントとコーチングスキルの可視化
- **診断結果表示**: アニメーション付きの診断名とアイコン
- **処方箋UI**: インタラクティブな改善アクション表示

### Phase 5: 運用・監視・最適化（1-2週間）

#### 5.1 監視システム
- **Prometheus メトリクス**: 処理時間、成功率、リソース使用量
- **ログ集約**: 構造化ログによる問題追跡
- **アラート**: 処理失敗やリソース不足の通知

#### 5.2 コスト最適化
- **リソース調整**: CPU/メモリの最適化
- **API使用量管理**: Whisper/Gemini の使用量制限
- **ストレージライフサイクル**: 自動削除ポリシー

## 🎯 実装優先度（更新版）

### 🔥 Week 1: 緊急度高
1. **Fly.io Docker環境の構築**
   - Dockerfile + fly.toml + 基本的なFastAPI
   - デプロイとヘルスチェック確認
   - Supabase からの HTTP 呼び出しテスト

2. **音声処理の基本パイプライン**
   - 音声アップロード → 前処理 → Whisper → 結果保存
   - エラーハンドリングとログ

### ⚡ Week 2-3: 高優先度
3. **Whisper + Gemini統合**
   - 分割処理とバッチ処理
   - Gemini分析のプロンプト最適化

4. **話者分離とイベント検出**
   - pyannote.audio統合
   - 音響特徴の抽出

### 🎨 Week 4-5: 中優先度  
5. **UI/UXの実装**
   - リアルタイム進捗表示
   - 分析レポート画面

6. **監視と最適化**
   - メトリクス収集
   - パフォーマンス調整

## 🔧 技術的決定事項（確定）

### インフラ構成
- **音声処理**: Fly.io Docker (Python + FastAPI)
- **進捗管理**: Supabase Realtime
- **ストレージ**: Fly.io S3互換ストレージ
- **データベース**: Supabase PostgreSQL

### 音声処理スタック
- **文字起こし**: OpenAI Whisper API
- **AI分析**: Google Gemini 1.5 Flash
- **話者分離**: pyannote.audio
- **音声処理**: ffmpeg, pydub, librosa

### 監視・運用
- **メトリクス**: Prometheus + Grafana
- **ログ**: 構造化JSON + Fly.io Logs
- **アラート**: Fly.io Monitoring

## 📊 成功指標（更新版）

### 技術指標
- **処理成功率**: 95%以上
- **平均処理時間**: 30分音声を5分以内
- **API可用性**: 99.5%以上
- **リソース効率**: CPU使用率60%以下

### ビジネス指標
- **ユーザー満足度**: NPS 50以上
- **処理完了率**: 90%以上（離脱率10%以下）
- **診断精度**: 80%以上（ユーザー評価）

### コスト指標
- **API コスト**: $50/1000セッション以下
- **インフラコスト**: $200/月以下（100ユーザー想定）

## ⚠️ リスクと対策（更新版）

### 新たなリスク
1. **Fly.io依存**: 単一プロバイダー依存のリスク
   - **対策**: AWS/GCP への移行準備とマルチクラウド対応

2. **Docker複雑性**: デプロイとスケーリングの複雑化
   - **対策**: CI/CD自動化とInfrastructure as Code

3. **音声処理ライブラリ**: Python依存関係の管理
   - **対策**: Dockerイメージの固定とテスト自動化

### 既存リスクの軽減
- ✅ **Edge Functions制限**: Docker化により解決
- ✅ **メモリ制限**: 8GBまで拡張可能
- ✅ **処理時間制限**: 無制限処理が可能

## 🚀 次のアクション

1. **Fly.io環境構築** (今週)
   - Docker開発環境のセットアップ
   - 基本的な音声アップロード→処理パイプライン

2. **プロトタイプの早期作成** (来週)
   - 30分音声のエンドツーエンド処理
   - リアルタイム進捗表示の実装

3. **ユーザーテスト準備** (3週間後)
   - ベータ版リリース準備
   - フィードバック収集システム

この新しいアーキテクチャにより、技術的制約を大幅に解決し、より安定で高品質な音声分析システムを構築できます。