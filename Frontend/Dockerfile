# Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

RUN npm install -g serve

COPY --from=frontend-build /app/dist ./dist

EXPOSE 3000
CMD serve -s dist -l ${PORT:-3000}