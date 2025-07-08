import { Box, Button, Container, Stack, Typography } from "@mui/material";
import WorkspaceStepper from "../components/workspace/WorkspaceStepper";
import { useCallback, useEffect, useState } from "react";
import InterestsView from "../components/workspace/InterestsView";
import ChatbotView from "../components/workspace/ChatbotView";
import { enqueueSnackbar } from "notistack";
import axiosInstance from "../utils/axiosInstance";
import { useParams } from "react-router";

// 워크스페이스 정보 인터페이스
interface WorkspaceInfo {
  id: number;
  uuid: string;
  name: string;
  status: string;
  chatTopic: string | null;
  interestCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

// 사용자 정보 인터페이스
interface UserInfo {
  name: string;
  certificates: string | null;
  profileImage: string | null;
}

const Workspace = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // 로딩 구현할 때 사용하려면
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

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
        if (
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
    } finally {
      setIsLoading(false);
    }
  }, [uuid]);

  // 사용자 정보 가져오기
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/auth/me");

      if (response.data.success) {
        setUserInfo(response.data.data);
      } else {
        throw new Error(
          response.data.message || "사용자 정보를 가져오는데 실패했습니다"
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("사용자 정보 가져오기 오류:", err);
      enqueueSnackbar(
        err.response?.data?.message || "사용자 정보를 가져오는데 실패했습니다",
        { variant: "error" }
      );
    }
  }, []);

  // 관심분야 선택 처리
  const handleInterestSelected = useCallback((interest: string) => {
    setSelectedInterest(interest);
    setStep(3); // 챗봇 단계로 이동
  }, []);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchWorkspaceInfo();
    fetchUserInfo();
  }, [fetchWorkspaceInfo, fetchUserInfo]);

  return (
    <Container maxWidth="lg">
      <Stack
        minHeight="calc(100vh - 64px)"
        paddingY={4}
        paddingBottom={10}
        gap={4}
      >
        {/* 스테퍼 */}
        {step <= 5 && <WorkspaceStepper activeStep={step} />}

        {/* 관심 분야 선택 */}
        {step === 1 && (
          <>
            <Box textAlign="center">
              <Typography variant="h4" gutterBottom color="primary">
                관심 분야를 선택해주세요.
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                관심 있는 분야를 선택하면 맞춤형 진로 상담을 시작합니다.
              </Typography>
            </Box>
            <InterestsView onInterestSelected={handleInterestSelected} />
          </>
        )}

        {/* 챗봇 질문 */}
        {step === 3 && (
          <>
            <Box textAlign="center">
              <Typography variant="h4" color="primary" gutterBottom>
                맞춤형 진로 상담
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedInterest || workspace?.interestCategory} 분야에 관한
                상담을 시작합니다.
              </Typography>
            </Box>
            <ChatbotView workspaceUuid={uuid || ""} />
          </>
        )}

        {/* 스텝 테스트용 버튼 */}
        <Stack direction="row" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => {
              setStep((prev) => prev - 1);
            }}
          >
            이전
          </Button>
          <Typography variant="h5" color="text.secondary">
            {step}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setStep((prev) => prev + 1);
            }}
          >
            다음
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Workspace;
