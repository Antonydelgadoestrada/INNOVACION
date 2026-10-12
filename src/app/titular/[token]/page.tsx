import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { generateCertificatePdf } from "@/lib/pdf";
import { generateQrDataUrl, getVerificationUrl } from "@/lib/qr";
import Link from "next/link";
import {
  GraduationCap,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  Lock,
} from "lucide-react";
import { HolderDownloadButton } from "./HolderDownloadButton";

interface HolderViewPageProps {
  params: {
    token: string;
  };
}

export default async function HolderViewPage({ params }: HolderViewPageProps) {
  // Requisito RF-12: Buscar por token privado. Sin el token no se accede.
  const credential = await prisma.credential.findUnique({
    where: { recipientToken: params.token },
    include: { institution: true },
  });

  if (!credential) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Acceso Denegado</h1>
        <p className="text-xs text-slate-400">
          El token privado proporcionado no es válido o ha expirado. Comuníquese con su institución emisora.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-200"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  // Generar PDF y QR en base64 para descarga instantánea
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const dateParts = credential.issueDate.toISOString().split("T")[0].split("-");
  const formattedDate = `${dateParts[2]} de ${months[parseInt(dateParts[1], 10) - 1]} de ${dateParts[0]}`;

  const { pdfBuffer } = await generateCertificatePdf({
    id: credential.id,
    institutionName: credential.institution.name,
    recipientName: credential.recipientName,
    recipientIdMasked: credential.recipientIdMasked,
    programName: credential.programName,
    credentialType: credential.credentialType,
    issueDateFormatted: formattedDate,
    dataHash: credential.dataHash,
  });

  const pdfBase64 = pdfBuffer.toString("base64");
  const qrDataUrl = await generateQrDataUrl(credential.id);
  const verificationUrl = getVerificationUrl(credential.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-8">
      {/* Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Portal Privado del Titular (RF-12)
            </div>
            <h1 className="text-2xl font-extrabold text-white">{credential.recipientName}</h1>
            <p className="text-xs text-slate-400">
              {credential.institution.name} • {credential.recipientIdMasked}
            </p>
          </div>
        </div>

        {/* Botón de Descarga de PDF */}
        <HolderDownloadButton
          pdfBase64={pdfBase64}
          credentialId={credential.id}
          recipientName={credential.recipientName}
        />
      </div>

      {/* Certificate Preview Card */}
      <div className="glass-card rounded-3xl p-8 border border-teal-500/30 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="border-2 border-teal-500/40 rounded-2xl p-6 sm:p-10 bg-slate-900/80 text-center space-y-6">
          <div className="text-xs font-bold uppercase tracking-widest text-teal-400">
            {credential.institution.name}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide uppercase">
            {credential.credentialType}
          </h2>

          <p className="text-xs text-slate-400">Otorgado formalmente a:</p>

          <div className="text-xl sm:text-2xl font-bold text-teal-200">
            {credential.recipientName}
          </div>

          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            Por haber culminado y aprobado con éxito las exigencias académicas del programa:
          </p>

          <div className="text-lg font-bold text-white bg-slate-800/60 py-2 px-4 rounded-xl inline-block border border-slate-700">
            {credential.programName}
          </div>

          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <img
                src={qrDataUrl}
                alt="QR Verificación"
                className="w-24 h-24 p-1.5 rounded-xl bg-white mx-auto shadow-md"
              />
              <span className="text-[10px] text-teal-400 font-bold block mt-1">
                Escanear para Verificar
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] font-mono text-slate-500">
            ID: {credential.id} • Expedido: {formattedDate}
          </div>
        </div>
      </div>

      {/* Share and Verification Links */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Comparte tu Logro con Empleadores y Redes</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cualquier persona puede verificar tu certificado al instante sin necesidad de registrarse.
          </p>
        </div>

        <Link
          href={`/verificar/${credential.id}`}
          target="_blank"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-500/20 shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Ver Página de Verificación Pública</span>
        </Link>
      </div>
    </div>
  );
}
