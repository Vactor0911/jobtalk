import { Box, Stack, Typography, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import axiosInstance, { getCsrfToken } from "../../utils/axiosInstance";
import { selectedInterestAtom, workspaceStepAtom } from "../../state";
import { useAtom, useAtomValue } from "jotai";
import { enqueueSnackbar } from "notistack";
import JobOptionsButtons from "./JobOptionsButtons";
import { useParams } from "react-router";
import ChatBox from "../chat/ChatBox";
import ChatInput from "../chat/ChatInput";
import { isChatMessageValid, MAX_MESSAGE_LENGTH } from "../../utils";

interface Chat {
  isBot: boolean; // 챗봇인지 여부
  content: string; // 메시지 내용
  date: string; // 메시지 전송 날짜
  jobOptions?: string[]; // 직업 옵션이 있는 경우
}

// 최대 대화 횟수
const MAX_CHAT_COUNT = 15;

// AI 응답에서 직업 옵션 추출 함수
const extractJobOptions = (message: string): string[] | null => {
  const regex = /JOB_OPTIONS:\s*(\[[^\]]+\])/;
  const match = message.match(regex);

  if (match && match[1]) {
    try {
      const jobs = JSON.parse(match[1]);
      return jobs;
    } catch (error) {
      console.error("직업 옵션 파싱 실패:", error);
      return null;
    }
  }
  return null;
};

// JOB_OPTIONS: [...] 부분과 중복 QUESTION: 제거 함수
const cleanBotMessage = (message: string) => {
  // 1. JOB_OPTIONS: [...] 제거
  let cleaned = message.replace(/JOB_OPTIONS:\s*\[[^\]]*\]/g, "").trim();

  // 2. QUESTION:이 두 번 이상 나오면 첫 번째만 남기고 뒤는 모두 제거
  const firstQuestionIdx = cleaned.indexOf("QUESTION:");
  if (firstQuestionIdx !== -1) {
    // 두 번째 QUESTION: 위치 찾기 (첫 번째 이후)
    const secondQuestionIdx = cleaned.indexOf(
      "QUESTION:",
      firstQuestionIdx + 1
    );
    if (secondQuestionIdx !== -1) {
      cleaned = cleaned.slice(0, secondQuestionIdx).trim();
    }
  }
  return cleaned;
};

