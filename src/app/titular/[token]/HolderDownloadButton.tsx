"use client";

import { Download } from "lucide-react";

interface HolderDownloadButtonProps {
  pdfBase64: string;
  credentialId: string;
  recipientName: string;
}

export function HolderDownloadButton({
  pdfBase64,
  credentialId,
  recipientName,
}: HolderDownloadButtonProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${pdfBase64}`;
    link.download = `Certificado_${recipientName.replace(/\s+/g, "_")}.pdf`;
    link.click();
  };

  return (
    <button
      onClick={handleDownload}
      className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-500/25 transition-all self-start sm:self-auto"
    >
      <Download className="w-4 h-4" />
      <span>Descargar PDF Oficial con QR</span>
    </button>
  );
}
