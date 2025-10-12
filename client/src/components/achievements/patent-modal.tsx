import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface PatentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patent?: any;
}

export default function PatentModal({ isOpen, onClose, onSuccess, patent }: PatentModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    patentNumber: '',
    applicationDate: '',
    registrationDate: '',
    status: 'pending',
    inventors: [] as string[],
    description: '',
    category: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any>({ 
    patentStatus: [], 
    publicationLevels: [], 
    awardLevels: [] 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      loadCategories();
      if (patent) {
        setFormData({
          employeeId: patent.employeeId || '',
          title: patent.title || '',
          patentNumber: patent.patentNumber || '',
          applicationDate: patent.applicationDate || '',
          registrationDate: patent.registrationDate || '',
          status: patent.status || 'pending',
          inventors: patent.inventors || [],
          description: patent.description || '',
          category: patent.category || ''
        });
      } else {
        setFormData({
          employeeId: '',
          title: '',
          patentNumber: '',
          applicationDate: '',
          registrationDate: '',
          status: 'pending',
          inventors: [],
          description: '',
          category: ''
        });
      }
    }
  }, [isOpen, patent]);

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

  const addInventor = (employee: any) => {
    const inventorName = `${employee.name} (${employee.department})`;
    if (!formData.inventors.includes(inventorName)) {
      setFormData(prev => ({
        ...prev,
        inventors: [...prev.inventors, inventorName]
      }));
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = patent ? `/api/patents/${patent.id}` : '/api/patents';
      const method = patent ? 'PUT' : 'POST';

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
        console.error('특허 등록/수정 실패');
      }
    } catch (error) {
      console.error('특허 등록/수정 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const removeInventor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inventors: prev.inventors.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patent ? '특허 수정' : '특허 등록'}</DialogTitle>
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
              <Label htmlFor="title">특허명</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="특허명을 입력하세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patentNumber">특허번호</Label>
                <Input
                  id="patentNumber"
                  value={formData.patentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, patentNumber: e.target.value }))}
                  placeholder="예: 10-2023-0012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.patentStatus || []).map((status: string) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                    <SelectItem value="rejected">반려</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicationDate">출원일</Label>
                <Input
                  id="applicationDate"
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDate">등록일</Label>
                <Input
                  id="registrationDate"
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, registrationDate: e.target.value }))}
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
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.inventors.map((inventor, index) => (
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
              <Label htmlFor="description">특허 설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="특허의 기술적 내용과 특징을 설명하세요"
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
              {loading ? '처리 중...' : (patent ? '수정' : '등록')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
