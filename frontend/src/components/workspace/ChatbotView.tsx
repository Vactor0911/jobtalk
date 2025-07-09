import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import { grey } from "@mui/material/colors";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import axiosInstance from "../../utils/axiosInstance";
import { jobTalkLoginStateAtom, profileImageAtom } from "../../state";
import { useAtomValue } from "jotai";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

interface Chat {
  isBot: boolean; // 챗봇인지 여부
  content: string; // 메시지 내용
  date: string; // 메시지 전송 날짜
}

const ChatbotView = () => {
  const theme = useTheme();

  const [chats, setChats] = useState<Chat[]>([]);
  const loginState = useAtomValue(jobTalkLoginStateAtom); // 로그인 상태
  const profileImage = useAtomValue(profileImageAtom); // 프로필 이미지 상태

  // 메시지 입력 상태
  const [input, setInput] = useState("");
  const [isInputLoading, setIsInputLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);

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

  // 메시지 전송
  const handleSendButtonClick = useCallback(async () => {
    // 이미 전송중이라면 종료
    if (isInputLoading) {
      return;
    }

    setIsInputLoading(true);

    try {
      // 보낼 메시지가 없다면 종료
      if (!input.trim()) {
        return;
      }

      // 보낸 메시지 추가
      const newChat = {
        isBot: false,
        content: input,
        date: new Date().toISOString(),
      };

      setChats((prevChats) => [...prevChats, newChat]);
      setInput("");

      // 메시지 전송
      const response = await axiosInstance.post(`/chat/test`, {
        message: input,
        previousResponseId: responseId, // 직전 응답 ID 전달
        interests: "정보기술(IT)", // 관심분야
        certificates: "정보처리기사, SQLD", // 보유 자격증
      });

      if (response.data.success) {
        const newChat = {
          isBot: true,
          content: response.data.answer,
          date: new Date().toISOString(),
        };
        setChats((prevChats) => [...prevChats, newChat]);
        setResponseId(response.data.responseId); // 응답 ID 저장
      } else {
        const newChat = {
          isBot: true,
          content: "메시지 전송 실패",
          date: new Date().toISOString(),
        };
        setChats((prevChats) => [...prevChats, newChat]);
      }
    } catch (err) {
      const newChat = {
        isBot: true,
        content: `메시지 전송 실패: ${err}`,
        date: new Date().toISOString(),
      };
      setChats((prevChats) => [...prevChats, newChat]);
    } finally {
      setIsInputLoading(false);
    }
  }, [input, isInputLoading, responseId]);

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
              <Typography variant="subtitle1">{chat.content}</Typography>
            </Box>
          </Stack>
        </Stack>
      ))}

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
        >
          <Typography variant="subtitle1" fontWeight="bold">
            입력
          </Typography>
        </Button>
      </Box>
    </Stack>
  );
};

export default ChatbotView;
