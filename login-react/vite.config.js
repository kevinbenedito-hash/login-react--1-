import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Se API_PROXY_TARGET estiver definido, o servidor de desenvolvimento
// repassa /api/* para a API real. Isso evita erros de CORS no navegador.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET;

  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            "/api": {
              target,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ""),
            },
          },
        }
      : {},
  };
});
