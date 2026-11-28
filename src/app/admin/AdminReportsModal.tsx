"use client";

import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  X,
  ShieldCheck,
  Building2,
  History,
  CheckCircle2,
  FileBarChart,
} from "lucide-react";

interface AdminReportsModalProps {
  totalInstitutions: number;
  totalCredentials: number;
  totalVerifications: number;
}

export function AdminReportsModal({
  totalInstitutions,
  totalCredentials,
  totalVerifications,
}: AdminReportsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<"executive_pdf" | "institutions_csv" | "audits_csv">("executive_pdf");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      let url = "/api/admin/reports";
      if (reportType === "executive_pdf") {
        url += "?format=pdf";
      } else if (reportType === "institutions_csv") {
        url += "?format=csv&scope=institutions";
      } else if (reportType === "audits_csv") {
        url += "?format=csv&scope=audits";
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("No se pudo generar el reporte");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;

      // Extraer nombre del header o asignar default
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = reportType === "executive_pdf" ? "reporte-ejecutivo-admin.pdf" : "reporte-admin.csv";
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
      alert("Error al descargar el reporte. Verifique su sesión e intente nuevamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 hover:border-teal-500/50"
      >
        <FileBarChart className="w-4 h-4 text-teal-400" />
        <span>Generar Reportes</span>
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
                  <h3 className="text-lg font-bold text-white">Generador de Reportes</h3>
                  <p className="text-xs text-slate-400">Gobernanza global, instituciones y auditoría</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones de Reportes */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecciona el tipo de informe oficial:
              </label>

              {/* Opción 1: Reporte Ejecutivo PDF */}
              <div
                onClick={() => setReportType("executive_pdf")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  reportType === "executive_pdf"
                    ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${reportType === "executive_pdf" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-teal-400"}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Reporte Ejecutivo Oficial (PDF)</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Documento formal con membrete, métricas globales, estado de verificaciones y tabla de instituciones aprobadas.
                  </p>
                </div>
              </div>

              {/* Opción 2: Base de Instituciones CSV */}
              <div
                onClick={() => setReportType("institutions_csv")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  reportType === "institutions_csv"
                    ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${reportType === "institutions_csv" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-emerald-400"}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white">Listado de Instituciones (CSV / Excel)</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Tabla de instituciones con RUC, correos, estado de validación y credenciales emitidas.
                  </p>
                </div>
              </div>

              {/* Opción 3: Registro de Auditoría CSV */}
              <div
                onClick={() => setReportType("audits_csv")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                  reportType === "audits_csv"
                    ? "border-teal-500 bg-teal-500/10 ring-1 ring-teal-500/40"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${reportType === "audits_csv" ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-amber-400"}`}>
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-white">Trazabilidad de Auditoría (CSV)</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Historial cronológico de inicios de sesión, emisiones, revocaciones y accesos al sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen de Datos que se Exportarán */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                Datos incluidos en el informe actual:
              </span>
              <div className="flex items-center justify-between text-slate-400">
                <span>Instituciones registradas:</span>
                <strong className="text-white">{totalInstitutions}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Credenciales totales:</span>
                <strong className="text-white">{totalCredentials}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Verificaciones procesadas:</span>
                <strong className="text-white">{totalVerifications}</strong>
              </div>
            </div>

            {/* Botón de Descarga */}
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
                disabled={isDownloading}
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
                    <span>Descargar {reportType === "executive_pdf" ? "PDF Oficial" : "CSV"}</span>
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
