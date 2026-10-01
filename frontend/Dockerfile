# ---- Etapa 1: build de React ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Etapa 2: servidor estático Nginx con plantilla ----
FROM nginx:alpine
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:3001 \
    DNS_RESOLVER=127.0.0.11

EXPOSE 80
