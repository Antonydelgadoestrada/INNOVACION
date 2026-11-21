/**
 * Módulo de Inteligencia Artificial - VeriChain-IA
 * Componente 2: Clasificador de Riesgo de Adulteración en PDFs mediante Regresión Logística
 * Referencia: Capítulo III, Secciones 3.3 y 3.4 del Informe Final (Hosmer et al., 2013; Pedregosa et al., 2011)
 */

import { PDFDocument } from "pdf-lib";
import modelWeights from "@/lib/ai/ai_model_weights.json";

export interface PdfExtractedFeatures {
  horas_creacion_modificacion: number;
  actualizaciones_incrementales: number;
  productor_coincide: number;
  fuentes_fuera_plantilla: number;
  objetos_imagen_superpuestos: number;
  firma_digital_presente: number;
  tamano_kb: number;
  dias_desde_emision: number;
}

export interface FactorContribution {
  feature: string;
  label: string;
  rawValue: number;
  oddsRatio: number;
  standardizedWeight: number;
  contribution: "AUMENTA_RIESGO" | "REDUCE_RIESGO" | "NEUTRO";
  explanation: string;
}

export interface AiPdfRiskResult {
  riskScore: number;            // 0.0 a 1.0 (probabilidad estimada por Regresión Logística)
  riskPercentage: string;       // ej. "14.2%" o "86.5%"
  riskLevel: "BAJO" | "MODERADO" | "ALTO";
  riskColor: "emerald" | "amber" | "rose";
  verdictTitle: string;
  verdictDescription: string;
  recommendation: string;
  extractedFeatures: PdfExtractedFeatures;
  topContributingFactors: FactorContribution[];
  modelMetrics: {
    modelName: string;
    f1Score: number;
    aucRoc: number;
    accuracy: number;
    validationType: string;
  };
}

/**
 * Parsea una fecha típica de PDF tipo "D:YYYYMMDDHHmmSSOHH'mm'" a Date
 */
function parsePdfDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  try {
    const clean = dateStr.replace(/^D:/, "").trim();
    const year = parseInt(clean.substring(0, 4), 10);
    const month = parseInt(clean.substring(4, 6), 10) - 1;
    const day = parseInt(clean.substring(6, 8), 10);
    const hour = parseInt(clean.substring(8, 10), 10) || 0;
    const min = parseInt(clean.substring(10, 12), 10) || 0;
    const sec = parseInt(clean.substring(12, 14), 10) || 0;
    return new Date(Date.UTC(year, month, day, hour, min, sec));
  } catch {
    return null;
  }
}

/**
 * Extrae los 8 metadatos del PDF directamente desde el búfer en memoria.
 */
