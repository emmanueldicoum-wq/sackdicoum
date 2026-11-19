import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Upload,
  Link2,
  ScanSearch,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  Smartphone,
  Info,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Product, ImageDetectionResult, ProductImageVerification } from '../types';
import { analyzeImageAuthenticity, fileToOptimizedDataUrl } from '../services/imageDetectionService';

interface AntiFraudViewProps {
  products: Product[];
  onSaveProductVerification: (productId: string, verification: ProductImageVerification) => void;
}

interface HistoryEntry {
  id: string;
  label: string;
  previewSrc: string;
  result: ImageDetectionResult;
}

export const AntiFraudView: React.FC<AntiFraudViewProps> = ({
  products,
  onSaveProductVerification,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [context, setContext] = useState<'product_photo' | 'payment_proof' | 'general'>('product_photo');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImageDetectionResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const runAnalysis = async (params: {
    imageDataUrl?: string;
    imageUrl?: string;
    label: string;
    preview: string;
    productId?: string | null;
    productName?: string;
    overrideContext?: 'product_photo' | 'payment_proof' | 'general';
  }) => {
    const activeContext = params.overrideContext || context;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResult(null);
    setPreviewSrc(params.preview);
    setSourceLabel(params.label);
    setSelectedProductId(params.productId ?? null);

    try {
      const detection = await analyzeImageAuthenticity({
        imageDataUrl: params.imageDataUrl,
        imageUrl: params.imageUrl,
        context: activeContext,
        productName: params.productName,
      });

      setResult(detection);
      setHistory(prev => [
        {
          id: `scan-${Date.now()}`,
          label: params.label,
          previewSrc: params.preview,
          result: detection,
        },
        ...prev.slice(0, 5),
      ]);

      if (params.productId) {
        onSaveProductVerification(params.productId, {
          verdict: detection.verdict,
          aiProbability: detection.aiProbability,
          scamRiskLevel: detection.scamRiskLevel,
          summary: detection.summary,
          checkedAt: detection.analyzedAt,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'analyser cette image pour le moment.";
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide (JPG, PNG ou WEBP).');
      return;
    }

    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      await runAnalysis({
        imageDataUrl: dataUrl,
        label: file.name,
        preview: dataUrl,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
  };

  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    await runAnalysis({
      imageUrl: trimmed,
      label: trimmed,
      preview: trimmed,
    });
  };

  const handleInspectCatalogProduct = async (product: Product) => {
    setContext('product_photo');
    await runAnalysis({
      imageUrl: product.image.startsWith('http') ? product.image : undefined,
      imageDataUrl: product.image.startsWith('data:') ? product.image : undefined,
      label: product.name,
      preview: product.image,
      productId: product.id,
      productName: product.name,
      overrideContext: 'product_photo',
    });
  };

  const verifiedCount = products.filter(p => p.imageVerification?.verdict === 'AUTHENTIC').length;
  const flaggedCount = products.filter(
    p => p.imageVerification && p.imageVerification.verdict !== 'AUTHENTIC'
  ).length;

  const getVerdictMeta = (verdict: ImageDetectionResult['verdict']) => {
    if (verdict === 'AUTHENTIC') {
      return {
        title: 'Photo Authentique',
        badgeText: 'Risque faible',
        containerClass: 'bg-emerald-50 border-emerald-200 text-emerald-950',
        iconBg: 'bg-emerald-100 text-emerald-700',
        barColor: 'bg-emerald-600',
        Icon: ShieldCheck,
      };
    }
    if (verdict === 'SUSPICIOUS') {
      return {
        title: 'Photo Suspecte / Retouchée',
        badgeText: 'Vigilance requise',
        containerClass: 'bg-amber-50 border-amber-200 text-amber-950',
        iconBg: 'bg-amber-100 text-amber-700',
        barColor: 'bg-amber-500',
        Icon: AlertTriangle,
      };
    }
    return {
      title: 'Image IA ou Falsifiée Détectée',
      badgeText: "Risque élevé d'arnaque",
      containerClass: 'bg-rose-50 border-rose-200 text-rose-950',
      iconBg: 'bg-rose-100 text-rose-700',
      barColor: 'bg-rose-600',
      Icon: ShieldAlert,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Détection de Photos IA & Prévention des Arnaques
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vérifiez l'authenticité des photos fournisseurs, visuels produits et preuves de paiement Mobile Money avant validation
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold tabular-nums">
            {verifiedCount} produit{verifiedCount > 1 ? 's' : ''} vérifié{verifiedCount > 1 ? 's' : ''}
          </div>
          {flaggedCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold tabular-nums">
              {flaggedCount} alerte{flaggedCount > 1 ? 's' : ''} catalogue
            </div>
          )}
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submission & Catalog Picker */}
        <div className="lg:col-span-5 space-y-5">
          {/* Context Selector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                1. Type de document à inspecter
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Adapte l'analyse aux fraudes les plus fréquentes dans le commerce local
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setContext('product_photo')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                  context === 'product_photo'
                    ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${context === 'product_photo' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">Photo Produit / Fournisseur</p>
                  <p className="text-[11px] text-slate-500 truncate">Détecte visuels IA, faux tissus Wax ou emballages générés</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setContext('payment_proof')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                  context === 'payment_proof'
                    ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${context === 'payment_proof' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">Capture Paiement Mobile Money</p>
                  <p className="text-[11px] text-slate-500 truncate">Repère les faux reçus MTN MoMo, Moov Money ou Celtiis retouchés</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setContext('general')}
                className={`p-3 rounded-xl border text-left transition-colors flex items-center gap-3 ${
                  context === 'general'
                    ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${context === 'general' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <ScanSearch className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">Vérification Visuelle Générale</p>
                  <p className="text-[11px] text-slate-500 truncate">Analyse complète de photo WhatsApp, colis ou pièce justificative</p>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload & URL Input */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              2. Charger une image à analyser
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Cliquez pour importer ou glissez-déposez une image
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                PNG, JPG, WEBP jusqu'à 10 Mo (photo WhatsApp, capture écran, fiche fournisseur)
              </p>
            </div>

            <form onSubmit={handleAnalyzeUrl} className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">
                Ou analyser directement depuis un lien URL
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://exemple.com/photo-produit.jpg"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzing || !imageUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                >
                  Analyser
                </button>
              </div>
            </form>
          </div>

          {/* Quick Audit of Store Catalog */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-slate-900">
                3. Auditer un article de votre catalogue
              </h3>
              <span className="text-[11px] text-slate-400 tabular-nums">{products.length} produits</span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-xl">
              {products.map((p) => {
                const ver = p.imageVerification;
                const isSelected = selectedProductId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 flex items-center justify-between gap-2.5 transition-colors ${
                      isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {ver ? (
                            ver.verdict === 'AUTHENTIC' ? (
                              <span className="text-emerald-700 font-semibold">Vérifiée authentique ({ver.aiProbability}% IA)</span>
                            ) : ver.verdict === 'SUSPICIOUS' ? (
                              <span className="text-amber-700 font-semibold">Suspecte ({ver.aiProbability}% IA)</span>
                            ) : (
                              <span className="text-rose-700 font-semibold">Risque IA ({ver.aiProbability}%)</span>
                            )
                          ) : (
                            <span>Non vérifiée</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAnalyzing}
                      onClick={() => handleInspectCatalogProduct(p)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-sky-400 hover:text-sky-700 text-[11px] font-bold text-slate-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      Vérifier
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Forensic Inspection Results */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            {/* Empty Initial State */}
            {!previewSrc && !isAnalyzing && !result && !errorMessage && (
              <div className="py-14 text-center max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <ScanSearch className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Prêt pour l'inspection anti-arnaque
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Importez une photo reçue sur WhatsApp, une capture d'écran Mobile Money suspecte ou sélectionnez un produit de votre boutique pour vérifier s'il s'agit d'une vraie photo ou d'un visuel généré par IA.
                </p>
              </div>
            )}

            {/* Image Preview Header when active */}
            {previewSrc && (
              <div className="flex flex-col sm:flex-row gap-4 items-start pb-5 border-b border-slate-100">
                <div className="w-full sm:w-44 aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                  <img
                    src={previewSrc}
                    alt={sourceLabel || 'Aperçu analysé'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Élément inspecté
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSrc('');
                        setResult(null);
                        setErrorMessage(null);
                        setSelectedProductId(null);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Réinitialiser</span>
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-900 break-words">{sourceLabel}</p>
                  <p className="text-xs text-slate-500">
                    Mode :{' '}
                    <span className="font-semibold text-slate-700">
                      {context === 'product_photo'
                        ? 'Photo Produit / Fournisseur'
                        : context === 'payment_proof'
                        ? 'Capture Paiement Mobile Money'
                        : 'Analyse Visuelle Générale'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isAnalyzing && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Analyse forensique de l'image en cours...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspection des textures, cohérence des textes, ombres et marqueurs de génération IA
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {errorMessage && !isAnalyzing && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                  <p className="font-bold text-sm">L'analyse n'a pas pu aboutir</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Result State */}
            {result && !isAnalyzing && (() => {
              const meta = getVerdictMeta(result.verdict);
              const VerdictIcon = meta.Icon;

              return (
                <div className="space-y-5">
                  {/* Verdict Banner */}
                  <div className={`p-4 rounded-2xl border ${meta.containerClass} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${meta.iconBg}`}>
                        <VerdictIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-heading font-bold text-base">{meta.title}</h4>
                          <span className="text-xs font-semibold opacity-80">· {meta.badgeText}</span>
                        </div>
                        <p className="text-xs mt-1 leading-relaxed opacity-90">{result.summary}</p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <p className="text-[11px] font-semibold opacity-75">Indice IA / Altération</p>
                      <p className="text-2xl font-black font-heading tabular-nums">
                        {result.aiProbability}%
                      </p>
                    </div>
                  </div>

                  {/* Score Meter & Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Probabilité IA</span>
                        <span className="font-bold text-slate-900 tabular-nums">{result.aiProbability}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${meta.barColor}`}
                          style={{ width: `${result.aiProbability}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-slate-500">Nature détectée</p>
                      <p className="font-bold text-slate-900 mt-1">{result.detectedType}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-slate-500">Confiance de l'analyse</p>
                      <p className="font-bold text-slate-900 mt-1">
                        {result.confidence === 'HIGH'
                          ? 'Élevée'
                          : result.confidence === 'MEDIUM'
                          ? 'Moyenne'
                          : 'Modérée (image ambiguë)'}
                      </p>
                    </div>
                  </div>

                  {/* Forensic Indicators */}
                  {result.indicators.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="font-heading font-bold text-sm text-slate-900">
                        Indices visuels relevés
                      </h4>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {result.indicators.map((ind, idx) => (
                          <div key={idx} className="p-3 bg-white flex items-start gap-2.5 text-xs">
                            {ind.severity === 'ok' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : ind.severity === 'warning' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{ind.label}</p>
                              <p className="text-slate-600 mt-0.5 leading-relaxed">{ind.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practical Anti-Scam Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#0B192C] text-slate-100 space-y-2">
                      <div className="flex items-center gap-2 text-sky-300 text-xs font-bold">
                        <Info className="w-4 h-4" />
                        <span>Réflexes anti-arnaque recommandés</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-sky-400 font-bold">·</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Session Check History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Dernières vérifications de la session
                </h3>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Effacer l'historique
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setPreviewSrc(entry.previewSrc);
                      setSourceLabel(entry.label);
                      setResult(entry.result);
                      setErrorMessage(null);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-slate-50/50 hover:bg-sky-50/30 transition-colors flex items-center gap-3 text-left"
                  >
                    <img
                      src={entry.previewSrc}
                      alt={entry.label}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{entry.label}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 tabular-nums">
                        <span
                          className={`font-semibold ${
                            entry.result.verdict === 'AUTHENTIC'
                              ? 'text-emerald-700'
                              : entry.result.verdict === 'SUSPICIOUS'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {entry.result.verdict === 'AUTHENTIC'
                            ? 'Authentique'
                            : entry.result.verdict === 'SUSPICIOUS'
                            ? 'Suspecte'
                            : 'IA détectée'}
                        </span>
                        <span>·</span>
                        <span>{entry.result.aiProbability}% IA</span>
                      </p>
                    </div>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
