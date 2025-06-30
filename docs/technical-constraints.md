# 技術的制約とリスク分析

## 概要

VibeInsightの実装における技術的制約とリスクを網羅的に分析し、各課題に対する対策を示します。

## 1. 音声処理API制約

### 1.1 OpenAI Whisper API制限

#### 制限事項
| 項目 | 制限値 | 影響 |
|------|--------|------|
| ファイルサイズ | 25MB | 60分以上の音声で制限に達する可能性 |
| 対応フォーマット | mp3, mp4, mpeg, mpga, m4a, wav, webm | 一部の音声形式で変換が必要 |
| レート制限 | 50 requests/minute | 同時処理数の制約 |
| 最大処理時間 | 60秒/リクエスト | 長時間音声での処理失敗リスク |

#### 対策
```typescript
// ファイルサイズチェックと分割処理
const processLargeAudio = async (file: File) => {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  
  if (file.size > MAX_SIZE) {
    // 音声を20分セグメントに分割
    const segments = await splitAudioFile(file, 20 * 60); // 20分
    const results = await Promise.all(
      segments.map(segment => whisperAPI.transcribe(segment))
    );
    return mergeTranscriptions(results);
  }
  
  return await whisperAPI.transcribe(file);
};

// レート制限対応
const rateLimitedWhisper = new RateLimiter({
  tokensPerInterval: 50,
  interval: 'minute'
});
```

### 1.2 Google Gemini API制約

#### 制限事項
| 項目 | 制限値 | 影響 |
|------|--------|------|
| コンテキスト長 | 1M tokens | 長時間会話での分析精度低下 |
| レート制限 | 1,500 requests/minute | 同時分析処理の制約 |
| 出力トークン数 | 8,192 tokens | 詳細分析結果の制限 |
| リクエストサイズ | 20MB | 大量テキストでの制限 |

#### 対策
```typescript
// トークン数管理
const optimizePromptLength = (transcript: string) => {
  const encoder = new TextEncoder();
  const maxTokens = 800000; // 安全マージン
  
  if (encoder.encode(transcript).length > maxTokens) {
    // 重要部分の抽出
    return extractKeySegments(transcript, maxTokens * 0.8);
  }
  
  return transcript;
};

// 分析結果の段階的取得
const analyzeInStages = async (transcript: string) => {
  const stages = [
    { name: 'basic_metrics', priority: 1 },
    { name: 'coaching_skills', priority: 2 },
    { name: 'diagnosis', priority: 3 },
    { name: 'detailed_analysis', priority: 4 }
  ];
  
  const results = {};
  for (const stage of stages) {
    try {
      results[stage.name] = await geminiAPI.analyze(transcript, stage.name);
    } catch (error) {
      if (error.code === 'RATE_LIMIT') {
        await delay(exponentialBackoff(stage.priority));
        continue;
      }
      throw error;
    }
  }
  
  return results;
};
```

## 2. インフラストラクチャ制約

### 2.1 Supabase制限

#### Edge Functions制約
```typescript
// 制限値と対策
const SUPABASE_LIMITS = {
  CPU_TIME: 2000, // 2秒
  MEMORY: 150 * 1024 * 1024, // 150MB
  RESPONSE_SIZE: 6 * 1024 * 1024, // 6MB
  COLD_START: 400, // 400ms平均
  HOT_START: 125 // 125ms平均
};

// メモリ効率的な処理
const processAudioEfficiently = async (audioUrl: string) => {
  // ストリーミング処理でメモリ使用量を削減
  const audioStream = await fetch(audioUrl);
  const reader = audioStream.body?.getReader();
  
  const chunks = [];
  let totalSize = 0;
  
  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    
    totalSize += value.length;
    if (totalSize > SUPABASE_LIMITS.MEMORY * 0.8) {
      // メモリ制限に近づいたら一時保存
      await saveTemporaryChunk(chunks);
      chunks.length = 0;
      totalSize = 0;
    }
    
    chunks.push(value);
  }
  
  return processChunks(chunks);
};
```

#### データベース制約
```sql
-- 接続数制限
-- Free: 60 connections
-- Pro: 200 connections  
-- Team: 400 connections

-- 行レベルセキュリティによるパフォーマンス影響
CREATE INDEX CONCURRENTLY idx_sessions_user_id_created 
ON sessions(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- JSON列のインデックス最適化
CREATE INDEX idx_analysis_results_diagnosis 
ON analysis_results USING gin ((analysis_data -> 'diagnosis'));
```

