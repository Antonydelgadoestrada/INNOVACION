import { prisma } from "@/lib/prisma";
import { generateQrDataUrl, getVerificationUrl } from "@/lib/qr";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ban,
  Share2,
} from "lucide-react";
import { RevokeButtonModal } from "./RevokeButtonModal";

interface CredentialDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CredentialDetailPage({ params }: CredentialDetailPageProps) {
  const credential = await prisma.credential.findUnique({
    where: { id: params.id },
    include: {
      institution: true,
      verificationLogs: {
        orderBy: { queriedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!credential) {
    notFound();
  }

  // Generar código QR en PNG base64 descargable (RF-06)
  const qrDataUrl = await generateQrDataUrl(credential.id);
  const verificationUrl = getVerificationUrl(credential.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 w-full space-y-6">
      <Link
        href="/institucion"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la lista de credenciales</span>
      </Link>

      {/* Header with Title and Revoke Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {credential.recipientName}
            </h1>
            {credential.status === "ACTIVE" ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVA
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                REVOCADA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {credential.programName} • Emisión: {credential.issueDate.toISOString().split("T")[0]}
          </p>
        </div>

        {/* Botón de Revocar (RF-10) */}
        {credential.status === "ACTIVE" && (
          <RevokeButtonModal
            credentialId={credential.id}
            institutionId={credential.institutionId}
            recipientName={credential.recipientName}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: QR and Downloads (RF-06) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-5 text-center flex flex-col items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <QrCode className="w-4 h-4" /> Código QR Oficial (RF-06)
          </h2>

          {/* QR Image Container */}
          <div className="p-4 rounded-2xl bg-white shadow-xl">
            <img
              src={qrDataUrl}
              alt="Código QR de Verificación"
              className="w-48 h-48 object-contain"
            />
          </div>

          <div className="text-xs text-slate-400 max-w-xs break-all">
            Enlaza a: <span className="text-teal-400 font-mono text-[11px]">{verificationUrl}</span>
          </div>

          {/* Download QR as PNG Button */}
          <a
            href={qrDataUrl}
            download={`QR-VeriChain-${credential.id}.png`}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Descargar QR (PNG)</span>
          </a>

          {/* Public Verification Link */}
          <Link
            href={`/verificar/${credential.id}`}
            target="_blank"
            className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Probar Verificación</span>
          </Link>
        </div>

        {/* Right Column: Detailed Technical & Cryptographic Data */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Detalle del Registro Académico
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Titular:</span>
                <span className="font-bold text-slate-100 text-sm">{credential.recipientName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Doc. Identidad:</span>
                <span className="font-mono text-slate-200">{credential.recipientIdMasked}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Institución Emisora:</span>
                <span className="font-bold text-slate-200">{credential.institution.name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Tipo de Credencial:</span>
                <span className="text-teal-300 font-semibold">{credential.credentialType}</span>
              </div>
            </div>

            {/* Cryptographic Hashes */}
            <div className="space-y-3 pt-2 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">UUID Público:</span>
                <span className="text-slate-200 break-all">{credential.id}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Hash de Datos SHA-256:</span>
                <span className="text-teal-400 break-all">{credential.dataHash}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Hash del Archivo PDF SHA-256:</span>
                <span className="text-slate-300 break-all">{credential.fileHash}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">Transacción en Blockchain (Tx Hash):</span>
                <span className="text-teal-300 break-all">{credential.txHash}</span>
              </div>

              {credential.status === "REVOKED" && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 space-y-1">
                  <span className="font-bold uppercase text-[11px] text-rose-300 block">Motivo de Revocación:</span>
                  <span>{credential.revokeReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Logs for this credential (RF-13) */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Historial de Verificaciones de este Documento ({credential.verificationLogs.length})
            </h3>

            {credential.verificationLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Aún no se han registrado consultas públicas para esta credencial.
              </p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {credential.verificationLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">Método: {log.method}</span>
                      <span className="text-slate-500 ml-2">IP Hash: {log.ipAnonymized}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold ${
                          log.result === "VALIDA"
                            ? "text-emerald-400"
                            : log.result === "ALTERADA"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {log.result}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(log.queriedAt).toLocaleString("es-PE")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
