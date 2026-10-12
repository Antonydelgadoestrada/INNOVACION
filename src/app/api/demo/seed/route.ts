import { NextResponse } from "next/server";
import { createDemoScenarios, DEMO_IDS } from "@/lib/demo-scenarios";

export async function POST() {
  try {
    await createDemoScenarios();
    return NextResponse.json({
      success: true,
      message: "Escenarios de prueba regenerados exitosamente",
      ids: DEMO_IDS,
    });
  } catch (err: any) {
    console.error("Error al sembrar escenarios demo:", err);
    return NextResponse.json(
      { error: err.message || "Error al generar escenarios demo" },
      { status: 500 }
    );
  }
}
