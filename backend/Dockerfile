# Multi-Stage Production Dockerfile for AWS App Runner / ECS
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/

# Generate Prisma Client & Compile TypeScript
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package definitions and install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Command to start Express server
CMD ["node", "dist/server.js"]
