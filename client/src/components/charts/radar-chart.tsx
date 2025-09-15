import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";

interface RadarChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  className?: string;
}

const colors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
];

export default function SkillRadarChart({ data, dataKey, nameKey, className }: RadarChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Transform data for radar chart
    const skillKeys = Object.keys(data[0][dataKey] || {});
    
    return skillKeys.map(skill => {
      const dataPoint: any = { skill };
      data.forEach((item, index) => {
        dataPoint[item[nameKey]] = item[dataKey][skill] || 0;
      });
      return dataPoint;
    });
  }, [data, dataKey, nameKey]);

  const dataKeys = useMemo(() => {
    return data?.map(item => item[nameKey]) || [];
  }, [data, nameKey]);

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

  return (
    <div className={className} data-testid="radar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }}
            tickCount={5}
          />
          {dataKeys.map((key, index) => (
            <Radar
              key={key}
              name={key}
              dataKey={key}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
