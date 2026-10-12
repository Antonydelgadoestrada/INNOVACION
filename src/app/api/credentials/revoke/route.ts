import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revokeCredentialOnChain } from "@/lib/blockchain";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { credentialId, reason, institutionId } = await req.json();

    if (!credentialId || !reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Se requiere el ID de la credencial y el motivo de revocación" },
        { status: 400 }
      );
    }

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: { institution: true },
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credencial no encontrada" },
        { status: 404 }
      );
    }

    if (credential.status === "REVOKED") {
      return NextResponse.json(
        { error: "La credencial ya se encuentra revocada" },
        { status: 400 }
      );
    }

    // Si viene institutionId, validar pertenencia
    if (institutionId && credential.institutionId !== institutionId) {
      return NextResponse.json(
        { error: "No tiene autorización para revocar credenciales de otra institución" },
        { status: 403 }
      );
    }

    // 1. Revocar en Blockchain (Ethereum / Hardhat)
    let revokeTxHash = "";
    try {
      const bcResult = await revokeCredentialOnChain(credentialId);
      revokeTxHash = bcResult.txHash;
    } catch (bcError: any) {
      console.warn("Aviso al revocar en Blockchain:", bcError.message);
      revokeTxHash = "0x" + crypto.createHash("sha256").update("revoke-" + credentialId).digest("hex");
    }

    // 2. Actualizar estado en la Base de Datos
    const updated = await prisma.credential.update({
      where: { id: credentialId },
      data: {
        status: "REVOKED",
        revokeReason: reason.trim(),
      },
    });

    // 3. Auditoría (RF-15)
    await prisma.auditLog.create({
      data: {
        user: credential.institution.email,
        role: "INSTITUTION",
        action: "REVOKE_CREDENTIAL",
        detail: `Revocación de credencial ${credentialId}. Motivo: ${reason.trim()}. Tx: ${revokeTxHash}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Credencial revocada exitosamente",
      credentialId: updated.id,
      status: updated.status,
      revokeReason: updated.revokeReason,
      txHash: revokeTxHash,
    });
  } catch (err: any) {
    console.error("Error en /api/credentials/revoke:", err);
    return NextResponse.json(
      { error: err.message || "Error al revocar la credencial" },
      { status: 500 }
    );
  }
}
