# Fly.io Docker音声処理アーキテクチャ

## 概要

音声処理をFly.io上のDockerコンテナで実行することで、Supabase Edge Functionsの制約（2秒CPU制限、150MBメモリ制限）を回避し、より効率的で安定した音声処理を実現します。

## アーキテクチャ図

```
[Client] ──Upload──> [Fly.io S3 Storage]
    │                        │
    │ WebSocket              │ Trigger
    ▼                        ▼
[Supabase Realtime] <── [Fly.io Docker Container]
    │                        │
    │                        ├── [Whisper API]
    │                        ├── [Gemini API]
    │                        └── [ffmpeg/Audio Tools]
    │                        │
    │                        ▼
    └── Progress ──── [Supabase Database]
```

## 1. Fly.io Docker構成

### 1.1 Dockerfile設計

```dockerfile
# Dockerfile
FROM python:3.11-slim

# システム依存関係のインストール
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリ設定
WORKDIR /app

# Python依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード
COPY . .

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# ポート公開
EXPOSE 8080

# 実行コマンド
CMD ["python", "app.py"]
```

### 1.2 requirements.txt

```txt
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
httpx==0.25.2
python-multipart==0.0.6
boto3==1.34.0
supabase==2.0.0
openai==1.3.0
google-generativeai==0.3.0
pydub==0.25.1
numpy==1.24.3
python-dotenv==1.0.0
redis==5.0.1
celery==5.3.4
```

### 1.3 fly.toml設定

```toml
# fly.toml
app = "vibeinsight-audio-processor"
primary_region = "nrt"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  ENVIRONMENT = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[vm]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 2048

[metrics]
  port = 9091
  path = "/metrics"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  
  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true
  
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
  
  [[services.tcp_checks]]
    grace_period = "10s"
    interval = "30s"
    timeout = "5s"

[volumes]
  # 一時ファイル用ボリューム
  [[volumes.mounts]]
    source = "audio_temp"
    destination = "/tmp/audio"
    processes = ["app"]

[secrets]
  # 環境変数として設定
  OPENAI_API_KEY = ""
  GOOGLE_API_KEY = ""
  SUPABASE_URL = ""
  SUPABASE_SERVICE_KEY = ""
  FLY_S3_ACCESS_KEY_ID = ""
  FLY_S3_SECRET_ACCESS_KEY = ""
  FLY_S3_ENDPOINT = ""
  REDIS_URL = ""
```

## 2. 音声処理アプリケーション

### 2.1 FastAPI アプリケーション

