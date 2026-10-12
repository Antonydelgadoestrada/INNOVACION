import { prisma } from "@/lib/prisma";
import {
  UserCog,
  Building2,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  History,
} from "lucide-react";
import { AdminInstitutionActions } from "./AdminInstitutionActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Obtener datos de la base de datos (RF-14)
  const institutions = await prisma.institution.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { credentials: true },
      },
    },
  });

  const totalCredentials = await prisma.credential.count();
  const totalVerifications = await prisma.verificationLog.count();

  // Verificaciones por estado (RF-14)
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

  // 2. Registros de auditoría (RF-15)
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 15,
  });

  const pendingCount = institutions.filter((i) => i.status === "PENDING").length;
  const approvedCount = institutions.filter((i) => i.status === "APPROVED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <UserCog className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Administrador de la Plataforma
            </div>
            <h1 className="text-2xl font-extrabold text-white">Panel de Control y Auditoría</h1>
            <p className="text-xs text-slate-400">
              Gobernanza de instituciones, métricas globales del sistema y registro inmutable de acciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
              ⚠️ {pendingCount} Institución(es) pendiente(s)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              ✓ Todas las instituciones al día
            </span>
          )}
        </div>
      </div>

      {/* Indicadores Globales (RF-14) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Instituciones Registradas
          </span>
          <div className="text-3xl font-black text-white">{institutions.length}</div>
          <span className="text-[11px] text-teal-400 mt-1 inline-block">
            {approvedCount} aprobadas • {pendingCount} pendientes
          </span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Credenciales Emitidas
          </span>
          <div className="text-3xl font-black text-teal-400">{totalCredentials}</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Registros en Blockchain</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Verificaciones Totales
          </span>
          <div className="text-3xl font-black text-emerald-400">{totalVerifications}</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Consultas por QR y PDF</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Verificaciones Válidas
          </span>
          <div className="text-3xl font-black text-emerald-300">{validVerifications}</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">
            {alteredVerifications} alteradas • {revokedVerifications} revocadas
          </span>
        </div>
      </div>

      {/* Breakdown of Verifications by Status (RF-14) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          Desglose de Verificaciones por Estado (RF-14)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xl font-black text-emerald-400">{validVerifications}</div>
              <div className="text-xs text-emerald-300 font-semibold">VÁLIDA</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="text-xl font-black text-amber-400">{alteredVerifications}</div>
              <div className="text-xs text-amber-300 font-semibold">ALTERADA</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="text-xl font-black text-rose-400">{revokedVerifications}</div>
              <div className="text-xs text-rose-300 font-semibold">REVOCADA</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <div className="text-xl font-black text-slate-300">{unrecognizedVerifications}</div>
              <div className="text-xs text-slate-400 font-semibold">NO RECONOCIDA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de Instituciones (RF-03: Aprobar / Suspender) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            Instituciones Emisoras y Control de Acceso (RF-03)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Al aprobar una institución se genera automáticamente su par de claves asimétricas Ed25519 y se cifran con AES-256-GCM.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Institución</th>
                <th className="py-3.5 px-4">RUC & Correo</th>
                <th className="py-3.5 px-4 text-center">Claves Ed25519</th>
                <th className="py-3.5 px-4 text-center">Credenciales</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acción de Gobierno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100">{inst.name}</td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div>RUC: {inst.ruc}</div>
                    <div className="text-[11px] text-slate-400">{inst.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {inst.publicKey ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                        ✓ Generadas
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Pendiente</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                    {inst._count.credentials}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {inst.status === "APPROVED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        APROBADA
                      </span>
                    )}
                    {inst.status === "PENDING" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        PENDIENTE
                      </span>
                    )}
                    {inst.status === "SUSPENDED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        SUSPENDIDA
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <AdminInstitutionActions
                      institutionId={inst.id}
                      currentStatus={inst.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Auditoría (RF-15) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Registro de Auditoría del Sistema (RF-15)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trazabilidad de inicios de sesión, emisiones, revocaciones y aprobaciones de instituciones.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Rol</th>
                <th className="py-3.5 px-4">Acción</th>
                <th className="py-3.5 px-4">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("es-PE")}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">{log.user}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold border border-slate-700">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-100">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-300 break-all">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
