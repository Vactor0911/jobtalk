import { Box, Container, Stack, Typography, useTheme } from "@mui/material";
import MotionContainer from "../framer-motion/MotionContainer";
import MotionWrapper from "../framer-motion/MotionWrapper";

const Section1 = () => {
  const theme = useTheme();

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
                  <span css={{ color: theme.palette.primary.main }}>잡톡</span>
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
  );
};

export default Section1;
