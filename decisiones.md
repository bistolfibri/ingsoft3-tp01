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
Los umbrales salen de mi medición real sobre el código de negocio (`src/services/`), no de un número copiado. Mido con `npm run test:coverage` (v8) y el pipeline lo vuelve a medir en cada corrida:
- **Backend**: medición actual **82.82 % de líneas** y **61.47 % de ramas** (25 tests entre ambos lados; 18 son del backend). Umbral de freno: **80 % de líneas** y **58 % de ramas** (en `backend/vitest.config.js`).
- **Frontend**: medición actual **59.64 % de líneas** y **75.00 % de ramas**. Umbral de freno: **55 % de líneas** y **70 % de ramas** (en `frontend/vite.config.js`).
- **Justificación**: dejo un margen chico (unos 3–5 puntos) por debajo de lo medido. Si un PR agrega lógica sin tests, el porcentaje baja de ese margen y el job `build-*` se pone rojo, y como es check requerido, no se puede mergear. Un margen grande (por ejemplo 20 puntos) dejaría pasar código sin testear; uno de 0 puntos frenaría por cualquier refactor menor.
- **Historia honesta**: al principio medí 72.72 % / 50.89 % en el backend y puse umbrales más bajos. Después de agregar el test de la rama sin cubrir (sección 4) la medición subió y subí el umbral para que el gate siga siendo exigente.
- **Dónde se ve**: el job escribe una tabla de cobertura (líneas, sentencias, funciones y ramas) en la pestaña **Summary** de cada corrida, para backend y frontend, y además sube el reporte HTML como artefacto (`coverage-backend`, `coverage-frontend`).

### 3. Exclusiones Legítimas de Cobertura
Excluí explícitamente de la medición los archivos sin comportamiento o de cableado de infraestructura:
- **Backend**: Excluidos `server.js` (arranque del servidor Express) y `db.js` (pool de conexión a PostgreSQL).
- **Frontend**: Excluidos `main.jsx` (punto de montaje en el DOM) y `App.jsx` (componente monolítico de interfaz de usuario de 1.200 líneas).
- **Razón**: Medir pantallas de interfaz gráfica en los unit tests distorsiona la métrica. Como vimos, la interfaz será testeada mediante pruebas End-to-End en el TP7. Excluir el arranque no es hacer trampa: es medir la calidad sobre la lógica que importa.

### 4. Ejercicio de la Rama de Código No Cubierta (Obligatorio)
- **Hallazgo**: con el reporte de cobertura, el backend mostraba sin cubrir el tramo de `determineExpenseStatusAndPriority` en `backend/src/services/expenseRules.js` (aprox. líneas 152–162): la condición `if (diffDays >= 0 && diffDays <= 3)` (devuelve `PROXIMO_VENCER` / prioridad `ALTA`), el tramo de 4 a 15 días (`PENDIENTE` / `MEDIA`) y el caso por defecto (`PENDIENTE` / `BAJA`).
- **Entrada concreta que la recorre**: una obligación con `due_date` 2 días posterior a la fecha actual (`currentDate`): por ejemplo vence `2026-08-12` y hoy es `2026-08-10`.
- **Decisión tomada**: **agregué el test** (en `expenseRules.test.js`: uno para `PROXIMO_VENCER` y otro para `PENDIENTE` media y baja). Es lógica de negocio importante: avisa al usuario que algo está por vencer. Resultado: la cobertura del backend pasó de 75.75 % a 82.82 % en líneas y de 54.09 % a 61.47 % en ramas, y por eso subí el umbral.
- **Lo que sigue sin cubrir** (líneas ~167–184 y 194): ramas de validación de entrada. Es un riesgo conocido y aceptado por ahora; si quedara sin cubrir lo que importa, mi decisión sería documentarlo, no esconderlo.

### 5. Inyección de Dependencias y Mocks (Dobles de Riesgo)
Para cumplir con el requisito obligatorio de Mocks sin tocar dependencias reales:
- **Backend**: Se creó `fetchAndCalculateMetrics(repository, totalBudget)` utilizando Inyección de Dependencias. En las pruebas unitarias se inyectó un `mockRepository` utilizando `vi.fn()`, verificando que la función llamara a `findAllExpenses()` una sola vez (`toHaveBeenCalledTimes(1)`) sin tocar PostgreSQL real.
- **Frontend**: En `api.test.js` se interceptó la función global `fetch` del navegador utilizando `vi.stubGlobal('fetch', mockFetch)` y `vi.fn()`, simulando respuestas JSON y errores HTTP 500 sin salir a la red.

