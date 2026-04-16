# Multi-stage build for ReWear Platform

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Install production dependencies
RUN npm install -g pm2

# Copy backend
COPY server/ ./server/
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend
COPY --from=frontend-builder /app/client/build ./client/build

# Copy environment template
COPY .env.example .env

# Expose ports
EXPOSE 5000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["pm2-runtime", "start", "server/index.js", "--name", "rewear-api"]
