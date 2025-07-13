import {
  Box,
  Button,
  Container,
  keyframes,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MotionContainer from "../framer-motion/MotionContainer";
import MotionWrapper from "../framer-motion/MotionWrapper";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RunningManImage from "../../assets/images/running_man.png";

const arrowAnimation = keyframes`
  0%, 100% {
    transform: translate(-50%, 20%);
  }
  50% {
    transform: translate(-50%, 50%);
  }
`;

const Section1 = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
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
          <Stack
            minHeight="calc(100vh - 64px)"
            justifyContent="space-around"
            paddingY={5}
            paddingBottom="140px"
            position="relative"
            gap={10}
          >
            {/* 슬로건 */}
            <Stack gap={4} position="relative" zIndex={2}>
              <MotionWrapper direction="x">
                <Stack gap={2}>
                  {/* 첫번째 줄 */}
                  <Typography variant={isMobile ? "h2" : "h1"}>
                    진로{" "}
                    <span css={{ color: theme.palette.primary.main }}>
                      로드맵
                    </span>
                    은 이제
                  </Typography>

                  {/* 두번째 줄 */}
                  <Typography variant={isMobile ? "h2" : "h1"}>
                    <span css={{ color: theme.palette.primary.main }}>
                      잡톡
                    </span>
                    으로 시작!
                  </Typography>
                </Stack>
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
                  <Typography
                    variant="h4"
                    color="black"
                    display="inline-block"
                    whiteSpace="nowrap"
                  >
                    당신만을 위한 맞춤형 진로 계획, 지금 시작해보세요!
                  </Typography>
                </Stack>
              </MotionWrapper>

              {/* 배경 이미지 */}
              <Box
                component="img"
                src={RunningManImage}
                position="absolute"
                width={{
                  xs: "100%",
                  sm: "auto",
                }}
                height={{
                  xs: "auto",
                  sm: "60vh",
                }}
                top={0}
                right={0}
                zIndex={-1}
                sx={{
                  filter: {
                    xs: "blur(5px)",
                    md: "none",
                  },
                }}
              />
            </Stack>

            {/* 버튼 */}
            <Button
              variant="contained"
              color="primary"
              sx={{
                padding: {
                  xs: 3,
                  md: 4,
                },
                paddingX: {
                  xs: 5,
                  md: 10,
                },
                borderRadius: 5,
                alignSelf: {
                  xs: "center",
                  md: "flex-start",
                },
                position: "relative",
                zIndex: 2,
              }}
            >
              <Typography variant="h4" color="white" fontWeight={500}>
                바로 시작하기
              </Typography>
            </Button>

            {/* 아래 화살표 */}
            <DownloadRoundedIcon
              color="primary"
              sx={{
                position: "absolute",
                bottom: 40,
                left: "50%",
                transform: "translate(-50%, 50%)",
                fontSize: "80px",
                clipPath: "inset(0 0 30% 0)",
                animation: `${arrowAnimation} 2s infinite ease-in-out`,
                zIndex: 2,
              }}
            />
          </Stack>
        </MotionContainer>
      </Container>
    </Box>
  );
};

export default Section1;
