# ingsoft3-tp01 — FinFix (Sistema de Control de Gastos)

Proyecto desarrollado para la materia Ingeniería del Software III (UCC 2026).

---

## TP1 — Git Colaborativo
Repositorio colaborativo inicial configurado con reglas de protección de rama y release tag v1.0.0.

---

## TP2 — Pasos para levantar la aplicación con Docker Compose

Para ejecutar el sistema completo en una máquina limpia sin necesidad de instalar Node.js ni PostgreSQL:

### 1. Clonar el repositorio y configurar variables de entorno:
```bash
cp .env.example .env
```

### 2. Levantar el sistema completo (Frontend + Backend + PostgreSQL):
```bash
docker compose up -d
```

### 3. Abrir la aplicación en el navegador:
Ingresá a: http://localhost:3000

---

## Variantes de Ejecución (TP2)

- Levantar desde el código fuente local:
  ```bash
  docker compose up -d
  ```
- Levantar descargando las imágenes publicadas en GitHub Packages (ghcr.io):
  ```bash
  docker compose -f docker-compose.registry.yml up -d
  ```

---

## Arquitectura del Sistema (TP2)
- Frontend: React + Vite servido en producción por Nginx (Puerto 3000).
- Backend: API REST en Node.js / Express (Puerto 3001).
- Base de Datos: PostgreSQL 16 Alpine con persistencia en volumen db_data (Puerto 5432).