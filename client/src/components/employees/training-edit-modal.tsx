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
import type { TrainingHistory, InsertTrainingHistory } from "@shared/schema";

interface TrainingEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TrainingFormData {
  courseName: string;
  provider: string;
  type: 'required' | 'optional' | 'certification';
  category: string;
  startDate?: Date;
  completionDate?: Date;
  duration?: number;
  score?: number;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  certificateUrl?: string;
  notes?: string;
}

export default function TrainingEditModal({ employeeId, isOpen, onClose }: TrainingEditModalProps) {
  const { toast } = useToast();
  
  const [trainings, setTrainings] = useState<TrainingFormData[]>([]);
  const [newTraining, setNewTraining] = useState<TrainingFormData>({
    courseName: '',
    provider: '',
    type: 'optional',
    category: '',
    status: 'planned'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 교육 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadTrainings = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 교육 수정 모달 - 교육 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/training-history?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 교육 수정 모달 - 교육 데이터 로드 성공:', data);
          const formattedTrainings = data.map((training: TrainingHistory) => ({
            courseName: training.courseName,
            provider: training.provider,
            type: training.type as 'required' | 'optional' | 'certification',
            category: training.category || '',
            startDate: training.startDate ? new Date(training.startDate) : undefined,
            completionDate: training.completionDate ? new Date(training.completionDate) : undefined,
            duration: training.duration || 0,
            score: training.score || undefined,
            status: training.status as 'planned' | 'ongoing' | 'completed' | 'cancelled',
            certificateUrl: training.certificateUrl || '',
            notes: training.notes || ''
          }));
          setTrainings(formattedTrainings);
        } else {
          console.log('🔍 교육 수정 모달 - 교육 데이터 없음');
          setTrainings([]);
        }
      } catch (error) {
        console.error('🔍 교육 수정 모달 - 교육 데이터 로드 오류:', error);
        setTrainings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrainings();
  }, [isOpen, employeeId]);

  const addNewTraining = () => {
    if (newTraining.courseName.trim()) {
      setTrainings([...trainings, { ...newTraining }]);
      setNewTraining({
        courseName: '',
        provider: '',
        type: 'optional',
        category: '',
        status: 'planned'
      });
    }
  };

  const removeTraining = (index: number) => {
    setTrainings(trainings.filter((_, i) => i !== index));
  };

  const updateTraining = (index: number, field: keyof TrainingFormData, value: any) => {
    const updatedTrainings = [...trainings];
    updatedTrainings[index] = { ...updatedTrainings[index], [field]: value };
    setTrainings(updatedTrainings);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 교육 저장 시작:', trainings);
      
      // 기존 교육 삭제
      const deleteResponse = await fetch(`/api/training-history?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 교육 삭제 결과:', deleteResponse.status);

      // 새 교육들 저장
      for (const training of trainings) {
        const trainingData: InsertTrainingHistory = {
          employeeId,
          courseName: training.courseName,
          provider: training.provider,
          type: training.type,
          category: training.category,
          startDate: training.startDate?.toISOString(),
          completionDate: training.completionDate?.toISOString(),
          duration: training.duration,
          score: training.score,
          status: training.status,
          certificateUrl: training.certificateUrl,
          notes: training.notes
        };

        console.log('🔍 교육 저장 데이터:', trainingData);
        
        const response = await fetch('/api/training-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trainingData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save training: ${training.courseName}`);
        }
      }

      console.log('🔍 교육 저장 완료');
      toast({
        title: "성공",
        description: "교육 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 교육 저장 오류:', error);
      toast({
        title: "오류",
        description: "교육 정보 저장에 실패했습니다.",
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
          <DialogTitle>교육 이력 수정</DialogTitle>
          <DialogDescription>
            직원의 교육 이력을 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">교육 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 교육 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 교육 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseName">과정명</Label>
                  <Input
                    id="courseName"
                    value={newTraining.courseName}
                    onChange={(e) => setNewTraining({ ...newTraining, courseName: e.target.value })}
                    placeholder="예: React 고급 패턴"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">제공기관</Label>
                  <Input
                    id="provider"
                    value={newTraining.provider}
                    onChange={(e) => setNewTraining({ ...newTraining, provider: e.target.value })}
                    placeholder="예: 온라인, 회사"
                  />
                </div>
                <div>
                  <Label htmlFor="type">교육 유형</Label>
                  <Select
                    value={newTraining.type}
                    onValueChange={(value) => setNewTraining({ ...newTraining, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">필수</SelectItem>
                      <SelectItem value="optional">선택</SelectItem>
                      <SelectItem value="certification">자격증</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Input
                    id="category"
                    value={newTraining.category}
                    onChange={(e) => setNewTraining({ ...newTraining, category: e.target.value })}
                    placeholder="예: 기술, 리더십"
                  />
                </div>
                <div>
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={newTraining.status}
                    onValueChange={(value) => setNewTraining({ ...newTraining, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">예정</SelectItem>
                      <SelectItem value="ongoing">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">시작일</Label>
                  <DatePicker
                    date={newTraining.startDate}
                    onDateChange={(date) => setNewTraining({ ...newTraining, startDate: date })}
                    placeholder="시작일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="completionDate">완료일</Label>
                  <DatePicker
                    date={newTraining.completionDate}
                    onDateChange={(date) => setNewTraining({ ...newTraining, completionDate: date })}
                    placeholder="완료일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">소요시간 (시간)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newTraining.duration || ''}
                    onChange={(e) => setNewTraining({ ...newTraining, duration: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="score">점수</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newTraining.score || ''}
                    onChange={(e) => setNewTraining({ ...newTraining, score: parseInt(e.target.value) || undefined })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newTraining.notes}
                  onChange={(e) => setNewTraining({ ...newTraining, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewTraining} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                교육 추가
              </Button>
            </div>

            {/* 기존 교육 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">등록된 교육 ({trainings.length}개)</h3>
              {trainings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 교육이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {trainings.map((training, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{training.courseName}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTraining(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>과정명</Label>
                          <Input
                            value={training.courseName}
                            onChange={(e) => updateTraining(index, 'courseName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>제공기관</Label>
                          <Input
                            value={training.provider}
                            onChange={(e) => updateTraining(index, 'provider', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>교육 유형</Label>
                          <Select
                            value={training.type}
                            onValueChange={(value) => updateTraining(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="required">필수</SelectItem>
                              <SelectItem value="optional">선택</SelectItem>
                              <SelectItem value="certification">자격증</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>상태</Label>
                          <Select
                            value={training.status}
                            onValueChange={(value) => updateTraining(index, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">예정</SelectItem>
                              <SelectItem value="ongoing">진행중</SelectItem>
                              <SelectItem value="completed">완료</SelectItem>
                              <SelectItem value="cancelled">취소</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>시작일</Label>
                          <DatePicker
                            date={training.startDate}
                            onDateChange={(date) => updateTraining(index, 'startDate', date)}
                            placeholder="시작일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>완료일</Label>
                          <DatePicker
                            date={training.completionDate}
                            onDateChange={(date) => updateTraining(index, 'completionDate', date)}
                            placeholder="완료일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>소요시간 (시간)</Label>
                          <Input
                            type="number"
                            value={training.duration || ''}
                            onChange={(e) => updateTraining(index, 'duration', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>점수</Label>
                          <Input
                            type="number"
                            value={training.score || ''}
                            onChange={(e) => updateTraining(index, 'score', parseInt(e.target.value) || undefined)}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>메모</Label>
                          <Textarea
                            value={training.notes}
                            onChange={(e) => updateTraining(index, 'notes', e.target.value)}
                            placeholder="추가 정보나 메모"
                            rows={2}
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