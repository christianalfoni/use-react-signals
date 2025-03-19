import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import signalPlugin from "use-react-signals/babel-plugin";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [signalPlugin()],
      },
    }),
  ],
});
