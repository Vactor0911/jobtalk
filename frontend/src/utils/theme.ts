import { createTheme, responsiveFontSizes } from "@mui/material";

// MUI 테마
export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      primary: {
        main: "#ff8551",
      },
      secondary: {
        main: "#faf0e4",
      },
      text: {
        primary: "#404040",
        secondary: "#787878",
      },
    },
    typography: {
      fontFamily: ["Noto Sans KR", "sans-serif"].join(","),
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 700,
      },
      h4: {
        fontWeight: 700,
      },
      h5: {
        fontWeight: 700,
      },
      h6: {
        fontWeight: 700,
      },
    },
    components: {
      MuiDivider: {
        styleOverrides: {
          root: {
            borderWidth: 1.2,
            borderRadius: "50px",
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
          placement: "top",
          sx: {
            cursor: "pointer",
          },
        },
        styleOverrides: {
          tooltip: {
            fontSize: "0.9rem",
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            wordBreak: "keep-all",
          },
        },
      },
    },
  })
);
