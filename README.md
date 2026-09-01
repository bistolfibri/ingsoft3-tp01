[![CI](https://github.com/bistolfibri/ingsoft3-tp01/actions/workflows/ci.yml/badge.svg)](https://github.com/bistolfibri/ingsoft3-tp01/actions/workflows/ci.yml)

# FinFix — Control de Gastos Mensuales y Obligaciones
Aplicación web para la gestión de obligaciones fijas mensuales, servicios y compras con cálculo dinámico de vencimientos y recargos por demora.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Gestión de Datos](#gestión-de-datos)
- [Desarrollo Local](#desarrollo-local)

---

## Descripción

FinFix es una plataforma integral para:
- Registrar y monitorear obligaciones fijas mensuales
- Gestionar servicios con vencimientos variables
- Administrar compras en cuotas
- Calcular automáticamente recargos por demora
- Visualizar y controlar el flujo de gastos

---

## Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| **Frontend** | React + Vite (Nginx Alpine) |
| **Backend** | Node.js + Express API REST |
| **Base de Datos** | PostgreSQL |
| **Contenerización** | Docker & Docker Compose (Multi-stage builds) |

---

## Requisitos Previos

Para ejecutar el sistema completo se necesita:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
> **Nota:** No es necesario tener Node.js ni PostgreSQL instalados localmente para ejecutar la aplicación con Docker.

---

## Instalación y Ejecución

### Opción A: Levantar desde código fuente local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/bistolfibri/ingsoft3-tp01.git
   cd ingsoft3-tp01
   ```

2. **Configurar variables de entorno:**
   ```bash
   # En Linux/macOS:
   cp .env.example .env
   
   # En PowerShell (Windows):
   Copy-Item .env.example .env
   ```

3. **Levantar los servicios:**
   ```bash
   docker compose up -d --build
   ```

4. **Verificar el estado de los contenedores:**
   ```bash
   docker compose ps
   ```
   > La base de datos (`db`) debe mostrar estado `healthy` antes de que el backend responda.

5. **Acceder a la aplicación:**
   - Abre en tu navegador: **http://localhost:3000**

---

### Opción B: Usar imágenes precompiladas (GitHub Packages)

1. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

2. **Levantar con imágenes del registro:**
   ```bash
   docker compose -f docker-compose.registry.yml up -d
   ```

3. **Acceder a la aplicación:**
   - Abre en tu navegador: **http://localhost:3000**

Imágenes utilizadas:
- `ghcr.io/bistolfibri/finfix-backend:v0.1.0`
- `ghcr.io/bistolfibri/finfix-frontend:v0.1.0`

---

## Gestión de Datos

### Detener conservando datos
```bash
docker compose down
```
> Mantiene el volumen `db_data` intacto con toda la información guardada.

### Detener y reiniciar base de datos desde cero
```bash
docker compose down -v
```
> Borra permanentemente el volumen `db_data` y recrea la estructura inicial al volver a levantar.

---

## Desarrollo Local (Sin Docker)

Para trabajar directamente sobre tu máquina:

### Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
