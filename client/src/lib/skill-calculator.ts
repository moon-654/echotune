/**
 * Skill calculation algorithms for the Ashimori Education Management System
 * This module calculates various skill scores based on employee data
 */

import type { 
  Employee, 
  TrainingHistory, 
  Certification, 
  Language, 
  Skill 
} from "@shared/schema";

export interface SkillCalculationResult {
  experienceScore: number;
  certificationScore: number;
  languageScore: number;
  trainingScore: number;
  technicalScore: number;
  softSkillScore: number;
  overallScore: number;
}

export interface SkillCalculationInput {
  employee: Employee;
  trainingHistory: TrainingHistory[];
  certifications: Certification[];
  languages: Language[];
  skills: Skill[];
}

/**
 * Calculate experience score based on years of experience
 * Algorithm: Linear scale with diminishing returns after 10 years
 */
export function calculateExperienceScore(employee: Employee): number {
  if (!employee.hireDate) return 0;
  
  const yearsOfExperience = (new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (yearsOfExperience <= 0) return 0;
  if (yearsOfExperience >= 15) return 100;
  
  // Linear scale up to 10 years (80 points), then logarithmic
  if (yearsOfExperience <= 10) {
    return (yearsOfExperience / 10) * 80;
  } else {
    return 80 + (Math.log(yearsOfExperience - 9) / Math.log(6)) * 20;
  }
}

/**
 * Calculate certification score based on number and level of certifications
 * Algorithm: Weighted by certification level and recency
 */
export function calculateCertificationScore(certifications: Certification[]): number {
  if (certifications.length === 0) return 0;
  
  const activeCertifications = certifications.filter(cert => cert.isActive);
  if (activeCertifications.length === 0) return 0;
  
  let totalScore = 0;
  const maxCertifications = 10; // Cap at 10 certifications for scoring
  
  activeCertifications.slice(0, maxCertifications).forEach(cert => {
    let certScore = 10; // Base score per certification
    
    // Level multiplier
    switch (cert.level?.toLowerCase()) {
      case 'expert':
        certScore *= 2.0;
        break;
      case 'advanced':
        certScore *= 1.5;
        break;
      case 'intermediate':
        certScore *= 1.2;
        break;
      case 'basic':
        certScore *= 1.0;
        break;
      default:
        certScore *= 1.0;
    }
    
    // Recency multiplier (certifications lose value over time)
    if (cert.issueDate) {
      const yearsOld = (new Date().getTime() - new Date(cert.issueDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsOld > 5) {
        certScore *= 0.7; // 30% reduction after 5 years
      } else if (yearsOld > 3) {
        certScore *= 0.85; // 15% reduction after 3 years
      }
    }
    
    // Expiry check
    if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
      certScore *= 0.5; // 50% reduction for expired certifications
    }
    
    totalScore += certScore;
  });
  
  return Math.min(totalScore, 100);
}

/**
 * Calculate language score based on language proficiency levels and test scores
 * Algorithm: Weighted by proficiency level and test scores
 */
export function calculateLanguageScore(languages: Language[]): number {
  if (languages.length === 0) return 0;
  
  const activeLanguages = languages.filter(lang => lang.isActive);
  if (activeLanguages.length === 0) return 0;
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  activeLanguages.forEach(lang => {
    let langScore = 0;
    let maxLangScore = 100; // Each language can contribute up to 100 points
    
    // Base score by proficiency level
    switch (lang.proficiencyLevel.toLowerCase()) {
      case 'native':
        langScore = 100;
        break;
      case 'advanced':
        langScore = 80;
        break;
      case 'intermediate':
        langScore = 60;
        break;
      case 'beginner':
        langScore = 30;
        break;
      default:
        langScore = 40;
    }
    
    // Adjust based on test scores if available
    if (lang.score && lang.maxScore) {
      const testScoreRatio = lang.score / lang.maxScore;
      langScore = Math.max(langScore, testScoreRatio * 100);
    }
    
    // Common language weights (Korean gets lower weight as it's native)
    const languageWeights: Record<string, number> = {
      'English': 1.0,
      'Japanese': 0.9,
      'Chinese': 0.9,
      'German': 0.8,
      'French': 0.8,
      'Spanish': 0.7,
      'Korean': 0.3, // Lower weight for native language
    };
    
    const weight = languageWeights[lang.language] || 0.6;
    langScore *= weight;
    maxLangScore *= weight;
    
    totalScore += langScore;
    maxPossibleScore += maxLangScore;
  });
  
  // Normalize to 0-100 scale based on maximum 3 languages
  const maxLanguages = 3;
  const normalizedScore = (totalScore / Math.min(activeLanguages.length, maxLanguages)) * (100 / 100);
  
  return Math.min(normalizedScore, 100);
}

/**
 * Calculate training score based on completed training hours and recency
 * Algorithm: Based on total hours with bonus for recent training
 */
export function calculateTrainingScore(trainingHistory: TrainingHistory[]): number {
  if (trainingHistory.length === 0) return 0;
  
  const completedTrainings = trainingHistory.filter(training => training.status === 'completed');
  if (completedTrainings.length === 0) return 0;
  
  let totalHours = 0;
  let recentHours = 0; // Training in the last 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  completedTrainings.forEach(training => {
    const hours = training.duration || 0;
    totalHours += hours;
    
    if (training.completionDate && new Date(training.completionDate) > twoYearsAgo) {
      recentHours += hours;
    }
  });
  
  // Base score calculation (100 points for 200+ hours)
  let baseScore = Math.min((totalHours / 200) * 80, 80);
  
  // Bonus for recent training (up to 20 additional points)
  let recentBonus = Math.min((recentHours / 40) * 20, 20);
  
  // Required training completion bonus
  const requiredTrainings = completedTrainings.filter(t => t.type === 'required');
  const requiredBonus = Math.min(requiredTrainings.length * 2, 10);
  
  return Math.min(baseScore + recentBonus + requiredBonus, 100);
}

