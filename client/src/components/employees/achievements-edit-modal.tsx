import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Patent, Publication, InsertPatent, InsertPublication } from "@shared/schema";

interface AchievementsEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PatentFormData {
  title: string;
  status: 'pending' | 'granted' | 'rejected';
  applicationDate?: Date;
  grantDate?: Date;
  applicationNumber?: string;
  patentNumber?: string;
  inventors?: string;
  description?: string;
}

interface PublicationFormData {
  title: string;
  authors: string;
  type: 'journal' | 'conference' | 'book' | 'other';
  journal?: string;
  conference?: string;
  publicationDate?: Date;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  impactFactor?: number;
  description?: string;
}

export default function AchievementsEditModal({ employeeId, isOpen, onClose }: AchievementsEditModalProps) {
  const { toast } = useToast();
  
  const [patents, setPatents] = useState<PatentFormData[]>([]);
  const [publications, setPublications] = useState<PublicationFormData[]>([]);
  const [newPatent, setNewPatent] = useState<PatentFormData>({
    title: '',
    status: 'pending'
  });
  const [newPublication, setNewPublication] = useState<PublicationFormData>({
    title: '',
    authors: '',
    type: 'journal'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 성과 데이터 로드
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const loadAchievements = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 성과 수정 모달 - 성과 데이터 로드 시작:', employeeId);
        
        const [patentsResponse, publicationsResponse] = await Promise.all([
          fetch(`/api/patents?employeeId=${employeeId}`),
          fetch(`/api/publications?employeeId=${employeeId}`)
        ]);

        if (patentsResponse.ok) {
          const patentsData = await patentsResponse.json();
          console.log('🔍 성과 수정 모달 - 특허 데이터 로드 성공:', patentsData);
          const formattedPatents = patentsData.map((patent: Patent) => ({
            title: patent.title,
            status: patent.status as 'pending' | 'granted' | 'rejected',
            applicationDate: patent.applicationDate ? new Date(patent.applicationDate) : undefined,
            grantDate: patent.grantDate ? new Date(patent.grantDate) : undefined,
            applicationNumber: patent.applicationNumber || '',
            patentNumber: patent.patentNumber || '',
            inventors: patent.inventors || '',
            description: patent.description || ''
          }));
          setPatents(formattedPatents);
        } else {
          setPatents([]);
        }

        if (publicationsResponse.ok) {
          const publicationsData = await publicationsResponse.json();
          console.log('🔍 성과 수정 모달 - 논문 데이터 로드 성공:', publicationsData);
          const formattedPublications = publicationsData.map((publication: Publication) => ({
            title: publication.title,
            authors: publication.authors,
            type: publication.type as 'journal' | 'conference' | 'book' | 'other',
            journal: publication.journal || '',
            conference: publication.conference || '',
            publicationDate: publication.publicationDate ? new Date(publication.publicationDate) : undefined,
            volume: publication.volume || '',
            issue: publication.issue || '',
            pages: publication.pages || '',
            doi: publication.doi || '',
            impactFactor: publication.impactFactor || 0,
            description: publication.description || ''
          }));
          setPublications(formattedPublications);
        } else {
          setPublications([]);
        }
      } catch (error) {
        console.error('🔍 성과 수정 모달 - 성과 데이터 로드 오류:', error);
        setPatents([]);
        setPublications([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [isOpen, employeeId]);

  const addNewPatent = () => {
    if (newPatent.title.trim()) {
      setPatents([...patents, { ...newPatent }]);
      setNewPatent({
        title: '',
        status: 'pending'
      });
    }
  };

  const addNewPublication = () => {
    if (newPublication.title.trim()) {
      setPublications([...publications, { ...newPublication }]);
      setNewPublication({
        title: '',
        authors: '',
        type: 'journal'
      });
    }
  };

  const removePatent = (index: number) => {
    setPatents(patents.filter((_, i) => i !== index));
  };

  const removePublication = (index: number) => {
    setPublications(publications.filter((_, i) => i !== index));
  };

  const updatePatent = (index: number, field: keyof PatentFormData, value: any) => {
    const updatedPatents = [...patents];
    updatedPatents[index] = { ...updatedPatents[index], [field]: value };
    setPatents(updatedPatents);
  };

  const updatePublication = (index: number, field: keyof PublicationFormData, value: any) => {
    const updatedPublications = [...publications];
    updatedPublications[index] = { ...updatedPublications[index], [field]: value };
    setPublications(updatedPublications);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('🔍 성과 저장 시작:', { patents, publications });
      
      // 기존 특허 삭제
      const deletePatentsResponse = await fetch(`/api/patents?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 특허 삭제 결과:', deletePatentsResponse.status);

      // 기존 논문 삭제
      const deletePublicationsResponse = await fetch(`/api/publications?employeeId=${employeeId}`, {
        method: 'DELETE'
      });
      console.log('🔍 기존 논문 삭제 결과:', deletePublicationsResponse.status);

      // 새 특허들 저장
      for (const patent of patents) {
        const patentData: InsertPatent = {
          employeeId,
          title: patent.title,
          status: patent.status,
          applicationDate: patent.applicationDate?.toISOString(),
          grantDate: patent.grantDate?.toISOString(),
          applicationNumber: patent.applicationNumber,
          patentNumber: patent.patentNumber,
          inventors: patent.inventors,
          description: patent.description
        };

        console.log('🔍 특허 저장 데이터:', patentData);
        
        const response = await fetch('/api/patents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patentData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save patent: ${patent.title}`);
        }
      }

      // 새 논문들 저장
      for (const publication of publications) {
        const publicationData: InsertPublication = {
          employeeId,
          title: publication.title,
          authors: publication.authors,
          type: publication.type,
          journal: publication.journal,
          conference: publication.conference,
          publicationDate: publication.publicationDate?.toISOString(),
          volume: publication.volume,
          issue: publication.issue,
          pages: publication.pages,
          doi: publication.doi,
          impactFactor: publication.impactFactor,
          description: publication.description
        };

        console.log('🔍 논문 저장 데이터:', publicationData);
        
        const response = await fetch('/api/publications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publicationData)
        });

        if (!response.ok) {
          throw new Error(`Failed to save publication: ${publication.title}`);
        }
      }

      console.log('🔍 성과 저장 완료');
      toast({
        title: "성공",
        description: "성과 정보가 저장되었습니다.",
      });
      
      onClose();
    } catch (error) {
      console.error('🔍 성과 저장 오류:', error);
      toast({
        title: "오류",
        description: "성과 정보 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>성과 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 특허와 논문 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">성과 데이터 로딩 중...</span>
          </div>
        ) : (
          <Tabs defaultValue="patents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patents">특허</TabsTrigger>
              <TabsTrigger value="publications">논문</TabsTrigger>
            </TabsList>

            {/* 특허 탭 */}
            <TabsContent value="patents" className="space-y-6">
              {/* 새 특허 추가 */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">새 특허 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patentTitle">특허명</Label>
                    <Input
                      id="patentTitle"
                      value={newPatent.title}
                      onChange={(e) => setNewPatent({ ...newPatent, title: e.target.value })}
                      placeholder="예: AI 기반 음성 인식 시스템"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patentStatus">상태</Label>
                    <Select
                      value={newPatent.status}
                      onValueChange={(value) => setNewPatent({ ...newPatent, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">출원</SelectItem>
                        <SelectItem value="granted">등록</SelectItem>
                        <SelectItem value="rejected">거절</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="applicationNumber">출원번호</Label>
                    <Input
                      id="applicationNumber"
                      value={newPatent.applicationNumber}
                      onChange={(e) => setNewPatent({ ...newPatent, applicationNumber: e.target.value })}
                      placeholder="예: 10-2024-0001234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patentNumber">특허번호</Label>
                    <Input
                      id="patentNumber"
                      value={newPatent.patentNumber}
                      onChange={(e) => setNewPatent({ ...newPatent, patentNumber: e.target.value })}
                      placeholder="예: 10-2024-0012345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="applicationDate">출원일</Label>
                    <DatePicker
                      date={newPatent.applicationDate}
                      onDateChange={(date) => setNewPatent({ ...newPatent, applicationDate: date })}
                      placeholder="출원일 선택"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grantDate">등록일</Label>
                    <DatePicker
                      date={newPatent.grantDate}
                      onDateChange={(date) => setNewPatent({ ...newPatent, grantDate: date })}
                      placeholder="등록일 선택"
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="inventors">발명자</Label>
                  <Input
                    id="inventors"
                    value={newPatent.inventors}
                    onChange={(e) => setNewPatent({ ...newPatent, inventors: e.target.value })}
                    placeholder="예: 김철수, 박영희"
                  />
                </div>
                <div>
                  <Label htmlFor="patentDescription">설명</Label>
                  <Textarea
                    id="patentDescription"
                    value={newPatent.description}
                    onChange={(e) => setNewPatent({ ...newPatent, description: e.target.value })}
                    placeholder="특허에 대한 상세 설명"
                    rows={3}
                  />
                </div>
                <Button onClick={addNewPatent} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  특허 추가
                </Button>
              </div>

              {/* 기존 특허 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">등록된 특허 ({patents.length}건)</h3>
                {patents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 특허가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {patents.map((patent, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{patent.title}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePatent(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>특허명</Label>
                            <Input
                              value={patent.title}
                              onChange={(e) => updatePatent(index, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>상태</Label>
                            <Select
                              value={patent.status}
                              onValueChange={(value) => updatePatent(index, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">출원</SelectItem>
                                <SelectItem value="granted">등록</SelectItem>
                                <SelectItem value="rejected">거절</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>출원번호</Label>
                            <Input
                              value={patent.applicationNumber}
                              onChange={(e) => updatePatent(index, 'applicationNumber', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>특허번호</Label>
                            <Input
                              value={patent.patentNumber}
                              onChange={(e) => updatePatent(index, 'patentNumber', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>출원일</Label>
                            <DatePicker
                              date={patent.applicationDate}
                              onDateChange={(date) => updatePatent(index, 'applicationDate', date)}
                              placeholder="출원일 선택"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label>등록일</Label>
                            <DatePicker
                              date={patent.grantDate}
                              onDateChange={(date) => updatePatent(index, 'grantDate', date)}
                              placeholder="등록일 선택"
                              className="w-full"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>발명자</Label>
                            <Input
                              value={patent.inventors}
                              onChange={(e) => updatePatent(index, 'inventors', e.target.value)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>설명</Label>
                            <Textarea
                              value={patent.description}
                              onChange={(e) => updatePatent(index, 'description', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 논문 탭 */}
            <TabsContent value="publications" className="space-y-6">
              {/* 새 논문 추가 */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">새 논문 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="publicationTitle">논문명</Label>
                    <Input
                      id="publicationTitle"
                      value={newPublication.title}
                      onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
                      placeholder="예: Deep Learning을 활용한 음성 인식 정확도 향상"
                    />
                  </div>
                  <div>
                    <Label htmlFor="authors">저자</Label>
                    <Input
                      id="authors"
                      value={newPublication.authors}
                      onChange={(e) => setNewPublication({ ...newPublication, authors: e.target.value })}
                      placeholder="예: 김철수, 박영희"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicationType">유형</Label>
                    <Select
                      value={newPublication.type}
                      onValueChange={(value) => setNewPublication({ ...newPublication, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="journal">저널</SelectItem>
                        <SelectItem value="conference">학회</SelectItem>
                        <SelectItem value="book">도서</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="journal">저널명</Label>
                    <Input
                      id="journal"
                      value={newPublication.journal}
                      onChange={(e) => setNewPublication({ ...newPublication, journal: e.target.value })}
                      placeholder="예: 한국정보과학회논문지"
                    />
                  </div>
                  <div>
                    <Label htmlFor="conference">학회명</Label>
                    <Input
                      id="conference"
                      value={newPublication.conference}
                      onChange={(e) => setNewPublication({ ...newPublication, conference: e.target.value })}
                      placeholder="예: IEEE International Conference"
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicationDate">발행일</Label>
                    <DatePicker
                      date={newPublication.publicationDate}
                      onDateChange={(date) => setNewPublication({ ...newPublication, publicationDate: date })}
                      placeholder="발행일 선택"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="volume">권</Label>
                    <Input
                      id="volume"
                      value={newPublication.volume}
                      onChange={(e) => setNewPublication({ ...newPublication, volume: e.target.value })}
                      placeholder="예: 51"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue">호</Label>
                    <Input
                      id="issue"
                      value={newPublication.issue}
                      onChange={(e) => setNewPublication({ ...newPublication, issue: e.target.value })}
                      placeholder="예: 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pages">페이지</Label>
                    <Input
                      id="pages"
                      value={newPublication.pages}
                      onChange={(e) => setNewPublication({ ...newPublication, pages: e.target.value })}
                      placeholder="예: 123-130"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doi">DOI</Label>
                    <Input
                      id="doi"
                      value={newPublication.doi}
                      onChange={(e) => setNewPublication({ ...newPublication, doi: e.target.value })}
                      placeholder="예: 10.1234/example"
                    />
                  </div>
                  <div>
                    <Label htmlFor="impactFactor">임팩트 팩터</Label>
                    <Input
                      id="impactFactor"
                      type="number"
                      step="0.1"
                      value={newPublication.impactFactor || ''}
                      onChange={(e) => setNewPublication({ ...newPublication, impactFactor: parseFloat(e.target.value) || 0 })}
                      placeholder="예: 2.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="publicationDescription">설명</Label>
                  <Textarea
                    id="publicationDescription"
                    value={newPublication.description}
                    onChange={(e) => setNewPublication({ ...newPublication, description: e.target.value })}
                    placeholder="논문에 대한 상세 설명"
                    rows={3}
                  />
                </div>
                <Button onClick={addNewPublication} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  논문 추가
                </Button>
              </div>

              {/* 기존 논문 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">등록된 논문 ({publications.length}편)</h3>
                {publications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 논문이 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {publications.map((publication, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{publication.title}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePublication(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>논문명</Label>
                            <Input
                              value={publication.title}
                              onChange={(e) => updatePublication(index, 'title', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>저자</Label>
                            <Input
                              value={publication.authors}
                              onChange={(e) => updatePublication(index, 'authors', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>유형</Label>
                            <Select
                              value={publication.type}
                              onValueChange={(value) => updatePublication(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="journal">저널</SelectItem>
                                <SelectItem value="conference">학회</SelectItem>
                                <SelectItem value="book">도서</SelectItem>
                                <SelectItem value="other">기타</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>저널명</Label>
                            <Input
                              value={publication.journal}
                              onChange={(e) => updatePublication(index, 'journal', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>학회명</Label>
                            <Input
                              value={publication.conference}
                              onChange={(e) => updatePublication(index, 'conference', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>발행일</Label>
                            <DatePicker
                              date={publication.publicationDate}
                              onDateChange={(date) => updatePublication(index, 'publicationDate', date)}
                              placeholder="발행일 선택"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label>권</Label>
                            <Input
                              value={publication.volume}
                              onChange={(e) => updatePublication(index, 'volume', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>호</Label>
                            <Input
                              value={publication.issue}
                              onChange={(e) => updatePublication(index, 'issue', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>페이지</Label>
                            <Input
                              value={publication.pages}
                              onChange={(e) => updatePublication(index, 'pages', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>DOI</Label>
                            <Input
                              value={publication.doi}
                              onChange={(e) => updatePublication(index, 'doi', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>임팩트 팩터</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={publication.impactFactor || ''}
                              onChange={(e) => updatePublication(index, 'impactFactor', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>설명</Label>
                            <Textarea
                              value={publication.description}
                              onChange={(e) => updatePublication(index, 'description', e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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