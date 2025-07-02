# 1on1分析レポート画面 - モック実装タスク

## 技術スタック確定

- **グラフ**: Chart.js + react-chartjs-2
- **タイムライン**: CSS Grid + 絶対配置
- **タブ**: Headless UI
- **スタイリング**: Tailwind CSS

## 📋 実装タスクリスト

### Phase 1: 環境構築・依存関係 (1日)

#### 1.1 パッケージインストール
```bash
npm install chart.js react-chartjs-2 chartjs-adapter-date-fns date-fns
npm install @headlessui/react @heroicons/react
npm install react-window react-window-infinite-loader
npm install clsx class-variance-authority
```

#### 1.2 Chart.js初期設定
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
  Filler
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
```

#### 1.3 型定義ファイル作成
```typescript
// src/types/analysis.ts - 完全な型定義
// src/types/events.ts - イベント関連型
// src/types/charts.ts - Chart.js拡張型
```

### Phase 2: モックデータ作成 (2日)

#### 2.1 基本データ構造
```typescript
// src/mocks/sessionData.ts
export const mockSessions = {
  machinegunSolver: {
    session: {
      id: "session-001",
      title: "週次1on1 - 田中さん",
      participant_name: "田中太郎",
      duration_seconds: 1800, // 30分
      recorded_at: "2025-06-30T10:00:00Z"
    },
    // ... 分析結果
  },
  silentSupporter: { /* ... */ },
  balancedConductor: { /* ... */ }
};
```

#### 2.2 タイムラインイベント生成
```typescript
// src/mocks/timelineGenerator.ts
export const generateTimelineEvents = (
  diagnosisType: DiagnosisType,
  duration: number
): ConversationEvent[] => {
  // 診断タイプに応じた一貫性のあるイベント生成
  // 例: machinegunSolver → 多くの💥（声の被り）、少ない🤫（沈黙）
};

export const generateSpeakingSegments = (
  diagnosisType: DiagnosisType,
  duration: number
): SpeakingSegment[] => {
  // 発話比率に基づいたセグメント生成
};
```

#### 2.3 Chart.js用データ変換
```typescript
// src/utils/chartDataTransformers.ts
export const transformToPieChart = (speakerAnalysis: SpeakerAnalysis) => ({
  labels: ['あなた（コーチ）', 'クライアント'],
  datasets: [{
    data: [
      speakerAnalysis.coach_speaking_ratio * 100,
      speakerAnalysis.client_speaking_ratio * 100
    ],
    backgroundColor: ['#3B82F6', '#10B981'],
    borderWidth: 0
  }]
});

export const transformToRadarChart = (skills: CoachingSkills) => ({
  labels: ['傾聴', '質問', '共感', 'フィードバック'],
  datasets: [{
    label: 'あなたのスコア',
    data: [skills.listening.score, skills.questioning.score, skills.empathy.score, skills.feedback.score],
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgb(59, 130, 246)',
    pointBackgroundColor: 'rgb(59, 130, 246)',
  }]
});
```

### Phase 3: コンポーネント基盤 (2日)

#### 3.1 レイアウトコンポーネント
```typescript
// src/components/report/ReportLayout.tsx
interface ReportLayoutProps {
  analysisResult: AnalysisResult;
}

export const ReportLayout: React.FC<ReportLayoutProps> = ({ analysisResult }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ReportHeader session={analysisResult.session} />
      <DiagnosisSection diagnosis={analysisResult.diagnosis} prescriptions={analysisResult.prescriptions} />
      <ReportTabs analysisResult={analysisResult} />
    </div>
  );
};
```

#### 3.2 ヘッダーコンポーネント
```typescript
// src/components/report/ReportHeader.tsx
interface ReportHeaderProps {
  session: Session;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ session }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        1on1分析レポート
      </h1>
      <p className="text-lg text-gray-600">
        {new Date(session.recorded_at).toLocaleDateString('ja-JP')} | 
        {session.participant_name}さんとの1on1 
        (会話時間 {formatDuration(session.duration_seconds)})
      </p>
    </div>
  );
};
```

#### 3.3 診断・処方箋セクション
```typescript
// src/components/report/DiagnosisSection.tsx
interface DiagnosisSectionProps {
  diagnosis: Diagnosis;
  prescriptions: Prescription[];
}

