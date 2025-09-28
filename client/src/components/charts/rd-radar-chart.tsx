import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RdRadarData {
  employee: {
    id: string;
    name: string;
    department: string;
  };
  scores: {
    technicalCompetency: number;
    projectExperience: number;
    rdAchievement: number;
    globalCompetency: number;
    knowledgeSharing: number;
    innovationProposal: number;
  };
  totalScore: number;
}

interface RdRadarChartProps {
  data: RdRadarData[];
  selectedEmployees?: string[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
}

const RdRadarChart: React.FC<RdRadarChartProps> = ({
  data,
  selectedEmployees = [],
  height = 400,
  showLegend = true,
  showTooltip = true
}) => {
  // 데이터 변환
  const chartData = data.map(item => ({
    name: item.employee.name,
    '전문 기술 역량': item.scores.technicalCompetency,
    '프로젝트 수행 경험': item.scores.projectExperience,
    '연구개발 성과': item.scores.rdAchievement,
    '글로벌 역량': item.scores.globalCompetency,
    '기술 확산 및 자기계발': item.scores.knowledgeSharing,
    '업무개선 및 혁신 제안': item.scores.innovationProposal,
    totalScore: item.totalScore
  }));

  // 색상 팔레트
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff'
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const categories = {
                '전문 기술 역량': '전문기술',
                '프로젝트 수행 경험': '프로젝트',
                '연구개발 성과': '연구성과',
                '글로벌 역량': '글로벌',
                '기술 확산 및 자기계발': '기술확산',
                '업무개선 및 혁신 제안': '혁신제안'
              };
              return categories[value] || value;
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }}
            tickCount={6}
          />
          
          {chartData.map((item, index) => (
            <Radar
              key={item.name}
              name={item.name}
              dataKey={item.name}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
          
          {showTooltip && (
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-semibold mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.dataKey}: {entry.value}점
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          
          {showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RdRadarChart;
