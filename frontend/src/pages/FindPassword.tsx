import { useState, useCallback, useEffect, useRef } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import OutlinedTextField from "../components/OutlinedTextField";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import axios from "axios";
import { useNavigate } from "react-router";
import { useSnackbar } from "notistack";

const FindPassword = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState("");
  const [isConfirmCodeSending, setIsConfirmCodeSending] = useState(false);
  const [isConfirmCodeSent, setIsConfirmCodeSent] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmTimeLeft, setConfirmTimeLeft] = useState(300);
  const [isConfirmCodeLoading, setIsConfirmCodeLoading] = useState(false);
  const [isConfirmCodeChecked, setIsConfirmCodeChecked] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const confirmCodeInputRef = useRef<HTMLInputElement>(null);

  // 인증번호 입력 타이머
  useEffect(() => {
    if (!isConfirmCodeSent || confirmTimeLeft <= 0 || isConfirmCodeChecked) {
      return;
    }

    const confirmCodeTimer = setInterval(() => {
      setConfirmTimeLeft((prevTime) => {
        if (prevTime <= 1 && !isConfirmCodeChecked) {
          enqueueSnackbar(
            "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
            {
              variant: "error",
            }
          );
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(confirmCodeTimer);
  }, [
    isConfirmCodeChecked,
    confirmTimeLeft,
    isConfirmCodeSent,
    enqueueSnackbar,
  ]);

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
      enqueueSnackbar("이미 인증번호를 확인했습니다.", {
        variant: "info",
      });
      return;
    }

    try {
      setIsConfirmCodeSending(true);

      const csrfToken = await getCsrfToken();
      const response = await axiosInstance.post(
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

      // 인증번호 전송 성공
      if (response.data.success) {
        setIsConfirmCodeSent(true);
        setConfirmTimeLeft(300);
        enqueueSnackbar("인증번호가 이메일로 발송되었습니다.", {
          variant: "success",
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        enqueueSnackbar(
          `이메일 전송 실패: ${
            error.response.data?.message || "알 수 없는 오류"
          }`,
          {
            variant: "error",
          }
        );
      } else {
        enqueueSnackbar(
          "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.",
          {
            variant: "error",
          }
        );
      }
    } finally {
      setIsConfirmCodeSending(false);
    }
  }, [email, enqueueSnackbar, isConfirmCodeChecked]);

  // 이메일 입력란 키 다운
  const handleEmailInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirmCodeSendButtonClick();
      }
    },
    [handleConfirmCodeSendButtonClick]
  );

  // 인증 번호 입력란 최초 노출시 포커스
  useEffect(() => {
    if (isConfirmCodeSent && confirmCodeInputRef.current) {
      confirmCodeInputRef.current.focus();
    }
  }, [isConfirmCodeSent]);

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
    // 인증번호가 이미 확인된 경우
    if (isConfirmCodeChecked) {
      enqueueSnackbar("이미 인증번호를 확인했습니다.", {
        variant: "warning",
      });
      return;
    }

    // 인증 번호를 이미 확인하고 있는 경우
    if (isConfirmCodeLoading) {
      enqueueSnackbar("인증번호 확인 중입니다. 잠시 기다려주세요.", {
        variant: "warning",
      });
      return;
    }

    // 인증 시간이 만료된 경우
    if (confirmTimeLeft <= 0) {
      enqueueSnackbar(
        "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
        {
          variant: "warning",
        }
      );
      return;
    }

    // 인증 번호가 유효하지 않은 경우
    if (!confirmCode || confirmCode.length !== 6) {
      enqueueSnackbar("유효한 인증번호를 입력해주세요 (6자리)", {
        variant: "warning",
      });
      return;
    }

    // 인증 번호 확인 요청
    try {
      // 인증 번호 확인 중 로딩 상태 설정
      setIsConfirmCodeLoading(true);

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

      // 인증 성공 시 비밀번호 재설정 페이지로 이동
      if (response.data.success && response.data.purpose === "resetPassword") {
        // 인증 번호 확인 성공
        enqueueSnackbar("인증번호 확인이 완료되었습니다.", {
          variant: "success",
        });
        setIsConfirmCodeChecked(true);

        navigate("/change-password", { replace: true, state: { email } });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        enqueueSnackbar(
          `인증 실패: ${error.response.data?.message || "알 수 없는 오류"}`,
          {
            variant: "error",
          }
        );
      } else {
        enqueueSnackbar(
          "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.",
          {
            variant: "error",
          }
        );
      }
    } finally {
      // 인증 번호 확인 후 로딩 상태 해제
      setIsConfirmCodeLoading(false);
    }
  }, [
    isConfirmCodeChecked,
    isConfirmCodeLoading,
    confirmTimeLeft,
    confirmCode,
    enqueueSnackbar,
    email,
    navigate,
  ]);

  // 인증 번호 입력란 키 다운
  const handleConfirmCodeInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirmCodeCheckButtonClick();
      }
    },
    [handleConfirmCodeCheckButtonClick]
  );

  // 페이지 마운트 시 이메일 입력란 포커스
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  return (
    <Container maxWidth="xs">
      <Stack
        minHeight="calc(100vh - 64px)"
        justifyContent="center"
        paddingY={4}
        paddingBottom={10}
      >
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
                    inputRef={emailInputRef}
                    label="이메일"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailInputKeyDown}
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
                    inputRef={confirmCodeInputRef}
                    label="인증번호"
                    value={confirmCode}
                    onChange={handleConfirmCodeChange}
                    onKeyDown={handleConfirmCodeInputKeyDown}
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
                  loading={isConfirmCodeLoading}
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
    </Container>
  );
};

export default FindPassword;
