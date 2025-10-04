import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  award?: any;
}

export default function AwardModal({ isOpen, onClose, onSuccess, award }: AwardModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    awardingOrganization: '',
    awardDate: '',
    category: '',
    level: 'company',
    description: '',
    certificateUrl: ''
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      if (award) {
        setFormData({
          employeeId: award.employeeId || '',
          title: award.title || '',
          awardingOrganization: award.awardingOrganization || '',
          awardDate: award.awardDate || '',
          category: award.category || '',
          level: award.level || 'company',
          description: award.description || '',
          certificateUrl: award.certificateUrl || ''
        });
      } else {
        setFormData({
          employeeId: '',
          title: '',
          awardingOrganization: '',
          awardDate: '',
          category: '',
          level: 'company',
          description: '',
          certificateUrl: ''
        });
      }
    }
  }, [isOpen, award]);

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('직원 목록 로드 오류:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = award ? `/api/awards/${award.id}` : '/api/awards';
      const method = award ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('수상 등록/수정 실패');
      }
    } catch (error) {
      console.error('수상 등록/수정 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{award ? '수상 수정' : '수상 등록'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>
            
            <div className="space-y-2">
              <Label htmlFor="employeeId">직원 선택</Label>
              <Select value={formData.employeeId} onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="직원을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">수상명</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="수상명을 입력하세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="awardingOrganization">수여 기관</Label>
                <Input
                  id="awardingOrganization"
                  value={formData.awardingOrganization}
                  onChange={(e) => setFormData(prev => ({ ...prev, awardingOrganization: e.target.value }))}
                  placeholder="예: 한국과학기술원, IEEE"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">분야</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="예: AI, 바이오, 반도체"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="awardDate">수상일</Label>
                <Input
                  id="awardDate"
                  type="date"
                  value={formData.awardDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, awardDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">수상 등급</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international">국제</SelectItem>
                    <SelectItem value="national">국가</SelectItem>
                    <SelectItem value="company">회사</SelectItem>
                    <SelectItem value="department">부서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificateUrl">수상증 URL</Label>
              <Input
                id="certificateUrl"
                value={formData.certificateUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, certificateUrl: e.target.value }))}
                placeholder="수상증 이미지 또는 문서 URL"
              />
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">상세 정보</h3>
            
            <div className="space-y-2">
              <Label htmlFor="description">수상 내용</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="수상 배경, 수상 이유, 기여도 등을 설명하세요"
                rows={4}
              />
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '처리 중...' : (award ? '수정' : '등록')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
