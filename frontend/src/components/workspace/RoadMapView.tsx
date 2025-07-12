import {
  Box,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
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
import RoadMapChatBot from "./RoadMapChatBot";
import RoadMapDetails, { type NodeDetail } from "./RoadMapDetails";

const RoadMapView = () => {
  const theme = useTheme();
  const isPC = useMediaQuery(theme.breakpoints.up("lg"));

  // 화면 크기
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const isLg = useMediaQuery(theme.breakpoints.only("lg"));
  const isXl = useMediaQuery(theme.breakpoints.only("xl"));

  const [isDetailsOpen, setIsDetailsOpen] = useState(true); // 상세정보 패널 열림 상태
  const [isChatbotOpen, setIsChatbotOpen] = useState(true); // 챗봇 패널 열림 상태
  const detailsPanel = useRef<ImperativePanelHandle>(null); // 상세정보 패널 참조
  const chatbotPanel = useRef<ImperativePanelHandle>(null); // 챗봇 패널 참조ㄴ

  // 상세정보 상태/로딩 관리
  const [selectedNodeDetail, setSelectedNodeDetail] =
    useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 탭 메뉴
  const [tab, setTab] = useAtom(roadmapTabAtom);

  // 상세정보 패널 열기/닫기
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

  // 상세정보 패널 열림 상태 적용
  const handleSetDetailsOpen = useCallback((open: boolean) => {
    setIsDetailsOpen(open);

    if (detailsPanel.current) {
      if (open) {
        detailsPanel.current.expand();
      } else {
        detailsPanel.current.collapse();
      }
    }
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

    if (chatbotPanel.current) {
      if (open) {
        chatbotPanel.current.expand();
      } else {
        chatbotPanel.current.collapse();
      }
    }
  }, []);

  // 탭 메뉴 변경
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setTab(newValue);
    },
    [setTab]
  );

  // 패널 축소 크기 반환
  const getCollapsedSize = useCallback(() => {
    if (isMd) return 5; // 태블릿
    if (isLg) return 4; // 작은 PC
    if (isXl) return 3; // 큰 PC
  }, [isLg, isMd, isXl]);

  // PC 화면 렌더링
  if (isPC) {
    return (
      <Stack padding={2} direction="row" height="calc(100vh - 64px)">
        <PanelGroup direction="horizontal">
          {/* 상세정보 패널 */}
          <Panel
            ref={detailsPanel}
            defaultSize={25}
            minSize={20}
            collapsible
            collapsedSize={getCollapsedSize()}
            onCollapse={() => handleSetDetailsOpen(false)}
            onExpand={() => handleSetDetailsOpen(true)}
            css={{
              height: "100%",
            }}
          >
            <TitledContainer
              title="상세정보"
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
            >
              {detailLoading || selectedNodeDetail ? (
                <RoadMapDetails
                  nodeDetail={selectedNodeDetail}
                  loading={detailLoading}
                />
              ) : (
                <Typography variant="subtitle1" color="text.secondary" p={2}>
                  노드를 클릭하면 상세정보가 표시됩니다.
                </Typography>
              )}
            </TitledContainer>
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
              <RoadMapViewer
                onNodeDetail={(detail, loading) => {
                  handleSetDetailsOpen(true); // 상세정보 패널 자동 열기
                  setTimeout(() => {
                    // 1.5초 후에 상세정보 탭으로 전환
                    setTab(0);
                  }, 1000);
                  setSelectedNodeDetail(detail);
                  setDetailLoading(loading);
                }}
              />
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
            collapsedSize={getCollapsedSize()}
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
              <RoadMapChatBot />
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
          <Tab label="상세정보" />
          <Tab label="로드맵" />
          <Tab label="챗봇" />
        </Tabs>
        <Divider />
      </Box>

      {/* 상세정보 */}
      {tab === 0 && (
        <>
          {detailLoading || selectedNodeDetail ? (
            <RoadMapDetails
              nodeDetail={selectedNodeDetail}
              loading={detailLoading}
            />
          ) : (
            <Typography variant="subtitle1" color="text.secondary" p={2}>
              노드를 클릭하면 상세정보가 표시됩니다.
            </Typography>
          )}
        </>
      )}

      {/* 로드맵 */}
      {tab === 1 && (
        <RoadMapViewer
          onNodeDetail={(detail, loading) => {
            handleSetDetailsOpen(true); // 상세정보 패널 자동 열기
            setTimeout(() => {
              // 1.5초 후에 상세정보 탭으로 전환
              setTab(0);
            }, 1000);
            setSelectedNodeDetail(detail);
            setDetailLoading(loading);
          }}
        />
      )}

      {/* 챗봇 */}
      {tab === 2 && (
        <Box padding={2} height="100%">
          <RoadMapChatBot />
        </Box>
      )}
    </Stack>
  );
};

export default RoadMapView;
