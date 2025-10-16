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
  criteria: any;  // rdEvaluationCriteria 필수
}

const RdRadarChart: React.FC<RdRadarChartProps> = ({
  data,
  selectedEmployees = [],
  height = 400,
  showLegend = true,
  showTooltip = true,
  criteria  // rdEvaluationCriteria 받기
}) => {
  // 점수 환산 함수 - criteria의 scoringRanges 사용
  const convertScore = (category: string, rawScore: number): number => {
    if (!criteria || !criteria[category]) {
      console.warn(`⚠️ criteria 없음: ${category}`);
      return rawScore;
    }
    
    const ranges = criteria[category].scoringRanges;
    if (!ranges || ranges.length === 0) {
      console.warn(`⚠️ scoringRanges 없음: ${category}`);
      return rawScore;
    }
    
    // 정렬 (min 기준 오름차순)
    const sortedRanges = [...ranges].sort((a: any, b: any) => a.min - b.min);
    
    // 범위 내 점수 찾기
    for (const range of sortedRanges) {
      if (rawScore >= range.min && rawScore <= range.max) {
        return range.converted;
      }
    }
    
    // 범위 밖 처리
    if (rawScore < sortedRanges[0].min) {
      // 최소 범위 미만
      return sortedRanges[0].converted;
    }
    
    if (rawScore > sortedRanges[sortedRanges.length - 1].max) {
      // 최대 범위 초과
      return sortedRanges[sortedRanges.length - 1].converted;
    }
    
    // 범위 사이 빈틈 (최소값으로)
    return sortedRanges[0].converted;
  };

  // 역량 카테고리 정의
  const categories = [
    { key: 'technicalCompetency', name: '전문기술', criteriaKey: 'technical_competency' },
    { key: 'projectExperience', name: '프로젝트', criteriaKey: 'project_experience' },
    { key: 'rdAchievement', name: '연구성과', criteriaKey: 'rd_achievement' },
    { key: 'globalCompetency', name: '글로벌', criteriaKey: 'global_competency' },
    { key: 'knowledgeSharing', name: '기술확산', criteriaKey: 'knowledge_sharing' },
    { key: 'innovationProposal', name: '혁신제안', criteriaKey: 'innovation_proposal' }
  ];

  // 역량별로 데이터 구조화
  const chartData = categories.map(category => {
    const dataPoint: any = {
      subject: category.name,  // 축 레이블
      fullMark: 100  // 최대값 (환산 후 점수는 항상 100 만점)
    };
    
    // 각 직원의 해당 역량 점수 추가
    data.forEach(item => {
      const rawScore = item.scores[category.key];
      const convertedScore = convertScore(category.criteriaKey, rawScore);
      dataPoint[item.employee.name] = convertedScore;
    });
    
    return dataPoint;
  });

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
            dataKey="subject" 
            tick={{ fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }}
            tickCount={6}
          />
          
          {data.map((employee, index) => (
            <Radar
              key={employee.employee.id}
              name={employee.employee.name}
              dataKey={employee.employee.name}
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