### 2.2 Fly.io Storage制約

#### ストレージ制限
```typescript
// Fly.io S3互換ストレージの制約
const FLY_STORAGE_LIMITS = {
  MAX_OBJECT_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  MAX_MULTIPART_SIZE: 5 * 1024 * 1024 * 1024, // 5GB
  MIN_MULTIPART_CHUNK: 5 * 1024 * 1024, // 5MB
  MAX_MULTIPART_PARTS: 10000,
  MAX_KEYS_PER_REQUEST: 1000
};

// 大容量ファイル対応
const uploadLargeFile = async (file: File, bucketName: string) => {
  if (file.size > FLY_STORAGE_LIMITS.MIN_MULTIPART_CHUNK) {
    return await multipartUpload(file, bucketName);
  }
  
  return await simpleUpload(file, bucketName);
};

const multipartUpload = async (file: File, bucketName: string) => {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  
  if (chunks > FLY_STORAGE_LIMITS.MAX_MULTIPART_PARTS) {
    throw new Error('File too large for multipart upload');
  }
  
  // Implementation continues...
};
```

## 3. パフォーマンス制約

### 3.1 処理時間分析

#### 処理時間の内訳
```typescript
// 30分音声ファイルの想定処理時間
const PROCESSING_TIME_ESTIMATES = {
  upload: 30, // 30秒 (10Mbpsで15MB)
  whisper_transcription: 180, // 3分
  gemini_analysis: 60, // 1分
  result_storage: 5, // 5秒
  total: 275 // 約4.5分
};

// パフォーマンス監視
const monitorProcessingTime = async (sessionId: string, stage: string) => {
  const startTime = performance.now();
  
  try {
    const result = await processStage(stage);
    const duration = performance.now() - startTime;
    
    await logMetrics({
      sessionId,
      stage,
      duration,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    await logMetrics({
      sessionId,
      stage,
      duration,
      status: 'error',
      error: error.message
    });
    
    throw error;
  }
};
```

### 3.2 スケーラビリティ制約

#### 同時処理制限
```typescript
// 同時処理数の管理
class ProcessingQueue {
  private maxConcurrent = 10; // 同時処理数制限
  private currentProcessing = 0;
  private queue: ProcessingJob[] = [];
  
  async addJob(job: ProcessingJob): Promise<void> {
    if (this.currentProcessing < this.maxConcurrent) {
      this.processJob(job);
    } else {
      this.queue.push(job);
    }
  }
  
  private async processJob(job: ProcessingJob): Promise<void> {
    this.currentProcessing++;
    
    try {
      await job.execute();
    } finally {
      this.currentProcessing--;
      
      // キューから次のジョブを処理
      if (this.queue.length > 0) {
        const nextJob = this.queue.shift()!;
        this.processJob(nextJob);
      }
    }
  }
}

// リソース使用量監視
const monitorResourceUsage = () => {
  const memoryUsage = Deno.memoryUsage();
  const cpuUsage = performance.now();
  
  if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected', memoryUsage);
    // ガベージコレクション強制実行
    if (globalThis.gc) globalThis.gc();
  }
};
```

## 4. セキュリティ制約

### 4.1 認証・認可制約

#### JWT トークンサイズ制限
```typescript
// JWT ペイロードサイズ最適化
const optimizeJWTPayload = (user: User) => {
  // 必要最小限の情報のみ含める
  return {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1時間
    // 大きなデータは含めない
    // metadata: user.metadata // これは除外
  };
};

// Row Level Security最適化
-- パフォーマンスを考慮したRLSポリシー
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    auth.uid() = user_id 
    AND created_at > now() - interval '30 days' -- インデックス効率化
  );
```

### 4.2 データプライバシー制約

