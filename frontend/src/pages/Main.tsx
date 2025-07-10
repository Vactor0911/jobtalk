import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { jobTalkLoginStateAtom } from "../state";
import { useNavigate } from "react-router";
import {
  createTheme,
  responsiveFontSizes,
  Stack,
  ThemeProvider,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import Section1 from "../components/main-page/Section1";
import Section2 from "../components/main-page/Section2";

const Main = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const loginState = useAtomValue(jobTalkLoginStateAtom);

  // 큰 폰트 테마 생성
  const bigFontTheme = responsiveFontSizes(
    createTheme({
      ...theme,
      typography: {
        ...theme.typography,
        h1: {
          fontSize: "5rem",
          fontWeight: "bold",
        },
        h2: {
          fontSize: "4rem",
          fontWeight: "bold",
        },
        h3: {
          fontSize: "3rem",
          fontWeight: "bold",
        },
        h4: {
          fontSize: "2rem",
          fontWeight: "bold",
        },
        h5: {
          fontSize: "1.5rem",
          fontWeight: "bold",
        },
        h6: {
          fontSize: "1.25rem",
          fontWeight: "bold",
        },
      },
    })
  );

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
  return (
    <ThemeProvider theme={bigFontTheme}>
      <Stack
        gap="20vh"
        bgcolor={grey[100]}
        sx={{
          "& .MuiTypography-root": {
            textWrap: "balance",
          },
        }}
      >
        {/* 1페이지 */}
        <Section1 />

        {/* 2페이지 */}
        <Section2 />
      </Stack>
    </ThemeProvider>
  );
};

export default Main;
