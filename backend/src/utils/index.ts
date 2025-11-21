import rateLimit from "express-rate-limit"; // 요청 제한 미들웨어
import { csrfTokenMiddleware } from "./csrfUtil";

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

// 사용자별(로그인) 로드맵 챗봇 전용 Rate Limiter
export const roadmapChatbotLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 10, // 5분에 10회
  keyGenerator: (req) => {
    // 로그인 사용자라면 userUuid, 아니면 IP
    return req.user?.userUuid || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: (req: any, res: any) => {
    const resetTime = Math.ceil(
      (res.getHeader("RateLimit-Reset") as number) / 60
    );
    return {
      success: false,
      message: `로드맵 챗봇은 5분에 최대 10회까지만 질문할 수 있습니다. \n${resetTime}분 후에 다시 시도해주세요.`,
    };
  },
});

// CSRF 미들웨어 내보내기
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

/**
 * 무작위 워크스페이스 이름 생성 함수
 * @returns 무작위 워크스페이스 이름 문자열
 */
export const getRandWorkspaceName = () => {
  const names = [
    "안녕하세요! 진로 상담이 궁금해요 💬",
    "새로운 꿈을 찾고 있어요 ✨",
    "나만의 로드맵을 만들어볼까요? 🗺️",
    "나의 숨겨진 잠재력 찾기, 지금 시작해요! 🔍",
    "나를 알아가는 시간, 오늘부터 1일! 🗓️",
    "미래의 나에게 보내는 질문, 같이 답해볼까요? 💌",
    "꿈까지 가는 길, 이젠 헤매지 마세요! 🛤️",
    "흔들리지 않는 목표, 함께 만들어가요! 🏗️",
    "오늘의 작은 시작이 미래를 바꿔요! ➡️",
    "복잡한 목표, 한눈에 시원하게 시각화! 👀",
    "나의 진정한 방향, 지금 설정할 시간이에요! 🎯",
    "나만의 성공 지도, 지금 바로 펼쳐볼까요? 🗺️",
    "꿈을 향한 대화, 우리 함께 풀어봐요! 💬",
    "나만의 강점, 제대로 발견하고 활용해요 💪",
  ];
  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex];
};
