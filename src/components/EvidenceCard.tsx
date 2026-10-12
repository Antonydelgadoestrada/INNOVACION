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
} from "lucide-react";
import { useState } from "react";

interface EvidenceCardProps {
  evidence: VerificationEvidence;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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
            <span className="text-xs text-slate-400 mt-0.5 inline-block">
              Verificado el: {new Date(evidence.queriedAt).toLocaleString("es-PE")}
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
                <span className="text-xs text-rose-300/80 block mt-1">
                  Fecha de revocación: {new Date(evidence.revocationDate).toLocaleString("es-PE")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
