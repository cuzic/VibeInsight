# VibeInsight サーバーサイド機能仕様

## 概要

VibeInsightのサーバーサイドは、Supabase（認証・データベース・リアルタイム通信）とFly.io Docker（音声処理）の2つの主要コンポーネントで構成されます。本ドキュメントでは、各機能の詳細仕様とAPI設計を定義します。

## アーキテクチャ構成

```
[Frontend] ↔ [Supabase] ↔ [Fly.io Docker]
           ↓
    [音声ファイル]
           ↓
    [Fly.io S3 Storage]
```

## 1. Supabase Functions（軽量処理）

### 1.1 認証・認可機能

#### ユーザー認証API
```typescript
// POST /auth/signup
interface SignUpRequest {
  email: string;
  password: string;
  metadata?: {
    full_name?: string;
    organization?: string;
  };
}

// POST /auth/signin
interface SignInRequest {
  email: string;
  password: string;
}

// POST /auth/signout
// Authorization headerでJWTトークンを要求
```

#### Row Level Security (RLS) ポリシー
```sql
-- ユーザーは自分のセッションのみアクセス可能
CREATE POLICY "Users can manage own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- 組織管理者は所属組織のデータにアクセス可能
CREATE POLICY "Org admins can view org data" ON sessions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'org_admin' AND
    (auth.jwt() ->> 'organization')::uuid = organization_id
  );
```

### 1.2 音声ファイル管理

#### プリサインURL生成
```typescript
// supabase/functions/generate-upload-url/index.ts
interface UploadUrlRequest {
  file_name: string;
  file_size: number;
  content_type: string;
}

interface UploadUrlResponse {
  upload_url: string;
  session_id: string;
  expires_in: number; // 3600秒
}

const generateUploadUrl = async (req: Request) => {
  // 1. ユーザー認証確認
  // 2. ファイルサイズ・形式バリデーション
  // 3. Fly.io S3へのプリサインURL生成
  // 4. セッションレコード作成
  // 5. URLとセッションIDを返却
};
```

#### セッション管理API
```typescript
// GET /sessions - ユーザーのセッション一覧取得
interface SessionListResponse {
  sessions: {
    id: string;
    title: string;
    participant_name: string;
    created_at: string;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    duration_seconds?: number;
  }[];
  total_count: number;
  has_more: boolean;
}

// GET /sessions/:id - 特定セッションの詳細取得
interface SessionDetailResponse {
  session: SessionInfo;
  analysis_result?: AnalysisResult;
  processing_status: ProcessingStatus;
}

// DELETE /sessions/:id - セッション削除
// 音声ファイルとすべての関連データを削除
```

### 1.3 処理トリガー機能

#### 音声処理開始API
```typescript
// supabase/functions/trigger-audio-processing/index.ts
interface ProcessingTriggerRequest {
  session_id: string;
  audio_url: string;
  processing_options?: {
    language?: 'ja' | 'en';
    enable_diarization?: boolean;
    analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
  };
}

const triggerProcessing = async (req: Request) => {
  // 1. セッション存在確認
  // 2. 重複処理防止チェック
  // 3. Fly.io Docker APIコール
  // 4. 処理状況初期化
  // 5. リアルタイム通知開始
};
```

### 1.4 リアルタイム進捗管理

#### 進捗更新API
```typescript
// supabase/functions/update-progress/index.ts
interface ProgressUpdate {
  session_id: string;
  status: 'uploading' | 'preprocessing' | 'transcribing' | 'diarization' | 'analyzing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  stage_data?: {
    current_stage: string;
    estimated_remaining: number; // 秒
    error_details?: string;
  };
}

// Supabase Realtime経由で即座にクライアントに通知
```

#### WebSocket チャンネル設計
```typescript
// クライアント接続例
const channel = supabase
  .channel(`session:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'processing_status',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    updateProcessingUI(payload.new);
  })
  .subscribe();
```

### 1.5 分析結果API

#### 分析結果取得
```typescript
// GET /analysis/:session_id
interface AnalysisResultResponse {
  session_info: {
    id: string;
    title: string;
    participant_name: string;
    duration_seconds: number;
    recorded_at: string;
  };
  
  speaker_analysis: {
    coach_speaking_ratio: number;
    client_speaking_ratio: number;
    gini_coefficient: number;
    turn_taking_balance: number;
  };
  
  coaching_skills: {
    listening: { score: number; examples: string[]; };
    questioning: { score: number; examples: string[]; };
    empathy: { score: number; examples: string[]; };
    feedback: { score: number; examples: string[]; };
  };
  
