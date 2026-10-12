import { NextRequest, NextResponse } from "next/server";
import { verifyCredential } from "@/lib/verify";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Manejo de subida de archivo PDF (Multipart / FormData)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("pdfFile") as File | null;
      const explicitId = formData.get("credentialId") as string | null;
      const method = (formData.get("method") as any) || "PDF";

      if (!file) {
        return NextResponse.json(
          { error: "No se proporcionó ningún archivo PDF" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.ip ||
        "127.0.0.1";

      const evidence = await verifyCredential({
        credentialId: explicitId || undefined,
        pdfBuffer: buffer,
        method: method,
        clientIp: clientIp,
      });

      return NextResponse.json(evidence);
    }

    // 2. Manejo de consulta por JSON (Identificador o QR)
    const body = await req.json();
    const { credentialId, method = "QR" } = body;

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.ip ||
      "127.0.0.1";

    const evidence = await verifyCredential({
      credentialId: credentialId,
      method: method,
      clientIp: clientIp,
    });

    return NextResponse.json(evidence);
  } catch (err: any) {
    console.error("Error en API /api/verify:", err);
    return NextResponse.json(
      { error: err.message || "Error interno al verificar credencial" },
      { status: 500 }
    );
  }
}