export const DiagnosisSection: React.FC<DiagnosisSectionProps> = ({ 
  diagnosis, 
  prescriptions 
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
      <div className="flex items-center mb-4">
        <span className="text-4xl mr-4">{diagnosis.icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {diagnosis.name}
          </h2>
          <p className="text-gray-600 mt-1">
            {diagnosis.description}
          </p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💊 処方箋
        </h3>
        <div className="space-y-3">
          {prescriptions.map((prescription, index) => (
            <div key={index} className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-sm font-medium rounded-full flex items-center justify-center mr-3 mt-0.5">
                {index + 1}
              </span>
              <div>
                <h4 className="font-medium text-gray-900">
                  {prescription.title}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {prescription.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Phase 4: タブナビゲーション (1日)

#### 4.1 タブコンポーネント
```typescript
// src/components/report/ReportTabs.tsx
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

interface ReportTabsProps {
  analysisResult: AnalysisResult;
}

export const ReportTabs: React.FC<ReportTabsProps> = ({ analysisResult }) => {
  const tabs = [
    { name: '概要', component: OverviewTab },
    { name: '会話ダイナミクス', component: ConversationDynamicsTab },
    { name: 'コーチングスキル分析', component: CoachingSkillsTab },
    { name: '全文トランスクリプト', component: TranscriptTab }
  ];

  return (
    <Tab.Group>
      <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
        {tabs.map((tab) => (
          <Tab
            key={tab.name}
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            {tab.name}
          </Tab>
        ))}
      </Tab.List>
      
      <Tab.Panels>
        {tabs.map((tab, idx) => (
          <Tab.Panel key={idx} className="focus:outline-none">
            <tab.component analysisResult={analysisResult} />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};
```

### Phase 5: Chart.jsグラフコンポーネント (2日)

#### 5.1 円グラフ（発話比率）
```typescript
// src/components/charts/SpeakerRatioChart.tsx
import { Pie } from 'react-chartjs-2';
import { transformToPieChart } from '../../utils/chartDataTransformers';

interface SpeakerRatioChartProps {
  speakerAnalysis: SpeakerAnalysis;
}

export const SpeakerRatioChart: React.FC<SpeakerRatioChartProps> = ({ 
  speakerAnalysis 
}) => {
  const chartData = transformToPieChart(speakerAnalysis);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 14
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
};
```

#### 5.2 レーダーチャート（コーチングスキル）
```typescript
// src/components/charts/CoachingSkillsChart.tsx
import { Radar } from 'react-chartjs-2';

interface CoachingSkillsChartProps {
  coachingSkills: CoachingSkills;
  benchmarkData?: CoachingSkills; // 組織平均など
}

export const CoachingSkillsChart: React.FC<CoachingSkillsChartProps> = ({
  coachingSkills,
  benchmarkData
}) => {
  const chartData = {
    labels: ['傾聴', '質問', '共感', 'フィードバック'],
    datasets: [
      {
        label: 'あなたのスコア',
        data: [
          coachingSkills.listening.score,
          coachingSkills.questioning.score,
          coachingSkills.empathy.score,
          coachingSkills.feedback.score
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      }
    ]
  };

  if (benchmarkData) {
    chartData.datasets.push({
      label: '組織平均',
      data: [
        benchmarkData.listening.score,
        benchmarkData.questioning.score,
        benchmarkData.empathy.score,
        benchmarkData.feedback.score
      ],
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      borderColor: 'rgb(156, 163, 175)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(156, 163, 175)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(156, 163, 175)'
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        pointLabels: {
          font: {
            size: 14
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  return (
    <div className="h-80">
      <Radar data={chartData} options={options} />
    </div>
  );
};
```

#### 5.3 積み上げ棒グラフ（感情分析）
```typescript
// src/components/charts/EmotionAnalysisChart.tsx
import { Bar } from 'react-chartjs-2';

interface EmotionAnalysisChartProps {
  emotionAnalysis: EmotionAnalysis;
}

export const EmotionAnalysisChart: React.FC<EmotionAnalysisChartProps> = ({
  emotionAnalysis
}) => {
  const chartData = {
    labels: ['あなた（コーチ）', 'クライアント'],
    datasets: [
      {
        label: 'ポジティブ',
        data: [
          emotionAnalysis.coach.positive,
          emotionAnalysis.client.positive
        ],
        backgroundColor: 'rgb(34, 197, 94)',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: '平常',
        data: [
          emotionAnalysis.coach.neutral,
          emotionAnalysis.client.neutral
        ],
        backgroundColor: 'rgb(156, 163, 175)',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'ネガティブ',
        data: [
          emotionAnalysis.coach.negative,
          emotionAnalysis.client.negative
        ],
        backgroundColor: 'rgb(239, 68, 68)',
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};
```

### Phase 6: CSS Grid タイムライン (3日)

#### 6.1 タイムライン基盤
```typescript
// src/components/timeline/EventTimeline.tsx
interface EventTimelineProps {
  speakingSegments: SpeakingSegment[];
  conversationEvents: ConversationEvent[];
  duration: number;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  speakingSegments,
  conversationEvents,
  duration
}) => {
  const timeMarkers = Array.from({ length: 7 }, (_, i) => i * 5); // 0, 5, 10, 15, 20, 25, 30分

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">会話イベントタイムライン</h3>
      
      {/* 時間軸 */}
      <div className="relative mb-4">
        <div className="flex justify-between text-sm text-gray-500">
          {timeMarkers.map(minute => (
            <span key={minute}>{minute}分</span>
          ))}
        </div>
        <div className="w-full h-px bg-gray-300 mt-1"></div>
      </div>

      {/* タイムライン本体 */}
      <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden">
        {/* 背景グリッド */}
        <TimelineGrid duration={duration} />
        
        {/* 発話セグメント */}
        <SpeakingSegments segments={speakingSegments} duration={duration} />
        
        {/* イベントマーカー */}
        <EventMarkers events={conversationEvents} duration={duration} />
        
        {/* 話者ラベル */}
        <SpeakerLabels />
      </div>
      
      {/* 凡例 */}
      <EventLegend />
    </div>
  );
};
```

#### 6.2 グリッドレイアウト
```typescript
// src/components/timeline/TimelineGrid.tsx
interface TimelineGridProps {
  duration: number;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({ duration }) => {
  const gridLines = 12; // 12分割
  
  return (
    <div className="absolute inset-0 grid grid-cols-12 opacity-20">
      {Array.from({ length: gridLines }, (_, i) => (
        <div key={i} className="border-r border-gray-300 last:border-r-0" />
      ))}
    </div>
  );
};
```

#### 6.3 発話セグメント表示
```typescript
// src/components/timeline/SpeakingSegments.tsx
interface SpeakingSegmentsProps {
  segments: SpeakingSegment[];
  duration: number;
}

export const SpeakingSegments: React.FC<SpeakingSegmentsProps> = ({
  segments,
  duration
}) => {
  const calculatePosition = (start: number, end: number) => ({
    left: `${(start / duration) * 100}%`,
    width: `${((end - start) / duration) * 100}%`
  });

  return (
    <>
      {segments.map((segment) => (
        <div
          key={segment.id}
          className={clsx(
            'absolute h-6 rounded-sm opacity-80 transition-opacity hover:opacity-100',
            segment.speaker === 'coach'
              ? 'bg-blue-500 top-4'
              : 'bg-green-500 top-20'
          )}
          style={calculatePosition(segment.start_time, segment.end_time)}
          title={`${segment.speaker}: ${segment.text.substring(0, 50)}...`}
        />
      ))}
    </>
  );
};
```

#### 6.4 イベントマーカー
```typescript
// src/components/timeline/EventMarkers.tsx
interface EventMarkersProps {
  events: ConversationEvent[];
  duration: number;
}

export const EventMarkers: React.FC<EventMarkersProps> = ({ events, duration }) => {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const calculateXPosition = (timestamp: number) => (timestamp / duration) * 100;
  
  const getYPosition = (event: ConversationEvent) => {
    const baseY = event.speaker === 'coach' ? 45 : 105;
    const isEmotionalEvent = ['positive', 'negative', 'neutral'].includes(event.type);
    return isEmotionalEvent ? baseY : baseY + 25;
  };

  return (
    <>
      {events.map((event) => (
        <div
          key={event.id}
          className="absolute cursor-pointer transform -translate-x-1/2 transition-transform hover:scale-125"
          style={{
            left: `${calculateXPosition(event.timestamp)}%`,
            top: `${getYPosition(event)}px`
          }}
          onMouseEnter={() => setHoveredEvent(event.id)}
          onMouseLeave={() => setHoveredEvent(null)}
        >
          <span className="text-lg select-none">
            {event.icon}
          </span>
          
          {/* ツールチップ */}
          {hoveredEvent === event.id && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
              {event.speaker}: {event.type} ({Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')})
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      ))}
    </>
  );
};
```

#### 6.5 イベント凡例
```typescript
// src/components/timeline/EventLegend.tsx
export const EventLegend: React.FC = () => {
  const eventCategories = [
    {
      title: '感情',
      events: [
        { icon: '😊', name: 'ポジティブ', description: '喜びや感謝など、肯定的な感情' },
        { icon: '😐', name: '平常', description: '感情的な起伏が少ない中立的な状態' },
        { icon: '😢', name: 'ネガティブ', description: '落胆や失望などの否定的な感情' }
      ]
    },
    {
      title: 'コーチングスキル',
      events: [
        { icon: '🎧', name: '傾聴', description: '相手の発言を深く聞いている姿勢' },
        { icon: '❓', name: '質問', description: '相手に問いかけ、思考を促している' },
        { icon: '❤️', name: '共感', description: '相手の感情や状況に寄り添う言葉' },
        { icon: '📣', name: 'フィードバック', description: '具体的な評価や提案' }
      ]
    },
    {
      title: '音響・発話イベント',
      events: [
        { icon: '💥', name: '声の被り', description: '発話の同時発生' },
        { icon: '🤫', name: '沈黙', description: '3秒以上の無音状態' },
        { icon: '⏩', name: '話速UP', description: '話す速度の上昇' },
        { icon: '🐢', name: '話速DOWN', description: '話す速度の低下' }
      ]
    }
  ];

  return (
    <div className="mt-6 space-y-4">
      {eventCategories.map((category) => (
        <div key={category.title}>
          <h4 className="font-medium text-gray-900 mb-2">{category.title}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {category.events.map((event) => (
              <div key={event.name} className="flex items-center space-x-2 text-sm">
                <span className="text-lg">{event.icon}</span>
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-gray-500 text-xs">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Phase 7: 各タブコンテンツ (2日)

#### 7.1 概要タブ
```typescript
// src/components/tabs/OverviewTab.tsx
interface OverviewTabProps {
  analysisResult: AnalysisResult;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ analysisResult }) => {
  const { speaker_analysis, coaching_skills, emotion_analysis } = analysisResult;

  const metrics = [
    {
      title: '総合スコア',
      value: calculateOverallScore(coaching_skills),
      unit: '/5.0',
      icon: '🎯',
      color: 'text-blue-600'
    },
    {
      title: '会話の公平性',
      value: (1 - speaker_analysis.gini_coefficient).toFixed(2),
      unit: '/1.0',
      icon: '⚖️',
      color: 'text-green-600'
    },
    {
      title: '最強スキル',
      value: getTopSkill(coaching_skills),
      unit: '',
      icon: '💪',
      color: 'text-purple-600'
    },
    {
      title: 'ポジティブ感情',
      value: Math.round((emotion_analysis.coach.positive + emotion_analysis.client.positive) / 2),
      unit: '%',
      icon: '😊',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 主要指標カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      {/* グラフセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">発話比率</h3>
          <SpeakerRatioChart speakerAnalysis={speaker_analysis} />
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">感情分析</h3>
          <EmotionAnalysisChart emotionAnalysis={emotion_analysis} />
        </div>
      </div>

      {/* セッションハイライト */}
      <SessionHighlights analysisResult={analysisResult} />
    </div>
  );
};
```

#### 7.2 コーチングスキル分析タブ
```typescript
// src/components/tabs/CoachingSkillsTab.tsx
export const CoachingSkillsTab: React.FC<{ analysisResult: AnalysisResult }> = ({
  analysisResult
}) => {
  const { coaching_skills } = analysisResult;

  return (
    <div className="space-y-6">
      {/* レーダーチャート */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">スキル総合評価</h3>
        <CoachingSkillsChart 
          coachingSkills={coaching_skills}
          benchmarkData={mockBenchmarkData}
        />
      </div>

      {/* スキル詳細カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(coaching_skills).map(([skillName, skillData]) => (
          <SkillDetailCard 
            key={skillName} 
            skillName={skillName} 
            skillData={skillData} 
          />
        ))}
      </div>
    </div>
  );
};
```

### Phase 8: レスポンシブ・アクセシビリティ (1日)

#### 8.1 モバイル対応
```css
/* src/styles/timeline.css */
@media (max-width: 768px) {
  .timeline-container {
    height: auto;
    min-height: 300px;
  }
  
  .timeline-grid {
    grid-template-columns: repeat(6, 1fr); /* 6分割に簡素化 */
  }
  
  .event-marker {
    font-size: 0.875rem; /* アイコンサイズ縮小 */
  }
  
  .event-tooltip {
    font-size: 0.75rem;
    max-width: 200px;
  }
}
```

#### 8.2 アクセシビリティ対応
```typescript
// アクセシビリティ強化
export const AccessibleTimeline = () => {
  return (
    <section 
      aria-label="会話イベントタイムライン"
      role="img"
      aria-describedby="timeline-description"
    >
      <div id="timeline-description" className="sr-only">
        30分間の1on1会話における発話パターンとイベントを時系列で表示。
        コーチとクライアントの発話区間、感情変化、コーチングスキルの発揮タイミングが確認できます。
      </div>
      {/* タイムライン内容 */}
    </section>
  );
};
```

## 📅 実装スケジュール（推奨）

| Phase | 期間 | 主要成果物 |
|-------|------|------------|
| **Phase 1** | 1日 | 環境構築、依存関係インストール |
| **Phase 2** | 2日 | 3パターンのモックデータ完成 |
| **Phase 3** | 2日 | 基本レイアウト、ヘッダー、診断セクション |
| **Phase 4** | 1日 | タブナビゲーション実装 |
| **Phase 5** | 2日 | Chart.js グラフ3種類 |
| **Phase 6** | 3日 | CSS Grid タイムライン完成 |
| **Phase 7** | 2日 | 全タブコンテンツ実装 |
| **Phase 8** | 1日 | レスポンシブ・アクセシビリティ |

**合計: 14日（約3週間）**

## 🎯 最重要ポイント

1. **モックデータの一貫性**: 診断タイプと表示データの整合性を保つ
2. **タイムライン実装**: CSS Grid + 絶対配置の組み合わせ
3. **Chart.js設定**: レスポンシブ対応とカスタマイズ
4. **パフォーマンス**: 大量イベントでも滑らかな描画
5. **アクセシビリティ**: スクリーンリーダー対応

この計画に従って実装すれば、高品質な1on1分析レポート画面が完成します。