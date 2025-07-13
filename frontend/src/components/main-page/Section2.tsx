import {
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MotionContainer from "../framer-motion/MotionContainer";
import MotionWrapper from "../framer-motion/MotionWrapper";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";

const Section2 = () => {
  const theme = useTheme();

  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Container maxWidth="xl">
      <MotionContainer>
        <Stack
          minHeight="100vh"
          justifyContent="space-evenly"
          gap={5}
          paddingY={8}
        >
          {/* 헤더 */}
          <MotionWrapper>
            <Typography variant="h3" textAlign="center">
              미래에 대한 설계, 이렇게 해보세요!
            </Typography>
          </MotionWrapper>

          {/* 진로 설계 단계 소개 */}
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            justifyContent="space-between"
            gap={5}
          >
            {[
              {
                title: "계획",
                description: "어떤걸 좋아하는지 함께 알아가봐요!",
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
              <MotionWrapper
                key={`section2-item-${index}`}
                direction={isTablet ? "x" : "y"}
                css={{
                  width: isTablet ? "100%" : "27%",
                  height: isTablet ? "auto" : "webkit-fill-available",
                }}
              >
                <Paper
                  elevation={5}
                  sx={{
                    width: "100%",
                    height: "100%",
                    borderRadius: {
                      xs: 7,
                      sm: 10,
                      md: 15,
                    },
                  }}
                >
                  <Stack
                    direction={{
                      xs: "row",
                      md: "column",
                    }}
                    padding={{
                      xs: 3,
                      md: "10%",
                    }}
                    alignItems="center"
                    paddingX="17%"
                    gap={4}
                  >
                    {/* 아이콘 */}
                    <Stack
                      height={{
                        xs: "100px",
                        md: "auto",
                      }}
                      justifyContent="center"
                      alignItems="center"
                      bgcolor={theme.palette.primary.main}
                      borderRadius="50%"
                      color="white"
                      sx={{
                        aspectRatio: "1 / 1",
                        "& .MuiSvgIcon-root": {
                          width: "70%",
                          height: "70%",
                        },
                      }}
                    >
                      {item.icon}
                    </Stack>

                    <Stack
                      gap={{
                        xs: 2,
                        md: 4,
                      }}
                      textAlign={{
                        xs: "left",
                        md: "center",
                      }}
                    >
                      {/* 제목 */}
                      <Typography variant="h3" color="primary">
                        {item.title}
                      </Typography>

                      {/* 내용 */}
                      <Typography variant="h5" fontWeight={500}>
                        {item.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </MotionWrapper>
            ))}
          </Stack>
        </Stack>
      </MotionContainer>
    </Container>
  );
};

export default Section2;