const ChatbotView = () => {
  const theme = useTheme();
  const { uuid } = useParams<{ uuid: string }>(); // URL에서 워크스페이스 UUID 가져오기

  // 관심 분야 상태
  const selectedInterest = useAtomValue(selectedInterestAtom); // 선택된 관심 분야

  // 채팅 관련 상태
  const [chats, setChats] = useState<Chat[]>([]); // 채팅 메시지 목록
  const [fetchLoading, setFetchLoading] = useState(false); // 데이터 로딩 상태
  const [chatbotLoading, setChatbotLoading] = useState(false); // 챗봇 응답 로딩 상태
  const [responseId, setResponseId] = useState<string | null>(null);
  const [, setChatHistoryLoaded] = useState(false); // 이전 대화 불러온 여부
  const [, setIsRecommendStage] = useState(false); // 직업 추천 단계 여부
  const [, setForceRecommendCount] = useState(0); // 직업 추천 강제 카운트
  const [isRecommendLimit, setIsRecommendLimit] = useState(false); // 직업 추천 제한 여부
  const [recommendedJobs, setRecommendedJobs] = useState<string[]>([]); // 추천된 직업 목록

  // 프로필 이미지와 닉네임 상태
  const [userName, setUserName] = useState<string>("");

  // 자격증과 관심분야 정보
  const [userCertificates, setUserCertificates] = useState<string>("");
  const [interestCategory, setInterestCategory] = useState<string>("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // 워크스페이스 단계 상태
  const [, setStep] = useAtom(workspaceStepAtom);

  // 워크스페이스와 사용자 기본 정보 한번에 가져오기
  const fetchBasicInfo = useCallback(async () => {
    if (!uuid) return;

    try {
      setFetchLoading(true);
      // CSRF 토큰 획득
      const csrfToken = await getCsrfToken();

      // 통합 API 호출
      const response = await axiosInstance.get(`/workspace/${uuid}/basicinfo`, {
        headers: { "X-CSRF-Token": csrfToken },
      });

      if (response.data.success) {
        const { workspace, user } = response.data.data;

        // 워크스페이스 관심분야 설정
        setInterestCategory(workspace.interestCategory || "");

        // 사용자 정보 설정
        setUserCertificates(user.certificates || "없음");
        setUserName(user.name || "");

        setDataLoaded(true);
      }
    } catch (err) {
      console.error("기본 정보 로드 실패:", err);
      enqueueSnackbar("정보를 불러오는 데 실패했습니다", { variant: "error" });
    } finally {
      setFetchLoading(false);
    }
  }, [uuid]);

  // 컴포넌트 마운트 시 통합 API 호출
  useEffect(() => {
    fetchBasicInfo();
  }, [fetchBasicInfo]);

  // 워크스페이스 대화 모드로 업데이트
  const updateWorkspaceChat = useCallback(async () => {
    if (!uuid || !interestCategory) return;

    try {
      // CSRF 토큰 획득
      const csrfToken = await getCsrfToken();

      await axiosInstance.put(
        `/workspace/${uuid}/chat`,
        {
          chatTopic: `${interestCategory} 진로 상담`,
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );
    } catch (err) {
      console.error("워크스페이스 대화 모드 업데이트 실패:", err);
    }
  }, [uuid, interestCategory]);

  // 대화 내용 워크스페이스에 저장
  const saveMessageToWorkspace = useCallback(
    async (
      role: string,
      content: string,
      currentResponseId: string | null = null
    ) => {
      if (!uuid) return;

      try {
        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        await axiosInstance.post(
          `/workspace/${uuid}/chats`,
          {
            role,
            content,
            previousResponseId: currentResponseId || responseId, // 전달받은 ID 우선 사용
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken,
            },
          }
        );
      } catch (err) {
        console.error("대화 저장 실패:", err);
      }
    },
    [uuid, responseId]
  );

  // 이전 대화 불러오기
  const fetchChatHistory = useCallback(async () => {
    if (!uuid) return;

    try {
      // CSRF 토큰 획득
      const csrfToken = await getCsrfToken();

      // 워크스페이스의 채팅 기록 가져오기
      const response = await axiosInstance.get(`/workspace/${uuid}/chats`, {
        headers: {
          "X-CSRF-Token": csrfToken,
        },
      });

      if (response.data.success && response.data.data.chats.length > 0) {
        const chatHistory = response.data.data.chats;

        // 마지막 메시지의 응답 ID 저장 (대화 연속성 유지)
        const lastChat = chatHistory[chatHistory.length - 1];
        if (lastChat.previousResponseId) {
          setResponseId(lastChat.previousResponseId);
        }

        // 채팅 기록을 UI에 표시할 형태로 변환
        const formattedChats = chatHistory.map(
          (chat: {
            role: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content: any;
            createdAt: string | number | Date;
          }) => ({
            isBot: chat.role === "JobtalkAI",
            content: chat.content,
            date: new Date(chat.createdAt).toISOString(),
            jobOptions: extractJobOptions(chat.content) || undefined,
          })
        );

        setChats(formattedChats);
        setChatHistoryLoaded(true);

        // isRecommendLimit 복원
        setIsRecommendLimit(!!response.data.data.isRecommendLimit);

        return true; // 대화 기록이 있음을 반환
      }

      setIsRecommendLimit(false); // 대화 없으면 제한 해제
      return false; // 대화 기록이 없음을 반환
    } catch (err) {
      console.error("채팅 기록 불러오기 실패:", err);
      setIsRecommendLimit(false);
      return false;
    }
  }, [uuid]);

  useEffect(() => {
    // 채팅 내역에서 직업 옵션 누적
    const allJobs = chats
      .filter((chat) => chat.jobOptions && chat.jobOptions.length > 0)
      .flatMap((chat) => chat.jobOptions!);
    setRecommendedJobs(Array.from(new Set(allJobs)));
  }, [chats]);

  // 스크롤을 맨 아래로 이동하는 함수
  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // 메시지 전송 함수
  const handleMessageSend = useCallback(
    async (message: string) => {
      // 메시지 내용이 부적절한 경우
      if (!isChatMessageValid(message)) {
        return;
      }

      // 사용자 메시지 UI에 추가
      const userChat: Chat = {
        isBot: false,
        content: message,
        date: new Date().toISOString(),
      };
      setChats((prevChats: Chat[]) => [...prevChats, userChat]);

      // 사용자 메시지 워크스페이스에 저장
      await saveMessageToWorkspace("user", message);

      // 메시지 전송
      try {
        setChatbotLoading(true);

        // 페이지 스크롤을 맨 아래로 이동
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        // 메시지 전송 (첫 메시지가 아닌 경우는 관심분야와 자격증 정보 불필요)
        const response = await axiosInstance.post(
          `/chat/career/mentor`,
          {
            message: message,
            previousResponseId: responseId, // 현재 저장된 응답 ID 사용
            workspaceUuid: uuid,
            userName: userName,
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken,
            },
          }
        );

        if (response.data.success) {
          // 강제 직업 추천 단계인 경우
          setIsRecommendStage(!!response.data.isRecommendStage);
          setForceRecommendCount(response.data.forceRecommendCount ?? 0);
          setIsRecommendLimit(!!response.data.isRecommendLimit);

          // 직업 옵션 누적
          const jobOptions = extractJobOptions(response.data.answer);
          setRecommendedJobs((prev) => {
            if (!jobOptions) return prev;
            // 중복 제거
            return Array.from(new Set([...prev, ...jobOptions]));
          });

          const newResponseId = response.data.previous_response_id;

          // 응답 ID 업데이트
          setResponseId(newResponseId);

          // 챗봇 응답 추가
          const botChat: Chat = {
            isBot: true,
            content: response.data.answer,
            date: new Date().toISOString(),
            jobOptions: jobOptions || undefined,
          };

          setChats((prevChats) => [...prevChats, botChat]);

          // 업데이트된 ID를 직접 전달
          await saveMessageToWorkspace(
            "JobtalkAI",
            response.data.answer,
            newResponseId
          );
        } else if (response.data.isRecommendLimit) {
          setIsRecommendLimit(true);
          enqueueSnackbar(
            "더 이상 추가 질문이 불가합니다. 직업을 선택해주세요.",
            { variant: "warning" }
          );
        } else {
          // 오류 응답 처리
          const errorChat = {
            isBot: true,
            content: "메시지 전송 실패",
            date: new Date().toISOString(),
          };
          setChats((prevChats) => [...prevChats, errorChat]);
          enqueueSnackbar("챗봇 응답을 받는데 실패했습니다.", {
            variant: "error",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("메시지 전송 오류:", err);

        // 오류 메시지 추가
        const errorChat = {
          isBot: true,
          content: "메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
          date: new Date().toISOString(),
        };
        setChats((prevChats) => [...prevChats, errorChat]);

        enqueueSnackbar(
          err.response?.data?.message || "메시지 전송에 실패했습니다",
          { variant: "error" }
        );
      } finally {
        setChatbotLoading(false);
      }
    },
    [saveMessageToWorkspace, responseId, uuid, userName, scrollToBottom]
  );

  // 첫 대화 또는 대화 기록 불러오기
  useEffect(() => {
    // 필요한 데이터가 로드되기 전에는 실행하지 않음
    if (!dataLoaded) return;

    // 워크스페이스 대화 모드로 업데이트
    updateWorkspaceChat();

    // 이전 대화 기록 불러오기 또는 새 대화 시작
    const loadChatHistory = async () => {
      // 대화 기록 불러오기 시도
      const hasHistory = await fetchChatHistory();

      // 대화 기록이 없으면 첫 대화 시작
      if (!hasHistory) {
        // 첫 메시지 텍스트
        const initialMessage = "안녕하세요, 진로 상담을 시작해 볼게요!";

        try {
          // CSRF 토큰 획득
          const csrfToken = await getCsrfToken();

          // 백엔드로 첫 메시지 전송
          const response = await axiosInstance.post(
            `/chat/career/mentor`,
            {
              message: initialMessage,
              interests: interestCategory,
              certificates: userCertificates,
              workspaceUuid: uuid,
              userName: userName,
            },
            {
              headers: {
                "X-CSRF-Token": csrfToken,
              },
            }
          );

          if (response.data.success) {
            // 응답 ID 저장
            setResponseId(response.data.previous_response_id);

            // 워크스페이스에 AI 응답만 저장
            await saveMessageToWorkspace("JobtalkAI", response.data.answer);

            // UI에 AI 응답만 표시
            setChats([
              {
                isBot: true,
                content: response.data.answer,
                date: new Date().toISOString(),
              },
            ]);
          } else {
            enqueueSnackbar("챗봇 응답을 받는데 실패했습니다.", {
              variant: "error",
            });
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("첫 메시지 전송 오류:", err);
          enqueueSnackbar(
            err.response?.data?.message || "첫 메시지 전송에 실패했습니다",
            { variant: "error" }
          );

          setChats([
            {
              isBot: true,
              content:
                "죄송합니다. 상담을 시작하는 데 문제가 발생했습니다. 다시 시도해 주세요.",
              date: new Date().toISOString(),
            },
          ]);
        }
      }
    };

    loadChatHistory();
  }, [
    dataLoaded,
    updateWorkspaceChat,
    fetchChatHistory,
    saveMessageToWorkspace,
    interestCategory,
    userCertificates,
    uuid,
    userName,
  ]);

  // 로드맵 저장 핸들러
  const handleSaveRoadmap = useCallback(
    async (jobTitle: string, roadmapData: string) => {
      if (!uuid) return;
      try {
        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        const response = await axiosInstance.post(
          `/workspace/${uuid}/roadmap`,
          {
            jobTitle,
            roadmapData,
          },
          {
            headers: { "X-CSRF-Token": csrfToken },
          }
        );

        if (response.data.success) {
          enqueueSnackbar("로드맵이 성공적으로 저장되었습니다.", {
            variant: "success",
          });
          setStep(6); // 로드맵 뷰어 스텝으로 이동
        } else {
          enqueueSnackbar(
            response.data.message || "로드맵 저장에 실패했습니다.",
            { variant: "error" }
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        enqueueSnackbar(
          err.response?.data?.message || "로드맵 저장에 실패했습니다.",
          { variant: "error" }
        );
      }
    },
    [setStep, uuid]
  );

  // 직업 선택 시 로드맵 생성 핸들러
  const handleSelectJob = useCallback(
    async (job: string) => {
      try {
        setStep(5); // 로드맵 생성(로딩) 스텝으로 이동

        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        // 로드맵 생성 API 호출
        const response = await axiosInstance.post(
          "/chat/career/roadmap",
          {
            jobTitle: job,
            interests: interestCategory,
            certificates: userCertificates,
          },
          {
            headers: { "X-CSRF-Token": csrfToken },
          }
        );

        if (response.data.success) {
          // 로드맵 생성 성공 시, DB 저장 함수 호출
          await handleSaveRoadmap(job, response.data.data);
        } else {
          enqueueSnackbar(
            response.data.message || "로드맵 생성에 실패했습니다.",
            { variant: "error" }
          );
          setStep(3); // 실패 시 다시 챗봇 단계로
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        enqueueSnackbar(
          err.response?.data?.message || "로드맵 생성에 실패했습니다.",
          { variant: "error" }
        );
        setStep(3);
      }
    },
    [setStep, interestCategory, userCertificates, handleSaveRoadmap]
  );

  return (
    <>
      <Stack flex={1}>
        {/* 헤더 */}
        <Box textAlign="center">
          <Typography variant="h4" color="primary" gutterBottom>
            맞춤형 진로 상담
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            <span css={{ fontWeight: "bold" }}>{"[ "}</span>
            {/* 선택된 관심 분야 강조 */}
            <span
              css={{ color: theme.palette.primary.main, fontWeight: "bold" }}
            >
              {selectedInterest}
            </span>
            <span css={{ fontWeight: "bold" }}>{" ]"}</span> 분야에 관한 상담을
            시작합니다.
          </Typography>
        </Box>

        {/* 채팅 영역 */}

        <Stack gap={4} marginTop={10} flex={1}>
          {chats.map((chat, index) => (
            <ChatBox
              key={`chat-${index}`}
              chat={chat}
              chatContent={
                <>
                  {/* 채팅 텍스트 */}
                  <Typography
                    variant="subtitle1"
                    sx={{
                      wordBreak: "break-all",
                    }}
                  >
                    {cleanBotMessage(chat.content)}
                  </Typography>

                  {/* 직업 옵션 버튼 표시 */}
                  {chat.jobOptions && chat.jobOptions.length > 0 && (
                    <JobOptionsButtons
                      jobOptions={chat.jobOptions}
                      onSelectJob={handleSelectJob}
                    />
                  )}
                </>
              }
            />
          ))}

          {/* 챗봇 응답 로딩중 대화상자 */}
          {chatbotLoading && (
            <ChatBox
              chat={{
                isBot: true,
                content: "",
                date: new Date().toISOString(),
              }}
              loading={true}
            />
          )}

          {isRecommendLimit && recommendedJobs.length > 0 && (
            <JobOptionsButtons
              jobOptions={recommendedJobs}
              onSelectJob={handleSelectJob}
            />
          )}
        </Stack>
      </Stack>

      {/* 채팅 입력란 */}
      <Box width="100%" position="sticky" bottom={80}>
        {/* 하단 가림 요소 */}
        <Stack
          width="100%"
          height="80px"
          position="absolute"
          bottom={0}
          left={0}
          bgcolor="white"
          paddingTop={1}
          sx={{
            transform: "translateY(100%)",
          }}
        >
          <Typography
            variant="subtitle2"
            color="text.secondary"
            textAlign="center"
            fontWeight={400}
          >
            잡톡 AI는 실수를 할 수 있습니다. 입력하시기 전 메시지를 확인해
            주세요.
          </Typography>
        </Stack>

        {/* 채팅 입력란 */}
        <ChatInput
          onSend={handleMessageSend}
          placeholder="잡톡 AI에게 무엇이든 물어보세요"
          multiline={true}
          disabled={fetchLoading || isRecommendLimit}
        />

        {/* 남은 채팅 횟수 */}
        <Typography position="absolute" bottom={6} left={16}>
          <span
            css={{
              color: theme.palette.primary.main,
              fontWeight: "bold",
            }}
          >
            {MAX_CHAT_COUNT - chats.filter((chat) => chat.isBot).length}
          </span>{" "}
          회 대화 가능
        </Typography>
      </Box>
    </>
  );
};

export default ChatbotView;
