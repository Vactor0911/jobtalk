import { Box, Paper, Stack } from "@mui/material";
import TitledContainer from "../components/TitledContainer";
import { Panel, PanelGroup } from "react-resizable-panels";
import Test from "../components/Test";
import StyledPanelResizeHandle from "../components/StyledPanelResizeHandle";
import React, { useMemo, useState } from "react";

const Main = () => {
  // 세부사항 패널
  const detailsPanel = useMemo(() => {
    return (
      <Panel
        defaultSize={25}
        minSize={20}
        css={{
          height: "100%",
        }}
      >
        <TitledContainer title="세부사항"></TitledContainer>
      </Panel>
    );
  }, []);

  // 로드맵 패널
  const roadmapPanel = useMemo(() => {
    return (
      <Panel
        minSize={20}
        css={{
          height: "100%",
        }}
      >
        <TitledContainer title="로드맵">
          <Test />
        </TitledContainer>
      </Panel>
    );
  }, []);

  // 챗봇 패널
  const chatbotPanel = useMemo(() => {
    return (
      <Panel
        defaultSize={25}
        minSize={20}
        css={{
          height: "100%",
        }}
      >
        <TitledContainer title="챗봇">
          <Stack height="100%">
            {/* 공간 차지용 */}
            <Box flex={1} />

            {/* 채팅란 */}
            <Paper
              variant="outlined"
              sx={{ height: "100px", borderRadius: 4 }}
            ></Paper>
          </Stack>
        </TitledContainer>
      </Panel>
    );
  }, []);

  const [panels, setPanels] = useState([
    detailsPanel,
    roadmapPanel,
    chatbotPanel,
  ]);

  return (
    <Stack padding={2} direction="row" height="calc(100vh - 64px)">
      <PanelGroup direction="horizontal">
        {panels.map((panel, index) => (
          <React.Fragment key={index}>
            {panel}
            {index < panels.length - 1 && <StyledPanelResizeHandle />}
          </React.Fragment>
        ))}
      </PanelGroup>
    </Stack>
  );
};

export default Main;
