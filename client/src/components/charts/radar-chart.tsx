import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarChartProps {
  data: Array<{
    competency: string;
    score: number;
  }>;
  className?: string;
}

export default function RadarChart({ data, className }: RadarChartProps) {
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
        <RadarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis 
            dataKey="competency" 
            tick={{ fontSize: 11, fill: '#333', fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 9, fill: '#666' }}
            tickCount={6}
            tickFormatter={(value) => `${value}점`}
          />
          <Radar
            name="R&D 역량"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
