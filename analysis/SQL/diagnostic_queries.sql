/**********************************************************************************************
Logistics Control Tower — Promise & Speed Management
Archivo: diagnostic_queries.sql

 Autor:
 Rafael Ortega

 Objetivo:
 Este archivo muestra la lógica SQL que aplicaría para diagnosticar problemas de promesa
 y velocidad de entrega usando datos operativos a nivel envío/paquete.

 Nota importante:
 El caso proporciona gráficas agregadas, pero no una base transaccional real.
 Por lo tanto, las tablas y campos utilizados en estas queries son conceptuales/ilustrativos.
 El objetivo no es afirmar causalidad definitiva, sino demostrar cómo estructuraría el
 diagnóstico con datos shipment-level reales.

 Tablas conceptuales utilizadas:
 - envios
 - eventos_envio
 - segmentos
 - responsables

  Nota de sintaxis:

 La función TIMESTAMPDIFF se usa como referencia conceptual. En un entorno real,
 adaptaría la sintaxis al motor SQL utilizado por ejemplo BigQuery,
 PostgreSQL o Snowflake.

 Principio analítico:
 Pasar de reportar entregas tardías después de que ocurren a detectar fricciones antes
 de que impacten al cliente.

 Lógica de torre de control:
 Detectar → Priorizar → Asignar dueño → Actuar → Monitorear
**********************************************************************************************/

USE control_tower_worksample_mock;

/**********************************************************************************************
 QUERY 1 — Late rate por tipo de promesa

 Propósito:
 Entender si las promesas rápidas, como next day o two day, presentan un deterioro
 superior al resto de promesas.

 Pregunta de negocio:
 ¿El problema está concentrado en promesas rápidas o el deterioro es generalizado?
**********************************************************************************************/

