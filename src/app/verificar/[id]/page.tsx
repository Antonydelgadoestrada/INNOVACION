import { verifyCredential } from "@/lib/verify";
import { StatusBadge } from "@/components/StatusBadge";
import { EvidenceCard } from "@/components/EvidenceCard";
import Link from "next/link";
import { ArrowLeft, RefreshCw, QrCode } from "lucide-react";

interface VerifyResultPageProps {
  params: {
    id: string;
  };
}

export default async function VerifyResultPage({ params }: VerifyResultPageProps) {
  const credentialId = params.id;
  const evidence = await verifyCredential({
    credentialId: credentialId,
    method: "QR",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/verificar"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al portal de verificación</span>
        </Link>

        <Link
          href="/verificar"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-teal-400 hover:bg-slate-800 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Escanear otro código</span>
        </Link>
      </div>

      {/* 1. Estado en Grande con Color (RF-07) */}
      <StatusBadge status={evidence.status} size="lg" />

      {/* 2. Desglose Detallado de la Evidencia Técnica y Académica (RF-09) */}
      <EvidenceCard evidence={evidence} />

      {/* Acciones de pie de página */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          href="/verificar"
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Realizar nueva verificación</span>
        </Link>

        <Link
          href="/demo"
          className="px-6 py-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-sm font-semibold transition-all"
        >
          Ver demostración de los 4 estados
        </Link>
      </div>
    </div>
  );
}
