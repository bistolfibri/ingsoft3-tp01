# Registro de Decisiones de Arquitectura — FinFix

Este documento registra de forma incremental todas las decisiones técnicas, de arquitectura, planificación e infraestructura tomadas durante la cursada de **Ingeniería del Software III (UCC 2026)** para la aplicación **FinFix**.

---

## TP1 — Control de Versiones y Git Colaborativo

### 1. Análisis del Conflicto de Merge
- **¿Por qué Git no pudo resolver el conflicto solo?**: Git resuelve los merges automáticamente cuando los cambios tocan partes diferentes del archivo. En el PR #3, las ramas `feature/titulo-a` y `feature/titulo-b` modificaron exactamente la misma línea 1 del archivo `README.md` habiendo partido del mismo commit base de `main`. Git no posee criterio de negocio para decidir si la versión correcta era la "A" o la "B", por lo que detuvo el merge e insertó los marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`) para exigir una resolución manual.
- **¿Qué tendría que haber pasado para evitarlo?**: 
  - Que las ramas tocaran líneas distintas del archivo.
  - Que la rama `feature/titulo-b` se hubiera creado secuencialmente **después** de mergear la rama A, habiendo actualizado su base local con `git pull origin main`.

### 2. Dificultades Encontradas y Soluciones
- **Error del comando `gh` en PowerShell**: Tras instalar GitHub CLI (`gh`), la terminal arrojaba `gh: el término no se reconoce`. Se resolvió cerrando y reabriendo la ventana de PowerShell para recargar las variables del sistema (`PATH`).
- **Operador `&&` no soportado en PowerShell 5.1**: Al intentar concatenar comandos como `git checkout main && git pull`, PowerShell 5.1 arrojó error de sintaxis. Se resolvió ejecutando las instrucciones en líneas separadas o utilizando `;`.

### 3. Declaración de Uso de Inteligencia Artificial 
- **Uso de IA**: Se utilizó asistencia de IA como guía para traducir los requerimientos del TP1 en comandos concretos de consola (Git y GitHub CLI), comprender las convenciones de *Conventional Commits* (`feat:`, `fix:`, `docs:`) y estructurar los mensajes de commit.
- **Verificación realizada**: Todos los comandos de Git, creaciones de ramas, resoluciones de conflictos y tags fueron ejecutados y probados manualmente en la terminal local y verificados en la web de GitHub.
  
---

## TP2 — Selección de la Aplicación y Contenerización

**Aplicación seleccionada**: `FinFix` — Sistema web de Control de Gastos Mensuales y Obligaciones Fijas.

### 1. Justificación de los 5 Criterios de Selección
1. **Que puedan ejecutarla hoy**: 
   - La aplicación está desacoplada en `./backend` y `./frontend`. Cuenta con soporte completo para PostgreSQL y fallback en memoria.
2. **Que conozcan los comandos de compilación y ejecución**:
   - **Backend**: `npm install` && `npm start` (o `npm run dev` en desarrollo).
   - **Frontend**: `npm install` && `npm run build` (o `npm run dev` en desarrollo).
3. **Que la conexión a la base sea parametrizable por variables de entorno**:
   - Toda la conexión a la base de datos se configura centralizadamente en `backend/src/config/db.js` leyendo las variables de entorno `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` provenientes de `.env` o del entorno Docker.
4. **Lógica desacoplada lista para testear (TP5)**:
   - **Backend (Reglas Puras)**: `determineExpenseStatusAndPriority` (cálculo de vencimientos), `processPaymentData` (validación de pagos y recargos por mora), `isDuplicateExpenseTitle` y `calculateCategorizedMetrics`.
   - **Frontend (UI)**: Manejo automatizado de cuotas (cálculo de cuota N+1), restricción de pagos futuros y formato de fechas completo.
5. **Comprensión suficiente para modificarla en vivo**: Estructurada en arquitectura limpia de 3 capas (Rutas $\rightarrow$ Controladores $\rightarrow$ Servicios/Reglas), permitiendo aplicar modificaciones rápidas durante la defensa oral.

