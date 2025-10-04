import React from 'react';

interface SimpleBarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export default function SimpleBarChart({ data }: SimpleBarChartProps) {
  console.log('🔍 SimpleBarChart 렌더링:', data);
  
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">데이터가 없습니다</div>;
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="space-y-3 p-4">
      <h3 className="text-lg font-semibold mb-4">R&D 역량 평가</h3>
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const colorClass = item.value >= 80 ? 'bg-green-500' : 
                          item.value >= 60 ? 'bg-blue-500' : 
                          item.value >= 40 ? 'bg-yellow-500' : 
                          item.value >= 20 ? 'bg-orange-500' : 'bg-red-500';
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm font-bold">{item.value}점</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${colorClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

