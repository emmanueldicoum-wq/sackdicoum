import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  ArrowUpRight, 
  CreditCard, 
  Plus, 
  Store, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Package,
  Boxes
} from 'lucide-react';
import { Product, Order, MerchantProfile, ViewTab } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { computeOrderTaxBreakdown } from '../utils/tax';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  merchant: MerchantProfile;
  setCurrentTab: (tab: ViewTab) => void;
  onOpenQuickSale: () => void;
  onOpenStorePreview: () => void;
  onSelectOrder: (order: Order) => void;
  onAddNewProduct: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  merchant,
  setCurrentTab,
  onOpenQuickSale,
  onOpenStorePreview,
  onSelectOrder,
  onAddNewProduct,
}) => {
  const { formatPrice } = useCurrency();
  // Calculations (including automatic TVA breakdown)
  const getOrderTotal = (ord: Order) => computeOrderTaxBreakdown(ord, merchant).totalAmount;
  const totalRevenue = orders.reduce((sum, ord) => sum + getOrderTotal(ord), 0);
  const paidOrders = orders.filter(o => o.status === 'PAID' || o.status === 'DELIVERED');
  const paidRevenue = paidOrders.reduce((sum, ord) => sum + getOrderTotal(ord), 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
  
  // Mobile Money breakdown
  const momoOrders = orders.filter(o => o.paymentMethod === 'MTN_MOMO');
  const moovOrders = orders.filter(o => o.paymentMethod === 'MOOV_MONEY');
  const celtiisOrders = orders.filter(o => o.paymentMethod === 'CELTIIS_CASH');
  const cashOrders = orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY');

  const momoTotal = momoOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const moovTotal = moovOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const celtiisTotal = celtiisOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const cashTotal = cashOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Total stock valuation
  const totalStockValueSell = products.reduce((s, p) => s + (p.stock * p.sellPrice), 0);

  // Top 4 products
  const topProducts = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 4);

  // Recent 5 orders
  const recentOrders = [...orders].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient opacity-30 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Boutique en ligne en activité • Cotonou, Bénin</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight text-white">
              Bonjour, {merchant.name} !
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Voici le récapitulatif de votre commerce aujourd'hui. Vos paiements Mobile Money MTN, Moov et Celtiis sont prêts pour encaissement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickSale}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Vente Caisse (POS)</span>
            </button>
            <button
              onClick={onOpenStorePreview}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-sky-400" />
              <span>Aperçu Boutique</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Stock Alert Warning if any */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Alerte de Stock Faible ({lowStockProducts.length} article{lowStockProducts.length > 1 ? 's' : ''})
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockProducts.map(p => `${p.name} (${p.stock} restant)`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('inventory')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            Réapprovisionner
          </button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Chiffre d'Affaires */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chiffre d'Affaires Total
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {formatPrice(totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% ce mois</span>
            <span className="text-slate-400 font-normal">vs mois passé</span>
          </div>
        </div>

        {/* KPI 2: Commandes en attente */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Commandes Reçues
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {orders.length}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            {pendingOrders.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                {pendingOrders.length} à expédier
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">Toutes traitées</span>
            )}
            <span className="text-slate-400">Total catalogue</span>
          </div>
        </div>

        {/* KPI 3: Mobile Money Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Encaissé Mobile Money
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {formatPrice(momoTotal + moovTotal + celtiisTotal)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-slate-500">
            <span className="text-amber-600 font-bold">MTN</span> • 
            <span className="text-blue-600 font-bold">Moov</span> • 
            <span className="text-orange-600 font-bold">Celtiis</span>
          </div>
        </div>

        {/* KPI 4: Valeur du stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Valeur Marchande Stock
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {formatPrice(totalStockValueSell)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>{products.length} références actives</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Channels Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Paiements par Opérateur
              </h3>
              <span className="text-xs text-slate-400">Bénin</span>
            </div>

            <div className="space-y-4">
              {/* MTN MoMo */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="font-semibold text-slate-800">MTN Mobile Money</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(momoTotal)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${totalRevenue ? (momoTotal / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Moov Money */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#004D98]"></span>
                    <span className="font-semibold text-slate-800">Moov Money (Flooz)</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(moovTotal)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-[#004D98] rounded-full" 
                    style={{ width: `${totalRevenue ? (moovTotal / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Celtiis Cash */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600]"></span>
                    <span className="font-semibold text-slate-800">Celtiis Cash (SBIN)</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(celtiisTotal)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-[#FF6600] rounded-full" 
                    style={{ width: `${totalRevenue ? (celtiisTotal / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cash on delivery / In-store */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-slate-800">Espèces / Livraison Zem</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(cashTotal)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${totalRevenue ? (cashTotal / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentTab('analytics')}
              className="w-full py-2 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-colors flex items-center justify-center gap-1"
            >
              <span>Voir le bilan financier détaillé</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Launchpad & Daily Shortcuts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-base text-slate-900">
              Actions Rapides & Opérations
            </h3>
            <span className="text-xs text-slate-400">Raccourcis quotidiens</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={onOpenQuickSale}
              className="p-4 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-left hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-sm">Nouvelle Vente Caisse (POS)</h4>
              <p className="text-xs text-sky-100 mt-1">Encaissement immédiat au comptoir avec reçu normalisé</p>
            </button>

            <button
              onClick={onAddNewProduct}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Ajouter un Produit</h4>
              <p className="text-xs text-slate-500 mt-1">Prix FCFA, variantes, photo et seuil d'alerte</p>
            </button>

            <button
              onClick={() => setCurrentTab('shop')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Gérer ma Boutique Web</h4>
              <p className="text-xs text-slate-500 mt-1">Numéro WhatsApp, bannières et frais de livraison</p>
            </button>

            <button
              onClick={() => setCurrentTab('inventory')}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all active:scale-[0.98] group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Ajuster les Stocks</h4>
              <p className="text-xs text-slate-500 mt-1">Enregistrer un arrivage ou sortie de marchandise</p>
            </button>
          </div>

          {/* Top Selling Products snippet */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Produits les plus vendus
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{formatPrice(p.sellPrice)} • <span className="font-bold text-sky-600">{p.totalSold} vendus</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Dernières Commandes
            </h3>
            <p className="text-xs text-slate-500">
              Ventes en ligne via le site web, commandes WhatsApp et caisse comptoir
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('orders')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Voir toutes les commandes ({orders.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-2">N° Commande</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Ville / Quartier</th>
                <th className="pb-3">Moyen de Paiement</th>
                <th className="pb-3">Montant Total</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const getBadge = () => {
                  switch (order.status) {
                    case 'PAID':
                      return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Payée</span>;
                    case 'PENDING':
                      return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">En attente</span>;
                    case 'SHIPPED':
                      return <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-bold">En livraison</span>;
                    case 'DELIVERED':
                      return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">Livrée</span>;
                    default:
                      return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Autre</span>;
                  }
                };

                const getPaymentBadge = () => {
                  switch (order.paymentMethod) {
                    case 'MTN_MOMO':
                      return <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-800 font-bold text-[10px]">MTN MoMo</span>;
                    case 'MOOV_MONEY':
                      return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-800 font-bold text-[10px]">Moov Money</span>;
                    case 'CELTIIS_CASH':
                      return <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-800 font-bold text-[10px]">Celtiis Cash</span>;
                    default:
                      return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 font-bold text-[10px]">Espèces</span>;
                  }
                };

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-2 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-slate-800">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {order.deliveryCity}
                    </td>
                    <td className="py-3.5">
                      {getPaymentBadge()}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 tabular-nums">
                      {formatPrice(getOrderTotal(order))}
                    </td>
                    <td className="py-3.5">
                      {getBadge()}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold transition-colors"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
