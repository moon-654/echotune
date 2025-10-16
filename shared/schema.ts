import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeNumber: varchar("employee_number").notNull().unique(), // 사원번호 (예: 001, 002, 003)
  departmentCode: varchar("department_code").notNull(), // 부서코드 (예: IT, MK, SL)
  teamCode: varchar("team_code"), // 팀코드 (예: IT01, MK01, SL01) - 부서장은 null 가능
  name: text("name").notNull(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  team: text("team"), // 팀명 - 부서장은 null 가능
  email: text("email"),
  phone: text("phone"),
  hireDate: timestamp("hire_date"),
  birthDate: timestamp("birth_date"), // 생년월일
  managerId: varchar("manager_id"),
  photoUrl: text("photo_url"),
  education: text("education"), // 최종학력 (예: "대학교 졸업", "대학원 졸업", "고등학교 졸업", "재학중")
  major: text("major"), // 전공 (예: "컴퓨터공학", "경영학")
  school: text("school"), // 학교명 (예: "서울대학교", "연세대학교")
  graduationYear: integer("graduation_year"), // 졸업년도
  previousExperienceYears: integer("previous_experience_years").default(0), // 이전 경력 년수
  previousExperienceMonths: integer("previous_experience_months").default(0), // 이전 경력 개월수
  isDepartmentHead: boolean("is_department_head").default(false), // 부문장 여부
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const trainingHistory = pgTable("training_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  courseName: text("course_name").notNull(),
  provider: text("provider").notNull(),
  type: text("type").notNull(), // "required", "optional", "certification"
  category: text("category").notNull(), // "security", "leadership", "technical", etc.
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  duration: integer("duration"), // in hours
  score: real("score"),
  status: text("status").notNull().default("planned"), // "planned", "ongoing", "completed", "cancelled"
  instructorRole: text("instructor_role"), // "instructor" (강사), "mentor" (멘토), null (수강생)
  certificateUrl: text("certificate_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const certifications = pgTable("certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  credentialId: text("credential_id"),
  verificationUrl: text("verification_url"),
  category: text("category").notNull(), // "technical", "language", "safety", "management"
  level: text("level"), // "basic", "intermediate", "advanced", "expert"
  score: real("score"),
  scoreAtAcquisition: real("score_at_acquisition"), // 취득 시점에 부여된 점수 (영구 보존)
  scoringCriteriaVersion: text("scoring_criteria_version"), // 점수 계산 시 사용된 기준 버전
  useFixedScore: boolean("use_fixed_score").default(true), // true면 고정 점수 사용, false면 현행 기준 재계산
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

export const languages = pgTable("languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  language: text("language").notNull(), // "English", "Chinese", "Japanese", etc.
  proficiencyLevel: text("proficiency_level").notNull(), // "beginner", "intermediate", "advanced", "native"
  testType: text("test_type"), // "TOEIC", "TOEFL", "JLPT", "HSK", etc.
  testLevel: text("test_level"), // "N1", "N2", "6급", "Band C Level 6", etc.
  score: integer("score"),
  maxScore: integer("max_score"),
  testDate: timestamp("test_date"),
  certificateUrl: text("certificate_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  skillType: text("skill_type").notNull(), // "technical", "soft", "leadership", "domain"
  skillName: text("skill_name").notNull(),
  proficiencyLevel: integer("proficiency_level").notNull(), // 1-100 scale
  yearsOfExperience: real("years_of_experience"),
  lastAssessedDate: timestamp("last_assessed_date"),
  assessedBy: text("assessed_by"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const skillCalculations = pgTable("skill_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  experienceScore: real("experience_score").notNull().default(0),
  certificationScore: real("certification_score").notNull().default(0),
  languageScore: real("language_score").notNull().default(0),
  trainingScore: real("training_score").notNull().default(0),
  technicalScore: real("technical_score").notNull().default(0),
  softSkillScore: real("soft_skill_score").notNull().default(0),
  overallScore: real("overall_score").notNull().default(0),
  lastCalculatedAt: timestamp("last_calculated_at").default(sql`now()`),
  calculatedBy: text("calculated_by")
});

// 특허출원 테이블
export const patents = pgTable("patents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  title: text("title").notNull(),
  applicationNumber: text("application_number"),
  patentNumber: text("patent_number"),
  status: text("status").notNull(), // "applied", "pending", "granted", "rejected"
  applicationDate: timestamp("application_date"),
  grantDate: timestamp("grant_date"),
  inventors: text("inventors"), // 공동 발명자들
  description: text("description"),
  category: text("category"), // "invention", "utility", "design"
  priority: text("priority"), // "high", "medium", "low"
  createdAt: timestamp("created_at").default(sql`now()`)
});

// 논문투고 테이블
export const publications = pgTable("publications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  title: text("title").notNull(),
  authors: text("authors").notNull(), // 공동 저자들
  journal: text("journal"),
  conference: text("conference"),
  publicationType: text("publication_type").notNull(), // "journal", "conference", "book", "report"
  status: text("status").notNull(), // "submitted", "under_review", "accepted", "published", "rejected"
  submissionDate: timestamp("submission_date"),
  publicationDate: timestamp("publication_date"),
  doi: text("doi"), // Digital Object Identifier
  impactFactor: real("impact_factor"),
  citationCount: integer("citation_count").default(0),
  keywords: text("keywords"),
  abstract: text("abstract"),
  url: text("url"),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// 수상이력 테이블
export const awards = pgTable("awards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  awardName: text("award_name").notNull(),
  awardingOrganization: text("awarding_organization").notNull(),
  category: text("category").notNull(), // "technical", "research", "innovation", "leadership", "service"
  level: text("level").notNull(), // "company", "industry", "national", "international"
  awardDate: timestamp("award_date").notNull(),
  description: text("description"),
  certificateUrl: text("certificate_url"),
  monetaryValue: real("monetary_value"), // 상금이나 상품 가치
  isTeamAward: boolean("is_team_award").default(false),
  teamMembers: text("team_members"), // 팀 수상인 경우 팀원들
  createdAt: timestamp("created_at").default(sql`now()`)
});

// 프로젝트 참여 테이블
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  projectName: text("project_name").notNull(),
  role: text("role").notNull(), // "lead", "developer", "analyst", "manager", "consultant"
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull(), // "planning", "active", "completed", "cancelled", "on_hold"
  description: text("description"),
  technologies: text("technologies"), // 사용된 기술들
  teamSize: integer("team_size"),
  budget: real("budget"),
  client: text("client"),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").default(sql`now()`)
});

// 부서 관리 테이블
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentCode: varchar("department_code").notNull().unique(), // 부서코드 (예: IT, MK, SL)
  departmentName: text("department_name").notNull(), // 부서명 (예: IT부서, 마케팅부서, 영업부서)
  description: text("description"), // 부서 설명
  managerId: varchar("manager_id").references(() => employees.id), // 부서장 ID
  budget: real("budget"), // 부서 예산
  location: text("location"), // 부서 위치
  isActive: boolean("is_active").default(true), // 활성 상태
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// 팀 관리 테이블
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamCode: varchar("team_code").notNull().unique(), // 팀코드 (예: IT01, MK01, SL01)
  teamName: text("team_name").notNull(), // 팀명 (예: 개발팀, 디자인팀, 영업1팀)
  departmentId: varchar("department_id").notNull().references(() => departments.id), // 소속 부서 ID
  description: text("description"), // 팀 설명
  teamLeadId: varchar("team_lead_id").references(() => employees.id), // 팀장 ID
  budget: real("budget"), // 팀 예산
  location: text("location"), // 팀 위치
  isActive: boolean("is_active").default(true), // 활성 상태
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTrainingHistorySchema = createInsertSchema(trainingHistory).omit({
  id: true,
  createdAt: true
}).extend({
  startDate: z.string().datetime().optional().nullable().transform((val) => val ? new Date(val) : null),
  completionDate: z.string().datetime().optional().nullable().transform((val) => val ? new Date(val) : null),
  instructorRole: z.enum(["instructor", "mentor"]).optional().nullable()
});

export const insertCertificationSchema = createInsertSchema(certifications, {
  issueDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date().optional().nullable(),
}).omit({
  id: true,
  createdAt: true
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  createdAt: true
});

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true,
  createdAt: true
});

