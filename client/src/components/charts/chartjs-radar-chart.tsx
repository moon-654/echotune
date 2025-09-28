import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Chart.js 컴포넌트 등록
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartData {
  competency: string;
  score: number;
}

interface ChartjsRadarChartProps {
  data: RadarChartData[];
  className?: string;
  height?: number;
  width?: number;
}

export default function ChartjsRadarChart({ 
  data, 
  className = "",
  height = 300,
  width = 300
}: ChartjsRadarChartProps) {
  console.log('🔍 ChartjsRadarChart 렌더링:', { data, className, height, width });
  
  // 데이터가 없거나 빈 배열인 경우
  if (!data || data.length === 0) {
    console.log('🔍 데이터가 없어서 빈 상태 표시');
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2"></div>
          <p>데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // Chart.js 형식으로 데이터 변환
  const chartData = {
    labels: data.map(item => item.competency),
    datasets: [
      {
        label: 'R&D 역량',
        data: data.map(item => item.score),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // 범례 숨기기 (레이블이 이미 있으므로)
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.r}점`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 100,
        stepSize: 20,
        ticks: {
          stepSize: 20,
          callback: function(value: any) {
            return value + '점';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 5,
        hoverRadius: 7,
      },
    },
  };

  return (
    <div className={className} style={{ height, width }}>
      <Radar data={chartData} options={options} />
    </div>
  );
}
