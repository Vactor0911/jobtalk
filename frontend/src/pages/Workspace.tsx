import { Container, Stack } from "@mui/material";
import WorkspaceStepper from "../components/workspace/WorkspaceStepper";
import { useCallback, useEffect, useState } from "react";
import InterestsView from "../components/workspace/InterestsView";
import ChatbotView from "../components/workspace/ChatbotView";
import RoadMapView from "../components/workspace/RoadMapView";
import { enqueueSnackbar } from "notistack";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useParams } from "react-router";
import { useAtom, useSetAtom } from "jotai";
import {
  selectedInterestAtom,
  selectedWorkspaceAtom,
  workspaceStepAtom,
} from "../state";

const Workspace = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();

  const [step, setStep] = useAtom(workspaceStepAtom);
  const [, setIsLoading] = useState(true); // 로딩 구현할 때 사용하려면
  const [workspace, setWorkspace] = useAtom(selectedWorkspaceAtom);
  const setSelectedInterest = useSetAtom(selectedInterestAtom);

  // 워크스페이스 정보 가져오기
  const fetchWorkspaceInfo = useCallback(async () => {
    if (!uuid) return;

    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/workspace/${uuid}`);

      if (response.data.success) {
        const workspaceData = response.data.data.workspace;
        setWorkspace(workspaceData);

        // 워크스페이스 상태에 따른 화면 전환 로직 수정
        if (workspaceData.status === "roadmap_generated") {
          setStep(6); // 로드맵 뷰어로 바로 이동
        } else if (
          workspaceData.interestCategory ||
          workspaceData.status === "chatting"
        ) {
          setSelectedInterest(workspaceData.interestCategory || "");
          setStep(3); // 챗봇 단계로 바로 이동
        }
      } else {
        throw new Error(
          response.data.message || "워크스페이스 정보를 가져오는데 실패했습니다"
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("워크스페이스 정보 가져오기 오류:", err);
      enqueueSnackbar(
        err.response?.data?.message ||
          "워크스페이스 정보를 가져오는데 실패했습니다",
        { variant: "error" }
      );
      navigate("/workspace"); // 워크스페이스 페이지로 이동
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setSelectedInterest, setStep, setWorkspace, uuid]);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchWorkspaceInfo();
  }, [fetchWorkspaceInfo]);

  // 로드맵 뷰
  if (step > 5) {
    return <RoadMapView />;
  }

  return (
    <Container maxWidth="lg">
      <Stack
        minHeight="calc(100vh - 64px)"
        paddingY={4}
        paddingBottom={10}
        gap={4}
      >
        {/* 스테퍼 */}
        <WorkspaceStepper activeStep={step} />

        {/* 관심 분야 선택 */}
        {step === 1 && <InterestsView />}

        {/* 챗봇 질문 */}
        {step === 3 && workspace && <ChatbotView />}
      </Stack>
    </Container>
  );
};

export default Workspace;
