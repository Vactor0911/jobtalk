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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import { useAtom } from "jotai";
import { jobTalkLoginStateAtom, profileImageAtom } from "../state";
import axiosInstance, {
  getCsrfToken,
  SERVER_HOST,
} from "../utils/axiosInstance";
import { resetStates } from "../utils";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";

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

  // 프로필 이미지와 닉네임 상태
  const [profileImage, setProfileImage] = useAtom(profileImageAtom);
  const [userName, setUserName] = useState<string>("");
  const [imageVersion, setImageVersion] = useState(0);

  // 사용자 정보 가져오기 함수
  const fetchUserInfo = useCallback(async () => {
    if (!loginState.isLoggedIn) return;

    try {
      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 사용자 정보 조회 API 호출
      const response = await axiosInstance.get("/auth/me", {
        headers: { "X-CSRF-Token": csrfToken },
      });

      if (response.data.success) {
        const userData = response.data.data;

        // 닉네임 설정 (name 필드 사용)
        if (userData.name) {
          setUserName(userData.name);
        }

        // 프로필 이미지 설정
        if (userData.profileImage) {
          // 캐시 방지를 위한 타임스탬프 추가
          const imageUrl = `${SERVER_HOST}${
            userData.profileImage
          }?t=${new Date().getTime()}`;
          setProfileImage(imageUrl);
          setImageVersion((prev) => prev + 1);
        } else {
          setProfileImage(null);
        }
      }
    } catch (err) {
      console.error("사용자 정보 조회 실패:", err);
      // 에러 발생 시 기본값으로 설정
      setProfileImage(null);
      setUserName(loginState.userName || "");
    }
  }, [loginState.isLoggedIn, loginState.userName, setProfileImage]);

  // 실시간 프로필 업데이트 이벤트 리스너
  useEffect(() => {
    // 프로필 이미지 업데이트 이벤트 리스너
    const handleProfileImageUpdate = (event: CustomEvent) => {
      const { profileImage: newImagePath, timestamp } = event.detail;

      // 즉시 이미지 업데이트
      const newImageUrl = `${SERVER_HOST}${newImagePath}?t=${timestamp}`;
      setProfileImage(newImageUrl);
      setImageVersion((prev) => prev + 1);
    };

    // 닉네임 업데이트 이벤트 리스너
    const handleNicknameUpdate = (event: CustomEvent) => {
      const { nickname } = event.detail;

      // 즉시 닉네임 업데이트
      setUserName(nickname);
    };

    // 이벤트 리스너 등록
    window.addEventListener(
      "profileImageUpdated",
      handleProfileImageUpdate as EventListener
    );
    window.addEventListener(
      "profileNicknameUpdated",
      handleNicknameUpdate as EventListener
    );

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener(
        "profileImageUpdated",
        handleProfileImageUpdate as EventListener
      );
      window.removeEventListener(
        "profileNicknameUpdated",
        handleNicknameUpdate as EventListener
      );
    };
  }, [setProfileImage]);

  // 로그인 상태가 변경될 때마다 사용자 정보 가져오기
  useEffect(() => {
    if (loginState.isLoggedIn) {
      fetchUserInfo();
    } else {
      // 로그아웃 시 상태 초기화
      setProfileImage(null);
      setUserName("");
      setImageVersion(0);
    }
  }, [loginState.isLoggedIn, fetchUserInfo, setProfileImage]);

  // 프로필 이미지 요소
  const profileAvatar = useMemo(() => {
    return (
      <Avatar
        key={`header-profile-${imageVersion}`} // 캐시 방지
        src={profileImage || undefined}
        sx={{
          bgcolor: theme.palette.primary.main,
          width: 40, // 헤더용 크기
          height: 40,
        }}
      >
        {!profileImage &&
          (userName ? (
            userName.charAt(0).toUpperCase()
          ) : (
            <FaceRoundedIcon
              sx={{
                fontSize: "2rem",
              }}
            />
          ))}
      </Avatar>
    );
  }, [profileImage, userName, imageVersion, theme.palette.primary.main]);

  // 로고 클릭
  const handleLogoClick = useCallback(() => {
    // 로그인 상태이면 워크스페이스로 이동
    if (loginState.isLoggedIn) {
      navigate("/workspace");
      return;
    }

    // 로그인 상태가 아니면 메인 페이지로 이동
    navigate("/");
  }, [loginState.isLoggedIn, navigate]);

  // 프로필 버튼 클릭
  const handleProfileButtonClick = useCallback(() => {
    // 로그인 상태이면 메뉴 열기
    if (loginState.isLoggedIn) {
      // 메뉴를 열 때 최신 프로필 이미지 가져오기
      if (!isMenuOpen) {
        fetchUserInfo(); // 메뉴가 열릴 때만 프로필 다시 가져오기
      }
      setIsMenuOpen((prev) => !prev);
      return;
    }

    // 로그인 상태가 아니면 로그인 페이지로 이동
    navigate("/login");
  }, [loginState.isLoggedIn, navigate, isMenuOpen, fetchUserInfo]);

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

      // 헤더 상태도 초기화
      setProfileImage(null);
      setUserName("");
      setImageVersion(0);

      // 메뉴 닫기
      handleMenuClose();

      // 로그인 페이지로 이동
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 에러가 발생해도 일단 로그아웃 처리
      await resetStates(setLoginState);
      setProfileImage(null);
      setUserName("");
      setImageVersion(0);
      navigate("/login");
    }
  }, [handleMenuClose, navigate, setLoginState, setProfileImage]);

  return (
    <>
      {/* 헤더 */}
      <AppBar
        position="relative"
        sx={{
          backgroundColor: "white",
          boxShadow: `0px 2px 4px -1px ${theme.palette.primary.main}`,
          zIndex: 1200,
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
            <Typography variant="h6">
              {userName || loginState.userName || "사용자"}
            </Typography>

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
            <MenuButton
              onClick={() => {
                handleMenuClose();
                navigate("/profile");
              }}
            >
              <Typography variant="subtitle1">내 정보</Typography>
            </MenuButton>

            {/* 내 워크스페이스 */}
            <MenuButton
              onClick={() => {
                handleMenuClose();
                navigate("/workspace");
              }}
            >
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
