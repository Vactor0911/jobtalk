import express, { Request, Response } from "express";
import cors from "cors"; // CORS 설정을 위한 라이브러리
import cookieParser from "cookie-parser"; // 쿠키 파싱을 위한 라이브러리
import bodyParser from "body-parser"; // 요청 본문 파싱을 위한 라이브러리
import helmet from "helmet"; // 보안 헤더 설정을 위한 라이브러리
import dotenv from "dotenv"; // 환경변수 관리를 위한 라이브러리

import authRoute from "./routes/authRoute"; // 사용자 계정 관련 라우트
import csrfRoute from "./routes/csrfRoute"; // CSRF 토큰 관련 라우트
import { csrfTokenMiddleware } from "./utils";

// .env 파일 로드
dotenv.config();

// 환경변수가 하나라도 없으면 서버 실행 불가
[
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "SESSION_SECRET",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "NODEMAILER_USER",
  "NODEMAILER_PASS",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`해당 환경변수가 존재하지 않습니다.: ${key}`);
  }
});

const PORT = 3000; // 서버가 실행될 포트 번호
const FRONT_PORT = 8080; // 프론트 서버 포트 번호

const app = express();
app.use(
  cors({
    // origin: `http://localhost:${FRONT_PORT}`,
    origin: 'https://project-mw.vactor0911.dev',
    credentials: true,
  })
); // CORS 설정, credentials는 프론트와 백엔드의 쿠키 공유를 위해 필요

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      // 필요시 추가 설정
    }
  },
  // 개발 환경에서는 일부 설정 완화
  crossOriginResourcePolicy: { 
    policy: process.env.NODE_ENV === 'production' ? "same-site" : "cross-origin" 
  },
}));


app.use(express.json()); // JSON 요청을 처리하기 위한 미들웨어
app.use(cookieParser(process.env.SESSION_SECRET)); // 쿠키 파싱 미들웨어 등록
app.use(bodyParser.json()); // JSON 파싱 미들웨어 등록

// CSRF 토큰 미들웨어 추가
app.use(csrfTokenMiddleware);

// 기본 라우트 설정
app.get("/", (req, res) => {
  res.send("Project MW Web Server!");
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});

// *** 라우트 정의 시작 ***
app.use("/auth", authRoute); // 사용자 계정 관련 라우트
app.use("/csrf", csrfRoute); // CSRF 토큰 요청 라우트

app.post("/test/postTest", (req: Request, res: Response) => {
  // POST 요청 테스트용 라우트
  console.log("POST 요청이 들어왔습니다:", req.body);
  res.json({ message: "POST 요청이 성공적으로 처리되었습니다." });
});

app.get("/test/getTest", (req: Request, res: Response) => {
  // GET 요청 테스트용 라우트
  console.log("GET 요청이 들어왔습니다:", req.query);
  res.json({ message: "GET 요청이 성공적으로 처리되었습니다." });
});

// *** 라우트 정의 끝 ***