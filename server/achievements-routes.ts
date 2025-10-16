import type { Express } from "express";
import { storage } from "./storage";

export function setupAchievementsRoutes(app: Express) {
  // 특허 관리
  app.get("/api/achievements/patents", async (req, res) => {
    try {
      const { employeeId, status, category } = req.query;
      
      // 실제 특허 데이터 조회
      let patents = await storage.getAllPatents();
      
      // 직원 ID로 필터링
      if (employeeId) {
        patents = patents.filter(patent => patent.employeeId === employeeId);
      }
      
      // 상태로 필터링
      if (status) {
        patents = patents.filter(patent => patent.status === status);
      }
      
      // 카테고리로 필터링
      if (category) {
        patents = patents.filter(patent => patent.category === category);
      }
      
      res.json(patents);
    } catch (error) {
      console.error("특허 목록 조회 오류:", error);
      res.status(500).json({ error: "특허 목록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/achievements/patents", async (req, res) => {
    try {
      const patentData = req.body;
      
      // 실제 특허 데이터 저장
      const newPatent = await storage.createPatent(patentData);
      
      res.status(201).json(newPatent);
    } catch (error) {
      console.error("특허 등록 오류:", error);
      res.status(500).json({ error: "특허를 등록할 수 없습니다." });
    }
  });

  app.put("/api/achievements/patents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 실제 특허 데이터 수정
      const updatedPatent = await storage.updatePatent(id, updateData);
      
      res.json(updatedPatent);
    } catch (error) {
      console.error("특허 수정 오류:", error);
      res.status(500).json({ error: "특허를 수정할 수 없습니다." });
    }
  });

  app.delete("/api/achievements/patents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // 실제 특허 데이터 삭제
      const success = await storage.deletePatent(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "특허를 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("특허 삭제 오류:", error);
      res.status(500).json({ error: "특허를 삭제할 수 없습니다." });
    }
  });

  // 논문 관리
  app.get("/api/achievements/publications", async (req, res) => {
    try {
      const { employeeId, category, journal } = req.query;
      
      // 실제 논문 데이터 조회
      let publications = await storage.getAllPublications();
      
      // 직원 ID로 필터링
      if (employeeId) {
        publications = publications.filter(publication => publication.employeeId === employeeId);
      }
      
      // 카테고리로 필터링
      if (category) {
        publications = publications.filter(publication => publication.category === category);
      }
      
      // 저널로 필터링
      if (journal) {
        publications = publications.filter(publication => publication.journal === journal);
      }
      
      res.json(publications);
    } catch (error) {
      console.error("논문 목록 조회 오류:", error);
      res.status(500).json({ error: "논문 목록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/achievements/publications", async (req, res) => {
    try {
      const publicationData = req.body;
      
      // 실제 논문 데이터 저장
      const newPublication = await storage.createPublication(publicationData);
      
      res.status(201).json(newPublication);
    } catch (error) {
      console.error("논문 등록 오류:", error);
      res.status(500).json({ error: "논문을 등록할 수 없습니다." });
    }
  });

  app.put("/api/achievements/publications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 실제 논문 데이터 수정
      const updatedPublication = await storage.updatePublication(id, updateData);
      
      res.json(updatedPublication);
    } catch (error) {
      console.error("논문 수정 오류:", error);
      res.status(500).json({ error: "논문을 수정할 수 없습니다." });
    }
  });

  app.delete("/api/achievements/publications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // 실제 논문 데이터 삭제
      const success = await storage.deletePublication(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "논문을 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("논문 삭제 오류:", error);
      res.status(500).json({ error: "논문을 삭제할 수 없습니다." });
    }
  });

  // 수상 관리
  app.get("/api/achievements/awards", async (req, res) => {
    try {
      const { employeeId, level, category } = req.query;
      
      // 실제 수상 데이터 조회
      let awards = await storage.getAllAwards();
      
      // 직원 ID로 필터링
      if (employeeId) {
        awards = awards.filter(award => award.employeeId === employeeId);
      }
      
      // 레벨로 필터링
      if (level) {
        awards = awards.filter(award => award.level === level);
      }
      
      // 카테고리로 필터링
      if (category) {
        awards = awards.filter(award => award.category === category);
      }
      
      res.json(awards);
    } catch (error) {
      console.error("수상 목록 조회 오류:", error);
      res.status(500).json({ error: "수상 목록을 불러올 수 없습니다." });
    }
  });

  app.post("/api/achievements/awards", async (req, res) => {
    try {
      const awardData = req.body;
      
      // 실제 수상 데이터 저장
      const newAward = await storage.createAward(awardData);
      
      res.status(201).json(newAward);
    } catch (error) {
      console.error("수상 등록 오류:", error);
      res.status(500).json({ error: "수상을 등록할 수 없습니다." });
    }
  });

  app.put("/api/achievements/awards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 실제 수상 데이터 수정
      const updatedAward = await storage.updateAward(id, updateData);
      
      res.json(updatedAward);
    } catch (error) {
      console.error("수상 수정 오류:", error);
      res.status(500).json({ error: "수상을 수정할 수 없습니다." });
    }
  });

  app.delete("/api/achievements/awards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // 실제 수상 데이터 삭제
      const success = await storage.deleteAward(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "수상을 찾을 수 없습니다." });
      }
    } catch (error) {
      console.error("수상 삭제 오류:", error);
      res.status(500).json({ error: "수상을 삭제할 수 없습니다." });
    }
  });

  // 성과 통계
  app.get("/api/achievements/stats", async (req, res) => {
    try {
      // 실제 성과 통계 계산
      const [patents, publications, awards] = await Promise.all([
        storage.getAllPatents(),
        storage.getAllPublications(),
        storage.getAllAwards()
      ]);
      
      const stats = {
        totalPatents: patents.length,
        totalPublications: publications.length,
        totalAwards: awards.length,
        pendingPatents: patents.filter(p => p.status === 'pending').length,
        recentAchievements: [
          ...patents.slice(-5).map(p => ({ type: 'patent', title: p.title, date: p.applicationDate })),
          ...publications.slice(-5).map(p => ({ type: 'publication', title: p.title, date: p.publicationDate })),
          ...awards.slice(-5).map(a => ({ type: 'award', title: a.name, date: a.awardDate }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("성과 통계 조회 오류:", error);
      res.status(500).json({ error: "성과 통계를 불러올 수 없습니다." });
    }
  });
}
