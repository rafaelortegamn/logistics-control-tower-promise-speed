/* ============================================================
   Logistics Control Tower — Promise & Speed Management
   Archivo: create_schema.sql

   Objetivo:
   Crear la base de datos y las tablas necesarias para cargar
   la base mock/sintética del proyecto.

   Nota:
   Este script solo crea la estructura de la base de datos.
   No incluye INSERTs. Los datos deben importarse desde los CSV.

   Base de datos:
   control_tower_worksample_mock
   ============================================================ */


-- ============================================================
-- 1. CREACIÓN DE BASE DE DATOS
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS control_tower_worksample_mock;

CREATE DATABASE control_tower_worksample_mock
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE control_tower_worksample_mock;


-- ============================================================
-- 2. TABLA PRINCIPAL DE ENVÍOS
-- ============================================================

DROP TABLE IF EXISTS envios;

CREATE TABLE envios (
    shipment_id VARCHAR(30) NOT NULL,
    order_id VARCHAR(30) NOT NULL,
    tipo_promesa VARCHAR(50) NOT NULL,
    nodo_origen VARCHAR(100),
    centro_fulfillment VARCHAR(100),
    centro_sortation VARCHAR(100),
    estacion_last_mile VARCHAR(100),
    carrier VARCHAR(100),
    region_destino VARCHAR(100),
    carril VARCHAR(100),
    fecha_pedido DATETIME,
    fecha_prometida_entrega DATETIME,
    fecha_entrega_real DATETIME,
    flag_entregado_a_tiempo TINYINT,
    flag_entrega_tardia TINYINT,
    horas_retraso DECIMAL(10,2),
    costo_paquete DECIMAL(10,2),
    flag_contacto_cx TINYINT,
    flag_reclamo TINYINT,
    monto_compensacion DECIMAL(10,2),

    PRIMARY KEY (shipment_id)
);


-- ============================================================
-- 3. TABLA DE EVENTOS POR ENVÍO
-- ============================================================

DROP TABLE IF EXISTS eventos_envio;

CREATE TABLE eventos_envio (
    event_id BIGINT NOT NULL AUTO_INCREMENT,
    shipment_id VARCHAR(30) NOT NULL,
    nombre_evento VARCHAR(100) NOT NULL,
    timestamp_evento DATETIME,
    nodo VARCHAR(100),
    area_responsable VARCHAR(100),

    PRIMARY KEY (event_id),

    INDEX idx_eventos_shipment_id (shipment_id),
    INDEX idx_eventos_nombre_evento (nombre_evento),
    INDEX idx_eventos_area_responsable (area_responsable),

    CONSTRAINT fk_eventos_envio_shipment
        FOREIGN KEY (shipment_id)
        REFERENCES envios(shipment_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- 4. TABLA DE SEGMENTOS OPERATIVOS
-- ============================================================

DROP TABLE IF EXISTS segmentos;

CREATE TABLE segmentos (
    segment_id VARCHAR(50) NOT NULL,
    tipo_segmento VARCHAR(100) NOT NULL,
    nodo_o_carril VARCHAR(100) NOT NULL,
    area_responsable VARCHAR(100),
    volumen INT,
    late_rate DECIMAL(10,4),
    score_impacto_cx DECIMAL(10,2),
    costo_to_serve DECIMAL(10,2),
    score_controlabilidad DECIMAL(10,2),
    score_esfuerzo DECIMAL(10,2),
    score_oportunidad DECIMAL(12,2),

    PRIMARY KEY (segment_id),

    INDEX idx_segmentos_tipo (tipo_segmento),
    INDEX idx_segmentos_area (area_responsable),
    INDEX idx_segmentos_score (score_oportunidad)
);


-- ============================================================
-- 5. TABLA DE RESPONSABLES / OWNERSHIP
-- ============================================================

DROP TABLE IF EXISTS responsables;

CREATE TABLE responsables (
    area_responsable VARCHAR(100) NOT NULL,
    equipo_accountable VARCHAR(150),
    nivel_escalamiento VARCHAR(150),

    PRIMARY KEY (area_responsable)
);


-- ============================================================
-- 6. ÍNDICES ADICIONALES PARA ANÁLISIS
-- ============================================================

CREATE INDEX idx_envios_tipo_promesa
    ON envios(tipo_promesa);

CREATE INDEX idx_envios_carrier
    ON envios(carrier);

CREATE INDEX idx_envios_carril
    ON envios(carril);

CREATE INDEX idx_envios_fulfillment
    ON envios(centro_fulfillment);

CREATE INDEX idx_envios_sortation
    ON envios(centro_sortation);

CREATE INDEX idx_envios_last_mile
    ON envios(estacion_last_mile);

CREATE INDEX idx_envios_region
    ON envios(region_destino);

CREATE INDEX idx_envios_fecha_pedido
    ON envios(fecha_pedido);

CREATE INDEX idx_envios_flag_tardia
    ON envios(flag_entrega_tardia);


-- ============================================================
-- 7. VALIDACIÓN DE ESTRUCTURA
-- ============================================================

SHOW TABLES;

DESCRIBE envios;
DESCRIBE eventos_envio;
DESCRIBE segmentos;
DESCRIBE responsables;

SET FOREIGN_KEY_CHECKS = 1;


/* ============================================================
   Siguiente paso sugerido:

   Importar los CSV ubicados en public/data/ o en
   analysis/python/generated_data/ hacia las tablas:

   - envios_mock.csv           -> envios
   - eventos_envio_mock.csv    -> eventos_envio
   - segmentos_mock.csv        -> segmentos
   - responsables_mock.csv     -> responsables

   Después de cargar la información, ejecutar:
   diagnostic_queries.sql
   ============================================================ */