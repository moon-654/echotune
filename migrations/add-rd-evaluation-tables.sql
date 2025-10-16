-- 연구원 역량평가 테이블 생성
CREATE TABLE IF NOT EXISTS rd_evaluations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR NOT NULL REFERENCES employees(id),
  evaluation_year INTEGER NOT NULL,
  evaluation_period TEXT NOT NULL DEFAULT 'annual',
  
  -- 6대 역량 점수
  technical_competency_score REAL NOT NULL DEFAULT 0,
  technical_competency_details TEXT,
  project_experience_score REAL NOT NULL DEFAULT 0,
  project_experience_details TEXT,
  rd_achievement_score REAL NOT NULL DEFAULT 0,
  rd_achievement_details TEXT,
  global_competency_score REAL NOT NULL DEFAULT 0,
  global_competency_details TEXT,
  knowledge_sharing_score REAL NOT NULL DEFAULT 0,
  knowledge_sharing_details TEXT,
  innovation_proposal_score REAL NOT NULL DEFAULT 0,
  innovation_proposal_details TEXT,
  
  -- 종합 점수
  total_score REAL NOT NULL DEFAULT 0,
  grade TEXT,
  
  -- 평가 정보
  evaluated_by VARCHAR,
  evaluation_date TIMESTAMP DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'draft',
  comments TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 평가 기준 설정 테이블
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  criteria_name TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  scoring_method TEXT NOT NULL DEFAULT 'manual',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 평가 세부 항목 테이블
CREATE TABLE IF NOT EXISTS evaluation_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id VARCHAR NOT NULL REFERENCES rd_evaluations(id),
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_value TEXT,
  item_score REAL NOT NULL DEFAULT 0,
  item_details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 평가 이력 테이블
CREATE TABLE IF NOT EXISTS evaluation_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id VARCHAR NOT NULL REFERENCES rd_evaluations(id),
  action TEXT NOT NULL,
  performed_by VARCHAR NOT NULL,
  previous_values TEXT,
  new_values TEXT,
  comments TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rd_evaluations_employee_year ON rd_evaluations(employee_id, evaluation_year);
CREATE INDEX IF NOT EXISTS idx_rd_evaluations_status ON rd_evaluations(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_items_evaluation_id ON evaluation_items(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_history_evaluation_id ON evaluation_history(evaluation_id);

-- 기본 평가 기준 데이터 삽입
INSERT INTO evaluation_criteria (category, criteria_name, description, weight, max_score, scoring_method) VALUES
('technical_competency', '전문 기술 역량', '직무 수행에 필요한 학문적 지식과 실무 기술의 깊이', 0.25, 100, 'hybrid'),
('project_experience', '프로젝트 수행 경험', '관련 분야에서 축적한 경험과 다수 프로젝트에서의 누적 기여도', 0.20, 100, 'hybrid'),
('rd_achievement', '연구개발 성과', '연구 활동을 통해 창출된 정량적/정성적 결과물', 0.25, 100, 'hybrid'),
('global_competency', '글로벌 역량', '글로벌 R&D 환경에서의 소통 및 정보 습득 능력', 0.10, 100, 'auto'),
('knowledge_sharing', '기술 확산 및 자기계발', '조직 내 기술 전파 노력과 지속적인 학습 활동', 0.10, 100, 'hybrid'),
('innovation_proposal', '업무개선 및 혁신 제안', '사내 제안제도를 통한 업무 개선 및 혁신 기여도', 0.10, 100, 'auto');




