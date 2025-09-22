import { v4 as uuidv4 } from "uuid";
import { Request, Response, NextFunction } from "express";
import csrf from "csurf";

// CSRF 토큰 생성
export const generateCsrfToken = () => {
  return uuidv4();
};

// CSRF 보호 미들웨어
export const csrfProtection = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  return next();
};

// Request 객체에 csrfToken 메소드 추가 (기존 csurf와 호환성 유지)
declare global {
  namespace Express {
    interface Request {
      csrfToken(): string;
    }
  }
}

export const csrfTokenMiddleware = csrf({
  cookie: {
    key: "csrf-token", // 기본 키
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // 프로덕션은 HTTPS 필수
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    partitioned: process.env.NODE_ENV === "production" ? true : undefined,
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
