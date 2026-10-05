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


---

## TP5 — Calidad Automatizada: Tests, Coverage y Quality Gate

### 1. Lógica elegida para testear y Justificación
- **Backend (`expenseRules.js`)**: testeo de  las reglas puras del dominio financiero de **FinFix**:
  - `determineExpenseStatusAndPriority`: Cálculo automatizado de vencimientos (Pendiente, Próximo a vencer, Vencido) y prioridades (Baja, Media, Alta).
  - `processPaymentData`: Validación de montos abonados y recargos por demora en pagos fuera de término.
  - `isDuplicateExpenseTitle`: Prevención de duplicación de conceptos considerando mayúsculas y espacios.
  - `calculateCategorizedMetrics`: Cálculo de métricas comprometidas (gastos fijos vs eventuales) y límites presupuestarios.
  - `calculateInstallmentDetails`: Matemática de cuotas con y sin intereses.
- **Frontend (`api.js`)**: Se testearon las funciones del cliente de servicios HTTP (`fetchDashboard`, `createExpense`, `deleteExpense`), verificando la construcción de peticiones y el manejo de excepciones de red y validación.

### 2. Medición de Cobertura y Justificación de Umbrales (Quality Gate)
En lugar de copiar un número arbitrario, defini los umbrales de cobertura basandome directamente en mi medición real sobre el código de negocio (`src/services/`):
- **Backend**: Medición base de **72.72% en Líneas** y **50.89% en Ramas**. Fije el umbral de freno en **70% de Líneas** y **50% de Ramas**.
- **Frontend**: Medición base de **59.64% en Líneas** y **75.00% en Ramas**. Fije el umbral de freno en **55% de Líneas** y **70% de Ramas**.
- **Justificación**: Deje un margen técnico exigente (de 2 a 4 puntos porcentuales) respecto a mi medición real para tolerar pequeñas refactorizaciones, pero garantizando un freno automático estricto que bloquea el merge si cualquier Pull Request decae la cobertura respecto a mi estándar entregado. Obliga a agregar un test automaticamente luego de agregar una función para mayor seguridad ya que, es una página que requiere muchos calculos específicos. 

### 3. Exclusiones Legítimas de Cobertura
Excluí explícitamente de la medición los archivos sin comportamiento o de cableado de infraestructura:
- **Backend**: Excluidos `server.js` (arranque del servidor Express) y `db.js` (pool de conexión a PostgreSQL).
- **Frontend**: Excluidos `main.jsx` (punto de montaje en el DOM) y `App.jsx` (componente monolítico de interfaz de usuario de 1.200 líneas).
- **Razón**: Medir pantallas de interfaz gráfica en los unit tests distorsiona la métrica. Como vimos, la interfaz será testeada mediante pruebas End-to-End en el TP7. Excluir el arranque no es hacer trampa: es medir la calidad sobre la lógica que importa.

### 4. Ejercicio de la Rama de Código No Cubierta (Obligatorio)
- **Línea identificada**: En `backend/src/services/expenseRules.js` (líneas 155-157), la condición `if (diffDays >= 0 && diffDays <= 3)` evalúa las obligaciones que vencen en los próximos 3 días.
- **Entrada concreta que la recorrería**: Una obligación con `due_date` configurada a 2 días posteriores a la fecha actual (`currentDate`).
- **Decisión tomada**: Se documentó el camino y se mantuvo cubierta la rama dentro de la suite unitaria.

### 5. Inyección de Dependencias y Mocks (Dobles de Riesgo)
Para cumplir con el requisito obligatorio de Mocks sin tocar dependencias reales:
- **Backend**: Se creó `fetchAndCalculateMetrics(repository, totalBudget)` utilizando Inyección de Dependencias. En las pruebas unitarias se inyectó un `mockRepository` utilizando `vi.fn()`, verificando que la función llamara a `findAllExpenses()` una sola vez (`toHaveBeenCalledTimes(1)`) sin tocar PostgreSQL real.
- **Frontend**: En `api.test.js` se interceptó la función global `fetch` del navegador utilizando `vi.stubGlobal('fetch', mockFetch)` y `vi.fn()`, simulando respuestas JSON y errores HTTP 500 sin salir a la red.

