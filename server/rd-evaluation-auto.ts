import { storage } from "./storage";
import { RD_EVALUATION_CRITERIA, calculateRdEvaluationScore } from "@shared/rd-evaluation-criteria";
import fs from "fs";
import path from "path";

// 직원의 6대 역량 자동 평가 실행
export async function calculateAutoRdEvaluation(employeeId: string, evaluationYear: number = new Date().getFullYear(), startDate?: string, endDate?: string) {
  try {
    // 직원 기본 정보 조회 (data.json에서)
    const dataPath = path.join(process.cwd(), 'data.json');
    let employee = null;
    let rdEvaluationCriteria = null;
    
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data.employees && data.employees[employeeId]) {
        employee = data.employees[employeeId];
      }
      
      // R&D 역량평가 기준 로드
      if (data.rdEvaluationCriteria) {
        rdEvaluationCriteria = data.rdEvaluationCriteria;
        console.log('🔍 R&D 역량평가 기준 로드:', rdEvaluationCriteria);
      }
    }
    
    if (!employee) {
      throw new Error("직원을 찾을 수 없습니다.");
    }
    
    // 관련 데이터 조회 (날짜 필터 적용)
    const relatedData = await getRelatedData(employeeId, startDate, endDate);
    
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
    
    // 각 역량별 점수 계산 (수동으로 계산)
    console.log('🔍 관련 데이터:', relatedData);
    
    // 1. 전문기술 역량 계산
    let technicalScore = 0;
    if (employee.education === 'bachelor') technicalScore += 10;
    if (employee.education === 'master') technicalScore += 20;
    if (employee.education === 'doctor') technicalScore += 30;
    
    // 경력 계산 (사내 근속 + 이전 경력 반영)
    const hireDate = employee.hireDate ? new Date(employee.hireDate) : null;
    const inCompanyYears = hireDate ? ((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0;
    const prevYears = Number(employee.previousExperienceYears || 0);
    const prevMonths = Number(employee.previousExperienceMonths || 0);
    const totalYears = inCompanyYears + prevYears + (prevMonths / 12);
    if (totalYears >= 15) technicalScore += 50;
    else if (totalYears >= 10) technicalScore += 40;
    else if (totalYears >= 5) technicalScore += 30;
    else technicalScore += 20;
    
    // 자격증 점수 (상세 기준 반영: 기술사 20, 기사 10, 산업기사 5, 기타 3)
    const getCertificationPoint = (cert: any): number => {
      const name = (`${cert.name || ''}`).toLowerCase();
      const level = (`${cert.level || ''}`).toLowerCase();
      if (name.includes('기술사') || level.includes('expert')) return 20;
      if ((name.includes('기사') && !name.includes('산업기사')) || level.includes('advanced')) return 10;
      if (name.includes('산업기사') || level.includes('intermediate')) return 5;
      return 3;
    };
    if (relatedData.certifications?.length) {
      for (const cert of relatedData.certifications) {
        technicalScore += getCertificationPoint(cert);
      }
    }
    
    scores.technicalCompetency = Math.min(technicalScore, 100);
    
    // 2. 프로젝트 수행 경험 계산
    let projectScore = 0;
    if (relatedData.projects && relatedData.projects.length > 0) {
      const leaderCount = relatedData.projects.filter((p: any) => p.role === 'PL' || p.role === 'Project Leader').length;
      const memberCount = relatedData.projects.length - leaderCount;
      
      projectScore += leaderCount * 15; // PL당 15점
      projectScore += memberCount * 5;  // 멤버당 5점
      
      // 프로젝트 개수에 따른 추가 점수
      if (relatedData.projects.length >= 3) projectScore += 30;
      else if (relatedData.projects.length >= 2) projectScore += 20;
      else if (relatedData.projects.length >= 1) projectScore += 10;
    }
    
    scores.projectExperience = Math.min(projectScore, 100);
    
    // 3. 연구개발 성과 계산
    let rdScore = 0;
    if (relatedData.patents && relatedData.patents.length > 0) {
      rdScore += relatedData.patents.length * 10; // 특허당 10점
    }
    if (relatedData.publications && relatedData.publications.length > 0) {
      rdScore += relatedData.publications.length * 15; // 논문당 15점
    }
    if (relatedData.awards && relatedData.awards.length > 0) {
      rdScore += relatedData.awards.length * 20; // 수상당 20점
    }
    
    scores.rdAchievement = Math.min(rdScore, 100);
    
    // 4. 글로벌 역량 계산
    let globalScore = 0;
    if (relatedData.languages && relatedData.languages.length > 0) {
      // R&D 역량평가 기준에서 글로벌 역량 기준 가져오기
      const globalCriteria = rdEvaluationCriteria?.global_competency || {};
      
      for (const lang of relatedData.languages) {
        // 영어 점수 계산 (TOEIC)
        if (lang.language === 'English' && lang.testType === 'TOEIC') {
          const score = lang.score || 0;
          const toeicCriteria = globalCriteria.english?.toeic || {};
          
          // 점수 범위에 따른 점수 계산
          if (score >= 950) globalScore += toeicCriteria["950-990"] || 10;
          else if (score >= 900) globalScore += toeicCriteria["900-949"] || 8;
          else if (score >= 800) globalScore += toeicCriteria["800-899"] || 6;
          else if (score >= 700) globalScore += toeicCriteria["700-799"] || 4;
          else globalScore += toeicCriteria["700미만"] || 2;
        }
        
        // 일본어 점수 계산 (JLPT)
        if (lang.language === 'Japanese' && lang.testType === 'JLPT') {
          const jlptCriteria = globalCriteria.japanese?.jlpt || {};
          
          // testLevel이 있으면 우선 사용 (N1, N2 등)
          if (lang.testLevel) {
            globalScore += jlptCriteria[lang.testLevel] || 0;
          } else {
            // testLevel이 없으면 proficiencyLevel 사용 (기존 방식)
            if (lang.proficiencyLevel === 'advanced') globalScore += jlptCriteria["N1"] || 10;
            else if (lang.proficiencyLevel === 'intermediate') globalScore += jlptCriteria["N2"] || 7;
            else if (lang.proficiencyLevel === 'beginner') globalScore += jlptCriteria["N3"] || 4;
          }
        }
        
        // 중국어 점수 계산 (HSK)
        if (lang.language === 'Chinese' && lang.testType === 'HSK' && lang.testLevel) {
          const hskCriteria = globalCriteria.chinese?.hsk || {};
          globalScore += hskCriteria[lang.testLevel] || 0;
        }
      }
    }
    
    scores.globalCompetency = Math.min(globalScore, 100);
    
    // 5. 기술 확산 및 자기계발 계산
    let knowledgeScore = 0;
    
    // 교육이수 점수 (수강생 역할만) - 원점수 계산
    if (relatedData.trainingHistory && relatedData.trainingHistory.length > 0) {
      const studentTrainings = relatedData.trainingHistory.filter((training: any) => 
        training.status === 'completed' && 
        (training.instructorRole === null || training.instructorRole === undefined)
      );
      const totalHours = studentTrainings.reduce((sum: number, training: any) => sum + (training.duration || 0), 0);
      
      if (totalHours >= 40) knowledgeScore += 5;
      else if (totalHours >= 20) knowledgeScore += 3;
      else if (totalHours >= 10) knowledgeScore += 2;
    }
    
    // 신규 자격증 점수 (평가 기간 내 발급) - 원점수 계산
    if (relatedData.certifications && relatedData.certifications.length > 0) {
      const newCerts = relatedData.certifications.filter((cert: any) => {
        if (!cert.issueDate) return false;
        const issueDate = new Date(cert.issueDate);
        const start = startDate ? new Date(startDate) : new Date(evaluationYear, 0, 1);
        const end = endDate ? new Date(endDate) : new Date(evaluationYear, 11, 31);
        return issueDate >= start && issueDate <= end;
      });
      knowledgeScore += Math.min(newCerts.length * 5, 25);
    }
    
    // 멘토링 활동 점수 - 원점수 계산
    if (relatedData.trainingHistory && relatedData.trainingHistory.length > 0) {
      const mentoringCount = relatedData.trainingHistory.filter((training: any) => 
        training.status === 'completed' && training.instructorRole === 'mentor'
      ).length;
      knowledgeScore += Math.min(mentoringCount * 3, 15);
    }
    
    // 강의 활동 점수 - 원점수 계산
    if (relatedData.trainingHistory && relatedData.trainingHistory.length > 0) {
      const lectureCount = relatedData.trainingHistory.filter((training: any) => 
        training.status === 'completed' && training.instructorRole === 'instructor'
      ).length;
      
      if (lectureCount >= 3) knowledgeScore += 15;
      else if (lectureCount >= 2) knowledgeScore += 10;
      else if (lectureCount >= 1) knowledgeScore += 5;
    }
    
    // 원점수 그대로 저장 (scoringRanges는 convertScore에서 적용)
    scores.knowledgeSharing = knowledgeScore;
    
    // 6. 업무개선 및 혁신 제안 계산
    let innovationScore = 0;
    if (relatedData.proposals && relatedData.proposals.length > 0) {
      innovationScore += relatedData.proposals.length * 10; // 제안당 10점
    }
    
    scores.innovationProposal = Math.min(innovationScore, 100);
    
    // 상세 설명 생성
    const totalYearsText = (Math.round(totalYears * 10) / 10).toFixed(1);
    const inCompanyYearsText = (Math.round(inCompanyYears * 10) / 10).toFixed(1);
    details.technicalCompetency = `학력: ${employee.education || '미입력'}, 경력: ${totalYearsText}년(사내 ${inCompanyYearsText}년 + 이전 ${prevYears}년 ${prevMonths}개월), 자격증: ${relatedData.certifications.length}개`;
    details.projectExperience = `프로젝트: ${relatedData.projects?.length || 0}개 (PL: ${relatedData.projects?.filter((p: any) => p.role === 'PL').length || 0}개)`;
    details.rdAchievement = `특허: ${relatedData.patents?.length || 0}건, 논문: ${relatedData.publications?.length || 0}편, 수상: ${relatedData.awards?.length || 0}건`;
    details.globalCompetency = `어학능력: ${relatedData.languages?.length || 0}개 언어`;
    // 기술확산 상세 정보 생성
    const studentTrainings = relatedData.trainingHistory?.filter((t: any) => 
      t.status === 'completed' && (t.instructorRole === null || t.instructorRole === undefined)
    ) || [];
    const mentoringCount = relatedData.trainingHistory?.filter((t: any) => 
      t.status === 'completed' && t.instructorRole === 'mentor'
    ).length || 0;
    const lectureCount = relatedData.trainingHistory?.filter((t: any) => 
      t.status === 'completed' && t.instructorRole === 'instructor'
    ).length || 0;
    const newCertsCount = relatedData.certifications?.filter((cert: any) => {
      if (!cert.issueDate) return false;
      const issueDate = new Date(cert.issueDate);
      const start = startDate ? new Date(startDate) : new Date(evaluationYear, 0, 1);
      const end = endDate ? new Date(endDate) : new Date(evaluationYear, 11, 31);
      return issueDate >= start && issueDate <= end;
    }).length || 0;
    
    const totalStudentHours = studentTrainings.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);
    details.knowledgeSharing = `교육이수: ${totalStudentHours}시간, 신규자격증: ${newCertsCount}개, 멘토링: ${mentoringCount}회, 강의: ${lectureCount}회`;
    details.innovationProposal = `제안제도: ${relatedData.proposals?.length || 0}건`;
    
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

// 날짜 필터링 헬퍼 함수
function filterByDateRange(items: any[], dateField: string, startDate?: string, endDate?: string): any[] {
  if (!startDate && !endDate) return items;
  
  return items.filter(item => {
    const itemDate = item[dateField];
    if (!itemDate) return false; // 날짜가 없는 항목은 제외
    
    const itemDateObj = new Date(itemDate);
    if (isNaN(itemDateObj.getTime())) return false; // 유효하지 않은 날짜는 제외
    
    if (startDate && itemDateObj < new Date(startDate)) return false;
    if (endDate && itemDateObj > new Date(endDate)) return false;
    
    return true;
  });
}

// 관련 데이터 조회 (data.json에서)
async function getRelatedData(employeeId: string, startDate?: string, endDate?: string) {
  const dataPath = path.join(process.cwd(), 'data.json');
  const results: any = {
    certifications: [],
    languages: [],
    projects: [],
    patents: [],
    publications: [],
    awards: [],
    trainingHistory: [],
    proposals: []
  };
  
  try {
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(fileContent);
      
      // 각 데이터 타입별로 필터링
      if (data.certifications) {
        let certifications = Object.values(data.certifications).filter((item: any) => 
          item.employeeId === employeeId && item.isActive
        );
        // 자격증은 발급일 기준으로 필터링
        results.certifications = filterByDateRange(certifications, 'issueDate', startDate, endDate);
      }
      
      if (data.languages) {
        // 어학능력은 날짜 필터링 없이 전체 포함 (언어 능력은 지속적)
        results.languages = Object.values(data.languages).filter((item: any) => 
          item.employeeId === employeeId && item.isActive
        );
      }
      
      if (data.trainingHistory) {
        let trainingHistory = Object.values(data.trainingHistory).filter((item: any) => 
          item.employeeId === employeeId && item.status === 'completed'
        );
        // 교육은 완료일 기준으로 필터링
        results.trainingHistory = filterByDateRange(trainingHistory, 'completionDate', startDate, endDate);
      }
      
      if (data.projects) {
        let projects = Object.values(data.projects).filter((item: any) => 
          item.employeeId === employeeId
        );
        // 프로젝트는 시작일 기준으로 필터링
        results.projects = filterByDateRange(projects, 'startDate', startDate, endDate);
      }
      
      if (data.patents) {
        let patents = Object.values(data.patents).filter((item: any) => 
          item.employeeId === employeeId
        );
        // 특허는 출원일 기준으로 필터링
        results.patents = filterByDateRange(patents, 'applicationDate', startDate, endDate);
      }
      
      if (data.publications) {
        let publications = Object.values(data.publications).filter((item: any) => 
          item.employeeId === employeeId
        );
        // 논문은 발행일 기준으로 필터링
        results.publications = filterByDateRange(publications, 'publicationDate', startDate, endDate);
      }
      
      if (data.awards) {
        let awards = Object.values(data.awards).filter((item: any) => 
          item.employeeId === employeeId
        );
        // 수상은 수상일 기준으로 필터링
        results.awards = filterByDateRange(awards, 'awardDate', startDate, endDate);
      }
      
      // 제안제도 데이터 (data.json에서 로드)
      if (data.proposals) {
        let proposals = [];
        if (Array.isArray(data.proposals)) {
          proposals = data.proposals;
        } else {
          proposals = Object.values(data.proposals); // Convert object to array
        }
        let filteredProposals = proposals.filter((p: any) => p.employeeId === employeeId);
        // 제안제도는 제출일 기준으로 필터링
        results.proposals = filterByDateRange(filteredProposals, 'submissionDate', startDate, endDate);
      }
    }
  } catch (error) {
    console.error("관련 데이터 조회 오류:", error);
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
