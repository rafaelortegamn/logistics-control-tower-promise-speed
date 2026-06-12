Python — Generación de Datos Sintéticos

Esta carpeta contiene el script generate_mock_data.py, utilizado para generar datos sintéticos a nivel envío para el proyecto Logistics Control Tower — Promise & Speed Management.

Objetivo

El script simula una operación logística con envíos, promesas de entrega, carriers, carriles, eventos operativos, costos, contactos CX, reclamos, compensaciones y segmentos priorizables.

Los datos generados son completamente mock y no contienen información real ni confidencial.

Outputs

Al ejecutarse, el script genera archivos CSV en:

analysis/python/generated_data/

Archivos generados:

* envios_mock.csv
* eventos_envio_mock.csv
* segmentos_mock.csv
* responsables_mock.csv

Estos archivos no sobrescriben automáticamente los datos utilizados por el dashboard publicado. El dashboard consume los CSV ubicados en public/data/.

Uso

Desde la raíz del proyecto:

python analysis/python/generate_mock_data.py

Nota

En este proyecto, Python se utiliza para generar la base sintética. En un entorno real, también podría utilizarse para exploración de datos, limpieza, análisis rápido, simulación de escenarios y visualizaciones preliminares.