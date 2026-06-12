Interpretación de resultados SQL — Base mock

Nota metodológica:

Los resultados documentados en este archivo provienen de una base mock/sintética generada únicamente para demostrar la metodología analítica del caso.

Estos resultados no representan datos reales ni deben interpretarse como evidencia definitiva de causa raíz. Su objetivo es mostrar qué tipo de hallazgos produciría el análisis con una base shipment-level real.

La lógica de análisis busca responder cinco preguntas:

1. ¿Dónde se rompe la promesa?

2. ¿Qué volumen está afectado?

3. ¿Cuál es el costo real de la fricción?

4. ¿Quién tiene ownership?

5. ¿Qué debe atacarse primero?

------------------------------------------------------------

Query 1 — Late rate por tipo de promesa

Resultado obtenido en base mock:

+--------------+--------------+----------------+---------------+------------------------+
| tipo_promesa | total_envios | envios_tardios | late_rate_pct | retraso_promedio_horas |
+--------------+--------------+----------------+---------------+------------------------+
| Next Day     |         1242 |            252 |         20.29 |                   8.30 |
| Two Day      |         1746 |            292 |         16.72 |                   3.22 |
| Standard     |         2012 |            228 |         11.33 |                   1.45 |
+--------------+--------------+----------------+---------------+------------------------+

Interpretación:

En la base mock, Next Day muestra el mayor riesgo relativo de incumplimiento, con un late rate de 20.29%, frente a 16.72% en Two Day y 11.33% en Standard. Sin embargo, Two Day genera más entregas tardías absolutas debido a su mayor volumen.

Esto demuestra que la priorización no debe basarse únicamente en el porcentaje de tardías, sino en la combinación de late rate, volumen afectado, impacto en CX, cost-to-serve y controlabilidad.

Implicación operativa:

La promesa rápida requiere una calibración más fina por zona, cutoff, carrier, fulfillment y capacidad real. El objetivo no sería eliminar Next Day, sino protegerla donde la red puede cumplirla consistentemente y ajustarla donde el incumplimiento sea recurrente.

-----------------------------------------------------------------------------------------------------------------------------

Query 2 — Ranking de nodos con mayor impacto en entregas tardías

Resultado obtenido en base mock:

+------------+--------------+----------------+---------------+------------------------+
| nodo       | total_envios | envios_tardios | late_rate_pct | retraso_promedio_horas |
+------------+--------------+----------------+---------------+------------------------+
| FC_MTY_01  |         1005 |            188 |         18.71 |                   4.50 |
| FC_GDL_01  |          985 |            173 |         17.56 |                   4.30 |
| FC_CDMX_01 |          986 |            146 |         14.81 |                   3.84 |
| FC_PUE_01  |         1001 |            136 |         13.59 |                   3.27 |
| FC_QRO_01  |         1023 |            129 |         12.61 |                   2.96 |
+------------+--------------+----------------+---------------+------------------------+

Interpretación:

En la base mock, FC_MTY_01 y FC_GDL_01 concentran el mayor impacto operativo. Ambos presentan los mayores volúmenes de entregas tardías y también los late rates más altos del grupo.

Esto los convierte en candidatos claros para un diagnóstico prioritario en los primeros 30 días del roadmap. La lectura no debe limitarse a decir “estos nodos están peor”, sino a preguntar qué fricción está ocurriendo dentro de ellos: dwell time alto, capacidad insuficiente, salidas perdidas, saturación por horario, reglas de cutoff mal calibradas o acumulación de paquetes en riesgo.

Implicación operativa:

Con datos reales, priorizaría FC_MTY_01 y FC_GDL_01 para revisar dwell time, capacidad por turno, horarios de corte, acumulación de paquetes, aging y salidas perdidas. El objetivo no sería culpar al nodo, sino identificar qué parte del flujo está rompiendo la promesa y asignar ownership claro.

-----------------------------------------------------------------------------------------------------------------------------

Query 3 — Late rate por carril origen-destino

Resultado obtenido en base mock:

+---------------+--------------+----------------+---------------+------------------------+------------------------+
| carril        | total_envios | envios_tardios | late_rate_pct | retraso_promedio_horas | costo_promedio_paquete |
+---------------+--------------+----------------+---------------+------------------------+------------------------+
| GDL-OCCIDENTE |          555 |            110 |         19.82 |                   5.09 |                  79.58 |
| GDL-MTY       |          541 |            108 |         19.96 |                   4.76 |                  79.27 |
| CDMX-MTY      |          583 |            100 |         17.15 |                   4.39 |                  78.89 |
| GDL-CDMX      |          585 |             88 |         15.04 |                   3.60 |                  78.59 |
| CDMX-GDL      |          567 |             87 |         15.34 |                   3.54 |                  79.13 |
| PUE-CDMX      |          552 |             76 |         13.77 |                   3.42 |                  79.72 |
| MTY-CDMX      |          542 |             69 |         12.73 |                   3.17 |                  79.28 |
| QRO-CDMX      |          546 |             68 |         12.45 |                   2.89 |                  79.65 |
| CDMX-BAJIO    |          529 |             66 |         12.48 |                   3.01 |                  79.34 |
+---------------+--------------+----------------+---------------+------------------------+------------------------+

Interpretación:

En la base mock, los carriles GDL-OCCIDENTE, GDL-MTY y CDMX-MTY concentran el mayor impacto por entregas tardías. GDL-OCCIDENTE combina 110 envíos tardíos, 19.82% de late rate y el retraso promedio más alto del grupo, con 5.09 horas. GDL-MTY muestra el late rate más alto, con 19.96%, y también un volumen relevante de tardías.

Esto demuestra que el diagnóstico no debe limitarse a nodos individuales. La promesa también puede romperse en carriles origen-destino por problemas de middle mile, frecuencias de salida, acumulación en transferencias, variabilidad de carrier o saturación en ciertos tramos.

