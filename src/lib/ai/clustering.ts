/**
 * Módulo de Inteligencia Artificial - VeriChain-IA
 * Componente 3: Segmentación de Entidades Verificadoras y Detección de Anomalías (K-Means)
 * Referencia: Capítulo III, Secciones 3.5 y 3.6 del Informe Final (MacQueen, 1967; Rousseeuw, 1987)
 */

import kmeansWeights from "@/lib/ai/ai_kmeans_weights.json";

export interface VerifierEntityInput {
  id?: string;
  nombre?: string;
  verificaciones_mes: number;
  pct_no_validas: number;
  hora_media_consulta: number;
  instituciones_distintas: number;
  intervalo_medio_min: number;
}

export interface ClusterInfo {
  id: number;
  segmento: string;
  n: number;
  verificaciones_mes: number;
  pct_no_validas: number;
  hora_media_consulta: number;
  instituciones_distintas: number;
  intervalo_medio_min: number;
  accionVeriChain: string;
  pcaCenter: [number, number];
  color: string;
  isAnomalous: boolean;
}

export interface ClusteringAnalysisResult {
  clusters: ClusterInfo[];
  k: number;
  wcssInertia: number;
  silhouetteScore: number;
  pcaVarianceExplained: [number, number];
  anomalousEntitiesCount: number;
  securityAlerts: {
    title: string;
    description: string;
    level: "CRITICAL" | "WARNING" | "INFO";
    recommendedAction: string;
  }[];
  samplePoints: {
    x: number;
    y: number;
    cluster: number;
    segmento: string;
  }[];
}

export const CLUSTER_METADATA: Record<
  string,
  { segmento: string; accion: string; color: string; isAnomalous: boolean }
> = {
  "0": {
    segmento: "Reclutadores de alto volumen",
    accion: "Ofrecer API institucional con verificación por lotes y llaves dedicadas.",
    color: "#2b6cb0", // azul
    isAnomalous: false,
  },
  "1": {
    segmento: "Patrón anómalo (posible scraping)",
    accion: "Aplicar límite estricto de consultas, exigir CAPTCHA y alertar al equipo de ciberseguridad.",
    color: "#c53030", // rojo
    isAnomalous: true,
  },
  "2": {
    segmento: "Verificadores ocasionales",
    accion: "Priorizar la experiencia móvil de escaneo QR rápido y directo sin fricción ni registro.",
    color: "#2f855a", // verde
    isAnomalous: false,
  },
  "3": {
    segmento: "Instituciones académicas",
    accion: "Integrar módulo de convalidaciones y reportes cruzados por institución emisora.",
    color: "#6b46c1", // morado
    isAnomalous: false,
  },
};

/**
 * Clasifica una entidad verificadora particular en uno de los 4 clusters de K-Means.
 */
export function classifyVerifierEntity(input: VerifierEntityInput): {
  clusterId: number;
  cluster: ClusterInfo;
  pcaCoords: [number, number];
} {
  const rawFeatures = [
    Math.log1p(input.verificaciones_mes),
    input.pct_no_validas,
    input.hora_media_consulta,
    input.instituciones_distintas,
    Math.log1p(input.intervalo_medio_min),
  ];

  const scalerMean = kmeansWeights.scaler_mean;
  const scalerScale = kmeansWeights.scaler_scale;

  // Estandarizar
  const scaled = rawFeatures.map((val, idx) => (val - scalerMean[idx]) / scalerScale[idx]);

  // Distancia euclídea a cada centroide
  const centers = kmeansWeights.cluster_centers;
  let minDistance = Infinity;
  let closestCluster = 0;

  for (let c = 0; c < centers.length; c++) {
    const center = centers[c];
    let distSq = 0;
    for (let f = 0; f < scaled.length; f++) {
      distSq += Math.pow(scaled[f] - center[f], 2);
    }
    if (distSq < minDistance) {
      minDistance = distSq;
      closestCluster = c;
    }
  }

  // Proyección PCA
  const pcaComp = kmeansWeights.pca_components;
  const pcaX = scaled.reduce((acc, val, i) => acc + val * pcaComp[0][i], 0);
  const pcaY = scaled.reduce((acc, val, i) => acc + val * pcaComp[1][i], 0);

  const rawClusterData = (kmeansWeights.clusters as any)[String(closestCluster)];
  const meta = CLUSTER_METADATA[String(closestCluster)];

  const clusterObj: ClusterInfo = {
    id: closestCluster,
    segmento: meta.segmento,
    n: rawClusterData.n,
    verificaciones_mes: Math.round(rawClusterData.verificaciones_mes * 10) / 10,
    pct_no_validas: Math.round(rawClusterData.pct_no_validas * 10) / 10,
    hora_media_consulta: Math.round(rawClusterData.hora_media_consulta * 10) / 10,
    instituciones_distintas: Math.round(rawClusterData.instituciones_distintas * 10) / 10,
    intervalo_medio_min: Math.round(rawClusterData.intervalo_medio_min * 10) / 10,
    accionVeriChain: meta.accion,
    pcaCenter: [rawClusterData.pca_center[0], rawClusterData.pca_center[1]],
    color: meta.color,
    isAnomalous: meta.isAnomalous,
  };

  return {
    clusterId: closestCluster,
    cluster: clusterObj,
    pcaCoords: [Math.round(pcaX * 100) / 100, Math.round(pcaY * 100) / 100],
  };
}

