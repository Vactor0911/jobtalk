import { Stack } from "@mui/material";
import TitledContainer from "../components/TitledContainer";
import { Panel, PanelGroup } from "react-resizable-panels";
import StyledPanelResizeHandle from "../components/StyledPanelResizeHandle";
import ChatTest from "../components/ChatTest";

const Workspace = () => {
  return (
    <Stack padding={2} direction="row" height="calc(100vh - 64px)">
      <PanelGroup direction="horizontal">
        {/* 세부사항 패널 */}
        <Panel
          defaultSize={25}
          minSize={20}
          css={{
            height: "100%",
          }}
        >
          <TitledContainer title="세부사항"></TitledContainer>
        </Panel>

        {/* 구분선 */}
        <StyledPanelResizeHandle />

        {/* 로드맵 패널 */}
        <Panel
          minSize={20}
          css={{
            height: "100%",
          }}
        >
          <TitledContainer title="로드맵">
            {/* TODO: 로드맵 뷰어 구현 */}
          </TitledContainer>
        </Panel>

        {/* 구분선 */}
        <StyledPanelResizeHandle />

        {/* 챗봇 패널 */}
        <Panel
          defaultSize={25}
          minSize={20}
          css={{
            height: "100%",
          }}
        >
          <TitledContainer title="챗봇">
            {/* <JobSearchChat /> */}
            <ChatTest />
          </TitledContainer>
        </Panel>
      </PanelGroup>
    </Stack>
  );
};

export default Workspace;