/**
 * Calculate technical skills score based on skill assessments
 * Algorithm: Average of technical skill proficiency levels
 */
export function calculateTechnicalScore(skills: Skill[]): number {
  if (skills.length === 0) return 0;
  
  const technicalSkills = skills.filter(skill => 
    skill.isActive && (skill.skillType === 'technical' || skill.skillType === 'domain')
  );
  
  if (technicalSkills.length === 0) return 0;
  
  let totalScore = 0;
  let weightedCount = 0;
  
  technicalSkills.forEach(skill => {
    let skillWeight = 1;
    
    // Weight by years of experience
    if (skill.yearsOfExperience) {
      skillWeight = Math.min(skill.yearsOfExperience / 5, 2); // Max 2x weight for 5+ years
    }
    
    // Recency factor
    if (skill.lastAssessedDate) {
      const monthsOld = (new Date().getTime() - new Date(skill.lastAssessedDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 12) {
        skillWeight *= 0.8; // Reduce weight for assessments older than 1 year
      }
    }
    
    totalScore += skill.proficiencyLevel * skillWeight;
    weightedCount += skillWeight;
  });
  
  return weightedCount > 0 ? Math.min(totalScore / weightedCount, 100) : 0;
}

/**
 * Calculate soft skills score based on skill assessments
 * Algorithm: Average of soft skill proficiency levels with leadership bonus
 */
export function calculateSoftSkillScore(skills: Skill[]): number {
  if (skills.length === 0) return 0;
  
  const softSkills = skills.filter(skill => 
    skill.isActive && (skill.skillType === 'soft' || skill.skillType === 'leadership')
  );
  
  if (softSkills.length === 0) return 0;
  
  let totalScore = 0;
  let weightedCount = 0;
  let leadershipBonus = 0;
  
  softSkills.forEach(skill => {
    let skillWeight = 1;
    
    // Leadership skills get higher weight
    if (skill.skillType === 'leadership') {
      skillWeight = 1.5;
      leadershipBonus += skill.proficiencyLevel * 0.1; // Small bonus for leadership skills
    }
    
    // Recency factor
    if (skill.lastAssessedDate) {
      const monthsOld = (new Date().getTime() - new Date(skill.lastAssessedDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 12) {
        skillWeight *= 0.8;
      }
    }
    
    totalScore += skill.proficiencyLevel * skillWeight;
    weightedCount += skillWeight;
  });
  
  const baseScore = weightedCount > 0 ? totalScore / weightedCount : 0;
  return Math.min(baseScore + leadershipBonus, 100);
}

/**
 * Calculate overall skill score using weighted average
 * Algorithm: Weighted combination of all skill categories
 */
export function calculateOverallScore(scores: Omit<SkillCalculationResult, 'overallScore'>): number {
  const weights = {
    experience: 0.20,
    certification: 0.15,
    language: 0.15,
    training: 0.20,
    technical: 0.20,
    softSkill: 0.10
  };
  
  return (
    scores.experienceScore * weights.experience +
    scores.certificationScore * weights.certification +
    scores.languageScore * weights.language +
    scores.trainingScore * weights.training +
    scores.technicalScore * weights.technical +
    scores.softSkillScore * weights.softSkill
  );
}

/**
 * Main function to calculate all skill scores for an employee
 */
export function calculateAllSkills(input: SkillCalculationInput): SkillCalculationResult {
  const experienceScore = calculateExperienceScore(input.employee);
  const certificationScore = calculateCertificationScore(input.certifications);
  const languageScore = calculateLanguageScore(input.languages);
  const trainingScore = calculateTrainingScore(input.trainingHistory);
  const technicalScore = calculateTechnicalScore(input.skills);
  const softSkillScore = calculateSoftSkillScore(input.skills);
  
  const overallScore = calculateOverallScore({
    experienceScore,
    certificationScore,
    languageScore,
    trainingScore,
    technicalScore,
    softSkillScore
  });
  
  return {
    experienceScore: Math.round(experienceScore * 10) / 10,
    certificationScore: Math.round(certificationScore * 10) / 10,
    languageScore: Math.round(languageScore * 10) / 10,
    trainingScore: Math.round(trainingScore * 10) / 10,
    technicalScore: Math.round(technicalScore * 10) / 10,
    softSkillScore: Math.round(softSkillScore * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10
  };
}

/**
 * Get skill level description based on score
 */
export function getSkillLevelDescription(score: number): string {
  if (score >= 90) return "최우수";
  if (score >= 80) return "우수";
  if (score >= 70) return "양호";
  if (score >= 60) return "보통";
  if (score >= 50) return "개선필요";
  return "미달";
}

/**
 * Get skill level color class for UI
 */
export function getSkillLevelColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get skill indicator background color class for visual indicators
 */
export function calculateSkillLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'low';
  return 'none';
}

export default {
  calculateAllSkills,
  calculateExperienceScore,
  calculateCertificationScore,
  calculateLanguageScore,
  calculateTrainingScore,
  calculateTechnicalScore,
  calculateSoftSkillScore,
  calculateOverallScore,
  getSkillLevelDescription,
  getSkillLevelColor,
  calculateSkillLevel
};
