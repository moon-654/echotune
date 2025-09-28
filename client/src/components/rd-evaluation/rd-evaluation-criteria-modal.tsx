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
  const [languageTab, setLanguageTab] = useState("english");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    weight: 0,
    maxScore: 0,
    description: ""
  });

  // 상세 설정 편집 상태
  const [editingDetail, setEditingDetail] = useState<{
    competency: string;
    category: string;
    item: string;
  } | null>(null);
  const [editingRange, setEditingRange] = useState<{
    competency: string;
    rangeIndex: number;
    range: any;
  } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemScore, setNewItemScore] = useState(0);

  // 6대 역량별 상세 설정 (동적 관리)
  const [detailedCriteria, setDetailedCriteria] = useState({
    technical_competency: {
      education: { 박사: 30, 석사: 20, 학사: 10, 전문대: 5 },
      experience: { "15년 이상": 50, "10년 이상": 40, "5년 이상": 30, "5년 미만": 20 },
      certifications: { 기술사: 20, 기사: 10, 산업기사: 5, 기타: 3 }
    },
    project_experience: {
      leadership: { "Project Leader": 15, "핵심 멤버": 10, "일반 멤버": 5 },
      count: { "3개 이상": 30, "2개": 20, "1개": 10 }
    },
    rd_achievement: {
      patents: { 등록: 20, 출원: 5 },
      publications: { "SCI(E)급": 25, "국내 학술지": 10 },
      awards: { 국제: 15, 국가: 10, 산업: 5 }
    },
    global_competency: {
      "영어 TOEIC": { "950-990": 10, "900-949": 8, "800-899": 6, "700-799": 4, "700미만": 2 },
      "영어 TOEFL": { "113-120": 10, "105-112": 8, "90-104": 6, "70-89": 4, "70미만": 2 },
      "영어 IELTS": { "8.5-9.0": 10, "7.5-8.4": 8, "6.5-7.4": 6, "5.5-6.4": 4, "5.5미만": 2 },
      "영어 TEPS": { "526-600": 10, "453-525": 8, "387-452": 6, "327-386": 4, "327미만": 2 },
      "일본어 JLPT": { "N1": 10, "N2": 7, "N3": 4, "N4": 2, "N5": 1 },
      "일본어 JPT": { "900-990": 8, "800-899": 6, "700-799": 4, "700미만": 2 },
      "중국어 HSK": { "6급": 10, "5급": 8, "4급": 6, "3급": 4, "2급": 2, "1급": 1 },
      "중국어 TOCFL": { "Band C Level 6": 10, "Band C Level 5": 8, "Band B Level 4": 6, "Band B Level 3": 4, "Band A Level 2": 2, "Band A Level 1": 1 }
    },
    knowledge_sharing: {
      training: { "40시간 이상": 5, "20시간 이상": 3, "10시간 이상": 2 },
      certifications: { "신규 취득": 5 },
      mentoring: { "멘토링 1명": 3 },
      instructor: { "강의 1회": 5, "강의 2회": 10, "강의 3회 이상": 15 }
    },
    innovation_proposal: {
      awards: { 최우수상: 80, 우수상: 60, 장려상: 40 },
      adoption: { 채택: 5 }
    }
  });

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

  // 편집 시작
  const handleEdit = (key: string) => {
    const item = competencyItems[key as keyof typeof competencyItems];
    setEditingItem(key);
    setEditData({
      weight: item.weight,
      maxScore: item.maxScore,
      description: item.description
    });
  };

  // 편집 저장
  const handleSave = () => {
    if (!editingItem) return;
    
    setCompetencyItems(prev => ({
      ...prev,
      [editingItem]: {
        ...prev[editingItem as keyof typeof prev],
        weight: editData.weight,
        maxScore: editData.maxScore,
        description: editData.description
      }
    }));
    
    setEditingItem(null);
    setEditData({ weight: 0, maxScore: 0, description: "" });
  };

  // 편집 취소
  const handleCancel = () => {
    setEditingItem(null);
    setEditData({ weight: 0, maxScore: 0, description: "" });
  };

  // 기준 저장
  const handleSaveCriteria = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rd-evaluations/criteria", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          criteria: competencyItems,
          updateEmployeeForms: true
        })
      });

      if (response.ok) {
        alert("R&D 역량평가 기준이 저장되었습니다.");
        onClose();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 기준 로드
  const handleLoadCriteria = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rd-evaluations/criteria");
      if (response.ok) {
        const data = await response.json();
        if (data.rdEvaluationCriteria) {
          setCompetencyItems(data.rdEvaluationCriteria);
          alert("저장된 기준을 불러왔습니다.");
        }
      }
    } catch (error) {
      console.error("로드 오류:", error);
      alert("기준 로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 상세 항목 편집 시작
  const handleEditDetail = (competency: string, category: string, item: string, score: number) => {
    setEditingDetail({ competency, category, item });
    setNewItemName(item);
    setNewItemScore(score);
  };

  // 상세 항목 편집 저장
  const handleSaveDetail = () => {
    if (!editingDetail) return;
    
    const { competency, category, item: oldItem } = editingDetail;
    setDetailedCriteria(prev => {
      const newCriteria = { ...prev };
      const competencyData = newCriteria[competency as keyof typeof newCriteria] as any;
      if (competencyData && competencyData[category]) {
        delete competencyData[category][oldItem];
        competencyData[category][newItemName] = newItemScore;
      }
      return newCriteria;
    });
    
    setEditingDetail(null);
    setNewItemName("");
    setNewItemScore(0);
  };

  // 상세 항목 편집 취소
  const handleCancelDetail = () => {
    setEditingDetail(null);
    setNewItemName("");
    setNewItemScore(0);
  };

  // 상세 항목 추가
  const handleAddDetail = (competency: string, category: string) => {
    if (!newItemName.trim()) return;
    
    setDetailedCriteria(prev => {
      const newCriteria = { ...prev };
      const competencyData = newCriteria[competency as keyof typeof newCriteria] as any;
      if (competencyData && competencyData[category]) {
        competencyData[category][newItemName] = newItemScore;
      }
      return newCriteria;
    });
    
    setNewItemName("");
    setNewItemScore(0);
  };

  // 상세 항목 삭제
  const handleDeleteDetail = (competency: string, category: string, item: string) => {
    if (!confirm(`'${item}' 항목을 삭제하시겠습니까?`)) return;
    
    setDetailedCriteria(prev => {
      const newCriteria = { ...prev };
      const competencyData = newCriteria[competency as keyof typeof newCriteria] as any;
      if (competencyData && competencyData[category]) {
        delete competencyData[category][item];
      }
      return newCriteria;
    });
  };

  // 점수 환산 기준 편집 함수들
  const handleEditRange = (competency: string, rangeIndex: number, range: any) => {
    setEditingRange({ competency, rangeIndex, range });
  };

  const handleSaveRange = () => {
    if (!editingRange) return;
    
    const { competency, rangeIndex, range } = editingRange;
    setCompetencyItems(prev => ({
      ...prev,
      [competency]: {
        ...prev[competency as keyof typeof prev],
        scoringRanges: prev[competency as keyof typeof prev].scoringRanges.map((r, index) => 
          index === rangeIndex ? range : r
        )
      }
    }));
    setEditingRange(null);
  };

  const handleCancelRange = () => {
    setEditingRange(null);
  };

  const handleAddRange = (competency: string) => {
    const newRange = { min: 0, max: 100, converted: 100, label: "새 기준" };
    setCompetencyItems(prev => ({
      ...prev,
      [competency]: {
        ...prev[competency as keyof typeof prev],
        scoringRanges: [...prev[competency as keyof typeof prev].scoringRanges, newRange]
      }
    }));
  };

  const handleDeleteRange = (competency: string, rangeIndex: number) => {
    if (!confirm('이 점수 환산 기준을 삭제하시겠습니까?')) return;
    
    setCompetencyItems(prev => ({
      ...prev,
      [competency]: {
        ...prev[competency as keyof typeof prev],
        scoringRanges: prev[competency as keyof typeof prev].scoringRanges.filter((_, index) => index !== rangeIndex)
      }
    }));
  };

  // 컴포넌트 마운트 시 기준 로드
  useEffect(() => {
    if (isOpen) {
      handleLoadCriteria();
    }
  }, [isOpen]);

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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(key)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardHeader>
                  <CardContent>
                    {editingItem === key ? (
                      // 편집 모드
                      <div className="space-y-4">
                        <div>
                          <Label>가중치 (%)</Label>
                          <Input
                            type="number"
                            value={editData.weight}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              weight: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label>최대 점수</Label>
                          <Input
                            type="number"
                            value={editData.maxScore}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              maxScore: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div>
                          <Label>설명</Label>
                          <Textarea
                            value={editData.description}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="역량 설명을 입력하세요"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave}>
                            <Save className="w-3 h-3 mr-1" />
                            저장
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-3 h-3 mr-1" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 표시 모드
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
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 점수 환산 기준 - 편집 가능 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  점수 환산 기준
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  활동 점수를 100점 만점으로 환산하는 기준입니다. 각 기준을 클릭하여 편집할 수 있습니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(competencyItems).map(([key, item]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {item.name} ({item.weight}% 가중치, 최대 {item.maxScore}점)
                        </h4>
                        <Button
                          size="sm"
                          onClick={() => handleAddRange(key)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          기준 추가
                        </Button>
                      </div>
                      
                      {/* 편집 가능한 점수 환산 기준 */}
                      <div className="space-y-2">
                        {item.scoringRanges.map((range, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {range.label}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {range.min === range.max ? 
                                      `${range.min}점` : 
                                      `${range.min}~${range.max}점`
                                    }
                                  </div>
                                  <div className="text-sm font-medium text-blue-600">
                                    → {range.converted}점
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditRange(key, index, range)}
                                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                >
                                  ✏️ 수정
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteRange(key, index)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                >
                                  🗑️ 삭제
                                </Button>
                              </div>
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

                        {/* 상세 평가 항목 */}
                        {detailedCriteria[key as keyof typeof detailedCriteria] && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="text-lg font-medium mb-4">상세 평가 항목</h4>
                            
                            {/* 글로벌 역량인 경우 언어별 탭 */}
                            {key === 'global_competency' ? (
                              <div className="space-y-4">
                                <Tabs value={languageTab} onValueChange={setLanguageTab}>
                                  <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="english">영어</TabsTrigger>
                                    <TabsTrigger value="japanese">일본어</TabsTrigger>
                                    <TabsTrigger value="chinese">중국어</TabsTrigger>
                                    <TabsTrigger value="other">기타</TabsTrigger>
                                  </TabsList>
                                  
                                  {/* 영어 탭 */}
                                  <TabsContent value="english" className="space-y-4">
                                    {Object.entries(detailedCriteria[key as keyof typeof detailedCriteria])
                                      .filter(([category]) => category.includes('영어'))
                                      .map(([category, items]) => (
                                        <div key={category} className="bg-white p-4 rounded-lg border">
                                          <h5 className="font-medium mb-3 text-gray-800">{category}</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {Object.entries(items as Record<string, number>).map(([itemName, score]) => (
                                              <div key={`${category}-${itemName}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{itemName}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm font-medium text-blue-600">{score}점</span>
                                                  <div className="flex space-x-1">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleEditDetail(key, category, itemName, score)}
                                                    >
                                                      <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleDeleteDetail(key, category, itemName)}
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          {/* 새 항목 추가 */}
                                          <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                            <h6 className="text-sm font-medium mb-2">새 항목 추가</h6>
                                            <div className="flex items-center space-x-2">
                                              <Input
                                                placeholder="항목명"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                className="flex-1"
                                              />
                                              <Input
                                                type="number"
                                                placeholder="점수"
                                                value={newItemScore}
                                                onChange={(e) => setNewItemScore(parseInt(e.target.value) || 0)}
                                                className="w-20"
                                                min="0"
                                                max="100"
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() => handleAddDetail(key, category)}
                                                disabled={!newItemName.trim()}
                                              >
                                                <Plus className="w-3 h-3 mr-1" />
                                                추가
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </TabsContent>
                                  
                                  {/* 일본어 탭 */}
                                  <TabsContent value="japanese" className="space-y-4">
                                    {Object.entries(detailedCriteria[key as keyof typeof detailedCriteria])
                                      .filter(([category]) => category.includes('일본어'))
                                      .map(([category, items]) => (
                                        <div key={category} className="bg-white p-4 rounded-lg border">
                                          <h5 className="font-medium mb-3 text-gray-800">{category}</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {Object.entries(items as Record<string, number>).map(([itemName, score]) => (
                                              <div key={`${category}-${itemName}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{itemName}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm font-medium text-blue-600">{score}점</span>
                                                  <div className="flex space-x-1">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleEditDetail(key, category, itemName, score)}
                                                    >
                                                      <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleDeleteDetail(key, category, itemName)}
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          {/* 새 항목 추가 */}
                                          <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                            <h6 className="text-sm font-medium mb-2">새 항목 추가</h6>
                                            <div className="flex items-center space-x-2">
                                              <Input
                                                placeholder="항목명"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                className="flex-1"
                                              />
                                              <Input
                                                type="number"
                                                placeholder="점수"
                                                value={newItemScore}
                                                onChange={(e) => setNewItemScore(parseInt(e.target.value) || 0)}
                                                className="w-20"
                                                min="0"
                                                max="100"
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() => handleAddDetail(key, category)}
                                                disabled={!newItemName.trim()}
                                              >
                                                <Plus className="w-3 h-3 mr-1" />
                                                추가
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </TabsContent>
                                  
                                  {/* 중국어 탭 */}
                                  <TabsContent value="chinese" className="space-y-4">
                                    {Object.entries(detailedCriteria[key as keyof typeof detailedCriteria])
                                      .filter(([category]) => category.includes('중국어'))
                                      .map(([category, items]) => (
                                        <div key={category} className="bg-white p-4 rounded-lg border">
                                          <h5 className="font-medium mb-3 text-gray-800">{category}</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {Object.entries(items as Record<string, number>).map(([itemName, score]) => (
                                              <div key={`${category}-${itemName}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{itemName}</span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm font-medium text-blue-600">{score}점</span>
                                                  <div className="flex space-x-1">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleEditDetail(key, category, itemName, score)}
                                                    >
                                                      <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleDeleteDetail(key, category, itemName)}
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          {/* 새 항목 추가 */}
                                          <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                            <h6 className="text-sm font-medium mb-2">새 항목 추가</h6>
                                            <div className="flex items-center space-x-2">
                                              <Input
                                                placeholder="항목명"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                className="flex-1"
                                              />
                                              <Input
                                                type="number"
                                                placeholder="점수"
                                                value={newItemScore}
                                                onChange={(e) => setNewItemScore(parseInt(e.target.value) || 0)}
                                                className="w-20"
                                                min="0"
                                                max="100"
                                              />
                                              <Button
                                                size="sm"
                                                onClick={() => handleAddDetail(key, category)}
                                                disabled={!newItemName.trim()}
                                              >
                                                <Plus className="w-3 h-3 mr-1" />
                                                추가
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </TabsContent>
                                  
                                  {/* 기타 탭 */}
                                  <TabsContent value="other" className="space-y-4">
                                    <div className="bg-white p-4 rounded-lg border">
                                      <h5 className="font-medium mb-3 text-gray-800">기타 언어</h5>
                                      <p className="text-sm text-gray-600">추가 언어 시험 기준을 설정할 수 있습니다.</p>
                                      
                                      {/* 새 언어 추가 */}
                                      <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                        <h6 className="text-sm font-medium mb-2">새 언어 시험 추가</h6>
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            placeholder="언어명 (예: 독일어, 프랑스어)"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="flex-1"
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              if (newItemName.trim()) {
                                                setDetailedCriteria(prev => ({
                                                  ...prev,
                                                  global_competency: {
                                                    ...prev.global_competency,
                                                    [newItemName]: {}
                                                  }
                                                }));
                                                setNewItemName("");
                                              }
                                            }}
                                            disabled={!newItemName.trim()}
                                          >
                                            <Plus className="w-3 h-3 mr-1" />
                                            언어 추가
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                            ) : (
                              /* 다른 역량들은 기존 방식 */
                              <div className="space-y-4">
                                {Object.entries(detailedCriteria[key as keyof typeof detailedCriteria]).map(([category, items]) => (
                                  <div key={category} className="bg-white p-4 rounded-lg border">
                                    <h5 className="font-medium mb-3 text-gray-800">
                                      {category === 'education' ? '학력' :
                                       category === 'experience' ? '경력' :
                                       category === 'certifications' ? '자격증' :
                                       category === 'leadership' ? '리더십' :
                                       category === 'count' ? '프로젝트 수' :
                                       category === 'patents' ? '특허' :
                                       category === 'publications' ? '논문' :
                                       category === 'awards' ? '수상' :
                                       category === 'training' ? '교육이수' :
                                       category === 'mentoring' ? '멘토링' :
                                       category === 'instructor' ? '강의' :
                                       category === 'adoption' ? '채택' :
                                       category}
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {Object.entries(items as Record<string, number>).map(([itemName, score]) => (
                                        <div key={`${category}-${itemName}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="text-sm">{itemName}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-blue-600">{score}점</span>
                                            <div className="flex space-x-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditDetail(key, category, itemName, score)}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteDetail(key, category, itemName)}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* 새 항목 추가 */}
                                    <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg">
                                      <h6 className="text-sm font-medium mb-2">새 항목 추가</h6>
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          placeholder="항목명"
                                          value={newItemName}
                                          onChange={(e) => setNewItemName(e.target.value)}
                                          className="flex-1"
                                        />
                                        <Input
                                          type="number"
                                          placeholder="점수"
                                          value={newItemScore}
                                          onChange={(e) => setNewItemScore(parseInt(e.target.value) || 0)}
                                          className="w-20"
                                          min="0"
                                          max="100"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddDetail(key, category)}
                                          disabled={!newItemName.trim()}
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          추가
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleLoadCriteria}
              disabled={loading}
            >
              <Database className="w-4 h-4 mr-2" />
              기준 불러오기
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              onClick={handleSaveCriteria}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* 상세 항목 편집 모달 */}
      {editingDetail && (
        <Dialog open={!!editingDetail} onOpenChange={() => setEditingDetail(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>항목 편집</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>항목명</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="항목명을 입력하세요"
                />
              </div>
              <div>
                <Label>점수</Label>
                <Input
                  type="number"
                  value={newItemScore}
                  onChange={(e) => setNewItemScore(parseInt(e.target.value) || 0)}
                  placeholder="점수를 입력하세요"
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelDetail}>
                  취소
                </Button>
                <Button onClick={handleSaveDetail}>
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 점수 환산 기준 편집 모달 - 간단한 형태 */}
      {editingRange && (
        <Dialog open={!!editingRange} onOpenChange={() => setEditingRange(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">점수 환산 기준 편집</DialogTitle>
              <p className="text-sm text-gray-600">기준을 수정하거나 새로운 기준을 추가하세요</p>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* 기준명 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">기준명</Label>
                <Input
                  value={editingRange.range.label}
                  onChange={(e) => setEditingRange(prev => prev ? {
                    ...prev,
                    range: { ...prev.range, label: e.target.value }
                  } : null)}
                  placeholder="예: 80점↑ → 100점"
                  className="w-full"
                />
              </div>

              {/* 점수 범위 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">점수 범위</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={editingRange.range.min}
                    onChange={(e) => setEditingRange(prev => prev ? {
                      ...prev,
                      range: { ...prev.range, min: parseInt(e.target.value) || 0 }
                    } : null)}
                    placeholder="최소"
                    min="0"
                    max="100"
                    className="w-20"
                  />
                  <span className="text-gray-500">~</span>
                  <Input
                    type="number"
                    value={editingRange.range.max}
                    onChange={(e) => setEditingRange(prev => prev ? {
                      ...prev,
                      range: { ...prev.range, max: parseInt(e.target.value) || 0 }
                    } : null)}
                    placeholder="최대"
                    min="0"
                    max="100"
                    className="w-20"
                  />
                  <span className="text-gray-500">점</span>
                </div>
              </div>

              {/* 환산 점수 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">환산 점수</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={editingRange.range.converted}
                    onChange={(e) => setEditingRange(prev => prev ? {
                      ...prev,
                      range: { ...prev.range, converted: parseInt(e.target.value) || 0 }
                    } : null)}
                    placeholder="환산 점수"
                    min="0"
                    max="100"
                    className="w-24"
                  />
                  <span className="text-gray-500">점으로 환산</span>
                </div>
              </div>

              {/* 미리보기 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">미리보기:</div>
                <div className="text-sm font-medium">
                  {editingRange.range.label} → {editingRange.range.converted}점
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancelRange}>
                취소
              </Button>
              <Button onClick={handleSaveRange} className="bg-blue-600 hover:bg-blue-700">
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
