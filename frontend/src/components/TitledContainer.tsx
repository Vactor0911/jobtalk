import {
  Box,
  Divider,
  Paper,
  Stack,
  Typography,
  type PaperProps,
} from "@mui/material";

interface TitledContainerProps extends PaperProps {
  title: string;
  children?: React.ReactNode;
  collapsed?: boolean;
  toggleButton?: React.ReactNode;
}

const TitledContainer = (props: TitledContainerProps) => {
  const { title, children, sx, collapsed, toggleButton, ...others } = props;

  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        padding: 1,
        borderRadius: 4,
        ...sx,
      }}
      {...others}
    >
      <Stack gap={0.5} height="100%">
        {/* 헤더 */}
        <Stack direction="row" height="32px" alignItems="center">
          {!collapsed && (
            <Typography variant="subtitle1" marginLeft={1}>
              {title}
            </Typography>
          )}

          {/* 열림 토글 버튼 */}
          <Box marginLeft="auto">{toggleButton}</Box>
        </Stack>

        {/* 구분선 */}
        <Divider />

        {/* 내용 */}
        {!collapsed && (
          <Box flex={1} overflow="hidden">
            {children}
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default TitledContainer;
