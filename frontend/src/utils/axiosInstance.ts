import axios from "axios";
import { getAccessToken } from "./accessToken"; // Access Token 관리 함수 import

export const SERVER_HOST = import.meta.env.VITE_SERVER_HOST;

const axiosInstance = axios.create({
  baseURL: SERVER_HOST,
  withCredentials: true, // Refresh Token만 쿠키로 포함
});

// CSRF 토큰 캐시
let csrfTokenCache: string | null = null;

export const getCsrfToken = async () => {
  if (csrfTokenCache) return csrfTokenCache;
  const response = await axiosInstance.get("/csrf/csrfToken");
  csrfTokenCache = response.data.csrfToken;
  return csrfTokenCache;
};

// 인터셉터 초기화 상태를 저장
let isInterceptorInitialized = false;

// 액세스 토큰이 만료되면 자동으로 갱신하는 인터셉터
export const setupAxiosInterceptors = () => {
  if (isInterceptorInitialized) return;
  isInterceptorInitialized = true;

  axiosInstance.interceptors.request.use(
    async (config) => {
      // 액세스 토큰 부착(기존 로직)
      const token = getAccessToken?.();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      // 상태 변경 메서드에만 CSRF 헤더 자동 첨부
      const method = (config.method || "get").toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        config.headers = config.headers ?? {};
        if (!config.headers["X-CSRF-Token"]) {
          const csrf = await getCsrfToken();
          config.headers["X-CSRF-Token"] = csrf;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // 필요 시 403 / CSRF 실패 시 캐시 초기화 등 처리
      if (error.response?.status === 403) {
        csrfTokenCache = null;
      }
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
