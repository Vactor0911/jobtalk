import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

const CHATS = [
  "다른 개발자나 디자이너 등과 협업하는 것을 선호하나요?",
  "응, 특히나 열심히만 하는게 아니라 일할 때 본인이 해야할 것을 다 마치고 다른 업무들도 알아서 하는 사람을 선호해.",
  "코드를 작성하고 시스템 구조를 설계할 때 논리적으로 접근하는 것을 좋아하나요?",
];

// 대화상자 컴포넌트
interface ChatBoxProps {
  message: string;
  isBot: boolean;
  zoomed?: boolean;
}

const ChatBox = (props: ChatBoxProps) => {
  const { message, isBot, zoomed } = props;

  const theme = useTheme();

  return (
    <Stack
      direction={isBot ? "row" : "row-reverse"}
      gap={2}
      alignItems="flex-start"
    >
      {/* 프로필 이미지 */}
      <Stack
        padding={0.5}
        borderRadius={3}
        width={zoomed ? "60px" : "50px"}
        height={zoomed ? "60px" : "50px"}
        border={
          isBot ? `2px solid ${theme.palette.primary.main}` : "2px solid black"
        }
      >
        {isBot ? (
          <SmartToyRoundedIcon
            color="primary"
            sx={{
              width: "100%",
              height: "100%",
            }}
          />
        ) : (
          <PersonRoundedIcon
            sx={{
              width: "100%",
              height: "100%",
              color: theme.palette.text.primary,
            }}
          />
        )}
      </Stack>

      <Stack flex={1}>
        {/* 닉네임 */}
        <Typography
          variant={zoomed ? "h5" : "h6"}
          color={isBot ? "primary" : "text.primary"}
          fontWeight="bold"
          marginX={0.5}
          textAlign={isBot ? "left" : "right"}
        >
          {isBot ? "잡톡 AI" : "나"}
        </Typography>

        {/* 대화 내용 */}
        <Box padding={1} paddingX={2} bgcolor="#f4f4f4" borderRadius={2}>
          <Typography
            variant={zoomed ? "h5" : "h6"}
            fontWeight={500}
            sx={{
              textWrap: "wrap",
            }}
          >
            {message}
          </Typography>
        </Box>
      </Stack>

      {/* 여백 */}
      <Box width="50px" />
    </Stack>
  );
};

const Section3 = () => {
  return (
    <Box bgcolor="white">
      <Container maxWidth="lg">
        <Stack height="100vh" justifyContent="center">
          <Stack
            direction="row"
            justifyContent="space-between"
            position="relative"
          >
            {/* 채팅 기록 1 */}
            <Stack
              width="40%"
              gap={3}
              sx={{
                filter: "blur(2px)",
              }}
            >
              <ChatBox message={CHATS[0]} isBot={true} />
              <ChatBox message={CHATS[1]} isBot={false} />
              <ChatBox message={CHATS[2]} isBot={true} />
            </Stack>

            {/* 채팅 기록 2 */}
            <Stack
              width="40%"
              gap={3}
              sx={{
                filter: "blur(2px)",
              }}
            >
              <ChatBox message={CHATS[0]} isBot={true} />
              <ChatBox message={CHATS[1]} isBot={false} />
              <ChatBox message={CHATS[2]} isBot={true} />
            </Stack>

            {/* 채팅 애니메이션 */}
            <Paper
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                borderRadius: 5,
                zIndex: 3,
                boxShadow: "0 0 30px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              <Stack width="37vw" gap={6} padding={2} paddingX={3}>
                <ChatBox message={CHATS[0]} isBot={true} zoomed />
                <ChatBox message={CHATS[1]} isBot={false} zoomed />
                <ChatBox message={CHATS[2]} isBot={true} zoomed />
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Section3;