Implicación operativa:

Con datos reales, priorizaría los carriles GDL-OCCIDENTE, GDL-MTY y CDMX-MTY para revisar frecuencia de salidas, dwell time en transferencia, capacidad por tramo, performance por carrier y acumulación por horarios. El objetivo sería identificar si la fricción proviene de capacidad insuficiente, salidas perdidas, variabilidad de transporte o reglas de promesa mal calibradas para esos carriles.

-----------------------------------------------------------------------------------------------------------------------------

Query 4 — Tiempo promedio por etapa del flujo operativo

Resultado obtenido en base mock:

+------------------+--------------+------------------------+---------------------------------+-------------------------+------------------------------------+----------------------------------+-------------------------+
| tipo_resultado   | total_envios | avg_tiempo_fulfillment | avg_espera_despacho_fulfillment | avg_tiempo_en_sortation | avg_transito_sortation_a_last_mile | avg_tiempo_en_estacion_last_mile | avg_tiempo_ruta_entrega |
+------------------+--------------+------------------------+---------------------------------+-------------------------+------------------------------------+----------------------------------+-------------------------+
| Entrega tardía   |          772 |                   4.50 |                            1.43 |                   15.27 |                              14.35 |                            14.86 |                   17.54 |
| Entrega a tiempo |         4228 |                   4.52 |                            1.52 |                    7.08 |                               7.44 |                             6.80 |                    3.09 |
+------------------+--------------+------------------------+---------------------------------+-------------------------+------------------------------------+----------------------------------+-------------------------+

Interpretación:

En la base mock, fulfillment inicial no parece explicar el deterioro, ya que el tiempo promedio desde pedido creado hasta ready-to-ship es prácticamente igual entre entregas tardías y entregas a tiempo: 4.50 horas vs. 4.52 horas. Lo mismo ocurre con la espera de despacho en fulfillment, donde la diferencia tampoco es material.

La diferencia fuerte aparece después de fulfillment. Las entregas tardías muestran tiempos significativamente mayores en sortation, tránsito hacia last mile, estación last mile y ruta de entrega.

En particular:

- Tiempo en sortation pasa de 7.08 horas en entregas a tiempo a 15.27 horas en entregas tardías.

- Tránsito de sortation a last mile pasa de 7.44 a 14.35 horas.

- Tiempo en estación last mile pasa de 6.80 a 14.86 horas.

- Tiempo en ruta de entrega pasa de 3.09 a 17.54 horas.

Esto sugiere que la promesa se rompe principalmente por acumulación de tiempos de permanencia, variabilidad operativa y posibles cuellos de botella después de que el paquete ya fue preparado. La lectura refuerza la necesidad de diagnosticar el flujo end-to-end y no limitar el análisis al resultado final de entrega tardía.

Implicación operativa:

Con datos reales, priorizaría la medición de tiempos por etapa para detectar acumulaciones antes de que se conviertan en entregas tardías. La torre de control debería monitorear paquetes detenidos en sortation, salidas perdidas, tránsito irregular hacia last mile, aging en estación last mile, retrasos de out-for-delivery e intentos fallidos de entrega.

Nota metodológica:

Los nombres de columnas fueron ajustados para facilitar la interpretación. En lugar de hablar únicamente de “dwell time”, la query separa tiempos de preparación, permanencia, tránsito y ruta. Esto evita confundir tiempo detenido con tiempo total de proceso.

-----------------------------------------------------------------------------------------------------------------------------

Query 5 — Concentración de riesgo operativo por segmento

Resultado obtenido en base mock:

+----------+---------------+-----------+--------+------+------+-------+--------+------------+----------+-------+------------+------+
| promesa  | carril        | carrier   | envios | crit | alto | medio | riesgo | riesgo_pct | late_pct | ret_h | costo_late | prio |
+----------+---------------+-----------+--------+------+------+-------+--------+------------+----------+-------+------------+------+
| Two Day  | CDMX-MTY      | Carrier_A |     56 |    7 |    1 |    18 |     26 |      46.43 |    14.29 |  3.08 |        685 | P1   |
| Two Day  | GDL-MTY       | Carrier_A |     51 |   11 |    2 |    12 |     25 |      49.02 |    25.49 |  6.14 |       1107 | P1   |
| Two Day  | GDL-OCCIDENTE | Carrier_B |     59 |    7 |    1 |    17 |     25 |      42.37 |    13.56 |  3.84 |        643 | P1   |
| Next Day | QRO-CDMX      | Carrier_A |     43 |    5 |    0 |    19 |     24 |      55.81 |    11.63 |  4.90 |        446 | P1   |
| Next Day | CDMX-MTY      | Carrier_C |     43 |   14 |    0 |     9 |     23 |      53.49 |    32.56 | 13.27 |       1071 | P1   |
| Two Day  | GDL-OCCIDENTE | Carrier_D |     40 |    9 |    4 |    10 |     23 |      57.50 |    32.50 |  6.33 |       1017 | P1   |
| Next Day | MTY-CDMX      | Carrier_C |     48 |   13 |    0 |    10 |     23 |      47.92 |    27.08 | 11.17 |        999 | P1   |
| Two Day  | CDMX-MTY      | Carrier_C |     59 |   13 |    2 |     8 |     23 |      38.98 |    25.42 |  5.52 |       1108 | P1   |
| Two Day  | MTY-CDMX      | Carrier_C |     50 |    7 |    4 |    12 |     23 |      46.00 |    22.00 |  3.47 |        789 | P1   |
| Two Day  | GDL-CDMX      | Carrier_C |     60 |    8 |    3 |    12 |     23 |      38.33 |    18.33 |  3.30 |        759 | P1   |
| Two Day  | GDL-MTY       | Carrier_C |     54 |    6 |    3 |    14 |     23 |      42.59 |    16.67 |  2.88 |        665 | P1   |
| Next Day | CDMX-MTY      | Carrier_A |     47 |    6 |    0 |    17 |     23 |      48.94 |    12.77 |  4.46 |        569 | P1   |
| Two Day  | GDL-OCCIDENTE | Carrier_A |     53 |    5 |    2 |    15 |     22 |      41.51 |    13.21 |  2.42 |        653 | P1   |
| Next Day | GDL-OCCIDENTE | Carrier_B |     38 |   12 |    0 |     9 |     21 |      55.26 |    31.58 | 12.36 |       1016 | P1   |
| Two Day  | GDL-CDMX      | Carrier_A |     67 |    6 |    2 |    13 |     21 |      31.34 |    11.94 |  2.31 |        670 | P1   |
| Next Day | CDMX-MTY      | Carrier_B |     39 |    9 |    0 |    11 |     20 |      51.28 |    23.08 | 11.71 |        816 | P1   |
| Two Day  | GDL-MTY       | Carrier_B |     53 |   10 |    2 |     8 |     20 |      37.74 |    22.64 |  4.32 |        977 | P1   |
| Next Day | CDMX-GDL      | Carrier_A |     42 |    7 |    1 |    12 |     20 |      47.62 |    19.05 |  6.88 |        722 | P1   |
| Next Day | PUE-CDMX      | Carrier_A |     39 |    7 |    0 |    13 |     20 |      51.28 |    17.95 |  7.03 |        624 | P1   |
| Two Day  | GDL-CDMX      | Carrier_B |     62 |    9 |    2 |     9 |     20 |      32.26 |    17.74 |  3.83 |        903 | P1   |
+----------+---------------+-----------+--------+------+------+-------+--------+------------+----------+-------+------------+------+

