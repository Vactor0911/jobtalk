import { useCallback, useState } from "react";
import type { Chat } from "../chat/ChatBox";
import { Box, Stack } from "@mui/material";
import ChatBox from "../chat/ChatBox";
import ChatInput from "../chat/ChatInput";

const RoadMapChatBot = () => {
  // 채팅 관련 상태
  const [chats, setChats] = useState<Chat[]>([]); // 채팅 메시지 목록
  const [chatbotLoading, setChatbotLoading] = useState(false); // 챗봇 응답 로딩 상태

  // 메시지 전송
  const handleMessageSend = useCallback((message: string) => {}, []);

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
          placeholder="잡톡 AI에게 무엇이든 물어보세요"
          multiline={true}
        />
      </Box>
    </Stack>
  );
};

export default RoadMapChatBot;
