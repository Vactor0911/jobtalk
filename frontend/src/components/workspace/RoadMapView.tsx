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

const RoadMapView = () => {
  const theme = useTheme();
  const isPC = useMediaQuery(theme.breakpoints.up("md"));

  // 화면 크기
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const isLg = useMediaQuery(theme.breakpoints.only("lg"));
  const isXl = useMediaQuery(theme.breakpoints.only("xl"));

  const [isDetailsOpen, setIsDetailsOpen] = useState(true); // 세부사항 패널 열림 상태
  const [isChatbotOpen, setIsChatbotOpen] = useState(true); // 챗봇 패널 열림 상태
  const detailsPanel = useRef<ImperativePanelHandle>(null);
  const chatbotPanel = useRef<ImperativePanelHandle>(null);

  // 세부사항 상태/로딩 관리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
          {/* 세부사항 패널 */}
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
            >
              {detailLoading ? (
                <Box p={2} textAlign="center">
                  <span>불러오는 중...</span>
                </Box>
              ) : selectedNodeDetail ? (
                <Stack gap={2} p={2}>
                  {selectedNodeDetail.overview && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        개요
                      </Typography>
                      <Typography variant="body2">
                        {selectedNodeDetail.overview}
                      </Typography>
                    </>
                  )}
                  {selectedNodeDetail.importance && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        중요성
                      </Typography>
                      <Typography variant="body2">
                        {selectedNodeDetail.importance}
                      </Typography>
                    </>
                  )}
                  {selectedNodeDetail.applications && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        활용 분야
                      </Typography>
                      <Typography variant="body2">
                        {selectedNodeDetail.applications}
                      </Typography>
                    </>
                  )}
                  {selectedNodeDetail.resources &&
                    Array.isArray(selectedNodeDetail.resources) && (
                      <>
                        <Typography variant="subtitle1" fontWeight="bold">
                          학습 자료
                        </Typography>
                        <ul>
                          {selectedNodeDetail.resources.map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (r: any, idx: number) => (
                              <li key={idx}>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {r.title}
                                </a>
                                {r.type && ` (${r.type})`}
                              </li>
                            )
                          )}
                        </ul>
                      </>
                    )}
                  {selectedNodeDetail.examInfo && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold">
                        자격증 정보
                      </Typography>
                      <Typography variant="body2">
                        {selectedNodeDetail.examInfo.organization &&
                          `기관: ${selectedNodeDetail.examInfo.organization}`}
                        <br />
                        {selectedNodeDetail.examInfo.registrationUrl && (
                          <>
                            접수:{" "}
                            <a
                              href={selectedNodeDetail.examInfo.registrationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {selectedNodeDetail.examInfo.registrationUrl}
                            </a>
                          </>
                        )}
                      </Typography>
                    </>
                  )}
                </Stack>
              ) : (
                <Typography p={2}>
                  노드를 클릭하면 세부사항이 표시됩니다.
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
                  setSelectedNodeDetail(detail);
                  setDetailLoading(loading);
                  setIsDetailsOpen(true); // 세부사항 패널 자동 오픈(선택)
                  /* 필요시 detailsPanel.current?.expand(); */
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
          <Tab label="세부사항" />
          <Tab label="로드맵" />
          <Tab label="챗봇" />
        </Tabs>
        <Divider />
      </Box>

      {/* 세부사항 */}
      {tab === 0 && <></>}

      {/* 로드맵 */}
      {tab === 1 && (
        <RoadMapViewer
          onNodeDetail={(detail, loading) => {
            setSelectedNodeDetail(detail);
            setDetailLoading(loading);
            setIsDetailsOpen(true); // 세부사항 패널 자동 오픈(선택)
            /* 필요시 detailsPanel.current?.expand(); */
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
