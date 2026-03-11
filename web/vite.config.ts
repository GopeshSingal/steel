import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Send api request to Go server
            '/healthz': 'http://backend:8080',
            '/api': 'http://backend:8080'
        }
    }
})
