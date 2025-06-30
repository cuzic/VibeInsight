# 1on1分析レポート画面開発の技術的課題

## 概要

モックデータを使用して1on1分析レポート画面を先行開発する際の技術的課題と解決策を整理します。画面仕様書に基づき、実装上の重要な決定事項を明確化します。

## 1. UI/UXライブラリ選定

### 1.1 グラフ・チャートライブラリ

#### 要件
- **円グラフ**: 発話比率表示
- **時系列タイムライン**: 発話区間バー + イベントプロット
- **レーダーチャート**: コーチングスキル分析
- **積み上げ棒グラフ**: 感情分析
- **カスタムタイムライン**: 絵文字イベント表示

#### 選択肢比較

| ライブラリ | メリット | デメリット | 判定 |
|------------|----------|------------|------|
| **Recharts** | ・React特化<br>・TypeScript対応<br>・カスタマイズ性高 | ・タイムライン機能弱い<br>・絵文字プロット困難 | 🔶 部分採用 |
| **Chart.js + react-chartjs-2** | ・豊富なチャート種類<br>・プラグイン充実<br>・カスタムプロット可能 | ・React統合やや複雑<br>・TypeScript型定義弱い | ✅ 推奨 |
| **D3.js + React** | ・完全カスタマイズ可能<br>・複雑な可視化対応 | ・学習コスト高<br>・開発時間長 | ❌ 不採用 |
| **React + CSS (自作)** | ・軽量<br>・完全制御<br>・タイムライン最適 | ・開発工数大<br>・グラフ機能限定 | 🔶 タイムラインのみ |

#### **推奨構成**
```typescript
// グラフ系: Chart.js
import { Pie, Bar, Radar } from 'react-chartjs-2';

// タイムライン: 自作コンポーネント
import { EventTimeline } from './components/EventTimeline';
```

### 1.2 タブナビゲーション

#### 要件
- 4つのタブ（概要・会話ダイナミクス・コーチングスキル・トランスクリプト）
- アクティブ状態の視覚的表示
- レスポンシブ対応

#### 実装選択肢

| 選択肢 | メリット | デメリット |
|--------|----------|------------|
| **Headless UI Tabs** | ・アクセシビリティ対応<br>・軽量<br>・カスタマイズ性 | ・スタイリング自作必要 |
| **Tailwind UI Tabs** | ・デザイン済み<br>・レスポンシブ対応 | ・カスタマイズ制限 |
| **自作Tabコンポーネント** | ・完全制御<br>・軽量 | ・アクセシビリティ考慮必要 |

#### **推奨**: Headless UI + Tailwind CSS

```typescript
import { Tab } from '@headlessui/react';

const tabs = [
  { name: '概要', component: OverviewTab },
  { name: '会話ダイナミクス', component: ConversationDynamicsTab },
  { name: 'コーチングスキル分析', component: CoachingSkillsTab },
  { name: '全文トランスクリプト', component: TranscriptTab }
];
```

## 2. イベントタイムライン実装課題

### 2.1 複雑なレイアウト要件

#### 構造
```
[時間軸 0分────────────30分]
┌─ コーチエリア ─────────────┐
│ 発話バー: ████  ███  ██████│
│ 感情レーン: 😊  ❓  📣  ❤️ │
│ 音響レーン: 💥  🤫  ⏩     │
└──────────────────────────┘
┌─ クライアントエリア ────────┐
│ 発話バー:  ██  ████  ███  │
│ 感情レーン: 😐  😊  😮     │
│ 音響レーン:     🤫  🐢     │
└──────────────────────────┘
```

#### 技術的課題

1. **SVGレンダリング vs CSS Grid**
   ```typescript
   // SVGアプローチ
   const TimelineSVG = () => (
     <svg width="100%" height="200">
       <rect x={startX} y={coachY} width={duration} height="20" fill="blue" />
       <text x={eventX} y={iconY}>😊</text>
     </svg>
   );
   
   // CSS Gridアプローチ  
   const TimelineGrid = () => (
     <div className="grid grid-cols-timeline grid-rows-4 gap-1">
       <div className="col-span-duration bg-blue-500 h-5" />
       <div className="absolute" style={{left: `${eventPercent}%`}}>😊</div>
     </div>
   );
   ```

2. **時間軸の動的スケーリング**
   ```typescript
   const calculatePosition = (timestamp: number, totalDuration: number) => {
     return (timestamp / totalDuration) * 100; // パーセンテージ
   };
   ```

3. **絵文字の配置とオーバーラップ**
   ```typescript
   // オーバーラップ回避アルゴリズム
   const adjustEventPositions = (events: Event[]) => {
     const sorted = events.sort((a, b) => a.timestamp - b.timestamp);
     const minGap = 20; // px
     
     for (let i = 1; i < sorted.length; i++) {
       if (sorted[i].x - sorted[i-1].x < minGap) {
         sorted[i].y += 25; // 下にずらす
       }
     }
   };
   ```

