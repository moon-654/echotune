import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Edit, Trash2, Plus, Eye } from "lucide-react";

interface RdEmployee {
  id: string;
  name: string;
  employeeNumber: string;
  department: string;
  team: string;
  departmentCode: string;
  position: string;
  email: string;
  phone: string;
  hireDate: string;
  isActive: boolean;
}

interface RdEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function RdEmployeesModal({
  isOpen,
  onClose,
  onSave
}: RdEmployeesModalProps) {
  const { toast } = useToast();
  const [rdEmployees, setRdEmployees] = useState<RdEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // R&D 인원 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadRdEmployees();
    }
  }, [isOpen]);

  const loadRdEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rd-employees');
      if (!response.ok) {
        throw new Error('Failed to fetch RD employees');
      }
      const data = await response.json();
      setRdEmployees(data.employees || []);
    } catch (error) {
      console.error('R&D 인원 데이터 로드 오류:', error);
      toast({
        title: "오류",
        description: "R&D 인원 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = rdEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeNumber.includes(searchTerm) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleRemoveFromRd = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "선택 오류",
        description: "제거할 직원을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // 선택된 직원들을 R&D에서 제외 (부서/팀 변경)
      for (const employeeId of selectedEmployees) {
        const employee = rdEmployees.find(emp => emp.id === employeeId);
        if (employee) {
          // 부서를 "일반부서"로, 팀을 null로 변경
          await fetch(`/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              department: "일반부서",
              team: null,
              departmentCode: "GN",
              teamCode: null
            })
          });
        }
      }

      toast({
        title: "성공",
        description: `${selectedEmployees.length}명의 직원을 R&D에서 제외했습니다.`,
      });
      
      setSelectedEmployees([]);
      loadRdEmployees();
      onSave();
    } catch (error) {
      console.error('R&D 직원 제거 오류:', error);
      toast({
        title: "오류",
        description: "R&D 직원 제거에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRd = async () => {
    // TODO: 일반 직원을 R&D로 추가하는 기능 구현
    toast({
      title: "기능 준비 중",
      description: "일반 직원을 R&D로 추가하는 기능은 준비 중입니다.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            R&D 인원 관리 ({rdEmployees.length}명)
          </DialogTitle>
          <DialogDescription>
            기술연구소 부문에 소속된 R&D 인원을 관리합니다. 직원을 선택하여 R&D에서 제외하거나 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 검색 및 액션 */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="이름, 사번, 부서, 팀, 직책으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleAddToRd}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                R&D 추가
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveFromRd}
                disabled={loading || selectedEmployees.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                R&D 제외 ({selectedEmployees.length})
              </Button>
            </div>
          </div>

          {/* 직원 목록 */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>사번</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>팀</TableHead>
                  <TableHead>직책</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>입사일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">로딩 중...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "검색 결과가 없습니다." : "R&D 인원이 없습니다."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleSelectEmployee(employee.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{employee.employeeNumber}</TableCell>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>
                        {employee.team ? (
                          <Badge variant="secondary">{employee.team}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? "default" : "destructive"}>
                          {employee.isActive ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: 직원 상세 정보 보기
                            toast({
                              title: "기능 준비 중",
                              description: "직원 상세 정보 보기는 준비 중입니다.",
                            });
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={loadRdEmployees} disabled={loading}>
            새로고침
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




