import rateLimit from "express-rate-limit"; // 요청 제한 미들웨어
import {
  csrfTokenMiddleware,
  csrfProtection as csrfProtectionUtil,
} from "./csrfUtil";

// 일반 API용 Rate Limiter
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 분 제한
  max: 1000, // 요청 횟수
  standardHeaders: true, // 최신 표준 헤더 포함
  legacyHeaders: false, // 구형 헤더 비활성화
  // 동적 메시지 생성을 위한 함수 사용
  message: (req: any, res: any) => {
    const resetTime = Math.ceil(
      (res.getHeader("RateLimit-Reset") as number) / 60
    ); // 초를 분으로 변환
    return {
      success: false,
      message: `너무 많은 요청이 발생했습니다.\n${resetTime}분 후에 다시 시도해주세요.`,
    };
  },
});

// 토큰 리프레셔용 Rate Limiter (더 관대한 제한)
export const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 3000, // 15분간 3000번 요청 가능 (더 많은 요청 허용)
  standardHeaders: true,
  legacyHeaders: false,
  message: (req: any, res: any) => {
    const resetTime = Math.ceil(
      (res.getHeader("RateLimit-Reset") as number) / 60
    );
    return {
      success: false,
      message: `토큰 갱신 요청이 너무 많습니다.\n${resetTime}분 후에 다시 시도해주세요.`,
    };
  },
});

// CSRF 미들웨어 내보내기
export const csrfProtection = csrfProtectionUtil;
export { csrfTokenMiddleware };

/**
 * 숫자를 지정된 범위로 제한하는 함수
 * @param value 제한할 값
 * @param min 최소값
 * @param max 최대값
 * @returns 제한된 값
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
