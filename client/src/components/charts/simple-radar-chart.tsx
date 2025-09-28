import React from 'react';

interface RadarData {
  name: string;
  value: number;
}

interface SimpleRadarChartProps {
  data: RadarData[];
  size?: number;
}

export default function SimpleRadarChart({ data, size = 300 }: SimpleRadarChartProps) {
  console.log('🔍 SimpleRadarChart 렌더링:', data);
  
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">데이터가 없습니다</div>;
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.35;
  const levels = 5; // 0, 20, 40, 60, 80, 100
  const angleStep = (2 * Math.PI) / data.length;

  // 점 계산 함수
  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2; // -90도부터 시작
    const radius = (value / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  // 레이더 차트 경로 생성
  const radarPath = data.map((item, index) => {
    const point = getPoint(index, item.value);
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ') + ' Z';

  // 그리드 원 생성
  const gridCircles = Array.from({ length: levels + 1 }, (_, i) => {
    const radius = (i / levels) * maxRadius;
    return (
      <circle
        key={i}
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  });

  // 그리드 라인 생성
  const gridLines = data.map((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const endX = centerX + maxRadius * Math.cos(angle);
    const endY = centerY + maxRadius * Math.sin(angle);
    return (
      <line
        key={index}
        x1={centerX}
        y1={centerY}
        x2={endX}
        y2={endY}
        stroke="#e5e7eb"
        strokeWidth="1"
      />
    );
  });

  // 데이터 포인트 생성
  const dataPoints = data.map((item, index) => {
    const point = getPoint(index, item.value);
    return (
      <circle
        key={index}
        cx={point.x}
        cy={point.y}
        r="4"
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth="2"
      />
    );
  });

  // 레이블 생성
  const labels = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 30;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    
    return (
      <text
        key={index}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium fill-gray-700"
      >
        {item.name}
      </text>
    );
  });

  // 점수 레이블 생성
  const scoreLabels = Array.from({ length: levels + 1 }, (_, i) => {
    const value = (i / levels) * 100;
    const x = centerX + 5;
    const y = centerY - (i / levels) * maxRadius;
    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor="start"
        dominantBaseline="middle"
        className="text-xs fill-gray-500"
      >
        {value}
      </text>
    );
  });

  return (
    <div className="flex items-center justify-center p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 그리드 배경 */}
        {gridCircles}
        {gridLines}
        
        {/* 레이더 차트 영역 */}
        <path
          d={radarPath}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
        />
        
        {/* 데이터 포인트 */}
        {dataPoints}
        
        {/* 레이블 */}
        {labels}
        
        {/* 점수 레이블 */}
        {scoreLabels}
      </svg>
    </div>
  );
}
