import { defineConfig, loadEnv } from "vite"; // เพิ่ม loadEnv
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from 'url';
import { componentTagger } from "lovable-tagger";
import basicSsl from '@vitejs/plugin-basic-ssl';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig(({ mode }) => {
  // โหลด env เผื่อเอามาใช้ใน config
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: "::",
      port: Number(process.env.PORT) || 8080, // ใช้พอร์ตจากระบบ (ถ้ามี)
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:3000', // ปรับเปลี่ยนตาม env
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      // ใช้ SSL เฉพาะตอน Development เท่านั้น เพื่อไม่ให้กวนใจระบบ Production
      mode === "development" ? basicSsl() : null,
      mode === "development" ? componentTagger() : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
