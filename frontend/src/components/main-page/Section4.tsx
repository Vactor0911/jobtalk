import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import cycleImage from "../../assets/images/career_cycle.png";
import { useCallback } from "react";
import { useNavigate } from "react-router";

const Section4 = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isSmallPc = useMediaQuery(theme.breakpoints.down("xl"));

  // 텍스트 크기 반환 함수
  const getTextVariant = useCallback(() => {
    if (isMobile) return "h5";
    if (isSmallPc) return "h4";
    return "h3";
  }, [isMobile, isSmallPc]);

  // 바로 시작하기 버튼 클릭
  const handleStartButtonClick = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <Stack
      direction={{
        xs: "column-reverse",
        md: "row",
      }}
      minHeight="100vh"
      gap={5}
    >
      {/* 패널 */}
      <Stack
        width={{
          xs: "100%",
          md: "47%",
        }}
        height={{
          xs: "40vh",
          md: "100vh",
        }}
        minHeight="300px"
        justifyContent="center"
        alignItems="center"
        bgcolor={theme.palette.primary.main}
        color="white"
        borderRadius={{
          xs: "75px 75px 0px 0px",
          md: "0 100px 100px 0",
        }}
      >
        <Stack
          height={{
            xs: "80%",
            md: "40%",
          }}
          justifyContent="space-between"
          gap={3}
        >
          {/* 모바일용 여백 */}
          <Box
            display={{
              xs: "block",
              md: "none",
            }}
          />

          {/* 슬로건 */}
          <Stack textAlign="left" gap={1}>
            <Typography variant={getTextVariant()}>
              경쟁력 있는 포트폴리오,
            </Typography>
            <Typography variant={getTextVariant()}>
              잡톡 AI의 맞춤형 로드맵으로
            </Typography>
            <Typography variant={getTextVariant()}>쉽게 준비하세요!</Typography>
          </Stack>

          {/* 버튼 */}
          <Button
            variant="contained"
            color="black"
            sx={{
              alignSelf: "flex-start",
              padding: {
                xs: 2,
                md: 3,
              },
              paddingX: {
                xs: 4,
                md: 8,
              },
              borderRadius: "50px",
            }}
            onClick={handleStartButtonClick}
          >
            <Typography variant={getTextVariant()} color="white">
              바로 시작하기
            </Typography>
          </Button>
        </Stack>
      </Stack>

      {/* 이미지 */}
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Box
          component="img"
          src={cycleImage}
          width={{
            xs: "auto",
            md: "65%",
          }}
          minWidth="250px"
          height={{
            xs: "40vh",
            md: "auto",
          }}
          minHeight="250px"
        />
      </Stack>
    </Stack>
  );
};

export default Section4;
