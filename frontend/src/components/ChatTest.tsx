import {
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useCallback, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const ChatTest = () => {
  const theme = useTheme();
  const [messages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [responseId, setResponseId] = useState<string | null>(null);

  // 메시지 입력
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value);
    },
    []
  );

  // 메시지 전송
  const handleSendButtonClick = useCallback(async () => {
    setIsLoading(true);

    try {
      // 보낼 메시지가 없다면 종료
      if (!input.trim()) {
        return;
      }

      // 보낸 메시지 추가
      messages.push(input);
      setInput("");

      // 메시지 전송
      const response = await axiosInstance.post(`/chat/test`, {
        message: input,
        previousResponseId: responseId, // 직전 응답 ID 전달
      });

      if (response.data.success) {
        messages.push(response.data.answer);
        setResponseId(response.data.responseId); // 응답 ID 저장
        console.log("응답:", response.data);
      } else {
        messages.push("메시지 전송 실패");
      }
    } catch (err) {
      messages.push(`메시지 전송 실패 : ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, responseId]);

  return (
    <Stack padding={1} gap={2}>
      {/* 채팅창 */}
      <OutlinedInput
        placeholder="메시지를 입력하세요"
        value={input}
        onChange={handleInputChange}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              color="primary"
              loading={isLoading}
              disabled={isLoading || !input.trim()}
              onClick={handleSendButtonClick}
            >
              <SendRoundedIcon />
            </IconButton>
          </InputAdornment>
        }
      />

      {/* 메시지 기록 */}
      <Stack gap={2} sx={{
        overflowY: "scroll",
        height: "calc(100vh - 300px)", // Adjust height as needed
      }}>
        {messages.map((message, index) => (
          <Paper
            elevation={3}
            key={index}
            sx={{
              display: "flex",
              padding: 1,
              alignSelf: index % 2 === 0 ? "flex-end" : "flex-start",
              backgroundColor:
                index % 2 === 0 ? theme.palette.primary.main : "inherit",
            }}
          >
            <Typography
              variant="subtitle1"
              color={index % 2 === 0 ? "white" : "black"}
            >
              {message}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
};

export default ChatTest;
