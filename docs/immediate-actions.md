# VibeInsight 直近のアクションプラン

## 今すぐ始められること（優先度順）

### 1. データモデルの設計と実装（2-3日）

#### Supabaseテーブル設計
```sql
-- 1on1セッション
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分析結果
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  gini_coefficient DECIMAL(3,2),
  speaker_ratios JSONB,
  emotion_summary JSONB,
  coaching_skills JSONB,
  diagnosis_name TEXT,
  prescriptions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会話イベント
CREATE TABLE conversation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  event_type TEXT NOT NULL, -- 'overlap', 'silence', 'speed_up', etc.
  speaker TEXT NOT NULL,
  timestamp_seconds DECIMAL(10,2),
  duration_seconds DECIMAL(10,2),
  metadata JSONB
);

-- トランスクリプト
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_time DECIMAL(10,2),
  end_time DECIMAL(10,2),
  confidence DECIMAL(3,2)
);
```

### 2. 現在のUIを音声アップロード対応に改修（1-2日）

#### 修正対象ファイル
- `src/components/TextEntryForm.tsx` → `src/components/AudioUploadForm.tsx`
- `src/components/TextEntryList.tsx` → `src/components/SessionList.tsx`
- 関連するhooksとservicesも同様に改修

#### 実装内容
```typescript
// AudioUploadForm.tsx の基本構造
interface AudioUploadFormProps {
  onUpload: (file: File) => void;
}

export function AudioUploadForm({ onUpload }: AudioUploadFormProps) {
  // 音声ファイルのドラッグ&ドロップ対応
  // ファイルサイズ制限（例：100MB）
  // 対応フォーマット: mp3, wav, m4a, webm
  // アップロード進捗表示
}
```

### 3. モックデータでレポート画面のプロトタイプ作成（3-4日）

#### 新規作成ファイル
- `src/components/report/ReportHeader.tsx`
- `src/components/report/ConversationDynamics.tsx`
- `src/components/report/EventTimeline.tsx`
- `src/components/report/CoachingSkills.tsx`
- `src/components/report/Transcript.tsx`

#### モックデータの例
```typescript
// src/mocks/sampleAnalysis.ts
export const sampleAnalysisData = {
  session: {
    id: "sample-1",
    title: "週次1on1",
    participant: "田中さん",
    duration: 1800, // 30分
    date: "2025-06-30"
  },
  diagnosis: {
    name: "マシンガン・ソルバー",
    icon: "🗣️",
    prescriptions: [
      "相手が話し終えた後、心の中で「1、2、3」と数えてから話し始める",
      "自分の発言を1分以内に収めることを意識する",
      "「どう思う？」と、相手の意見を求める相槌を増やす"
    ]
  },
  metrics: {
    giniCoefficient: 0.50,
    speakerRatios: { coach: 75, client: 25 },
    emotionSummary: {
      coach: { positive: 60, neutral: 35, negative: 5 },
      client: { positive: 20, neutral: 70, negative: 10 }
    }
  },
  events: [
    { type: "overlap", speaker: "coach", time: 120, icon: "💥" },
    { type: "silence", time: 180, duration: 5, icon: "🤫" },
    { type: "speed_up", speaker: "client", time: 240, icon: "⏩" }
  ]
};
```

### 4. 音声処理APIの調査と選定（1日）

#### 調査対象
1. **OpenAI Whisper API**
   - 料金: $0.006/分
   - 対応言語: 日本語対応良好
   - 話者分離: なし（別途必要）

2. **Google Cloud Speech-to-Text**
   - 料金: $0.009-$0.048/分
   - 話者分離: あり
   - 感情分析: 別サービス連携可能

3. **Amazon Transcribe**
   - 料金: $0.024/分
   - 話者分離: あり
   - 日本語精度: 要検証

### 5. プロジェクト構造の整理（0.5日）

#### ディレクトリ構成案
```
src/
├── components/
│   ├── auth/         # 認証関連（既存）
│   ├── common/       # 共通コンポーネント
│   ├── dashboard/    # ダッシュボード
│   ├── report/       # レポート画面
│   └── upload/       # アップロード関連
├── features/
│   ├── analysis/     # 分析ロジック
│   ├── audio/        # 音声処理
│   └── diagnosis/    # 診断ロジック
├── hooks/
├── services/
├── types/
└── utils/
```

## 実装の優先順位

### Week 1（今週）
1. ✅ データモデル設計とマイグレーション作成
2. ✅ 音声アップロードUIの実装
3. ✅ モックデータでのレポート画面プロトタイプ

### Week 2
1. 音声処理APIの統合（まずはWhisper APIから）
2. 基本的な分析ロジックの実装
3. レポート画面とAPIの接続

### Week 3
1. 診断ロジックの実装
2. ダッシュボード画面の作成
3. エンドツーエンドのテスト

## 技術的な決定事項

### 推奨ライブラリ
- **グラフ表示**: Recharts（React向けで使いやすい）
- **ファイルアップロード**: react-dropzone
- **状態管理**: 現状のままカスタムhooks使用（複雑化したらZustand検討）
- **スタイリング**: 現状のTailwind CSSを継続

### API設計方針
- Supabase Edge Functionsで音声処理を非同期実行
- ポーリングまたはWebSocketで処理状況を通知
- 分析結果はキャッシュして再計算を避ける

## 次のステップ

1. このプランについてチーム内でレビュー
2. 技術的な不明点があれば早期に検証
3. Phase 1の完了を目指して実装開始

特に重要なのは、**モックデータでも良いので早期に動くものを作る**ことです。これにより：
- UIの使い勝手を検証できる
- ステークホルダーに進捗を見せられる
- 技術的な課題を早期に発見できる