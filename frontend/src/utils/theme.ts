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
  })
);
