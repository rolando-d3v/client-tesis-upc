# Risk Dashboard — Task Tracker

## Backend
- [x] `pipeline_eventos.py` — ETL, Feature Engineering, Score Reglas, Isolation Forest, Score Híbrido, Perfiles EWMA, generación datos dashboards
- [x] `db_eventos.py` — **[NUEVO]** DDL de base de datos e inserciones/consultas transaccionales batch
- [x] `eventos_controller.py` — 14 endpoints controller integrados con PostgreSQL y fallback en memoria
- [x] `eventos_routes.py` — Rutas FastAPI
- [x] `main.py` — Registrar router de eventos e inicialización automática de BD en startup

## Base de Datos (PostgreSQL)
- [x] Crear tablas `evento_prediccion_sesion`, `evento_prediccion_detalle` y `evento_perfil_usuario`
- [x] Agregar índices para optimizar búsquedas por usuario y rango de fechas
- [x] Verificar funcionamiento de scripts de inicialización DDL

## Frontend — API
- [x] `apiEventos.jsx` — API functions + React Query hooks

## Frontend — Componentes
- [x] `UploadCSVEventos/` — Upload CSV
- [x] `CardResumenEventos/` — KPI cards
- [x] `SemaforoRiesgo/` — Semáforo de riesgo
- [x] `TopRiesgo/` — Top 10 usuarios/documentos
- [x] `TablaAlertas/` — Alertas activas
- [x] `TablaUsuarios/` — Tabla usuarios con drill-down
- [x] `TimelineUsuario/` — Drill-down cronológico
- [x] `HeatmapEventos/` — Heatmap día×hora
- [x] `HistogramaHoras/` — Distribución por hora
- [x] `TablaFueraHorario/` — Fuera de horario
- [x] `ClasificacionDocumental/` — Por clasificación
- [x] `VolumenMB/` — Volumen MB
- [x] `RadarRiesgo/` — Radar 6 dimensiones
- [x] `ScatterDeteccion/` — Scatter IF vs volumen
- [x] `PerfilUsuarioEWMA/` — Score EWMA

## Frontend — Páginas
- [x] `CargaCSVEventos/` — Página carga CSV
- [x] `Dashboard1Ejecutivo/` — Resumen ejecutivo
- [x] `Dashboard2Usuarios/` — Comportamiento por usuario
- [x] `Dashboard3Temporal/` — Actividad temporal
- [x] `Dashboard4Clasificacion/` — Clasificación documental
- [x] `Dashboard5Deteccion/` — Motor detección
- [x] `Modulo6Perfiles/` — Evaluación incremental

## Frontend — Integración
- [x] `routes.jsx` — Agregar rutas
- [x] `SidebarAdmin.jsx` — Agregar links sidebar

## Verificación
- [x] Backend: importar pipeline y controladores bajo el venv de python sin errores
- [x] PostgreSQL: inicializar esquemas exitosamente sin errores
- [x] Frontend: build sin errores de Vite (1268 modules, 0 errors)
