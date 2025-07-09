import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { jobTalkLoginStateAtom } from "../state";
import { useNavigate } from "react-router";
import {
  Box,
  Container,
  createTheme,
  Paper,
  responsiveFontSizes,
  Stack,
  ThemeProvider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MotionContainer from "../components/framer-motion/MotionContainer";
import MotionWrapper from "../components/framer-motion/MotionWrapper";
import { grey } from "@mui/material/colors";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";

const Main = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        <Box bgcolor="white" position="relative">
          {/* 하단 장식 부분 */}
          <Box
            position="absolute"
            width="100%"
            height="40vh"
            bottom={0}
            left={0}
            overflow="hidden"
            sx={{
              transform: "translateY(50%)",
            }}
          >
            <Box
              position="absolute"
              width="110vw"
              minWidth="600px"
              height="40vh"
              top={0}
              left="50%"
              bgcolor="white"
              borderRadius="0 0 50% 50%"
              sx={{
                transform: "translateX(-50%)",
                clipPath: "inset(50% 0 0 0)",
              }}
            />
          </Box>

          <Container maxWidth="xl">
            <MotionContainer>
              <Stack height="calc(100vh - 64px)">
                {/* 슬로건 */}
                <Stack gap={1} alignItems="flex-start">
                  <MotionWrapper direction="x">
                    {/* 첫번째 줄 */}
                    <Typography variant="h1">
                      포트폴리오{" "}
                      <span css={{ color: theme.palette.primary.main }}>
                        로드맵
                      </span>
                      은 역시
                    </Typography>

                    {/* 두번째 줄 */}
                    <Typography variant="h1">
                      <span css={{ color: theme.palette.primary.main }}>
                        잡톡
                      </span>
                      으로 시작!
                    </Typography>
                  </MotionWrapper>

                  {/* 내용 */}
                  <MotionWrapper direction="x">
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      gap="0.25em"
                    >
                      {[
                        "포트폴리오를 한눈에 정리할 수 있는",
                        "로드맵으로 시작해보세요 !",
                      ].map((text, index) => (
                        <Typography
                          variant="h5"
                          color="black"
                          display="inline-block"
                          whiteSpace="nowrap"
                          key={`main-slogan-${index}`}
                          sx={{
                            fontSize: {
                              xs: theme.typography.subtitle1.fontSize,
                              md: theme.typography.h6.fontSize,
                              lg: theme.typography.h5.fontSize,
                            },
                          }}
                        >
                          {text}
                        </Typography>
                      ))}
                    </Stack>
                  </MotionWrapper>
                </Stack>
              </Stack>
            </MotionContainer>
          </Container>
        </Box>

        {/* 2페이지 */}
        <Container maxWidth="xl">
          <MotionContainer>
            <Stack height="100vh" justifyContent="space-evenly">
              {/* 헤더 */}
              <MotionWrapper>
                <Typography variant="h3" textAlign="center">
                  미래에 대한 설계는 어떻게 준비해야 할까요?
                </Typography>
              </MotionWrapper>

              {/* 진로 설계 단계 소개 */}
              <Stack
                height={{
                  xs: "75%",
                  sm: "auto",
                }}
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                justifyContent="space-between"
              >
                {[
                  {
                    title: "계획",
                    description: "내가 관심있는 분야를 찾고 계획해요!",
                    icon: <EditRoundedIcon />,
                  },
                  {
                    title: "준비",
                    description: "잡톡 AI와 상담하며 함께 진로를 준비해요!",
                    icon: <AutoStoriesRoundedIcon />,
                  },
                  {
                    title: "실현",
                    description: "내 진로를 이루기 위해 함께 노력해요!",
                    icon: <DirectionsRunRoundedIcon />,
                  },
                ].map((item, index) => (
                  <Box
                    key={`main-2nd-${index}`}
                    width={{
                      xs: "100%",
                      sm: "27%",
                    }}
                    height={{
                      xs: "30%",
                      sm: "100%",
                    }}
                  >
                    <MotionWrapper
                      direction={isMobile ? "x" : "y"}
                      css={{ width: "100%", height: "100%" }}
                    >
                      <Paper
                        elevation={5}
                        sx={{
                          height: "100%",
                          borderRadius: {
                            xs: 8,
                            sm: 12,
                            md: 15,
                          },
                          "&:hover": {
                            boxShadow: 15,
                          },
                        }}
                      >
                        <Stack
                          height="100%"
                          direction={{
                            xs: "row",
                            sm: "column",
                          }}
                          alignItems="center"
                          padding={{
                            xs: 2,
                            sm: "17%",
                          }}
                          paddingY={{
                            xs: 0,
                            sm: "12%",
                          }}
                          gap={{
                            xs: 3,
                            sm: 5,
                          }}
                        >
                          {/* 아이콘 */}
                          <Stack
                            justifyContent="center"
                            alignItems="center"
                            borderRadius="50%"
                            bgcolor={theme.palette.primary.main}
                            color="white"
                            sx={{
                              aspectRatio: "1 / 1",
                              width: { xs: "auto", sm: "100%" },
                              height: { xs: "60%", sm: "auto" },
                              "& .MuiSvgIcon-root": {
                                width: "70%",
                                height: "70%",
                              },
                            }}
                          >
                            {item.icon}
                          </Stack>

                          <Stack
                            textAlign={{
                              xs: "left",
                              sm: "center",
                            }}
                            gap={{
                              xs: 2,
                              sm: 5,
                            }}
                          >
                            {/* 제목 */}
                            <Typography variant="h3" color="primary">
                              {item.title}
                            </Typography>

                            {/* 설명 */}
                            <Typography
                              variant="h5"
                              color="black"
                              fontWeight="400"
                            >
                              {item.description}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    </MotionWrapper>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </MotionContainer>
        </Container>
      </Stack>
    </ThemeProvider>
  );
};

export default Main;
