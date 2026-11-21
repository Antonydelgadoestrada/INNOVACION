import { NextResponse } from "next/server";
import { getKMeansDashboardAnalysis, classifyVerifierEntity } from "@/lib/ai/clustering";

export async function GET() {
  try {
    const analysis = getKMeansDashboardAnalysis();
    return NextResponse.json(analysis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener análisis K-Means" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = classifyVerifierEntity(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al clasificar entidad verificadora" },
      { status: 400 }
    );
  }
}
