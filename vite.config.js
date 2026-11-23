import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works under any GitHub Pages sub-path
  // (https://<user>.github.io/<repo>/) without hard-coding the repo name.
  base: './',
})
