import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RadarChartProps {
  data: any[];
  className?: string;
  dataKey?: string;
  nameKey?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const COMPETENCY_LABELS: Record<string, string> = {
  experience: '경력',
  certification: '자격증',
  language: '어학',
  training: '교육',
  technical: '전문성',
  softSkill: '소프트스킬',
  overall: '종합'
};

export default function RadarChartComponent({ data, className, dataKey, nameKey }: RadarChartProps) {
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

  // 데이터 변환 로직 (dataKey가 있는 경우 PIVOT 처리)
  let chartData = data;
  let radars = [{ key: 'score', name: '점수', color: '#3b82f6' }];

  if (dataKey && nameKey) {
    // 1. 역량 키 추출 (첫 번째 아이템 기준)
    const firstItem = data[0];
    const skills = firstItem[dataKey];
    
    if (skills) {
      const keys = Object.keys(skills).filter(k => k !== 'overall'); // overall 제외
      
      // 2. 차트 데이터 구성 (Axis가 행이 됨)
      chartData = keys.map(key => {
        const item: any = { competency: COMPETENCY_LABELS[key] || key };
        
        // 각 엔티티(부서/직원)의 점수를 컬럼으로 추가
        data.forEach(entity => {
          const name = entity[nameKey]; // e.g. 부서명
          if (entity[dataKey]) {
            item[name] = entity[dataKey][key];
          }
        });
        return item;
      });

      // 3. Radar 정의 생성 (각 엔티티가 하나의 Radar)
      radars = data.map((entity, index) => ({
        key: entity[nameKey],
        name: entity[nameKey],
        color: COLORS[index % COLORS.length]
      }));
    }
  }

  return (
    <div className={className} data-testid="radar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
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
            tickFormatter={(value) => `${value}`}
          />
          
          {radars.map((radar) => (
            <Radar
              key={radar.key}
              name={radar.name}
              dataKey={radar.key}
              stroke={radar.color}
              fill={radar.color}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ r: 3, fill: radar.color, strokeWidth: 0 }}
            />
          ))}
          
          <Tooltip />
          {radars.length > 1 && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
