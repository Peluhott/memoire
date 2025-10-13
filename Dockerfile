# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps (incl. dev) to build TS
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Generate Prisma client for build-time type safety (no-op if not used)
RUN npx prisma generate || true
# Build: prefer your build script; fall back to tsc
RUN sh -c "npm run build || npx tsc --project tsconfig.json"

# ---------- Stage 2: Run (prod only) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install prod deps only (fresh, small)
COPY package*.json ./
RUN npm ci --omit=dev

# Bring prisma schema + generate client for linux-musl (Alpine)
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate || true

# Bring built JS artifacts
COPY --from=builder /app/dist ./dist

# (Optional) include migrations or any runtime assets as needed:
# COPY --from=builder /app/prisma/migrations ./prisma/migrations

# If you expose HTTP on 3000, adjust as needed
EXPOSE 3000

# Your entry point: server.ts -> dist/server.js
CMD ["node", "dist/server.js"]
