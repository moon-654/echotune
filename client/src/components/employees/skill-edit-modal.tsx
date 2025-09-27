import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Skill, InsertSkill } from "@shared/schema";

interface SkillEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SkillFormData {
  skillType: 'technical' | 'soft' | 'leadership' | 'domain';
  skillName: string;
  proficiencyLevel: number;
  yearsOfExperience?: number;
  lastAssessedDate?: Date;
  assessedBy?: string;
  notes?: string;
}

export default function SkillEditModal({ employeeId, isOpen, onClose }: SkillEditModalProps) {
  const { toast } = useToast();
  
  const [skills, setSkills] = useState<SkillFormData[]>([]);
  const [newSkill, setNewSkill] = useState<SkillFormData>({
    skillType: 'technical',
    skillName: '',
    proficiencyLevel: 50,
    yearsOfExperience: 0,
    assessedBy: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 스킬 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadSkills = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 스킬 수정 모달 - 스킬 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/skills?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 스킬 수정 모달 - 스킬 데이터 로드 성공:', data);
          const formattedSkills = data.map((skill: Skill) => ({
            skillType: skill.skillType as 'technical' | 'soft' | 'leadership' | 'domain',
            skillName: skill.skillName,
            proficiencyLevel: skill.proficiencyLevel,
            yearsOfExperience: skill.yearsOfExperience || 0,
            lastAssessedDate: skill.lastAssessedDate ? new Date(skill.lastAssessedDate) : undefined,
            assessedBy: skill.assessedBy || '',
            notes: skill.notes || ''
          }));
          setSkills(formattedSkills);
        } else {
          console.log('🔍 스킬 수정 모달 - 스킬 데이터 없음');
          setSkills([]);
        }
      } catch (error) {
        console.error('🔍 스킬 수정 모달 - 스킬 데이터 로드 오류:', error);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkills();
  }, [isOpen, employeeId]);

  const addNewSkill = () => {
    if (newSkill.skillName.trim()) {
      setSkills([...skills, { ...newSkill }]);
      setNewSkill({
        skillType: 'technical',
        skillName: '',
        proficiencyLevel: 50,
        yearsOfExperience: 0,
        assessedBy: ''
      });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof SkillFormData, value: any) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setSkills(updatedSkills);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 스킬 저장 시작:', skills);
      
      // 기존 스킬 삭제
      const deleteResponse = await fetch(`/api/skills?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 스킬 삭제 결과:', deleteResponse.status);

      // 새 스킬들 저장
      for (const skill of skills) {
        const skillData: InsertSkill = {
          employeeId,
          skillType: skill.skillType,
          skillName: skill.skillName,
          proficiencyLevel: skill.proficiencyLevel,
          yearsOfExperience: skill.yearsOfExperience,
          lastAssessedDate: skill.lastAssessedDate?.toISOString(),
          assessedBy: skill.assessedBy,
          notes: skill.notes
        };

        console.log('🔍 스킬 저장 데이터:', skillData);
        
        const response = await fetch('/api/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(skillData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save skill: ${skill.skillName}`);
        }
      }

      console.log('🔍 스킬 저장 완료');
      toast({
        title: "성공",
        description: "스킬 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 스킬 저장 오류:', error);
      toast({
        title: "오류",
        description: "스킬 정보 저장에 실패했습니다.",
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
          <DialogTitle>스킬 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 스킬 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">스킬 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 스킬 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 스킬 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="skillType">스킬 유형</Label>
                  <Select
                    value={newSkill.skillType}
                    onValueChange={(value) => setNewSkill({ ...newSkill, skillType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">기술적</SelectItem>
                      <SelectItem value="soft">소프트 스킬</SelectItem>
                      <SelectItem value="leadership">리더십</SelectItem>
                      <SelectItem value="domain">도메인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="skillName">스킬명</Label>
                  <Input
                    id="skillName"
                    value={newSkill.skillName}
                    onChange={(e) => setNewSkill({ ...newSkill, skillName: e.target.value })}
                    placeholder="예: JavaScript, React, Python"
                  />
                </div>
                <div>
                  <Label htmlFor="proficiencyLevel">숙련도: {newSkill.proficiencyLevel}%</Label>
                  <Slider
                    value={[newSkill.proficiencyLevel]}
                    onValueChange={([value]) => setNewSkill({ ...newSkill, proficiencyLevel: value })}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsOfExperience">경력 (년)</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    value={newSkill.yearsOfExperience}
                    onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="assessedBy">평가자</Label>
                  <Input
                    id="assessedBy"
                    value={newSkill.assessedBy}
                    onChange={(e) => setNewSkill({ ...newSkill, assessedBy: e.target.value })}
                    placeholder="평가자 이름"
                  />
                </div>
                <div>
                  <Label htmlFor="lastAssessedDate">최근 평가일</Label>
                  <DatePicker
                    date={newSkill.lastAssessedDate}
                    onDateChange={(date) => setNewSkill({ ...newSkill, lastAssessedDate: date })}
                    placeholder="평가일 선택"
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newSkill.notes}
                  onChange={(e) => setNewSkill({ ...newSkill, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewSkill} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                스킬 추가
              </Button>
            </div>

            {/* 기존 스킬 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">등록된 스킬 ({skills.length}개)</h3>
              {skills.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 스킬이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {skills.map((skill, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{skill.skillName}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSkill(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>스킬 유형</Label>
                          <Select
                            value={skill.skillType}
                            onValueChange={(value) => updateSkill(index, 'skillType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">기술적</SelectItem>
                              <SelectItem value="soft">소프트 스킬</SelectItem>
                              <SelectItem value="leadership">리더십</SelectItem>
                              <SelectItem value="domain">도메인</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>숙련도: {skill.proficiencyLevel}%</Label>
                          <Slider
                            value={[skill.proficiencyLevel]}
                            onValueChange={([value]) => updateSkill(index, 'proficiencyLevel', value)}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>경력 (년)</Label>
                          <Input
                            type="number"
                            value={skill.yearsOfExperience}
                            onChange={(e) => updateSkill(index, 'yearsOfExperience', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label>평가자</Label>
                          <Input
                            value={skill.assessedBy}
                            onChange={(e) => updateSkill(index, 'assessedBy', e.target.value)}
                            placeholder="평가자 이름"
                          />
                        </div>
                        <div>
                          <Label>최근 평가일</Label>
                          <DatePicker
                            date={skill.lastAssessedDate}
                            onDateChange={(date) => updateSkill(index, 'lastAssessedDate', date)}
                            placeholder="평가일 선택"
                            className="w-full"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>메모</Label>
                          <Textarea
                            value={skill.notes}
                            onChange={(e) => updateSkill(index, 'notes', e.target.value)}
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