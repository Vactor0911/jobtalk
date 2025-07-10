import express from "express";
import { csrfProtection, limiter } from "../utils"; // 기존 rate limiter 사용
import {
  getAllWorkspaces,
  getWorkspaceAndUserBasicInfo,
  getWorkspaceByUuid,
  getWorkspaceChats,
  getWorkspaceRoadmap,
  saveWorkspaceChat,
  saveWorkspaceRoadmap,
  updateWorkspaceForChat,
  updateWorkspaceInterest,
} from "../controllers/workspaceController";
import { authenticateToken } from "../middleware/authenticate";

const workspaceRoute = express.Router();

// 사용자의 모든 워크스페이스 조회
workspaceRoute.get("/all", limiter, authenticateToken, getAllWorkspaces);

// 특정 워크스페이스 조회
workspaceRoute.get("/:uuid", limiter, authenticateToken, getWorkspaceByUuid);

// 워크스페이스 대화 기록 조회
workspaceRoute.get(
  "/:uuid/chats",
  limiter,
  authenticateToken,
  getWorkspaceChats
);

// 워크스페이스 대화 저장
workspaceRoute.post(
  "/:uuid/chats",
  csrfProtection,
  limiter,
  authenticateToken,
  saveWorkspaceChat
);

// 워크스페이스를 대화 모드로 업데이트
workspaceRoute.put(
  "/:uuid/chat",
  csrfProtection,
  limiter,
  authenticateToken,
  updateWorkspaceForChat
);

// 워크스페이스 관심 분야 설정
workspaceRoute.put(
  "/:uuid/interest",
  csrfProtection,
  limiter,
  authenticateToken,
  updateWorkspaceInterest
);

// 워크스페이스 기본 정보와 사용자 기본 정보 통합 조회
workspaceRoute.get(
  "/:uuid/basicinfo",
  limiter,
  authenticateToken,
  getWorkspaceAndUserBasicInfo
);

// 워크스페이스 로드맵 저장
workspaceRoute.post(
  "/:uuid/roadmap",
  csrfProtection,
  limiter,
  authenticateToken,
  saveWorkspaceRoadmap
);

// 워크스페이스 uuid로 로드맵 조회
workspaceRoute.get(
  "/:uuid/roadmap",
  limiter,
  authenticateToken,
  getWorkspaceRoadmap
);

export default workspaceRoute;
