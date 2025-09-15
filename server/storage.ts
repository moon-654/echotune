import { 
  type Employee, 
  type InsertEmployee,
  type TrainingHistory,
  type InsertTrainingHistory,
  type Certification,
  type InsertCertification,
  type Language,
  type InsertLanguage,
  type Skill,
  type InsertSkill,
  type SkillCalculation,
  type InsertSkillCalculation
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(department: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<boolean>;

  // Training History operations
  getTrainingHistory(employeeId: string): Promise<TrainingHistory[]>;
  getAllTrainingHistory(): Promise<TrainingHistory[]>;
  createTrainingHistory(training: InsertTrainingHistory): Promise<TrainingHistory>;
  updateTrainingHistory(id: string, training: Partial<InsertTrainingHistory>): Promise<TrainingHistory>;
  deleteTrainingHistory(id: string): Promise<boolean>;

  // Certification operations
  getCertifications(employeeId: string): Promise<Certification[]>;
  getAllCertifications(): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: string, certification: Partial<InsertCertification>): Promise<Certification>;
  deleteCertification(id: string): Promise<boolean>;

  // Language operations
  getLanguages(employeeId: string): Promise<Language[]>;
  getAllLanguages(): Promise<Language[]>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(id: string, language: Partial<InsertLanguage>): Promise<Language>;
  deleteLanguage(id: string): Promise<boolean>;

  // Skill operations
  getSkills(employeeId: string): Promise<Skill[]>;
  getAllSkills(): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: string, skill: Partial<InsertSkill>): Promise<Skill>;
  deleteSkill(id: string): Promise<boolean>;

  // Skill Calculation operations
  getSkillCalculation(employeeId: string): Promise<SkillCalculation | undefined>;
  getAllSkillCalculations(): Promise<SkillCalculation[]>;
  createOrUpdateSkillCalculation(calculation: InsertSkillCalculation): Promise<SkillCalculation>;

  // Aggregated operations
  getEmployeeFullProfile(employeeId: string): Promise<{
    employee: Employee;
    trainingHistory: TrainingHistory[];
    certifications: Certification[];
    languages: Language[];
    skills: Skill[];
    skillCalculation: SkillCalculation | undefined;
  } | undefined>;
}

export class MemStorage implements IStorage {
  private employees: Map<string, Employee>;
  private trainingHistory: Map<string, TrainingHistory>;
  private certifications: Map<string, Certification>;
  private languages: Map<string, Language>;
  private skills: Map<string, Skill>;
  private skillCalculations: Map<string, SkillCalculation>;

