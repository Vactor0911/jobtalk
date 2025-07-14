import type { LoginState } from "../state";
import { setAccessToken } from "./accessToken";

/**
 * 로그인 상태를 설정하는 비동기 함수
 * 컴포넌트 외부에서도 아톰 상태 변경 가능
 * @param setLoginState
 * @returns 로그인 상태 초기화
 */
export const resetStates = async (
  setLoginState: (state: LoginState) => void
) => {
  setLoginState({} as LoginState); // 로그인 상태 초기화
  setAccessToken(""); // 토큰 초기화
  sessionStorage.removeItem("JobTalkloginState"); // 세션 스토리지 제거
  localStorage.removeItem("JobTalkloginState"); // 로컬 스토리지 제거
};

/**
 * 이메일 형식이 올바른지 확인하는 함수
 * @param email 이메일 주소
 * @returns 이메일 형식이 올바른지 여부
 */
export const isEmailValid = (email: string) => {
  // 이메일 미입력시
  if (!email) {
    return false;
  }

  // 이메일 정규식 검사
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // 이메일 형식이 올바름
  return true;
};

/**
 * 비밀번호 형식이 올바른지 확인하는 함수
 * - 8자리 이상
 * - 영문, 숫자, 특수문자(!@#$%^&*?) 포함
 * - 허용된 문자만 사용
 * @param password 비밀번호
 * @returns 올바른 형식이면 true, 아니면 false
 */
export const isPasswordValid = (password: string): boolean => {
  if (!password) return false;
  // 허용된 특수문자만 포함
  const allowedSymbolsForPassword = /^[a-zA-Z0-9!@#$%^&*?]*$/;
  // 8자리 이상, 숫자 1개 이상, 특수문자 1개 이상, 대문자 제한 없음
  const strongPassword =
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*?]/.test(password) &&
    allowedSymbolsForPassword.test(password);
  return strongPassword;
};

/**
 * 랜덤 색상 코드를 반환하는 함수
 * @param seed 랜덤 시드를 지정할 수 있는 선택적 매개변수
 * @returns 랜덤 색상 코드
 */
export const getRandomColor = (seed?: string | number): string => {
  // 사용할 색상 배열
  const COLORS = [
    "#A7C7FF",
    "#FFF6A3",
    "#FFB6E1",
    "#FFB6B6",
    "#FFD59E",
    "#D6FFB7",
    "#B6FFE4",
    "#B6D9FF",
    "#D9B6FF",
  ];

  // 랜덤 색상 반환
  if (seed) {
    if (typeof seed === "string") {
      const index = seed.length % COLORS.length;
      return COLORS[index];
    } else if (typeof seed === "number") {
      return COLORS[seed % COLORS.length];
    }
  }

  const randInt = Math.floor(Math.random() * COLORS.length);
  return COLORS[randInt];
};

export const MAX_MESSAGE_LENGTH = 100; // 채팅 메시지 길이 제한

/**
 * 채팅 메시지가 유효한지 확인하는 함수
 * @param message 채팅 메시지
 * @returns 메시지가 유효한지 여부
 */
export const isChatMessageValid = (message: string) => {
  // 메시지가 비어있거나 길이가 초과하는 경우
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return false;
  }

  // 메시지 형식이 올바른 경우
  return true;
};
