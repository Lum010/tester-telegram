import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-serverless-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            if (url.startsWith('/api/health')) {
              const { default: handler } = await import('./api/health.ts');
              return handler(req as any, res as any);
            }
            if (url.startsWith('/api/sora')) {
              const { default: handler } = await import('./api/sora.ts');
              return handler(req as any, res as any);
            }
            if (url.startsWith('/api/telegram')) {
              const { default: handler } = await import('./api/telegram.ts');
              return handler(req as any, res as any);
            }
            if (url === '/api' || url === '/api/') {
              const { default: handler } = await import('./api/index.ts');
              return handler(req as any, res as any);
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
