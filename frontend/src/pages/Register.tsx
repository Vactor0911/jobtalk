import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PlainLink from "../components/PlainLinkProps";
import SectionHeader from "../components/SectionHeader";
import OutlinedTextField from "../components/OutlinedTextField";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import axiosInstance, { getCsrfToken } from "../utils/axiosInstance";
import axios from "axios";
import { useNavigate } from "react-router";
import { jobTalkLoginStateAtom } from "../state";
import { useAtomValue } from "jotai";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import StyledAutocomplete from "../components/StyledAutocomplete";

// 이용약관 데이터
interface TermsOfService {
  title: string;
  isOptional: boolean;
  content: ReactNode;
}

const termsOfServices: TermsOfService[] = [
  {
    title: "개인정보 수집 및 이용약관 동의",
    isOptional: false,
    content: (
      <Typography variant="subtitle1">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Itaque
        corrupti recusandae voluptate adipisci aliquam fugiat deserunt omnis
        maxime earum neque debitis, quasi perferendis! Qui nihil distinctio
        doloremque voluptatem corrupti est.
      </Typography>
    ),
  },
];

const Register = () => {
  const navigate = useNavigate();

  // Snackbar 상태 추가
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "warning" | "info",
  });

  const loginState = useAtomValue(jobTalkLoginStateAtom);
  const [email, setEmail] = useState("");
  const [isConfirmCodeSending, setIsConfirmCodeSending] = useState(false); // 인증번호 전송 중 여부
  const [isConfirmCodeSent, setIsConfirmCodeSent] = useState(false); // 인증번호 전송 여부
  const [isConfirmCodeChecked, setIsConfirmCodeChecked] = useState(false); // 인증번호 확인 여부
  const [confirmTimeLeft, setConfirmTimeLeft] = useState(300); // 인증번호 입력 남은 시간
  const [confirmCode, setConfirmCode] = useState(""); // 인증번호
  const [password, setPassword] = useState(""); // 사용자 비밀번호
  const [passwordConfirm, setPasswordConfirm] = useState(""); // 사용자 비밀번호 재확인
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // 비밀번호 보임/숨김
  const [isPasswordConfirmVisible, setIsPasswordCheckVisible] = useState(false); // 비밀번호 확인 보임/숨김
  const [name, setName] = useState(""); // 사용자 별명

  const [isTermAgreed, setIsTermAgreed] = useState(
    Array.from({ length: termsOfServices.length }, () => false)
  ); // 이용약관 동의 여부
  const [isTermExpanded, setIsTermExpanded] = useState(
    Array.from({ length: termsOfServices.length }, () => false)
  ); // 이용약관 펼치기 여부

  // 자격증 관련 상태 추가
  const [certificateOptions, setCertificateOptions] = useState<string[]>([]);
  const [certificateSearchTerm, setCertificateSearchTerm] = useState("");
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(
    []
  );
  const [isCertificatesLoading, setIsCertificatesLoading] = useState(false); // 자격증 목록 로딩 상태

  // 관심사 관련
  const [isInterestsLoading, setIsInterestsLoading] = useState(false); // 관심 분야 목록 로딩 상태
  const [interests, setInterests] = useState(""); // 관심사 정보 추가
  
  // 성공 Dialog 상태 추가
  const [successDialog, setSuccessDialog] = useState({
    open: false,
    message: "",
  });

  // 확인 다이얼로그 상태 추가
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    inputValue: string;
  }>({
    open: false,
    inputValue: "",
  });

  // 인증번호 입력 타이머 - 인증번호 전송 후 5분 카운트다운
  useEffect(() => {
    if (!isConfirmCodeSent || confirmTimeLeft <= 0 || isConfirmCodeChecked) {
      return;
    }

    const confirmCodeTimer = setInterval(() => {
      setConfirmTimeLeft((prevTime) => {
        // 남은 시간이 0이 되면 알림 표시
        if (prevTime <= 1 && !isConfirmCodeChecked) {
          setSnackbar({
            open: true,
            message:
              "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
            severity: "error",
          });
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(confirmCodeTimer); // 컴포넌트 언마운트 시 타이머 정리
  }, [isConfirmCodeChecked, confirmTimeLeft, isConfirmCodeSent]);

  // 이메일 입력
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    },
    []
  );

  // 인증번호 입력
  const handleConfirmCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmCode(e.target.value.replace(" ", ""));
    },
    []
  );

  // 인증번호 전송 버튼 클릭
  const handleConfirmCodeSendButtonClick = useCallback(async () => {
    // 이미 인증번호를 확인했다면 종료
    if (isConfirmCodeChecked) {
      setSnackbar({
        open: true,
        message: "이미 인증번호를 확인했습니다.",
        severity: "info",
      });
      return;
    }

    // // 이메일이 올바르지 않다면 종료
    // if (!isEmailValid(email)) {
    //   setSnackbar({
    //   open: true,
    //   message: "유효한 이메일 주소를 입력해주세요.",
    //   severity: "warning"
    // });
    // return;
    // }

    // 인증번호 요청 API 호출
    try {
      setIsConfirmCodeSending(true);

      // Step 1: CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // Step 2: 인증번호 요청
      await axiosInstance.post(
        "/auth/sendVerifyEmail",
        {
          email,
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken, // CSRF 토큰 추가
          },
        }
      );

      setIsConfirmCodeSent(true); // 인증번호 전송 여부를 true로 설정
      setConfirmTimeLeft(300); // 타이머를 5분(300초)으로 초기화
      setSnackbar({
        open: true,
        message: "인증번호가 이메일로 발송되었습니다.",
        severity: "success",
      });
    } catch (error) {
      // 요청 실패 시 알림
      if (axios.isAxiosError(error) && error.response) {
        setSnackbar({
          open: true,
          message: `이메일 전송 실패: ${
            error.response.data?.message || "알 수 없는 오류"
          }`,
          severity: "error",
        });
      } else {
        console.error("요청 오류:", (error as Error).message);
        setSnackbar({
          open: true,
          message: "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.",
          severity: "error",
        });
      }
    } finally {
      setIsConfirmCodeSending(false);
    }
  }, [email, isConfirmCodeChecked]);

  // 타이머 시간 포맷팅
  const getFormattedTime = useCallback(() => {
    // 남은 시간이 0 이하일 경우
    if (confirmTimeLeft <= 0) {
      return "시간초과";
    }

    // 이미 인증번호를 확인한 경우
    if (isConfirmCodeChecked) {
      return "인증완료";
    }

    const minutes = Math.floor(confirmTimeLeft / 60);
    const seconds = confirmTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [confirmTimeLeft, isConfirmCodeChecked]);

  // 인증번호 확인 버튼 클릭
  const handleConfirmCodeCheckButtonClick = useCallback(async () => {
    // 이미 확인된 인증번호라면 종료
    if (isConfirmCodeChecked) {
      setSnackbar({
        open: true,
        message: "이미 인증번호를 확인했습니다.",
        severity: "warning",
      });
      return;
    }

    // 시간이 초과된 경우
    if (confirmTimeLeft <= 0) {
      setSnackbar({
        open: true,
        message: "인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.",
        severity: "warning",
      });
      return;
    }

    // 인증번호가 비어있는 경우
    if (!confirmCode || confirmCode.length !== 6) {
      setSnackbar({
        open: true,
        message: "유효한 인증번호를 입력해주세요 (6자리)",
        severity: "warning",
      });
      return;
    }

    try {
      // Step 1: CSRF 토큰 가져오기
      const csrfToken = await getCsrfToken();

      // Step 2: 인증번호 확인 요청
      await axiosInstance.post(
        "/auth/verifyEmailCode",
        {
          email,
          code: confirmCode,
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken, // CSRF 토큰 추가
          },
        }
      );

      // 요청 성공 처리
      setSnackbar({
        open: true,
        message: "인증번호 확인이 완료되었습니다.",
        severity: "success",
      });
      setIsConfirmCodeChecked(true); // 인증 성공
    } catch (error) {
      // 요청 실패 처리
      if (axios.isAxiosError(error) && error.response) {
        setSnackbar({
          open: true,
          message: `"인증 실패\n" + ${
            error.response.data?.message || "알 수 없는 오류"
          }`,
          severity: "error",
        });
      } else {
        console.error("요청 오류:", (error as Error).message);
        setSnackbar({
          open: true,
          message:
            "예기치 않은 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
          severity: "error",
        });
      }
    }
  }, [confirmCode, confirmTimeLeft, email, isConfirmCodeChecked]);

  // 비밀번호 입력
  const handleChangePassword = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    []
  );

  // 비밀번호 재입력 입력
  const handlePasswordConfirmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordConfirm(e.target.value);
    },
    []
  );

  // 비밀번호 보임/숨김
  const handlePasswordVisibilityChange = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  // 비밀번호 확인 보임/숨김
  const handlePasswordConfirmVisibilityChange = useCallback(() => {
    setIsPasswordCheckVisible(!isPasswordConfirmVisible);
  }, [isPasswordConfirmVisible]);

  // 별명 입력
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
    },
    []
  );

  // 이용약관 전체 동의 버튼 클릭
  const handleTermAgreeAllButtonClick = useCallback(() => {
    const newCondition = isTermAgreed.some((agreed) => agreed) ? false : true;
    setIsTermAgreed(
      Array.from({ length: termsOfServices.length }, () => newCondition)
    );
  }, [isTermAgreed]);

  // 이용약관 동의 버튼 클릭
  const handleTermAgreeButtonClick = useCallback(
    (index: number) => {
      const newIsTermAgreed = [
        ...isTermAgreed.slice(0, index),
        !isTermAgreed[index],
        ...isTermAgreed.slice(index + 1),
      ];
      setIsTermAgreed(newIsTermAgreed);
    },
    [isTermAgreed]
  );

  // 이용약관 펼치기 버튼 클릭
  const handleExpandTermButtonClick = useCallback(
    (index: number) => {
      const newIsTermExpanded = [
        ...isTermExpanded.slice(0, index),
        !isTermExpanded[index],
        ...isTermExpanded.slice(index + 1),
      ];
      setIsTermExpanded(newIsTermExpanded);
    },
    [isTermExpanded]
  );

  const allRequiredAgreed = termsOfServices.every(
    (term, index) => term.isOptional || isTermAgreed[index]
  );

  // 성공 Dialog 닫기 핸들러
  const handleSuccessDialogClose = useCallback(() => {
    setSuccessDialog((prev) => ({ ...prev, open: false }));
    navigate("/login"); // Dialog 닫을 때 로그인 페이지로 이동
  }, [navigate]);

  // 회원가입 버튼 클릭
  const handleRegisterButtonClick = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // 전송 전 입력값 검증
      if (!email || !password || !passwordConfirm) {
        console.error("이메일 또는 비밀번호가 비어있으면 안됩니다.");
        setSnackbar({
          open: true,
          message: "이메일 또는 비밀번호가 비어있으면 안됩니다.",
          severity: "warning",
        });
        return;
      }

      if (!isConfirmCodeChecked) {
        console.error("이메일 인증을 완료해주세요.");
        setSnackbar({
          open: true,
          message: "이메일 인증을 완료해주세요.",
          severity: "warning",
        });
        return;
      }

      if (!name) {
        console.error("별명을 입력해주세요.");
        setSnackbar({
          open: true,
          message: "별명을 입력해주세요.",
          severity: "warning",
        });
        return;
      }

      if (password !== passwordConfirm) {
        setSnackbar({
          open: true,
          message: "비밀번호가 일치하지 않습니다.",
          severity: "error",
        });
        return;
      }

      if (!allRequiredAgreed) {
        setSnackbar({
          open: true,
          message: "필수 약관에 모두 동의해 주세요.",
          severity: "warning",
        });
        return;
      }

      try {
        // CSRF 토큰 가져오기
        const csrfToken = await getCsrfToken();

        // 이용약관 동의 여부 확인 - privacy만 필요
        const termsData = {
          privacy: isTermAgreed[0], // 개인정보 수집 및 이용약관 (필수)
        };

        // 서버로 회원가입 요청 전송
        await axiosInstance.post(
          "/auth/register",
          {
            email,
            password,
            name,
            terms: termsData,
            certificates:
              selectedCertificates.length > 0
                ? selectedCertificates.join(", ")
                : null, // 수정된 부분
            interests: interests || null, // 관심사 정보 추가
          },
          {
            headers: {
              "X-CSRF-Token": csrfToken, // CSRF 토큰 추가
            },
          }
        );

        // 성공 Dialog 표시 (Snackbar 대신)
        setSuccessDialog({
          open: true,
          message: "회원가입이 성공적으로 완료되었습니다!",
        });
        // navigate("/login") 코드 제거 - Dialog 닫을 때 이동하도록 수정
      } catch (error) {
        // 에러 처리
        if (axios.isAxiosError(error) && error.response) {
          const errorData = error.response.data;
          console.error("서버가 오류를 반환했습니다:", errorData.message);
          setSnackbar({
            open: true,
            message: `Error: ${errorData.message}`,
            severity: "error",
          });
        } else {
          console.error(
            "요청을 보내는 중 오류가 발생했습니다:",
            (error as Error).message
          );
          setSnackbar({
            open: true,
            message:
              "예기치 않은 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
            severity: "error",
          });
        }
      }
    },
    [
      email,
      password,
      passwordConfirm,
      isConfirmCodeChecked,
      name,
      allRequiredAgreed,
      isTermAgreed,
      selectedCertificates,
      interests,
    ]
  );

  // Snackbar 닫기 핸들러
  const handleSnackbarClose = useCallback(
    (_event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      setSnackbar((prev) => ({ ...prev, open: false }));
    },
    []
  );

  // 자격증 선택 변경 핸들러 추가
  const handleCertificateChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_event: any, newValue: string[]) => {
      setSelectedCertificates(newValue);
    },
    []
  );

  // 자격증 검색 함수 추가
  const searchCertificates = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setCertificateOptions([]);
      return;
    }

    try {
      setIsCertificatesLoading(true);

      const csrfToken = await getCsrfToken();
      const response = await axiosInstance.get("/qualification/search", {
        params: { keyword: searchTerm },
        headers: { "X-CSRF-Token": csrfToken },
      });

      if (response.data.success) {
        const qualifications = response.data.data.qualifications.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (q: any) => q.name
        );
        setCertificateOptions(qualifications);
      }
    } catch (error) {
      console.error("자격증 검색 오류:", error);
      setSnackbar({
        open: true,
        message: "자격증 검색에 실패했습니다.",
        severity: "error",
      });
    } finally {
      setIsCertificatesLoading(false);
    }
  }, []);

  // 유효하지 않은 자격증 입력 핸들러
  const handleInvalidCertificateInput = useCallback((inputValue: string) => {
    setConfirmDialog({
      open: true,
      inputValue: inputValue,
    });
  }, []);

  // 확인 다이얼로그에서 "예" 선택 시
  const handleConfirmAddCertificate = useCallback(() => {
    const { inputValue } = confirmDialog;
    if (inputValue) {
      // 기존 선택된 자격증에 추가
      const newCertificates = [...selectedCertificates, inputValue];
      const uniqueCertificates = [...new Set(newCertificates)]; // 중복 제거
      setSelectedCertificates(uniqueCertificates);
    }
    setConfirmDialog({ open: false, inputValue: "" });
  }, [confirmDialog, selectedCertificates]);

  // 확인 다이얼로그에서 "아니오" 선택 시
  const handleCancelAddCertificate = useCallback(() => {
    setConfirmDialog({ open: false, inputValue: "" });
  }, []);

  // 자격증 검색어 변경시 디바운스 적용
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (certificateSearchTerm) {
        searchCertificates(certificateSearchTerm);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [certificateSearchTerm, searchCertificates]);

  // 로그인된 상태라면 이전 페이지로 이동
  useLayoutEffect(() => {
    if (loginState.isLoggedIn) {
      if (window.history.length > 1) {
        navigate(-1); // 이전 페이지로 이동
      } else {
        navigate("/", { replace: true }); // 이전 페이지가 없으면 홈으로 이동
      }
    }
  }, [loginState.isLoggedIn, navigate]);

  if (loginState.isLoggedIn) {
    return null; // 컴포넌트 렌더링 중지
  }

  return (
    <Container maxWidth="xs">
      <Stack
        component="form"
        minHeight="calc(100vh - 64px)"
        justifyContent="center"
        paddingY={4}
        paddingBottom={10}
      >
        <Stack gap={4}>
          {/* 로고 링크 버튼 */}
          <PlainLink to="/">
            <Typography variant="h4" color="primary">
              JobTalk
            </Typography>
          </PlainLink>

          {/* 사용자 정보 입력 폼 */}
          <Stack gap={1}>
            {/* 헤더 */}
            <SectionHeader title="계정 정보" />

            {/* 이메일 */}
            <Stack gap={1}>
              {/* 이메일 입력란 */}
              <Stack direction="row" gap={1} mt={1}>
                <Box flex={1}>
                  <OutlinedTextField
                    label="이메일"
                    value={email}
                    onChange={handleEmailChange}
                  />
                </Box>

                {/* 인증 요청 버튼 */}
                <Button
                  variant="outlined"
                  loading={isConfirmCodeSending}
                  onClick={handleConfirmCodeSendButtonClick}
                  disabled={isConfirmCodeChecked}
                  sx={{
                    borderRadius: "8px",
                    bgcolor: isConfirmCodeChecked
                      ? "rgba(76, 175, 80, 0.1)"
                      : "inherit",
                  }}
                >
                  <Typography>
                    {isConfirmCodeChecked ? "인증완료" : "인증요청"}
                  </Typography>
                </Button>
              </Stack>

              {/* 인증번호 입력란 */}
              <Stack
                direction="row"
                gap={1}
                display={isConfirmCodeSent ? "flex" : "none"}
              >
                <Box flex={2}>
                  <OutlinedTextField
                    label="인증번호"
                    value={confirmCode}
                    onChange={handleConfirmCodeChange}
                    disabled={isConfirmCodeChecked || confirmTimeLeft <= 0}
                    error={confirmTimeLeft <= 0}
                  />
                </Box>

                {/* 남은 인증 시간 */}
                <Typography
                  variant="subtitle1"
                  alignSelf="center"
                  sx={{
                    width: "65px",
                    color: isConfirmCodeChecked
                      ? "#19df79" // 인증 완료 시 초록색
                      : confirmTimeLeft <= 0
                      ? "error.main" // 시간 초과 시 빨간색
                      : "primary.main", // 평상시 파란색
                  }}
                >
                  {getFormattedTime()}
                </Typography>

                {/* 인증 확인 버튼 */}
                <Button
                  variant="outlined"
                  onClick={handleConfirmCodeCheckButtonClick}
                  disabled={
                    isConfirmCodeChecked || confirmTimeLeft <= 0 || !confirmCode
                  }
                  sx={{
                    ml: 2,
                    borderRadius: "8px",
                    bgcolor: isConfirmCodeChecked
                      ? "rgba(76, 175, 80, 0.1)"
                      : "inherit",
                  }}
                >
                  <Typography>
                    {isConfirmCodeChecked ? "인증됨" : "인증확인"}
                  </Typography>
                </Button>
              </Stack>
            </Stack>

            {/* 비밀번호 입력란 */}
            <OutlinedTextField
              label="비밀번호"
              value={password}
              onChange={handleChangePassword}
              type={isPasswordVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handlePasswordVisibilityChange}
                    edge="end"
                  >
                    {isPasswordVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            {/* 비밀번호 재확인 입력란 */}
            <OutlinedTextField
              label="비밀번호 재확인"
              value={passwordConfirm}
              onChange={handlePasswordConfirmChange}
              type={isPasswordConfirmVisible ? "text" : "password"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={handlePasswordConfirmVisibilityChange}
                    edge="end"
                  >
                    {isPasswordConfirmVisible ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              }
            />

            {/* 별명 입력란 */}
            <OutlinedTextField
              label="별명"
              value={name}
              onChange={handleNameChange}
            />
          </Stack>

          {/* 추가 정보 입력 폼 */}
          <Stack gap={1}>
            <SectionHeader title="추가 정보 (선택사항)" />

            {/* 자격증 입력란 */}
            {/* 보유 증격증 */}
            <Stack direction="column" gap={1} alignItems="flex-start">
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

              {/* 자격증 입력란 */}
              <Box width="100%" flex={1}>
                <StyledAutocomplete
                  id="certificates-autocomplete"
                  options={certificateOptions}
                  value={selectedCertificates}
                  onChange={handleCertificateChange}
                  isLoading={isCertificatesLoading}
                  loadingText="자격증 목록을 불러오는중..."
                  placeholder="자격증을 입력하세요."
                  onInputChange={(_event, newInputValue) => {
                    setCertificateSearchTerm(newInputValue);
                  }}
                  onInvalidInput={handleInvalidCertificateInput}
                  freeSolo={false} // 자유 입력 비활성화
                  multiple
                />
              </Box>
            </Stack>

            {/* 관심 분야 */}
            <Stack direction="column" gap={1} alignItems="flex-start">
              <Stack
                direction="row"
                width="150px"
                paddingY={2}
                alignItems="center"
                gap={1}
              >
                {/* 컬럼명 */}
                <Typography>관심 분야</Typography>

                {/* 툴팁 */}
                <Tooltip title="관심 있는 분야를 입력해주세요.">
                  <HelpOutlineRoundedIcon />
                </Tooltip>
              </Stack>

              {/* 관심 분야 입력란 */}
              <Box width="100%" flex={1}>
                <StyledAutocomplete
                  id="interests-autocomplete"
                  options={[
                    "관심 분야 1",
                    "관심 분야 2",
                    "관심 분야 3",
                    "관심 분야 4",
                    "기타",
                  ]}
                  isLoading={isInterestsLoading}
                  loadingText="관심 분야 목록을 불러오는중..."
                  placeholder="관심 분야를 입력하세요."
                />
              </Box>
            </Stack>
          </Stack>

          {/* 이용약관 컨테이너 */}
          <Stack gap={1}>
            {/* 헤더 */}
            <SectionHeader title="이용약관" />

            {/* 전체 동의하기 체크박스 */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    name="전체 동의하기"
                    checked={isTermAgreed.every((agreed) => agreed)}
                    indeterminate={
                      isTermAgreed.some((agreed) => agreed) &&
                      !isTermAgreed.every((agreed) => agreed)
                    }
                    onChange={handleTermAgreeAllButtonClick}
                  />
                }
                label={<Typography variant="h6">전체 동의하기</Typography>}
              />
            </Box>

            {/* 약관 동의 항목 */}
            {termsOfServices.map((term, index) => (
              <Stack key={`term-${index}`}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  {/* 약관 동의 체크박스 */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        name={term.title}
                        checked={isTermAgreed[index]}
                        onChange={() => handleTermAgreeButtonClick(index)}
                      />
                    }
                    label={
                      <Stack
                        direction="row"
                        width="100%"
                        gap={1}
                        fontWeight="bold"
                        alignItems="center"
                      >
                        {/* 선택/필수 */}
                        <Typography
                          variant="subtitle1"
                          color={term.isOptional ? "divider" : "primary"}
                          fontWeight="inherit"
                          whiteSpace="nowrap"
                        >
                          [{term.isOptional ? "선택" : "필수"}]
                        </Typography>

                        {/* 이용약관 제목 */}
                        <Typography
                          variant="subtitle1"
                          fontWeight="inherit"
                          sx={{
                            wordBreak: "keep-all",
                          }}
                        >
                          {term.title}
                        </Typography>
                      </Stack>
                    }
                  />

                  {/* 약관 펼치기/접기 버튼 */}
                  <Box flex={1} display="flex" justifyContent="flex-end">
                    <Tooltip
                      title={isTermExpanded[index] ? "접기" : "펼치기"}
                      placement="top"
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleExpandTermButtonClick(index)}
                      >
                        <ExpandMoreRoundedIcon
                          sx={{
                            transform: isTermExpanded[index]
                              ? "rotate(180deg)"
                              : "none",
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
                <Paper
                  variant="outlined"
                  sx={{
                    marginLeft: "32px",
                    paddingLeft: 2,
                    paddingRight: 1,
                    paddingY: 1,
                  }}
                >
                  <Collapse
                    in={isTermExpanded[index]}
                    collapsedSize={60}
                    sx={{
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    {term.content}
                  </Collapse>
                </Paper>
              </Stack>
            ))}
          </Stack>

          <Stack gap={0.5}>
            {/* 회원가입 버튼 */}
            <Button
              variant="contained"
              onClick={handleRegisterButtonClick}
              disabled={!allRequiredAgreed || !isConfirmCodeChecked} // 필수 약관에 동의하지 않으면 비활성화
            >
              <Typography variant="h5" color="white">
                회원가입
              </Typography>
            </Button>

            {/* 로그인 페이지 링크 */}
            <Box alignSelf="flex-end">
              <PlainLink to="/login">
                <Typography variant="subtitle1" color="text.secondary">
                  이미 계정이 있으신가요?
                </Typography>
              </PlainLink>
            </Box>
          </Stack>
        </Stack>
      </Stack>

      {/* 성공 Dialog */}
      <Dialog
        open={successDialog.open}
        onClose={handleSuccessDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">회원가입 완료</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {successDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", padding: 2 }}>
          <Button
            onClick={handleSuccessDialogClose}
            color="primary"
            variant="contained"
            autoFocus
            sx={{ minWidth: "200px", py: 1 }}
          >
            로그인 페이지로 이동
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar 컴포넌트 추가 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 확인 다이얼로그 추가 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAddCertificate}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">자격증 등록 확인</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            <Typography
              component="span"
              sx={{
                color: "primary.main",
                fontWeight: "bold",
                backgroundColor: "rgba(25, 118, 210, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                mx: 0.5,
              }}
            >
              "{confirmDialog.inputValue}"
            </Typography>
            은(는)
            <Typography
              component="span"
              sx={{
                color: "#1565C0",
                fontWeight: "bold",
                backgroundColor: "rgba(21, 101, 192, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                mx: 0.5,
              }}
            >
              한국산업인력공단 국가자격 종목
            </Typography>
            에 등록되어 있지 않은 자격증입니다.
            <br />
            등록하시면,
            <Typography
              component="span"
              sx={{
                color: "error.main",
                fontWeight: "bold",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
                mx: 0.5,
              }}
            >
              로드맵 생성 시 불이익
            </Typography>
            이 발생할 수 있습니다.
            <br />
            정말 등록하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAddCertificate} color="primary">
            아니오
          </Button>
          <Button
            onClick={handleConfirmAddCertificate}
            color="primary"
            autoFocus
          >
            예
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Register;
