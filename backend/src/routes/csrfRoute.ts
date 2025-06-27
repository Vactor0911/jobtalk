import express from "express";
import { csrfToken } from "../controllers/csrfController";

const csrfRoute = express.Router();

// CSRF 토큰 요청
csrfRoute.get("/csrfToken", csrfToken);

export default csrfRoute;
