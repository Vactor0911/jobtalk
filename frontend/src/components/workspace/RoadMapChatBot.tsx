import { Box, Stack } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import axiosInstance, { getCsrfToken } from "../../utils/axiosInstance";
import { useParams } from "react-router";
import ChatBox from "../chat/ChatBox";
import ChatInput from "../chat/ChatInput";
import { enqueueSnackbar } from "notistack";

interface Chat {
  isBot: boolean;
  content: string;
  date: string;
}

const RoadMapChatBot = () => {
  const { uuid } = useParams<{ uuid: string }>(); // 워크스페이스 uuid
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatbotLoading, setChatbotLoading] = useState(false);

  // 로드맵 챗봇 대화 내역 불러오기
  const fetchChats = useCallback(async () => {
    if (!uuid) return;
    try {
      const res = await axiosInstance.get(
        `/workspace/${uuid}/roadmap-chatbot/chats`
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setChats(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.data.data.map((chat: any) => ({
            isBot: chat.role === "JobtalkAI",
            content: chat.content,
            date: new Date(chat.created_at).toISOString(),
          }))
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setChats([
        {
          isBot: true,
          content: "대화 내역을 불러오지 못했습니다.",
          date: new Date().toISOString(),
        },
      ]);
    }
  }, [uuid]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // 메시지 전송
  const handleMessageSend = useCallback(
    async (message: string) => {
      if (!uuid || !message.trim()) return;

      setChats((prev) => [
        ...prev,
        { isBot: false, content: message, date: new Date().toISOString() },
      ]);
      setChatbotLoading(true);

      try {
        // CSRF 토큰 획득
        const csrfToken = await getCsrfToken();

        // 1. 챗봇 응답 요청
        const res = await axiosInstance.post("/chat/roadmap/chatbot", {
          workspaceUuid: uuid,
          message,
        });

        // rate limit 등 에러 메시지 처리
        if (res.data?.success === false && res.data?.message) {
          enqueueSnackbar(res.data.message, { variant: "error" });
          setChats((prev) => [
            ...prev,
            {
              isBot: true,
              content: res.data.message,
              date: new Date().toISOString(),
            },
          ]);
          return;
        }

        // 2. 챗봇 응답 UI에 추가
        setChats((prev) => [
          ...prev,
          {
            isBot: true,
            content: res.data.answer || "AI 응답을 받지 못했습니다.",
            date: new Date().toISOString(),
          },
        ]);

        // 3. 대화 저장 (user/AI 모두)
        await axiosInstance.post(
          `/workspace/${uuid}/roadmap-chatbot/chats`,
          {
            role: "user",
            content: message,
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken,
            },
          }
        );
        await axiosInstance.post(
          `/workspace/${uuid}/roadmap-chatbot/chats`,
          {
            role: "JobtalkAI",
            content: res.data.answer,
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken,
            },
          }
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        // 응답이 너무 길거나 기타 에러 메시지 처리
        const errorMsg =
          err?.response?.data?.message ||
          "챗봇 응답 오류입니다. 잠시 후 다시 시도해주세요.";
        enqueueSnackbar(errorMsg, { variant: "error" });
        setChats((prev) => [
          ...prev,
          {
            isBot: true,
            content: errorMsg,
            date: new Date().toISOString(),
          },
        ]);
      } finally {
        setChatbotLoading(false);
      }
    },
    [uuid]
  );

  return (
    <Stack gap={4} height="100%">
      {/* 채팅 기록 */}
      {chats.map((chat, index) => (
        <ChatBox key={`chat-${index}`} chat={chat} />
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

      {/* 채팅 입력란 */}
      <Box width="100%" marginTop="auto">
        <ChatInput
          onSend={handleMessageSend}
          placeholder="로드맵 AI에게 무엇이든 물어보세요"
          multiline={true}
        />
      </Box>
    </Stack>
  );
};

export default RoadMapChatBot;
