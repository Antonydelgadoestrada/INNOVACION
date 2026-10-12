import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  QrCode,
  Eye,
  ExternalLink,
  ShieldCheck,
  Ban,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InstitutionDashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string };
}) {
  // Obtener institución principal aprobada (UNI)
  const institution = await prisma.institution.findFirst({
    where: { status: "APPROVED" },
    include: {
      credentials: {
        include: {
          _count: {
            select: { verificationLogs: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!institution) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">No hay institución aprobada activa</h1>
        <p className="text-sm text-slate-400">
          Por favor ingresa al panel de administrador para aprobar una institución o ejecuta el seed.
        </p>
        <Link
          href="/admin"
          className="inline-block px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs uppercase"
        >
          Ir al Panel Administrador
        </Link>
      </div>
    );
  }

  const query = searchParams?.q?.toLowerCase() || "";
  const filterStatus = searchParams?.status || "ALL";

  // Filtrar credenciales
  const filteredCredentials = institution.credentials.filter((cred) => {
    const matchesQuery =
      !query ||
      cred.recipientName.toLowerCase().includes(query) ||
      cred.programName.toLowerCase().includes(query) ||
      cred.id.toLowerCase().includes(query);

    const matchesStatus =
      filterStatus === "ALL" || cred.status === filterStatus;

    return matchesQuery && matchesStatus;
  });

  const totalIssued = institution.credentials.length;
  const activeCount = institution.credentials.filter((c) => c.status === "ACTIVE").length;
  const revokedCount = institution.credentials.filter((c) => c.status === "REVOKED").length;
  const totalVerifications = institution.credentials.reduce(
    (acc, curr) => acc + curr._count.verificationLogs,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white">{institution.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                APROBADA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              RUC: {institution.ruc} • Correo: {institution.email} • Claves Ed25519 Activas
            </p>
          </div>
        </div>

        {/* Quick Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/institucion/emitir"
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Emitir Credencial</span>
          </Link>
          <Link
            href="/institucion/emision-masiva"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>Carga CSV</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Emitidas
          </span>
          <div className="text-3xl font-black text-white">{totalIssued}</div>
          <span className="text-[11px] text-teal-400 mt-1 inline-block">Registradas en Blockchain</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Activas y Válidas
          </span>
          <div className="text-3xl font-black text-emerald-400">{activeCount}</div>
          <span className="text-[11px] text-emerald-400/80 mt-1 inline-block">Sin alteraciones</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Revocadas
          </span>
          <div className="text-3xl font-black text-rose-400">{revokedCount}</div>
          <span className="text-[11px] text-rose-400/80 mt-1 inline-block">Con motivo registrado</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Consultas Realizadas
          </span>
          <div className="text-3xl font-black text-teal-300">{totalVerifications}</div>
          <span className="text-[11px] text-slate-400 mt-1 inline-block">Historial de consultas (RF-13)</span>
        </div>
      </div>

      {/* Credentials Table / List (RF-11) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" />
              Credenciales Académicas Emitidas (RF-11)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Búsqueda, descarga de certificados PDF con QR y gestión de revocación
            </p>
          </div>

          {/* Search bar */}
          <form method="GET" className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por titular o curso..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Titular</th>
                <th className="py-3.5 px-4">Programa / Curso</th>
                <th className="py-3.5 px-4">Fecha Emisión</th>
                <th className="py-3.5 px-4 text-center">Verificaciones</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {filteredCredentials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron credenciales emitidas con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredCredentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{cred.recipientName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        DNI: {cred.recipientIdMasked}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{cred.programName}</div>
                      <div className="text-[11px] text-teal-400/90">{cred.credentialType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {cred.issueDate.toISOString().split("T")[0]}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        {cred._count.verificationLogs} veces
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cred.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <XCircle className="w-3 h-3" /> REVOCADA
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/institucion/credencial/${cred.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detalle
                      </Link>
                      <Link
                        href={`/verificar/${cred.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        title="Verificar públicamente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
