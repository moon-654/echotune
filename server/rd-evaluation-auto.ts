import { storage } from "./storage";
import { RD_EVALUATION_CRITERIA, calculateRdEvaluationScore } from "@shared/rd-evaluation-criteria";

// 직원의 6대 역량 자동 평가 실행
export async function calculateAutoRdEvaluation(employeeId: string, evaluationYear: number = new Date().getFullYear()) {
  try {
    // 직원 기본 정보 조회
    const employeeQuery = `
      SELECT * FROM employees WHERE id = $1
    `;
    const employeeResult = await storage.query(employeeQuery, [employeeId]);
    
    if (employeeResult.rows.length === 0) {
      throw new Error("직원을 찾을 수 없습니다.");
    }
    
    const employee = employeeResult.rows[0];
    
    // 관련 데이터 조회
    const relatedData = await getRelatedData(employeeId);
    
    // 6대 역량별 점수 계산
    const scores = {
      technicalCompetency: 0,
      projectExperience: 0,
      rdAchievement: 0,
      globalCompetency: 0,
      knowledgeSharing: 0,
      innovationProposal: 0
    };
    
    const details = {
      technicalCompetency: "",
      projectExperience: "",
      rdAchievement: "",
      globalCompetency: "",
      knowledgeSharing: "",
      innovationProposal: ""
    };
    
    // 각 역량별 점수 계산
    for (const criteria of RD_EVALUATION_CRITERIA) {
      if (criteria.scoringMethod === 'auto' || criteria.scoringMethod === 'hybrid') {
        const score = calculateRdEvaluationScore(employeeId, criteria, {
          ...employee,
          ...relatedData
        });
        
        scores[criteria.category as keyof typeof scores] = score;
        details[criteria.category as keyof typeof details] = generateDetailDescription(criteria, relatedData);
      }
    }
    
    // 종합 점수 계산
    const totalScore = 
      (scores.technicalCompetency * 0.25) +
      (scores.projectExperience * 0.20) +
      (scores.rdAchievement * 0.25) +
      (scores.globalCompetency * 0.10) +
      (scores.knowledgeSharing * 0.10) +
      (scores.innovationProposal * 0.10);
    
    // 등급 계산
    const grade = getGrade(totalScore);
    
    return {
      employeeId,
      evaluationYear,
      scores,
      details,
      totalScore,
      grade,
      calculatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error("자동 평가 계산 오류:", error);
    throw error;
  }
}

// 관련 데이터 조회
async function getRelatedData(employeeId: string) {
  const queries = {
    certifications: `SELECT * FROM certifications WHERE employee_id = $1 AND is_active = true`,
    languages: `SELECT * FROM languages WHERE employee_id = $1 AND is_active = true`,
    projects: `SELECT * FROM projects WHERE employee_id = $1`,
    patents: `SELECT * FROM patents WHERE employee_id = $1`,
    publications: `SELECT * FROM publications WHERE employee_id = $1`,
    awards: `SELECT * FROM awards WHERE employee_id = $1`,
    trainingHistory: `SELECT * FROM training_history WHERE employee_id = $1 AND status = 'completed'`
  };
  
  const results: any = {};
  
  for (const [key, query] of Object.entries(queries)) {
    try {
      const result = await storage.query(query, [employeeId]);
      results[key] = result.rows;
    } catch (error) {
      console.error(`${key} 데이터 조회 오류:`, error);
      results[key] = [];
    }
  }
  
  // 제안제도 데이터 (data.json에서 로드)
  try {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data.json');
    
    let proposals = [];
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(fileContent);
      proposals = (data.proposals || []).filter((p: any) => p.employeeId === employeeId);
    }
    results.proposals = proposals;
  } catch (error) {
    console.error("제안제도 데이터 조회 오류:", error);
    results.proposals = [];
  }
  
  return results;
}

