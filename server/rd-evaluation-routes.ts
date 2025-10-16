import type { Express } from "express";
import { storage } from "./storage";
import { 
  insertRdEvaluationSchema,
  insertEvaluationItemSchema,
  insertEvaluationHistorySchema
} from "@shared/evaluation-schema";
import { calculateAutoRdEvaluation, calculateAllEmployeesRdEvaluation, saveRdEvaluationResult } from "./rd-evaluation-auto";

export function setupRdEvaluationRoutes(app: Express) {
  // R&D 역량평가 목록 조회
  app.get("/api/rd-evaluations", async (req, res) => {
    try {
      const { year, department, status, employeeId } = req.query;
      
      let query = `
        SELECT 
          re.*,
          e.name as employee_name,
          e.department,
          e.position
        FROM rd_evaluations re
        JOIN employees e ON re.employee_id = e.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (year) {
        query += ` AND re.evaluation_year = $${paramIndex}`;
        params.push(parseInt(year as string));
        paramIndex++;
      }
      
      if (department) {
        query += ` AND e.department = $${paramIndex}`;
        params.push(department);
        paramIndex++;
      }
      
      if (status) {
        query += ` AND re.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      if (employeeId) {
        query += ` AND re.employee_id = $${paramIndex}`;
        params.push(employeeId);
        paramIndex++;
      }
      
      query += ` ORDER BY re.total_score DESC, re.evaluation_date DESC`;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 배열 반환
      // TODO: 실제 R&D 평가 데이터 저장/조회 기능 구현
      const result = { rows: [] };
      
      // 순위 계산
      const evaluations = result.rows.map((row: any, index: number) => ({
        ...row,
        rank: index + 1
      }));
      
      res.json(evaluations);
    } catch (error) {
      console.error("R&D 평가 목록 조회 오류:", error);
      res.status(500).json({ error: "평가 목록을 불러올 수 없습니다." });
    }
  });

  // R&D 역량평가 상세 조회
  app.get("/api/rd-evaluations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const evaluationQuery = `
        SELECT 
          re.*,
          e.name as employee_name,
          e.department,
          e.position,
          e.email,
          e.phone
        FROM rd_evaluations re
        JOIN employees e ON re.employee_id = e.id
        WHERE re.id = $1
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const evaluationResult = { rows: [] };
      
      if (evaluationResult.rows.length === 0) {
        return res.status(404).json({ error: "평가를 찾을 수 없습니다." });
      }
      
      const evaluation = evaluationResult.rows[0];
      
      // 평가 세부 항목 조회
      const itemsQuery = `
        SELECT * FROM evaluation_items 
        WHERE evaluation_id = $1 
        ORDER BY category, item_name
      `;
      
      const itemsResult = { rows: [] };
      
      // 평가 이력 조회
      const historyQuery = `
        SELECT 
          eh.*,
          e.name as performed_by_name
        FROM evaluation_history eh
        LEFT JOIN employees e ON eh.performed_by = e.id
        WHERE eh.evaluation_id = $1 
        ORDER BY eh.timestamp DESC
      `;
      
      const historyResult = { rows: [] };
      
      res.json({
        ...evaluation,
        items: itemsResult.rows,
        history: historyResult.rows
      });
    } catch (error) {
      console.error("R&D 평가 상세 조회 오류:", error);
      res.status(500).json({ error: "평가 상세 정보를 불러올 수 없습니다." });
    }
  });

  // R&D 역량평가 생성
  app.post("/api/rd-evaluations", async (req, res) => {
    try {
      const evaluationData = insertRdEvaluationSchema.parse(req.body);
      
      // 점수 계산
      const totalScore = 
        (evaluationData.technicalCompetencyScore * 0.25) +
        (evaluationData.projectExperienceScore * 0.20) +
        (evaluationData.rdAchievementScore * 0.25) +
        (evaluationData.globalCompetencyScore * 0.10) +
        (evaluationData.knowledgeSharingScore * 0.10) +
        (evaluationData.innovationProposalScore * 0.10);
      
      // 등급 계산
      let grade = "D";
      if (totalScore >= 90) grade = "S";
      else if (totalScore >= 80) grade = "A";
      else if (totalScore >= 70) grade = "B";
      else if (totalScore >= 60) grade = "C";
      
      const insertQuery = `
        INSERT INTO rd_evaluations (
          employee_id, evaluation_year, evaluation_period,
          technical_competency_score, technical_competency_details,
          project_experience_score, project_experience_details,
          rd_achievement_score, rd_achievement_details,
          global_competency_score, global_competency_details,
          knowledge_sharing_score, knowledge_sharing_details,
          innovation_proposal_score, innovation_proposal_details,
          total_score, grade, evaluated_by, status, comments
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) RETURNING *
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const result = { rows: [{ id: 'temp-id' }] };
      
      const newEvaluation = result.rows[0];
      
      // 평가 이력 기록
      const historyQuery = `
        INSERT INTO evaluation_history (evaluation_id, action, performed_by, new_values)
        VALUES ($1, $2, $3, $4)
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      // await storage.query(historyQuery, [
      //   newEvaluation.id,
      //   "created",
      //   evaluationData.evaluatedBy || "system",
      //   JSON.stringify(newEvaluation)
      // ]);
      
      res.status(201).json(newEvaluation);
    } catch (error) {
      console.error("R&D 평가 생성 오류:", error);
      res.status(500).json({ error: "평가를 생성할 수 없습니다." });
    }
  });

  // R&D 역량평가 수정
  app.put("/api/rd-evaluations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const existingResult = { rows: [] };
      
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: "평가를 찾을 수 없습니다." });
      }
      
      const existing = existingResult.rows[0];
      
      // 점수 재계산
      const totalScore = 
        (updateData.technicalCompetencyScore * 0.25) +
        (updateData.projectExperienceScore * 0.20) +
        (updateData.rdAchievementScore * 0.25) +
        (updateData.globalCompetencyScore * 0.10) +
        (updateData.knowledgeSharingScore * 0.10) +
        (updateData.innovationProposalScore * 0.10);
      
      // 등급 재계산
      let grade = "D";
      if (totalScore >= 90) grade = "S";
      else if (totalScore >= 80) grade = "A";
      else if (totalScore >= 70) grade = "B";
      else if (totalScore >= 60) grade = "C";
      
      const updateQuery = `
        UPDATE rd_evaluations SET
          technical_competency_score = $2,
          technical_competency_details = $3,
          project_experience_score = $4,
          project_experience_details = $5,
          rd_achievement_score = $6,
          rd_achievement_details = $7,
          global_competency_score = $8,
          global_competency_details = $9,
          knowledge_sharing_score = $10,
          knowledge_sharing_details = $11,
          innovation_proposal_score = $12,
          innovation_proposal_details = $13,
          total_score = $14,
          grade = $15,
          status = $16,
          comments = $17,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const result = { rows: [{ id: 'temp-id' }] };
      
      const updatedEvaluation = result.rows[0];
      
      // 평가 이력 기록
      const historyQuery = `
        INSERT INTO evaluation_history (evaluation_id, action, performed_by, previous_values, new_values)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      // await storage.query(historyQuery, [
      //   id,
      //   "updated",
      //   updateData.evaluatedBy || "system",
      //   JSON.stringify(existing),
      //   JSON.stringify(updatedEvaluation)
      // ]);
      
      res.json(updatedEvaluation);
    } catch (error) {
      console.error("R&D 평가 수정 오류:", error);
      res.status(500).json({ error: "평가를 수정할 수 없습니다." });
    }
  });

  // R&D 역량평가 통계 조회
  app.get("/api/rd-evaluations/stats", async (req, res) => {
    try {
      const { year } = req.query;
      const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
      
      // 전체 통계
      const statsQuery = `
        SELECT 
          COUNT(*) as total_evaluations,
          AVG(total_score) as average_score,
          COUNT(CASE WHEN grade = 'S' THEN 1 END) as s_grade,
          COUNT(CASE WHEN grade = 'A' THEN 1 END) as a_grade,
          COUNT(CASE WHEN grade = 'B' THEN 1 END) as b_grade,
          COUNT(CASE WHEN grade = 'C' THEN 1 END) as c_grade,
          COUNT(CASE WHEN grade = 'D' THEN 1 END) as d_grade
        FROM rd_evaluations 
        WHERE evaluation_year = $1 AND status = 'approved'
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const statsResult = { rows: [] };
      const stats = statsResult.rows[0];
      
      // 부서별 통계
      const deptStatsQuery = `
        SELECT 
          e.department,
          COUNT(*) as employee_count,
          AVG(re.total_score) as average_score
        FROM rd_evaluations re
        JOIN employees e ON re.employee_id = e.id
        WHERE re.evaluation_year = $1 AND re.status = 'approved'
        GROUP BY e.department
        ORDER BY average_score DESC
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const deptStatsResult = { rows: [] };
      
      // 상위 성과자
      const topPerformersQuery = `
        SELECT 
          re.employee_id,
          e.name,
          re.total_score,
          ROW_NUMBER() OVER (ORDER BY re.total_score DESC) as rank
        FROM rd_evaluations re
        JOIN employees e ON re.employee_id = e.id
        WHERE re.evaluation_year = $1 AND re.status = 'approved'
        ORDER BY re.total_score DESC
        LIMIT 10
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const topPerformersResult = { rows: [] };
      
      res.json({
        totalEvaluations: parseInt(stats.total_evaluations) || 0,
        averageScore: parseFloat(stats.average_score) || 0,
        gradeDistribution: {
          S: parseInt(stats.s_grade) || 0,
          A: parseInt(stats.a_grade) || 0,
          B: parseInt(stats.b_grade) || 0,
          C: parseInt(stats.c_grade) || 0,
          D: parseInt(stats.d_grade) || 0
        },
        departmentStats: deptStatsResult.rows.map((row: any) => ({
          department: row.department,
          averageScore: parseFloat(row.average_score) || 0,
          employeeCount: parseInt(row.employee_count) || 0
        })),
        topPerformers: topPerformersResult.rows.map((row: any) => ({
          employeeId: row.employee_id,
          name: row.name,
          score: parseFloat(row.total_score) || 0,
          rank: parseInt(row.rank) || 0
        }))
      });
    } catch (error) {
      console.error("R&D 평가 통계 조회 오류:", error);
      res.status(500).json({ error: "통계 정보를 불러올 수 없습니다." });
    }
  });

  // 평가 기준 조회는 routes.ts로 이동됨

  // 평가 기준 수정은 routes.ts로 이동됨

  // 자동 평가 실행
  app.post("/api/rd-evaluations/auto-calculate", async (req, res) => {
    try {
      const { year } = req.body;
      const evaluationYear = year || new Date().getFullYear();
      
      // 모든 직원의 자동 평가 실행
      const evaluations = await calculateAllEmployeesRdEvaluation(evaluationYear);
      
      // 결과를 DB에 저장
      const savedEvaluations = [];
      for (const evaluation of evaluations) {
        try {
          const saved = await saveRdEvaluationResult(evaluation);
          savedEvaluations.push(saved);
        } catch (error) {
          console.error(`직원 ${evaluation.employeeId} 평가 저장 오류:`, error);
        }
      }
      
      // 통계 계산
      const totalEvaluations = savedEvaluations.length;
      const averageScore = savedEvaluations.reduce((sum, evaluation) => sum + evaluation.total_score, 0) / totalEvaluations;
      const sGrade = savedEvaluations.filter(evaluation => evaluation.grade === 'S').length;
      
      // 부서별 통계
      const deptStatsQuery = `
        SELECT 
          e.department,
          COUNT(*) as count,
          AVG(re.total_score) as avg_score
        FROM rd_evaluations re
        JOIN employees e ON re.employee_id = e.id
        WHERE re.evaluation_year = $1 AND re.status = 'auto_calculated'
        GROUP BY e.department
      `;
      
      // 현재는 파일 기반 저장소이므로 임시로 빈 결과 반환
      const deptStatsResult = { rows: [] };
      
      res.json({
        success: true,
        totalEvaluations,
        averageScore,
        sGrade,
        departments: deptStatsResult.rows.length,
        evaluations: savedEvaluations
      });
    } catch (error) {
      console.error("자동 평가 실행 오류:", error);
      res.status(500).json({ error: "자동 평가 실행 중 오류가 발생했습니다." });
    }
  });

  // 개별 직원 자동 평가
  app.post("/api/rd-evaluations/auto-calculate/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { year } = req.body;
      const evaluationYear = year || new Date().getFullYear();
      
      const evaluation = await calculateAutoRdEvaluation(employeeId, evaluationYear);
      const saved = await saveRdEvaluationResult(evaluation);
      
      res.json(saved);
    } catch (error) {
      console.error("개별 자동 평가 오류:", error);
      res.status(500).json({ error: "자동 평가 실행 중 오류가 발생했습니다." });
    }
  });
}
