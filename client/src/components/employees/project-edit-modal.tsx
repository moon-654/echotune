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
import type { Project, InsertProject } from "@shared/schema";

interface ProjectEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectFormData {
  projectName: string;
  role: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  description?: string;
  technologies?: string;
  teamSize?: number;
  budget?: number;
  client?: string;
  notes?: string;
}

export default function ProjectEditModal({ employeeId, isOpen, onClose }: ProjectEditModalProps) {
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<ProjectFormData[]>([]);
  const [newProject, setNewProject] = useState<ProjectFormData>({
    projectName: '',
    role: '',
    status: 'planned'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 수정 모드 상태
  const [editingItem, setEditingItem] = useState<{
    id: string;
  } | null>(null);
  
  // 수정 중인 데이터
  const [editFormData, setEditFormData] = useState<ProjectFormData | null>(null);
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string; points?: number }>>([]);

  // R&D 상세설정의 프로젝트 리더십 기준과 연동 - 동적 로드
  useEffect(() => {
    if (!isOpen) return;
    const loadProjectRoleCriteria = async () => {
      try {
        const response = await fetch('/api/rd-evaluation-criteria');
        
        if (!response.ok) {
          console.error('❌ API 응답 실패:', response.status);
          return;
        }
        
        const criteria = await response.json();
        const leadership = criteria?.detailedCriteria?.project_experience?.leadership || {};
        
        // leadership 객체의 키들을 역할 옵션으로 변환
        const roleOptions = Object.keys(leadership).map(role => ({
          value: role, // 키를 그대로 사용 (예: "추가되는지 확인")
          label: role, // 표시명도 키와 동일
          points: leadership[role] // 점수
        }));
        
        setRoleOptions(roleOptions);
      } catch (error) {
        console.error('❌ 역할 옵션 로드 실패:', error);
        // 폴백: 기본 옵션 사용
        const fallbackOptions = [
          { value: 'project_leader', label: 'Project Leader', points: 15 },
          { value: 'core_member', label: '핵심 멤버', points: 10 },
          { value: 'member', label: '일반 멤버', points: 5 }
        ];
        setRoleOptions(fallbackOptions);
      }
    };
    loadProjectRoleCriteria();
  }, [isOpen]);

  // 기존 프로젝트 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadProjects = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/projects?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedProjects = data.map((project: Project) => ({
            projectName: project.projectName,
            role: project.role,
            status: project.status as 'planned' | 'active' | 'completed' | 'cancelled',
            startDate: project.startDate ? new Date(project.startDate) : undefined,
            endDate: project.endDate ? new Date(project.endDate) : undefined,
            description: project.description || '',
            technologies: project.technologies || '',
            teamSize: project.teamSize || 0,
            budget: project.budget || 0,
            client: project.client || '',
            notes: project.notes || ''
          }));
          setProjects(formattedProjects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('🔍 프로젝트 수정 모달 - 프로젝트 데이터 로드 오류:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [isOpen, employeeId]);

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setEditFormData(null);
    }
  }, [isOpen]);

  const addNewProject = () => {
    if (newProject.projectName.trim()) {
      setProjects([...projects, { ...newProject }]);
      setNewProject({
        projectName: '',
        role: '',
        status: 'planned'
      });
    }
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof ProjectFormData, value: any) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setProjects(updatedProjects);
  };

  // 수정 관련 핸들러
  const handleEditClick = (index: number) => {
    setEditingItem({ id: index.toString() });
    setEditFormData({ ...projects[index] });
  };

  const handleEditSave = async (index: number) => {
    if (!editFormData) return;
    
    setIsSaving(true);
    try {
      const updatedProjects = [...projects];
      updatedProjects[index] = editFormData;
      setProjects(updatedProjects);
      
      setEditingItem(null);
      setEditFormData(null);
      
      toast({
        title: "성공",
        description: "프로젝트가 수정되었습니다.",
      });
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      toast({
        title: "오류",
        description: "프로젝트 수정에 실패했습니다.",
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
      
      // 기존 프로젝트 삭제
      const deleteResponse = await fetch(`/api/projects?employeeId=${employeeId}`, {
        method: 'DELETE'
      });

      // 새 프로젝트들 저장
      for (const project of projects) {
        const projectData: InsertProject = {
          employeeId,
          projectName: project.projectName,
          role: project.role,
          status: project.status,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          description: project.description,
          technologies: project.technologies,
          teamSize: project.teamSize,
          budget: project.budget,
          client: project.client,
          notes: project.notes
        };

        
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save project: ${project.projectName}`);
        }
      }

      toast({
        title: "성공",
        description: "프로젝트 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 프로젝트 저장 오류:', error);
      toast({
        title: "오류",
        description: "프로젝트 정보 저장에 실패했습니다.",
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
          <DialogTitle>프로젝트 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 프로젝트 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">프로젝트 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 프로젝트 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 프로젝트 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">프로젝트명</Label>
                  <Input
                    id="projectName"
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    placeholder="예: EchoTune 시스템 개발"
                  />
                </div>
                <div>
                  <Label htmlFor="role">리더십/역할</Label>
                  <Select
                    value={newProject.role}
                    onValueChange={(value) => setNewProject({ ...newProject, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="역할 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.length === 0 ? (
                        <SelectItem value="loading" disabled>로딩 중...</SelectItem>
                      ) : (
                        roleOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={newProject.status}
                    onValueChange={(value) => setNewProject({ ...newProject, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">예정</SelectItem>
                      <SelectItem value="active">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="client">클라이언트</Label>
                  <Input
                    id="client"
                    value={newProject.client}
                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                    placeholder="예: ABC 회사"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">시작일</Label>
                  <DatePicker
                    date={newProject.startDate}
                    onDateChange={(date) => setNewProject({ ...newProject, startDate: date })}
                    placeholder="시작일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">종료일</Label>
                  <DatePicker
                    date={newProject.endDate}
                    onDateChange={(date) => setNewProject({ ...newProject, endDate: date })}
                    placeholder="종료일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="teamSize">팀 규모</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={newProject.teamSize || ''}
                    onChange={(e) => setNewProject({ ...newProject, teamSize: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">예산 (만원)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newProject.budget || ''}
                    onChange={(e) => setNewProject({ ...newProject, budget: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">프로젝트 설명</Label>
                <Textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="프로젝트에 대한 상세 설명"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="technologies">사용 기술</Label>
                <Input
                  id="technologies"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  placeholder="예: React, Node.js, PostgreSQL"
                />
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewProject} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                프로젝트 추가
              </Button>
            </div>

            {/* 기존 프로젝트 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">등록된 프로젝트 ({projects.length}개)</h3>
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">등록된 프로젝트가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((project, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      {editingItem && editingItem.id === index.toString() ? (
                        // 수정 모드 - 편집 폼
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>프로젝트명</Label>
                              <Input
                                value={editFormData?.projectName || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, projectName: e.target.value }))}
                                placeholder="예: EchoTune 시스템 개발"
                              />
                            </div>
                            <div>
                              <Label>리더십/역할</Label>
                              <Select
                                value={editFormData?.role || ''}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="역할 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>상태</Label>
                              <Select
                                value={editFormData?.status || 'planned'}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planned">예정</SelectItem>
                                  <SelectItem value="active">진행중</SelectItem>
                                  <SelectItem value="completed">완료</SelectItem>
                                  <SelectItem value="cancelled">취소</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>클라이언트</Label>
                              <Input
                                value={editFormData?.client || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, client: e.target.value }))}
                                placeholder="예: ABC 회사"
                              />
                            </div>
                            <div>
                              <Label>시작일</Label>
                              <DatePicker
                                date={editFormData?.startDate}
                                onDateChange={(date) => setEditFormData(prev => ({ ...prev, startDate: date }))}
                                placeholder="시작일 선택"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>종료일</Label>
                              <DatePicker
                                date={editFormData?.endDate}
                                onDateChange={(date) => setEditFormData(prev => ({ ...prev, endDate: date }))}
                                placeholder="종료일 선택"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>팀 규모</Label>
                              <Input
                                type="number"
                                value={editFormData?.teamSize || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 0 }))}
                                min="0"
                              />
                            </div>
                            <div>
                              <Label>예산 (만원)</Label>
                              <Input
                                type="number"
                                value={editFormData?.budget || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                                min="0"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>프로젝트 설명</Label>
                              <Textarea
                                value={editFormData?.description || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="프로젝트에 대한 상세 설명"
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>사용 기술</Label>
                              <Input
                                value={editFormData?.technologies || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, technologies: e.target.value }))}
                                placeholder="예: React, Node.js, PostgreSQL"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>메모</Label>
                              <Textarea
                                value={editFormData?.notes || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="추가 정보나 메모"
                                rows={2}
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
                            <div className="font-medium">{project.projectName}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {project.role && `${roleOptions.find(opt => opt.value === project.role)?.label || project.role} • `}
                              {project.status === 'planned' ? '예정' : 
                               project.status === 'active' ? '진행중' :
                               project.status === 'completed' ? '완료' : '취소'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {project.startDate && `시작: ${format(project.startDate, 'yyyy-MM-dd')}`}
                              {project.endDate && ` • 종료: ${format(project.endDate, 'yyyy-MM-dd')}`}
                              {project.client && ` • 클라이언트: ${project.client}`}
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
                              onClick={() => removeProject(index)}
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