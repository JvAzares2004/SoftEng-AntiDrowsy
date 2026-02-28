# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install ALL dependencies including dev (needed for Nest build)
RUN npm ci

# Copy source code
COPY backend/ ./

# Build NestJS (produces dist/)
RUN npm run build

# Final production image
FROM node:20-alpine
WORKDIR /app

# Copy built dist and package.json
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

EXPOSE 3001
CMD ["node", "dist/main.js"]