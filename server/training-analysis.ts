import type { TrainingHours, TeamEmployees, Employee } from "@shared/schema";

export interface TrainingAnalysisResult {
  averageHoursPerPerson: number;
  totalHours: number;
  cumulativeEmployees: number;
  period: {
    startYear: number;
    endYear: number;
  };
  trainingTypeBreakdown?: {
    [trainingType: string]: number;
  };
  yearlyBreakdown?: {
    [year: string]: {
      totalHours: number;
      totalEmployees: number;
      averageHoursPerPerson: number;
    };
  };
}

export interface TrainingAnalysisOptions {
  startYear: number;
  endYear: number;
  includeTrainingTypeBreakdown?: boolean;
  includeYearlyBreakdown?: boolean;
  useAutoRdEmployees?: boolean; // R&D 인원 자동 계산 사용 여부
}

export class TrainingAnalysisModule {
  /**
   * 교육 시간 분석의 핵심 로직
   * 지정된 기간의 교육 시간과 인원 데이터를 기반으로 1인당 평균 교육 시간을 계산합니다.
   */
  static async analyzeTrainingHours(
    trainingHoursData: TrainingHours[],
    teamEmployeesData: TeamEmployees[],
    options: TrainingAnalysisOptions,
    allEmployees?: Employee[] // 전체 직원 데이터 (R&D 인원 자동 계산용)
  ): Promise<TrainingAnalysisResult> {
    const { startYear, endYear, includeTrainingTypeBreakdown = false, includeYearlyBreakdown = false, useAutoRdEmployees = false } = options;

    console.log(`📊 교육 시간 분석 시작: ${startYear}-${endYear}`);
    console.log(`📊 교육 시간 데이터: ${trainingHoursData.length}개`);
    console.log(`📊 팀 인원 데이터: ${teamEmployeesData.length}개`);

    // 1. 총 교육 시간 계산
    const totalHours = this.calculateTotalTrainingHours(trainingHoursData, startYear, endYear);
    console.log(`📊 총 교육 시간: ${totalHours}시간`);

    // 2. 누적 R&D 인원 계산
    let cumulativeEmployees: number;
    if (useAutoRdEmployees && allEmployees) {
      cumulativeEmployees = this.calculateAutoRdEmployees(allEmployees, startYear, endYear);
      console.log(`📊 자동 계산된 R&D 인원: ${cumulativeEmployees}명`);
    } else {
      cumulativeEmployees = this.calculateCumulativeEmployees(teamEmployeesData, startYear, endYear);
      console.log(`📊 누적 R&D 인원: ${cumulativeEmployees}명`);
    }

    // 3. 1인당 평균 교육 시간 계산
    const averageHoursPerPerson = cumulativeEmployees > 0 ? totalHours / cumulativeEmployees : 0;
    console.log(`📊 1인당 평균 교육 시간: ${averageHoursPerPerson.toFixed(2)}시간`);

    const result: TrainingAnalysisResult = {
      averageHoursPerPerson: Math.round(averageHoursPerPerson * 100) / 100, // 소수점 둘째 자리까지
      totalHours: Math.round(totalHours * 10) / 10, // 소수점 첫째 자리까지
      cumulativeEmployees,
      period: {
        startYear,
        endYear
      }
    };

    // 4. 부가 기능: 교육 유형별 총 시간 계산
    if (includeTrainingTypeBreakdown) {
      result.trainingTypeBreakdown = this.calculateTrainingTypeBreakdown(trainingHoursData, startYear, endYear);
    }

    // 5. 부가 기능: 연도별 분석
    if (includeYearlyBreakdown) {
      result.yearlyBreakdown = this.calculateYearlyBreakdown(trainingHoursData, teamEmployeesData, startYear, endYear);
    }

    console.log(`📊 교육 시간 분석 완료:`, result);
    return result;
  }

  /**
   * ① 총 교육 시간 계산
   * 지정된 기간 내의 모든 교육 시간 데이터를 조회하고 합계를 계산합니다.
   */
  private static calculateTotalTrainingHours(
    trainingHoursData: TrainingHours[],
    startYear: number,
    endYear: number
  ): number {
    return trainingHoursData
      .filter(th => th.year >= startYear && th.year <= endYear)
      .reduce((sum, th) => sum + th.hours, 0);
  }

  /**
   * ② 누적 R&D 인원 계산
   * 지정된 기간 내의 모든 인원 데이터를 조회하고 합계를 계산합니다.
   */
  private static calculateCumulativeEmployees(
    teamEmployeesData: TeamEmployees[],
    startYear: number,
    endYear: number
  ): number {
    return teamEmployeesData
      .filter(te => te.year >= startYear && te.year <= endYear)
      .reduce((sum, te) => sum + te.employeeCount, 0);
  }

  /**
   * 교육 유형별 총 시간 계산 (부가 기능)
   */
  private static calculateTrainingTypeBreakdown(
    trainingHoursData: TrainingHours[],
    startYear: number,
    endYear: number
  ): { [trainingType: string]: number } {
    const breakdown: { [trainingType: string]: number } = {};
    
    trainingHoursData
      .filter(th => th.year >= startYear && th.year <= endYear)
      .forEach(th => {
        if (!breakdown[th.trainingType]) {
          breakdown[th.trainingType] = 0;
        }
        breakdown[th.trainingType] += th.hours;
      });

    return breakdown;
  }

