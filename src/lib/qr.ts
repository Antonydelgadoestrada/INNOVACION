import QRCode from "qrcode";

/**
 * Módulo de Generación de Códigos QR para VeriChain
 * Cumple con la regla estricta de privacidad:
 * El QR contiene ÚNICAMENTE la URL pública de verificación:
 * https://<dominio>/verificar/<idCredencial>
 * NINGÚN dato personal se incluye dentro del código QR.
 */

export function getVerificationUrl(credentialId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/verificar/${credentialId}`;
}

/**
 * Genera el código QR en formato Data URL (imagen PNG en base64)
 * para previsualización inmediata en interfaces web.
 */
export async function generateQrDataUrl(credentialId: string): Promise<string> {
  const url = getVerificationUrl(credentialId);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H", // Alta tolerancia a errores (30%)
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a", // Azul pizarra oscuro para máxima nitidez
      light: "#ffffff",
    },
  });
}

/**
 * Genera el código QR en un Buffer binario PNG
 * para incrustar directamente en el PDF generado con pdf-lib.
 */
export async function generateQrBuffer(credentialId: string): Promise<Buffer> {
  const url = getVerificationUrl(credentialId);
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
