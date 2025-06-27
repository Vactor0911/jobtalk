// utils/accessToken.ts
let accessToken: string | null = null; // Private variable로 Access Token 관리

export const setAccessToken = (token: string): void => {
  accessToken = token; // Access Token 설정
};

export const getAccessToken = (): string | null => {
  return accessToken; // Access Token 반환
};