// 상세 설명 생성
function generateDetailDescription(criteria: any, data: any): string {
  const descriptions: string[] = [];
  
  switch (criteria.category) {
    case 'technical_competency':
      if (data.certifications?.length > 0) {
        descriptions.push(`자격증 ${data.certifications.length}개 보유`);
      }
      if (data.employee?.education) {
        descriptions.push(`최종학력: ${data.employee.education}`);
      }
      if (data.employee?.hireDate) {
        const years = Math.floor((new Date().getTime() - new Date(data.employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
        descriptions.push(`경력: ${years}년`);
      }
      break;
      
    case 'project_experience':
      if (data.projects?.length > 0) {
        const leaderCount = data.projects.filter((p: any) => p.role === 'Project Leader').length;
        descriptions.push(`프로젝트 ${data.projects.length}개 참여 (리더 ${leaderCount}개)`);
      }
      break;
      
    case 'rd_achievement':
      if (data.patents?.length > 0) {
        const grantedCount = data.patents.filter((p: any) => p.status === 'granted').length;
        descriptions.push(`특허 ${data.patents.length}건 (등록 ${grantedCount}건)`);
      }
      if (data.publications?.length > 0) {
        descriptions.push(`논문 ${data.publications.length}편`);
      }
      if (data.awards?.length > 0) {
        descriptions.push(`수상 ${data.awards.length}건`);
      }
      break;
      
    case 'global_competency':
      if (data.languages?.length > 0) {
        const englishLang = data.languages.find((l: any) => l.language === 'English');
        if (englishLang) {
          descriptions.push(`영어 ${englishLang.score}점 (${englishLang.testType})`);
        }
        const otherLangs = data.languages.filter((l: any) => l.language !== 'English');
        if (otherLangs.length > 0) {
          descriptions.push(`기타 언어 ${otherLangs.length}개`);
        }
      }
      break;
      
    case 'knowledge_sharing':
      if (data.trainingHistory?.length > 0) {
        const totalHours = data.trainingHistory.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
        descriptions.push(`교육 이수 ${totalHours}시간`);
      }
      // 멘토링 활동 (교육 진행 포함)
      if (data.trainingHistory?.length > 0) {
        const instructorCount = data.trainingHistory.filter((t: any) => t.role === 'instructor' || t.role === 'mentor').length;
        if (instructorCount > 0) {
          descriptions.push(`멘토링/교육진행 ${instructorCount}회`);
        }
      }
      break;
      
    case 'innovation_proposal':
      if (data.proposals?.length > 0) {
        const approvedCount = data.proposals.filter((p: any) => p.status === 'approved' || p.status === 'implemented').length;
        const totalReward = data.proposals.reduce((sum: number, p: any) => sum + (p.rewardAmount || 0), 0);
        descriptions.push(`제안 ${data.proposals.length}건 (채택 ${approvedCount}건)`);
        if (totalReward > 0) {
          descriptions.push(`포상금액 ${totalReward.toLocaleString()}원`);
        }
      } else {
        descriptions.push("제안제도 참여 없음");
      }
      break;
  }
  
  return descriptions.join(", ") || "데이터 없음";
}

// 등급 계산
function getGrade(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

// 모든 직원의 자동 평가 실행
export async function calculateAllEmployeesRdEvaluation(evaluationYear: number = new Date().getFullYear()) {
  try {
    // 모든 활성 직원 조회
    const employeesQuery = `SELECT id FROM employees WHERE is_active = true`;
    const employeesResult = await storage.query(employeesQuery);
    
    const results = [];
    
    for (const employee of employeesResult.rows) {
      try {
        const evaluation = await calculateAutoRdEvaluation(employee.id, evaluationYear);
        results.push(evaluation);
      } catch (error) {
        console.error(`직원 ${employee.id} 평가 오류:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error("전체 직원 평가 오류:", error);
    throw error;
  }
}

// 평가 결과를 DB에 저장
export async function saveRdEvaluationResult(evaluation: any) {
  try {
    const insertQuery = `
      INSERT INTO rd_evaluations (
        employee_id, evaluation_year, evaluation_period,
        technical_competency_score, technical_competency_details,
        project_experience_score, project_experience_details,
        rd_achievement_score, rd_achievement_details,
        global_competency_score, global_competency_details,
        knowledge_sharing_score, knowledge_sharing_details,
        innovation_proposal_score, innovation_proposal_details,
        total_score, grade, status, evaluated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;
    
    const result = await storage.query(insertQuery, [
      evaluation.employeeId,
      evaluation.evaluationYear,
      'annual',
      evaluation.scores.technicalCompetency,
      evaluation.details.technicalCompetency,
      evaluation.scores.projectExperience,
      evaluation.details.projectExperience,
      evaluation.scores.rdAchievement,
      evaluation.details.rdAchievement,
      evaluation.scores.globalCompetency,
      evaluation.details.globalCompetency,
      evaluation.scores.knowledgeSharing,
      evaluation.details.knowledgeSharing,
      evaluation.scores.innovationProposal,
      evaluation.details.innovationProposal,
      evaluation.totalScore,
      evaluation.grade,
      'auto_calculated',
      'system'
    ]);
    
    return result.rows[0];
  } catch (error) {
    console.error("평가 결과 저장 오류:", error);
    throw error;
  }
}
