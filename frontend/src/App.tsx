import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./utils/theme";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import {
  Login,
  Main,
  MyWorkspace,
  Profile,
  Register,
  Workspace,
} from "./pages";
import Header from "./components/Header";
import TokenRefresher from "./components/TokenRefresher";
import FindPassword from "./pages/FindPassword";
import ChangePassword from "./pages/ChangePassword";
import { SnackbarProvider } from "notistack";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <BrowserRouter basename="/jobtalk">
          <TokenRefresher>
            <Header />
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/workspace" element={<MyWorkspace />} />
              <Route path="/workspace/:workspaceId" element={<Workspace />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/find-password" element={<FindPassword />} />
              <Route path="/*" element={<Navigate to="/" replace />} />
            </Routes>
          </TokenRefresher>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
