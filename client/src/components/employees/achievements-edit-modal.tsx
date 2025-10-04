import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AchievementsEditModalProps {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementsEditModal({ employeeId, isOpen, onClose }: AchievementsEditModalProps) {
  const { toast } = useToast();
  
  const [patents, setPatents] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any>({});
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  
  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    patent: {
    title: '',
      patentNumber: '',
      applicationDate: '',
      registrationDate: '',
      status: 'pending',
      inventors: [] as string[],
      description: '',
      category: ''
    },
    publication: {
    title: '',
      authors: [] as string[],
      journal: '',
      publicationDate: '',
      doi: '',
      impactFactor: '',
      level: 'sci',
      description: '',
      category: ''
    },
    award: {
      title: '',
      organization: '',
      awardDate: '',
      level: '사내',
      certificateUrl: '',
      teamMembers: [] as string[],
      description: '',
      category: ''
    }
  });

  // 카테고리 로드
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadEmployeeInfo();
      loadAchievements();
    }
  }, [isOpen, employeeId]);

  // 직원 정보 로드
  const loadEmployeeInfo = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setEmployeeInfo(data);
      }
    } catch (error) {
      console.error('직원 정보 로드 오류:', error);
    }
  };

  // 직원 검색 함수
  const searchEmployees = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('직원 검색 오류:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/achievements/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

    const loadAchievements = async () => {
      setIsLoading(true);
      try {
      const [patentsResponse, publicationsResponse, awardsResponse] = await Promise.all([
          fetch(`/api/patents?employeeId=${employeeId}`),
        fetch(`/api/publications?employeeId=${employeeId}`),
        fetch(`/api/awards?employeeId=${employeeId}`)
        ]);

        if (patentsResponse.ok) {
          const patentsData = await patentsResponse.json();
        setPatents(patentsData);
        }

        if (publicationsResponse.ok) {
          const publicationsData = await publicationsResponse.json();
        setPublications(publicationsData);
      }

      if (awardsResponse.ok) {
        const awardsData = await awardsResponse.json();
        setAwards(awardsData);
        }
      } catch (error) {
      console.error('성과 데이터 로드 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

  const handleDelete = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: "삭제되었습니다.",
        });
        loadAchievements();
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (type: string) => {
    setIsSaving(true);
    try {
      const data = { ...formData[type as keyof typeof formData], employeeId };
      const response = await fetch(`/api/${type}s`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "성공",
          description: `${type === 'patent' ? '특허' : type === 'publication' ? '논문' : '수상'}이 등록되었습니다.`,
        });
        loadAchievements();
        // 폼 초기화
        setFormData(prev => ({
          ...prev,
          [type]: {
            title: '',
            patentNumber: '',
            applicationDate: '',
            registrationDate: '',
            status: 'pending',
            inventors: [],
            description: '',
            category: '',
            authors: [],
            journal: '',
            doi: '',
            impactFactor: '',
            level: type === 'publication' ? 'sci' : '사내',
            organization: '',
            awardDate: '',
            certificateUrl: '',
            teamMembers: []
          }
        }));
      } else {
        throw new Error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      toast({
        title: "오류",
        description: "저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addInventor = (employee: any) => {
    if (!formData.patent.inventors.includes(employee.name)) {
      setFormData(prev => ({
        ...prev,
        patent: {
          ...prev.patent,
          inventors: [...prev.patent.inventors, employee.name]
        }
      }));
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeInventor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      patent: {
        ...prev.patent,
        inventors: prev.patent.inventors.filter((_, i) => i !== index)
      }
    }));
  };

  const addAuthor = (employee: any) => {
    if (!formData.publication.authors.includes(employee.name)) {
      setFormData(prev => ({
        ...prev,
        publication: {
          ...prev.publication,
          authors: [...prev.publication.authors, employee.name]
        }
      }));
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      publication: {
        ...prev.publication,
        authors: prev.publication.authors.filter((_, i) => i !== index)
      }
    }));
  };

  const addTeamMember = (employee: any) => {
    if (!formData.award.teamMembers.includes(employee.name)) {
      setFormData(prev => ({
        ...prev,
        award: {
          ...prev.award,
          teamMembers: [...prev.award.teamMembers, employee.name]
        }
      }));
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      award: {
        ...prev.award,
        teamMembers: prev.award.teamMembers.filter((_, i) => i !== index)
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>성과 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 특허, 논문, 수상 정보를 추가, 수정 또는 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">성과 데이터 로딩 중...</span>
          </div>
        ) : (
          <Tabs defaultValue="patents" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patents">특허</TabsTrigger>
              <TabsTrigger value="publications">논문</TabsTrigger>
              <TabsTrigger value="awards">수상</TabsTrigger>
            </TabsList>

            {/* 특허 탭 */}
            <TabsContent value="patents" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">기본 정보</h3>
                
                <div className="space-y-2">
                  <Label>직원 선택</Label>
                    <Input
                    value={employeeInfo ? `${employeeInfo.name} (${employeeInfo.department})` : '직원 정보 로딩 중...'}
                    disabled
                    className="bg-gray-50"
                    />
                  </div>

                <div className="space-y-2">
                  <Label>특허명</Label>
                  <Input
                    value={formData.patent.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      patent: { ...prev.patent, title: e.target.value }
                    }))}
                    placeholder="특허명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>특허번호</Label>
                    <Input
                      value={formData.patent.patentNumber}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patent: { ...prev.patent, patentNumber: e.target.value }
                      }))}
                      placeholder="예: 10-2023-0012345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>상태</Label>
                    <Select
                      value={formData.patent.status} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        patent: { ...prev.patent, status: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">출원</SelectItem>
                        <SelectItem value="registered">등록</SelectItem>
                        <SelectItem value="rejected">반려</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>출원일</Label>
                    <Input
                      type="date"
                      value={formData.patent.applicationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patent: { ...prev.patent, applicationDate: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>등록일</Label>
                    <Input
                      type="date"
                      value={formData.patent.registrationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        patent: { ...prev.patent, registrationDate: e.target.value }
                      }))}
                    />
                  </div>
                  </div>
                  </div>

              {/* 발명자 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">발명자 정보</h3>
                
                <div className="space-y-2">
                  <Label>발명자 목록</Label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                  <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchEmployees(e.target.value);
                        }}
                        placeholder="직원 이름 또는 사번으로 검색하세요"
                        onFocus={() => {
                          if (searchQuery.length >= 2) {
                            setShowSearchResults(true);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => searchEmployees(searchQuery)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                </div>
                    
                    {/* 검색 결과 */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                        {searchResults.map((employee) => (
                          <div
                            key={employee.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => addInventor(employee)}
                          >
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employee.department} • {employee.employeeNumber}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 선택된 발명자 목록 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.patent.inventors.map((inventor, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{inventor}</span>
                        <button
                          type="button"
                          onClick={() => removeInventor(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">상세 정보</h3>
                
                <div className="space-y-2">
                  <Label>특허 설명</Label>
                  <Textarea
                    value={formData.patent.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      patent: { ...prev.patent, description: e.target.value }
                    }))}
                    placeholder="특허의 기술적 내용과 특징을 설명하세요"
                    rows={4}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button 
                  onClick={() => handleSave('patent')}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  등록
                </Button>
              </div>

              {/* 기존 특허 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">등록된 특허 ({patents.length}건)</h3>
                {patents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">등록된 특허가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {patents.map((patent, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{patent.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {patent.patentNumber && `특허번호: ${patent.patentNumber}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patent.applicationDate && `출원일: ${patent.applicationDate}`}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                              onClick={() => handleDelete('patent', patent.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
              <div className="space-y-4">
                <h3 className="text-lg font-medium">기본 정보</h3>
                
                <div className="space-y-2">
                  <Label>직원 선택</Label>
                    <Input
                    value={employeeInfo ? `${employeeInfo.name} (${employeeInfo.department})` : '직원 정보 로딩 중...'}
                    disabled
                    className="bg-gray-50"
                    />
                  </div>

                <div className="space-y-2">
                  <Label>논문 제목</Label>
                    <Input
                    value={formData.publication.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      publication: { ...prev.publication, title: e.target.value }
                    }))}
                    placeholder="논문 제목을 입력하세요"
                    />
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>학술지/학회명</Label>
                    <Input
                      value={formData.publication.journal}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publication: { ...prev.publication, journal: e.target.value }
                      }))}
                      placeholder="예: Nature, IEEE Transactions"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>논문 등급</Label>
                    <Select
                      value={formData.publication.level} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        publication: { ...prev.publication, level: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sci">SCI(E)급</SelectItem>
                        <SelectItem value="domestic">국내 학술지</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>발표일</Label>
                    <Input
                      type="date"
                      value={formData.publication.publicationDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publication: { ...prev.publication, publicationDate: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>DOI</Label>
                    <Input
                      value={formData.publication.doi}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        publication: { ...prev.publication, doi: e.target.value }
                      }))}
                      placeholder="예: 10.1038/nature12345"
                    />
                  </div>
                  </div>

                <div className="space-y-2">
                  <Label>Impact Factor</Label>
                    <Input
                    type="number"
                    step="0.1"
                    value={formData.publication.impactFactor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      publication: { ...prev.publication, impactFactor: e.target.value }
                    }))}
                    placeholder="예: 42.778"
                    />
                  </div>
                  </div>

              {/* 저자 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">저자 정보</h3>
                
                <div className="space-y-2">
                  <Label>저자 목록</Label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                    <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchEmployees(e.target.value);
                        }}
                        placeholder="직원 이름 또는 사번으로 검색하세요"
                        onFocus={() => {
                          if (searchQuery.length >= 2) {
                            setShowSearchResults(true);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => searchEmployees(searchQuery)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                  </div>
                    
                    {/* 검색 결과 */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                        {searchResults.map((employee) => (
                          <div
                            key={employee.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => addAuthor(employee)}
                          >
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employee.department} • {employee.employeeNumber}
                  </div>
                  </div>
                        ))}
                </div>
                    )}
                  </div>
                  
                  {/* 선택된 저자 목록 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.publication.authors.map((author, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{author}</span>
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">상세 정보</h3>
                
                <div className="space-y-2">
                  <Label>논문 요약</Label>
                  <Textarea
                    value={formData.publication.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      publication: { ...prev.publication, description: e.target.value }
                    }))}
                    placeholder="논문의 주요 내용과 기여도를 설명하세요"
                    rows={4}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button 
                  onClick={() => handleSave('publication')}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  등록
                </Button>
              </div>

              {/* 기존 논문 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">등록된 논문 ({publications.length}편)</h3>
                {publications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">등록된 논문이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {publications.map((publication, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{publication.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {publication.journal && `학술지: ${publication.journal}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {publication.publicationDate && `발표일: ${publication.publicationDate}`}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                              onClick={() => handleDelete('publication', publication.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 수상 탭 */}
            <TabsContent value="awards" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">기본 정보</h3>
                
                <div className="space-y-2">
                  <Label>직원 선택</Label>
                            <Input
                    value={employeeInfo ? `${employeeInfo.name} (${employeeInfo.department})` : '직원 정보 로딩 중...'}
                    disabled
                    className="bg-gray-50"
                            />
                          </div>

                <div className="space-y-2">
                  <Label>수상명</Label>
                            <Input
                    value={formData.award.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      award: { ...prev.award, title: e.target.value }
                    }))}
                    placeholder="수상명을 입력하세요"
                            />
                          </div>

                <div className="space-y-2">
                  <Label>수여 기관</Label>
                  <Input
                    value={formData.award.organization}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      award: { ...prev.award, organization: e.target.value }
                    }))}
                    placeholder="예: 한국과학기술원, IEEE"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>수상일</Label>
                    <Input 
                      type="date"
                      value={formData.award.awardDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        award: { ...prev.award, awardDate: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>수상 등급</Label>
                            <Select
                      value={formData.award.level} 
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        award: { ...prev.award, level: value }
                      }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                        <SelectItem value="국제">국제</SelectItem>
                        <SelectItem value="국가">국가</SelectItem>
                        <SelectItem value="산업">산업</SelectItem>
                        <SelectItem value="사내">사내</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          </div>

                <div className="space-y-2">
                  <Label>수상증 URL</Label>
                            <Input
                    value={formData.award.certificateUrl}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      award: { ...prev.award, certificateUrl: e.target.value }
                    }))}
                    placeholder="수상증 이미지 또는 문서 URL"
                            />
                          </div>
                          </div>

              {/* 팀 멤버 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">팀 멤버 정보</h3>
                
                <div className="space-y-2">
                  <Label>팀 멤버 목록</Label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                            <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchEmployees(e.target.value);
                        }}
                        placeholder="직원 이름 또는 사번으로 검색하세요"
                        onFocus={() => {
                          if (searchQuery.length >= 2) {
                            setShowSearchResults(true);
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => searchEmployees(searchQuery)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                          </div>
                    
                    {/* 검색 결과 */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                        {searchResults.map((employee) => (
                          <div
                            key={employee.id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => addTeamMember(employee)}
                          >
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">
                              {employee.department} • {employee.employeeNumber}
                          </div>
                          </div>
                        ))}
                          </div>
                    )}
                          </div>
                  
                  {/* 선택된 팀 멤버 목록 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.award.teamMembers.map((member, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{member}</span>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">상세 정보</h3>
                
                <div className="space-y-2">
                  <Label>수상 내용</Label>
                            <Textarea
                    value={formData.award.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      award: { ...prev.award, description: e.target.value }
                    }))}
                    placeholder="수상 배경, 수상 이유, 기여도 등을 설명하세요"
                    rows={4}
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  취소
                </Button>
                <Button 
                  onClick={() => handleSave('award')}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  등록
                </Button>
              </div>

              {/* 기존 수상 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">등록된 수상 ({awards.length}건)</h3>
                {awards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">등록된 수상이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {awards.map((award, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{award.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {award.organization && `수여기관: ${award.organization}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {award.awardDate && `수상일: ${award.awardDate}`}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete('award', award.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      </DialogContent>
    </Dialog>
  );
}