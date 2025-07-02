# Supabase と Fly.io の統合ガイド

## 概要

VibeInsightでは、Supabase Edge FunctionsとFly.io S3互換ストレージを組み合わせて、セキュアで効率的な音声ファイル処理を実現します。本ドキュメントでは、統合における技術的制約と対策について詳しく解説します。

## アーキテクチャ図

```
[Client] ──Upload──> [Fly.io S3 Storage]
    │                        │
    │ WebSocket              │ Trigger
    ▼                        ▼
[Supabase Realtime] <── [Supabase Edge Functions] ──HTTP──> [Fly.io Docker Container]
    │                        │                                       │
    │                        │                               ├── [Whisper API]
    │                        │                               ├── [Gemini API]
    │                        │                               └── [ffmpeg/Audio Tools]
    │                        │                                       │
    │                        ▼                                       ▼
    └── Progress ────── [PostgreSQL Results] <──────────────────────┘
```

**重要な変更**: 音声処理はFly.io上のDockerコンテナで実行され、Supabase Edge Functionsは軽量なトリガー役割のみを担います。

## 1. Supabase Edge Functions から Fly.io S3 への認証

### 1.1 AWS SDK 互換性による認証

Fly.ioはAWS S3互換のAPIを提供しており、標準的なAWS SDKを使用して認証できます。Fly.ioではOIDC（OpenID Connect）を使用した認証システムを採用しています。

#### 環境変数（自動設定）
```bash
AWS_WEB_IDENTITY_TOKEN_FILE=/.fly/oidc_token
AWS_ROLE_SESSION_NAME=fly-session
AWS_ROLE_ARN=arn:aws:iam::your-account:role/fly-role
```

#### 認証フロー
1. `init`プロセスが`AWS_ROLE_ARN`環境変数を検出
2. `/v1/tokens/oidc`エンドポイントにリクエストを送信
3. OIDCトークンを`/.fly/oidc_token`に書き込み
4. AWS SDKが`AssumeRoleWithWebIdentity`を呼び出し
5. AWSが`https://oidc.fly.io/`でトークンを検証
6. STS認証情報が発行される

### 1.2 Supabase環境変数での安全な認証情報保存

#### セキュリティベストプラクティス
- ✅ **Service role keyは絶対にフロントエンドに公開しない**
- ✅ **環境変数に機密情報を保存**し、コードに直接記述しない
- ✅ **APIキーが漏洩した場合は即座に再生成**する

#### Edge Function内での認証情報取得
```typescript
// supabase/functions/process-audio/index.ts
const flyS3Config = {
  endpoint: Deno.env.get('FLY_S3_ENDPOINT'),
  accessKeyId: Deno.env.get('FLY_S3_ACCESS_KEY_ID'),
  secretAccessKey: Deno.env.get('FLY_S3_SECRET_ACCESS_KEY'),
  region: Deno.env.get('FLY_S3_REGION') || 'us-east-1'
};
```

### 1.3 CORS設定とプリサインURL

Fly.io内部ネットワークでのCORS設定では以下に注意が必要です：

```typescript
// プリサインURL生成例
const generatePresignedUrl = async (bucketName: string, objectKey: string) => {
  const s3Client = new S3Client(flyS3Config);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: 'audio/*'
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
```

**注意点**:
- 内部通信では`{app_name}.internal`ドメインを使用
- HTTPSはflycastでサポートされていないため、適切なCORS設定が必要

## 2. ネットワーク接続性

### 2.1 帯域幅制限

#### Supabaseプラン別制限
| プラン | 帯域幅制限 | 月額料金 |
|--------|------------|----------|
| Free | 5GB | $0 |
| Pro | 50GB | $25~ |
| Team | 250GB | $599~ |

**計算対象**:
- データベースからの転送
- ストレージからの転送
- Edge Functionsからの転送

#### 音声ファイルでの影響試算
```
30分音声ファイル（平均15MB）の場合：
- Free tier: 5GB ÷ 15MB = 約333ファイル/月
- Pro tier: 50GB ÷ 15MB = 約3,333ファイル/月
```

### 2.2 タイムアウト設定

#### Edge Functions制限
- **CPU実行時間**: 2秒制限
- **メモリ**: 150MB制限
- **レスポンスサイズ**: 6MB制限

#### 大容量ファイル対策
```typescript
// 5MB以上のファイルにはresumable uploadsを使用
const uploadLargeFile = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    // Resumable upload implementation
    return await resumableUpload(file);
  } else {
    // Standard upload
    return await standardUpload(file);
  }
};
```

**推奨対策**:
- 5MB以上のファイルにはresumable uploadsを使用
- CPU集約的なタスクはDockerコンテナ（LinodeやFly.io）で処理
- 非同期処理の活用でレスポンス時間を改善

### 2.3 リージョン間レイテンシ

#### パフォーマンス数値
- **コールドスタート**: 中央値400ms
- **ホットスタート**: 中央値125ms
- **地域差**: ±100msの変動

#### 最適化戦略
```typescript
// 地域最適化の実装例
const getOptimalRegion = () => {
  const userRegion = Deno.env.get('FLY_REGION');
  return userRegion || 'nrt'; // デフォルトは東京
};
```

## 3. WebSocket + Supabase Realtime の制約

### 3.1 同時接続数の上限

