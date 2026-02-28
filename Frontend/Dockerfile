# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy package files and install
COPY Frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY Frontend/ ./
RUN npm run build

# Final image to serve static files
FROM node:20-alpine
WORKDIR /app

# Install a lightweight static server (like serve)
RUN npm install -g serve

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

EXPOSE 3000

# Serve frontend on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]