import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Ensures zustand and the app use the same React instance (avoids "Invalid hook call").
    dedupe: ['react', 'react-dom'],
  },
})