### 6. Enlaces Comprobables de Evidencia en GitHub
- **Resumen de Cobertura y Artefactos Descargables**: [Workflow Run #36328041640](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/36328041640)
- **Corrida ROJA Bloqueada por Umbral**: [Job Build-Backend FAILED por Cobertura < 70%](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/36328041640/job/108644501261?pr=29)
- **Pull Request N° 1 Mergeado (Secuencia Rojo → Fix → Verde → Merge)**: [PR #29](https://github.com/bistolfibri/ingsoft3-tp01/pull/29)
- **Pull Request N° 2 Abierto en ROJO (Prueba Viva de Bloqueo Vigente)**: [PR #30](https://github.com/bistolfibri/ingsoft3-tp01/pull/30)

### 8. Dificultades Encontradas y Soluciones
- **Conflicto de Peer Dependencies entre Vite 5 y Vitest 5**: En el frontend, `npm install` arrojó error `ERESOLVE` por la versión de Vite. Se resolvió fijando `vitest@^1.6.0` con la bandera `--legacy-peer-deps`.
- **Distorsión del Coverage por Pantalla de UI**: Al medir todo el frontend, `App.jsx` (1.200 líneas) bajaba el porcentaje a 2.65%. Se resolvió configurando `include: ['src/services/**/*.js']` en `vite.config.js` para enfocar la medición en los servicios de API.
- **Falso Positivo en PR #30**: La primera función de prueba corta no alcanzó a bajar la cobertura general por debajo del 70%. Se resolvió agregando la función `evaluarRiesgoCrediticioYPromociones` de 30 líneas con múltiples `if`, provocando la caída efectiva al 60.8% y activando el freno del gate.

### 9. Declaración de Uso de Inteligencia Artificial
- **Uso de IA**: Se utilizó asistencia de IA como guía técnica para configurar los reportes de cobertura en Vitest v8 (`@vitest/coverage-v8`), redactar los stubs de `vi.stubGlobal` para `fetch` en frontend y estructurar las justificaciones de umbrales.
- **Verificación realizada**: Todos los 19 unit tests, las mediciones de cobertura, las corridas en rojo por umbral y las fusiones de los PRs #29 y #30 fueron ejecutados, probados y verificados manualmente en la terminal local y en la interfaz web de GitHub.

---

## TP6 — Despliegue Continuo (CD) y Gestión de Entornos

### Enlaces de este TP

| Recurso | Enlace Directo |
| :--- | :--- |
| **Paquete Backend en GHCR** | [ghcr.io/bistolfibri/ingsoft3-tp01-backend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) |
| **Paquete Frontend en GHCR** | [ghcr.io/bistolfibri/ingsoft3-tp01-frontend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) |
| **Corrida con Despliegue RECHAZADO** | [Workflow Run #42 (Rejected)](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/18182903126) |
| **Entorno QA Local** | API: `http://localhost:8080/api/dashboard` \| Front: `http://localhost:3000` |
| **Entorno PROD Local** | API: `http://localhost:8081/api/dashboard` \| Front: `http://localhost:3001` |

### 1. Inmutabilidad de Artefactos y Tagging por SHA
- **Estrategia de Etiquetado**: Se abandonó el uso de la etiqueta mutable `:latest` para la publicación de contenedores en GitHub Packages (`ghcr.io`). Se adoptó la convención inmutable `:sha-${{ github.sha }}` utilizando el Hash completo del commit.
- **Justificación**: Garantiza la trazabilidad absoluta del código desplegado. Un contenedor publicado con la etiqueta del SHA es 100% inalterable: se sabe exactamente qué versión de código fuente dio origen al paquete de producción y previene que despliegues simultáneos sobreescriban la imagen en el registry.

### 2. Desacople del Frontend mediante Nginx Template (`default.conf.template`)
- **Problema Solucionado**: En el TP2 la URL del Backend (`http://backend:3001`) quedaba compilada estáticamente dentro del bundle JS del frontend. Eso exigía recompilar una imagen de Docker distinta para QA y otra para Producción.
- **Solución implementada**: Se configuró la plantilla `/etc/nginx/templates/default.conf.template`. Al iniciar el contenedor en Nginx, la imagen lee las variables de entorno `${BACKEND_URL}` y `${DNS_RESOLVER}` inyectadas por Docker Compose.
- **Resultado de Arquitectura**: **Una sola imagen de Docker sirve para QA y para Producción**. Se compila 1 sola vez en el pipeline y se promueve entre entornos sin sufrir modificaciones.

### 3. Aislamiento Estricto de Entornos (QA vs Producción)
- **Bases de Datos Separadas**: QA opera sobre la base `app_qa` y Producción sobre `app_prod`, impidiendo la contaminación o pérdida inadvertida de datos reales durante pruebas.
- **Aislamiento de Proyecto en Compose**: Se agregaron las directivas `name: qa` y `name: prod` en `compose.qa.yml` y `compose.prod.yml`. Esto evita que `docker compose` asocie los contenedores al nombre del directorio raíz y derribe el entorno de QA al redesplegar Producción.
- **Mapeo de Puertos**:
  - QA: Backend en puerto `8080`, Frontend en puerto `3000`.
  - PROD: Backend en puerto `8081`, Frontend en puerto `3001`.

### 4. Gate Humano y Reglas de Protección de Entorno
- **Configuración del Environment `production`**: Se habilitó la regla *Required reviewers* asignando al desarrollador (`bistolfibri`) como aprobador oficial y desmarcando la casilla *Prevent self-review*.
- **Demostración de Rechazo**: En la corrida #42 se detuvo el pipeline en `deploy-prod` y se ejecutó un rechazo explícito con el motivo: *"Rechazado intencionalmente: se detectó un fallo visual en QA durante las pruebas de regresión"*.
- **Demostración de Aprobación**: Tras verificar el correcto funcionamiento en QA y el pase de Smoke Tests en bucle con `curl`, se revisó la solicitud de despliegue y se hizo clic en *Approve and deploy*, habilitando la ejecución automática hacia el entorno de Producción.

### 5. Plan de Rollback y Medición de Tiempos
- **Procedimiento de Recuperación Ante Fallos**: Si se detecta una anomalía en Producción tras un despliegue, el equipo no compila código a las apuradas. Se re-despliega instantáneamente la imagen inmutable anterior mediante la variable `SHA_ANTERIOR`:
  ```bash
  docker pull ghcr.io/bistolfibri/ingsoft3-tp01-backend:sha-70f09f2812e1310d33d7175504d718abd80d393f
  docker pull ghcr.io/bistolfibri/ingsoft3-tp01-frontend:sha-70f09f2812e1310d33d7175504d718abd80d393f
  docker compose -f compose.prod.yml up -d

### 6. Dificultades Encontradas y Soluciones
- **Sintaxis de Comentarios en Dockerfile**: En `frontend/Dockerfile`, colocar `# comment` en la misma línea de `EXPOSE 80` provocó el fallo `invalid containerPort: #`. Se resolvió moviendo los comentarios a líneas independientes por encima de la directiva.
- **Archivo no Encontrado en Runner**: En el primer deploy, la acción falló con `no such file or directory` al buscar `compose.qa.yml`. Se solucionó rastreando e incluyendo explícitamente `compose.qa.yml` y `compose.prod.yml` dentro del control de versiones de Git.

### 7. Declaración de Uso de Inteligencia Artificial
- **Uso de IA**: Se consultó asistencia de IA para estructurar los jobs de despliegue en GitHub Actions YAML, diseñar la sustitución de variables de Nginx (`envsubst`) y configurar la comprobación de salud en loop con `curl`.
- **Verificación realizada**: Se compilaron y probaron las imágenes, se verificó el aislamiento de puertos en `localhost`, se comprobó la autenticación en `ghcr.io` y se completaron manualmente los flujos de rechazo y aprobación de despliegues en GitHub Environments.


---

## TP7 — Contenedores en el Pipeline y Pruebas E2E

### Enlaces del TP7

| Recurso | Enlace Directo |
| :--- | :--- |
| **Paquetes en Registry (GHCR)** | [ghcr.io/bistolfibri/ingsoft3-tp01-backend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) \| [frontend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) |
| **Corrida de Freno (VERDE/ROJA)** | [Workflow Run #37207451220](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/37207451220) (Commit `dce3b88`) |
| **Artefactos del Freno** | Reporte Integración VERDE (`playwright-report-integracion`) \| Reporte E2E ROJO (`playwright-report-e2e`) |
| **Corrida Completa en VERDE hasta PROD** | [Workflow Run #37209350685](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/37209350685) |
| **Release & Tag v7.0.0** | [Release v7.0.0 — GitHub](https://github.com/bistolfibri/ingsoft3-tp01/releases/tag/v7.0.0) |
| **Entornos Desplegados (Runner/Compose)** | QA: API `http://localhost:8080` / Front `http://localhost:3000` \| PROD: API `http://localhost:8081` / Front `http://localhost:3001` |

### 1. Build Once, Deploy Many (Inmutabilidad)
- **Problema resuelto**: En el TP6 mi pipeline reconstruía el código fuente en cada entorno. Para resolver esto, configuré el pipeline para que construya las imágenes de Docker **una sola vez** en los jobs `build-backend` y `build-frontend`, las publique en `ghcr.io` etiquetadas con `sha-${{ github.sha }}`, y luego los entornos de QA y Producción bajen y ejecuten **exactamente el mismo binario inmutable**.

### 2. Estrategia de Etiquetas (`sha-<commit>` vs `v7.0.0`)
- **Trazabilidad con `sha-<commit>`**: Cada corrida publica imágenes en GHCR usando el hash del commit de Git. Esto me da trazabilidad total entre la versión de código e imagen.
- **Tag de Git `v7.0.0`**: Marca la versión congelada de Producción al finalizar el práctico.
- **¿Por qué NO uso `latest`?**: Porque `latest` es un puntero mutable que cambia en cada push. Si usara `latest` en Producción, no podría demostrar qué versión exacta de código está corriendo.
- **Del Tag a la Imagen**: Ejecutando `git rev-list -n1 v7.0.0` obtengo el commit SHA exacto y con él la etiqueta de la imagen `sha-<commit>` publicada en el registry.

### 3. Diagnóstico de Suites: Integración vs E2E
- **Pruebas de Integración (`frontend/e2e/api.spec.js`)**: Escribí 3 pruebas HTTP directas contra la API de QA (`http://localhost:8080`), verificando la comunicación directa entre endpoints, controladores y la base de datos PostgreSQL real (sin navegador y sin dobles).
- **Pruebas End-to-End (`frontend/e2e/gastos.spec.js`)**: Escribí 3 flujos de interfaz de usuario con Playwright (Chromium) navegando la aplicación real en QA (`http://localhost:3000`).
- **Diagnóstico del Par Verde/Rojo (Evidencia de Freno)**:
  - **Integración VERDE 🟢 + E2E ROJA 🔴**: Modifiqué el texto del botón en `App.jsx` de `"Guardar Obligación"` a `"Crear Gasto"`. La integración dio verde porque la API y la BD funcionaban perfectamente, mientras que la E2E dio roja al no encontrar el botón en la pantalla. Esto frenó automáticamente el avance a `deploy-prod` antes de llegar a revisión.
  - **Integración ROJA 🔴 + E2E 🚫 (Salteado)**: Si la API fallara, el job de integración abortaría de inmediato evitando ejecutar navegadores innecesariamente.

### 4. Integración Amplia vs Estrecha
- **Mi elección**: Implementé la **Integración Amplia**, ejecutando los tests directamente contra la API ya desplegada en QA con Docker Compose. Elegí esta opción porque me permite probar la infraestructura real completa (red, contenedores y PostgreSQL) con mínima configuración extra.

### 5. Resiliencia, Cold Start y Flaky Tests
- **Cold Start y Timeouts**: Configuré un bucle de comprobación con `curl` que espera a que QA responda antes de lanzar las pruebas, evitando fallos por arranque lento.
- **Evitar Flaky Tests**: Reemplacé los `sleep()` fijos por los selectores con *auto-waiting* implícito de Playwright y usé aserciones directas como `expect(btn).toBeDisabled()`.

### 6. Misma Imagen de Frontend en QA y PROD
- **Configuración Nginx**: Utilicé la plantilla `default.conf.template` para inyectar `${BACKEND_URL}` en tiempo de ejecución. De esta forma, uso una única imagen inmutable en frontend para QA (`http://backend:3001`) y PROD.

### 7. Dificultades Encontradas y Soluciones
- **Aislamiento de Máquinas Virtuales en GitHub Actions**: Cada job de `ubuntu-latest` corre en una VM limpia. Los contenedores de `deploy-qa` se destruían al terminar el job. Lo resolví agregando `docker compose -f compose.qa.yml up -d` dentro de los jobs `integracion` y `e2e` para reactivar los contenedores en cada runner.
- **Locator de Playwright `isEnabled()`**: `isEnabled()` en un elemento deshabilitado espera hasta agotar el timeout de 60s. Lo solucioné usando `await expect(btnGuardar).toBeDisabled();` para verificar de forma inmediata el estado.

### 8. Declaración de Uso de Inteligencia Artificial
- **Uso de IA**: Consulté asistencia de IA para estructurar el YAML de GitHub Actions con los jobs de E2E e Integración, y para resolver el comportamiento de locators en Playwright.
- **Verificación realizada**: Ejecuté y verifiqué localmente y en GitHub Actions todas las suites, comprobé la rotura intencional con freno en `deploy-prod`, corregí el código, completé los 5 jobs en verde con la aprobación manual y creé la release `v7.0.0`.