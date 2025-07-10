import {
  Box,
  Button,
  Grid,
  keyframes,
  List,
  ListItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import interests from "../../assets/interests.json";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { enqueueSnackbar } from "notistack";
import axiosInstance, { getCsrfToken } from "../../utils/axiosInstance";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useSetAtom } from "jotai";
import { selectedInterestAtom, workspaceStepAtom } from "../../state";

// 화살표 애니메이션 키프레임
const arrowHoverAnimation = keyframes`
  0% {
    transform: translate(120%, -50%);
  }
  50% {
    transform: translate(150%, -50%);
  }
  100% {
    transform: translate(120%, -50%);
  }
`;

const InterestsView = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const setSelectedInterest = useSetAtom(selectedInterestAtom);
  const setStep = useSetAtom(workspaceStepAtom);

  // 관심 분야 선택 핸들러
  const handleInterestSelect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (interest: any) => {
      try {
        if (!uuid) {
          enqueueSnackbar("워크스페이스 정보를 찾을 수 없습니다.", {
            variant: "error",
          });
          navigate("/workspace"); // 워크스페이스 페이지로 이동
          return;
        }

        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        // API 호출로 관심분야 설정
        const response = await axiosInstance.put(
          `/workspace/${uuid}/interest`,
          {
            interestCategory: interest.name,
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken,
            },
          }
        );

        if (response.data.success) {
          enqueueSnackbar(`'${interest.name}' 분야를 선택했습니다.`, {
            variant: "success",
          });

          // 선택된 관심 분야 적용
          setSelectedInterest(interest.name);
          setStep(3); // 챗봇 채팅 단계로 이동
        } else {
          throw new Error(
            response.data.message || "관심분야 설정에 실패했습니다."
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("관심분야 설정 오류:", err);
        enqueueSnackbar(
          err.response?.data?.message || "관심분야 설정에 실패했습니다.",
          { variant: "error" }
        );
      }
    },
    [uuid, navigate, setSelectedInterest, setStep]
  );

  return (
    <Stack gap={5}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom color="primary">
          관심 분야를 선택해주세요.
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          관심 있는 분야를 선택하면 맞춤형 진로 상담을 시작합니다.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {interests.map((interest, index) => (
          <Grid
            key={index}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                height: "100%",
                background: "#f5f5f5",
                borderRadius: 3,
                "&:hover": {
                  boxShadow: 7,
                },
              }}
            >
              <Stack padding={3} gap={1} height="100%">
                {/* 헤더 */}
                <Stack
                  direction="row"
                  alignItems="center"
                  color={interest.color}
                >
                  <Typography variant="h6">{interest.name}</Typography>
                  <Tooltip
                    title={interest.description}
                    sx={{
                      marginLeft: "auto",
                      cursor: "pointer",
                    }}
                  >
                    <HelpOutlineRoundedIcon />
                  </Tooltip>
                </Stack>

                {/* 예시 직종 */}
                <List dense>
                  {interest.examples.map((example, index) => (
                    <ListItem
                      key={`${interest.name}-${index}`}
                      disablePadding
                      sx={{
                        paddingLeft: 1,
                      }}
                    >
                      <CircleRoundedIcon
                        sx={{
                          fontSize: "0.5rem",
                          marginRight: 1,
                        }}
                      />
                      <Typography variant="subtitle1" color="text.secondary">
                        {example}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                {/* 선택하기 버튼 */}
                <Button
                  variant="contained"
                  onClick={() => handleInterestSelect(interest)}
                  sx={{
                    marginTop: "auto",
                    borderRadius: 3,
                    boxShadow: 1,
                    "--variant-containedBg": `${interest.color} !important`,
                    "&:hover .MuiSvgIcon-root": {
                      animation: `${arrowHoverAnimation} 0.75s ease-in-out infinite`,
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    color="white"
                    position="relative"
                  >
                    선택하기
                    {/* 화살표 아이콘 */}
                    <EastRoundedIcon
                      sx={{
                        position: "absolute",
                        top: "50%",
                        right: 0,
                        transform: "translate(120%, -50%)",
                      }}
                    />
                  </Typography>
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default InterestsView;
