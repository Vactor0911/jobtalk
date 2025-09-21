import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";

// CSRF 토큰 생성
export const generateCsrfToken = () => {
  return uuidv4();
};

// CSRF 보호 미들웨어
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // GET, HEAD, OPTIONS 요청은 CSRF 검증 생략 (안전한 메소드)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // 요청 헤더에서 CSRF 토큰 가져오기
  const csrfToken = req.headers["x-csrf-token"] as string;
  console.log("요청 헤더의 CSRF 토큰:", csrfToken);
  console.log("쿠키의 CSRF 토큰:", req.signedCookies["csrf-token"]);
  console.log("서로 다른지 확인:", csrfToken !== req.signedCookies["csrf-token"]);

  // 쿠키에서 CSRF 토큰 가져오기
  const csrfCookie = req.signedCookies["csrf-token"];
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    res.status(403).json({
      success: false,
      message: "CSRF 토큰이 유효하지 않습니다.",
    });
    return;
  }

  next();
};

// Request 객체에 csrfToken 메소드 추가 (기존 csurf와 호환성 유지)
declare global {
  namespace Express {
    interface Request {
      csrfToken(): string;
    }
  }
}

// CSRF 토큰 미들웨어 - 요청 객체에 csrfToken 함수 추가
export const csrfTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.csrfToken = () => {
    // 기존 토큰이 있으면 재사용, 없으면 새로 생성
    const existingToken = req.signedCookies["csrf-token"];
    const token = existingToken || generateCsrfToken();

    // process.env.NODE_ENV는
    // development(개발), production(배포), test 등
    // Node.js 애플리케이션의 실행 환경을 나타냅니다.

    // 토큰이 새로 생성된 경우 쿠키에 설정
    if (!existingToken) {
      res.cookie("csrf-token", token, {
        httpOnly: true, // 클라이언트 측 스크립트에서 접근할 수 없도록 설정
        signed: true, // 서명된 쿠키로 설정 (cookie-parser 미들웨어가 필요)
        secure: process.env.NODE_ENV === "production", // HTTPS 환경에서만 쿠키 전송
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24시간 동안 유효
      });
    }

    return token;
  };

  next();
};
