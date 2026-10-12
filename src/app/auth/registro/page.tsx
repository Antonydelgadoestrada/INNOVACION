"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, Lock, FileText, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterInstitutionPage() {
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/institutions/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ruc, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar la institución");
      }

      setRegisteredSuccess(data);
    } catch (err: any) {
      setError(err.message || "Error al procesar el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Registro de Institución Emisora</h1>
          <p className="text-xs text-slate-400">
            Requisito RF-01: Al registrarse queda en estado <strong>PENDIENTE</strong> hasta aprobación del Administrador
          </p>
        </div>

        {registeredSuccess ? (
          <div className="glass-card rounded-3xl p-8 border border-emerald-500/30 text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">¡Solicitud Registrada con Éxito!</h2>
            <p className="text-sm text-slate-300">
              La institución <strong>{registeredSuccess.institution.name}</strong> ha sido registrada con estado inicial{" "}
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-xs">
                PENDIENTE
              </span>.
            </p>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left space-y-1 font-mono">
              <div>RUC: {registeredSuccess.institution.ruc}</div>
              <div>Correo: {registeredSuccess.institution.email}</div>
              <div className="text-teal-400 pt-1">
                Secreto MFA asignado: {registeredSuccess.mfa?.secret}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              El administrador de la plataforma debe aprobarla en el panel de control antes de que pueda emitir credenciales.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/auth/login"
                className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20"
              >
                Ir a Iniciar Sesión
              </Link>
              <Link
                href="/admin"
                className="text-xs text-slate-400 hover:text-white"
              >
                Ver como Administrador para Aprobación Inmediata →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nombre Oficial de la Institución</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ej: Universidad Nacional de Ingeniería"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">RUC de la Institución (11 dígitos)</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={11}
                  placeholder="Ej: 20148092282"
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Correo Electrónico Institucional</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="certificados@universidad.edu.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Contraseña de Acceso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registrando institución...</span>
                </>
              ) : (
                <>
                  <span>Enviar Solicitud de Registro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400">
          ¿Ya tienes cuenta aprobada?{" "}
          <Link href="/auth/login" className="text-teal-400 font-semibold hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
