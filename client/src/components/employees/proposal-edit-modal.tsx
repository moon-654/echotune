import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { ProposalFormData } from "@/types/employee";

interface ProposalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export default function ProposalEditModal({ 
  isOpen, 
  onClose, 
  employeeId
}: ProposalEditModalProps) {
  const { toast } = useToast();
  
  const [proposals, setProposals] = useState<ProposalFormData[]>([]);
  const [newProposal, setNewProposal] = useState<ProposalFormData>({
    employeeId,
    title: "",
    description: "",
    category: "process",
    submissionDate: new Date(),
    status: "submitted",
    adoptionDate: undefined,
    rewardAmount: 0,
    rewardType: "recognition",
    impactLevel: "medium",
    implementationStatus: "pending",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 수정 모드 상태
  const [editingItem, setEditingItem] = useState<{
    id: string;
  } | null>(null);
  
  // 수정 중인 데이터
  const [editFormData, setEditFormData] = useState<ProposalFormData | null>(null);

  // 기존 제안 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadProposals = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/proposals?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedProposals = data.map((proposal: any) => ({
            id: proposal.id,
            employeeId: proposal.employeeId,
            title: proposal.title,
            description: proposal.description,
            category: proposal.category,
            submissionDate: proposal.submissionDate ? new Date(proposal.submissionDate) : new Date(),
            status: proposal.status,
            adoptionDate: proposal.adoptionDate ? new Date(proposal.adoptionDate) : undefined,
            rewardAmount: proposal.rewardAmount || 0,
            rewardType: proposal.rewardType || "recognition",
            impactLevel: proposal.impactLevel,
            implementationStatus: proposal.implementationStatus || "pending",
            notes: proposal.notes || ""
          }));
          setProposals(formattedProposals);
        } else {
          setProposals([]);
        }
      } catch (error) {
        console.error('🔍 제안제도 수정 모달 - 제안 데이터 로드 오류:', error);
        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposals();
  }, [isOpen, employeeId]);

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setEditFormData(null);
    }
  }, [isOpen]);

  const addNewProposal = () => {
    if (newProposal.title.trim()) {
      setProposals([...proposals, { ...newProposal }]);
      setNewProposal({
        employeeId,
        title: "",
        description: "",
        category: "process",
        submissionDate: new Date(),
        status: "submitted",
        adoptionDate: undefined,
        rewardAmount: 0,
        rewardType: "recognition",
        impactLevel: "medium",
        implementationStatus: "pending",
        notes: ""
      });
    }
  };

  const removeProposal = (index: number) => {
    setProposals(proposals.filter((_, i) => i !== index));
  };

  const updateProposal = (index: number, field: keyof ProposalFormData, value: any) => {
    const updatedProposals = [...proposals];
    updatedProposals[index] = { ...updatedProposals[index], [field]: value };
    setProposals(updatedProposals);
  };

  // 수정 관련 핸들러
  const handleEditClick = (index: number) => {
    setEditingItem({ id: index.toString() });
    setEditFormData({ ...proposals[index] });
  };

  const handleEditSave = async (index: number) => {
    if (!editFormData) return;
    
    setIsSaving(true);
    try {
      const updatedProposals = [...proposals];
      updatedProposals[index] = editFormData;
      setProposals(updatedProposals);
      
      setEditingItem(null);
      setEditFormData(null);
      
      toast({
        title: "성공",
        description: "제안이 수정되었습니다.",
      });
    } catch (error) {
      console.error('제안 수정 오류:', error);
      toast({
        title: "오류",
        description: "제안 수정에 실패했습니다.",
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
      
      // 기존 제안 삭제
      const deleteResponse = await fetch(`/api/proposals?employeeId=${employeeId}`, {
        method: 'DELETE'
      });

      // 새 제안들 저장
      for (const proposal of proposals) {
        const proposalData = {
          employeeId,
          title: proposal.title,
          description: proposal.description,
          category: proposal.category,
          submissionDate: proposal.submissionDate.toISOString(),
          status: proposal.status,
          adoptionDate: proposal.adoptionDate?.toISOString(),
          rewardAmount: proposal.rewardAmount,
          rewardType: proposal.rewardType,
          impactLevel: proposal.impactLevel,
          implementationStatus: proposal.implementationStatus,
          notes: proposal.notes
        };

        
        const response = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(proposalData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save proposal: ${proposal.title}`);
        }
      }

      toast({
        title: "성공",
        description: "제안제도 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 제안제도 저장 오류:', error);
      toast({
        title: "오류",
        description: "제안제도 정보 저장에 실패했습니다.",
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
          <DialogTitle>제안제도 이력 수정</DialogTitle>
          <DialogDescription>
            직원의 제안제도 이력을 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">제안제도 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 제안 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 제안 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">제안 제목</Label>
                  <Input
                    id="title"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    placeholder="제안 제목을 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={newProposal.category}
                    onValueChange={(value) => setNewProposal({ ...newProposal, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">프로세스 개선</SelectItem>
                      <SelectItem value="technology">기술 혁신</SelectItem>
                      <SelectItem value="safety">안전 개선</SelectItem>
                      <SelectItem value="quality">품질 향상</SelectItem>
                      <SelectItem value="cost">비용 절감</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="submissionDate">제출일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newProposal.submissionDate ? format(newProposal.submissionDate, "yyyy-MM-dd", { locale: ko }) : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newProposal.submissionDate}
                        onSelect={(date) => setNewProposal({ ...newProposal, submissionDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="status">상태</Label>
                  <Select
                    value={newProposal.status}
                    onValueChange={(value) => setNewProposal({ ...newProposal, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">제출</SelectItem>
                      <SelectItem value="under_review">검토 중</SelectItem>
                      <SelectItem value="approved">승인</SelectItem>
                      <SelectItem value="rejected">반려</SelectItem>
                      <SelectItem value="implemented">구현 완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="impactLevel">영향도</Label>
                  <Select
                    value={newProposal.impactLevel}
                    onValueChange={(value) => setNewProposal({ ...newProposal, impactLevel: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="implementationStatus">구현 상태</Label>
                  <Select
                    value={newProposal.implementationStatus}
                    onValueChange={(value) => setNewProposal({ ...newProposal, implementationStatus: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기</SelectItem>
                      <SelectItem value="in_progress">진행 중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">제안 내용</Label>
                <Textarea
                  id="description"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="제안 내용을 상세히 입력하세요"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="notes">비고</Label>
                <Textarea
                  id="notes"
                  value={newProposal.notes}
                  onChange={(e) => setNewProposal({ ...newProposal, notes: e.target.value })}
                  placeholder="추가 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewProposal} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                제안 추가
              </Button>
            </div>

            {/* 기존 제안 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">등록된 제안 ({proposals.length}건)</h3>
              {proposals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 제안이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {editingItem?.id === index.toString() ? (
                        // 편집 모드
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">제안 수정</h4>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSave(index)}
                                disabled={isSaving}
                              >
                                저장
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEditCancel}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>제안 제목</Label>
                              <Input
                                value={editFormData?.title || ''}
                                onChange={(e) => setEditFormData({ ...editFormData!, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>카테고리</Label>
                              <Select
                                value={editFormData?.category || 'process'}
                                onValueChange={(value) => setEditFormData({ ...editFormData!, category: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="process">프로세스 개선</SelectItem>
                                  <SelectItem value="technology">기술 혁신</SelectItem>
                                  <SelectItem value="safety">안전 개선</SelectItem>
                                  <SelectItem value="quality">품질 향상</SelectItem>
                                  <SelectItem value="cost">비용 절감</SelectItem>
                                  <SelectItem value="other">기타</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>제출일</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editFormData?.submissionDate ? format(editFormData.submissionDate, "yyyy-MM-dd", { locale: ko }) : "날짜 선택"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={editFormData?.submissionDate}
                                    onSelect={(date) => setEditFormData({ ...editFormData!, submissionDate: date || new Date() })}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label>상태</Label>
                              <Select
                                value={editFormData?.status || 'submitted'}
                                onValueChange={(value) => setEditFormData({ ...editFormData!, status: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="submitted">제출</SelectItem>
                                  <SelectItem value="under_review">검토 중</SelectItem>
                                  <SelectItem value="approved">승인</SelectItem>
                                  <SelectItem value="rejected">반려</SelectItem>
                                  <SelectItem value="implemented">구현 완료</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>영향도</Label>
                              <Select
                                value={editFormData?.impactLevel || 'medium'}
                                onValueChange={(value) => setEditFormData({ ...editFormData!, impactLevel: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">낮음</SelectItem>
                                  <SelectItem value="medium">보통</SelectItem>
                                  <SelectItem value="high">높음</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>구현 상태</Label>
                              <Select
                                value={editFormData?.implementationStatus || 'pending'}
                                onValueChange={(value) => setEditFormData({ ...editFormData!, implementationStatus: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">대기</SelectItem>
                                  <SelectItem value="in_progress">진행 중</SelectItem>
                                  <SelectItem value="completed">완료</SelectItem>
                                  <SelectItem value="cancelled">취소</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <Label>제안 내용</Label>
                              <Textarea
                                value={editFormData?.description || ''}
                                onChange={(e) => setEditFormData({ ...editFormData!, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>비고</Label>
                              <Textarea
                                value={editFormData?.notes || ''}
                                onChange={(e) => setEditFormData({ ...editFormData!, notes: e.target.value })}
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 읽기 전용 모드
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{proposal.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {proposal.category === 'process' ? '프로세스 개선' :
                               proposal.category === 'technology' ? '기술 혁신' :
                               proposal.category === 'safety' ? '안전 개선' :
                               proposal.category === 'quality' ? '품질 향상' :
                               proposal.category === 'cost' ? '비용 절감' : '기타'} • 
                              {proposal.status === 'submitted' ? '제출' :
                               proposal.status === 'under_review' ? '검토 중' :
                               proposal.status === 'approved' ? '승인' :
                               proposal.status === 'rejected' ? '반려' : '구현 완료'} • 
                              {proposal.impactLevel === 'low' ? '낮음' :
                               proposal.impactLevel === 'medium' ? '보통' : '높음'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              제출일: {format(proposal.submissionDate, "yyyy-MM-dd")}
                            </div>
                            {proposal.description && (
                              <div className="text-sm text-muted-foreground mt-2">
                                {proposal.description.length > 100 
                                  ? `${proposal.description.substring(0, 100)}...` 
                                  : proposal.description}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(index)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => removeProposal(index)}>
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