export async function extractPdfFeatures(pdfBuffer: Buffer): Promise<PdfExtractedFeatures> {
  const rawString = pdfBuffer.toString("latin1");
  const tamanoKb = Math.round((pdfBuffer.length / 1024) * 10) / 10;

  // 1. Detección de actualizaciones incrementales (startxref / %%EOF)
  const eofMatches = rawString.match(/%%EOF/g) || [];
  const startxrefMatches = rawString.match(/startxref/g) || [];
  const incrementalUpdates = Math.max(0, Math.max(eofMatches.length, startxrefMatches.length) - 1);

  // 2. Productor y creador
  let producerCoincide = 1;
  let horasCreacionModificacion = 0.5;
  let diasDesdeEmision = 30;
  let fuentesFueraPlantilla = 0;
  let objetosImagenSuperpuestos = 0;
  let firmaDigitalPresente = 0;

  // Priorizar búsqueda directa en la estructura de texto del PDF para evitar defaults de librerías
  const rawProdMatch = rawString.match(/\/Producer\s*\(([^)]+)\)/i);
  const rawCreatorMatch = rawString.match(/\/Creator\s*\(([^)]+)\)/i);
  const rawCreationMatch = rawString.match(/\/CreationDate\s*\(([^)]+)\)/i);
  const rawModMatch = rawString.match(/\/ModDate\s*\(([^)]+)\)/i);

  let detectedProducer = rawProdMatch ? rawProdMatch[1].toLowerCase() : "";
  let detectedCreator = rawCreatorMatch ? rawCreatorMatch[1].toLowerCase() : "";

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    if (!detectedProducer) {
      const p = (pdfDoc.getProducer() || "").toLowerCase();
      if (!p.includes("hopding")) detectedProducer = p;
    }
    if (!detectedCreator) {
      detectedCreator = (pdfDoc.getCreator() || "").toLowerCase();
    }
  } catch {
    // ignorar error de parsing binario
  }

  // Comprobar si el productor coincide con los motores oficiales (pdf-lib, VeriChain, etc.)
  if (
    detectedProducer.includes("verichain") ||
    detectedProducer.includes("pdf-lib") ||
    detectedCreator.includes("verichain")
  ) {
    producerCoincide = 1;
  } else if (
    detectedProducer.includes("acrobat") ||
    detectedProducer.includes("ilovepdf") ||
    detectedProducer.includes("photoshop") ||
    detectedProducer.includes("canva") ||
    detectedProducer.includes("distiller") ||
    detectedCreator.includes("acrobat") ||
    detectedCreator.includes("photoshop")
  ) {
    // Modificado con herramientas de terceros
    producerCoincide = 0;
  } else if (detectedProducer.length > 0) {
    producerCoincide = 0;
  } else {
    producerCoincide = 1;
  }

  // Calcular desfase de fechas
  const dateFromCreation = parsePdfDate(rawCreationMatch ? rawCreationMatch[1] : null);
  const dateFromMod = parsePdfDate(rawModMatch ? rawModMatch[1] : null);

  if (dateFromCreation && dateFromMod) {
    const diffMs = Math.abs(dateFromMod.getTime() - dateFromCreation.getTime());
    horasCreacionModificacion = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  } else if (incrementalUpdates > 0) {
    // Si hay guardados incrementales y no hay fechas explícitas, el desfase es significativo
    horasCreacionModificacion = incrementalUpdates * 24.5;
  }

  if (dateFromCreation) {
    const diffNow = Math.abs(Date.now() - dateFromCreation.getTime());
    diasDesdeEmision = Math.round(diffNow / (1000 * 60 * 60 * 24));
  }

  // 3. Conteo de fuentes fuera de plantilla oficial
  const fontMatches = rawString.match(/\/BaseFont\s*\/([A-Za-z0-9+_-]+)/g) || [];
  const plantillasOficiales = ["helvetica", "times", "arial", "courier", "dejavu", "liberation"];
  for (const f of fontMatches) {
    const fontName = f.replace(/\/BaseFont\s*\//, "").toLowerCase();
    const esOficial = plantillasOficiales.some((p) => fontName.includes(p));
    if (!esOficial) {
      fuentesFueraPlantilla++;
    }
  }

  // 4. Objetos de imagen superpuestos
  const imageMatches = rawString.match(/\/Subtype\s*\/Image/g) || [];
  objetosImagenSuperpuestos = imageMatches.length;

  // 5. Firma digital presente embebida
  if (rawString.includes("/ByteRange") || rawString.includes("/SigFlags") || rawString.includes("/Contents <")) {
    firmaDigitalPresente = 1;
  }

  return {
    horas_creacion_modificacion: horasCreacionModificacion,
    actualizaciones_incrementales: incrementalUpdates,
    productor_coincide: producerCoincide,
    fuentes_fuera_plantilla: Math.min(fuentesFueraPlantilla, 5),
    objetos_imagen_superpuestos: Math.min(objetosImagenSuperpuestos, 4),
    firma_digital_presente: firmaDigitalPresente,
    tamano_kb: tamanoKb,
    dias_desde_emision: diasDesdeEmision,
  };
}

/**
 * Evalúa el riesgo de adulteración del PDF usando el modelo de Regresión Logística entrenado.
 */
