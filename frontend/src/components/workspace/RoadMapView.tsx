import { Stack } from "@mui/material";
import { Panel, PanelGroup } from "react-resizable-panels";
import TitledContainer from "../TitledContainer";
import StyledPanelResizeHandle from "../StyledPanelResizeHandle";
import RoadMapViewer from "./RoadMapViewer";

const RoadMapView = () => {
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
            <RoadMapViewer />
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
            {/* TODO: 챗봇 구현 */}
          </TitledContainer>
        </Panel>
      </PanelGroup>
    </Stack>
  );
};

export default RoadMapView;
