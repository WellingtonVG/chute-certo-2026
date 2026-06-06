import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "https://wayngmzajminffglcqak.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6IndheW5nbXpham1pbmZmZ2xjcWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDA4NTksImV4cCI6MjA5MDcxNjg1OX0.WjSqiAQ7wSz_5HHf_8wynSylG7fXBpm0kmQ8wijeHoo";
const SUPABASE_PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID ?? "wayngmzajminffglcqak";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(SUPABASE_PROJECT_ID),
  },
}));
