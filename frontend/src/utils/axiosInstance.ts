import axios from "axios";
import { getAccessToken, setAccessToken } from "./accessToken"; // Access Token 관리 함수 import

export const SERVER_HOST = import.meta.env.VITE_SERVER_HOST;


const axiosInstance = axios.create({
  baseURL: SERVER_HOST,
  withCredentials: true, // Refresh Token만 쿠키로 포함
});

/**
 * CSRF 토큰 가져오기 함수
 * @returns CSRF 토큰
 */
export const getCsrfToken = async () => {
  try {
    const response = await axiosInstance.get("/csrf/csrfToken");
    return response.data.csrfToken;
  } catch (error) {
    console.error("CSRF 토큰을 가져오는 중 오류 발생:", error);
    throw new Error("CSRF 토큰을 가져오는 데 실패했습니다.");
  }
};

let isInterceptorInitialized = false; // 인터셉터 초기화 상태를 저장

// 액세스 토큰이 만료되면 자동으로 갱신하는 인터셉터
export const setupAxiosInterceptors = () => {
  if (isInterceptorInitialized) return; // 이미 초기화된 경우 실행하지 않음
  isInterceptorInitialized = true; // 인터셉터 초기화

  // 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAccessToken(); // Private variable에서 Access Token 가져오기
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  //응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => response, // 요청 성공 시
    async (error) => {
      const originalRequest = error.config;

      // Rate Limit 오류 처리 (429 상태 코드)
      if (error.response?.status === 429) {
        // 서버에서 전달한 오류 메시지 표시
        const errorMessage =
          error.response.data.message ||
          "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
        alert(errorMessage);
        return Promise.reject(error);
      }

      // AccessToken 만료 시 - Access Token 만료: 401 Unauthorized (권한 없음)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // 중복 요청 방지 플래그

        try {
          // CSRF 토큰 가져오기
          const csrfToken = await getCsrfToken();

          // RefreshToken으로 AccessToken 재발급 요청
          const { data } = await axios.post(
            `${SERVER_HOST}/auth/token/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                "X-CSRF-Token": csrfToken, // CSRF 토큰 헤더 추가
              },
            }
          );
          const newAccessToken = data.accessToken; // 새로 받은 Access Token
          setAccessToken(newAccessToken); // Private variable에 저장
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // 재발급된 AccessToken으로 원래 요청 재시도
          return axiosInstance(originalRequest); // 재시도
        } catch (refreshError) {
          // RefreshToken 만료 시 로그아웃 처리 Refresh Token 만료: 403 Forbidden (재로그인이 필요)
          // 오류를 그대로 전달하여 호출자(TokenRefresher)에서 처리하도록 함
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error); // 다른 오류 처리
    }
  );
};

export default axiosInstance;
