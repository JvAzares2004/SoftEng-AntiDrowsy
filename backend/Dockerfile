# Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/package*.json ./

RUN npm ci --omit=dev

EXPOSE 3001
CMD ["node", "dist/main.js"]