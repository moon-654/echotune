import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Plus, Trash2 } from "lucide-react";

interface RdEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
}

export default function RdEvaluationModal({ isOpen, onClose, onSuccess }: RdEvaluationModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [evaluationYear, setEvaluationYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // 6대 역량 점수 상태
  const [scores, setScores] = useState({
    technicalCompetency: 0,
    projectExperience: 0,
    rdAchievement: 0,
    globalCompetency: 0,
    knowledgeSharing: 0,
    innovationProposal: 0
  });

  // 상세 정보 상태
  const [details, setDetails] = useState({
    technicalCompetency: "",
    projectExperience: "",
    rdAchievement: "",
    globalCompetency: "",
    knowledgeSharing: "",
    innovationProposal: ""
  });

  const [comments, setComments] = useState("");

  // 직원 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("직원 목록 로드 오류:", error);
    }
  };

  // 종합 점수 계산
  const totalScore = 
    (scores.technicalCompetency * 0.25) +
    (scores.projectExperience * 0.20) +
    (scores.rdAchievement * 0.25) +
    (scores.globalCompetency * 0.10) +
    (scores.knowledgeSharing * 0.10) +
    (scores.innovationProposal * 0.10);

  // 등급 계산
  const getGrade = (score: number) => {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  const handleScoreChange = (category: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [category]: Math.max(0, Math.min(100, value))
    }));
  };

  const handleDetailChange = (category: string, value: string) => {
    setDetails(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      alert("직원을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const evaluationData = {
        employeeId: selectedEmployee,
        evaluationYear,
        evaluationPeriod: "annual",
        technicalCompetencyScore: scores.technicalCompetency,
        technicalCompetencyDetails: details.technicalCompetency,
        projectExperienceScore: scores.projectExperience,
        projectExperienceDetails: details.projectExperience,
        rdAchievementScore: scores.rdAchievement,
        rdAchievementDetails: details.rdAchievement,
        globalCompetencyScore: scores.globalCompetency,
        globalCompetencyDetails: details.globalCompetency,
        knowledgeSharingScore: scores.knowledgeSharing,
        knowledgeSharingDetails: details.knowledgeSharing,
        innovationProposalScore: scores.innovationProposal,
        innovationProposalDetails: details.innovationProposal,
        status: "draft",
        comments
      };

      const response = await fetch("/api/rd-evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(evaluationData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // 폼 초기화
        setSelectedEmployee("");
        setScores({
          technicalCompetency: 0,
          projectExperience: 0,
          rdAchievement: 0,
          globalCompetency: 0,
          knowledgeSharing: 0,
          innovationProposal: 0
        });
        setDetails({
          technicalCompetency: "",
          projectExperience: "",
          rdAchievement: "",
          globalCompetency: "",
          knowledgeSharing: "",
          innovationProposal: ""
        });
        setComments("");
      } else {
        alert("평가 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("평가 등록 오류:", error);
      alert("평가 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>R&D 역량평가 등록</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">직원 선택</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="직원을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">평가 연도</Label>
                  <Input
                    id="year"
                    type="number"
                    value={evaluationYear}
                    onChange={(e) => setEvaluationYear(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6대 역량 평가 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 전문 기술 역량 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. 전문 기술 역량 (25%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.technicalCompetency}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.technicalCompetency}
                    onChange={(e) => handleScoreChange("technicalCompetency", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.technicalCompetency} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="학위, 경력, 자격증 등 상세 정보를 입력하세요"
                    value={details.technicalCompetency}
                    onChange={(e) => handleDetailChange("technicalCompetency", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 프로젝트 수행 경험 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. 프로젝트 수행 경험 (20%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.projectExperience}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.projectExperience}
                    onChange={(e) => handleScoreChange("projectExperience", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.projectExperience} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="프로젝트 역할, 기여도 등 상세 정보를 입력하세요"
                    value={details.projectExperience}
                    onChange={(e) => handleDetailChange("projectExperience", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 연구개발 성과 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. 연구개발 성과 (25%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.rdAchievement}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.rdAchievement}
                    onChange={(e) => handleScoreChange("rdAchievement", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.rdAchievement} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="특허, 논문, 기술이전 등 상세 정보를 입력하세요"
                    value={details.rdAchievement}
                    onChange={(e) => handleDetailChange("rdAchievement", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 글로벌 역량 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. 글로벌 역량 (10%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.globalCompetency}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.globalCompetency}
                    onChange={(e) => handleScoreChange("globalCompetency", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.globalCompetency} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="어학능력, 글로벌 경험 등 상세 정보를 입력하세요"
                    value={details.globalCompetency}
                    onChange={(e) => handleDetailChange("globalCompetency", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 기술 확산 및 자기계발 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">5. 기술 확산 및 자기계발 (10%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.knowledgeSharing}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.knowledgeSharing}
                    onChange={(e) => handleScoreChange("knowledgeSharing", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.knowledgeSharing} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="교육, 멘토링, 자격증 취득 등 상세 정보를 입력하세요"
                    value={details.knowledgeSharing}
                    onChange={(e) => handleDetailChange("knowledgeSharing", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 업무개선 및 혁신 제안 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">6. 업무개선 및 혁신 제안 (10%)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>점수: {scores.innovationProposal}점</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.innovationProposal}
                    onChange={(e) => handleScoreChange("innovationProposal", parseInt(e.target.value) || 0)}
                  />
                  <Progress value={scores.innovationProposal} className="mt-2" />
                </div>
                <div>
                  <Label>상세 정보</Label>
                  <Textarea
                    placeholder="제안제도 활용, 혁신 아이디어 등 상세 정보를 입력하세요"
                    value={details.innovationProposal}
                    onChange={(e) => handleDetailChange("innovationProposal", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 종합 결과 */}
          <Card>
            <CardHeader>
              <CardTitle>종합 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">총점</span>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold">{totalScore.toFixed(1)}점</span>
                  <Badge className={getGradeColor(getGrade(totalScore))}>
                    {getGrade(totalScore)}등급
                  </Badge>
                </div>
              </div>
              <Progress value={totalScore} className="w-full" />
              
              <div>
                <Label>평가 의견</Label>
                <Textarea
                  placeholder="전체적인 평가 의견을 입력하세요"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "등록 중..." : "등록"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




