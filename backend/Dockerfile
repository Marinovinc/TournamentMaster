# ============================================
# MULTI-STAGE BUILD - TournamentMaster Backend
# ============================================

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm ci

# ============================================
# STAGE 2: Builder (Production Build)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# ============================================
# STAGE 3: Development
# Used in docker-compose with target: development
# ============================================
FROM node:20-alpine AS development

WORKDIR /app

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Copy all dependencies (include devDependencies for hot reload)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Development command (hot reload con nodemon)
CMD ["npm", "run", "dev"]

# ============================================
# STAGE 4: Production
# Used for production deployment
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
RUN chown -R expressjs:nodejs /app
USER expressjs

# Expose port
EXPOSE 3001

# Production command
CMD ["node", "dist/index.js"]
