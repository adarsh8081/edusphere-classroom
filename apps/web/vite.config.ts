import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@db/schemas": path.resolve(__dirname, "../../database/schemas"),
            "@modules": path.resolve(__dirname, "../../services/api-server/src/modules"),
            "@core": path.resolve(__dirname, "../../services/api-server/src/modules/core"),
            "@edusphere/types": path.resolve(__dirname, "../../packages/types/src"),
            "@edusphere/ui": path.resolve(__dirname, "../../packages/ui/src"),
            "@edusphere/utils": path.resolve(__dirname, "../../packages/utils/src"),
            "@edusphere/api-client": path.resolve(__dirname, "../../packages/api-client/src"),
            "@edusphere/config": path.resolve(__dirname, "../../packages/config/src"),
            "@shared": path.resolve(__dirname, "../../shared"),
            "@assets": path.resolve(__dirname, "../../attached_assets"),
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:3000",
                ws: true,
            },
        },
    },
});
