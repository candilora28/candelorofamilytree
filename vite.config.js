import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/candelorofamilytree/', // 👈 Replace this with your GitHub repo name
  plugins: [react()],
})
