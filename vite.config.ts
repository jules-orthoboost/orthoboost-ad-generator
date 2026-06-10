/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/orthoboost-ad-generator/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
