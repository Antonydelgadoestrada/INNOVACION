import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Ingrese un documento, correo o token de credencial" },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();

    // 1. Si es formato UUID, puede ser el token privado o el ID público
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
    if (isUuid) {
      const byToken = await prisma.credential.findFirst({
        where: {
          OR: [
            { recipientToken: cleanQuery },
            { id: cleanQuery },
          ],
        },
        include: { institution: true },
      });

      if (byToken) {
        return NextResponse.json({
          credentials: [
            {
              id: byToken.id,
              recipientName: byToken.recipientName,
              recipientIdMasked: byToken.recipientIdMasked,
              programName: byToken.programName,
              credentialType: byToken.credentialType,
              institutionName: byToken.institution.name,
              issueDate: byToken.issueDate.toISOString().split("T")[0],
              status: byToken.status,
              recipientToken: byToken.recipientToken,
            },
          ],
        });
      }
    }

    // 2. Búsqueda por correo o coincidencia de documento
    const lastDigits = cleanQuery.replace(/\D/g, "").slice(-4);

    const matches = await prisma.credential.findMany({
      where: {
        OR: [
          { recipientEmail: { equals: cleanQuery.toLowerCase() } },
          ...(lastDigits.length >= 4 ? [{ recipientIdMasked: { contains: lastDigits } }] : []),
          { recipientName: { contains: cleanQuery } },
        ],
      },
      include: { institution: true },
      orderBy: { issueDate: "desc" },
      take: 10,
    });

    return NextResponse.json({
      credentials: matches.map((c) => ({
        id: c.id,
        recipientName: c.recipientName,
        recipientIdMasked: c.recipientIdMasked,
        programName: c.programName,
        credentialType: c.credentialType,
        institutionName: c.institution.name,
        issueDate: c.issueDate.toISOString().split("T")[0],
        status: c.status,
        recipientToken: c.recipientToken,
      })),
    });
  } catch (err: any) {
    console.error("Error en /api/titular/lookup:", err);
    return NextResponse.json(
      { error: err.message || "Error al buscar credenciales del titular" },
      { status: 500 }
    );
  }
}
