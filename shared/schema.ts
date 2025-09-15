import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  position: text("position").notNull(),
  department: text("department").notNull(),
  email: text("email"),
  phone: text("phone"),
  hireDate: timestamp("hire_date"),
  managerId: varchar("manager_id"),
  photoUrl: text("photo_url"),
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
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`)
});

export const languages = pgTable("languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id),
  language: text("language").notNull(), // "English", "Chinese", "Japanese", etc.
  proficiencyLevel: text("proficiency_level").notNull(), // "beginner", "intermediate", "advanced", "native"
  testType: text("test_type"), // "TOEIC", "TOEFL", "JLPT", "HSK", etc.
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
  completionDate: z.string().datetime().optional().nullable().transform((val) => val ? new Date(val) : null)
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
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
