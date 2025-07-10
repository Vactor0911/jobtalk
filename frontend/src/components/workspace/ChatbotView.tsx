import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { grey } from "@mui/material/colors";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import axiosInstance, { getCsrfToken } from "../../utils/axiosInstance";
import {
  jobTalkLoginStateAtom,
  profileImageAtom,
  selectedInterestAtom,
} from "../../state";
import { useAtomValue } from "jotai";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { enqueueSnackbar } from "notistack";
import JobOptionsButtons from "./JobOptionsButtons";
import { useParams } from "react-router";

interface Chat {
  isBot: boolean; // 챗봇인지 여부
  content: string; // 메시지 내용
  date: string; // 메시지 전송 날짜
  jobOptions?: string[]; // 직업 옵션이 있는 경우
}

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [isInputLoading, setIsInputLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [, setChatHistoryLoaded] = useState(false); // 이전 대화 불러온 여부
  const loginState = useAtomValue(jobTalkLoginStateAtom); // 로그인 상태
  const profileImage = useAtomValue(profileImageAtom); // 프로필 이미지 상태
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

  // 워크스페이스와 사용자 기본 정보 한번에 가져오기
  const fetchBasicInfo = useCallback(async () => {
    if (!uuid) return;

    try {
      setIsInputLoading(true);
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
      setIsInputLoading(false);
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

  // 메시지 전송 함수
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (isInputLoading || !message.trim()) return;
      setIsInputLoading(true);

      try {
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

        // 1. 토큰 경고/차단 UX
        if (response.data.usage?.total_tokens >= 15000) {
          enqueueSnackbar("질문/응답이 너무 깁니다. 더 짧게 입력해주세요.", {
            variant: "error",
          });
          setIsInputLoading(false);
          return;
        }

        if (response.data.success) {
          // 강제 직업 추천 단계인 경우
          setIsRecommendStage(!!response.data.isRecommendStage);
          setForceRecommendCount(response.data.forceRecommendCount ?? 0);
          setIsRecommendLimit(!!response.data.isRecommendLimit);

          if (response.data.questionCount === 8) {
            enqueueSnackbar(
              "최대 15번까지만 질의응답이 진행됩니다. 사용자는 성의껏 대답해주세요.",
              {
                variant: "info",
              }
            );
          }

          // 직업 옵션 누적
          const jobOptions = extractJobOptions(response.data.answer);
          setRecommendedJobs((prev) => {
            if (!jobOptions) return prev;
            // 중복 제거
            return Array.from(new Set([...prev, ...jobOptions]));
          });

          const newResponseId = response.data.previous_response_id;
          // 비용 확인용 콘솔
          console.log("비용 : ", response.data.usage.total_tokens);

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
        setIsInputLoading(false);
      }
    },
    [isInputLoading, responseId, uuid, userName, saveMessageToWorkspace]
  );

  // 사용자 메시지 전송 핸들러
  const handleSendButtonClick = useCallback(async () => {
    if (isInputLoading || !input.trim()) return;

    // 사용자 메시지 UI에 표시
    const userChat = {
      isBot: false,
      content: input,
      date: new Date().toISOString(),
    };
    setChats((prevChats) => [...prevChats, userChat]);

    // 사용자 메시지 워크스페이스에 저장
    await saveMessageToWorkspace("user", input);

    // 입력 초기화 및 메시지 전송
    const messageToSend = input;
    setInput("");
    await handleSendMessage(messageToSend);
  }, [input, isInputLoading, saveMessageToWorkspace, handleSendMessage]);

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

            console.log("비용 : ", response.data.usage.total_tokens);

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

  // 프로필 이미지 요소
  const profileAvatar = useMemo(() => {
    return (
      <Avatar
        src={profileImage || undefined}
        sx={{
          bgcolor: grey[400],
          width: 40,
          height: 40,
        }}
      >
        {!profileImage &&
          (loginState.userName ? (
            loginState.userName.charAt(0).toUpperCase()
          ) : (
            <FaceRoundedIcon
              sx={{
                fontSize: "2rem",
              }}
            />
          ))}
      </Avatar>
    );
  }, [loginState.userName, profileImage]);

  // 메시지 입력
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value);
    },
    []
  );

  // 입력란 키 다운
  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter 키 입력 시
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // 기본 Enter 동작 방지
        handleSendButtonClick(); // 메시지 전송 함수 호출
      }
    },
    [handleSendButtonClick]
  );

  return (
    <Stack>
      <Box textAlign="center">
        <Typography variant="h4" color="primary" gutterBottom>
          맞춤형 진로 상담
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {selectedInterest} 분야에 관한 상담을 시작합니다.
        </Typography>
      </Box>
      <Stack gap={4} marginTop={10} flex={1}>
        {chats.map((chat, index) => (
          <Stack
            width="66%"
            direction={chat.isBot ? "row" : "row-reverse"}
            key={`chat-${index}`}
            alignSelf={chat.isBot ? "flex-start" : "flex-end"}
            alignItems="flex-start"
            gap={2}
          >
            {/* 프로필 이미지 */}
            <Stack
              padding={1}
              borderRadius={3}
              border={`2px solid ${
                chat.isBot ? theme.palette.primary.main : grey[400]
              }`}
            >
              {chat.isBot ? (
                <SmartToyRoundedIcon
                  color="primary"
                  sx={{ width: 40, height: 40 }}
                />
              ) : (
                profileAvatar
              )}
            </Stack>

            <Stack>
              {/* 닉네임 */}
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color={chat.isBot ? "primary" : "inherit"}
                alignSelf={chat.isBot ? "flex-start" : "flex-end"}
              >
                {chat.isBot ? "잡톡AI" : loginState.userName}
              </Typography>

              {/* 대화 내용 */}
              <Box
                padding={0.5}
                paddingX={1}
                borderRadius={2}
                bgcolor={grey[100]}
              >
                <Typography variant="subtitle1">
                  {cleanBotMessage(chat.content)}
                </Typography>
                {/* 직업 옵션 버튼 표시 */}
                {chat.jobOptions && chat.jobOptions.length > 0 && (
                  <JobOptionsButtons
                    jobOptions={chat.jobOptions}
                    onSelectJob={(job) => {
                      // TODO: 직업 선택 시 로드맵 요청 등 처리
                      enqueueSnackbar(`선택한 직업: ${job}`, {
                        variant: "success",
                      });
                    }}
                  />
                )}
              </Box>
            </Stack>
          </Stack>
        ))}

        {isRecommendLimit && recommendedJobs.length > 0 && (
          <JobOptionsButtons
            jobOptions={recommendedJobs}
            onSelectJob={(job) => {
              enqueueSnackbar(`선택한 직업: ${job}`, { variant: "success" });
              // TODO: 선택 후 로드맵 요청 등 추가
            }}
          />
        )}

        {/* 채팅 입력란 */}
        <Box position="relative" width="100%" marginTop="auto">
          {/* 입력란 */}
          <TextField
            fullWidth
            multiline
            placeholder="잡톡AI에게 무엇이든 물어보세요"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            disabled={isInputLoading || isRecommendLimit}
            slotProps={{
              input: {
                sx: { paddingBottom: 6, borderRadius: 3 },
              },
            }}
          />

          {/* 입력 버튼 */}
          <Button
            endIcon={<SendRoundedIcon />}
            loading={isInputLoading}
            sx={{
              position: "absolute",
              bottom: 6,
              right: 6,
              borderRadius: "50px",
            }}
            onClick={handleSendButtonClick}
            disabled={isInputLoading || isRecommendLimit}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              입력
            </Typography>
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
};

export default ChatbotView;