SELECT
    tipo_promesa,
    COUNT(*) AS total_envios,
    SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) AS envios_tardios,
    ROUND(
        100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS late_rate_pct,
    ROUND(AVG(horas_retraso), 2) AS retraso_promedio_horas
FROM envios
GROUP BY
    tipo_promesa
ORDER BY
    late_rate_pct DESC;


/**********************************************************************************************
 QUERY 2 — Ranking de nodos con mayor impacto en entregas tardías

 Propósito:
 Identificar los nodos que más contribuyen al total de entregas tardías.

 Pregunta de negocio:
 ¿Qué puntos de la red concentran el mayor volumen de incumplimiento?

 Uso en el caso:
 Alimenta la priorización de fricciones operativas y el roadmap 0–30 días.
**********************************************************************************************/

SELECT
    centro_fulfillment AS nodo,
    COUNT(*) AS total_envios,
    SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) AS envios_tardios,
    ROUND(
        100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS late_rate_pct,
    ROUND(AVG(horas_retraso), 2) AS retraso_promedio_horas
FROM envios
GROUP BY
    centro_fulfillment
HAVING
    COUNT(*) >= 100
ORDER BY
    envios_tardios DESC,
    late_rate_pct DESC;


/**********************************************************************************************
 QUERY 3 — Late rate por carril origen-destino

 Propósito:
 Detectar carriles con alto volumen y alto nivel de incumplimiento.

 Pregunta de negocio:
 ¿Qué carriles origen-destino están rompiendo más promesa?

 Uso en el caso:
 Alimenta la matriz de priorización y permite distinguir problemas estructurales de red.
**********************************************************************************************/

SELECT
    carril,
    COUNT(*) AS total_envios,
    SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) AS envios_tardios,
    ROUND(
        100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS late_rate_pct,
    ROUND(AVG(horas_retraso), 2) AS retraso_promedio_horas,
    ROUND(AVG(costo_paquete), 2) AS costo_promedio_paquete
FROM envios
GROUP BY
    carril
HAVING
    COUNT(*) >= 100
ORDER BY
    envios_tardios DESC,
    late_rate_pct DESC;


/**********************************************************************************************
 QUERY 4 — Tiempo promedio por etapa del flujo operativo

 Propósito:
 Medir en qué etapas se acumula más tiempo cuando un envío termina siendo tardío.

 Pregunta de negocio:
 ¿Dónde pierde más tiempo el envío: fulfillment, sortation, middle mile o last mile?

 Nota:
 Se utiliza GREATEST(..., 0) para evitar tiempos negativos en la base mock. En datos reales,
 un timestamp negativo indicaría un problema de calidad de datos que debería investigarse.

 Definición:
 - Tiempo en fulfillment: desde pedido creado hasta ready to ship.
 - Espera despacho fulfillment: desde ready to ship hasta salida fulfillment.
 - Tiempo en sortation: desde llegada sortation hasta salida sortation.
 - Tránsito sortation a last mile: desde salida sortation hasta llegada last mile.
 - Tiempo en estación last mile: desde llegada last mile hasta out for delivery.
 - Tiempo en ruta de entrega: desde out for delivery hasta entregado.
**********************************************************************************************/

WITH eventos_pivot AS (
    SELECT
        shipment_id,
        MAX(CASE WHEN nombre_evento = 'pedido_creado' THEN timestamp_evento END) AS ts_pedido_creado,
        MAX(CASE WHEN nombre_evento = 'ready_to_ship' THEN timestamp_evento END) AS ts_ready_to_ship,
        MAX(CASE WHEN nombre_evento = 'salida_fulfillment' THEN timestamp_evento END) AS ts_salida_fulfillment,
        MAX(CASE WHEN nombre_evento = 'llegada_sortation' THEN timestamp_evento END) AS ts_llegada_sortation,
        MAX(CASE WHEN nombre_evento = 'salida_sortation' THEN timestamp_evento END) AS ts_salida_sortation,
        MAX(CASE WHEN nombre_evento = 'llegada_last_mile' THEN timestamp_evento END) AS ts_llegada_last_mile,
        MAX(CASE WHEN nombre_evento = 'out_for_delivery' THEN timestamp_evento END) AS ts_out_for_delivery,
        MAX(CASE WHEN nombre_evento = 'entregado' THEN timestamp_evento END) AS ts_entregado
    FROM eventos_envio
    GROUP BY
        shipment_id
),

tiempos_por_envio AS (
    SELECT
        e.shipment_id,
        env.tipo_promesa,
        env.carril,
        env.carrier,
        env.flag_entrega_tardia,

        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_pedido_creado, e.ts_ready_to_ship), 0) AS tiempo_fulfillment_horas,
        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_ready_to_ship, e.ts_salida_fulfillment), 0) AS espera_despacho_fulfillment_horas,
        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_llegada_sortation, e.ts_salida_sortation), 0) AS tiempo_en_sortation_horas,
        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_salida_sortation, e.ts_llegada_last_mile), 0) AS transito_sortation_a_last_mile_horas,
        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_llegada_last_mile, e.ts_out_for_delivery), 0) AS tiempo_en_estacion_last_mile_horas,
        GREATEST(TIMESTAMPDIFF(HOUR, e.ts_out_for_delivery, e.ts_entregado), 0) AS tiempo_ruta_entrega_horas

    FROM eventos_pivot e
    LEFT JOIN envios env
        ON e.shipment_id = env.shipment_id
)

SELECT
    CASE
        WHEN flag_entrega_tardia = 1 THEN 'Entrega tardía'
        ELSE 'Entrega a tiempo'
    END AS tipo_resultado,
    COUNT(*) AS total_envios,
    ROUND(AVG(tiempo_fulfillment_horas), 2) AS avg_tiempo_fulfillment,
    ROUND(AVG(espera_despacho_fulfillment_horas), 2) AS avg_espera_despacho_fulfillment,
    ROUND(AVG(tiempo_en_sortation_horas), 2) AS avg_tiempo_en_sortation,
    ROUND(AVG(transito_sortation_a_last_mile_horas), 2) AS avg_transito_sortation_a_last_mile,
    ROUND(AVG(tiempo_en_estacion_last_mile_horas), 2) AS avg_tiempo_en_estacion_last_mile,
    ROUND(AVG(tiempo_ruta_entrega_horas), 2) AS avg_tiempo_ruta_entrega
FROM tiempos_por_envio
GROUP BY
    flag_entrega_tardia
