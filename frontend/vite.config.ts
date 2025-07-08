import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// 👇 Add your GitHub repo name here
// const repoName = "group-bot-automator" || "";
const repoName = "";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // base: `/${repoName}/`, // 👈 This is the key change
  base: '', // 👈 This is the key change
  server: {
    host: true,
    port: 8080,
    allowedHosts: [
      '*',
      '127.0.0.1',
    ],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
