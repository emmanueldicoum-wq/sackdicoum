import React from 'react';
import { 
  Store, 
  Smartphone, 
  Boxes, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  CreditCard,
  Truck,
  Users,
  Sparkles,
  Zap
} from 'lucide-react';
import { formatFCFA } from '../data/mockData';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenStorePreview: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAuth,
  onOpenStorePreview,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white px-4 py-2 text-xs text-center border-b border-sky-500/20 flex items-center justify-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px] uppercase border border-sky-400/30">
          Nouveau au Bénin 🇧🇯
        </span>
        <span className="hidden sm:inline">Intégration directe des paiements Mobile Money (MTN MoMo, Moov, Celtiis) et factures normalisées.</span>
        <button 
          onClick={onEnterApp}
          className="underline font-semibold text-sky-300 hover:text-white flex items-center gap-1 ml-1"
        >
          Essayer la démo <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0B192C] to-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/20 font-heading font-black text-white text-xl">
              BP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-2xl tracking-tight text-[#0B192C]">
                  BOUTIK<span className="text-sky-600">PRO</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-sky-800 border border-sky-200">
                  BÉNIN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Plateforme Commerciale Africaine</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-sky-600 transition-colors">Fonctionnalités</a>
            <a href="#momo" className="hover:text-sky-600 transition-colors">Mobile Money</a>
            <a href="#pricing" className="hover:text-sky-600 transition-colors">Tarifs en FCFA</a>
            <a href="#testimonials" className="hover:text-sky-600 transition-colors">Témoignages</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-sm font-semibold text-slate-700 hover:text-sky-600 px-3 py-2 rounded-xl transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={onEnterApp}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-semibold text-sm shadow-md shadow-sky-600/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Tester la Démo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-100/80 via-white to-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Conçu spécialement pour les commerces, boutiques et créateurs au Bénin</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-[#0B192C] tracking-tight leading-[1.15]">
              Pilotez votre commerce et <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">vendez en ligne</span> facilement.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Gestion des stocks en temps réel, caisse express au comptoir, encaissements 
              <strong className="text-slate-900 font-semibold"> MTN MoMo & Moov</strong>, et boutique en ligne prête en 2 minutes avec commandes directes sur WhatsApp.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0B192C] to-[#1E3E62] hover:from-[#1E3E62] hover:to-sky-700 text-white font-bold text-base shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Accéder au Tableau de Bord Marchand</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onOpenStorePreview}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Store className="w-5 h-5 text-sky-600" />
                <span>Voir la Boutique Client (Démo)</span>
              </button>
            </div>

            {/* Quick Proof Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Prix 100% en FCFA (XOF)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Prêt pour Dantokpa, Ganhi, Calavi & toute l'Afrique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Conforme Facturation IFU Bénin</span>
              </div>
            </div>
          </div>

          {/* Interactive Preview Mockup Box */}
          <div className="relative mx-auto max-w-5xl rounded-2xl bg-gradient-to-b from-[#1E3E62] to-[#0B192C] p-2.5 sm:p-4 shadow-2xl shadow-sky-950/40 border border-slate-700/80">
            {/* Top Bar of the Mockup */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-700/70 text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-300 hidden sm:inline">
                  https://boutikpro.bj/app/dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Boutique en Direct
                </span>
                <button 
                  onClick={onEnterApp}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-[11px] transition-colors"
                >
                  Ouvrir l'application
                </button>
              </div>
            </div>

            {/* Inner Dashboard Preview */}
            <div className="bg-slate-900 rounded-xl p-4 sm:p-6 mt-2 text-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Chiffre d'Affaires du Mois</p>
                  <p className="text-xl sm:text-2xl font-bold font-heading text-white mt-1">2 485 000 FCFA</p>
                  <span className="text-[11px] text-emerald-400 font-semibold">↑ +24% vs mois dernier</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Commandes Traitées</p>
                  <p className="text-xl sm:text-2xl font-bold font-heading text-white mt-1">128 commandes</p>
                  <span className="text-[11px] text-sky-400 font-semibold">94% livrées avec succès</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Paiements Mobile Money</p>
                  <p className="text-xl sm:text-2xl font-bold font-heading text-amber-400 mt-1">1 920 000 FCFA</p>
                  <span className="text-[11px] text-amber-300 font-medium">MTN MoMo & Moov Flooz</span>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400">Valeur Totale du Stock</p>
                  <p className="text-xl sm:text-2xl font-bold font-heading text-white mt-1">4 150 000 FCFA</p>
                  <span className="text-[11px] text-rose-400 font-medium">2 articles en alerte</span>
                </div>
              </div>

              {/* Sample Table Preview */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Dernières Ventes Cotonou & En Ligne</span>
                  <span className="text-sky-400 font-medium cursor-pointer" onClick={onEnterApp}>Voir toutes les commandes →</span>
                </div>
                <div className="divide-y divide-slate-700/60 text-xs">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">CMD-2026-089</span>
                      <span className="text-slate-400 ml-2">Amina Dossou (Haie Vive)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">MTN MoMo</span>
                      <span className="font-bold text-white">75 000 FCFA</span>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">CMD-2026-088</span>
                      <span className="text-slate-400 ml-2">Dr. Koffi Mensah (Ganhi)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">Moov Money</span>
                      <span className="font-bold text-white">46 000 FCFA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Partners & MoMo Banner */}
      <section id="momo" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Intégré avec tous les moyens de paiement préférés au Bénin et en Afrique
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center justify-items-center">
            {/* MTN MoMo */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200 w-full max-w-[220px] justify-center shadow-xs">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center">
                M
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">MTN MoMo</p>
                <p className="text-[10px] text-amber-700 font-medium">Paiement instantané</p>
              </div>
            </div>

            {/* Moov Money */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 border border-blue-200 w-full max-w-[220px] justify-center shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#004D98] text-white font-black text-xs flex items-center justify-center">
                M
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Moov Money</p>
                <p className="text-[10px] text-blue-700 font-medium">Flooz Bénin</p>
              </div>
            </div>

            {/* Celtiis Cash */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-orange-50 border border-orange-200 w-full max-w-[220px] justify-center shadow-xs">
              <div className="w-8 h-8 rounded-full bg-[#FF6600] text-white font-black text-xs flex items-center justify-center">
                C
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Celtiis Cash</p>
                <p className="text-[10px] text-orange-700 font-medium">SBIN Bénin</p>
              </div>
            </div>

            {/* Cash on Delivery / Zem */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 w-full max-w-[220px] justify-center shadow-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                💵
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">Espèces & Zem</p>
                <p className="text-[10px] text-emerald-700 font-medium">Paiement à livraison</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Fonctionnalités Clés
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#0B192C] mt-3">
              Tout ce dont vous avez besoin pour grandir
            </h2>
            <p className="mt-3 text-slate-600">
              Fini les cahiers de compte perdus, les erreurs de stock et les calculs interminables en fin de journée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Stock */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-5">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Gestion Intelligente des Stocks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Suivi précis des entrées/sorties, alertes automatiques de rupture, calcul de la valeur marchande de vos marchandises en FCFA.
              </p>
            </div>

            {/* Feature 2: Online Store */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Boutique en Ligne Personnalisée</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Votre vitrine web avec un lien unique (ex: <code>boutikpro.bj/votre-boutique</code>). Vos clients choisissent et commandent directement.
              </p>
            </div>

            {/* Feature 3: WhatsApp Checkout */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Commandes WhatsApp Directes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Le panier client génère un message WhatsApp pré-rempli avec les articles, le montant total et l'adresse de livraison exacte.
              </p>
            </div>

            {/* Feature 4: POS / Caisse */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Caisse Express au Comptoir</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Encaissez rapidement vos clients physiques. Rendu de monnaie automatique et édition de tickets de caisse normalisés.
              </p>
            </div>

            {/* Feature 5: Delivery Zones */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Livraisons Locales & Régionales</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paramétrez vos tarifs par zone : Cotonou intra-muros, Abomey-Calavi, Porto-Novo, et expéditions par bus à l'intérieur du pays.
              </p>
            </div>

            {/* Feature 6: Analytics */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Statistiques & Rentabilité Nette</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sachez exactement ce que vous gagnez chaque jour, vos produits les plus vendus et vos marges bénéficiaires réelles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Témoignages Commerçants
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#0B192C] mt-3">
              Ils développent leur commerce avec BOUTIKPRO
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  « Avant, je perdais le fil de mes pagnes vendus à crédit ou sur WhatsApp. Avec BOUTIKPRO, dès qu'une cliente commande à Haie Vive ou Calavi, le stock se met à jour et je reçois l'argent par MoMo sans tracas. »
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm">
                  SH
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sika Houngbo</h4>
                  <p className="text-xs text-slate-500">Maison Wax, Marché Dantokpa & Ganhi</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  « La caisse express est tellement rapide pour notre boutique d'alimentation. On imprime les reçus avec l'IFU en règle et nos clients adorent payer avec Moov Money ou Celtiis. »
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  MT
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Modeste Tossou</h4>
                  <p className="text-xs text-slate-500">Alimentation Générale, Porto-Novo</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  « J'ai créé ma boutique de cosmétiques bio en 5 minutes. Mes clientes de l'Université d'Abomey-Calavi et de Parakou passent commande seules la nuit. Un vrai bonheur ! »
                </p>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  BA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Bérénice Agbossou</h4>
                  <p className="text-xs text-slate-500">BioCosmétique Bénin, Abomey-Calavi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Tarification Transparente
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-[#0B192C] mt-3">
              Des tarifs adaptés aux réalités locales
            </h2>
            <p className="mt-3 text-slate-600">
              Payez facilement par MTN Mobile Money, Moov Money ou carte bancaire. Aucun frais caché.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Démarrage</h3>
                <p className="text-xs text-slate-500 mt-1">Idéal pour les commerçants qui se lancent</p>
                <div className="mt-6 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">0 FCFA</span>
                  <span className="text-xs text-slate-500 ml-1">/ pour toujours</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Jusqu'à 15 produits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Lien boutique en ligne de base</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Commandes WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Suivi de stock simple</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Démarrer Gratuitement
              </button>
            </div>

            {/* Plan 2: Pro (Featured) */}
            <div className="bg-gradient-to-b from-[#0B192C] to-[#1E3E62] text-white rounded-2xl p-8 border-2 border-sky-400 flex flex-col justify-between shadow-xl relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-md">
                Recommandé pour Commerçants
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">BOUTIK PRO</h3>
                <p className="text-xs text-sky-200 mt-1">Pour développer votre chiffre d'affaires</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-black text-white">{formatFCFA(15000)}</span>
                  <span className="text-xs text-sky-300 ml-1">/ mois</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span><strong>Produits & stocks illimités</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Paiements MTN MoMo, Moov, Celtiis intégrés</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Caisse express comptoir (POS)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Factures normalisées IFU Bénin</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span>Tarifs de livraison personnalisés</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
              >
                Commencer l'essai gratuit de 14 jours
              </button>
            </div>

            {/* Plan 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Multi-Boutiques</h3>
                <p className="text-xs text-slate-500 mt-1">Pour chaînes de magasins & grossistes</p>
                <div className="mt-6 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">{formatFCFA(45000)}</span>
                  <span className="text-xs text-slate-500 ml-1">/ mois</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Gestion de plusieurs points de vente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Comptes gérants & vendeurs multiples</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Nom de domaine personnalisé .bj</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Support VIP WhatsApp dédié 7j/7</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onEnterApp}
                className="mt-8 w-full py-3 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Contacter un conseiller
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B192C] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-sm flex items-center justify-center">
                  BP
                </div>
                <span className="font-heading font-bold text-xl text-white">BOUTIKPRO</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Bénin 🇧🇯</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                La solution digitale numéro 1 de gestion commerciale et boutique en ligne créée pour propulser les commerçants du Bénin et d'Afrique de l'Ouest vers la modernité.
              </p>
              <p className="text-xs text-slate-500 mt-3">
                Cotonou, Quartier Ganhi & Cadjehoun • Support WhatsApp : +229 97 00 11 22
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Produit</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={onEnterApp} className="hover:text-white transition-colors">Caisse & POS</button></li>
                <li><button onClick={onEnterApp} className="hover:text-white transition-colors">Gestion des stocks</button></li>
                <li><button onClick={onOpenStorePreview} className="hover:text-white transition-colors">Boutique en ligne</button></li>
                <li><button onClick={onEnterApp} className="hover:text-white transition-colors">Factures IFU Bénin</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Accès Rapide</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors">Connexion Marchand</button></li>
                <li><button onClick={() => onOpenAuth('register')} className="hover:text-white transition-colors">Créer une boutique</button></li>
                <li><button onClick={onEnterApp} className="hover:text-white transition-colors">Démonstration live</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            © 2026 BOUTIKPRO Bénin. Tous droits réservés. Fièrement développé pour le commerce africain.
          </div>
        </div>
      </footer>
    </div>
  );
};
