import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Papa from "papaparse";

export interface AdminReportData {
  generatedAt: string;
  totalInstitutions: number;
  approvedInstitutions: number;
  pendingInstitutions: number;
  suspendedInstitutions: number;
  totalCredentials: number;
  totalVerifications: number;
  validVerifications: number;
  alteredVerifications: number;
  revokedVerifications: number;
  unrecognizedVerifications: number;
  institutions: Array<{
    name: string;
    ruc: string;
    email: string;
    status: string;
    credentialsCount: number;
    createdAt: string;
  }>;
  auditLogs: Array<{
    user: string;
    role: string;
    action: string;
    detail: string;
    timestamp: string;
  }>;
}

export interface InstitutionReportData {
  institutionName: string;
  institutionRuc: string;
  institutionEmail: string;
  institutionStatus: string;
  generatedAt: string;
  totalIssued: number;
  activeCount: number;
  revokedCount: number;
  totalVerifications: number;
  credentials: Array<{
    id: string;
    recipientName: string;
    recipientIdMasked: string;
    recipientEmail: string;
    programName: string;
    credentialType: string;
    issueDate: string;
    status: string;
    revokeReason?: string | null;
    dataHash: string;
    txHash?: string | null;
  }>;
}

// Colores institucionales
const primaryTeal = rgb(0.05, 0.58, 0.53);   // #0d9488
const darkNavy = rgb(0.06, 0.09, 0.16);     // #0f172a
const slateMuted = rgb(0.39, 0.45, 0.55);   // #64748b
const lightBg = rgb(0.95, 0.96, 0.98);      // #f1f5f9
const borderGray = rgb(0.85, 0.88, 0.92);   // #e2e8f0
const emeraldText = rgb(0.06, 0.55, 0.35);  // #0f766e
const amberText = rgb(0.75, 0.45, 0.05);    // #b45309
const roseText = rgb(0.75, 0.15, 0.25);     // #be123c

/**
 * Genera el documento PDF formal del Reporte Ejecutivo del Administrador
 */