La query agrupa el riesgo por combinación de promesa, carril y carrier. En lugar de mostrar paquetes individuales, resume cuántos envíos del segmento caen en riesgo crítico, alto o medio, y calcula riesgo total, tasa de riesgo, late rate, retraso promedio, costo visible asociado a envíos tardíos y prioridad para torre de control.

Principales segmentos observados:

- Two Day / CDMX-MTY / Carrier_A:

  56 envíos, 26 en riesgo, 46.43% de riesgo, 14.29% late rate, prioridad P1.

- Two Day / GDL-MTY / Carrier_A:

  51 envíos, 25 en riesgo, 49.02% de riesgo, 25.49% late rate, prioridad P1.

- Next Day / CDMX-MTY / Carrier_C:

  43 envíos, 23 en riesgo, 53.49% de riesgo, 32.56% late rate, retraso promedio de 13.27 horas, prioridad P1.

- Next Day / MTY-CDMX / Carrier_C:

  48 envíos, 23 en riesgo, 47.92% de riesgo, 27.08% late rate, retraso promedio de 11.17 horas, prioridad P1.

Interpretación:

En la base mock, el riesgo operativo no se concentra únicamente en promesas Next Day. También aparecen segmentos Two Day con alta concentración de riesgo. Esto demuestra que la priorización no debe hacerse solo por tipo de promesa, sino por combinaciones específicas de promesa, carril y carrier.

La query permite convertir eventos individuales en segmentos accionables para una torre de control. El objetivo no es revisar paquete por paquete, sino identificar dónde se acumula el riesgo y qué combinaciones deben entrar primero al war room operativo.

Implicación operativa:

Con datos reales, priorizaría los segmentos P1 para revisar capacidad, frecuencia, desempeño de carrier, reglas de promesa y exposición por carril. En particular, segmentos como Next Day / CDMX-MTY / Carrier_C o Two Day / GDL-MTY / Carrier_A deberían revisarse porque combinan alto riesgo, late rate relevante y suficiente volumen para justificar intervención.

Nota metodológica:

La prioridad P1 no significa que el segmento sea necesariamente la causa raíz final. Significa que, por concentración de riesgo, debe entrar primero al análisis de torre de control. La causa raíz tendría que validarse cruzando timestamps por etapa, capacidad, cutoffs, frecuencia de salidas, desempeño del carrier y contexto operativo.

-----------------------------------------------------------------------------------------------------------------------------

Query 6 — Cost-to-serve estimado por segmento

Resultado obtenido en base mock:

