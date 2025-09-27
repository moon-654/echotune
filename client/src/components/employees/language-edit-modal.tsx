import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Language, InsertLanguage } from "@shared/schema";

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

  // 기존 어학능력 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadLanguages = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 어학능력 수정 모달 - 어학능력 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/language-skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 어학능력 수정 모달 - 어학능력 데이터 로드 성공:', data);
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
          console.log('🔍 어학능력 수정 모달 - 어학능력 데이터 없음');
          setLanguages([]);
        }
      } catch (error) {
        console.error('🔍 어학능력 수정 모달 - 어학능력 데이터 로드 오류:', error);
        setLanguages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, [isOpen, employeeId]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 어학능력 저장 시작:', languages);
      
      // 기존 어학능력 삭제
      const deleteResponse = await fetch(`/api/language-skills?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 어학능력 삭제 결과:', deleteResponse.status);

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

        console.log('🔍 어학능력 저장 데이터:', languageData);
        
        const response = await fetch('/api/language-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(languageData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save language: ${language.language}`);
        }
      }

      console.log('🔍 어학능력 저장 완료');
      toast({
        title: "성공",
        description: "어학능력 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 어학능력 저장 오류:', error);
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
                  <Input
                    id="language"
                    value={newLanguage.language}
                    onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                    placeholder="예: English, Chinese, Japanese"
                  />
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
                <div>
                  <Label htmlFor="testType">시험 종류</Label>
                  <Input
                    id="testType"
                    value={newLanguage.testType}
                    onChange={(e) => setNewLanguage({ ...newLanguage, testType: e.target.value })}
                    placeholder="예: TOEIC, TOEFL, JLPT, HSK"
                  />
                </div>
                <div>
                  <Label htmlFor="score">점수</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newLanguage.score || ''}
                    onChange={(e) => setNewLanguage({ ...newLanguage, score: parseInt(e.target.value) || undefined })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxScore">만점</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={newLanguage.maxScore || ''}
                    onChange={(e) => setNewLanguage({ ...newLanguage, maxScore: parseInt(e.target.value) || undefined })}
                    min="0"
                  />
                </div>
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
              <h3 className="text-lg font-semibold">등록된 어학능력 ({languages.length}개)</h3>
              {languages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 어학능력이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {languages.map((language, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{language.language}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLanguage(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>언어</Label>
                          <Input
                            value={language.language}
                            onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>수준</Label>
                          <Select
                            value={language.proficiencyLevel}
                            onValueChange={(value) => updateLanguage(index, 'proficiencyLevel', value)}
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
                          <Input
                            value={language.testType}
                            onChange={(e) => updateLanguage(index, 'testType', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>점수</Label>
                          <Input
                            type="number"
                            value={language.score || ''}
                            onChange={(e) => updateLanguage(index, 'score', parseInt(e.target.value) || undefined)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>만점</Label>
                          <Input
                            type="number"
                            value={language.maxScore || ''}
                            onChange={(e) => updateLanguage(index, 'maxScore', parseInt(e.target.value) || undefined)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>시험일</Label>
                          <DatePicker
                            date={language.testDate}
                            onDateChange={(date) => updateLanguage(index, 'testDate', date)}
                            placeholder="시험일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>자격증 URL</Label>
                          <Input
                            value={language.certificateUrl}
                            onChange={(e) => updateLanguage(index, 'certificateUrl', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>메모</Label>
                          <Textarea
                            value={language.notes}
                            onChange={(e) => updateLanguage(index, 'notes', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
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
