"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ArrowLeft,
  Download,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function BulkIssuePage() {
  const [file, setFile] = useState<File | null>(null);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/institutions")
      .then((res) => res.json())
      .then((data) => {
        const approved = data.find((i: any) => i.status === "APPROVED");
        if (approved) setInstitutionId(approved.id);
      })
      .catch(console.error);
  }, []);

  const handleDownloadTemplate = () => {
    const csvContent =
      "recipientName,recipientId,recipientEmail,programName,credentialType,issueDate\n" +
      "María Elena Gómez Flores,71928301,maria.gomez@gmail.com,Especialización en Ciberseguridad,Certificado de Aprobación,2026-10-12\n" +
      "Jorge Luis Ramos Huamán,45920182,jorge.ramos@gmail.com,Diplomado en Gestión Pública Digital,Diploma,2026-10-12\n" +
      "Fila Inválida Sin Correo,12345678,correo-invalido,Curso de Innovación,Certificado,2026-10-12\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_emision_masiva_verichain.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor selecciona un archivo CSV");
      return;
    }
    if (!institutionId) {
      setError("No hay institución aprobada seleccionada");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("institutionId", institutionId);
      formData.append("csvFile", file);

      const res = await fetch("/api/credentials/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar emisión masiva");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo CSV");
    } finally {
      setIsLoading(false);
    }
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-teal-400" />
            Emisión Masiva por Archivo CSV (RF-05)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Carga un archivo con múltiples titulares para emitir y registrar en Blockchain de forma simultánea.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Plantilla CSV</span>
        </button>
      </div>

      {result ? (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl animate-fadeIn">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Filas Procesadas</span>
              <div className="text-2xl font-bold text-white">{result.totalRows}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30">
              <span className="text-xs text-emerald-300 block mb-1">Exitosas</span>
              <div className="text-2xl font-bold text-emerald-400">{result.successCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30">
              <span className="text-xs text-rose-300 block mb-1">Con Errores</span>
              <div className="text-2xl font-bold text-rose-400">{result.errorCount}</div>
            </div>
          </div>

          {/* Reporte de filas con error (Criterio de Aceptación RF-05) */}
          {result.errors && result.errors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2">
              <h3 className="text-xs font-bold uppercase text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Detalle de Filas con Error
              </h3>
              <div className="divide-y divide-rose-500/20 text-xs">
                {result.errors.map((errItem: any, idx: number) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-semibold text-rose-200">
                      Fila #{errItem.row}: {errItem.recipient}
                    </span>
                    <span className="text-rose-300/80">{errItem.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listado de emitidas exitosamente */}
          {result.successes && result.successes.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Credenciales Emitidas Satisfactoriamente
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                {result.successes.map((s: any) => (
                  <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-100">{s.recipientName}</span>
                      <span className="text-slate-400 ml-2">({s.recipientIdMasked}) - {s.programName}</span>
                    </div>
                    <Link
                      href={`/verificar/${s.id}`}
                      target="_blank"
                      className="text-teal-400 hover:underline font-semibold"
                    >
                      Verificar →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => setResult(null)}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Cargar otro archivo CSV
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpload} className="glass-card rounded-3xl p-8 border border-slate-800 space-y-6 shadow-xl">
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-900/60 hover:border-teal-500 transition-all">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
              id="csvFileInput"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-100">
                {file ? file.name : "Selecciona o arrastra el archivo CSV aquí"}
              </p>
              <p className="text-xs text-slate-400">
                Columnas requeridas: recipientName, recipientId, recipientEmail, programName, credentialType, issueDate
              </p>
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando emisión masiva en lote...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Iniciar Emisión Masiva</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
