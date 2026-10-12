"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function QrScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "verichain-reader";
  const router = useRouter();

  const handleScanSuccess = (decodedText: string) => {
    // Si contiene URL completa /verificar/<id>, extraemos el id
    const match = decodedText.match(/verificar\/([a-f0-9\-]+)/i);
    const credentialId = match ? match[1] : decodedText.trim();

    stopScanner();
    router.push(`/verificar/${credentialId}`);
  };

  const startScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" }, // Cámara trasera preferida
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {
          // Frame no decodificado, ignorar
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Error al iniciar cámara:", err);
      setError(
        "No se pudo acceder a la cámara. Asegúrate de otorgar permisos de cámara en tu navegador."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error al detener cámara:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Contenedor del video de la cámara */}
      <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 relative min-h-[280px] flex items-center justify-center">
        <div id={readerId} className="w-full h-full" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/90 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Escáner de Código QR
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Apunta la cámara al código QR impreso en el certificado oficial
              </p>
            </div>
            <button
              onClick={startScanner}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-teal-500/25 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Activar Cámara
            </button>
          </div>
        )}
      </div>

      {isScanning && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={stopScanner}
            type="button"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <CameraOff className="w-4 h-4" /> Detener Escáner
          </button>
          <span className="text-[11px] text-teal-400 animate-pulse font-medium">
            Buscando código QR de VeriChain...
          </span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
