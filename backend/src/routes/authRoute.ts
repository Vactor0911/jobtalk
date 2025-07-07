import express from "express";
import { csrfProtection, limiter, refreshTokenLimiter } from "../utils";
import {
  deleteAccount,
  getUserInfo,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  sendVerifyEmail,
  updateNickname,
  updatePassword,
  updateUserCertificates,
  uploadProfileImage,
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

// 닉네임 변경
authRoute.patch("/me/nickname", csrfProtection, limiter, authenticateToken,  updateNickname);

// 비밀번호 변경
authRoute.patch("/me/password", csrfProtection, limiter, authenticateToken, updatePassword);

// 계정 탈퇴
authRoute.post("/me/delete", csrfProtection, limiter, authenticateToken, deleteAccount);

// 프로필 이미지 업로드
authRoute.post("/me/profile-image", csrfProtection, limiter, authenticateToken, uploadProfileImage);

// 자격증 정보 업데이트
authRoute.patch("/me/certificates", csrfProtection, limiter, authenticateToken, updateUserCertificates);

// 비밀번호 찾기(재설정)
authRoute.post("/resetPassword", csrfProtection, resetPassword);

export default authRoute;