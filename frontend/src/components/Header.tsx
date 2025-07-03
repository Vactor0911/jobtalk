import {
  AppBar,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import { useAtom } from "jotai";
import { jobTalkLoginStateAtom } from "../state";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import { resetStates } from "../utils";
import LogoutIcon from "@mui/icons-material/Logout";

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [loginState, setLoginState] = useAtom(jobTalkLoginStateAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleLogoClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 로그아웃 처리 함수
  const handleLogout = useCallback(async () => {
    try {
      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 서버에 로그아웃 요청
      await axiosInstance.post(
        "/auth/logout",
        {},
        {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        }
      );

      // 로컬 상태 및 스토리지 초기화
      await resetStates(setLoginState);

      // 메뉴 닫기
      handleMenuClose();

      // 로그인 페이지로 이동
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 에러가 발생해도 일단 로그아웃 처리
      await resetStates(setLoginState);
      navigate("/login");
    }
  }, [navigate, setLoginState]);

  return (
    <AppBar
      position="relative"
      sx={{
        backgroundColor: "white",
        boxShadow: `0px 2px 4px -1px ${theme.palette.primary.main}`,
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
        }}
      >
        {/* 로고 */}
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          onClick={handleLogoClick}
          sx={{
            cursor: "pointer",
          }}
        >
          <Typography variant="h4" color="primary">
            JobTalk
          </Typography>
          <WorkRoundedIcon fontSize="large" color="primary" />
        </Stack>
        {/* 로그인/로그아웃 영역 */}
        {loginState.isLoggedIn ? (
          <div>
            <IconButton
              onClick={handleProfileMenuOpen}
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              color="primary"
            >
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  width: 32,
                  height: 32,
                }}
              >
                {loginState.userName?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <Typography color="text.primary">
                  {loginState.userName}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                로그아웃
              </MenuItem>
            </Menu>
          </div>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate("/login")}
          >
            로그인
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
