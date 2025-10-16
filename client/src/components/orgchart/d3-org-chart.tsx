import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { OrgChart } from "d3-org-chart";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import EmployeeEditModal from '../employees/employee-edit-modal';
import EmployeeInfoPanel from './employee-info-panel';
import type { Employee } from "@shared/schema";
import { DepartmentTeamManager } from "@/lib/departments-teams";

interface D3OrgChartProps {
  employees: Employee[];
  searchTerm: string;
  zoomLevel: number;
  onEmployeeSelect: (employeeId: string) => void;
}

export default function D3OrgChart({ employees, searchTerm, zoomLevel, onEmployeeSelect }: D3OrgChartProps) {
  
  // 직원 역할 판별 함수 (체크박스 기반)
  const getEmployeeRole = (employee: any): 'CEO' | 'DEPARTMENT_HEAD' | 'TEAM_LEADER' | 'TEAM_MEMBER' => {
    // 1. 지사장: managerId가 null
    if (!employee.managerId) return 'CEO';
    
    // 2. 부문장: 체크박스로 명시적으로 설정된 경우
    if (isDepartmentHead(employee.id)) {
      return 'DEPARTMENT_HEAD';
    }
    
    // 3. 팀장 vs 팀원: 하위 직원 존재 여부로 판별
    const hasSubordinates = employees.some((emp: any) => emp.managerId === employee.id);
    return hasSubordinates ? 'TEAM_LEADER' : 'TEAM_MEMBER';
  };
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 보기 상태 저장/복원 함수들
  const saveCurrentViewState = () => {
    if (!chartRef.current) return null;
    
    const svg = d3.select(chartRef.current).select('svg');
    const g = svg.select('g');
    
    // 노드 확장/축소 상태 수집 (D3.js 조직도 DOM 요소 직접 확인)
    const nodeStates: { [key: string]: boolean } = {};
    
    // D3.js 조직도 인스턴스에서 노드 상태 수집
    if (chartInstance.current) {
      
      // 방법 1: nodes() 메서드 시도
      if (chartInstance.current.nodes) {
        try {
          const nodes = chartInstance.current.nodes();
          
          nodes.forEach((node: any) => {
            if (node && node.id) {
              const isExpanded = !node._children || node._children.length === 0;
              nodeStates[node.id] = isExpanded;
            }
          });
        } catch (error) {
        }
      }
      
      // 방법 2: DOM 요소에서 직접 확인 (개선된 방법)
      if (Object.keys(nodeStates).length === 0 && chartRef.current) {
        const svg = d3.select(chartRef.current).select('svg');
        const nodeElements = svg.selectAll('.node');
        
        nodeElements.each(function(d: any) {
          if (d && d.id) {
            const nodeElement = d3.select(this);
            
            // 여러 방법으로 노드 상태 확인
            const isCollapsed = nodeElement.classed('collapsed');
            const hasChildren = nodeElement.select('.children').size() > 0;
            const isVisible = nodeElement.style('display') !== 'none';
            
            // 하위 노드가 있는지 확인
            const childNodes = nodeElement.selectAll('.node').size();
            const hasVisibleChildren = childNodes > 0;
            
            // 실제 확장/축소 상태 판단
            let isExpanded = true;
            if (isCollapsed) {
              isExpanded = false;
            } else if (hasChildren && !hasVisibleChildren) {
              isExpanded = false;
            } else if (d._children && d._children.length > 0) {
              isExpanded = false;
            }
            
            nodeStates[d.id] = isExpanded;
          }
        });
      }
      
      // 방법 3: getChartState() 시도
      if (Object.keys(nodeStates).length === 0 && chartInstance.current.getChartState) {
        try {
          const chartState = chartInstance.current.getChartState();
          
          if (chartState && chartState.data) {
            const collectNodeStates = (nodes: any[]) => {
              nodes.forEach(node => {
                if (node && node.id) {
                  const isExpanded = !node._children || node._children.length === 0;
                  nodeStates[node.id] = isExpanded;
                  
                  if (node.children && node.children.length > 0) {
                    collectNodeStates(node.children);
                  }
                }
              });
            };
            
            collectNodeStates(chartState.data);
          }
        } catch (error) {
        }
      }
    }
    
    
    const viewState = {
      svgTransform: svg.style('transform') || '',
      gTransform: g.attr('transform') || '',
      nodeStates: nodeStates,
      timestamp: Date.now()
    };
    
    localStorage.setItem('orgchart-view-state', JSON.stringify(viewState));
    return viewState;
  };

  const restoreViewState = () => {
    const savedState = localStorage.getItem('orgchart-view-state');
    if (!savedState) return false;
    
    try {
      const viewState = JSON.parse(savedState);
      
      if (!chartRef.current) return false;
      
      const svg = d3.select(chartRef.current).select('svg');
      const g = svg.select('g');
      
      if (viewState.svgTransform) {
        svg.style('transform', viewState.svgTransform);
      }
      if (viewState.gTransform) {
        g.attr('transform', viewState.gTransform);
      }
      
      // 노드 확장/축소 상태 복원 (다양한 방법 시도)
      if (viewState.nodeStates && Object.keys(viewState.nodeStates).length > 0) {
        setTimeout(() => {
          
          let restored = false;
          
          // 방법 1: nodes() 메서드로 복원
          if (chartInstance.current && chartInstance.current.nodes) {
            try {
              const nodes = chartInstance.current.nodes();
              
              if (nodes && nodes.length > 0) {
                nodes.forEach((node: any) => {
                  if (node && node.id && viewState.nodeStates[node.id] !== undefined) {
                    const shouldBeExpanded = viewState.nodeStates[node.id];
                    
                    if (shouldBeExpanded) {
                      if (node._children && node._children.length > 0) {
                        node.children = node._children;
                        node._children = null;
                      }
                    } else {
                      if (node.children && node.children.length > 0) {
                        node._children = node.children;
                        node.children = null;
                      }
                    }
                  }
                });
                restored = true;
              }
            } catch (error) {
            }
          }
          
          // 방법 2: DOM 요소로 복원 (개선된 방법)
          if (!restored && chartRef.current) {
            const svg = d3.select(chartRef.current).select('svg');
            const nodeElements = svg.selectAll('.node');
            
            nodeElements.each(function(d: any) {
              if (d && d.id && viewState.nodeStates[d.id] !== undefined) {
                const shouldBeExpanded = viewState.nodeStates[d.id];
                const nodeElement = d3.select(this);
                
                if (shouldBeExpanded) {
                  // 노드 확장
                  nodeElement.classed('collapsed', false);
                  // 하위 노드들도 표시
                  nodeElement.selectAll('.children').style('display', 'block');
                } else {
                  // 노드 축소
                  nodeElement.classed('collapsed', true);
                  // 하위 노드들 숨기기
                  nodeElement.selectAll('.children').style('display', 'none');
                }
              }
            });
            restored = true;
          }
          
          // 차트 업데이트
          if (restored && chartInstance.current) {
            if (chartInstance.current.update) {
              chartInstance.current.update();
            } else if (chartInstance.current.render) {
              chartInstance.current.render();
            }
          }
        }, 800); // 시간을 더 늘려서 차트 렌더링 완료 후 실행
      }
      
      return true;
    } catch (error) {
      console.error('❌ 보기 상태 복원 실패:', error);
      return false;
    }
  };

  // 드래그 앤 드롭 상태 (index1.html과 동일)
  const [dragEnabled, setDragEnabled] = useState(false);
  const [dragNode, setDragNode] = useState<any>(null);
  const [dropNode, setDropNode] = useState<any>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragStarting, setIsDragStarting] = useState(false);
  const [undoActions, setUndoActions] = useState<any[]>([]);
  
  // 간단한 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(50); // 기본 50% 너비

  // 편집 모달 저장 함수
  const handleEditSave = async (formData: any) => {
    if (!editingEmployee) return;

    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          position: formData.position,
          department: formData.department,
          team: formData.team,
          employeeNumber: formData.employeeNumber,
          isDepartmentHead: Boolean(formData.isDepartmentHead)
        }),
      });

      if (response.ok) {
        // 서버에서 최신 데이터를 가져와서 조직도에 변경사항 표시
        try {
          const response = await fetch('/api/employees');
          const latestEmployees = await response.json();
          
          if (chartInstance.current && latestEmployees.length > 0) {
            const newTransformData = transformEmployeesDataForChart(latestEmployees);
            // 오리지널 코드처럼 단순하게 데이터 업데이트 후 렌더링
            chartInstance.current.data(newTransformData).render();
          }
        } catch (error) {
          console.error('❌ 최신 데이터 가져오기 실패:', error);
        }
        
        toast({
          title: "성공",
          description: "직원 정보가 업데이트되었습니다.",
        });
        
        // 편집 모달 닫기
        setIsEditModalOpen(false);
        setEditingEmployee(null);
        
        // 부문장 상태 업데이트
        if (formData.isDepartmentHead) {
          setDepartmentHeads(prev => new Set([...prev, editingEmployee.id]));
        } else {
          setDepartmentHeads(prev => {
            const newSet = new Set(prev);
            newSet.delete(editingEmployee.id);
            return newSet;
          });
        }
      } else {
        console.error('❌ 직원 정보 업데이트 실패:', response.statusText);
      toast({
          title: "오류",
          description: "직원 정보 업데이트에 실패했습니다.",
        variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ 직원 정보 업데이트 중 오류 발생:', error);
      toast({
        title: "오류",
        description: "직원 정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  const [redoActions, setRedoActions] = useState<any[]>([]);
  
  // 부문장 상태 관리
  const [departmentHeads, setDepartmentHeads] = useState<Set<string>>(new Set());
  
  // 부문장 체크박스 토글 함수
  const toggleDepartmentHead = (employeeId: string) => {
    setDepartmentHeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };
  
  // 부문장 여부 확인 함수
  const isDepartmentHead = (employeeId: string) => {
    return departmentHeads.has(employeeId);
  };
  
  // 전역 함수 등록 (체크박스에서 호출)
  useEffect(() => {
    (window as any).toggleDepartmentHead = (employeeId: string) => {
      setDepartmentHeads(prev => {
        const newSet = new Set(prev);
        if (newSet.has(employeeId)) {
          newSet.delete(employeeId);
        } else {
          newSet.add(employeeId);
        }
        return newSet;
      });
    };
    return () => {
      delete (window as any).toggleDepartmentHead;
    };
  }, []);

  // 부문장 상태 변경 시 차트 재렌더링
  useEffect(() => {
    if (chartInstance.current && dragEnabled) {
      const data = transformEmployeesData;
      chartInstance.current.data(data).render();
    }
  }, [departmentHeads, dragEnabled]);
  
  // 부서/팀/직원 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'department' | 'team' | 'employee' | 'new-employee'>('department');
  const [addModalData, setAddModalData] = useState({ 
    code: '', 
    name: '', 
    departmentCode: '',
    department: '',
    teamCode: '',
    team: '',
    inheritFrom: ''
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // 부서/팀 데이터 로드
  useEffect(() => {
    const deptData = DepartmentTeamManager.getAllDepartments();
    const teamData = DepartmentTeamManager.getAllTeams();
    setDepartments(deptData);
    setTeams(teamData);
  }, []);

  // 부서 추가 함수
  const handleAddDepartment = () => {
    try {
      DepartmentTeamManager.addDepartment(addModalData.code, addModalData.name);
      const deptData = DepartmentTeamManager.getAllDepartments();
      setDepartments(deptData);
      setShowAddModal(false);
      setAddModalData({ code: '', name: '', departmentCode: '' });
      toast({ title: "부서가 추가되었습니다." });
    } catch (error) {
      toast({
        title: "부서 추가 실패", 
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive" 
      });
    }
  };

  // 팀 추가 함수
  const handleAddTeam = () => {
    try {
      DepartmentTeamManager.addTeam(addModalData.code, addModalData.name, addModalData.departmentCode);
      const teamData = DepartmentTeamManager.getAllTeams();
      setTeams(teamData);
      setShowAddModal(false);
      setAddModalData({ code: '', name: '', departmentCode: '' });
      toast({ title: "팀이 추가되었습니다." });
    } catch (error) {
      toast({
        title: "팀 추가 실패", 
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive" 
      });
    }
  };

  // 직원 추가 함수
  const handleAddEmployee = async () => {
    if (!addModalData.code || !addModalData.name) {
      toast({
        title: "입력 오류",
        description: "사원번호와 직원명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const requestData = {
        employeeNumber: addModalData.code,
        name: addModalData.name,
        position: '사원',
        departmentCode: addModalData.departmentCode,
        department: addModalData.department,
        teamCode: addModalData.teamCode,
        team: addModalData.team,
        managerId: addModalData.managerId,
        email: '',
        phone: '',
        isActive: true
      };
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeNumber: addModalData.code,
          name: addModalData.name,
          position: '사원',
          departmentCode: addModalData.departmentCode,
          department: addModalData.department,
          teamCode: addModalData.teamCode,
          team: addModalData.team,
          managerId: addModalData.managerId, // 부모 직원 ID 추가
          email: '',
          phone: '',
          isActive: true
        })
      });

      if (response.ok) {
        toast({
          title: "직원 추가 완료",
          description: "새 직원이 성공적으로 추가되었습니다.",
        });
        setShowAddModal(false);
        setAddModalData({ code: '', name: '', departmentCode: '', department: '', teamCode: '', team: '', inheritFrom: '' });
        
        // 서버에서 최신 데이터를 가져와서 조직도에 새 직원 표시
        try {
          const response = await fetch('/api/employees');
          const latestEmployees = await response.json();
          
          if (chartInstance.current && latestEmployees.length > 0) {
            const newTransformData = transformEmployeesDataForChart(latestEmployees);
            // 오리지널 코드처럼 단순하게 데이터 업데이트 후 렌더링
            chartInstance.current.data(newTransformData).render();
          }
        } catch (error) {
          console.error('❌ 최신 데이터 가져오기 실패:', error);
        }
      } else {
        throw new Error('직원 추가 실패');
      }
    } catch (error) {
      console.error('직원 추가 실패:', error);
      toast({
        title: "직원 추가 실패",
        description: "직원 추가 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 신규 직원 추가 함수 (기존 직원의 부서/팀 상속)
  const handleAddNewEmployee = async () => {
    if (!addModalData.code || !addModalData.name) {
      toast({
        title: "입력 오류",
        description: "사원번호와 직원명을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeNumber: addModalData.code,
          name: addModalData.name,
          position: '사원',
          departmentCode: addModalData.departmentCode,
          department: addModalData.department,
          teamCode: addModalData.teamCode,
          team: addModalData.team,
          managerId: addModalData.managerId, // 부모 직원 ID 추가
          email: '',
          phone: '',
          isActive: true
        })
      });

      if (response.ok) {
        toast({
          title: "신규 직원 추가 완료",
          description: `${addModalData.department} ${addModalData.team}에 새 직원이 추가되었습니다.`,
        });
        setShowAddModal(false);
        setAddModalData({ code: '', name: '', departmentCode: '', department: '', teamCode: '', team: '', inheritFrom: '' });
        
        // 서버에서 최신 데이터를 가져와서 조직도에 새 직원 표시
        try {
          const response = await fetch('/api/employees');
          const latestEmployees = await response.json();
          
          if (chartInstance.current && latestEmployees.length > 0) {
            const newTransformData = transformEmployeesDataForChart(latestEmployees);
            // 오리지널 코드처럼 단순하게 데이터 업데이트 후 렌더링
            chartInstance.current.data(newTransformData).render();
          }
        } catch (error) {
          console.error('❌ 최신 데이터 가져오기 실패:', error);
        }
      } else {
        throw new Error('신규 직원 추가 실패');
      }
    } catch (error) {
      console.error('신규 직원 추가 실패:', error);
      toast({
        title: "신규 직원 추가 실패",
        description: "신규 직원 추가 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 데이터 변환 함수 (재사용 가능)
  const transformEmployeesDataForChart = (employeeData: any[]) => {
    if (!employeeData || employeeData.length === 0) return [];
    
    
    // 직원 데이터를 문자열로 변환 (팀 정보 보존)
    const stringData = employeeData.map(emp => {
      const newEmp: any = {};
      for (const key in emp) {
        if (Object.prototype.hasOwnProperty.call(emp, key)) {
          // team 필드는 null이어도 빈 문자열로 변환하지 않음
          if (key === 'team' && emp[key] === null) {
            newEmp[key] = null;
          } else {
            newEmp[key] = emp[key] === null || emp[key] === undefined ? "" : String(emp[key]);
          }
        }
      }
      return newEmp;
    });

    // 조직 정리 모드에서 (+) 노드 추가
    if (dragEnabled) {
      // 부서별로 그룹화하여 (+) 노드 추가
      const departmentGroups = new Map<string, any[]>();
      stringData.forEach(emp => {
        const deptKey = emp.department || '부서 없음';
        if (!departmentGroups.has(deptKey)) {
          departmentGroups.set(deptKey, []);
        }
        departmentGroups.get(deptKey)!.push(emp);
      });

      const result: any[] = [];
      departmentGroups.forEach((deptEmployees, deptName) => {
        // 부서 헤더 노드
        result.push({
          id: `dept-${deptName}`,
          name: deptName,
          position: '부서',
          department: deptName,
          team: '',
          children: []
        });

        // 팀별로 그룹화
        const teamGroups = new Map<string, any[]>();
        deptEmployees.forEach(emp => {
          const teamKey = emp.team || '팀 없음';
          if (!teamGroups.has(teamKey)) {
            teamGroups.set(teamKey, []);
          }
          teamGroups.get(teamKey)!.push(emp);
        });

        teamGroups.forEach((teamEmployees, teamName) => {
          // 팀 헤더 노드
          result.push({
            id: `team-${teamName}`,
            name: teamName,
            position: '팀',
            department: deptName,
            team: teamName,
            children: teamEmployees
          });
        });
      });

      return result;
    }

    // 일반 모드: managerId 기반 계층 구조
    const processedData = stringData.map(emp => ({
      ...emp,
      parentId: emp.managerId || ""
    }));

    // 순환 참조 방지
    const hasCycle = (nodeId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(nodeId)) return true;
      visited.add(nodeId);
      
      const node = processedData.find(d => d.id === nodeId);
      if (node && node.parentId) {
        return hasCycle(node.parentId, visited);
      }
      return false;
    };

    // 순환 참조가 있는 경우 parentId를 빈 문자열로 설정
    processedData.forEach(node => {
      if (node.parentId && hasCycle(node.id)) {
        console.warn(`⚠️ 순환 참조 감지: ${node.name} (${node.id})`);
        node.parentId = "";
      }
    });

    return processedData;
  };

  // 데이터 변환 (팀 기반 조직도 구조)
  const transformEmployeesData = useMemo(() => {
    return transformEmployeesDataForChart(employees);

       // 조직 정리 모드에서 (+) 노드 추가
       if (dragEnabled) {
         // 부서 추가 노드 (최상위 레벨)
         const addDepartmentNode = {
           id: 'add-department',
           name: '부서 추가',
           position: '부서 추가',
           department: '부서 추가',
           team: '',
           _isAddNode: true,
           _addType: 'department',
           parentId: ''
         };
         
         // 팀 추가 노드 (각 부서 하위에)
         const addTeamNodes = stringData
           .filter(emp => !emp.team || emp.team === '') // 부서장들
           .map(emp => ({
             id: `add-team-${emp.id}`,
             name: '팀 추가',
             position: '팀 추가',
      department: emp.department,
             team: '',
             _isAddNode: true,
             _addType: 'team',
             parentId: emp.id
           }));
         
         // 직원 추가 노드 (각 팀 하위에)
         const addEmployeeNodes = stringData
           .filter(emp => emp.team && emp.team !== '') // 팀장들
           .map(emp => ({
             id: `add-employee-${emp.id}`,
             name: '직원 추가',
             position: '직원 추가',
             department: emp.department,
             team: emp.team,
             _isAddNode: true,
             _addType: 'employee',
             parentId: emp.id
           }));
         
         // 기존 직원 노드에 신규 직원 추가 노드 (같은 부서/팀)
         const addNewEmployeeNodes = stringData
           .filter(emp => emp.team && emp.team !== '') // 팀원들
           .map(emp => ({
             id: `add-new-employee-${emp.id}`,
             name: '신규 직원 추가',
             position: '신규 직원 추가',
             department: emp.department,
             team: emp.team,
             _isAddNode: true,
             _addType: 'new-employee',
             parentId: emp.id,
             _inheritFrom: emp.id // 부서/팀 정보를 상속받을 원본 직원 ID
           }));
         
         stringData.push(addDepartmentNode, ...addTeamNodes, ...addEmployeeNodes, ...addNewEmployeeNodes);
       }

    // 계층 구조 설정 (팀 정보와 관계없이 managerId 기반)
    const processedData: any[] = [];
    
    // 모든 직원을 복사
    stringData.forEach(emp => {
      processedData.push({ ...emp });
    });
    
    // 순환 참조 방지 함수
    const hasCycle = (employeeId: string, targetManagerId: string, visited: Set<string> = new Set()): boolean => {
      if (visited.has(employeeId)) return true;
      if (employeeId === targetManagerId) return true;
      
      visited.add(employeeId);
      const employee = processedData.find(emp => emp.id === employeeId);
      if (employee && employee.managerId) {
        return hasCycle(employee.managerId, targetManagerId, visited);
      }
      return false;
    };

    // managerId 기반으로 계층 구조 설정 (순환 참조 방지)
    processedData.forEach(emp => {
      if (emp.managerId) {
        // managerId가 있는 경우, 해당 매니저를 찾아서 parentId 설정
        const manager = processedData.find(m => m.id === emp.managerId);
        if (manager) {
          // 순환 참조 체크
          if (!hasCycle(emp.managerId, emp.id)) {
            emp.parentId = manager.id;
          } else {
            console.warn(`⚠️ 순환 참조 방지: ${emp.name} (${emp.id}) -> ${manager.name} (${manager.id})`);
            emp.parentId = "";
          }
        } else {
          // 매니저가 현재 데이터에 없는 경우 (외부 매니저)
          emp.parentId = "";
        }
      } else {
        // managerId가 없는 경우 (최상위)
        emp.parentId = "";
      }
    });

    // 부서장들을 최상위로 설정 (단, 이미 다른 사람의 하위가 아닌 경우만)
    const departmentHeads = processedData.filter(emp => 
      emp.position && emp.position.includes('부서장') && emp.parentId === ""
    );
    
    if (departmentHeads.length > 0) {
      // 부서장들을 최상위로 설정
      departmentHeads.forEach(head => {
        head.parentId = "";
      });
      
      // 같은 부서의 팀장들을 해당 부서장 하위로 설정
      const teamLeaders = processedData.filter(emp => 
        emp.position && emp.position.includes('팀장') && 
        !emp.position.includes('부서장') &&
        emp.parentId === "" // 아직 부모가 설정되지 않은 경우만
      );
      
      teamLeaders.forEach(leader => {
        // 같은 부서의 부서장 찾기
        const sameDeptHead = departmentHeads.find(head => 
          head.department === leader.department
        );
        if (sameDeptHead) {
          // 순환 참조 체크
          if (!hasCycle(sameDeptHead.id, leader.id)) {
            leader.parentId = sameDeptHead.id;
          } else {
            console.warn(`⚠️ 순환 참조 방지 (부서장): ${leader.name} (${leader.id}) -> ${sameDeptHead.name} (${sameDeptHead.id})`);
          }
        }
      });
    }

    // Multiple roots 문제 해결: 단일 루트 노드 보장
    const rootNodes = processedData.filter(emp => emp.parentId === "");
    
    
    if (rootNodes.length > 1) {
      // CEO나 최고 직책을 가진 직원을 메인 루트로 선택
      const mainRoot = rootNodes.find(emp => 
        emp.position?.includes('CEO') || 
        emp.position?.includes('대표') || 
        emp.position?.includes('사장') ||
        emp.isDepartmentHead === true
      ) || rootNodes[0];
      
      
      // 나머지 루트 노드들을 메인 루트의 자식으로 설정
      const otherRoots = rootNodes.filter(emp => emp.id !== mainRoot.id);
      otherRoots.forEach(emp => {
        emp.parentId = mainRoot.id;
      });
      
    } else if (rootNodes.length === 0) {
      if (processedData.length > 0) {
        processedData[0].parentId = "";
      }
    }

    // 최종 검증
    const finalRootNodes = processedData.filter(emp => emp.parentId === "");

    return processedData;
  }, [employees]);

  // 노드 콘텐츠 생성 (개선된 디자인)
  // 총원 수 계산 함수 (자신 포함 + 전체 하위 조직)
  const getTotalMemberCount = (nodeId: string, allEmployees: any[]) => {
    // 재귀적으로 모든 하위 직원 수 계산
    const countAllSubordinates = (managerId: string): number => {
      const directSubordinates = allEmployees.filter(emp => emp.managerId === managerId);
      let totalCount = directSubordinates.length;
      
      // 각 직접 보고자에 대해 재귀적으로 계산
      directSubordinates.forEach(subordinate => {
        totalCount += countAllSubordinates(subordinate.id);
      });
      
      return totalCount;
    };
    
    // 자신 + 모든 하위 직원 수
    const subordinateCount = countAllSubordinates(nodeId);
    return subordinateCount + 1; // 자신 포함
  };

  const generateNodeContent = (d: any) => {
    // (+) 노드인 경우
    if (d.data._isAddNode) {
    return `
        <div class="node-container" style="
          width: 280px;
          height: 160px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        ">
          <div class="content-container" style="
            width: 260px;
            height: 140px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
            border-radius: 16px;
            border: 2px dashed #3b82f6;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
        position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        cursor: pointer;
          display: flex;
            flex-direction: column;
          justify-content: center;
          align-items: center;
            color: #3b82f6;
          ">
            <div style="
              font-size: 48px;
              font-weight: bold;
              margin-bottom: 8px;
              opacity: 0.8;
            ">+</div>
            <div style="
              font-size: 14px;
              font-weight: 600;
              text-align: center;
              opacity: 0.9;
            ">${d.data._addType === 'department' ? '부서 추가' : 
               d.data._addType === 'team' ? '팀 추가' : 
               d.data._addType === 'employee' ? '직원 추가' : '신규 직원 추가'}</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="node-container" style="
        width: 280px;
        height: 160px;
        display: flex;
          justify-content: center;
        align-items: center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div class="content-container" style="
          width: 260px;
          height: 140px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 16px;
          border: ${
            d.data._highlighted || d.data._upToTheRootHighlighted
              ? '3px solid #E27396'
              : '2px solid #e1e5e9'
          };
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
      ">
          
          <!-- 상단 직원 번호 (좌상단) -->
          <div style="
          position: absolute; 
            top: 8px;
            left: 8px;
          display: flex;
          align-items: center;
            gap: 4px;
          ">
            <div style="
              font-size: 8px;
              color: #9aa0a6;
              background-color: #f8f9fa;
              padding: 2px 4px;
              border-radius: 4px;
              border: 1px solid #e0e0e0;
            ">
              #${d.data.employeeNumber || d.data.id}
            </div>
          </div>
          
          <!-- 편집 버튼 (우하단, 드래그 영역 밖, 항상 표시) -->
          <!-- 정보 버튼 (우상단) -->
          <div style="
          position: absolute; 
              top: 2px;
          right: 4px; 
              z-index: 10;
              pointer-events: auto;
            ">
              <button 
                onclick="if(window.showEmployeeInfo) { window.showEmployeeInfo('${d.data.id}'); } else { console.error('showEmployeeInfo 함수가 없습니다!'); }"
                style="
                  width: 24px;
                  height: 24px;
          border-radius: 50%; 
                  background: #17a2b8;
                  color: white;
                  border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  transition: all 0.2s ease;
                  pointer-events: auto;
                "
                onmouseover="this.style.background='#138496'; this.style.transform='scale(1.1)'"
                onmouseout="this.style.background='#17a2b8'; this.style.transform='scale(1)'"
              >
                i
              </button>
            </div>

            <!-- 편집 버튼 (우하단) -->
            <div style="
          position: absolute; 
              bottom: 2px;
          right: 4px; 
              z-index: 10;
              pointer-events: auto;
            ">
              <button 
                onclick="if(window.editNode) { window.editNode('${d.data.id}'); } else { console.error('editNode 함수가 없습니다!'); }"
                style="
                  width: 24px;
                  height: 24px;
          border-radius: 50%; 
                  background: #4285f4;
                  color: white;
                  border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  transition: all 0.2s ease;
                  pointer-events: auto;
                "
                onmouseover="this.style.background='#3367d6'; this.style.transform='scale(1.1)'"
                onmouseout="this.style.background='#4285f4'; this.style.transform='scale(1)'"
              >
                📝
              </button>
            </div>
            
            <!-- 하위 직원 추가 버튼 (좌하단) -->
            <div style="
          position: absolute; 
              bottom: 2px;
              left: 4px;
              z-index: 10;
              pointer-events: auto;
            ">
              <button 
                onclick="if(window.addSubordinate) { window.addSubordinate('${d.data.id}'); } else { console.error('addSubordinate 함수가 없습니다!'); }"
                style="
                  width: 24px;
                  height: 24px;
          border-radius: 50%; 
                  background: #28a745;
                  color: white;
                  border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  transition: all 0.2s ease;
                  pointer-events: auto;
                "
                onmouseover="this.style.background='#218838'; this.style.transform='scale(1.1)'"
                onmouseout="this.style.background='#28a745'; this.style.transform='scale(1)'"
              >
                +
              </button>
            </div>
        
          <!-- 프로필 이미지 -->
          <div style="
          position: absolute; 
            top: 35px;
            left: 16px;
            width: 50px;
            height: 50px;
          border-radius: 50%; 
            overflow: hidden;
            border: 3px solid #ffffff;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          ">
            <img src="${d.data.image || '/default-avatar.png'}" 
                 style="width: 100%; height: 100%; object-fit: cover;" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTI1IDI1QzI4LjMxMzcgMjUgMzEgMjIuMzEzNyAzMSAxOUMyMSAxNi42ODYzIDI4LjMxMzcgMTQgMjUgMTRDMjEuNjg2MyAxNCAxOSAxNi42ODYzIDE5IDE5QzE5IDIxLjMxMzcgMjEuNjg2MyAyNCAyNSAyNVoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTM1IDM2QzM1IDMxLjAyOTQgMzAuOTcwNiAyNyAyNiAyN0gyNEMxOS4wMjk0IDI3IDE1IDMxLjAyOTQgMTUgMzZWMzZIMzVaIiBmaWxsPSIjOUNBNEFGIi8+Cjwvc3ZnPgo=';" />
          </div>

          <!-- 직원 정보 -->
          <div style="
            position: absolute;
            top: 20px;
            left: 80px;
            right: 16px;
          ">
            <!-- 이름 -->
            <div style="
              font-size: 16px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 4px;
              line-height: 1.2;
            ">
              ${d.data.name}
        </div>
            
            <!-- 직책과 종속 직원 수 -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;
            ">
              <div style="
                font-size: 12px;
                color: #5f6368;
                line-height: 1.3;
              ">
                ${d.data.position}
              </div>
              ${(() => {
                const totalMemberCount = getTotalMemberCount(d.data.id, employees);
                if (totalMemberCount > 1) { // 자신만 있는 경우(1명)는 표시하지 않음
                  return `
                  <div style="
                    background: linear-gradient(135deg, #4285f4, #34a853);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 9px;
                    font-weight: 600;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    white-space: nowrap;
                  ">
                    총원 ${totalMemberCount}명
                  </div>`;
                }
                return '';
              })()}
            </div>
            
            <!-- 부서명 -->
            <div style="
            font-size: 10px;
              color: #8e8e93;
              margin-bottom: 4px;
              line-height: 1.3;
            ">
              ${d.data.department || '부서 정보 없음'}
        </div>
        
        
            <!-- 팀 정보 (팀 정보가 있는 경우만 표시) -->
            ${(() => {
              // 부모 노드의 팀 정보를 가져와서 표시
              const parentId = d.data.parentId;
              if (!parentId) {
                // 부서장인 경우 - 팀 정보 표시하지 않음
                return '';
              } else {
                // 부모 노드의 팀 정보를 찾아서 표시
                const chartData = chartInstance.current?.getChartState().data;
                const parentNode = chartData?.find((n: any) => n.id === parentId);
                
                // 팀 정보 우선순위: 1) 부모 노드의 팀, 2) 현재 노드의 팀
                let teamName = '';
                if (parentNode?.team && parentNode.team !== '') {
                  teamName = parentNode.team;
                } else if (d.data.team && d.data.team !== '') {
                  teamName = d.data.team;
                }
                
                // 팀 정보가 있는 경우만 표시
                if (teamName && teamName !== '') {
                  return `
                  <div style="
                    font-size: 11px;
                    color: #4285f4;
                    font-weight: 500;
                    background-color: #e8f0fe;
                    padding: 2px 6px;
                    border-radius: 4px;
                    display: inline-block;
                    border: 1px solid #d2e3fc;
                  ">
                    ${teamName}
                  </div>`;
                }
                
                return '';
              }
            })()}
        </div>
        
        
          <!-- 하단 장식 -->
            <div style="
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4285f4 0%, #34a853 50%, #fbbc04 100%);
            border-radius: 0 0 16px 16px;
          "></div>
        </div>
      </div>
    `;
  };


  // 팀 변경 시 서버 업데이트 함수
  const updateEmployeeTeam = async (employeeId: string, teamData: any) => {
    try {
      
      // 중복 호출 방지: 동일한 요청이 연속으로 들어오는 경우 방지
      const requestKey = `${employeeId}-${JSON.stringify(teamData)}`;
      if ((window as any).lastUpdateRequest === requestKey) {
        return;
      }
      (window as any).lastUpdateRequest = requestKey;
      
      // null 값들을 명시적으로 처리
      const cleanData = { ...teamData };
      
      // null 값들을 undefined로 변환하여 JSON에서 제외
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === null) {
          delete cleanData[key];
        }
      });
      
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 팀 변경 저장 실패:', response.status, response.statusText, errorText);
        throw new Error(`저장 실패: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('❌ 팀 변경 중 오류 발생:', error);
      throw error;
    }
  };

  // 드래그 앤 드롭 함수들 (index1.html과 동일)
  const onDragStart = (element: any, d: any, node: any) => {
    // 체크박스나 편집 버튼 클릭 시 드래그 방지
    const event = (window as any).d3?.event;
    const target = event?.sourceEvent?.target;
    
    if (target && (
      target.type === 'checkbox' || 
      target.closest('label') || 
      target.closest('button') ||
      target.closest('[onclick*="editNode"]') ||
      target.closest('[onclick*="toggleDepartmentHead"]') ||
      target.onclick?.toString().includes('editNode') ||
      target.onclick?.toString().includes('toggleDepartmentHead')
    )) {
      return;
    }
    
    setDragNode(node);
    setDropNode(null);
    setIsDragStarting(true);
    
    const g = d3.select(element);
    g.classed('dragging', true);
    g.style('opacity', '0.7');
    g.style('cursor', 'grabbing');
    
    // 초기 위치 설정 (더 정확한 방식)
    const transform = g.attr('transform');
    let startX = 0, startY = 0;
    
    if (transform && transform !== 'translate(0,0)') {
      const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (translate) {
        startX = parseFloat(translate[1]);
        startY = parseFloat(translate[2]);
      }
    } else {
      startX = node.x || 0;
      startY = node.y || 0;
    }
    
    setDragStartX(startX);
    setDragStartY(startY);
    
    
    // 차트 컨테이너에 dragging-active 클래스 추가
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.add('dragging-active');
    }
  };

  const onDrag = (element: any, dragEvent: any) => {
    const currentDragNode = dragEvent.subject;
    if (!currentDragNode) {
      return;
    }
    
    
    const g = d3.select(element);
    let currentDropNode = null;
    
    // 드래그 시작 시 한 번만 실행
    if (isDragStarting) {
      setIsDragStarting(false);
      
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.classList.add('dragging-active');
      }
      
      // 드래그 중인 노드를 최상위로 이동
      g.raise();
      
      // 드래그 중인 노드의 시각적 피드백 설정
      g.style('opacity', '0.8');
      g.style('z-index', '1000');
      g.classed('dragging', true);
      
      // 드래그 중인 노드가 제거되지 않도록 보호
    }
    
    // 드롭 대상 검색을 위한 좌표 계산
    const cP = {
      width: dragEvent.subject.width,
      height: dragEvent.subject.height,
      left: dragEvent.x,
      right: dragEvent.x + dragEvent.subject.width,
      top: dragEvent.y,
      bottom: dragEvent.y + dragEvent.subject.height,
      midX: dragEvent.x + dragEvent.subject.width / 2,
      midY: dragEvent.y + dragEvent.subject.height / 2,
    };

    const allNodes = d3.selectAll('g.node:not(.dragging)');
    allNodes.select('rect').attr('fill', 'none');

    allNodes
      .filter(function (d2: any, i: any) {
        // 현재 드래그 중인 노드는 제외
        if (d2.data?.id === currentDragNode?.data?.id) {
          return false;
        }

        const cPInner = {
          left: d2.x,
          right: d2.x + d2.width,
          top: d2.y,
          bottom: d2.y + d2.height,
        };

        const isOverlapping = 
          cP.midX >= cPInner.left &&
          cP.midX <= cPInner.right &&
          cP.midY >= cPInner.top &&
          cP.midY <= cPInner.bottom;
        
        const isDroppable = this.classList.contains('droppable');

        if (isOverlapping && isDroppable) {
          currentDropNode = d2;
          return d2;
        }
      })
      .select('rect')
      .attr('fill', '#e4e1e1');

    setDropNode(currentDropNode);
    
    // 드래그 중인 노드의 시각적 피드백 설정
    g.style('opacity', '0.8');
    g.style('z-index', '1000');
    g.classed('dragging', true);
    
    // 안정적인 위치 계산 방식
    const currentTransform = g.attr('transform');
    let currentX = 0, currentY = 0;
    
    if (currentTransform && currentTransform !== 'translate(0,0)') {
      const translate = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
      if (translate) {
        currentX = parseFloat(translate[1]);
        currentY = parseFloat(translate[2]);
      }
    }
    
    // 현재 위치에서 상대적 이동량만 더하기
    const newX = currentX + parseFloat(dragEvent.dx);
    const newY = currentY + parseFloat(dragEvent.dy);
    
    //   currentX, currentY,
    //   dx: parseFloat(dragEvent.dx),
    //   dy: parseFloat(dragEvent.dy),
    //   newX, newY
    // });
    
    // 노드의 transform 속성 업데이트
    g.attr('transform', `translate(${newX}, ${newY})`);
    
    // 드래그 중인 노드의 실제 위치를 업데이트
    if (currentDragNode) {
      currentDragNode.x = newX;
      currentDragNode.y = newY;
    }
  };

  const onDragEnd = (element: any, dragEvent: any) => {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.remove('dragging-active');
    }

    // 시각적 피드백 복원
    const g = d3.select(element);
    g.classed('dragging', false);
    g.style('opacity', '1');
    g.style('cursor', 'grab');
    g.style('z-index', 'auto');

    const currentDragNode = dragEvent.subject;
    if (!currentDragNode) {
      setDragNode(null);
      setDropNode(null);
      return;
    }
    
    // 드롭 대상 검색
    const cP = {
      width: currentDragNode.width,
      height: currentDragNode.height,
      left: dragEvent.x,
      right: dragEvent.x + currentDragNode.width,
      top: dragEvent.y,
      bottom: dragEvent.y + currentDragNode.height,
      midX: dragEvent.x + currentDragNode.width / 2,
      midY: dragEvent.y + currentDragNode.height / 2
    };
    
    const allNodeElements = d3.selectAll('g.node:not(.dragging)');
    let currentDropNode = null;
    
    allNodeElements.each(function(d: any, i: any) {
      if (d.data?.id === currentDragNode.data?.id) {
        return;
      }
      
      const nodeRect = {
        left: d.x,
        right: d.x + d.width,
        top: d.y,
        bottom: d.y + d.height
      };
      
      const isOverlapping = !(cP.right < nodeRect.left || 
                             cP.left > nodeRect.right || 
                             cP.bottom < nodeRect.top || 
                             cP.top > nodeRect.bottom);
      
      if (isOverlapping && !currentDropNode) {
        currentDropNode = d;
      }
    });

    // 드롭 대상이 없으면 원래 위치로 복귀
    if (!currentDropNode) {
      chartInstance.current?.render();
      setDragNode(null);
      setDropNode(null);
      return;
    }

    if (currentDragNode.parent?.id === currentDropNode.id) {
      chartInstance.current?.render();
      setDragNode(null);
      setDropNode(null);
      return;
    }

    d3.select(element).remove();

    const data = chartInstance.current?.getChartState().data;
    const node = data?.find((x: any) => x.id === currentDragNode.id);
    const oldParentId = node.parentId;
    node.parentId = currentDropNode.id;

    // 팀 변경 로직
    const draggedEmployee = node;
    const targetNode = currentDropNode;
    
    // 항상 업데이트 실행 (팀 정보 유무와 관계없이)
    //   name: draggedEmployee.name,
    //   position: draggedEmployee.position,
    //   department: draggedEmployee.department,
    //   team: draggedEmployee.team,
    //   teamCode: draggedEmployee.teamCode,
    //   managerId: draggedEmployee.managerId
    // });
    //   name: targetNode.data.name,
    //   position: targetNode.data.position,
    //   department: targetNode.data.department,
    //   team: targetNode.data.team,
    //   teamCode: targetNode.data.teamCode,
    //   managerId: targetNode.data.managerId
    // });
    
    // 전사 조직도 관리 시스템 - 중복 호출 방지
    if (true) {
      //   드래그직원: { id: draggedEmployee.id, name: draggedEmployee.name, managerId: draggedEmployee.managerId },
      //   대상직원: { id: targetNode.data.id, name: targetNode.data.name }
      // });
      
      // 중복 호출 방지: 이미 같은 매니저인 경우 스킵
      if (draggedEmployee.managerId === targetNode.data.id) {
        return;
      }
      
      // 1. 매니저 정보 업데이트 (대상 직원의 ID를 매니저로 설정)
      draggedEmployee.managerId = targetNode.data.id;
      
      // 2. 부서 정보 업데이트 (대상 직원의 부서 정보를 이어받음)
      draggedEmployee.department = targetNode.data.department;
      draggedEmployee.departmentCode = targetNode.data.departmentCode;
      
      // 3. 팀 정보 처리 로직 (전사 조직도 관리 규칙)
      if (targetNode.data.team && targetNode.data.team !== null && targetNode.data.team !== '') {
        // 대상이 팀이 있는 경우: 팀 정보를 이어받음
        draggedEmployee.team = targetNode.data.team;
        draggedEmployee.teamCode = targetNode.data.teamCode;
        //   team: targetNode.data.team,
        //   teamCode: targetNode.data.teamCode
        // });
      } else {
        // 대상이 팀이 없는 경우: 팀 정보 제거 (부문장/부서장 하위로 이동)
        draggedEmployee.team = null;
        draggedEmployee.teamCode = null;
      }
      
      // 4. 서버 전송 데이터 구성 (전사 조직도 관리 시스템)
      const updateData: any = {
        managerId: draggedEmployee.managerId,
        department: draggedEmployee.department,
        departmentCode: draggedEmployee.departmentCode
      };
      
      // team과 teamCode 처리
      if (draggedEmployee.team !== null && draggedEmployee.team !== undefined && draggedEmployee.team !== '') {
        updateData.team = draggedEmployee.team;
      } else {
        updateData.team = null;
      }
      
      if (draggedEmployee.teamCode !== null && draggedEmployee.teamCode !== undefined && draggedEmployee.teamCode !== '') {
        updateData.teamCode = draggedEmployee.teamCode;
      } else {
        updateData.teamCode = null;
      }
      
      // API 호출 전 중복 방지 체크
      
      updateEmployeeTeam(draggedEmployee.id, updateData);
      
      // 차트 데이터에서 해당 노드 찾아서 업데이트
      const chartData = chartInstance.current?.getChartState().data;
      if (chartData) {
        const nodeToUpdate = chartData.find((n: any) => n.id === draggedEmployee.id);
        if (nodeToUpdate) {
          nodeToUpdate.team = draggedEmployee.team;
          nodeToUpdate.teamCode = draggedEmployee.teamCode;
          nodeToUpdate.department = draggedEmployee.department;
          nodeToUpdate.departmentCode = draggedEmployee.departmentCode;
        }
      }
    }

    setRedoActions([]);
    setUndoActions(prev => [...prev, {
      id: dragEvent.subject.id,
      parentId: oldParentId,
    }]);

    setDropNode(null);
    setDragNode(null);
    
    // 차트를 다시 렌더링하여 변경사항 반영
    if (chartInstance.current) {
      chartInstance.current.render();
    }
  };

  const enableDrag = () => {
    setDragEnabled(true);
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.add('drag-enabled');
    }
  };

  const disableDrag = async () => {
    // 드래그 중에 이미 API 호출이 완료되었으므로 추가 저장 불필요
    
    setDragEnabled(false);
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.remove('drag-enabled');
    }
    setUndoActions([]);
    setRedoActions([]);
  };

  const undo = () => {
    if (undoActions.length === 0) return;
    
    const action = undoActions[undoActions.length - 1];
    const data = chartInstance.current?.getChartState().data;
    const node = data?.find((x: any) => x.id === action.id);
    
    if (node) {
      const currentParentId = node.parentId;
      const previousParentId = action.parentId;
      
      // 액션을 redoActions로 이동
      setRedoActions(prev => [...prev, {
        id: action.id,
        parentId: currentParentId,
      }]);
      
      // 노드의 parentId를 이전 값으로 복원
      node.parentId = previousParentId;
      
      // undoActions에서 제거
      setUndoActions(prev => prev.slice(0, -1));
      
      chartInstance.current?.render();
    }
  };

  const redo = () => {
    if (redoActions.length === 0) return;
    
    const action = redoActions[redoActions.length - 1];
    const data = chartInstance.current?.getChartState().data;
    const node = data?.find((x: any) => x.id === action.id);
    
    if (node) {
      const currentParentId = node.parentId;
      const newParentId = action.parentId;
      
      // 액션을 undoActions로 이동
      setUndoActions(prev => [...prev, {
        id: action.id,
        parentId: currentParentId,
      }]);
      
      // 노드의 parentId를 새로운 값으로 설정
      node.parentId = newParentId;
      
      // redoActions에서 제거
      setRedoActions(prev => prev.slice(0, -1));
      
      chartInstance.current?.render();
    }
  };

  const cancelDrag = () => {
    if (undoActions.length === 0) {
      // 변경사항이 없으면 저장하지 않고 모드만 종료
      setDragEnabled(false);
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.classList.remove('drag-enabled');
      }
    setUndoActions([]);
    setRedoActions([]);
      return;
    }

    const data = chartInstance.current?.getChartState().data;
    
    // 모든 undo 액션을 역순으로 실행하여 원래 상태로 복원
    [...undoActions].reverse().forEach((action) => {
      const node = data?.find((x: any) => x.id === action.id);
      if (node) {
        node.parentId = action.parentId;
      }
    });

    // 취소 시에는 저장하지 않고 모드만 종료
    setDragEnabled(false);
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.remove('drag-enabled');
    }
    setUndoActions([]);
    setRedoActions([]);
    
    // 차트 다시 렌더링
    if (chartInstance.current) {
      chartInstance.current.render();
    }
  };



  const saveData = async () => {
    
    // 방법 1: 차트 데이터에서 가져오기
    const data = chartInstance.current?.getChartState().data;
    
    // 방법 2: undoActions에서 변경사항 추출
    
    if (undoActions.length === 0) {
      toast({
        title: "저장 완료",
        description: "변경사항이 없어 저장할 필요가 없습니다.",
      });
      return;
    }
    
    // undoActions를 사용한 저장 방법
    try {
      
      if (undoActions.length === 0) {
      toast({
          title: "저장 실패",
          description: "변경사항이 없습니다.",
          variant: "destructive"
        });
        return;
      }
      
      const updatePromises = undoActions.map(async (action, index) => {
        const employeeId = action.id;
        const newManagerId = action.parentId;
        
        
        // 현재 직원 정보 확인
        const currentEmployee = employees.find(emp => emp.id === employeeId);
        
        // 새로운 매니저의 팀 정보 가져오기
        const newManager = employees.find(emp => emp.id === newManagerId);
        
        const updateData: any = { managerId: newManagerId };
        
        if (newManager) {
          
          // 새로운 매니저의 부서 정보로 업데이트 (항상)
          updateData.departmentCode = newManager.departmentCode;
          updateData.department = newManager.department;
          
          // 역할 기반 이동 로직 (명확한 구별)
          const currentRole = getEmployeeRole(currentEmployee);
          const targetRole = getEmployeeRole(newManager);
          
          // 대상이 팀장인 경우: 팀 정보를 대상 팀으로 변경
          if (targetRole === 'TEAM_LEADER') {
            updateData.teamCode = newManager.teamCode;
            updateData.team = newManager.team;
          } 
          // 대상이 부문장인 경우: 이동하는 직원의 역할에 따라 처리
          else if (targetRole === 'DEPARTMENT_HEAD') {
            if (currentRole === 'TEAM_LEADER') {
              // 팀장 → 부문장: 기존 팀 정보 유지 (핵심!)
              updateData.teamCode = currentEmployee?.teamCode;
              updateData.team = currentEmployee?.team;
            } else if (currentRole === 'TEAM_MEMBER') {
              // 팀원 → 부문장: 팀 정보 제거
              updateData.teamCode = null;
              updateData.team = null;
            } else {
              // 부문장 → 부문장: 팀 정보 없음
              updateData.teamCode = null;
              updateData.team = null;
            }
          }
        } else {
        }
        
        
        // 변경사항이 있는지 확인
        const hasChanges = 
          currentEmployee?.managerId !== newManagerId ||
          currentEmployee?.departmentCode !== updateData.departmentCode ||
          currentEmployee?.department !== updateData.department ||
          currentEmployee?.teamCode !== updateData.teamCode ||
          currentEmployee?.team !== updateData.team;
        
        
        if (!hasChanges) {
          return { id: employeeId, message: '변경사항 없음 - 이미 해당 위치에 있음' };
        }
        
        try {
          const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });

          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [${index + 1}] API 호출 실패:`, errorText);
            throw new Error(`직원 ${employeeId} 업데이트 실패: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          
          // 실제 저장된 데이터 확인
          
          return result;
        } catch (error) {
          console.error(`❌ [${index + 1}] 직원 ${employeeId} 저장 중 오류:`, error);
          throw error;
        }
      });

      const results = await Promise.all(updatePromises);
      
      // 저장 결과 검증
      const successCount = results.filter(r => r).length;
      
      if (successCount === undoActions.length) {
        toast({
          title: "저장 완료",
          description: `${successCount}명의 직원 정보가 성공적으로 저장되었습니다.`,
        });
        
        // 저장 완료 후 페이지 새로고침으로 데이터 동기화 (선택적)
        
        // 자동 새로고침을 원하지 않는 경우 아래 주석 처리
        // setTimeout(() => {
        //   window.location.reload();
        // }, 3000);
        
        // 대신 수동으로 새로고침하거나 조직도만 다시 렌더링
      } else {
        toast({
          title: "부분 저장 완료",
          description: `${successCount}/${undoActions.length}명의 직원 정보가 저장되었습니다.`,
          variant: "destructive"
        });
      }
      
      return; // 성공적으로 저장되었으므로 함수 종료
      
    } catch (error) {
      console.error('❌ undoActions 저장 중 오류 발생:', error);
      toast({
        title: "저장 실패",
        description: `저장 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive"
      });
      return; // 오류 발생 시 함수 종료
    }
    
    if (!data || data.length === 0) {
      toast({
        title: "저장 실패",
        description: "저장할 데이터가 없습니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 실제 직원만 필터링 (더 관대한 조건)
      const employeesToUpdate = data.filter((d: any) => {
        const hasValidId = d.data?.id && typeof d.data.id === 'string' && d.data.id.startsWith('emp');
        const isNotAddNode = !d.data?._isAddNode;
        const isValidEmployee = hasValidId && isNotAddNode;
        
        return isValidEmployee;
      });
      
      if (employeesToUpdate.length === 0) {
        // 차트 데이터에서 직원을 찾지 못한 경우, 원본 employees 데이터 사용
        const fallbackEmployees = employees.filter(emp => emp.id && emp.id.startsWith('emp'));
        
        if (fallbackEmployees.length === 0) {
          toast({
            title: "저장 실패",
            description: "저장할 직원 데이터가 없습니다.",
            variant: "destructive"
          });
          return;
        }
        
        // 원본 데이터로 저장 시도 (변경사항이 없을 수 있음)
        toast({
          title: "저장 경고",
          description: "차트 데이터를 찾을 수 없어 원본 데이터로 저장합니다.",
          variant: "destructive"
        });
        return;
      }

      // 각 직원의 managerId 업데이트
      const updatePromises = employeesToUpdate.map(async (d: any) => {
        const employeeId = d.data.id;
        const newManagerId = d.data.parentId || null;
        
        // 현재 직원의 managerId와 다를 때만 업데이트
        const currentEmployee = employees.find(emp => emp.id === employeeId);
        
        if (currentEmployee && currentEmployee.managerId !== newManagerId) {
          const response = await fetch(`/api/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              managerId: newManagerId
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API 호출 실패:`, errorText);
            throw new Error(`직원 ${employeeId} 업데이트 실패: ${response.status}`);
          }
          
          const result = await response.json();
        }
      });

      await Promise.all(updatePromises);
      
      toast({
        title: "저장 완료",
        description: "조직 구조가 성공적으로 저장되었습니다.",
      });
      
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      toast({
        title: "저장 실패",
        description: `조직 구조 저장 중 오류가 발생했습니다: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // 차트 렌더링
  useEffect(() => {
    if (!chartRef.current || !employees || employees.length === 0) return;

    const data = transformEmployeesData;
    
    // 기존 차트 제거
    d3.select(chartRef.current).selectAll("*").remove();

    try {
      
      // 데이터 검증
      if (!data || data.length === 0) {
        console.warn('⚠️ 조직도 데이터가 없습니다');
        return;
      }
      
      // 루트 노드 확인
      const rootNodes = data.filter((d: any) => !d.parentId || d.parentId === "");
      
      if (rootNodes.length === 0) {
        console.warn('⚠️ 루트 노드가 없습니다. 첫 번째 노드를 루트로 설정');
        if (data.length > 0) {
          data[0].parentId = "";
        }
      }
      
      // 개선된 노드 디자인에 맞는 차트 생성
    const chart = new OrgChart()
        .nodeHeight((d: any) => 140)  // 새로운 노드 높이
        .nodeWidth((d: any) => 280)   // 새로운 노드 너비
        .childrenMargin((d: any) => 60)  // 하위 노드 간격 확대
        .compactMarginBetween((d: any) => 40)  // 노드 간 여백 확대
        .compactMarginPair((d: any) => 35)
        .neighbourMargin((a: any, b: any) => 25)  // 인접 노드 간격 확대
      .nodeContent(generateNodeContent)
        .nodeEnter(function(this: any, node: any) {
          // 드래그 이벤트는 nodeUpdate에서 처리
        })
        .nodeUpdate(function(this: any, d: any) {
          // 모든 노드를 droppable로 설정
        d3.select(this).classed('droppable', true);
        
          // 최상위 노드는 draggable하지 않음
          const isRoot = !d.data.parentId || d.data.parentId === "" || d.data.parentId === null || d.data.parentId === undefined;
          if (isRoot) {
          d3.select(this).classed('draggable', false);
        } else {
          d3.select(this).classed('draggable', true);
        }

          // 드래그 이벤트 연결 (dragEnabled 상태에 따라)
          const nodeElement = d3.select(this);
          
          // 기존 드래그 이벤트 제거
          nodeElement.on('.drag', null);
          
          if (dragEnabled) {
            // 전체 노드에 드래그 이벤트 연결 (드래그 영역 제한 제거)
            nodeElement.call(
              d3.drag<any, any>()
                .filter(function (x: any, node: any) {
                  const isDraggable = this.closest('.node').classList.contains('draggable');
                  return isDraggable;
                })
                .on('start', function (d: any, node: any) {
                  onDragStart(this.closest('.node'), d, node);
                })
                .on('drag', function (dragEvent: any, node: any) {
                  onDrag(this.closest('.node'), dragEvent);
                })
                .on('end', function (d: any) {
                  onDragEnd(this.closest('.node'), d);
                })
            );
          }
        })
        .container(chartRef.current)
        .data(data)
        .render();

    chartInstance.current = chart;
    
    // 저장된 보기 상태 불러오기
    loadSavedViewState();
    
    // 차트 렌더링 후 편집 함수 등록
    (window as any).editNode = async (nodeId: string) => {
      // (+) 노드 클릭 처리
      if (nodeId === 'add-department') {
        setAddModalType('department');
        setAddModalData({ code: '', name: '', departmentCode: '' });
        setShowAddModal(true);
        return;
      }
      
      if (nodeId.startsWith('add-team-')) {
        setAddModalType('team');
        setAddModalData({ code: '', name: '', departmentCode: '' });
        setShowAddModal(true);
        return;
      }
      
      if (nodeId.startsWith('add-employee-')) {
        // 직원 추가 모달 (새로운 모달 타입)
        setAddModalType('employee');
        setAddModalData({ code: '', name: '', departmentCode: '' });
        setShowAddModal(true);
        return;
      }
      
      if (nodeId.startsWith('add-new-employee-')) {
        // 신규 직원 추가 모달 (기존 직원의 부서/팀 상속)
        const inheritFromId = nodeId.replace('add-new-employee-', '');
        const inheritFromEmployee = employees.find(emp => emp.id === inheritFromId);
        
        if (inheritFromEmployee) {
          setAddModalType('new-employee');
          setAddModalData({ 
            code: '', 
            name: '', 
            departmentCode: inheritFromEmployee.departmentCode || '',
            department: inheritFromEmployee.department || '',
            teamCode: inheritFromEmployee.teamCode || '',
            team: inheritFromEmployee.team || '',
            inheritFrom: inheritFromId
          });
          setShowAddModal(true);
        }
        return;
      }

      const data = chartInstance.current?.getChartState().data;
      const node = data?.find((d: any) => d.id === nodeId);

      if (!node) {
        alert('노드를 찾을 수 없습니다.');
        return;
      }
      
      // 간단한 편집 모달 열기
      setEditingEmployee(node);
      setIsEditModalOpen(true);

    };
    
    // 직원 정보 표시 함수 등록
    (window as any).showEmployeeInfo = (employeeId: string) => {
      setSelectedEmployeeId(employeeId);
      setIsInfoPanelOpen(true);
    };
    
    // 하위 직원 추가 함수 등록
    (window as any).addSubordinate = async (parentId: string) => {
      // 부모 직원 정보 찾기
      const parentEmployee = employees.find(emp => emp.id === parentId);
      if (!parentEmployee) {
        toast({
          title: "오류",
          description: "부모 직원을 찾을 수 없습니다.",
          variant: "destructive"
        });
        return;
      }
      
      // 하위 직원 추가 모달 열기 (부서/팀 정보 상속)
      setAddModalType('new-employee');
      setAddModalData({ 
        code: '', 
        name: '', 
        departmentCode: parentEmployee.departmentCode || '',
        department: parentEmployee.department || '',
        teamCode: parentEmployee.teamCode || '',
        team: parentEmployee.team || '',
        managerId: parentId,
        inheritFrom: parentId
      });
      setShowAddModal(true);
    };

      // 줌 레벨 적용
    const svg = d3.select(chartRef.current).select('svg');
      if (svg.node()) {
    svg.style('transform', `scale(${zoomLevel / 100})`);
      }
      
    } catch (error) {
      console.error('❌ 차트 생성 중 오류 발생:', error);
    }

    // loadSavedViewState()에서 이미 서버에서 보기 상태를 불러오므로 중복 호출 제거
    // setTimeout(() => {
    //   restoreViewState();
    // }, 500);

  }, [transformEmployeesData, zoomLevel, dragEnabled]);

  // 팀 변경 시 조직도 자동 업데이트 (조직정리 완료와 같은 방식으로 상태 유지)
  useEffect(() => {
    if (chartInstance.current && transformEmployeesData.length > 0) {
      // 조직정리 완료와 같은 방식으로 조직도 상태를 유지
      // render() 호출을 제거하여 노드 상태가 초기화되지 않도록 함
    }
  }, [transformEmployeesData]);

  // 현재 보기 저장 함수
  const saveCurrentView = async () => {
    if (!chartInstance.current || !chartRef.current) return;
    
    try {
      const svg = d3.select(chartRef.current).select('svg');
      const svgNode = svg.node() as SVGElement;
      
      if (svgNode) {
        // 현재 transform 값 가져오기
        const transform = svg.style('transform') || '';
        const gTransform = svg.select('g').attr('transform') || '';
        
        // 현재 줌 레벨
        const currentZoom = zoomLevel;
        
        // 현재 노드들의 확장/축소 상태
        const chartData = chartInstance.current.getChartState().data;
        const nodeStates = chartData.map((node: any) => ({
          id: node.id,
          expanded: node.expanded || false
        }));
        
        const viewState = {
          transform,
          gTransform,
          zoomLevel: currentZoom,
          nodeStates,
          timestamp: new Date().toISOString()
        };
        
        
        // 서버에 보기 상태 저장
        const response = await fetch('/api/save-view-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(viewState)
        });
        
        if (response.ok) {
          toast({
            title: "보기 저장 완료",
            description: "현재 보기 상태가 저장되었습니다.",
          });
        } else {
          throw new Error('보기 상태 저장 실패');
        }
      }
    } catch (error) {
      console.error('❌ 보기 상태 저장 중 오류:', error);
      toast({
        title: "저장 실패",
        description: "보기 상태 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 모두 열기 함수
  const expandAll = () => {
    if (chartInstance.current) {
      chartInstance.current.expandAll();
      toast({
        title: "모두 열기",
        description: "모든 노드가 확장되었습니다.",
      });
    }
  };

  // 모두 닫기 함수
  const collapseAll = () => {
    if (chartInstance.current) {
      chartInstance.current.collapseAll();
      toast({
        title: "모두 닫기",
        description: "모든 노드가 축소되었습니다.",
      });
    }
  };

  // 저장된 보기 상태 불러오기
  const loadSavedViewState = async () => {
    try {
      const response = await fetch('/api/load-view-state');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.viewState) {
          const viewState = result.viewState;
          
          // 저장된 보기 상태 적용
          setTimeout(() => {
            if (chartRef.current && viewState) {
    const svg = d3.select(chartRef.current).select('svg');
              
              // Transform 적용
              if (viewState.transform) {
                svg.style('transform', viewState.transform);
              }
              if (viewState.gTransform) {
                svg.select('g').attr('transform', viewState.gTransform);
              }
              
              // 노드 상태 복원 (조건부)
              if (viewState.nodeStates && chartInstance.current) {
                const chartData = chartInstance.current.getChartState().data;
                let hasExpandedNodes = false;
                
                // 확장된 노드가 있는지 확인
                viewState.nodeStates.forEach((nodeState: any) => {
                  if (nodeState.expanded) {
                    hasExpandedNodes = true;
                  }
                });
                
                // 확장된 노드가 있는 경우에만 상태 복원
                if (hasExpandedNodes) {
                  viewState.nodeStates.forEach((nodeState: any) => {
                    const node = chartData.find((n: any) => n.id === nodeState.id);
                    if (node) {
                      node.expanded = nodeState.expanded;
                    }
                  });
                } else {
                }
              }
              
            }
          }, 200);
        }
      }
    } catch (error) {
      console.error('❌ 보기 상태 불러오기 중 오류:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* 드래그 앤 드롭 CSS 스타일 */}
      <style>{`
        .hide {
          display: none;
        }
        .drag-enabled:not(.dragging-active) .node.draggable {
          stroke: grey;
          stroke-width: 3px;
          stroke-dasharray: 2px;
          cursor: grab;
        }
        .drag-enabled.dragging-active .droppable {
          stroke: green;
          stroke-width: 3px;
          stroke-dasharray: 5px;
        }
        .node.dragging {
          stroke-dasharray: 0 !important;
          stroke-width: 0 !important;
          opacity: 0.8 !important;
          cursor: grabbing !important;
          z-index: 1000 !important;
        }
        .node.dragging .content-container {
          background-color: #ffffff;
          box-shadow: 0 8px 16px rgba(0,0,0,0.3);
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .node.draggable:hover {
          cursor: grab;
        }
        .node.draggable:active {
          cursor: grabbing;
        }
      `}</style>
      
      {/* 조직도 뷰 컨트롤 패널 - 왼쪽 하단 */}
      <div className="absolute bottom-4 left-4 z-20 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={saveCurrentView}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              현재 보기 저장
            </button>
            <button 
              onClick={expandAll}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              모두 열기
            </button>
            <button 
              onClick={collapseAll}
              className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              모두 닫기
            </button>
          </div>
        </div>
      </div>

      {/* 드래그 앤 드롭 컨트롤 패널 */}
      <div className="absolute top-4 right-4 z-20 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="flex flex-col gap-2">
          {!dragEnabled ? (
            <div className="flex gap-2">
              <button 
                onClick={enableDrag}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                조직 정리
              </button>
              <button 
                onClick={saveData}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                저장
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
          <div className="flex gap-2">
                <button 
                  onClick={disableDrag}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  완료
                </button>
                <button 
                  onClick={cancelDrag}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  취소
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={undo}
                  disabled={undoActions.length === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  되돌리기
                </button>
                <button 
                  onClick={redo}
                  disabled={redoActions.length === 0}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  다시하기
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setAddModalType('department');
                    setAddModalData({ code: '', name: '', departmentCode: '' });
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  부서 추가
                </button>
                <button 
                  onClick={() => {
                    setAddModalType('team');
                    setAddModalData({ code: '', name: '', departmentCode: '' });
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  팀 추가
                </button>
              </div>
          </div>
        )}
        </div>
      </div>

      <div 
        ref={chartRef} 
        className="w-full h-full overflow-auto bg-muted/30 chart-container d3-org-chart"
        style={{
          minHeight: '800px',
          height: '100vh',
          width: '100%',
          position: 'relative'
        }}
      />

      {/* 부서/팀 추가 모달 */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {addModalType === 'department' ? '새 부서 추가' : 
               addModalType === 'team' ? '새 팀 추가' : 
               addModalType === 'employee' ? '새 직원 추가' : '신규 직원 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">
                {addModalType === 'department' ? '부서코드' : 
                 addModalType === 'team' ? '팀코드' : 
                 addModalType === 'employee' ? '사원번호' : '사원번호'}
              </Label>
                <Input
                id="code"
                value={addModalData.code}
                onChange={(e) => setAddModalData(prev => ({ ...prev, code: e.target.value }))}
                placeholder={addModalType === 'department' ? '예: RND' : 
                           addModalType === 'team' ? '예: RND01' : 
                           addModalType === 'employee' ? '예: 009' : '예: 013'}
                />
              </div>
            <div>
              <Label htmlFor="name">
                {addModalType === 'department' ? '부서명' : 
                 addModalType === 'team' ? '팀명' : 
                 addModalType === 'employee' ? '직원명' : '직원명'}
              </Label>
                <Input
                id="name"
                value={addModalData.name}
                onChange={(e) => setAddModalData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={addModalType === 'department' ? '예: 기술연구소' : 
                           addModalType === 'team' ? '예: 연구개발팀' : 
                           addModalType === 'employee' ? '예: 홍길동' : '예: 김신규'}
                />
              </div>
            {addModalType === 'team' && (
              <div>
                <Label htmlFor="departmentCode">소속 부서</Label>
                <Select 
                  value={addModalData.departmentCode} 
                  onValueChange={(value) => setAddModalData(prev => ({ ...prev, departmentCode: value }))}
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
            )}
            
            {addModalType === 'new-employee' && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">상속받을 부서/팀 정보</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">부서:</span> {addModalData.department} ({addModalData.departmentCode})</div>
                  <div><span className="font-medium">팀:</span> {addModalData.team} ({addModalData.teamCode})</div>
              </div>
                <p className="text-xs text-blue-600 mt-2">
                  * 신규 직원은 위 부서/팀에 자동으로 배정됩니다.
                </p>
            </div>
          )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button 
              onClick={addModalType === 'department' ? handleAddDepartment : 
                      addModalType === 'team' ? handleAddTeam : 
                      addModalType === 'employee' ? handleAddEmployee : handleAddNewEmployee}
              disabled={!addModalData.code || !addModalData.name || (addModalType === 'team' && !addModalData.departmentCode)}
            >
              {addModalType === 'department' ? '부서 추가' : 
               addModalType === 'team' ? '팀 추가' : 
               addModalType === 'employee' ? '직원 추가' : '신규 직원 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 직원 편집 모달 */}
      <EmployeeEditModal
        isOpen={isEditModalOpen}
        employee={editingEmployee}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
      />
      
      {/* 직원 정보 슬라이드 패널 */}
      <EmployeeInfoPanel
        employeeId={selectedEmployeeId}
        isOpen={isInfoPanelOpen}
        onClose={() => {
          setIsInfoPanelOpen(false);
          setSelectedEmployeeId(null);
        }}
        panelWidth={panelWidth}
        onWidthChange={setPanelWidth}
      />
    </div>
  );
}