  constructor() {
    this.employees = new Map();
    this.trainingHistory = new Map();
    this.certifications = new Map();
    this.languages = new Map();
    this.skills = new Map();
    this.skillCalculations = new Map();
    
    // Initialize with sample data structure
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample employees
    const sampleEmployees: Employee[] = [
      {
        id: "emp1",
        name: "김철수",
        position: "시니어 개발자",
        department: "IT팀",
        email: "kim.cs@ashimori.co.kr",
        phone: "010-1234-5678",
        hireDate: new Date("2018-03-15"),
        managerId: null,
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "emp2",
        name: "박영희",
        position: "마케팅 팀장",
        department: "마케팅팀",
        email: "park.yh@ashimori.co.kr",
        phone: "010-2345-6789",
        hireDate: new Date("2019-06-01"),
        managerId: null,
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "emp3",
        name: "이민호",
        position: "영업 팀장",
        department: "영업팀",
        email: "lee.mh@ashimori.co.kr",
        phone: "010-3456-7890",
        hireDate: new Date("2017-09-10"),
        managerId: null,
        photoUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleEmployees.forEach(emp => this.employees.set(emp.id, emp));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.email === email);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(emp => emp.department === department);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      email: insertEmployee.email ?? null,
      phone: insertEmployee.phone ?? null,
      hireDate: insertEmployee.hireDate ?? null,
      managerId: insertEmployee.managerId ?? null,
      photoUrl: insertEmployee.photoUrl ?? null,
      isActive: insertEmployee.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing) {
      throw new Error(`Employee ${id} not found`);
    }
    const updated: Employee = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  async getTrainingHistory(employeeId: string): Promise<TrainingHistory[]> {
    return Array.from(this.trainingHistory.values()).filter(th => th.employeeId === employeeId);
  }

  async getAllTrainingHistory(): Promise<TrainingHistory[]> {
    return Array.from(this.trainingHistory.values());
  }

  async createTrainingHistory(insertTraining: InsertTrainingHistory): Promise<TrainingHistory> {
    const id = randomUUID();
    const training: TrainingHistory = {
      ...insertTraining,
      id,
      startDate: insertTraining.startDate ?? null,
      completionDate: insertTraining.completionDate ?? null,
      duration: insertTraining.duration ?? null,
      score: insertTraining.score ?? null,
      status: insertTraining.status ?? "planned",
      certificateUrl: insertTraining.certificateUrl ?? null,
      notes: insertTraining.notes ?? null,
      createdAt: new Date()
    };
    this.trainingHistory.set(id, training);
    return training;
  }

  async updateTrainingHistory(id: string, updates: Partial<InsertTrainingHistory>): Promise<TrainingHistory> {
    const existing = this.trainingHistory.get(id);
    if (!existing) {
      throw new Error(`Training history ${id} not found`);
    }
    const updated: TrainingHistory = { ...existing, ...updates };
    this.trainingHistory.set(id, updated);
    return updated;
  }

  async deleteTrainingHistory(id: string): Promise<boolean> {
    return this.trainingHistory.delete(id);
  }

  async getCertifications(employeeId: string): Promise<Certification[]> {
    return Array.from(this.certifications.values()).filter(cert => cert.employeeId === employeeId);
  }

  async getAllCertifications(): Promise<Certification[]> {
    return Array.from(this.certifications.values());
  }

  async createCertification(insertCertification: InsertCertification): Promise<Certification> {
    const id = randomUUID();
    const certification: Certification = {
      ...insertCertification,
      id,
      issueDate: insertCertification.issueDate ?? null,
      expiryDate: insertCertification.expiryDate ?? null,
      credentialId: insertCertification.credentialId ?? null,
      verificationUrl: insertCertification.verificationUrl ?? null,
      level: insertCertification.level ?? null,
      score: insertCertification.score ?? null,
      isActive: insertCertification.isActive ?? true,
      createdAt: new Date()
    };
    this.certifications.set(id, certification);
    return certification;
  }

  async updateCertification(id: string, updates: Partial<InsertCertification>): Promise<Certification> {
    const existing = this.certifications.get(id);
    if (!existing) {
      throw new Error(`Certification ${id} not found`);
    }
    const updated: Certification = { ...existing, ...updates };
    this.certifications.set(id, updated);
    return updated;
  }

  async deleteCertification(id: string): Promise<boolean> {
    return this.certifications.delete(id);
  }

  async getLanguages(employeeId: string): Promise<Language[]> {
    return Array.from(this.languages.values()).filter(lang => lang.employeeId === employeeId);
  }

  async getAllLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }

  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const id = randomUUID();
    const language: Language = {
      ...insertLanguage,
      id,
      testType: insertLanguage.testType ?? null,
      score: insertLanguage.score ?? null,
      maxScore: insertLanguage.maxScore ?? null,
      testDate: insertLanguage.testDate ?? null,
      certificateUrl: insertLanguage.certificateUrl ?? null,
      isActive: insertLanguage.isActive ?? true,
      createdAt: new Date()
    };
    this.languages.set(id, language);
    return language;
  }

  async updateLanguage(id: string, updates: Partial<InsertLanguage>): Promise<Language> {
    const existing = this.languages.get(id);
    if (!existing) {
      throw new Error(`Language ${id} not found`);
    }
    const updated: Language = { ...existing, ...updates };
    this.languages.set(id, updated);
    return updated;
  }

  async deleteLanguage(id: string): Promise<boolean> {
    return this.languages.delete(id);
  }

  async getSkills(employeeId: string): Promise<Skill[]> {
    return Array.from(this.skills.values()).filter(skill => skill.employeeId === employeeId);
  }

  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skills.values());
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = randomUUID();
    const skill: Skill = {
      ...insertSkill,
      id,
      yearsOfExperience: insertSkill.yearsOfExperience ?? null,
      lastAssessedDate: insertSkill.lastAssessedDate ?? null,
      assessedBy: insertSkill.assessedBy ?? null,
      notes: insertSkill.notes ?? null,
      isActive: insertSkill.isActive ?? true,
      createdAt: new Date()
    };
    this.skills.set(id, skill);
    return skill;
  }

  async updateSkill(id: string, updates: Partial<InsertSkill>): Promise<Skill> {
    const existing = this.skills.get(id);
    if (!existing) {
      throw new Error(`Skill ${id} not found`);
    }
    const updated: Skill = { ...existing, ...updates };
    this.skills.set(id, updated);
    return updated;
  }

  async deleteSkill(id: string): Promise<boolean> {
    return this.skills.delete(id);
  }

  async getSkillCalculation(employeeId: string): Promise<SkillCalculation | undefined> {
    return Array.from(this.skillCalculations.values()).find(calc => calc.employeeId === employeeId);
  }

  async getAllSkillCalculations(): Promise<SkillCalculation[]> {
    return Array.from(this.skillCalculations.values());
  }

  async createOrUpdateSkillCalculation(insertCalculation: InsertSkillCalculation): Promise<SkillCalculation> {
    const existing = Array.from(this.skillCalculations.values()).find(calc => calc.employeeId === insertCalculation.employeeId);
    
    if (existing) {
      const updated: SkillCalculation = {
        ...existing,
        ...insertCalculation,
        lastCalculatedAt: new Date()
      };
      this.skillCalculations.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const calculation: SkillCalculation = {
        ...insertCalculation,
        id,
        experienceScore: insertCalculation.experienceScore ?? 0,
        certificationScore: insertCalculation.certificationScore ?? 0,
        languageScore: insertCalculation.languageScore ?? 0,
        trainingScore: insertCalculation.trainingScore ?? 0,
        technicalScore: insertCalculation.technicalScore ?? 0,
        softSkillScore: insertCalculation.softSkillScore ?? 0,
        overallScore: insertCalculation.overallScore ?? 0,
        calculatedBy: insertCalculation.calculatedBy ?? null,
        lastCalculatedAt: new Date()
      };
      this.skillCalculations.set(id, calculation);
      return calculation;
    }
  }

  async getEmployeeFullProfile(employeeId: string): Promise<{
    employee: Employee;
    trainingHistory: TrainingHistory[];
    certifications: Certification[];
    languages: Language[];
    skills: Skill[];
    skillCalculation: SkillCalculation | undefined;
  } | undefined> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) return undefined;

    const [trainingHistory, certifications, languages, skills, skillCalculation] = await Promise.all([
      this.getTrainingHistory(employeeId),
      this.getCertifications(employeeId),
      this.getLanguages(employeeId),
      this.getSkills(employeeId),
      this.getSkillCalculation(employeeId)
    ]);

    return {
      employee,
      trainingHistory,
      certifications,
      languages,
      skills,
      skillCalculation
    };
  }
}

export const storage = new MemStorage();
