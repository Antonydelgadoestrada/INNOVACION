import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { VerificationStatus } from "@/lib/verify";

interface StatusBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "lg" }: StatusBadgeProps) {
  const configs = {
    VALIDA: {
      label: "VÁLIDA",
      desc: "Auténtica e íntegra. Hash verificado y firma válida en Blockchain.",
      bg: "bg-emerald-950/60 border-emerald-500/50 text-emerald-400",
      glow: "shadow-emerald-500/20",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: CheckCircle2,
    },
    ALTERADA: {
      label: "ALTERADA",
      desc: "Documento adulterado o firma inválida. El hash no coincide con Blockchain.",
      bg: "bg-amber-950/60 border-amber-500/50 text-amber-400",
      glow: "shadow-amber-500/20",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: AlertTriangle,
    },
    REVOCADA: {
      label: "REVOCADA",
      desc: "Credencial anulada formalmente por la institución emisora.",
      bg: "bg-rose-950/60 border-rose-500/50 text-rose-400",
      glow: "shadow-rose-500/20",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: XCircle,
    },
    NO_RECONOCIDA: {
      label: "NO RECONOCIDA",
      desc: "Identificador no registrado en la plataforma ni en la Blockchain.",
      bg: "bg-slate-900/80 border-slate-700/60 text-slate-400",
      glow: "shadow-slate-500/10",
      badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
      icon: HelpCircle,
    },
  };

  const config = configs[status] || configs.NO_RECONOCIDA;
  const Icon = config.icon;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.badgeBg}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 border-2 backdrop-blur-md shadow-2xl transition-all ${config.bg} ${config.glow}`}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-black/30 border border-white/10 shrink-0">
          <Icon className="w-10 h-10 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-black tracking-tight">{config.label}</h2>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${config.badgeBg}`}
            >
              Resultado Oficial
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-200 leading-relaxed font-medium">
            {config.desc}
          </p>
        </div>
      </div>
    </div>
  );
}
