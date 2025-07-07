import { useState, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import OutlinedTextField from "../components/OutlinedTextField";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import axios from "axios";
import { useLocation, useNavigate } from "react-router";
import { useSnackbar } from "notistack";

const ChangePassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // 성공 Dialog 상태 추가
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordCheckVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이메일 정보 가져오기 (location.state에서)
  useEffect(() => {
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      // 이메일 정보가 없으면 비밀번호 찾기 페이지로 리다이렉트
      enqueueSnackbar("잘못된 접근입니다. 비밀번호 찾기를 다시 진행해주세요.", {
        variant: "error",
      });
      navigate("/find-password");
    }
  }, [enqueueSnackbar, location.state, navigate]);

  // 비밀번호 입력
  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    []
  );

  // 비밀번호 재입력 입력
  const handlePasswordConfirmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordConfirm(e.target.value);
    },
    []
  );

  // 비밀번호 보임/숨김
  const handlePasswordVisibilityChange = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  // 비밀번호 확인 보임/숨김
  const handlePasswordConfirmVisibilityChange = useCallback(() => {
    setIsPasswordCheckVisible(!isPasswordConfirmVisible);
  }, [isPasswordConfirmVisible]);

  // 비밀번호 변경 버튼 클릭
  const handleChangePasswordButtonClick = useCallback(async () => {
    // 입력값 검증
    if (!password || !passwordConfirm) {
      enqueueSnackbar("모든 비밀번호 필드를 입력해주세요.", {
        variant: "warning",
      });
    }

    // 비밀번호와 비밀번호 확인이 일치하지 않는 경우
    if (password !== passwordConfirm) {
      enqueueSnackbar("비밀번호가 일치하지 않습니다.", {
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 비밀번호 재설정 요청
      await axiosInstance.post(
        "/auth/resetPassword",
        {
          email,
          password,
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      // 성공 Dialog 표시
      setSuccessDialog({
        open: true,
        message: "비밀번호가 성공적으로 변경되었습니다!",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        enqueueSnackbar(
          `비밀번호 변경 실패: ${
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
      setIsSubmitting(false);
    }
  }, [email, enqueueSnackbar, password, passwordConfirm]);

  // 성공 Dialog 닫기 핸들러
  const handleSuccessDialogClose = useCallback(() => {
    setSuccessDialog((prev) => ({ ...prev, open: false }));
    navigate("/login"); // Dialog 닫을 때 로그인 페이지로 이동
  }, [navigate]);

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

          <Stack gap={3}>
            {/* 비밀번호 변경 헤더 */}
            <SectionHeader title="비밀번호 변경" />

            <Stack gap={2}>
              {/* 이메일 입력란 (읽기 전용) */}
              <Stack gap={1}>
                <Stack direction="row" gap={1}>
                  <Box flex={1}>
                    <OutlinedTextField
                      label="이메일"
                      value={email}
                      readOnly
                      disabled
                    />
                  </Box>
                </Stack>
              </Stack>

              {/* 비밀번호 입력란 */}
              <OutlinedTextField
                label="새 비밀번호"
                value={password}
                onChange={handlePasswordChange}
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

              {/* 비밀번호 재확인 입력란 */}
              <OutlinedTextField
                label="새 비밀번호 재확인"
                value={passwordConfirm}
                onChange={handlePasswordConfirmChange}
                type={isPasswordConfirmVisible ? "text" : "password"}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handlePasswordConfirmVisibilityChange}
                      edge="end"
                    >
                      {isPasswordConfirmVisible ? (
                        <VisibilityIcon />
                      ) : (
                        <VisibilityOffIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />

              {/* 비밀번호 변경 버튼 */}
              <Button
                variant="contained"
                onClick={handleChangePasswordButtonClick}
                disabled={isSubmitting || !password || !passwordConfirm}
                loading={isSubmitting}
                sx={{
                  mt: 2,
                  py: 1.5,
                }}
              >
                <Typography variant="h6" color="white">
                  {isSubmitting ? "변경 중..." : "비밀번호 변경"}
                </Typography>
              </Button>

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
      </Stack>

      {/* 성공 Dialog */}
      <Dialog
        open={successDialog.open}
        onClose={handleSuccessDialogClose}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
      >
        <DialogTitle id="success-dialog-title">비밀번호 변경 완료</DialogTitle>
        <DialogContent>
          <DialogContentText id="success-dialog-description">
            {successDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: 2 }}>
          <Button
            onClick={handleSuccessDialogClose}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ minWidth: "200px", py: 1 }}
          >
            로그인 페이지로 이동
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChangePassword;
