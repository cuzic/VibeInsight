import { ChartData, ChartOptions } from 'chart.js';

export interface ChartConfig<TType = any, TData = any, TLabel = string> {
  type: TType;
  data: ChartData<TType, TData, TLabel>;
  options?: ChartOptions<TType>;
}

export interface TimeSeriesDataPoint {
  x: Date | string | number;
  y: number;
}

export interface EmotionChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface SentimentChartData {
  labels: string[];
  datasets: {
    label: string;
    data: TimeSeriesDataPoint[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension?: number;
  }[];
}

export interface TopicDistributionData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export interface WaveformData {
  samples: number[];
  sampleRate: number;
  duration: number;
}

export interface SpectrogramData {
  frequencies: number[];
  times: number[];
  magnitudes: number[][];
  colorScale: {
    min: number;
    max: number;
  };
}

export interface ChartExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number; // 0-1 for jpg
}

export interface InteractiveChartOptions {
  enableZoom?: boolean;
  enablePan?: boolean;
  enableTooltip?: boolean;
  enableLegend?: boolean;
  enableAnimation?: boolean;
  onDataPointClick?: (dataPoint: any) => void;
  onRangeSelect?: (range: { start: number; end: number }) => void;
}