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

// 기본 부서들 (4개 부문)
export const DEFAULT_DEPARTMENTS: Department[] = [
  { code: "SL", name: "영업부문" },
  { code: "RD", name: "연구소" },
  { code: "QC", name: "품질부문" },
  { code: "PM", name: "생산관리부문" }
];

// 기본 팀들 (4개 부문별 팀들)
export const DEFAULT_TEAMS: Team[] = [
  // 영업부문 팀들
  { code: "SL01", name: "국내영업팀", departmentCode: "SL" },
  { code: "SL02", name: "해외영업팀", departmentCode: "SL" },
  { code: "SL03", name: "마케팅팀", departmentCode: "SL" },
  
  // 연구소 팀들
  { code: "RD01", name: "개발팀", departmentCode: "RD" },
  { code: "RD02", name: "연구팀", departmentCode: "RD" },
  { code: "RD03", name: "기술팀", departmentCode: "RD" },
  
  // 품질부문 팀들
  { code: "QC01", name: "품질관리팀", departmentCode: "QC" },
  { code: "QC02", name: "검사팀", departmentCode: "QC" },
  { code: "QC03", name: "인증팀", departmentCode: "QC" },
  
  // 생산관리부문 팀들
  { code: "PM01", name: "생산팀", departmentCode: "PM" },
  { code: "PM02", name: "물류팀", departmentCode: "PM" },
  { code: "PM03", name: "설비팀", departmentCode: "PM" }
];

// 로컬 스토리지에서 부서/팀 관리
export class DepartmentTeamManager {
  private static STORAGE_KEY = 'echotune_departments_teams';

  // 저장된 부서/팀 데이터 가져오기
  static getStoredData(): { departments: Department[], teams: Team[] } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('로컬 스토리지에서 부서/팀 데이터를 불러오는데 실패:', error);
    }
    
    // 기본 데이터 반환
    return {
      departments: DEFAULT_DEPARTMENTS,
      teams: DEFAULT_TEAMS
    };
  }

  // 부서/팀 데이터 저장
  static saveData(departments: Department[], teams: Team[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ departments, teams }));
    } catch (error) {
      console.error('로컬 스토리지에 부서/팀 데이터를 저장하는데 실패:', error);
    }
  }

  // 새 부서 추가
  static addDepartment(code: string, name: string): void {
    const { departments, teams } = this.getStoredData();
    const newDepartment: Department = { code, name };
    
    // 중복 체크
    if (departments.find(d => d.code === code)) {
      throw new Error('이미 존재하는 부서코드입니다.');
    }
    
    departments.push(newDepartment);
    this.saveData(departments, teams);
  }

  // 새 팀 추가
  static addTeam(code: string, name: string, departmentCode: string): void {
    const { departments, teams } = this.getStoredData();
    const newTeam: Team = { code, name, departmentCode };
    
    // 부서 존재 체크
    if (!departments.find(d => d.code === departmentCode)) {
      throw new Error('존재하지 않는 부서입니다.');
    }
    
    // 중복 체크
    if (teams.find(t => t.code === code)) {
      throw new Error('이미 존재하는 팀코드입니다.');
    }
    
    teams.push(newTeam);
    this.saveData(departments, teams);
  }

  // 부서 삭제
  static removeDepartment(code: string): void {
    const { departments, teams } = this.getStoredData();
    
    // 해당 부서의 팀들도 삭제
    const filteredTeams = teams.filter(t => t.departmentCode !== code);
    const filteredDepartments = departments.filter(d => d.code !== code);
    
    this.saveData(filteredDepartments, filteredTeams);
  }

  // 팀 삭제
  static removeTeam(code: string): void {
    const { departments, teams } = this.getStoredData();
    const filteredTeams = teams.filter(t => t.code !== code);
    
    this.saveData(departments, filteredTeams);
  }

  // 부서별 팀 목록 가져오기
  static getTeamsByDepartment(departmentCode: string): Team[] {
    const { teams } = this.getStoredData();
    return teams.filter(t => t.departmentCode === departmentCode);
  }

  // 모든 부서 목록
  static getAllDepartments(): Department[] {
    return this.getStoredData().departments;
  }

  // 모든 팀 목록
  static getAllTeams(): Team[] {
    return this.getStoredData().teams;
  }
}
