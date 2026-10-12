"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Ban, Loader2 } from "lucide-react";

interface AdminInstitutionActionsProps {
  institutionId: string;
  currentStatus: string;
}

export function AdminInstitutionActions({
  institutionId,
  currentStatus,
}: AdminInstitutionActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (action: "APPROVE" | "SUSPEND" | "ACTIVATE") => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/institutions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Error al actualizar estado");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Error de red al actualizar estado");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-teal-400 inline-block" />;
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {currentStatus === "PENDING" && (
        <button
          onClick={() => handleAction("APPROVE")}
          className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase transition-colors shadow-sm"
        >
          Aprobar & Generar Claves
        </button>
      )}

      {currentStatus === "APPROVED" && (
        <button
          onClick={() => handleAction("SUSPEND")}
          className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-colors"
        >
          Suspender
        </button>
      )}

      {currentStatus === "SUSPENDED" && (
        <button
          onClick={() => handleAction("ACTIVATE")}
          className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-colors"
        >
          Reactivar
        </button>
      )}
    </div>
  );
}
