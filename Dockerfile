# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build  # compiles NestJS TS to JS in dist/

# Final image
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/package*.json ./
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/dist ./dist/frontend

RUN npm ci --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]