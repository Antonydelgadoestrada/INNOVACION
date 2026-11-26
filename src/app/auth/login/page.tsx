"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Building2,
  UserCog,
  GraduationCap,
  QrCode,
  CheckCircle2,
} from "lucide-react";

type RoleTab = "institution" | "admin" | "titular" | "verificador";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRoleParam = searchParams.get("role");
  const [activeTab, setActiveTab] = useState<RoleTab>(
    initialRoleParam === "admin" ? "admin" : "institution"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized_role") {
      setError("Acceso restringido: Inicia sesión con las credenciales del rol solicitado.");
    }
    const roleParam = searchParams.get("role");
    if (roleParam === "admin") {
      setActiveTab("admin");
    } else if (roleParam === "institucion") {
      setActiveTab("institution");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          mfaCode: step === "mfa" ? mfaCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      if (data.requireMfa) {
        setStep("mfa");
        setIsLoading(false);
        return;
      }

      // Redirigir según el rol
      const redirectUrl = searchParams.get("redirect") || data.redirectUrl || (data.role === "ADMIN" ? "/admin" : "/institucion");
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar la solicitud");
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string, tab: RoleTab) => {
    setActiveTab(tab);
    setEmail(demoEmail);
    setPassword(demoPass);
    setMfaCode("123456");
    setStep("credentials");
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {step === "credentials" ? "Iniciar Sesión en VeriChain" : "Verificación en Dos Pasos (MFA)"}
          </h1>
          <p className="text-xs text-slate-400">
            {step === "credentials"
              ? "Selecciona tu perfil de usuario y accede a tu panel especializado"
              : "Ingresa el código temporal de 6 dígitos de tu app autenticadora (Google Authenticator)"}
          </p>
        </div>

        {/* Role Selector Tabs */}
        {step === "credentials" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("institution");
                setError(null);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeTab === "institution"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Institución</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setError(null);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeTab === "admin"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCog className="w-4 h-4" />
              <span>Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("titular");
                setError(null);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeTab === "titular"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Titular</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("verificador");
                setError(null);
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                activeTab === "verificador"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Verificador</span>
            </button>
          </div>
        )}

        {/* Demo shortcuts */}
        {step === "credentials" && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-teal-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accesos Rápidos de Demostración:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickCredentials("certificados@uni.edu.pe", "Uni2026!", "institution")}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left font-medium transition-colors"
              >
                🏛️ Institución UNI
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin@verichain.pe", "Admin2026!", "admin")}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-left font-medium transition-colors"
              >
                🛡️ Administrador VeriChain
              </button>
            </div>
          </div>
        )}

        {/* Vistas según el Rol */}
        {activeTab === "titular" ? (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">¿Eres Estudiante o Graduado?</h2>
            <p className="text-xs text-slate-400">
              Los titulares de credenciales no necesitan contraseña. Puedes consultar y descargar tus certificados digitales oficiales con tu DNI, correo o enlace privado.
            </p>
            <div className="pt-2">
              <Link
                href="/titular"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20"
              >
                <span>Acceder al Portal del Titular</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : activeTab === "verificador" ? (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Verificación Pública Gratuita</h2>
            <p className="text-xs text-slate-400">
              Cualquier empresa, reclutador o entidad puede verificar la autenticidad de un certificado en segundos mediante código QR, archivo PDF o identificador UUID.
            </p>
            <div className="pt-2">
              <Link
                href="/verificar"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20"
              >
                <span>Ir al Portal de Verificación</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Formulario de Login para Institución y Admin */
          <form onSubmit={handleLogin} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 shadow-2xl">
            {step === "credentials" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {activeTab === "admin" ? "Correo de Administrador" : "Correo Institucional"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={activeTab === "admin" ? "admin@verichain.pe" : "certificados@universidad.edu.pe"}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Contraseña</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Segundo Factor Requerido (RF-02)</span>
                  </div>
                  Ingresa el código temporal de tu app autenticadora o el código de prueba demo <strong>123456</strong>.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Código de Seguridad (6 dígitos)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-teal-500 text-center tracking-[0.5em] font-mono text-xl text-white font-bold focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Volver al correo y contraseña
                </button>
              </div>
            )}

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
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>{step === "credentials" ? "Continuar con MFA" : "Confirmar Acceso Seguro"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400">
          ¿Tu institución educativa aún no está registrada?{" "}
          <Link href="/auth/registro" className="text-teal-400 font-semibold hover:underline">
            Solicitar registro de institución
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
