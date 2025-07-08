import {
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

interface InterestsViewProps {
  onInterestSelected?: (interest: string) => void;
}

const InterestsView = ({ onInterestSelected }: InterestsViewProps) => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();

  // 관심 분야 선택 핸들러
  const handleInterestSelect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (interest: any) => {
      try {
        if (!uuid) {
          enqueueSnackbar("워크스페이스 정보를 찾을 수 없습니다.", {
            variant: "error",
          });
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

          // 부모 컴포넌트에 선택된 관심분야 전달 (있는 경우)
          if (onInterestSelected) {
            onInterestSelected(interest.name);
          }

          // 새로고침 또는 다음 화면으로 이동
          navigate(`/workspace/${uuid}?refresh=true`);
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
    [uuid, navigate, onInterestSelected]
  );

  return (
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
              <Stack direction="row" alignItems="center" color={interest.color}>
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
  );
};

export default InterestsView;
