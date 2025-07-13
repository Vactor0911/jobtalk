import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import MotionWrapper from "../framer-motion/MotionWrapper";
import MotionContainer from "../framer-motion/MotionContainer";

const CHATS = [
  "다른 개발자나 디자이너 등과 협업하는 것을 선호하나요?",
  "응, 특히나 열심히만 하는게 아니라 일할 때 본인이 해야할 것을 다 마치고 다른 업무들도 알아서 하는 사람을 선호해.",
  "코드를 작성하고 시스템 구조를 설계할 때 논리적으로 접근하는 것을 좋아하나요?",
  "응, 논리적으로 접근하는 것을 좋아해. 특히나 시스템 구조를 설계할 때는 논리적인 접근이 필수적이지.",
  "새로운 기술이나 도구를 배우는 것을 즐기나요?",
  "응, 새로운 기술이나 도구를 배우는 것을 즐겨. 특히나 최신 기술 트렌드에 관심이 많아.",
  "프로젝트를 진행할 때, 문제 해결을 위해 창의적인 방법을 찾는 것을 좋아하나요?",
  "응, 문제 해결을 위해 창의적인 방법을 찾는 것을 좋아해. 특히나 복잡한 문제를 해결할 때는 창의적인 접근이 필요하지.",
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
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // 프로필 이미지 크기 반환 함수
  const getAvatarSize = () => {
    if (isMobile) {
      return zoomed ? "40px" : "30px";
    }
    return zoomed ? "60px" : "50px";
  };

  // 텍스트 크기 반환 함수
  const getTextVariant = () => {
    if (isMobile) {
      return "subtitle2";
    }
    return zoomed ? "h5" : "h6";
  };

  return (
    <Stack
      direction={isBot ? "row" : "row-reverse"}
      gap={{
        xs: 1,
        md: 2,
      }}
      alignItems="flex-start"
    >
      {/* 프로필 이미지 */}
      <Stack
        padding={0.5}
        borderRadius={3}
        width={getAvatarSize()}
        height={getAvatarSize()}
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

      <Stack flex={1} alignItems={isBot ? "flex-start" : "flex-end"}>
        {/* 닉네임 */}
        <Typography
          variant={getTextVariant()}
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
            variant={getTextVariant()}
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
      <Box width={getAvatarSize()} />
    </Stack>
  );
};

const Section3 = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [startIndex, setStartIdx] = useState(0);

  // 3초마다 채팅 메시지 인덱스 변경
  useEffect(() => {
    const id = setInterval(() => {
      setStartIdx((prev) => (prev + 1) % CHATS.length);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const visibleChats = Array.from({ length: 3 }, (_, i) => {
    const index = (startIndex + i) % CHATS.length;
    return {
      key: index,
      message: CHATS[index],
      isBot: index % 2 === 0,
    };
  });

  return (
    <Box bgcolor="white">
      <Container maxWidth="lg">
        <Stack
          minHeight="100vh"
          alignItems="center"
          overflow="hidden"
          position="relative"
          paddingY={23}
          gap={5}
        >
          {/* 배경 대화 상자 */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            paddingX={1}
            position="absolute"
            width="100%"
            height="100%"
            top={0}
            left={0}
          >
            {/* 채팅 기록 1 */}
            <Stack
              width={{
                xs: "100%",
                md: "45%",
              }}
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
              display={{
                xs: "none",
                md: "flex",
              }}
              width="45%"
              gap={3}
              sx={{
                filter: "blur(2px)",
              }}
            >
              <ChatBox message={CHATS[0]} isBot={true} />
              <ChatBox message={CHATS[1]} isBot={false} />
              <ChatBox message={CHATS[2]} isBot={true} />
            </Stack>
          </Stack>

          {/* 헤더 */}
          <MotionContainer>
            <MotionWrapper>
              <Typography
                variant="h3"
                textAlign="center"
                position="relative"
                zIndex={2}
              >
                잡톡AI와 이야기하며, 함께 알아가요!
              </Typography>
            </MotionWrapper>
          </MotionContainer>

          {/* 채팅 애니메이션 */}
          <Stack height="65vh">
            <Paper
              sx={{
                borderRadius: 5,
                boxShadow: {
                  xs: 15,
                  sm: "0 0 30px 20px rgba(0, 0, 0, 0.2)",
                },
                overflow: "hidden",
                position: "relative",
                zIndex: 1,
              }}
            >
              <Stack
                component={motion.div}
                layout
                width={{ xs: "75vw", md: "50vw" }}
                maxWidth={600}
                padding={{
                  xs: 2,
                  sm: 3,
                }}
                gap={{ xs: 3, sm: 6 }}
                overflow="hidden"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleChats
                    .slice(0, isMobile ? 2 : 3)
                    .map(({ key, message, isBot }) => (
                      <motion.div
                        key={key}
                        layout="position"
                        initial={{ opacity: 1, y: 200 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -200 }}
                        transition={{ type: "tween", duration: 0.45 }}
                      >
                        <ChatBox message={message} isBot={isBot} zoomed />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Section3;
