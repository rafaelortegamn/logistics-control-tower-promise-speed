const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeRate = (value) => {
  const n = toNumber(value);
  return n > 1 ? n / 100 : n;
};

const avg = (values) => {
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!clean.length) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
};

const hoursDiff = (end, start) => {
  if (!end || !start) return null;

  const endDate = new Date(end);
  const startDate = new Date(start);

  if (Number.isNaN(endDate.getTime()) || Number.isNaN(startDate.getTime())) {
    return null;
  }

  let diffHours = (endDate - startDate) / (1000 * 60 * 60);

  // Corrección para cruces de medianoche en la base mock.
  // Si la diferencia sale negativa, asumimos que el evento final ocurrió al día siguiente.
  if (diffHours < 0) {
    diffHours += 24;
  }

  return diffHours;
};

export function buildExecutiveMetrics(envios) {
  const total = envios.length;
  const tardios = envios.reduce((sum, e) => sum + toNumber(e.flag_entrega_tardia), 0);
  const lateRate = total ? tardios / total : 0;

  const costoLogistico = envios.reduce((sum, e) => sum + toNumber(e.costo_paquete), 0);
  const costoPromedioPqte = total ? costoLogistico / total : 0;

  const totalCx = envios.reduce((sum, e) => sum + toNumber(e.flag_contacto_cx), 0);
  const totalReclamos = envios.reduce((sum, e) => sum + toNumber(e.flag_reclamo), 0);
  const totalCompensaciones = envios.reduce((sum, e) => sum + toNumber(e.monto_compensacion), 0);

  const costoEstimadoTotal =
    costoLogistico +
    totalCx * 20 +
    totalReclamos * 50 +
    totalCompensaciones;

  const costToServePromedio = total ? costoEstimadoTotal / total : 0;
  const extraCost = costToServePromedio - costoPromedioPqte;

  return {
    total,
    tardios,
    lateRate,
    costoLogistico,
    costoPromedioPqte,
    totalCx,
    totalReclamos,
    totalCompensaciones,
    costoEstimadoTotal,
    costToServePromedio,
    extraCost,
  };
}

