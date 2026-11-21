import path from 'node:path';
import { transformWithOxc } from 'vite';
import { defineConfig } from 'vitest/config';

// src/ ki files .js hain par JSX likhi hai (Next.js jaisa). Vite sirf .jsx me JSX maanta hai,
// isliye .js files ko pehle JSX ki tarah compile karte hain.
const jsxInJs = {
  name: 'jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!/[\\/](src|tests)[\\/].*\.js$/.test(id) || !code.includes('<')) return null;
    return transformWithOxc(code, id, { lang: 'jsx', jsx: { runtime: 'automatic' } });
  },
};

export default defineConfig({
  plugins: [jsxInJs],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_USE_MOCKS: 'true',
      NEXT_PUBLIC_API_URL: 'http://localhost:5000/api/v1',
    },
  },
});
