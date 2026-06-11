import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  MapPin,
  Activity,
  Filter,
  ShieldAlert,
  Crosshair,
  LayoutDashboard,
  AlertOctagon,
  Target,
  Info,
  Lightbulb,
} from "lucide-react";

import { useCsvData } from "./dataLoader";
import {
  buildExecutiveMetrics,
  buildPromisePerformance,
  buildJourneyData,
  buildNetworkAnalysis,
  buildWarRoom,
  buildWeeklyTrends,
} from "./transformations";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}>
    {children}
  </div>
);

const Metric = ({ title, value, subtitle, icon: Icon, colorClass = "text-slate-800" }) => (
  <Card className="flex flex-col justify-center">
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-semibold text-slate-500 tracking-tight">{title}</span>
      {Icon && <Icon className={`w-5 h-5 ${colorClass}`} />}
    </div>
    <div className={`text-3xl font-black tracking-tight ${colorClass}`}>{value}</div>
    {subtitle && <div className="text-xs font-medium text-slate-400 mt-1">{subtitle}</div>}
  </Card>
);

const InsightCard = ({ title, value, subtitle, highlight, icon: Icon, colorClass }) => (
  <Card className={`border-l-4 ${colorClass} flex items-center space-x-4 bg-gradient-to-r from-slate-50 to-white`}>
    <div
      className={`p-3 rounded-full ${colorClass
        .replace("border-", "bg-")
        .replace("500", "100")} ${colorClass.replace("border-", "text-")}`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</div>
      <div className="text-lg font-black text-slate-800">{value}</div>
      <div className="text-sm font-medium text-slate-500">
        <span className={`font-bold ${colorClass.replace("border-", "text-")}`}>{highlight}</span>{" "}
        {subtitle}
      </div>
    </div>
  </Card>
);

const Badge = ({ children, type }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border-amber-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    red: "bg-rose-100 text-rose-800 border-rose-200",
    slate: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded border text-xs font-bold tracking-wide uppercase ${
        colors[type] || colors.slate
      }`}
    >
      {children}
    </span>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("executive");
  const [filterPromesa, setFilterPromesa] = useState("All");
  const { envios, eventos, segmentos, responsables, loading, error } = useCsvData();
  const processedData = useMemo(() => {
    const filteredEnvios = envios.filter(
      (e) => filterPromesa === "All" || e.tipo_promesa === filterPromesa
    );
    const kpis = buildExecutiveMetrics(filteredEnvios);
    const byPromesa = buildPromisePerformance(filteredEnvios);
    const journeyData = buildJourneyData(filteredEnvios, eventos);
    const networkAnalysis = buildNetworkAnalysis(filteredEnvios);
    const warRoom = buildWarRoom(segmentos, responsables);
    const weeklyTrends = buildWeeklyTrends(filteredEnvios);
    const topRiesgoCritico = networkAnalysis[0];
    const topVolumenTardio = [...byPromesa].sort((a, b) => b.late - a.late)[0];
    const topOportunidad = warRoom[0];

    return {
      kpis,
      insights: {
        topRiesgoCritico,
        topVolumenTardio,
        topOportunidad,
      },
      charts: {
        byPromesa,
        journeyData,
        networkAnalysis,
        warRoom,
        weeklyTrends
      },
    };
  }, [envios, eventos, segmentos, responsables, filterPromesa]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <div className="text-xl font-black text-slate-800">Cargando CSV locales...</div>
          <div className="text-sm text-slate-500 mt-2">Leyendo envíos, eventos, segmentos y responsables.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="bg-white border border-rose-200 rounded-xl shadow-sm p-8 max-w-xl">
          <div className="text-xl font-black text-rose-600">Error cargando datos</div>
          <div className="text-sm text-slate-600 mt-2">{error.message}</div>
        </div>
      </div>
    );
  }

  const { kpis, insights, charts } = processedData;

  const renderExecutive = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Metric
          title="TOTAL ENVÍOS"
          value={kpis.total.toLocaleString()}
          subtitle="Baseline de análisis"
          icon={Package}
        />

        <Metric
          title="LATE RATE"
          value={`${(kpis.lateRate * 100).toFixed(2)}%`}
          subtitle={`${kpis.tardios.toLocaleString()} tardíos`}
          icon={AlertTriangle}
          colorClass={kpis.lateRate >= 0.1544 ? "text-rose-600" : "text-emerald-600"}
        />

        <Metric
          title="TARIFA BASE"
          value={`$${kpis.costoPromedioPqte.toFixed(2)}`}
          subtitle="Costo paquete visible"
          icon={DollarSign}
        />

        <Metric
          title="COST-TO-SERVE"
          value={`$${kpis.costToServePromedio.toFixed(2)}`}
          subtitle="Costo real estimado"
          icon={DollarSign}
          colorClass="text-indigo-700"
        />

        <Metric
          title="EXTRA COSTO"
          value={`+$${kpis.extraCost.toFixed(2)}`}
          subtitle="Impacto To-Serve / CX"
          icon={TrendingUp}
          colorClass="text-rose-500"
        />

        <Metric
          title="FRICCIÓN CX"
          value={kpis.totalCx.toLocaleString()}
          subtitle={`${kpis.totalReclamos.toLocaleString()} reclamos`}
          icon={Activity}
          colorClass="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-1">
            Volumetría y Performance por Promesa
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-4">
            Distribución calculada directamente desde envios_mock.csv.
          </p>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.byPromesa} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontWeight: 600, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f43f5e"
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontWeight: 600, fontSize: "12px" }} />
                <Bar
                  yAxisId="left"
                  dataKey="vol"
                  name="Total Envíos"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  barSize={44}
                />
                <Bar
                  yAxisId="right"
                  dataKey="lateRate"
                  name="Late Rate (%)"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card className="bg-slate-900 text-white border-none shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2" /> Salud de Red
            </h3>

            <div className="flex items-center space-x-5">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.45)]">
                <Activity size={32} className="text-white" />
              </div>

              <div>
                <div className="text-2xl font-black tracking-tight">RIESGO ACTIVO</div>
                <div className="text-sm font-medium text-slate-300">
                  Operación en riesgo: {(kpis.lateRate * 100).toFixed(2)}% de envíos tardíos
                </div>
              </div>
            </div>
          </Card>

          <Card className="flex-1 border-indigo-100 bg-indigo-50/30">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-indigo-900">
              Top Frentes de Acción
            </h3>

            <div className="space-y-3">
              {charts.warRoom
                .filter((w) => w.prioridad === "P1")
                .slice(0, 3)
                .map((w, idx) => (
                  <div
                    key={w.nombre}
                    className="flex justify-between items-center bg-white p-3 rounded-lg border border-indigo-100 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-indigo-400 font-black text-lg">{idx + 1}</span>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{w.nombre}</div>
                        <div className="text-xs font-medium text-slate-500">{w.area}</div>
                      </div>
                    </div>

                    <Badge type="red">P1</Badge>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard
          title="Mayor Riesgo Crítico"
          value={
            insights.topRiesgoCritico
              ? `${insights.topRiesgoCritico.carril} / ${insights.topRiesgoCritico.carrier}`
              : "-"
          }
          highlight={`${(insights.topRiesgoCritico?.lateRatePct || 0).toFixed(2)}%`}
          subtitle="Late Rate segmento"
          icon={AlertOctagon}
          colorClass="border-rose-500"
        />

        <InsightCard
          title="Mayor Volumen Tardío"
          value={`Promesa ${insights.topVolumenTardio?.name || "-"}`}
          highlight={insights.topVolumenTardio?.late || 0}
          subtitle="envíos impactados"
          icon={Clock}
          colorClass="border-amber-500"
        />

        <InsightCard
          title="Mayor Oportunidad Inicial"
          value={insights.topOportunidad?.nombre || "-"}
          highlight={(insights.topOportunidad?.score_oportunidad || 0).toFixed(0)}
          subtitle="Score Operativo"
          icon={Target}
          colorClass="border-indigo-500"
        />
      </div>
    </div>
  );

  const renderJourney = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg flex items-start space-x-4">
        <div className="bg-indigo-500/20 p-3 rounded-lg">
          <MapPin className="text-indigo-400 w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-black mb-1">Diagnóstico de Tiempos y Fricción</h3>
          <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-4xl">
            Comparativa estructural calculada desde eventos_envio_mock.csv. La columna{" "}
            <strong className="text-rose-400">Delta</strong> cuantifica cuántas horas extra se
            acumulan por etapa. Se aplica corrección de cruce de medianoche para diferencias
            negativas en timestamps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="h-[430px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.journeyData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" name="Horas" tick={{ fontWeight: 600, fill: "#64748b" }} />
                <YAxis
                  dataKey="etapa"
                  type="category"
                  width={170}
                  tick={{ fontSize: 12, fill: "#1e293b", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", fontWeight: 600 }}
                  formatter={(value) => [`${value} hrs`, "Tiempo Promedio"]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontWeight: 600, paddingTop: "10px" }} />
                <Bar
                  dataKey="OnTime"
                  name="A Tiempo (Hrs)"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="Late"
                  name="Tardíos (Hrs)"
                  fill="#f43f5e"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col border-rose-100 bg-rose-50/20">
          <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider flex items-center">
            <Clock className="w-4 h-4 mr-2 text-rose-500" /> Acumulación de Fricción
          </h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 text-left">
                <th className="pb-2 font-bold uppercase text-xs">Etapa</th>
                <th className="pb-2 font-bold uppercase text-xs text-right">Delta</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {charts.journeyData.map((d) => (
                <tr key={d.id} className="hover:bg-white transition-colors">
                  <td className="py-3 font-semibold text-slate-700">{d.etapa.substring(3)}</td>
                  <td className="py-3 text-right font-black">
                    {d.delta > 2 ? (
                      <span className="text-rose-600 bg-rose-100 px-2 py-1 rounded-md">
                        +{d.delta}h
                      </span>
                    ) : d.delta > 0 ? (
                      <span className="text-amber-600">+{d.delta}h</span>
                    ) : (
                      <span className="text-emerald-600">{d.delta}h</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );

  const renderCost = () => {
    const topNetwork = charts.networkAnalysis.slice(0, 10);

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-indigo-500 bg-indigo-50/60">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-indigo-900 uppercase tracking-wider">
                Supuestos de Cost-to-Serve
              </h4>
              <p className="text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                El costo real estimado se calcula como costo paquete + contacto CX × $20 +
                reclamo × $50 + compensaciones. Estos valores son supuestos mock para demostrar
                la metodología; en una operación real deben validarse con Finanzas y CX.
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Mapa de Rentabilidad: Tarifa Base vs Incumplimiento de Promesa
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Segmentos con tarifa competitiva pueden destruir rentabilidad si generan fricción,
                reclamos y compensaciones.
              </p>
            </div>

            <div className="flex space-x-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-rose-500 mr-1" />
                Crítico
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-1" />
                Falsa Eco
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-400 mr-1" />
                Riesgo
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1" />
                Normal
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="avgCost"
                  name="Tarifa Base ($)"
                  domain={["dataMin - 5", "dataMax + 5"]}
                  tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                  tick={{ fontWeight: 600 }}
                  label={{
                    value: "Tarifa Base ($)",
                    position: "insideBottom",
                    offset: -10,
                    fontWeight: 700,
                    fill: "#64748b",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="lateRatePct"
                  name="Late Rate (%)"
                  tick={{ fontWeight: 600 }}
                  label={{
                    value: "Late Rate (%)",
                    angle: -90,
                    position: "insideLeft",
                    fontWeight: 700,
                    fill: "#64748b",
                  }}
                />
                <ZAxis type="number" dataKey="vol" range={[60, 400]} name="Volumen" />
                <ReferenceLine
                  y={15}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{
                    position: "insideTopRight",
                    value: "Umbral Riesgo",
                    fill: "#f43f5e",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Scatter data={topNetwork}>
                  {topNetwork.map((entry, index) => {
                    const color =
                      entry.lectura === "RIESGO_CRITICO"
                        ? "#f43f5e"
                        : entry.lectura === "FALSA_ECO"
                        ? "#fb923c"
                        : entry.lectura === "RIESGO_SERV"
                        ? "#fbbf24"
                        : "#10b981";

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={color}
                        fillOpacity={0.8}
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  })}
                </Scatter>
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [value, name]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-wider">
            Desglose Analítico por Segmento
          </h3>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Carril</th>
                  <th className="px-4 py-3 font-bold">Promesa</th>
                  <th className="px-4 py-3 font-bold">Carrier</th>
                  <th className="px-4 py-3 font-bold text-right">Volumen</th>
                  <th className="px-4 py-3 font-bold text-right">Late Rate</th>
                  <th className="px-4 py-3 font-bold text-right">Tarifa</th>
                  <th className="px-4 py-3 font-bold text-right">CTS</th>
                  <th className="px-4 py-3 font-bold text-right">Extra</th>
                  <th className="px-4 py-3 font-bold text-center">Clasificación</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {topNetwork.map((c) => (
                  <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.carril}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{c.promesa}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{c.carrier}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">{c.vol}</td>
                    <td className="px-4 py-3 text-right font-black text-rose-600">
                      {c.lateRatePct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${c.avgCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-800">
                      ${c.cts.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-500 font-black">
                      +${c.extraCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        type={
                          c.lectura === "RIESGO_CRITICO"
                            ? "red"
                            : c.lectura === "FALSA_ECO"
                            ? "orange"
                            : c.lectura === "RIESGO_SERV"
                            ? "yellow"
                            : "green"
                        }
                      >
                        {c.lectura.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderTrends = () => (
  <div className="space-y-6">
    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
      <h2 className="text-2xl font-black tracking-tight mb-2">
        Evolución Promise & Performance
      </h2>
      <p className="text-slate-300 font-medium text-sm">
        Vista semanal calculada desde fecha_pedido. Permite monitorear el mix de promesa,
        late rate y costo promedio por paquete a través del tiempo.
      </p>
    </div>

    <Card>
      <h3 className="text-lg font-black text-slate-800 mb-1">
        Distribución porcentual de promesa de entrega
      </h3>
      <p className="text-sm font-medium text-slate-500 mb-4">
        Participación semanal por tipo de promesa.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.weeklyTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontWeight: 600, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis tick={{ fontWeight: 600, fill: "#64748b" }} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="nextDayPct" stackId="a" name="Next Day %" fill="#64748b" />
            <Bar dataKey="twoDayPct" stackId="a" name="Two Day %" fill="#94a3b8" />
            <Bar dataKey="standardPct" stackId="a" name="Standard %" fill="#cbd5e1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card>
      <h3 className="text-lg font-black text-slate-800 mb-1">
        Porcentaje semanal de entregas tardías
      </h3>
      <p className="text-sm font-medium text-slate-500 mb-4">
        Evolución semanal del late rate.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.weeklyTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontWeight: 600, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontWeight: 600, fill: "#64748b" }}
            />
            <RechartsTooltip />
            <Legend />
            <ReferenceLine y={15.44} stroke="#f43f5e" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="lateRate"
              name="Late Rate %"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <Card>
      <h3 className="text-lg font-black text-slate-800 mb-1">
        Costo promedio por paquete
      </h3>
      <p className="text-sm font-medium text-slate-500 mb-4">
        Evolución semanal de la tarifa base promedio.
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.weeklyTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontWeight: 600, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              domain={["dataMin - 1", "dataMax + 1"]}
             tick={{ fontWeight: 600, fill: "#64748b" }}
            />
            <RechartsTooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgCost"
              name="Costo promedio"
              stroke="#0f766e"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>
);

  const renderWarRoom = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black flex items-center tracking-tight mb-2">
            <Crosshair className="w-7 h-7 mr-3 text-indigo-400" /> War Room Queue
          </h2>
          <p className="text-slate-300 font-medium text-sm">
            Priorización estratégica calculada desde segmentos_mock.csv y responsables_mock.csv.
          </p>
        </div>

        <div className="hidden lg:block bg-slate-800 border border-slate-700 p-3 rounded-lg text-center">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Total P1 Activos
          </div>
          <div className="text-2xl font-black text-rose-400">
            {charts.warRoom.filter((w) => w.prioridad === "P1").length}
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b-2 border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-center">Prioridad</th>
                <th className="px-4 py-3 font-bold">Entidad</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 font-bold">Área / Dueño</th>
                <th className="px-4 py-3 font-bold text-right">Volumen</th>
                <th className="px-4 py-3 font-bold text-right">Late Rate</th>
                <th className="px-4 py-3 font-bold text-right">Score</th>
                <th className="px-4 py-3 font-bold">Acción Inicial</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {charts.warRoom.map((w) => (
                <tr
                  key={w.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    w.prioridad === "P1" ? "bg-rose-50/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <Badge
                      type={
                        w.prioridad === "P1"
                          ? "red"
                          : w.prioridad === "P2"
                          ? "orange"
                          : "slate"
                      }
                    >
                      {w.prioridad}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-800">{w.nombre}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{w.tipo}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700">{w.area}</div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {w.equipo}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-600">
                    {w.vol.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-rose-600">
                    {(w.late_rate * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-black text-indigo-900">
                    {w.score_oportunidad.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-bold text-indigo-700 text-xs max-w-xs leading-relaxed">
                    {w.accion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-indigo-500 bg-gradient-to-br from-indigo-50 to-white">
          <h4 className="flex items-center text-sm font-black text-indigo-900 uppercase tracking-wider mb-2">
            <Info className="w-5 h-5 mr-2 text-indigo-600" /> Lógica de Priorización
          </h4>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            El score ordena la cola operativa considerando volumen, late rate, impacto, controlabilidad
            y esfuerzo. Evita priorizar únicamente por porcentaje de tardías.
          </p>
        </Card>

        <Card className="border-l-4 border-rose-500 bg-gradient-to-br from-rose-50 to-white">
          <h4 className="flex items-center text-sm font-black text-rose-900 uppercase tracking-wider mb-2">
            <Lightbulb className="w-5 h-5 mr-2 text-rose-600" /> Decisión Operativa Clave
          </h4>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            Un segmento puede tener late rate alto y aun así quedar como monitoreo si su controlabilidad
            es menor o requiere mayor esfuerzo. P1 concentra los frentes más accionables.
          </p>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-indigo-100">
      <header className="bg-[#0f172a] text-white p-4 flex flex-col md:flex-row md:items-center justify-between shadow-md sticky top-0 z-20">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-lg border border-indigo-400/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              Control Tower : Promise & Speed
            </h1>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mt-0.5">
              Executive Logistics Dashboard · CSV Local
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 backdrop-blur-sm">
          <Filter className="w-4 h-4 ml-2 text-slate-400" />
          <select
            className="bg-transparent border-none text-slate-200 text-sm font-semibold rounded outline-none py-1.5 px-3 cursor-pointer focus:ring-2 focus:ring-indigo-500"
            value={filterPromesa}
            onChange={(e) => setFilterPromesa(e.target.value)}
          >
            <option value="All" className="bg-slate-800">
              Promesa (Todas)
            </option>
            <option value="Next Day" className="bg-slate-800">
              Next Day
            </option>
            <option value="Two Day" className="bg-slate-800">
              Two Day
            </option>
            <option value="Standard" className="bg-slate-800">
              Standard
            </option>
          </select>
        </div>
      </header>

      <div className="flex">
        <aside className="w-72 bg-white min-h-[calc(100vh-76px)] shadow-[1px_0_10px_rgba(0,0,0,0.03)] hidden lg:flex flex-col border-r border-slate-200/60 z-10">
          <nav className="p-5 space-y-2 flex-1">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">
              Vistas Estratégicas
            </div>

            {[
              { id: "executive", name: "Executive Overview", icon: Activity },
              { id: "trends", name: "Promise Trends", icon: TrendingUp },
              { id: "journey", name: "Journey & Bottlenecks", icon: MapPin },
              { id: "cost", name: "Network & Falsa Economía", icon: DollarSign },
              { id: "warroom", name: "War Room Queue", icon: Crosshair },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <tab.icon
                  className={`w-5 h-5 ${
                    activeTab === tab.id ? "text-indigo-600" : "text-slate-400"
                  }`}
                />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <p className="font-black text-slate-700 text-xs uppercase tracking-wider">
                  Baseline Validation
                </p>
              </div>

              <ul className="space-y-2 text-xs font-medium text-slate-500">
                {charts.byPromesa.map((d) => (
                  <li key={d.name} className="flex justify-between items-center">
                    <span className="uppercase">{d.name}</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {d.late} / {d.vol}
                    </span>
                  </li>
                ))}

                <li className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                  <span className="font-black text-slate-800 uppercase">Total LR</span>
                  <span className="font-black text-rose-600 text-sm">
                    {(kpis.lateRate * 100).toFixed(2)}%
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-[calc(100vh-76px)]">
          <div className="max-w-7xl mx-auto">
            {activeTab === "executive" && renderExecutive()}
            {activeTab === "trends" && renderTrends()}
            {activeTab === "journey" && renderJourney()}
            {activeTab === "cost" && renderCost()}
            {activeTab === "warroom" && renderWarRoom()}
          </div>
        </main>
      </div>
    </div>
  );
}