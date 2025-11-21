import {
  Box,
  ButtonBase,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { getRandomColor } from "../utils";
import { enqueueSnackbar } from "notistack";
import { useNavigate } from "react-router";
import axiosInstance from "../utils/axiosInstance";
import { useSetAtom } from "jotai";
import { workspaceStepAtom } from "../state";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

// 워크스페이스 인터페이스 정의
interface Workspace {
  id: number;
  uuid: string;
  name: string;
  status: "waiting" | "chatting" | "roadmap_generated";
  chatTopic: string | null;
  createdAt: string;
  updatedAt: string;
}

const MyWorkspace = () => {
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setStep = useSetAtom(workspaceStepAtom);

  // 워크스페이스 데이터 가져오기
  const fetchWorkspaces = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await axiosInstance.get("/workspace/all");

      if (response.data.success) {
        setWorkspaces(response.data.data.workspaces);
      } else {
        throw new Error(
          response.data.message || "워크스페이스를 불러오는데 실패했습니다"
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("워크스페이스 로딩 오류:", err);
      enqueueSnackbar(
        err.response?.data?.message || "워크스페이스를 불러오는데 실패했습니다",
        { variant: "error" }
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 워크스페이스 클릭 이벤트 핸들러
  const handleWorkspaceClick = useCallback(
    (uuid: string) => {
      navigate(`/workspace/${uuid}`);
    },
    [navigate]
  );

  // 워크스페이스 삭제 버튼 클릭
  const handleDeleteButtonClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, uuid: string) => {
      e.stopPropagation();

      // 워크스페이스 삭제
      try {
        await axiosInstance.delete(`/workspace/${uuid}`);
        fetchWorkspaces();
        enqueueSnackbar("워크스페이스를 성공적으로 삭제했습니다.", {
          variant: "success",
        });
      } catch (err) {
        console.error(err);
        enqueueSnackbar("워크스페이스를 삭제하지 못했습니다.", {
          variant: "error",
        });
      }
    },
    [fetchWorkspaces]
  );

  // 생성/수정 시간 표시 포맷 함수
  const formatDateDisplay = useCallback(
    (createdAt: string, updatedAt: string) => {
      const created = new Date(createdAt);
      const updated = new Date(updatedAt);

      // 날짜 포맷터 - 한국어 형식으로 날짜와 시간 표시
      const formatter = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false, // 24시간제 사용
      });

      // 생성 시간과 수정 시간의 차이가 1초 이상인 경우 (동일하지 않은 경우)
      if (Math.abs(updated.getTime() - created.getTime()) > 1000) {
        return `${formatter.format(updated)} 에 수정됨`;
      }

      return `${formatter.format(created)} 에 생성됨`;
    },
    []
  );

  // 컴포넌트 마운트 시 워크스페이스 데이터 가져오기
  useEffect(() => {
    setStep(1); // 워크스페이스 단계 초기화
    fetchWorkspaces();
  }, [fetchWorkspaces, setStep]);

  // 워크스페이스 상태에 따른 텍스트 표시
  const getStatusText = useCallback(
    (status: Workspace["status"], name: string) => {
      switch (status) {
        case "waiting":
          return name;
        case "chatting":
          return name;
        case "roadmap_generated":
          return `${name}`;
        default:
          return name;
      }
    },
    []
  );

  return (
    <Container maxWidth="md">
      <Stack
        width="100%"
        height="calc(100vh - 64px)"
        paddingY={4}
        paddingBottom={10}
        gap={4}
      >
        {/* 헤더 */}
        <Typography variant="h4">워크스페이스</Typography>

        {/* 로딩 표시 */}
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" height="50vh">
            <CircularProgress />
            <Typography variant="subtitle1" mt={2}>
              워크스페이스를 불러오는 중...
            </Typography>
          </Stack>
        ) : workspaces.length === 0 ? (
          // 워크스페이스가 없는 경우
          <Stack alignItems="center" justifyContent="center" height="50vh">
            <Typography variant="h6">
              사용 가능한 워크스페이스가 없습니다.
            </Typography>
          </Stack>
        ) : (
          // 워크스페이스 목록
          <Stack gap={4}>
            {workspaces.map((workspace, index) => (
              <Paper
                key={workspace.uuid}
                elevation={3}
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: 6,
                    transform: "scale(1.02)",
                  },
                  position: "relative",
                }}
              >
                <ButtonBase
                  sx={{ width: "100%" }}
                  onClick={() => handleWorkspaceClick(workspace.uuid)}
                >
                  <Stack
                    width="100%"
                    height={{
                      xs: "auto",
                      sm: "20vh",
                    }}
                    minHeight="180px"
                    padding={2}
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    gap={2}
                  >
                    {/* 미리보기 이미지 */}
                    <Box
                      height={{
                        xs: "130px",
                        sm: "100%",
                      }}
                      borderRadius={4}
                      sx={{
                        aspectRatio: "1 / 1",
                        backgroundColor: getRandomColor(),
                      }}
                    />

                    {/* 워크스페이스 정보 */}
                    <Stack
                      textAlign="left"
                      paddingY={{
                        xs: 0,
                        sm: 2,
                      }}
                    >
                      {/* 워크스페이스명 */}
                      <Typography variant="h6">
                        워크스페이스 {index + 1}
                      </Typography>

                      {/* 워크스페이스 상태 */}
                      <Typography variant="h5" color="primary">
                        {getStatusText(workspace.status, workspace.name)}
                      </Typography>

                      {/* 워크스페이스 상태 표시 */}
                      <Typography variant="body2" color="text.secondary">
                        {workspace.status === "waiting"
                          ? "대기 중"
                          : workspace.status === "chatting"
                          ? "상담 중"
                          : "로드맵 생성됨"}
                      </Typography>

                      {/* 수정/생성 일자 */}
                      <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        marginTop="auto"
                      >
                        {formatDateDisplay(
                          workspace.createdAt,
                          workspace.updatedAt
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                </ButtonBase>

                {/* 워크스페이스 삭제 버튼 */}
                <Box
                  display={workspace.status !== "waiting" ? "block" : "none"}
                  position="absolute"
                  top={{
                    xs: 16,
                    sm: 8,
                  }}
                  right={{
                    xs: 16,
                    sm: 8,
                  }}
                  borderRadius="50%"
                >
                  <IconButton
                    onClick={(e) => {
                      handleDeleteButtonClick(e, workspace.uuid);
                    }}
                  >
                    <DeleteRoundedIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}

        {/* 안내 문구 */}
        <Typography variant="subtitle1" color="text.secondary">
          계정당 최대 3개의 워크스페이스를 사용할 수 있습니다.
          <br />
          생성된 워크스페이스 데이터는 대회 종료 후 즉시 삭제됩니다.
        </Typography>
      </Stack>
    </Container>
  );
};

export default MyWorkspace;