  /**
   * 연도별 분석 (부가 기능)
   */
  private static calculateYearlyBreakdown(
    trainingHoursData: TrainingHours[],
    teamEmployeesData: TeamEmployees[],
    startYear: number,
    endYear: number
  ): { [year: string]: { totalHours: number; totalEmployees: number; averageHoursPerPerson: number } } {
    const breakdown: { [year: string]: { totalHours: number; totalEmployees: number; averageHoursPerPerson: number } } = {};

    for (let year = startYear; year <= endYear; year++) {
      const yearTrainingHours = trainingHoursData
        .filter(th => th.year === year)
        .reduce((sum, th) => sum + th.hours, 0);

      const yearEmployees = teamEmployeesData
        .filter(te => te.year === year)
        .reduce((sum, te) => sum + te.employeeCount, 0);

      const yearAverage = yearEmployees > 0 ? yearTrainingHours / yearEmployees : 0;

      breakdown[year.toString()] = {
        totalHours: Math.round(yearTrainingHours * 10) / 10,
        totalEmployees: yearEmployees,
        averageHoursPerPerson: Math.round(yearAverage * 100) / 100
      };
    }

    return breakdown;
  }

  /**
   * 특정 교육 유형의 총 시간 계산 (부가 기능)
   */
  static calculateTrainingHoursByType(
    trainingHoursData: TrainingHours[],
    trainingType: string,
    startYear: number,
    endYear: number
  ): number {
    return trainingHoursData
      .filter(th => 
        th.year >= startYear && 
        th.year <= endYear && 
        th.trainingType === trainingType
      )
      .reduce((sum, th) => sum + th.hours, 0);
  }

  /**
   * 특정 연도의 총 인원 조회 (부가 기능)
   */
  static getTotalEmployeesByYear(
    teamEmployeesData: TeamEmployees[],
    year: number
  ): number {
    return teamEmployeesData
      .filter(te => te.year === year)
      .reduce((sum, te) => sum + te.employeeCount, 0);
  }

  /**
   * R&D 인원 자동 계산 (기술연구소 부문 소속 직원)
   */
  private static calculateAutoRdEmployees(
    allEmployees: Employee[],
    startYear: number,
    endYear: number
  ): number {
    console.log(`📊 전체 직원 수: ${allEmployees.length}명`);
    console.log(`📊 전체 직원 목록:`, allEmployees.map(emp => ({ 
      name: emp.name, 
      department: emp.department, 
      team: emp.team,
      departmentCode: emp.departmentCode,
      isActive: emp.isActive
    })));
    
    // 기술연구소 부문에 소속된 모든 직원을 R&D 인원으로 계산
    const rdEmployees = allEmployees.filter(employee => {
      // 부서명이 "기술연구소" 또는 "연구개발" 또는 "R&D"를 포함하는 경우
      const isRdDepartment = employee.department && (
        employee.department.includes('기술연구소') ||
        employee.department.includes('연구개발') ||
        employee.department.includes('R&D') ||
        employee.department.includes('연구') ||
        employee.departmentCode === 'RD' // 부서 코드가 RD인 경우
      );
      
      // 팀명이 연구 관련인 경우도 포함
      const isRdTeam = employee.team && (
        employee.team.includes('연구') ||
        employee.team.includes('개발') ||
        employee.team.includes('R&D')
      );
      
      const isRd = isRdDepartment || isRdTeam;
      
      if (isRd) {
        console.log(`📊 R&D 직원 발견: ${employee.name} (부서: ${employee.department}, 팀: ${employee.team}, 부서코드: ${employee.departmentCode})`);
      }
      
      return isRd;
    });

    console.log(`📊 기술연구소 부문 소속 직원: ${rdEmployees.length}명`);
    console.log(`📊 R&D 직원 목록:`, rdEmployees.map(emp => ({ name: emp.name, department: emp.department, team: emp.team })));
    
    return rdEmployees.length;
  }

  /**
   * 연도별 R&D 인원 자동 계산 (부가 기능)
   */
  static calculateAutoRdEmployeesByYear(
    allEmployees: Employee[],
    year: number
  ): number {
    // 특정 연도에 입사한 R&D 직원 수 계산
    const rdEmployees = allEmployees.filter(employee => {
      const isRdDepartment = employee.department && (
        employee.department.includes('기술연구소') ||
        employee.department.includes('연구개발') ||
        employee.department.includes('R&D') ||
        employee.department.includes('연구') ||
        employee.departmentCode === 'RD'
      );
      
      const isRdTeam = employee.team && (
        employee.team.includes('연구') ||
        employee.team.includes('개발') ||
        employee.team.includes('R&D')
      );
      
      // 입사일이 해당 연도인 경우
      const hireYear = employee.hireDate ? new Date(employee.hireDate).getFullYear() : null;
      const isActiveInYear = hireYear && hireYear <= year;
      
      return (isRdDepartment || isRdTeam) && isActiveInYear;
    });

    return rdEmployees.length;
  }
}