+---------------+----------+-----------+--------+------+----------+-----------+------+----------+------+-------------+-------+-----------+
| carril        | promesa  | carrier   | envios | late | late_pct | costo_pkg | cx   | reclamos | comp | costo_total | cts   | extra_cts |
+---------------+----------+-----------+--------+------+----------+-----------+------+----------+------+-------------+-------+-----------+
| GDL-MTY       | Standard | Carrier_A |     67 |   13 |    19.40 |     81.49 |   10 |        4 |  450 |        6260 | 93.43 |     11.94 |
| GDL-OCCIDENTE | Standard | Carrier_B |     71 |   16 |    22.54 |     78.55 |    7 |        4 |  450 |        6252 | 88.06 |      9.51 |
| MTY-CDMX      | Two Day  | Carrier_B |     72 |    8 |    11.11 |     81.95 |    7 |        3 |  225 |        6175 | 85.77 |      3.82 |
| GDL-MTY       | Standard | Carrier_B |     75 |    7 |     9.33 |     77.90 |    5 |        2 |  200 |        6143 | 81.90 |      4.00 |
| MTY-CDMX      | Standard | Carrier_A |     70 |    3 |     4.29 |     81.59 |    7 |        2 |  150 |        5986 | 85.51 |      3.93 |
| GDL-CDMX      | Two Day  | Carrier_A |     67 |    8 |    11.94 |     84.95 |    5 |        3 |  250 |        5942 | 88.68 |      3.73 |
| PUE-CDMX      | Standard | Carrier_B |     74 |    7 |     9.46 |     78.01 |    6 |        0 |    0 |        5848 | 79.02 |      1.01 |
| QRO-CDMX      | Two Day  | Carrier_A |     67 |    7 |    10.45 |     84.48 |    5 |        0 |    0 |        5735 | 85.60 |      1.12 |
| QRO-CDMX      | Standard | Carrier_A |     68 |    5 |     7.35 |     82.57 |    3 |        2 |  200 |        5640 | 82.94 |      0.37 |
| GDL-CDMX      | Standard | Carrier_C |     73 |   11 |    15.07 |     66.74 |    7 |        7 |  800 |        5622 | 77.02 |     10.27 |
| GDL-OCCIDENTE | Two Day  | Carrier_B |     59 |    8 |    13.56 |     82.55 |    6 |        6 |  600 |        5596 | 94.84 |     12.29 |
| CDMX-MTY      | Standard | Carrier_B |     68 |    6 |     8.82 |     77.20 |    7 |        1 |  100 |        5450 | 80.14 |      2.94 |
| GDL-CDMX      | Standard | Carrier_B |     65 |    8 |    12.31 |     78.59 |    6 |        3 |  175 |        5409 | 83.21 |      4.62 |
| PUE-CDMX      | Standard | Carrier_A |     65 |    3 |     4.62 |     82.23 |    3 |        0 |    0 |        5345 | 82.23 |      0.00 |
| CDMX-GDL      | Standard | Carrier_A |     66 |    6 |     9.09 |     80.84 |    2 |        1 |  150 |        5335 | 80.84 |      0.00 |
| GDL-CDMX      | Standard | Carrier_A |     63 |    7 |    11.11 |     82.34 |    4 |        0 |    0 |        5237 | 83.13 |      0.79 |
| CDMX-BAJIO    | Standard | Carrier_C |     70 |   11 |    15.71 |     68.26 |   10 |        4 |  350 |        5153 | 73.62 |      5.36 |
| CDMX-BAJIO    | Standard | Carrier_B |     61 |    4 |     6.56 |     79.42 |    5 |        2 |  300 |        5095 | 83.52 |      4.10 |
| GDL-CDMX      | Two Day  | Carrier_B |     62 |   11 |    17.74 |     81.23 |    1 |        2 |  225 |        5061 | 81.63 |      0.40 |
| PUE-CDMX      | Next Day | Carrier_B |     52 |   10 |    19.23 |     86.94 |    7 |        4 |  325 |        5046 | 97.04 |     10.10 |
+---------------+----------+-----------+--------+------+----------+-----------+------+----------+------+-------------+-------+-----------+

La query estima el costo real de servir cada segmento combinando costo logístico del paquete, contactos a CX, reclamos y compensaciones. El resultado se agrupa por carril, promesa y carrier, y se ordena por costo total estimado.

Principales segmentos observados:

- GDL-MTY / Standard / Carrier_A:

  67 envíos, 19.40% late rate, costo total estimado de 6,260, cost-to-serve promedio de 93.43 y extra cost-to-serve de 11.94.

- GDL-OCCIDENTE / Standard / Carrier_B:

  71 envíos, 22.54% late rate, costo total estimado de 6,252, cost-to-serve promedio de 88.06 y extra cost-to-serve de 9.51.

- GDL-CDMX / Standard / Carrier_C:

  73 envíos, 15.07% late rate, costo promedio por paquete de 66.74, 7 reclamos, 800 en compensaciones, cost-to-serve promedio de 77.02 y extra cost-to-serve de 10.27.

- PUE-CDMX / Next Day / Carrier_B:

  52 envíos, 19.23% late rate, cost-to-serve promedio de 97.04 y extra cost-to-serve de 10.10.

Interpretación:

En la base mock, el costo real de servir un segmento no depende únicamente del costo visible por paquete. Algunos segmentos acumulan mayor costo total porque combinan late rate relevante, contactos a CX, reclamos y compensaciones.

La query ayuda a evidenciar el riesgo de una falsa economía: un carrier o carril puede parecer eficiente por tener bajo costo promedio de paquete, pero generar mayor costo real cuando se incorporan fricciones de experiencia de cliente. El caso de GDL-CDMX / Standard / Carrier_C ilustra esta lógica: aunque su costo promedio por paquete es relativamente bajo, acumula reclamos, compensaciones y un extra cost-to-serve relevante.

Implicación operativa:

Con datos reales, no evaluaría decisiones de carrier, carril o promesa únicamente por costo por paquete. Cruzaría costo visible, late rate, reclamos, contactos CX, compensaciones y recurrencia operativa para estimar el costo real de servir cada segmento. La prioridad debería enfocarse en segmentos donde reducir tardías también reduzca costo oculto y mejore experiencia de cliente.

Nota metodológica:

Los montos asignados a contactos CX y reclamos son supuestos ilustrativos para demostrar la lógica de cost-to-serve. En una operación real, estos valores deberían validarse con Finanzas y CX.

-----------------------------------------------------------------------------------------------------------------------------

Query 7 — Score de oportunidad por segmento operativo

Resultado obtenido en base mock:

+----------------+------------------+---------------+-------------+------+----------+------+------+------+--------+------+
| seg_id         | tipo             | segmento      | owner       | vol  | late_pct | cx   | ctrl | esf  | score  | prio |
+----------------+------------------+---------------+-------------+------+----------+------+------+------+--------+------+
| SEG_CARRIER_01 | Carrier          | Carrier_A     | Last Mile   | 1422 |    13.08 | 2.44 | 4.00 | 2.00 | 907.67 | P1   |
| SEG_FC_01      | Nodo Fulfillment | FC_CDMX_01    | Fulfillment |  986 |    14.81 | 2.77 | 4.00 | 2.00 | 808.99 | P1   |
| SEG_FC_03      | Nodo Fulfillment | FC_MTY_01     | Fulfillment | 1005 |    18.71 | 3.12 | 4.00 | 3.00 | 782.23 | P1   |
| SEG_FC_05      | Nodo Fulfillment | FC_QRO_01     | Fulfillment | 1023 |    12.61 | 3.00 | 4.00 | 2.00 | 774.00 | P1   |
| SEG_FC_04      | Nodo Fulfillment | FC_PUE_01     | Fulfillment | 1001 |    13.59 | 2.63 | 4.00 | 2.00 | 715.55 | P2   |
| SEG_FC_02      | Nodo Fulfillment | FC_GDL_01     | Fulfillment |  985 |    17.56 | 2.68 | 4.00 | 3.00 | 618.07 | P2   |
| SEG_CARRIER_02 | Carrier          | Carrier_B     | Last Mile   | 1478 |    13.87 | 2.79 | 3.00 | 3.00 | 571.95 | P2   |
| SEG_CARRIER_04 | Carrier          | Carrier_D     | Last Mile   |  793 |    17.02 | 3.03 | 3.00 | 3.00 | 408.95 | MON  |
| SEG_CARRIER_03 | Carrier          | Carrier_C     | Last Mile   | 1307 |    18.82 | 3.23 | 2.00 | 4.00 | 397.25 | MON  |
| SEG_CARRIL_08  | Carril           | PUE-CDMX      | Middle Mile |  552 |    13.77 | 2.56 | 4.00 | 2.00 | 389.17 | MON  |
| SEG_CARRIL_09  | Carril           | QRO-CDMX      | Middle Mile |  546 |    12.45 | 2.47 | 4.00 | 2.00 | 335.81 | MON  |
| SEG_CARRIL_04  | Carril           | GDL-CDMX      | Middle Mile |  585 |    15.04 | 2.91 | 3.00 | 3.00 | 256.03 | MON  |
| SEG_CARRIL_02  | Carril           | CDMX-GDL      | Middle Mile |  567 |    15.34 | 2.69 | 3.00 | 3.00 | 233.97 | MON  |
| SEG_CARRIL_06  | Carril           | GDL-OCCIDENTE | Middle Mile |  555 |    19.82 | 3.63 | 2.00 | 4.00 | 199.65 | MON  |
| SEG_CARRIL_07  | Carril           | MTY-CDMX      | Middle Mile |  542 |    12.73 | 2.88 | 3.00 | 3.00 | 198.71 | MON  |
+----------------+------------------+---------------+-------------+------+----------+------+------+------+--------+------+

La query calcula un score de oportunidad por segmento operativo utilizando la fórmula:

score = volumen × late rate × impacto CX × controlabilidad / esfuerzo

P1  = Prioridad 1 / atacar primero

P2  = Prioridad 2 / revisar después o monitorear activamente

MON = Monitorear / no atacar en la fase inicial

Principales segmentos observados:

- Carrier_A:

  1,422 envíos, 13.08% late rate, controlabilidad 4.00, esfuerzo 2.00, score 907.67, prioridad P1.

- FC_CDMX_01:

  986 envíos, 14.81% late rate, controlabilidad 4.00, esfuerzo 2.00, score 808.99, prioridad P1.

- FC_MTY_01:

  1,005 envíos, 18.71% late rate, controlabilidad 4.00, esfuerzo 3.00, score 782.23, prioridad P1.

- FC_QRO_01:

  1,023 envíos, 12.61% late rate, controlabilidad 4.00, esfuerzo 2.00, score 774.00, prioridad P1.

Interpretación:

En la base mock, las mayores oportunidades de intervención no son necesariamente los segmentos con mayor late rate, sino aquellos que combinan volumen, impacto en CX, controlabilidad y menor esfuerzo relativo.

Carrier_A aparece como la mayor oportunidad por su alto volumen, alta controlabilidad y bajo esfuerzo, aun cuando su late rate no es el más alto. FC_MTY_01 confirma lo observado en Query 2: no solo presenta alto late rate y volumen relevante, sino que también es suficientemente controlable para justificar intervención temprana.

Por otro lado, segmentos como GDL-OCCIDENTE o Carrier_C muestran late rates altos, pero quedan como monitoreo debido a menor controlabilidad y mayor esfuerzo. Esto demuestra que la priorización debe distinguir entre fricciones de acción inmediata y fricciones que requieren escalamiento o proyecto transversal.

Implicación operativa:

Con datos reales, usaría este score como punto de partida para construir la cola semanal de intervención de la torre de control. Los segmentos P1 entrarían al roadmap 0–30 días; los P2 serían monitoreados y trabajados en ciclos posteriores; y los segmentos con alto impacto pero baja controlabilidad se gestionarían como proyectos transversales o escalamiento con otras áreas.

Nota metodológica:

El score no reemplaza el juicio operativo. Su valor es ordenar la conversación y enfocar al equipo en los segmentos donde hay mayor combinación de impacto, factibilidad y retorno por esfuerzo.

-----------------------------------------------------------------------------------------------------------------------------

Query 8 — Ownership y escalamiento por segmento prioritario

Resultado obtenido en base mock:

