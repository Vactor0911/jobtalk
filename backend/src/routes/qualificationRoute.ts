import express from "express";
import { limiter } from "../utils";
import {
  searchQualificationsFromDB,
} from "../controllers/qualificationController";

const qualificationRoute = express.Router();

// 자격증 검색 API
qualificationRoute.get("/search", limiter, searchQualificationsFromDB);

export default qualificationRoute;