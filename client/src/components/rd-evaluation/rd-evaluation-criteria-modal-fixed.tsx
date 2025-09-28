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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Edit, Trash2, Plus, Calculator, Database, Settings, Play } from "lucide-react";

interface RdEvaluationCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RdEvaluationCriteriaModal({ isOpen, onClose }: RdEvaluationCriteriaModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [detailedTab, setDetailedTab] = useState("technical_competency");

  // 6대 역량 항목 관리 (동적) - 요청된 기준에 맞게 수정
  const [competencyItems, setCompetencyItems] = useState({
    technical_competency: { 
      name: "전문기술", 
      weight: 25, 
      description: "전문 기술 역량",
      maxScore: 25,
      scoringRanges: [
        { min: 80, max: 100, converted: 100, label: "80점↑ → 100점" },
        { min: 60, max: 79, converted: 80, label: "60-79점 → 80점" },
        { min: 40, max: 59, converted: 60, label: "40-59점 → 60점" },
        { min: 0, max: 39, converted: 40, label: "40점↓ → 40점" }
      ]
    },
    project_experience: { 
      name: "프로젝트", 
      weight: 20, 
      description: "프로젝트 수행 경험",
      maxScore: 20,
      scoringRanges: [
        { min: 30, max: 100, converted: 100, label: "30점↑ → 100점" },
        { min: 20, max: 29, converted: 80, label: "20-29점 → 80점" },
        { min: 10, max: 19, converted: 60, label: "10-19점 → 60점" },
        { min: 0, max: 9, converted: 40, label: "10점↓ → 40점" }
      ]
    },
    rd_achievement: { 
      name: "연구성과", 
      weight: 25, 
      description: "연구개발 성과",
      maxScore: 25,
      scoringRanges: [
        { min: 40, max: 100, converted: 100, label: "40점↑ → 100점" },
        { min: 25, max: 39, converted: 80, label: "25-39점 → 80점" },
        { min: 10, max: 24, converted: 60, label: "10-24점 → 60점" },
        { min: 0, max: 9, converted: 40, label: "10점↓ → 40점" }
      ]
    },
    global_competency: { 
      name: "글로벌", 
      weight: 10, 
      description: "글로벌 역량",
      maxScore: 10,
      scoringRanges: [
        { min: 10, max: 10, converted: 100, label: "10점 → 100점" },
        { min: 7, max: 8, converted: 80, label: "7-8점 → 80점" },
        { min: 4, max: 6, converted: 60, label: "4-6점 → 60점" },
        { min: 0, max: 2, converted: 40, label: "2점 → 40점" }
      ]
    },
    knowledge_sharing: { 
      name: "기술확산", 
      weight: 10, 
      description: "기술 확산 및 자기계발",
      maxScore: 10,
      scoringRanges: [
        { min: 15, max: 100, converted: 100, label: "15점↑ → 100점" },
        { min: 10, max: 14, converted: 80, label: "10-14점 → 80점" },
        { min: 5, max: 9, converted: 60, label: "5-9점 → 60점" },
        { min: 1, max: 4, converted: 40, label: "1-4점 → 40점" }
      ]
    },
    innovation_proposal: { 
      name: "혁신제안", 
      weight: 10, 
      description: "업무개선 및 혁신 제안",
      maxScore: 10,
      scoringRanges: [
        { min: 60, max: 100, converted: 100, label: "60점↑ → 100점" },
        { min: 30, max: 59, converted: 80, label: "30-59점 → 80점" },
        { min: 5, max: 29, converted: 60, label: "5-29점 → 60점" },
        { min: 0, max: 4, converted: 40, label: "5점↓ → 40점" }
      ]
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>R&D 역량평가 기준 설정</DialogTitle>
          <p className="text-sm text-muted-foreground">
            6대 역량별 평가 기준을 설정하고 자동 평가를 실행할 수 있습니다.
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="detailed">상세 설정</TabsTrigger>
            <TabsTrigger value="auto">자동 평가</TabsTrigger>
            <TabsTrigger value="data">데이터 연동</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-4">
            {/* 6대 역량 개요 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(competencyItems).map(([key, item]) => (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.weight}%</Badge>
                        <Badge variant="secondary">최대 {item.maxScore}점</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>가중치</span>
                        <span className="font-medium">{item.weight}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>최대 점수</span>
                        <span className="font-medium">{item.maxScore}점</span>
                      </div>
                      <Progress value={item.weight} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 점수 환산 기준 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  점수 환산 기준
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  활동 점수를 100점 만점으로 환산하는 기준입니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(competencyItems).map(([key, item]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        {item.name} ({item.weight}% 가중치, 최대 {item.maxScore}점)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        {item.scoringRanges.map((range, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-gray-700">
                              {range.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {range.min === range.max ? 
                                `${range.min}점` : 
                                `${range.min}~${range.max}점`
                              } → {range.converted}점
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 가중치 요약 */}
            <Card>
              <CardHeader>
                <CardTitle>가중치 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(competencyItems).map(([key, item]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.weight}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {item.weight}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-4">
                    <div className="flex items-center justify-between font-medium">
                      <span>총 가중치</span>
                      <span>
                        {Object.values(competencyItems).reduce((sum, item) => sum + item.weight, 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 상세 설정 탭 */}
          <TabsContent value="detailed" className="space-y-4">
            <Tabs value={detailedTab} onValueChange={setDetailedTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                {Object.entries(competencyItems).map(([key, item]) => (
                  <TabsTrigger key={key} value={key}>
                    {item.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* 동적 역량 탭들 */}
              {Object.entries(competencyItems).map(([key, item]) => (
                <TabsContent key={key} value={key} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        {item.name} ({item.weight}%)
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-lg font-medium mb-4">점수 환산 기준</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                            {item.scoringRanges.map((range, index) => (
                              <div key={index} className="bg-white p-3 rounded-lg border">
                                <div className="text-sm font-medium text-gray-700">
                                  {range.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {range.min === range.max ? 
                                    `${range.min}점` : 
                                    `${range.min}~${range.max}점`
                                  } → {range.converted}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* 자동 평가 탭 */}
          <TabsContent value="auto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  자동 평가 실행
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  설정된 기준에 따라 자동으로 평가를 실행합니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium mb-2">자동 평가 기능</h4>
                    <p className="text-sm text-gray-600">
                      현재 설정된 6대 역량 기준에 따라 연구원들의 활동 데이터를 자동으로 분석하고 점수를 계산합니다.
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      alert("자동 평가 기능이 실행되었습니다.");
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    자동 평가 실행
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 데이터 연동 탭 */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  데이터 연동
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  외부 데이터 소스와 연동하여 평가 데이터를 자동으로 수집합니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-2">연동 가능한 데이터 소스</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Google Sheets (교육 이수 기록)</li>
                      <li>• HR 시스템 (자격증, 경력 정보)</li>
                      <li>• 프로젝트 관리 시스템 (프로젝트 참여 이력)</li>
                      <li>• 연구 성과 데이터베이스 (논문, 특허)</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      alert("데이터 연동 기능이 실행되었습니다.");
                    }}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    데이터 연동 실행
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={() => {
              alert("R&D 역량평가 기준이 저장되었습니다.");
              onClose();
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