  emotion_analysis: {
    coach: { positive: number; neutral: number; negative: number; };
    client: { positive: number; neutral: number; negative: number; };
    timeline: { timestamp: number; coach_emotion: string; client_emotion: string; }[];
  };
  
  conversation_events: {
    type: 'overlap' | 'silence' | 'speed_change' | 'volume_change' | 'pitch_change';
    speaker: 'coach' | 'client';
    timestamp: number;
    duration?: number;
    metadata: Record<string, any>;
  }[];
  
  diagnosis: {
    name: string;
    icon: string;
    description: string;
    confidence: number;
  };
  
  prescriptions: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'communication' | 'listening' | 'questioning' | 'feedback';
  }[];
  
  transcript: {
    speaker: 'coach' | 'client';
    text: string;
    start_time: number;
    end_time: number;
    confidence: number;
  }[];
}
```

### 1.6 組織管理機能

#### 組織統計API
```typescript
// GET /organization/stats
interface OrganizationStatsResponse {
  overview: {
    total_sessions: number;
    total_participants: number;
    average_session_duration: number;
    completion_rate: number;
  };
  
  department_stats: {
    department_name: string;
    session_count: number;
    average_coaching_score: number;
    average_gini_coefficient: number;
    top_issues: string[];
  }[];
  
  trends: {
    monthly_session_count: { month: string; count: number; }[];
    skill_progression: {
      skill: string;
      trend: 'improving' | 'stable' | 'declining';
      change_rate: number;
    }[];
  };
}

// GET /organization/benchmarks
interface BenchmarkResponse {
  industry_averages: {
    coaching_skills: Record<string, number>;
    gini_coefficient: number;
    session_frequency: number;
  };
  
  internal_benchmarks: {
    top_performers: {
      user_id: string;
      anonymized_name: string;
      scores: Record<string, number>;
    }[];
  };
}
```

## 2. Fly.io Docker Functions（重要処理）

### 2.1 音声処理パイプライン

#### メイン処理エンドポイント
```python
# POST /process-audio
class AudioProcessingRequest(BaseModel):
    session_id: str
    audio_url: str
    user_id: str
    processing_options: Optional[ProcessingOptions] = None

class ProcessingOptions(BaseModel):
    language: str = "ja"
    enable_diarization: bool = True
    analysis_depth: str = "detailed"  # basic, detailed, comprehensive
    custom_prompt: Optional[str] = None

@app.post("/process-audio")
async def process_audio(
    request: AudioProcessingRequest,
    background_tasks: BackgroundTasks
):
    # バックグラウンドで非同期処理開始
    background_tasks.add_task(
        process_audio_pipeline,
        request.session_id,
        request.audio_url,
        request.user_id,
        request.processing_options
    )
    
    return {"status": "processing_started", "session_id": request.session_id}
```

#### 音声前処理機能
```python
class AudioPreprocessor:
    async def preprocess_audio(self, audio_file_path: str) -> str:
        """
        音声ファイルの前処理
        1. フォーマット検証・変換
        2. サンプルレート正規化 (16kHz)
        3. モノラル変換
        4. 音量正規化
        5. ノイズ除去
        6. 品質チェック
        """
        
    async def split_large_audio(self, audio_path: str, max_duration: int = 1200) -> List[str]:
        """
        大容量音声ファイルの分割
        - 20分チャンクに分割
        - 話者変更点での分割優先
        - オーバーラップ処理
        """
        
    async def enhance_audio_quality(self, audio_path: str) -> str:
        """
        音質改善処理
        - スペクトラルゲート（ノイズ除去）
        - 音量レベリング
        - 高周波強調（明瞭度向上）
        """
```

#### 文字起こし機能
```python
class TranscriptionService:
    async def transcribe_with_whisper(self, audio_path: str) -> Dict:
        """
        Whisper APIによる文字起こし
        1. ファイルサイズチェック（25MB制限）
        2. 分割処理（必要に応じて）
        3. 並列処理による高速化
        4. 結果マージ
        5. 信頼度スコア付与
        """
        
    async def transcribe_chunks_parallel(self, chunk_paths: List[str]) -> List[Dict]:
        """
        チャンクの並列文字起こし
        - 最大5並列処理
        - レート制限考慮
        - エラーハンドリング
        """
        
    async def merge_transcription_results(self, chunk_results: List[Dict]) -> Dict:
        """
        分割結果のマージ
        - タイムスタンプ調整
        - セグメント連結
        - 重複除去
        """
