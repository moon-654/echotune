import { randomUUID } from "crypto";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { 
  Employee, 
  InsertEmployee, 
  TrainingHistory, 
  InsertTrainingHistory,
  Certification,
  InsertCertification,
  Language,
  InsertLanguage,
  Skill,
  InsertSkill,
  SkillCalculation,
  InsertSkillCalculation,
  Patent,
  InsertPatent,
  Publication,
  InsertPublication,
  Award,
  InsertAward,
  Project,
  InsertProject
} from "@shared/schema";

export interface IStorage {
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  
  // View state methods
  saveViewState(viewState: any): void;
  getViewState(): any;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<boolean>;

  // Training History methods
  getTrainingHistory(id: string): Promise<TrainingHistory | undefined>;
  getAllTrainingHistory(): Promise<TrainingHistory[]>;
  getTrainingHistoryByEmployee(employeeId: string): Promise<TrainingHistory[]>;
  createTrainingHistory(training: InsertTrainingHistory): Promise<TrainingHistory>;
  updateTrainingHistory(id: string, training: Partial<InsertTrainingHistory>): Promise<TrainingHistory>;
  deleteTrainingHistory(id: string): Promise<boolean>;

  // Certification methods
  getCertification(id: string): Promise<Certification | undefined>;
  getAllCertifications(): Promise<Certification[]>;
  getCertificationsByEmployee(employeeId: string): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: string, certification: Partial<InsertCertification>): Promise<Certification>;
  deleteCertification(id: string): Promise<boolean>;

  // Language methods
  getLanguage(id: string): Promise<Language | undefined>;
  getAllLanguages(): Promise<Language[]>;
  getLanguagesByEmployee(employeeId: string): Promise<Language[]>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(id: string, language: Partial<InsertLanguage>): Promise<Language>;
  deleteLanguage(id: string): Promise<boolean>;

  // Skill methods
  getSkill(id: string): Promise<Skill | undefined>;
  getAllSkills(): Promise<Skill[]>;
  getSkillsByEmployee(employeeId: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: string, skill: Partial<InsertSkill>): Promise<Skill>;
  deleteSkill(id: string): Promise<boolean>;

  // Skill Calculation methods
  getSkillCalculation(id: string): Promise<SkillCalculation | undefined>;
  getAllSkillCalculations(): Promise<SkillCalculation[]>;
  getSkillCalculationsByEmployee(employeeId: string): Promise<SkillCalculation[]>;
  createSkillCalculation(calculation: InsertSkillCalculation): Promise<SkillCalculation>;
  updateSkillCalculation(id: string, calculation: Partial<InsertSkillCalculation>): Promise<SkillCalculation>;
  deleteSkillCalculation(id: string): Promise<boolean>;
  
  // Patent methods
  getPatent(id: string): Promise<Patent | undefined>;
  getAllPatents(): Promise<Patent[]>;
  getPatentsByEmployee(employeeId: string): Promise<Patent[]>;
  createPatent(patent: InsertPatent): Promise<Patent>;
  updatePatent(id: string, patent: Partial<InsertPatent>): Promise<Patent>;
  deletePatent(id: string): Promise<boolean>;
  
  // Publication methods
  getPublication(id: string): Promise<Publication | undefined>;
  getAllPublications(): Promise<Publication[]>;
  getPublicationsByEmployee(employeeId: string): Promise<Publication[]>;
  createPublication(publication: InsertPublication): Promise<Publication>;
  updatePublication(id: string, publication: Partial<InsertPublication>): Promise<Publication>;
  deletePublication(id: string): Promise<boolean>;
  
  // Award methods
  getAward(id: string): Promise<Award | undefined>;
  getAllAwards(): Promise<Award[]>;
  getAwardsByEmployee(employeeId: string): Promise<Award[]>;
  createAward(award: InsertAward): Promise<Award>;
  updateAward(id: string, award: Partial<InsertAward>): Promise<Award>;
  deleteAward(id: string): Promise<boolean>;
  
  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByEmployee(employeeId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<boolean>;
  
  // Full profile method
  getEmployeeFullProfile(employeeId: string): Promise<{
    employee: Employee;
    trainingHistory: TrainingHistory[];
    certifications: Certification[];
    languages: Language[];
    skills: Skill[];
    skillCalculations: SkillCalculation[];
    patents: Patent[];
    publications: Publication[];
    awards: Award[];
    projects: Project[];
  }>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private trainingHistory: Map<string, TrainingHistory>;
  private certifications: Map<string, Certification>;
  private languages: Map<string, Language>;
  private skills: Map<string, Skill>;
  private skillCalculations: Map<string, SkillCalculation>;
  private patents: Map<string, Patent>;
  private publications: Map<string, Publication>;
  private awards: Map<string, Award>;
  private projects: Map<string, Project>;
  private viewState: any;
  private dataFile: string;

  constructor() {
    this.employees = new Map();
    this.trainingHistory = new Map();
    this.certifications = new Map();
    this.languages = new Map();
    this.skills = new Map();
    this.skillCalculations = new Map();
    this.patents = new Map();
    this.publications = new Map();
    this.awards = new Map();
    this.projects = new Map();
    this.viewState = null;
    this.dataFile = join(process.cwd(), 'data.json');
    
    // Load data from file or initialize with sample data
    this.loadData();
  }

  private loadData() {
    try {
      console.log('📁 데이터 파일 경로:', this.dataFile);
      console.log('📁 파일 존재 여부:', existsSync(this.dataFile));
      
      if (existsSync(this.dataFile)) {
        console.log('📁 기존 데이터 파일 로드 중...');
        const data = JSON.parse(readFileSync(this.dataFile, 'utf8'));
        console.log('📁 로드된 데이터 키:', Object.keys(data));
        
        // Load employees
        if (data.employees) {
          Object.entries(data.employees).forEach(([id, employee]) => {
            this.employees.set(id, employee as Employee);
          });
          console.log(`✅ ${this.employees.size}명의 직원 데이터 로드 완료`);
        }
        
        // Load other data if exists
        if (data.trainingHistory) {
          Object.entries(data.trainingHistory).forEach(([id, item]) => {
            this.trainingHistory.set(id, item as TrainingHistory);
          });
        }
        
        // Load view state if exists
        if (data.viewState) {
          this.viewState = data.viewState;
          console.log('✅ 보기 상태 로드 완료');
        }
        
        console.log('📁 데이터 파일에서 로드 완료');
        return;
      } else {
        console.log('📁 데이터 파일이 존재하지 않음');
      }
    } catch (error) {
      console.error('❌ 데이터 파일 로드 실패:', error);
    }
    
    // Initialize with sample data if no file exists
    console.log('📁 샘플 데이터로 초기화...');
    this.initializeSampleData();
  }

  private saveData() {
    try {
      const data = {
        employees: Object.fromEntries(this.employees),
        trainingHistory: Object.fromEntries(this.trainingHistory),
        certifications: Object.fromEntries(this.certifications),
        languages: Object.fromEntries(this.languages),
        skills: Object.fromEntries(this.skills),
        skillCalculations: Object.fromEntries(this.skillCalculations),
        patents: Object.fromEntries(this.patents),
        publications: Object.fromEntries(this.publications),
        awards: Object.fromEntries(this.awards),
        projects: Object.fromEntries(this.projects),
        viewState: this.viewState
      };
      
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log('💾 데이터 파일 저장 완료');
    } catch (error) {
      console.error('❌ 데이터 파일 저장 실패:', error);
    }
  }

  private initializeSampleData() {
    // 체계적인 조직 구조: 지사장 -> 4개 부문장 -> 팀장 -> 팀원
    // 고유 코드 체계:
    // - 부서 코드: HQ(본사), SL(영업), RD(연구), QC(품질), PM(생산)
    // - 팀 코드: 부서코드 + 2자리 숫자 (예: SL01, RD01)
    // - 직원 ID: emp + 2자리 숫자 (emp00 ~ emp99)
    const sampleEmployees: Employee[] = [
      // 지사장 (최상위)
      {
        id: "emp0",
        employeeNumber: "000",
        departmentCode: "HQ",
        teamCode: null,
        name: "이지사",
        position: "지사장",
        department: "본사",
        team: null,
        email: "lee.ceo@ashimori.co.kr",
        phone: "010-0000-0000",
        hireDate: new Date("2015-01-01"),
        managerId: null,
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 영업부문장
      {
        id: "emp1",
        employeeNumber: "001",
        departmentCode: "SL",
        teamCode: null,
        name: "김영업",
        position: "영업부문장",
        department: "영업부문",
        team: null,
        email: "kim.sales@ashimori.co.kr",
        phone: "010-1234-5678",
        hireDate: new Date("2018-03-15"),
        managerId: "emp0",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 연구소장
      {
        id: "emp2",
        employeeNumber: "002",
        departmentCode: "RD",
        teamCode: null,
        name: "박연구",
        position: "연구소장",
        department: "연구소",
        team: null,
        email: "park.rd@ashimori.co.kr",
        phone: "010-2345-6789",
        hireDate: new Date("2019-07-01"),
        managerId: "emp0",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 품질부문장
      {
        id: "emp3",
        employeeNumber: "003",
        departmentCode: "QC",
        teamCode: null,
        name: "이품질",
        position: "품질부문장",
        department: "품질부문",
        team: null,
        email: "lee.qc@ashimori.co.kr",
        phone: "010-3456-7890",
        hireDate: new Date("2017-11-20"),
        managerId: "emp0",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 생산관리부문장
      {
        id: "emp4",
        employeeNumber: "004",
        departmentCode: "PM",
        teamCode: null,
        name: "정생산",
        position: "생산관리부문장",
        department: "생산관리부문",
        team: null,
        email: "jung.pm@ashimori.co.kr",
        phone: "010-4567-8901",
        hireDate: new Date("2016-09-10"),
        managerId: "emp0",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 영업부문 하위 팀장들
      {
        id: "emp5",
        employeeNumber: "005",
        departmentCode: "SL",
        teamCode: "SL01",
        name: "최영업",
        position: "국내영업팀장",
        department: "영업부문",
        team: "국내영업팀",
        email: "choi.sales@ashimori.co.kr",
        phone: "010-5678-9012",
        hireDate: new Date("2020-02-15"),
        managerId: "emp1",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        id: "emp6",
        employeeNumber: "006",
        departmentCode: "SL",
        teamCode: "SL02",
        name: "한해외",
        position: "해외영업팀장",
        department: "영업부문",
        team: "해외영업팀",
        email: "han.overseas@ashimori.co.kr",
        phone: "010-6789-0123",
        hireDate: new Date("2019-05-20"),
        managerId: "emp1",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 연구소 하위 팀장들
      {
        id: "emp7",
        employeeNumber: "007",
        departmentCode: "RD",
        teamCode: "RD01",
        name: "김개발",
        position: "개발팀장",
        department: "연구소",
        team: "개발팀",
        email: "kim.dev@ashimori.co.kr",
        phone: "010-7890-1234",
        hireDate: new Date("2020-08-10"),
        managerId: "emp2",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        id: "emp8",
        employeeNumber: "008",
        departmentCode: "RD",
        teamCode: "RD02",
        name: "박연구",
        position: "연구팀장",
        department: "연구소",
        team: "연구팀",
        email: "park.research@ashimori.co.kr",
        phone: "010-8901-2345",
        hireDate: new Date("2018-12-01"),
        managerId: "emp2",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 품질부문 하위 팀장들
      {
        id: "emp9",
        employeeNumber: "009",
        departmentCode: "QC",
        teamCode: "QC01",
        name: "이품질",
        position: "품질관리팀장",
        department: "품질부문",
        team: "품질관리팀",
        email: "lee.quality@ashimori.co.kr",
        phone: "010-9012-3456",
        hireDate: new Date("2019-03-15"),
        managerId: "emp3",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 생산관리부문 하위 팀장들
      {
        id: "emp10",
        employeeNumber: "010",
        departmentCode: "PM",
        teamCode: "PM01",
        name: "정생산",
        position: "생산팀장",
        department: "생산관리부문",
        team: "생산팀",
        email: "jung.production@ashimori.co.kr",
        phone: "010-0123-4567",
        hireDate: new Date("2017-06-01"),
        managerId: "emp4",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // 팀원들 (각 팀장 하위)
      {
        id: "emp11",
        employeeNumber: "011",
        departmentCode: "SL",
        teamCode: "SL01",
        name: "김국내",
        position: "국내영업팀 사원",
        department: "영업부문",
        team: "국내영업팀",
        email: "kim.domestic@ashimori.co.kr",
        phone: "010-1234-5678",
        hireDate: new Date("2021-01-15"),
        managerId: "emp5",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        id: "emp12",
        employeeNumber: "012",
        departmentCode: "RD",
        teamCode: "RD01",
        name: "박개발",
        position: "개발팀 사원",
        department: "연구소",
        team: "개발팀",
        email: "park.dev@ashimori.co.kr",
        phone: "010-2345-6789",
        hireDate: new Date("2021-07-01"),
        managerId: "emp7",
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Store sample employees
    sampleEmployees.forEach(emp => this.employees.set(emp.id, emp));
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const newEmployee: Employee = {
      id,
      ...employee,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    console.log('🗃️ Storage.updateEmployee 호출됨');
    console.log('🆔 업데이트할 ID:', id);
    console.log('📝 업데이트 데이터:', employee);
    
    const existing = this.employees.get(id);
    if (!existing) {
      console.error('❌ 직원을 찾을 수 없음:', id);
      throw new Error(`Employee ${id} not found`);
    }
    
    console.log('👤 기존 직원 데이터:', existing);
    
    const updated: Employee = {
      ...existing,
      ...employee,
      updatedAt: new Date()
    };
    
    console.log('🔄 업데이트된 직원 데이터:', updated);
    
    this.employees.set(id, updated);
    console.log('✅ Storage에 저장 완료');
    
    // 파일에 영구 저장
    this.saveData();
    console.log('💾 파일에 영구 저장 완료');
    
    // 저장 후 검증
    const saved = this.employees.get(id);
    console.log('🔍 저장 후 검증:', saved);
    
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Training History methods
  async getTrainingHistory(id: string): Promise<TrainingHistory | undefined> {
    return this.trainingHistory.get(id);
  }

  async getAllTrainingHistory(): Promise<TrainingHistory[]> {
    return Array.from(this.trainingHistory.values());
  }

  async getTrainingHistoryByEmployee(employeeId: string): Promise<TrainingHistory[]> {
    return Array.from(this.trainingHistory.values()).filter(t => t.employeeId === employeeId);
  }

  async createTrainingHistory(training: InsertTrainingHistory): Promise<TrainingHistory> {
    const id = randomUUID();
    const newTraining: TrainingHistory = {
      id,
      ...training,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.trainingHistory.set(id, newTraining);
    return newTraining;
  }

  async updateTrainingHistory(id: string, training: Partial<InsertTrainingHistory>): Promise<TrainingHistory> {
    const existing = this.trainingHistory.get(id);
    if (!existing) throw new Error('Training history not found');
    
    const updated: TrainingHistory = {
      ...existing,
      ...training,
      updatedAt: new Date()
    };
    this.trainingHistory.set(id, updated);
    return updated;
  }

  async deleteTrainingHistory(id: string): Promise<boolean> {
    return this.trainingHistory.delete(id);
  }

  // Certification methods
  async getCertification(id: string): Promise<Certification | undefined> {
    return this.certifications.get(id);
  }

  async getAllCertifications(): Promise<Certification[]> {
    return Array.from(this.certifications.values());
  }

  async getCertificationsByEmployee(employeeId: string): Promise<Certification[]> {
    return Array.from(this.certifications.values()).filter(c => c.employeeId === employeeId);
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const id = randomUUID();
    const newCertification: Certification = {
      id,
      ...certification,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.certifications.set(id, newCertification);
    return newCertification;
  }

  async updateCertification(id: string, certification: Partial<InsertCertification>): Promise<Certification> {
    const existing = this.certifications.get(id);
    if (!existing) throw new Error('Certification not found');
    
    const updated: Certification = {
      ...existing,
      ...certification,
      updatedAt: new Date()
    };
    this.certifications.set(id, updated);
    return updated;
  }

  async deleteCertification(id: string): Promise<boolean> {
    return this.certifications.delete(id);
  }

  // Language methods
  async getLanguage(id: string): Promise<Language | undefined> {
    return this.languages.get(id);
  }

  async getAllLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }

  async getLanguagesByEmployee(employeeId: string): Promise<Language[]> {
    return Array.from(this.languages.values()).filter(l => l.employeeId === employeeId);
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    const id = randomUUID();
    const newLanguage: Language = {
      id,
      ...language,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.languages.set(id, newLanguage);
    return newLanguage;
  }

  async updateLanguage(id: string, language: Partial<InsertLanguage>): Promise<Language> {
    const existing = this.languages.get(id);
    if (!existing) throw new Error('Language not found');
    
    const updated: Language = {
      ...existing,
      ...language,
      updatedAt: new Date()
    };
    this.languages.set(id, updated);
    return updated;
  }

  async deleteLanguage(id: string): Promise<boolean> {
    return this.languages.delete(id);
  }

  // Skill methods
  async getSkill(id: string): Promise<Skill | undefined> {
    return this.skills.get(id);
  }

  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  async getSkillsByEmployee(employeeId: string): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(s => s.employeeId === employeeId);
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const newSkill: Skill = {
      id,
      ...skill,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.skills.set(id, newSkill);
    return newSkill;
  }

  async updateSkill(id: string, skill: Partial<InsertSkill>): Promise<Skill> {
    const existing = this.skills.get(id);
    if (!existing) throw new Error('Skill not found');
    
    const updated: Skill = {
      ...existing,
      ...skill,
      updatedAt: new Date()
    };
    this.skills.set(id, updated);
    return updated;
  }

  async deleteSkill(id: string): Promise<boolean> {
    return this.skills.delete(id);
  }

  // Skill Calculation methods
  async getSkillCalculation(id: string): Promise<SkillCalculation | undefined> {
    return this.skillCalculations.get(id);
  }

  async getAllSkillCalculations(): Promise<SkillCalculation[]> {
    return Array.from(this.skillCalculations.values());
  }

  async getSkillCalculationsByEmployee(employeeId: string): Promise<SkillCalculation[]> {
    return Array.from(this.skillCalculations.values()).filter(sc => sc.employeeId === employeeId);
  }

  async createSkillCalculation(calculation: InsertSkillCalculation): Promise<SkillCalculation> {
    const id = randomUUID();
    const newCalculation: SkillCalculation = {
      id,
      ...calculation,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.skillCalculations.set(id, newCalculation);
    return newCalculation;
  }

  async updateSkillCalculation(id: string, calculation: Partial<InsertSkillCalculation>): Promise<SkillCalculation> {
    const existing = this.skillCalculations.get(id);
    if (!existing) throw new Error('Skill calculation not found');
    
      const updated: SkillCalculation = {
        ...existing,
      ...calculation,
      updatedAt: new Date()
    };
    this.skillCalculations.set(id, updated);
    return updated;
  }

  async deleteSkillCalculation(id: string): Promise<boolean> {
    return this.skillCalculations.delete(id);
  }

  // Patent methods
  async getPatent(id: string): Promise<Patent | undefined> {
    return this.patents.get(id);
  }

  async getAllPatents(): Promise<Patent[]> {
    return Array.from(this.patents.values());
  }

  async getPatentsByEmployee(employeeId: string): Promise<Patent[]> {
    return Array.from(this.patents.values()).filter(p => p.employeeId === employeeId);
  }

  async createPatent(patent: InsertPatent): Promise<Patent> {
    const id = randomUUID();
    const newPatent: Patent = {
      id,
      ...patent,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.patents.set(id, newPatent);
    return newPatent;
  }

  async updatePatent(id: string, patent: Partial<InsertPatent>): Promise<Patent> {
    const existing = this.patents.get(id);
    if (!existing) throw new Error('Patent not found');
    
    const updated: Patent = {
      ...existing,
      ...patent,
      updatedAt: new Date()
    };
    this.patents.set(id, updated);
    return updated;
  }

  async deletePatent(id: string): Promise<boolean> {
    return this.patents.delete(id);
  }

  // Publication methods
  async getPublication(id: string): Promise<Publication | undefined> {
    return this.publications.get(id);
  }

  async getAllPublications(): Promise<Publication[]> {
    return Array.from(this.publications.values());
  }

  async getPublicationsByEmployee(employeeId: string): Promise<Publication[]> {
    return Array.from(this.publications.values()).filter(p => p.employeeId === employeeId);
  }

  async createPublication(publication: InsertPublication): Promise<Publication> {
    const id = randomUUID();
    const newPublication: Publication = {
      id,
      ...publication,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.publications.set(id, newPublication);
    return newPublication;
  }

  async updatePublication(id: string, publication: Partial<InsertPublication>): Promise<Publication> {
    const existing = this.publications.get(id);
    if (!existing) throw new Error('Publication not found');
    
    const updated: Publication = {
      ...existing,
      ...publication,
      updatedAt: new Date()
    };
    this.publications.set(id, updated);
    return updated;
  }

  async deletePublication(id: string): Promise<boolean> {
    return this.publications.delete(id);
  }

  // Award methods
  async getAward(id: string): Promise<Award | undefined> {
    return this.awards.get(id);
  }

  async getAllAwards(): Promise<Award[]> {
    return Array.from(this.awards.values());
  }

  async getAwardsByEmployee(employeeId: string): Promise<Award[]> {
    return Array.from(this.awards.values()).filter(a => a.employeeId === employeeId);
  }

  async createAward(award: InsertAward): Promise<Award> {
    const id = randomUUID();
    const newAward: Award = {
      id,
      ...award,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.awards.set(id, newAward);
    return newAward;
  }

  async updateAward(id: string, award: Partial<InsertAward>): Promise<Award> {
    const existing = this.awards.get(id);
    if (!existing) throw new Error('Award not found');
    
    const updated: Award = {
      ...existing,
      ...award,
      updatedAt: new Date()
    };
    this.awards.set(id, updated);
      return updated;
  }

  async deleteAward(id: string): Promise<boolean> {
    return this.awards.delete(id);
  }

  // Project methods
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProjectsByEmployee(employeeId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.employeeId === employeeId);
  }

  async createProject(project: InsertProject): Promise<Project> {
      const id = randomUUID();
    const newProject: Project = {
      id,
      ...project,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error('Project not found');
    
    const updated: Project = {
      ...existing,
      ...project,
      updatedAt: new Date()
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Full profile method
  async getEmployeeFullProfile(employeeId: string): Promise<{
    employee: Employee;
    trainingHistory: TrainingHistory[];
    certifications: Certification[];
    languages: Language[];
    skills: Skill[];
    skillCalculations: SkillCalculation[];
    patents: Patent[];
    publications: Publication[];
    awards: Award[];
    projects: Project[];
  }> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const [
      trainingHistory,
      certifications,
      languages,
      skills,
      skillCalculations,
      patents,
      publications,
      awards,
      projects
    ] = await Promise.all([
      this.getTrainingHistoryByEmployee(employeeId),
      this.getCertificationsByEmployee(employeeId),
      this.getLanguagesByEmployee(employeeId),
      this.getSkillsByEmployee(employeeId),
      this.getSkillCalculationsByEmployee(employeeId),
      this.getPatentsByEmployee(employeeId),
      this.getPublicationsByEmployee(employeeId),
      this.getAwardsByEmployee(employeeId),
      this.getProjectsByEmployee(employeeId)
    ]);

    return {
      employee,
      trainingHistory,
      certifications,
      languages,
      skills,
      skillCalculations,
      patents,
      publications,
      awards,
      projects
    };
  }

  // 보기 상태 저장
  saveViewState(viewState: any): void {
    try {
      this.viewState = viewState;
      this.saveData();
      console.log('✅ 보기 상태 저장 완료:', viewState);
    } catch (error) {
      console.error('❌ 보기 상태 저장 중 오류:', error);
      throw error;
    }
  }

  // 보기 상태 불러오기
  getViewState(): any {
    try {
      return this.viewState || null;
    } catch (error) {
      console.error('❌ 보기 상태 불러오기 중 오류:', error);
      return null;
    }
  }
}

export const storage = new MemStorage();
