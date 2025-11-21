import { CircularProgress, Container, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import axiosInstance from "../../utils/axiosInstance";
import { useSetAtom } from "jotai";
import { workspaceStepAtom } from "../../state";
import WorkspaceItem from "./WorkspaceItem";
import DeleteDialog from "./DeleteDialog";

// 워크스페이스 인터페이스 정의
export interface Workspace {
  id: number;
  uuid: string;
  name: string;
  status: "waiting" | "chatting" | "roadmap_generated";
  chatTopic: string | null;
  createdAt: string;
  updatedAt: string;
}

const MyWorkspace = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setStep = useSetAtom(workspaceStepAtom);
  const [deleteWorkspaceIndex, setDeleteWorkspaceIndex] = useState<
    number | null
  >(null);

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

  // 컴포넌트 마운트 시 워크스페이스 데이터 가져오기
  useEffect(() => {
    setStep(1); // 워크스페이스 단계 초기화
    fetchWorkspaces();
  }, [fetchWorkspaces, setStep]);

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
              <WorkspaceItem
                key={workspace.uuid}
                workspace={workspace}
                number={index + 1}
                onDelete={() => setDeleteWorkspaceIndex(index)}
              />
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

      {/* 워크스페이스 삭제 대화상자 */}
      <DeleteDialog
        open={deleteWorkspaceIndex !== null}
        workspace={
          deleteWorkspaceIndex !== null
            ? workspaces[deleteWorkspaceIndex]
            : null
        }
        onClose={() => setDeleteWorkspaceIndex(null)}
        fetchWorkspaces={fetchWorkspaces}
        setDeleteWorkspaceIndex={setDeleteWorkspaceIndex}
      />
    </Container>
  );
};

export default MyWorkspace;