### 2. Decisiones de Contenerización e Infraestructura
- **Imágenes base y Multi-stage**: Se diseñaron Dockerfiles multi-stage (2 etapas). El backend usa `node:20-alpine` (reduciendo la imagen a **200 MB** vs >1 GB de la base estándar). El frontend compila React en la etapa 1 y sirve los archivos estáticos en la etapa 2 utilizando **`nginx:alpine` (93 MB)**, eliminando Node.js de la imagen final de producción.
- **Estrategia de Persistencia**: Se utilizó el volumen nombrado `db_data` montado en `/var/lib/postgresql/data`. Esto garantiza que los datos survivan a reinicios del contenedor (`docker compose down`). Los scripts `schema.sql` y `seed.sql` inicializan la estructura relacional y los datos de prueba de forma automática.
- **Redes y Proxy Inverso**: Nginx actúa como servidor web estático y proxy inverso reeditando las llamadas `/api/` hacia `http://backend:3001` mediante el DNS interno de Docker (`127.0.0.11`), unificando el origen y eliminando bloqueos de CORS.
- **Gestión de Secretos**: La contraseña de PostgreSQL se lee mediante la variable `${DB_PASSWORD}` desde el archivo local `.env` (incluido en `.gitignore`). Se versiona la plantilla pública `.env.example` con valores de muestra.

### 3. Dificultades Encontradas y Soluciones 
- **Falla de conexión del backend al arrancar PostgreSQL**: El backend intentaba conectarse antes de que PostgreSQL terminara de inicializar sus archivos internos. Se resolvió agregando un `healthcheck` con `pg_isready` en el servicio `db` y configurando `depends_on` con `condition: service_healthy` en el backend.
- **Divergencia de Zona Horaria (Timezone)**: Docker utiliza la hora UTC por defecto, provocando desfasajes de fecha a última hora del día respecto al navegador local. Se solucionó asegurando el formateo de fechas ISO safe en las consultas del controlador.

### 4. Declaración de Uso de Inteligencia Artificial 
- **Uso de IA**: Se consultó asistencia de IA para estructurar las dos etapas de los Dockerfiles multi-stage, configurar las reglas de proxy inverso en `nginx.conf` y entender el funcionamiento de la red interna de Docker Compose.
- **Verificación realizada**: Se compilaron y probaron las imágenes localmente, se verificaron los pesos mediante `docker images`, se confirmó la persistencia con `docker compose down` / `up -d` y se verificó la descarga desatendida desde GHCR con `docker-compose.registry.yml`.
  
---

## TP3 — Planificación DevOps y Trazabilidad

### 1. Duración del Sprint y Justificación
- **Duración elegida**: **2 semanas (14 días)**.
- **Justificación**: Se seleccionó una iteración de 2 semanas por ser el estándar recomendado en Scrum para equipos pequeños. Permite entregar incrementos funcionales verificables alineados con las entregas de la materia sin acumular ramas desactualizadas en Git.
  
### 2. Límite de Trabajo en Progreso (WIP Limit) y Justificación
- **Límite asignado**: **`2`** en la columna *In Progress*.
- **Justificación**: Aplicando el principio Kanban de *"Empezar menos, terminar más"*, se definió mediante la regla `Integrantes + 1` (para 1 desarrollador: 1 + 1 = 2). El `+1` actúa como válvula de escape si una tarea queda bloqueada esperando revisión, evitando el costo del cambio de contexto (*context switching*).
  
### 3. Diagnóstico de la Historia Mal Escrita
- **Historia analizada**: *"Como desarrollador quiero crear la tabla usuarios para guardar los datos"*.
- **Diagnóstico**: Está mal escrita porque *"crear la tabla usuarios"* es una **tarea técnica de infraestructura de base de datos** disfrazada de historia. No proviene de un usuario final, no entrega un beneficio funcional observable y carece de valor de negocio explícito.
- **Reescritura correcta**: *"Como usuario quiero registrar mi cuenta con email y contraseña para acceder a mis gastos de forma personalizada."*
  
