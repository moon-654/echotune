import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Clock, Award } from "lucide-react";
import SkillRadarChart from "@/components/charts/radar-chart";

interface DashboardStats {
  totalEmployees: number;
  completionRate: number;
  trainingHours: number;
  certifiedEmployees: number;
}

interface TopPerformer {
  id: string;
  name: string;
  department: string;
  score: number;
}

interface DepartmentSkills {
  department: string;
  employeeCount: number;
  averageSkills: {
    overall: number;
    experience: number;
    certification: number;
    language: number;
    training: number;
    technical: number;
    softSkill: number;
  };
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats']
  });

  const { data: topPerformers, isLoading: performersLoading } = useQuery<TopPerformer[]>({
    queryKey: ['/api/dashboard/top-performers']
  });

  const { data: departmentSkills, isLoading: skillsLoading } = useQuery<DepartmentSkills[]>({
    queryKey: ['/api/dashboard/department-skills']
  });

  if (statsLoading || performersLoading || skillsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="stats-total-employees">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 직원수</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalEmployees || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-completion-rate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">필수교육 이수율</p>
                <p className="text-3xl font-bold text-green-600">{stats?.completionRate.toFixed(1) || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats?.completionRate || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-training-hours">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">이번 달 교육시간</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.trainingHours || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stats-certified-employees">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">자격증 보유자</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.certifiedEmployees || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600">
                {stats && stats.totalEmployees > 0 
                  ? ((stats.certifiedEmployees / stats.totalEmployees) * 100).toFixed(1)
                  : 0}%
              </span>
              <span className="text-sm text-muted-foreground ml-1">전체 비율</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Skills Radar Chart */}
        <Card data-testid="department-skills-chart">
          <CardHeader>
            <CardTitle>부서별 능력치 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {departmentSkills && (
                <SkillRadarChart 
                  data={departmentSkills} 
                  dataKey="averageSkills"
                  nameKey="department"
                />
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>우수 (80% 이상)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>보통 (60-79%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>개선필요 (40-59%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span>미달 (40% 미만)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card data-testid="top-performers">
          <CardHeader>
            <CardTitle>상위 직원 랭킹</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers?.slice(0, 5).map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{performer.score}</p>
                    <p className="text-xs text-muted-foreground">종합점수</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity would go here - for now just a placeholder */}
      <Card data-testid="recent-activity">
        <CardHeader>
          <CardTitle>최근 교육 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>실시간 교육 활동 데이터를 불러오는 중...</p>
            <p className="text-sm">Google Sheets 연동이 완료되면 표시됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