export const insertSkillCalculationSchema = createInsertSchema(skillCalculations).omit({
  id: true,
  lastCalculatedAt: true
});

export const insertPatentSchema = createInsertSchema(patents).omit({
  id: true,
  createdAt: true
});

export const insertPublicationSchema = createInsertSchema(publications).omit({
  id: true,
  createdAt: true
});

export const insertAwardSchema = createInsertSchema(awards).omit({
  id: true,
  createdAt: true
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type TrainingHistory = typeof trainingHistory.$inferSelect;
export type InsertTrainingHistory = z.infer<typeof insertTrainingHistorySchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type SkillCalculation = typeof skillCalculations.$inferSelect;
export type InsertSkillCalculation = z.infer<typeof insertSkillCalculationSchema>;
export type Patent = typeof patents.$inferSelect;
export type InsertPatent = z.infer<typeof insertPatentSchema>;
export type Publication = typeof publications.$inferSelect;
export type InsertPublication = z.infer<typeof insertPublicationSchema>;
export type Award = typeof awards.$inferSelect;
export type InsertAward = z.infer<typeof insertAwardSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

// 교육 시간 데이터 테이블
export const trainingHours = pgTable("training_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(), // 연도
  team: text("team").notNull(), // 팀명
  trainingType: text("training_type").notNull(), // 교육 유형 (외부교육, 내부교육)
  hours: real("hours").notNull(), // 교육 시간
  description: text("description"), // 설명
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// 팀별 인원 데이터 테이블
export const teamEmployees = pgTable("team_employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(), // 기준 연도
  team: text("team").notNull(), // 팀명
  employeeCount: integer("employee_count").notNull(), // 인원수
  description: text("description"), // 설명
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`)
});

// Zod 스키마 정의
export const insertTrainingHoursSchema = z.object({
  year: z.number().int().min(2000).max(2030),
  team: z.string().min(1),
  trainingType: z.string().min(1),
  hours: z.number().min(0),
  description: z.string().optional()
});

export const insertTeamEmployeesSchema = z.object({
  year: z.number().int().min(2000).max(2030),
  team: z.string().min(1),
  employeeCount: z.number().int().min(0),
  description: z.string().optional()
});

// TypeScript 타입 정의
export type TrainingHours = typeof trainingHours.$inferSelect;
export type InsertTrainingHours = z.infer<typeof insertTrainingHoursSchema>;
export type TeamEmployees = typeof teamEmployees.$inferSelect;
export type InsertTeamEmployees = z.infer<typeof insertTeamEmployeesSchema>;