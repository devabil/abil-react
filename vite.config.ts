import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

                                                                                      
                                                                                
                                                                             
                                                                              
const PROD_HOST = "https://abil.ch";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: PROD_HOST,
        changeOrigin: true,
        secure: true,
      },
    },
  },
                                                                               
                                                                               
  oxc: mode === "production"
    ? { jsx: {}, transform: { decorator: {} }, drop: ["console", "debugger"] }
    : {},
  build: {
                                                                                   
                                                      
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react";
          if (id.includes("node_modules/lucide-react/")) return "icons";
          if (id.includes("node_modules/pdf-lib/") || id.includes("node_modules/pdfjs-dist/")) return "pdf";
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
