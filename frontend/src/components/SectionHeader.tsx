import { Divider, Stack, Typography, type TypographyProps } from "@mui/material";
import { theme } from "../utils/theme";

interface SectionHeaderProps {
  title: string;
  variant?: TypographyProps["variant"];
}

const SectionHeader = (props: SectionHeaderProps) => {
  const { title, variant = "h6" } = props;

  return (
    <Stack>
      <Typography
        variant={variant}
        display="inline"
        alignSelf="flex-start"
        padding="6px 32px"
        position="relative"
        sx={{
          "&:after": {
            content: '""',
            position: "absolute",
            left: "0",
            bottom: "-2.4px",
            width: "100%",
            height: "2.4px",
            background: theme.palette.primary.main,
            borderTopLeftRadius: "50px",
            borderBottomLeftRadius: "50px",
            zIndex: 2,
          },
        }}
      >
        {title}
      </Typography>
      <Divider />
    </Stack>
  );
};

export default SectionHeader;
