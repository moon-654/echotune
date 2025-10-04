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
    description: ''
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
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

  const addAuthor = () => {
    if (newAuthor.trim() && !formData.authors.includes(newAuthor.trim())) {
      setFormData(prev => ({
        ...prev,
        authors: [...prev.authors, newAuthor.trim()]
      }));
      setNewAuthor('');
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
          </div>

          {/* 저자 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">저자 정보</h3>
            
            <div className="space-y-2">
              <Label>저자 목록</Label>
              <div className="flex space-x-2">
                <Input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="저자 이름을 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                />
                <Button type="button" onClick={addAuthor} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
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