```

#### 話者分離機能
```python
class SpeakerDiarization:
    async def perform_diarization(self, audio_path: str, transcript: Dict) -> Dict:
        """
        pyannote.audioによる話者分離
        1. 話者セグメント検出
        2. 話者埋め込み抽出
        3. クラスタリング
        4. 話者ラベル付与
        5. トランスクリプトとの同期
        """
        
    async def assign_speaker_roles(self, diarized_segments: List[Dict]) -> List[Dict]:
        """
        話者役割の自動推定
        - 発話量ベース推定
        - 質問頻度分析
        - 音響特徴分析
        - coach/client自動割り当て
        """
        
    async def refine_speaker_boundaries(self, segments: List[Dict]) -> List[Dict]:
        """
        話者境界の精緻化
        - 短時間セグメントの統合
        - ノイズセグメントの除去
        - 重複境界の調整
        """
```

### 2.2 音響特徴抽出

#### 音響分析エンジン
```python
class AcousticAnalyzer:
    async def extract_prosodic_features(self, audio_path: str, segments: List[Dict]) -> Dict:
        """
        韻律特徴抽出
        1. 基本周波数（F0）
        2. 話速（モーラ/秒）
        3. 音量変化
        4. 抑揚（F0範囲）
        5. ポーズ長
        """
        
    async def detect_conversation_events(self, audio_path: str, segments: List[Dict]) -> List[Dict]:
        """
        会話イベント検出
        - 声の被り（Turn Stealing）
        - 長時間沈黙（2秒以上）
        - 話速変化（±30%）
        - 音量変化（±6dB）
        - 抑揚変化
        """
        
    async def analyze_emotional_prosody(self, audio_path: str, segments: List[Dict]) -> List[Dict]:
        """
        感情的韻律分析
        - 音響的感情特徴抽出
        - 声質分析
        - エネルギー分布
        - スペクトル特徴
        """
```

### 2.3 AI分析・診断

#### Gemini分析エンジン
```python
class GeminiAnalyzer:
    async def analyze_coaching_conversation(self, transcript_data: Dict) -> Dict:
        """
        Gemini APIによる会話分析
        1. コーチングスキル検出
        2. 感情分析
        3. 会話ブロック分析
        4. インタラクションパターン分析
        """
        
    async def generate_diagnosis(self, analysis_data: Dict) -> Dict:
        """
        診断名生成
        - コミュニケーションスタイル分類
        - 行動パターン分析
        - 診断名・アイコン選定
        - 信頼度スコア算出
        """
        
    async def create_prescriptions(self, diagnosis: Dict, analysis_data: Dict) -> List[Dict]:
        """
        処方箋生成
        - 改善点特定
        - 具体的アクション提案
        - 優先度設定
        - パーソナライゼーション
        """
```

#### プロンプトエンジニアリング
```python
class PromptManager:
    def build_coaching_analysis_prompt(self, conversation_data: Dict) -> str:
        """
        コーチング分析用プロンプト構築
        - 会話文脈の整理
        - 分析観点の明確化
        - 出力フォーマット指定
        - 例示による精度向上
        """
        
    def build_diagnosis_prompt(self, analysis_result: Dict) -> str:
        """
        診断生成用プロンプト
        - スタイル分類基準
        - 診断名テンプレート
        - 一貫性保証
        """
        
    def build_prescription_prompt(self, diagnosis: Dict, context: Dict) -> str:
        """
        処方箋生成用プロンプト
        - 改善アクション集
        - 個人化要素
        - 実現可能性考慮
        """
```

### 2.4 データ処理・保存

#### 結果保存サービス
```python
class ResultStorageService:
    async def save_analysis_results(self, session_id: str, analysis_data: Dict) -> bool:
        """
        分析結果の構造化保存
        1. データ検証
        2. Supabase Database保存
        3. インデックス生成
        4. キャッシュ更新
        """
        
    async def save_transcript(self, session_id: str, transcript_data: Dict) -> bool:
        """
        トランスクリプトの保存
        - セグメント別保存
        - 検索インデックス作成
        - 機密情報マスキング
        """
        
    async def save_conversation_events(self, session_id: str, events: List[Dict]) -> bool:
        """
        会話イベントの保存
        - イベント別テーブル保存
        - タイムライン最適化
        - 集約データ生成
        """
```

### 2.5 品質保証・監視

#### 処理品質監視
```python
class QualityMonitor:
    async def validate_transcription_quality(self, transcript: Dict) -> Dict:
        """
        文字起こし品質検証
        - 信頼度スコアチェック
        - 異常セグメント検出
        - 言語整合性確認
        """
        
    async def validate_analysis_results(self, analysis: Dict) -> Dict:
        """
        分析結果品質検証
        - スコア妥当性チェック
        - 一貫性検証
        - 異常値検出
        """
        
    async def monitor_processing_performance(self, session_id: str, stage: str) -> None:
        """
        処理パフォーマンス監視
        - 処理時間記録
        - リソース使用量監視
        - エラー率追跡
        """