+----------------+------------------+---------------+-------------+-------------------------+---------------------+------+----------+------+------+--------+--------+
| seg_id         | tipo             | segmento      | area        | accountable             | escala              | vol  | late_pct | ctrl | esf  | score  | prio   |
+----------------+------------------+---------------+-------------+-------------------------+---------------------+------+----------+------+------+--------+--------+
| SEG_CARRIER_01 | Carrier          | Carrier_A     | Last Mile   | Operaciones Last Mile   | Manager Last Mile   | 1422 |    13.08 | 4.00 | 2.00 | 907.67 | P1     |
| SEG_FC_01      | Nodo Fulfillment | FC_CDMX_01    | Fulfillment | Operaciones Fulfillment | Manager Fulfillment |  986 |    14.81 | 4.00 | 2.00 | 808.99 | P1     |
| SEG_FC_03      | Nodo Fulfillment | FC_MTY_01     | Fulfillment | Operaciones Fulfillment | Manager Fulfillment | 1005 |    18.71 | 4.00 | 3.00 | 782.23 | P1     |
| SEG_FC_05      | Nodo Fulfillment | FC_QRO_01     | Fulfillment | Operaciones Fulfillment | Manager Fulfillment | 1023 |    12.61 | 4.00 | 2.00 | 774.00 | P1     |
| SEG_FC_04      | Nodo Fulfillment | FC_PUE_01     | Fulfillment | Operaciones Fulfillment | Manager Fulfillment | 1001 |    13.59 | 4.00 | 2.00 | 715.55 | P2     |
| SEG_FC_02      | Nodo Fulfillment | FC_GDL_01     | Fulfillment | Operaciones Fulfillment | Manager Fulfillment |  985 |    17.56 | 4.00 | 3.00 | 618.07 | P2     |
| SEG_CARRIER_02 | Carrier          | Carrier_B     | Last Mile   | Operaciones Last Mile   | Manager Last Mile   | 1478 |    13.87 | 3.00 | 3.00 | 571.95 | P2     |
| SEG_CARRIER_04 | Carrier          | Carrier_D     | Last Mile   | Operaciones Last Mile   | Manager Last Mile   |  793 |    17.02 | 3.00 | 3.00 | 408.95 | P3_MON |
| SEG_CARRIER_03 | Carrier          | Carrier_C     | Last Mile   | Operaciones Last Mile   | Manager Last Mile   | 1307 |    18.82 | 2.00 | 4.00 | 397.25 | P3_MON |
| SEG_CARRIL_08  | Carril           | PUE-CDMX      | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  552 |    13.77 | 4.00 | 2.00 | 389.17 | P3_MON |
| SEG_CARRIL_09  | Carril           | QRO-CDMX      | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  546 |    12.45 | 4.00 | 2.00 | 335.81 | P3_MON |
| SEG_CARRIL_04  | Carril           | GDL-CDMX      | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  585 |    15.04 | 3.00 | 3.00 | 256.03 | P3_MON |
| SEG_CARRIL_02  | Carril           | CDMX-GDL      | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  567 |    15.34 | 3.00 | 3.00 | 233.97 | P3_MON |
| SEG_CARRIL_06  | Carril           | GDL-OCCIDENTE | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  555 |    19.82 | 2.00 | 4.00 | 199.65 | P3_MON |
| SEG_CARRIL_07  | Carril           | MTY-CDMX      | Middle Mile | Operaciones Middle Mile | Manager Transporte  |  542 |    12.73 | 3.00 | 3.00 | 198.71 | P3_MON |
+----------------+------------------+---------------+-------------+-------------------------+---------------------+------+----------+------+------+--------+--------+

La query cruza los segmentos priorizados con la tabla de responsables para asignar área responsable, equipo accountable y nivel de escalamiento.

Principales segmentos P1:

- Carrier_A:

  Área responsable: Last Mile.

  Accountable: Operaciones Last Mile.

  Escalamiento: Manager Last Mile.

  Score: 907.67.

- FC_CDMX_01:

  Área responsable: Fulfillment.

  Accountable: Operaciones Fulfillment.

  Escalamiento: Manager Fulfillment.

  Score: 808.99.

- FC_MTY_01:

  Área responsable: Fulfillment.

  Accountable: Operaciones Fulfillment.

  Escalamiento: Manager Fulfillment.

  Score: 782.23.

- FC_QRO_01:

  Área responsable: Fulfillment.

  Accountable: Operaciones Fulfillment.

  Escalamiento: Manager Fulfillment.

  Score: 774.00.

Interpretación:

En la base mock, los segmentos P1 se concentran principalmente en Last Mile y Fulfillment. Esto sugiere que los primeros ciclos de intervención deberían enfocarse en carriers y nodos fulfillment con alto score de oportunidad.

La query también muestra que algunos carriles de Middle Mile tienen late rates relevantes, pero quedan como P3_MON por menor controlabilidad o mayor esfuerzo operativo. Esto refuerza la idea de que no todo problema con alto late rate debe atacarse primero; algunos requieren monitoreo, escalamiento o proyectos transversales.

Implicación operativa:

Con datos reales, cada alerta o segmento prioritario debería tener un owner claro, un SLA de respuesta y una ruta de escalamiento. Esto evita que la torre de control se convierta solo en un dashboard sin acción.

Nota metodológica:

La asignación de ownership en la base mock es ilustrativa. En una operación real, los responsables deberían definirse con base en estructura organizacional, procesos reales y capacidad de decisión de cada equipo.

-----------------------------------------------------------------------------------------------------------------------------

Query 9 — Detección de falsa economía y riesgo crítico de servicio

Resultado obtenido en base mock:

