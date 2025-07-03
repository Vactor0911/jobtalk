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