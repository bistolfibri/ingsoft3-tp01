# ---- ETAPA 1: Compilación de React ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build # Vite genera la carpeta estática /app/dist

# ---- ETAPA 2: Servidor Web Nginx con Plantilla ----
FROM nginx:alpine

# Copiamos nuestra plantilla a la carpeta oficial de plantillas de Nginx:
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copiamos la web de React compilada a la carpeta pública de Nginx:
COPY --from=build /app/dist /usr/share/nginx/html

# Valores por defecto para desarrollo local (Docker Compose):
ENV BACKEND_URL=http://backend:3001 \
    DNS_RESOLVER=127.0.0.11

# Puerto expuesto por el servidor web Nginx
EXPOSE 80
