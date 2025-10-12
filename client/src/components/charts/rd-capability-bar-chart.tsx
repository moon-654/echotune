import React from 'react';

interface CapabilityData {
  competency: string;
  score: number;
}

interface RdCapabilityBarChartProps {
  data: CapabilityData[];
  className?: string;
}

export default function RdCapabilityBarChart({ 
  data, 
  className = ""
}: RdCapabilityBarChartProps) {
  
  // 데이터가 없거나 빈 배열인 경우
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2"></div>
          <p>데이터가 없습니다</p>
        </div>
      </div>
    );
  }


  // 최대 점수 계산 (100점 기준)
  const maxScore = 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => {
        const percentage = (item.score / maxScore) * 100;
        const colorClass = item.score >= 80 ? 'bg-green-500' : 
                          item.score >= 60 ? 'bg-blue-500' : 
                          item.score >= 40 ? 'bg-yellow-500' : 
                          item.score >= 20 ? 'bg-orange-500' : 'bg-red-500';
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{item.competency}</span>
              <span className="text-sm font-semibold text-gray-900">{item.score}점</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
