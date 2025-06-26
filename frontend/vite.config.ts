import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
  ],
  base: "/project-mw",
  server: {
    port: 3000,
    allowedHosts: ["0.tcp.jp.ngrok.io"],
  },
});
