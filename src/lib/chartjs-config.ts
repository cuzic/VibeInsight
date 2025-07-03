import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ArcElement,
  RadialLinearScale
);

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

// Time series chart options
export const timeSeriesOptions = {
  ...defaultChartOptions,
  scales: {
    x: {
      type: 'time' as const,
      time: {
        tooltipFormat: 'MMM dd, yyyy HH:mm',
        displayFormats: {
          hour: 'HH:mm',
          day: 'MMM dd',
          week: 'MMM dd',
          month: 'MMM yyyy',
        },
      },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
  },
};

// Theme colors for charts
export const chartColors = {
  primary: 'rgb(59, 130, 246)',
  secondary: 'rgb(99, 102, 241)',
  success: 'rgb(34, 197, 94)',
  danger: 'rgb(239, 68, 68)',
  warning: 'rgb(245, 158, 11)',
  info: 'rgb(14, 165, 233)',
  light: 'rgb(243, 244, 246)',
  dark: 'rgb(31, 41, 55)',
};

// Generate gradient for charts
export const createGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  opacity: number = 0.1
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}${Math.round(opacity * 255).toString(16)}`);
  return gradient;
};