import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'KineticUI',
      fileName: (format) => `kinetic-ui.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'motion', 'motion/react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'motion': 'Motion',
          'motion/react': 'MotionReact'
        },
      },
    },
  },
})
