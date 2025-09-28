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

interface EvaluationCriteria {
  id: string;
  category: string;
  criteriaName: string;
  description: string;
  weight: number;
  maxScore: number;
  scoringMethod: string;
  isActive: boolean;
}

export default function RdEvaluationCriteriaModal({ isOpen, onClose }: RdEvaluationCriteriaModalProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [detailedTab, setDetailedTab] = useState("technical");
  const [autoCalculationResult, setAutoCalculationResult] = useState<any>(null);

  // 편집 상태
  const [editData, setEditData] = useState({
    weight: 0,
    maxScore: 100,
    scoringMethod: "manual",
    description: ""
  });

  // 6대 역량 항목 관리 (동적)
  const [competencyItems, setCompetencyItems] = useState({
    technical_competency: { name: "전문기술", weight: 25, description: "전문 기술 역량" },
    project_experience: { name: "프로젝트", weight: 20, description: "프로젝트 수행 경험" },
    rd_achievement: { name: "연구성과", weight: 20, description: "연구 성과" },
    global_competency: { name: "글로벌", weight: 10, description: "글로벌 역량" },
    knowledge_sharing: { name: "기술확산", weight: 10, description: "기술 확산 및 자기계발" },
    innovation_proposal: { name: "혁신제안", weight: 15, description: "혁신 제안" }
  });

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
      english: {
        toeic: { "950-990": 10, "900-949": 8, "800-899": 6, "700-799": 4, "700미만": 2 },
        toefl: { "113-120": 10, "105-112": 8, "90-104": 6, "70-89": 4, "70미만": 2 },
        ielts: { "8.5-9.0": 10, "7.5-8.4": 8, "6.5-7.4": 6, "5.5-6.4": 4, "5.5미만": 2 },
        teps: { "526-600": 10, "453-525": 8, "387-452": 6, "327-386": 4, "327미만": 2 }
      },
      japanese: {
        jlpt: { "N1": 10, "N2": 7, "N3": 4, "N4": 2, "N5": 1 },
        jpt: { "900-990": 8, "800-899": 6, "700-799": 4, "700미만": 2 }
      },
      chinese: {
        hsk: { "6급": 10, "5급": 8, "4급": 6, "3급": 4, "2급": 2, "1급": 1 },
        tocfl: { "Band C Level 6": 10, "Band C Level 5": 8, "Band B Level 4": 6, "Band B Level 3": 4, "Band A Level 2": 2, "Band A Level 1": 1 }
      }
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

  // 편집 중인 항목 상태
  const [editingItem, setEditingItem] = useState<{
    category: string;
    key: string;
    item: string;
  } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemScore, setNewItemScore] = useState(0);

  // 대항목 관리 상태
  const [editingMainItem, setEditingMainItem] = useState<{
    category: string;
    key: string;
  } | null>(null);
  const [newMainItemName, setNewMainItemName] = useState("");
  const [newMainItemDescription, setNewMainItemDescription] = useState("");
  
  // 대항목 설명 저장소
  const [mainItemDescriptions, setMainItemDescriptions] = useState<{
    [category: string]: { [key: string]: string };
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadCriteria();
    }
  }, [isOpen]);

  const loadCriteria = async () => {
    try {
      // 로컬 스토리지에서 로드
      const stored = localStorage.getItem('rdEvaluationCriteria');
      if (stored) {
        const criteria = JSON.parse(stored);
        setDetailedCriteria(criteria);
        console.log('✅ 로컬 스토리지에서 R&D 역량평가 기준 로드 완료');
      }
      
      // 6대 역량 항목들도 로드
      const competencyStored = localStorage.getItem('rdCompetencyItems');
      if (competencyStored) {
        const competencyItems = JSON.parse(competencyStored);
        setCompetencyItems(competencyItems);
        console.log('✅ 로컬 스토리지에서 6대 역량 항목 로드 완료');
      }
    } catch (error) {
      console.error("평가 기준 로드 오류:", error);
    }
  };

  // 로컬 스토리지에 기준 저장 (임시 해결책)
  const saveCriteriaToServer = async (criteria: any) => {
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem('rdEvaluationCriteria', JSON.stringify(criteria));
      console.log('✅ 로컬 스토리지에 R&D 역량평가 기준 저장 완료');
    } catch (error) {
      console.error('❌ 로컬 저장 오류:', error);
    }
  };

  // 6대 역량 항목 저장
  const saveCompetencyItems = async (items: any) => {
    try {
      localStorage.setItem('rdCompetencyItems', JSON.stringify(items));
      console.log('✅ 로컬 스토리지에 6대 역량 항목 저장 완료');
    } catch (error) {
      console.error('❌ 6대 역량 항목 저장 오류:', error);
    }
  };

  const handleEdit = (criterion: EvaluationCriteria) => {
    setEditingId(criterion.id);
    setEditData({
      weight: criterion.weight,
      maxScore: criterion.maxScore,
      scoringMethod: criterion.scoringMethod,
      description: criterion.description
    });
  };

  const handleSave = async (criterionId: string) => {
    setLoading(true);
    try {
      // R&D 역량평가 기준 저장 (직원 정보 입력 폼도 함께 업데이트)
      const response = await fetch("/api/rd-evaluations/criteria", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          criteria: detailedCriteria,
          updateEmployeeForms: true // 직원 정보 입력 폼도 함께 업데이트
        })
      });

      if (response.ok) {
        await loadCriteria();
        setEditingId(null);
      } else {
        alert("평가 기준 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("평가 기준 수정 오류:", error);
      alert("평가 기준 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({
      weight: 0,
      maxScore: 100,
      scoringMethod: "manual",
      description: ""
    });
  };

  // 항목 추가
  const handleAddItem = async (category: string, key: string) => {
    if (!newItemName.trim() || newItemScore < 0) {
      alert("항목명과 점수를 입력해주세요.");
      return;
    }

    const newCriteria = { ...detailedCriteria };
    newCriteria[category as keyof typeof detailedCriteria][key][newItemName] = newItemScore;
    setDetailedCriteria(newCriteria);
    
    setNewItemName("");
    setNewItemScore(0);
    
    // 서버에 저장
    await saveCriteriaToServer(newCriteria);
    
    alert("항목이 추가되었습니다.");
  };

  // 항목 삭제
  const handleDeleteItem = async (category: string, key: string, item: string, language?: string) => {
    if (confirm(`"${item}" 항목을 삭제하시겠습니까?`)) {
      const newCriteria = { ...detailedCriteria };
      
      if (category === 'global_competency' && language) {
        // 글로벌 역량의 경우 중첩된 구조 처리
        delete newCriteria[category as keyof typeof detailedCriteria][language][key][item];
      } else {
        // 일반적인 경우
        delete newCriteria[category as keyof typeof detailedCriteria][key][item];
      }
      
      setDetailedCriteria(newCriteria);
      
      // 서버에 저장
      await saveCriteriaToServer(newCriteria);
      
      alert("항목이 삭제되었습니다.");
    }
  };

  // 항목 수정
  const handleEditItem = async (category: string, key: string, item: string, score: number) => {
    setEditingItem({ category, key, item });
    setNewItemName(item);
    setNewItemScore(score);
  };

  // 항목 수정 완료
  const handleSaveEdit = async () => {
    if (!editingItem || !newItemName.trim() || newItemScore < 0) {
      alert("항목명과 점수를 입력해주세요.");
      return;
    }

    const newCriteria = { ...detailedCriteria };
    const { category, key, item: oldItem } = editingItem;
    
    // 기존 항목 삭제
    delete newCriteria[category as keyof typeof detailedCriteria][key][oldItem];
    // 새 항목 추가
    newCriteria[category as keyof typeof detailedCriteria][key][newItemName] = newItemScore;
    
    setDetailedCriteria(newCriteria);
    setEditingItem(null);
    setNewItemName("");
    setNewItemScore(0);
    
    // 서버에 저장
    await saveCriteriaToServer(newCriteria);
    
    alert("항목이 수정되었습니다.");
  };

  // 항목 수정 취소
  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemScore(0);
  };

  // 대항목 추가
  const handleAddMainItem = async (category: string) => {
    if (!newMainItemName.trim()) {
      alert("항목명을 입력해주세요.");
      return;
    }

    const newCriteria = { ...detailedCriteria };
    const categoryKey = category as keyof typeof detailedCriteria;
    
    if (!newCriteria[categoryKey]) {
      newCriteria[categoryKey] = {} as any;
    }
    
    // 새 대항목 추가 (빈 객체로 시작)
    (newCriteria[categoryKey] as any)[newMainItemName] = {};
    
    // 설명도 함께 저장
    setMainItemDescriptions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [newMainItemName]: newMainItemDescription
      }
    }));
    
    setDetailedCriteria(newCriteria);
    setNewMainItemName("");
    setNewMainItemDescription("");
    
    // 서버에 저장
    await saveCriteriaToServer(newCriteria);
    
    alert("대항목이 추가되었습니다.");
  };

  // 대항목 삭제
  const handleDeleteMainItem = async (category: string, key: string) => {
    if (!confirm(`'${key}' 항목을 삭제하시겠습니까?`)) {
      return;
    }

    const newCriteria = { ...detailedCriteria };
    const categoryKey = category as keyof typeof detailedCriteria;
    
    if (newCriteria[categoryKey]) {
      delete (newCriteria[categoryKey] as any)[key];
    }
    
    setDetailedCriteria(newCriteria);
    
    // 서버에 저장
    await saveCriteriaToServer(newCriteria);
    
    alert("대항목이 삭제되었습니다.");
  };

  // 대항목 편집 시작
  const handleEditMainItem = (category: string, key: string) => {
    setEditingMainItem({ category, key });
    setNewMainItemName(key);
    setNewMainItemDescription(getCategoryDescription(category, key));
  };

  // 대항목 편집 저장
  const handleSaveMainItemEdit = async () => {
    if (!editingMainItem || !newMainItemName.trim()) {
      alert("항목명을 입력해주세요.");
      return;
    }

    const { category, key: oldKey } = editingMainItem;
    const newCriteria = { ...detailedCriteria };
    const categoryKey = category as keyof typeof detailedCriteria;
    
    if (newCriteria[categoryKey]) {
      const oldData = (newCriteria[categoryKey] as any)[oldKey];
      delete (newCriteria[categoryKey] as any)[oldKey];
      (newCriteria[categoryKey] as any)[newMainItemName] = oldData;
      
      // 설명도 함께 저장
      setMainItemDescriptions(prev => {
        const newDescriptions = { ...prev };
        if (newDescriptions[category]) {
          delete newDescriptions[category][oldKey];
          newDescriptions[category][newMainItemName] = newMainItemDescription;
        } else {
          newDescriptions[category] = { [newMainItemName]: newMainItemDescription };
        }
        return newDescriptions;
      });
    }
    
    setDetailedCriteria(newCriteria);
    setEditingMainItem(null);
    setNewMainItemName("");
    setNewMainItemDescription("");
    
    // 서버에 저장
    await saveCriteriaToServer(newCriteria);
    
    alert("대항목이 수정되었습니다.");
  };

  // 대항목 편집 취소
  const handleCancelMainItemEdit = () => {
    setEditingMainItem(null);
    setNewMainItemName("");
    setNewMainItemDescription("");
  };

  const handleAutoCalculation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rd-evaluations/auto-calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAutoCalculationResult(result);
        alert("자동 평가가 완료되었습니다.");
      } else {
        alert("자동 평가 실행에 실패했습니다.");
      }
    } catch (error) {
      console.error("자동 평가 오류:", error);
      alert("자동 평가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      "technical_competency": "전문 기술 역량",
      "project_experience": "프로젝트 수행 경험",
      "rd_achievement": "연구개발 성과",
      "global_competency": "글로벌 역량",
      "knowledge_sharing": "기술 확산 및 자기계발",
      "innovation_proposal": "업무개선 및 혁신 제안"
    };
    return categoryNames[category] || category;
  };

  const getScoringMethodName = (method: string) => {
    const methodNames: { [key: string]: string } = {
      "manual": "수동 평가",
      "auto": "자동 계산",
      "hybrid": "혼합 방식"
    };
    return methodNames[method] || method;
  };

  const getScoringMethodColor = (method: string) => {
    switch (method) {
      case "manual": return "bg-blue-100 text-blue-800";
      case "auto": return "bg-green-100 text-green-800";
      case "hybrid": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderDetailedCriteria = (category: string, language?: string) => {
    let criteria;
    
    if (category === 'global_competency' && language) {
      // 글로벌 역량의 특정 언어만 렌더링
      criteria = detailedCriteria[category as keyof typeof detailedCriteria]?.[language as keyof typeof detailedCriteria.global_competency];
    } else {
      // 기존 방식
      criteria = detailedCriteria[category as keyof typeof detailedCriteria];
    }
    
    if (!criteria) {
      console.log('No criteria found for category:', category, 'language:', language);
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>설정할 수 있는 기준이 없습니다.</p>
        </div>
      );
    }

    // 글로벌 역량의 경우 언어별 탭 렌더링
    if (category === 'global_competency' && !language) {
      return (
        <div className="space-y-4">
          <Tabs defaultValue="english" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="english">영어</TabsTrigger>
              <TabsTrigger value="japanese">일본어</TabsTrigger>
              <TabsTrigger value="chinese">중국어</TabsTrigger>
            </TabsList>
            
            <TabsContent value="english" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">영어 어학능력 평가 기준</h4>
                {renderDetailedCriteria('global_competency', 'english')}
              </div>
            </TabsContent>
            
            <TabsContent value="japanese" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">일본어 어학능력 평가 기준</h4>
                {renderDetailedCriteria('global_competency', 'japanese')}
              </div>
            </TabsContent>
            
            <TabsContent value="chinese" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">중국어 어학능력 평가 기준</h4>
                {renderDetailedCriteria('global_competency', 'chinese')}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    const getCategoryDescription = (category: string, key: string, language?: string) => {
      // 기본 설명 반환 (동적으로 추가된 항목도 표시)
      const defaultDescriptions: { [key: string]: string } = {
        education: "최종학력에 따른 점수",
        experience: "입사일 기준 경력에 따른 점수",
        certifications: "보유 자격증에 따른 점수",
        leadership: "프로젝트에서의 역할에 따른 점수",
        count: "참여한 프로젝트 수에 따른 점수",
        patents: "특허 출원/등록에 따른 점수",
        publications: "논문 발표에 따른 점수",
        awards: "수상 실적에 따른 점수",
        toeic: "영어 TOEIC 점수 기준",
        toefl: "영어 TOEFL 점수 기준",
        ielts: "영어 IELTS 점수 기준",
        teps: "영어 TEPS 점수 기준",
        jlpt: "일본어 JLPT 등급 기준",
        jpt: "일본어 JPT 점수 기준",
        hsk: "중국어 HSK 등급 기준",
        tocfl: "중국어 TOCFL 등급 기준",
        training: "교육 이수 시간에 따른 점수",
        mentoring: "멘토링 활동 (수동 입력 필요)",
        instructor: "강의 활동에 따른 점수",
        adoption: "제안 채택 건수"
      };
      
      // 기본 설명이 있으면 반환, 없으면 일반적인 설명 반환
      return defaultDescriptions[key] || `${key}에 따른 점수`;
    };

    return (
      <div className="space-y-6">
        {/* 대항목 관리 섹션 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-medium mb-4">대항목 관리</h4>
          
          {/* 새 대항목 추가 */}
          <div className="mb-4 p-3 bg-white border rounded-lg">
            <h5 className="text-sm font-medium mb-2">새 대항목 추가</h5>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="대항목명 (예: 교육이수, 자격증)"
                value={newMainItemName}
                onChange={(e) => setNewMainItemName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="설명"
                value={newMainItemDescription}
                onChange={(e) => setNewMainItemDescription(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleAddMainItem(category)}
                disabled={!newMainItemName.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                대항목 추가
              </Button>
            </div>
          </div>

          {/* 기존 대항목 목록 */}
          <div className="space-y-2">
            {Object.entries(criteria).map(([key, values]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{key}</div>
                  <div className="text-sm text-gray-600">
                    {mainItemDescriptions[category]?.[key] || getCategoryDescription(category, key, language)}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditMainItem(category, key)}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteMainItem(category, key)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 대항목별 세부 항목 관리 */}
        {Object.entries(criteria).map(([key, values]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                {key}
              </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getCategoryDescription(category, key, language)}
                </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 기존 항목들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(values).map(([item, score]) => (
                    <div key={item} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={score}
                          onChange={(e) => {
                            const newCriteria = { ...detailedCriteria };
                            if (category === 'global_competency' && language) {
                              // 글로벌 역량의 경우 중첩된 구조 처리
                              newCriteria[category as keyof typeof detailedCriteria][language][key][item] = parseInt(e.target.value) || 0;
                            } else {
                              // 일반적인 경우
                              newCriteria[category as keyof typeof detailedCriteria][key][item] = parseInt(e.target.value) || 0;
                            }
                            setDetailedCriteria(newCriteria);
                          }}
                          className="w-20 text-center"
                          min="0"
                          max="100"
                        />
                        <span className="text-xs text-muted-foreground">점</span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(category, key, item, score)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(category, key, item, language)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 새 항목 추가 */}
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">새 항목 추가</h4>
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
                      onClick={() => handleAddItem(category, key)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      추가
                    </Button>
                  </div>
                </div>

        {/* 대항목 편집 모드 */}
        {editingMainItem && editingMainItem.category === category && editingMainItem.key === key && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium mb-3">대항목 수정</h4>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="대항목명"
                value={newMainItemName}
                onChange={(e) => setNewMainItemName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="설명"
                value={newMainItemDescription}
                onChange={(e) => setNewMainItemDescription(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleSaveMainItemEdit}
                disabled={!newMainItemName.trim()}
              >
                저장
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelMainItemEdit}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 편집 모드 */}
        {editingItem && editingItem.category === category && editingItem.key === key && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">항목 수정</h4>
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
                        onClick={handleSaveEdit}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" />
                        취소
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 저장 버튼 */}
              <div className="mt-4 pt-4 border-t">
                <Button 
                  size="sm" 
                  onClick={() => {
                    // 여기서 서버에 저장하는 로직 추가 가능
                    alert(`${key} 설정이 저장되었습니다.`);
                  }}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {key} 설정 저장
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="evaluation-criteria-description">
        <DialogHeader>
          <DialogTitle>R&D 역량평가 기준 설정</DialogTitle>
          <p id="evaluation-criteria-description" className="text-sm text-muted-foreground">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criteria.map((criterion) => (
                <Card key={criterion.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {getCategoryName(criterion.category)}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getScoringMethodColor(criterion.scoringMethod)}>
                          {getScoringMethodName(criterion.scoringMethod)}
                        </Badge>
                        {editingId === criterion.id ? (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleSave(criterion.id)}
                              disabled={loading}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(criterion)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingId === criterion.id ? (
                      // 편집 모드
                      <div className="space-y-4">
                        <div>
                          <Label>가중치 (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editData.weight * 100}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              weight: parseFloat(e.target.value) / 100
                            }))}
                          />
                        </div>
                        <div>
                          <Label>최대 점수</Label>
                          <Input
                            type="number"
                            min="1"
                            max="1000"
                            value={editData.maxScore}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              maxScore: parseInt(e.target.value)
                            }))}
                          />
                        </div>
                        <div>
                          <Label>평가 방식</Label>
                          <Select
                            value={editData.scoringMethod}
                            onValueChange={(value) => setEditData(prev => ({
                              ...prev,
                              scoringMethod: value
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">수동 평가</SelectItem>
                              <SelectItem value="auto">자동 계산</SelectItem>
                              <SelectItem value="hybrid">혼합 방식</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>설명</Label>
                          <Textarea
                            value={editData.description}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="평가 기준에 대한 설명을 입력하세요"
                          />
                        </div>
                      </div>
                    ) : (
                      // 보기 모드
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>가중치</span>
                            <span className="font-medium">{(criterion.weight * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={criterion.weight * 100} className="w-full" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>최대 점수</span>
                            <span className="font-medium">{criterion.maxScore}점</span>
                          </div>
                          <Progress value={(criterion.maxScore / 100) * 100} className="w-full" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">설명</p>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">{criterion.description || "설명이 없습니다."}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 가중치 요약 */}
            <Card>
              <CardHeader>
                <CardTitle>가중치 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criteria.map((criterion) => (
                    <div key={criterion.id} className="flex items-center justify-between">
                      <span className="text-sm">{getCategoryName(criterion.category)}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${criterion.weight * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(criterion.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-4">
                    <div className="flex items-center justify-between font-medium">
                      <span>총 가중치</span>
                      <span>
                        {criteria.reduce((sum, criterion) => sum + criterion.weight, 0) * 100}%
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
                      {detailedTab === key && renderDetailedCriteria(key)}
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
                  <Calculator className="w-5 h-5 mr-2" />
                  자동 평가 실행
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    시스템에 입력된 데이터를 기반으로 모든 직원의 6대 역량을 자동으로 평가합니다.
                  </p>
                </div>
                
                <Button 
                  onClick={handleAutoCalculation} 
                  disabled={loading}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading ? "평가 실행 중..." : "자동 평가 실행"}
                </Button>

                {autoCalculationResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>평가 결과</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {autoCalculationResult.totalEvaluations}
                          </p>
                          <p className="text-sm text-muted-foreground">평가 완료</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {autoCalculationResult.averageScore?.toFixed(1)}
                          </p>
                          <p className="text-sm text-muted-foreground">평균 점수</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {autoCalculationResult.sGrade || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">S등급</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {autoCalculationResult.departments || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">참여 부서</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 데이터 연동 탭 */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  데이터 연동 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">직원 기본 정보</h4>
                      <p className="text-sm text-muted-foreground">학력, 경력, 부서 정보</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">자격증 정보</h4>
                      <p className="text-sm text-muted-foreground">보유 자격증, 발급일, 등급</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">어학능력</h4>
                      <p className="text-sm text-muted-foreground">TOEIC, JLPT, 기타 언어 점수</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">프로젝트 경험</h4>
                      <p className="text-sm text-muted-foreground">참여 프로젝트, 역할, 기간</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">연구 성과</h4>
                      <p className="text-sm text-muted-foreground">특허, 논문, 수상 이력</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">교육 이력</h4>
                      <p className="text-sm text-muted-foreground">교육 이수 시간, 완료율</p>
                      <Badge className="mt-2">자동 연동</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">제안제도</h4>
                      <p className="text-sm text-muted-foreground">제안 채택, 포상 실적</p>
                      <Badge variant="outline" className="mt-2">수동 입력</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">멘토링</h4>
                      <p className="text-sm text-muted-foreground">멘토링 활동, 교육 진행</p>
                      <Badge variant="outline" className="mt-2">수동 입력</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 버튼 */}
        <div className="flex justify-end">
          <Button onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}