export async function generateAdminPdfReport(data: AdminReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("VeriChain - Reporte Ejecutivo de Gobernanza y Auditoría");
  pdfDoc.setAuthor("VeriChain Administration System");
  pdfDoc.setSubject("Métricas globales, instituciones y seguridad criptográfica");

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();
  let currentY = height - 50;

  const drawHeader = (currentPage: any, pageNum: number) => {
    // Barra superior decorativa
    currentPage.drawRectangle({
      x: 40,
      y: height - 35,
      width: width - 80,
      height: 4,
      color: primaryTeal,
    });

    currentPage.drawText("VERICHAIN • PLATAFORMA DE CREDENCIALES BLOCKCHAIN", {
      x: 40,
      y: height - 50,
      size: 9,
      font: fontBold,
      color: primaryTeal,
    });

    currentPage.drawText(`Página ${pageNum}`, {
      x: width - 85,
      y: height - 50,
      size: 8,
      font: fontRegular,
      color: slateMuted,
    });
  };

  let pageIndex = 1;
  drawHeader(page, pageIndex);
  currentY -= 35;

  // Título del reporte
  page.drawText("REPORTE EJECUTIVO DE GOBERNANZA Y AUDITORÍA", {
    x: 40,
    y: currentY,
    size: 16,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 16;

  page.drawText(`Generado el: ${data.generatedAt} | Nivel de Acceso: ADMINISTRADOR GENERAL`, {
    x: 40,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });
  currentY -= 25;

  // Resumen de Métricas Globales (4 Cajas)
  const boxWidth = (width - 80 - 18) / 4;
  const metrics = [
    { label: "INSTITUCIONES", val: `${data.totalInstitutions}`, sub: `${data.approvedInstitutions} aprobadas` },
    { label: "CREDENCIALES", val: `${data.totalCredentials}`, sub: "En Blockchain" },
    { label: "VERIFICACIONES", val: `${data.totalVerifications}`, sub: "Consultas globales" },
    { label: "INTEGRIDAD", val: `${data.validVerifications}`, sub: `${data.alteredVerifications} alteradas / riesgo` },
  ];

  metrics.forEach((m, idx) => {
    const x = 40 + idx * (boxWidth + 6);
    page.drawRectangle({
      x,
      y: currentY - 50,
      width: boxWidth,
      height: 50,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText(m.label, {
      x: x + 8,
      y: currentY - 14,
      size: 7,
      font: fontBold,
      color: slateMuted,
    });

    page.drawText(m.val, {
      x: x + 8,
      y: currentY - 32,
      size: 14,
      font: fontBold,
      color: primaryTeal,
    });

    page.drawText(m.sub, {
      x: x + 8,
      y: currentY - 45,
      size: 6.5,
      font: fontRegular,
      color: slateMuted,
    });
  });

  currentY -= 70;

  // Desglose de Verificaciones
  page.drawText("1. ESTADO DE VERIFICACIONES PÚBLICAS Y SEGURIDAD", {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 18;

  const verifStats = [
    { name: "Válidas (Firma Ed25519 y Hash Verificados)", count: data.validVerifications, color: emeraldText },
    { name: "Alteradas (Adulteración detectada / Hash no coincide)", count: data.alteredVerifications, color: amberText },
    { name: "Revocadas (Anuladas en Blockchain por Institución)", count: data.revokedVerifications, color: roseText },
    { name: "No Reconocidas (Identificador no existente / Formato inválido)", count: data.unrecognizedVerifications, color: slateMuted },
  ];

  verifStats.forEach((v) => {
    page.drawText(`•  ${v.name}:`, {
      x: 50,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkNavy,
    });
    page.drawText(`${v.count} consultas`, {
      x: 450,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: v.color,
    });
    currentY -= 14;
  });

  currentY -= 15;

  // 2. Tabla de Instituciones Registradas
  page.drawText("2. REGISTRO Y ESTADO DE INSTITUCIONES EDUCATIVAS", {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 18;

  // Cabecera tabla instituciones
  page.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: width - 80,
    height: 18,
    color: darkNavy,
  });

  page.drawText("INSTITUCIÓN", { x: 48, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("RUC", { x: 230, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("ESTADO", { x: 310, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("EMITIDAS", { x: 380, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("FECHA REGISTRO", { x: 440, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  currentY -= 22;

  // Filas instituciones
  for (const inst of data.institutions) {
    if (currentY < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      pageIndex++;
      drawHeader(page, pageIndex);
      currentY = height - 80;
    }

    const shortName = inst.name.length > 32 ? inst.name.slice(0, 30) + "..." : inst.name;
    page.drawText(shortName, { x: 48, y: currentY, size: 8, font: fontRegular, color: darkNavy });
    page.drawText(inst.ruc, { x: 230, y: currentY, size: 8, font: fontRegular, color: darkNavy });
    
    const statusColor = inst.status === "APPROVED" ? emeraldText : inst.status === "PENDING" ? amberText : roseText;
    page.drawText(inst.status, { x: 310, y: currentY, size: 7.5, font: fontBold, color: statusColor });
    page.drawText(`${inst.credentialsCount}`, { x: 395, y: currentY, size: 8, font: fontBold, color: primaryTeal });
    page.drawText(inst.createdAt.split("T")[0] || inst.createdAt, { x: 440, y: currentY, size: 7.5, font: fontRegular, color: slateMuted });

    // Línea divisoria
    page.drawLine({
      start: { x: 40, y: currentY - 4 },
      end: { x: width - 40, y: currentY - 4 },
      thickness: 0.5,
      color: borderGray,
    });

    currentY -= 16;
  }

  currentY -= 15;

  // 3. Tabla de Logs de Auditoría
  if (currentY < 120) {
    page = pdfDoc.addPage([595.28, 841.89]);
    pageIndex++;
    drawHeader(page, pageIndex);
    currentY = height - 80;
  }

  page.drawText("3. TRAZABILIDAD Y REGISTRO DE AUDITORÍA RECIENTE (RF-15)", {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 18;

  // Cabecera tabla auditoría
  page.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: width - 80,
    height: 18,
    color: darkNavy,
  });

  page.drawText("FECHA / HORA", { x: 48, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("USUARIO", { x: 140, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("ACCIÓN", { x: 270, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("DETALLE DE OPERACIÓN", { x: 340, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  currentY -= 22;

  for (const log of data.auditLogs.slice(0, 15)) {
    if (currentY < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      pageIndex++;
      drawHeader(page, pageIndex);
      currentY = height - 80;
    }

    const shortDate = log.timestamp.split("T")[0] + " " + (log.timestamp.split("T")[1]?.slice(0, 5) || "");
    const shortUser = log.user.length > 22 ? log.user.slice(0, 20) + "..." : log.user;
    const shortDetail = log.detail.length > 38 ? log.detail.slice(0, 36) + "..." : log.detail;

    page.drawText(shortDate, { x: 48, y: currentY, size: 7, font: fontRegular, color: slateMuted });
    page.drawText(shortUser, { x: 140, y: currentY, size: 7.5, font: fontRegular, color: darkNavy });
    page.drawText(log.action, { x: 270, y: currentY, size: 7.5, font: fontBold, color: primaryTeal });
    page.drawText(shortDetail, { x: 340, y: currentY, size: 7.5, font: fontRegular, color: darkNavy });

    page.drawLine({
      start: { x: 40, y: currentY - 4 },
      end: { x: width - 40, y: currentY - 4 },
      thickness: 0.5,
      color: borderGray,
    });

    currentY -= 15;
  }

  // Pie de página de cierre
  if (currentY < 40) {
    page = pdfDoc.addPage([595.28, 841.89]);
    pageIndex++;
    drawHeader(page, pageIndex);
    currentY = height - 80;
  }

  page.drawText("Documento oficial generado por la Plataforma VeriChain • Firma Digital Ed25519 y Evidencia en Blockchain", {
    x: 40,
    y: 30,
    size: 7,
    font: fontOblique,
    color: slateMuted,
  });

  return await pdfDoc.save();
}

/**
 * Genera el documento PDF formal del Reporte Institucional de Credenciales
 */
export async function generateInstitutionPdfReport(data: InstitutionReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Reporte de Credenciales - ${data.institutionName}`);
  pdfDoc.setAuthor(data.institutionName);
  pdfDoc.setSubject("Reporte oficial de credenciales emitidas con respaldo en Blockchain");

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
  const { width, height } = page.getSize();
  let currentY = height - 50;

  const drawHeader = (currentPage: any, pageNum: number) => {
    currentPage.drawRectangle({
      x: 40,
      y: height - 35,
      width: width - 80,
      height: 4,
      color: primaryTeal,
    });

    currentPage.drawText(`${data.institutionName.toUpperCase()} • SISTEMA VERICHAIN`, {
      x: 40,
      y: height - 50,
      size: 9,
      font: fontBold,
      color: primaryTeal,
    });

    currentPage.drawText(`Página ${pageNum}`, {
      x: width - 85,
      y: height - 50,
      size: 8,
      font: fontRegular,
      color: slateMuted,
    });
  };

  let pageIndex = 1;
  drawHeader(page, pageIndex);
  currentY -= 35;

  // Encabezado institucional
  page.drawText("REPORTE OFICIAL DE EMISIÓN DE CREDENCIALES DIGITALES", {
    x: 40,
    y: currentY,
    size: 15,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 18;

  page.drawText(`Institución: ${data.institutionName} | RUC: ${data.institutionRuc} | Contacto: ${data.institutionEmail}`, {
    x: 40,
    y: currentY,
    size: 8.5,
    font: fontRegular,
    color: darkNavy,
  });
  currentY -= 14;

  page.drawText(`Fecha del informe: ${data.generatedAt} | Estado Institucional: ${data.institutionStatus}`, {
    x: 40,
    y: currentY,
    size: 8,
    font: fontRegular,
    color: slateMuted,
  });
  currentY -= 25;

  // Cajas de Estadísticas (4 Cajas)
  const boxWidth = (width - 80 - 18) / 4;
  const metrics = [
    { label: "TOTAL EMITIDAS", val: `${data.totalIssued}`, sub: "Registradas" },
    { label: "ACTIVAS / VÁLIDAS", val: `${data.activeCount}`, sub: "En regla" },
    { label: "REVOCADAS", val: `${data.revokedCount}`, sub: "Anuladas" },
    { label: "VERIFICACIONES", val: `${data.totalVerifications}`, sub: "Consultas públicas" },
  ];

  metrics.forEach((m, idx) => {
    const x = 40 + idx * (boxWidth + 6);
    page.drawRectangle({
      x,
      y: currentY - 50,
      width: boxWidth,
      height: 50,
      color: lightBg,
      borderColor: borderGray,
      borderWidth: 1,
    });

    page.drawText(m.label, {
      x: x + 8,
      y: currentY - 14,
      size: 7,
      font: fontBold,
      color: slateMuted,
    });

    page.drawText(m.val, {
      x: x + 8,
      y: currentY - 32,
      size: 14,
      font: fontBold,
      color: primaryTeal,
    });

    page.drawText(m.sub, {
      x: x + 8,
      y: currentY - 45,
      size: 6.5,
      font: fontRegular,
      color: slateMuted,
    });
  });

  currentY -= 75;

  // Título de la tabla
  page.drawText("LISTADO DETALLADO DE CERTIFICADOS Y GRADOS EMITIDOS", {
    x: 40,
    y: currentY,
    size: 11,
    font: fontBold,
    color: darkNavy,
  });
  currentY -= 18;

  // Cabecera tabla credenciales
  page.drawRectangle({
    x: 40,
    y: currentY - 16,
    width: width - 80,
    height: 18,
    color: darkNavy,
  });

  page.drawText("TITULAR / DNI", { x: 48, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("PROGRAMA O TÍTULO", { x: 175, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("TIPO", { x: 330, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("FECHA EMISIÓN", { x: 395, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("ESTADO", { x: 470, y: currentY - 12, size: 7.5, font: fontBold, color: rgb(1, 1, 1) });
  currentY -= 22;

  if (data.credentials.length === 0) {
    page.drawText("No se encontraron credenciales emitidas con los filtros seleccionados.", {
      x: 48,
      y: currentY,
      size: 9,
      font: fontOblique,
      color: slateMuted,
    });
    currentY -= 20;
  }

  for (const cred of data.credentials) {
    if (currentY < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      pageIndex++;
      drawHeader(page, pageIndex);
      currentY = height - 80;
    }

    const shortRecipient = cred.recipientName.length > 24 ? cred.recipientName.slice(0, 22) + ".." : cred.recipientName;
    const shortProgram = cred.programName.length > 28 ? cred.programName.slice(0, 26) + ".." : cred.programName;
    const statusColor = cred.status === "ACTIVE" ? emeraldText : roseText;
    const statusLabel = cred.status === "ACTIVE" ? "ACTIVA" : "REVOCADA";

    page.drawText(shortRecipient, { x: 48, y: currentY, size: 7.5, font: fontBold, color: darkNavy });
    page.drawText(cred.recipientIdMasked, { x: 48, y: currentY - 9, size: 6.5, font: fontRegular, color: slateMuted });

    page.drawText(shortProgram, { x: 175, y: currentY, size: 7.5, font: fontRegular, color: darkNavy });
    page.drawText(cred.credentialType, { x: 330, y: currentY, size: 7.5, font: fontRegular, color: slateMuted });
    page.drawText(cred.issueDate, { x: 395, y: currentY, size: 7.5, font: fontRegular, color: slateMuted });
    page.drawText(statusLabel, { x: 470, y: currentY, size: 7.5, font: fontBold, color: statusColor });

    // Línea divisoria
    page.drawLine({
      start: { x: 40, y: currentY - 13 },
      end: { x: width - 40, y: currentY - 13 },
      thickness: 0.5,
      color: borderGray,
    });

    currentY -= 24;
  }

  // Footer
  page.drawText("Certificado y verificado criptográficamente mediante Blockchain y firmas digitales Ed25519.", {
    x: 40,
    y: 30,
    size: 7,
    font: fontOblique,
    color: slateMuted,
  });

  return await pdfDoc.save();
}

/**
 * Genera el CSV para el Administrador
 */
export function generateAdminCsvReport(data: AdminReportData, scope: "institutions" | "audits" | "general"): string {
  if (scope === "institutions") {
    return Papa.unparse(
      data.institutions.map((i) => ({
        RUC: i.ruc,
        Nombre: i.name,
        Correo: i.email,
        Estado: i.status,
        Credenciales_Emitidas: i.credentialsCount,
        Fecha_Registro: i.createdAt,
      }))
    );
  }

  if (scope === "audits") {
    return Papa.unparse(
      data.auditLogs.map((l) => ({
        Fecha: l.timestamp,
        Usuario: l.user,
        Rol: l.role,
        Accion: l.action,
        Detalle: l.detail,
      }))
    );
  }

  // General resumen
  return Papa.unparse([
    { Metrica: "Total Instituciones", Valor: data.totalInstitutions },
    { Metrica: "Instituciones Aprobadas", Valor: data.approvedInstitutions },
    { Metrica: "Instituciones Pendientes", Valor: data.pendingInstitutions },
    { Metrica: "Total Credenciales Emitidas", Valor: data.totalCredentials },
    { Metrica: "Total Verificaciones Realizadas", Valor: data.totalVerifications },
    { Metrica: "Verificaciones Válidas", Valor: data.validVerifications },
    { Metrica: "Verificaciones Alteradas (Riesgo)", Valor: data.alteredVerifications },
    { Metrica: "Verificaciones Revocadas", Valor: data.revokedVerifications },
    { Metrica: "Verificaciones No Reconocidas", Valor: data.unrecognizedVerifications },
    { Metrica: "Fecha de Generación", Valor: data.generatedAt },
  ]);
}

/**
 * Genera el CSV para la Institución
 */
export function generateInstitutionCsvReport(data: InstitutionReportData): string {
  return Papa.unparse(
    data.credentials.map((c) => ({
      ID_Credencial: c.id,
      Titular: c.recipientName,
      Documento_Identidad: c.recipientIdMasked,
      Correo_Titular: c.recipientEmail,
      Programa_Academico: c.programName,
      Tipo_Credencial: c.credentialType,
      Fecha_Emision: c.issueDate,
      Estado: c.status,
      Motivo_Revocacion: c.revokeReason || "",
      Hash_SHA256_Datos: c.dataHash,
      Hash_Transaccion_Blockchain: c.txHash || "Localhost-Verified",
    }))
  );
}
