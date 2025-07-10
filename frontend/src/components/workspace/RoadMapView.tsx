import {
  Box,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Panel,
  PanelGroup,
  type ImperativePanelHandle,
} from "react-resizable-panels";
import TitledContainer from "../TitledContainer";
import StyledPanelResizeHandle from "../StyledPanelResizeHandle";
import RoadMapViewer from "./RoadMapViewer";
import { useCallback, useRef, useState } from "react";
import { useAtom } from "jotai";
import { roadmapTabAtom } from "../../state";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";

const RoadMapView = () => {
  const theme = useTheme();
  const isPC = useMediaQuery(theme.breakpoints.up("md"));

  const [isDetailsOpen, setIsDetailsOpen] = useState(true); // 세부사항 패널 열림 상태
  const [isChatbotOpen, setIsChatbotOpen] = useState(true); // 챗봇 패널 열림 상태
  const detailsPanel = useRef<ImperativePanelHandle>(null);
  const chatbotPanel = useRef<ImperativePanelHandle>(null);

  // 탭 메뉴
  const [tab, setTab] = useAtom(roadmapTabAtom);

  // 세부사항 패널 열기/닫기
  const handleDetailsToggle = useCallback(() => {
    const newOpenState = !isDetailsOpen;
    setIsDetailsOpen(newOpenState);

    if (detailsPanel.current) {
      if (newOpenState) {
        detailsPanel.current.expand();
      } else {
        detailsPanel.current.collapse();
      }
    }
  }, [isDetailsOpen]);

  // 세부사항 패널 열림 상태 적용
  const handleSetDetailsOpen = useCallback((open: boolean) => {
    setIsDetailsOpen(open);
  }, []);

  // 챗봇 패널 열기/닫기
  const handleChatbotToggle = useCallback(() => {
    const newOpenState = !isChatbotOpen;
    setIsChatbotOpen(newOpenState);

    if (chatbotPanel.current) {
      if (newOpenState) {
        chatbotPanel.current.expand();
      } else {
        chatbotPanel.current.collapse();
      }
    }
  }, [isChatbotOpen]);

  // 챗봇 패널 열림 상태 적용
  const handleSetChatbotOpen = useCallback((open: boolean) => {
    setIsChatbotOpen(open);
  }, []);

  // 탭 메뉴 변경
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    },
    [setTab]
  );

  // PC 화면 렌더링
  if (isPC) {
    return (
      <Stack padding={2} direction="row" height="calc(100vh - 64px)">
        <PanelGroup direction="horizontal">
          {/* 세부사항 패널 */}
          <Panel
            ref={detailsPanel}
            defaultSize={25}
            minSize={20}
            collapsible
            collapsedSize={4}
            onCollapse={() => handleSetDetailsOpen(false)}
            onExpand={() => handleSetDetailsOpen(true)}
            css={{
              height: "100%",
            }}
          >
            <TitledContainer
              title="세부사항"
              collapsed={!isDetailsOpen}
              toggleButton={
                <IconButton size="small" onClick={handleDetailsToggle}>
                  <KeyboardArrowRightRoundedIcon
                    sx={{
                      transform: isDetailsOpen
                        ? "rotate(-180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </IconButton>
              }
            ></TitledContainer>
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
            ref={chatbotPanel}
            defaultSize={25}
            minSize={20}
            collapsible
            collapsedSize={4}
            onCollapse={() => handleSetChatbotOpen(false)}
            onExpand={() => handleSetChatbotOpen(true)}
            css={{
              height: "100%",
            }}
          >
            <TitledContainer
              title="챗봇"
              collapsed={!isChatbotOpen}
              toggleButton={
                <IconButton size="small" onClick={handleChatbotToggle}>
                  <KeyboardArrowRightRoundedIcon
                    sx={{
                      transform: isChatbotOpen
                        ? "rotate(0deg)"
                        : "rotate(-180deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </IconButton>
              }
            >
              {/* TODO: 챗봇 구현 */}
            </TitledContainer>
          </Panel>
        </PanelGroup>
      </Stack>
    );
  }

  // 모바일 및 태블릿 화면 렌더링
  return (
    <Stack paddingTop={2} height="calc(100vh - 64px)">
      <Box>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab label="세부사항" />
          <Tab label="로드맵" />
          <Tab label="챗봇" />
        </Tabs>
        <Divider />
      </Box>

      {/* 세부사항 */}
      {tab === 0 && <></>}

      {/* 로드맵 */}
      {tab === 1 && <RoadMapViewer />}

      {/* 챗봇 */}
      {tab === 2 && <></>}
    </Stack>
  );
};

export default RoadMapView;
