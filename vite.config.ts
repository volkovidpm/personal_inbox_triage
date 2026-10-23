import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// На GitHub Pages приложение раздаётся из /personal_inbox_triage/, поэтому при сборке
// задаём base. В режиме разработки base остаётся "/", чтобы npm run dev работал
// по обычному адресу.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/personal_inbox_triage/" : "/",
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
  },
}));
