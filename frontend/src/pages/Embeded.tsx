import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import { useCallback } from "react";
import GitHubIcon from "../assets/icons/github.svg";
import YoutubeIcon from "../assets/icons/youtube.svg";

interface LinkButtonProps {
  text: string;
  iconSrc: string;
  to: string;
}

const LinkButton = (props: LinkButtonProps) => {
  const { text, iconSrc, to } = props;

  // 링크 클릭
  const handleClick = useCallback(() => {
    window.open(to, "_blank");
  }, [to]);

  return (
    <Stack
      alignItems="center"
      gap={1}
      sx={{
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      {/* 아이콘 */}
      <Stack
        width="60px"
        height="60px"
        justifyContent="center"
        alignItems="center"
      >
        <Box component="img" src={iconSrc} width="100%" />
      </Stack>

      {/* 텍스트 */}
      <Typography variant="h6">{text}</Typography>
    </Stack>
  );
};

const Embeded = () => {
  const theme = useTheme();

  // 바로 시작하기 버튼 클릭
  const handleStartButtonClick = useCallback(() => {
    window.open("https://vactor0911.github.io/jobtalk/", "_blank");
  }, []);

  return (
    <Stack
      height="calc(100vh - 64px)"
      justifyContent="space-evenly"
      alignItems="center"
    >
      {/* 슬로건 */}
      <Typography variant="h3" textAlign="center">
        AI 기반 진로 로드맵 솔루션,{" "}
        <span
          css={{
            color: theme.palette.primary.main,
          }}
        >
          잡톡
        </span>
      </Typography>

      {/* 바로가기 */}
      <Stack alignItems="center" gap={5}>
        {/* 로고 */}
        <Stack direction="row" alignItems="center" gap={2}>
          {/* 텍스트 */}
          <Typography variant="h2" color="primary">
            JobTalk
          </Typography>

          {/* 아이콘 */}
          <WorkRoundedIcon
            color="primary"
            sx={{
              fontSize: "4rem",
            }}
          />
        </Stack>

        {/* 바로 시작하기 버튼 */}
        <Button
          variant="contained"
          color="primary"
          sx={{
            padding: 2,
            paddingX: 4,
            borderRadius: 4,
          }}
          onClick={handleStartButtonClick}
        >
          <Typography variant="h4" color="white">
            바로 시작하기
          </Typography>
        </Button>
      </Stack>

      {/* 하단 여백 */}
      <Box />

      {/* 외부 링크 */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        gap={5}
        position="absolute"
        bottom={50}
        right={80}
      >
        {/* 깃허브 리포지토리 */}
        <LinkButton
          text="GitHub"
          iconSrc={GitHubIcon}
          to="https://github.com/Vactor0911/jobtalk"
        />

        {/* 유튜브 */}
        <LinkButton
          text="YouTube"
          iconSrc={YoutubeIcon}
          to="https://www.youtube.com/watch?v=XipNcXi-sx8"
        />
      </Stack>
    </Stack>
  );
};

export default Embeded;