```python
# app.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import asyncio
import httpx
import os
from audio_processor import AudioProcessor
from supabase_client import SupabaseClient
from s3_client import S3Client

app = FastAPI(title="VibeInsight Audio Processor", version="1.0.0")

# クライアント初期化
audio_processor = AudioProcessor()
supabase_client = SupabaseClient()
s3_client = S3Client()

class ProcessingRequest(BaseModel):
    session_id: str
    audio_url: str
    user_id: str

@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/process-audio")
async def process_audio(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks
):
    """音声処理のメインエンドポイント"""
    try:
        # バックグラウンドで音声処理を開始
        background_tasks.add_task(
            process_audio_background,
            request.session_id,
            request.audio_url,
            request.user_id
        )
        
        return {
            "message": "Processing started",
            "session_id": request.session_id,
            "status": "processing"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_audio_background(session_id: str, audio_url: str, user_id: str):
    """バックグラウンド音声処理"""
    try:
        # 進捗更新: ダウンロード開始
        await supabase_client.update_progress(
            session_id, "downloading", 10, "音声ファイルをダウンロード中..."
        )
        
        # S3から音声ファイルをダウンロード
        audio_file = await s3_client.download_file(audio_url)
        
        # 進捗更新: 前処理
        await supabase_client.update_progress(
            session_id, "preprocessing", 20, "音声ファイルを前処理中..."
        )
        
        # 音声前処理（フォーマット変換、ノイズ除去等）
        processed_audio = await audio_processor.preprocess_audio(audio_file)
        
        # 進捗更新: 文字起こし
        await supabase_client.update_progress(
            session_id, "transcribing", 40, "音声を文字に変換中..."
        )
        
        # Whisper APIで文字起こし
        transcript_result = await audio_processor.transcribe_with_whisper(
            processed_audio, session_id
        )
        
        # 進捗更新: 話者分離
        await supabase_client.update_progress(
            session_id, "diarization", 60, "話者を識別中..."
        )
        
        # 話者分離処理
        diarized_transcript = await audio_processor.perform_diarization(
            processed_audio, transcript_result
        )
        
        # 進捗更新: AI分析
        await supabase_client.update_progress(
            session_id, "analyzing", 80, "AIが会話を分析中..."
        )
        
        # Gemini APIで分析
        analysis_result = await audio_processor.analyze_with_gemini(
            diarized_transcript, session_id
        )
        
        # 進捗更新: 結果保存
        await supabase_client.update_progress(
            session_id, "saving", 95, "結果を保存中..."
        )
        
        # 結果をSupabaseに保存
        await supabase_client.save_analysis_results(
            session_id, diarized_transcript, analysis_result
        )
        
        # 一時ファイル削除
        await cleanup_temp_files(audio_file, processed_audio)
        
        # 進捗更新: 完了
        await supabase_client.update_progress(
            session_id, "completed", 100, "分析完了！"
        )
        
    except Exception as e:
        # エラー時の進捗更新
        await supabase_client.update_progress(
            session_id, "error", 0, f"エラーが発生しました: {str(e)}"
        )
        
        # エラーログ記録
        logger.error(f"Audio processing failed for session {session_id}: {str(e)}")
        
        # クリーンアップ
        await cleanup_temp_files(audio_file, processed_audio)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        reload=False
    )
```

### 2.2 音声処理クラス

