# Stage 1: Build the React + Vite PWA Frontend
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npx vite build

# Stage 2: Production Cloud Run Server (serves static PWA + /api/* GCP Bridge)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY server ./server
EXPOSE 8080
CMD ["node", "server/index.js"]
