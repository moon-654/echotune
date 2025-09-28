/**
 * Extended types for the Ashimori Education Management System
 * These types extend the base schema types with additional UI-specific properties
 */

import type { 
  Employee, 
  TrainingHistory, 
  Certification, 
  Language, 
  Skill,
  SkillCalculation 
} from "@shared/schema";

// Extended employee type with calculated fields
export interface ExtendedEmployee extends Employee {
  yearsOfExperience?: number;
  skillLevel?: 'high' | 'medium' | 'low' | 'none';
  overallScore?: number;
  recentTrainingCount?: number;
  activeCertificationCount?: number;
}

// Full employee profile with all related data
export interface EmployeeProfile {
  employee: Employee;
  trainingHistory: TrainingHistory[];
  certifications: Certification[];
  languages: Language[];
  skills: Skill[];
  skillCalculation?: SkillCalculation;
}

// Department statistics for analytics
export interface DepartmentStats {
  department: string;
  employeeCount: number;
  averageSkills: {
    overall: number;
    experience: number;
    certification: number;
    language: number;
    training: number;
    technical: number;
    softSkill: number;
  };
  topPerformers: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}

// Organization chart node data
export interface OrgChartNode {
  id: string;
  name: string;
  position: string;
  department: string;
  managerId?: string;
  children?: OrgChartNode[];
  skillIndicators: {
    experience: number;
    certification: number;
    language: number;
    training: number;
  };
  overallSkillLevel: 'high' | 'medium' | 'low' | 'none';
}

// Training statistics
export interface TrainingStats {
  total: number;
  completed: number;
  ongoing: number;
  planned: number;
  cancelled: number;
  totalHours: number;
  averageCompletionRate: number;
}

// Dashboard KPI data
export interface DashboardKPIs {
  totalEmployees: number;
  completionRate: number;
  trainingHours: number;
  certifiedEmployees: number;
  averageSkillScore: number;
  topDepartment: string;
}

// Top performers data
export interface TopPerformer {
  id: string;
  name: string;
  position: string;
  department: string;
  score: number;
  rank: number;
  avatar?: string;
}

// Skill comparison data for charts
export interface SkillComparison {
  employee: {
    id: string;
    name: string;
    department: string;
  };
  skills: {
    experience: number;
    certification: number;
    language: number;
    training: number;
    technical: number;
    softSkill: number;
  };
  overallScore: number;
}

// Training course with enrollment data
export interface TrainingCourse extends TrainingHistory {
  enrolledCount: number;
  completedCount: number;
  completionRate: number;
  averageScore?: number;
  participants: Array<{
    employeeId: string;
    employeeName: string;
    department: string;
    status: string;
    completionDate?: string;
    score?: number;
  }>;
}

// Filter options for UI components
export interface EmployeeFilters {
  search: string;
  department: string;
  skillLevel: string;
  sortBy: 'name' | 'department' | 'score' | 'hireDate';
  sortOrder: 'asc' | 'desc';
}

export interface TrainingFilters {
  search: string;
  status: string;
  type: string;
  category: string;
  dateRange: {
    start?: string;
    end?: string;
  };
}

// Report generation options
export interface ReportOptions {
  type: 'department' | 'individual' | 'training' | 'skill';
  period: 'month' | 'quarter' | 'year' | 'custom';
  department?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
}

// Bulk import/export data structures
export interface BulkImportData {
  employees?: Partial<Employee>[];
  trainings?: Partial<TrainingHistory>[];
  certifications?: Partial<Certification>[];
  languages?: Partial<Language>[];
  skills?: Partial<Skill>[];
}

export interface BulkImportResult {
  success: boolean;
  imported: {
    employees: number;
    trainings: number;
    certifications: number;
    languages: number;
    skills: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// Form data types for create/edit operations
export interface EmployeeFormData {
  name: string;
  position: string;
  department: string;
  email?: string;
  phone?: string;
  hireDate?: Date;
  managerId?: string;
  photoUrl?: string;
}

export interface TrainingFormData {
  employeeId: string;
  courseName: string;
  provider: string;
  type: 'required' | 'optional' | 'certification';
  category: string;
  startDate?: Date;
  duration?: number;
  notes?: string;
}

export interface CertificationFormData {
  employeeId: string;
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
  category: string;
  level?: string;
  score?: number;
}

export interface LanguageFormData {
  employeeId: string;
  language: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'native';
  testType?: string;
  score?: number;
  maxScore?: number;
  testDate?: Date;
  certificateUrl?: string;
}

export interface ProposalFormData {
  employeeId: string;
  title: string;
  description: string;
  category: 'process' | 'technology' | 'safety' | 'quality' | 'cost' | 'other';
  submissionDate: Date;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'implemented';
  adoptionDate?: Date;
  rewardAmount?: number;
  rewardType?: 'monetary' | 'recognition' | 'both';
  impactLevel: 'low' | 'medium' | 'high';
  implementationStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface SkillFormData {
  employeeId: string;
  skillType: 'technical' | 'soft' | 'leadership' | 'domain';
  skillName: string;
  proficiencyLevel: number;
  yearsOfExperience?: number;
  lastAssessedDate?: Date;
  assessedBy?: string;
  notes?: string;
}

// UI component prop types
export interface EmployeeCardProps {
  employee: ExtendedEmployee;
  onClick?: (employee: ExtendedEmployee) => void;
  showActions?: boolean;
}

export interface SkillIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export interface RadarChartProps {
  data: SkillComparison[];
  selectedEmployees?: string[];
  height?: number;
  showLegend?: boolean;
}

// API response types for better type safety
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// All types are exported as named exports above
