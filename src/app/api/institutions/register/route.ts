import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateTotpSecret } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(3, "El nombre de la institución es obligatorio"),
  ruc: z.string().regex(/^\d{11}$/, "El RUC debe tener exactamente 11 dígitos numéricos"),
  email: z.string().email("Correo electrónico institucional inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de registro inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, ruc, email, password } = parsed.data;

    // Verificar si ya existe RUC o correo
    const existingRuc = await prisma.institution.findUnique({ where: { ruc } });
    if (existingRuc) {
      return NextResponse.json(
        { error: "Ya existe una institución registrada con este RUC" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.institution.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "El correo electrónico ya se encuentra registrado" },
        { status: 400 }
      );
    }

    // Generar secreto MFA para la institución
    const mfa = generateTotpSecret(email, "VeriChain - " + name);

    // Crear institución en estado PENDING (RF-01)
    const institution = await prisma.institution.create({
      data: {
        name: name.trim(),
        ruc: ruc.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hashPassword(password),
        status: "PENDING",
        mfaSecret: mfa.secret,
        mfaEnabled: true,
      },
    });

    // Registrar en auditoría (RF-15)
    await prisma.auditLog.create({
      data: {
        user: email,
        role: "INSTITUTION",
        action: "REGISTER_INSTITUTION",
        detail: `Solicitud de registro de institución ${name} (RUC: ${ruc}) en estado PENDING.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Institución registrada exitosamente. Pendiente de aprobación por el administrador.",
      institution: {
        id: institution.id,
        name: institution.name,
        ruc: institution.ruc,
        email: institution.email,
        status: institution.status,
      },
      mfa: {
        secret: mfa.secret,
        otpauthUrl: mfa.otpauthUrl,
      },
    });
  } catch (err: any) {
    console.error("Error en /api/institutions/register:", err);
    return NextResponse.json(
      { error: err.message || "Error al procesar el registro" },
      { status: 500 }
    );
  }
}
