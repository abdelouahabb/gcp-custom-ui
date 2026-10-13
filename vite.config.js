import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-echarts';
            }
            if (id.includes('@xterm')) {
              return 'vendor-xterm';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            return 'vendor-core';
          }
          if (id.includes('src/components/GlobalNetworkWorldMap')) {
            return 'studio-global-map';
          }
          if (id.includes('src/components/ResourceProvisionModal')) {
            return 'studio-provision-modal';
          }
          if (id.includes('src/components/CloudRunFleetManager')) {
            return 'studio-cloudrun';
          }
          if (id.includes('src/components/DataEngineeringStudio')) {
            return 'studio-data-engineering';
          }
          if (
            id.includes('src/components/BigQueryStudio') ||
            id.includes('src/components/BigLakeIcebergStudio')
          ) {
            return 'studio-bigquery-biglake';
          }
          if (
            id.includes('src/components/CloudFunctionsEventarcStudio') ||
            id.includes('src/components/SovereignTimeMachineIamStudio')
          ) {
            return 'studio-functions-iam';
          }
          if (
            id.includes('src/components/EngineerMoonshotsWave3') ||
            id.includes('src/components/Revolutionary2026Suite') ||
            id.includes('src/components/EngineerWishlistWave2')
          ) {
            return 'studio-innovation-lab';
          }
        },
      },
    },
  },
});

