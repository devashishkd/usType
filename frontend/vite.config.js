import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(), tailwindcss(),
  ],
  define: {
    'import.meta.env.MODE': JSON.stringify(mode),
    'import.meta.env.VITE_API_URL': JSON.stringify("https://typex-jygr.onrender.com/api"),
    'import.meta.env.VITE_SOCKET_URL': JSON.stringify("https://typex-jygr.onrender.com"),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || 'production')
  }
}))
