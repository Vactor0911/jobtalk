import { AppBar, Stack, Toolbar, Typography, useTheme } from "@mui/material";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogoClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;
