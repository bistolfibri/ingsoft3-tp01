# Registro de Decisiones de Arquitectura — FinFix

Este documento registra de forma incremental todas las decisiones técnicas, de arquitectura y de infraestructura tomadas durante la cursada de **Ingeniería del Software III (UCC 2026)**.

---

## 1. Registro del TP1 — Git Colaborativo

### Análisis del Conflicto de Merge (TP1)
- **¿Por qué Git no pudo resolver el conflicto solo?**: El conflicto ocurrió porque ambas ramas (`feature/titulo-a` y `feature/titulo-b`) nacieron del mismo commit base de `main` y modificaron la misma línea con contenidos distintos (`# Proyecto IngSoft3 - versión A` vs `# Proyecto IngSoft3 - versión B`). Al integrar la segunda rama, Git detectó dos versiones diferentes y delegó la resolución al usuario insertando los marcadores de conflicto.
- **¿Qué tendría que haber pasado para que no apareciera?**: Trabajar de forma secuencial haciendo que la segunda rama partiera del commit de `main` actualizado tras hacer `git pull`.

### Dificultades Encontradas y Soluciones (TP1)
1. **Comando `gh` en PowerShell**: Tras instalar GitHub CLI con `winget`, la terminal arrojaba `gh no se reconoce`. Se resolvió abriendo una nueva ventana de terminal para recargar el `PATH`.
2. **Operador `&&` en PowerShell 5.1**: Al ejecutar `git switch main && git pull`, la consola dio error de sintaxis. Se ejecutaron los comandos por separado.

---

## 2. TP2 — Selección de la Aplicación del Semestre y Contenedores

**Aplicación seleccionada**: `FinFix` — Gestor de Obligaciones Fijas Mensuales, Servicios y Compras en Cuotas.

### Justificación de los 5 Criterios de Selección (Sección 3.3)

1. **Que puedan ejecutarla hoy**: 
   - La aplicación está desacoplada en `./backend` y `./frontend`. Cuenta con soporte completo para PostgreSQL y fallback en memoria.
2. **Que conozcan los comandos de compilación y ejecución**:
   - **Backend**: `npm install` && `npm start` (o `npm run dev` en desarrollo).
   - **Frontend**: `npm install` && `npm run build` (o `npm run dev` en desarrollo).
3. **Que la conexión a la base sea parametrizable por variables de entorno**:
   - Toda la conexión a la base de datos se configura centralizadamente en `backend/src/config/db.js` leyendo las variables de entorno `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` provenientes de `.env` o del entorno Docker.
4. **Que tenga lógica para testear (TP5)**:
   - **Backend (Reglas de Negocio Puras)**:
     1. `isDuplicateExpenseTitle`: Detección e impedimento de creación de obligaciones con conceptos duplicados.
     2. `processPaymentData`: Validación estricta de pagos. Impide pagos futuros a la fecha actual y prohíbe montos menores al total adeudado. Si está vencido permite recargo por mora.
     3. `determineExpenseStatus`: Cálculo dinámico de vencimientos (*PENDIENTE* vs *VENCIDO* vs *PRÓXIMO*) timezone-safe comparando contra la fecha actual.
     4. `calculateCategorizedMetrics`: Cálculo diferenciado de métricas entre Gastos Fijos (Alquiler/Expensas/Servicios) y Eventuales/Cuotas.
     5. `validateExpenseInput`: Validación de integridad de entradas (monto $>0$, fecha obligatoria en rango acotado).
   - **Frontend (4 Comportamientos de UI)**:
     1. Pantalla de Bienvenida Hero con botón directo *"Ver Mis Gastos y Obligaciones"*.
     2. Lógica automatizada para la categoría **Cuota** (calcula cuota actual de N totales y proyecta la cuota N+1 para el mes siguiente).
     3. Formato explicativo de fechas completas con Año visible (ej: *"Vence 11 de Mayo de 2025"*).
     4. Restricción en modal de pago: la fecha de pago NO puede ser posterior al día de HOY.
5. **Que la entiendan lo suficiente para modificarla**:
   - La aplicación posee un diseño limpio en arquitectura de 3 capas (Rutas $\rightarrow$ Controladores $\rightarrow$ Servicios/Reglas) que facilita cualquier modificación en vivo requerida durante las defensas orales.

### Decisiones de Contenerización e Infraestructura (Sección 3.8)

- **Estructura Multi-stage**: Se diseñaron Dockerfiles de 2 etapas (`node:20-alpine` para build y final del backend; `node:20-alpine` para build y `nginx:alpine` para servidor estático del frontend). Esto redujo el tamaño de las imágenes a **200 MB** (Backend) y **93 MB** (Frontend), eliminando compiladores y dependencias de desarrollo de las imágenes finales.
- **Estrategia de Persistencia**: Se utilizó el volumen nombrado `db_data` montado en `/var/lib/postgresql/data` para garantizar que los datos sobrevivan a reinicios del contenedor (`docker compose down` / `up -d`). Se incluyeron scripts de inicialización SQL (`schema.sql` y `seed.sql`) en `/docker-entrypoint-initdb.d` para inicializar la base de datos de manera automática.
- **Redes y Proxy Inverso**: Nginx actúa como servidor web estático y proxy inverso redirigiendo las llamadas `/api/` hacia `http://backend:3001` mediante el DNS interno de Docker (`127.0.0.11`), eliminando cualquier problema de CORS y evitando URLs absolutas escritas en el código.
- **Manejo de Secretos**: La contraseña de PostgreSQL se inyecta dinámicamente mediante la variable `${DB_PASSWORD}` leída desde `.env` (ignorado en `.gitignore`), proporcionando la plantilla pública `.env.example`.

---

## 3. Declaración de Uso de Inteligencia Artificial

De acuerdo a la **Sección 6 del reglamento de la cursada**:

1. **Uso de IA**: Se utilizó asistencia de Inteligencia Artificial (Antigravity) para consultar dudas conceptuales sobre la sintaxis de Docker, PowerShell y verificar la integración del TP1 y TP2.
2. **Verificación realizada**: Todos los comandos, capturas, decisiones y operaciones en Git/GitHub fueron ejecutados, probados y verificados manualmente en el repositorio.
3. **Compromiso de Defensa Oral**: Toda la lógica de negocio en `backend/src/services/expenseRules.js` y la configuración de Docker son comprendidas en su totalidad para ser expuestas y modificadas en las defensas orales.
