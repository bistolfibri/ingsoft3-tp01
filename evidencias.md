<img width="601" height="161" alt="Captura de pantalla 2026-08-31 230826" src="https://github.com/user-attachments/assets/19eaeefb-ce8e-4337-be23-6ec776bb9adf" />
# 📋 Evidencias de Ejecución y Pruebas — FinFix

Este documento recopila las evidencias de ejecución, pruebas de seguridad, orquestación y persistencia de datos de la aplicación **FinFix**.

---

## 📑 Tabla de Contenidos

- [TP1 — Control de Versiones y Git Colaborativo](#tp1--control-de-versiones-y-git-colaborativo)
- [TP2 — Contenedores y Docker Compose](#tp2--contenedores-y-docker-compose)

---

## TP1 — Control de Versiones y Git Colaborativo

### 1. Push directo a main rechazado

**Descripción:**
GitHub rechaza el intento de `git push origin main` directo debido a que la rama `main` cuenta con reglas de protección activas y la opción `enforce_admins: true` impide que incluso el propietario del repositorio saltee la regla.

![Push directo rechazado por protección de rama](https://github.com/user-attachments/assets/e450cc34-8f7c-4ce2-9c8d-5633389783fb)

**Conclusión:** La rama `main` está protegida con reglas de protección activas (`enforce_admins: true`), obligando el uso de Pull Requests para cualquier integración de código. Esta es una práctica estándar en repositorios colaborativos que garantiza que todo cambio sea revisado antes de llegar a producción, incluso por administradores del proyecto.

---

### 2. Conflicto en Pull Request de rama `feature/titulo-b`

**Descripción:**
Al intentar integrar la rama `feature/titulo-b` (PR #3) tras haber fusionado previamente `feature/titulo-a` (PR #2), GitHub deshabilita la fusión automática indicando que ambas ramas modificaron la misma línea 1 del archivo `README.md`.

![Cartel de conflicto en Pull Request #3](https://github.com/user-attachments/assets/0c3e01cf-1b80-4c3a-9fb2-3a03dcdb6d98)

**Conclusión:** Se requiere resolución manual de conflictos ante modificaciones concurrentes en las mismas líneas. Este escenario es común cuando múltiples desarrolladores trabajan simultáneamente sobre el mismo archivo, y GitHub deshabilita la fusión automática hasta que los conflictos sean explícitamente resueltos en el editor web o localmente.

---

### 3. Marcadores de conflicto en el editor web

**Descripción:**
El editor de resolución de conflictos de GitHub expone los marcadores `<<<<<<<`, `=======` y `>>>>>>>` delimitando la versión entrante frente a la versión presente en `main` antes de realizar la unificación manual.

![Marcadores de conflicto en el editor web](https://github.com/user-attachments/assets/986d0c66-17c4-4354-b360-a583eda4c176)

**Conclusión:** GitHub proporciona herramientas integradas para la resolución gráfica de conflictos sin necesidad de herramientas externas. Los marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`) delimitan claramente las diferencias entre versiones, permitiendo elegir qué cambios conservar o combinar manualmente dentro de la interfaz web.

---

### 4. Release v1.0.0 publicada

**Descripción:**
Publicación de la primera versión oficial `v1.0.0` asociada al tag anotado, congelando el hito del primer trabajo práctico con sus correspondientes notas de lanzamiento (*Release Notes*).

![Página de Release v1.0.0 en GitHub](https://github.com/user-attachments/assets/2cec358f-d790-4d11-a725-118cae14aa25)

**Conclusión:** Se establecen puntos de referencia versionados (tags anotados) para facilitar el seguimiento de cambios y releases. La versión `v1.0.0` marca el cierre del TP1, permitiendo cualquier persona del equipo (o futuros desarrolladores) localizar exactamente qué código se usó en esa entrega específica del trabajo práctico.

---

## TP2 — Contenedores y Docker Compose

### 1. Sistema levantado con Docker Compose y estado Healthy

**Descripción:**
Se ejecutó el comando de orquestación declarativa desde la raíz del proyecto:

```bash
docker compose up -d
```

**Salida de consola:**
- Creación de volumen `finfix_db_data`
- Levantamiento de contenedores: `db` (PostgreSQL), `backend` (Node.js), `frontend` (React)

<img width="601" height="161" alt="Captura de pantalla 2026-08-31 230826" src="https://github.com/user-attachments/assets/f0484376-8675-4102-8a64-06ce3bb32ac6" />

**Verificación del estado:**
```bash
docker compose ps
```
<img width="1375" height="120" alt="Captura de pantalla 2026-08-31 230848" src="https://github.com/user-attachments/assets/d306e2a7-d89c-4556-9b09-7b138ded0cdc" />

- La base de datos `db` ejecuta el comando de verificación `pg_isready`
- Gracias a `depends_on` con `condition: service_healthy`, el backend aguarda a que PostgreSQL esté listo antes de iniciar

**Conclusión:** La orquestación declarativa funciona correctamente con verificación de salud integrada. Docker Compose respeta la configuración `depends_on` con `condition: service_healthy`, asegurando que el backend no inicie hasta que PostgreSQL esté listo para aceptar conexiones, evitando así errores de conexión durante el arranque.

---

### 2. Prueba de Persistencia de Datos (Volumen `db_data`)

**Objetivo:** Comprobar que la persistencia física de la base de datos relacional se mantiene tras ciclos de reinicio.

**Procedimiento:**

1. **Registrar obligación:** Se ingresó "Epec" por $15.000 desde la interfaz web

<img width="1845" height="826" alt="Captura de pantalla 2026-08-31 231515" src="https://github.com/user-attachments/assets/c643d56b-19f6-4fd6-9fb1-b3a1771e9b35" />

2. **Detener infraestructura:**
   ```bash
   docker compose down
   ```

3. **Reiniciar sistema:**
   ```bash
   docker compose up -d
   ```
   <img width="723" height="346" alt="Captura de pantalla 2026-08-31 231732" src="https://github.com/user-attachments/assets/5102b9b5-1625-44ba-bf32-f14e449b1829" />


4. **Verificar persistencia:** Al acceder nuevamente a **http://localhost:3000**, la obligación "Epec" se mantiene intacta en la pantalla

   <img width="1587" height="807" alt="Captura de pantalla 2026-08-31 231746" src="https://github.com/user-attachments/assets/202b9dd3-55c6-45e7-9fb2-72d74e09906f" />


**Conclusión:** El volumen nombrado `finfix_db_data` conserva la información almacenada en el disco duro host incluso cuando los contenedores son destruidos. Esto demuestra que `docker compose down` detiene y elimina los contenedores pero respeta los volúmenes persistentes, permitiendo recuperar toda la información sin reconstruir la base de datos. Este comportamiento es crítico en ambientes de desarrollo donde queremos preservar datos entre ciclos de desarrollo sin perder cambios.

**Nota sobre `docker compose down -v`:**
Al ejecutar la bandera `-v`, Docker elimina el volumen administrado `finfix_db_data`. Al reiniciar la aplicación, la base de datos se recrea vacía e inicializa únicamente los datos del script `seed.sql`.

---

### 3. Comparación de Tamaño de Imágenes (Multi-stage vs Base pesada)

**Descripción:**
La utilización de Dockerfiles multi-stage (en 2 etapas) permitió separar el entorno de compilación del entorno final de producción, logrando una reducción drástica del peso de los artefactos.

| Servicio | Imagen Original (Compilador/SDK) | Imagen Final (Multi-stage) | Optimización Lograda |
|----------|----------------------------------|----------------------------|----------------------|
| **Backend** | `node:20` completo (~1.08 GB) | `finfix-backend:dev` (200 MB) | **↓ 80%** — Alpine sin herramientas dev en runtime |
| **Frontend** | `node:20` + Vite (~1.25 GB) | `finfix-frontend:dev` (93 MB) | **↓ 92%** — Nginx:Alpine en lugar de Node |

**Conclusión:** Los builds multi-stage reducen significativamente el tamaño de las imágenes finales (80% backend, 92% frontend) sin comprometer funcionalidad. La estrategia de separar compilación de runtime es fundamental en Docker: se ejecutan todas las herramientas pesadas (Node, npm, Vite, compiladores) en una etapa intermedia, pero la imagen final solo incluye el artefacto compilado y su runtime mínimo (nginx, node runtime). Esto reduce consumo de ancho de banda, tiempo de descarga y overhead de almacenamiento en producción.

---

### 4. Imágenes Publicadas en GitHub Container Registry (GHCR)

**Descripción:**
Las imágenes de producción fueron compiladas, etiquetadas y publicadas de forma pública en GitHub Container Registry.

**Imágenes disponibles:**

| Componente | URI GHCR | Visibilidad |
|-----------|----------|-----------|
| **Backend** | `ghcr.io/bistolfibri/finfix-backend:v0.1.0` | 🔓 Pública |
| **Frontend** | `ghcr.io/bistolfibri/finfix-frontend:v0.1.0` | 🔓 Pública |

**Uso sin código fuente:**
```bash
cp .env.example .env
docker compose -f docker-compose.registry.yml up -d
```

**Conclusión:** Las imágenes publicadas permiten despliegue rápido sin necesidad de compilación local ni acceso al código fuente. Al usar `docker-compose.registry.yml`, cualquier usuario puede levantar FinFix en segundos descargando imágenes precompiladas desde GHCR, simplemente con las credenciales adecuadas. Esto es especialmente útil para ambientes de producción, testing y para compartir el proyecto sin exponer código fuente.

