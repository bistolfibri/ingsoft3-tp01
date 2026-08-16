# ---- Etapa 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ---- Etapa 2: final ----
FROM node:20-alpine AS final
WORKDIR /app

COPY --from=build /app ./

EXPOSE 3001
ENV PORT=3001

CMD ["node", "src/server.js"]