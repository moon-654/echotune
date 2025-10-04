import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Users, Award, BookOpen, TrendingUp, FileText, Trophy, Lightbulb, GraduationCap, Building } from "lucide-react";
import RdCapabilityBarChart from "@/components/charts/rd-capability-bar-chart";
import SimpleBarChart from "@/components/charts/simple-bar-chart";
import SimpleRadarChart from "@/components/charts/simple-radar-chart";
import EmployeeEditModal from "@/components/employees/employee-edit-modal";
import SkillEditModal from "@/components/employees/skill-edit-modal";
import TrainingEditModal from "@/components/employees/training-edit-modal";
import ProjectEditModal from "@/components/employees/project-edit-modal";
import AchievementsEditModal from "@/components/employees/achievements-edit-modal";
import AwardsEditModal from "@/components/employees/awards-edit-modal";
import CertificationEditModal from "@/components/employees/certification-edit-modal";
import LanguageEditModal from "@/components/employees/language-edit-modal";
import ProposalEditModal from "@/components/employees/proposal-edit-modal";
import type { Employee, Patent, Publication, Award as AwardType, Project } from "@shared/schema";
import type { ProposalFormData } from "@/types/employee";

interface EmployeeDetailProps {
  employeeId?: string;
}

export default function EmployeeDetail({ employeeId: propEmployeeId }: EmployeeDetailProps = {}) {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // props로 받은 employeeId가 있으면 사용, 없으면 URL에서 가져오기
  const employeeId = propEmployeeId || location.split('/').pop() || "emp1";

  // 실제 직원 데이터 상태 관리
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  // 실제 스킬 데이터 상태 관리
  const [skills, setSkills] = useState<Array<{
    skillName: string;
    skillType: string;
    proficiencyLevel: number;
  }>>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // 제안제도 데이터 상태 관리
  const [proposals, setProposals] = useState<ProposalFormData[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  // R&D 역량평가 데이터 상태 관리
  const [rdEvaluation, setRdEvaluation] = useState<{
    scores: {
      technicalCompetency: number;
      projectExperience: number;
      rdAchievement: number;
      globalCompetency: number;
      knowledgeSharing: number;
      innovationProposal: number;
    };
    totalScore: number;
    grade: string;
  } | null>(null);
  const [rdEvaluationLoading, setRdEvaluationLoading] = useState(true);
  
  // R&D 역량평가 기준 데이터 상태 관리
  const [rdEvaluationCriteria, setRdEvaluationCriteria] = useState<any>(null);
  const [rdEvaluationCriteriaLoading, setRdEvaluationCriteriaLoading] = useState(true);

  // 직원 데이터 로드
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        } else {
          setEmployee(null);
        }
      } catch (error) {
        console.error('직원 데이터 로드 오류:', error);
        setEmployee(null);
      } finally {
        setEmployeeLoading(false);
      }
    };

    if (employeeId) {
      loadEmployee();
    }
  }, [employeeId]);

  // 스킬 데이터 로드
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch(`/api/skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setSkills(data);
        } else {
          setSkills([]);
        }
      } catch (error) {
        console.error('스킬 데이터 로드 오류:', error);
        setSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };

    if (employeeId) {
      loadSkills();
    }
  }, [employeeId]);

  // 실제 교육 데이터 상태 관리
  const [trainings, setTrainings] = useState<Array<{
    courseName: string;
    completionDate?: string;
    startDate?: string;
    score?: number;
    status: string;
  }>>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(true);

  // 교육 데이터 로드
  useEffect(() => {
    const loadTrainings = async () => {
      try {
        const response = await fetch(`/api/training-history?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setTrainings(data);
        } else {
          setTrainings([]);
        }
      } catch (error) {
        console.error('교육 데이터 로드 오류:', error);
        setTrainings([]);
      } finally {
        setTrainingsLoading(false);
      }
    };

    if (employeeId) {
      loadTrainings();
    }
  }, [employeeId]);

  // 제안제도 데이터 로드
  useEffect(() => {
    const loadProposals = async () => {
      try {
        const response = await fetch(`/api/proposals?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setProposals(data);
        } else {
          setProposals([]);
        }
      } catch (error) {
        console.error('제안제도 데이터 로드 오류:', error);
        setProposals([]);
      } finally {
        setProposalsLoading(false);
      }
    };

    if (employeeId) {
      loadProposals();
    }
  }, [employeeId]);

  // R&D 역량평가 데이터 로드
  useEffect(() => {
    const loadRdEvaluation = async () => {
      try {
        const response = await fetch(`/api/rd-evaluations/test/${employeeId}`);
        
        if (response.ok) {
          const data = await response.json();
          setRdEvaluation(data);
        } else {
          // 기본값 설정
          setRdEvaluation({
            scores: {
              technicalCompetency: 0,
              projectExperience: 0,
              rdAchievement: 0,
              globalCompetency: 0,
              knowledgeSharing: 0,
              innovationProposal: 0
            },
            totalScore: 0,
            grade: 'D'
          });
        }
      } catch (error) {
        console.error('R&D 역량평가 데이터 로드 오류:', error);
        // 기본값 설정
        setRdEvaluation({
          scores: {
            technicalCompetency: 0,
            projectExperience: 0,
            rdAchievement: 0,
            globalCompetency: 0,
            knowledgeSharing: 0,
            innovationProposal: 0
          },
          totalScore: 0,
          grade: 'D'
        });
      } finally {
        setRdEvaluationLoading(false);
      }
    };

    if (employeeId) {
      loadRdEvaluation();
    }
  }, [employeeId]);

  // R&D 역량평가 기준 데이터 로드
  useEffect(() => {
    console.log('🚀 useEffect 실행: R&D 역량평가 기준 로드');
    console.log('🚀 현재 rdEvaluationCriteria 상태:', rdEvaluationCriteria);
    
    const loadRdEvaluationCriteria = async () => {
      try {
        console.log('🔍 R&D 역량평가 기준 데이터 로드 시작');
        console.log('🔍 API URL: /api/rd-evaluations/criteria');
        
        const response = await fetch('/api/rd-evaluations/criteria');
        console.log('🔍 API 응답 상태:', response.status);
        console.log('🔍 API 응답 헤더:', response.headers);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 R&D 역량평가 기준 데이터 로드 성공:', data);
          
          // 응답 구조에 따라 데이터 추출 (criteria 또는 rdEvaluationCriteria)
          const criteriaData = data.criteria || data.rdEvaluationCriteria;
          console.log('🔍 rdEvaluationCriteria 내용:', criteriaData);
          console.log('🔍 rdEvaluationCriteria 타입:', typeof criteriaData);
          console.log('🔍 rdEvaluationCriteria 키들:', criteriaData ? Object.keys(criteriaData) : 'null');
          
          // competencyItems가 있는 경우 그것을 사용, 없으면 전체 데이터 사용
          const rawFinal = criteriaData?.competencyItems || criteriaData;
          
          // 키 정규화: camelCase/snake_case/중첩 모두 지원
          const normalizeKeys = (src: any) => {
            if (!src || typeof src !== 'object') return null;
            const pick = (obj: any, keys: string[]) => keys.find(k => obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k]);
            const tc = pick(src, ['technical_competency', 'technicalCompetency']);
            const pj = pick(src, ['project_experience', 'projectExperience']);
            const rd = pick(src, ['rd_achievement', 'rdAchievement']);
            const gl = pick(src, ['global_competency', 'globalCompetency']);
            const ks = pick(src, ['knowledge_sharing', 'knowledgeSharing']);
            const ip = pick(src, ['innovation_proposal', 'innovationProposal']);
            const result: any = {};
            if (tc) result.technical_competency = tc;
            if (pj) result.project_experience = pj;
            if (rd) result.rd_achievement = rd;
            if (gl) result.global_competency = gl;
            if (ks) result.knowledge_sharing = ks;
            if (ip) result.innovation_proposal = ip;
            // 일부 API가 criteria 아래 competencyItems로 감쌀 수도 있음
            if (Object.keys(result).length === 0 && src?.competencyItems) {
              return normalizeKeys(src.competencyItems);
            }
            return Object.keys(result).length > 0 ? result : src;
          };
          const finalCriteriaData = normalizeKeys(rawFinal);
          console.log('🔍 최종 기준 데이터:', finalCriteriaData);
          console.log('🔍 최종 기준 데이터 타입:', typeof finalCriteriaData);
          console.log('🔍 최종 기준 데이터 키들:', finalCriteriaData ? Object.keys(finalCriteriaData) : 'null');
          
          setRdEvaluationCriteria(finalCriteriaData);
        } else {
          console.log('❌ R&D 역량평가 기준 데이터 없음, 상태:', response.status);
          const errorText = await response.text();
          console.log('❌ 에러 응답 내용:', errorText);
          setRdEvaluationCriteria(null);
        }
      } catch (error) {
        console.error('❌ R&D 역량평가 기준 데이터 로드 오류:', error);
        setRdEvaluationCriteria(null);
      } finally {
        setRdEvaluationCriteriaLoading(false);
      }
    };

    console.log('🚀 loadRdEvaluationCriteria 함수 호출');
    loadRdEvaluationCriteria();
  }, []);

  // R&D 역량평가 기준 상태 변화 감지
  useEffect(() => {
    console.log('🔄 rdEvaluationCriteria 상태 변화:', rdEvaluationCriteria);
    console.log('🔄 rdEvaluationCriteria 타입:', typeof rdEvaluationCriteria);
    console.log('🔄 rdEvaluationCriteria 키들:', rdEvaluationCriteria ? Object.keys(rdEvaluationCriteria) : 'null');
  }, [rdEvaluationCriteria]);

  // 실제 프로젝트 데이터 상태 관리
  const [projects, setProjects] = useState<Array<{
    projectName: string;
    role: string;
    startDate: string;
    endDate?: string;
    status: string;
  }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch(`/api/projects?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('프로젝트 데이터 로드 오류:', error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    if (employeeId) {
      loadProjects();
    }
  }, [employeeId]);

  // 실제 성과 데이터 상태 관리
  const [patents, setPatents] = useState<Array<{
    title: string;
    applicationNumber?: string;
    applicationDate?: string;
    status: string;
  }>>([]);
  const [publications, setPublications] = useState<Array<{
    title: string;
    authors?: string;
    journal?: string;
    conference?: string;
    publicationDate?: string;
    type: string;
  }>>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  // 성과 데이터 로드
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        console.log('🔍 성과 데이터 로드 시작:', employeeId);
        
        // 특허와 논문을 병렬로 로드
        const [patentsResponse, publicationsResponse] = await Promise.all([
          fetch(`/api/patents?employeeId=${employeeId}`),
          fetch(`/api/publications?employeeId=${employeeId}`)
        ]);

        if (patentsResponse.ok) {
          const patentsData = await patentsResponse.json();
          console.log('🔍 특허 데이터 로드 성공:', patentsData);
          setPatents(patentsData);
        } else {
          setPatents([]);
        }

        if (publicationsResponse.ok) {
          const publicationsData = await publicationsResponse.json();
          console.log('🔍 논문 데이터 로드 성공:', publicationsData);
          setPublications(publicationsData);
        } else {
          setPublications([]);
        }
      } catch (error) {
        console.error('🔍 성과 데이터 로드 오류:', error);
        setPatents([]);
        setPublications([]);
      } finally {
        setAchievementsLoading(false);
      }
    };

    if (employeeId) {
      loadAchievements();
    }
  }, [employeeId]);

  // 실제 수상 데이터 상태 관리
  const [awards, setAwards] = useState<Array<{
    name: string;
    issuer: string;
    awardDate: string;
    category: string;
  }>>([]);
  const [awardsLoading, setAwardsLoading] = useState(true);

  // 실제 자격증 데이터 상태 관리
  const [certifications, setCertifications] = useState<Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    score?: number;
    status: string;
    category: string;
  }>>([]);
  const [certificationsLoading, setCertificationsLoading] = useState(true);

  // 실제 어학능력 데이터 상태 관리
  const [languages, setLanguages] = useState<Array<{
    language: string;
    speaking: string;
    reading: string;
    writing: string;
    listening: string;
    overallLevel: string;
    certification?: string;
    score?: number;
  }>>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);


  // 수상 데이터 로드
  useEffect(() => {
    const loadAwards = async () => {
      try {
        console.log('🔍 수상 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/awards?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 수상 데이터 로드 성공:', data);
          setAwards(data);
        } else {
          console.log('🔍 수상 데이터 없음');
          setAwards([]);
        }
      } catch (error) {
        console.error('🔍 수상 데이터 로드 오류:', error);
        setAwards([]);
      } finally {
        setAwardsLoading(false);
      }
    };

    if (employeeId) {
      loadAwards();
    }
  }, [employeeId]);

  // 자격증 데이터 로드
  useEffect(() => {
    const loadCertifications = async () => {
      try {
        console.log('🔍 자격증 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/certifications?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 자격증 데이터 로드 성공:', data);
          setCertifications(data);
        } else {
          console.log('🔍 자격증 데이터 없음');
          setCertifications([]);
        }
      } catch (error) {
        console.error('🔍 자격증 데이터 로드 오류:', error);
        setCertifications([]);
      } finally {
        setCertificationsLoading(false);
      }
    };

    if (employeeId) {
      loadCertifications();
    }
  }, [employeeId]);

  // 어학능력 데이터 로드
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        console.log('🔍 어학능력 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/language-skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 어학능력 데이터 로드 성공:', data);
          setLanguages(data);
        } else {
          console.log('🔍 어학능력 데이터 없음');
          setLanguages([]);
        }
      } catch (error) {
        console.error('🔍 어학능력 데이터 로드 오류:', error);
        setLanguages([]);
      } finally {
        setLanguagesLoading(false);
      }
    };

    if (employeeId) {
      loadLanguages();
    }
  }, [employeeId]);


  const overallSkill = skills.length > 0 
    ? Math.floor(skills.reduce((sum, skill) => sum + skill.proficiencyLevel, 0) / skills.length)
    : 0;
  
  // employee 데이터가 로드된 후에만 experience 계산
  const experience = employee && employee.hireDate 
    ? Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  // R&D 역량평가 기준에 따른 점수 환산 함수
  const convertScore = (category: string, rawScore: number): number => {
    console.log(`🔄 점수 환산 시작: ${category} = ${rawScore}점`);
    
    if (!rdEvaluationCriteria) {
      console.log(`❌ R&D 역량평가 기준 없음: ${category} = ${rawScore}점 (원점수 유지)`);
      return rawScore;
    }
    
    // competencyItems가 있는 경우와 없는 경우 모두 처리
    const criteriaSource = rdEvaluationCriteria.competencyItems || rdEvaluationCriteria;
    if (!criteriaSource) {
      console.log(`❌ R&D 역량평가 기준 소스 없음: ${category} = ${rawScore}점 (원점수 유지)`);
      return rawScore;
    }

    const competencyKey = category === '전문기술' ? 'technical_competency' :
                         category === '프로젝트' ? 'project_experience' :
                         category === '연구성과' ? 'rd_achievement' :
                         category === '글로벌' ? 'global_competency' :
                         category === '기술확산' ? 'knowledge_sharing' :
                         category === '혁신제안' ? 'innovation_proposal' : null;

    // 키가 없으면 camelCase 대안 키도 확인
    const altKey = competencyKey === 'technical_competency' ? 'technicalCompetency'
                  : competencyKey === 'project_experience' ? 'projectExperience'
                  : competencyKey === 'rd_achievement' ? 'rdAchievement'
                  : competencyKey === 'global_competency' ? 'globalCompetency'
                  : competencyKey === 'knowledge_sharing' ? 'knowledgeSharing'
                  : competencyKey === 'innovation_proposal' ? 'innovationProposal' : null;

    let sourceBlock = competencyKey && criteriaSource[competencyKey]
      ? criteriaSource[competencyKey]
      : (altKey && criteriaSource[altKey] ? criteriaSource[altKey] : null);

    if (!competencyKey || !sourceBlock) {
      // 블록 자체가 없으면 기본 블록 생성(폴백)
      const defaultsBlock: Record<string, any> = {
        technical_competency: { scoringRanges: [
          { min: 80, max: 100, converted: 100 },
          { min: 60, max: 79, converted: 80 },
          { min: 40, max: 59, converted: 60 },
          { min: 0, max: 39, converted: 40 }
        ]},
        project_experience: { scoringRanges: [
          { min: 30, max: 100, converted: 100 },
          { min: 20, max: 29, converted: 80 },
          { min: 10, max: 19, converted: 60 },
          { min: 0, max: 9, converted: 40 }
        ]},
        rd_achievement: { scoringRanges: [
          { min: 40, max: 100, converted: 100 },
          { min: 25, max: 39, converted: 80 },
          { min: 10, max: 24, converted: 60 },
          { min: 0, max: 9, converted: 40 }
        ]},
        global_competency: { scoringRanges: [
          { min: 10, max: 10, converted: 100 },
          { min: 7, max: 8, converted: 80 },
          { min: 4, max: 6, converted: 60 },
          { min: 0, max: 2, converted: 40 }
        ]},
        knowledge_sharing: { scoringRanges: [
          { min: 15, max: 100, converted: 100 },
          { min: 10, max: 14, converted: 80 },
          { min: 5, max: 9, converted: 60 },
          { min: 1, max: 4, converted: 40 }
        ]},
        innovation_proposal: { scoringRanges: [
          { min: 60, max: 100, converted: 100 },
          { min: 30, max: 59, converted: 80 },
          { min: 5, max: 29, converted: 60 },
          { min: 0, max: 4, converted: 40 }
        ]}
      };
      sourceBlock = defaultsBlock[competencyKey || ''] || null;
      if (!sourceBlock) {
        console.log(`❌ 역량 키 없음: ${category} = ${rawScore}점 (원점수 유지)`);
        return rawScore;
      }
    }

    let scoringRanges = sourceBlock.scoringRanges as any[];
    if (!scoringRanges || scoringRanges.length === 0) {
      // 기본 범위(개요 탭의 초기값과 동일)
      const defaults: Record<string, any[]> = {
        technical_competency: [
          { min: 80, max: 100, converted: 100 },
          { min: 60, max: 79, converted: 80 },
          { min: 40, max: 59, converted: 60 },
          { min: 0, max: 39, converted: 40 }
        ],
        project_experience: [
          { min: 30, max: 100, converted: 100 },
          { min: 20, max: 29, converted: 80 },
          { min: 10, max: 19, converted: 60 },
          { min: 0, max: 9, converted: 40 }
        ],
        rd_achievement: [
          { min: 40, max: 100, converted: 100 },
          { min: 25, max: 39, converted: 80 },
          { min: 10, max: 24, converted: 60 },
          { min: 0, max: 9, converted: 40 }
        ],
        global_competency: [
          { min: 10, max: 10, converted: 100 },
          { min: 7, max: 8, converted: 80 },
          { min: 4, max: 6, converted: 60 },
          { min: 0, max: 2, converted: 40 }
        ],
        knowledge_sharing: [
          { min: 15, max: 100, converted: 100 },
          { min: 10, max: 14, converted: 80 },
          { min: 5, max: 9, converted: 60 },
          { min: 1, max: 4, converted: 40 }
        ],
        innovation_proposal: [
          { min: 60, max: 100, converted: 100 },
          { min: 30, max: 59, converted: 80 },
          { min: 5, max: 29, converted: 60 },
          { min: 0, max: 4, converted: 40 }
        ]
      };
      scoringRanges = defaults[competencyKey] || [];
      if (scoringRanges.length === 0) {
        console.log(`❌ 점수 범위 없음: ${category} = ${rawScore}점 (원점수 유지)`);
        return rawScore;
      }
    }

    console.log(`📊 ${category} 점수 범위:`, scoringRanges);

    // 원점수가 기준 범위를 벗어나는 경우를 대비해 클램프 처리
    const minAllowed = Math.min(...scoringRanges.map((r: any) => r.min));
    const maxAllowed = Math.max(...scoringRanges.map((r: any) => r.max));
    const clampedScore = Math.max(minAllowed, Math.min(rawScore, maxAllowed));
    if (clampedScore !== rawScore) {
      console.log(`🔧 범위 보정: ${category} ${rawScore}점 → ${clampedScore}점 (허용 범위 ${minAllowed}-${maxAllowed})`);
    }

    // 점수 범위에 따라 환산 (보정된 점수 사용)
    for (const range of scoringRanges) {
      if (clampedScore >= range.min && clampedScore <= range.max) {
        console.log(`✅ ${category}: ${clampedScore}점 → ${range.converted}점 (${range.min}-${range.max} 범위)`);
        return range.converted;
      }
    }

    console.log(`⚠️ 범위 매칭 실패: ${category} = ${clampedScore}점 (원점수 유지)`);
    return clampedScore;
  };

  // 로딩 상태 또는 직원 데이터가 없는 경우
  if (employeeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">직원 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (!employee || employee === null || employee === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">직원을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">요청하신 직원 정보가 존재하지 않습니다.</p>
          <Button onClick={() => setLocation('/employees')}>
            직원 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setLocation("/employees")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{employee?.name || '이름 없음'}</h1>
            <p className="text-muted-foreground">{employee?.position || '직급 없음'} • {employee?.department || '부서 없음'}</p>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          정보 수정
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={employee?.photoUrl || undefined} />
              <AvatarFallback className="text-lg">
                {employee?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{employee?.email || '이메일 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{employee?.phone || '전화번호 없음'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">입사일: {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '미정'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">경력: {experience}년</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">종합 능력치: {overallSkill}%</span>
                  </div>
                </div>
              </div>
              
              {/* 학력 정보 */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">학력 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span>최종학력: {employee?.education || '미입력'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span>전공: {employee?.major || '미입력'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span>학교: {employee?.school || '미입력'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>졸업년도: {employee?.graduationYear || '미입력'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Badge variant="secondary">{employee?.department || '부서 없음'}</Badge>
                {employee?.team && <Badge variant="outline">{employee.team}</Badge>}
                <Badge variant="default">{employee?.position || '직급 없음'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs key={employeeId} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="skills">스킬</TabsTrigger>
          <TabsTrigger value="training">교육</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="achievements">성과</TabsTrigger>
          <TabsTrigger value="awards">수상</TabsTrigger>
          <TabsTrigger value="certifications">자격증</TabsTrigger>
          <TabsTrigger value="languages">어학능력</TabsTrigger>
          <TabsTrigger value="proposals">제안제도</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  성과 요약
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>종합 능력치</span>
                  <span className="font-semibold">{overallSkill}%</span>
                </div>
                <Progress value={overallSkill} className="w-full" />
                
                <div className="flex justify-between">
                  <span>완료한 교육</span>
                  <span className="font-semibold">{trainings.filter(t => t.status === 'completed').length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>참여 프로젝트</span>
                  <span className="font-semibold">{projects.length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>특허출원</span>
                  <span className="font-semibold">{patents.length}건</span>
                </div>
                
                <div className="flex justify-between">
                  <span>논문투고</span>
                  <span className="font-semibold">{publications.length}편</span>
                </div>
                
                <div className="flex justify-between">
                  <span>수상이력</span>
                  <span className="font-semibold">{awards.length}건</span>
                </div>
                
                <div className="flex justify-between">
                  <span>자격증</span>
                  <span className="font-semibold">{certifications.length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>어학능력</span>
                  <span className="font-semibold">{languages.length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>제안제도</span>
                  <span className="font-semibold">{proposals.length}건</span>
                </div>
                
                <div className="flex justify-between">
                  <span>보유 스킬</span>
                  <span className="font-semibold">{skills.length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>이전 경력</span>
                  <span className="font-semibold">
                    {employee?.previousExperienceYears && employee.previousExperienceYears > 0 || employee?.previousExperienceMonths && employee.previousExperienceMonths > 0 
                      ? `${employee.previousExperienceYears || 0}년 ${employee.previousExperienceMonths || 0}개월`
                      : '없음'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    R&D 역량평가
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setLocation('/rd-evaluation')}>
                    설정
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* R&D 역량평가 결과 - 간단한 테스트 */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">6대 역량 평가</h4>
                  {rdEvaluationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground text-sm">R&D 역량평가 데이터 로딩 중...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* R&D 역량 레이더차트 */}
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <p className="text-sm font-semibold mb-2 text-center">R&D 역량 레이더차트:</p>
                        <SimpleRadarChart
                          data={[
                            { name: '전문기술', value: convertScore('전문기술', rdEvaluation?.scores?.technicalCompetency || 0) },
                            { name: '프로젝트', value: convertScore('프로젝트', rdEvaluation?.scores?.projectExperience || 0) },
                            { name: '연구성과', value: convertScore('연구성과', rdEvaluation?.scores?.rdAchievement || 0) },
                            { name: '글로벌', value: convertScore('글로벌', rdEvaluation?.scores?.globalCompetency || 0) },
                            { name: '기술확산', value: convertScore('기술확산', rdEvaluation?.scores?.knowledgeSharing || 0) },
                            { name: '혁신제안', value: convertScore('혁신제안', rdEvaluation?.scores?.innovationProposal || 0) }
                          ]}
                          size={280}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">종합 점수</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">
                              {(() => {
                                if (!rdEvaluationCriteria) {
                                  return (rdEvaluation?.totalScore?.toFixed(1) || 0) + '점';
                                }
                                const tc = convertScore('전문기술', rdEvaluation?.scores?.technicalCompetency || 0) / 100 * 25;
                                const pj = convertScore('프로젝트', rdEvaluation?.scores?.projectExperience || 0) / 100 * 20;
                                const rd = convertScore('연구성과', rdEvaluation?.scores?.rdAchievement || 0) / 100 * 25;
                                const gl = convertScore('글로벌', rdEvaluation?.scores?.globalCompetency || 0) / 100 * 10;
                                const ks = convertScore('기술확산', rdEvaluation?.scores?.knowledgeSharing || 0) / 100 * 10;
                                const ip = convertScore('혁신제안', rdEvaluation?.scores?.innovationProposal || 0) / 100 * 10;
                                const total = tc + pj + rd + gl + ks + ip;
                                return total.toFixed(2) + '점';
                              })()}
                            </span>
                            <Badge variant={
                              (() => {
                                if (!rdEvaluationCriteria) {
                                  return rdEvaluation?.grade === 'S' ? 'default' :
                                         rdEvaluation?.grade === 'A' ? 'default' :
                                         rdEvaluation?.grade === 'B' ? 'secondary' :
                                         rdEvaluation?.grade === 'C' ? 'destructive' : 'destructive';
                                }
                                const tc = convertScore('전문기술', rdEvaluation?.scores?.technicalCompetency || 0) / 100 * 25;
                                const pj = convertScore('프로젝트', rdEvaluation?.scores?.projectExperience || 0) / 100 * 20;
                                const rd = convertScore('연구성과', rdEvaluation?.scores?.rdAchievement || 0) / 100 * 25;
                                const gl = convertScore('글로벌', rdEvaluation?.scores?.globalCompetency || 0) / 100 * 10;
                                const ks = convertScore('기술확산', rdEvaluation?.scores?.knowledgeSharing || 0) / 100 * 10;
                                const ip = convertScore('혁신제안', rdEvaluation?.scores?.innovationProposal || 0) / 100 * 10;
                                const total = tc + pj + rd + gl + ks + ip;
                                const grade = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
                                return grade === 'S' ? 'default' : grade === 'A' ? 'default' : grade === 'B' ? 'secondary' : grade === 'C' ? 'destructive' : 'destructive';
                              })()
                            }>
                              {(() => {
                                if (!rdEvaluationCriteria) {
                                  return rdEvaluation?.grade || 'D';
                                }
                                const tc = convertScore('전문기술', rdEvaluation?.scores?.technicalCompetency || 0) / 100 * 25;
                                const pj = convertScore('프로젝트', rdEvaluation?.scores?.projectExperience || 0) / 100 * 20;
                                const rd = convertScore('연구성과', rdEvaluation?.scores?.rdAchievement || 0) / 100 * 25;
                                const gl = convertScore('글로벌', rdEvaluation?.scores?.globalCompetency || 0) / 100 * 10;
                                const ks = convertScore('기술확산', rdEvaluation?.scores?.knowledgeSharing || 0) / 100 * 10;
                                const ip = convertScore('혁신제안', rdEvaluation?.scores?.innovationProposal || 0) / 100 * 10;
                                const total = tc + pj + rd + gl + ks + ip;
                                return total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';
                              })()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>스킬 레벨</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSkillModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  스킬 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
             {skillsLoading ? (
               <p className="text-muted-foreground text-center py-8">스킬 데이터 로딩 중...</p>
             ) : skills.length === 0 ? (
               <p className="text-muted-foreground text-center py-8">등록된 스킬이 없습니다.</p>
             ) : (
               skills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                       <span className="font-medium">{skill.skillName}</span>
                       <Badge variant="outline" className="ml-2">{skill.skillType}</Badge>
                    </div>
                     <span className="text-sm font-semibold">{skill.proficiencyLevel}%</span>
                  </div>
                   <Progress value={skill.proficiencyLevel} className="w-full" />
                </div>
               ))
             )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                교육 이력
              </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsTrainingModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  교육 이력 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingsLoading ? (
                  <p className="text-muted-foreground text-center py-8">교육 데이터 로딩 중...</p>
                ) : trainings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 교육이 없습니다.</p>
                ) : (
                  trainings.map((training, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                        <div className="font-medium">{training.courseName}</div>
                        <div className="text-sm text-muted-foreground">{training.completionDate || training.startDate}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {training.score && (
                        <div className="text-sm">
                          <span className="font-semibold">{training.score}점</span>
                        </div>
                      )}
                      <Badge 
                          variant={training.status === 'completed' ? 'default' : 
                                  training.status === 'ongoing' ? 'secondary' : 'outline'}
                      >
                          {training.status === 'completed' ? '완료' : training.status === 'ongoing' ? '진행중' : '예정'}
                      </Badge>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>프로젝트 참여 이력</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  프로젝트 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projectsLoading ? (
                  <p className="text-muted-foreground text-center py-8">프로젝트 데이터 로딩 중...</p>
                ) : projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 프로젝트가 없습니다.</p>
                ) : (
                  projects.map((project, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                          <div className="font-medium">{project.projectName}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                            역할: {project.role} • 기간: {project.startDate} ~ {project.endDate || '진행중'}
                          </div>
                        </div>
                        <Badge 
                          variant={project.status === 'completed' ? 'default' : 
                                  project.status === 'active' ? 'secondary' : 'outline'}
                        >
                          {project.status === 'completed' ? '완료' : project.status === 'active' ? '진행중' : '예정'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAchievementsModalOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              성과 수정
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 특허출원 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  특허출원
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievementsLoading ? (
                    <p className="text-muted-foreground text-center py-4">특허 데이터 로딩 중...</p>
                  ) : patents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">등록된 특허가 없습니다.</p>
                  ) : (
                    patents.map((patent, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{patent.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                              {patent.applicationNumber && `출원번호: ${patent.applicationNumber}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                              {patent.applicationDate && `출원일: ${patent.applicationDate}`}
                            </div>
                          </div>
                          <Badge 
                            variant={patent.status === 'granted' ? 'default' : 
                                    patent.status === 'pending' ? 'secondary' : 'outline'}
                          >
                            {patent.status === 'granted' ? '등록' : patent.status === 'pending' ? '출원' : '기타'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 논문투고 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  논문투고
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievementsLoading ? (
                    <p className="text-muted-foreground text-center py-4">논문 데이터 로딩 중...</p>
                  ) : publications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">등록된 논문이 없습니다.</p>
                  ) : (
                    publications.map((publication, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{publication.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                              {publication.authors && `저자: ${publication.authors}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {publication.journal || publication.conference}
                          </div>
                            <div className="text-sm text-muted-foreground">
                              {publication.publicationDate && `발행일: ${publication.publicationDate}`}
                            </div>
                        </div>
                        <Badge 
                            variant={publication.type === 'journal' ? 'default' : 'secondary'}
                        >
                            {publication.type === 'journal' ? '저널' : '학회'}
                        </Badge>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                수상이력
              </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAwardsModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  수상 이력 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {awardsLoading ? (
                  <p className="text-muted-foreground text-center py-8">수상 데이터 로딩 중...</p>
                ) : awards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 수상이 없습니다.</p>
                ) : (
                  awards.map((award, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                          <div className="font-medium">{award.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                            수여기관: {award.issuer}
                        </div>
                          <div className="text-sm text-muted-foreground">
                            수상일: {award.awardDate}
                          </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant="outline">{award.category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  자격증 보유 현황
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCertificationModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  자격증 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certificationsLoading ? (
                  <p className="text-muted-foreground text-center py-8">자격증 데이터 로딩 중...</p>
                ) : certifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 자격증이 없습니다.</p>
                ) : (
                  certifications.map((cert, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{cert.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            발급기관: {cert.issuer}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            발급일: {cert.issueDate}
                          </div>
                          {cert.expiryDate && (
                            <div className="text-sm text-muted-foreground">
                              만료일: {cert.expiryDate}
                            </div>
                          )}
                          {cert.score && (
                            <div className="text-sm text-muted-foreground">
                              점수: {cert.score}점
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={cert.status === 'active' ? 'default' : 'secondary'}
                          >
                            {cert.status === 'active' ? '유효' : '만료'}
                          </Badge>
                          <Badge variant="outline">{cert.category}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  어학능력 현황
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLanguageModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  어학능력 수정
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {languagesLoading ? (
                  <p className="text-muted-foreground text-center py-8">어학능력 데이터 로딩 중...</p>
                ) : languages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 어학능력이 없습니다.</p>
                ) : (
                  languages.map((lang, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{lang.language}</div>
                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>말하기: {lang.speaking}</div>
                              <div>읽기: {lang.reading}</div>
                              <div>쓰기: {lang.writing}</div>
                              <div>듣기: {lang.listening}</div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            종합 수준: {lang.overallLevel}
                          </div>
                          {lang.certification && (
                            <div className="text-sm text-muted-foreground">
                              자격증: {lang.certification}
                            </div>
                          )}
                          {lang.score && (
                            <div className="text-sm text-muted-foreground">
                              점수: {lang.score}점
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="default">{lang.overallLevel}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  제안제도 현황
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsProposalModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  제안 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposalsLoading ? (
                  <p className="text-muted-foreground text-center py-8">제안제도 데이터 로딩 중...</p>
                ) : proposals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 제안이 없습니다.</p>
                ) : (
                  proposals.map((proposal, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{proposal.title}</div>
                          <div className="text-sm text-muted-foreground mt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>카테고리: {proposal.category}</div>
                              <div>제출일: {proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : '날짜 없음'}</div>
                              <div>상태: {proposal.status}</div>
                              <div>영향도: {proposal.impactLevel}</div>
                            </div>
                          </div>
                          {proposal.description && (
                            <div className="text-sm text-muted-foreground mt-2">
                              내용: {proposal.description}
                            </div>
                          )}
                          {proposal.adoptionDate && (
                            <div className="text-sm text-muted-foreground mt-2">
                              채택일: {proposal.adoptionDate.toLocaleDateString()}
                            </div>
                          )}
                          {proposal.rewardAmount && proposal.rewardAmount > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              포상금액: {proposal.rewardAmount.toLocaleString()}원
                            </div>
                          )}
                          {proposal.notes && (
                            <div className="text-sm text-muted-foreground mt-2">
                              비고: {proposal.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <Badge 
                            variant={
                              proposal.status === 'approved' ? 'default' :
                              proposal.status === 'implemented' ? 'default' :
                              proposal.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {proposal.status === 'submitted' ? '제출' :
                             proposal.status === 'under_review' ? '검토중' :
                             proposal.status === 'approved' ? '승인' :
                             proposal.status === 'rejected' ? '반려' :
                             proposal.status === 'implemented' ? '구현완료' : proposal.status}
                          </Badge>
                          {proposal.impactLevel && (
                            <Badge variant="outline">
                              {proposal.impactLevel === 'high' ? '높음' :
                               proposal.impactLevel === 'medium' ? '보통' :
                               proposal.impactLevel === 'low' ? '낮음' : proposal.impactLevel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      
      {/* Employee Edit Modal */}
      <EmployeeEditModal
        employee={employee}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Skill Edit Modal */}
      <SkillEditModal
        employeeId={employeeId}
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false);
          // 스킬 데이터 다시 로드
          const loadSkills = async () => {
            try {
              const response = await fetch(`/api/skills?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setSkills(data);
              }
            } catch (error) {
              console.error('스킬 데이터 재로드 오류:', error);
            }
          };
          loadSkills();
        }}
      />

      {/* Training Edit Modal */}
      <TrainingEditModal
        employeeId={employeeId}
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          // 교육 데이터 다시 로드
          const loadTrainings = async () => {
            try {
              const response = await fetch(`/api/training-history?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setTrainings(data);
              }
            } catch (error) {
              console.error('교육 데이터 재로드 오류:', error);
            }
          };
          loadTrainings();
        }}
      />

      {/* Project Edit Modal */}
      <ProjectEditModal
        employeeId={employeeId}
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          // 프로젝트 데이터 다시 로드
          const loadProjects = async () => {
            try {
              const response = await fetch(`/api/projects?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setProjects(data);
              }
            } catch (error) {
              console.error('프로젝트 데이터 재로드 오류:', error);
            }
          };
          loadProjects();
        }}
      />

      {/* Achievements Edit Modal */}
      <AchievementsEditModal
        employeeId={employeeId}
        isOpen={isAchievementsModalOpen}
        onClose={() => {
          setIsAchievementsModalOpen(false);
          // 성과 데이터 다시 로드
          const loadAchievements = async () => {
            try {
              const [patentsResponse, publicationsResponse] = await Promise.all([
                fetch(`/api/patents?employeeId=${employeeId}`),
                fetch(`/api/publications?employeeId=${employeeId}`)
              ]);

              if (patentsResponse.ok) {
                const patentsData = await patentsResponse.json();
                setPatents(patentsData);
              }

              if (publicationsResponse.ok) {
                const publicationsData = await publicationsResponse.json();
                setPublications(publicationsData);
              }
            } catch (error) {
              console.error('성과 데이터 재로드 오류:', error);
            }
          };
          loadAchievements();
        }}
      />

      {/* Awards Edit Modal */}
      <AwardsEditModal
        employeeId={employeeId}
        isOpen={isAwardsModalOpen}
        onClose={() => {
          setIsAwardsModalOpen(false);
          // 수상 데이터 다시 로드
          const loadAwards = async () => {
            try {
              const response = await fetch(`/api/awards?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setAwards(data);
              }
            } catch (error) {
              console.error('수상 데이터 재로드 오류:', error);
            }
          };
          loadAwards();
        }}
      />

      {/* Certification Edit Modal */}
      <CertificationEditModal
        employeeId={employeeId}
        isOpen={isCertificationModalOpen}
        onClose={() => {
          setIsCertificationModalOpen(false);
          // 자격증 데이터 다시 로드
          const loadCertifications = async () => {
            try {
              const response = await fetch(`/api/certifications?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setCertifications(data);
              }
            } catch (error) {
              console.error('자격증 데이터 재로드 오류:', error);
            }
          };
          loadCertifications();
        }}
      />

      {/* Language Edit Modal */}
      <LanguageEditModal
        employeeId={employeeId}
        isOpen={isLanguageModalOpen}
        onClose={() => {
          setIsLanguageModalOpen(false);
          // 어학능력 데이터 다시 로드
          const loadLanguages = async () => {
            try {
              const response = await fetch(`/api/language-skills?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setLanguages(data);
              }
            } catch (error) {
              console.error('어학능력 데이터 재로드 오류:', error);
            }
          };
          loadLanguages();
        }}
      />

      {/* Proposal Edit Modal */}
      <ProposalEditModal
        employeeId={employeeId}
        isOpen={isProposalModalOpen}
        onClose={() => {
          setIsProposalModalOpen(false);
          // 제안제도 데이터 다시 로드
          const loadProposals = async () => {
            try {
              const response = await fetch(`/api/proposals?employeeId=${employeeId}`);
              if (response.ok) {
                const data = await response.json();
                setProposals(data);
              }
            } catch (error) {
              console.error('제안제도 데이터 재로드 오류:', error);
            }
          };
          loadProposals();
        }}
        onSave={async (data) => {
          try {
            console.log('🔧 제안제도 저장 요청 데이터:', data);
            const response = await fetch('/api/proposals', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });

            console.log('🔧 제안제도 저장 응답 상태:', response.status);
            console.log('🔧 제안제도 저장 응답 헤더:', response.headers);

            if (response.ok) {
              const result = await response.json();
              console.log('✅ 제안제도 저장 성공:', result);
              
              // 제안제도 데이터 새로고침
              const loadProposals = async () => {
                try {
                  const response = await fetch(`/api/proposals?employeeId=${employeeId}`);
                  if (response.ok) {
                    const data = await response.json();
                    setProposals(data);
                  }
                } catch (error) {
                  console.error('제안제도 데이터 로드 오류:', error);
                }
              };
              loadProposals();
            } else {
              const errorData = await response.json();
              console.error('❌ 제안제도 저장 실패:', response.status, errorData);
              throw new Error(`제안제도 저장 실패: ${response.status}`);
            }
          } catch (error) {
            console.error('❌ 제안제도 저장 오류:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}