ORDER BY
    flag_entrega_tardia DESC;

/**********************************************************************************************
 QUERY 5 — Concentración de riesgo operativo por segmento

 Propósito:
 Identificar combinaciones de promesa, carril y carrier donde se concentra el mayor riesgo
 de incumplimiento.

 Pregunta de negocio:
 ¿Qué segmentos deberían entrar primero a la torre de control por riesgo operativo?

 Uso en el caso:
 Convierte paquetes individuales en segmentos accionables para priorización, ownership y monitoreo.

 Nota:
 En una operación real, esta lógica se aplicaría sobre paquetes aún no entregados para detectar
 riesgo antes de incumplir. En la base mock, se usa información histórica para ilustrar cómo se
 concentraría el riesgo por segmento.
**********************************************************************************************/

WITH envios_clasificados AS (
    SELECT
        shipment_id,
        tipo_promesa,
        carril,
        carrier,
        flag_entrega_tardia,
        horas_retraso,
        costo_paquete,

        CASE
            WHEN horas_retraso > 12
                THEN 'CRITICO'
            WHEN horas_retraso > 0
                THEN 'ALTO'
            WHEN TIMESTAMPDIFF(MINUTE, fecha_entrega_real, fecha_prometida_entrega) BETWEEN 0 AND 180
                THEN 'MEDIO'
            ELSE 'BAJO'
        END AS nivel_riesgo

    FROM envios
),

riesgo_por_segmento AS (
    SELECT
        tipo_promesa,
        carril,
        carrier,
        COUNT(*) AS envios,
        SUM(CASE WHEN nivel_riesgo = 'CRITICO' THEN 1 ELSE 0 END) AS crit,
        SUM(CASE WHEN nivel_riesgo = 'ALTO' THEN 1 ELSE 0 END) AS alto,
        SUM(CASE WHEN nivel_riesgo = 'MEDIO' THEN 1 ELSE 0 END) AS medio,
        SUM(CASE WHEN nivel_riesgo IN ('CRITICO', 'ALTO', 'MEDIO') THEN 1 ELSE 0 END) AS riesgo_total,
        ROUND(
            100.0 * SUM(CASE WHEN nivel_riesgo IN ('CRITICO', 'ALTO', 'MEDIO') THEN 1 ELSE 0 END) / COUNT(*),
            2
        ) AS riesgo_pct,
        ROUND(
            100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
            2
        ) AS late_pct,
        ROUND(AVG(horas_retraso), 2) AS ret_h,
        ROUND(
            SUM(CASE WHEN flag_entrega_tardia = 1 THEN costo_paquete ELSE 0 END),
            0
        ) AS costo_late
    FROM envios_clasificados
    GROUP BY
        tipo_promesa,
        carril,
        carrier
    HAVING
        COUNT(*) >= 30
)

SELECT
    tipo_promesa AS promesa,
    carril,
    carrier,
    envios,
    crit,
    alto,
    medio,
    riesgo_total AS riesgo,
    riesgo_pct,
    late_pct,
    ret_h,
    costo_late,
    CASE
        WHEN crit >= 5 OR late_pct >= 20
            THEN 'P1'
        WHEN riesgo_total >= 10 OR late_pct >= 15
            THEN 'P2'
        ELSE 'P3_MON'
    END AS prio

FROM riesgo_por_segmento
ORDER BY
    CASE
        WHEN crit >= 5 OR late_pct >= 20 THEN 1
        WHEN riesgo_total >= 10 OR late_pct >= 15 THEN 2
        ELSE 3
    END,
    riesgo DESC,
    late_pct DESC
LIMIT 20;

/**********************************************************************************************
 QUERY 6 — Cost-to-serve estimado por segmento

 Propósito:
 Estimar el costo real de servir segmentos con entregas tardías, incorporando costo logístico,
 contactos a CX, reclamos y compensaciones.

 Pregunta de negocio:
 ¿Qué segmentos generan mayor costo operativo y costo oculto cuando se rompe la promesa?

 Uso en el caso:
 Alimenta el análisis de falsa economía, costo-to-serve y priorización de intervenciones.
**********************************************************************************************/

