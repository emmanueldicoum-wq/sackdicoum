import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';
import {
  Camera,
  X,
  ScanBarcode,
  RefreshCw,
  Flashlight,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Volume2,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product, scannedCode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
}) => {
  const { formatPrice } = useCurrency();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'active' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [lastFeedback, setLastFeedback] = useState<{
    type: 'success' | 'not_found' | 'out_of_stock';
    message: string;
    product?: Product;
    code: string;
  } | null>(null);

  const playBeep = useCallback((success: boolean) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = success ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(success ? 1200 : 320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.14 : 0.25));
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.14 : 0.25));
    } catch {
      // Ignore audio errors if blocked by browser policy
    }
  }, []);

  const processScannedCode = useCallback((rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    const now = Date.now();
    // 1.5s cooldown for identical code in continuous camera scanning
    if (lastScanRef.current.code === cleanCode && now - lastScanRef.current.time < 1500) {
      return;
    }
    lastScanRef.current = { code: cleanCode, time: now };

    const normalized = cleanCode.toLowerCase();
    const matched = products.find(
      p =>
        (p.barcode && p.barcode.toLowerCase() === normalized) ||
        p.sku.toLowerCase() === normalized
    );

    if (!matched) {
      playBeep(false);
      setLastFeedback({
        type: 'not_found',
        code: cleanCode,
        message: `Aucun produit trouvé pour le code "${cleanCode}".`,
      });
      return;
    }

    if (matched.stock <= 0) {
      playBeep(false);
      setLastFeedback({
        type: 'out_of_stock',
        code: cleanCode,
        product: matched,
        message: `Rupture de stock pour "${matched.name}" (0 disponible).`,
      });
      return;
    }

    playBeep(true);
    onProductScanned(matched, cleanCode);
    setLastFeedback({
      type: 'success',
      code: cleanCode,
      product: matched,
      message: `Ajouté au ticket : ${matched.name}`,
    });

    if (!continuousMode) {
      setTimeout(() => {
        onClose();
      }, 450);
    }
  }, [products, onProductScanned, playBeep, continuousMode, onClose]);

  const stopCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
      controlsRef.current = null;
    } catch {
      // Ignore stop error
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startScanner = useCallback(async (deviceIdToUse?: string) => {
    if (!videoRef.current) return;
    stopCamera();
    setCameraStatus('starting');
    setErrorMessage('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('UNSUPPORTED');
      }

      const reader = new BrowserMultiFormatReader();
      let activeDeviceId = deviceIdToUse;

      // Enumerate devices first (after requesting permission if needed)
      try {
        const videoDevices = await BrowserCodeReader.listVideoInputDevices();
        setDevices(videoDevices);
        if (!activeDeviceId && videoDevices.length > 0) {
          // Prefer rear camera ("back" / "environment" / "arrière")
          const rearCamera = videoDevices.find(d =>
            /back|rear|environment|arrière/i.test(d.label)
          );
          activeDeviceId = (rearCamera || videoDevices[0]).deviceId;
          setSelectedDeviceId(activeDeviceId);
        }
      } catch {
        // Proceed with default undefined deviceId
      }

      const controls = await reader.decodeFromVideoDevice(
        activeDeviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            processScannedCode(result.getText());
          }
          // Ignore NotFoundException during idle frames
          void error;
        }
      );

      controlsRef.current = controls;
      setCameraStatus('active');

      // Check torch capability if exposed
      if (typeof controls.switchTorch === 'function' && videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        setTorchSupported(BrowserCodeReader.mediaStreamIsTorchCompatible(stream));
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : '';
      setCameraStatus('error');

      if (errMsg === 'UNSUPPORTED') {
        setErrorMessage("Votre navigateur ne supporte pas l'accès caméra ou le contexte n'est pas sécurisé (HTTPS requis).");
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorMessage("Accès à la caméra refusé. Autorisez la caméra dans votre navigateur ou utilisez la saisie/simulation ci-dessous.");
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorMessage("Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle ou les codes de test ci-dessous.");
      } else {
        setErrorMessage("Impossible de démarrer la caméra sur cet appareil. Utilisez la saisie manuelle ci-dessous.");
      }
    }
  }, [processScannedCode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setLastFeedback(null);
      startScanner(selectedDeviceId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCameraSwitch = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startScanner(newDeviceId);
  };

  const handleToggleTorch = async () => {
    if (!controlsRef.current?.switchTorch) return;
    try {
      const next = !torchOn;
      await controlsRef.current.switchTorch(next);
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    lastScanRef.current = { code: '', time: 0 }; // bypass cooldown on manual entry
    processScannedCode(manualCode);
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                Scanner Code-Barres Produit
              </h3>
              <p className="text-[11px] text-sky-200">
                Formats supportés : EAN-13, EAN-8, Code 128, UPC, QR Code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fermer le scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Camera Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {devices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleCameraSwitch(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 max-w-[200px]"
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Caméra ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}

              {torchSupported && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    torchOn
                      ? 'bg-amber-400 text-slate-900 border-amber-500'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span>Flash</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => startScanner(selectedDeviceId || undefined)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Relancer la caméra"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-semibold text-slate-700">Scan continu</span>
            </label>
          </div>

          {/* Video Viewfinder Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStatus === 'active' ? 'opacity-100' : 'opacity-30'}`}
            />

            {/* Viewfinder Overlay when active */}
            {cameraStatus === 'active' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Target Box */}
                <div className="relative w-64 sm:w-72 h-36 sm:h-40 rounded-2xl border-2 border-sky-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]">
                  {/* Corner accents */}
                  <span className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-sky-400 rounded-tl-xl" />
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-sky-400 rounded-tr-xl" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-sky-400 rounded-bl-xl" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-sky-400 rounded-br-xl" />

                  {/* Animated Laser Line */}
                  <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
                </div>

                <div className="mt-4 px-3 py-1 rounded-full bg-black/70 text-white text-[11px] font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Caméra active • Alignez le code-barres dans le cadre</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {cameraStatus === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-2 p-4 text-center">
                <Camera className="w-8 h-8 text-sky-400 animate-pulse" />
                <p className="font-semibold">Initialisation de la caméra...</p>
                <p className="text-[11px] text-slate-400">Veuillez autoriser l'accès à votre caméra si le navigateur le demande.</p>
              </div>
            )}

            {/* Error State */}
            {cameraStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-2.5 p-6 text-center bg-slate-900/90">
                <div className="p-3 rounded-full bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm">Caméra indisponible</p>
                <p className="text-slate-300 max-w-sm leading-relaxed">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => startScanner(selectedDeviceId || undefined)}
                  className="mt-1 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
                >
                  Réessayer la caméra
                </button>
              </div>
            )}
          </div>

          {/* Real-time Scan Result Feedback Banner */}
          {lastFeedback && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150 ${
              lastFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {lastFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{lastFeedback.message}</p>
                  <p className="text-[11px] opacity-80 font-mono">
                    Code : {lastFeedback.code}
                    {lastFeedback.product && ` • ${formatPrice(lastFeedback.product.sellPrice)}`}
                  </p>
                </div>
              </div>
              <Volume2 className="w-4 h-4 opacity-50 shrink-0" />
            </div>
          )}

          {/* Manual Input / USB Scanner Fallback & Quick Simulation */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Saisir un code-barres EAN ou SKU (ex: 6130001000012)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-sky-700 text-white text-xs font-bold transition-colors shrink-0"
              >
                Ajouter
              </button>
            </form>

            {/* Sample Quick Scan Test Chips */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>Test rapide (cliquer pour simuler un scan)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      lastScanRef.current = { code: '', time: 0 };
                      processScannedCode(p.barcode || p.sku);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-[10px] font-medium text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span className="font-mono font-bold text-sky-700">{p.barcode || p.sku}</span>
                    <span className="truncate max-w-[110px] text-slate-500">({p.name})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Astuce : Un lecteur code-barres USB fonctionne aussi directement dans la recherche POS.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
};
