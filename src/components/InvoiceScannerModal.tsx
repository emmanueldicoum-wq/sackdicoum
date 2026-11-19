import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  X,
  ScanText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  PackagePlus
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { extractInvoiceStockItems } from '../services/invoiceOcrService';
import { fileToOptimizedDataUrl } from '../services/imageDetectionService';

export interface IncomingStockLinePayload {
  mode: 'EXISTING' | 'NEW';
  productId?: string;
  newProduct?: {
    name: string;
    category: ProductCategory;
    unit: string;
    buyPrice: number;
    sellPrice: number;
  };
  quantity: number;
  unitBuyPrice: number;
  updateBuyPrice: boolean;
}

export interface ConfirmInvoiceStockPayload {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  reason: string;
  lines: IncomingStockLinePayload[];
}

interface EditableOcrRow {
  rowId: string;
  selected: boolean;
  detectedName: string;
  targetProductId: string; // product.id or '__NEW__'
  quantity: number;
  unit: string;
  unitBuyPrice: number;
  updateBuyPrice: boolean;
  newCategory: ProductCategory;
  newSellPrice: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirmIncomingStock: (payload: ConfirmInvoiceStockPayload) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onConfirmIncomingStock,
}) => {
  const { formatPrice } = useCurrency();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'active' | 'captured' | 'error'>('starting');
  const [cameraError, setCameraError] = useState<string>('');

  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSummaryNote, setOcrSummaryNote] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW' | null>(null);

  // Auto-filled invoice metadata & stock rows
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [reason, setReason] = useState('Réception facture fournisseur (OCR)');
  const [rows, setRows] = useState<EditableOcrRow[]>([]);

  const categories: ProductCategory[] = [
    'Mode & Wax',
    'Cosmétique Bio',
    'Alimentation Locale',
    'Artisanat & Déco',
    'High-Tech & Accessoires',
  ];

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (preferredDeviceId?: string) => {
    stopCamera();
    setCameraStatus('starting');
    setCameraError('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('UNSUPPORTED');
      }

      const constraints: MediaStreamConstraints = preferredDeviceId
        ? { video: { deviceId: { exact: preferredDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }
        : { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (!preferredDeviceId && videoInputs.length > 0) {
          const activeTrack = stream.getVideoTracks()[0];
          const activeId = activeTrack?.getSettings()?.deviceId;
          if (activeId) setSelectedDeviceId(activeId);
        }
      } catch {
        // Ignore enumeration error
      }

      setCameraStatus('active');
    } catch (err: unknown) {
      setCameraStatus('error');
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : '';

      if (errMsg === 'UNSUPPORTED') {
        setCameraError("Votre navigateur ne supporte pas l'accès caméra ou le mode sécurisé HTTPS est requis. Utilisez l'import photo ci-dessous.");
      } else if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError("Accès à la caméra refusé. Autorisez la caméra ou importez directement la photo de la facture.");
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError("Aucune caméra détectée sur cet appareil. Importez la photo de votre facture pour lancer l'OCR.");
      } else {
        setCameraError("Impossible d'ouvrir la caméra. Importez une image de facture depuis votre appareil.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage('');
      setOcrError(null);
      setOcrSummaryNote(null);
      setOcrConfidence(null);
      setRows([]);
      setSupplierName('');
      setInvoiceNumber('');
      setInvoiceDate('');
      setReason('Réception facture fournisseur (OCR)');
      void startCamera(selectedDeviceId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const runOcrOnImage = async (dataUrl: string) => {
    setCapturedImage(dataUrl);
    setCameraStatus('captured');
    stopCamera();
    setIsExtracting(true);
    setOcrError(null);
    setOcrSummaryNote(null);

    try {
      const result = await extractInvoiceStockItems({
        imageDataUrl: dataUrl,
        products,
      });

      setSupplierName(result.supplierName || 'Fournisseur');
      setInvoiceNumber(result.invoiceNumber || '');
      setInvoiceDate(result.invoiceDate || new Date().toISOString().slice(0, 10));
      setOcrConfidence(result.rawConfidence);
      setOcrSummaryNote(result.notes);

      const composedReason = [
        'Réception facture',
        result.invoiceNumber ? `#${result.invoiceNumber}` : null,
        result.supplierName ? `— ${result.supplierName}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      setReason(composedReason);

      const mappedRows: EditableOcrRow[] = result.items.map((item, idx) => {
        const matchedProd = products.find(p => p.id === item.matchedProductId);
        const targetId = matchedProd ? matchedProd.id : '__NEW__';
        const buyPrice = item.unitBuyPrice > 0 ? item.unitBuyPrice : matchedProd ? matchedProd.buyPrice : 0;

        return {
          rowId: `ocr-row-${Date.now()}-${idx}`,
          selected: true,
          detectedName: item.detectedName,
          targetProductId: targetId,
          quantity: Math.max(1, item.quantity),
          unit: matchedProd ? matchedProd.unit : item.unit || 'pièce',
          unitBuyPrice: buyPrice,
          updateBuyPrice: item.unitBuyPrice > 0,
          newCategory: 'Mode & Wax',
          newSellPrice: buyPrice > 0 ? Math.round((buyPrice * 1.35) / 100) * 100 : 5000,
          confidence: item.confidence,
        };
      });

      setRows(mappedRows);
      if (mappedRows.length === 0) {
        setOcrError("Aucune ligne d'article n'a pu être identifiée automatiquement sur cette image. Vous pouvez reprendre la photo ou ajouter les lignes manuellement ci-dessous.");
      }
    } catch (err: unknown) {
      setOcrError(err instanceof Error ? err.message : "Erreur lors de l'extraction OCR de la facture.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    void runOcrOnImage(dataUrl);
  };

  const handleUploadInvoiceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToOptimizedDataUrl(file, 1600);
      await runOcrOnImage(dataUrl);
    } catch (err: unknown) {
      setOcrError(err instanceof Error ? err.message : "Impossible de lire le fichier sélectionné.");
    }
    e.target.value = '';
  };

  const handleRetake = () => {
    setCapturedImage('');
    setOcrError(null);
    setOcrSummaryNote(null);
    setRows([]);
    void startCamera(selectedDeviceId || undefined);
  };

  const handleAddManualRow = () => {
    const fallbackProd = products[0];
    setRows(prev => [
      ...prev,
      {
        rowId: `manual-row-${Date.now()}`,
        selected: true,
        detectedName: fallbackProd ? fallbackProd.name : 'Nouvel article',
        targetProductId: fallbackProd ? fallbackProd.id : '__NEW__',
        quantity: 5,
        unit: fallbackProd ? fallbackProd.unit : 'pièce',
        unitBuyPrice: fallbackProd ? fallbackProd.buyPrice : 0,
        updateBuyPrice: false,
        newCategory: 'Mode & Wax',
        newSellPrice: 5000,
        confidence: 'HIGH',
      },
    ]);
  };

  const updateRow = (rowId: string, patch: Partial<EditableOcrRow>) => {
    setRows(prev =>
      prev.map(r => {
        if (r.rowId !== rowId) return r;
        const next = { ...r, ...patch };
        if (patch.targetProductId && patch.targetProductId !== '__NEW__') {
          const prod = products.find(p => p.id === patch.targetProductId);
          if (prod) {
            next.unit = prod.unit;
            if (next.unitBuyPrice === 0) {
              next.unitBuyPrice = prod.buyPrice;
            }
          }
        }
        return next;
      })
    );
  };

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.rowId !== rowId));
  };

  const selectedRows = rows.filter(r => r.selected && r.quantity > 0);
  const totalIncomingUnits = selectedRows.reduce((s, r) => s + r.quantity, 0);
  const totalEstimatedCost = selectedRows.reduce((s, r) => s + r.quantity * r.unitBuyPrice, 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRows.length === 0) return;

    const lines: IncomingStockLinePayload[] = selectedRows.map(r => {
      if (r.targetProductId === '__NEW__') {
        const buy = Math.max(0, Number(r.unitBuyPrice) || 0);
        const sell = Math.max(buy, Number(r.newSellPrice) || buy);
        return {
          mode: 'NEW',
          newProduct: {
            name: r.detectedName.trim() || 'Nouveau produit fournisseur',
            category: r.newCategory,
            unit: r.unit || 'pièce',
            buyPrice: buy,
            sellPrice: sell,
          },
          quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
          unitBuyPrice: buy,
          updateBuyPrice: false,
        };
      }

      return {
        mode: 'EXISTING',
        productId: r.targetProductId,
        quantity: Math.max(1, Math.round(Number(r.quantity) || 1)),
        unitBuyPrice: Math.max(0, Number(r.unitBuyPrice) || 0),
        updateBuyPrice: r.updateBuyPrice,
      };
    });

    onConfirmIncomingStock({
      supplierName: supplierName.trim() || 'Fournisseur',
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate.trim(),
      reason: reason.trim() || 'Réception facture fournisseur (OCR)',
      lines,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg">
                Scanner une Facture Fournisseur (OCR)
              </h3>
              <p className="text-[11px] text-sky-200">
                Capturez la facture via la caméra pour remplir automatiquement les nouveaux stocks entrants
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUploadInvoiceFile}
            className="hidden"
          />

          {/* Camera / Captured Photo Section */}
          {!capturedImage ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {devices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        void startCamera(e.target.value);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 max-w-[220px]"
                    >
                      {devices.map((d, idx) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Caméra ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => void startCamera(selectedDeviceId || undefined)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Relancer caméra</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 hover:border-sky-400 hover:bg-sky-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-600" />
                  <span>Importer une photo de facture</span>
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video max-h-[340px] w-full flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraStatus === 'active' ? 'opacity-100' : 'opacity-25'}`}
                />

                {cameraStatus === 'active' && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md h-48 sm:h-56 border-2 border-dashed border-sky-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.4)] flex items-end justify-center pb-2">
                      <span className="px-3 py-1 rounded-full bg-black/75 text-white text-[11px] font-medium">
                        Cadrez la facture entière bien éclairée
                      </span>
                    </div>
                  </div>
                )}

                {cameraStatus === 'starting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-2 p-4 text-center">
                    <Camera className="w-8 h-8 text-sky-400 animate-pulse" />
                    <p className="font-semibold">Initialisation de la caméra...</p>
                  </div>
                )}

                {cameraStatus === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs gap-3 p-6 text-center bg-slate-900/90">
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                    <p className="font-bold text-sm">Caméra indisponible</p>
                    <p className="text-slate-300 max-w-md leading-relaxed">{cameraError}</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void startCamera(selectedDeviceId || undefined)}
                        className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors"
                      >
                        Réessayer caméra
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer une photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {cameraStatus === 'active' && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-sky-600/25 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capturer la facture & lancer l'OCR</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Captured Image Preview + OCR Extraction Form */
            <form onSubmit={handleConfirm} className="space-y-5">
              {/* Top Preview Strip */}
              <div className="flex flex-col sm:flex-row gap-4 items-start p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={capturedImage}
                  alt="Facture capturée"
                  className="w-full sm:w-36 h-28 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold text-slate-900">Document capturé pour lecture OCR</span>
                      {ocrConfidence && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          · Lisibilité :{' '}
                          {ocrConfidence === 'HIGH'
                            ? 'Bonne'
                            : ocrConfidence === 'MEDIUM'
                            ? 'Correcte'
                            : 'Faible (vérifiez les chiffres)'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={handleRetake}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Reprendre</span>
                      </button>
                      <button
                        type="button"
                        disabled={isExtracting}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Autre photo</span>
                      </button>
                    </div>
                  </div>

                  {isExtracting && (
                    <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Lecture OCR des articles, quantités et prix en cours...</span>
                    </div>
                  )}

                  {ocrSummaryNote && !isExtracting && (
                    <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{ocrSummaryNote}</span>
                    </p>
                  )}

                  {ocrError && !isExtracting && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{ocrError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Header Fields */}
              {!isExtracting && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fournisseur</label>
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Ex: Grossiste Dantokpa"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">N° Facture / Bon</label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="Ex: FAC-2026-041"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Date facture</label>
                      <input
                        type="text"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        placeholder="2026-11-19"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Motif du mouvement</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Extracted Line Items Table */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-sm text-slate-900">
                        Détails des stocks entrants détectés ({rows.length} ligne{rows.length > 1 ? 's' : ''})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddManualRow}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter une ligne</span>
                      </button>
                    </div>

                    {rows.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                        Aucune ligne à importer pour le moment. Cliquez sur « Ajouter une ligne » ou reprenez la photo de la facture.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {rows.map((row) => (
                          <div
                            key={row.rowId}
                            className={`p-3.5 rounded-2xl border transition-colors text-xs space-y-2.5 ${
                              row.selected
                                ? 'bg-white border-slate-200'
                                : 'bg-slate-50 border-slate-200/60 opacity-60'
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              {/* Include toggle + OCR name */}
                              <div className="md:col-span-4 flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={row.selected}
                                  onChange={(e) => updateRow(row.rowId, { selected: e.target.checked })}
                                  className="mt-1 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <label className="block text-[10px] font-semibold text-slate-400">
                                    Désignation lue (OCR)
                                  </label>
                                  <input
                                    type="text"
                                    value={row.detectedName}
                                    onChange={(e) => updateRow(row.rowId, { detectedName: e.target.value })}
                                    className="w-full px-2.5 py-1.5 mt-0.5 rounded-lg border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  />
                                </div>
                              </div>

                              {/* Target Catalog Product */}
                              <div className="md:col-span-4">
                                <label className="block text-[10px] font-semibold text-slate-400">
                                  Produit associé en stock
                                </label>
                                <select
                                  value={row.targetProductId}
                                  onChange={(e) => updateRow(row.rowId, { targetProductId: e.target.value })}
                                  className="w-full px-2.5 py-1.5 mt-0.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                  <option value="__NEW__">+ Créer un nouveau produit au catalogue</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (Stock : {p.stock} {p.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity */}
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-400">
                                  Qté entrante ({row.unit})
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={row.quantity}
                                  onChange={(e) => updateRow(row.rowId, { quantity: Math.max(1, Number(e.target.value)) })}
                                  className="w-full px-2.5 py-1.5 mt-0.5 rounded-lg border border-slate-300 font-bold font-mono tabular-nums text-emerald-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              </div>

                              {/* Unit Buy Price + Remove */}
                              <div className="md:col-span-2 flex items-end gap-1.5">
                                <div className="flex-1">
                                  <label className="block text-[10px] font-semibold text-slate-400">
                                    P.U. Achat (FCFA)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={row.unitBuyPrice}
                                    onChange={(e) => updateRow(row.rowId, { unitBuyPrice: Math.max(0, Number(e.target.value)) })}
                                    className="w-full px-2.5 py-1.5 mt-0.5 rounded-lg border border-slate-300 font-mono tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRow(row.rowId)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Retirer cette ligne"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Extra inline fields when creating a brand new product */}
                            {row.targetProductId === '__NEW__' && (
                              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-sky-50/50 p-2.5 rounded-xl">
                                <div className="flex items-center gap-1.5 text-sky-800 font-semibold sm:col-span-3 text-[11px]">
                                  <PackagePlus className="w-3.5 h-3.5" />
                                  <span>Cet article n'est pas encore au catalogue — il sera créé automatiquement avec son stock initial :</span>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500">Catégorie</label>
                                  <select
                                    value={row.newCategory}
                                    onChange={(e) => updateRow(row.rowId, { newCategory: e.target.value as ProductCategory })}
                                    className="w-full px-2 py-1 mt-0.5 rounded-lg border border-slate-300 bg-white text-xs"
                                  >
                                    {categories.map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500">Unité</label>
                                  <input
                                    type="text"
                                    value={row.unit}
                                    onChange={(e) => updateRow(row.rowId, { unit: e.target.value })}
                                    className="w-full px-2 py-1 mt-0.5 rounded-lg border border-slate-300 bg-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500">Prix de vente prévu (FCFA)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={row.newSellPrice}
                                    onChange={(e) => updateRow(row.rowId, { newSellPrice: Math.max(0, Number(e.target.value)) })}
                                    className="w-full px-2 py-1 mt-0.5 rounded-lg border border-slate-300 bg-white text-xs font-mono tabular-nums"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-600 tabular-nums">
                      <span className="font-bold text-slate-900">{selectedRows.length}</span> ligne{selectedRows.length > 1 ? 's' : ''} sélectionnée{selectedRows.length > 1 ? 's' : ''}
                      {' · '}
                      <span className="font-bold text-emerald-700">+{totalIncomingUnits} unités</span>
                      {totalEstimatedCost > 0 && (
                        <>
                          {' · '}
                          <span>Total estimé : <strong className="text-slate-900">{formatPrice(totalEstimatedCost)}</strong></span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={selectedRows.length === 0}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider les entrées en stock</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
