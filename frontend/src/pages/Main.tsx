import { Stack } from "@mui/material";
import TitledContainer from "../components/TitledContainer";
import Test from "../components/Test";
import JobSearchChat from "../components/JobSearchChat";

const Main = () => {
  return (
    <Stack padding={2} direction="row" height="calc(100vh - 64px)" gap={2}>
      {/* 세부사항 */}
      <TitledContainer
        title="세부사항"
        sx={{
          flex: 1,
          maxWidth: 450,
        }}
      ></TitledContainer>

      {/* 로드맵 */}
      <TitledContainer
        title="로드맵"
        sx={{
          flex: 2,
        }}
      >
        <Test />
      </TitledContainer>

      {/* 챗봇 - 원본 */}
      {/* <TitledContainer
        title="챗봇"
        sx={{
          flex: 1,
          maxWidth: 450,
        }}
      >
        <Stack height="100%">
          <Box flex={1} />

          <Paper
            variant="outlined"
            sx={{ height: "100px", borderRadius: 4 }}
          ></Paper>
        </Stack>
      </TitledContainer> */}

      {/* 챗봇 - 직업 검색 테스트 */}
      <TitledContainer
        title="챗봇"
        sx={{
          flex: 1,
          maxWidth: 450,
        }}
      >
        <JobSearchChat />
      </TitledContainer>
    </Stack>
  );
};

export default Main;
