import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertTrainingHistorySchema,
  insertCertificationSchema,
  insertLanguageSchema,
  insertSkillSchema,
  insertSkillCalculationSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const department = req.query.department as string;
      const employees = department 
        ? await storage.getEmployeesByDepartment(department)
        : await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.get("/api/employees/:id/profile", async (req, res) => {
    try {
      const profile = await storage.getEmployeeFullProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Employee profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee profile" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ error: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, employeeData);
      res.json(employee);
    } catch (error) {
      res.status(400).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Training History routes
  app.get("/api/training", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const training = employeeId 
        ? await storage.getTrainingHistory(employeeId)
        : await storage.getAllTrainingHistory();
      res.json(training);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training history" });
    }
  });

  app.post("/api/training", async (req, res) => {
    try {
      const trainingData = insertTrainingHistorySchema.parse(req.body);
      const training = await storage.createTrainingHistory(trainingData);
      res.status(201).json(training);
    } catch (error) {
      res.status(400).json({ error: "Invalid training data" });
    }
  });

  app.put("/api/training/:id", async (req, res) => {
    try {
      const trainingData = insertTrainingHistorySchema.partial().parse(req.body);
      const training = await storage.updateTrainingHistory(req.params.id, trainingData);
      res.json(training);
    } catch (error) {
      res.status(400).json({ error: "Failed to update training" });
    }
  });

  app.delete("/api/training/:id", async (req, res) => {
    try {
      const success = await storage.deleteTrainingHistory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Training record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete training record" });
    }
  });

  // Certification routes
  app.get("/api/certifications", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const certifications = employeeId 
        ? await storage.getCertifications(employeeId)
        : await storage.getAllCertifications();
      res.json(certifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch certifications" });
    }
  });

  app.post("/api/certifications", async (req, res) => {
    try {
      const certificationData = insertCertificationSchema.parse(req.body);
      const certification = await storage.createCertification(certificationData);
      res.status(201).json(certification);
    } catch (error) {
      res.status(400).json({ error: "Invalid certification data" });
    }
  });

  app.put("/api/certifications/:id", async (req, res) => {
    try {
      const certificationData = insertCertificationSchema.partial().parse(req.body);
      const certification = await storage.updateCertification(req.params.id, certificationData);
      res.json(certification);
    } catch (error) {
      res.status(400).json({ error: "Failed to update certification" });
    }
  });

  app.delete("/api/certifications/:id", async (req, res) => {
    try {
      const success = await storage.deleteCertification(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Certification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete certification" });
    }
  });

  // Language routes
  app.get("/api/languages", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const languages = employeeId 
        ? await storage.getLanguages(employeeId)
        : await storage.getAllLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  app.post("/api/languages", async (req, res) => {
    try {
      const languageData = insertLanguageSchema.parse(req.body);
      const language = await storage.createLanguage(languageData);
      res.status(201).json(language);
    } catch (error) {
      res.status(400).json({ error: "Invalid language data" });
    }
  });

  app.put("/api/languages/:id", async (req, res) => {
    try {
      const languageData = insertLanguageSchema.partial().parse(req.body);
      const language = await storage.updateLanguage(req.params.id, languageData);
      res.json(language);
    } catch (error) {
      res.status(400).json({ error: "Failed to update language" });
    }
  });

  app.delete("/api/languages/:id", async (req, res) => {
    try {
      const success = await storage.deleteLanguage(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Language record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete language record" });
    }
  });

  // Skill routes
  app.get("/api/skills", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      const skills = employeeId 
        ? await storage.getSkills(employeeId)
        : await storage.getAllSkills();
      res.json(skills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      const skill = await storage.createSkill(skillData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ error: "Invalid skill data" });
    }
  });

  app.put("/api/skills/:id", async (req, res) => {
    try {
      const skillData = insertSkillSchema.partial().parse(req.body);
      const skill = await storage.updateSkill(req.params.id, skillData);
      res.json(skill);
    } catch (error) {
      res.status(400).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      const success = await storage.deleteSkill(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Skill record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill record" });
    }
  });

  // Skill Calculation routes
  app.get("/api/skill-calculations", async (req, res) => {
    try {
      const employeeId = req.query.employeeId as string;
      if (employeeId) {
        const calculation = await storage.getSkillCalculation(employeeId);
        res.json(calculation);
      } else {
        const calculations = await storage.getAllSkillCalculations();
        res.json(calculations);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill calculations" });
    }
  });

  app.post("/api/skill-calculations", async (req, res) => {
    try {
      const calculationData = insertSkillCalculationSchema.parse(req.body);
      const calculation = await storage.createOrUpdateSkillCalculation(calculationData);
      res.json(calculation);
    } catch (error) {
      res.status(400).json({ error: "Invalid skill calculation data" });
    }
  });

  // Dashboard and analytics routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const trainings = await storage.getAllTrainingHistory();
      const certifications = await storage.getAllCertifications();
      const skillCalculations = await storage.getAllSkillCalculations();

      const totalEmployees = employees.length;
      const completedTrainings = trainings.filter(t => t.status === 'completed').length;
      const totalTrainings = trainings.length;
      const completionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0;
      
      const thisMonthTrainingHours = trainings
        .filter(t => t.completionDate && t.completionDate.getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + (t.duration || 0), 0);

      const certifiedEmployees = new Set(certifications.map(c => c.employeeId)).size;

      res.json({
        totalEmployees,
        completionRate: Math.round(completionRate * 10) / 10,
        trainingHours: thisMonthTrainingHours,
        certifiedEmployees
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/top-performers", async (req, res) => {
    try {
      const skillCalculations = await storage.getAllSkillCalculations();
      const employees = await storage.getAllEmployees();
      
      const topPerformers = skillCalculations
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 10)
        .map(calc => {
          const employee = employees.find(emp => emp.id === calc.employeeId);
          return {
            id: calc.employeeId,
            name: employee?.name || 'Unknown',
            department: employee?.department || 'Unknown',
            score: Math.round(calc.overallScore * 10) / 10
          };
        });

      res.json(topPerformers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top performers" });
    }
  });

  app.get("/api/dashboard/department-skills", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const skillCalculations = await storage.getAllSkillCalculations();
      
      const departmentStats = employees.reduce((acc, emp) => {
        if (!acc[emp.department]) {
          acc[emp.department] = { employees: [], calculations: [] };
        }
        acc[emp.department].employees.push(emp);
        
        const calc = skillCalculations.find(sc => sc.employeeId === emp.id);
        if (calc) {
          acc[emp.department].calculations.push(calc);
        }
        
        return acc;
      }, {} as Record<string, { employees: any[], calculations: any[] }>);

      const result = Object.entries(departmentStats).map(([department, data]) => {
        const avgOverallScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.overallScore, 0) / data.calculations.length
          : 0;
        
        const avgExperienceScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.experienceScore, 0) / data.calculations.length
          : 0;

        const avgCertificationScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.certificationScore, 0) / data.calculations.length
          : 0;

        const avgLanguageScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.languageScore, 0) / data.calculations.length
          : 0;

        const avgTrainingScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.trainingScore, 0) / data.calculations.length
          : 0;

        const avgTechnicalScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.technicalScore, 0) / data.calculations.length
          : 0;

        const avgSoftSkillScore = data.calculations.length > 0 
          ? data.calculations.reduce((sum, calc) => sum + calc.softSkillScore, 0) / data.calculations.length
          : 0;

        return {
          department,
          employeeCount: data.employees.length,
          averageSkills: {
            overall: Math.round(avgOverallScore * 10) / 10,
            experience: Math.round(avgExperienceScore * 10) / 10,
            certification: Math.round(avgCertificationScore * 10) / 10,
            language: Math.round(avgLanguageScore * 10) / 10,
            training: Math.round(avgTrainingScore * 10) / 10,
            technical: Math.round(avgTechnicalScore * 10) / 10,
            softSkill: Math.round(avgSoftSkillScore * 10) / 10
          }
        };
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch department skills" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
