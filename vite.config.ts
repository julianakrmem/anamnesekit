import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` permite publicar no GitHub Pages sem configurar o nome do repositório.
export default defineConfig({
  plugins: [react()],
  base: './',
});
