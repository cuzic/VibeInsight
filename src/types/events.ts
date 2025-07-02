export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: EventType;
  title: string;
  description?: string;
  data: EventData;
  confidence: number;
  duration?: number;
}

export type EventType = 
  | 'emotion_change'
  | 'topic_change'
  | 'speaker_change'
  | 'silence'
  | 'overlap'
  | 'keyword_mention'
  | 'sentiment_shift'
  | 'volume_peak'
  | 'custom';

export type EventData = 
  | EmotionChangeData
  | TopicChangeData
  | SpeakerChangeData
  | SilenceData
  | OverlapData
  | KeywordMentionData
  | SentimentShiftData
  | VolumePeakData
  | CustomEventData;

export interface EmotionChangeData {
  from_emotion: string;
  to_emotion: string;
  intensity: number;
}

export interface TopicChangeData {
  from_topic?: string;
  to_topic: string;
  relevance: number;
}

export interface SpeakerChangeData {
  from_speaker?: string;
  to_speaker: string;
  speaker_id: string;
}

export interface SilenceData {
  duration: number;
  reason?: 'pause' | 'thinking' | 'interruption';
}

export interface OverlapData {
  speakers: string[];
  duration: number;
}

export interface KeywordMentionData {
  keyword: string;
  context: string;
  sentiment: number;
}

export interface SentimentShiftData {
  from_sentiment: number;
  to_sentiment: number;
  magnitude: number;
}

export interface VolumePeakData {
  peak_level: number;
  average_level: number;
  duration: number;
}

export interface CustomEventData {
  [key: string]: any;
}

export interface EventFilter {
  types?: EventType[];
  min_confidence?: number;
  time_range?: {
    start: number;
    end: number;
  };
  search_query?: string;
}