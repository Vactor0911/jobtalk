import {
  Box,
  ButtonBase,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { Workspace } from ".";
import { getRandomColor } from "../../utils";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useCallback } from "react";
import { useNavigate } from "react-router";

interface WorkspaceItemProps {
  number: number;
  workspace: Workspace;
  onDelete?: () => void;
}

const WorkspaceItem = (props: WorkspaceItemProps) => {
  const { number, workspace, onDelete } = props;
  const navigate = useNavigate();

  // 워크스페이스 클릭 이벤트 핸들러
  const handleWorkspaceClick = useCallback(
    (uuid: string) => {
      navigate(`/workspace/${uuid}`);
    },
    [navigate]
  );

  // 워크스페이스 삭제 버튼 클릭
  const handleDeleteButtonClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
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
              backgroundColor: getRandomColor(workspace.uuid),
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
            <Typography variant="h6">워크스페이스 {number}</Typography>

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
              {formatDateDisplay(workspace.createdAt, workspace.updatedAt)}
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
            handleDeleteButtonClick(e);
          }}
        >
          <DeleteRoundedIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default WorkspaceItem;
