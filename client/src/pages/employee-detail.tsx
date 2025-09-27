import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Users, Award, BookOpen, TrendingUp, FileText, Trophy, Lightbulb, GraduationCap, Building } from "lucide-react";
import EmployeeEditModal from "@/components/employees/employee-edit-modal";
import SkillEditModal from "@/components/employees/skill-edit-modal";
import TrainingEditModal from "@/components/employees/training-edit-modal";
import ProjectEditModal from "@/components/employees/project-edit-modal";
import AchievementsEditModal from "@/components/employees/achievements-edit-modal";
import AwardsEditModal from "@/components/employees/awards-edit-modal";
import CertificationEditModal from "@/components/employees/certification-edit-modal";
import LanguageEditModal from "@/components/employees/language-edit-modal";
import type { Employee, Patent, Publication, Award as AwardType, Project } from "@shared/schema";

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

  // props로 받은 employeeId가 있으면 사용, 없으면 URL에서 가져오기
  const employeeId = propEmployeeId || location.split('/').pop() || "emp1";

  // 실제 직원 데이터 상태 관리
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);

  // 실제 스킬 데이터 상태 관리
  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // 직원 데이터 로드
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        console.log('🔍 직원 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/employees/${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 직원 데이터 로드 성공:', data);
          setEmployee(data);
        } else {
          console.log('🔍 직원 데이터 없음');
          setEmployee(null);
        }
      } catch (error) {
        console.error('🔍 직원 데이터 로드 오류:', error);
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
        console.log('🔍 스킬 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 스킬 데이터 로드 성공:', data);
          setSkills(data);
        } else {
          console.log('🔍 스킬 데이터 없음');
          setSkills([]);
        }
      } catch (error) {
        console.error('🔍 스킬 데이터 로드 오류:', error);
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
  const [trainings, setTrainings] = useState([]);
  const [trainingsLoading, setTrainingsLoading] = useState(true);

  // 교육 데이터 로드
  useEffect(() => {
    const loadTrainings = async () => {
      try {
        console.log('🔍 교육 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/training-history?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 교육 데이터 로드 성공:', data);
          setTrainings(data);
        } else {
          console.log('🔍 교육 데이터 없음');
          setTrainings([]);
        }
      } catch (error) {
        console.error('🔍 교육 데이터 로드 오류:', error);
        setTrainings([]);
      } finally {
        setTrainingsLoading(false);
      }
    };

    if (employeeId) {
      loadTrainings();
    }
  }, [employeeId]);

  // 실제 프로젝트 데이터 상태 관리
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('🔍 프로젝트 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/projects?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 프로젝트 데이터 로드 성공:', data);
          setProjects(data);
        } else {
          console.log('🔍 프로젝트 데이터 없음');
          setProjects([]);
        }
      } catch (error) {
        console.error('🔍 프로젝트 데이터 로드 오류:', error);
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
  const [patents, setPatents] = useState([]);
  const [publications, setPublications] = useState([]);
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
  const [awards, setAwards] = useState([]);
  const [awardsLoading, setAwardsLoading] = useState(true);

  // 실제 자격증 데이터 상태 관리
  const [certifications, setCertifications] = useState([]);
  const [certificationsLoading, setCertificationsLoading] = useState(true);

  // 실제 어학능력 데이터 상태 관리
  const [languages, setLanguages] = useState([]);
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
              <AvatarImage src={employee?.photoUrl} />
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
                    <span className="text-sm">입사일: {employee?.hireDate || '미정'}</span>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="skills">스킬</TabsTrigger>
          <TabsTrigger value="training">교육</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="achievements">성과</TabsTrigger>
          <TabsTrigger value="awards">수상</TabsTrigger>
          <TabsTrigger value="certifications">자격증</TabsTrigger>
          <TabsTrigger value="languages">어학능력</TabsTrigger>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  조직 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>부서</span>
                  <span className="font-semibold">{employee?.department || '부서 없음'}</span>
                </div>
                <div className="flex justify-between">
                  <span>팀</span>
                  <span className="font-semibold">{employee?.team || '팀 없음'}</span>
                </div>
                <div className="flex justify-between">
                  <span>직책</span>
                  <span className="font-semibold">{employee?.position || '직급 없음'}</span>
                </div>
                <div className="flex justify-between">
                  <span>상태</span>
                  <span className="font-semibold">{employee.isActive ? '활성' : '비활성'}</span>
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
    </div>
  );
}