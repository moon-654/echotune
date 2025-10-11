import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Language, InsertLanguage } from "@shared/schema";

// 언어별 시험 정보 정의 (R&D 역량평가 설정에서 동적으로 로드)
let LANGUAGE_TESTS = {
  English: {
    tests: [
      { value: 'TOEIC', label: 'TOEIC', hasScore: true, scoreRange: '10-990점' },
      { value: 'TOEFL', label: 'TOEFL iBT', hasScore: true, scoreRange: '0-120점' },
      { value: 'IELTS', label: 'IELTS', hasScore: true, scoreRange: '1.0-9.0점' },
      { value: 'TEPS', label: 'TEPS', hasScore: true, scoreRange: '0-600점' },
      { value: 'OPIc', label: 'OPIc', hasLevel: true, levels: ['Novice Low', 'Novice Mid', 'Novice High', 'Intermediate Low', 'Intermediate Mid', 'Intermediate High', 'Advanced Low', 'Advanced Mid', 'Advanced High', 'Superior'] }
    ]
  },
  Japanese: {
    tests: [
      { value: 'JLPT', label: 'JLPT', hasLevel: true, levels: ['N1', 'N2', 'N3', 'N4', 'N5'] },
      { value: 'JPT', label: 'JPT', hasScore: true, scoreRange: '10-990점' },
      { value: 'BJT', label: 'BJT', hasScore: true, scoreRange: '0-800점' },
      { value: 'NAT', label: 'NAT', hasLevel: true, levels: ['1급', '2급', '3급', '4급', '5급'] }
    ]
  },
  Chinese: {
    tests: [
      { value: 'HSK', label: 'HSK', hasLevel: true, levels: ['1급', '2급', '3급', '4급', '5급', '6급'] },
      { value: 'TOCFL', label: 'TOCFL', hasLevel: true, levels: ['Band A (Level 1)', 'Band A (Level 2)', 'Band B (Level 3)', 'Band B (Level 4)', 'Band C (Level 5)', 'Band C (Level 6)'] },
      { value: 'BCT', label: 'BCT', hasScore: true, scoreRange: '0-300점' }
    ]
  }
};

// R&D 역량평가 설정에서 언어 시험 정보를 동적으로 로드하는 함수
const loadLanguageTestsFromRdEvaluation = async () => {
  try {
    const response = await fetch('/api/rd-evaluation-criteria');
    if (response.ok) {
      const data = await response.json();
      if (data.languageTests) {
        LANGUAGE_TESTS = data.languageTests;
        console.log('🔄 R&D 역량평가 설정에서 언어 시험 정보 로드:', LANGUAGE_TESTS);
      }
    }
  } catch (error) {
    console.error('R&D 역량평가 설정 로드 오류:', error);
  }
};

// 지원 언어 목록
const SUPPORTED_LANGUAGES = [
  { value: 'English', label: '영어' },
  { value: 'Japanese', label: '일본어' },
  { value: 'Chinese', label: '중국어' },
  { value: 'Korean', label: '한국어' },
  { value: 'Spanish', label: '스페인어' },
  { value: 'French', label: '프랑스어' },
  { value: 'German', label: '독일어' },
  { value: 'Russian', label: '러시아어' },
  { value: 'Arabic', label: '아랍어' },
  { value: 'Portuguese', label: '포르투갈어' },
  { value: 'Italian', label: '이탈리아어' },
  { value: 'Other', label: '기타' }
];

interface LanguageEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface LanguageFormData {
  language: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'native';
  testType?: string;
  score?: number;
  maxScore?: number;
  testLevel?: string; // 등급 (N1, N2, HSK 6급 등)
  testDate?: Date;
  certificateUrl?: string;
  isActive: boolean;
  notes?: string;
}

