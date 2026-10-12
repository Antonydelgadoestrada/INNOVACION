import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { generateQrBuffer } from "./qr";
import { calculateSha256 } from "./crypto";

export interface CertificatePdfData {
  id: string;                 // UUID de la credencial
  institutionName: string;    // Nombre de la institución emisora
  recipientName: string;      // Nombre del titular
  recipientIdMasked: string;  // Documento enmascarado
  programName: string;        // Nombre del programa o curso
  credentialType: string;     // Certificado, Diploma, etc.
  issueDateFormatted: string; // Fecha en texto legible (ej: 12 de Octubre de 2026)
  dataHash: string;           // Hash de datos canónicos
}

/**
 * Genera el documento PDF oficial del certificado con:
 * - Diseño académico premium (orientación horizontal)
 * - Bordes dobles ornamentales de seguridad
 * - Tipografía jerarquizada
 * - Código QR de verificación incrustado en alta resolución
 * - Huella de seguridad VeriChain en el pie de página
 *
 * Devuelve el buffer binario del PDF y su hash SHA-256 (fileHash).
 */
export async function generateCertificatePdf(
  data: CertificatePdfData
): Promise<{ pdfBuffer: Buffer; fileHash: string }> {
  // Crear documento PDF en formato horizontal (Landscape Letter: 792 x 612 pt)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([792, 612]);
  const { width, height } = page.getSize();

  // Cargar fuentes estándar
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Paleta de colores profesionales VeriChain
  const primaryTeal = rgb(0.05, 0.58, 0.53);   // #0d9488
  const darkNavy = rgb(0.06, 0.09, 0.16);     // #0f172a
  const slateMuted = rgb(0.39, 0.45, 0.55);   // #64748b
  const goldAccent = rgb(0.85, 0.65, 0.13);   // Dorado sutil para borde

  // 1. Marco exterior de seguridad
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: primaryTeal,
    borderWidth: 3,
  });

  // 2. Marco interior ornamental
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: goldAccent,
    borderWidth: 1,
  });

  // 3. Encabezado de la Institución
  const instNameUpper = data.institutionName.toUpperCase();
  const instWidth = fontBold.widthOfTextAtSize(instNameUpper, 16);
  page.drawText(instNameUpper, {
    x: (width - instWidth) / 2,
    y: height - 70,
    size: 16,
    font: fontBold,
    color: primaryTeal,
  });

  // Subtítulo oficial
  const docType = (data.credentialType || "CERTIFICADO ACADÉMICO").toUpperCase();
  const docTypeWidth = fontBold.widthOfTextAtSize(docType, 26);
  page.drawText(docType, {
    x: (width - docTypeWidth) / 2,
    y: height - 110,
    size: 26,
    font: fontBold,
    color: darkNavy,
  });

  // Línea decorativa dorada
  page.drawLine({
    start: { x: (width - 240) / 2, y: height - 125 },
    end: { x: (width + 240) / 2, y: height - 125 },
    thickness: 2,
    color: goldAccent,
  });

  // Texto de concesión
  const otorgadoText = "Por cuanto se certifica y reconoce formalmente a:";
  const otorgadoWidth = fontRegular.widthOfTextAtSize(otorgadoText, 12);
  page.drawText(otorgadoText, {
    x: (width - otorgadoWidth) / 2,
    y: height - 160,
    size: 12,
    font: fontRegular,
    color: slateMuted,
  });

  // Nombre del Titular (Destacado)
  const recipientName = data.recipientName.toUpperCase();
  const recipientWidth = fontBold.widthOfTextAtSize(recipientName, 24);
  page.drawText(recipientName, {
    x: (width - recipientWidth) / 2,
    y: height - 200,
    size: 24,
    font: fontBold,
    color: darkNavy,
  });

  // Documento enmascarado
  const docIdText = `Documento de Identidad: ${data.recipientIdMasked}`;
  const docIdWidth = fontRegular.widthOfTextAtSize(docIdText, 11);
  page.drawText(docIdText, {
    x: (width - docIdWidth) / 2,
    y: height - 222,
    size: 11,
    font: fontRegular,
    color: slateMuted,
  });

  // Texto explicativo del programa académico
  const bodyText =
    "Por haber cursado, sustentado y aprobado satisfactoriamente todos los requisitos académicos del programa:";
  const bodyWidth = fontRegular.widthOfTextAtSize(bodyText, 12);
  page.drawText(bodyText, {
    x: (width - bodyWidth) / 2,
    y: height - 260,
    size: 12,
    font: fontRegular,
    color: slateMuted,
  });

  // Nombre del Programa (Especialización, Carrera, Curso)
  const progWidth = fontBold.widthOfTextAtSize(data.programName, 18);
  page.drawText(data.programName, {
    x: (width - progWidth) / 2,
    y: height - 295,
    size: 18,
    font: fontBold,
    color: primaryTeal,
  });

  // Fecha y emisión
  const dateText = `Expedido en la ciudad de Lima, Perú, con fecha: ${data.issueDateFormatted}`;
  const dateWidth = fontOblique.widthOfTextAtSize(dateText, 11);
  page.drawText(dateText, {
    x: (width - dateWidth) / 2,
    y: height - 335,
    size: 11,
    font: fontOblique,
    color: darkNavy,
  });

  // Firmas institucionales (representación formal)
  const signY = 145;
  // Firma 1: Rector / Director
  page.drawLine({
    start: { x: 100, y: signY },
    end: { x: 280, y: signY },
    thickness: 1,
    color: slateMuted,
  });
  page.drawText("Dirección Académica", {
    x: 140,
    y: signY - 15,
    size: 10,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText(data.institutionName, {
    x: 120,
    y: signY - 28,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });

  // Firma 2: Secretaría General
  page.drawLine({
    start: { x: 330, y: signY },
    end: { x: 510, y: signY },
    thickness: 1,
    color: slateMuted,
  });
  page.drawText("Secretaría General", {
    x: 375,
    y: signY - 15,
    size: 10,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText("Registro de Grados y Títulos", {
    x: 355,
    y: signY - 28,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });

  // 4. Incrustar Código QR de Verificación
  const qrPngBuffer = await generateQrBuffer(data.id);
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const qrSize = 95;
  const qrX = width - 200;
  const qrY = 85;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("ESCANEE PARA VERIFICAR", {
    x: qrX - 5,
    y: qrY - 12,
    size: 7.5,
    font: fontBold,
    color: primaryTeal,
  });
  page.drawText("Evidencia inmutable en Blockchain", {
    x: qrX - 12,
    y: qrY - 22,
    size: 7,
    font: fontRegular,
    color: slateMuted,
  });

  // 5. Pie de página de Seguridad Criptográfica VeriChain
  const footerBoxY = 38;
  page.drawText(`VERICHAIN ID: ${data.id}`, {
    x: 50,
    y: footerBoxY + 12,
    size: 8,
    font: fontBold,
    color: darkNavy,
  });
  page.drawText(`DATA HASH SHA-256: ${data.dataHash.slice(0, 32)}...${data.dataHash.slice(-8)}`, {
    x: 50,
    y: footerBoxY,
    size: 7,
    font: fontRegular,
    color: slateMuted,
  });

  // Guardar PDF como Buffer
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Calcular el hash SHA-256 del archivo PDF final generado
  const fileHash = calculateSha256(pdfBuffer);

  return {
    pdfBuffer,
    fileHash,
  };
}
