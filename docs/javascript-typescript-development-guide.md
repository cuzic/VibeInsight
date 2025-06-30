# VibeInsight JavaScript/TypeScript 開発ガイド（2025年版）

## 概要

このガイドは、VibeInsight プロジェクトに特化したJavaScript/TypeScript開発のベストプラクティスを定義します。2025年の最新技術スタンダードとVibeInsightの特殊要件（音声処理、リアルタイム可視化、Chart.js統合）を考慮した実装指針を提供します。

## 目次

1. [技術スタック構成](#1-技術スタック構成)
2. [プロジェクト構造](#2-プロジェクト構造)
3. [TypeScript設定](#3-typescript設定)
4. [コード品質・フォーマット](#4-コード品質フォーマット)
5. [状態管理戦略](#5-状態管理戦略)
6. [Chart.js統合ガイドライン](#6-chartjs統合ガイドライン)
7. [CSS Grid タイムライン実装](#7-css-grid-タイムライン実装)
8. [モックデータ生成標準](#8-モックデータ生成標準)
9. [Supabase統合パターン](#9-supabase統合パターン)
10. [テスト戦略](#10-テスト戦略)
11. [パフォーマンス最適化](#11-パフォーマンス最適化)
12. [VS Code設定](#12-vs-code設定)

---

## 1. 技術スタック構成

### 1.1 メインスタック

```json
{
  "runtime": "Bun v1.1.0+",
  "frontend": {
    "framework": "React 18.3+",
    "bundler": "Vite 5.0+",
    "language": "TypeScript 5.4+",
    "styling": "Tailwind CSS 3.4+"
  },
  "visualization": {
    "charts": "Chart.js 4.4+ + react-chartjs-2",
    "timeline": "CSS Grid + 絶対配置",
    "ui_components": "Headless UI + Heroicons"
  },
  "backend_integration": {
    "database": "Supabase (PostgreSQL + Realtime)",
    "authentication": "Supabase Auth",
    "processing": "Fly.io Docker"
  }
}
```

### 1.2 開発ツール

```json
{
  "package_manager": "bun",
  "formatter": "Prettier 3.6+",
  "linter": "ESLint 9.0+ (Flat Config)",
  "testing": "Vitest + React Testing Library",
  "type_checking": "TypeScript strict mode"
}
```

---

## 2. プロジェクト構造

### 2.1 推奨ディレクトリ構造

```
src/
├── components/           # React コンポーネント
│   ├── charts/          # Chart.js コンポーネント
│   ├── timeline/        # タイムライン関連コンポーネント
│   ├── tabs/            # タブコンテンツコンポーネント
│   ├── ui/              # 汎用UIコンポーネント
│   └── forms/           # フォーム関連
├── hooks/               # カスタムフック
├── lib/                 # 設定・ユーティリティ
│   ├── supabase.ts      # Supabase設定
│   ├── chartjs-config.ts # Chart.js設定
│   └── utils.ts         # 汎用ユーティリティ
├── mocks/               # モックデータ
│   ├── analysisResults.ts
│   ├── timelineGenerator.ts
│   └── sessionData.ts
├── types/               # TypeScript型定義
│   ├── analysis.ts      # 分析結果型
│   ├── events.ts        # イベント関連型
│   ├── charts.ts        # Chart.js拡張型
│   └── supabase.ts      # Supabase型定義
├── utils/               # ビジネスロジック
│   ├── chartDataTransformers.ts
│   ├── timelineCalculations.ts
│   └── audioProcessing.ts
└── styles/              # グローバルCSS
    ├── globals.css
    └── timeline.css
```

### 2.2 ファイル命名規則

```typescript
// コンポーネント: PascalCase
SpeakerRatioChart.tsx
EventTimeline.tsx
ReportLayout.tsx

// フック: camelCase with 'use' prefix
useSessionData.ts
useRealtimeProgress.ts
useAudioProcessing.ts

// ユーティリティ: camelCase
chartDataTransformers.ts
timelineCalculations.ts

// 型定義: camelCase with 'types' suffix
analysisTypes.ts
eventTypes.ts

// モック: camelCase with 'mock' prefix
mockAnalysisResults.ts
mockSessionData.ts
```

---

## 3. TypeScript設定

### 3.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/mocks/*": ["./src/mocks/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.2 VibeInsight固有型定義

```typescript
// src/types/analysis.ts
export interface Session {
  id: string;
  title: string;
  participant_name: string;
  duration_seconds: number;
  recorded_at: string;
  created_at: string;
  user_id: string;
  status: SessionStatus;
}

export type SessionStatus = 
  | 'uploading' 
  | 'preprocessing' 
  | 'transcribing' 
  | 'diarization' 
  | 'analyzing' 
  | 'completed' 
  | 'error';

export interface SpeakingSegment {
  id: string;
  speaker: 'coach' | 'client';
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

export interface ConversationEvent {
  id: string;
  type: ConversationEventType;
  speaker: 'coach' | 'client' | 'both';
  timestamp: number;
  duration?: number;
  icon: string;
  metadata?: Record<string, unknown>;
}

export type ConversationEventType = 
  | 'overlap' 
  | 'silence' 
  | 'speed_up' 
  | 'speed_down' 
  | 'volume_up' 
  | 'volume_down' 
  | 'pitch_up' 
  | 'pitch_down'
  | 'positive_emotion'
  | 'negative_emotion'
  | 'neutral_emotion'
  | 'listening'
  | 'questioning'
  | 'empathy'
  | 'feedback';

// Chart.js拡張型
export interface ChartDataTransformer<T> {
  (data: T): ChartData<'pie' | 'bar' | 'radar' | 'line'>;
}

export interface TimelinePosition {
  x: number; // percentage (0-100)
  y: number; // pixels from top
}

export interface EventOverlapResolver {
  adjustPositions(events: ConversationEvent[]): ConversationEvent[];
  calculateCollisions(events: ConversationEvent[]): boolean;
}
```

---

## 4. コード品質・フォーマット

### 4.1 ESLint設定（Flat Config）

```javascript
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      // TypeScript特化ルール
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      
      // React特化ルール
      'react/jsx-uses-react': 'off', // React 17+では不要
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // VibeInsight特化ルール
      'no-console': 'warn', // 本番環境では除去
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  {
    // Chart.js コンポーネント特別ルール
    files: ['**/charts/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Chart.js型は複雑
    }
  },
  {
    // モックファイル特別ルール
    files: ['**/mocks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // モックデータは柔軟に
      'no-console': 'off'
    }
  }
];
```

### 4.2 Prettier設定

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "endOfLine": "lf",
  "arrowParens": "avoid",
  "bracketSpacing": true,
  "jsxSingleQuote": true,
  "quoteProps": "as-needed"
}
```

---

## 5. 状態管理戦略

### 5.1 Zustand使用パターン

```typescript
// src/stores/sessionStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SessionState {
  currentSession: Session | null;
  analysisResult: AnalysisResult | null;
  processingStatus: ProcessingStatus;
  isLoading: boolean;
  error: string | null;
}

interface SessionActions {
  setCurrentSession: (session: Session) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  updateProcessingStatus: (status: ProcessingStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  devtools(
    set => ({
      // State
      currentSession: null,
      analysisResult: null,
      processingStatus: { status: 'pending', progress: 0, message: '' },
      isLoading: false,
      error: null,

      // Actions
      setCurrentSession: session => set({ currentSession: session }),
      setAnalysisResult: result => set({ analysisResult: result }),
      updateProcessingStatus: status => set({ processingStatus: status }),
      setLoading: loading => set({ isLoading: loading }),
      setError: error => set({ error }),
      reset: () => set({
        currentSession: null,
        analysisResult: null,
        processingStatus: { status: 'pending', progress: 0, message: '' },
        isLoading: false,
        error: null
      })
    }),
    { name: 'session-store' }
  )
);

// React Query との統合
export const useSessionData = (sessionId: string) => {
  const { setCurrentSession, setAnalysisResult, setError } = useSessionStore();

  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, analysis_results(*)')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      setCurrentSession(data);
      if (data.analysis_results) {
        setAnalysisResult(data.analysis_results);
      }
      
      return data;
    },
    onError: (error: Error) => setError(error.message)
  });
};
```

### 5.2 リアルタイム状態管理

```typescript
// src/hooks/useRealtimeProgress.ts
export const useRealtimeProgress = (sessionId: string) => {
  const { updateProcessingStatus } = useSessionStore();

  useEffect(() => {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_status',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newStatus = payload.new as ProcessingStatus;
        updateProcessingStatus(newStatus);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, updateProcessingStatus]);
};
```

---

## 6. Chart.js統合ガイドライン

### 6.1 Chart.js設定

```typescript
// src/lib/chartjs-config.ts
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// VibeInsight共通テーマ
export const vibeInsightChartTheme = {
  colors: {
    coach: '#3B82F6',      // blue-500
    client: '#10B981',     // emerald-500
    positive: '#22C55E',   // green-500
    neutral: '#9CA3AF',    // gray-400
    negative: '#EF4444',   // red-500
    background: '#F9FAFB', // gray-50
    border: '#E5E7EB'      // gray-200
  },
  fonts: {
    family: 'Inter, sans-serif',
    size: {
      title: 16,
      label: 14,
      tick: 12
    }
  }
} as const;

// 共通オプション
export const createChartOptions = (
  type: 'pie' | 'bar' | 'radar' | 'line'
): ChartOptions<typeof type> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          family: vibeInsightChartTheme.fonts.family,
          size: vibeInsightChartTheme.fonts.size.label
        },
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      borderColor: vibeInsightChartTheme.colors.border,
      borderWidth: 1,
      cornerRadius: 8,
      titleFont: {
        family: vibeInsightChartTheme.fonts.family,
        size: vibeInsightChartTheme.fonts.size.label
      },
      bodyFont: {
        family: vibeInsightChartTheme.fonts.family,
        size: vibeInsightChartTheme.fonts.size.tick
      }
    }
  }
});
```

### 6.2 Chart.jsコンポーネントパターン

```typescript
// src/components/charts/SpeakerRatioChart.tsx
import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { createChartOptions, vibeInsightChartTheme } from '@/lib/chartjs-config';
import type { SpeakerAnalysis } from '@/types/analysis';

interface SpeakerRatioChartProps {
  speakerAnalysis: SpeakerAnalysis;
  className?: string;
}

export const SpeakerRatioChart: React.FC<SpeakerRatioChartProps> = ({
  speakerAnalysis,
  className = 'h-64'
}) => {
  const chartData = useMemo(() => ({
    labels: ['あなた（コーチ）', 'クライアント'],
    datasets: [{
      data: [
        Math.round(speakerAnalysis.coach_speaking_ratio * 100),
        Math.round(speakerAnalysis.client_speaking_ratio * 100)
      ],
      backgroundColor: [
        vibeInsightChartTheme.colors.coach,
        vibeInsightChartTheme.colors.client
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  }), [speakerAnalysis]);

  const options = useMemo(() => ({
    ...createChartOptions('pie'),
    plugins: {
      ...createChartOptions('pie').plugins,
      tooltip: {
        ...createChartOptions('pie').plugins?.tooltip,
        callbacks: {
          label: (context: any) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  }), []);

  return (
    <div className={className}>
      <Pie data={chartData} options={options} />
    </div>
  );
};
```

---

## 7. CSS Grid タイムライン実装

### 7.1 タイムライン基盤コンポーネント

```typescript
// src/components/timeline/EventTimeline.tsx
import React, { useMemo } from 'react';
import { TimelineGrid } from './TimelineGrid';
import { SpeakingSegments } from './SpeakingSegments';
import { EventMarkers } from './EventMarkers';
import { SpeakerLabels } from './SpeakerLabels';
import { EventLegend } from './EventLegend';
import type { TimelineData } from '@/types/timeline';

interface EventTimelineProps {
  timelineData: TimelineData;
  className?: string;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  timelineData,
  className = ''
}) => {
  const { speakingSegments, conversationEvents, duration } = timelineData;

  // 時間軸の分割数（5分間隔）
  const timeMarkers = useMemo(() => {
    const intervals = Math.ceil(duration / 300); // 5分 = 300秒
    return Array.from({ length: intervals + 1 }, (_, i) => i * 5);
  }, [duration]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">会話イベントタイムライン</h3>
      
      {/* 時間軸ヘッダー */}
      <div className="relative mb-4">
        <div className="flex justify-between text-sm text-gray-500">
          {timeMarkers.map(minute => (
            <span key={minute} className="flex-shrink-0">
              {minute}分
            </span>
          ))}
        </div>
        <div className="w-full h-px bg-gray-300 mt-1" />
      </div>

      {/* タイムライン本体 */}
      <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden timeline-container">
        {/* CSS Grid背景 */}
        <TimelineGrid duration={duration} />
        
        {/* 発話セグメント */}
        <SpeakingSegments 
          segments={speakingSegments} 
          duration={duration} 
        />
        
        {/* イベントマーカー */}
        <EventMarkers 
          events={conversationEvents} 
          duration={duration} 
        />
        
        {/* 話者ラベル */}
        <SpeakerLabels />
      </div>
      
      {/* 凡例 */}
      <EventLegend />
    </div>
  );
};
```

### 7.2 位置計算ユーティリティ

```typescript
// src/utils/timelineCalculations.ts
import type { ConversationEvent, SpeakingSegment } from '@/types/analysis';

export interface TimelinePosition {
  left: string;
  width?: string;
  top: string;
}

export const calculateSegmentPosition = (
  segment: SpeakingSegment,
  totalDuration: number
): TimelinePosition => {
  const leftPercent = (segment.start_time / totalDuration) * 100;
  const widthPercent = ((segment.end_time - segment.start_time) / totalDuration) * 100;
  
  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    top: segment.speaker === 'coach' ? '16px' : '80px'
  };
};

export const calculateEventPosition = (
  event: ConversationEvent,
  totalDuration: number
): TimelinePosition => {
  const leftPercent = (event.timestamp / totalDuration) * 100;
  const baseTop = event.speaker === 'coach' ? 45 : 105;
  
  // イベントタイプによる縦位置調整
  const typeOffset = getEventTypeOffset(event.type);
  
  return {
    left: `${leftPercent}%`,
    top: `${baseTop + typeOffset}px`
  };
};

const getEventTypeOffset = (type: string): number => {
  const emotionalEvents = ['positive_emotion', 'negative_emotion', 'neutral_emotion'];
  const skillEvents = ['listening', 'questioning', 'empathy', 'feedback'];
  const acousticEvents = ['overlap', 'silence', 'speed_up', 'speed_down'];
  
  if (emotionalEvents.includes(type)) return 0;
  if (skillEvents.includes(type)) return 15;
  if (acousticEvents.includes(type)) return 30;
  
  return 0;
};

// オーバーラップ解決アルゴリズム
export const resolveEventOverlaps = (
  events: ConversationEvent[],
  totalDuration: number,
  minGapPixels: number = 20
): ConversationEvent[] => {
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const containerWidth = 800; // 想定コンテナ幅
  const minGapPercent = (minGapPixels / containerWidth) * 100;
  const minGapTime = (minGapPercent / 100) * totalDuration;
  
  for (let i = 1; i < sortedEvents.length; i++) {
    const prevEvent = sortedEvents[i - 1];
    const currentEvent = sortedEvents[i];
    
    if (currentEvent.timestamp - prevEvent.timestamp < minGapTime) {
      // イベントを下の段にずらす
      currentEvent.metadata = {
        ...currentEvent.metadata,
        verticalOffset: 25
      };
    }
  }
  
  return sortedEvents;
};
```

---

## 8. モックデータ生成標準

### 8.1 一貫性のあるモックデータ生成

```typescript
// src/mocks/mockDataGenerator.ts
import type { 
  AnalysisResult, 
  DiagnosisType, 
  ConversationEvent,
  SpeakingSegment 
} from '@/types/analysis';

export interface MockGenerationParams {
  diagnosisType: DiagnosisType;
  duration: number;
  coachSpeakingRatio: number;
  emotionalProfile: 'positive' | 'neutral' | 'negative' | 'mixed';
  complexity: 'simple' | 'moderate' | 'complex';
}

export class MockDataGenerator {
  generateAnalysisResult(params: MockGenerationParams): AnalysisResult {
    const session = this.generateSession(params);
    const speakingSegments = this.generateSpeakingSegments(params);
    const conversationEvents = this.generateConversationEvents(params);
    const coachingSkills = this.generateCoachingSkills(params);
    const emotionAnalysis = this.generateEmotionAnalysis(params);
    const diagnosis = this.getDiagnosisForType(params.diagnosisType);
    const prescriptions = this.generatePrescriptions(params.diagnosisType);

    return {
      session,
      speaker_analysis: this.calculateSpeakerAnalysis(speakingSegments),
      coaching_skills: coachingSkills,
      emotion_analysis: emotionAnalysis,
      conversation_events: conversationEvents,
      diagnosis,
      prescriptions,
      speaking_segments: speakingSegments
    };
  }

  private generateSpeakingSegments(params: MockGenerationParams): SpeakingSegment[] {
    const segments: SpeakingSegment[] = [];
    const { duration, coachSpeakingRatio, diagnosisType } = params;
    
    // 診断タイプに基づくパターン生成
    switch (diagnosisType) {
      case 'machinegun_solver':
        return this.generateMachinegunPattern(duration, coachSpeakingRatio);
      case 'silent_supporter':
        return this.generateSilentPattern(duration, coachSpeakingRatio);
      case 'balanced_conductor':
        return this.generateBalancedPattern(duration, coachSpeakingRatio);
      default:
        return this.generateDefaultPattern(duration, coachSpeakingRatio);
    }
  }

  private generateMachinegunPattern(
    duration: number, 
    coachRatio: number
  ): SpeakingSegment[] {
    const segments: SpeakingSegment[] = [];
    let currentTime = 0;
    let segmentId = 0;

    while (currentTime < duration) {
      // コーチの短い発話が多数
      if (Math.random() < coachRatio) {
        const segmentDuration = Math.random() * 20 + 10; // 10-30秒
        segments.push({
          id: `segment-${++segmentId}`,
          speaker: 'coach',
          start_time: currentTime,
          end_time: currentTime + segmentDuration,
          text: this.generateCoachText('questioning'),
          confidence: 0.85 + Math.random() * 0.1
        });
        currentTime += segmentDuration;
      }
      
      // クライアントの短い返答
      if (currentTime < duration) {
        const segmentDuration = Math.random() * 10 + 5; // 5-15秒
        segments.push({
          id: `segment-${++segmentId}`,
          speaker: 'client',
          start_time: currentTime,
          end_time: currentTime + segmentDuration,
          text: this.generateClientText('brief_response'),
          confidence: 0.8 + Math.random() * 0.15
        });
        currentTime += segmentDuration + Math.random() * 5; // 短い間
      }
    }

    return segments;
  }

  private generateConversationEvents(params: MockGenerationParams): ConversationEvent[] {
    const events: ConversationEvent[] = [];
    const { duration, diagnosisType } = params;
    
    // 診断タイプ別イベント密度
    const eventConfig = this.getEventConfigForDiagnosis(diagnosisType);
    
    // オーバーラップイベント生成
    for (let i = 0; i < eventConfig.overlapCount; i++) {
      events.push({
        id: `event-overlap-${i}`,
        type: 'overlap',
        speaker: 'both',
        timestamp: Math.random() * duration,
        duration: 2 + Math.random() * 3,
        icon: '💥',
        metadata: { intensity: Math.random() }
      });
    }
    
    // 沈黙イベント生成
    for (let i = 0; i < eventConfig.silenceCount; i++) {
      events.push({
        id: `event-silence-${i}`,
        type: 'silence',
        speaker: 'both',
        timestamp: Math.random() * duration,
        duration: 3 + Math.random() * 7,
        icon: '🤫',
        metadata: { type: 'natural_pause' }
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  private getEventConfigForDiagnosis(type: DiagnosisType) {
    switch (type) {
      case 'machinegun_solver':
        return { overlapCount: 5, silenceCount: 0, emotionVariety: 'low' };
      case 'silent_supporter':
        return { overlapCount: 0, silenceCount: 8, emotionVariety: 'low' };
      case 'balanced_conductor':
        return { overlapCount: 1, silenceCount: 3, emotionVariety: 'high' };
      default:
        return { overlapCount: 2, silenceCount: 4, emotionVariety: 'medium' };
    }
  }
}

// 使用例
export const mockDataGenerator = new MockDataGenerator();

export const getMockAnalysisResult = (type: DiagnosisType): AnalysisResult => {
  const params: MockGenerationParams = {
    diagnosisType: type,
    duration: 1800, // 30分
    coachSpeakingRatio: type === 'machinegun_solver' ? 0.75 : 
                       type === 'silent_supporter' ? 0.30 : 0.55,
    emotionalProfile: 'mixed',
    complexity: 'moderate'
  };
  
  return mockDataGenerator.generateAnalysisResult(params);
};
```

---

## 9. Supabase統合パターン

### 9.1 型安全なSupabaseクライアント

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// 型安全なヘルパー関数
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// セッション管理関数
export const fetchSessionWithAnalysis = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      analysis_results (*),
      conversation_events (*),
      speaking_segments (*)
    `)
    .eq('id', sessionId)
    .single();
    
  if (error) throw error;
  return data;
};

// リアルタイム購読ヘルパー
export const subscribeToProcessingUpdates = (
  sessionId: string,
  callback: (update: ProcessingStatus) => void
) => {
  return supabase
    .channel(`session:${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'processing_status',
      filter: `session_id=eq.${sessionId}`
    }, (payload) => {
      callback(payload.new as ProcessingStatus);
    })
    .subscribe();
};
```

### 9.2 React Query統合

```typescript
// src/hooks/useSessionQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, fetchSessionWithAnalysis } from '@/lib/supabase';

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSessionWithAnalysis(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5分間
    gcTime: 10 * 60 * 1000,   // 10分間
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: Partial<Session>) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (newSession) => {
      queryClient.setQueryData(['session', newSession.id], newSession);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
    },
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  });
};
```

---

## 10. テスト戦略

### 10.1 Vitest設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 10.2 Chart.jsコンポーネントテスト

```typescript
// src/components/charts/__tests__/SpeakerRatioChart.test.tsx
import { render, screen } from '@testing-library/react';
import { SpeakerRatioChart } from '../SpeakerRatioChart';
import type { SpeakerAnalysis } from '@/types/analysis';

// Chart.jsのモック
vi.mock('react-chartjs-2', () => ({
  Pie: vi.fn(({ data, options }) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}));

describe('SpeakerRatioChart', () => {
  const mockSpeakerAnalysis: SpeakerAnalysis = {
    coach_speaking_ratio: 0.6,
    client_speaking_ratio: 0.4,
    gini_coefficient: 0.2,
    turn_taking_balance: 0.8
  };

  it('renders chart with correct data', () => {
    render(<SpeakerRatioChart speakerAnalysis={mockSpeakerAnalysis} />);
    
    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent!);
    
    expect(data.labels).toEqual(['あなた（コーチ）', 'クライアント']);
    expect(data.datasets[0].data).toEqual([60, 40]);
  });

  it('applies correct colors', () => {
    render(<SpeakerRatioChart speakerAnalysis={mockSpeakerAnalysis} />);
    
    const chartData = screen.getByTestId('chart-data');
    const data = JSON.parse(chartData.textContent!);
    
    expect(data.datasets[0].backgroundColor).toContain('#3B82F6'); // coach color
    expect(data.datasets[0].backgroundColor).toContain('#10B981'); // client color
  });
});
```

### 10.3 タイムライン計算ユーティリティテスト

```typescript
// src/utils/__tests__/timelineCalculations.test.ts
import { 
  calculateSegmentPosition, 
  calculateEventPosition,
  resolveEventOverlaps 
} from '../timelineCalculations';

describe('timelineCalculations', () => {
  describe('calculateSegmentPosition', () => {
    it('calculates correct position for segment', () => {
      const segment = {
        id: 'test',
        speaker: 'coach' as const,
        start_time: 60,  // 1分
        end_time: 120,   // 2分
        text: 'test',
        confidence: 0.9
      };
      
      const position = calculateSegmentPosition(segment, 600); // 10分総時間
      
      expect(position.left).toBe('10%');   // 60/600 * 100
      expect(position.width).toBe('10%');  // (120-60)/600 * 100
      expect(position.top).toBe('16px');   // coach position
    });
  });

  describe('resolveEventOverlaps', () => {
    it('adjusts overlapping events vertically', () => {
      const events = [
        { 
          id: '1', 
          timestamp: 100, 
          type: 'overlap' as const,
          speaker: 'coach' as const,
          icon: '💥',
          metadata: {}
        },
        { 
          id: '2', 
          timestamp: 105, 
          type: 'silence' as const,
          speaker: 'both' as const,
          icon: '🤫',
          metadata: {}
        }
      ];
      
      const resolvedEvents = resolveEventOverlaps(events, 600, 20);
      
      // 2番目のイベントに垂直オフセットが付加される
      expect(resolvedEvents[1].metadata?.verticalOffset).toBe(25);
    });
  });
});
```

### 10.4 E2Eテスト（Playwright）

```typescript
// tests/report-screen.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('1on1分析レポート画面', () => {
  test.beforeEach(async ({ page }) => {
    // モックデータでセッション画面へ
    await page.goto('/sessions/mock-session-1');
  });

  test('タブナビゲーションが正常に動作する', async ({ page }) => {
    // 概要タブがデフォルトで選択されている
    await expect(page.locator('[data-testid="tab-overview"]')).toHaveClass(/selected/);
    
    // 会話ダイナミクスタブをクリック
    await page.click('[data-testid="tab-conversation-dynamics"]');
    await expect(page.locator('[data-testid="tab-conversation-dynamics"]')).toHaveClass(/selected/);
    
    // タイムラインが表示される
    await expect(page.locator('[data-testid="event-timeline"]')).toBeVisible();
  });

  test('Chart.jsグラフが正常にレンダリングされる', async ({ page }) => {
    // 円グラフ（発話比率）の確認
    await expect(page.locator('canvas')).toHaveCount(2); // 2つのチャート
    
    // グラフの凡例が表示される
    await expect(page.locator('text=あなた（コーチ）')).toBeVisible();
    await expect(page.locator('text=クライアント')).toBeVisible();
  });

  test('イベントタイムラインのインタラクションが動作する', async ({ page }) => {
    await page.click('[data-testid="tab-conversation-dynamics"]');
    
    // イベントアイコンにホバー
    await page.hover('[data-testid="event-icon-0"]');
    
    // ツールチップが表示される
    await expect(page.locator('[data-testid="event-tooltip"]')).toBeVisible();
    
    // ツールチップにイベント詳細が含まれる
    await expect(page.locator('[data-testid="event-tooltip"]')).toContainText('コーチ:');
  });
});
```

---

## 11. パフォーマンス最適化

### 11.1 React最適化パターン

```typescript
// src/components/optimized/VirtualizedTranscript.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { areEqual } from 'react-window';

interface TranscriptItemProps {
  index: number;
  style: React.CSSProperties;
  data: SpeakingSegment[];
}

const TranscriptItem = React.memo<TranscriptItemProps>(({ index, style, data }) => {
  const segment = data[index];
  
  return (
    <div style={style} className="flex items-start space-x-3 p-3 border-b">
      <span className="text-sm text-gray-500 min-w-[60px]">
        {formatTimestamp(segment.start_time)}
      </span>
      <span className={`font-medium min-w-[80px] ${
        segment.speaker === 'coach' ? 'text-blue-600' : 'text-green-600'
      }`}>
        {segment.speaker === 'coach' ? 'コーチ' : 'クライアント'}
      </span>
      <p className="flex-1 text-gray-900">{segment.text}</p>
    </div>
  );
}, areEqual);

interface VirtualizedTranscriptProps {
  segments: SpeakingSegment[];
  height?: number;
}

export const VirtualizedTranscript: React.FC<VirtualizedTranscriptProps> = ({
  segments,
  height = 400
}) => {
  const memoizedSegments = useMemo(() => segments, [segments]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <List
        height={height}
        itemCount={memoizedSegments.length}
        itemSize={80}
        itemData={memoizedSegments}
        overscanCount={5}
      >
        {TranscriptItem}
      </List>
    </div>
  );
};
```

### 11.2 Chart.js最適化

```typescript
// src/hooks/useOptimizedChartData.ts
import { useMemo } from 'react';
import { debounce } from 'lodash-es';

export const useOptimizedChartData = <T>(
  rawData: T,
  transformer: (data: T) => ChartData,
  deps: unknown[] = []
) => {
  return useMemo(() => {
    if (!rawData) return null;
    
    // 重い変換処理をメモ化
    return transformer(rawData);
  }, [rawData, ...deps]);
};

// デバウンス付きチャート更新
export const useDebouncedChartUpdate = (
  updateFn: () => void,
  delay: number = 300
) => {
  return useMemo(
    () => debounce(updateFn, delay),
    [updateFn, delay]
  );
};

// Chart.js インスタンス再利用
export const useChartInstance = () => {
  const chartRef = useRef<Chart | null>(null);
  
  const updateChart = useCallback((newData: ChartData) => {
    if (chartRef.current) {
      chartRef.current.data = newData;
      chartRef.current.update('none'); // アニメーションなしで更新
    }
  }, []);
  
  return { chartRef, updateChart };
};
```

### 11.3 バンドル最適化

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Chart.js 関連を別チャンクに
          charts: ['chart.js', 'react-chartjs-2'],
          // Supabase 関連
          supabase: ['@supabase/supabase-js'],
          // UI ライブラリ
          ui: ['@headlessui/react', '@heroicons/react'],
          // 仮想化ライブラリ
          virtualization: ['react-window', 'react-window-infinite-loader']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2']
  }
});
```

---

## 12. VS Code設定

### 12.1 推奨拡張機能

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "supabase.supabase-vscode",
    "vitest.explorer"
  ]
}
```

### 12.2 ワークスペース設定

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### 12.3 タスク設定

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "shell", 
      "command": "bun run dev",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "type-check",
      "type": "shell",
      "command": "bun run type-check",
      "group": "build"
    },
    {
      "label": "test",
      "type": "shell",
      "command": "bun run test",
      "group": "test"
    },
    {
      "label": "lint",
      "type": "shell",
      "command": "bun run lint",
      "group": "build"
    }
  ]
}
```

---

## まとめ

このガイドは、VibeInsightプロジェクトの特殊要件に最適化されたJavaScript/TypeScript開発標準を提供します：

### 重要なポイント

1. **型安全性**: 厳格なTypeScript設定で音声処理・分析データの型安全性を確保
2. **可視化最適化**: Chart.js + CSS Grid のハイブリッドアプローチで高性能な分析画面を実現
3. **リアルタイム対応**: Supabase Realtimeとの効率的な統合パターン
4. **パフォーマンス**: 仮想化・メモ化・チャンク分割による最適化
5. **保守性**: 一貫したモックデータ生成とテスト戦略

このガイドに従うことで、高品質で保守しやすいVibeInsightアプリケーションを構築できます。