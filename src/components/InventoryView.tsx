import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Minus, 
  Check, 
  RotateCcw, 
  FileSpreadsheet, 
  ShieldAlert,
  X,
  ScanText,
  CheckCircle2
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { InvoiceScannerModal, ConfirmInvoiceStockPayload } from './InvoiceScannerModal';

interface InventoryViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  onUpdateStock: (productId: string, newStock: number, reason: string, type: 'IN' | 'OUT' | 'ADJUSTMENT') => void;
  onReceiveInvoiceStock?: (payload: ConfirmInvoiceStockPayload) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockMovements,
  onUpdateStock,
  onReceiveInvoiceStock,
}) => {
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(5);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [adjustmentReason, setAdjustmentReason] = useState('Nouvel arrivage Port / Fournisseur');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceScannerOpen, setIsInvoiceScannerOpen] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState<string | null>(null);

  // Financial calculations
  const totalItemsCount = products.reduce((s, p) => s + p.stock, 0);
  const totalCostValue = products.reduce((s, p) => s + (p.stock * p.buyPrice), 0);
  const totalSellValue = products.reduce((s, p) => s + (p.stock * p.sellPrice), 0);
  const totalPotentialProfit = totalSellValue - totalCostValue;
  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdjustmentModal = (product: Product, type: 'IN' | 'OUT') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity(type === 'IN' ? 10 : 2);
    setAdjustmentReason(type === 'IN' ? 'Réception marchandise Dantokpa / Port' : 'Sortie de stock / Vente directe');
    setIsModalOpen(true);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = Number(adjustmentQuantity);
    const newStock = adjustmentType === 'IN' 
      ? selectedProduct.stock + qty 
      : Math.max(0, selectedProduct.stock - qty);

    onUpdateStock(
      selectedProduct.id,
      newStock,
      adjustmentReason,
      adjustmentType
    );

    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Inventaire & Valorisation des Stocks
          </h2>
          <p className="text-xs text-slate-500">
            Suivi des entrées, sorties et calcul du capital marchandise en FCFA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsInvoiceScannerOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B192C] to-sky-700 hover:from-sky-700 hover:to-blue-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap shrink-0"
          >
            <ScanText className="w-4 h-4 text-sky-300" />
            <span>Scanner une facture (OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInventoryNotice("Fiche d'inventaire préparée avec les valorisations actuelles.");
              setTimeout(() => setInventoryNotice(null), 4000);
            }}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exporter l'Inventaire</span>
          </button>
        </div>
      </div>

      {inventoryNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{inventoryNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setInventoryNotice(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Valuation Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Articles en Stock
          </p>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {totalItemsCount} unités
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sur {products.length} références cataloguées
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Capital Immobilisé (Prix Achat)
          </p>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2">
            {formatPrice(totalCostValue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Investissement en marchandises
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valeur Vente Prévisionnelle
          </p>
          <p className="text-2xl font-black font-heading text-sky-700 mt-2">
            {formatPrice(totalSellValue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            +{formatPrice(totalPotentialProfit)} de marge brute
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Articles en Alerte
          </p>
          <p className={`text-2xl font-black font-heading mt-2 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {lowStockCount} article{lowStockCount > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lowStockCount > 0 ? 'Nécessite un réapprovisionnement' : 'Stocks équilibrés'}
          </p>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher un produit à réapprovisionner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <span className="text-xs text-slate-500">
            Ajustez le stock en 1 clic (+ / -)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Produit</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Stock Actuel</th>
                <th className="py-3 px-3">Seuil Alerte</th>
                <th className="py-3 px-3">Valeur Achat</th>
                <th className="py-3 px-3">Valeur Vente</th>
                <th className="py-3 px-3">État</th>
                <th className="py-3 px-4 text-right">Ajuster Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isCritical = p.stock === 0;
                const isLow = p.stock <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.category}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-lg font-black text-sm ${
                        isCritical ? 'bg-rose-100 text-rose-700' :
                        isLow ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-900'
                      }`}>
                        {p.stock} <span className="text-[11px] font-normal">{p.unit}s</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {p.minStockAlert} {p.unit}s
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono">
                      {formatPrice(p.stock * p.buyPrice)}
                    </td>
                    <td className="py-3 px-3 font-bold text-sky-700 font-mono">
                      {formatPrice(p.stock * p.sellPrice)}
                    </td>
                    <td className="py-3 px-3">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center gap-1 w-max">
                          <ShieldAlert className="w-3 h-3" /> Rupture
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" /> Réapprovisionner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 w-max">
                          <Check className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAdjustmentModal(p, 'IN')}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Entrée en stock (+)"
                        >
                          <Plus className="w-3.5 h-3.5" /> Entrée
                        </button>
                        <button
                          onClick={() => openAdjustmentModal(p, 'OUT')}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Sortie de stock (-)"
                        >
                          <Minus className="w-3.5 h-3.5" /> Sortie
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Historique des Mouvements de Stock Récents
            </h3>
            <p className="text-xs text-slate-500">
              Traces des arrivages de marchandises et déstockages
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {stockMovements.map((mov) => (
            <div key={mov.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  mov.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {mov.type === 'IN' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{mov.productName}</p>
                  <p className="text-slate-500 text-[11px]">{mov.reason} • Par {mov.user}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${
                  mov.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {mov.type === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`}
                </p>
                <p className="text-[10px] text-slate-400">{mov.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stock Adjustment Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className={`p-5 border-b text-white flex items-center justify-between ${
              adjustmentType === 'IN' ? 'bg-emerald-700' : 'bg-rose-700'
            }`}>
              <div>
                <h3 className="font-heading font-bold text-base">
                  {adjustmentType === 'IN' ? 'Nouvelle Entrée en Stock' : 'Sortie / Ajustement de Stock'}
                </h3>
                <p className="text-xs opacity-90">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-600">Stock actuel :</span>
                <span className="font-black text-sm text-slate-900">{selectedProduct.stock} {selectedProduct.unit}s</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantité à {adjustmentType === 'IN' ? 'ajouter' : 'déduire'} ({selectedProduct.unit}s)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif du mouvement
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {adjustmentType === 'IN' ? (
                    <>
                      <option value="Réception marchandise Dantokpa / Port">Réception marchandise Dantokpa / Port</option>
                      <option value="Nouvel arrivage fournisseur local">Nouvel arrivage fournisseur local</option>
                      <option value="Retour client / Annulation">Retour client / Annulation</option>
                      <option value="Correction inventaire physique (+)">Correction inventaire physique (+)</option>
                    </>
                  ) : (
                    <>
                      <option value="Sortie de stock / Vente directe magasin">Sortie de stock / Vente directe magasin</option>
                      <option value="Vente en gros marchand local">Vente en gros marchand local</option>
                      <option value="Perte ou avarie de produit">Perte ou avarie de produit</option>
                      <option value="Correction inventaire physique (-)">Correction inventaire physique (-)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-sky-800 font-semibold text-xs flex justify-between">
                <span>Nouveau stock estimé :</span>
                <span className="font-black">
                  {adjustmentType === 'IN' 
                    ? selectedProduct.stock + Number(adjustmentQuantity) 
                    : Math.max(0, selectedProduct.stock - Number(adjustmentQuantity))} {selectedProduct.unit}s
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                    adjustmentType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirmer l'opération
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera OCR Invoice Scanner Modal */}
      <InvoiceScannerModal
        isOpen={isInvoiceScannerOpen}
        onClose={() => setIsInvoiceScannerOpen(false)}
        products={products}
        onConfirmIncomingStock={(payload) => {
          if (onReceiveInvoiceStock) {
            onReceiveInvoiceStock(payload);
          } else {
            payload.lines.forEach((line) => {
              if (line.mode === 'EXISTING' && line.productId) {
                const target = products.find(p => p.id === line.productId);
                if (target) {
                  onUpdateStock(target.id, target.stock + line.quantity, payload.reason, 'IN');
                }
              }
            });
          }
          const totalUnits = payload.lines.reduce((s, l) => s + l.quantity, 0);
          setInventoryNotice(
            `${payload.lines.length} référence(s) (+${totalUnits} unités) ajoutée(s) depuis la facture ${payload.invoiceNumber || payload.supplierName}.`
          );
          setTimeout(() => setInventoryNotice(null), 5000);
        }}
      />
    </div>
  );
};
