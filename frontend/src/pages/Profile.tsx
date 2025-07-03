import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import SectionHeader from "../components/SectionHeader";
import OutlinedTextField from "../components/OutlinedTextField";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useCallback, useRef, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import { grey } from "@mui/material/colors";
import axiosInstance, {
  getCsrfToken,
  SERVER_HOST,
} from "../utils/axiosInstance";
import imageCompression from "browser-image-compression";

// 스낵바 상태 인터페이스
interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

const Profile = () => {
  const theme = useTheme();

  // 이미지 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [prevPasswordVisible, setPrevPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [newPasswordConfirmVisible, setNewPasswordConfirmVisible] =
    useState(false);

  // 알림 상태
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  // 프로필 이미지 클릭
  const handleProfileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 이미지 압축 함수
  const compressImage = async (file: File): Promise<File> => {
    // 1MB 이하면 압축하지 않음
    if (file.size <= 1024 * 1024) return file;

    const options = {
      maxSizeMB: 1, // 최대 1MB
      maxWidthOrHeight: 1024, // 최대 해상도 1024px
      initialQuality: 0.8, // 초기 품질 80%
      useWebWorker: true,
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("이미지 압축 실패:", error);
      return file; // 압축 실패 시 원본 반환
    }
  };

  // 파일 변경 핸들러
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 파일 타입 검증
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message:
            "지원되지 않는 파일 형식입니다. JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.",
          severity: "error",
        });
        return;
      }

      try {
        setIsUploading(true);

        // 이미지 압축
        const compressedFile = await compressImage(file);

        // 파일 크기 검증 (4MB)
        if (compressedFile.size > 4 * 1024 * 1024) {
          setSnackbar({
            open: true,
            message: "파일 크기는 4MB를 초과할 수 없습니다.",
            severity: "error",
          });
          return;
        }

        // FormData 생성
        const formData = new FormData();
        formData.append("profileImage", compressedFile);

        // CSRF 토큰 가져오기
        const csrfToken = await getCsrfToken();

        // 업로드 API 호출
        const response = await axiosInstance.post(
          "/auth/me/profile-image",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRF-Token": csrfToken,
            },
          }
        );

        if (response.data.success) {
          // 캐시 방지를 위한 타임스탬프 추가
          const imageUrl = `${SERVER_HOST}${
            response.data.data.profileImage
          }?t=${new Date().getTime()}`;
          setProfileImage(imageUrl);

          // 이미지 버전 증가 (강제 리렌더링 유도)
          setImageVersion((prev) => prev + 1);

          // 성공 메시지 표시
          setSnackbar({
            open: true,
            message: "프로필 이미지가 성공적으로 업로드되었습니다.",
            severity: "success",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("프로필 이미지 업로드 실패:", err);
        setSnackbar({
          open: true,
          message:
            err.response?.data?.message || "이미지 업로드에 실패했습니다.",
          severity: "error",
        });
      } finally {
        setIsUploading(false);
        // 파일 입력 초기화
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  // 기존 비밀번호 표시/숨김 버튼 클릭
  const handlePrevPasswordVisibilityButtonClick = useCallback(() => {
    setPrevPasswordVisible((prev) => !prev);
  }, []);

  // 새 비밀번호 표시/숨김 버튼 클릭
  const handleNewPasswordVisibilityButtonClick = useCallback(() => {
    setNewPasswordVisible((prev) => !prev);
  }, []);

  // 새 비밀번호 확인 표시/숨김 버튼 클릭
  const handleNewPasswordConfirmVisibilityButtonClick = useCallback(() => {
    setNewPasswordConfirmVisible((prev) => !prev);
  }, []);

  return (
    <Container maxWidth="sm">
      <Stack minHeight="calc(100vh - 64px)" paddingY={4} gap={5}>
        {/* 내 정보 */}
        <Stack gap={3}>
          <SectionHeader title="내정보" />
          {/* 프로필 사진 섹션 */}
          <Stack direction="row" alignItems="center" gap={2}>
            <IconButton
              onClick={handleProfileClick}
              sx={{ p: 0, "&:hover": { backgroundColor: "transparent" } }}
              disabled={isUploading}
            >
              <Avatar
                key={`profile-image-${imageVersion}`} // 버전이 바뀔 때마다 Avatar를 강제로 리렌더링
                // 프로필 이미지가 없을 경우 기본 아이콘 표시
                src={profileImage || undefined}
                sx={{
                  width: 98,
                  height: 98,
                  backgroundColor: theme.palette.primary.main, // 헤더와 동일한 배경색
                  position: "relative",
                }}
              >
                {/* 프로필 이미지가 없을 경우 기본 아이콘 표시 */}
                {!profileImage && (
                  <FaceRoundedIcon
                    sx={{
                      width: "90%",
                      height: "90%",
                      color: grey[100], // 헤더와 동일한 아이콘 색상
                    }}
                  />
                )}
                {/* 업로드 중 로딩 표시 */}
                {isUploading && (
                  <CircularProgress
                    size={40}
                    sx={{
                      position: "absolute",
                      color: "white",
                    }}
                  />
                )}
              </Avatar>

              {/* 편집 아이콘 */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: "50%",
                  p: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "2px solid white",
                }}
              >
                <CreateIcon sx={{ color: "white", fontSize: "16px" }} />
              </Box>
            </IconButton>

            {/* 숨겨진 파일 입력 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: "none" }}
            />

            {/* 이미지 업로드 안내 */}
            <Stack gap={1}>
              <Typography variant="body2" color="textSecondary">
                98x98픽셀 이상, 4MB 이하의 사진을 권장합니다.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                지원 형식: JPG, PNG, GIF, WEBP
              </Typography>
              <Button
                onClick={handleProfileClick}
                variant="outlined"
                sx={{
                  borderRadius: "8px",
                  width: "100px",
                  height: "36px",
                }}
              >
                <Typography>업로드</Typography>
              </Button>
            </Stack>
          </Stack>

          <Stack gap={1}>
            {/* 이메일 */}
            <OutlinedTextField label="이메일" disabled />

            <Stack direction="row" gap={1}>
              {/* 닉네임 */}
              <OutlinedTextField label="닉네임" />

              {/* 수정 버튼 */}
              <Button
                variant="outlined"
                sx={{
                  paddingX: 3,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="subtitle1"
                  whiteSpace="nowrap"
                  fontWeight="bold"
                >
                  수정
                </Typography>
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* 경력 */}
        <Stack gap={3}>
          {/* 헤더 */}
          <SectionHeader title="경력" variant="h6" />

          {/* 보유 증격증 */}
          <Stack direction="row" gap={1}>
            <Stack direction="row" alignItems="center" gap={1} flex={1}>
              {/* 컬럼명 */}
              <Typography>보유 자격증</Typography>

              <Tooltip title="보유한 자격증을 입력해주세요.">
                <HelpOutlineRoundedIcon />
              </Tooltip>
            </Stack>
          </Stack>

          {/* 구분선 */}
          <Divider />

          {/* 관심 분야 */}
          <Stack direction="row" gap={1}>
            <Stack direction="row" alignItems="center" gap={1} flex={1}>
              {/* 컬럼명 */}
              <Typography>관심 분야</Typography>

              <Tooltip title="관심 있는 분야를 입력해주세요.">
                <HelpOutlineRoundedIcon />
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>

        {/* 비밀번호 변경 */}
        <Stack gap={3}>
          {/* 헤더 */}
          <SectionHeader title="비밀번호 변경" variant="h6" />

          <Stack gap={1}>
            {/* 기존 비밀번호 */}
            <OutlinedTextField
              label="기존 비밀번호"
              type={prevPasswordVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handlePrevPasswordVisibilityButtonClick}>
                    {prevPasswordVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            {/* 새 비밀번호 */}
            <OutlinedTextField
              label="새 비밀번호"
              type={newPasswordVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handleNewPasswordVisibilityButtonClick}>
                    {newPasswordVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            {/* 새 비밀번호 확인 */}
            <OutlinedTextField
              label="새 비밀번호 확인"
              type={newPasswordConfirmVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleNewPasswordConfirmVisibilityButtonClick}
                  >
                    {newPasswordConfirmVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            <Button
              variant="outlined"
              sx={{
                alignSelf: "flex-end",
                paddingX: 4,
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                비밀번호 변경
              </Typography>
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Profile;
