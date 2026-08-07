# Registro de Decisiones y Respuestas — TP1

## 1. Análisis del Conflicto de Merge

### ¿Por qué Git no pudo resolver el conflicto solo?
El conflicto ocurrió porque ambas ramas (`feature/titulo-a` y `feature/titulo-b`) nacieron del mismo commit base de `main` y modificaron la misma línea con contenidos distintos (`# Proyecto IngSoft3 - versión A` vs `# Proyecto IngSoft3 - versión B`). 
Al momento de integrar la segunda rama, Git detectó dos versiones diferentes para la misma posición del archivo y, no toma decisiones sobre el contenido del código. Por eso, delegó la resolución al usuario insertando los marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`).

### ¿Qué tendría que haber pasado para que no apareciera?
Para evitar este conflicto, se podría haber decido modificar la misma línea solo una vez o por ejemplo, trabajar de forma secuencial: hacer que la segunda rama partiera del commit de `main` que ya contenía los cambios de la primera rama (tras hacer `git pull`).

-----------

## 2. Dificultades Encontradas y Soluciones
Durante el desarrollo del trabajo se presentaron los siguientes inconvenientes técnicos:

1. Reconocimiento del comando `gh` en PowerShell:
   - Problema: Tras instalar GitHub CLI con `winget`, la terminal arrojaba el error `gh no se reconoce como un comando ejecutable`.
   - Solución: La variable de entorno `PATH` no se actualizó automáticamente en la sesión de PowerShell abierta. Se resolvió abriendo una nueva ventana de terminal para recargar el `PATH`.

2. Error con el operador `&&` en PowerShell:
   - Problema: Al intentar ejecutar `git switch main && git pull` en PowerShell 5.1, la consola dio un error de sintaxis porque `&&` no es un separador válido en esa versión.
   - Solución: Se ejecutaron los comandos por separado (`git switch main` y luego `git pull`).

-----------

## 3. Declaración de Uso de Inteligencia Artificial
En cumplimiento con la Sección 6 del reglamento de la cursada (`README.md`):

1. Uso de IA: Se utilizó asistencia de Inteligencia Artificial (Antigravity) para consultar dudas conceptuales sobre la sintaxis de PowerShell, entender los mensajes de error de la terminal y verificar el flujo del TP1.
2. Verificación realizada: Todos los comandos, capturas, decisiones y operaciones en Git/GitHub fueron ejecutados, probados y verificados manualmente en el repositorio y la interfaz web.
