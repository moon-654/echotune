import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileText, BarChart3, PieChart, Users, Award, Globe } from "lucide-react";
import SkillRadarChart from "@/components/charts/radar-chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

interface DepartmentRatio {
  department: string;
  count: number;
  percentage: number;
}

interface DepartmentRatiosResponse {
  totalEmployees: number;
  departments: DepartmentRatio[];
}

interface CertificationStats {
  name: string;
  count: number;
  percentage: number;
}

interface LanguageStats {
  language: string;
  total: number;
  levels: { [key: string]: number };
}

export default function Reports() {
  const [reportType, setReportType] = useState("");
  const [period, setPeriod] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Define colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const { data: departmentSkills, isLoading } = useQuery<DepartmentSkills[]>({
    queryKey: ['/api/dashboard/department-skills']
  });

  const { data: departmentRatios, isLoading: isLoadingRatios } = useQuery<DepartmentRatiosResponse>({
    queryKey: ['/api/dashboard/department-ratios']
  });

  const { data: certificationStats, isLoading: isLoadingCertifications } = useQuery<CertificationStats[]>({
    queryKey: ['/api/reports/certifications']
  });

  const { data: languageStats, isLoading: isLoadingLanguages } = useQuery<LanguageStats[]>({
    queryKey: ['/api/reports/language-skills']
  });

  if (isLoading || isLoadingRatios || isLoadingCertifications || isLoadingLanguages) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">보고서 및 분석</h1>
          <p className="text-muted-foreground">교육 및 능력치 현황 분석</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-generate-report">
            <FileText className="w-4 h-4 mr-2" />
            보고서 생성
          </Button>
          <Button data-testid="button-export-data">
            <Download className="w-4 h-4 mr-2" />
            데이터 내보내기
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger data-testid="select-report-type">
                <SelectValue placeholder="보고서 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">부서별 분석</SelectItem>
                <SelectItem value="individual">개인별 분석</SelectItem>
                <SelectItem value="training">교육별 분석</SelectItem>
                <SelectItem value="skill">능력치 분석</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger data-testid="select-period">
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">이번 달</SelectItem>
                <SelectItem value="quarter">이번 분기</SelectItem>
                <SelectItem value="year">올해</SelectItem>
                <SelectItem value="custom">사용자 지정</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger data-testid="select-department">
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 부서</SelectItem>
                <SelectItem value="hr">인사팀</SelectItem>
                <SelectItem value="it">IT팀</SelectItem>
                <SelectItem value="sales">영업팀</SelectItem>
                <SelectItem value="marketing">마케팅팀</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="시작일"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />

            <Input
              type="date"
              placeholder="종료일"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="input-end-date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Skills Distribution */}
        <Card data-testid="chart-skill-distribution">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              부서별 능력 분포도
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {departmentSkills && (
                <SkillRadarChart 
                  data={departmentSkills} 
                  dataKey="averageSkills"
                  nameKey="department"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Ratios Chart */}
        <Card data-testid="chart-department-ratios">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              부서별 인원 비율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {departmentRatios && departmentRatios.departments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={departmentRatios.departments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="department"
                    >
                      {departmentRatios.departments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value}명 (${departmentRatios.departments.find(d => d.department === name)?.percentage || 0}%)`,
                        '인원수'
                      ]}
                      labelFormatter={(label: string) => `부서: ${label}`}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : departmentRatios && departmentRatios.departments.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>표시할 부서 데이터가 없습니다</p>
                    <p className="text-sm">직원이 등록되면 부서별 비율이 표시됩니다</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>부서별 비율 데이터 로딩 중...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certification Overview */}
        <Card data-testid="chart-certification-overview">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              자격증 보유 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {certificationStats && certificationStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={certificationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value}명 (${certificationStats.find(c => c.name === name)?.percentage.toFixed(1)}%)`,
                        '보유자 수'
                      ]}
                      labelFormatter={(label: string) => `자격증: ${label}`}
                    />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : certificationStats && certificationStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>등록된 자격증이 없습니다</p>
                    <p className="text-sm">직원들이 자격증을 등록하면 현황이 표시됩니다</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>자격증 현황 분석 중...</p>
                    <p className="text-sm">데이터 집계 중입니다</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language Proficiency */}
        <Card data-testid="chart-language-proficiency">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              어학능력 수준별 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {languageStats && languageStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={languageStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="language" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value}명`,
                        '보유자 수'
                      ]}
                      labelFormatter={(label: string) => `언어: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#8884d8" name="총 보유자" />
                  </BarChart>
                </ResponsiveContainer>
              ) : languageStats && languageStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>등록된 어학능력이 없습니다</p>
                    <p className="text-sm">직원들이 어학능력을 등록하면 현황이 표시됩니다</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>어학능력 분석 중...</p>
                    <p className="text-sm">언어별 분포 계산 중입니다</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
      <Card data-testid="analytics-table">
        <CardHeader>
          <CardTitle>상세 분석 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">부서</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">직원수</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">평균 능력치</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">교육 완료율</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">자격증 보유율</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">추천사항</th>
                </tr>
              </thead>
              <tbody>
                {departmentSkills?.map((dept) => (
                  <tr key={dept.department} className="border-b border-border">
                    <td className="py-4 px-6 font-medium">{dept.department}</td>
                    <td className="py-4 px-6">{dept.employeeCount}명</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          dept.averageSkills.overall >= 80 ? 'text-green-600' :
                          dept.averageSkills.overall >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {dept.averageSkills.overall.toFixed(1)}
                        </span>
                        <div className={`w-2 h-2 rounded-full ml-2 ${
                          dept.averageSkills.overall >= 80 ? 'bg-green-500' :
                          dept.averageSkills.overall >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                      </div>
                    </td>
                    <td className="py-4 px-6">-</td>
                    <td className="py-4 px-6">-</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        dept.averageSkills.overall >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : dept.averageSkills.overall >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {dept.averageSkills.overall >= 80 ? '우수' : 
                         dept.averageSkills.overall >= 60 ? '보통' : '개선필요'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
