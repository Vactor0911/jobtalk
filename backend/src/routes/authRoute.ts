import express from "express";
import { csrfProtection, limiter, refreshTokenLimiter } from "../utils";
import {
  getUserInfo,
  login,
  logout,
  refreshToken,
  register,
  sendVerifyEmail,
  verifyEmailCode,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authenticate";

const authRoute = express.Router();

// 회원가입
authRoute.post("/register", register);

// 로그인
authRoute.post("/login", csrfProtection, login);

// 로그아웃
authRoute.post("/logout", csrfProtection, logout);

// 이메일 인증 요청
authRoute.post("/sendVerifyEmail", sendVerifyEmail);

// 이메일 인증 코드 확인
authRoute.post("/verifyEmailCode", verifyEmailCode);

// 엑세스 토큰 재발급
authRoute.post("/token/refresh", csrfProtection, refreshTokenLimiter, refreshToken);

// 사용자 정보 조회
authRoute.get("/me", csrfProtection, limiter, authenticateToken, getUserInfo);



export default authRoute;