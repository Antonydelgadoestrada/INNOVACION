"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileCheck2, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PdfDropzoneProps {
  onVerified?: (data: any) => void;
}

export function PdfDropzone({ onVerified }: PdfDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileProcess = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Por favor selecciona un archivo con formato .pdf válido");
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("pdfFile", file);
      formData.append("method", "PDF");

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar el archivo");
      }

      if (onVerified) {
        onVerified(data);
      } else if (data.credentialId && data.credentialId !== "N/A") {
        router.push(`/verificar/${data.credentialId}`);
      } else {
        // En caso de que no tenga ID pero haya devuelto resultado
        router.push(`/verificar?status=${data.status}`);
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar el archivo PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-teal-400 bg-teal-500/10 scale-[1.01]"
            : "border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            {isLoading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : fileName ? (
              <FileCheck2 className="w-7 h-7" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-base font-bold text-slate-100">
              {isLoading
                ? "Calculando hash SHA-256 y cotejando con Blockchain..."
                : fileName
                ? `Archivo cargado: ${fileName}`
                : "Arrastra y suelta tu certificado PDF aquí"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              O haz clic para seleccionar el archivo desde tu dispositivo
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-slate-300 font-medium">
            <span>Cálculo de integridad criptográfica SHA-256 en tiempo real</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