```python
# audio_processor.py
import asyncio
import tempfile
import os
from pathlib import Path
from pydub import AudioSegment
from pydub.silence import split_on_silence
import openai
import google.generativeai as genai
import numpy as np
from typing import Dict, List, Tuple

class AudioProcessor:
    def __init__(self):
        # API クライアント初期化
        openai.api_key = os.getenv("OPENAI_API_KEY")
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        
        # 音声処理設定
        self.target_sample_rate = 16000
        self.max_whisper_size = 25 * 1024 * 1024  # 25MB
        self.chunk_duration = 20 * 60  # 20分
    
    async def preprocess_audio(self, audio_file_path: str) -> str:
        """音声ファイルの前処理"""
        try:
            # 音声ファイル読み込み
            audio = AudioSegment.from_file(audio_file_path)
            
            # サンプルレート正規化
            if audio.frame_rate != self.target_sample_rate:
                audio = audio.set_frame_rate(self.target_sample_rate)
            
            # モノラル変換
            if audio.channels > 1:
                audio = audio.set_channels(1)
            
            # 音量正規化
            audio = self.normalize_audio(audio)
            
            # ノイズ除去（基本的なもの）
            audio = self.reduce_noise(audio)
            
            # 一時ファイルに保存
            temp_file = tempfile.NamedTemporaryFile(
                suffix=".wav", delete=False, dir="/tmp/audio"
            )
            audio.export(temp_file.name, format="wav")
            
            return temp_file.name
            
        except Exception as e:
            raise Exception(f"Audio preprocessing failed: {str(e)}")
    
    def normalize_audio(self, audio: AudioSegment) -> AudioSegment:
        """音量正規化"""
        # 平均音量を-20dBFSに正規化
        change_in_dBFS = -20.0 - audio.dBFS
        return audio.apply_gain(change_in_dBFS)
    
    def reduce_noise(self, audio: AudioSegment) -> AudioSegment:
        """基本的なノイズ除去"""
        # 無音部分をトリミング
        return audio.strip_silence(silence_len=500, silence_thresh=-50)
    
    async def transcribe_with_whisper(self, audio_file_path: str, session_id: str) -> Dict:
        """Whisper APIで文字起こし"""
        try:
            file_size = os.path.getsize(audio_file_path)
            
            if file_size > self.max_whisper_size:
                # ファイルサイズが大きい場合は分割処理
                return await self.transcribe_large_file(audio_file_path, session_id)
            
            # 通常の処理
            with open(audio_file_path, "rb") as audio_file:
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: openai.Audio.transcribe(
                        "whisper-1",
                        audio_file,
                        response_format="verbose_json",
                        language="ja"
                    )
                )
            
            return response
            
        except Exception as e:
            raise Exception(f"Whisper transcription failed: {str(e)}")
    
    async def transcribe_large_file(self, audio_file_path: str, session_id: str) -> Dict:
        """大きなファイルの分割処理"""
        try:
            # 音声ファイルを読み込み
            audio = AudioSegment.from_file(audio_file_path)
            
            # チャンク分割
            chunk_length_ms = self.chunk_duration * 1000
            chunks = [
                audio[i:i + chunk_length_ms]
                for i in range(0, len(audio), chunk_length_ms)
            ]
            
            # 各チャンクを並列処理
            tasks = []
            for i, chunk in enumerate(chunks):
                chunk_file = f"/tmp/audio/chunk_{session_id}_{i}.wav"
                chunk.export(chunk_file, format="wav")
                
                task = self.transcribe_chunk(chunk_file, i)
                tasks.append(task)
            
            # 並列実行
            chunk_results = await asyncio.gather(*tasks)
            
            # 結果をマージ
            merged_result = self.merge_transcription_results(chunk_results)
            
            # 一時ファイル削除
            for i in range(len(chunks)):
                chunk_file = f"/tmp/audio/chunk_{session_id}_{i}.wav"
                if os.path.exists(chunk_file):
                    os.remove(chunk_file)
            
            return merged_result
            
        except Exception as e:
            raise Exception(f"Large file transcription failed: {str(e)}")
    
    async def transcribe_chunk(self, chunk_file: str, chunk_index: int) -> Dict:
        """個別チャンクの文字起こし"""
        with open(chunk_file, "rb") as audio_file:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: openai.Audio.transcribe(
                    "whisper-1",
                    audio_file,
                    response_format="verbose_json",
                    language="ja"
                )
            )
        
        # チャンクインデックスを追加
        response["chunk_index"] = chunk_index
        return response
    
    def merge_transcription_results(self, chunk_results: List[Dict]) -> Dict:
        """チャンク結果のマージ"""
        # チャンクインデックス順にソート
        chunk_results.sort(key=lambda x: x["chunk_index"])
        
        merged_segments = []
        time_offset = 0.0
        
        for chunk_result in chunk_results:
            for segment in chunk_result.get("segments", []):
                # 時間オフセットを調整
                segment["start"] += time_offset
                segment["end"] += time_offset
                merged_segments.append(segment)
            
            # 次のチャンクのオフセットを計算
            if chunk_result.get("segments"):
                time_offset = chunk_result["segments"][-1]["end"]
        
        # マージされた結果を構築
        merged_text = " ".join([segment["text"] for segment in merged_segments])
        
        return {
            "text": merged_text,
            "segments": merged_segments,
            "language": "ja"
        }
    
    async def perform_diarization(self, audio_file_path: str, transcript: Dict) -> Dict:
        """話者分離処理"""
        try:
            # pyannote.audioやspeechbrainを使用した話者分離
            # ここでは簡略化した実装例
            
            # 音声セグメントベースの簡易話者分離
            audio = AudioSegment.from_file(audio_file_path)
            segments = transcript.get("segments", [])
            
            # 音量ベースの簡易話者分離
            diarized_segments = []
            for segment in segments:
                start_ms = int(segment["start"] * 1000)
                end_ms = int(segment["end"] * 1000)
                
                # 該当部分の音声を取得
                segment_audio = audio[start_ms:end_ms]
                
                # 音量で話者を推定（簡易版）
                if segment_audio.dBFS > -25:
                    speaker = "coach"  # より大きな声
                else:
                    speaker = "client"  # より小さな声
                
                diarized_segments.append({
                    **segment,
                    "speaker": speaker
                })
            
            return {
                "text": transcript["text"],
                "segments": diarized_segments,
                "speakers": ["coach", "client"]
            }
            
        except Exception as e:
            # 話者分離に失敗した場合はデフォルト話者を設定
            segments = transcript.get("segments", [])
            for segment in segments:
                segment["speaker"] = "unknown"
            
            return {
                "text": transcript["text"],
                "segments": segments,
                "speakers": ["unknown"]
            }
    
    async def analyze_with_gemini(self, transcript_data: Dict, session_id: str) -> Dict:
        """Gemini APIで分析"""
        try:
            # プロンプト構築
            prompt = self.build_analysis_prompt(transcript_data)
            
            # Gemini API呼び出し
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(prompt)
            )
            
            # レスポンスをJSONに変換
            analysis_result = self.parse_gemini_response(response.text)
            
            return analysis_result
            
        except Exception as e:
            raise Exception(f"Gemini analysis failed: {str(e)}")
    
    def build_analysis_prompt(self, transcript_data: Dict) -> str:
        """分析用プロンプトの構築"""
        segments = transcript_data.get("segments", [])
        
        # 話者別の発言を整理
        conversation = []
        for segment in segments:
            speaker = segment.get("speaker", "unknown")
            text = segment.get("text", "")
            start_time = segment.get("start", 0)
            
            conversation.append(f"[{start_time:.1f}s] {speaker}: {text}")
        
        conversation_text = "\n".join(conversation)
        
        prompt = f"""
以下は1on1ミーティングの会話記録です。コーチング分析を行ってください。

会話記録:
{conversation_text}

以下の形式でJSONで回答してください:
{{
  "speaker_analysis": {{
    "coach_speaking_ratio": 0.6,
    "client_speaking_ratio": 0.4,
    "gini_coefficient": 0.2
  }},
  "coaching_skills": {{
    "listening": {{ "score": 4, "examples": ["具体的な発言例"] }},
    "questioning": {{ "score": 3, "examples": ["質問の例"] }},
    "empathy": {{ "score": 5, "examples": ["共感の例"] }},
    "feedback": {{ "score": 3, "examples": ["フィードバックの例"] }}
  }},
  "emotion_analysis": {{
    "coach": {{ "positive": 60, "neutral": 35, "negative": 5 }},
    "client": {{ "positive": 40, "neutral": 50, "negative": 10 }}
  }},
  "conversation_events": [
    {{ "type": "overlap", "speaker": "coach", "time": 120, "description": "発言の重複" }},
    {{ "type": "silence", "time": 180, "duration": 5, "description": "長い沈黙" }}
  ],
  "diagnosis": {{
    "name": "マシンガン・ソルバー",
    "icon": "🗣️",
    "description": "解決策を次々と提示するタイプ"
  }},
  "prescriptions": [
    "相手が話し終えた後、3秒待ってから話し始める",
    "質問をした後は、相手の回答を最後まで聞く"
  ]
}}
"""
        return prompt
    
    def parse_gemini_response(self, response_text: str) -> Dict:
        """Geminiレスポンスのパース"""
        try:
            # JSONブロックを抽出
            import json
            import re
            
            # ```json ブロックを探す
            json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group(1)
            else:
                # { } ブロックを探す
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_text = json_match.group(0)
                else:
                    raise Exception("JSON format not found in response")
            
            return json.loads(json_text)
            
        except Exception as e:
            # パースに失敗した場合はデフォルト値を返す
            return {
                "speaker_analysis": {
                    "coach_speaking_ratio": 0.5,
                    "client_speaking_ratio": 0.5,
                    "gini_coefficient": 0.0
                },
                "coaching_skills": {
                    "listening": {"score": 3, "examples": []},
                    "questioning": {"score": 3, "examples": []},
                    "empathy": {"score": 3, "examples": []},
                    "feedback": {"score": 3, "examples": []}
                },
                "emotion_analysis": {
                    "coach": {"positive": 50, "neutral": 40, "negative": 10},
                    "client": {"positive": 50, "neutral": 40, "negative": 10}
                },
                "conversation_events": [],
                "diagnosis": {
                    "name": "分析中",
                    "icon": "🤖",
                    "description": "分析処理中です"
                },
                "prescriptions": ["分析結果の準備中です"]
            }
