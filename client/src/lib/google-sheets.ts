/**
 * Google Sheets API integration for Ashimori Education Management System
 * This module provides methods to interact with Google Apps Script web app
 * for CRUD operations on employee, training, certification, and skill data.
 */

// Environment variable for Google Apps Script web app URL
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 
  import.meta.env.VITE_GOOGLE_SCRIPT_URL || 
  'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

export interface GoogleSheetsResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class GoogleSheetsAPI {
  private static baseUrl = GOOGLE_SCRIPT_URL;

  /**
   * Generic method to make GET requests to Google Apps Script
   */
  private static async get<T>(params: Record<string, string>): Promise<GoogleSheetsResponse<T>> {
    try {
      const url = new URL(this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google Sheets GET error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generic method to make POST requests to Google Apps Script
   */
  private static async post<T>(data: any): Promise<GoogleSheetsResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google Sheets POST error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Employee operations
  static async getEmployees(departmentFilter?: string): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getEmployees',
      ...(departmentFilter && { department: departmentFilter })
    });
  }

  static async getEmployee(employeeId: string): Promise<GoogleSheetsResponse<any>> {
    return this.get({
      action: 'getEmployee',
      employeeId
    });
  }

  static async getEmployeeProfile(employeeId: string): Promise<GoogleSheetsResponse<any>> {
    return this.get({
      action: 'getEmployeeProfile',
      employeeId
    });
  }

  static async createEmployee(employeeData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'createEmployee',
      data: employeeData
    });
  }

  static async updateEmployee(employeeId: string, employeeData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'updateEmployee',
      employeeId,
      data: employeeData
    });
  }

  static async deleteEmployee(employeeId: string): Promise<GoogleSheetsResponse<boolean>> {
    return this.post({
      action: 'deleteEmployee',
      employeeId
    });
  }

  // Training operations
  static async getTrainingHistory(employeeId?: string): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getTrainingHistory',
      ...(employeeId && { employeeId })
    });
  }

  static async createTraining(trainingData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'createTraining',
      data: trainingData
    });
  }

  static async updateTraining(trainingId: string, trainingData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'updateTraining',
      trainingId,
      data: trainingData
    });
  }

  static async deleteTraining(trainingId: string): Promise<GoogleSheetsResponse<boolean>> {
    return this.post({
      action: 'deleteTraining',
      trainingId
    });
  }

  // Certification operations
  static async getCertifications(employeeId?: string): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getCertifications',
      ...(employeeId && { employeeId })
    });
  }

  static async createCertification(certificationData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'createCertification',
      data: certificationData
    });
  }

  static async updateCertification(certificationId: string, certificationData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'updateCertification',
      certificationId,
      data: certificationData
    });
  }

  static async deleteCertification(certificationId: string): Promise<GoogleSheetsResponse<boolean>> {
    return this.post({
      action: 'deleteCertification',
      certificationId
    });
  }

  // Language operations
  static async getLanguages(employeeId?: string): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getLanguages',
      ...(employeeId && { employeeId })
    });
  }

  static async createLanguage(languageData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'createLanguage',
      data: languageData
    });
  }

  static async updateLanguage(languageId: string, languageData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'updateLanguage',
      languageId,
      data: languageData
    });
  }

  static async deleteLanguage(languageId: string): Promise<GoogleSheetsResponse<boolean>> {
    return this.post({
      action: 'deleteLanguage',
      languageId
    });
  }

  // Skill operations
  static async getSkills(employeeId?: string): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getSkills',
      ...(employeeId && { employeeId })
    });
  }

  static async createSkill(skillData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'createSkill',
      data: skillData
    });
  }

  static async updateSkill(skillId: string, skillData: any): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'updateSkill',
      skillId,
      data: skillData
    });
  }

  static async deleteSkill(skillId: string): Promise<GoogleSheetsResponse<boolean>> {
    return this.post({
      action: 'deleteSkill',
      skillId
    });
  }

  // Skill calculation operations
  static async getSkillCalculation(employeeId: string): Promise<GoogleSheetsResponse<any>> {
    return this.get({
      action: 'getSkillCalculation',
      employeeId
    });
  }

  static async calculateAndUpdateSkills(employeeId: string): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'calculateAndUpdateSkills',
      employeeId
    });
  }

  // Dashboard and analytics
  static async getDashboardStats(): Promise<GoogleSheetsResponse<any>> {
    return this.get({
      action: 'getDashboardStats'
    });
  }

  static async getTopPerformers(limit: number = 10): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getTopPerformers',
      limit: limit.toString()
    });
  }

  static async getDepartmentSkills(): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getDepartmentSkills'
    });
  }

  // Organization chart data
  static async getOrgChartData(): Promise<GoogleSheetsResponse<any[]>> {
    return this.get({
      action: 'getOrgChartData'
    });
  }

  // Bulk operations
  static async bulkImportEmployees(employees: any[]): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'bulkImportEmployees',
      data: employees
    });
  }

  static async bulkImportTrainings(trainings: any[]): Promise<GoogleSheetsResponse<any>> {
    return this.post({
      action: 'bulkImportTrainings',
      data: trainings
    });
  }

  static async exportData(dataType: string, filters?: any): Promise<GoogleSheetsResponse<any>> {
    return this.get({
      action: 'exportData',
      dataType,
      ...(filters && { filters: JSON.stringify(filters) })
    });
  }

  // Test connection
  static async testConnection(): Promise<GoogleSheetsResponse<string>> {
    return this.get({
      action: 'testConnection'
    });
  }
}

// Utility functions for handling Google Sheets responses
export const handleGoogleSheetsResponse = <T>(
  response: GoogleSheetsResponse<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): T | null => {
  if (response.success && response.data) {
    if (onSuccess) onSuccess(response.data);
    return response.data;
  } else {
    const errorMessage = response.error || response.message || 'Unknown error occurred';
    console.error('Google Sheets API Error:', errorMessage);
    if (onError) onError(errorMessage);
    return null;
  }
};

export default GoogleSheetsAPI;
