# Registro de Decisiones de Arquitectura — FinFix

Este documento registra de forma incremental todas las decisiones técnicas, de arquitectura y de infraestructura tomadas durante la cursada de **Ingeniería del Software III (UCC 2026)**.

---

## 1. Selección de la Aplicación del Semestre (TP2)

**Aplicación seleccionada**: `FinFix` — Gestor de Obligaciones Fijas Mensuales, Servicios y Compras en Cuotas.

### Justificación de los 5 Criterios de Selección ([`elegir-app.md`](elegir-app.md))

1. **Que puedan ejecutarla hoy**: 
   - La aplicación está desacoplada en `./backend` y `./frontend`. Cuenta con fallback en memoria para ejecutarla instantáneamente sin dependencias externas en la primera corrida, y soporte completo para PostgreSQL.
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
     5. `validateExpenseInput`: Validación de integridad de entradas (monto $>0$, fecha obligatoria en rango acotado a 1 año antes/después).
   - **Frontend (4 Comportamientos de UI)**:
     1. Pantalla de Bienvenida Hero con botón directo *"Ver Mis Gastos y Obligaciones"*.
     2. Lógica automatizada para la categoría **Cuota** (calcula cuota actual de N totales y proyecta automáticamente la cuota N+1 para el mes siguiente).
     3. Formato explicativo de fechas completas con Año visible (ej: *"Vence 11 de Mayo de 2025"*).
     4. Restricción en modal de pago: la fecha de pago NO puede ser posterior al día de HOY.
5. **Que la entiendan lo suficiente para modificarla**:
   - La aplicación posee un diseño limpio en arquitectura de 3 capas (Rutas $\rightarrow$ Controladores $\rightarrow$ Servicios/Reglas) que facilita cualquier modificación en vivo requerida durante las defensas orales.

---

## 2. Decisiones de Diseño e Interfaz

- **Categorías Simplificadas**: Únicamente 4 categorías oficiales: `Vivienda`, `Servicios`, `Cuota` y `Entretenimiento`.
- **Lógica de Cuotas**: Al seleccionar `Cuota`, se solicitan los campos de cuota N de M y se autogenera la plantilla de pago.
- **Validación de Rangos de Fechas de Pago**: El pago solo puede registrarse hasta el día de HOY (no se permiten fechas futuras de pago).

---

## 3. Declaración de Uso de Inteligencia Artificial (Sección 6 del `README.md`)

De acuerdo a la **Sección 6 del reglamento de la cursada**:

1. **Partes asistidas**: La estructura inicial del proyecto, el esquema de la base de datos y la implementación modular de las reglas de negocio fueron generadas con la asistencia del agente AI (Antigravity).
2. **Verificación realizada**: Se probó localmente el servidor backend Express, la conectividad con las variables de entorno, y la compilación del cliente React con Vite.
3. **Compromiso de Defensa Oral**: Toda la lógica de negocio en `backend/src/services/expenseRules.js` y el consumo de la API han sido revisados y comprendidos en su totalidad para ser expuestos y modificados en las defensas orales de P1, P2 y el Integrador.
