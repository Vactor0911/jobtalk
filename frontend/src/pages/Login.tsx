import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";
import OutlinedTextField from "../components/OutlinedTextField";
import { useCallback, useLayoutEffect, useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { jobTalkLoginStateAtom } from "../state";
import { useAtomValue, useSetAtom } from "jotai";
import { useNavigate } from "react-router";
import { setAccessToken } from "../utils/accessToken";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";

// 로그인 상태 타입 정의 (기존 코드 참조)
interface LoginState {
  isLoggedIn: boolean;
  userUuid: string;
  email: string;
  userName: string;
}

const Login = () => {
  const navigate = useNavigate();
  const setLoginState = useSetAtom(jobTalkLoginStateAtom);

  const loginState = useAtomValue(jobTalkLoginStateAtom);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoginStateSave, setIsLoginStateSave] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // 스낵바 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  // 스낵바 닫기
  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // 이메일 입력
  const handleEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(event.target.value);
    },
    []
  );

  // 비밀번호 입력
  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(event.target.value);
    },
    []
  );

  // 비밀번호 표시/숨김 토글
  const handlePasswordVisibilityChange = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  // 로그인 상태 유지/해제
  const handleLoginStateSaveChange = useCallback(() => {
    setIsLoginStateSave((prev) => !prev);
  }, []);

  // 로그인 성공 처리
  const processLoginSuccess = useCallback(
    (responseData: {
      accessToken: string;
      name: string;
      userUuid: string;
      userId: number;
    }) => {
      const { accessToken, name, userUuid } = responseData;

      // 액세스 토큰 저장
      setAccessToken(accessToken);

      // 로그인 상태 객체 생성
      const newLoginState: LoginState = {
        isLoggedIn: true,
        userUuid: userUuid,
        email: email,
        userName: name,
      };

      // 상태 저장
      setLoginState(newLoginState);

      // 로그인 유지 설정에 따라 스토리지에 저장
      if (isLoginStateSave) {
        localStorage.setItem(
          "JobTalkloginState",
          JSON.stringify(newLoginState)
        );
      } else {
        sessionStorage.setItem(
          "JobTalkloginState",
          JSON.stringify(newLoginState)
        );
      }

      // 로그인 성공 알림
      setSnackbar({
        open: true,
        message: "로그인에 성공했습니다!",
        severity: "success",
      });

      // 잠시 후 메인 페이지로 이동
      setTimeout(() => {
        navigate("/"); // 메인 페이지 또는 대시보드로 이동
      }, 1000);
    },
    [email, isLoginStateSave, navigate, setLoginState]
  );

  // 로그인 버튼 클릭
  const handleLoginButtonClick = useCallback(async () => {
    // 입력 검증
    if (!email || !password) {
      setSnackbar({
        open: true,
        message: "이메일과 비밀번호를 모두 입력해주세요.",
        severity: "warning",
      });
      return;
    }

    // if (!isEmailValid(email)) {
    //   setSnackbar({
    //     open: true,
    //     message: "올바른 이메일 형식이 아닙니다.",
    //     severity: "warning",
    //   });
    //   return;
    // }

    setIsLoginLoading(true);

    try {
      // CSRF 토큰 획득
      const csrfToken = await getCsrfToken();

      // 로그인 요청
      const response = await axiosInstance.post(
        "/auth/login",
        { email, password },
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      if (response.data.success) {
        // 로그인 성공 처리
        processLoginSuccess(response.data);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "로그인에 실패했습니다.",
          severity: "error",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("로그인 실패:", error);

      // 오류 메시지 처리
      let errorMessage = "로그인에 실패했습니다. 다시 시도해주세요.";

      if (error.response) {
        const serverMessage = error.response.data?.message;
        errorMessage = serverMessage || errorMessage;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setIsLoginLoading(false);
    }
  }, [email, password, processLoginSuccess]);

  // 엔터 입력시 로그인 처리
  const handleKeyEnterDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleLoginButtonClick();
      }
    },
    [handleLoginButtonClick]
  );

  // 로그인된 상태라면 이전 페이지로 이동
  useLayoutEffect(() => {
    if (loginState.isLoggedIn) {
      if (window.history.length > 1) {
        navigate(-1); // 이전 페이지로 이동
      } else {
        navigate("/", { replace: true }); // 이전 페이지가 없으면 홈으로 이동
      }
    }
  }, [loginState.isLoggedIn, navigate]);

  if (loginState.isLoggedIn) {
    return null; // 컴포넌트 렌더링 중지
  }

  return (
    <Container maxWidth="xs">
      <Stack
        minHeight="calc(100vh - 64px)"
        justifyContent="center"
        paddingY={4}
      >
        <Stack gap={6}>
          {/* 로고 링크 버튼 */}
          <PlainLink to="/">
            <Typography variant="h3" color="primary" textAlign="center">
              JobTalk
            </Typography>
          </PlainLink>

          <Stack gap={1}>
            {/* 로그인 헤더 */}
            <SectionHeader title="로그인" />

            {/* 아이디 입력란 */}
            <Box mt={1}>
              <OutlinedTextField
                label="아이디(이메일)"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyEnterDown}
              />
            </Box>

            {/* 비밀번호 입력란 */}
            <OutlinedTextField
              label="비밀번호"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyEnterDown}
              type={isPasswordVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handlePasswordVisibilityChange}
                    edge="end"
                  >
                    {isPasswordVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            {/* 로그인 상태 유지 체크박스 */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    name="로그인 상태 유지"
                    checked={isLoginStateSave}
                    onChange={handleLoginStateSaveChange}
                  />
                }
                label="로그인 상태 유지"
              />
            </Box>

            {/* 로그인 버튼 */}
            <Button
              variant="contained"
              onClick={handleLoginButtonClick}
              loading={isLoginLoading}
            >
              <Typography variant="h5" color="white">
                로그인
              </Typography>
            </Button>
            <Stack direction="row">
              <Stack direction="row" gap={1} alignItems="center">
                <PlainLink to="/find-password">
                  <Typography color="text.secondary">비밀번호 찾기</Typography>
                </PlainLink>
              </Stack>

              <Box flex={1} display="flex" justifyContent="flex-end">
                <PlainLink to="/register">
                  <Typography color="text.secondary">회원가입</Typography>
                </PlainLink>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {/* 알림 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;
