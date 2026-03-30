import {defineConfig} from 'vite';
import {devtools} from '@tanstack/devtools-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import {tanstackStart} from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@netlify/vite-plugin-tanstack-start';

const config = defineConfig({
  plugins: [
    devtools(),
    tsconfigPaths({projects: ['./tsconfig.json']}),
    tailwindcss(),
    tanstackStart({router: {routesDirectory: 'app'}}),
    netlify({
      dev: {
        redirects: {
          enabled: true,
        },
      }
    }),
    viteReact({babel: {plugins: ['babel-plugin-react-compiler']}}),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});

export default config;
