import express from "express";
import { limiter } from "../utils";
import {
  getAllQualifications,
  searchQualificationsFromDB,
} from "../controllers/qualificationController";

const qualificationRoute = express.Router();

// 자격증 검색 API
qualificationRoute.get("/search", limiter, searchQualificationsFromDB);

// 모든 자격증 종목 조회 API
qualificationRoute.get("/all", limiter, getAllQualifications);

export default qualificationRoute;