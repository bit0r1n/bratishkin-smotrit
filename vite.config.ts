import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        entryFileNames: 'bratishkin.js',
        format: 'iife',
      },
    },
  },
})
