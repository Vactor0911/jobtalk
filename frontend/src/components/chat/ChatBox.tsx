import { Avatar, Box, Stack, Typography, useTheme } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useAtomValue } from "jotai";
import { jobTalkLoginStateAtom, profileImageAtom } from "../../state";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import { useMemo } from "react";

export interface Chat {
  isBot: boolean; // 챗봇인지 여부
  content: string; // 메시지 내용
  date: string; // 메시지 전송 날짜
  jobOptions?: string[]; // 직업 옵션이 있는 경우
}

interface ChatDialogsProps {
  chat: Chat;
  chatContent?: React.ReactNode; // 대화 내용 컴포넌트
}

const ChatBox = (props: ChatDialogsProps) => {
  const { chat, chatContent } = props;

  const theme = useTheme();

  const loginState = useAtomValue(jobTalkLoginStateAtom);
  const profileImage = useAtomValue(profileImageAtom); // 프로필 이미지 상태

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

  return (
    <Stack
      width={{
        xs: "85%",
        sm: "75%",
        md: "66%",
      }}
      direction={chat.isBot ? "row" : "row-reverse"}
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
          <SmartToyRoundedIcon color="primary" sx={{ width: 40, height: 40 }} />
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
          width="100%"
          padding={0.5}
          paddingX={1}
          borderRadius={2}
          bgcolor={grey[100]}
        >
          {chatContent ? (
            chatContent
          ) : (
            <Typography
              variant="subtitle1"
              sx={{
                wordBreak: "break-all",
              }}
            >
              {chat.content}
            </Typography>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};

export default ChatBox;
