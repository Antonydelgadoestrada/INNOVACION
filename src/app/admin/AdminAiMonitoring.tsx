"use client";

import { useState } from "react";
import {
  Brain,
  ShieldAlert,
  Users,
  Building2,
  Clock,
  Activity,
  AlertTriangle,
  Lock,
  Key,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ClusterInfo, getKMeansDashboardAnalysis, classifyVerifierEntity } from "@/lib/ai/clustering";

export function AdminAiMonitoring() {
  const [data] = useState(() => getKMeansDashboardAnalysis());
  const [rateLimitActive, setRateLimitActive] = useState(false);
  const [captchaEnforced, setCaptchaEnforced] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

  // Simulador de nueva entidad
  const [testVol, setTestVol] = useState(450);
  const [testFailPct, setTestFailPct] = useState(35);
  const [testHour, setTestHour] = useState(3.5);
  const [testInst, setTestInst] = useState(40);
  const [testInterval, setTestInterval] = useState(2.5);
  const [simulatedResult, setSimulatedResult] = useState<any>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const res = classifyVerifierEntity({
      verificaciones_mes: Number(testVol),
      pct_no_validas: Number(testFailPct),
      hora_media_consulta: Number(testHour),
      instituciones_distintas: Number(testInst),
      intervalo_medio_min: Number(testInterval),
    });
    setSimulatedResult(res);
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 mb-1">
              Capítulo III · Sección 3.5 & 3.6
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Módulo IA: Segmentación K-Means y Detección de Anomalías
            </h2>
            <p className="text-xs text-slate-400">
              Clustering no supervisado sobre patrones de consulta de 600 verificadores (k=4, Silueta: 0.595, Inercia: 425.7).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRateLimitActive(!rateLimitActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              rateLimitActive
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Rate Limit: {rateLimitActive ? "ACTIVO (60 req/min)" : "Estándar"}</span>
          </button>

          <button
            onClick={() => setCaptchaEnforced(!captchaEnforced)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              captchaEnforced
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CAPTCHA: {captchaEnforced ? "FORZADO EN CLUSTER 1" : "Dinámico"}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Ciberseguridad Activa */}
      <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wider">
            Alerta de Detección de Anomalías: 30 Entidades en Patrón de Scraping (Cluster 1)
          </h4>
          <p className="text-xs text-rose-300/90 leading-relaxed">
            El algoritmo identificó un grupo atípico realizando más de 400 consultas mensuales con intervalos de apenas 2.9 minutos en horario de madrugada (03:48 AM) y una tasa de rechazo del 38.2%. La acción recomendada por el sistema es aplicar Rate Limit y requerir verificación humana.
          </p>
        </div>
      </div>

      {/* Tarjetas de los 4 Clusters (Tabla 3.9 del informe) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.clusters.map((c) => {
          const isSelected = selectedCluster === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCluster(isSelected ? null : c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                c.isAnomalous
                  ? "bg-rose-950/20 border-rose-500/50 hover:border-rose-400"
                  : isSelected
                  ? "bg-slate-800/80 border-indigo-400 shadow-lg"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  n = {c.n}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                {c.segmento}
              </h4>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Verificaciones/mes:</span>
                  <strong className="text-slate-100">{c.verificaciones_mes}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">% No válidas:</span>
                  <strong className={c.pct_no_validas > 20 ? "text-rose-400" : "text-slate-100"}>
                    {c.pct_no_validas}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hora media:</span>
                  <strong className="text-slate-100">{c.hora_media_consulta.toFixed(1)} hrs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inst. distintas:</span>
                  <strong className="text-slate-100">{c.instituciones_distintas}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intervalo medio:</span>
                  <strong className="text-slate-100">{c.intervalo_medio_min} min</strong>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-1">Acción VeriChain:</span>
                <p className="text-[11px] text-teal-300 leading-snug">
                  {c.accionVeriChain}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualización 2D PCA y Simulador de Clasificación en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Gráfico de Dispersión PCA */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              Proyección PCA de Verificadores (89% de Varianza Explicada)
            </h4>
            <span className="text-[10px] text-slate-400">Figura 3.5b</span>
          </div>

          <div className="relative w-full h-64 bg-slate-950/90 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
            <svg viewBox="-4 -4 8 8" className="w-full h-full p-4">
              {/* Ejes */}
              <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#334155" strokeWidth="0.04" strokeDasharray="0.1,0.1" />
              <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#334155" strokeWidth="0.04" strokeDasharray="0.1,0.1" />

              {/* Puntos de muestra */}
              {data.samplePoints.map((pt, i) => {
                const colorMap: Record<number, string> = {
                  0: "#2b6cb0",
                  1: "#c53030",
                  2: "#2f855a",
                  3: "#6b46c1",
                };
                return (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={-pt.y}
                    r={pt.cluster === 1 ? 0.09 : 0.06}
                    fill={colorMap[pt.cluster] || "#94a3b8"}
                    opacity={pt.cluster === 1 ? 0.9 : 0.6}
                  />
                );
              })}

              {/* Centroides con 'X' */}
              {data.clusters.map((c) => (
                <g key={c.id}>
                  <circle
                    cx={c.pcaCenter[0]}
                    cy={-c.pcaCenter[1]}
                    r="0.25"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="0.06"
                  />
                  <text
                    x={c.pcaCenter[0]}
                    y={-c.pcaCenter[1] + 0.08}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="0.28"
                    fontWeight="bold"
                  >
                    ✕
                  </text>
                </g>
              ))}

              {/* Punto simulado si existe */}
              {simulatedResult && (
                <g>
                  <circle
                    cx={simulatedResult.pcaCoords[0]}
                    cy={-simulatedResult.pcaCoords[1]}
                    r="0.3"
                    fill="#f59e0b"
                    opacity="0.9"
                    className="animate-pulse"
                  />
                  <text
                    x={simulatedResult.pcaCoords[0]}
                    y={-simulatedResult.pcaCoords[1] - 0.4}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="0.26"
                    fontWeight="bold"
                  >
                    NUEVA ENTIDAD
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2b6cb0]" /> Reclutadores
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f855a]" /> Ocasionales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6b46c1]" /> Académicos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c53030]" /> Scraping
            </span>
          </div>
        </div>

        {/* Simulador en Vivo de Inferencia K-Means */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Simulador de Clasificación de Entidades en Tiempo Real
            </h4>
            <span className="text-[10px] text-teal-400 font-mono">Inferencia K-Means</span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Consultas al mes:</label>
                <input
                  type="number"
                  value={testVol}
                  onChange={(e) => setTestVol(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">% Resultados No Válidos:</label>
                <input
                  type="number"
                  value={testFailPct}
                  onChange={(e) => setTestFailPct(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Hora Media de Consulta:</label>
                <input
                  type="number"
                  step="0.5"
                  value={testHour}
                  onChange={(e) => setTestHour(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Inst. Distintas:</label>
                <input
                  type="number"
                  value={testInst}
                  onChange={(e) => setTestInst(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Intervalo Medio entre Consultas (minutos):</label>
                <input
                  type="number"
                  step="0.1"
                  value={testInterval}
                  onChange={(e) => setTestInterval(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Ejecutar Clasificación K-Means sobre Entidad</span>
            </button>
          </form>

          {simulatedResult && (
            <div className={`p-3.5 rounded-xl border animate-fadeIn text-xs ${
              simulatedResult.cluster.isAnomalous
                ? "bg-rose-950/40 border-rose-500/50"
                : "bg-slate-800/80 border-teal-500/40"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-300">Cluster Asignado:</span>
                <span
                  className="px-2 py-0.5 rounded font-black uppercase text-[11px]"
                  style={{ backgroundColor: `${simulatedResult.cluster.color}40`, color: simulatedResult.cluster.color }}
                >
                  {simulatedResult.cluster.segmento}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                <strong>Acción del Sistema:</strong> {simulatedResult.cluster.accionVeriChain}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
