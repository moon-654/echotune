import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { OrgChart } from "d3-org-chart";
import type { Employee } from "@shared/schema";

interface D3OrgChartProps {
  employees: Employee[];
  searchTerm: string;
  zoomLevel: number;
  onEmployeeSelect: (employeeId: string) => void;
}

export default function D3OrgChart({ employees, searchTerm, zoomLevel, onEmployeeSelect }: D3OrgChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  
  // 드래그 앤 드롭 상태 (index1.html과 동일)
  const [dragEnabled, setDragEnabled] = useState(false);
  const [dragNode, setDragNode] = useState<any>(null);
  const [dropNode, setDropNode] = useState<any>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isDragStarting, setIsDragStarting] = useState(false);
  const [undoActions, setUndoActions] = useState<any[]>([]);
  const [redoActions, setRedoActions] = useState<any[]>([]);

  // 데이터 변환 (팀 기반 조직도 구조)
  const transformEmployeesData = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    
    console.log('🏢 조직도 데이터 변환 시작');
    console.log('👥 전체 직원 수:', employees.length);
    
    // 직원 데이터를 문자열로 변환
    const stringData = employees.map(emp => {
      const newEmp: any = {};
      for (const key in emp) {
        if (Object.prototype.hasOwnProperty.call(emp, key)) {
          newEmp[key] = emp[key] === null || emp[key] === undefined ? "" : String(emp[key]);
        }
      }
      return newEmp;
    });

    // 팀별로 그룹화
    const teamGroups = new Map<string, any[]>();
    stringData.forEach(emp => {
      const teamKey = emp.team || '팀 없음';
      if (!teamGroups.has(teamKey)) {
        teamGroups.set(teamKey, []);
      }
      teamGroups.get(teamKey)!.push(emp);
    });

    console.log('📊 팀별 그룹:', Array.from(teamGroups.keys()));

    // 각 팀에서 계층 구조 설정
    const processedData: any[] = [];
    
    teamGroups.forEach((teamMembers, teamName) => {
      console.log(`\n🏷️ ${teamName} 팀 처리 중 (${teamMembers.length}명)`);
      
      // 팀장 찾기 (managerId가 null이거나 다른 팀의 managerId를 가진 경우)
      const teamLeaders = teamMembers.filter(emp => {
        if (!emp.managerId) return true; // 최상위
        const manager = stringData.find(m => m.id === emp.managerId);
        return !manager || manager.team !== teamName; // 다른 팀의 매니저
      });
      
      // 팀원들 (팀장이 아닌 경우)
      const teamMembers_only = teamMembers.filter(emp => !teamLeaders.includes(emp));
      
      console.log(`👑 ${teamName} 팀장:`, teamLeaders.map(l => l.name));
      console.log(`👥 ${teamName} 팀원:`, teamMembers_only.map(m => m.name));
      
      // 팀장이 여러 명인 경우, 첫 번째를 메인 팀장으로 설정
      if (teamLeaders.length > 1) {
        const mainLeader = teamLeaders[0];
        mainLeader.parentId = "";
        
        // 나머지 팀장들을 메인 팀장 하위로 설정
        teamLeaders.slice(1).forEach(leader => {
          leader.parentId = mainLeader.id;
        });
        
        // 팀원들을 메인 팀장 하위로 설정
        teamMembers_only.forEach(member => {
          member.parentId = mainLeader.id;
        });
        
        processedData.push(...teamLeaders, ...teamMembers_only);
      } else if (teamLeaders.length === 1) {
        // 팀장이 한 명인 경우
        const leader = teamLeaders[0];
        leader.parentId = "";
        
        // 팀원들을 팀장 하위로 설정
        teamMembers_only.forEach(member => {
          member.parentId = leader.id;
        });
        
        processedData.push(leader, ...teamMembers_only);
      } else {
        // 팀장이 없는 경우 (모든 팀원이 동일 레벨)
        teamMembers_only.forEach(member => {
          member.parentId = "";
        });
        processedData.push(...teamMembers_only);
      }
    });

    // 부서장들을 최상위로 설정
    const departmentHeads = processedData.filter(emp => 
      emp.position && emp.position.includes('부서장')
    );
    
    if (departmentHeads.length > 0) {
      console.log('🏢 부서장들:', departmentHeads.map(d => d.name));
      
      // 부서장들을 최상위로 설정
      departmentHeads.forEach(head => {
        head.parentId = "";
      });
      
      // 팀장들을 해당 부서장 하위로 설정
      const teamLeaders = processedData.filter(emp => 
        emp.position && emp.position.includes('팀장') && 
        !emp.position.includes('부서장')
      );
      
      teamLeaders.forEach(leader => {
        // 같은 부서의 부서장 찾기
        const sameDeptHead = departmentHeads.find(head => 
          head.department === leader.department
        );
        if (sameDeptHead) {
          leader.parentId = sameDeptHead.id;
        }
      });
    }

    // Multiple roots 문제 해결: 단일 루트 노드 보장
    const rootNodes = processedData.filter(emp => emp.parentId === "");
    console.log('🌳 루트 노드들:', rootNodes.map(r => r.name));
    
    if (rootNodes.length > 1) {
      console.log('⚠️ Multiple roots 감지, 단일 루트로 통합 중...');
      
      // 첫 번째 노드를 메인 루트로 설정
      const mainRoot = rootNodes[0];
      mainRoot.parentId = "";
      
      // 나머지 루트 노드들을 첫 번째 노드의 자식으로 설정
      const otherRoots = rootNodes.slice(1);
      otherRoots.forEach(emp => {
        emp.parentId = mainRoot.id;
        console.log(`🔗 ${emp.name}을 ${mainRoot.name} 하위로 이동`);
      });
      
      console.log('✅ Multiple roots 문제 해결 완료');
    } else if (rootNodes.length === 0) {
      console.log('⚠️ 루트 노드가 없음, 첫 번째 노드를 루트로 설정');
      if (processedData.length > 0) {
        processedData[0].parentId = "";
      }
    }

    // 최종 검증
    const finalRootNodes = processedData.filter(emp => emp.parentId === "");
    console.log('✅ 최종 루트 노드 수:', finalRootNodes.length);
    console.log('✅ 최종 루트 노드들:', finalRootNodes.map(r => r.name));

    console.log('✅ 조직도 데이터 변환 완료');
    console.log('📊 최종 데이터:', processedData.map(d => ({
      name: d.name,
      position: d.position,
      team: d.team,
      parentId: d.parentId
    })));

    return processedData;
  }, [employees]);

  // 노드 콘텐츠 생성 (개선된 디자인)
  const generateNodeContent = (d: any) => {
    return `
      <div class="node-container" style="
        width: 280px;
        height: 140px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div class="content-container" style="
          width: 260px;
          height: 120px;
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
          <!-- 상단 편집 버튼 -->
          <div style="
          position: absolute; 
            top: 8px;
            right: 8px;
          display: flex;
          align-items: center;
            gap: 4px;
          ">
            <div onclick="editNode('${d.data.id}')" style="
          cursor: pointer;
              padding: 4px 6px;
              border-radius: 6px;
              background-color: #f1f3f4;
          font-size: 12px;
              transition: all 0.2s ease;
              border: 1px solid #e0e0e0;
            " onmouseover="this.style.backgroundColor='#e8f0fe'; this.style.borderColor='#4285f4';" 
               onmouseout="this.style.backgroundColor='#f1f3f4'; this.style.borderColor='#e0e0e0';">
              ✏️
            </div>
            <div style="
              font-size: 8px;
              color: #9aa0a6;
              background-color: #f8f9fa;
              padding: 2px 4px;
              border-radius: 4px;
              border: 1px solid #e0e0e0;
            ">
              #${d.data.id}
            </div>
          </div>

          <!-- 프로필 이미지 -->
          <div style="
          position: absolute; 
            top: 20px;
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
            
            <!-- 직책 -->
            <div style="
              font-size: 12px;
              color: #5f6368;
              margin-bottom: 4px;
              line-height: 1.3;
            ">
              ${d.data.position}
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
        
            <!-- 팀 정보 (부서장이 아닌 경우만 표시) -->
            ${d.data.team ? `
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
              ${d.data.team}
            </div>
            ` : `
            <div style="
              font-size: 11px;
              color: #34a853;
              font-weight: 500;
              background-color: #e8f5e8;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
              border: 1px solid #c8e6c9;
            ">
              부서장
            </div>
            `}
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
      console.log('💾 팀 변경 정보 서버 저장 중...');
      console.log('📤 전송할 데이터:', teamData);
      
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 팀 변경 저장 성공:', result);
        
        // 성공 시 알림
        alert(`${teamData.team} 팀으로 이동되었습니다!`);
      } else {
        console.error('❌ 팀 변경 저장 실패:', response.status, response.statusText);
        alert('팀 변경 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 팀 변경 저장 중 오류 발생:', error);
      alert('팀 변경 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 드래그 앤 드롭 함수들 (index1.html과 동일)
  const onDragStart = (element: any, d: any, node: any) => {
    console.log('🚀 드래그 시작');
    console.log('  📍 마우스 위치:', { x: d.x, y: d.y });
    console.log('  👤 드래그 노드:', node.data?.name, 'ID:', node.data?.id);
    
    setDragNode(node);
    setDropNode(null);
    setIsDragStarting(true);
    
    const g = d3.select(element);
    g.classed('dragging', true);
    g.style('opacity', '0.7');
    g.style('cursor', 'grabbing');
    
    // 초기 위치 설정
    const transform = g.attr('transform');
    const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
    if (translate) {
      const startX = parseFloat(translate[1]);
      const startY = parseFloat(translate[2]);
      setDragStartX(startX);
      setDragStartY(startY);
      console.log('  📍 초기 노드 위치:', { startX, startY });
    } else {
      console.log('  ❌ transform을 찾을 수 없음:', transform);
      // 기본값 설정
      setDragStartX(0);
      setDragStartY(0);
    }
    
    // 차트 컨테이너에 dragging-active 클래스 추가
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.add('dragging-active');
    }
    
    console.log('  ✅ 드래그 시작 완료');
  };

  const onDrag = (element: any, dragEvent: any) => {
    console.log('🔄 드래그 중');
    console.log('  📍 마우스 위치:', { x: dragEvent.x, y: dragEvent.y });
    console.log('  📍 마우스 이동량:', { dx: dragEvent.dx, dy: dragEvent.dy });
    
    const currentDragNode = dragEvent.subject;
    if (!currentDragNode) {
      console.log('  ❌ 드래그 노드 없음');
      return;
    }
    
    console.log('  👤 드래그 노드:', currentDragNode.data?.name);
    
    // dragNode 상태를 현재 드래그 중인 노드로 업데이트
    if (!dragNode) {
      setDragNode(currentDragNode);
      console.log('  🔄 dragNode 상태 업데이트');
    }
    
    const g = d3.select(element);
    let currentDropNode = null;
    
    // 드래그 시작 시 한 번만 실행
    if (isDragStarting) {
      setIsDragStarting(false);
      console.log('  🚀 드래그 시작 처리');
      
      const chartContainer = document.querySelector('.chart-container');
      if (chartContainer) {
        chartContainer.classList.add('dragging-active');
      }
      
      // 드래그 중인 노드를 최상위로 이동
      g.raise();
      
      // 하위 노드들과 링크 제거
      const state = chartInstance.current?.getChartState();
      const descendants = dragEvent.subject.descendants();
      const linksToRemove = [...(descendants || []), dragEvent.subject];
      const nodesToRemove = descendants?.filter(
        (x: any) => x.data.id !== dragEvent.subject.id
      );

      // 관련 링크 제거
      if (state?.['linksWrapper']) {
        state['linksWrapper']
          .selectAll('path.link')
          .data(linksToRemove, (d: any) => state.nodeId(d))
          .remove();
      }

      // 하위 노드들 제거
      if (nodesToRemove && state?.['nodesWrapper']) {
        state['nodesWrapper']
          .selectAll('g.node')
          .data(nodesToRemove, (d: any) => state.nodeId(d))
          .remove();
      }
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

    console.log('  📍 드래그 영역:', {
      left: cP.left,
      right: cP.right,
      top: cP.top,
      bottom: cP.bottom,
      midX: cP.midX,
      midY: cP.midY
    });

    const allNodes = d3.selectAll('g.node:not(.dragging)');
    allNodes.select('rect').attr('fill', 'none');

    console.log('  🔍 드롭 대상 검색 시작, 총 노드 수:', allNodes.size());

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
        
        console.log(`  🔍 노드 체크: ${d2.data?.name}`, {
          겹침: isOverlapping,
          드롭가능: isDroppable,
          드래그중심: `(${cP.midX}, ${cP.midY})`,
          노드영역: `(${cPInner.left}, ${cPInner.top}) ~ (${cPInner.right}, ${cPInner.bottom})`
        });

        if (isOverlapping && isDroppable) {
          currentDropNode = d2;
          console.log('  ✅ 드롭 대상 발견:', d2.data?.name);
          return d2;
        }
      })
      .select('rect')
      .attr('fill', '#e4e1e1');

    setDropNode(currentDropNode);
    
    // 드래그 중 위치 업데이트
    const newX = dragStartX + parseFloat(dragEvent.dx);
    const newY = dragStartY + parseFloat(dragEvent.dy);
    g.attr('transform', `translate(${newX}, ${newY})`);
    
    console.log('  📍 노드 위치 업데이트:', { 
      이전위치: `(${dragStartX}, ${dragStartY})`,
      새위치: `(${newX}, ${newY})`,
      이동량: `(${dragEvent.dx}, ${dragEvent.dy})`,
      마우스위치: `(${dragEvent.x}, ${dragEvent.y})`
    });
    
    // 드래그 중인 노드의 실제 위치를 업데이트
    if (currentDragNode) {
      currentDragNode.x = newX;
      currentDragNode.y = newY;
    }
    
    // dragStartX, dragStartY를 업데이트하여 다음 드래그 이벤트에서 올바른 기준점 사용
    setDragStartX(newX);
    setDragStartY(newY);
  };

  const onDragEnd = (element: any, dragEvent: any) => {
    console.log('🏁 드래그 종료');
    console.log('  📍 마우스 위치:', { x: dragEvent.x, y: dragEvent.y });
    
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.remove('dragging-active');
    }

    // 시각적 피드백 복원
    const g = d3.select(element);
    g.classed('dragging', false);
    g.style('opacity', '1');
    g.style('cursor', 'grab');

    const currentDragNode = dragEvent.subject;
    if (!currentDragNode) {
      console.log('  ❌ 드래그 노드 없음');
      setDragNode(null);
      setDropNode(null);
      return;
    }
    
    console.log('  👤 드래그 노드:', currentDragNode.data?.name);
    
    // 드롭 대상 검색 (실시간으로 다시 검색)
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
    
    console.log('  🔍 드롭 대상 검색 중...');
    console.log('  📍 드래그 영역:', cP);
    
    // DOM에서 직접 노드들을 찾아서 검사
    const allNodeElements = d3.selectAll('g.node:not(.dragging)');
    console.log('  📊 DOM 노드 수:', allNodeElements.size());
    
    let currentDropNode = null;
    
    allNodeElements.each(function(d: any, i: any) {
      // 현재 드래그 중인 노드는 제외
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
      
      console.log('  🔍 노드 체크:', d.data?.name, {
        겹침: isOverlapping,
        드래그영역: `(${cP.left}, ${cP.top}) ~ (${cP.right}, ${cP.bottom})`,
        노드영역: `(${nodeRect.left}, ${nodeRect.top}) ~ (${nodeRect.right}, ${nodeRect.bottom})`
      });
      
      if (isOverlapping && !currentDropNode) {
        currentDropNode = d;
        console.log('  ✅ 드롭 대상 발견:', d.data?.name);
      }
    });
    
    console.log('  🎯 드롭 대상:', currentDropNode?.data?.name);

    // 드롭 대상이 없으면 원래 위치로 복귀
    if (!currentDropNode) {
      console.log('  ❌ 드롭 대상 없음 - 원래 위치로 복귀');
      chartInstance.current?.render();
      setDragNode(null);
      setDropNode(null);
      return;
    }
    
    console.log('  ✅ 드롭 대상 발견:', currentDropNode.data?.name);
    
    // 드롭 대상이 있으면 드롭 처리
    console.log('  🎯 드롭 처리 시작');
    console.log('  - 드래그 노드:', currentDragNode.data?.name);
    console.log('  - 드롭 대상:', currentDropNode.data?.name);

    if (currentDragNode.parent?.id === currentDropNode.id) {
      console.log('❌ 같은 부모로 드롭 - 변경 없음');
      chartInstance.current?.render();
      setDragNode(null);
      setDropNode(null);
      return;
    }

    console.log('✅ 드롭 성공:', currentDragNode?.data?.name, '->', currentDropNode?.data?.name);
    d3.select(element).remove();

    const data = chartInstance.current?.getChartState().data;
    const node = data?.find((x: any) => x.id === currentDragNode.id);
    const oldParentId = node.parentId;
    node.parentId = currentDropNode.id;

    console.log('🔄 계층 구조 변경:', {
      node: node.name,
      oldParent: oldParentId,
      newParent: currentDropNode.id
    });

    // 팀 변경 로직 추가
    const draggedEmployee = node;
    const targetNode = currentDropNode;
    
    console.log('🏷️ 팀 변경 처리 시작');
    console.log('👤 이동할 직원:', draggedEmployee.name);
    console.log('🎯 대상 노드:', targetNode.name, targetNode.team);
    
    // 대상 노드의 팀으로 이동
    if (targetNode.team && targetNode.team !== draggedEmployee.team) {
      console.log('🔄 팀 변경:', draggedEmployee.team, '->', targetNode.team);
      
      // 팀 정보 업데이트
      draggedEmployee.team = targetNode.team;
      draggedEmployee.teamCode = targetNode.teamCode;
      draggedEmployee.department = targetNode.department;
      draggedEmployee.departmentCode = targetNode.departmentCode;
      
      console.log('✅ 팀 정보 업데이트 완료:', {
        name: draggedEmployee.name,
        team: draggedEmployee.team,
        teamCode: draggedEmployee.teamCode,
        department: draggedEmployee.department
      });
      
      // 서버에 팀 변경 정보 저장
      updateEmployeeTeam(draggedEmployee.id, {
        team: draggedEmployee.team,
        teamCode: draggedEmployee.teamCode,
        department: draggedEmployee.department,
        departmentCode: draggedEmployee.departmentCode,
        managerId: targetNode.id
      });
      
      // 즉시 노드 표시 업데이트를 위한 차트 재렌더링
      console.log('🔄 팀 변경 후 즉시 노드 표시 업데이트');
      if (chartInstance.current) {
        chartInstance.current.render();
        console.log('✅ 노드 표시 업데이트 완료');
      }
    }

    setRedoActions([]);
    setUndoActions(prev => [...prev, {
      id: dragEvent.subject.id,
      parentId: oldParentId,
    }]);

    setDropNode(null);
    setDragNode(null);
    
    // 팀 변경 후 조직도 재구성
    console.log('🔄 팀 변경 후 조직도 재구성 중...');
    
    // 차트를 다시 렌더링하여 변경사항 반영
    if (chartInstance.current) {
      chartInstance.current.render();
      console.log('✅ 조직도 재구성 완료');
    }
  };

  const enableDrag = () => {
    console.log('🎯 드래그 모드 활성화');
    setDragEnabled(true);
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.classList.add('drag-enabled');
    }
  };

  const disableDrag = () => {
    console.log('🎯 드래그 모드 비활성화');
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
      console.log('🔄 Undo 실행:', action);
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
      console.log('🔄 Redo 실행:', action);
    }
  };

  const cancelDrag = () => {
    if (undoActions.length === 0) {
      disableDrag();
      return;
    }

    const data = chartInstance.current?.getChartState().data;
    
    // 모든 undo 액션을 역순으로 실행
    [...undoActions].reverse().forEach((action) => {
      const node = data?.find((x: any) => x.id === action.id);
      if (node) {
        node.parentId = action.parentId;
      }
    });

    disableDrag();
    chartInstance.current?.render();
    console.log('🔄 드래그 취소 - 모든 변경사항 되돌림');
  };



  const saveData = () => {
    const data = chartInstance.current?.getChartState().data;
    
    const cleanData = data?.map((d: any) => ({
      id: d.id,
      parentId: d.parentId,
      name: d.name,
      position: d.position,
      image: d.image
    }));

    console.log('💾 데이터 저장:', cleanData);
    // TODO: 실제 저장 로직 구현
    alert('데이터가 저장되었습니다!');
  };

  // 차트 렌더링
  useEffect(() => {
    if (!chartRef.current || !employees || employees.length === 0) return;

    const data = transformEmployeesData;
    
    // 기존 차트 제거
    d3.select(chartRef.current).selectAll("*").remove();

    try {
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
            console.log('🎯 노드에 드래그 이벤트 연결:', d.data?.name, 'draggable:', nodeElement.classed('draggable'), 'isRoot:', isRoot);
            
            nodeElement.call(
              d3.drag<any, any>()
                .filter(function (x: any, node: any) {
                  const isDraggable = this.classList.contains('draggable');
                  console.log('🎯 드래그 필터:', d.data?.name, 'draggable:', isDraggable, 'this:', this);
                  return isDraggable;
                })
                .on('start', function (d: any, node: any) {
                  console.log('🎯 드래그 이벤트 start 호출:', d, node);
                  onDragStart(this, d, node);
                })
                .on('drag', function (dragEvent: any, node: any) {
                  console.log('🎯 드래그 이벤트 drag 호출:', dragEvent, node);
                  onDrag(this, dragEvent);
                })
                .on('end', function (d: any) {
                  console.log('🎯 드래그 이벤트 end 호출:', d);
                  onDragEnd(this, d);
                })
            );
          }
        })
        .container(chartRef.current)
        .data(data)
        .render();

    chartInstance.current = chart;
    
    // 차트 렌더링 후 편집 함수 등록
    console.log('🔧 차트 렌더링 완료, editNode 함수 등록 중...');
    (window as any).editNode = async (nodeId: string) => {
      console.log('✏️ 편집 버튼 클릭:', nodeId);
      console.log('📊 차트 인스턴스:', chartInstance.current);
      
      const data = chartInstance.current?.getChartState().data;
      console.log('📊 차트 데이터:', data);
      
      const node = data?.find((d: any) => d.id === nodeId);
      console.log('👤 찾은 노드:', node);

      if (!node) {
        alert('노드를 찾을 수 없습니다.');
        return;
      }

      // 이름 편집
      const newName = prompt('새로운 이름을 입력하세요:', node.name);
      if (newName === null) return; // 사용자가 취소한 경우

      // 직책 편집
      const newPosition = prompt('새로운 직책을 입력하세요:', node.position);
      if (newPosition === null) return; // 사용자가 취소한 경우

      // 부서명 편집
      const newDepartment = prompt('새로운 부서명을 입력하세요:', node.department || '');
      if (newDepartment === null) return; // 사용자가 취소한 경우

      // 팀명 편집 (부서장은 팀이 없을 수 있음)
      const newTeam = prompt('새로운 팀명을 입력하세요 (부서장인 경우 빈칸으로 두세요):', node.team || '');
      if (newTeam === null) return; // 사용자가 취소한 경우

      // 부서코드 편집
      const newDepartmentCode = prompt('새로운 부서코드를 입력하세요:', node.departmentCode || '');
      if (newDepartmentCode === null) return; // 사용자가 취소한 경우

      // 팀코드 편집 (부서장은 팀코드가 없을 수 있음)
      const newTeamCode = prompt('새로운 팀코드를 입력하세요 (부서장인 경우 빈칸으로 두세요):', node.teamCode || '');
      if (newTeamCode === null) return; // 사용자가 취소한 경우

      // 노드 데이터 업데이트
      node.name = newName;
      node.position = newPosition;
      node.department = newDepartment;
      node.team = newTeam;
      node.departmentCode = newDepartmentCode;
      node.teamCode = newTeamCode;

      // 디버깅: 변경된 데이터 로그
      console.log('🔄 변경된 노드 데이터:', {
        id: node.id,
        name: node.name,
        position: node.position,
        department: node.department,
        team: node.team,
        departmentCode: node.departmentCode,
        teamCode: node.teamCode
      });

      // 서버에 데이터 저장 시도
      try {
        console.log('💾 서버에 데이터 저장 시도 중...');
        console.log('📤 전송할 데이터:', {
          id: node.id,
          name: node.name,
          position: node.position,
          department: node.department,
          team: node.team,
          departmentCode: node.departmentCode,
          teamCode: node.teamCode
        });
        
        const response = await fetch(`/api/employees/${node.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: node.name,
            position: node.position,
            department: node.department,
            team: node.team,
            departmentCode: node.departmentCode,
            teamCode: node.teamCode
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ 서버 저장 성공:', result);
          alert('데이터가 성공적으로 저장되었습니다!');
        } else {
          console.error('❌ 서버 저장 실패:', response.status, response.statusText);
          alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('❌ 서버 저장 중 오류 발생:', error);
        alert('데이터 저장 중 오류가 발생했습니다: ' + error.message);
      }

      // 차트를 다시 그려서 변경사항을 반영합니다.
      console.log('🔄 조직도 재구성 중...');
      
      // 조직도 데이터를 다시 변환하여 새로운 구조 반영
      const updatedData = transformEmployeesData;
      console.log('📊 업데이트된 조직도 데이터:', updatedData);
      
      // 차트에 새로운 데이터 적용
      if (chartInstance.current) {
        chartInstance.current.data(updatedData).render();
        console.log('✅ 조직도 재구성 완료');
      }
      
      console.log('✏️ 노드 편집 완료:', node);
    };
    console.log('✅ editNode 함수 등록 완료');

      // 줌 레벨 적용
    const svg = d3.select(chartRef.current).select('svg');
      if (svg.node()) {
    svg.style('transform', `scale(${zoomLevel / 100})`);
      }
      
    } catch (error) {
      console.error('❌ 차트 생성 중 오류 발생:', error);
    }

  }, [transformEmployeesData, zoomLevel, dragEnabled]);

  // 팀 변경 시 조직도 자동 업데이트
  useEffect(() => {
    if (chartInstance.current && transformEmployeesData.length > 0) {
      console.log('🔄 팀 변경 감지 - 조직도 자동 업데이트');
      console.log('📊 새로운 조직도 데이터:', transformEmployeesData);
      
      // 차트 데이터 업데이트
      chartInstance.current.data(transformEmployeesData).render();
      console.log('✅ 조직도 자동 업데이트 완료');
    }
  }, [transformEmployeesData]);

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
          opacity: 0.7 !important;
          cursor: grabbing !important;
          z-index: 1000 !important;
        }
        .node.dragging .content-container {
          background-color: #ffffff;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .node.draggable:hover {
          cursor: grab;
        }
        .node.draggable:active {
          cursor: grabbing;
        }
      `}</style>
      
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
          </div>
        )}
        </div>
      </div>

      <div 
        ref={chartRef} 
        className="w-full h-full overflow-auto bg-muted/30 chart-container"
        style={{
          minHeight: '800px',
          height: '100vh',
          width: '100%',
          position: 'relative'
        }}
      />
    </div>
  );
}