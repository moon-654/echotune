import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Settings, 
  Plus,
  Edit,
  Eye,
  Download,
  Filter
} from "lucide-react";
import RdRadarChart from "@/components/charts/rd-radar-chart";
import RdEvaluationModal from "@/components/rd-evaluation/rd-evaluation-modal";
import RdEvaluationDetailModal from "@/components/rd-evaluation/rd-evaluation-detail-modal";
import RdEvaluationCriteriaModal from "@/components/rd-evaluation/rd-evaluation-criteria-modal";

interface RdEvaluationData {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  evaluationYear: number;
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
  rank: number;
  status: string;
  evaluationDate: string;
}

interface RdEvaluationStats {
  totalEvaluations: number;
  averageScore: number;
  gradeDistribution: {
    S: number;
    A: number;
    B: number;
    C: number;
    D: number;
  };
  departmentStats: Array<{
    department: string;
    averageScore: number;
    employeeCount: number;
  }>;
  topPerformers: Array<{
    employeeId: string;
    name: string;
    score: number;
    rank: number;
  }>;
}

export default function RdEvaluation() {
  const [activeTab, setActiveTab] = useState("overview");
  const [evaluations, setEvaluations] = useState<RdEvaluationData[]>([]);
  const [stats, setStats] = useState<RdEvaluationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [criteria, setCriteria] = useState<any>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  
  // 모달 상태
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<RdEvaluationData | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadEvaluations();
    loadStats();
  }, [selectedYear]);

  // 평가 기준 로드
  useEffect(() => {
    const loadCriteria = async () => {
      try {
        const response = await fetch('/api/rd-evaluations/criteria');
        const data = await response.json();
        setCriteria(data.rdEvaluationCriteria);
        console.log('✅ 평가 기준 로드 완료:', data.rdEvaluationCriteria);
      } catch (error) {
        console.error('❌ 평가 기준 로드 실패:', error);
      } finally {
        setCriteriaLoading(false);
      }
    };
    
    loadCriteria();
  }, []);

  const loadEvaluations = async () => {
    try {
      const response = await fetch(`/api/rd-evaluations?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data);
      }
    } catch (error) {
      console.error('평가 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/rd-evaluations/stats?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('통계 데이터 로드 오류:', error);
    }
  };

  const handleEvaluationClick = (evaluation: RdEvaluationData) => {
    setSelectedEvaluation(evaluation);
    setIsDetailModalOpen(true);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-purple-100 text-purple-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">연구원 역량평가</h1>
          <p className="text-muted-foreground">R&D 6대 핵심 역량 평가 및 관리</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsCriteriaModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            평가 기준 설정
          </Button>
          <Button onClick={() => setIsEvaluationModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            평가 등록
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="evaluations">평가 목록</TabsTrigger>
          <TabsTrigger value="analytics">분석</TabsTrigger>
          <TabsTrigger value="comparison">비교</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 평가 수</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEvaluations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedYear}년 기준
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageScore?.toFixed(1) || 0}점
                </div>
                <p className="text-xs text-muted-foreground">
                  전체 평균
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">최고 등급</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.gradeDistribution?.S || 0}명
                </div>
                <p className="text-xs text-muted-foreground">
                  S등급 연구원
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">부서 수</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.departmentStats?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  참여 부서
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 등급 분포 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>등급 분포</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.gradeDistribution && Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getGradeColor(grade)}>{grade}등급</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}명</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / stats.totalEvaluations) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>부서별 평균 점수</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats?.departmentStats?.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{dept.department}</span>
                      <span className="font-medium">{dept.averageScore.toFixed(1)}점</span>
                    </div>
                    <Progress value={dept.averageScore} className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      {dept.employeeCount}명 참여
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>평가 목록</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">등록된 평가가 없습니다.</p>
                  </div>
                ) : (
                  evaluations.map((evaluation) => (
                    <div 
                      key={evaluation.id} 
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleEvaluationClick(evaluation)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium">{evaluation.employeeName}</h3>
                              <p className="text-sm text-muted-foreground">{evaluation.department}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getGradeColor(evaluation.grade)}>
                                {evaluation.grade}등급
                              </Badge>
                              <Badge className={getStatusColor(evaluation.status)}>
                                {evaluation.status === 'approved' ? '승인' : 
                                 evaluation.status === 'submitted' ? '제출' :
                                 evaluation.status === 'draft' ? '임시저장' : '반려'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{evaluation.totalScore.toFixed(1)}점</div>
                          <p className="text-sm text-muted-foreground">
                            {evaluation.evaluationDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>역량별 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {!criteriaLoading && criteria ? (
                  <RdRadarChart 
                    data={evaluations.map(evaluation => ({
                      employee: {
                        id: evaluation.employeeId,
                        name: evaluation.employeeName,
                        department: evaluation.department
                      },
                      scores: evaluation.scores,
                      totalScore: evaluation.totalScore
                    }))}
                    height={400}
                    criteria={criteria}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">평가 기준 로딩 중...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>연구원 비교</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {!criteriaLoading && criteria ? (
                  <RdRadarChart 
                    data={evaluations.slice(0, 5).map(evaluation => ({
                      employee: {
                        id: evaluation.employeeId,
                        name: evaluation.employeeName,
                        department: evaluation.department
                      },
                      scores: evaluation.scores,
                      totalScore: evaluation.totalScore
                    }))}
                    height={400}
                    criteria={criteria}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">평가 기준 로딩 중...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RdEvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        onSuccess={() => {
          loadEvaluations();
          loadStats();
        }}
      />

      <RdEvaluationDetailModal
        evaluation={selectedEvaluation}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEvaluation(null);
        }}
        onSuccess={() => {
          loadEvaluations();
          loadStats();
        }}
      />

      <RdEvaluationCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
      />
    </div>
  );
}