### 2.2 推奨実装アプローチ

#### **ハイブリッドアプローチ**: CSS Grid + 絶対配置
```typescript
const EventTimeline: React.FC<TimelineProps> = ({ sessionData }) => {
  const { speakingSegments, events, totalDuration } = sessionData;
  
  return (
    <div className="relative w-full h-48 border rounded-lg">
      {/* 背景グリッド */}
      <div className="absolute inset-0 grid grid-cols-12 opacity-10">
        {Array.from({length: 12}).map((_, i) => (
          <div key={i} className="border-r border-gray-200" />
        ))}
      </div>
      
      {/* 発話セグメント */}
      {speakingSegments.map(segment => (
        <div
          key={segment.id}
          className={`absolute h-6 rounded ${segment.speaker === 'coach' ? 'bg-blue-500' : 'bg-green-500'}`}
          style={{
            left: `${(segment.start / totalDuration) * 100}%`,
            width: `${((segment.end - segment.start) / totalDuration) * 100}%`,
            top: segment.speaker === 'coach' ? '20px' : '80px'
          }}
        />
      ))}
      
      {/* イベントアイコン */}
      {events.map(event => (
        <EventIcon
          key={event.id}
          event={event}
          position={{
            x: (event.timestamp / totalDuration) * 100,
            y: event.speaker === 'coach' ? 50 : 110
          }}
        />
      ))}
    </div>
  );
};
```

## 3. データ型定義とモック設計

### 3.1 TypeScript型定義

```typescript
// 基本セッション情報
interface Session {
  id: string;
  title: string;
  participant_name: string;
  duration_seconds: number;
  recorded_at: string;
  created_at: string;
}

// 発話セグメント
interface SpeakingSegment {
  id: string;
  speaker: 'coach' | 'client';
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
}

// 会話イベント
interface ConversationEvent {
  id: string;
  type: 'overlap' | 'silence' | 'speed_up' | 'speed_down' | 'volume_up' | 'volume_down' | 'pitch_up' | 'pitch_down';
  speaker: 'coach' | 'client' | 'both';
  timestamp: number;
  duration?: number;
  icon: string;
  metadata?: Record<string, any>;
}

// コーチングスキル
interface CoachingSkills {
  listening: SkillDetail;
  questioning: SkillDetail;
  empathy: SkillDetail;
  feedback: SkillDetail;
}

interface SkillDetail {
  score: number; // 1-5
  examples: string[];
  frequency: number;
  improvement_suggestions: string[];
}

// 感情分析
interface EmotionAnalysis {
  coach: EmotionDistribution;
  client: EmotionDistribution;
  timeline: EmotionTimepoint[];
}

interface EmotionDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

interface EmotionTimepoint {
  timestamp: number;
  coach_emotion: 'positive' | 'neutral' | 'negative';
  client_emotion: 'positive' | 'neutral' | 'negative';
}

// 診断結果
interface Diagnosis {
  name: string;
  icon: string;
  description: string;
  confidence: number;
  category: 'talkative' | 'supportive' | 'analytical' | 'balanced';
}

// 処方箋
interface Prescription {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'listening' | 'questioning' | 'empathy' | 'feedback';
}

// 統合分析結果
interface AnalysisResult {
  session: Session;
  speaker_analysis: {
    coach_speaking_ratio: number;
    client_speaking_ratio: number;
    gini_coefficient: number;
    turn_taking_balance: number;
  };
  coaching_skills: CoachingSkills;
  emotion_analysis: EmotionAnalysis;
  conversation_events: ConversationEvent[];
  diagnosis: Diagnosis;
  prescriptions: Prescription[];
  speaking_segments: SpeakingSegment[];
}
```

### 3.2 モックデータ生成戦略

#### 複数パターンのモックデータ
```typescript
// src/mocks/analysisResults.ts
export const mockAnalysisResults = {
  machinegunSolver: generateMockData({
    diagnosisType: 'talkative',
    coachSpeakingRatio: 0.75,
    silenceEvents: 0,
    overlapEvents: 5
  }),
  
  silentSupporter: generateMockData({
    diagnosisType: 'supportive', 
    coachSpeakingRatio: 0.30,
    silenceEvents: 8,
    empathyScore: 5
  }),
  
  balancedConductor: generateMockData({
    diagnosisType: 'balanced',
    coachSpeakingRatio: 0.55,
    allSkillsHigh: true
  })
};

const generateMockData = (params: MockParams): AnalysisResult => {
  // パラメータに基づいて一貫性のあるモックデータを生成
  const events = generateConsistentEvents(params);
  const segments = generateSpeakingSegments(params);
  const skills = generateCoachingSkills(params);
  
  return {
    session: mockSession,
    speaker_analysis: calculateSpeakerAnalysis(segments),
    coaching_skills: skills,
    emotion_analysis: generateEmotionAnalysis(params),
    conversation_events: events,
    diagnosis: getDiagnosisForType(params.diagnosisType),
    prescriptions: getPrescriptionsForDiagnosis(params.diagnosisType),
    speaking_segments: segments
  };
};
```