```

## 3. デプロイと運用

### 3.1 デプロイコマンド

```bash
# Fly.ioアプリ作成
fly apps create vibeinsight-audio-processor

# シークレット設定
fly secrets set OPENAI_API_KEY="your_openai_key"
fly secrets set GOOGLE_API_KEY="your_google_key"
fly secrets set SUPABASE_URL="your_supabase_url"
fly secrets set SUPABASE_SERVICE_KEY="your_service_key"
fly secrets set FLY_S3_ACCESS_KEY_ID="your_s3_key"
fly secrets set FLY_S3_SECRET_ACCESS_KEY="your_s3_secret"

# ボリューム作成
fly volumes create audio_temp --region nrt --size 10

# デプロイ
fly deploy

# ログ確認
fly logs

# スケーリング
fly scale count 2
fly scale memory 4096
```

### 3.2 監視設定

```python
# monitoring.py
import time
import psutil
from prometheus_client import Counter, Histogram, Gauge
from fastapi import Request
import logging

# メトリクス定義
processing_requests_total = Counter(
    'audio_processing_requests_total',
    'Total audio processing requests',
    ['status']
)

processing_duration_seconds = Histogram(
    'audio_processing_duration_seconds',
    'Audio processing duration in seconds',
    ['stage']
)

active_processing_jobs = Gauge(
    'active_processing_jobs',
    'Number of active processing jobs'
)

