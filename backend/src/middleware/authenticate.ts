import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Request 인터페이스를 확장하여 user 속성을 포함합니다.
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

// 사용자 인증 미들웨어
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Authorization 헤더에서 Access Token 추출
  const authHeader = req.headers.authorization; // Authorization 헤더 확인
  const accessToken = authHeader && authHeader.split(" ")[1]; // "Bearer {token}"에서 token만 추출

  if (!accessToken) {
    res.status(401).json({
      success: false,
      message: "Access Token이 필요합니다.",
    });
    return; // 반드시 반환
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!);
    req.user = decoded; // 사용자 정보를 요청 객체에 저장
    next(); // 다음 미들웨어로 이동
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "유효하지 않은 Access Token입니다.",
    });
    return; // 반드시 반환
  }
};

// 관리자 권한 인증 미들웨어
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user as { permission: string };

  if (
    !user ||
    (user.permission !== "admin" && user.permission !== "superadmin")
  ) {
    res
      .status(403)
      .json({ success: false, message: "관리자 권한이 필요합니다." });
    return; // 반드시 반환
  }

  next(); // 다음 미들웨어로 이동
};

// 선택적 인증 미들웨어
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Authorization 헤더에서 Access Token 추출 (authenticateToken과 동일한 방식)
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1]; // "Bearer {token}"에서 token만 추출

    // 토큰이 없는 경우 - 인증 없이 진행
    if (!accessToken) {
      next();
      return;
    }

    // 토큰 검증
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!);
    req.user = decoded; // 사용자 정보 설정
    next();
  } catch (err) {
    // 토큰이 유효하지 않은 경우에도 오류를 반환하지 않고 계속 진행
    // 사용자는 인증되지 않은 상태로 간주됨
    console.log("토큰 검증 실패 (선택적 인증):", err);
    next();
  }
};
