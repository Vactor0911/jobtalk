import {
  Box,
  keyframes,
  Stack,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  Typography,
  useTheme,
  type StepIconProps,
} from "@mui/material";
import LightbulbOutlineRoundedIcon from "@mui/icons-material/LightbulbOutlineRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import type { ReactNode } from "react";
import { grey } from "@mui/material/colors";

const steps = ["관심분야 선택", "챗봇 질문", "로드맵 생성"];

// 스텝 아이콘 배경 컴포넌트
interface StyledStepIconRootProps {
  className?: string;
  children?: ReactNode;
  active?: boolean;
}

const StyledStepIconRoot = (props: StyledStepIconRootProps) => {
  const { className, children, active } = props;

  const rotateAnimation = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `;

  const rotateReverseAnimation = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(-360deg);
    }
  `;

  const theme = useTheme();

  return (
    <Box
      className={className}
      padding={{
        xs: "3px",
        md: "4px",
      }}
      borderRadius="50%"
      sx={{
        background: active
          ? `conic-gradient(from -45deg, ${theme.palette.primary.main}, #fff,
            ${theme.palette.primary.main}, #fff, ${theme.palette.primary.main})`
          : grey[400],
        animation: active ? `${rotateAnimation} 1s ease-in-out` : "none",
      }}
    >
      <Stack
        padding={{
          xs: 1.5,
          md: 2,
        }}
        justifyContent="center"
        alignItems="center"
        color={active ? theme.palette.primary.main : grey[400]}
        borderRadius="50%"
        sx={{
          background: "white",
          animation: active
            ? `${rotateReverseAnimation} 1s ease-in-out`
            : "none",
          "& .MuiSvgIcon-root": {
            fontSize: { xs: "1.5rem", sm: "2.5rem", md: "4rem" },
          },
        }}
      >
        {children}
      </Stack>
    </Box>
  );
};

// 스텝 아이콘 컴포넌트
const StyledStepIcon = (props: StepIconProps) => {
  const { className, active } = props;

  const icons: { [index: string]: React.ReactElement<unknown> } = {
    1: <LightbulbOutlineRoundedIcon />,
    2: <SmartToyRoundedIcon />,
    3: <NoteAddRoundedIcon />,
  };

  return (
    <StyledStepIconRoot active={active} className={className}>
      {icons[String(props.icon)]}
    </StyledStepIconRoot>
  );
};

// 스텝 라벨 컴포넌트
interface StyledStepLabelProps {
  children: ReactNode;
  ownerState: { active?: boolean };
}

const StyledStepLabel = ({ children, ownerState }: StyledStepLabelProps) => {
  const theme = useTheme();

  return (
    <Typography
      variant="h6"
      fontSize={{
        xs: theme.typography.subtitle2.fontSize,
        md: theme.typography.h6.fontSize,
      }}
      color={ownerState.active ? "primary" : grey[400]}
    >
      {children}
    </Typography>
  );
};

// 스템 커넥터 컴포넌트
const StyledStepConnector = () => {
  const gradientAnimation = keyframes`
    0% {
        background-position: 0% 0%;
    }
    100% {
        background-position: -200% 0%;
    }
  `;

  const theme = useTheme();

  return (
    <StepConnector
      sx={{
        top: {
          xs: "27px",
          sm: "35px",
          md: "52px",
        },
        marginX: "15%",
        transform: "translateY(-50%)",
        "& .MuiStepConnector-line": {
          height: "6px",
          border: "none",
          position: "relative",
          borderRadius: "50px",
          background: grey[400],
        },
        "&.Mui-active .MuiStepConnector-line": {
          background: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, #ffede5 50%, ${theme.palette.primary.main} 100%)`,
          backgroundSize: "200% auto",
          animation: `${gradientAnimation} 3s linear infinite`,
        },
        "& .MuiStepConnector-line:before, & .MuiStepConnector-line:after": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "100%",
          height: "6px",
          borderRadius: "50px",
          background: "inherit",
          backgroundSize: "inherit",
          transformOrigin: "center right",
          clipPath: "inset(0 0 0 calc(100% - 25px))",
          animation: "inherit",
        },
        "& .MuiStepConnector-line:before": {
          transform: "rotate(30deg) translateY(1.5px)",
        },
        "& .MuiStepConnector-line:after": {
          transform: "rotate(-30deg) translateY(-1.5px)",
        },
      }}
    />
  );
};

const WorkspaceStepper = ({ activeStep }: { activeStep: number }) => {
  return (
    <Stepper
      alternativeLabel
      activeStep={activeStep / 2}
      connector={<StyledStepConnector />}
    >
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel
            slots={{
              stepIcon: StyledStepIcon,
              label: (props) => (
                <StyledStepLabel
                  {...props}
                  ownerState={{
                    active: (activeStep - 1) * 0.5 === steps.indexOf(label),
                  }}
                />
              ),
            }}
            slotProps={{
              stepIcon: {
                active: (activeStep - 1) * 0.5 === steps.indexOf(label),
              },
            }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default WorkspaceStepper;
