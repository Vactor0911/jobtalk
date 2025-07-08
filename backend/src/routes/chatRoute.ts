import express from "express";
import { limiter } from "../utils"; // 기존 rate limiter 사용
import { careerMentor, nodeDetailProvider } from "../controllers/chatController";

const chatRoute = express.Router();

// 진로 상담 및 로드맵 생성 API
chatRoute.post("/career/mentor", limiter, careerMentor);

// 로드맵 노드 상세 정보 제공 API
chatRoute.post("/roadmap/node/detail", limiter, nodeDetailProvider);

export default chatRoute;
