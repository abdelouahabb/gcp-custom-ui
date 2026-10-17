import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'node:net';
import fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';

function cloudpulseBackendWatchdogPlugin({ backendHost, backendPort, enabled }) {
  let backendProc = null;
  let checking = false;
  const serverScript = path.resolve(process.cwd(), 'server/index.js');

  const startBackendProcess = () => {
    if (backendProc && backendProc.exitCode === null) return;
    console.log(
      ` [CloudPulse Auto-Heal] Starting server/index.js on ${backendHost}:${backendPort}...`
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

  const restartBackendProcess = () => {
    try {
      if (backendProc && backendProc.exitCode === null) {
        backendProc.kill('SIGTERM');
        backendProc = null;
      }
      execSync('pkill -f "node .*/server/index.js" || true', { stdio: 'ignore' });
    } catch {
      // ignore
    }
    setTimeout(startBackendProcess, 350);
  };

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
      startBackendProcess();
    };
    socket.once('error', spawnIfDown);
    socket.once('timeout', spawnIfDown);
    socket.connect(backendPort, backendHost);
  };

  return {
    name: 'cloudpulse-backend-watchdog',
    configureServer(server) {
      if (!enabled) return;
      try {
        const staleDist = path.resolve(process.cwd(), 'dist');
        if (fs.existsSync(staleDist)) {
          fs.rmSync(staleDist, { recursive: true, force: true });
        }
      } catch {
        // ignore
      }
      restartBackendProcess();
      const timer = setInterval(ensureBackendRunning, 4000);
      fs.watchFile(serverScript, { interval: 1000 }, (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
          restartBackendProcess();
        }
      });
      server.httpServer?.once('close', () => {
        clearInterval(timer);
        fs.unwatchFile(serverScript);
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
      chunkSizeWarningLimit: 1100,
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
            if (id.includes('src/components/AwsAzureEnvySuiteStudio')) {
              return 'studio-multi-cloud-parity';
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
              id.includes('src/components/BillingAccountCreditGuardian') ||
              id.includes('src/components/EmergencyApiKillSwitch')
            ) {
              return 'studio-billing-finops';
            }
            if (
              id.includes('src/components/LogStreamerAndShell') ||
              id.includes('src/components/InteractiveDocsGuide')
            ) {
              return 'studio-logs-docs';
            }
            if (
              id.includes('src/components/VpcNetworksAndFirewalls') ||
              id.includes('src/components/CloudStorageStudio') ||
              id.includes('src/components/VmFleetAndSsh')
            ) {
              return 'studio-core-infra';
            }
            if (
              id.includes('src/components/GkeFleetStudio') ||
              id.includes('src/components/CloudSqlAndAlloyDbStudio') ||
              id.includes('src/components/Wave9AiGkeSqlSupplyChainStudio') ||
              id.includes('src/components/Wave10Frontier2026Studio')
            ) {
              return 'studio-gke-sql-frontier';
            }
            if (
              id.includes('src/components/EngineerMoonshotsWave3') ||
              id.includes('src/components/Revolutionary2026Suite') ||
              id.includes('src/components/EngineerWishlistWave2') ||
              id.includes('src/components/AutonomousCloudBrain') ||
              id.includes('src/components/Lab2026QuantumNexus') ||
              id.includes('src/components/Wave11MoonshotStudio') ||
              id.includes('src/components/Wave12RoadsterFlightDeckStudio') ||
              id.includes('src/components/Wave13StarlinkNeuralinkStudio') ||
              id.includes('src/components/Wave14QuantumTimeTravelDoctorStudio') ||
              id.includes('src/components/Wave15DysonSupplyLoggingTlsStudio')
            ) {
              return 'studio-innovation-lab';
            }
          },
        },
      },
    },
  };
});