### 6. Enlaces Comprobables de Evidencia en GitHub
- **Resumen de Cobertura y Artefactos Descargables**: [Workflow Run #36328041640](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/36328041640)
- **Corrida ROJA Bloqueada por Umbral**: [Job Build-Backend FAILED por cobertura bajo el umbral](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/36328041640/job/108644501261?pr=29)
- **Pull Request N° 1 Mergeado (Secuencia Rojo → Fix → Verde → Merge)**: [PR #29](https://github.com/bistolfibri/ingsoft3-tp01/pull/29)
- **Pull Request N° 2 Abierto en ROJO (Prueba Viva de Bloqueo Vigente)**: [PR #30](https://github.com/bistolfibri/ingsoft3-tp01/pull/30)

### 7. Dificultades Encontradas y Soluciones
- **Conflicto de Peer Dependencies entre Vite 5 y Vitest 5**: En el frontend, `npm install` arrojó error `ERESOLVE` por la versión de Vite. Se resolvió fijando `vitest@^1.6.0` con la bandera `--legacy-peer-deps`.
- **Distorsión del Coverage por Pantalla de UI**: Al medir todo el frontend, `App.jsx` (1.200 líneas) bajaba el porcentaje a 2.65%. Se resolvió configurando `include: ['src/services/**/*.js']` en `vite.config.js` para enfocar la medición en los servicios de API.
- **Falso Positivo en PR #30**: La primera función de prueba corta no alcanzó a bajar la cobertura general por debajo del 70%. Se resolvió agregando la función `evaluarRiesgoCrediticioYPromociones` de 30 líneas con múltiples `if`, provocando la caída efectiva al 60.8% y activando el freno del gate.

### 8. Declaración de Uso de Inteligencia Artificial
- **Uso de IA**: Se utilizó asistencia de IA como guía técnica para configurar los reportes de cobertura en Vitest v8 (`@vitest/coverage-v8`), redactar los stubs de `vi.stubGlobal` para `fetch` en frontend y estructurar las justificaciones de umbrales.
- **Verificación realizada**: Los 25 unit tests (18 backend y 7 frontend), las mediciones de cobertura, las corridas en rojo por umbral y las fusiones de los PRs #29 y #30 fueron ejecutados, probados y verificados manualmente en la terminal local y en la interfaz web de GitHub.

---

## TP6 — Despliegue Continuo (CD) y Gestión de Entornos

### Enlaces de este TP

| Recurso | Enlace |
| :--- | :--- |
| **Paquete backend (público, etiquetado por commit)** | [ghcr.io/bistolfibri/ingsoft3-tp01-backend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) · `docker pull --platform linux/amd64 ghcr.io/bistolfibri/ingsoft3-tp01-backend:sha-2d17b10514e326ef0e024328fc6f0feb539fca00` |
| **Paquete frontend (público, etiquetado por commit)** | [ghcr.io/bistolfibri/ingsoft3-tp01-frontend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) · `docker pull --platform linux/amd64 ghcr.io/bistolfibri/ingsoft3-tp01-frontend:sha-2d17b10514e326ef0e024328fc6f0feb539fca00` |
| **Cadena, eslabón 2 — un PR con tests en verde donde «Entrar al registry» sale *salteado*** | [job build-backend del PR #54](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38778692235/job/116572917241) (paso 8 = skipped) |
| **Cadena, eslabón 3 — corrida de `main` donde «construir y publicar la imagen» es el ÚLTIMO paso** | [job build-backend de la corrida de main](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38779126083/job/116574433745) (paso 10 = construir y publicar, después sólo `Post …`) |
| **QA (vivo)** | API: https://finfix-api-qa.onrender.com/health · Front: https://finfix-front-qa.onrender.com |
| **PROD (vivo)** | API: https://finfix-api-prod.onrender.com/health · Front: https://finfix-front-prod.onrender.com |
| **Flujo completo aprobado (QA verde → «Waiting for review» → aprobación → PROD verde)** | [Run #94](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38812623770): aprobado por `bistolfibri` en el environment `production`, con comentario |
| **Deploy a PROD RECHAZADO con motivo** | [Run #96](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38818190986): rechazado por `bistolfibri` en `production` con el comentario «Rechazo este run: entró un merge más nuevo (el link al flujo aprobado). Apruebo sólo el más reciente para que PROD no reciba dos deploys sueltos.». El run más nuevo ([#98](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38818543465)) sí se aprobó. |
| **Release `v6.0.0`** | ⏳ PENDIENTE: link a la release (se completa después de taggear el commit que está en PROD) |

> Las URLs de QA y PROD son del plan gratuito de Render: si nadie las usó en los últimos ~15 minutos, la primera visita tarda alrededor de un minuto en responder (cold start). Es normal.

### 1. Qué proveedor usé y cómo cumplo los cinco puntos del contrato
Uso **Render** (4 web services) y **Neon** (Postgres). Los cinco puntos:
1. **Dos entornos separados, cada uno con su URL pública**: `finfix-api-qa` / `finfix-front-qa` y `finfix-api-prod` / `finfix-front-prod` (links arriba).
2. **Una base de datos por entorno**: un proyecto de Neon (`finfix`) con dos bases, `app_qa` y `app_prod`. Cada api recibe por variables de entorno (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`) la conexión de **su** base. Las tablas las creé a mano en el SQL Editor de Neon, en las dos bases, con `database/schema.sql` y `database/seed.sql` (no tengo migraciones automáticas: no es la forma más profesional y por eso lo cuento).
3. **Front y back corren como contenedores**, a partir de mis Dockerfiles.
4. **El deploy lo dispara mi pipeline**: cada servicio tiene un *deploy hook* de Render (una URL secreta) y el job de GitHub Actions lo llama. Los servicios que Render ejecuta desde una imagen **no tienen Auto-Deploy** (la opción ni aparece), así que el proveedor no despliega nada por su cuenta.
5. **PROD está detrás de la aprobación** del environment `production` de GitHub (required reviewer: yo, con *Prevent self-review* desactivado).

### 2. Por qué el artefacto se publica sólo con la verificación en verde
El pipeline construye cada imagen **una vez**, en el mismo job que corrió los tests, y la publica en `ghcr.io` etiquetada `sha-<commit completo>`. La garantía no depende de un control nuevo sino de **tres eslabones encadenados**:
1. Nada entra a `main` sin el pipeline en verde (checks requeridos `build-backend` y `build-frontend` + umbral de cobertura del TP5).
2. Sólo lo que entra a `main` se publica: `push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}`.
3. El paso que publica es **el último** del job que corrió los tests: si algo falla antes, el job muere y ese paso nunca corre. Por eso las dos evidencias de arriba: en el PR, el login al registry sale *skipped*; en `main`, publicar es el último paso.

Si se publicara igual con tests en rojo, estar en el registry dejaría de significar «esto pasó la verificación» y el registry sería un depósito de cosas que alguien construyó alguna vez.
**Lo que esta cadena NO garantiza**: yo podría hacer un `docker push` a mano desde mi notebook y entraría igual. La cadena garantiza lo que publica **el pipeline**, no lo que físicamente puede entrar. Y los tags se pueden volver a publicar (por eso nunca vuelvo a correr una corrida vieja para desplegar); lo único inmutable es el digest (`@sha256:…`), que no usé.
No publico `latest`: cada imagen tiene un solo nombre, el de su commit. Los dos paquetes son **públicos** (Render los baja sin credenciales; hacerlos públicos no tiene vuelta atrás).

### 3. Continuous Delivery, no Continuous Deployment
Implementé **Continuous Delivery**: todo cambio que pasa la verificación llega **solo** a QA, pero a PROD sólo llega cuando una persona lo aprueba. Corresponde a mi contexto porque FinFix maneja plata de la gente y mi red de seguridad (25 unit tests, 3 pruebas de integración y 3 e2e) es buena pero chica: sacar al humano automatizaría la propagación de errores. Para llegar a Continuous Deployment me faltaría observabilidad real (métricas, alertas, versión visible en `/health`) y tests que cubran más flujos. ¿La querría? Más adelante, sí, para cambios chicos y con rollback rápido.

### 4. Diseño de la cadena y alcance de cada secret
```
build-backend ─┐
               ├─► deploy-qa ─► integracion ─► e2e ─► [aprobación] ─► deploy-prod
build-frontend ┘
```
- `needs:` encadena la promoción; el `if: github.ref == 'refs/heads/main'` está sólo en `deploy-qa` y el resto lo hereda (en un PR ningún deploy corre).
- `deploy-qa` usa `environment: qa` (sin reglas: es automático a propósito) y `deploy-prod` usa `environment: production` (pausa hasta que apruebo).
- **Secrets por environment**: `RENDER_HOOK_API_QA` y `RENDER_HOOK_FRONT_QA` viven **dentro** del environment `qa`; `RENDER_HOOK_API_PROD` y `RENDER_HOOK_FRONT_PROD` dentro de `production`. Un job de QA no puede leer los hooks de PROD, y los de PROD sólo se entregan a un job ya aprobado. Si estuvieran a nivel repositorio, cualquier job (incluido uno que no pasó la aprobación) podría desplegar a producción.
- Las URLs de cada entorno **no** son secretas: son variables del repositorio (`QA_API_URL`, `QA_FRONT_URL`, `PROD_API_URL`, `PROD_FRONT_URL`), porque los jobs `integracion` y `e2e` no tienen environment.
- `deploy-prod` lleva `concurrency: { group: deploy-prod, cancel-in-progress: false }` para que dos deploys a PROD no se pisen.

### 5. Qué mira mi aprobador antes de aprobar
No apruebo por reflejo. Antes de hacer clic miro:
1. Que **todos** los jobs anteriores estén verdes (build, smoke de QA, integración y e2e).
2. Que el commit de **esta** corrida sea el último de `main` (si entró otro merge después, esta corrida está vieja: **no** la apruebo, la rechazo).
3. Qué cambia el PR (título y archivos): si toca base de datos, variables o el workflow, miro con más cuidado.
4. Que no haya otra corrida esperando aprobación (si hay dos, rechazo la vieja con su motivo).
5. Que sea un buen momento (nada de aprobar si estoy por dejar de mirar el sistema).
**Lo que mi aprobador NO puede ver**: qué versión corre hoy en PROD (el `/health` no la informa) ni cómo se comporta con usuarios reales: no tengo métricas ni alertas. Eso me falta para decidir mejor.
La evidencia de que el gate dice que no está en «Enlaces de este TP» (deploy rechazado con motivo).

### 6. La letra chica del free tier y cómo la manejo
- **Render**: cada servicio gratuito **duerme tras ~15 min sin tráfico** y el primer pedido lo despierta con un cold start de hasta ~1 minuto. Por eso el smoke test **reintenta** (30 intentos cada 20 s, con `--max-time 10` por pedido) en vez de hacer un `curl` seco.
- **750 horas por mes son del WORKSPACE, no de cada servicio**: tengo 4 servicios; uno despierto las 24 h consume 720. Como duermen solos, no llego, pero **no dejo nada haciendo ping para mantenerlos despiertos**; si el workspace se quedara sin horas, Render suspende los servicios hasta fin de mes y las URLs dejarían de responder.
- **500 minutos de build por mes**: como mis servicios ejecutan una imagen ya construida por GitHub Actions, **Render no construye nada** y no gasto esos minutos (el consumo se puede mirar en Workspace → Billing).
- **Neon**: suspende el cómputo tras unos minutos sin uso y lo despierta solo (más rápido que Render); límite de 0,5 GB de almacenamiento. Mi `db.js` tiene timeout de conexión de 10 s para que una base despertando no cuelgue la API.

### 7. Qué garantía se pierde si el proveedor RECONSTRUYE desde el repo (y qué hice yo)
La guía del TP6 arma Render para que **vuelva a construir** el commit desde el repositorio. Eso rompe «se promueve lo mismo que se verificó»: lo que corre en QA y PROD sería **otra construcción** del mismo commit (una dependencia que cambió entre un build y otro, una imagen base actualizada) y no podría demostrar que es igual. Mi cadena final no tiene ese problema porque hice el TP6 y el TP7 juntos: los cuatro servicios **ejecutan la imagen** publicada por mi pipeline (el hook lleva `imgURL=…:sha-<commit>` y no un `ref` de commit). El detalle está en la sección del TP7.

### 8. Qué prueba mi smoke test y qué NO
- **Prueba** que el entorno responde: `/health` (proceso vivo), `/api/dashboard` (la base contesta: si la conexión a Neon estuviera rota, daría error aunque `/health` esté verde) y la página del front servida por nginx.
- **No prueba** qué versión está corriendo: el deploy hook responde al instante y, si el deploy falla, Render sigue sirviendo la versión anterior y el smoke da verde igual. Cómo lo mitigo hoy: miro en *Events* de cada servicio que el deploy diga «Triggered via Deploy Hook» con el `sha-` de esa corrida. Cómo lo cerraría: que `/health` devuelva el commit horneado en la imagen y que el smoke lo compare con `github.sha`.

### 9. Cómo comprobé que cada entorno usa su propia base
Creé un gasto con un nombre inconfundible **sólo en PROD**: apareció en la URL de PROD y **no** apareció en la de QA. Y como contraprueba, un dato creado en QA no aparece en PROD.
Los tres controles que se pueden mirar en mi pantalla: (a) los 4 servicios no tienen Auto-Deploy (servicios de imagen); (b) cada hook de PROD apunta a un servicio de PROD (se compara el id `srv-…` del hook con el del servicio); (c) las dos bases son distintas (prueba de arriba).

### 10. Deployment pattern para una producción real
Elegiría **blue-green**: dos entornos completos y un router que cambia de uno a otro. **Costo**: el doble de infraestructura. **Riesgo**: el cambio de esquema de la base debe ser compatible con las dos versiones. **Rollback**: instantáneo, se vuelve el switch. Lo elijo porque FinFix maneja dinero y una caída de PROD duele más que pagar infraestructura doble. **Lo que me falta hoy para hacerlo en serio**: métricas y alertas (para saber que la versión nueva está mal), un `/health` que informe la versión y migraciones de base de datos versionadas. Canary lo descarto por ahora porque sin métricas es ruleta; con feature flags, en cambio, podría desplegar código apagado y encenderlo después (deploy ≠ release).

### 11. Plan de rollback y su tiempo medido
Como cada servicio ejecuta una imagen etiquetada por commit, volver atrás es **disparar el mismo hook de PROD con la imagen del último deploy bueno**:
```bash
export SHA_ANTERIOR=<commit-del-último-deploy-bueno>     # sale de Deployments → production o de la release anterior
read -rs HOOK_API_PROD   && export HOOK_API_PROD          # el hook se copia de Render → Settings (el secret de GitHub no se puede releer)
read -rs HOOK_FRONT_PROD && export HOOK_FRONT_PROD
INICIO=$(date +%s)
curl -fsS --max-time 30 --get --data-urlencode "imgURL=ghcr.io/bistolfibri/ingsoft3-tp01-backend:sha-$SHA_ANTERIOR"  "$HOOK_API_PROD"
curl -fsS --max-time 30 --get --data-urlencode "imgURL=ghcr.io/bistolfibri/ingsoft3-tp01-frontend:sha-$SHA_ANTERIOR" "$HOOK_FRONT_PROD"
# cuando Render → Deploys muestre ese commit como live en los dos servicios:
echo "rollback: $(( $(date +%s) - INICIO )) s"
```
- **Tiempo medido (lo hice de verdad el 15/10/2026)**: **menos de 1 minuto**. Disparé los dos hooks de PROD con `imgURL=…:sha-2d17b10514e326ef0e024328fc6f0feb539fca00` a las **19:17:53**, y en *Events* de `finfix-api-prod` y de `finfix-front-prod` el «Deploy live» figura a las **19:18** (Render muestra la hora al minuto). En *Deploys* cada deploy dice «Trigger: Deploy Hook» y tardó **10,6 s** (api) y **10,3 s** (front). Comprobé en la pantalla de PROD que volvió el subtítulo anterior de la app y después volví a la versión nueva (`ec0fd95`) con los mismos hooks. Los *Events* de Render no son públicos: los muestro en vivo en la defensa.
- No uso el botón *Manual Deploy* de Render: despliega la imagen que figura en *Settings → Image* (la de la primera configuración), **no** la que está corriendo, y podría llevar PROD hacia atrás sin avisar.
- **Lo que el rollback de código NO deshace**: los datos. Si una versión nueva hubiera migrado o borrado columnas o filas en Neon, volver a la imagen anterior no las recupera. Para eso haría falta una copia (backup o *branch* de Neon) tomada antes del deploy.
- Métrica DORA que ejercita: tiempo de recuperación ante fallos.

### 12. Release `v6.0.0`
El tag `v6.0.0` y su release se ponen **sobre el commit que está en PROD** (lo veo en *Deployments → production*), no sobre la punta de `main`, con `gh release create v6.0.0 --generate-notes --verify-tag`. ⏳ PENDIENTE: commit exacto y link (ver «Enlaces de este TP»).

### 13. Dificultades encontradas y soluciones
- **Mi primera versión del TP6 desplegaba en `localhost` con Docker Compose** (runner propio) y no en una nube. Esa versión no tenía URLs públicas ni una base por entorno de verdad; la reemplacé por Render + Neon, que es lo que describe este documento.
- **Hooks guardados como secrets del repositorio**: el profesor pide secrets **del environment**. Los moví a `qa` y `production` y borré los del repositorio.
- **Las URLs de la api en el navegador daban «Cannot GET /»**: es normal, la api no tiene ruta en `/`; se comprueba con `/health`.
- **El primer run en `Pending` parecía trabado**: era el job `deploy-prod` esperando mi aprobación (así funciona el gate).
- **El front de Render escucha en el puerto 80** (nginx) y la api en el `PORT` que Render le da: hubo que poner `PORT=80` en el servicio del front.
- **El nginx necesitaba `resolver` y `BACKEND_URL` sin barra final**: con barra, todos los pedidos a `/api` daban 404.
- **Neon con SSL obligatorio**: la api necesitó `DB_SSL=true`.

### 14. Declaración de uso de IA
Usé asistencia de IA (Claude) para estructurar el workflow, los jobs de deploy y las pruebas, y para redactar y revisar estas secciones. **Cómo lo verifiqué**: leí cada job del `ci.yml` y puedo explicar qué pasa entre el merge y PROD (cada compuerta, cada secret, cada espera); comprobé en Render que los deploys dicen «Triggered via Deploy Hook» con el `sha-` de la corrida; comprobé que QA y PROD usan bases distintas creando un dato sólo en PROD; y ejecuté yo misma el rechazo y la aprobación en GitHub.

---

## TP7 — Contenedores en el Pipeline y Pruebas E2E

### Enlaces del TP7

| Recurso | Enlace |
| :--- | :--- |
| **Paquetes públicos con etiqueta `sha-…`** | [backend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend) · [frontend](https://github.com/bistolfibri/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend) (ej.: `sha-2d17b10514e326ef0e024328fc6f0feb539fca00`) |
| **Corrida donde la INTEGRACIÓN quedó VERDE y la e2e ROJA** | Run #90 · commit que rompió la app: 842dfff (cambia el texto del botón en frontend/src/App.jsx, sin tocar e2e/) · artefactos del run: playwright-report-integracion (3 pruebas pasaron) y playwright-report-e2e (2 fallaron y 2 pasaron) |
| **Corrida completa en VERDE hasta PROD** | [Run #94](https://github.com/bistolfibri/ingsoft3-tp01/actions/runs/38812623770): build → deploy-qa → integración → e2e → aprobación en `production` (con comentario) → deploy-prod verde (commit `ec0fd95`) |
| **Release `v7.0.0`** | ⏳ PENDIENTE: link |
| **QA (vivo)** | API: https://finfix-api-qa.onrender.com/health · Front: https://finfix-front-qa.onrender.com |
| **PROD (vivo)** | API: https://finfix-api-prod.onrender.com/health · Front: https://finfix-front-prod.onrender.com |

> Lo único que no es público son los *Events* de Render: los muestro yo en vivo en la defensa (cada servicio dice «Triggered via Deploy Hook» con el `sha-<commit>` de la corrida).

### 1. Build once, deploy many
**El problema del TP6**: si el proveedor reconstruye el repo en cada entorno, lo que corre en PROD no es *bit a bit* lo que probé en QA (otra hora, otras dependencias resueltas de nuevo). Un ejemplo propio: si una dependencia del `npm install` cambia entre el build de QA y el de PROD, PROD podría fallar con el mismo código que en QA anduvo, y el error sería casi imposible de explicar.
**Lo que hago ahora**: los jobs `build-backend` y `build-frontend` construyen cada imagen **una sola vez**, la publican en `ghcr.io` como `sha-<commit>`, y los cuatro servicios de Render **ejecutan esa imagen** sin reconstruir nada. QA y PROD corren el mismo binario.

### 2. Estrategia de etiquetas y cómo configuré Render
- **`sha-<commit completo>` (registry)**: identifica el commit que produjo la imagen. Es la etiqueta con la que **promuevo**. Son los 40 caracteres: con el commit corto, el registry contesta `manifest unknown`.
- **`v7.0.0` (git)**: marca la versión que entrego del práctico, sobre el commit que está en PROD. No es una versión de producto (SemVer): el número lo fija el práctico.
- **No publico `latest`**: es un puntero que cambia con cada push; si PROD lo usara, no podría decir qué desplegué.
- **Con qué imagen configuré los servicios de Render**: con la de un commit puntual (el que usé al cambiar la fuente a *Existing Image*). **No es ésa la que corre**: Render sólo exige que coincidan el registry y el nombre de la imagen, y cada deploy de mi pipeline pasa un `imgURL` nuevo, sin tocar *Settings*. Por eso el botón *Manual Deploy* es peligroso: vuelve a la imagen vieja de *Settings*.
- **Cambié la fuente de servicios existentes** (no creé servicios nuevos): se conservan la URL, las variables y los hooks.

### 3. Del tag a la imagen, en un paso
`git rev-list -n1 v7.0.0` devuelve el commit; la imagen de ese commit se llama `…-backend:sha-<commit>` / `…-frontend:sha-<commit>` y está en mis dos paquetes. Volver a esa versión es mandarle esa etiqueta al hook (el mismo mecanismo del deploy).

### 4. Cómo compruebo desde afuera que un entorno EJECUTA mi imagen
En los *Events* de cada servicio, el deploy dice «Triggered via Deploy Hook» y nombra la imagen `sha-<commit>` de esa corrida; el log de la corrida muestra el mismo `imgURL` en el deploy a QA y en el de PROD; y esa etiqueta existe en el paquete. Un deploy hecho a mano desde el panel se nota: no dice «Triggered via Deploy Hook» y no hay corrida que lo respalde.
**Lo que el smoke NO prueba**: sólo pregunta «¿respondés?». Si el deploy falló, el servicio sigue sirviendo la versión anterior y el smoke da verde. Cerrarlo (concepto, no implementado): que `/health` devuelva el commit que corre y que el smoke lo compare con `github.sha`.

### 5. Las dos suites: qué elegí y qué no
- **Integración** (`frontend/e2e/api.spec.js`, Playwright con el fixture `request`, **sin navegador y sin dobles**), contra la **api de QA desplegada** (`API_BASE_URL`), con la base real de Neon: (1) `GET /api/dashboard` devuelve la estructura leída de la base; (2) alta + verificación en la base + borrado + verificación de que ya no está; (3) alta inválida → HTTP 400 **y** la cantidad de gastos no cambia. La que crea un dato usa un nombre único (con la hora) y lo borra.
- **E2E** (`frontend/e2e/gastos.spec.js`, Chromium), contra el **front de QA** (`E2E_BASE_URL`): crear → verlo → borrarlo, dato inválido (título vacío: el botón queda deshabilitado y no se crea nada) y un flujo de fechas (el selector de vencimientos se arma desde la fecha actual, con el reloj del navegador fijado). Además hay una prueba de navegación inicial que es un *smoke* (no cuenta como flujo). Sin `page.route` ni mocks, sin `test.skip`.
- **Qué NO puse en e2e**: cálculos de cuotas, recargos, prioridades (eso lo cubren los unit tests del TP5; repetirlo en e2e sería lento y frágil). **Qué NO puse en integración**: la pantalla.
- **Por qué no es lo mismo integración que e2e**: la integración le habla directo a la api y prueba que *api + base* se entienden (lo que un doble no ve: tipos de columna, restricciones, errores reales de Postgres). La e2e prueba que *una persona puede usar la app*, y cuando se pone roja no dice *quién* se rompió; juntas dan un diagnóstico.

| integración | e2e | qué se rompió |
|---|---|---|
| 🟢 | 🔴 | el front (la api está sana, la pantalla no la usa bien) |
| 🔴 | ⬜ no corre | la api o la base |
| 🟢 | 🟢 | nada de lo que estas pruebas ven |

- **Mi par verde/rojo**: rompí el front cambiando el texto del botón «Guardar Obligación» por «Crear Gasto» sin tocar e2e/ (commit 842dfff). El smoke de QA dio verde (el sistema respondía), la integración quedó verde (3 pruebas pasaron: la api y la base estaban sanas) y la e2e quedó roja (fallaron los tests 2 y 3, que buscan ese botón; en el reporte se ven la captura y la traza). deploy-prod no arrancó. Lo leo con la tabla de arriba: integración verde + e2e roja = se rompió el front, no la api ni la base. Si hubiera roto la api, la integración habría fallado y la e2e ni habría corrido.

### 6. Integración amplia, no estrecha
Mi integración es **amplia**: le habla a la api **ya desplegada** en QA con su base real. **Qué gana**: casi no necesita configuración, prueba además que el despliegue quedó bien, y no tengo que levantar una base en el pipeline. **Qué pierde**: depende de que QA esté despierto y es menos aislada (la estrecha, con la api armada dentro del job y una base descartable, no se contamina con otras corridas y llega antes porque no necesita deploy).

### 7. Cold start, timeouts y tests flaky
QA duerme y despierta lento. El smoke previo despierta QA, y la configuración de Playwright lleva tiempos largos (60 s por test, 15 s por aserción) y **un** reintento, sin `sleep` fijos (uso la espera automática de Playwright). Un test *flaky* es el que a veces falla sin que el código cambie: es peor que no tener test porque entrena al equipo a ignorar el rojo. Un test que pasa recién en el reintento aparece como *flaky* en el reporte aunque la corrida esté verde: por eso abro el reporte igual.

### 8. La misma imagen del front en QA y en PROD
La dirección del backend **no está dentro de la imagen**: nginx la lee al arrancar de la plantilla `default.conf.template` con `${BACKEND_URL}` y `${DNS_RESOLVER}`. En Render, cada front recibe por variable de entorno la URL de **su** api (`BACKEND_URL` sin barra final) y `DNS_RESOLVER=8.8.8.8`. **Por variable**: `BACKEND_URL`, `DNS_RESOLVER`, `PORT`. **Adentro de la imagen**: el código del front ya compilado y la plantilla de nginx. El front pide siempre a su mismo origen (`/api/...`) y nginx lo reenvía.

### 9. Mi QA es uno solo: límite conocido de la cadena
QA lo comparten todas las corridas. Con dos merges seguidos, el `deploy-qa` de la corrida B puede cambiar la imagen de QA mientras la integración o la e2e de la A están corriendo: ves un rojo que no es de tu código o, peor, un verde que probó parte de la imagen de B. **Cómo lo reconocería**: en *Events* del servicio de QA veo qué imagen está corriendo y comparo la hora del `deploy-qa` de B con la de las pruebas de A. **Qué hago**: la corrida vieja se **rechaza a mano, con motivo** (el `concurrency` no la cancela: una corrida esperando aprobación no está «en cola»), no re-corro sus jobs y sigo con la nueva. **Regla**: un merge por vez mientras la cadena está corriendo. Un equipo real lo resolvería con un entorno por corrida.

### 10. El gate: qué lo hace poder decir que no
`deploy-prod` tiene `needs: e2e`, y la e2e `needs: integracion`, que a su vez `needs: deploy-qa`. Nada en ese tramo lo desarma (no hay `continue-on-error`, ni `|| true`, ni `if: always()`; el único `!cancelled()` está en los pasos que publican reporte). Las dos suites viven en el mismo workflow y corren con el mismo `push` a `main`. **Qué clase de bug NO ataja**: lo que los pocos flujos no recorren, y lo que sólo pasa en producción con usuarios y datos reales.

### 11. Fuente única de verdad de datos (limpieza previa al TP8)
- **Backend sin datos simulados**: se eliminaron `mockExpenses`/`mockCategories` del controller. Antes, si Postgres fallaba, la API respondía 200/201 con datos en memoria y ocultaba el problema (un test de integración podía pasar con la base caída). Ahora responde HTTP 500 y el pipeline lo detecta. Además, el pago usa una transacción con un único cliente del pool (`BEGIN/COMMIT/ROLLBACK`) y el duplicado de títulos se valida contra la base real.
- **Frontend sin datos falsos**: se eliminaron `DEFAULT_DATA` y `DEFAULT_CATEGORIES`. Las categorías vienen de la API y, después de cada alta/pago/borrado, la pantalla se recarga desde la base. Así se usan los `id` reales de Postgres.
- **Seed**: `seed.sql` queda solo con lo necesario (categorías + presupuesto, idempotente) y la categoría 3 pasó de `Tarjeta` a `Cuota` (la lógica de cuotas compara ese nombre). QA y PROD no tienen datos falsos y los tests crean y borran sus propios datos.
- **E2E**: se acepta el `window.confirm` con `page.once('dialog', ...)`, se localiza la fila por título exacto y se recarga la página para comprobar que el gasto realmente se guardó/borró en la base.
- **Preparación para la nube**: `db.js` admite SSL con `DB_SSL=true` (Neon) y las columnas DATE se devuelven como texto para evitar corrimientos de zona horaria.

### 12. Dificultades encontradas y soluciones
- **Versión anterior en `localhost`**: mi primer TP7 corría QA con Docker Compose dentro de los jobs de integración y e2e (cada job es una VM limpia, así que levantaba los contenedores de nuevo). Lo reemplacé por Render + Neon: las suites le pegan a las URLs públicas de QA, que son variables del repositorio.
- **Locator de Playwright `isEnabled()`**: en un elemento deshabilitado espera hasta agotar el timeout; usé `expect(btn).toBeDisabled()`.
- **Hooks en secrets del repositorio** en lugar de secrets de environment: los moví a `qa` y `production`.
- **Ciclo de deploy lento** (8–12 min por merge entre checks, deploy y smoke): por eso agrupo cambios en un mismo PR.

### 13. Declaración de uso de IA
Usé asistencia de IA (Claude) para estructurar el YAML (deploy con `imgURL`, jobs de integración y e2e), los locators de Playwright y la redacción de esta sección. **Verificación**: leí los specs y puedo explicar qué verifica cada test, contra qué entorno corre y qué pasa si falla; ejecuté las suites localmente y en GitHub Actions; provoqué yo la rotura del front y revisé los dos reportes; y comprobé en Render el `sha-` de cada deploy.
