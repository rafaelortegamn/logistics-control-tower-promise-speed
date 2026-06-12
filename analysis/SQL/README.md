# SQL — Análisis Diagnóstico

Esta carpeta contiene los scripts SQL utilizados para analizar la base sintética del proyecto **Logistics Control Tower — Promise & Speed Management**.

## Archivos

- `create_schema.sql`: crea la base de datos y las tablas necesarias para cargar los CSV mock.
- `diagnostic_queries.sql`: contiene las consultas diagnósticas para analizar promesa, late rate, nodos, carriles, journey operativo, cost-to-serve, ownership y priorización tipo war room.

## Objetivo

El análisis SQL transforma datos a nivel envío en hallazgos operativos accionables.

Las consultas buscan responder:

- ¿Dónde se rompe la promesa?
- ¿Qué volumen está afectado?
- ¿Qué nodos, carriles o carriers concentran fricción?
- ¿Cuál es el cost-to-serve estimado?
- ¿Qué segmentos deben priorizarse primero?
- ¿Qué equipo tiene ownership de cada frente?

## Flujo sugerido

1. Ejecutar `create_schema.sql`.
2. Importar los CSV mock a las tablas correspondientes.
3. Ejecutar `diagnostic_queries.sql`.
4. Revisar la interpretación de resultados en `../interpretation/sql_outputs_interpretation.md`.

## Nota

Los datos utilizados son completamente sintéticos y se incluyen únicamente con fines de portafolio, aprendizaje y demostración metodológica.