#### プラン別制限
| プラン | 同時接続数 | メッセージ/秒 | チャンネル参加/秒 |
|--------|------------|---------------|-------------------|
| Free | 200 | 100 | 100 |
| Pro | 500 | 500 | 500 |
| Pro (無制限) | 10,000 | 2,500 | 2,500 |
| Team | 10,000 | 2,500 | 2,500 |
| Enterprise | 10,000+ | 2,500+ | 2,500+ |

**重要**: 1ユーザーが5つのチャンネルを開いた場合、**5つの接続としてカウント**されます。

### 3.2 チャンネル数の制限

#### システム制限
- **接続あたり最大100チャンネル**
- **チャンネル参加は毎秒500回まで**（全プラン共通）

#### 実装における注意点
```typescript
// 効率的なチャンネル管理
const useProcessingChannel = (sessionId: string) => {
  useEffect(() => {
    // 1つのチャンネルで複数の状態を管理
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_status',
        filter: `session_id=eq.${sessionId}`
      }, handleStatusUpdate)
      .subscribe();
      
    return () => channel.unsubscribe();
  }, [sessionId]);
};
```

### 3.3 メッセージサイズ制限

#### サイズ制限
- **Broadcastペイロード**: 最大3,000KB（Pro以上）、256KB（Free）
- **Postgres変更ペイロード**: 最大1,024KB（全プラン）
- **Presenceメッセージ**: オブジェクトあたり最大10キー

#### 実装例
```typescript
// メッセージサイズの最適化
const updateProgress = async (sessionId: string, status: ProcessingStatus) => {
  // 大きなデータは分割して送信
  const compactStatus = {
    id: sessionId,
    status: status.status,
    progress: status.progress,
    // 詳細情報は別途取得
    timestamp: Date.now()
  };
  
  await supabase
    .from('processing_status')
    .upsert(compactStatus);
};
```

### 3.4 レート制限エラーの対処

#### 典型的なエラー
- `too_many_channels`: チャンネル数超過
- `too_many_connections`: 接続数超過
- `too_many_joins`: 参加レート超過
- `tenant_events`: メッセージレート超過

#### 対策実装
```typescript
// クライアント側レート制限
const rateLimitedUpdate = useCallback(
  throttle((update) => {
    sendUpdate(update);
  }, 1000), // 1秒に1回に制限
  []
);

// エラーハンドリング
const handleRealtimeError = (error: any) => {
  if (error.type === 'too_many_connections') {
    // 接続を一時的に削減
    reconnectWithBackoff();
  } else if (error.type === 'tenant_events') {
    // メッセージ送信頻度を下げる
    increaseThrottleInterval();
  }
};
```

## 4. 実装ベストプラクティス

### 4.1 認証情報管理
```bash
# Supabase環境変数設定
supabase secrets set FLY_S3_ENDPOINT=https://your-bucket.fly.storage.tigris.dev
supabase secrets set FLY_S3_ACCESS_KEY_ID=your_access_key
supabase secrets set FLY_S3_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set FLY_S3_BUCKET_NAME=vibeinsight-audio
```

### 4.2 エラーハンドリング戦略
```typescript
// 段階的フォールバック
const processAudioWithFallback = async (audioFile: File) => {
  try {
    // Primary: Fly.io S3 + Whisper + Gemini
    return await primaryProcessing(audioFile);
  } catch (error) {
    if (error.code === 'STORAGE_ERROR') {
      // Fallback: Supabase Storage
      return await supabaseStorageFallback(audioFile);
    } else if (error.code === 'API_RATE_LIMIT') {
      // Retry with exponential backoff
      return await retryWithBackoff(audioFile);
    }
    throw error;
  }
};
```

### 4.3 モニタリング指標
```typescript
// 重要なメトリクス
const monitoringMetrics = {
  // パフォーマンス
  averageProcessingTime: 'avg_processing_duration',
  connectionErrors: 'realtime_connection_failures',
  
  // コスト
  monthlyBandwidthUsage: 'bandwidth_usage_gb',
  apiCallCounts: 'api_calls_count',
  
  // 品質
  transcriptionAccuracy: 'whisper_confidence_score',
  analysisCompletionRate: 'gemini_success_rate'
};
```

## 5. トラブルシューティング

### 5.1 よくある問題と対策

| 問題 | 原因 | 対策 |
|------|------|------|
| 認証エラー | Fly.io S3認証情報不正 | 環境変数の再設定 |
| タイムアウト | Edge Function制限 | 非同期処理への変更 |
| 接続数超過 | Realtime制限 | チャンネル統合、接続管理 |
| 帯域幅超過 | 大容量ファイル処理 | ファイル圧縮、プラン変更 |

### 5.2 デバッグ手法
```typescript
// 詳細ログ設定
const debugConfig = {
  logLevel: Deno.env.get('LOG_LEVEL') || 'info',
  enableTracing: Deno.env.get('ENABLE_TRACING') === 'true',
  metricsEndpoint: Deno.env.get('METRICS_ENDPOINT')
};

const logWithContext = (level: string, message: string, context: any) => {
  if (debugConfig.enableTracing) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      traceId: context.sessionId
    }));
  }
};
```

## まとめ

この統合により、セキュアで効率的な音声処理システムを構築できますが、各サービスの制約を理解し、適切な対策を講じることが重要です。特に以下の点に注意してください：

1. **認証**: OIDC認証の適切な設定
2. **パフォーマンス**: Edge Function制限への対応
3. **スケーラビリティ**: Realtime接続数の管理
4. **コスト**: 帯域幅使用量の監視

適切な実装により、高品質で安定したVibeInsightサービスを提供できます。