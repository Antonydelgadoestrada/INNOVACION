"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  ArrowLeft,
  FileCheck2,
  QrCode,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Share2,
} from "lucide-react";

export default function IssueSingleCredentialPage() {
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [programName, setProgramName] = useState("");
  const [credentialType, setCredentialType] = useState("Certificado de Aprobación");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [institutionId, setInstitutionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedResult, setIssuedResult] = useState<any | null>(null);

  // Cargar institución aprobada por defecto
  useEffect(() => {
    fetch("/api/admin/institutions")
      .then((res) => res.json())
      .then((data) => {
        const approved = data.find((i: any) => i.status === "APPROVED");
        if (approved) setInstitutionId(approved.id);
      })
      .catch(console.error);
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId) {
      setError("No hay institución aprobada seleccionada");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/credentials/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId,
          recipientName,
          recipientId,
          recipientEmail,
          programName,
          credentialType,
          issueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al emitir credencial");
      }

      setIssuedResult(data);
    } catch (err: any) {
      setError(err.message || "Error durante el proceso de emisión");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!issuedResult?.pdfBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${issuedResult.pdfBase64}`;
    link.download = `Certificado-${issuedResult.credential.id}.pdf`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 w-full space-y-6">
      <Link
        href="/institucion"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Panel de Institución</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PlusCircle className="w-7 h-7 text-teal-400" />
            Emisión Individual de Credencial (RF-04)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Genera certificado PDF con código QR, aplica hash SHA-256, firma Ed25519 y registra en Blockchain.
          </p>
        </div>
      </div>

      {issuedResult ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/40 space-y-6 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold">¡Credencial Emitida y Registrada con Éxito!</h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                La evidencia ha sido sellada criptográficamente en el registro de Blockchain.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Datos del Titular
              </span>
              <div className="text-sm font-bold text-white">{issuedResult.credential.recipientName}</div>
              <div className="text-slate-400">Doc. Enmascarado: {issuedResult.credential.recipientIdMasked}</div>
              <div className="text-teal-400 font-semibold">{issuedResult.credential.programName}</div>
              <div className="text-slate-400">Tipo: {issuedResult.credential.credentialType}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-mono">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                Evidencia Criptográfica
              </span>
              <div className="truncate">
                <strong className="text-slate-300">UUID:</strong> {issuedResult.credential.id}
              </div>
              <div className="truncate">
                <strong className="text-slate-300">Data Hash:</strong> {issuedResult.credential.dataHash.slice(0, 24)}...
              </div>
              <div className="truncate text-teal-300">
                <strong className="text-slate-300">Tx Hash:</strong> {issuedResult.credential.txHash.slice(0, 24)}...
              </div>
            </div>
          </div>

          {/* Action buttons for newly issued credential */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={downloadPdf}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF Oficial con QR</span>
            </button>

            <Link
              href={issuedResult.credential.verificationUrl}
              target="_blank"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-teal-400" />
              <span>Verificar Públicamente</span>
            </Link>

            <Link
              href={issuedResult.credential.holderUrl}
              target="_blank"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Enlace Privado del Titular</span>
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIssuedResult(null)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Emitir otra credencial
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleIssue} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nombre Completo del Titular</label>
              <input
                type="text"
                placeholder="Ej: Sofía Elizabeth Torres Navarro"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Documento de Identidad (DNI / Carnet)</label>
              <input
                type="text"
                placeholder="Ej: 72849103"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                required
              />
              <span className="text-[10px] text-slate-400">
                Se guardará automáticamente enmascarado (RNF-02: Privacidad)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Correo Electrónico del Titular</label>
              <input
                type="email"
                placeholder="sofia.torres@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tipo de Credencial</label>
              <select
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500"
              >
                <option value="Certificado de Aprobación">Certificado de Aprobación</option>
                <option value="Diploma de Especialización">Diploma de Especialización</option>
                <option value="Constancia de Participación">Constancia de Participación</option>
                <option value="Grado Académico">Grado Académico</option>
                <option value="Título Profesional">Título Profesional</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Nombre del Programa, Curso o Diplomado</label>
              <input
                type="text"
                placeholder="Ej: Diplomado en Blockchain, Smart Contracts e Identidad Digital"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Fecha Oficial de Emisión</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF, QR, Hash y Transacción Blockchain...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Firmar y Emitir Credencial Oficial</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
