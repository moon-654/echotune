import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateSkillLevel } from "@/lib/skill-calculator";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for updating employee hierarchy
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, managerId }: { employeeId: string; managerId: string | null }) => {
      return apiRequest('PUT', `/api/employees/${employeeId}`, { managerId });
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

  const getSkillIndicatorClass = (level: number) => {
    if (level >= 80) return "bg-green-500";
    if (level >= 60) return "bg-yellow-500";
    if (level >= 40) return "bg-red-500";
    return "bg-gray-400";
  };

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

    // Update the employee's manager
    updateEmployeeMutation.mutate({
      employeeId: draggedEmployee.id,
      managerId: targetEmployeeId
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
                  <div className="flex justify-center space-x-1 mt-3">
                    {/* Mock skill indicators - in real app, these would come from skill calculations */}
                    <div className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(85)}`} title="경력"></div>
                    <div className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(90)}`} title="자격증"></div>
                    <div className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(75)}`} title="어학"></div>
                    <div className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(80)}`} title="교육"></div>
                  </div>
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
                      
                      // Mock skill levels - in real app, fetch from skill calculations
                      const mockSkillLevels = {
                        experience: Math.floor(Math.random() * 40) + 60,
                        certification: Math.floor(Math.random() * 40) + 50,
                        language: Math.floor(Math.random() * 50) + 40,
                        training: Math.floor(Math.random() * 30) + 70
                      };

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
                          <div className="flex justify-center space-x-1 mt-3">
                            <div 
                              className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(mockSkillLevels.experience)}`} 
                              title={`경력: ${mockSkillLevels.experience}%`}
                            ></div>
                            <div 
                              className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(mockSkillLevels.certification)}`} 
                              title={`자격증: ${mockSkillLevels.certification}%`}
                            ></div>
                            <div 
                              className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(mockSkillLevels.language)}`} 
                              title={`어학: ${mockSkillLevels.language}%`}
                            ></div>
                            <div 
                              className={`w-3 h-3 rounded-full ${getSkillIndicatorClass(mockSkillLevels.training)}`} 
                              title={`교육: ${mockSkillLevels.training}%`}
                            ></div>
                          </div>
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
