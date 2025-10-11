// R&D 역량평가 기준 정의
export interface RdEvaluationCriteria {
  id: string;
  category: string;
  name: string;
  description: string;
  weight: number; // 가중치 (0-1)
  maxScore: number; // 최대 점수
  scoringMethod: 'auto' | 'manual' | 'hybrid';
  rules: EvaluationRule[];
  isActive: boolean;
}

export interface EvaluationRule {
  id: string;
  name: string;
  description: string;
  condition: string; // SQL 조건 또는 JavaScript 표현식
  score: number; // 부여할 점수
  dataSource: string; // 데이터 소스 테이블
  dataField: string; // 데이터 필드
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'count' | 'sum';
  value?: any; // 비교값
  maxScore?: number; // 최대 점수 (count, sum 연산용)
}

// 6대 역량별 평가 기준 정의
export const RD_EVALUATION_CRITERIA: RdEvaluationCriteria[] = [
  {
    id: 'technical_competency',
    category: 'technical_competency',
    name: '전문 기술 역량',
    description: '직무 수행에 필요한 학문적 지식과 실무 기술의 깊이',
    weight: 0.25,
    maxScore: 100,
    scoringMethod: 'auto',
    isActive: true,
    rules: [
      {
        id: 'education_degree',
        name: '학위',
        description: '최종학력에 따른 점수',
        condition: 'education',
        score: 0,
        dataSource: 'employees',
        dataField: 'education',
        operator: 'equals',
        value: {
          '박사': 30,
          '석사': 20,
          '학사': 10,
          '전문대': 5
        }
      },
      {
        id: 'work_experience',
        name: '경력',
        description: '입사일 기준 경력에 따른 점수',
        condition: 'hire_date',
        score: 0,
        dataSource: 'employees',
        dataField: 'hire_date',
        operator: 'greater_than',
        value: {
          '15년 이상': 50,
          '10년 이상': 40,
          '5년 이상': 30,
          '5년 미만': 20
        }
      },
      {
        id: 'certifications',
        name: '자격증',
        description: '보유 자격증에 따른 점수',
        condition: 'certifications',
        score: 0,
        dataSource: 'certifications',
        dataField: 'category',
        operator: 'count',
        value: {
          '기술사': 20,
          '기사': 10,
          '산업기사': 5,
          '기타': 3
        },
        maxScore: 50
      }
    ]
  },
  {
    id: 'project_experience',
    category: 'project_experience',
    name: '프로젝트 수행 경험',
    description: '관련 분야에서 축적한 경험과 다수 프로젝트에서의 누적 기여도',
    weight: 0.20,
    maxScore: 100,
    scoringMethod: 'auto',
    isActive: true,
    rules: [
      {
        id: 'project_leadership',
        name: '프로젝트 리더십',
        description: '프로젝트 리더 역할 수행',
        condition: 'role',
        score: 0,
        dataSource: 'projects',
        dataField: 'role',
        operator: 'equals',
        value: {
          'Project Leader': 15,
          '핵심 멤버': 10,
          '일반 멤버': 5
        }
      },
      {
        id: 'project_count',
        name: '프로젝트 참여 수',
        description: '참여한 프로젝트 수에 따른 점수',
        condition: 'project_count',
        score: 0,
        dataSource: 'projects',
        dataField: 'id',
        operator: 'count',
        value: {
          '3개 이상': 30,
          '2개': 20,
          '1개': 10
        },
        maxScore: 30
      }
    ]
  },
  {
    id: 'rd_achievement',
    category: 'rd_achievement',
    name: '연구개발 성과',
    description: '연구 활동을 통해 창출된 정량적/정성적 결과물',
    weight: 0.25,
    maxScore: 100,
    scoringMethod: 'auto',
    isActive: true,
    rules: [
      {
        id: 'patents',
        name: '특허',
        description: '특허 출원/등록에 따른 점수',
        condition: 'patents',
        score: 0,
        dataSource: 'patents',
        dataField: 'status',
        operator: 'count',
        value: {
          '등록': 20,
          '출원': 5
        },
        maxScore: 50
      },
      {
        id: 'publications',
        name: '논문',
        description: '논문 발표에 따른 점수',
        condition: 'publications',
        score: 0,
        dataSource: 'publications',
        dataField: 'publication_type',
        operator: 'count',
        value: {
          'SCI(E)급': 25,
          '국내 학술지': 10
        },
        maxScore: 50
      },
      {
        id: 'awards',
        name: '수상',
        description: '수상 실적에 따른 점수',
        condition: 'awards',
        score: 0,
        dataSource: 'awards',
        dataField: 'level',
        operator: 'count',
        value: {
          '국제': 15,
          '국가': 10,
          '산업': 5
        },
        maxScore: 30
      }
    ]
  },
  {
    id: 'global_competency',
    category: 'global_competency',
    name: '글로벌 역량',
    description: '글로벌 R&D 환경에서의 소통 및 정보 습득 능력',
    weight: 0.10,
    maxScore: 100,
    scoringMethod: 'auto',
    isActive: true,
    rules: [
      {
        id: 'language_english',
        name: '영어 능력',
        description: '영어 어학능력 점수',
        condition: 'language_score',
        score: 0,
        dataSource: 'languages',
        dataField: 'score',
        operator: 'greater_than',
        value: {
          '950-990': 10,
          '900-949': 8,
          '800-899': 6,
          '700-799': 4,
          '700미만': 2
        }
      },
      {
        id: 'language_other',
        name: '기타 언어',
        description: '영어 외 다른 언어 능력',
        condition: 'language_other',
        score: 0,
        dataSource: 'languages',
        dataField: 'language',
        operator: 'count',
        value: {
          '일본어 N1': 10,
          '일본어 N2': 7,
          '중국어 HSK6': 8,
          '중국어 HSK5': 5
        },
        maxScore: 20
      }
    ]
  },
  {
    id: 'knowledge_sharing',
    category: 'knowledge_sharing',
    name: '기술 확산 및 자기계발',
    description: '조직 내 기술 전파 노력과 지속적인 학습 활동',
    weight: 0.10,
    maxScore: 100,
    scoringMethod: 'auto',
    isActive: true,
    rules: [
      {
        id: 'training_completion',
        name: '교육 이수',
        description: '교육 이수 시간에 따른 점수 (수강생 역할만)',
        condition: 'training_hours',
        score: 0,
        dataSource: 'training_history',
        dataField: 'duration',
        operator: 'sum',
        value: {
          '40시간 이상': 20,
          '20시간 이상': 15,
          '10시간 이상': 10
        },
        maxScore: 20
      },
      {
        id: 'certification_acquisition',
        name: '신규 자격증',
        description: '평가 기간 내 발급된 자격증',
        condition: 'new_certifications',
        score: 0,
        dataSource: 'certifications',
        dataField: 'issue_date',
        operator: 'count',
        value: {
          '신규 취득': 5
        },
        maxScore: 25
      },
      {
        id: 'mentoring',
        name: '멘토링',
        description: '멘토링 활동 (자동 추출)',
        condition: 'mentoring',
        score: 0,
        dataSource: 'training_history',
        dataField: 'instructor_role',
        operator: 'count',
        value: {
          '멘토링 1회': 3
        },
        maxScore: 15
      },
      {
        id: 'lecturing',
        name: '강의',
        description: '강의 활동 (자동 추출)',
        condition: 'lecturing',
        score: 0,
        dataSource: 'training_history',
        dataField: 'instructor_role',
        operator: 'count',
        value: {
          '강의 1회': 5,
          '강의 2회': 10,
          '강의 3회 이상': 15
        },
        maxScore: 20
      }
    ]
  },
  {
    id: 'innovation_proposal',
    category: 'innovation_proposal',
    name: '업무개선 및 혁신 제안',
    description: '사내 제안제도를 통한 업무 개선 및 혁신 기여도',
    weight: 0.10,
    maxScore: 100,
    scoringMethod: 'manual', // 제안제도 데이터는 별도 관리 필요
    isActive: true,
    rules: [
      {
        id: 'proposal_awards',
        name: '제안 포상',
        description: '제안제도 포상 실적',
        condition: 'proposal_awards',
        score: 0,
        dataSource: 'manual',
        dataField: 'award_level',
        operator: 'equals',
        value: {
          '최우수상': 80,
          '우수상': 60,
          '장려상': 40
        }
      },
      {
        id: 'proposal_adoption',
        name: '제안 채택',
        description: '제안 채택 건수',
        condition: 'proposal_count',
        score: 0,
        dataSource: 'manual',
        dataField: 'adoption_count',
        operator: 'count',
        value: {
          '채택': 5
        },
        maxScore: 50
      }
    ]
  }
];

