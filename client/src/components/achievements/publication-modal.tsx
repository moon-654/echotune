import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface PublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  publication?: any;
}

export default function PublicationModal({ isOpen, onClose, onSuccess, publication }: PublicationModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    authors: [] as string[],
    journal: '',
    publicationDate: '',
    doi: '',
    impactFactor: '',
    category: 'journal',
    level: '',
    description: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadCategories();
      if (publication) {
        setFormData({
          employeeId: publication.employeeId || '',
          title: publication.title || '',
          authors: publication.authors || [],
          journal: publication.journal || '',
          publicationDate: publication.publicationDate || '',
          doi: publication.doi || '',
          impactFactor: publication.impactFactor?.toString() || '',
          category: publication.category || 'journal',
          level: publication.level || '',
          description: publication.description || ''
        });
      } else {
        setFormData({
          employeeId: '',
          title: '',
          authors: [],
          journal: '',
          publicationDate: '',
          doi: '',
          impactFactor: '',
          category: 'journal',
          level: '',
          description: ''
        });
      }
    }
  }, [isOpen, publication]);

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

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/achievements/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
    }
  };

  const searchEmployees = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/employees/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('직원 검색 오류:', error);
    }
  };

  const addAuthor = (employee: any) => {
    const authorName = `${employee.name} (${employee.department})`;
    if (!formData.authors.includes(authorName)) {
      setFormData(prev => ({
        ...prev,
        authors: [...prev.authors, authorName]
      }));
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = publication ? `/api/publications/${publication.id}` : '/api/publications';
      const method = publication ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          impactFactor: formData.impactFactor ? parseFloat(formData.impactFactor) : undefined
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('논문 등록/수정 실패');
      }
    } catch (error) {
      console.error('논문 등록/수정 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{publication ? '논문 수정' : '논문 등록'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>
            
            <div className="space-y-2">
              <Label htmlFor="employeeId">직원 선택</Label>
              <div className="space-y-2">
                <Input
                  value={selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.department})` : searchQuery}
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
                
                {/* 검색 결과 드롭다운 */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                    {searchResults.map((employee) => (
                      <div
                        key={employee.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, employeeId: employee.id }));
                          setSelectedEmployee(employee);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">논문 제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="논문 제목을 입력하세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journal">학술지/학회명</Label>
                <Input
                  id="journal"
                  value={formData.journal}
                  onChange={(e) => setFormData(prev => ({ ...prev, journal: e.target.value }))}
                  placeholder="예: Nature, IEEE Transactions"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">분류</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="journal">학술지</SelectItem>
                    <SelectItem value="conference">학회</SelectItem>
                    <SelectItem value="book">도서</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publicationDate">발표일</Label>
                <Input
                  id="publicationDate"
                  type="date"
                  value={formData.publicationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicationDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => setFormData(prev => ({ ...prev, doi: e.target.value }))}
                  placeholder="예: 10.1038/nature12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impactFactor">Impact Factor</Label>
                <Input
                  id="impactFactor"
                  type="number"
                  step="0.1"
                  value={formData.impactFactor}
                  onChange={(e) => setFormData(prev => ({ ...prev, impactFactor: e.target.value }))}
                  placeholder="예: 42.778"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">논문 등급</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="논문 등급을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.publicationLevels?.map((level: string) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  <Button type="button" onClick={() => searchEmployees(searchQuery)} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* 검색 결과 드롭다운 */}
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
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.authors.map((author, index) => (
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
              <Label htmlFor="description">논문 요약</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="논문의 주요 내용과 기여도를 설명하세요"
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
              {loading ? '처리 중...' : (publication ? '수정' : '등록')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
