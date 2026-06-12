# -*- coding: utf-8 -*-

"""
Logistics Control Tower — Generador de Datos Sintéticos

Este script genera datos sintéticos a nivel envío para una torre de control logística
enfocada en cumplimiento de promesa, late rate, cost-to-serve, fricción CX,
cuellos de botella operativos y priorización.

Los datos generados son completamente sintéticos y no representan información real,
confidencial ni propietaria de ninguna empresa.

Archivos generados:
- analysis/python/generated_data/envios_mock.csv
- analysis/python/generated_data/eventos_envio_mock.csv
- analysis/python/generated_data/segmentos_mock.csv
- analysis/python/generated_data/responsables_mock.csv

Nota:
Por seguridad, este script no sobrescribe los CSV utilizados por el dashboard en public/data/.
"""

import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


# =============================================================================
# 1. CONFIGURACIÓN GENERAL
# =============================================================================

RANDOM_SEED = 42
N_ENVIOS = 5000

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# Este archivo vive en analysis/python/.
# La raíz del proyecto está dos niveles arriba.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "analysis", "python", "generated_data")

os.makedirs(DATA_DIR, exist_ok=True)

FECHA_INICIO = datetime(2026, 1, 1, 8, 0, 0)
FECHA_FIN = datetime(2026, 3, 31, 20, 0, 0)


# =============================================================================
# 2. CATÁLOGOS SINTÉTICOS
# =============================================================================

tipos_promesa = ["Next Day", "Two Day", "Standard"]

centros_fulfillment = [
    "FC_CDMX_01",
    "FC_GDL_01",
    "FC_MTY_01",
    "FC_QRO_01",
    "FC_PUE_01",
]

centros_sortation = [
    "SORT_CDMX_01",
    "SORT_GDL_01",
    "SORT_MTY_01",
    "SORT_QRO_01",
]

estaciones_last_mile = [
    "LM_CDMX_NORTE",
    "LM_CDMX_SUR",
    "LM_GDL",
    "LM_MTY",
    "LM_QRO",
    "LM_PUE",
]

carriers = [
    "Carrier_A",
    "Carrier_B",
    "Carrier_C",
    "Carrier_D",
]

regiones_destino = [
    "CDMX",
    "Jalisco",
    "Nuevo Leon",
    "Queretaro",
    "Puebla",
    "Bajio",
    "Occidente",
]

carriles = [
    "CDMX-GDL",
    "CDMX-MTY",
    "GDL-CDMX",
    "GDL-MTY",
    "MTY-CDMX",
    "QRO-CDMX",
    "PUE-CDMX",
    "CDMX-BAJIO",
    "GDL-OCCIDENTE",
]


# =============================================================================
# 3. FUNCIONES AUXILIARES
# =============================================================================

def random_datetime(start: datetime, end: datetime) -> datetime:
    """Genera una fecha aleatoria entre dos fechas dadas."""
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def calcular_probabilidad_tardia(
    tipo_promesa: str,
    fulfillment: str,
    sortation: str,
    carrier: str,
    carril: str,
) -> float:
    """
    Calcula una probabilidad sintética de entrega tardía.

    La lógica introduce patrones intencionales para que el dataset tenga señales
    analíticas útiles:
    - promesas rápidas con mayor riesgo;
    - ciertos nodos con mayor fricción;
    - carriers con desempeño diferenciado;
    - carriles operativamente más complejos.
    """

    prob = 0.06

    # Promesas más rápidas suelen tener mayor exposición a retrasos.
    if tipo_promesa == "Next Day":
        prob += 0.08
    elif tipo_promesa == "Two Day":
        prob += 0.04

    # Nodos con mayor fricción operativa.
    if fulfillment in ["FC_GDL_01", "FC_MTY_01"]:
        prob += 0.04

    if sortation == "SORT_GDL_01":
        prob += 0.03

    # Carriers con distinta variabilidad operativa.
    if carrier == "Carrier_C":
        prob += 0.05
    elif carrier == "Carrier_D":
        prob += 0.03

    # Carriles más complejos.
    if carril in ["GDL-MTY", "CDMX-MTY", "GDL-OCCIDENTE"]:
        prob += 0.04

    return min(prob, 0.35)


