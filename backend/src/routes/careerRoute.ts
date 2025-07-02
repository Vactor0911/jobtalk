import express from "express";
import { limiter } from "../utils"; // 기존 rate limiter 사용
import {
  getAptitudes,
  getJobCodes,
  getJobDetail,
  getThemes,
  searchJobs,
} from "../controllers/careerController";

const careerRoute = express.Router();

// 직업 검색 API
careerRoute.get("/jobs", limiter, searchJobs);

// 직업 상세 정보 조회 API
careerRoute.get("/jobs/:jobCode", limiter, getJobDetail);

// 테마별 직업 조회 API
careerRoute.get("/themes", limiter, getThemes);

// 직업 적성 분류 조회 API
careerRoute.get("/aptitudes", limiter, getAptitudes);

// 모든 직업 코드 목록 조회 API
careerRoute.get("/jobcodes", limiter, getJobCodes);

export default careerRoute;
