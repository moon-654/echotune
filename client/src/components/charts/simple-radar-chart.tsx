import React from 'react';

interface RadarData {
  name: string;
  value: number;
}

interface SimpleRadarChartProps {
  data: RadarData[];
  size?: number;
  onLabelClick?: (label: string, index: number) => void;
  selectedLabel?: string;
}

export default function SimpleRadarChart({ data, size = 300, onLabelClick, selectedLabel }: SimpleRadarChartProps) {
  
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">데이터가 없습니다</div>;
  }

  // 스타일 토큰
  const gridStroke = '#CBD5E1'; // slate-300
  const gridFillEven = 'rgba(241, 245, 249, 0.6)'; // slate-50
  const gridFillOdd = 'rgba(241, 245, 249, 0.25)';
  const radarStroke = '#4F46E5'; // indigo-600
  const radarPointFill = '#4F46E5';
  const radarPointStroke = '#ffffff';
  const labelColor = '#374151'; // gray-700
  const tickColor = '#6B7280'; // gray-500

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

  // 레벨별 다각형(스파이더웹) 그리드 생성
  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const ratio = (i + 1) / levels; // 1/levels .. 1
    const points = data.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const radius = ratio * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={i}
        points={points}
        fill={i % 2 === 0 ? gridFillEven : gridFillOdd}
        stroke={gridStroke}
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
        stroke={gridStroke}
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
        fill={radarPointFill}
        stroke={radarPointStroke}
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
    const isSelected = selectedLabel === item.name;
    
    return (
      <text
        key={index}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`text-xs font-medium ${onLabelClick ? 'cursor-pointer hover:fill-blue-600' : ''} ${isSelected ? 'fill-blue-600 font-bold' : ''}`}
        fill={isSelected ? '#2563eb' : labelColor}
        onClick={() => onLabelClick?.(item.name, index)}
        style={{ 
          cursor: onLabelClick ? 'pointer' : 'default',
          userSelect: 'none'
        }}
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
        className="text-xs"
        fill={tickColor}
      >
        {value}
      </text>
    );
  });

  return (
    <div className="flex items-center justify-center p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radarFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={radarStroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={radarStroke} stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {/* 그리드 배경 (스파이더웹 다각형 + 축 라인) */}
        {gridPolygons}
        {gridLines}
        
        {/* 레이더 차트 영역 */}
        <path
          d={radarPath}
          fill="url(#radarFill)"
          stroke={radarStroke}
          strokeWidth="2.5"
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

