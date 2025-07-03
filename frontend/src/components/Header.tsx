import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Divider,
  IconButton,
  Popover,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import { useAtom } from "jotai";
import { jobTalkLoginStateAtom } from "../state";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import { resetStates } from "../utils";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

type MenuButtonProps = {
  children: ReactNode;
  onClick?: () => void;
};

const MenuButton = (props: MenuButtonProps) => {
  const { children, onClick } = props;
  const theme = useTheme();

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        padding: 1,
        justifyContent: "flex-start",
        borderRadius: 1,
        transition: "0.1s ease-in-out",
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: "white",
        },
      }}
    >
      {children}
    </ButtonBase>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [loginState, setLoginState] = useAtom(jobTalkLoginStateAtom);
  const menuAnchorElement = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 프로필 이미지 요소
  const profileAvatar = useMemo(() => {
    return (
      <Avatar
        sx={{
          bgcolor: theme.palette.primary.main,
        }}
      >
        {loginState.userName ? (
          loginState.userName.charAt(0)
        ) : (
          <PersonRoundedIcon
            sx={{
              fontSize: "2rem",
            }}
          />
        )}
      </Avatar>
    );
  }, [loginState.userName, theme.palette.primary.main]);

  // 로고 클릭
  const handleLogoClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // 프로필 버튼 클릭
  const handleProfileButtonClick = useCallback(() => {
    // 로그인 상태이면 메뉴 열기
    if (loginState.isLoggedIn) {
      setIsMenuOpen(true);
      return;
    }

    // 로그인 상태가 아니면 로그인 페이지로 이동
    navigate("/login");
  }, [loginState.isLoggedIn, navigate]);

  // 메뉴 닫기
  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

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
  }, [handleMenuClose, navigate, setLoginState]);

  return (
    <>
      {/* 헤더 */}
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
          <IconButton
            ref={menuAnchorElement}
            onClick={handleProfileButtonClick}
            sx={{
              padding: 0,
            }}
          >
            {profileAvatar}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 계정 메뉴 */}
      <Popover
        anchorEl={menuAnchorElement.current}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          transform: "translateY(8px)",
        }}
      >
        <Stack padding={2} width={250} gap={1}>
          {/* 헤더 */}
          <Stack direction="row" alignItems="center" gap={1}>
            {/* 프로필 이미지 */}
            {profileAvatar}

            {/* 닉네임 */}
            <Typography variant="h6">{loginState.userName}</Typography>

            {/* 닫기 버튼 */}
            <Box marginLeft="auto">
              <IconButton onClick={handleMenuClose}>
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Stack>

          {/* 구분선 */}
          <Divider
            sx={{
              borderWidth: 1,
            }}
          />

          {/* 버튼 컨테이너 */}
          <Stack>
            {/* 내 정보 */}
            <MenuButton onClick={() => {
              handleMenuClose();
              navigate("/profile");
            }}>
              <Typography variant="subtitle1">내 정보</Typography>
            </MenuButton>

            {/* 내 워크스페이스 */}
            <MenuButton onClick={handleMenuClose}>
              <Typography variant="subtitle1">워크스페이스</Typography>
            </MenuButton>

            {/* 로그아웃 */}
            <MenuButton
              onClick={() => {
                handleMenuClose();
                handleLogout();
              }}
            >
              <Typography variant="subtitle1">로그아웃</Typography>
            </MenuButton>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};

export default Header;
