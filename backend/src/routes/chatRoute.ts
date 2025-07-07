import express from "express";
import { limiter } from "../utils"; // 기존 rate limiter 사용
import { chatTest } from "../controllers/chatController";

const chatRoute = express.Router();

// 대화 테스트 API
chatRoute.post("/test", limiter, chatTest);

export default chatRoute;
