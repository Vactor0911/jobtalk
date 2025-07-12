import { Box, Stack, Typography } from "@mui/material";
import LoadingBar from "../LoadingBar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingTextProps {
  items: string[];
}

const slideVariants = {
  enter: { y: "-100%", opacity: 0 }, // 위에서 시작
  center: { y: 0, opacity: 1 }, // 중앙에 머무름
  exit: { y: "100%", opacity: 0 }, // 아래로 사라짐
};

const LoadingText = (props: LoadingTextProps) => {
  const { items } = props;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((prevIndex) => (prevIndex + 1) % items.length),
      4000 // 4초마다 변경
    );

    return () => {
      clearInterval(id);
    };
  }, [items.length]);

  const currentItem = items[index];

  return (
    <Box
      width="100%"
      sx={{
        position: "relative",
        height: "3rem",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem} // key 교체시 새로운 애니메이션 실행
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ position: "absolute", width: "100%" }}
        >
          <Typography
            variant="h3"
            color="text.secondary"
            textAlign="center"
            fontWeight={500}
            sx={{ lineHeight: "3rem" }}
          >
            {currentItem}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

interface RoadMapCreateViewProps {
  roadmapCreated?: boolean;
}

const RoadMapCreateView = (props: RoadMapCreateViewProps) => {
  const { roadmapCreated } = props;

  const [loadingPercentage, setLoadingPercentage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingPercentage((prev) => {
        if (!roadmapCreated) {
          return Math.min(prev + Math.round(Math.random() * 2), 80);
        } else {
          clearInterval(interval);
          return 100;
        }
      });
    }, Math.max(500, Math.random() * 2000));
  });

  return (
    <Stack alignItems="center" paddingBottom={2} flex={1}>
      {/* 헤더 */}
      <Typography variant="h4" color="primary">
        로드맵 생성
      </Typography>

      <Stack
        width="100%"
        justifyContent="space-between"
        alignItems="center"
        flex={1}
      >
        {/* 여백 */}
        <Box />

        {/* 로딩 텍스트 */}
        <LoadingText
          items={[
            "잡톡 AI가 문서 정리하는중...",
            "로드맵에 노드 그리는중...",
            "노드를 선으로 연결하는중...",
          ]}
        />

        <Stack width="100%" gap={2}>
          {/* 로딩바 */}
          <LoadingBar percentage={loadingPercentage} />

          <Typography
            variant="subtitle1"
            color="text.secondary"
            textAlign="center"
          >
            로드맵 생성은 약 1분 정도 소요됩니다. 잠시만 기다려주세요.
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RoadMapCreateView;