## 4. レスポンシブデザイン課題

### 4.1 タイムライン表示の課題

#### デスクトップ vs モバイル
```typescript
// レスポンシブタイムライン戦略
const ResponsiveTimeline = () => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  useEffect(() => {
    const checkViewMode = () => {
      setViewMode(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };
    
    checkViewMode();
    window.addEventListener('resize', checkViewMode);
    return () => window.removeEventListener('resize', checkViewMode);
  }, []);
  
  if (viewMode === 'mobile') {
    return <MobileTimelineView />; // 縦スクロール、簡素化
  }
  
  return <DesktopTimelineView />; // 横スクロール、詳細表示
};
```

#### モバイル最適化
- **縦レイアウト**: 話者を上下ではなく時系列で表示
- **簡素化**: イベント密度を下げる
- **タッチ対応**: ツールチップをタップで表示

### 4.2 グラフのレスポンシブ対応

```typescript
// Chart.js レスポンシブ設定
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: window.innerWidth < 768 ? 'bottom' : 'right'
    }
  }
};
```

## 5. パフォーマンス最適化課題

### 5.1 大量データ表示

#### 仮想化スクロール
```typescript
// トランスクリプトタブでの仮想化
import { FixedSizeList as List } from 'react-window';

const VirtualizedTranscript = ({ segments }: { segments: SpeakingSegment[] }) => (
  <List
    height={400}
    itemCount={segments.length}
    itemSize={60}
    itemData={segments}
  >
    {({ index, style, data }) => (
      <div style={style}>
        <TranscriptSegment segment={data[index]} />
      </div>
    )}
  </List>
);
```

### 5.2 グラフレンダリング最適化

```typescript
// memo化による再レンダリング防止
const MemoizedChart = React.memo(({ data, type }: ChartProps) => {
  return <Chart data={data} type={type} />;
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

// useMemo による重い計算のキャッシュ
const processedChartData = useMemo(() => {
  return transformAnalysisDataToChartFormat(analysisResult);
}, [analysisResult]);
```

## 6. アクセシビリティ対応

### 6.1 スクリーンリーダー対応

```typescript
// ARIA ラベルとセマンティック HTML
const EventTimeline = () => (
  <section aria-label="会話イベントタイムライン">
    <h3 id="timeline-title">会話の流れ</h3>
    <div 
      role="img" 
      aria-labelledby="timeline-title"
      aria-describedby="timeline-description"
    >
      {/* タイムライン内容 */}
    </div>
    <div id="timeline-description" className="sr-only">
      30分間の会話における発話パターンとイベントを時系列で表示
    </div>
  </section>
);
```

### 6.2 キーボードナビゲーション

```typescript
// タブキーナビゲーション
const TabNavigation = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      setActiveTab((index + 1) % tabs.length);
    } else if (e.key === 'ArrowLeft') {
      setActiveTab((index - 1 + tabs.length) % tabs.length);
    }
  };
  
  return (
    <div role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.name}
          role="tab"
          aria-selected={activeTab === index}
          tabIndex={activeTab === index ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};
```

## 7. 推奨実装順序

### Phase 1: 基本構造（1週間）
1. **コンポーネント設計**: タブナビゲーション + 基本レイアウト
2. **型定義**: TypeScript インターフェース定義
3. **モックデータ**: 3パターンの診断タイプデータ

### Phase 2: グラフ実装（1週間）  
1. **Chart.js セットアップ**: 円グラフ、棒グラフ、レーダーチャート
2. **概要タブ**: 主要指標カード + ハイライト表示
3. **コーチングスキルタブ**: レーダーチャート + スキル詳細

### Phase 3: タイムライン実装（1-2週間）
1. **基本タイムライン**: 発話セグメント表示
2. **イベントプロット**: 絵文字アイコン配置
3. **インタラクション**: ツールチップ、ホバー効果

### Phase 4: 仕上げ（1週間）
1. **トランスクリプトタブ**: 仮想化スクロール
2. **レスポンシブ対応**: モバイル最適化
3. **アクセシビリティ**: ARIA対応、キーボードナビゲーション

## まとめ

最も技術的に困難な部分は**イベントタイムライン**の実装です。Chart.jsとCSSを組み合わせたハイブリッドアプローチを推奨し、段階的な実装で複雑性を管理することが重要です。