def calcular_costo_base(carrier: str, tipo_promesa: str) -> float:
    """
    Simula el costo visible por paquete.

    Carrier_C se define como una opción relativamente barata, pero con mayor riesgo
    operativo, para permitir el análisis de falsa economía.
    """

    base_por_carrier = {
        "Carrier_A": 82,
        "Carrier_B": 78,
        "Carrier_C": 68,
        "Carrier_D": 74,
    }

    base = base_por_carrier[carrier]

    if tipo_promesa == "Next Day":
        base += 8
    elif tipo_promesa == "Two Day":
        base += 4

    return round(max(1, np.random.normal(base, 6)), 2)


def generar_timestamps(
    ts_pedido: datetime,
    es_tardio: bool,
    riesgo_operativo: bool,
) -> dict:
    """
    Genera timestamps sintéticos para el journey operativo de un envío.

    Etapas generadas:
    - pedido_creado
    - ready_to_ship
    - salida_fulfillment
    - llegada_sortation
    - salida_sortation
    - llegada_last_mile
    - out_for_delivery
    - entregado
    """

    # Tiempos base en horas.
    horas_fulfillment = max(1, np.random.normal(5, 2))
    dwell_fulfillment = max(0.5, np.random.normal(2, 1))
    horas_middle_1 = max(2, np.random.normal(8, 3))
    dwell_sortation = max(0.5, np.random.normal(3, 1.5))
    horas_middle_2 = max(2, np.random.normal(8, 3))
    dwell_last_mile = max(0.5, np.random.normal(4, 2))
    horas_entrega_final = max(1, np.random.normal(5, 2))

    # Incremento de fricción en escenarios de mayor riesgo.
    if riesgo_operativo:
        dwell_sortation += np.random.uniform(3, 8)
        dwell_last_mile += np.random.uniform(2, 6)

    # Incremento adicional para envíos tardíos.
    if es_tardio:
        delay_extra = np.random.uniform(8, 36)
        dwell_sortation += delay_extra * 0.35
        dwell_last_mile += delay_extra * 0.35
        horas_middle_2 += delay_extra * 0.30

    ts_ready_to_ship = ts_pedido + timedelta(hours=float(horas_fulfillment))
    ts_salida_fulfillment = ts_ready_to_ship + timedelta(hours=float(dwell_fulfillment))
    ts_llegada_sortation = ts_salida_fulfillment + timedelta(hours=float(horas_middle_1))
    ts_salida_sortation = ts_llegada_sortation + timedelta(hours=float(dwell_sortation))
    ts_llegada_last_mile = ts_salida_sortation + timedelta(hours=float(horas_middle_2))
    ts_out_for_delivery = ts_llegada_last_mile + timedelta(hours=float(dwell_last_mile))
    ts_entregado = ts_out_for_delivery + timedelta(hours=float(horas_entrega_final))

    return {
        "pedido_creado": ts_pedido,
        "ready_to_ship": ts_ready_to_ship,
        "salida_fulfillment": ts_salida_fulfillment,
        "llegada_sortation": ts_llegada_sortation,
        "salida_sortation": ts_salida_sortation,
        "llegada_last_mile": ts_llegada_last_mile,
        "out_for_delivery": ts_out_for_delivery,
        "entregado": ts_entregado,
    }


def obtener_promesa_entrega(fecha_pedido: datetime, tipo_promesa: str) -> datetime:
    """Calcula fecha prometida de entrega según el tipo de promesa."""
    if tipo_promesa == "Next Day":
        return fecha_pedido + timedelta(days=1)

    if tipo_promesa == "Two Day":
        return fecha_pedido + timedelta(days=2)

    return fecha_pedido + timedelta(days=4)


