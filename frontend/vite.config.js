import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(), tailwindcss(),
  ],
  define: {
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env.VITE_API_URL': JSON.stringify("http://localhost:5000/api"),
    'import.meta.env.VITE_SOCKET_URL': JSON.stringify("http://localhost:5000"),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || 'production')
  }
}))
