import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee } from "@shared/schema";

interface OrgChartProps {
  employees: Employee[];
  searchTerm: string;
  zoomLevel: number;
  onEmployeeSelect: (employeeId: string) => void;
}

export default function OrgChartComponent({ 
  employees, 
  searchTerm, 
  zoomLevel, 
  onEmployeeSelect 
}: OrgChartProps) {
  
  // 직원 역할 판별 함수 (명확한 구별)
  const getEmployeeRole = (employee: Employee): 'CEO' | 'DEPARTMENT_HEAD' | 'TEAM_LEADER' | 'TEAM_MEMBER' => {
    // 1. 지사장: managerId가 null
    if (!employee.managerId) return 'CEO';
    
    // 2. 부문장: teamCode가 null이거나 빈 문자열
    if (!employee.teamCode || employee.teamCode === '' || !employee.team || employee.team === '') {
      return 'DEPARTMENT_HEAD';
    }
    
    // 3. 팀장 vs 팀원: 하위 직원 존재 여부로 판별
    const hasSubordinates = employees.some(emp => emp.managerId === employee.id);
    return hasSubordinates ? 'TEAM_LEADER' : 'TEAM_MEMBER';
  };
  
  // 역할별 색상 및 스타일
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'CEO':
        return { color: '#FF6B35', bg: '#FFF3E0', border: '#FFB74D', label: '지사장' };
      case 'DEPARTMENT_HEAD':
        return { color: '#1976D2', bg: '#E3F2FD', border: '#2196F3', label: '부문장' };
      case 'TEAM_LEADER':
        return { color: '#388E3C', bg: '#E8F5E8', border: '#4CAF50', label: '팀장' };
      case 'TEAM_MEMBER':
        return { color: '#7B1FA2', bg: '#F3E5F5', border: '#9C27B0', label: '팀원' };
      default:
        return { color: '#757575', bg: '#F5F5F5', border: '#BDBDBD', label: '미분류' };
    }
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for updating employee hierarchy
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, managerId, targetEmployee }: { 
      employeeId: string; 
      managerId: string | null;
      targetEmployee?: Employee;
    }) => {
      const updateData: any = { managerId };
      
      // 현재 이동하는 직원 정보 확인
      const currentEmployee = employees.find(emp => emp.id === employeeId);
      
      // 대상 직원의 부서/팀 정보로 업데이트
      if (targetEmployee && currentEmployee) {
        console.log(`🎯 이동 분석:`, {
          이동직원: {
            id: currentEmployee.id,
            name: currentEmployee.name,
            position: currentEmployee.position,
            departmentCode: currentEmployee.departmentCode,
            teamCode: currentEmployee.teamCode,
            team: currentEmployee.team
          },
          대상직원: {
            id: targetEmployee.id,
            name: targetEmployee.name,
            position: targetEmployee.position,
            departmentCode: targetEmployee.departmentCode,
            teamCode: targetEmployee.teamCode,
            team: targetEmployee.team
          }
        });
        
        // 항상 부서 정보는 대상 직원을 따라감
        updateData.departmentCode = targetEmployee.departmentCode;
        updateData.department = targetEmployee.department;
        
        // 역할 기반 이동 로직 (명확한 구별)
        const currentRole = getEmployeeRole(currentEmployee);
        const targetRole = getEmployeeRole(targetEmployee);
        
        console.log(`🏷️ 역할 분석:`, {
          이동직원: { 
            name: currentEmployee.name, 
            role: currentRole,
            teamCode: currentEmployee.teamCode,
            team: currentEmployee.team
          },
          대상직원: { 
            name: targetEmployee.name, 
            role: targetRole,
            teamCode: targetEmployee.teamCode,
            team: targetEmployee.team
          }
        });
        
        // 대상이 팀장인 경우: 팀 정보를 대상 팀으로 변경
        if (targetRole === 'TEAM_LEADER') {
          updateData.teamCode = targetEmployee.teamCode;
          updateData.team = targetEmployee.team;
          console.log(`✅ 팀장으로 이동: 팀 정보 변경`, {
            기존팀: currentEmployee.team,
            새팀: targetEmployee.team
          });
        } 
        // 대상이 부문장인 경우: 이동하는 직원의 역할에 따라 처리
        else if (targetRole === 'DEPARTMENT_HEAD') {
          if (currentRole === 'TEAM_LEADER') {
            // 팀장 → 부문장: 기존 팀 정보 유지 (핵심!)
            updateData.teamCode = currentEmployee.teamCode;
            updateData.team = currentEmployee.team;
            console.log(`🎯 팀장 → 부문장: 기존 팀 정보 유지`, {
              유지팀코드: currentEmployee.teamCode,
              유지팀명: currentEmployee.team,
              부서변경: targetEmployee.department
            });
          } else if (currentRole === 'TEAM_MEMBER') {
            // 팀원 → 부문장: 팀 정보 제거
            updateData.teamCode = null;
            updateData.team = null;
            console.log(`✅ 팀원 → 부문장: 팀 정보 제거`);
          } else {
            // 부문장 → 부문장: 팀 정보 없음
            updateData.teamCode = null;
            updateData.team = null;
            console.log(`✅ 부문장 → 부문장: 팀 정보 없음`);
          }
        }
        
        console.log(`📋 최종 업데이트 데이터:`, updateData);
      }
      
      return apiRequest('PUT', `/api/employees/${employeeId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "조직도 업데이트 완료",
        description: "직원의 보고 관계가 성공적으로 변경되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "업데이트 실패",
        description: "직원 정보 업데이트 중 오류가 발생했습니다.",
      });
    }
  });

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleEmployeeClick = (employeeId: string) => {
    onEmployeeSelect(employeeId);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, employee: Employee) => {
    setDraggedEmployee(employee);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', employee.id);
  };

  const handleDragOver = (e: React.DragEvent, targetEmployeeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetEmployeeId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetEmployeeId: string) => {
    e.preventDefault();
    
    if (!draggedEmployee || draggedEmployee.id === targetEmployeeId) {
      setDraggedEmployee(null);
      setDragOverTarget(null);
      return;
    }

    // Prevent dropping an employee on their own subordinate
    const isDropOnSubordinate = (employeeId: string, targetId: string): boolean => {
      const subordinates = employees.filter(emp => emp.managerId === employeeId);
      if (subordinates.some(sub => sub.id === targetId)) return true;
      return subordinates.some(sub => isDropOnSubordinate(sub.id, targetId));
    };

    if (isDropOnSubordinate(draggedEmployee.id, targetEmployeeId)) {
      toast({
        variant: "destructive",
        title: "이동 불가",
        description: "직원을 자신의 부하직원 아래로 이동할 수 없습니다.",
      });
      setDraggedEmployee(null);
      setDragOverTarget(null);
      return;
    }

    // 대상 직원 정보 찾기
    const targetEmployee = employees.find(emp => emp.id === targetEmployeeId);
    
    // Update the employee's manager and team info
    updateEmployeeMutation.mutate({
      employeeId: draggedEmployee.id,
      managerId: targetEmployeeId,
      targetEmployee: targetEmployee
    });

    setDraggedEmployee(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedEmployee(null);
    setDragOverTarget(null);
  };

  // Group employees by department for better organization
  const departmentGroups = employees.reduce((groups, emp) => {
    if (!groups[emp.department]) {
      groups[emp.department] = [];
    }
    groups[emp.department].push(emp);
    return groups;
  }, {} as Record<string, Employee[]>);

  // Find CEO/top level employees (those without managers)
  const topLevelEmployees = employees.filter(emp => !emp.managerId);
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto bg-muted/30 p-8"
      data-testid="org-chart-container"
    >
      <div 
        className="org-chart-content"
        style={{ 
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        {/* CEO Level */}
        {topLevelEmployees.length > 0 && (
          <div className="flex justify-center mb-12">
            {topLevelEmployees.map(ceo => {
              const isHighlighted = searchTerm && 
                (ceo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 ceo.position.toLowerCase().includes(searchTerm.toLowerCase()));
              
              const isDraggedOver = dragOverTarget === ceo.id;
              const isBeingDragged = draggedEmployee?.id === ceo.id;
              
              return (
                <div
                  key={ceo.id}
                  className={`bg-card border-2 rounded-lg p-6 text-center shadow-lg cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                    isHighlighted ? 'border-primary ring-2 ring-primary/20' : 'border-primary'
                  } ${isDraggedOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''} ${
                    isBeingDragged ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleEmployeeClick(ceo.id)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ceo)}
                  onDragOver={(e) => handleDragOver(e, ceo.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, ceo.id)}
                  onDragEnd={handleDragEnd}
                  data-testid={`employee-node-${ceo.id}`}
                >
                  <h3 className="font-bold text-lg">{ceo.name}</h3>
                  <p className="text-sm text-muted-foreground">{ceo.position}</p>
                  <p className="text-xs text-muted-foreground">{ceo.department}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Department Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {Object.entries(departmentGroups).map(([department, deptEmployees]) => {
            // Skip if this department only contains top-level employees
            const nonTopLevel = deptEmployees.filter(emp => emp.managerId);
            if (nonTopLevel.length === 0 && topLevelEmployees.some(top => top.department === department)) {
              return null;
            }

            return (
              <div key={department} className="department-group">
                <h4 className="text-lg font-semibold mb-4 text-center text-muted-foreground">
                  {department}
                </h4>
                <div className="space-y-4">
                  {deptEmployees
                    .filter(emp => emp.managerId || !topLevelEmployees.some(top => top.id === emp.id))
                    .map(employee => {
                      const isHighlighted = searchTerm && 
                        (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase()));
                      
                      const isDraggedOver = dragOverTarget === employee.id;
                      const isBeingDragged = draggedEmployee?.id === employee.id;
                      

                      return (
                        <div
                          key={employee.id}
                          className={`bg-card border rounded-lg p-4 text-center shadow-md cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                            isHighlighted ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                          } ${isDraggedOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''} ${
                            isBeingDragged ? 'opacity-50' : ''
                          }`}
                          onClick={() => handleEmployeeClick(employee.id)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, employee)}
                          onDragOver={(e) => handleDragOver(e, employee.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, employee.id)}
                          onDragEnd={handleDragEnd}
                          data-testid={`employee-node-${employee.id}`}
                        >
                          <h5 className="font-semibold">{employee.name}</h5>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {searchTerm && filteredEmployees.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
            <p className="text-sm">'{searchTerm}'와 일치하는 직원이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