+---------------+----------+-----------+--------+-----------+----------+------+----------+------+-----------+----------------+
| carril        | promesa  | carrier   | envios | costo_pkg | late_pct | cx   | reclamos | comp | extra_cts | lectura        |
+---------------+----------+-----------+--------+-----------+----------+------+----------+------+-----------+----------------+
| GDL-OCCIDENTE | Next Day | Carrier_C |     34 |     75.95 |    41.18 |    7 |        3 |  200 |     10.29 | RIESGO_CRITICO |
| GDL-OCCIDENTE | Two Day  | Carrier_D |     40 |     78.04 |    32.50 |    8 |        3 |  275 |     15.00 | RIESGO_CRITICO |
| GDL-OCCIDENTE | Next Day | Carrier_B |     38 |     84.02 |    31.58 |    7 |        3 |  250 |     11.84 | RIESGO_CRITICO |
| CDMX-GDL      | Two Day  | Carrier_D |     35 |     78.82 |    31.43 |    6 |        2 |  200 |     12.14 | RIESGO_CRITICO |
| CDMX-MTY      | Two Day  | Carrier_C |     59 |     71.34 |    25.42 |    7 |        4 |  400 |     12.71 | FALSA_ECO      |
| GDL-MTY       | Standard | Carrier_C |     53 |     68.52 |    24.53 |    7 |        2 |  150 |      4.25 | FALSA_ECO      |
| GDL-OCCIDENTE | Two Day  | Carrier_C |     50 |     71.99 |    22.00 |    6 |        5 |  550 |     13.50 | FALSA_ECO      |
| MTY-CDMX      | Two Day  | Carrier_C |     50 |     71.60 |    22.00 |    6 |        2 |  225 |      6.00 | FALSA_ECO      |
| CDMX-GDL      | Standard | Carrier_C |     61 |     67.85 |    19.67 |    6 |        3 |  225 |      3.69 | FALSA_ECO      |
| GDL-CDMX      | Two Day  | Carrier_C |     60 |     70.90 |    18.33 |   11 |        3 |  325 |      7.50 | FALSA_ECO      |
| PUE-CDMX      | Two Day  | Carrier_C |     50 |     73.10 |    18.00 |    8 |        1 |   75 |      4.50 | FALSA_ECO      |
| QRO-CDMX      | Standard | Carrier_C |     59 |     67.65 |    16.95 |    5 |        1 |  100 |      1.27 | FALSA_ECO      |
| GDL-MTY       | Two Day  | Carrier_C |     54 |     72.35 |    16.67 |    6 |        3 |  225 |      4.17 | FALSA_ECO      |
| CDMX-MTY      | Standard | Carrier_D |     37 |     73.60 |    16.22 |    2 |        4 |  375 |     16.22 | FALSA_ECO      |
| MTY-CDMX      | Standard | Carrier_C |     56 |     68.65 |    16.07 |    4 |        2 |  125 |      3.13 | FALSA_ECO      |
| CDMX-BAJIO    | Standard | Carrier_C |     70 |     68.26 |    15.71 |   10 |        4 |  350 |      5.36 | FALSA_ECO      |
| GDL-CDMX      | Standard | Carrier_C |     73 |     66.74 |    15.07 |    7 |        7 |  800 |     10.27 | FALSA_ECO      |
| CDMX-MTY      | Standard | Carrier_C |     68 |     67.57 |    14.71 |    6 |        2 |  150 |      5.15 | FALSA_ECO      |
| GDL-OCCIDENTE | Standard | Carrier_C |     47 |     68.18 |    10.64 |    4 |        3 |  225 |      5.85 | FALSA_ECO      |
| CDMX-MTY      | Next Day | Carrier_C |     43 |     76.78 |    32.56 |    8 |        1 |   50 |      5.23 | RIESGO_SERV    |
+---------------+----------+-----------+--------+-----------+----------+------+----------+------+-----------+----------------+

RIESGO_CRITICO = late rate muy alto + extra cost-to-serve alto
FALSA_ECO      = costo visible bajo + señales de mal desempeño o costo oculto
RIESGO_SERV    = late rate alto, aunque el costo visible no sea bajo

La query clasifica segmentos por carril, promesa y carrier para identificar tres tipos de señales: riesgo crítico de servicio, falsa economía y riesgo de servicio.

La clasificación utilizada fue:

- RIESGO_CRITICO: segmentos con late rate igual o superior a 30% y extra cost-to-serve igual o superior a 10.

- FALSA_ECO: segmentos con costo visible bajo, pero con late rate o extra cost-to-serve preocupante.

- RIESGO_SERV: segmentos con late rate alto que no necesariamente cumplen con la lógica de falsa economía o riesgo crítico.

Principales segmentos observados:

- GDL-OCCIDENTE / Next Day / Carrier_C:

  34 envíos, costo promedio por paquete de 75.95, late rate de 41.18%, 7 contactos CX, 3 reclamos, 200 en compensaciones y extra cost-to-serve de 10.29. Lectura: RIESGO_CRITICO.

- GDL-OCCIDENTE / Two Day / Carrier_D:

  40 envíos, costo promedio por paquete de 78.04, late rate de 32.50%, 8 contactos CX, 3 reclamos, 275 en compensaciones y extra cost-to-serve de 15.00. Lectura: RIESGO_CRITICO.

- GDL-OCCIDENTE / Next Day / Carrier_B:

  38 envíos, costo promedio por paquete de 84.02, late rate de 31.58%, 7 contactos CX, 3 reclamos, 250 en compensaciones y extra cost-to-serve de 11.84. Lectura: RIESGO_CRITICO.

- CDMX-MTY / Two Day / Carrier_C:

  59 envíos, costo promedio por paquete de 71.34, late rate de 25.42%, 7 contactos CX, 4 reclamos, 400 en compensaciones y extra cost-to-serve de 12.71. Lectura: FALSA_ECO.

- GDL-CDMX / Standard / Carrier_C:

  73 envíos, costo promedio por paquete de 66.74, late rate de 15.07%, 7 contactos CX, 7 reclamos, 800 en compensaciones y extra cost-to-serve de 10.27. Lectura: FALSA_ECO.

Interpretación:

La query separa dos fenómenos distintos. El primero es riesgo crítico de servicio: segmentos con late rate muy alto y costo oculto elevado, aunque no necesariamente tengan un costo por paquete bajo. El segundo es falsa economía: segmentos con costo visible bajo, pero con deterioro operativo, reclamos, contactos CX, compensaciones o extra cost-to-serve relevante.

En la base mock, GDL-OCCIDENTE aparece repetidamente dentro de los segmentos de riesgo crítico, lo que sugiere una posible fricción estructural del carril. Por otro lado, Carrier_C aparece repetidamente en segmentos de falsa economía, lo que sugiere que su menor costo visible puede estar acompañado de mayor deterioro operativo y costo oculto.

Implicación operativa:

