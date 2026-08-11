import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: https://k4vr.github.io/my-cursor-projects/
export default defineConfig({
  plugins: [react()],
  base: '/my-cursor-projects/',
})
