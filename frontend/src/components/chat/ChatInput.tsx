import { Box, Button, TextField, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

interface ChatInputProps {
  onSend: (message: string) => void; // 메시지 전송 함수
  onError?: (error: Error) => void; // 오류 처리 함수
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
}

const ChatInput = (props: ChatInputProps) => {
  const { onSend, onError, placeholder, multiline, disabled } = props;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    []
  );

  // 메시지 전송
  const handleMessageSend = useCallback(
    (message: string) => {
      // 로딩 중이거나 비활성화 상태면 종료
      if (loading || disabled) {
        return;
      }

      // onSend 함수가 정의되어 있지 않으면 종료
      if (!onSend || typeof onSend !== "function") {
        return;
      }

      // 메시지가 비어있으면 종료
      if (!message || !message.trim()) {
        return;
      }

      // 메시지 전송
      setLoading(true);

      try {
        onSend(message); // 메시지 전송
        setInput(""); // 입력란 초기화
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error); // 오류 처리 함수 호출
        }
      } finally {
        setLoading(false); // 로딩 상태 해제
      }
    },
    [disabled, loading, onError, onSend]
  );

  // Enter 키로 메시지 전송
  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter 키 입력 시
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // 기본 Enter 동작 방지

        // 메시지 전송
        handleMessageSend(input.trim());
      }
    },
    [handleMessageSend, input]
  );

  // 입력 버튼 클릭
  const handleSendButtonClick = useCallback(() => {
    handleMessageSend(input.trim());
  }, [handleMessageSend, input]);

  return (
    <Box position="relative" width="100%">
      {/* 입력란 */}
      <TextField
        fullWidth
        multiline={multiline}
        placeholder={placeholder}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        slotProps={{
          input: {
            sx: { paddingBottom: 6, borderRadius: 3 },
          },
        }}
      />

      {/* 입력 버튼 */}
      <Button
        endIcon={<SendRoundedIcon />}
        loading={loading}
        sx={{
          position: "absolute",
          bottom: 6,
          right: 6,
          borderRadius: "50px",
        }}
        onClick={handleSendButtonClick}
        disabled={!input || input.trim() === "" || disabled}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          입력
        </Typography>
      </Button>
    </Box>
  );
};

export default ChatInput;
