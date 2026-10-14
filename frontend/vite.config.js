import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function lookBannerPlugin() {
  return {
    name: 'look-banner',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const port = server.config.server.port || 5173;
        const line = '─'.repeat(50);
        console.log(`\n\x1b[36m${line}\x1b[0m`);
        console.log(`\x1b[1m\x1b[36m  Look Restaurant — Фронтенд запущен\x1b[0m`);
        console.log(`\x1b[36m${line}\x1b[0m`);
        console.log(`  \x1b[33mСайт:   \x1b[0mhttp://127.0.0.1:${port}`);
        console.log(`  \x1b[33mАдминка:\x1b[0mhttp://127.0.0.1:${port}/admin`);
        console.log(`  \x1b[33mПароль: \x1b[0madmin123`);
        console.log(`\x1b[36m${line}\x1b[0m\n`);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.API_TARGET || env.VITE_API_URL || 'http://127.0.0.1:8000';

  return {
    base: '/',
    plugins: [react(), lookBannerPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        }
      }
    }
  }
});
