# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy source code and build NestJS
COPY backend/ ./
RUN npm run build

# Final backend image
FROM node:20-alpine
WORKDIR /app

# Copy built files
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package*.json ./

# Install only production deps
RUN npm ci --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]