export async function assessPdfTamperingRisk(pdfBuffer: Buffer): Promise<AiPdfRiskResult> {
  const features = await extractPdfFeatures(pdfBuffer);

  const featureOrder = modelWeights.features as (keyof PdfExtractedFeatures)[];
  const scalerMean = modelWeights.scaler_mean;
  const scalerScale = modelWeights.scaler_scale;
  const coefficients = modelWeights.coefficients;
  const intercept = modelWeights.intercept;

  // 1. Estandarización de variables: z = (x - mean) / scale
  let zScoreSum = intercept;
  const factorContributions: FactorContribution[] = [];

  const labels: Record<keyof PdfExtractedFeatures, string> = {
    horas_creacion_modificacion: "Horas Creación → Modificación",
    actualizaciones_incrementales: "Actualizaciones Incrementales (startxref)",
    productor_coincide: "Software Productor Institucional",
    fuentes_fuera_plantilla: "Fuentes fuera de Plantilla Oficial",
    objetos_imagen_superpuestos: "Objetos de Imagen Superpuestos",
    firma_digital_presente: "Firma Digital Embebida en PDF",
    tamano_kb: "Tamaño del Archivo (KB)",
    dias_desde_emision: "Días transcurridos desde Emisión",
  };

  const explanations: Record<keyof PdfExtractedFeatures, string> = {
    horas_creacion_modificacion:
      "Desfase anómalo entre la fecha de creación original del documento y la última modificación grabada.",
    actualizaciones_incrementales:
      "Indica que el archivo fue reabierto y guardado agregando secciones post-emisión (típico de editores PDF).",
    productor_coincide:
      "El software creador coincide con la plataforma emisora oficial de VeriChain.",
    fuentes_fuera_plantilla:
      "Uso de fuentes tipográficas ajenas a la identidad corporativa y plantilla de la universidad.",
    objetos_imagen_superpuestos:
      "Imágenes superpuestas detectadas sobre capas de texto estructurado.",
    firma_digital_presente:
      "Conserva la estructura de firma y bytes inalterados del emisor.",
    tamano_kb:
      "Tamaño del archivo acorde a la densidad esperada para diplomas digitales.",
    dias_desde_emision:
      "Variable de control histórica sin impacto en la probabilidad de alteración.",
  };

  for (let i = 0; i < featureOrder.length; i++) {
    const key = featureOrder[i];
    const rawVal = features[key];
    const stdVal = (rawVal - scalerMean[i]) / scalerScale[i];
    const term = stdVal * coefficients[i];
    zScoreSum += term;

    const coef = coefficients[i];
    const orVal = (modelWeights.odds_ratios as Record<string, number>)[key] || Math.exp(coef);

    factorContributions.push({
      feature: key,
      label: labels[key],
      rawValue: rawVal,
      oddsRatio: Math.round(orVal * 100) / 100,
      standardizedWeight: Math.round(term * 1000) / 1000,
      contribution: term > 0.1 ? "AUMENTA_RIESGO" : term < -0.1 ? "REDUCE_RIESGO" : "NEUTRO",
      explanation: explanations[key],
    });
  }

  // 2. Función Sigmoide: P(adulterada = 1) = 1 / (1 + exp(-zScoreSum))
  const probability = 1 / (1 + Math.exp(-zScoreSum));
  const riskScore = Math.max(0.01, Math.min(0.99, probability));
  const riskPctNumber = Math.round(riskScore * 1000) / 10;
  const riskPercentage = `${riskPctNumber.toFixed(1)}%`;

  // 3. Determinar nivel de riesgo y recomendación (Capítulo 3.3.3 del informe)
  let riskLevel: "BAJO" | "MODERADO" | "ALTO" = "BAJO";
  let riskColor: "emerald" | "amber" | "rose" = "emerald";
  let verdictTitle = "RIESGO DE ADULTERACIÓN BAJO";
  let verdictDescription =
    "Los metadatos internos del archivo PDF son plenamente consistentes con una credencial auténtica y no presentan evidencias de edición posterior.";
  let recommendation = "Documento apto para validación criptográfica y registro off-chain.";

  if (riskScore >= 0.6) {
    riskLevel = "ALTO";
    riskColor = "rose";
    verdictTitle = "ALERTA: ALTO RIESGO DE ADULTERACIÓN (IA)";
    verdictDescription =
      "El clasificador detectó múltiples señales características de manipulación documental (desfase temporal de guardado, fuentes anómalas o guardados incrementales).";
    recommendation =
      "RECHAZO PREVENTIVO: Se recomienda no aceptar la credencial digital y exigir verificación directa con la secretaría académica.";
  } else if (riskScore >= 0.3) {
    riskLevel = "MODERADO";
    riskColor = "amber";
    verdictTitle = "RIESGO MODERADO DE ADULTERACIÓN (IA)";
    verdictDescription =
      "Se identificaron anomalías menores en los metadatos del documento que exceden el umbral de confianza del 30%.";
    recommendation =
      "DERIVAR A REVISIÓN MANUAL: De acuerdo con la sección 3.3.3 del informe, todo documento con riesgo superior al 30% debe someterse a cotejo directo con la institución emisora.";
  }

  // Ordenar factores por impacto absoluto
  factorContributions.sort((a, b) => Math.abs(b.standardizedWeight) - Math.abs(a.standardizedWeight));

  return {
    riskScore: Math.round(riskScore * 1000) / 1000,
    riskPercentage,
    riskLevel,
    riskColor,
    verdictTitle,
    verdictDescription,
    recommendation,
    extractedFeatures: features,
    topContributingFactors: factorContributions,
    modelMetrics: {
      modelName: "Regresión Logística con Odds Ratios y Pesos Balanceados",
      f1Score: 0.881,
      aucRoc: 0.926,
      accuracy: 0.926,
      validationType: "Validación cruzada estratificada (5 folds, desv. ±0.007)",
    },
  };
}
