import { atom } from "jotai";

export interface LoginState {
  isLoggedIn: boolean;
  userUuid: string | null; // 로그인된 사용자의 UUID
  email?: string | null; // 로그인된 사용자의 이메일
  userName?: string;
}

// LocalStorage에서 상태를 불러오기
const savedLoginState = JSON.parse(
  localStorage.getItem("JobTalkloginState") || "{}"
);

export const jobTalkLoginStateAtom = atom({
  isLoggedIn: savedLoginState.isLoggedIn || false, // 로그인 상태
  userUuid: savedLoginState.userUuid || "", // 로그인된 사용자의 UUID
  userName: savedLoginState.userName || "", // 로그인된 사용자의 별명
} as LoginState);

// 인증 초기화 완료 상태를 추적하는 atom
export const isAuthInitializedAtom = atom(false); // 초기화 완료 상태

// 사용자 프로필 이미지 상태
export const profileImageAtom = atom<string | null>(null);

// 워크스페이스 상태
interface Workspace {
  id: number;
  uuid: string;
  name: string;
  status: string;
  chatTopic: string | null;
  interestCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export const selectedWorkspaceAtom = atom<Workspace | null>(null); // 선택된 워크스페이스
export const workspaceStepAtom = atom<number>(1); // 현재 워크스페이스 단계
export const selectedInterestAtom = atom<string | null>(null); // 선택된 관심사 카테고리

// 로드맵 뷰어 상태
export const roadmapTabAtom = atom(1);
