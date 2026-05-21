import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['src/lib/__tests__/**/*.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/lib/__tests__/**'],
          environment: 'jsdom',
        },
      },
    ],
  },
})