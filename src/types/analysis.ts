export interface AnalysisResult {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  file_name: string;
  file_size: number;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  
  // Analysis data
  sentiment_scores?: SentimentScore[];
  emotion_scores?: EmotionScore[];
  topics?: Topic[];
  keywords?: Keyword[];
  summary?: string;
  transcript?: string;
  
  // Metadata
  metadata?: {
    sample_rate?: number;
    channels?: number;
    bit_depth?: number;
    format?: string;
  };
}

export interface SentimentScore {
  timestamp: number;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
}

export interface EmotionScore {
  timestamp: number;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    neutral: number;
  };
  dominant_emotion: string;
  confidence: number;
}

export interface Topic {
  id: string;
  name: string;
  relevance: number; // 0 to 1
  keywords: string[];
  time_ranges: TimeRange[];
}

export interface Keyword {
  word: string;
  frequency: number;
  relevance: number;
  sentiment: number;
  time_ranges: TimeRange[];
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface AnalysisFilter {
  user_id?: string;
  status?: AnalysisResult['status'];
  date_from?: string;
  date_to?: string;
  search_query?: string;
  sort_by?: 'created_at' | 'updated_at' | 'file_name' | 'duration';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}