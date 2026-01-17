import { defineConfig } from 'vite'

export default defineConfig({
  // ... other configs
  server: {
    watch: {
      usePolling: true
    }
  }
});