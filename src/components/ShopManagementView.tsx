import React, { useState } from 'react';
import { 
  Store, 
  ExternalLink, 
  Share2, 
  Check, 
  Smartphone, 
  Truck, 
  ShieldCheck, 
  Save, 
  Copy,
  Coins,
  ArrowRightLeft,
  Sparkles,
  Info,
  Percent,
  Receipt
} from 'lucide-react';
import { MerchantProfile, CurrencyCode } from '../types';
import { useCurrency, CURRENCY_RATES } from '../context/CurrencyContext';
import { calculateTaxAmount } from '../utils/tax';

interface ShopManagementViewProps {
  merchant: MerchantProfile;
  onUpdateMerchant: (updated: MerchantProfile) => void;
  onOpenStorePreview: () => void;
}

export const ShopManagementView: React.FC<ShopManagementViewProps> = ({
  merchant,
  onUpdateMerchant,
  onOpenStorePreview,
}) => {
  const { currency, setCurrency, formatPrice } = useCurrency();
  const [formData, setFormData] = useState<MerchantProfile>({ ...merchant, currency: currency });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCurrencySelect = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    setFormData(prev => ({ ...prev, currency: newCurrency }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMerchant(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyUrl = () => {
    navigator.clipboard?.writeText(`https://boutikpro.bj/${formData.storeSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Découvrez notre boutique officielle *${formData.storeName}* : https://boutikpro.bj/${formData.storeSlug}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const currencyOptions: CurrencyCode[] = ['FCFA', 'EUR', 'USD'];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Gestion de Votre Boutique en Ligne
          </h2>
          <p className="text-xs text-slate-500">
            Paramétrez votre devise d'affichage, vitrine publique, numéros Mobile Money et tarifs de livraison
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenStorePreview}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Store className="w-4 h-4" />
            <span>Tester la Vitrine Client</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Share / Live Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Boutique en ligne Active & Accessible sur Internet</span>
            </div>
            <h3 className="text-xl font-bold font-heading">
              {formData.storeName}
            </h3>
            <div className="flex items-center gap-2 font-mono text-xs text-sky-200 bg-black/40 px-3 py-2 rounded-xl border border-sky-500/30 select-all max-w-md">
              <span className="truncate">https://boutikpro.bj/{formData.storeSlug}</span>
              <button 
                onClick={copyUrl}
                className="ml-auto text-sky-300 hover:text-white p-1"
                title="Copier le lien"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={shareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>Partager sur Statut WhatsApp</span>
            </button>
            <button
              onClick={onOpenStorePreview}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Visiter comme un client</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* NEW SECTION: CURRENCY SELECTOR */}
        <div className="bg-white rounded-3xl p-6 border-2 border-sky-200 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Devise Principale & Affichage des Prix
                </h3>
                <p className="text-xs text-slate-500">
                  Basculez entre Franc CFA (XOF), Euro (EUR) et Dollar US (USD). La mise à jour est immédiate sur toutes les vues.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 rounded-full text-xs font-bold border border-sky-200 self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Devise active : {CURRENCY_RATES[currency].name}</span>
            </div>
          </div>

          {/* 3 Currency Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currencyOptions.map((code) => {
              const item = CURRENCY_RATES[code];
              const isSelected = currency === code;

              return (
                <div
                  key={code}
                  onClick={() => handleCurrencySelect(code)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/60 ring-2 ring-sky-300 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:border-sky-300 hover:bg-white'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-3" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.flag}</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {item.name}
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                            {item.code}
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {code === 'FCFA' && 'Monnaie locale Bénin & Zone UEMOA'}
                          {code === 'EUR' && 'Parité fixe officielle avec le FCFA'}
                          {code === 'USD' && 'Commerce international & diaspora'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs">
                      <div className="flex justify-between text-slate-500 text-[11px] mb-1">
                        <span>Taux de change :</span>
                        <span className="font-semibold text-slate-700">
                          {code === 'FCFA' && '1 FCFA = 1 FCFA'}
                          {code === 'EUR' && '1 EUR = 655,957 FCFA'}
                          {code === 'USD' && '1 USD = 610,00 FCFA'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-slate-700">
                        <span className="text-[11px]">Exemple (65 000 FCFA) :</span>
                        <span className="font-black text-sky-700 font-mono text-sm">
                          {formatPrice(65000, code)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCurrencySelect(code)}
                    className={`mt-4 w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 group-hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ Devise Sélectionnée' : `Choisir ${item.code}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Info Bar on dynamic conversion */}
          <div className="p-3.5 bg-slate-100 rounded-2xl flex items-start gap-2.5 text-xs text-slate-700">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900">
                Conversion dynamique instantanée active
              </p>
              <p className="text-slate-600 text-[11px]">
                En sélectionnant <strong>{CURRENCY_RATES[currency].name}</strong>, tous les montants (chiffre d'affaires, panier moyen, prix catalogue, caisse POS, commandes et vitrine client) sont automatiquement convertis selon les cours officiels.
              </p>
            </div>
          </div>
        </div>

        {/* Card 1: Identity & WhatsApp */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-sky-600" />
            <span>Identité de la Boutique & Contact Client</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nom officiel de la boutique *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lien personnalisé (Slug web) *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-500 font-mono">
                  boutikpro.bj/
                </span>
                <input
                  type="text"
                  required
                  value={formData.storeSlug}
                  onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 rounded-r-xl border border-slate-300 font-mono font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Numéro WhatsApp Réception Commandes *
              </label>
              <input
                type="text"
                required
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+229 97 00 00 00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Les paniers clients seront envoyés directement sur ce numéro</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Numéro IFU (Identifiant Fiscal Unique Bénin)
              </label>
              <input
                type="text"
                value={formData.ifuNumber}
                onChange={(e) => setFormData({ ...formData, ifuNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Apparaît sur vos reçus et factures normalisées</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Adresse physique du magasin
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Description de présentation de la boutique
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Mobile Money Payment Accounts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Comptes Mobile Money pour Encaissement</span>
          </h3>

          <p className="text-xs text-slate-500">
            Ces numéros sont affichés à vos clients lors du paiement en ligne sécurisé
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="font-bold text-slate-900">MTN MoMo Bénin</span>
              </div>
              <input
                type="text"
                value={formData.momoNumber}
                onChange={(e) => setFormData({ ...formData, momoNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[#004D98]"></span>
                <span className="font-bold text-slate-900">Moov Money (Flooz)</span>
              </div>
              <input
                type="text"
                value={formData.moovNumber}
                onChange={(e) => setFormData({ ...formData, moovNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white font-mono font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[#FF6600]"></span>
                <span className="font-bold text-slate-900">Celtiis Cash (SBIN)</span>
              </div>
              <input
                type="text"
                value={formData.celtiisNumber}
                onChange={(e) => setFormData({ ...formData, celtiisNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-orange-300 bg-white font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Delivery Rates in Benin */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Tarifs de Livraison par Zone au Bénin</span>
          </h3>

          <p className="text-xs text-slate-500">
            Ces montants sont automatiquement convertis dans la devise active ({CURRENCY_RATES[currency].symbol})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-900 mb-1">Cotonou Intra-muros</label>
              <p className="text-[10px] text-slate-400 mb-2">Haie Vive, Ganhi, Akpakpa...</p>
              <div className="relative">
                <input
                  type="number"
                  value={formData.deliveryRates.cotonou}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryRates: { ...formData.deliveryRates, cotonou: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold font-mono text-slate-900 pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">FCFA</span>
              </div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">
                = {formatPrice(formData.deliveryRates.cotonou)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-900 mb-1">Abomey-Calavi</label>
              <p className="text-[10px] text-slate-400 mb-2">Zogbadjè, Godomey, Arconville...</p>
              <div className="relative">
                <input
                  type="number"
                  value={formData.deliveryRates.calavi}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryRates: { ...formData.deliveryRates, calavi: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold font-mono text-slate-900 pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">FCFA</span>
              </div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">
                = {formatPrice(formData.deliveryRates.calavi)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-900 mb-1">Porto-Novo & Ouémé</label>
              <p className="text-[10px] text-slate-400 mb-2">Ouando, Djègan-Kpèvi...</p>
              <div className="relative">
                <input
                  type="number"
                  value={formData.deliveryRates.portoNovo}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryRates: { ...formData.deliveryRates, portoNovo: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold font-mono text-slate-900 pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">FCFA</span>
              </div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">
                = {formatPrice(formData.deliveryRates.portoNovo)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block font-bold text-slate-900 mb-1">Intérieur du Pays (Bus)</label>
              <p className="text-[10px] text-slate-400 mb-2">Parakou, Bohicon, Natitingou...</p>
              <div className="relative">
                <input
                  type="number"
                  value={formData.deliveryRates.interieur}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryRates: { ...formData.deliveryRates, interieur: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold font-mono text-slate-900 pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">FCFA</span>
              </div>
              <p className="text-[10px] text-sky-700 font-bold mt-1">
                = {formatPrice(formData.deliveryRates.interieur)}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Taxes & TVA Configuration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Configuration des Taxes & TVA (Facturation & Ventes)
                </h3>
                <p className="text-xs text-slate-500">
                  Définissez le taux de TVA appliqué automatiquement sur vos factures normalisées, tickets POS et récapitulatifs de ventes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFormData(prev => ({ ...prev, taxEnabled: !prev.taxEnabled }))
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 self-start sm:self-auto ${
                formData.taxEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  formData.taxEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span>{formData.taxEnabled ? 'TVA Activée' : 'Exonéré / TPS (0%)'}</span>
            </button>
          </div>

          {/* Benin Tax Regime Quick Presets */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Régimes fiscaux courants (Bénin DGI)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    taxEnabled: false,
                    taxRate: 0,
                    taxLabel: 'TVA (Régime TPS)',
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  !formData.taxEnabled || formData.taxRate === 0
                    ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50/60 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Régime TPS / Exonéré</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-mono font-bold text-[11px] tabular-nums">
                    0%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Taxe Professionnelle Synthétique (micro-entreprises dispensées de TVA).
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    taxEnabled: true,
                    taxRate: 18,
                    taxLabel: 'TVA',
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.taxEnabled && formData.taxRate === 18
                    ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50/60 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">TVA Standard Bénin</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold text-[11px] tabular-nums">
                    18%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Taux normal officiel en République du Bénin (Régime Réel / MECeF).
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    taxEnabled: true,
                    taxRate: 5,
                    taxLabel: 'TVA Réduite',
                  }))
                }
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  formData.taxEnabled && formData.taxRate === 5
                    ? 'border-sky-600 bg-sky-50/70 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50/60 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Taux Réduit / Spécifique</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold text-[11px] tabular-nums">
                    5%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Pour catégories spécifiques ou remises fiscales personnalisées.
                </p>
              </button>
            </div>
          </div>

          {/* Custom Tax Rate & Label + Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch text-xs">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  Taux de taxe personnalisé (%)
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Saisissez un taux entre 0% et 100% (ex: 18)
                </p>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    disabled={!formData.taxEnabled}
                    value={formData.taxEnabled ? formData.taxRate : 0}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setFormData(prev => ({
                        ...prev,
                        taxRate: val,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 font-bold font-mono text-slate-900 pr-10 tabular-nums"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block font-bold text-slate-900 mb-1">
                  Libellé affiché sur factures
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Ex: TVA, TVA Bénin, Taxe DGI...
                </p>
                <input
                  type="text"
                  value={formData.taxLabel || ''}
                  placeholder="TVA"
                  onChange={(e) => setFormData(prev => ({ ...prev, taxLabel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Live Tax Calculation Simulation */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-[#0B192C] text-white flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Aperçu calcul automatique
                </span>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-200 tabular-nums">
                  Taux : {formData.taxEnabled ? formData.taxRate : 0}%
                </span>
              </div>
              {(() => {
                const sampleHT = 65000;
                const appliedRate = formData.taxEnabled ? formData.taxRate : 0;
                const sampleTax = calculateTaxAmount(sampleHT, appliedRate);
                const sampleTTC = sampleHT + sampleTax;
                return (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Exemple vente HT :</span>
                      <span className="font-mono tabular-nums">{formatPrice(sampleHT)}</span>
                    </div>
                    <div className="flex justify-between text-amber-300 font-semibold">
                      <span>{formData.taxLabel?.trim() || 'TVA'} ({appliedRate}%) :</span>
                      <span className="font-mono tabular-nums">+ {formatPrice(sampleTax)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-white/15 font-black text-sm text-white">
                      <span>Total Facture TTC :</span>
                      <span className="font-mono text-sky-300 tabular-nums">{formatPrice(sampleTTC)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          {savedSuccess ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
              <Check className="w-4 h-4" />
              <span>Modifications de la boutique enregistrées avec succès !</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Vos modifications sont effectives immédiatement.</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer la Boutique</span>
          </button>
        </div>
      </form>
    </div>
  );
};
