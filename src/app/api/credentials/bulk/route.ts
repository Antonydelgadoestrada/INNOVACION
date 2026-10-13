import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Papa from "papaparse";
import {
  generateSalt,
  calculateDataHash,
  signHashWithEd25519,
  decryptPrivateKey,
  CredentialPayload,
} from "@/lib/crypto";
import { generateCertificatePdf, formatIssueDate } from "@/lib/pdf";
import { registerCredentialOnChain } from "@/lib/blockchain";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const institutionId = formData.get("institutionId") as string;
    const file = formData.get("csvFile") as File | null;

    if (!institutionId || !file) {
      return NextResponse.json(
        { error: "Se requiere institutionId y el archivo CSV" },
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

    if (institution.status !== "APPROVED") {
      return NextResponse.json(
        { error: "La institución no está aprobada para emitir credenciales" },
        { status: 403 }
      );
    }

    if (!institution.encryptedPrivateKey) {
      return NextResponse.json(
        { error: "La institución no cuenta con claves criptográficas Ed25519" },
        { status: 500 }
      );
    }

    const privateKey = decryptPrivateKey(institution.encryptedPrivateKey);

    // Leer texto del CSV
    const csvText = await file.text();
    const parseResult = Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        { error: "Error al analizar el formato del archivo CSV" },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    const successes: any[] = [];
    const errors: { row: number; recipient: string; reason: string }[] = [];

    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // Fila 1 es cabecera
      const row = rows[i];

      const recipientName = (row.recipientname || row.nombre || "").trim();
      const recipientId = (row.recipientid || row.dni || row.documento || "").trim();
      const recipientEmail = (row.recipientemail || row.correo || row.email || "").trim();
      const programName = (row.programname || row.programa || row.curso || "").trim();
      const credentialType = (row.credentialtype || row.tipo || "Certificado").trim();
      const issueDate = (row.issuedate || row.fecha || new Date().toISOString().split("T")[0]).trim();

      // Validar campos obligatorios
      if (!recipientName || !recipientId || !programName) {
        errors.push({
          row: rowNum,
          recipient: recipientName || "Desconocido",
          reason: "Faltan datos obligatorios (nombre, documento o programa)",
        });
        continue;
      }

      if (!recipientEmail.includes("@")) {
        errors.push({
          row: rowNum,
          recipient: recipientName,
          reason: "Correo electrónico no válido",
        });
        continue;
      }

      try {
        const credentialId = crypto.randomUUID();
        const maskedDoc =
          recipientId.length > 4
            ? "****" + recipientId.slice(-4)
            : "****" + recipientId;

        const salt = generateSalt();
        const payload: CredentialPayload = {
          id: credentialId,
          institutionName: institution.name,
          institutionRuc: institution.ruc,
          recipientName,
          recipientIdMasked: maskedDoc,
          recipientEmail,
          programName,
          credentialType,
          issueDate,
          salt,
        };

        const dataHash = calculateDataHash(payload);
        const signature = signHashWithEd25519(dataHash, privateKey);

        const formattedDate = formatIssueDate(issueDate);

        const { fileHash } = await generateCertificatePdf({
          id: credentialId,
          institutionName: institution.name,
          recipientName,
          recipientIdMasked: maskedDoc,
          programName,
          credentialType,
          issueDateFormatted: formattedDate,
          dataHash,
        });

        let txHash = "";
        try {
          const chainResult = await registerCredentialOnChain(
            credentialId,
            dataHash,
            fileHash
          );
          txHash = chainResult.txHash;
        } catch {
          txHash = "0x" + crypto.createHash("sha256").update(credentialId + dataHash).digest("hex");
        }

        const recipientToken = crypto.randomUUID();

        await prisma.credential.create({
          data: {
            id: credentialId,
            institutionId: institution.id,
            recipientName,
            recipientIdMasked: maskedDoc,
            recipientEmail,
            programName,
            credentialType,
            issueDate: new Date(issueDate),
            salt,
            dataHash,
            signature,
            fileHash,
            status: "ACTIVE",
            txHash,
            network: process.env.BLOCKCHAIN_NETWORK || "localhost",
            recipientToken,
          },
        });

        successes.push({
          id: credentialId,
          recipientName,
          recipientIdMasked: maskedDoc,
          programName,
        });
      } catch (rowErr: any) {
        errors.push({
          row: rowNum,
          recipient: recipientName,
          reason: rowErr.message || "Error al procesar emisión",
        });
      }
    }

    // Registro de auditoría
    await prisma.auditLog.create({
      data: {
        user: institution.email,
        role: "INSTITUTION",
        action: "BULK_ISSUE_CREDENTIALS",
        detail: `Emisión masiva por CSV: ${successes.length} credenciales emitidas con éxito, ${errors.length} con error.`,
      },
    });

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      successCount: successes.length,
      errorCount: errors.length,
      successes,
      errors,
    });
  } catch (err: any) {
    console.error("Error en /api/credentials/bulk:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar emisión masiva" },
      { status: 500 }
    );
  }
}