// 자동 점수 계산 함수
export function calculateRdEvaluationScore(employeeId: string, criteria: RdEvaluationCriteria, data: any): number {
  let totalScore = 0;
  
  for (const rule of criteria.rules) {
    const ruleScore = calculateRuleScore(rule, data);
    totalScore += ruleScore;
  }
  
  // 최대 점수 제한
  return Math.min(totalScore, criteria.maxScore);
}

// 개별 규칙 점수 계산
export function calculateRuleScore(rule: EvaluationRule, data: any): number {
  switch (rule.operator) {
    case 'equals':
      return rule.value[data[rule.dataField]] || 0;
    
    case 'greater_than':
      const score = data[rule.dataField];
      for (const [range, points] of Object.entries(rule.value)) {
        if (isInRange(score, range)) {
          return points;
        }
      }
      return 0;
    
    case 'count':
      const count = data[rule.dataField]?.length || 0;
      const countScore = Math.min(count * (rule.value['개당'] || 1), rule.maxScore || 100);
      return countScore;
    
    case 'sum':
      const sum = data[rule.dataField]?.reduce((acc: number, item: any) => acc + (item.duration || 0), 0) || 0;
      for (const [range, points] of Object.entries(rule.value)) {
        if (isInRange(sum, range)) {
          return points;
        }
      }
      return 0;
    
    
    default:
      return 0;
  }
}


// 범위 체크 함수
function isInRange(value: number, range: string): boolean {
  if (range.includes('이상')) {
    const min = parseInt(range.split('이상')[0]);
    return value >= min;
  } else if (range.includes('미만')) {
    const max = parseInt(range.split('미만')[0]);
    return value < max;
  } else if (range.includes('-')) {
    const [min, max] = range.split('-').map(Number);
    return value >= min && value <= max;
  }
  return false;
}
