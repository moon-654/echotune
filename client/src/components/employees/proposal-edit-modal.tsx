import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ProposalFormData } from "@/types/employee";

interface ProposalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProposalFormData) => void;
  employeeId: string;
  proposal?: ProposalFormData;
}

export default function ProposalEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  employeeId, 
  proposal 
}: ProposalEditModalProps) {
  const [formData, setFormData] = useState<ProposalFormData>({
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proposal) {
      setFormData(proposal);
    } else {
      setFormData({
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
  }, [proposal, employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("제안제도 저장 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProposalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="proposal-edit-description">
        <DialogHeader>
          <DialogTitle>
            {proposal ? "제안제도 수정" : "제안제도 추가"}
          </DialogTitle>
          <p id="proposal-edit-description" className="text-sm text-muted-foreground">
            {proposal ? "제안제도 정보를 수정하세요." : "새로운 제안제도를 추가하세요."}
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">제안 제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="제안 제목을 입력하세요"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">제안 내용 *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="제안 내용을 상세히 입력하세요"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>제출일 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.submissionDate ? format(formData.submissionDate, "yyyy-MM-dd", { locale: ko }) : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.submissionDate}
                    onSelect={(date) => handleInputChange("submissionDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">상태 *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
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
          </div>

          {formData.status === "approved" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>채택일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.adoptionDate ? format(formData.adoptionDate, "yyyy-MM-dd", { locale: ko }) : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.adoptionDate}
                      onSelect={(date) => handleInputChange("adoptionDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactLevel">영향도</Label>
                <Select
                  value={formData.impactLevel}
                  onValueChange={(value) => handleInputChange("impactLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="영향도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.status === "approved" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">포상 금액</Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  value={formData.rewardAmount}
                  onChange={(e) => handleInputChange("rewardAmount", parseInt(e.target.value) || 0)}
                  placeholder="포상 금액"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewardType">포상 유형</Label>
                <Select
                  value={formData.rewardType}
                  onValueChange={(value) => handleInputChange("rewardType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="포상 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monetary">금전적 포상</SelectItem>
                    <SelectItem value="recognition">인정 포상</SelectItem>
                    <SelectItem value="both">금전적 + 인정</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="implementationStatus">구현 상태</Label>
            <Select
              value={formData.implementationStatus}
              onValueChange={(value) => handleInputChange("implementationStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="구현 상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">대기</SelectItem>
                <SelectItem value="in_progress">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="추가 메모"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
