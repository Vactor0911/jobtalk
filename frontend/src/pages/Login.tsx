import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";
import OutlinedTextField from "../components/OutlinedTextField";
import { useCallback, useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoginStateSave, setIsLoginStateSave] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

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

  // 로그인 버튼 클릭
  const handleLoginButtonClick = useCallback(() => {
    console.log("로그인 버튼 클릭");
  }, []);

  // 엔터 입력시 로그인 처리
  const handleKeyEnterDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        handleLoginButtonClick();
      }
    },
    [handleLoginButtonClick]
  );

  return (
    <Container maxWidth="xs">
      <Stack minHeight="calc(100vh - 64px)" justifyContent="center" paddingY={4}>
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
                {/*
                <PlainLink to="/">
                  <Typography color="divider">아이디 찾기</Typography>
                </PlainLink>

                <Box
                  width="1px"
                  height="60%"
                  borderRadius="50px"
                  sx={{
                    background: theme.palette.divider,
                  }}
                /> 
                */}

                <PlainLink to="/find-password">
                  <Typography color="text.primary">비밀번호 찾기</Typography>
                </PlainLink>
              </Stack>

              <Box flex={1} display="flex" justifyContent="flex-end">
                <PlainLink to="/register">
                  <Typography color="text.primary">회원가입</Typography>
                </PlainLink>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Login;
