import { CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { theme } from "./utils/theme";

const App = () => {
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
    </ThemeProvider>
  );
};

export default App;
