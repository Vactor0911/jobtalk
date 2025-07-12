import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import FaceRoundedIcon from "@mui/icons-material/FaceRounded";
import { grey } from "@mui/material/colors";
import axiosInstance, {
  getCsrfToken,
  SERVER_HOST,
} from "../utils/axiosInstance";
import imageCompression from "browser-image-compression";
import CertificateSelect from "../components/CertificateSelect";
import { enqueueSnackbar } from "notistack";
import { isPasswordValid } from "../utils";

// 사용자 정보 인터페이스
interface UserInfo {
  userId: number;
  email: string;
  name: string;
  profileImage: string | null;
  certificates?: string | null;
  interests?: string | null;
}

const Profile = () => {
  const theme = useTheme();

  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState("");

  // 이미지 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  // 비밀번호 상태
  const [prevPassword, setPrevPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [prevPasswordVisible, setPrevPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [newPasswordConfirmVisible, setNewPasswordConfirmVisible] =
    useState(false);

  // 작업 상태
  const [isNicknameUpdating, setIsNicknameUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // 자격증
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    []
  ); // 선택된 자격증 목록
  const [initialCertificates, setInitialCertificates] = useState<string[]>([]); // 초기 자격증 목록
  const [isCertificatesUpdating, setIsCertificatesUpdating] = useState(false); // 자격증 수정 상태

  // 사용자 정보 로딩
  const fetchUserInfo = useCallback(async () => {
    try {
      setIsLoading(true);

      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 사용자 정보 조회 API 호출
      const response = await axiosInstance.get("/auth/me", {
        headers: { "X-CSRF-Token": csrfToken },
      });

      if (response.data.success) {
        const userData = response.data.data;
        setUserInfo(userData);
        setNickname(userData.name);

        // 기존 자격증 정보가 있다면 배열로 변환하여 설정
        if (userData.certificates) {
          const newSelectedCertificates = userData.certificates
            .split(", ")
            .filter((cert: string) => cert.trim());
          setSelectedCertificates(newSelectedCertificates);
          setInitialCertificates(newSelectedCertificates);
        }

        // 프로필 이미지 설정
        if (userData.profileImage) {
          setProfileImage(`${SERVER_HOST}${userData.profileImage}`);
        } else {
          setProfileImage(null);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("사용자 정보 조회 실패:", err);
      enqueueSnackbar(
        err.response?.data?.message || "사용자 정보를 불러오는데 실패했습니다.",
        {
          variant: "error",
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 사용자 정보 로딩
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

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

      // 파일이 선택되지 않은 경우 종료
      if (!file) return;

      // 파일 타입 검증
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

      if (!allowedTypes.includes(file.type)) {
        enqueueSnackbar(
          "지원되지 않는 파일 형식입니다. JPG, PNG 형식만 업로드할 수 있습니다.",
          {
            variant: "error",
          }
        );
        return;
      }

      try {
        setIsUploading(true);

        // 이미지 압축
        const compressedFile = await compressImage(file);

        // 파일 크기 검증 (4MB)
        if (compressedFile.size > 4 * 1024 * 1024) {
          enqueueSnackbar("파일 크기는 4MB를 초과할 수 없습니다.", {
            variant: "error",
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

          // 헤더에 즉시 업데이트 알림
          window.dispatchEvent(
            new CustomEvent("profileImageUpdated", {
              detail: {
                profileImage: response.data.data.profileImage, // 서버에서 받은 경로
                imageUrl: imageUrl, // 전체 URL
                timestamp: new Date().getTime(),
              },
            })
          );

          // 성공 메시지 표시
          enqueueSnackbar("프로필 이미지가 성공적으로 업로드되었습니다.", {
            variant: "success",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        enqueueSnackbar(
          err.response?.data?.message || "이미지 업로드에 실패했습니다.",
          {
            variant: "error",
          }
        );
      } finally {
        setIsUploading(false);
        // 파일 입력 초기화
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    []
  );

  // 닉네임 변경 요청
  const handleUpdateNickname = useCallback(async () => {
    // 입력값 검증
    if (!nickname.trim()) {
      enqueueSnackbar("닉네임을 입력해주세요.", {
        variant: "error",
      });
      return;
    }

    // 기존 닉네임과 동일한지 확인 - 추가된 부분
    if (nickname.trim() === userInfo?.name) {
      enqueueSnackbar("기존 닉네임과 동일합니다.", {
        variant: "error",
      });
      return;
    }

    try {
      setIsNicknameUpdating(true);

      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 닉네임 변경 API 호출
      const response = await axiosInstance.patch(
        "/auth/me/nickname",
        { nickname },
        { headers: { "X-CSRF-Token": csrfToken } }
      );

      if (response.data.success) {
        enqueueSnackbar("닉네임이 성공적으로 변경되었습니다.", {
          variant: "success",
        });

        // 헤더에 즉시 닉네임 업데이트 알림
        window.dispatchEvent(
          new CustomEvent("profileNicknameUpdated", {
            detail: {
              nickname: nickname,
            },
          })
        );

        // 사용자 정보 다시 불러오기
        fetchUserInfo();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("닉네임 변경 실패:", err);
      enqueueSnackbar(
        err.response?.data?.message || "닉네임 변경에 실패했습니다.",
        {
          variant: "error",
        }
      );
    } finally {
      setIsNicknameUpdating(false);
    }
  }, [nickname, userInfo?.name, fetchUserInfo]);

  // 비밀번호 변경 요청
  const handlePasswordUpateButtonClick = useCallback(async () => {
    // 입력값 검증
    if (!prevPassword) {
      enqueueSnackbar("현재 비밀번호를 입력해주세요.", {
        variant: "error",
      });
      return;
    }

    if (!newPassword) {
      enqueueSnackbar("새 비밀번호를 입력해주세요.", {
        variant: "error",
      });
      return;
    }

    // 새 비밀번호 형식 검증 추가
    if (!isPasswordValid(newPassword)) {
      enqueueSnackbar(
        "비밀번호는 8자리 이상, 영문, 숫자, 특수문자(!@#$%^&*?)를 포함해야 합니다.",
        { variant: "error" }
      );
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      enqueueSnackbar("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", {
        variant: "error",
      });
      return;
    }

    // 현재 비밀번호와 새 비밀번호가 동일한지 확인
    if (prevPassword === newPassword) {
      enqueueSnackbar("새 비밀번호는 현재 비밀번호와 달라야 합니다.", {
        variant: "error",
      });
      return;
    }

    try {
      setIsPasswordUpdating(true);

      // CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // 비밀번호 변경 API 호출
      const response = await axiosInstance.patch(
        "/auth/me/password",
        {
          currentPassword: prevPassword,
          newPassword,
          confirmNewPassword: newPasswordConfirm,
        },
        { headers: { "X-CSRF-Token": csrfToken } }
      );

      if (response.data.success) {
        enqueueSnackbar("비밀번호가 성공적으로 변경되었습니다.", {
          variant: "success",
        });

        // 비밀번호 입력 필드 초기화
        setPrevPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("비밀번호 변경 실패:", err);
      enqueueSnackbar(
        err.response?.data?.message || "비밀번호 변경에 실패했습니다.",
        {
          variant: "error",
        }
      );
    } finally {
      setIsPasswordUpdating(false);
    }
  }, [prevPassword, newPassword, newPasswordConfirm]);

  // 현재 비밀번호 표시/숨김 버튼 클릭
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

  // 자격증 선택 목록 변경
  const handleSelectedCertificatesChange = useCallback(
    (_event: React.SyntheticEvent, value: string[]) => {
      setSelectedCertificates(value);
    },
    []
  );

  // 자격증 수정 버튼 클릭
  const handleUpdateCertificatesButtonClick = useCallback(async () => {
    // 기존 자격증과 동일한지 확인
    const formattedCertificates = selectedCertificates.join(", ");
    const formattedInitialCertificates = initialCertificates.join(", ");

    if (formattedCertificates === formattedInitialCertificates) {
      enqueueSnackbar("기존 자격증과 동일합니다.", {
        variant: "error",
      });
      return;
    }

    try {
      setIsCertificatesUpdating(true);

      const csrfToken = await getCsrfToken();
      const response = await axiosInstance.patch(
        "/auth/me/certificates",
        { certificates: selectedCertificates.join(", ") },
        { headers: { "X-CSRF-Token": csrfToken } }
      );

      if (response.data.success) {
        enqueueSnackbar("자격증 정보가 성공적으로 업데이트되었습니다.", {
          variant: "success",
        });

        // 초기값 업데이트 (변경사항 추적을 위해)
        setInitialCertificates([...selectedCertificates]);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      enqueueSnackbar("자격증 정보 업데이트에 실패했습니다.", {
        variant: "error",
      });
    } finally {
      setIsCertificatesUpdating(false);
    }
  }, [initialCertificates, selectedCertificates]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <Container maxWidth="sm">
        <Stack
          height="calc(100vh - 64px)"
          justifyContent="center"
          alignItems="center"
        >
          <CircularProgress />
          <Typography mt={2}>사용자 정보를 불러오는 중입니다...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Stack
        minHeight="calc(100vh - 64px)"
        paddingY={4}
        paddingBottom={10}
        gap={5}
      >
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
              accept=".png, .jpg, .jpeg"
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
            <OutlinedTextField
              label="이메일"
              value={userInfo?.email || ""}
              disabled
            />

            <Stack direction="row" gap={1}>
              {/* 닉네임 */}
              <OutlinedTextField
                label="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />

              {/* 수정 버튼 */}
              <Button
                variant="outlined"
                onClick={handleUpdateNickname}
                disabled={isNicknameUpdating}
                sx={{
                  paddingX: 3,
                  borderRadius: 2,
                }}
              >
                {isNicknameUpdating ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography
                    variant="subtitle1"
                    whiteSpace="nowrap"
                    fontWeight="bold"
                  >
                    수정
                  </Typography>
                )}
              </Button>
            </Stack>
          </Stack>
        </Stack>

        {/* 자격증 */}
        <Stack gap={3}>
          {/* 헤더 */}
          <SectionHeader title="자격증" variant="h6" />

          {/* 보유 증격증 */}
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            gap={1}
            alignItems="flex-start"
          >
            <Stack
              direction="row"
              width="150px"
              paddingY={2}
              alignItems="center"
              gap={1}
            >
              {/* 컬럼명 */}
              <Typography>보유 자격증</Typography>

              {/* 툴팁 */}
              <Tooltip title="보유한 자격증을 입력해주세요.">
                <HelpOutlineRoundedIcon />
              </Tooltip>
            </Stack>

            <Stack width="100%" flex={1} gap={0.5}>
              <Stack direction="row" gap={1}>
                {/* 자격증 입력란 */}
                <Box width="100%" flex={1}>
                  <CertificateSelect
                    value={selectedCertificates}
                    onChange={handleSelectedCertificatesChange}
                  />
                </Box>

                {/* 자격증 수정 버튼 */}
                <Button
                  variant="outlined"
                  onClick={handleUpdateCertificatesButtonClick}
                  disabled={isCertificatesUpdating}
                  sx={{
                    paddingX: 3,
                    borderRadius: 2,
                    minWidth: "80px",
                  }}
                >
                  {isCertificatesUpdating ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Typography
                      variant="subtitle1"
                      whiteSpace="nowrap"
                      fontWeight="bold"
                    >
                      수정
                    </Typography>
                  )}
                </Button>
              </Stack>

              {/* 안내 문구 */}
              <Typography variant="subtitle2" color="text.secondary">
                직접 입력 시 결과가 부정확해질 수 있습니다.
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* 비밀번호 변경 */}
        <Stack component="form" gap={3}>
          {/* 헤더 */}
          <SectionHeader title="비밀번호 변경" variant="h6" />

          <Stack gap={1}>
            {/* 현재 비밀번호 */}
            <OutlinedTextField
              label="현재 비밀번호"
              type={prevPasswordVisible ? "text" : "password"}
              value={prevPassword}
              onChange={(e) => setPrevPassword(e.target.value)}
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
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
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
              onClick={handlePasswordUpateButtonClick}
              disabled={isPasswordUpdating}
              sx={{
                alignSelf: "flex-end",
                paddingX: 4,
                borderRadius: 2,
              }}
            >
              {isPasswordUpdating ? (
                <CircularProgress size={20} />
              ) : (
                <Typography variant="subtitle1" fontWeight="bold">
                  비밀번호 변경
                </Typography>
              )}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Profile;
