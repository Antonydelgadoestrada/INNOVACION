"use client";

import { VerificationEvidence } from "@/lib/verify";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Building,
  User,
  GraduationCap,
  Calendar,
  Fingerprint,
  FileText,
  KeyRound,
  Layers,
  Brain,
  Route,
  ShieldAlert,
  Gauge,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
  Sliders,
} from "lucide-react";
import { useState } from "react";

interface EvidenceCardProps {
  evidence: VerificationEvidence;
}

function formatDateTime(dateStr?: string | number | Date | null): string {
  if (!dateStr) return "No disponible";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    return `${day}/${month}/${year}, ${hours}:${mins}:${secs}`;
  } catch {
    return String(dateStr);
  }
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showAstarTrace, setShowAstarTrace] = useState(false);
  const [showPdfFactors, setShowPdfFactors] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Datos Académicos Permitidos (Cumpliendo Regla de Privacidad RNF-02) */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-teal-400" />
          Información Académica del Certificado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Titular de la Credencial
            </span>
            <p className="text-base font-bold text-slate-100">
              {evidence.recipientName || "No disponible"}
            </p>
            {evidence.recipientIdMasked && (
              <span className="text-xs font-mono text-slate-400 mt-0.5 inline-block">
                Doc. Identidad: {evidence.recipientIdMasked}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Building className="w-3.5 h-3.5 text-slate-400" /> Institución Emisora
            </span>
            <p className="text-base font-bold text-slate-100">
              {evidence.institutionName || "No disponible"}
            </p>
            {evidence.institutionRuc && (
              <span className="text-xs font-mono text-slate-400 mt-0.5 inline-block">
                RUC: {evidence.institutionRuc}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Programa o Título
            </span>
            <p className="text-base font-semibold text-teal-300">
              {evidence.programName || "No disponible"}
            </p>
            {evidence.credentialType && (
              <span className="text-xs text-slate-400 mt-0.5 inline-block">
                Tipo: {evidence.credentialType}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Fecha Oficial de Emisión
            </span>
            <p className="text-base font-semibold text-slate-100">
              {evidence.issueDate || "No disponible"}
            </p>
            <span suppressHydrationWarning className="text-xs text-slate-400 mt-0.5 inline-block">
              Verificado el: {formatDateTime(evidence.queriedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Evidencia Criptográfica y Estado en Blockchain (RF-09) */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Fingerprint className="w-5 h-5 text-teal-400" />
          Evidencia Criptográfica e Inmutabilidad (RF-09)
        </h3>

        <div className="space-y-3.5">
          {/* Identificador UUID */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Identificador VeriChain (UUID)
              </span>
              <button
                onClick={() => copyToClipboard(evidence.credentialId, "id")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Copiar ID"
              >
                {copiedHash === "id" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copiar</span>
              </button>
            </div>
            <p className="font-mono text-sm text-slate-200 mt-1 break-all">
              {evidence.credentialId}
            </p>
          </div>

          {/* Hash de Datos Canónicos */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" /> Hash Canónico SHA-256 (Datos)
              </span>
              <div className="flex items-center gap-2">
                {evidence.dataHashMatches ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Coincide
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    <XCircle className="w-3 h-3" /> Discrepancia
                  </span>
                )}
                {evidence.dataHashStored && (
                  <button
                    onClick={() => copyToClipboard(evidence.dataHashStored!, "dataHash")}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {copiedHash === "dataHash" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <p className="font-mono text-xs text-slate-300 mt-1 break-all">
              {evidence.dataHashStored || "No registrado"}
            </p>
          </div>

          {/* Hash de Archivo PDF */}
          {evidence.fileHashStored && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Hash SHA-256 del Archivo PDF
                </span>
                <div className="flex items-center gap-2">
                  {evidence.fileHashUploaded ? (
                    evidence.fileHashMatches ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Archivo Íntegro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        <XCircle className="w-3 h-3" /> Archivo Alterado
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">Registrado en Blockchain</span>
                  )}
                  <button
                    onClick={() => copyToClipboard(evidence.fileHashStored!, "fileHash")}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    {copiedHash === "fileHash" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="font-mono text-xs text-slate-300 mt-1 break-all">
                {evidence.fileHashStored}
              </p>
            </div>
          )}

          {/* Firma Digital Ed25519 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Firma Digital Asimétrica (Ed25519)
              </span>
              {evidence.isSignatureVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Firma Válida y Auténtica
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  <XCircle className="w-3 h-3" /> Firma No Válida
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verificada matemáticamente con la clave pública Ed25519 registrada de la institución emisora.
            </p>
          </div>

          {/* Transacción en Blockchain */}
          {evidence.txHash && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Evidencia en Blockchain (Tx Hash)
                </span>
                {evidence.explorerUrl && (
                  <a
                    href={evidence.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-teal-300 underline"
                  >
                    Ver en Explorador <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="font-mono text-xs text-teal-400/90 mt-1 break-all">
                {evidence.txHash}
              </p>
            </div>
          )}

          {/* Motivo de Revocación si aplica */}
          {evidence.isRevokedOnChain && evidence.revocationReason && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block mb-1">
                Motivo Oficial de Revocación
              </span>
              <p className="text-sm text-rose-200">
                {evidence.revocationReason}
              </p>
              {evidence.revocationDate && (
                <span suppressHydrationWarning className="text-xs text-rose-300/80 block mt-1">
                  Fecha de revocación: {formatDateTime(evidence.revocationDate)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. MÓDULO IA: Planificación Óptima de Verificación con Búsqueda A* (Capítulo 3.1 & 3.2) */}
      {evidence.aiPlannerResult && (
        <div className="glass-card rounded-2xl p-6 border border-teal-500/30 bg-slate-950/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Route className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Planificador Heurístico A* (Espacio de Problemas)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                    Capítulo III · Sec. 3.2
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ruta de ejecución óptima en costo de latencia entre el índice off-chain y el nodo RPC.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                ⚡ {evidence.aiPlannerResult.comparison.timeReductionPct}% más rápido que BFS
              </span>
            </div>
          </div>

          {/* Métricas clave de A* */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Costo Latencia A*
              </span>
              <div className="text-xl font-black text-teal-300 mt-0.5">
                {evidence.aiPlannerResult.totalCostMs} ms
              </div>
              <span className="text-[10px] text-slate-500">f(n) óptima alcanzada</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Costo Búsqueda BFS
              </span>
              <div className="text-xl font-bold text-slate-400 line-through mt-0.5">
                {evidence.aiPlannerResult.comparison.bfsCostMs} ms
              </div>
              <span className="text-[10px] text-amber-400">Ruta ingenua (3.6x más lenta)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Nodos Expandidos
              </span>
              <div className="text-xl font-black text-white mt-0.5">
                {evidence.aiPlannerResult.nodesExpanded} / 10
              </div>
              <span className="text-[10px] text-teal-400">Poda heurística activa</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Heurística h(n)
              </span>
              <div className="text-xs font-bold text-slate-200 mt-1">
                Admisible & Consistente
              </div>
              <span className="text-[10px] text-slate-500">Relajación por etapas</span>
            </div>
          </div>

          {/* Secuencia visual de la ruta encontrada */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Ruta Óptima Seleccionada ({evidence.aiPlannerResult.plannedRoute.join(" → ")})
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              {evidence.aiPlannerResult.executionSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700/80 text-xs">
                    <span className="font-mono font-bold text-teal-400 mr-1">{step.code}</span>
                    <span className="text-slate-300">{step.operator}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({step.costMs} ms)</span>
                  </div>
                  {idx < evidence.aiPlannerResult!.executionSteps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botón para ver Traza completa de expansión */}
          <div className="pt-1">
            <button
              onClick={() => setShowAstarTrace(!showAstarTrace)}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAstarTrace ? "Ocultar traza de expansión A*" : "Ver traza de expansión matemática A* (Tabla 3.4)"}</span>
            </button>

            {showAstarTrace && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 animate-fadeIn">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Paso</th>
                      <th className="py-2 px-3">Nodo Expandido</th>
                      <th className="py-2 px-3">g(n) ms</th>
                      <th className="py-2 px-3">h(n) ms</th>
                      <th className="py-2 px-3">f(n) ms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-[11px]">
                    {evidence.aiPlannerResult.trace.map((t) => (
                      <tr key={t.paso} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-slate-400">{t.paso}</td>
                        <td className="py-1.5 px-3 text-teal-300 font-bold">
                          {t.expande} – {t.nombreEstado}
                        </td>
                        <td className="py-1.5 px-3 text-slate-300">{t.gn}</td>
                        <td className="py-1.5 px-3 text-slate-300">{t.hn}</td>
                        <td className="py-1.5 px-3 text-white font-bold">{t.fn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MÓDULO IA: Clasificador de Riesgo de Adulteración en PDF (Capítulo 3.3 & 3.4) */}
      {evidence.aiPdfRisk && (
        <div className="glass-card rounded-2xl p-6 border border-indigo-500/30 bg-slate-950/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Detección de Adulteración de PDF (Machine Learning Supervisado)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono">
                    Capítulo III · Sec. 3.3
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Estimación de probabilidad de falsificación basada en 8 metadatos del archivo PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  evidence.aiPdfRisk.riskLevel === "BAJO"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : evidence.aiPdfRisk.riskLevel === "MODERADO"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                }`}
              >
                {evidence.aiPdfRisk.verdictTitle}
              </span>
            </div>
          </div>

          {/* Probabilidad e Indicador de Semáforo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Probabilidad Estimada de Adulteración
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-3xl font-black ${
                    evidence.aiPdfRisk.riskLevel === "BAJO"
                      ? "text-emerald-400"
                      : evidence.aiPdfRisk.riskLevel === "MODERADO"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {evidence.aiPdfRisk.riskPercentage}
                </span>
                <span className="text-xs text-slate-400">Riesgo {evidence.aiPdfRisk.riskLevel}</span>
              </div>

              {/* Barra de progreso visual */}
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    evidence.aiPdfRisk.riskLevel === "BAJO"
                      ? "bg-emerald-500"
                      : evidence.aiPdfRisk.riskLevel === "MODERADO"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(5, evidence.aiPdfRisk.riskScore * 100)}%` }}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Dictamen Heurístico Institucional
              </span>
              <p className="text-xs text-slate-200">
                {evidence.aiPdfRisk.verdictDescription}
              </p>
              <div className="mt-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-200">
                  <strong>Recomendación:</strong> {evidence.aiPdfRisk.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Metadatos extraídos del PDF en tiempo real */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Metadatos Extraídos del Archivo PDF en Memoria
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block">Desfase Creación-Modif.</span>
                <span className="font-bold text-slate-200">
                  {evidence.aiPdfRisk.extractedFeatures.horas_creacion_modificacion} hrs
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block">Guardados Incrementales</span>
                <span className="font-bold text-slate-200">
                  {evidence.aiPdfRisk.extractedFeatures.actualizaciones_incrementales} (startxref)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block">Productor Institucional</span>
                <span className={`font-bold ${evidence.aiPdfRisk.extractedFeatures.productor_coincide ? "text-emerald-400" : "text-rose-400"}`}>
                  {evidence.aiPdfRisk.extractedFeatures.productor_coincide ? "✓ Coincide" : "✗ No Coincide"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 block">Fuentes no oficiales</span>
                <span className="font-bold text-slate-200">
                  {evidence.aiPdfRisk.extractedFeatures.fuentes_fuera_plantilla}
                </span>
              </div>
            </div>
          </div>

          {/* Factores de explicabilidad (Odds Ratios) */}
          <div className="pt-1">
            <button
              onClick={() => setShowPdfFactors(!showPdfFactors)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showPdfFactors ? "Ocultar desglose de Odds Ratios" : "Ver explicabilidad y Odds Ratios del modelo (Sección 3.3.2)"}</span>
            </button>

            {showPdfFactors && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 animate-fadeIn">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Variable de Metadatos</th>
                      <th className="py-2 px-3">Valor Real</th>
                      <th className="py-2 px-3">Odds Ratio</th>
                      <th className="py-2 px-3">Impacto</th>
                      <th className="py-2 px-3">Explicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-[11px]">
                    {evidence.aiPdfRisk.topContributingFactors.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-semibold text-slate-200">{f.label}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{f.rawValue}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-100">{f.oddsRatio}x</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              f.contribution === "AUMENTA_RIESGO"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : f.contribution === "REDUCE_RIESGO"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {f.contribution === "AUMENTA_RIESGO"
                              ? "Aumenta Riesgo"
                              : f.contribution === "REDUCE_RIESGO"
                              ? "Protege/Reduce"
                              : "Neutro"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[10px] max-w-xs">{f.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
