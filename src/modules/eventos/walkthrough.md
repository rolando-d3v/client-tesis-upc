# Risk Dashboard — Walkthrough

## Resumen

Se implementó el **módulo completo de Risk Dashboard de Auditoría Predictiva** para detección de fuga de información clasificada, basado en el documento de arquitectura, y se crearon las **tablas en PostgreSQL** para persistencia a largo plazo y visualización en tiempo real.

---

## Cambios Realizados

### Base de Datos (PostgreSQL — asyncpg)

Se añadieron y crearon exitosamente 3 tablas de datos con sus respectivos índices para búsquedas optimizadas:

*   **`evento_prediccion_sesion`**: Registra cada carga de dataset CSV, total de eventos procesados, usuarios activos, nombre del archivo, y guarda un consolidado JSONB precalculado de todos los dashboards para garantizar lecturas ultra-rápidas.
*   **`evento_prediccion_detalle`**: Guarda los 164K+ registros de eventos enriquecidos, incluyendo marcas de horario, tamaño del archivo, IDs de tipo de evento/clasificación, y los scores de riesgo híbrido asignados.
*   **`evento_perfil_usuario`**: Guarda los perfiles de comportamiento incremental (algoritmo online de Welford para media y desviación estándar de eventos y volumen, proporciones de clasificaciones/acciones, y el score EWMA del usuario).

### Backend (FastAPI — Python)

| Archivo | Descripción |
|---|---|
| [db_eventos.py](file:///c:/Users/landon/Documents/python/server-machine-learning/src/modules/eventos/db_eventos.py) | **[NUEVO]** DDL de creación de tablas, e inserción transaccional por lotes (chunks de 10,000) y lectura del JSONB para los dashboards de la última sesión. |
| [pipeline_eventos.py](file:///c:/Users/landon/Documents/python/server-machine-learning/src/modules/eventos/pipeline_eventos.py) | Pipeline de eventos: ETL, Feature Engineering, Score de Reglas (5 indicadores ponderados), Isolation Forest, Score Híbrido y Perfiles incrementales. |
| [eventos_controller.py](file:///c:/Users/landon/Documents/python/server-machine-learning/src/modules/eventos/eventos_controller.py) | Modificado para llamar a la persistencia en base de datos al procesar el CSV, y servir los datos de cada dashboard desde PostgreSQL con fallback a memoria. |
| [eventos_routes.py](file:///c:/Users/landon/Documents/python/server-machine-learning/src/modules/eventos/eventos_routes.py) | Endpoints RESTful para la carga del CSV y lectura de datos. |
| [main.py](file:///c:/Users/landon/Documents/python/server-machine-learning/src/main.py) | Inicialización automática de las tablas de eventos en base de datos PostgreSQL en el startup del servidor FastAPI. |

### Frontend (React + Recharts + React Query)

| Componente/Página | Descripción |
|---|---|
| [apiEventos.jsx](file:///c:/Users/landon/Documents/react/client-tesis-upc/src/api/apiEventos.jsx) | Hooks `@tanstack/react-query` y llamadas API sincronizados. |
| **Componentes de Visualización** | 15 componentes Recharts en React con CSS Modules independientes para mostrar KPIs, semáforos, heatmaps, histogramas, radares, gráficos de dispersión y evolución de perfiles. |
| **7 Páginas de Dashboards** | Páginas del dashboard ejecutivo, comportamiento de usuarios (con drill-down detallado), análisis temporal, volumen de MB y detalles del motor ML e incremental. |
| [routes.jsx](file:///c:/Users/landon/Documents/react/client-tesis-upc/src/config/routes.jsx) | Configuración de las rutas privadas del dashboard. |
| [SidebarAdmin.jsx](file:///c:/Users/landon/Documents/react/client-tesis-upc/src/layout/admin_layout/sidebar/SidebarAdmin.jsx) | Añadidos 7 enlaces de navegación con sus correspondientes iconos vectoriales premium. |

---

## Verificación

*   **Inicialización de Base de Datos**: ✅ Tablas creadas y verificadas exitosamente con asyncpg bajo el entorno virtual.
*   **Pipeline e importaciones de Python**: ✅ Módulos importados correctamente, sin fallos ni dependencias ausentes en `venv`.
*   **Vite Production Build**: ✅ Compilado a producción sin errores (1268 módulos de React).