export default function LanguageEditModal({ employeeId, isOpen, onClose }: LanguageEditModalProps) {
  const { toast } = useToast();
  
  const [languages, setLanguages] = useState<LanguageFormData[]>([]);
  const [newLanguage, setNewLanguage] = useState<LanguageFormData>({
    language: '',
    proficiencyLevel: 'beginner',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 수정 모드 상태
  const [editingItem, setEditingItem] = useState<{
    id: string;
  } | null>(null);
  
  // 수정 중인 데이터
  const [editFormData, setEditFormData] = useState<LanguageFormData | null>(null);

  // 기존 어학능력 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    // R&D 역량평가 설정에서 언어 시험 정보 로드
    loadLanguageTestsFromRdEvaluation();

    const loadLanguages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/language-skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedLanguages = data.map((lang: Language) => ({
            language: lang.language,
            proficiencyLevel: lang.proficiencyLevel as 'beginner' | 'intermediate' | 'advanced' | 'native',
            testType: lang.testType || '',
            score: lang.score || undefined,
            maxScore: lang.maxScore || undefined,
            testDate: lang.testDate ? new Date(lang.testDate) : undefined,
            certificateUrl: lang.certificateUrl || '',
            isActive: lang.isActive,
            notes: lang.notes || ''
          }));
          setLanguages(formattedLanguages);
        } else {
          setLanguages([]);
        }
      } catch (error) {
        console.error('어학능력 데이터 로드 오류:', error);
        setLanguages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, [isOpen, employeeId]);

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setEditFormData(null);
    }
  }, [isOpen]);

  const addNewLanguage = () => {
    if (newLanguage.language.trim()) {
      setLanguages([...languages, { ...newLanguage }]);
      setNewLanguage({
        language: '',
        proficiencyLevel: 'beginner',
        isActive: true
      });
    }
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const updateLanguage = (index: number, field: keyof LanguageFormData, value: any) => {
    const updatedLanguages = [...languages];
    updatedLanguages[index] = { ...updatedLanguages[index], [field]: value };
    setLanguages(updatedLanguages);
  };

  // 수정 관련 핸들러
  const handleEditClick = (index: number) => {
    setEditingItem({ id: index.toString() });
    setEditFormData({ ...languages[index] });
  };

  const handleEditSave = async (index: number) => {
    if (!editFormData) return;
    
    setIsSaving(true);
    try {
      const updatedLanguages = [...languages];
      updatedLanguages[index] = editFormData;
      setLanguages(updatedLanguages);
      
      setEditingItem(null);
      setEditFormData(null);
      
      toast({
        title: "성공",
        description: "언어가 수정되었습니다.",
      });
    } catch (error) {
      console.error('언어 수정 오류:', error);
      toast({
        title: "오류",
        description: "언어 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditFormData(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 기존 어학능력 삭제
      const deleteResponse = await fetch(`/api/language-skills?employeeId=${employeeId}`, {
        method: 'DELETE'
      });

      // 새 어학능력들 저장
      for (const language of languages) {
        const languageData: InsertLanguage = {
          employeeId,
          language: language.language,
          proficiencyLevel: language.proficiencyLevel,
          testType: language.testType,
          score: language.score,
          maxScore: language.maxScore,
          testDate: language.testDate?.toISOString(),
          certificateUrl: language.certificateUrl,
          isActive: language.isActive
        };

        const response = await fetch('/api/language-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(languageData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save language: ${language.language}`);
        }
      }
      toast({
        title: "성공",
        description: "어학능력 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('어학능력 저장 오류:', error);
      toast({
        title: "오류",
        description: "어학능력 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>어학능력 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 어학능력 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">어학능력 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 어학능력 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 어학능력 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">언어</Label>
                  <Select
                    value={newLanguage.language}
                    onValueChange={(value) => setNewLanguage({ ...newLanguage, language: value, testType: '', score: undefined, testLevel: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="언어를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="proficiencyLevel">수준</Label>
                  <Select
                    value={newLanguage.proficiencyLevel}
                    onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiencyLevel: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">초급</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                      <SelectItem value="native">원어민</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newLanguage.language && LANGUAGE_TESTS[newLanguage.language as keyof typeof LANGUAGE_TESTS] && (
                  <div>
                    <Label htmlFor="testType">시험 종류</Label>
                    <Select
                      value={newLanguage.testType || ''}
                      onValueChange={(value) => {
                        const selectedTest = LANGUAGE_TESTS[newLanguage.language as keyof typeof LANGUAGE_TESTS].tests.find(t => t.value === value);
                        setNewLanguage({ 
                          ...newLanguage, 
                          testType: value,
                          score: undefined,
                          testLevel: '',
                          maxScore: selectedTest?.hasScore ? (value === 'TOEIC' ? 990 : value === 'TOEFL' ? 120 : value === 'IELTS' ? 9 : value === 'TEPS' ? 600 : value === 'JPT' ? 990 : value === 'BJT' ? 800 : value === 'BCT' ? 300 : undefined) : undefined
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="시험 종류를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_TESTS[newLanguage.language as keyof typeof LANGUAGE_TESTS].tests.map((test) => (
                          <SelectItem key={test.value} value={test.value}>
                            {test.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newLanguage.testType && (() => {
                  const selectedTest = LANGUAGE_TESTS[newLanguage.language as keyof typeof LANGUAGE_TESTS]?.tests.find(t => t.value === newLanguage.testType);
                  if (selectedTest?.hasLevel) {
                    return (
                      <div>
                        <Label htmlFor="testLevel">등급</Label>
                        <Select
                          value={newLanguage.testLevel || ''}
                          onValueChange={(value) => setNewLanguage({ ...newLanguage, testLevel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="등급을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTest.levels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else if (selectedTest?.hasScore) {
                    return (
                      <div>
                        <Label htmlFor="score">점수</Label>
                        <Input
                          id="score"
                          type="number"
                          value={newLanguage.score || ''}
                          onChange={(e) => setNewLanguage({ ...newLanguage, score: parseInt(e.target.value) || undefined })}
                          placeholder={`예: ${selectedTest.scoreRange}`}
                          min="0"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                {newLanguage.testType && (() => {
                  const selectedTest = LANGUAGE_TESTS[newLanguage.language as keyof typeof LANGUAGE_TESTS]?.tests.find(t => t.value === newLanguage.testType);
                  if (selectedTest?.hasScore) {
                    return (
                      <div>
                        <Label htmlFor="maxScore">만점</Label>
                        <Input
                          id="maxScore"
                          type="number"
                          value={newLanguage.maxScore || ''}
                          onChange={(e) => setNewLanguage({ ...newLanguage, maxScore: parseInt(e.target.value) || undefined })}
                          placeholder={`예: ${selectedTest.scoreRange.split('-')[1]}`}
                          min="0"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                <div>
                  <Label htmlFor="testDate">시험일</Label>
                  <DatePicker
                    date={newLanguage.testDate}
                    onDateChange={(date) => setNewLanguage({ ...newLanguage, testDate: date })}
                    placeholder="시험일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="certificateUrl">자격증 URL</Label>
                  <Input
                    id="certificateUrl"
                    value={newLanguage.certificateUrl}
                    onChange={(e) => setNewLanguage({ ...newLanguage, certificateUrl: e.target.value })}
                    placeholder="예: https://example.com/certificate.pdf"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newLanguage.notes}
                  onChange={(e) => setNewLanguage({ ...newLanguage, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={3}
                />
              </div>
              <Button onClick={addNewLanguage} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                어학능력 추가
              </Button>
            </div>

            {/* 기존 어학능력 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">등록된 어학능력 ({languages.length}개)</h3>
              {languages.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">등록된 어학능력이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {languages.map((language, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      {editingItem && editingItem.id === index.toString() ? (
                        // 수정 모드 - 편집 폼
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>언어</Label>
                              <Select
                                value={editFormData?.language || ''}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, language: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SUPPORTED_LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.value} value={lang.value}>
                                      {lang.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>수준</Label>
                              <Select
                                value={editFormData?.proficiencyLevel || 'beginner'}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, proficiencyLevel: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="beginner">초급</SelectItem>
                                  <SelectItem value="intermediate">중급</SelectItem>
                                  <SelectItem value="advanced">고급</SelectItem>
                                  <SelectItem value="native">원어민</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>시험 종류</Label>
                              {editFormData?.language && LANGUAGE_TESTS[editFormData.language as keyof typeof LANGUAGE_TESTS] ? (
                                <Select
                                  value={editFormData?.testType || ''}
                                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, testType: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="시험 종류를 선택하세요" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {LANGUAGE_TESTS[editFormData.language as keyof typeof LANGUAGE_TESTS].tests.map((test) => (
                                      <SelectItem key={test.value} value={test.value}>
                                        {test.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={editFormData?.testType || ''}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, testType: e.target.value }))}
                                  placeholder="시험 종류를 입력하세요"
                                />
                              )}
                            </div>
                            {(() => {
                              const selectedTest = editFormData?.language && LANGUAGE_TESTS[editFormData.language as keyof typeof LANGUAGE_TESTS] 
                                ? LANGUAGE_TESTS[editFormData.language as keyof typeof LANGUAGE_TESTS].tests.find(t => t.value === editFormData?.testType)
                                : null;
                              
                              if (selectedTest?.hasLevel) {
                                return (
                                  <div>
                                    <Label>등급</Label>
                                    <Select
                                      value={editFormData?.testLevel || ''}
                                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, testLevel: value }))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="등급을 선택하세요" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectedTest.levels.map((level) => (
                                          <SelectItem key={level} value={level}>
                                            {level}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              } else if (selectedTest?.hasScore) {
                                return (
                                  <>
                                    <div>
                                      <Label>점수</Label>
                                      <Input
                                        type="number"
                                        value={editFormData?.score || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, score: parseInt(e.target.value) || undefined }))}
                                        placeholder={`예: ${selectedTest.scoreRange}`}
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <Label>만점</Label>
                                      <Input
                                        type="number"
                                        value={editFormData?.maxScore || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, maxScore: parseInt(e.target.value) || undefined }))}
                                        placeholder={`예: ${selectedTest.scoreRange.split('-')[1]}`}
                                        min="0"
                                      />
                                    </div>
                                  </>
                                );
                              } else {
                                return (
                                  <>
                                    <div>
                                      <Label>점수</Label>
                                      <Input
                                        type="number"
                                        value={editFormData?.score || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, score: parseInt(e.target.value) || undefined }))}
                                        min="0"
                                      />
                                    </div>
                                    <div>
                                      <Label>만점</Label>
                                      <Input
                                        type="number"
                                        value={editFormData?.maxScore || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, maxScore: parseInt(e.target.value) || undefined }))}
                                        min="0"
                                      />
                                    </div>
                                  </>
                                );
                              }
                            })()}
                            <div>
                              <Label>시험일</Label>
                              <DatePicker
                                date={editFormData?.testDate}
                                onDateChange={(date) => setEditFormData(prev => ({ ...prev, testDate: date }))}
                                placeholder="시험일 선택"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>자격증 URL</Label>
                              <Input
                                value={editFormData?.certificateUrl || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, certificateUrl: e.target.value }))}
                                placeholder="예: https://example.com/certificate.pdf"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>메모</Label>
                              <Textarea
                                value={editFormData?.notes || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="추가 정보나 메모"
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={handleEditCancel}>
                              취소
                            </Button>
                            <Button 
                              onClick={() => handleEditSave(index)}
                              disabled={isSaving}
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // 일반 모드 - 읽기 전용
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{language.language}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {language.proficiencyLevel === 'beginner' ? '초급' :
                               language.proficiencyLevel === 'intermediate' ? '중급' :
                               language.proficiencyLevel === 'advanced' ? '고급' : '원어민'}
                              {language.testType && ` • ${language.testType}`}
                              {language.testLevel && ` • ${language.testLevel}`}
                              {language.score && ` • ${language.score}점`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {language.testDate && `시험일: ${format(language.testDate, 'yyyy-MM-dd')}`}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeLanguage(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