/**
 * Obtiene el reporte completo de clustering K-Means para el panel de administración
 */
export function getKMeansDashboardAnalysis(): ClusteringAnalysisResult {
  const clustersArray: ClusterInfo[] = [];

  for (let c = 0; c < 4; c++) {
    const rawClusterData = (kmeansWeights.clusters as any)[String(c)];
    const meta = CLUSTER_METADATA[String(c)];

    clustersArray.push({
      id: c,
      segmento: meta.segmento,
      n: rawClusterData.n,
      verificaciones_mes: Math.round(rawClusterData.verificaciones_mes * 10) / 10,
      pct_no_validas: Math.round(rawClusterData.pct_no_validas * 10) / 10,
      hora_media_consulta: Math.round(rawClusterData.hora_media_consulta * 10) / 10,
      instituciones_distintas: Math.round(rawClusterData.instituciones_distintas * 10) / 10,
      intervalo_medio_min: Math.round(rawClusterData.intervalo_medio_min * 10) / 10,
      accionVeriChain: meta.accion,
      pcaCenter: [rawClusterData.pca_center[0], rawClusterData.pca_center[1]],
      color: meta.color,
      isAnomalous: meta.isAnomalous,
    });
  }

  // Ordenar clusters para que coincida con la Tabla 3.9 del informe
  const ordenDeseado = [
    "Reclutadores de alto volumen",
    "Verificadores ocasionales",
    "Instituciones académicas",
    "Patrón anómalo (posible scraping)",
  ];
  clustersArray.sort((a, b) => ordenDeseado.indexOf(a.segmento) - ordenDeseado.indexOf(b.segmento));

  return {
    clusters: clustersArray,
    k: 4,
    wcssInertia: 425.7,
    silhouetteScore: 0.595,
    pcaVarianceExplained: [0.722, 0.170],
    anomalousEntitiesCount: 30,
    securityAlerts: [
      {
        title: "Detección de Tráfico Anómalo / Scraping",
        description:
          "Se detectaron 30 entidades realizando más de 400 consultas mensuales con intervalos inferiores a 3 minutos en horario nocturno (03:48 AM) y 38.2% de resultados no válidos.",
        level: "CRITICAL",
        recommendedAction:
          "Políticas de Rate Limit aplicadas automáticamente (máximo 60 req/min) y desafío CAPTCHA obligatorio en /verificar.",
      },
      {
        title: "Oportunidad de API Institucional B2B",
        description:
          "El segmento corporativo (230 reclutadores) promedia 137 consultas/mes en horario laboral de oficina (11:00 AM) con solo 3.9% de fallo.",
        level: "INFO",
        recommendedAction:
          "Habilitar emisión de claves de API dedicadas para verificación masiva por lotes sin restricciones de tasa.",
      },
    ],
    samplePoints: kmeansWeights.sample_points as any,
  };
}
