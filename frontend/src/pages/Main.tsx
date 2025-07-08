import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { jobTalkLoginStateAtom } from "../state";
import { useNavigate } from "react-router";

const Main = () => {
  const navigate = useNavigate();

  const loginState = useAtomValue(jobTalkLoginStateAtom);

  // 로그인 상태이면 워크스페이스로 이동
  useEffect(() => {
    if (loginState.isLoggedIn) {
      navigate("/workspace");
    }
  }, [loginState.isLoggedIn, navigate]);

  // 로그인 상태이면 렌더 중지
  if (loginState.isLoggedIn) {
    return null;
  }

  // 메인 페이지 렌더링
  return <>{/* 메인 페이지 구현 */}</>;
};

export default Main;
