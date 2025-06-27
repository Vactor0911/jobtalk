import { useAtom, useSetAtom } from "jotai";
import { type ReactNode, useEffect, useState } from "react";
import { wannaTripLoginStateAtom, isAuthInitializedAtom } from "../state";
import axiosInstance, {
  getCsrfToken,
  setupAxiosInterceptors,
} from "../utils/axiosInstance";
import { useNavigate } from "react-router";
import { setAccessToken } from "../utils/accessToken";
import { resetStates } from "../utils";

interface TokenRefresherProps {
  children: ReactNode;
}

const TokenRefresher = ({ children }: TokenRefresherProps) => {
  const [isInitialized, setIsInitialized] = useState(false); // 로그인 정보 복구 완료 여부
  const [, setIsAuthInitialized] = useAtom(isAuthInitializedAtom); // 전역 초기화 상태 연결
  const navigate = useNavigate();

  const [loginState, setLoginState] = useAtom(wannaTripLoginStateAtom);
  const setWannaTripLoginState = useSetAtom(wannaTripLoginStateAtom); // 상태 업데이트

  useEffect(() => {
    // 1. sessionStorage or localStorage에서 로그인 정보 복구
    const storedLoginState =
      localStorage.getItem("WannaTriploginState") ||
      sessionStorage.getItem("WannaTriploginState");

    if (storedLoginState) {
      const parsedLoginState = JSON.parse(storedLoginState);

      // 로그인 정보 복구
      if (!loginState.isLoggedIn) {
        setLoginState(parsedLoginState);
      }
    } else {
      setIsInitialized(true); // 초기화 완료 상태로 변경
      setIsAuthInitialized(true); // 전역 초기화 완료 상태로 변경
      return;
    }

    // 2. 로그인 상태가 확인될 때까지 기다림
    if (!loginState.isLoggedIn) {
      setIsInitialized(true); // 초기화 완료 상태로 변경
      setIsAuthInitialized(true); // 전역 초기화 완료 상태로 변경
      return;
    }

    const refreshAccessToken = async () => {
      try {
        // CSRF 토큰 가져오기
        const csrfToken = await getCsrfToken();
        const response = await axiosInstance.post(
          `/auth/token/refresh`,
          {},
          {
            headers: {
              "X-CSRF-Token": csrfToken, // CSRF 토큰 헤더 추가
            },
          }
        );

        if (response.data.success) {
          setAccessToken(response.data.accessToken);

          const { email, name, userUuid } = response.data;

          const updatedLoginState = {
            isLoggedIn: true,
            userUuid,
            email,
            userName: name,
          };

          // 기존 상태와 다를 때만 업데이트
          if (
            JSON.stringify(loginState) !== JSON.stringify(updatedLoginState)
          ) {
            setLoginState(updatedLoginState);
          }

          // localStorage 또는 sessionStorage에 로그인 상태 저장
          if (localStorage.getItem("WannaTriploginState")) {
            localStorage.setItem(
              "WannaTriploginState",
              JSON.stringify(updatedLoginState)
            );
          } else {
            sessionStorage.setItem(
              "WannaTriploginState",
              JSON.stringify(updatedLoginState)
            );
          }
        }
      } catch (error) {
        console.error("자동 로그인 유지 실패, 로그아웃 처리:", error);

        await resetStates(setWannaTripLoginState); // 상태 초기화
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        navigate("/login"); // 로그인 페이지로 이동
      } finally {
        setIsInitialized(true); // 초기화 완료 상태로 변경
        setIsAuthInitialized(true); // 전역 초기화 완료 상태로 변경
      }
    };

    // 3. 로그인된 경우에만 토큰 갱신 실행
    if (loginState.isLoggedIn) {
      refreshAccessToken();
    }

    // Axios Interceptor 설정 (자동 토큰 갱신)
    setupAxiosInterceptors();
  }, [setLoginState, navigate, loginState, setWannaTripLoginState, setIsAuthInitialized]);

  //  로그인 정보가 복구될 때까지 UI 렌더링 방지
  if (!isInitialized) {
    return null; // UI 깜빡임 방지 (초기 상태가 적용될 때까지 렌더링 지연)
  }

  return <>{children}</>;
};

export default TokenRefresher;