### 4. Dificultades Encontradas y Soluciones 
- **Permisos de GitHub CLI para Projects v2**: El comando `gh project create` arrojó error de permisos. Se resolvió refrescando la autenticación mediante `gh auth refresh -s project`.
- **Visibilidad del Proyecto en modo Privado**: Los tableros nacen en privado por defecto. Para evitar errores 404 en la evaluación, se cambió la visibilidad a pública en la configuración de GitHub Projects (`Settings -> Visibility -> Public`).
  
### 5. Declaración de Uso de Inteligencia Artificial 
- **Uso de IA**: Se utilizó IA para consultar la sintaxis de enlace automático en Pull Requests (`Closes #N`), comprender la diferencia entre Criterios de Aceptación y Definition of Done, y estructurar la jerarquía de issues (Épica $\rightarrow$ Historia $\rightarrow$ Tarea).
- **Verificación realizada**: Se crearon manualmente los issues en el repositorio, se vincularon como sub-issues en la web, se configuró el tablero y se comprobó que el PR #15 movió automáticamente la tarjeta a la columna *Done*.

---

## TP4 — Integración Continua (CI: Pipelines as Code)

### 1. Estructura elegida del Pipeline
- **Estructura**: Dos Jobs independientes y paralelos: `build-backend` y `build-frontend`.
- **Justificación**: Al no tener dependencia entre sí (`needs:`), GitHub Actions ejecuta los dos jobs en máquinas virtuales runner distintas simultáneamente, reduciendo el tiempo total de compilación a la mitad.
  
### 2. Estrategia de Caché de Capas y Resiliencia
- **Caché**: Se configuró `docker/setup-buildx-action` y `docker/build-push-action` usando `cache-from` y `cache-to` con `type=gha` (GitHub Actions Cache) y `scope` aislado (`scope=backend` y `scope=frontend`) para evitar que los jobs sobreescriban sus capas.
- **Resiliencia sin Caché**: El caché es una optimización efímera de velocidad. Si el almacenamiento de caché se limpia o borra, el pipeline compila todas las capas desde cero tardando unos segundos más, pero **funciona exactamente igual sin fallar**.
  
### 3. Uso de los Dockerfiles del TP2 en el Pipeline
- **Justificación**: El pipeline compila utilizando los mismos Dockerfiles del TP2 en lugar de ejecutar comandos aislados de compilación (`npm run build`). Esto garantiza una **única fuente de verdad**, asegurando que el CI verifique exactamente la misma receta de contenedor que luego se desplegará en producción.
  
### 4. Demostración de Freno del Gate (PR #22)
- **Prueba intencional**: En la rama `feature/demo-gate-freno` se inyectó una falla de sintaxis intencional en `expenseController.js` y se abrió el PR #22.
- **Freno del Gate**: El job `build-backend` falló en **ROJO**, y GitHub bloqueó automáticamente el botón de merge debido a la regla de protección `required_status_checks` con `strict: true`.
- **Resolución**: Se subió el commit de corrección, el job volvió a correr en **VERDE** y el botón de merge se destrabó, permitiendo completar la fusión.
  
### 5. Dificultades Encontradas y Soluciones 
- **Solapamiento de Caché entre Jobs Paralelos**: Inicialmente los dos jobs pisaban sus capas de caché en el runner. Se resolvió asignando nombres de `scope` independientes (`scope=backend` y `scope=frontend`).
- **Sincronización de Secuencias autoincrementales en PostgreSQL**: Al insertar registros de prueba con IDs fijos en `seed.sql`, la secuencia de Postgres no avanzaba. Se resolvió agregando `SELECT setval()` al final del script SQL.
  
### 6. Declaración de Uso de Inteligencia Artificial 
- **Uso de IA**: Se utilizó asistencia de IA para consultar la sintaxis de GitHub Actions YAML, la directiva `buildx` con `type=gha,scope=...` y los parámetros de la API de GitHub para configurar los Required Status Checks.
- **Verificación realizada**: Se probó el pipeline en Pull Requests reales, se forzó y corrigió la falla en el PR #22, se verificó la palabra `CACHED` en los logs de la segunda corrida y se confirmó que el Status Badge en el `README.md` refleja el estado de `main`.
