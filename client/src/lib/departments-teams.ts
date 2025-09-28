// 부서 및 팀 관리 - 심플한 방식
export interface Department {
  code: string;
  name: string;
}

export interface Team {
  code: string;
  name: string;
  departmentCode: string;
}

// 기본 부서들 (실제 데이터와 매칭)
export const DEFAULT_DEPARTMENTS: Department[] = [
  { code: "HQ", name: "아시모리코리아" },
  { code: "SL", name: "영업부문" },
  { code: "RND", name: "기술연구소" },
  { code: "QC", name: "품질부문" },
  { code: "PM", name: "생산관리부문" }
];

// 기본 팀들 (실제 데이터와 매칭)
export const DEFAULT_TEAMS: Team[] = [
  // 영업부문 팀들
  { code: "SL01", name: "국내영업팀", departmentCode: "SL" },
  { code: "SL02", name: "해외영업팀", departmentCode: "SL" },
  { code: "SL03", name: "마케팅팀", departmentCode: "SL" },
  
  // 기술연구소 팀들
  { code: "RND01", name: "연구기획팀", departmentCode: "RND" },
  { code: "RND02", name: "개발팀", departmentCode: "RND" },
  { code: "RND03", name: "연구팀", departmentCode: "RND" },
  { code: "RND04", name: "기술팀", departmentCode: "RND" },
  
  // 품질부문 팀들
  { code: "QC01", name: "품질관리팀", departmentCode: "QC" },
  { code: "QC02", name: "검사팀", departmentCode: "QC" },
  { code: "QC03", name: "인증팀", departmentCode: "QC" },
  
  // 생산관리부문 팀들
  { code: "PM01", name: "생산팀", departmentCode: "PM" },
  { code: "PM02", name: "물류팀", departmentCode: "PM" },
  { code: "PM03", name: "설비팀", departmentCode: "PM" }
];

// API를 통한 부서/팀 관리
export class DepartmentTeamManager {
  // 서버에서 부서/팀 데이터 가져오기
  static async getStoredData(): Promise<{ departments: Department[], teams: Team[] }> {
    try {
      const [departmentsResponse, teamsResponse] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/teams')
      ]);
      
      if (!departmentsResponse.ok || !teamsResponse.ok) {
        throw new Error('API 요청 실패');
      }
      
      const departments = await departmentsResponse.json();
      const teams = await teamsResponse.json();
      
      return { departments, teams };
    } catch (error) {
      console.error('서버에서 부서/팀 데이터를 불러오는데 실패:', error);
      
      // 기본 데이터 반환
      return {
        departments: DEFAULT_DEPARTMENTS,
        teams: DEFAULT_TEAMS
      };
    }
  }

  // 새 부서 추가
  static async addDepartment(code: string, name: string): Promise<void> {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '부서 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('부서 추가 실패:', error);
      throw error;
    }
  }

  // 새 팀 추가
  static async addTeam(code: string, name: string, departmentCode: string): Promise<void> {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, name, departmentCode }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 추가 실패:', error);
      throw error;
    }
  }

  // 부서 삭제
  static async removeDepartment(code: string): Promise<void> {
    try {
      const response = await fetch(`/api/departments/${code}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '부서 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('부서 삭제 실패:', error);
      throw error;
    }
  }

  // 팀 삭제
  static async removeTeam(code: string): Promise<void> {
    try {
      const response = await fetch(`/api/teams/${code}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 삭제 실패:', error);
      throw error;
    }
  }

  // 부서별 팀 목록 가져오기
  static async getTeamsByDepartment(departmentCode: string): Promise<Team[]> {
    try {
      const response = await fetch(`/api/teams?departmentCode=${departmentCode}`);
      if (!response.ok) {
        throw new Error('팀 목록을 불러올 수 없습니다.');
      }
      return await response.json();
    } catch (error) {
      console.error('부서별 팀 목록 조회 실패:', error);
      return [];
    }
  }

  // 모든 부서 목록
  static async getAllDepartments(): Promise<Department[]> {
    try {
      console.log('🔍 부서 목록 API 호출 시작');
      const response = await fetch('/api/departments');
      console.log('📡 부서 목록 API 응답:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 부서 목록 API 오류:', response.status, errorText);
        throw new Error(`부서 목록을 불러올 수 없습니다. (${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ 부서 목록 데이터:', data);
      return data;
    } catch (error) {
      console.error('❌ 부서 목록 조회 실패:', error);
      console.log('🔄 기본 부서 데이터 사용');
      return DEFAULT_DEPARTMENTS;
    }
  }

  // 모든 팀 목록
  static async getAllTeams(): Promise<Team[]> {
    try {
      console.log('🔍 팀 목록 API 호출 시작');
      const response = await fetch('/api/teams');
      console.log('📡 팀 목록 API 응답:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 팀 목록 API 오류:', response.status, errorText);
        throw new Error(`팀 목록을 불러올 수 없습니다. (${response.status})`);
      }
      
      const data = await response.json();
      console.log('✅ 팀 목록 데이터:', data);
      return data;
    } catch (error) {
      console.error('❌ 팀 목록 조회 실패:', error);
      console.log('🔄 기본 팀 데이터 사용');
      return DEFAULT_TEAMS;
    }
  }

  // 부서 수정
  static async updateDepartment(code: string, name: string): Promise<void> {
    try {
      const response = await fetch(`/api/departments/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '부서 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('부서 수정 실패:', error);
      throw error;
    }
  }

  // 팀 수정
  static async updateTeam(code: string, name: string, departmentCode: string): Promise<void> {
    try {
      const response = await fetch(`/api/teams/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, departmentCode }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팀 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('팀 수정 실패:', error);
      throw error;
    }
  }
}