export function buildPromisePerformance(envios) {
  const map = new Map();

  envios.forEach((e) => {
    const promesa = e.tipo_promesa || "Sin promesa";

    if (!map.has(promesa)) {
      map.set(promesa, {
        name: promesa,
        vol: 0,
        late: 0,
        retrasoTotal: 0,
      });
    }

    const row = map.get(promesa);
    row.vol += 1;
    row.late += toNumber(e.flag_entrega_tardia);
    row.retrasoTotal += toNumber(e.horas_retraso);
  });

  return Array.from(map.values())
    .map((d) => ({
      ...d,
      lateRate: d.vol ? Number(((d.late / d.vol) * 100).toFixed(2)) : 0,
      retrasoPromedio: d.vol ? Number((d.retrasoTotal / d.vol).toFixed(2)) : 0,
    }))
    .sort((a, b) => {
      const order = { "Next Day": 1, "Two Day": 2, Standard: 3 };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
}

const EVENT_COLUMNS = {
  pedido_creado: "ts_pedido_creado",
  ready_to_ship: "ts_ready_to_ship",
  salida_fulfillment: "ts_salida_fulfillment",
  llegada_sortation: "ts_llegada_sortation",
  salida_sortation: "ts_salida_sortation",
  llegada_last_mile: "ts_llegada_last_mile",
  out_for_delivery: "ts_out_for_delivery",
  entregado: "ts_entregado",
};

export function buildJourneyData(envios, eventos) {
  const enviosById = new Map(envios.map((e) => [e.shipment_id, e]));

  const pivot = new Map();

  eventos.forEach((ev) => {
    const shipmentId = ev.shipment_id;
    const eventName = ev.nombre_evento;

    if (!shipmentId || !eventName) return;

    if (!pivot.has(shipmentId)) {
      pivot.set(shipmentId, { shipment_id: shipmentId });
    }

    const row = pivot.get(shipmentId);
    const colName = EVENT_COLUMNS[eventName];

    if (colName) {
      row[colName] = ev.timestamp_evento;
    }
  });

  const rows = Array.from(pivot.values())
    .filter((row) => enviosById.has(row.shipment_id))
    .map((row) => {
      const envio = enviosById.get(row.shipment_id);

      return {
        shipment_id: row.shipment_id,
        flag_entrega_tardia: toNumber(envio?.flag_entrega_tardia),
        tiempo_fulfillment: hoursDiff(row.ts_ready_to_ship, row.ts_pedido_creado),
        espera_despacho_fc: hoursDiff(row.ts_salida_fulfillment, row.ts_ready_to_ship),
        tiempo_sortation: hoursDiff(row.ts_salida_sortation, row.ts_llegada_sortation),
        transito_last_mile: hoursDiff(row.ts_llegada_last_mile, row.ts_salida_sortation),
        estacion_last_mile: hoursDiff(row.ts_out_for_delivery, row.ts_llegada_last_mile),
        ruta_entrega: hoursDiff(row.ts_entregado, row.ts_out_for_delivery),
      };
    });

  const stages = [
    ["1. Tiempo Fulfillment", "tiempo_fulfillment"],
    ["2. Espera Despacho FC", "espera_despacho_fc"],
    ["3. Tiempo Sortation", "tiempo_sortation"],
    ["4. Tránsito a Last Mile", "transito_last_mile"],
    ["5. Estación Last Mile", "estacion_last_mile"],
    ["6. Ruta Entrega", "ruta_entrega"],
  ];

  return stages.map(([etapa, key], index) => {
    const onTimeValues = rows
      .filter((r) => r.flag_entrega_tardia === 0)
      .map((r) => r[key]);

    const lateValues = rows
      .filter((r) => r.flag_entrega_tardia === 1)
      .map((r) => r[key]);

    const OnTime = Number(avg(onTimeValues).toFixed(2));
    const Late = Number(avg(lateValues).toFixed(2));

    return {
      id: String(index + 1),
      etapa,
      OnTime,
      Late,
      delta: Number((Late - OnTime).toFixed(2)),
    };
  });
}

export function buildNetworkAnalysis(envios) {
  const map = new Map();

  envios.forEach((e) => {
    const carril = e.carril || "Sin carril";
    const promesa = e.tipo_promesa || "Sin promesa";
    const carrier = e.carrier || "Sin carrier";

    const key = `${carril}|${promesa}|${carrier}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        carril,
        promesa,
        carrier,
        vol: 0,
        late: 0,
        cost: 0,
        cx: 0,
        reclamos: 0,
        comp: 0,
      });
    }

    const row = map.get(key);

    row.vol += 1;
    row.late += toNumber(e.flag_entrega_tardia);
    row.cost += toNumber(e.costo_paquete);
    row.cx += toNumber(e.flag_contacto_cx);
    row.reclamos += toNumber(e.flag_reclamo);
    row.comp += toNumber(e.monto_compensacion);
  });

  return Array.from(map.values())
    .map((d) => {
      const lateRate = d.vol ? d.late / d.vol : 0;
      const avgCost = d.vol ? d.cost / d.vol : 0;
      const cts = d.vol
        ? (d.cost + d.cx * 20 + d.reclamos * 50 + d.comp) / d.vol
        : 0;
      const extraCost = cts - avgCost;

      let lectura = "NORMAL";

      if (lateRate >= 0.3 && extraCost >= 10) {
        lectura = "RIESGO_CRITICO";
      } else if (avgCost < 75 && (lateRate >= 0.15 || extraCost >= 5)) {
        lectura = "FALSA_ECO";
      } else if (lateRate >= 0.2) {
        lectura = "RIESGO_SERV";
      }

      return {
        ...d,
        lateRate,
        lateRatePct: Number((lateRate * 100).toFixed(2)),
        avgCost,
        cts,
        extraCost,
        lectura,
      };
    })
    .sort((a, b) => {
      const priorityOrder = {
        RIESGO_CRITICO: 1,
        FALSA_ECO: 2,
        RIESGO_SERV: 3,
        NORMAL: 4,
      };

      return (
        (priorityOrder[a.lectura] || 99) - (priorityOrder[b.lectura] || 99) ||
        b.lateRate - a.lateRate
      );
    });
}

export function buildWarRoom(segmentos, responsables) {
  const responsablesByArea = new Map(
    responsables.map((r) => [r.area_responsable, r])
  );

  return segmentos
    .map((s) => {
      const resp = responsablesByArea.get(s.area_responsable);
      const score = toNumber(s.score_oportunidad);
      const lateRate = normalizeRate(s.late_rate);

      return {
        id: s.segment_id,
        tipo: s.tipo_segmento,
        nombre: s.nodo_o_carril,
        area: s.area_responsable,
        vol: toNumber(s.volumen),
        late_rate: lateRate,
        score_oportunidad: score,
        prioridad:
          score >= 750
            ? "P1"
            : score >= 500
            ? "P2"
            : "P3_MON",
        accion: getAction(s.tipo_segmento),
        equipo:
          resp?.nivel_escalamiento ||
          resp?.equipo_accountable ||
          "Sin owner",
      };
    })
    .sort((a, b) => b.score_oportunidad - a.score_oportunidad);
}

function getAction(tipoSegmento) {
  if (tipoSegmento === "Carrier") return "Revisar SLA/capacidad";
  if (tipoSegmento === "Nodo Fulfillment") return "Revisar backlog/cutoffs";
  if (tipoSegmento === "Carril") return "Revisar frecuencias/ruta";
  return "Revisar causa raíz";
}