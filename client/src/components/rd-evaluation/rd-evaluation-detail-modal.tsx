import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit, Save, Trash2, History } from "lucide-react";

interface RdEvaluationDetailModalProps {
  evaluation: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RdEvaluationDetailModal({ 
  evaluation, 
  isOpen, 
  onClose, 
  onSuccess 
}: RdEvaluationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // 편집 상태
  const [editScores, setEditScores] = useState({
    technicalCompetency: 0,
    projectExperience: 0,
    rdAchievement: 0,
    globalCompetency: 0,
    knowledgeSharing: 0,
    innovationProposal: 0
  });

  const [editDetails, setEditDetails] = useState({
    technicalCompetency: "",
    projectExperience: "",
    rdAchievement: "",
    globalCompetency: "",
    knowledgeSharing: "",
    innovationProposal: ""
  });

  const [editComments, setEditComments] = useState("");

  useEffect(() => {
    if (evaluation && isOpen) {
      setEditScores({
        technicalCompetency: evaluation.technicalCompetencyScore || 0,
        projectExperience: evaluation.projectExperienceScore || 0,
        rdAchievement: evaluation.rdAchievementScore || 0,
        globalCompetency: evaluation.globalCompetencyScore || 0,
        knowledgeSharing: evaluation.knowledgeSharingScore || 0,
        innovationProposal: evaluation.innovationProposalScore || 0
      });
      setEditDetails({
        technicalCompetency: evaluation.technicalCompetencyDetails || "",
        projectExperience: evaluation.projectExperienceDetails || "",
        rdAchievement: evaluation.rdAchievementDetails || "",
        globalCompetency: evaluation.globalCompetencyDetails || "",
        knowledgeSharing: evaluation.knowledgeSharingDetails || "",
        innovationProposal: evaluation.innovationProposalDetails || ""
      });
      setEditComments(evaluation.comments || "");
    }
  }, [evaluation, isOpen]);

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

  const handleSave = async () => {
    if (!evaluation) return;

    setLoading(true);
    try {
      const updateData = {
        technicalCompetencyScore: editScores.technicalCompetency,
        technicalCompetencyDetails: editDetails.technicalCompetency,
        projectExperienceScore: editScores.projectExperience,
        projectExperienceDetails: editDetails.projectExperience,
        rdAchievementScore: editScores.rdAchievement,
        rdAchievementDetails: editDetails.rdAchievement,
        globalCompetencyScore: editScores.globalCompetency,
        globalCompetencyDetails: editDetails.globalCompetency,
        knowledgeSharingScore: editScores.knowledgeSharing,
        knowledgeSharingDetails: editDetails.knowledgeSharing,
        innovationProposalScore: editScores.innovationProposal,
        innovationProposalDetails: editDetails.innovationProposal,
        comments: editComments,
        status: "draft"
      };

      const response = await fetch(`/api/rd-evaluations/${evaluation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        onSuccess();
        setIsEditing(false);
      } else {
        alert("평가 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("평가 수정 오류:", error);
      alert("평가 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!evaluation) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rd-evaluations/${evaluation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("상태 변경 오류:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  const currentScores = isEditing ? editScores : {
    technicalCompetency: evaluation.technicalCompetencyScore || 0,
    projectExperience: evaluation.projectExperienceScore || 0,
    rdAchievement: evaluation.rdAchievementScore || 0,
    globalCompetency: evaluation.globalCompetencyScore || 0,
    knowledgeSharing: evaluation.knowledgeSharingScore || 0,
    innovationProposal: evaluation.innovationProposalScore || 0
  };

  const currentDetails = isEditing ? editDetails : {
    technicalCompetency: evaluation.technicalCompetencyDetails || "",
    projectExperience: evaluation.projectExperienceDetails || "",
    rdAchievement: evaluation.rdAchievementDetails || "",
    globalCompetency: evaluation.globalCompetencyDetails || "",
    knowledgeSharing: evaluation.knowledgeSharingDetails || "",
    innovationProposal: evaluation.innovationProposalDetails || ""
  };

  const currentComments = isEditing ? editComments : (evaluation.comments || "");

  const totalScore = 
    (currentScores.technicalCompetency * 0.25) +
    (currentScores.projectExperience * 0.20) +
    (currentScores.rdAchievement * 0.25) +
    (currentScores.globalCompetency * 0.10) +
    (currentScores.knowledgeSharing * 0.10) +
    (currentScores.innovationProposal * 0.10);

  const getGrade = (score: number) => {
    if (score >= 90) return "S";
    if (score >= 80) return "A";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>R&D 역량평가 상세</DialogTitle>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "저장 중..." : "저장"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">직원명</p>
                  <p className="font-medium">{evaluation.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{evaluation.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">평가 연도</p>
                  <p className="font-medium">{evaluation.evaluationYear}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총점</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{totalScore.toFixed(1)}점</span>
                    <Badge className={getGradeColor(getGrade(totalScore))}>
                      {getGrade(totalScore)}등급
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">상태</p>
                  <Badge className={getStatusColor(evaluation.status)}>
                    {evaluation.status === 'approved' ? '승인' : 
                     evaluation.status === 'submitted' ? '제출' :
                     evaluation.status === 'draft' ? '임시저장' : '반려'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">평가일</p>
                  <p className="font-medium">
                    {new Date(evaluation.evaluationDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="details">상세</TabsTrigger>
              <TabsTrigger value="history">이력</TabsTrigger>
            </TabsList>

            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 6대 역량 점수 */}
                <Card>
                  <CardHeader>
                    <CardTitle>6대 역량 점수</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "전문 기술 역량", score: currentScores.technicalCompetency, weight: 25 },
                      { name: "프로젝트 수행 경험", score: currentScores.projectExperience, weight: 20 },
                      { name: "연구개발 성과", score: currentScores.rdAchievement, weight: 25 },
                      { name: "글로벌 역량", score: currentScores.globalCompetency, weight: 10 },
                      { name: "기술 확산 및 자기계발", score: currentScores.knowledgeSharing, weight: 10 },
                      { name: "업무개선 및 혁신 제안", score: currentScores.innovationProposal, weight: 10 }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.name} ({item.weight}%)</span>
                          <span className="font-medium">{item.score}점</span>
                        </div>
                        <Progress value={item.score} className="w-full" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 상태 관리 */}
                <Card>
                  <CardHeader>
                    <CardTitle>상태 관리</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={evaluation.status === 'draft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('draft')}
                        disabled={loading}
                      >
                        임시저장
                      </Button>
                      <Button
                        variant={evaluation.status === 'submitted' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('submitted')}
                        disabled={loading}
                      >
                        제출
                      </Button>
                      <Button
                        variant={evaluation.status === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('approved')}
                        disabled={loading}
                      >
                        승인
                      </Button>
                      <Button
                        variant={evaluation.status === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange('rejected')}
                        disabled={loading}
                      >
                        반려
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 상세 탭 */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    name: "전문 기술 역량", 
                    score: currentScores.technicalCompetency,
                    details: currentDetails.technicalCompetency,
                    key: "technicalCompetency"
                  },
                  { 
                    name: "프로젝트 수행 경험", 
                    score: currentScores.projectExperience,
                    details: currentDetails.projectExperience,
                    key: "projectExperience"
                  },
                  { 
                    name: "연구개발 성과", 
                    score: currentScores.rdAchievement,
                    details: currentDetails.rdAchievement,
                    key: "rdAchievement"
                  },
                  { 
                    name: "글로벌 역량", 
                    score: currentScores.globalCompetency,
                    details: currentDetails.globalCompetency,
                    key: "globalCompetency"
                  },
                  { 
                    name: "기술 확산 및 자기계발", 
                    score: currentScores.knowledgeSharing,
                    details: currentDetails.knowledgeSharing,
                    key: "knowledgeSharing"
                  },
                  { 
                    name: "업무개선 및 혁신 제안", 
                    score: currentScores.innovationProposal,
                    details: currentDetails.innovationProposal,
                    key: "innovationProposal"
                  }
                ].map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>점수</span>
                          <span className="font-medium">{item.score}점</span>
                        </div>
                        <Progress value={item.score} className="w-full" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">상세 정보</p>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{item.details || "상세 정보가 없습니다."}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 평가 의견 */}
              <Card>
                <CardHeader>
                  <CardTitle>평가 의견</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{currentComments || "평가 의견이 없습니다."}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 이력 탭 */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    평가 이력
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evaluation.history && evaluation.history.length > 0 ? (
                      evaluation.history.map((historyItem: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{historyItem.action}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(historyItem.timestamp).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            수행자: {historyItem.performed_by_name || historyItem.performed_by}
                          </p>
                          {historyItem.comments && (
                            <p className="text-sm mt-2">{historyItem.comments}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        평가 이력이 없습니다.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