SELECT
    carril,
    tipo_promesa AS promesa,
    carrier,
    COUNT(*) AS envios,
    SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) AS late,
    ROUND(
        100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS late_pct,
    ROUND(AVG(costo_paquete), 2) AS costo_pkg,
    SUM(CASE WHEN flag_contacto_cx = 1 THEN 1 ELSE 0 END) AS cx,
    SUM(CASE WHEN flag_reclamo = 1 THEN 1 ELSE 0 END) AS reclamos,
    ROUND(SUM(COALESCE(monto_compensacion, 0)), 0) AS comp,
    ROUND(
        SUM(
            CASE
                WHEN flag_entrega_tardia = 1
                THEN costo_paquete
                     + COALESCE(monto_compensacion, 0)
                     + CASE WHEN flag_contacto_cx = 1 THEN 20 ELSE 0 END
                     + CASE WHEN flag_reclamo = 1 THEN 50 ELSE 0 END
                ELSE costo_paquete
            END
        ),
        0
    ) AS costo_total,
    ROUND(
        AVG(
            CASE
                WHEN flag_entrega_tardia = 1
                THEN costo_paquete
                     + COALESCE(monto_compensacion, 0)
                     + CASE WHEN flag_contacto_cx = 1 THEN 20 ELSE 0 END
                     + CASE WHEN flag_reclamo = 1 THEN 50 ELSE 0 END
                ELSE costo_paquete
            END
        ),
        2
    ) AS cts,
    ROUND(
        AVG(
            CASE
                WHEN flag_entrega_tardia = 1
                THEN COALESCE(monto_compensacion, 0)
                     + CASE WHEN flag_contacto_cx = 1 THEN 20 ELSE 0 END
                     + CASE WHEN flag_reclamo = 1 THEN 50 ELSE 0 END
                ELSE 0
            END
        ),
        2
    ) AS extra_cts

FROM envios
GROUP BY
    carril,
    tipo_promesa,
    carrier
HAVING
    COUNT(*) >= 30
ORDER BY
    costo_total DESC,
    late_pct DESC
LIMIT 20;


/**********************************************************************************************
 QUERY 7 — Score de oportunidad por segmento operativo

 Propósito:
 Priorizar segmentos operativos combinando volumen, late rate, impacto en CX, controlabilidad
 y esfuerzo operativo.

 Pregunta de negocio:
 ¿Qué segmentos deberían atacarse primero por impacto y factibilidad?
**********************************************************************************************/

SELECT
    segment_id AS seg_id,
    tipo_segmento AS tipo,
    nodo_o_carril AS segmento,
    area_responsable AS area,
    volumen AS vol,
    ROUND(late_rate * 100, 2) AS late_pct,
    score_impacto_cx AS cx,
    score_controlabilidad AS ctrl,
    score_esfuerzo AS esf,

    ROUND(
        (volumen * late_rate * score_impacto_cx * score_controlabilidad)
        / NULLIF(score_esfuerzo, 0),
        2
    ) AS score,

    CASE
        WHEN ROUND(
            (volumen * late_rate * score_impacto_cx * score_controlabilidad)
            / NULLIF(score_esfuerzo, 0),
            2
        ) >= 750
            THEN 'P1'
        WHEN ROUND(
            (volumen * late_rate * score_impacto_cx * score_controlabilidad)
            / NULLIF(score_esfuerzo, 0),
            2
        ) >= 500
            THEN 'P2'
        ELSE 'P3_MON'
    END AS prio

FROM segmentos
ORDER BY
    score DESC
LIMIT 15;


/**********************************************************************************************
 QUERY 8 — Ownership y escalamiento por segmento prioritario

 Propósito:
 Asignar ownership y nivel de escalamiento a los segmentos con mayor oportunidad de mejora.

 Pregunta de negocio:
 ¿Quién debe tomar responsabilidad por cada fricción prioritaria?

 Uso en el caso:
 Alimenta la torre de control al conectar cada segmento con un equipo accountable,
 un nivel de escalamiento y una prioridad de intervención.
**********************************************************************************************/

WITH segmentos_score AS (
    SELECT
        s.segment_id,
        s.tipo_segmento,
        s.nodo_o_carril,
        s.area_responsable,
        s.volumen,
        s.late_rate,
        s.score_controlabilidad,
        s.score_esfuerzo,

        ROUND(
            (s.volumen * s.late_rate * s.score_impacto_cx * s.score_controlabilidad)
            / NULLIF(s.score_esfuerzo, 0),
            2
        ) AS score

    FROM segmentos s
)

SELECT
    ss.segment_id AS seg_id,
    ss.tipo_segmento AS tipo,
    ss.nodo_o_carril AS segmento,
    ss.area_responsable AS area,
    r.equipo_accountable AS accountable,
    r.nivel_escalamiento AS escala,
    ss.volumen AS vol,
    ROUND(ss.late_rate * 100, 2) AS late_pct,
    ss.score_controlabilidad AS ctrl,
    ss.score_esfuerzo AS esf,
    ss.score,

    CASE
        WHEN ss.score >= 750 THEN 'P1'
        WHEN ss.score >= 500 THEN 'P2'
        ELSE 'P3_MON'
    END AS prio

FROM segmentos_score ss
LEFT JOIN responsables r
    ON ss.area_responsable = r.area_responsable
ORDER BY
    CASE
        WHEN ss.score >= 750 THEN 1
        WHEN ss.score >= 500 THEN 2
        ELSE 3
    END,
    ss.score DESC
LIMIT 15;


/**********************************************************************************************
 QUERY 9 — Detección de falsa economía y riesgo crítico de servicio

 Propósito:
 Identificar segmentos donde el costo visible por paquete parece bajo, pero el desempeño
 operativo y el costo oculto sugieren deterioro de experiencia o resiliencia.

 También separa segmentos que no necesariamente son baratos, pero presentan riesgo crítico
 de servicio por late rate alto y extra cost-to-serve elevado.

 Pregunta de negocio:
 ¿Dónde podríamos estar ahorrando en costo visible, pero pagando más por tardías, CX,
 reclamos o compensaciones? ¿Y qué segmentos tienen deterioro crítico aunque no sean baratos?

 Uso en el caso:
 Alimenta la hipótesis de falsa economía y el análisis costo vs. experiencia.
**********************************************************************************************/

WITH economia_segmento AS (
    SELECT
        carril,
        tipo_promesa,
        carrier,
        COUNT(*) AS envios,
        ROUND(AVG(costo_paquete), 2) AS costo_pkg,
        SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) AS late,
        ROUND(
            100.0 * SUM(CASE WHEN flag_entrega_tardia = 1 THEN 1 ELSE 0 END) / COUNT(*),
            2
        ) AS late_pct,
        SUM(CASE WHEN flag_contacto_cx = 1 THEN 1 ELSE 0 END) AS cx,
        SUM(CASE WHEN flag_reclamo = 1 THEN 1 ELSE 0 END) AS reclamos,
        ROUND(SUM(COALESCE(monto_compensacion, 0)), 0) AS comp,
        ROUND(
            AVG(
                CASE
                    WHEN flag_entrega_tardia = 1
                    THEN COALESCE(monto_compensacion, 0)
                         + CASE WHEN flag_contacto_cx = 1 THEN 20 ELSE 0 END
                         + CASE WHEN flag_reclamo = 1 THEN 50 ELSE 0 END
                    ELSE 0
                END
            ),
            2
        ) AS extra_cts
    FROM envios
    GROUP BY
        carril,
        tipo_promesa,
        carrier
    HAVING
        COUNT(*) >= 30
),

