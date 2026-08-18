import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function githubPagesSpaFallback(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const index = path.resolve('dist/index.html')
      if (!fs.existsSync(index)) return
      fs.mkdirSync(path.resolve('dist/journal'), { recursive: true })
      fs.copyFileSync(index, path.resolve('dist/journal/index.html'))
      fs.copyFileSync(index, path.resolve('dist/404.html'))
    },
  }
}

// Project site: https://k4vr.github.io/my-cursor-projects/
export default defineConfig({
  plugins: [react(), githubPagesSpaFallback()],
  base: '/my-cursor-projects/',
})
