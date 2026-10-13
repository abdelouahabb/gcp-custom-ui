import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';

function cloudpulseBackendWatchdogPlugin({ backendHost, backendPort, enabled }) {
  let backendProc = null;
  let checking = false;

  const ensureBackendRunning = () => {
    if (!enabled || checking) return;
    checking = true;
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.once('connect', () => {
      socket.destroy();
      checking = false;
    });
    const spawnIfDown = () => {
      socket.destroy();
      checking = false;
      if (backendProc && backendProc.exitCode === null) return;
      const serverScript = path.resolve(process.cwd(), 'server/index.js');
      console.log(
        `⚡ [CloudPulse Auto-Heal] Backend ${backendHost}:${backendPort} not running — auto-starting server/index.js...`
      );
      backendProc = spawn(process.execPath, [serverScript], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: String(backendPort),
          BACKEND_HOST: String(backendHost),
        },
      });
      backendProc.on('exit', () => {
        backendProc = null;
      });
    };
    socket.once('error', spawnIfDown);
    socket.once('timeout', spawnIfDown);
    socket.connect(backendPort, backendHost);
  };

  return {
    name: 'cloudpulse-backend-watchdog',
    configureServer(server) {
      if (!enabled) return;
      ensureBackendRunning();
      const timer = setInterval(ensureBackendRunning, 4000);
      server.httpServer?.once('close', () => {
        clearInterval(timer);
        if (backendProc && backendProc.exitCode === null) {
          backendProc.kill();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendHost = env.BACKEND_HOST || process.env.BACKEND_HOST || '127.0.0.1';
  const backendPort = Number(
    env.BACKEND_PORT || process.env.BACKEND_PORT || env.PORT || process.env.PORT || 4000
  );
  const proxyTarget =
    env.VITE_API_PROXY_TARGET ||
    process.env.VITE_API_PROXY_TARGET ||
    `http://${backendHost}:${backendPort}`;
  const frontendPort = Number(env.VITE_PORT || process.env.VITE_PORT || 5173);
  const frontendHost = env.VITE_HOST || process.env.VITE_HOST || '0.0.0.0';
  const autoStartBackend =
    String(env.VITE_AUTO_START_BACKEND ?? process.env.VITE_AUTO_START_BACKEND ?? 'true') !==
    'false';

  return {
    plugins: [
      react(),
      cloudpulseBackendWatchdogPlugin({
        backendHost,
        backendPort,
        enabled: autoStartBackend,
      }),
    ],
    server: {
      port: frontendPort,
      host: frontendHost,
      proxy: {
        '/api': {
          target: proxyTarget,
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
  };
});