segmentos_clasificados AS (
    SELECT
        carril,
        tipo_promesa AS promesa,
        carrier,
        envios,
        costo_pkg,
        late_pct,
        cx,
        reclamos,
        comp,
        extra_cts,
        CASE
            WHEN late_pct >= 30 AND extra_cts >= 10
                THEN 'RIESGO_CRITICO'
            WHEN costo_pkg < 75 AND late_pct >= 15
                THEN 'FALSA_ECO'
            WHEN costo_pkg < 75 AND extra_cts >= 5
                THEN 'FALSA_ECO'
            WHEN late_pct >= 20
                THEN 'RIESGO_SERV'
            ELSE 'REVISAR'
        END AS lectura
    FROM economia_segmento
)

SELECT
    carril,
    promesa,
    carrier,
    envios,
    costo_pkg,
    late_pct,
    cx,
    reclamos,
    comp,
    extra_cts,
    lectura

FROM segmentos_clasificados
WHERE
    lectura IN ('RIESGO_CRITICO', 'FALSA_ECO', 'RIESGO_SERV')
ORDER BY
    CASE
        WHEN lectura = 'RIESGO_CRITICO' THEN 1
        WHEN lectura = 'FALSA_ECO' THEN 2
        WHEN lectura = 'RIESGO_SERV' THEN 3
        ELSE 4
    END,
    late_pct DESC,
    extra_cts DESC,
    costo_pkg ASC