def calcular_score_oportunidad(segmentos_df: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula score de oportunidad para priorización operativa.

    Fórmula:
    score_oportunidad =
        volumen × late_rate × score_impacto_cx × score_controlabilidad / score_esfuerzo
    """

    segmentos_df = segmentos_df.copy()

    segmentos_df["score_oportunidad"] = (
        segmentos_df["volumen"]
        * segmentos_df["late_rate"]
        * segmentos_df["score_impacto_cx"]
        * segmentos_df["score_controlabilidad"]
        / segmentos_df["score_esfuerzo"].replace(0, np.nan)
    ).round(2)

    return segmentos_df


# =============================================================================
# 4. GENERACIÓN DE ENVIOS Y EVENTOS
# =============================================================================

def generar_envios_y_eventos() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Genera las tablas envios_mock y eventos_envio_mock."""

    envios_rows = []
    eventos_rows = []

    for i in range(1, N_ENVIOS + 1):
        shipment_id = f"SHP{i:06d}"
        order_id = f"ORD{i:06d}"

        tipo_promesa = random.choices(
            tipos_promesa,
            weights=[0.25, 0.35, 0.40],
            k=1,
        )[0]

        centro_fulfillment = random.choice(centros_fulfillment)
        centro_sortation = random.choice(centros_sortation)
        estacion_last_mile = random.choice(estaciones_last_mile)

        carrier = random.choices(
            carriers,
            weights=[0.30, 0.30, 0.25, 0.15],
            k=1,
        )[0]

        region_destino = random.choice(regiones_destino)
        carril = random.choice(carriles)
        fecha_pedido = random_datetime(FECHA_INICIO, FECHA_FIN)
        fecha_prometida = obtener_promesa_entrega(fecha_pedido, tipo_promesa)

        prob_tardia = calcular_probabilidad_tardia(
            tipo_promesa=tipo_promesa,
            fulfillment=centro_fulfillment,
            sortation=centro_sortation,
            carrier=carrier,
            carril=carril,
        )

        es_tardio = np.random.random() < prob_tardia

        riesgo_operativo = (
            centro_fulfillment in ["FC_GDL_01", "FC_MTY_01"]
            or centro_sortation == "SORT_GDL_01"
            or carrier in ["Carrier_C", "Carrier_D"]
            or carril in ["GDL-MTY", "CDMX-MTY", "GDL-OCCIDENTE"]
        )

        timestamps = generar_timestamps(
            ts_pedido=fecha_pedido,
            es_tardio=es_tardio,
            riesgo_operativo=riesgo_operativo,
        )

        fecha_entrega_real = timestamps["entregado"]

        # Ajuste para mantener consistencia entre fecha real y flag tardío.
        if es_tardio and fecha_entrega_real <= fecha_prometida:
            fecha_entrega_real = fecha_prometida + timedelta(
                hours=float(np.random.uniform(2, 24))
            )
            timestamps["entregado"] = fecha_entrega_real

        if not es_tardio and fecha_entrega_real > fecha_prometida:
            fecha_entrega_real = fecha_prometida - timedelta(
                hours=float(np.random.uniform(1, 8))
            )
            timestamps["entregado"] = fecha_entrega_real

        horas_retraso = max(
            0,
            round((fecha_entrega_real - fecha_prometida).total_seconds() / 3600, 2),
        )

        flag_entrega_tardia = 1 if horas_retraso > 0 else 0
        flag_entregado_a_tiempo = 1 if flag_entrega_tardia == 0 else 0

        costo_paquete = calcular_costo_base(carrier, tipo_promesa)

        # La fricción CX es más probable cuando hay tardía.
        flag_contacto_cx = (
            1
            if np.random.random() < (0.35 if flag_entrega_tardia else 0.05)
            else 0
        )

        flag_reclamo = (
            1
            if np.random.random() < (0.18 if flag_entrega_tardia else 0.02)
            else 0
        )

        monto_compensacion = 0
        if flag_reclamo == 1:
            monto_compensacion = round(float(np.random.choice([50, 75, 100, 150])), 2)

        envios_rows.append(
            {
                "shipment_id": shipment_id,
                "order_id": order_id,
                "tipo_promesa": tipo_promesa,
                "nodo_origen": centro_fulfillment,
                "centro_fulfillment": centro_fulfillment,
                "centro_sortation": centro_sortation,
                "estacion_last_mile": estacion_last_mile,
                "carrier": carrier,
                "region_destino": region_destino,
                "carril": carril,
                "fecha_pedido": fecha_pedido,
                "fecha_prometida_entrega": fecha_prometida,
                "fecha_entrega_real": fecha_entrega_real,
                "flag_entregado_a_tiempo": flag_entregado_a_tiempo,
                "flag_entrega_tardia": flag_entrega_tardia,
                "horas_retraso": horas_retraso,
                "costo_paquete": costo_paquete,
                "flag_contacto_cx": flag_contacto_cx,
                "flag_reclamo": flag_reclamo,
                "monto_compensacion": monto_compensacion,
            }
        )

        for nombre_evento, ts_evento in timestamps.items():
            if nombre_evento == "pedido_creado":
                nodo = centro_fulfillment
                area_responsable = "Promesa"
            elif nombre_evento in ["ready_to_ship", "salida_fulfillment"]:
                nodo = centro_fulfillment
                area_responsable = "Fulfillment"
            elif nombre_evento in ["llegada_sortation", "salida_sortation"]:
                nodo = centro_sortation
                area_responsable = "Middle Mile"
            elif nombre_evento in ["llegada_last_mile", "out_for_delivery", "entregado"]:
                nodo = estacion_last_mile
                area_responsable = "Last Mile"
            else:
                nodo = "NA"
                area_responsable = "NA"

            eventos_rows.append(
                {
                    "shipment_id": shipment_id,
                    "nombre_evento": nombre_evento,
                    "timestamp_evento": ts_evento,
                    "nodo": nodo,
                    "area_responsable": area_responsable,
                }
            )

    envios_df = pd.DataFrame(envios_rows)
    eventos_df = pd.DataFrame(eventos_rows)

    return envios_df, eventos_df


# =============================================================================
# 5. GENERACIÓN DE SEGMENTOS
# =============================================================================

def generar_segmentos(envios_df: pd.DataFrame) -> pd.DataFrame:
    """Genera segmentos agregados para priorización operativa."""

    segmentos_base = []

    # -------------------------------------------------------------------------
    # Segmentos por carril
    # -------------------------------------------------------------------------

    resumen_carril = (
        envios_df.groupby("carril")
        .agg(
            volumen=("shipment_id", "count"),
            late_rate=("flag_entrega_tardia", "mean"),
            contactos_cx=("flag_contacto_cx", "sum"),
            reclamos=("flag_reclamo", "sum"),
            costo_to_serve=("costo_paquete", "mean"),
        )
        .reset_index()
    )

    for idx, row in resumen_carril.iterrows():
        impacto_cx = min(
            5,
            1
            + (row["contactos_cx"] + row["reclamos"] * 2)
            / max(row["volumen"], 1)
            * 10,
        )

        controlabilidad = 3
        if row["carril"] in ["GDL-MTY", "CDMX-MTY", "GDL-OCCIDENTE"]:
            controlabilidad = 2
        elif row["carril"] in ["QRO-CDMX", "PUE-CDMX"]:
            controlabilidad = 4

        esfuerzo = 3
        if controlabilidad <= 2:
            esfuerzo = 4
        elif controlabilidad >= 4:
            esfuerzo = 2

        segmentos_base.append(
            {
                "segment_id": f"SEG_CARRIL_{idx + 1:02d}",
                "tipo_segmento": "Carril",
                "nodo_o_carril": row["carril"],
                "area_responsable": "Middle Mile",
                "volumen": int(row["volumen"]),
                "late_rate": round(float(row["late_rate"]), 4),
                "score_impacto_cx": round(float(impacto_cx), 2),
                "costo_to_serve": round(float(row["costo_to_serve"]), 2),
                "score_controlabilidad": controlabilidad,
                "score_esfuerzo": esfuerzo,
            }
        )

    # -------------------------------------------------------------------------
    # Segmentos por fulfillment
    # -------------------------------------------------------------------------

    resumen_fc = (
        envios_df.groupby("centro_fulfillment")
        .agg(
            volumen=("shipment_id", "count"),
            late_rate=("flag_entrega_tardia", "mean"),
            contactos_cx=("flag_contacto_cx", "sum"),
            reclamos=("flag_reclamo", "sum"),
            costo_to_serve=("costo_paquete", "mean"),
        )
        .reset_index()
    )

    for idx, row in resumen_fc.iterrows():
        impacto_cx = min(
            5,
            1
            + (row["contactos_cx"] + row["reclamos"] * 2)
            / max(row["volumen"], 1)
            * 10,
        )

        controlabilidad = 4
        esfuerzo = 2

        if row["centro_fulfillment"] in ["FC_GDL_01", "FC_MTY_01"]:
            controlabilidad = 4
            esfuerzo = 3

        segmentos_base.append(
            {
                "segment_id": f"SEG_FC_{idx + 1:02d}",
                "tipo_segmento": "Nodo Fulfillment",
                "nodo_o_carril": row["centro_fulfillment"],
                "area_responsable": "Fulfillment",
                "volumen": int(row["volumen"]),
                "late_rate": round(float(row["late_rate"]), 4),
                "score_impacto_cx": round(float(impacto_cx), 2),
                "costo_to_serve": round(float(row["costo_to_serve"]), 2),
                "score_controlabilidad": controlabilidad,
                "score_esfuerzo": esfuerzo,
            }
        )

    # -------------------------------------------------------------------------
    # Segmentos por carrier
    # -------------------------------------------------------------------------

    resumen_carrier = (
        envios_df.groupby("carrier")
        .agg(
            volumen=("shipment_id", "count"),
            late_rate=("flag_entrega_tardia", "mean"),
            contactos_cx=("flag_contacto_cx", "sum"),
            reclamos=("flag_reclamo", "sum"),
            costo_to_serve=("costo_paquete", "mean"),
        )
        .reset_index()
    )

    for idx, row in resumen_carrier.iterrows():
        impacto_cx = min(
            5,
            1
            + (row["contactos_cx"] + row["reclamos"] * 2)
            / max(row["volumen"], 1)
            * 10,
        )

        controlabilidad = 3
        esfuerzo = 3

        if row["carrier"] == "Carrier_C":
            controlabilidad = 2
            esfuerzo = 4
        elif row["carrier"] == "Carrier_A":
            controlabilidad = 4
            esfuerzo = 2

        segmentos_base.append(
            {
                "segment_id": f"SEG_CARRIER_{idx + 1:02d}",
                "tipo_segmento": "Carrier",
                "nodo_o_carril": row["carrier"],
                "area_responsable": "Last Mile",
                "volumen": int(row["volumen"]),
                "late_rate": round(float(row["late_rate"]), 4),
                "score_impacto_cx": round(float(impacto_cx), 2),
                "costo_to_serve": round(float(row["costo_to_serve"]), 2),
                "score_controlabilidad": controlabilidad,
                "score_esfuerzo": esfuerzo,
            }
        )

    segmentos_df = pd.DataFrame(segmentos_base)
    segmentos_df = calcular_score_oportunidad(segmentos_df)

    return segmentos_df


# =============================================================================
# 6. GENERACIÓN DE RESPONSABLES
# =============================================================================

def generar_responsables() -> pd.DataFrame:
    """Genera tabla de responsables operativos por área."""

    return pd.DataFrame(
        [
            {
                "area_responsable": "Promesa",
                "equipo_accountable": "Promise & Experience",
                "nivel_escalamiento": "Manager Promesa",
            },
            {
                "area_responsable": "Fulfillment",
                "equipo_accountable": "Operaciones Fulfillment",
                "nivel_escalamiento": "Manager Fulfillment",
            },
            {
                "area_responsable": "Middle Mile",
                "equipo_accountable": "Operaciones Middle Mile",
                "nivel_escalamiento": "Manager Transporte",
            },
            {
                "area_responsable": "Last Mile",
                "equipo_accountable": "Operaciones Last Mile",
                "nivel_escalamiento": "Manager Last Mile",
            },
            {
                "area_responsable": "CX",
                "equipo_accountable": "Customer Experience",
                "nivel_escalamiento": "Manager CX",
            },
            {
                "area_responsable": "Finanzas",
                "equipo_accountable": "Finance Business Partner",
                "nivel_escalamiento": "Manager Finanzas",
            },
        ]
    )


# =============================================================================
# 7. GUARDADO DE ARCHIVOS
# =============================================================================

def guardar_csvs(
    envios_df: pd.DataFrame,
    eventos_df: pd.DataFrame,
    segmentos_df: pd.DataFrame,
    responsables_df: pd.DataFrame,
) -> dict:
    """Guarda las tablas generadas en public/data/."""

    rutas = {
        "envios": os.path.join(DATA_DIR, "envios_mock.csv"),
        "eventos": os.path.join(DATA_DIR, "eventos_envio_mock.csv"),
        "segmentos": os.path.join(DATA_DIR, "segmentos_mock.csv"),
        "responsables": os.path.join(DATA_DIR, "responsables_mock.csv"),
    }

    envios_df.to_csv(rutas["envios"], index=False, encoding="utf-8-sig")
    eventos_df.to_csv(rutas["eventos"], index=False, encoding="utf-8-sig")
    segmentos_df.to_csv(rutas["segmentos"], index=False, encoding="utf-8-sig")
    responsables_df.to_csv(rutas["responsables"], index=False, encoding="utf-8-sig")

    return rutas


# =============================================================================
# 8. RESUMEN EN CONSOLA
# =============================================================================

def imprimir_resumen(
    envios_df: pd.DataFrame,
    eventos_df: pd.DataFrame,
    segmentos_df: pd.DataFrame,
    responsables_df: pd.DataFrame,
    rutas: dict,
) -> None:
    """Imprime resumen ejecutivo de la generación de datos."""

    total_envios = len(envios_df)
    total_tardios = int(envios_df["flag_entrega_tardia"].sum())
    late_rate = total_tardios / total_envios if total_envios else 0

    print("\n============================================================")
    print("DATOS SINTÉTICOS GENERADOS CORRECTAMENTE")
    print("============================================================")
    print(f"Envíos generados: {len(envios_df):,}")
    print(f"Eventos generados: {len(eventos_df):,}")
    print(f"Segmentos generados: {len(segmentos_df):,}")
    print(f"Responsables generados: {len(responsables_df):,}")

    print("\nValidación general:")
    print(f"- Envíos tardíos: {total_tardios:,}")
    print(f"- Late rate general: {late_rate:.2%}")

    print("\nArchivos CSV generados:")
    print(f"- {rutas['envios']}")
    print(f"- {rutas['eventos']}")
    print(f"- {rutas['segmentos']}")
    print(f"- {rutas['responsables']}")

    print("\nPerformance por tipo de promesa:")
    promesa_summary = (
        envios_df.groupby("tipo_promesa")
        .agg(
            total_envios=("shipment_id", "count"),
            envios_tardios=("flag_entrega_tardia", "sum"),
            late_rate=("flag_entrega_tardia", "mean"),
        )
        .reset_index()
    )

    promesa_summary["late_rate"] = promesa_summary["late_rate"].map(
        lambda x: f"{x:.2%}"
    )

    print(promesa_summary.to_string(index=False))

    print("\nTop 5 segmentos por score de oportunidad:")
    print(
        segmentos_df.sort_values("score_oportunidad", ascending=False)
        [
            [
                "segment_id",
                "tipo_segmento",
                "nodo_o_carril",
                "volumen",
                "late_rate",
                "score_controlabilidad",
                "score_oportunidad",
            ]
        ]
        .head(5)
        .to_string(index=False)
    )

    print("\nNota:")
    print(
        "Los datos son sintéticos y fueron generados únicamente con fines "
        "de portafolio y aprendizaje."
    )


# =============================================================================
# 9. EJECUCIÓN PRINCIPAL
# =============================================================================

def main() -> None:
    """Ejecuta el flujo completo de generación de datos."""

    envios_df, eventos_df = generar_envios_y_eventos()
    segmentos_df = generar_segmentos(envios_df)
    responsables_df = generar_responsables()

    rutas = guardar_csvs(
        envios_df=envios_df,
        eventos_df=eventos_df,
        segmentos_df=segmentos_df,
        responsables_df=responsables_df,
    )

    imprimir_resumen(
        envios_df=envios_df,
        eventos_df=eventos_df,
        segmentos_df=segmentos_df,
        responsables_df=responsables_df,
        rutas=rutas,
    )


if __name__ == "__main__":
    main()