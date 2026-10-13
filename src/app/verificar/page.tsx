"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrScanner } from "@/components/QrScanner";
import { PdfDropzone } from "@/components/PdfDropzone";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import { VerificationEvidence } from "@/lib/verify";
import {
  QrCode,
  FileText,
  Search,
  ShieldCheck,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

function VerifyPortalContent() {
  const [activeTab, setActiveTab] = useState<"qr" | "pdf" | "id">("qr");
  const [manualId, setManualId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidence, setEvidence] = useState<VerificationEvidence | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "NO_RECONOCIDA" && !evidence) {
      setEvidence({
        credentialId: "N/A",
        status: "NO_RECONOCIDA",
        statusColor: "gray",
        statusTitle: "NO RECONOCIDA",
        statusMessage:
          "El archivo o identificador consultado no corresponde a ninguna credencial registrada en VeriChain.",
        dataHashMatches: false,
        fileHashMatches: false,
        isSignatureVerified: false,
        isRevokedOnChain: false,
        queriedAt: new Date().toISOString(),
        method: "PDF",
      });
    }
  }, [searchParams, evidence]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setIsSubmitting(true);
    router.push(`/verificar/${manualId.trim()}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full">
      {/* Si ya tenemos el resultado de una verificación (ej. subida de PDF) */}
      {evidence ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
                Resultado Oficial de Verificación
              </span>
              <p className="text-xs text-slate-400">
                Método utilizado: <strong>{evidence.method === "PDF" ? "Archivo PDF (Hash Criptográfico)" : "Código QR"}</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setEvidence(null);
                router.replace("/verificar");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
              <span>Verificar otro documento</span>
            </button>
          </div>

          {/* Estado oficial en grande */}
          <StatusBadge status={evidence.status} size="lg" />

          {/* Desglose detallado de evidencia criptográfica y académica */}
          <EvidenceCard evidence={evidence} />
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificación Pública Gratuita • Sin Registro</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Verificar Autenticidad de Credencial
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Comprueba la validez inmutable de un certificado emitido en VeriChain
              mediante su código QR, archivo PDF o identificador UUID.
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="flex items-center justify-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto mb-8 shadow-lg">
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "qr"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Cámara QR</span>
            </button>

            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "pdf"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Subir PDF</span>
            </button>

            <button
              onClick={() => setActiveTab("id")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "id"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Por UUID</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
            {activeTab === "qr" && (
              <div className="flex flex-col items-center">
                <QrScanner />
              </div>
            )}

            {activeTab === "pdf" && (
              <div className="flex flex-col items-center">
                <PdfDropzone onVerified={(data) => setEvidence(data)} />
              </div>
            )}

            {activeTab === "id" && (
              <form onSubmit={handleManualSearch} className="max-w-lg mx-auto space-y-4">
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-lg font-bold text-white">Consulta por Identificador</h2>
                  <p className="text-xs text-slate-400">
                    Pega el UUID de la credencial (aparece en el pie de página del certificado oficial)
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ej: 11111111-1111-1111-1111-111111111111"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !manualId.trim()}
                  className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Consultando Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <span>Consultar Registro Criptográfico</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-2" />
          <p className="text-sm">Cargando portal de verificación...</p>
        </div>
      }
    >
      <VerifyPortalContent />
    </Suspense>
  );
}
