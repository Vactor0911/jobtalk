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
import { useCallback, useEffect, useState } from "react";
import MotionWrapper from "../framer-motion/MotionWrapper";
import MotionContainer from "../framer-motion/MotionContainer";

const CHATS = [
  "프로그래밍을 시작하게 된 계기가 무엇인가요?",
  "고등학교 때 HTML로 간단한 웹페이지를 만들고 나서 흥미를 느꼈어요.",
  "어떤 개발 분야에 특히 관심이 있나요? 프론트엔드, 백엔드, 전체 중에 하나를 골라주세요.",
  "프론트엔드 디자인과 사용자 인터페이스에 흥미가 가장 많아요.",
  "개발을 할 때 가장 재미있거나 성취감을 느끼는 순간은 언제인가요?",
  "기능이 제대로 작동하고 화면에 잘 표현될 때 정말 뿌듯해요.",
  "코딩 외에 관심 있는 활동이나 취미가 있다면 어떤 것이 있나요?",
  "UI 디자인 관련 유튜브 보거나, Figma로 인터페이스 시안 만드는 걸 좋아해요.",
  "협업 프로젝트를 해본 경험이 있나요? 있었다면 어떤 역할을 맡았나요?",
  "대학교 1학년 때 팀 과제로 간단한 웹페이지 만들면서 프론트엔드 역할 했어요.",
  "새로운 기술이나 프레임워크를 배울 때 어떤 방식으로 접근하나요?",
  "유튜브 강의와 공식 문서를 같이 보면서 직접 코드를 따라 쳐봐요.",
  "개발자로서 어떤 점이 가장 중요하다고 생각하나요?",
  "기술도 중요하지만, 사용자를 이해하고 꾸준히 배우는 자세가 더 중요하다고 생각해요.",
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
  const getAvatarSize = useCallback(() => {
    if (isMobile) {
      return zoomed ? "40px" : "30px";
    }
    return zoomed ? "60px" : "50px";
  }, [isMobile, zoomed]);

  // 텍스트 크기 반환 함수
  const getTextVariant = useCallback(() => {
    if (isMobile) {
      return "subtitle2";
    }
    return zoomed ? "h5" : "h6";
  }, [isMobile, zoomed]);

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
              <ChatBox message={CHATS[2]} isBot={true} />
              <ChatBox message={CHATS[3]} isBot={false} />
              <ChatBox message={CHATS[4]} isBot={true} />
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
              <ChatBox message={CHATS[7]} isBot={false} />
              <ChatBox message={CHATS[8]} isBot={true} />
              <ChatBox message={CHATS[9]} isBot={false} />
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
