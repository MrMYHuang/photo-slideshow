import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/photo-slideshow',
  define: {
    "process.env.PUBLIC_URL": `"photo-slideshow"`,
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
        "process.env.PUBLIC_URL": `""`,
      },
    }
  },
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        maximumFileSizeToCacheInBytes: 1048576000,
      }
    })
  ],
})