Con datos reales, no tomaría decisiones de carrier o asignación de volumen únicamente con base en costo por paquete. Separaría los casos de riesgo crítico, que requieren intervención operativa inmediata, de los casos de falsa economía, que requieren revisar reglas de asignación, SLAs, penalizaciones, capacidad y desempeño por carril.

Nota metodológica:

Los umbrales utilizados son ilustrativos. En una operación real, deberían calibrarse con datos financieros, costos reales de CX, acuerdos de servicio, volumen mínimo estadístico y benchmarks internos.

-----------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------

Query 10 — Cola priorizada para torre de control

Resultado obtenido en base mock:

+--------+----------------+------------------+------------+-------------+-------------------------+------+----------+--------+-------------------------+
| prio   | seg_id         | tipo             | segmento   | area        | owner                   | vol  | late_pct | score  | accion                  |
+--------+----------------+------------------+------------+-------------+-------------------------+------+----------+--------+-------------------------+
| P1     | SEG_CARRIER_01 | Carrier          | Carrier_A  | Last Mile   | Operaciones Last Mile   | 1422 |    13.08 | 907.67 | Revisar SLA/capacidad   |
| P1     | SEG_FC_01      | Nodo Fulfillment | FC_CDMX_01 | Fulfillment | Operaciones Fulfillment |  986 |    14.81 | 808.99 | Revisar backlog/cutoffs |
| P1     | SEG_FC_03      | Nodo Fulfillment | FC_MTY_01  | Fulfillment | Operaciones Fulfillment | 1005 |    18.71 | 782.23 | Revisar backlog/cutoffs |
| P1     | SEG_FC_05      | Nodo Fulfillment | FC_QRO_01  | Fulfillment | Operaciones Fulfillment | 1023 |    12.61 | 774.00 | Revisar backlog/cutoffs |
| P2     | SEG_FC_04      | Nodo Fulfillment | FC_PUE_01  | Fulfillment | Operaciones Fulfillment | 1001 |    13.59 | 715.55 | Revisar backlog/cutoffs |
| P2     | SEG_FC_02      | Nodo Fulfillment | FC_GDL_01  | Fulfillment | Operaciones Fulfillment |  985 |    17.56 | 618.07 | Revisar backlog/cutoffs |
| P2     | SEG_CARRIER_02 | Carrier          | Carrier_B  | Last Mile   | Operaciones Last Mile   | 1478 |    13.87 | 571.95 | Revisar SLA/capacidad   |
| P3_MON | SEG_CARRIER_04 | Carrier          | Carrier_D  | Last Mile   | Operaciones Last Mile   |  793 |    17.02 | 408.95 | Revisar SLA/capacidad   |
| P3_MON | SEG_CARRIER_03 | Carrier          | Carrier_C  | Last Mile   | Operaciones Last Mile   | 1307 |    18.82 | 397.25 | Revisar SLA/capacidad   |
| P3_MON | SEG_CARRIL_08  | Carril           | PUE-CDMX   | Middle Mile | Operaciones Middle Mile |  552 |    13.77 | 389.17 | Revisar frecuencia/ruta |
| P3_MON | SEG_CARRIL_09  | Carril           | QRO-CDMX   | Middle Mile | Operaciones Middle Mile |  546 |    12.45 | 335.81 | Revisar frecuencia/ruta |
| P3_MON | SEG_CARRIL_04  | Carril           | GDL-CDMX   | Middle Mile | Operaciones Middle Mile |  585 |    15.04 | 256.03 | Revisar frecuencia/ruta |
+--------+----------------+------------------+------------+-------------+-------------------------+------+----------+--------+-------------------------+

La query construye una cola operativa de intervención para la torre de control. Combina prioridad, segmento, área responsable, owner, volumen, late rate, score de oportunidad y acción inicial sugerida.

Principales segmentos P1:

- Carrier_A:
  Prioridad P1, área Last Mile, owner Operaciones Last Mile, 1,422 envíos, 13.08% late rate, score 907.67. Acción sugerida: revisar SLA/capacidad.

- FC_CDMX_01:
  Prioridad P1, área Fulfillment, owner Operaciones Fulfillment, 986 envíos, 14.81% late rate, score 808.99. Acción sugerida: revisar backlog/cutoffs.

- FC_MTY_01:
  Prioridad P1, área Fulfillment, owner Operaciones Fulfillment, 1,005 envíos, 18.71% late rate, score 782.23. Acción sugerida: revisar backlog/cutoffs.

- FC_QRO_01:
  Prioridad P1, área Fulfillment, owner Operaciones Fulfillment, 1,023 envíos, 12.61% late rate, score 774.00. Acción sugerida: revisar backlog/cutoffs.

Interpretación:

La Query 10 convierte el análisis en una cola de trabajo para la torre de control. La salida no solo identifica segmentos problemáticos, sino que define prioridad, ownership y acción inicial.

En la base mock, los primeros segmentos a revisar se concentran en Last Mile y Fulfillment. Esto sugiere que el primer ciclo de intervención debería enfocarse en revisar SLA/capacidad de carriers y backlog/cutoffs en nodos fulfillment.

Es importante aclarar que los segmentos P3_MON no se ignoran. Algunos, como Carrier_C, aparecen con señales de falsa economía en Query 9, pero en la cola operativa tienen menor prioridad inmediata por menor controlabilidad o mayor esfuerzo. Esto demuestra que la priorización distingue entre problemas urgentes, oportunidades accionables y riesgos que requieren monitoreo o escalamiento.

Implicación operativa:

Con datos reales, esta cola debería actualizarse diariamente o semanalmente dentro de la torre de control. Cada segmento prioritario debería tener un owner, una hipótesis de causa raíz, una acción inicial, un SLA de respuesta y seguimiento de impacto.

Nota metodológica:

La acción sugerida es inicial e ilustrativa. En operación real debería enriquecerse con datos de capacidad, cutoffs, backlog, frecuencia de salidas, desempeño de carrier, aging por nodo y restricciones de red.