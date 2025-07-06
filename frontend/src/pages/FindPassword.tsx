import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import OutlinedTextField from "../components/OutlinedTextField";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import axios from "axios";
import { useNavigate } from "react-router";

const FindPassword = () => {
  const navigate = useNavigate();

  // Snackbar 상태 추가
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const [email, setEmail] = useState("");
  const [isConfirmCodeSending, setIsConfirmCodeSending] = useState(false);
  const [isConfirmCodeSent, setIsConfirmCodeSent] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmTimeLeft, setConfirmTimeLeft] = useState(300);
  const [isConfirmCodeChecked, setIsConfirmCodeChecked] = useState(false);

  // 인증번호 입력 타이머
  useEffect(() => {
    if (!isConfirmCodeSent || confirmTimeLeft <= 0 || isConfirmCodeChecked) {
      return;
    }

    const confirmCodeTimer = setInterval(() => {
      setConfirmTimeLeft((prevTime) => {
        if (prevTime <= 1 && !isConfirmCodeChecked) {
          setSnackbar({
            open: true,
            message:
              "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
            severity: "error",
          });
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(confirmCodeTimer);
  }, [isConfirmCodeChecked, confirmTimeLeft, isConfirmCodeSent]);

  // 이메일 입력
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    []
  );

  // 인증번호 전송 버튼 클릭
  const handleConfirmCodeSendButtonClick = useCallback(async () => {
    if (isConfirmCodeChecked) {
      setSnackbar({
        open: true,
        message: "이미 인증번호를 확인했습니다.",
        severity: "info",
      });
      return;
    }

    try {
      setIsConfirmCodeSending(true);

      const csrfToken = await getCsrfToken();
      await axiosInstance.post(
        "/auth/sendVerifyEmail",
        {
          email,
          purpose: "resetPassword",
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      setIsConfirmCodeSent(true);
      setConfirmTimeLeft(300);
      setSnackbar({
        open: true,
        message: "인증번호가 이메일로 발송되었습니다.",
        severity: "success",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setSnackbar({
          open: true,
          message: `이메일 전송 실패: ${
            error.response.data?.message || "알 수 없는 오류"
          }`,
          severity: "error",
        });
      } else {
        console.error("요청 오류:", (error as Error).message);
        setSnackbar({
          open: true,
          message: "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.",
          severity: "error",
        });
      }
    } finally {
      setIsConfirmCodeSending(false);
    }
  }, [email, isConfirmCodeChecked]);

  // 인증번호 입력
  const handleConfirmCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmCode(e.target.value.replace(" ", ""));
    },
    []
  );

  // 타이머 시간 포맷팅
  const getFormattedTime = useCallback(() => {
    if (confirmTimeLeft <= 0) {
      return "시간초과";
    }

    if (isConfirmCodeChecked) {
      return "인증완료";
    }

    const minutes = Math.floor(confirmTimeLeft / 60);
    const seconds = confirmTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [confirmTimeLeft, isConfirmCodeChecked]);

  // 인증번호 확인 버튼 클릭
  const handleConfirmCodeCheckButtonClick = useCallback(async () => {
    if (isConfirmCodeChecked) {
      setSnackbar({
        open: true,
        message: "이미 인증번호를 확인했습니다.",
        severity: "warning",
      });
      return;
    }

    if (confirmTimeLeft <= 0) {
      setSnackbar({
        open: true,
        message: "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
        severity: "warning",
      });
      return;
    }

    if (!confirmCode || confirmCode.length !== 6) {
      setSnackbar({
        open: true,
        message: "유효한 인증번호를 입력해주세요 (6자리)",
        severity: "warning",
      });
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      const response = await axiosInstance.post(
        "/auth/verifyEmailCode",
        {
          email,
          code: confirmCode,
          purpose: "resetPassword",
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "인증번호 확인이 완료되었습니다.",
        severity: "success",
      });
      setIsConfirmCodeChecked(true);

      // 인증 성공 시 비밀번호 재설정 페이지로 이동
      if (response.data.success && response.data.purpose === "resetPassword") {
        // 잠시 후 페이지 이동 (사용자가 성공 메시지를 볼 수 있도록)
        setTimeout(() => {
          navigate("/change-password", { state: { email } });
        }, 1000);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setSnackbar({
          open: true,
          message: `인증 실패: ${
            error.response.data?.message || "알 수 없는 오류"
          }`,
          severity: "error",
        });
      } else {
        console.error("요청 오류:", (error as Error).message);
        setSnackbar({
          open: true,
          message:
            "예기치 않은 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
          severity: "error",
        });
      }
    }
  }, [confirmCode, email, isConfirmCodeChecked, navigate, confirmTimeLeft]);

  // Snackbar 닫기 핸들러
  const handleSnackbarClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setSnackbar((prev) => ({ ...prev, open: false }));
    },
    []
  );

  return (
    <Container maxWidth="xs">
      <Stack minHeight="100vh" justifyContent="center" pb={45.2}>
        <Stack gap={6}>
          {/* 로고 링크 버튼*/}
          <PlainLink to="/">
            <Typography variant="h3" color="primary" textAlign="center">
              JobTalk
            </Typography>
          </PlainLink>

          <Stack gap={1}>
            {/* 비밀번호 찾기 헤더 */}
            <SectionHeader title="비밀번호 찾기" />

            {/* 이메일 입력란 */}
            <Stack gap={1}>
              {/* 이메일 입력란 */}
              <Stack direction="row" gap={1} mt={1}>
                <Box flex={1}>
                  <OutlinedTextField
                    label="이메일"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </Box>

                {/* 인증 요청 버튼 */}
                <Button
                  variant="outlined"
                  loading={isConfirmCodeSending}
                  onClick={handleConfirmCodeSendButtonClick}
                  disabled={isConfirmCodeChecked}
                  sx={{
                    borderRadius: "8px",
                    bgcolor: isConfirmCodeChecked
                      ? "rgba(76, 175, 80, 0.1)"
                      : "inherit",
                  }}
                >
                  <Typography>
                    {isConfirmCodeChecked ? "인증완료" : "인증요청"}
                  </Typography>
                </Button>
              </Stack>

              {/* 인증번호 입력란 */}
              <Stack
                direction="row"
                gap={1}
                display={isConfirmCodeSent ? "flex" : "none"}
              >
                <Box flex={2}>
                  <OutlinedTextField
                    label="인증번호"
                    value={confirmCode}
                    onChange={handleConfirmCodeChange}
                    disabled={isConfirmCodeChecked || confirmTimeLeft <= 0}
                    error={confirmTimeLeft <= 0}
                  />
                </Box>

                {/* 남은 인증 시간 */}
                <Typography
                  variant="subtitle1"
                  alignSelf="center"
                  sx={{
                    width: "65px",
                    color: isConfirmCodeChecked
                      ? "#19df79" // 인증 완료 시 초록색
                      : confirmTimeLeft <= 0
                      ? "error.main" // 시간 초과 시 빨간색
                      : "primary.main", // 평상시 파란색
                  }}
                >
                  {getFormattedTime()}
                </Typography>

                {/* 인증 확인 버튼 */}
                <Button
                  variant="outlined"
                  onClick={handleConfirmCodeCheckButtonClick}
                  disabled={
                    isConfirmCodeChecked || confirmTimeLeft <= 0 || !confirmCode
                  }
                  sx={{
                    ml: 2,
                    borderRadius: "8px",
                    bgcolor: isConfirmCodeChecked
                      ? "rgba(76, 175, 80, 0.1)"
                      : "inherit",
                  }}
                >
                  <Typography>
                    {isConfirmCodeChecked ? "인증됨" : "인증확인"}
                  </Typography>
                </Button>
              </Stack>
            </Stack>

            {/* 로그인 페이지 링크 추가 */}
            <Stack gap={0.5}>
              {/* 로그인 페이지 링크 */}
              <Box alignSelf="flex-end">
                <PlainLink to="/login">
                  <Typography variant="subtitle1" color="text.secondary">
                    로그인으로 돌아가기
                  </Typography>
                </PlainLink>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>

      {/* Snackbar 컴포넌트 추가 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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

export default FindPassword;
