import express from "express";
import { csrfProtection, limiter } from "../utils"; // 기존 rate limiter 사용
import {
  careerMentor,
  generateCareerRoadmap,
  nodeDetailProvider,
} from "../controllers/chatController";
import { authenticateToken } from "../middleware/authenticate";

const chatRoute = express.Router();

// 진로 상담 AI
chatRoute.post("/career/mentor", limiter, careerMentor);

// 로드맵 생성 전용 API
chatRoute.post(
  "/career/roadmap",
  csrfProtection,
  limiter,
  authenticateToken,
  generateCareerRoadmap
);

// 로드맵 노드 세부사항 제공 API
chatRoute.post("/roadmap/node/detail", limiter, nodeDetailProvider);

export default chatRoute;
