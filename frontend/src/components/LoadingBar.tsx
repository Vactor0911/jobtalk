import { Box, keyframes, useTheme } from "@mui/material";

const gradientAnimation = keyframes`
    0% {
        background-position: 0% 0%;
    }
    100% {
        background-position: -200% 0%;
    }
`;

interface LoadingBarProps {
  percentage?: number;
}

const LoadingBar = (props: LoadingBarProps) => {
  const { percentage = 0 } = props;

  const theme = useTheme();

  return (
    <Box width="100%" bgcolor={theme.palette.divider} borderRadius="50px">
      <Box
        width={`${percentage}%`}
        height="10px"
        borderRadius="50px"
        sx={{
          background: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, #ffede5 50%, ${theme.palette.primary.main} 100%)`,
          backgroundSize: "200% auto",
          animation: `${gradientAnimation} 3s linear infinite`,
          transition: "width 0.3s ease-in-out",
        }}
      />
    </Box>
  );
};

export default LoadingBar;
