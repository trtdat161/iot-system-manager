import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    watch: {
      usePolling: true, // Rất quan trọng cho Windows / WSL
      interval: 100,
    },
    hmr: {
      overlay: true,
    },
  },
});
// cấu hình lại để cập nhật UI nhanh
