import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  generateInstitutionPdfReport,
  generateInstitutionCsvReport,
  InstitutionReportData,
} from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "INSTITUTION") {
      return NextResponse.json(
        { error: "No autorizado. Requiere rol de Institución Emisora." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "pdf";
    const statusFilter = searchParams.get("status") || "ALL";

    // Buscar institución de la sesión
    let institution = await prisma.institution.findUnique({
      where: { id: session.institutionId || session.userId },
      include: {
        credentials: {
          where:
            statusFilter === "ALL"
              ? undefined
              : { status: statusFilter },
          include: {
            _count: {
              select: { verificationLogs: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!institution && session.email) {
      institution = await prisma.institution.findUnique({
        where: { email: session.email },
        include: {
          credentials: {
            where:
              statusFilter === "ALL"
                ? undefined
                : { status: statusFilter },
            include: {
              _count: {
                select: { verificationLogs: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    if (!institution) {
      return NextResponse.json(
        { error: "Institución no encontrada." },
        { status: 404 }
      );
    }

    // Estadísticas globales de la institución (sin filtro de estado para los conteos)
    const allCreds = await prisma.credential.findMany({
      where: { institutionId: institution.id },
      select: { status: true },
    });

    const totalIssued = allCreds.length;
    const activeCount = allCreds.filter((c) => c.status === "ACTIVE").length;
    const revokedCount = allCreds.filter((c) => c.status === "REVOKED").length;

    const totalVerifications = institution.credentials.reduce(
      (acc, curr) => acc + curr._count.verificationLogs,
      0
    );

    const todayStr = new Date().toISOString().split("T")[0];

    const reportData: InstitutionReportData = {
      institutionName: institution.name,
      institutionRuc: institution.ruc,
      institutionEmail: institution.email,
      institutionStatus: institution.status,
      generatedAt: new Date().toLocaleString("es-PE", {
        timeZone: "America/Lima",
        dateStyle: "medium",
        timeStyle: "short",
      }),
      totalIssued,
      activeCount,
      revokedCount,
      totalVerifications,
      credentials: institution.credentials.map((c) => ({
        id: c.id,
        recipientName: c.recipientName,
        recipientIdMasked: c.recipientIdMasked,
        recipientEmail: c.recipientEmail,
        programName: c.programName,
        credentialType: c.credentialType,
        issueDate: c.issueDate.toISOString().split("T")[0],
        status: c.status,
        revokeReason: c.revokeReason,
        dataHash: c.dataHash,
        txHash: c.txHash,
      })),
    };

    if (format === "csv") {
      const csvContent = generateInstitutionCsvReport(reportData);
      const filename = `credenciales-${institution.ruc}-${todayStr}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Por defecto PDF
    const pdfBytes = await generateInstitutionPdfReport(reportData);
    const filename = `reporte-credenciales-${institution.ruc}-${todayStr}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error al generar reporte de institución:", error);
    return NextResponse.json(
      { error: "Error al generar el reporte: " + (error?.message || error) },
      { status: 500 }
    );
  }
}
