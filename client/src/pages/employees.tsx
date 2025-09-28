import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter } from "lucide-react";
import EmployeeCard from "@/components/employees/employee-card";
import EmployeeCreateModal from "@/components/employees/employee-create-modal";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [skillLevelFilter, setSkillLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 전체/활성/비활성 필터
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees?includeInactive=true']
  });

  // 상태별 필터링
  const getFilteredEmployeesByStatus = (employees: Employee[]) => {
    if (statusFilter === "active") {
      return employees.filter(employee => employee.isActive !== false);
    } else if (statusFilter === "inactive") {
      return employees.filter(employee => employee.isActive === false);
    }
    return employees; // "all" - 모든 직원
  };

  const statusFilteredEmployees = getFilteredEmployeesByStatus(employees || []);

  const filteredEmployees = statusFilteredEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || departmentFilter === "all" || employee.department === departmentFilter;
    // Note: Skill level filtering would require skill calculation data
    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(employees?.map(emp => emp.department) || []));

  const handleResetFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("all");
    setSkillLevelFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="employees-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">직원 관리</h1>
          <p className="text-muted-foreground">직원 정보 및 능력치 관리</p>
        </div>
        {/* 새 직원 추가 버튼 숨김 */}
        {/*         <Button 
          onClick={() => {
            setIsCreateModalOpen(true);
          }}
          data-testid="button-add-employee"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 직원 추가
        </Button> */}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="이름으로 검색..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-employee-search"
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger data-testid="select-department-filter">
                <SelectValue placeholder="모든 부서" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 부서</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
              <SelectTrigger data-testid="select-skill-filter">
                <SelectValue placeholder="모든 능력치" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 능력치</SelectItem>
                <SelectItem value="high">우수 (80+)</SelectItem>
                <SelectItem value="medium">보통 (60-79)</SelectItem>
                <SelectItem value="low">개선필요 (40-59)</SelectItem>
                <SelectItem value="none">미달 (40 미만)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="모든 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              data-testid="button-reset-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              필터 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span data-testid="text-results-count">
          총 {filteredEmployees.length}명의 직원
        </span>
        {(searchTerm || departmentFilter || skillLevelFilter || statusFilter !== "all") && (
          <span>필터 적용됨</span>
        )}
      </div>

      {/* Employee Grid */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
              <p>검색 조건을 변경하거나 필터를 초기화해보세요.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="employee-grid">
          {filteredEmployees.map(employee => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
      
      {/* Create Employee Modal */}
      <EmployeeCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
