import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DepartmentTeamManager } from "@/lib/departments-teams";
import type { Employee, InsertEmployee } from "@shared/schema";

interface EmployeeEditModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmployeeEditModal({ employee, isOpen, onClose }: EmployeeEditModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<InsertEmployee>>({});
  const [date, setDate] = useState<Date | undefined>();
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // 부서/팀 데이터 로드
  useEffect(() => {
    const deptData = DepartmentTeamManager.getAllDepartments();
    const teamData = DepartmentTeamManager.getAllTeams();
    setDepartments(deptData);
    setTeams(teamData);
  }, []);

  // 직원 데이터를 폼에 로드
  useEffect(() => {
    if (employee) {
      setFormData({
        employeeNumber: employee.employeeNumber,
        departmentCode: employee.departmentCode,
        teamCode: employee.teamCode,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        team: employee.team,
        email: employee.email || "",
        phone: employee.phone || "",
        hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
        managerId: employee.managerId || "",
        photoUrl: employee.photoUrl || "",
        isActive: employee.isActive
      });
      setDate(employee.hireDate ? new Date(employee.hireDate) : undefined);
      setSelectedDepartment(employee.departmentCode || "");
    }
  }, [employee]);

  // 직원 목록 조회 (상사 선택용)
  const { data: allEmployees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/employees']
  });

  // 직원 수정 mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      if (!employee) throw new Error("No employee selected");
      
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update employee');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const submitData = {
      ...formData,
      hireDate: date
    };

    updateEmployeeMutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof InsertEmployee, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <DialogDescription>
            직원의 기본 정보, 조직 정보, 추가 정보를 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              
              <div>
                <Label htmlFor="employeeNumber">사원번호</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber || ""}
                  onChange={(e) => handleInputChange("employeeNumber", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">직책</Label>
                <Input
                  id="position"
                  value={formData.position || ""}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>

            {/* 조직 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">조직 정보</h3>
              
              <div>
                <Label htmlFor="department">부서</Label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    const dept = departments.find(d => d.code === value);
                    if (dept) {
                      setFormData(prev => ({
                        ...prev,
                        departmentCode: dept.code,
                        department: dept.name
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="부서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="team">팀</Label>
                <Select 
                  value={formData.teamCode || ""} 
                  onValueChange={(value) => {
                    const team = teams.find(t => t.code === value);
                    if (team) {
                      setFormData(prev => ({
                        ...prev,
                        teamCode: team.code,
                        team: team.name
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="팀 선택 (부서장은 선택하지 않음)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">팀 없음 (부서장)</SelectItem>
                    {teams
                      .filter(team => team.departmentCode === selectedDepartment)
                      .map(team => (
                        <SelectItem key={team.code} value={team.code}>
                          {team.name} ({team.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="managerId">상사</Label>
                <Input
                  id="managerId"
                  value={formData.managerId || ""}
                  onChange={(e) => handleInputChange("managerId", e.target.value)}
                  placeholder="상사 ID 입력 (예: emp1, emp2)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  사용 가능한 직원 ID: {allEmployees?.map(emp => emp.id).join(", ")}
                </p>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">추가 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hireDate">입사일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: ko }) : "입사일 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="photoUrl">프로필 사진 URL</Label>
                <Input
                  id="photoUrl"
                  value={formData.photoUrl || ""}
                  onChange={(e) => handleInputChange("photoUrl", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="isActive">활성 상태</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={formData.isActive === true}
                    onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">활성</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={formData.isActive === false}
                    onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">비활성</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={updateEmployeeMutation.isPending}
            >
              {updateEmployeeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              수정 완료
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
