import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit, FileText, Award, Clock, Globe } from "lucide-react";
import SkillRadarChart from "@/components/charts/radar-chart";

interface EmployeePanelProps {
  employeeId: string;
  onClose: () => void;
}

interface EmployeeProfile {
  employee: {
    id: string;
    name: string;
    position: string;
    department: string;
    email: string;
    phone: string;
    hireDate: string;
  };
  trainingHistory: Array<{
    id: string;
    courseName: string;
    provider: string;
    completionDate: string;
    status: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
  }>;
  languages: Array<{
    id: string;
    language: string;
    proficiencyLevel: string;
    score: number;
  }>;
  skillCalculation?: {
    experienceScore: number;
    certificationScore: number;
    languageScore: number;
    trainingScore: number;
    technicalScore: number;
    softSkillScore: number;
    overallScore: number;
  };
}

export default function EmployeePanel({ employeeId, onClose }: EmployeePanelProps) {
  const { data: profile, isLoading, error } = useQuery<EmployeeProfile>({
    queryKey: ['/api/employees', employeeId, 'profile']
  });

  if (isLoading) {
    return (
      <div className="w-96 bg-card border-l border-border animate-pulse" data-testid="employee-panel-loading">
        <div className="p-6 space-y-4">
          <div className="h-6 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded-full mx-auto w-20"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-96 bg-card border-l border-border" data-testid="employee-panel-error">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">직원 정보 오류</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-muted-foreground">직원 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const { employee, trainingHistory, certifications, languages, skillCalculation } = profile;

  // Prepare data for individual radar chart
  const radarData = skillCalculation ? [{
    name: employee.name,
    averageSkills: {
      experience: skillCalculation.experienceScore,
      certification: skillCalculation.certificationScore,
      language: skillCalculation.languageScore,
      training: skillCalculation.trainingScore,
      technical: skillCalculation.technicalScore,
      softSkill: skillCalculation.softSkillScore
    }
  }] : [];

  return (
    <div className="w-96 bg-card border-l border-border overflow-y-auto" data-testid="employee-panel">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">직원 상세 정보</h3>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-panel">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Employee Basic Info */}
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
            {employee.name.charAt(0)}
          </div>
          <h4 className="text-lg font-semibold" data-testid="employee-name">{employee.name}</h4>
          <p className="text-muted-foreground" data-testid="employee-position">{employee.position}</p>
          <p className="text-sm text-muted-foreground" data-testid="employee-department">{employee.department}</p>
          {employee.email && (
            <p className="text-sm text-muted-foreground mt-2">{employee.email}</p>
          )}
        </div>

        {/* Skill Overview */}
        {skillCalculation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">능력치 개요</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>경력</span>
                  <span>{skillCalculation.experienceScore.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all" 
                    style={{ width: `${skillCalculation.experienceScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>자격증</span>
                  <span>{skillCalculation.certificationScore.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${skillCalculation.certificationScore}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>어학능력</span>
                  <span>{skillCalculation.languageScore.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all" 
                    style={{ width: `${skillCalculation.languageScore}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>교육이수</span>
                  <span>{skillCalculation.trainingScore.toFixed(1)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all" 
                    style={{ width: `${skillCalculation.trainingScore}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Radar Chart */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">개인 능력 차트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <SkillRadarChart 
                  data={radarData}
                  dataKey="averageSkills"
                  nameKey="name"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              최근 교육 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainingHistory.length > 0 ? (
              <div className="space-y-3">
                {trainingHistory.slice(0, 3).map(training => (
                  <div key={training.id} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-medium">{training.courseName}</h6>
                      <span className="text-xs text-muted-foreground">
                        {training.completionDate ? new Date(training.completionDate).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{training.provider}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        training.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : training.status === 'ongoing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {training.status === 'completed' ? '완료' : 
                         training.status === 'ongoing' ? '진행중' : '계획'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 교육 이력이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Award className="w-4 h-4 mr-2" />
              보유 자격증
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certifications.length > 0 ? (
              <div className="space-y-2">
                {certifications.map(cert => (
                  <div key={cert.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 자격증이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              어학능력
            </CardTitle>
          </CardHeader>
          <CardContent>
            {languages.length > 0 ? (
              <div className="space-y-2">
                {languages.map(lang => (
                  <div key={lang.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{lang.language}</p>
                      <p className="text-xs text-muted-foreground">{lang.proficiencyLevel}</p>
                    </div>
                    {lang.score && (
                      <span className="text-xs text-muted-foreground">
                        {lang.score}점
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 어학능력이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t border-border">
          <Button className="flex-1" data-testid="button-edit-employee">
            <Edit className="w-4 h-4 mr-2" />
            정보 수정
          </Button>
          <Button variant="outline" data-testid="button-view-full-history">
            <FileText className="w-4 h-4 mr-2" />
            전체 이력
          </Button>
        </div>
      </div>
    </div>
  );
}
