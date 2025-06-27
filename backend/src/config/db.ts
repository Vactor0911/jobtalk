import MariaDB from "mariadb";
import dotenv from "dotenv"; // 환경 변수 사용한 민감한 정보 관리

// .env 파일 로드
dotenv.config();

// MariaDB 연결
export const dbPool = MariaDB.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 30,
  bigNumberStrings: true,
});

// MariadbPool 연결 확인
dbPool
  .getConnection()
  .then((conn) => {
    console.log("데이터베이스가 성공적으로 연결되었습니다");
    conn.release();
  })
  .catch((err) => {
    console.error("데이터베이스 연결에 실패하였습니다.", err.message);
  });
