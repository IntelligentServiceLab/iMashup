import { defineConfig } from 'vite'
import zipPack from "vite-plugin-zip-pack"
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    zipPack({
      inDir: 'dist',
      outDir: 'archive',
      outFileName: `easy-composer-${new Date().toISOString().slice(0, 10)}.zip`,
      pathPrefix: ''
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
})

// https://blog.csdn.net/KimBing/article/details/135426828