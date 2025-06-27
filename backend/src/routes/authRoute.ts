import express from "express";
import { csrfProtection } from "../utils";
import {
  login,
  logout,
  register,
  sendVerifyEmail,
  verifyEmailCode,
} from "../controllers/authController";

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


export default authRoute;