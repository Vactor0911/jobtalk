import express from "express";
import { limiter } from "../utils"; // 기존 rate limiter 사용const careerRoute = express.Router();
import { getAllWorkspaces } from "../controllers/workspaceController";

const workspaceRoute = express.Router();

// 워크스페이스 전체 검색 API
workspaceRoute.get("/all", limiter, getAllWorkspaces);

export default workspaceRoute;
