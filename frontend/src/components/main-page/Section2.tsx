import { Box, Container, Paper, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import MotionContainer from "../framer-motion/MotionContainer";
import MotionWrapper from "../framer-motion/MotionWrapper";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";

const Section2 = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
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
                        <Typography variant="h5" color="black" fontWeight="400">
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
  );
};

export default Section2;
