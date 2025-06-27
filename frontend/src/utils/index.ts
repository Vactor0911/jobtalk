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
  sessionStorage.removeItem("WannaTriploginState"); // 세션 스토리지 제거
  localStorage.removeItem("WannaTriploginState"); // 로컬 스토리지 제거
};