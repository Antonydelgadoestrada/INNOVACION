"use client";

import { useState } from "react";
import { DEMO_IDS } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { VerificationEvidence } from "@/lib/verify";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DemoLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>("VALIDA");
  const [evidence, setEvidence] = useState<VerificationEvidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const runVerification = async (scenarioKey: keyof typeof DEMO_IDS) => {
    setSelectedScenario(scenarioKey);
    setIsLoading(true);
    setEvidence(null);

    const credentialId = DEMO_IDS[scenarioKey];
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId, method: "QR" }),
      });

      const data = await res.json();
      setEvidence(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetScenarios = async () => {
    setIsResetting(true);
    try {
      await fetch("/api/demo/seed", { method: "POST" });
      await runVerification(selectedScenario as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Laboratorio de Pruebas • Requisito RF-16</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Demostración de los 4 Estados Criptográficos
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Prueba de forma inmediata los 4 escenarios de validación exigidos para la sustentación.
          </p>
        </div>

        <button
          onClick={handleResetScenarios}
          disabled={isResetting}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all self-start"
        >
          {isResetting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
          )}
          <span>Restablecer Escenarios</span>
        </button>
      </div>

      {/* 4 Scenario Cards Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scenario 1: VÁLIDA */}
        <div
          onClick={() => runVerification("VALIDA")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            selectedScenario === "VALIDA"
              ? "bg-emerald-950/70 border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm">1. VÁLIDA</h3>
          </div>
          <p className="text-xs text-slate-300">
            Certificado auténtico. Hash de datos y archivo coinciden, firma Ed25519 íntegra y registrada en Blockchain.
          </p>
          <div className="mt-3 text-[10px] font-mono text-emerald-400/80">
            ID: {DEMO_IDS.VALIDA.slice(0, 18)}...
          </div>
        </div>

        {/* Scenario 2: ALTERADA */}
        <div
          onClick={() => runVerification("ALTERADA")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            selectedScenario === "ALTERADA"
              ? "bg-amber-950/70 border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm">2. ALTERADA</h3>
          </div>
          <p className="text-xs text-slate-300">
            Documento adulterado. El hash calculado no concuerda con la huella inmutable guardada en Blockchain.
          </p>
          <div className="mt-3 text-[10px] font-mono text-amber-400/80">
            ID: {DEMO_IDS.ALTERADA.slice(0, 18)}...
          </div>
        </div>

        {/* Scenario 3: REVOCADA */}
        <div
          onClick={() => runVerification("REVOCADA")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            selectedScenario === "REVOCADA"
              ? "bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <XCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm">3. REVOCADA</h3>
          </div>
          <p className="text-xs text-slate-300">
            Credencial anulada formalmente con motivo y fecha registrada en el contrato inteligente.
          </p>
          <div className="mt-3 text-[10px] font-mono text-rose-400/80">
            ID: {DEMO_IDS.REVOCADA.slice(0, 18)}...
          </div>
        </div>

        {/* Scenario 4: NO RECONOCIDA */}
        <div
          onClick={() => runVerification("NO_RECONOCIDA")}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            selectedScenario === "NO_RECONOCIDA"
              ? "bg-slate-800 border-slate-400 shadow-lg shadow-slate-500/20 scale-[1.02]"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-600"
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <HelpCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm">4. NO RECONOCIDA</h3>
          </div>
          <p className="text-xs text-slate-300">
            Identificador inexistente o código QR que no pertenece a ninguna credencial registrada en VeriChain.
          </p>
          <div className="mt-3 text-[10px] font-mono text-slate-400">
            ID: {DEMO_IDS.NO_RECONOCIDA.slice(0, 18)}...
          </div>
        </div>
      </div>

      {/* Verification Output Area */}
      {isLoading ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm font-semibold text-slate-200">
            Ejecutando motor de verificación criptográfica...
          </p>
        </div>
      ) : evidence ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Resultado en vivo para: <strong className="text-teal-400">{selectedScenario}</strong>
            </span>
            <Link
              href={`/verificar/${evidence.credentialId}`}
              className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              Ver página de resultado pública <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <StatusBadge status={evidence.status} size="lg" />
          <EvidenceCard evidence={evidence} />
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-sm text-slate-400">
          Selecciona cualquiera de las 4 tarjetas superiores para ejecutar la verificación interactiva.
        </div>
      )}
    </div>
  );
}
