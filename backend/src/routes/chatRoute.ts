import express from "express";
import { csrfProtection, limiter, roadmapChatbotLimiter } from "../utils"; // 기존 rate limiter 사용
import {
  careerMentor,
  generateCareerRoadmap,
  nodeDetailProvider,
  roadmapChatbot,
} from "../controllers/chatController";
import { authenticateToken } from "../middleware/authenticate";

const chatRoute = express.Router();

// 진로 상담 AI
chatRoute.post("/career/mentor", limiter, careerMentor);

// 로드맵 챗봇 AI
chatRoute.post(
  "/roadmap/chatbot",
  authenticateToken,
  roadmapChatbotLimiter,
  roadmapChatbot
);

// 로드맵 생성 전용 API
chatRoute.post(
  "/career/roadmap",
  csrfProtection,
  limiter,
  authenticateToken,
  generateCareerRoadmap
);

// 로드맵 노드 상세정보 제공 API
chatRoute.post("/roadmap/node/detail", limiter, nodeDetailProvider);

export default chatRoute;
