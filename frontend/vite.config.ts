import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Gom nhóm các thư viện Core UI/Logic
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-core";
            }
            // Gom nhóm các thư viện Visualization (Three.js, D3, Recharts...)
            if (id.includes("three") || id.includes("d3") || id.includes("recharts")) {
              return "vendor-viz";
            }
            // Tất cả các thư viện nhỏ khác gom vào một file vendors chung
            return "vendor-libs";
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    watch: {
      // Đảm bảo Vite theo dõi cả thay đổi từ folder shared
      ignored: ["!**/node_modules/@attack-visualization-system/shared/**"]
    }
  }
})