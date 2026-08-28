[![CI](https://github.com/bistolfibri/ingsoft3-tp01/actions/workflows/ci.yml/badge.svg)](https://github.com/bistolfibri/ingsoft3-tp01/actions/workflows/ci.yml)

# ingsoft3-tp01 — FinFix (Sistema de Control de Gastos)

Proyecto desarrollado para la materia Ingeniería del Software III (UCC 2026).

---

## TP1 — Git Colaborativo
Repositorio colaborativo inicial configurado con reglas de protección de rama y release tag v1.0.0.

---

## TP2 — Guía de Ejecución y Evaluación del Sistema con Docker Compose

Para ejecutar el sistema completo en una máquina limpia sin necesidad de instalar Node.js ni PostgreSQL:

### Prueba 1: Levantar desde el Código Fuente Local

#### 1. Clonar el repositorio:
```bash
git clone https://github.com/bistolfibri/ingsoft3-tp01.git
cd ingsoft3-tp01
```

#### 2. Configurar variables de entorno desde la plantilla pública:
```bash
cp .env.example .env
```
*(En Windows CMD si no funciona cp, ejecutar: copy .env.example .env)*

#### 3. Levantar el sistema completo (Frontend + Backend + PostgreSQL):
```bash
docker compose up -d
```

#### 4. Abrir la aplicación en el navegador:
Ingresá a: http://localhost:3000

---

### Prueba 2: Levantar descargando las imágenes de la nube (GitHub Packages - ghcr.io)

#### 1. Apagar los contenedores anteriores (si estaban corriendo):
```bash
docker compose down
```

#### 2. Levantar descargando las imágenes publicadas:
```bash
docker compose -f docker-compose.registry.yml up -d
```

#### 3. Abrir la aplicación en el navegador:
Ingresá a: http://localhost:3000

---

## Arquitectura del Sistema (TP2)
- Frontend: React + Vite servido en producción por Nginx (Puerto 3000).
- Backend: API REST en Node.js / Express (Puerto 3001).
- Base de Datos: PostgreSQL 16 Alpine con persistencia en volumen db_data (Puerto 5432).
- Registry de Imágenes: ghcr.io/bistolfibri/finfix-backend:v0.1.0 y ghcr.io/bistolfibri/finfix-frontend:v0.1.0 (Visibilidad Pública).