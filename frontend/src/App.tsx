import {
  Alert,
  Box,
  Button,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { theme } from "./utils/theme";
import axiosInstance from "./utils/axiosInstance";
import { useState } from "react";

const App = () => {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // GET 테스트
  const handleGetTest = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/test/getTest");
      setTestResult(`GET 테스트 성공: ${response.data.message}`);
      console.log("GET 응답:", response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setTestResult(`GET 테스트 실패: ${error.message}`);
      console.error("GET 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // POST 테스트
  const handlePostTest = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/test/postTest", {
        message: "프론트엔드에서 보낸 메시지입니다!",
      });
      setTestResult(`POST 테스트 성공: ${response.data.message}`);
      console.log("POST 응답:", response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setTestResult(`POST 테스트 실패: ${error.message}`);
      console.error("POST 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 테스트 렌더링 */}
      <Typography variant="h4" fontWeight={500}>
        Welcome to{" "}
        <span
          css={{
            color: theme.palette.primary.main,
            fontWeight: "bold",
          }}
        >
          Project MW
        </span>
        !
      </Typography>

      {/* 백엔드 연동 테스트 */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        백엔드 연동 테스트
      </Typography>

      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleGetTest}
          disabled={isLoading}
        >
          GET 테스트
        </Button>

        <Button
          variant="outlined"
          onClick={handlePostTest}
          disabled={isLoading}
        >
          POST 테스트
        </Button>
      </Box>

      {/* 테스트 결과 표시 */}
      {testResult && (
        <Alert
          severity={testResult.includes("성공") ? "success" : "error"}
          sx={{ mt: 2 }}
        >
          {testResult}
        </Alert>
      )}

      {isLoading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          요청 처리 중...
        </Typography>
      )}
    </ThemeProvider>
  );
};

export default App;