```

#### メトリクス収集
```python
class MetricsCollector:
    def record_processing_metrics(self, session_id: str, metrics: Dict) -> None:
        """
        処理メトリクス記録
        - Prometheus形式出力
        - カスタムメトリクス定義
        - ダッシュボード連携
        """
        
    def record_api_usage(self, api_name: str, tokens_used: int, cost: float) -> None:
        """
        API使用量記録
        - コスト追跡
        - 使用量制限監視
        - 最適化提案
        """
```

## 3. 統合API設計

### 3.1 エラーハンドリング

#### 統一エラーレスポンス
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    trace_id?: string;
    timestamp: string;
  };
}

// エラーコード体系
enum ErrorCodes {
  // 認証関連
  UNAUTHORIZED = "AUTH_001",
  FORBIDDEN = "AUTH_002",
  TOKEN_EXPIRED = "AUTH_003",
  
  // ファイル関連
  FILE_TOO_LARGE = "FILE_001",
  INVALID_FORMAT = "FILE_002",
  UPLOAD_FAILED = "FILE_003",
  
  // 処理関連
  PROCESSING_FAILED = "PROC_001",
  API_LIMIT_EXCEEDED = "PROC_002",
  TIMEOUT = "PROC_003",
  
  // システム関連
  INTERNAL_ERROR = "SYS_001",
  SERVICE_UNAVAILABLE = "SYS_002",
}
```

### 3.2 レート制限

#### API制限設定
```typescript
interface RateLimitConfig {
  // ユーザー別制限
  per_user: {
    upload_per_hour: 10;
    processing_per_day: 50;
    api_calls_per_minute: 100;
  };
  
  // 組織別制限
  per_organization: {
    upload_per_hour: 100;
    processing_per_day: 500;
    storage_gb: 1000;
  };
  
  // システム全体制限
  global: {
    concurrent_processing: 50;
    api_calls_per_second: 1000;
  };
}
```

### 3.3 セキュリティ要件

#### データ保護
```typescript
interface SecurityRequirements {
  encryption: {
    in_transit: "TLS 1.3";
    at_rest: "AES-256";
    key_management: "Supabase Vault";
  };
  
  access_control: {
    authentication: "JWT + RLS";
    authorization: "Role-based";
    audit_logging: "All API calls";
  };
  
  data_privacy: {
    audio_retention: "7 days";
    transcript_anonymization: "30 days";
    gdpr_compliance: true;
    data_deletion: "User request";
  };
}
```

## 4. 運用・監視要件

### 4.1 ヘルスチェック

#### 各サービスのヘルスチェック
```python
# Fly.io Docker
@app.get("/health")
async def health_check():
    checks = {
        "database": await check_supabase_connection(),
        "storage": await check_fly_storage(),
        "whisper_api": await check_whisper_api(),
        "gemini_api": await check_gemini_api(),
        "memory_usage": get_memory_usage(),
        "disk_usage": get_disk_usage(),
    }
    
    overall_status = "healthy" if all(checks.values()) else "unhealthy"
    
    return {
        "status": overall_status,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat(),
        "version": app_version
    }
```

### 4.2 ログ戦略

#### 構造化ログ
```python
import structlog

logger = structlog.get_logger()

# 処理開始ログ
logger.info(
    "audio_processing_started",
    session_id=session_id,
    user_id=user_id,
    file_size=file_size,
    estimated_duration=estimated_duration
)

# エラーログ
logger.error(
    "transcription_failed",
    session_id=session_id,
    error_type=error.__class__.__name__,
    error_message=str(error),
    stage="whisper_api",
    retry_count=retry_count
)
```

### 4.3 パフォーマンス監視

#### 重要メトリクス
```python
# Prometheus メトリクス定義
from prometheus_client import Counter, Histogram, Gauge

# 処理関連
audio_processing_total = Counter('audio_processing_total', 'Total audio processing requests', ['status'])
processing_duration = Histogram('processing_duration_seconds', 'Processing duration', ['stage'])
active_processing_jobs = Gauge('active_processing_jobs', 'Number of active processing jobs')

# API関連
api_calls_total = Counter('api_calls_total', 'Total API calls', ['endpoint', 'method', 'status'])
api_response_time = Histogram('api_response_time_seconds', 'API response time', ['endpoint'])

# リソース関連
memory_usage_bytes = Gauge('memory_usage_bytes', 'Memory usage in bytes')
cpu_usage_percent = Gauge('cpu_usage_percent', 'CPU usage percentage')
```

この仕様に基づいて、段階的にサーバーサイド機能を実装していくことで、安定性とスケーラビリティを確保したVibeInsightシステムを構築できます。