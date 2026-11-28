import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  generateAdminPdfReport,
  generateAdminCsvReport,
  AdminReportData,
} from "@/lib/reports";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Administrador." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "pdf";
    const scope = (searchParams.get("scope") as "general" | "institutions" | "audits") || "general";

    // 1. Obtener datos de instituciones
    const institutionsDb = await prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { credentials: true },
        },
      },
    });

    const totalCredentials = await prisma.credential.count();
    const totalVerifications = await prisma.verificationLog.count();

    const validVerifications = await prisma.verificationLog.count({
      where: { result: "VALIDA" },
    });
    const alteredVerifications = await prisma.verificationLog.count({
      where: { result: "ALTERADA" },
    });
    const revokedVerifications = await prisma.verificationLog.count({
      where: { result: "REVOCADA" },
    });
    const unrecognizedVerifications = await prisma.verificationLog.count({
      where: { result: "NO_RECONOCIDA" },
    });

    const auditLogsDb = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 25,
    });

    const approvedCount = institutionsDb.filter((i) => i.status === "APPROVED").length;
    const pendingCount = institutionsDb.filter((i) => i.status === "PENDING").length;
    const suspendedCount = institutionsDb.filter((i) => i.status === "SUSPENDED").length;

    const todayStr = new Date().toISOString().split("T")[0];

    const reportData: AdminReportData = {
      generatedAt: new Date().toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      totalInstitutions: institutionsDb.length,
      approvedInstitutions: approvedCount,
      pendingInstitutions: pendingCount,
      suspendedInstitutions: suspendedCount,
      totalCredentials,
      totalVerifications,
      validVerifications,
      alteredVerifications,
      revokedVerifications,
      unrecognizedVerifications,
      institutions: institutionsDb.map((i) => ({
        name: i.name,
        ruc: i.ruc,
        email: i.email,
        status: i.status,
        credentialsCount: i._count.credentials,
        createdAt: i.createdAt.toISOString(),
      })),
      auditLogs: auditLogsDb.map((l) => ({
        user: l.user,
        role: l.role,
        action: l.action,
        detail: l.detail,
        timestamp: l.timestamp.toISOString(),
      })),
    };

    if (format === "csv") {
      const csvContent = generateAdminCsvReport(reportData, scope);
      const filename = `verichain-admin-${scope}-${todayStr}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Por defecto formato PDF
    const pdfBytes = await generateAdminPdfReport(reportData);
    const filename = `verichain-reporte-ejecutivo-${todayStr}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error al generar reporte de administrador:", error);
    return NextResponse.json(
      { error: "Error al generar el reporte: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