memory_usage_bytes = Gauge(
    'memory_usage_bytes',
    'Memory usage in bytes'
)

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ProcessingMonitor:
    def __init__(self):
        self.active_jobs = 0
    
    def start_job(self, session_id: str):
        self.active_jobs += 1
        active_processing_jobs.set(self.active_jobs)
        logger.info(f"Started processing job: {session_id}")
    
    def complete_job(self, session_id: str, status: str, duration: float):
        self.active_jobs -= 1
        active_processing_jobs.set(self.active_jobs)
        processing_requests_total.labels(status=status).inc()
        logger.info(f"Completed processing job: {session_id}, status: {status}, duration: {duration}s")
    
    def record_stage_duration(self, stage: str, duration: float):
        processing_duration_seconds.labels(stage=stage).observe(duration)
    
    def update_system_metrics(self):
        """システムメトリクスの更新"""
        memory_info = psutil.virtual_memory()
        memory_usage_bytes.set(memory_info.used)

monitor = ProcessingMonitor()
```

## 4. Supabase連携の更新

### 4.1 Edge Function (軽量化)

```typescript
// supabase/functions/trigger-audio-processing/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { sessionId, audioUrl, userId } = await req.json();
    
    // Fly.io Dockerコンテナに処理リクエストを送信
    const processingResponse = await fetch(
      `${Deno.env.get('FLY_AUDIO_PROCESSOR_URL')}/process-audio`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('FLY_AUTH_TOKEN')}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          audio_url: audioUrl,
          user_id: userId
        })
      }
    );
    
    if (!processingResponse.ok) {
      throw new Error(`Processing request failed: ${processingResponse.statusText}`);
    }
    
    const result = await processingResponse.json();
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

## 5. メリットと制約解決

### 5.1 解決される制約

| 制約 | Supabase Edge Functions | Fly.io Docker |
|------|-------------------------|---------------|
| **CPU時間** | 2秒制限 | ✅ 無制限 |
| **メモリ** | 150MB制限 | ✅ 最大8GB |
| **処理時間** | タイムアウトリスク | ✅ 長時間処理対応 |
| **依存関係** | 限定的 | ✅ 任意のライブラリ |
| **並列処理** | 制限あり | ✅ 自由な制御 |

### 5.2 追加されるメリット

- **専用リソース**: CPU/メモリを音声処理専用に使用
- **スケーラビリティ**: 負荷に応じた自動スケーリング
- **モニタリング**: 詳細なメトリクス取得
- **柔軟性**: 音声処理ライブラリの自由な選択

この構成により、高品質で安定した音声処理システムを構築できます。