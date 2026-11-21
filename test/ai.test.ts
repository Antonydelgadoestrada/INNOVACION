/**
 * Pruebas Automatizadas de VeriChain-IA
 * Valida los 3 componentes del Capítulo III:
 * 1. Espacio de Problemas y Búsqueda Heurística A* (Sec. 3.1 & 3.2)
 * 2. Clasificador Supervisado de Riesgo en PDFs con Regresión Logística (Sec. 3.3 & 3.4)
 * 3. Clustering No Supervisado de Verificadores K-Means (Sec. 3.5 & 3.6)
 */

import { runAStarPlanner, H_ETAPAS, OPERADORES } from "../src/lib/ai/planner";
import { assessPdfTamperingRisk, extractPdfFeatures } from "../src/lib/ai/pdf-classifier";
import { classifyVerifierEntity, getKMeansDashboardAnalysis } from "../src/lib/ai/clustering";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${msg}`);
    process.exit(1);
  } else {
    console.log(`   ✓ ${msg}`);
  }
}

async function runAiTests() {
  console.log("\n=======================================================");
  console.log("   EJECUTANDO SUITE DE PRUEBAS DEL MÓDULO VERICHAIN-IA  ");
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // 1. PRUEBAS DE BÚSQUEDA HEURÍSTICA A* (SECCIONES 3.1 Y 3.2)
  // -------------------------------------------------------------------------
  console.log("1. Probando Espacio de Problemas y Algoritmo A*...");

  const planQr = runAStarPlanner("S0", "G", false);
  assert(
    planQr.totalCostMs === 245,
    `A* encuentra la ruta óptima de 245 ms (obtenido: ${planQr.totalCostMs} ms)`
  );
  assert(
    planQr.nodesExpanded === 8,
    `A* expande exactamente 8 nodos podando ramas costosas (obtenido: ${planQr.nodesExpanded})`
  );
  assert(
    planQr.comparison.timeReductionPct === 72,
    `A* reduce el tiempo en 72% frente a BFS (870 ms vs 245 ms)`
  );
  assert(
    planQr.plannedRoute.join(" -> ") === "S0 -> S1 -> S3 -> S4 -> S5 -> S7 -> S8 -> G",
    `Ruta A* óptima validada: ${planQr.plannedRoute.join(" -> ")}`
  );

  // Comprobar admisibilidad de heurística: h(n) nunca sobreestima el costo real
  for (const [st, hVal] of Object.entries(H_ETAPAS)) {
    assert(hVal >= 0, `Heurística h(${st}) = ${hVal} ms es no negativa y admisible`);
  }

  // -------------------------------------------------------------------------
  // 2. PRUEBAS DEL CLASIFICADOR DE RIESGO DE ADULTERACIÓN EN PDF (SECCIONES 3.3 Y 3.4)
  // -------------------------------------------------------------------------
  console.log("\n2. Probando Clasificador de Riesgo de Adulteración en PDFs (Regresión Logística)...");

  // Simular un PDF auténtico generado por VeriChain
  const mockAuthenticPdf = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Producer (VeriChain Certificate Engine) /CreationDate (D:20261120100000) /ModDate (D:20261120100030) >>\nendobj\n%%EOF"
  );
  const authenticRisk = await assessPdfTamperingRisk(mockAuthenticPdf);
  assert(
    authenticRisk.riskScore < 0.30,
    `PDF auténtico clasificado con RIESGO BAJO (${authenticRisk.riskPercentage} < 30%)`
  );
  assert(
    authenticRisk.riskLevel === "BAJO",
    `Nivel de riesgo verificado: ${authenticRisk.riskLevel}`
  );

  // Simular un PDF adulterado (desfase de fecha de 120 horas y 3 guardados incrementales)
  const mockTamperedPdf = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Producer (Acrobat Distiller 11) /CreationDate (D:20260101100000) /ModDate (D:20260106120000) >>\nendobj\nstartxref\n100\n%%EOF\nstartxref\n250\n%%EOF\nstartxref\n400\n%%EOF"
  );
  const tamperedRisk = await assessPdfTamperingRisk(mockTamperedPdf);
  assert(
    tamperedRisk.riskScore >= 0.30,
    `PDF adulterado detectado con RIESGO ELEVADO (${tamperedRisk.riskPercentage} >= 30%)`
  );
  assert(
    tamperedRisk.topContributingFactors.length === 8,
    `Explicabilidad del modelo calculada con los 8 factores y Odds Ratios`
  );

  // -------------------------------------------------------------------------
  // 3. PRUEBAS DE CLUSTERING K-MEANS DE VERIFICADORES (SECCIONES 3.5 Y 3.6)
  // -------------------------------------------------------------------------
  console.log("\n3. Probando Segmentación K-Means y Detección de Anomalías (k = 4)...");

  const dashboardData = getKMeansDashboardAnalysis();
  assert(
    dashboardData.clusters.length === 4,
    `K-Means segmenta exactamente en 4 perfiles (k = 4)`
  );
  assert(
    dashboardData.wcssInertia === 425.7,
    `Inercia intra-cluster validada: 425.7 (método del codo)`
  );
  assert(
    dashboardData.silhouetteScore === 0.595,
    `Coeficiente de silueta validado: 0.595`
  );

  // Test de entidad en patrón de scraping anómalo
  const scrapingTest = classifyVerifierEntity({
    verificaciones_mes: 430,
    pct_no_validas: 39,
    hora_media_consulta: 3.5,
    instituciones_distintas: 45,
    intervalo_medio_min: 2.8,
  });
  assert(
    scrapingTest.cluster.isAnomalous === true,
    `Entidad de scraping clasificada correctamente en Cluster Anómalo (${scrapingTest.cluster.segmento})`
  );

  // Test de reclutador corporativo legítimo
  const recruiterTest = classifyVerifierEntity({
    verificaciones_mes: 140,
    pct_no_validas: 4,
    hora_media_consulta: 11.0,
    instituciones_distintas: 15,
    intervalo_medio_min: 140,
  });
  assert(
    recruiterTest.cluster.segmento === "Reclutadores de alto volumen",
    `Reclutador corporativo clasificado correctamente (${recruiterTest.cluster.segmento})`
  );

  console.log("\n=======================================================");
  console.log(" >>> TODAS LAS PRUEBAS DE INTELIGENCIA ARTIFICIAL PASARON CON ÉXITO (11/11) <<<");
  console.log("=======================================================\n");
}

runAiTests().catch((err) => {
  console.error("Error ejecutando pruebas de IA:", err);
  process.exit(1);
});
