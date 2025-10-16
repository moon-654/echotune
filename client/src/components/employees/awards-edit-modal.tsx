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
import type { Award, InsertAward } from "@shared/schema";

interface AwardsEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AwardFormData {
  name: string;
  issuer: string;
  awardDate?: Date;
  category: 'performance' | 'innovation' | 'leadership' | 'teamwork' | 'other';
  level: 'company' | 'department' | 'team' | 'external';
  description?: string;
  certificateUrl?: string;
  notes?: string;
}

export default function AwardsEditModal({ employeeId, isOpen, onClose }: AwardsEditModalProps) {
  const { toast } = useToast();
  
  const [awards, setAwards] = useState<AwardFormData[]>([]);
  const [newAward, setNewAward] = useState<AwardFormData>({
    name: '',
    issuer: '',
    category: 'performance',
    level: 'company'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 수상 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadAwards = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/awards?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedAwards = data.map((award: Award) => ({
            name: award.name,
            issuer: award.issuer,
            awardDate: award.awardDate ? new Date(award.awardDate) : undefined,
            category: award.category as 'performance' | 'innovation' | 'leadership' | 'teamwork' | 'other',
            level: award.level as 'company' | 'department' | 'team' | 'external',
            description: award.description || '',
            certificateUrl: award.certificateUrl || '',
            notes: award.notes || ''
          }));
          setAwards(formattedAwards);
        } else {
          setAwards([]);
        }
      } catch (error) {
        console.error('🔍 수상 수정 모달 - 수상 데이터 로드 오류:', error);
        setAwards([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAwards();
  }, [isOpen, employeeId]);

  const addNewAward = () => {
    if (newAward.name.trim()) {
      setAwards([...awards, { ...newAward }]);
      setNewAward({
        name: '',
        issuer: '',
        category: 'performance',
        level: 'company'
      });
    }
  };

  const removeAward = (index: number) => {
    setAwards(awards.filter((_, i) => i !== index));
  };

  const updateAward = (index: number, field: keyof AwardFormData, value: any) => {
    const updatedAwards = [...awards];
    updatedAwards[index] = { ...updatedAwards[index], [field]: value };
    setAwards(updatedAwards);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      
      // 기존 수상 삭제
      const deleteResponse = await fetch(`/api/awards?employeeId=${employeeId}`, {
        method: 'DELETE'
      });

      // 새 수상들 저장
      for (const award of awards) {
        const awardData: InsertAward = {
          employeeId,
          name: award.name,
          issuer: award.issuer,
          awardDate: award.awardDate?.toISOString(),
          category: award.category,
          level: award.level,
          description: award.description,
          certificateUrl: award.certificateUrl,
          notes: award.notes
        };

        
        const response = await fetch('/api/awards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(awardData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save award: ${award.name}`);
        }
      }

      toast({
        title: "성공",
        description: "수상 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 수상 저장 오류:', error);
      toast({
        title: "오류",
        description: "수상 정보 저장에 실패했습니다.",
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
          <DialogTitle>수상 이력 수정</DialogTitle>
          <DialogDescription>
            직원의 수상 이력을 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">수상 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 수상 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 수상 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="awardName">수상명</Label>
                  <Input
                    id="awardName"
                    value={newAward.name}
                    onChange={(e) => setNewAward({ ...newAward, name: e.target.value })}
                    placeholder="예: 우수 개발자상"
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">수여기관</Label>
                  <Input
                    id="issuer"
                    value={newAward.issuer}
                    onChange={(e) => setNewAward({ ...newAward, issuer: e.target.value })}
                    placeholder="예: 회사, 부서"
                  />
                </div>
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={newAward.category}
                    onValueChange={(value) => setNewAward({ ...newAward, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">성과</SelectItem>
                      <SelectItem value="innovation">혁신</SelectItem>
                      <SelectItem value="leadership">리더십</SelectItem>
                      <SelectItem value="teamwork">팀워크</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">수준</Label>
                  <Select
                    value={newAward.level}
                    onValueChange={(value) => setNewAward({ ...newAward, level: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">회사</SelectItem>
                      <SelectItem value="department">부서</SelectItem>
                      <SelectItem value="team">팀</SelectItem>
                      <SelectItem value="external">외부</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="awardDate">수상일</Label>
                  <DatePicker
                    date={newAward.awardDate}
                    onDateChange={(date) => setNewAward({ ...newAward, awardDate: date })}
                    placeholder="수상일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="certificateUrl">증서 URL</Label>
                  <Input
                    id="certificateUrl"
                    value={newAward.certificateUrl}
                    onChange={(e) => setNewAward({ ...newAward, certificateUrl: e.target.value })}
                    placeholder="예: https://example.com/certificate.pdf"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">수상 설명</Label>
                <Textarea
                  id="description"
                  value={newAward.description}
                  onChange={(e) => setNewAward({ ...newAward, description: e.target.value })}
                  placeholder="수상에 대한 상세 설명"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newAward.notes}
                  onChange={(e) => setNewAward({ ...newAward, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewAward} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                수상 추가
              </Button>
            </div>

            {/* 기존 수상 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">등록된 수상 ({awards.length}건)</h3>
              {awards.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 수상이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {awards.map((award, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{award.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAward(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>수상명</Label>
                          <Input
                            value={award.name}
                            onChange={(e) => updateAward(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>수여기관</Label>
                          <Input
                            value={award.issuer}
                            onChange={(e) => updateAward(index, 'issuer', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>카테고리</Label>
                          <Select
                            value={award.category}
                            onValueChange={(value) => updateAward(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="performance">성과</SelectItem>
                              <SelectItem value="innovation">혁신</SelectItem>
                              <SelectItem value="leadership">리더십</SelectItem>
                              <SelectItem value="teamwork">팀워크</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>수준</Label>
                          <Select
                            value={award.level}
                            onValueChange={(value) => updateAward(index, 'level', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="company">회사</SelectItem>
                              <SelectItem value="department">부서</SelectItem>
                              <SelectItem value="team">팀</SelectItem>
                              <SelectItem value="external">외부</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>수상일</Label>
                          <DatePicker
                            date={award.awardDate}
                            onDateChange={(date) => updateAward(index, 'awardDate', date)}
                            placeholder="수상일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>증서 URL</Label>
                          <Input
                            value={award.certificateUrl}
                            onChange={(e) => updateAward(index, 'certificateUrl', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>수상 설명</Label>
                          <Textarea
                            value={award.description}
                            onChange={(e) => updateAward(index, 'description', e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>메모</Label>
                          <Textarea
                            value={award.notes}
                            onChange={(e) => updateAward(index, 'notes', e.target.value)}
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