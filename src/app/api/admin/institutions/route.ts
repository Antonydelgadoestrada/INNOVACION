import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEd25519KeyPair, encryptPrivateKey } from "@/lib/crypto";

export async function GET() {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { credentials: true },
        },
      },
    });

    const sanitized = institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      ruc: inst.ruc,
      email: inst.email,
      status: inst.status,
      hasKeys: Boolean(inst.publicKey),
      credentialCount: inst._count.credentials,
      createdAt: inst.createdAt,
    }));

    return NextResponse.json(sanitized);
  } catch (err: any) {
    console.error("Error en GET /api/admin/institutions:", err);
    return NextResponse.json(
      { error: "Error al listar instituciones" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { institutionId, action } = await req.json();

    if (!institutionId || !["APPROVE", "SUSPEND", "ACTIVATE"].includes(action)) {
      return NextResponse.json(
        { error: "Parámetros inválidos. Acción debe ser APPROVE, SUSPEND o ACTIVATE" },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: "Institución no encontrada" },
        { status: 404 }
      );
    }

    if (action === "APPROVE" || action === "ACTIVATE") {
      // Al aprobar se generan las claves Ed25519 si aún no las tiene (RF-03)
      let publicKey = institution.publicKey;
      let encryptedPrivateKey = institution.encryptedPrivateKey;

      if (!publicKey || !encryptedPrivateKey) {
        const keyPair = generateEd25519KeyPair();
        publicKey = keyPair.publicKey;
        encryptedPrivateKey = encryptPrivateKey(keyPair.privateKey);
      }

      const updated = await prisma.institution.update({
        where: { id: institutionId },
        data: {
          status: "APPROVED",
          publicKey,
          encryptedPrivateKey,
        },
      });

      await prisma.auditLog.create({
        data: {
          user: "admin@verichain.pe",
          role: "ADMIN",
          action: "APPROVE_INSTITUTION",
          detail: `Aprobación oficial de ${institution.name} (RUC: ${institution.ruc}) y generación de par de claves Ed25519.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Institución aprobada y par de claves Ed25519 generado",
        institution: {
          id: updated.id,
          name: updated.name,
          status: updated.status,
        },
      });
    }

    if (action === "SUSPEND") {
      const updated = await prisma.institution.update({
        where: { id: institutionId },
        data: {
          status: "SUSPENDED",
        },
      });

      await prisma.auditLog.create({
        data: {
          user: "admin@verichain.pe",
          role: "ADMIN",
          action: "SUSPEND_INSTITUTION",
          detail: `Suspensión de institución ${institution.name} (RUC: ${institution.ruc}). Emisión y revocación deshabilitadas.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Institución suspendida",
        institution: {
          id: updated.id,
          name: updated.name,
          status: updated.status,
        },
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    console.error("Error en PATCH /api/admin/institutions:", err);
    return NextResponse.json(
      { error: err.message || "Error al actualizar estado de la institución" },
      { status: 500 }
    );
  }
}
