import express, { Request, Response } from "express";
import cors from "cors"; // CORS 설정을 위한 라이브러리
import cookieParser from "cookie-parser"; // 쿠키 파싱을 위한 라이브러리
import bodyParser from "body-parser"; // 요청 본문 파싱을 위한 라이브러리
import helmet from "helmet"; // 보안 헤더 설정을 위한 라이브러리
import dotenv from "dotenv"; // 환경변수 관리를 위한 라이브러리
import path from "path"; // 경로 조작을 위한 모듈

import authRoute from "./routes/authRoute"; // 사용자 계정 관련 라우트
import csrfRoute from "./routes/csrfRoute"; // CSRF 토큰 관련 라우트
import careerRoute from "./routes/careerRoute"; // 커리어넷 관련 API 라우트
import { csrfTokenMiddleware } from "./utils";
import chatRoute from "./routes/chatRoute";
import qualificationRoute from "./routes/qualificationRoute";
import { dbPool } from "./config/db";
import { syncQualificationsToDatabase } from "./controllers/qualificationController";

// .env 파일 로드
dotenv.config();

// 환경변수가 하나라도 없으면 서버 실행 불가
[
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "SERVER_CORS_ORIGIN",
  "SESSION_SECRET",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
  "CAREER_NET_API_KEY",
  "OPENAI_API_KEY",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`해당 환경변수가 존재하지 않습니다.: ${key}`);
  }
});

const PORT = Number(process.env.SERVER_PORT); // 서버가 실행될 포트 번호

const app = express();
app.use(
  cors({
    origin: process.env.SERVER_CORS_ORIGIN, // CORS 허용 도메인 설정
    credentials: true,
  })
); // CORS 설정, credentials는 프론트와 백엔드의 쿠키 공유를 위해 필요

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        // 필요시 추가 설정
      },
    },
    // 항상 cross-origin 허용으로 설정
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(express.json()); // JSON 요청을 처리하기 위한 미들웨어
app.use(cookieParser(process.env.SESSION_SECRET)); // 쿠키 파싱 미들웨어 등록
app.use(bodyParser.json()); // JSON 파싱 미들웨어 등록

// 정적 파일 서비스 설정
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// CSRF 토큰 미들웨어 추가
app.use(csrfTokenMiddleware);

// 서버 시작 후 자격증 데이터 확인 및 동기화
const initializeQualifications = async () => {
  try {
    // DB에 자격증 데이터가 있는지 확인
    const result = await dbPool.query(
      "SELECT COUNT(*) as count FROM qualifications"
    );
    const count = result[0]?.count || 0;

    if (count === 0) {
      await syncQualificationsToDatabase();
    }
  } catch (error) {
    console.error("자격증 데이터 초기화 오류:", error);
  }
};

// 기본 라우트 설정
app.get("/", (req, res) => {
  res.send("JobTalk Web Server!");
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);

  // 자격증 데이터 초기화 (비동기)
  initializeQualifications();
});

// *** 라우트 정의 시작 ***
app.use("/auth", authRoute); // 사용자 계정 관련 라우트
app.use("/csrf", csrfRoute); // CSRF 토큰 요청 라우트
app.use("/career", careerRoute); // 커리어넷 관련 API 라우트
app.use("/chat", chatRoute); // 챗봇 관련 API 라우트
app.use("/qualification", qualificationRoute); // 자격증 관련 API 라우트 추가

// *** 라우트 정의 끝 ***