#### GDPR対応要件
```typescript
// データ削除ポリシー
const RETENTION_POLICIES = {
  audio_files: 7, // 7日後削除
  transcripts: 30, // 30日後匿名化
  analysis_results: 365, // 1年間保持
  user_sessions: 1095 // 3年間保持
};

// 自動削除機能
const scheduleDataDeletion = async () => {
  // 音声ファイルの自動削除
  const oldAudioFiles = await supabase
    .from('sessions')
    .select('id, fly_storage_url')
    .lt('created_at', new Date(Date.now() - RETENTION_POLICIES.audio_files * 24 * 60 * 60 * 1000));
  
  for (const session of oldAudioFiles.data || []) {
    await deleteFromFlyStorage(session.fly_storage_url);
    await supabase
      .from('sessions')
      .update({ fly_storage_url: null })
      .eq('id', session.id);
  }
};

// データ匿名化
const anonymizeTranscripts = async () => {
  const oldTranscripts = await supabase
    .from('transcripts')
    .select('*')
    .lt('created_at', new Date(Date.now() - RETENTION_POLICIES.transcripts * 24 * 60 * 60 * 1000));
  
  for (const transcript of oldTranscripts.data || []) {
    const anonymizedText = removePersonalInfo(transcript.text);
    await supabase
      .from('transcripts')
      .update({ 
        text: anonymizedText,
        anonymized: true 
      })
      .eq('id', transcript.id);
  }
};
```

## 5. コスト制約

### 5.1 APIコスト管理

#### 使用量監視と制限
```typescript
// コスト制限設定
const COST_LIMITS = {
  monthly_whisper_minutes: 1000, // $6/月
  monthly_gemini_tokens: 10_000_000, // $750/月
  monthly_storage_gb: 100, // $15/月
  total_monthly_limit: 1000 // $1000/月
};

// 使用量追跡
class CostTracker {
  async trackWhisperUsage(durationMinutes: number, userId: string) {
    const cost = durationMinutes * 0.006;
    
    await this.updateUsage(userId, 'whisper', {
      minutes: durationMinutes,
      cost
    });
    
    const monthlyUsage = await this.getMonthlyUsage(userId, 'whisper');
    if (monthlyUsage.cost > COST_LIMITS.monthly_whisper_minutes * 0.006) {
      throw new Error('Monthly Whisper usage limit exceeded');
    }
  }
  
  async trackGeminiUsage(tokens: number, userId: string) {
    const cost = tokens * 0.000075; // $0.075 per 1M tokens
    
    await this.updateUsage(userId, 'gemini', {
      tokens,
      cost
    });
  }
}
```

### 5.2 ストレージコスト最適化

#### データライフサイクル管理
```typescript
// ストレージ階層管理
const manageStorageLifecycle = async () => {
  // ホットストレージ（1週間）
  const recentFiles = await getFilesOlderThan(7);
  
  // コールドストレージに移動（1ヶ月〜1年）
  const coldFiles = await getFilesBetween(30, 365);
  for (const file of coldFiles) {
    await moveToFlyStorage(file, 'cold');
  }
  
  // アーカイブストレージ（1年以上）
  const archiveFiles = await getFilesOlderThan(365);
  for (const file of archiveFiles) {
    await moveToFlyStorage(file, 'archive');
  }
  
  // 削除（3年以上）
  const deleteFiles = await getFilesOlderThan(1095);
  for (const file of deleteFiles) {
    await deleteFromFlyStorage(file.url);
  }
};
```

## 6. 運用制約

### 6.1 監視・ログ制約

#### ログ管理
```typescript
// 構造化ログ
const logger = {
  info: (message: string, context: any) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      context,
      service: 'vibeinsight',
      version: Deno.env.get('APP_VERSION')
    }));
  },
  
  error: (message: string, error: Error, context: any) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      service: 'vibeinsight'
    }));
  }
};
```

### 6.2 災害復旧制約

#### バックアップ戦略
```typescript
// データバックアップ
const backupStrategy = {
  // 重要データの定期バックアップ
  criticalData: {
    frequency: 'daily',
    retention: '30 days',
    tables: ['users', 'sessions', 'analysis_results']
  },
  
  // 音声ファイルのバックアップ
  audioFiles: {
    frequency: 'weekly',
    retention: '7 days',
    strategy: 'incremental'
  }
};

const performBackup = async () => {
  // PostgreSQLデータのバックアップ
  await supabase.rpc('create_backup', {
    tables: backupStrategy.criticalData.tables
  });
  
  // Fly.io ストレージのバックアップ
  await flyStorage.createSnapshot('weekly-backup');
};
```

## まとめ

これらの技術的制約を理解し、適切な対策を講じることで、安定性とパフォーマンスを両立したVibeInsightシステムを構築できます。特に以下の点が重要です：

1. **API制限の監視**: 使用量とコストの継続的な追跡
2. **パフォーマンス最適化**: メモリとCPU使用量の効率化
3. **セキュリティ対策**: データプライバシーと認証の強化
4. **運用性の確保**: 監視、ログ、バックアップの自動化

定期的な制約の見直しと対策の更新により、長期的に安定したサービス提供を実現します。