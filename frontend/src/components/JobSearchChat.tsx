import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import axiosInstance from "../utils/axiosInstance";

interface JobItem {
  name: string;
  code: string | number;
}

// 채팅 메시지 타입에 페이징 정보 추가
interface ChatMessage {
  id: string; // 고유 ID 추가
  isUser: boolean;
  text: string;
  jobs?: JobItem[];
  visibleJobCount?: number; // 현재 보이는 직업 개수
}
// 간단한 고유 ID 생성 함수
const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const JobSearchChat = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateId(), // 초기 메시지에 ID 추가
      isUser: false,
      text: "안녕하세요! 관심 있는 직업을 검색해 보세요.",
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 채팅창 스크롤을 항상 최신 메시지로 이동
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 더 보기 버튼 클릭 시 호출
  const handleLoadMore = (messageId: string) => {
    setChatMessages((prev) => {
      const updated = [...prev];
      const messageIndex = updated.findIndex((msg) => msg.id === messageId);

      if (messageIndex !== -1) {
        const message = updated[messageIndex];

        if (message.jobs && message.visibleJobCount) {
          // 10개씩 추가로 보여주기 (최대 직업 개수를 넘지 않도록)
          updated[messageIndex] = {
            ...message,
            visibleJobCount: Math.min(
              message.visibleJobCount + 10,
              message.jobs.length
            ),
          };
        }
      }

      return updated;
    });
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    const userMessage = searchTerm;
    setSearchTerm("");

    // 사용자 메시지 추가
    setChatMessages((prev) => [
      ...prev,
      { id: generateId(), isUser: true, text: userMessage },
    ]);

    setIsLoading(true);

    // loadingMsgId 변수를 try 블록 외부로 이동
    const loadingMsgId = generateId();

    try {
      // 로딩 메시지 추가
      setChatMessages((prev) => [
        ...prev,
        { id: loadingMsgId, isUser: false, text: "직업을 검색 중입니다..." },
      ]);

      const response = await axiosInstance.get(`/career/jobs`, {
        params: { keyword: userMessage },
      });

      if (response.data.success) {
        const retrievedJobs = response.data.data.jobs as JobItem[];

        // 이전 로딩 메시지 제거하고 결과 메시지 추가
        setChatMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== loadingMsgId);

          return [
            ...filtered,
            {
              id: generateId(), // 고유 ID 추가
              isUser: false,
              text:
                retrievedJobs.length > 0
                  ? `'${userMessage}'에 관련된 직업을 ${retrievedJobs.length}개 찾았습니다.`
                  : `'${userMessage}'에 관련된 직업을 찾지 못했습니다.`,
              jobs: retrievedJobs,
              visibleJobCount: Math.min(10, retrievedJobs.length), // 초기에 10개만 표시
            },
          ];
        });
      } else {
        throw new Error("직업 검색에 실패했습니다");
      }
    } catch (err) {
      console.error("직업 검색 오류:", err);

      // 이전 로딩 메시지 제거하고 오류 메시지 추가
      setChatMessages((prev) => {
        const filtered = prev.filter(
          (msg) => msg.id !== loadingMsgId // 텍스트 대신 ID로 필터링
        );
        return [
          ...filtered,
          {
            id: generateId(), // 고유 ID 추가
            isUser: false,
            text: "직업 검색 중 오류가 발생했습니다. 다시 시도해주세요.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Stack
      height="100%"
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 채팅 메시지 영역 - 스크롤 가능 */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          pb: 2,
          mb: 0,
          // 하단 입력창 공간만큼 패딩 추가
          paddingBottom: "70px",
        }}
      >
        {chatMessages.map((message) => (
          <Box
            key={message.id} // 메시지 고유 ID를 key로 사용
            alignSelf={message.isUser ? "flex-end" : "flex-start"}
            sx={{
              maxWidth: "85%",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: message.isUser ? "primary.main" : "grey.100",
                color: message.isUser ? "white" : "text.primary",
              }}
            >
              <Typography variant="body1">{message.text}</Typography>

              {/* 직업 목록 표시 - 내부 스크롤과 페이징 처리 추가 */}
              {message.jobs && message.jobs.length > 0 && (
                <>
                  <Box
                    sx={{
                      mt: 1,
                      maxHeight: "200px", // 최대 높이 제한
                      overflowY: "auto", // 내부 스크롤 추가
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                    }}
                  >
                    <List dense sx={{ p: 0 }}>
                      {message.jobs
                        .slice(0, message.visibleJobCount)
                        .map((job, jobIndex) => (
                          <ListItem
                            key={job.code}
                            disablePadding
                            sx={{
                              py: 0.5,
                              px: 1,
                              borderBottom:
                                jobIndex < (message.visibleJobCount || 0) - 1
                                  ? "1px solid"
                                  : "none",
                              borderColor: "divider",
                            }}
                          >
                            <ListItemText
                              primary={`${job.name}`}
                              secondary={`코드: ${job.code}`}
                              primaryTypographyProps={{
                                fontWeight: "medium",
                                color: "text.primary",
                              }}
                              secondaryTypographyProps={{
                                fontSize: "0.75rem",
                                color: "text.secondary",
                              }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>

                  {/* 더 보기 버튼 */}
                  {message.visibleJobCount &&
                    message.visibleJobCount < message.jobs.length && (
                      <Button
                        size="small"
                        endIcon={<KeyboardArrowDownIcon />}
                        onClick={() => handleLoadMore(message.id)} // ID 기반으로 메시지 찾기
                        sx={{ mt: 1, width: "100%" }}
                        variant="outlined"
                        color="primary"
                      >
                        {`더보기 (${message.visibleJobCount}/${message.jobs.length})`}
                      </Button>
                    )}
                </>
              )}
            </Paper>
          </Box>
        ))}
      </Box>

      {/* 입력 영역 - 고정 위치 */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          backgroundColor: "white",
          borderTop: "1px solid",
          borderColor: "divider",
          zIndex: 10,
        }}
      >
        <TextField
          fullWidth
          placeholder="직업명을 입력하세요 (예: 개발자, 의사)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  <IconButton
                    onClick={handleSearch}
                    disabled={!searchTerm.trim()}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 4,
            },
          }}
        />
      </Box>
    </Stack>
  );
};

export default JobSearchChat;
