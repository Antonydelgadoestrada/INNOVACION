"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  FileCheck2,
  Download,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function TitularPortalPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/titular/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se encontraron resultados");
      }

      setResults(data.credentials || []);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al buscar");
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickSearch = (val: string) => {
    setQuery(val);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Portal del Titular • Acceso Oficial para Estudiantes y Graduados</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Mis Credenciales y Certificados
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Consulta y descarga tus certificados digitales oficiales con firma criptográfica Ed25519,
          código QR y evidencia inmutable en Blockchain.
        </p>
      </div>

      {/* Demo Search Helpers */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-2 max-w-xl mx-auto shadow-lg">
        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consultas de Demostración:</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => fillQuickSearch("carlos.mendoza@gmail.com")}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left font-medium transition-colors"
          >
            🎓 Carlos Mendoza (UNI)
          </button>
          <button
            type="button"
            onClick={() => fillQuickSearch("ana.paredes@gmail.com")}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left font-medium transition-colors"
          >
            🎓 Ana Paredes (UNI)
          </button>
        </div>
      </div>

      {/* Formulario de Consulta */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Correo del Titular, Documento o Token Privado
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ej: carlos.mendoza@gmail.com o DNI"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 transition-all font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Puedes ingresar tu correo registrado, los últimos dígitos de tu documento o tu enlace privado.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Buscando en Blockchain y Base de Datos...</span>
              </>
            ) : (
              <>
                <span>Consultar Mis Certificados</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Resultados */}
      {results !== null && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-base font-bold text-white flex items-center justify-between">
            <span>Certificados Encontrados ({results.length})</span>
            <span className="text-xs text-teal-400 font-normal">Verificados criptográficamente</span>
          </h2>

          {results.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center space-y-2">
              <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                No se encontraron credenciales con los datos ingresados
              </p>
              <p className="text-xs text-slate-500">
                Verifica que el correo o documento coincida con el registrado por la institución emisora.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((cred) => (
                <div
                  key={cred.id}
                  className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                        {cred.credentialType}
                      </span>
                      <h3 className="text-base font-bold text-white">{cred.programName}</h3>
                    </div>
                    <span
                      className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        cred.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {cred.status === "ACTIVE" ? "✓ VÁLIDA" : "✕ REVOCADA"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{cred.institutionName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Emitido el: {cred.issueDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Titular: {cred.recipientName} ({cred.recipientIdMasked})</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/titular/${cred.recipientToken}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-teal-500/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ver y Descargar Certificado Oficial</span>
                    </Link>

                    <Link
                      href={`/verificar/${cred.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                      <span>Registro Público QR</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
