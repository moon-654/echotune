import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, Users, Award, BookOpen, TrendingUp, FileText, Trophy, Lightbulb } from "lucide-react";
import type { Employee, Patent, Publication, Award as AwardType, Project } from "@shared/schema";

export default function EmployeeDetail() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // URL에서 직원 ID 가져오기 (/employees/emp1 -> emp1)
  const employeeId = location.split('/').pop() || "emp1";

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: [`/api/employees/${employeeId}`]
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">직원을 찾을 수 없습니다</h2>
          <Button onClick={() => setLocation("/employees")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            직원 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // Mock 데이터 (실제로는 API에서 가져옴)
  const mockSkills = [
    { name: "JavaScript", level: 85, category: "프론트엔드" },
    { name: "React", level: 90, category: "프론트엔드" },
    { name: "Node.js", level: 75, category: "백엔드" },
    { name: "TypeScript", level: 80, category: "프론트엔드" },
    { name: "Python", level: 65, category: "백엔드" },
    { name: "SQL", level: 70, category: "데이터베이스" }
  ];

  const mockTrainings = [
    { name: "React 고급 패턴", date: "2024-01-15", status: "완료", score: 95 },
    { name: "TypeScript 마스터", date: "2024-02-20", status: "완료", score: 88 },
    { name: "Node.js 심화", date: "2024-03-10", status: "진행중", score: null },
    { name: "AWS 클라우드", date: "2024-04-05", status: "예정", score: null }
  ];

  const mockProjects = [
    { name: "EchoTune 시스템 개발", role: "프론트엔드 리드", status: "완료", period: "2024-01 ~ 2024-03" },
    { name: "사용자 대시보드 개선", role: "개발자", status: "진행중", period: "2024-03 ~ 현재" }
  ];

  // Mock 성과 데이터
  const mockPatents = [
    { title: "AI 기반 음성 인식 시스템", status: "출원", applicationDate: "2024-01-15", applicationNumber: "10-2024-0001234" },
    { title: "실시간 데이터 처리 방법", status: "등록", applicationDate: "2023-06-20", grantDate: "2024-02-10", patentNumber: "10-2024-0012345" }
  ];

  const mockPublications = [
    { title: "Deep Learning을 활용한 음성 인식 정확도 향상", authors: "김철수, 박영희", journal: "한국정보과학회논문지", status: "게재", publicationDate: "2024-03-15", impactFactor: 2.5 },
    { title: "Real-time Data Processing in IoT Environments", authors: "Kim, C.S., Park, Y.H.", conference: "IEEE International Conference", status: "발표", publicationDate: "2024-01-20" }
  ];

  const mockAwards = [
    { awardName: "우수 연구자상", awardingOrganization: "한국과학기술원", category: "연구", level: "국가", awardDate: "2024-02-15", monetaryValue: 5000000 },
    { awardName: "혁신 아이디어상", awardingOrganization: "회사", category: "혁신", level: "회사", awardDate: "2023-12-20", monetaryValue: 1000000 }
  ];

  const overallSkill = Math.floor(mockSkills.reduce((sum, skill) => sum + skill.level, 0) / mockSkills.length);
  const experience = employee.hireDate 
    ? Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/employees")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          정보 수정
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={employee.photoUrl} />
              <AvatarFallback className="text-lg">
                {employee.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{employee.email || '이메일 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{employee.phone || '전화번호 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">입사일: {employee.hireDate 
                      ? new Date(employee.hireDate).toLocaleDateString('ko-KR')
                      : '정보 없음'
                    }</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 mr-2 text-xs text-muted-foreground">#</span>
                    <span className="text-sm">사원번호: {employee.employeeNumber || employee.id}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">팀: {employee.team || '팀 정보 없음'}</span>
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
              
              <div className="flex space-x-2">
                <Badge variant="secondary">{employee.department}</Badge>
                {employee.team && <Badge variant="outline">{employee.team}</Badge>}
                <Badge variant="default">{employee.position}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="skills">스킬</TabsTrigger>
          <TabsTrigger value="training">교육</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
          <TabsTrigger value="achievements">성과</TabsTrigger>
          <TabsTrigger value="awards">수상</TabsTrigger>
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
                  <span className="font-semibold">{mockTrainings.filter(t => t.status === '완료').length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>참여 프로젝트</span>
                  <span className="font-semibold">{mockProjects.length}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span>특허출원</span>
                  <span className="font-semibold">{mockPatents.length}건</span>
                </div>
                
                <div className="flex justify-between">
                  <span>논문투고</span>
                  <span className="font-semibold">{mockPublications.length}편</span>
                </div>
                
                <div className="flex justify-between">
                  <span>수상이력</span>
                  <span className="font-semibold">{mockAwards.length}건</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>최근 활동</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">React 고급 패턴 교육 완료</div>
                  <div className="text-muted-foreground">2024-01-15 • 점수: 95점</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">사용자 대시보드 개선 프로젝트 참여</div>
                  <div className="text-muted-foreground">2024-03-01 ~ 현재</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">팀 변경: 개발팀으로 이동</div>
                  <div className="text-muted-foreground">2024-02-20</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>스킬 레벨</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSkills.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="outline" className="ml-2">{skill.category}</Badge>
                    </div>
                    <span className="text-sm font-semibold">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                교육 이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTrainings.map((training, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{training.name}</div>
                      <div className="text-sm text-muted-foreground">{training.date}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {training.score && (
                        <div className="text-sm">
                          <span className="font-semibold">{training.score}점</span>
                        </div>
                      )}
                      <Badge 
                        variant={training.status === '완료' ? 'default' : 
                                training.status === '진행중' ? 'secondary' : 'outline'}
                      >
                        {training.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 참여 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.map((project, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          역할: {project.role} • 기간: {project.period}
                        </div>
                      </div>
                      <Badge 
                        variant={project.status === '완료' ? 'default' : 
                                project.status === '진행중' ? 'secondary' : 'outline'}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
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
                  {mockPatents.map((patent, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{patent.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            출원번호: {patent.applicationNumber || patent.patentNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            출원일: {patent.applicationDate}
                          </div>
                        </div>
                        <Badge 
                          variant={patent.status === '등록' ? 'default' : 
                                  patent.status === '출원' ? 'secondary' : 'outline'}
                        >
                          {patent.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                  {mockPublications.map((publication, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{publication.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            저자: {publication.authors}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {publication.journal || publication.conference}
                          </div>
                          {publication.impactFactor && (
                            <div className="text-sm text-muted-foreground">
                              Impact Factor: {publication.impactFactor}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={publication.status === '게재' ? 'default' : 
                                  publication.status === '발표' ? 'secondary' : 'outline'}
                        >
                          {publication.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                수상이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAwards.map((award, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{award.awardName}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          수여기관: {award.awardingOrganization}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          수상일: {award.awardDate}
                        </div>
                        {award.monetaryValue && (
                          <div className="text-sm text-muted-foreground">
                            상금: {award.monetaryValue.toLocaleString()}원
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge variant="outline">{award.category}</Badge>
                        <Badge 
                          variant={award.level === '국가' ? 'default' : 
                                  award.level === '회사' ? 'secondary' : 'outline'}
                        >
                          {award.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
