import dotenv from "dotenv";
import express from "express";

dotenv.config(); // .env 환경 변수 로드

const PORT = Number(process.env.SERVER_PORT); // 서버가 실행될 포트 번호

const app = express();
app.use(express.json()); // JSON 요청을 처리하기 위한 미들웨어

// 기본 라우트 설정
app.get("/", (req, res) => {
  res.send("Project MW Web Server!");
});

// 서버 시작
app.listen(PORT, "0.0.0.0", () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
