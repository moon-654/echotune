import { useState, useEffect, useMemo } from "react";
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
import type { Certification, InsertCertification } from "@shared/schema";

interface CertificationEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CertificationFormData {
  id?: string;  // 기존 자격증은 ID 있음, 새 자격증은 undefined
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  category: 'technical' | 'language' | 'safety' | 'management' | 'other';
  level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  score?: number;
  scoreAtAcquisition?: number;
  scoringCriteriaVersion?: string;
  useFixedScore?: boolean;
  isActive: boolean;
  verificationUrl?: string;
  _isNew?: boolean;      // 새로 추가된 자격증 표시
  _isModified?: boolean; // 수정된 자격증 표시
  _isDeleted?: boolean;  // 삭제 예정 자격증 표시
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
  const [criteria, setCriteria] = useState<any>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]); // 삭제된 자격증 ID 추적
  
  // 수정 모드 상태
  const [editingItem, setEditingItem] = useState<{
    id: string;
  } | null>(null);
  
  // 수정 중인 데이터
  const [editFormData, setEditFormData] = useState<CertificationFormData | null>(null);

  // 기존 자격증 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadCertifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/certifications?employeeId=${employeeId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedCertifications = data.map((cert: Certification) => ({
            id: cert.id,  // ← ID 추가
            name: cert.name,
            issuer: cert.issuer,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
            credentialId: cert.credentialId || '',
            category: cert.category as 'technical' | 'language' | 'safety' | 'management' | 'other',
            level: cert.level as 'basic' | 'intermediate' | 'advanced' | 'expert' | undefined,
            score: cert.score || undefined,
            scoreAtAcquisition: cert.scoreAtAcquisition || undefined,
            scoringCriteriaVersion: cert.scoringCriteriaVersion || undefined,
            useFixedScore: cert.useFixedScore !== undefined ? cert.useFixedScore : true,
            isActive: cert.isActive,
            verificationUrl: cert.verificationUrl || '',
            _isNew: false,      // ← 기존 자격증은 false
            _isModified: false  // ← 초기값 false
          }));
          setCertifications(formattedCertifications);
        } else {
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

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null);
      setEditFormData(null);
      setDeletedIds([]);  // ← 삭제 목록 초기화 추가
    }
  }, [isOpen]);

  // R&D 평가 기준 로드 (연동용)
  useEffect(() => {
    if (!isOpen) return;
    const loadCriteria = async () => {
      try {
        const res = await fetch('/api/rd-evaluations/criteria');
        if (res.ok) {
          const data = await res.json();
          console.log('🔍 R&D 평가 기준 로드:', data);
          
          // ✅ detailedCriteria에서 자격증 기준 추출
          const detailedCriteria = data.detailedCriteria;
          setCriteria(detailedCriteria);  // detailedCriteria 전체 저장
        }
      } catch (e) {
        console.warn('자격증 기준 로드 실패(무시 가능):', e);
        setCriteria(null);
      }
    };
    loadCriteria();
  }, [isOpen]);

  // ✅ R&D 평가 기준에서 동적으로 템플릿 생성
  const certificationTemplates = useMemo(() => {
    // detailedCriteria.technical_competency.certifications에서 가져오기
    const certifications = criteria?.technical_competency?.certifications;
    
    if (certifications && typeof certifications === 'object') {
      return Object.entries(certifications).map(([label, score]) => {
        // label을 level로 매핑
        let level: 'basic' | 'intermediate' | 'advanced' | 'expert' = 'basic';
        if (label === '기술사') level = 'expert';
        else if (label === '기사') level = 'advanced';
        else if (label === '산업기사') level = 'intermediate';
        else level = 'basic';
        
        return {
          key: label,  // '기사'
          label: label,  // '기사'
          category: 'technical' as const,
          level: level,
          score: Number(score)
        };
      });
    }
    
    // ✅ 기본값 (R&D 기준 로드 실패 시)
    return [
      { key: '기술사', label: '기술사', category: 'technical' as const, level: 'expert' as const, score: 20 },
      { key: '기사', label: '기사', category: 'technical' as const, level: 'advanced' as const, score: 10 },
      { key: '산업기사', label: '산업기사', category: 'technical' as const, level: 'intermediate' as const, score: 5 },
      { key: '기타', label: '기타', category: 'technical' as const, level: 'basic' as const, score: 3 },
    ];
  }, [criteria]);

  // level을 템플릿 key로 변환
  const getLevelTemplateKey = (level?: string): string | undefined => {
    const template = certificationTemplates.find(t => t.level === level);
    return template?.key;
  };

  const applyTemplateToNew = (templateKey: string) => {
    const t = certificationTemplates.find(x => x.key === templateKey);
    if (!t) return;
    setNewCertification({
      ...newCertification,
      category: t.category,
      level: t.level,
      score: t.score
    });
  };

  const applyTemplateToExisting = (index: number, templateKey: string) => {
    const t = certificationTemplates.find(x => x.key === templateKey);
    if (!t) return;
    updateCertification(index, 'category', t.category);
    updateCertification(index, 'level', t.level);
    updateCertification(index, 'score', t.score);
  };

  const addNewCertification = () => {
    if (newCertification.name.trim()) {
      setCertifications([...certifications, { 
        ...newCertification,
        _isNew: true  // ← 새 자격증 표시
      }]);
      setNewCertification({
        name: '',
        issuer: '',
        category: 'technical',
        isActive: true
      });
    }
  };

  const removeCertification = (index: number) => {
    const cert = certifications[index];
    
    // 기존 자격증이면 삭제 목록에 추가
    if (cert.id && !cert._isNew) {
      setDeletedIds([...deletedIds, cert.id]);
    }
    
    // 목록에서 제거
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, field: keyof CertificationFormData, value: any) => {
    const updatedCertifications = [...certifications];
    updatedCertifications[index] = { 
      ...updatedCertifications[index], 
      [field]: value,
      _isModified: !updatedCertifications[index]._isNew // 기존 자격증만 수정 표시
    };
    setCertifications(updatedCertifications);
  };

  // 수정 관련 핸들러
  const handleEditClick = (index: number) => {
    setEditingItem({ id: index.toString() });
    setEditFormData({ ...certifications[index] });
  };

  const handleEditSave = async (index: number) => {
    if (!editFormData) return;
    
    console.log('🔍 handleEditSave 시작:', { index, editFormData });
    
    setIsSaving(true);
    try {
      const cert = certifications[index];
      console.log('🔍 현재 자격증:', cert);
      
      // 새 자격증: 로컬 state만 업데이트 (나중에 일괄 저장)
      if (cert._isNew) {
        console.log('✅ 새 자격증 - 로컬 저장만');
        const updatedCertifications = [...certifications];
        updatedCertifications[index] = editFormData;
        setCertifications(updatedCertifications);
        
        setEditingItem(null);
        setEditFormData(null);
        
        toast({
          title: "성공",
          description: "자격증이 수정되었습니다. 하단 저장 버튼을 눌러주세요.",
        });
        return;
      }
      
      // 기존 자격증: 즉시 PUT API 호출하여 DB에 저장
      if (cert.id) {
        console.log('🔍 기존 자격증 - API 호출 준비:', cert.id);
        
        const certificationData = {
          name: editFormData.name,
          issuer: editFormData.issuer,
          issueDate: editFormData.issueDate?.toISOString(),
          expiryDate: editFormData.expiryDate?.toISOString(),
          credentialId: editFormData.credentialId,
          verificationUrl: editFormData.verificationUrl,
          category: editFormData.category,
          level: editFormData.level,
          score: editFormData.score,
          isActive: editFormData.isActive
        };
        
        console.log('🔍 전송할 데이터:', certificationData);

        const response = await fetch(`/api/certifications/${cert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificationData)
        });

        console.log('🔍 API 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 오류 응답:', errorText);
          throw new Error(`Failed to update certification: ${response.status} - ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('✅ API 성공 응답:', responseData);
        
        // ✅ 수정: 서버 응답 데이터로 로컬 state 업데이트
        const updatedCertifications = [...certifications];
        updatedCertifications[index] = {
          ...responseData,  // ✅ 서버에서 계산된 모든 데이터 사용
          // Date 객체로 변환
          issueDate: responseData.issueDate ? new Date(responseData.issueDate) : undefined,
          expiryDate: responseData.expiryDate ? new Date(responseData.expiryDate) : undefined,
          _isNew: false,
          _isModified: false
        };
        setCertifications(updatedCertifications);
        
        setEditingItem(null);
        setEditFormData(null);
        
        toast({
          title: "✅ 저장 완료",
          description: "자격증이 즉시 저장되었습니다.",
        });
      } else {
        console.warn('⚠️ cert.id가 없습니다:', cert);
      }
    } catch (error) {
      console.error('❌ 자격증 수정 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "자격증 수정에 실패했습니다.",
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
      // 1. 삭제된 자격증 처리
      for (const id of deletedIds) {
        const response = await fetch(`/api/certifications/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error(`Failed to delete certification: ${id}`);
        }
      }

      // 2. 새로 추가된 자격증 처리 (POST)
      const newCerts = certifications.filter(c => c._isNew);
      for (const certification of newCerts) {
        const certificationData: InsertCertification = {
          employeeId,
          name: certification.name,
          issuer: certification.issuer,
          issueDate: certification.issueDate?.toISOString(),
          expiryDate: certification.expiryDate?.toISOString(),
          credentialId: certification.credentialId,
          verificationUrl: certification.verificationUrl,
          category: certification.category,
          level: certification.level,
          score: certification.score,
          isActive: certification.isActive
        };

        const response = await fetch('/api/certifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificationData)
        });

        if (!response.ok) {
          throw new Error(`Failed to create certification: ${certification.name}`);
        }
      }

      // 3. 수정된 자격증 처리 제거 (인라인에서 이미 저장됨)
      // 수정된 자격증이 있다면 경고 (이론적으로는 없어야 함)
      const modifiedCerts = certifications.filter(c => c._isModified && !c._isNew && c.id);
      if (modifiedCerts.length > 0) {
        console.warn('아직 저장되지 않은 수정사항:', modifiedCerts);
      }

      toast({
        title: "성공",
        description: "자격증 정보가 저장되었습니다.",
      });
      
      // 삭제 목록 초기화
      setDeletedIds([]);
      
      onClose();
    } catch (error) {
      console.error('🔍 자격증 저장 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "자격증 정보 저장에 실패했습니다.",
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
                  <Label htmlFor="template">기준 선택</Label>
                  <Select onValueChange={(v) => applyTemplateToNew(v)} value={getLevelTemplateKey(newCertification.level)}>
                    <SelectTrigger>
                      <SelectValue placeholder="R&D 상세기준 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificationTemplates.map(t => (
                        <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Label htmlFor="verificationUrl">자격증 URL</Label>
                <Input
                  id="verificationUrl"
                  value={newCertification.verificationUrl}
                  onChange={(e) => setNewCertification({ ...newCertification, verificationUrl: e.target.value })}
                  placeholder="예: https://example.com/certificate.pdf"
                />
              </div>
              <Button onClick={addNewCertification} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                자격증 추가
              </Button>
            </div>

            {/* 기존 자격증 목록 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">등록된 자격증 ({certifications.length}개)</h3>
              {certifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">등록된 자격증이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {certifications.map((certification, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      {editingItem && editingItem.id === index.toString() ? (
                        // 수정 모드 - 편집 폼
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>기준 선택</Label>
                              <Select 
                                onValueChange={(v) => {
                                  const t = certificationTemplates.find(x => x.key === v);
                                  if (t) {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      category: t.category,
                                      level: t.level,
                                      score: t.score
                                    }));
                                  }
                                }}
                                value={getLevelTemplateKey(editFormData.level)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="R&D 상세기준 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {certificationTemplates.map(t => (
                                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>자격증명</Label>
                              <Input
                                value={editFormData?.name || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="예: AWS Solutions Architect"
                              />
                            </div>
                            <div>
                              <Label>발급기관</Label>
                              <Input
                                value={editFormData?.issuer || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, issuer: e.target.value }))}
                                placeholder="예: Amazon Web Services"
                              />
                            </div>
                            <div>
                              <Label>카테고리</Label>
                              <Select
                                value={editFormData?.category || 'technical'}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value as any }))}
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
                                value={editFormData?.level || ''}
                                onValueChange={(value) => setEditFormData(prev => ({ ...prev, level: value as any }))}
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
                                date={editFormData?.issueDate}
                                onDateChange={(date) => setEditFormData(prev => ({ ...prev, issueDate: date }))}
                                placeholder="발급일 선택"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>만료일</Label>
                              <DatePicker
                                date={editFormData?.expiryDate}
                                onDateChange={(date) => setEditFormData(prev => ({ ...prev, expiryDate: date }))}
                                placeholder="만료일 선택"
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label>자격증 번호</Label>
                              <Input
                                value={editFormData?.credentialId || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                                placeholder="예: AWS-123456"
                              />
                            </div>
                            <div>
                              <Label>점수</Label>
                              <Input
                                type="number"
                                value={editFormData?.score || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, score: parseInt(e.target.value) || undefined }))}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>자격증 URL</Label>
                              <Input
                                value={editFormData?.verificationUrl || ''}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, verificationUrl: e.target.value }))}
                                placeholder="예: https://example.com/certificate.pdf"
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
                            <div className="font-medium">{certification.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {certification.issuer && `${certification.issuer} • `}
                              {certification.category === 'technical' ? '기술' :
                               certification.category === 'language' ? '어학' :
                               certification.category === 'safety' ? '안전' :
                               certification.category === 'management' ? '관리' : '기타'}
                              {certification.level && ` • ${certification.level === 'basic' ? '기초' :
                                 certification.level === 'intermediate' ? '중급' :
                                 certification.level === 'advanced' ? '고급' : '전문가'}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {certification.issueDate && `발급: ${format(certification.issueDate, 'yyyy-MM-dd')}`}
                              {certification.expiryDate && ` • 만료: ${format(certification.expiryDate, 'yyyy-MM-dd')}`}
                              {certification.scoreAtAcquisition && ` • 취득시점 점수: ${certification.scoreAtAcquisition}점`}
                              {certification.scoringCriteriaVersion && ` (${certification.scoringCriteriaVersion} 기준)`}
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
                              onClick={() => removeCertification(index)}
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
