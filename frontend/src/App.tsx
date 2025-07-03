import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./utils/theme";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Login, Main, Register, Workspace } from "./pages";
import Header from "./components/Header";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter basename="/jobtalk">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/roadmap/:roadmapId" element={<Workspace />} />
          <Route path="/*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
