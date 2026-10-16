# ============================================================================
# CloudPulse 2026 — Production Multi-Stage Container Image (Cloud Run / GKE)
# Includes:
#  - Node.js 22 LTS runtime + Vite production static bundle (/app/dist)
#  - Google Cloud SDK (gcloud, bq, gsutil) + Python 3 PTY bridge for Web-SSH
#  - Non-blocking IPv4-first Google Cloud REST API + WebSocket SSH2 server
# ============================================================================

# Stage 1: Build Frontend Production Bundle (Vite + React 18 + ECharts + Xterm)
FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# Stage 2: Production Runtime with Google Cloud SDK & Python3 PTY Bridge
FROM node:22-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV BACKEND_PORT=8080
ENV CLOUDSDK_METRICS_ENVIRONMENT=datacloud.antigravity

# Install system dependencies required for gcloud CLI, Web-SSH PTY & health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    openssh-client \
    python3 \
    python3-minimal \
    procps \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" \
       > /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg \
       | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg \
    && apt-get update && apt-get install -y --no-install-recommends \
       google-cloud-cli \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend assets and backend server
COPY --from=frontend-builder /app/dist ./dist
COPY server ./server
COPY docs ./docs
COPY README.md ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/api/context || exit 1

CMD ["node", "server/index.js"]
