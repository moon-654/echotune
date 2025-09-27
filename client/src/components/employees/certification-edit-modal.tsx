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
import type { Certification, InsertCertification } from "@shared/schema";

interface CertificationEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CertificationFormData {
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  category: 'technical' | 'language' | 'safety' | 'management' | 'other';
  level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  score?: number;
  isActive: boolean;
  description?: string;
  certificateUrl?: string;
  notes?: string;
}

export default function CertificationEditModal({ employeeId, isOpen, onClose }: CertificationEditModalProps) {
  const { toast } = useToast();
  
  const [certifications, setCertifications] = useState<CertificationFormData[]>([]);
  const [newCertification, setNewCertification] = useState<CertificationFormData>({
    name: '',
    issuer: '',
    category: 'technical',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 자격증 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadCertifications = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 자격증 수정 모달 - 자격증 데이터 로드 시작:', employeeId);
        const response = await fetch(`/api/certifications?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 자격증 수정 모달 - 자격증 데이터 로드 성공:', data);
          const formattedCertifications = data.map((cert: Certification) => ({
            name: cert.name,
            issuer: cert.issuer,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
            credentialId: cert.credentialId || '',
            category: cert.category as 'technical' | 'language' | 'safety' | 'management' | 'other',
            level: cert.level as 'basic' | 'intermediate' | 'advanced' | 'expert' | undefined,
            score: cert.score || undefined,
            isActive: cert.isActive,
            description: cert.description || '',
            certificateUrl: cert.verificationUrl || '',
            notes: cert.notes || ''
          }));
          setCertifications(formattedCertifications);
        } else {
          console.log('🔍 자격증 수정 모달 - 자격증 데이터 없음');
          setCertifications([]);
        }
      } catch (error) {
        console.error('🔍 자격증 수정 모달 - 자격증 데이터 로드 오류:', error);
        setCertifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCertifications();
  }, [isOpen, employeeId]);

  const addNewCertification = () => {
    if (newCertification.name.trim()) {
      setCertifications([...certifications, { ...newCertification }]);
      setNewCertification({
        name: '',
        issuer: '',
        category: 'technical',
        isActive: true
      });
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, field: keyof CertificationFormData, value: any) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    setCertifications(updatedCertifications);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 자격증 저장 시작:', certifications);
      
      // 기존 자격증 삭제
      const deleteResponse = await fetch(`/api/certifications?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 자격증 삭제 결과:', deleteResponse.status);

      // 새 자격증들 저장
      for (const certification of certifications) {
        const certificationData: InsertCertification = {
          employeeId,
          name: certification.name,
          issuer: certification.issuer,
          issueDate: certification.issueDate?.toISOString(),
          expiryDate: certification.expiryDate?.toISOString(),
          credentialId: certification.credentialId,
          category: certification.category,
          level: certification.level,
          score: certification.score,
          isActive: certification.isActive
        };

        console.log('🔍 자격증 저장 데이터:', certificationData);
        
        const response = await fetch('/api/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificationData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save certification: ${certification.name}`);
        }
      }

      console.log('🔍 자격증 저장 완료');
      toast({
        title: "성공",
        description: "자격증 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 자격증 저장 오류:', error);
      toast({
        title: "오류",
        description: "자격증 정보 저장에 실패했습니다.",
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
          <DialogTitle>자격증 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 자격증 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">자격증 데이터 로딩 중...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 새 자격증 추가 */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">새 자격증 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certName">자격증명</Label>
                  <Input
                    id="certName"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                    placeholder="예: AWS Solutions Architect"
                  />
                </div>
                <div>
                  <Label htmlFor="issuer">발급기관</Label>
                  <Input
                    id="issuer"
                    value={newCertification.issuer}
                    onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                    placeholder="예: Amazon Web Services"
                  />
                </div>
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Select
                    value={newCertification.category}
                    onValueChange={(value) => setNewCertification({ ...newCertification, category: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">기술</SelectItem>
                      <SelectItem value="language">어학</SelectItem>
                      <SelectItem value="safety">안전</SelectItem>
                      <SelectItem value="management">관리</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">수준</Label>
                  <Select
                    value={newCertification.level || ''}
                    onValueChange={(value) => setNewCertification({ ...newCertification, level: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="수준 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">기초</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                      <SelectItem value="expert">전문가</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="issueDate">발급일</Label>
                  <DatePicker
                    date={newCertification.issueDate}
                    onDateChange={(date) => setNewCertification({ ...newCertification, issueDate: date })}
                    placeholder="발급일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">만료일</Label>
                  <DatePicker
                    date={newCertification.expiryDate}
                    onDateChange={(date) => setNewCertification({ ...newCertification, expiryDate: date })}
                    placeholder="만료일 선택"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="credentialId">자격증 번호</Label>
                  <Input
                    id="credentialId"
                    value={newCertification.credentialId}
                    onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
                    placeholder="예: AWS-123456"
                  />
                </div>
                <div>
                  <Label htmlFor="score">점수</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newCertification.score || ''}
                    onChange={(e) => setNewCertification({ ...newCertification, score: parseInt(e.target.value) || undefined })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={newCertification.description}
                  onChange={(e) => setNewCertification({ ...newCertification, description: e.target.value })}
                  placeholder="자격증에 대한 상세 설명"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="certificateUrl">자격증 URL</Label>
                <Input
                  id="certificateUrl"
                  value={newCertification.certificateUrl}
                  onChange={(e) => setNewCertification({ ...newCertification, certificateUrl: e.target.value })}
                  placeholder="예: https://example.com/certificate.pdf"
                />
              </div>
              <div>
                <Label htmlFor="notes">메모</Label>
                <Textarea
                  id="notes"
                  value={newCertification.notes}
                  onChange={(e) => setNewCertification({ ...newCertification, notes: e.target.value })}
                  placeholder="추가 정보나 메모"
                  rows={2}
                />
              </div>
              <Button onClick={addNewCertification} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                자격증 추가
              </Button>
            </div>

            {/* 기존 자격증 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">등록된 자격증 ({certifications.length}개)</h3>
              {certifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">등록된 자격증이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {certifications.map((certification, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{certification.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCertification(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>자격증명</Label>
                          <Input
                            value={certification.name}
                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>발급기관</Label>
                          <Input
                            value={certification.issuer}
                            onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>카테고리</Label>
                          <Select
                            value={certification.category}
                            onValueChange={(value) => updateCertification(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">기술</SelectItem>
                              <SelectItem value="language">어학</SelectItem>
                              <SelectItem value="safety">안전</SelectItem>
                              <SelectItem value="management">관리</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>수준</Label>
                          <Select
                            value={certification.level || ''}
                            onValueChange={(value) => updateCertification(index, 'level', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="수준 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">기초</SelectItem>
                              <SelectItem value="intermediate">중급</SelectItem>
                              <SelectItem value="advanced">고급</SelectItem>
                              <SelectItem value="expert">전문가</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>발급일</Label>
                          <DatePicker
                            date={certification.issueDate}
                            onDateChange={(date) => updateCertification(index, 'issueDate', date)}
                            placeholder="발급일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>만료일</Label>
                          <DatePicker
                            date={certification.expiryDate}
                            onDateChange={(date) => updateCertification(index, 'expiryDate', date)}
                            placeholder="만료일 선택"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>자격증 번호</Label>
                          <Input
                            value={certification.credentialId}
                            onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>점수</Label>
                          <Input
                            type="number"
                            value={certification.score || ''}
                            onChange={(e) => updateCertification(index, 'score', parseInt(e.target.value) || undefined)}
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>설명</Label>
                          <Textarea
                            value={certification.description}
                            onChange={(e) => updateCertification(index, 'description', e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>자격증 URL</Label>
                          <Input
                            value={certification.certificateUrl}
                            onChange={(e) => updateCertification(index, 'certificateUrl', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>메모</Label>
                          <Textarea
                            value={certification.notes}
                            onChange={(e) => updateCertification(index, 'notes', e.target.value)}
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
