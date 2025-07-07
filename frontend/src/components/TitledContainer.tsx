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
}

const TitledContainer = (props: TitledContainerProps) => {
  const { title, children, sx, ...others } = props;

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
        <Typography variant="subtitle1" marginX={1}>
          {title}
        </Typography>

        {/* 구분선 */}
        <Divider />

        {/* 내용 */}
        <Box flex={1}>{children}</Box>
      </Stack>
    </Paper>
  );
};

export default TitledContainer;