LIMIT 20;


/**********************************************************************************************
 QUERY 10 — Cola priorizada para torre de control

 Propósito:
 Construir una cola ejecutiva de intervención para la torre de control, combinando score de
 oportunidad, ownership, late rate, volumen y una acción sugerida.

 Pregunta de negocio:
 ¿Qué debe revisar primero la torre de control y quién debe tomar acción?

 Uso en el caso:
 Cierra el análisis conectando diagnóstico, priorización, ownership y acción operativa.
**********************************************************************************************/

WITH segmentos_score AS (
    SELECT
        s.segment_id,
        s.tipo_segmento,
        s.nodo_o_carril,
        s.area_responsable,
        s.volumen,
        s.late_rate,
        s.score_controlabilidad,
        s.score_esfuerzo,
        ROUND(
            (s.volumen * s.late_rate * s.score_impacto_cx * s.score_controlabilidad)
            / NULLIF(s.score_esfuerzo, 0),
            2
        ) AS score
    FROM segmentos s
),

cola_torre_control AS (
    SELECT
        ss.segment_id,
        ss.tipo_segmento,
        ss.nodo_o_carril,
        ss.area_responsable,
        r.equipo_accountable,
        r.nivel_escalamiento,
        ss.volumen,
        ROUND(ss.late_rate * 100, 2) AS late_pct,
        ss.score,
        ss.score_controlabilidad,
        ss.score_esfuerzo,
        CASE
            WHEN ss.score >= 750 THEN 'P1'
            WHEN ss.score >= 500 THEN 'P2'
            ELSE 'P3_MON'
        END AS prioridad,
        CASE
            WHEN ss.tipo_segmento = 'Carrier'
                THEN 'Revisar SLA/capacidad'
            WHEN ss.tipo_segmento = 'Nodo Fulfillment'
                THEN 'Revisar backlog/cutoffs'
            WHEN ss.tipo_segmento = 'Carril'
                THEN 'Revisar frecuencia/ruta'
            ELSE 'Revisar causa raiz'
        END AS accion
    FROM segmentos_score ss
    LEFT JOIN responsables r
        ON ss.area_responsable = r.area_responsable
)

SELECT
    prioridad AS prio,
    segment_id AS seg_id,
    tipo_segmento AS tipo,
    nodo_o_carril AS segmento,
    area_responsable AS area,
    equipo_accountable AS owner,
    volumen AS vol,
    late_pct,
    score,
    accion

FROM cola_torre_control
ORDER BY
    CASE
        WHEN prioridad = 'P1' THEN 1
        WHEN prioridad = 'P2' THEN 2
        ELSE 3
    END,
    score DESC
LIMIT 12;


/**********************************************************************************************
 Cierre del archivo

 Estas queries ilustran cómo llevaría el caso desde una lectura agregada de métricas hacia
 un diagnóstico operativo accionable.

 La lógica no busca demostrar causalidad sin datos reales. Busca preparar el sistema de
 análisis para responder cinco preguntas:

 1. ¿Dónde se rompe la promesa?
 2. ¿Qué volumen está afectado?
 3. ¿Cuál es el costo real de la fricción?
 4. ¿Quién tiene ownership?
 5. ¿Qué debe atacarse primero?
**********************************************************************************************/