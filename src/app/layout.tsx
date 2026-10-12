import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VeriChain - Emisión y Verificación de Credenciales en Blockchain",
  description:
    "Plataforma inmutable de emisión y verificación de credenciales y certificados académicos digitales con Hash SHA-256, Firma Ed25519 y Blockchain Ethereum.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-teal-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-8 px-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="font-bold text-slate-200">
                VeriChain • Prototipo Funcional
              </span>
              <span className="text-slate-400 text-[11px]">
                Curso: Innovación y Transformación Digital — Ingeniería de Sistemas e Informática (Perú)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>SHA-256</span>
              <span>•</span>
              <span>Ed25519</span>
              <span>•</span>
              <span>Solidity & Sepolia</span>
              <span>•</span>
              <span>Next.js 14 & Prisma</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
