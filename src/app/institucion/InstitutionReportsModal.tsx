"use client";

import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileBarChart,
  Filter,
} from "lucide-react";

interface InstitutionReportsModalProps {
  institutionName: string;
  totalIssued: number;
  activeCount: number;
  revokedCount: number;
}

export function InstitutionReportsModal({
  institutionName,
  totalIssued,
  activeCount,
  revokedCount,
}: InstitutionReportsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");
  const [isDownloading, setIsDownloading] = useState(false);

  const countToExport =
    statusFilter === "ALL"
      ? totalIssued
      : statusFilter === "ACTIVE"
      ? activeCount
      : revokedCount;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = `/api/institucion/reports?format=${format}&status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("No se pudo generar el reporte");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;

      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = format === "pdf" ? "reporte-credenciales.pdf" : "reporte-credenciales.csv";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error al descargar el reporte institucional. Intente nuevamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2 hover:border-teal-500/50"
      >
        <FileBarChart className="w-4 h-4 text-teal-400" />
        <span>Generar Reporte</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-700 bg-slate-900 shadow-2xl relative space-y-6">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reporte de Emisión</h3>
                  <p className="text-xs text-slate-400">{institutionName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Formato */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Formato de exportación:</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setFormat("pdf")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    format === "pdf"
                      ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${format === "pdf" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-teal-400"}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Documento PDF</span>
                    <span className="text-[10px] text-slate-400">Formato formal membretado</span>
                  </div>
                </div>

                <div
                  onClick={() => setFormat("csv")}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    format === "csv"
                      ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${format === "csv" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-emerald-400"}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Archivo CSV</span>
                    <span className="text-[10px] text-slate-400">Compatible con Excel / ERP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtro por Estado */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>Filtrar por estado de credencial:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    statusFilter === "ALL"
                      ? "bg-teal-500 text-slate-950 border-teal-500"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Todas ({totalIssued})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    statusFilter === "ACTIVE"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500"
                      : "bg-slate-950 border-slate-800 text-emerald-400 hover:bg-emerald-950/30"
                  }`}
                >
                  Activas ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("REVOKED")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    statusFilter === "REVOKED"
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-slate-950 border-slate-800 text-rose-400 hover:bg-rose-950/30"
                  }`}
                >
                  Revocadas ({revokedCount})
                </button>
              </div>
            </div>

            {/* Resumen del Reporte */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                Resumen del contenido a exportar:
              </span>
              <div className="flex items-center justify-between text-slate-400">
                <span>Registros a incluir:</span>
                <strong className="text-white font-mono text-sm">{countToExport} certificados</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Incluye respaldo criptográfico:</span>
                <strong className="text-teal-300">Hash SHA-256 + Tx Blockchain</strong>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || countToExport === 0}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Descargar {format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
