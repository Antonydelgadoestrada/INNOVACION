import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Lock,
  Layers,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Innovación & Transformación Digital • Prototipo Funcional</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight">
          Verificación Inmutable de Credenciales Digitales con{" "}
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Blockchain & Ed25519
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
          Comprueba en segundos si un certificado académico es auténtico, si fue
          alterado, revocado o si no existe en el registro. Cero datos personales
          en la Blockchain: solo la huella criptográfica inmutable.
        </p>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/verificar"
            className="px-7 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-xl shadow-teal-500/25 flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Verificar una Credencial
          </Link>

          <Link
            href="/demo"
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all flex items-center gap-2"
          >
            <span>Laboratorio Demo (4 Estados)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/auth/login"
            className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-400 border border-teal-500/30 text-sm font-semibold transition-all"
          >
            Acceso Instituciones
          </Link>
        </div>

        {/* 4 Status Pills */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center gap-2.5 text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-400">VÁLIDA</div>
              <div className="text-[10px] text-slate-400">Hash & firma correctos</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/30 flex items-center gap-2.5 text-left">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-400">ALTERADA</div>
              <div className="text-[10px] text-slate-400">Discrepancia detectada</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/30 flex items-center gap-2.5 text-left">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-400">REVOCADA</div>
              <div className="text-[10px] text-slate-400">Anulada por institución</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center gap-2.5 text-left">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-300">NO RECONOCIDA</div>
              <div className="text-[10px] text-slate-400">ID ajeno o inexistente</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptographic Architecture Highlights */}
      <section className="w-full py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">
              Arquitectura Técnica y Criptográfica
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Cómo resuelve VeriChain el fraude documental?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                1. Hash Canónico SHA-256 + Sal
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Los datos académicos se ordenan alfabéticamente en un JSON canónico
                con una sal única. Si se modifica aunque sea un carácter, el hash
                resultante cambia por completo (efecto avalancha).
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                2. Firma Digital Asimétrica Ed25519
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cada universidad o institución emisora firma el hash con su clave
                privada Ed25519 cifrada bajo AES-256-GCM. Nadie puede suplantar la
                autoría de la institución.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                3. Blockchain Inmutable (Sepolia)
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                El contrato inteligente registra el identificador, el hash de datos,
                el hash del archivo PDF y la dirección emisora. Nunca se guardan
                datos personales en la cadena (privacidad por diseño).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explanatory Banner */}
      <section className="py-16 px-4 max-w-5xl mx-auto text-center">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            Demostración Universitaria Lista para Exposición
          </h3>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            El sistema incluye datos de prueba precargados, generador de PDF
            con códigos QR funcionales, lector con cámara web y el contrato
            inteligente CredentialRegistry listo en red local y Sepolia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-teal-500/20"
            >
              Probar los 4 Estados Ahora
            </Link>
            <Link
              href="/institucion"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition-all"
            >
              Emitir Nueva Credencial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
