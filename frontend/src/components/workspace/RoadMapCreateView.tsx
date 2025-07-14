import { Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
    <Stack
      width="100%"
      justifyContent="center"
      sx={{
        position: "relative",
        height: "9rem",
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
          style={{
            position: "absolute",
            width: "100%",
          }}
        >
          <Typography
            variant={isMobile ? "h4" : "h3"}
            color="text.secondary"
            textAlign="center"
            fontWeight={500}
            sx={{ lineHeight: "3rem", textWrap: "pretty" }}
          >
            {currentItem}
          </Typography>
        </motion.div>
      </AnimatePresence>
    </Stack>
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
          return Math.min(prev + Math.max(0.5, Math.random()) * 2, 80);
        } else {
          clearInterval(interval);
          return 100;
        }
      });
    }, Math.max(500, Math.random() * 1500));

    if (roadmapCreated) {
      clearInterval(interval);
      setLoadingPercentage(100);
    }
  }, [roadmapCreated]);

  return (
    <Stack
      justifyContent="space-around"
      alignItems="center"
      paddingBottom={2}
      flex={1}
    >
      {/* 헤더 */}
      <Typography variant="h3" color="primary">
        로드맵 생성 중
      </Typography>

      {/* 로딩 텍스트 */}
      <LoadingText
        items={[
          "잡톡 AI가 자료를 정리하는 중...",
          "로드맵에 영감을 불어넣는 중...",
          "잡톡 AI가 폴더를 뒤적거리는 중...",
          "로드맵에 필요한 정보를 검색하는 중...",
          "예쁜 로드맵을 만들기 위해 고민하는 중...",
          "잡톡 AI가 로드맵에 노드를 그리는 중...",
          "떨어뜨린 색연필을 줍는 중...",
          "잡톡 AI가 그리면서 마실 커피 타는중...",
          "노드를 선으로 연결하는 중...",
        ]}
      />

      <Stack width="100%" gap={2}>
        {/* 로딩바 */}
        <LoadingBar percentage={roadmapCreated ? 100 : loadingPercentage} />

        <Typography
          variant="subtitle1"
          color="text.secondary"
          textAlign="center"
          sx={{
            textWrap: "pretty",
          }}
        >
          로드맵 생성은 약 30초 정도 소요됩니다. 잠시만 기다려주세요.
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RoadMapCreateView;
