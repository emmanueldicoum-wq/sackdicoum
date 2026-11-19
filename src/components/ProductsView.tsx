import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Layers, 
  Globe, 
  EyeOff, 
  DollarSign, 
  Boxes,
  X,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ScanSearch
} from 'lucide-react';
import { Product, ProductCategory, ProductImageVerification } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { analyzeImageAuthenticity, fileToOptimizedDataUrl } from '../services/imageDetectionService';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const { formatPrice, currency, currentCurrencyDetails } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'IN_STOCK' | 'OUT'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State for new/edit product
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Mode & Wax');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [unit, setUnit] = useState<string>('pièce');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [formVerification, setFormVerification] = useState<ProductImageVerification | undefined>(undefined);
  const [isVerifyingImage, setIsVerifyingImage] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setCategory('Mode & Wax');
    setSku(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setBarcode(`613000${Math.floor(1000000 + Math.random() * 8999999)}`);
    setBuyPrice(5000);
    setSellPrice(8000);
    setStock(15);
    setMinStockAlert(5);
    setUnit('pièce');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80');
    setIsOnline(true);
    setFormVerification(undefined);
    setVerifyError(null);
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert);
    setUnit(p.unit);
    setDescription(p.description);
    setImage(p.image);
    setIsOnline(p.isOnline);
    setFormVerification(p.imageVerification);
    setVerifyError(null);
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      setImage(dataUrl);
      setFormVerification(undefined);
      setVerifyError(null);
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Impossible de lire l'image sélectionnée.");
    }
    e.target.value = '';
  };

  const handleVerifyFormImage = async () => {
    const src = image.trim();
    if (!src) return;
    setIsVerifyingImage(true);
    setVerifyError(null);
    try {
      const result = await analyzeImageAuthenticity({
        imageDataUrl: src.startsWith('data:') ? src : undefined,
        imageUrl: src.startsWith('http') ? src : undefined,
        context: 'product_photo',
        productName: name || undefined,
      });
      setFormVerification({
        verdict: result.verdict,
        aiProbability: result.aiProbability,
        scamRiskLevel: result.scamRiskLevel,
        summary: result.summary,
        checkedAt: result.analyzedAt,
      });
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Erreur lors de l'analyse photo.");
    } finally {
      setIsVerifyingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name,
        category,
        sku,
        barcode: barcode.trim() || undefined,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit,
        description,
        image,
        isOnline,
        imageVerification: formVerification,
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name,
        category,
        sku: sku || `PROD-${Math.floor(100 + Math.random() * 900)}`,
        barcode: barcode.trim() || undefined,
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit,
        description: description || 'Produit d\'exception certifié pour votre boutique.',
        image: image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        isOnline,
        totalSold: 0,
        imageVerification: formVerification,
      };
      onAddProduct(newProd);
    }
    setIsAddModalOpen(false);
    resetForm();
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || 
                          p.sku.toLowerCase().includes(q) ||
                          (p.barcode ? p.barcode.toLowerCase().includes(q) : false);
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStock = 
      stockFilter === 'ALL' ? true :
      stockFilter === 'LOW' ? p.stock <= p.minStockAlert && p.stock > 0 :
      stockFilter === 'OUT' ? p.stock === 0 :
      p.stock > p.minStockAlert;
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories: ProductCategory[] = [
    'Mode & Wax',
    'Cosmétique Bio',
    'Alimentation Locale',
    'Artisanat & Déco',
    'High-Tech & Accessoires'
  ];

  const marginFCFA = sellPrice - buyPrice;
  const marginPercent = buyPrice > 0 ? Math.round((marginFCFA / buyPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Main Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <span>Catalogue Produits & Prix</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
              {currentCurrencyDetails.name}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Gérez vos articles, vos prix de vente et la visibilité sur votre boutique en ligne ({currentCurrencyDetails.symbol})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom (ex: Pagne Wax, Karité...) ou code SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock state filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Tous les stocks</option>
            <option value="IN_STOCK">En stock normal</option>
            <option value="LOW">Stock faible (alerte)</option>
            <option value="OUT">Rupture totale</option>
          </select>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="Vue Grille"
            >
              Grille
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
              title="Vue Tableau"
            >
              Tableau
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStockAlert;
            const margin = p.sellPrice - p.buyPrice;

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                        {p.category}
                      </span>
                      {p.isOnline ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> En ligne
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-700/80 text-white text-[10px] font-bold flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> Masqué
                        </span>
                      )}
                    </div>

                    {isLowStock && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-rose-600/90 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-2 rounded-lg flex items-center justify-between shadow-sm">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stock faible !
                        </span>
                        <span>{p.stock} restant{p.stock > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>SKU: {p.sku}</span>
                      <span>{p.totalSold} vendus</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5">
                      {p.description}
                    </p>

                    {p.imageVerification && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold">
                        {p.imageVerification.verdict === 'AUTHENTIC' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" /> Photo authentique ({p.imageVerification.aiProbability}% IA)
                          </span>
                        ) : p.imageVerification.verdict === 'SUSPICIOUS' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" /> Photo suspecte ({p.imageVerification.aiProbability}% IA)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700">
                            <ShieldAlert className="w-3.5 h-3.5" /> Photo IA détectée ({p.imageVerification.aiProbability}%)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Pricing Block */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Prix de vente</p>
                        <p className="text-lg font-black font-heading text-sky-700">
                          {formatPrice(p.sellPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Achat: {formatPrice(p.buyPrice)}</p>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +{formatPrice(margin)} marge
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">Stock:</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      p.stock === 0 ? 'bg-rose-100 text-rose-700' :
                      isLowStock ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {p.stock} {p.unit}s
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Modifier le produit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Voulez-vous supprimer ${p.name} ?`)) {
                          onDeleteProduct(p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-3">Catégorie</th>
                  <th className="py-3 px-3">Prix Achat</th>
                  <th className="py-3 px-3">Prix Vente</th>
                  <th className="py-3 px-3">Marge FCFA</th>
                  <th className="py-3 px-3">Stock Actuel</th>
                  <th className="py-3 px-3">Boutique Web</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
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
                      <td className="py-3 px-3 text-slate-600">
                        {formatPrice(p.buyPrice)}
                      </td>
                      <td className="py-3 px-3 font-bold text-sky-700">
                        {formatPrice(p.sellPrice)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-600">
                        +{formatPrice(p.sellPrice - p.buyPrice)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.stock} {p.unit}s {isLow && '⚠️'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.isOnline ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">Inactif</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsAddModalOpen(false)} />

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900">
                    {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Renseignez les prix en FCFA et les détails pour votre catalogue
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom complet du produit *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pagne Super-Wax Hollandais 6 yards, Huile rouge de Pobè..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code / Référence (SKU)
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex: WAX-COT-001"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code-barres (EAN-13)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex: 6130001000012"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unité de vente
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="pièce">Pièce / Article</option>
                    <option value="yard">Yard / Pagne</option>
                    <option value="pot">Pot</option>
                    <option value="sac">Sac</option>
                    <option value="bouteille">Bouteille</option>
                    <option value="lot">Lot</option>
                    <option value="kg">Kilogramme (Kg)</option>
                  </select>
                </div>
              </div>

              {/* Pricing Cards with Margin calculation */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-sky-600" />
                    Structure des Prix en FCFA
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Marge: +{formatPrice(marginFCFA)} ({marginPercent}%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prix d'Achat (Revient) en FCFA *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Coût d'approvisionnement</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prix de Vente Client en FCFA *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={sellPrice}
                      onChange={(e) => setSellPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-bold text-sky-700 rounded-xl border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Prix affiché au client</p>
                  </div>
                </div>
              </div>

              {/* Stock controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantité en Stock Actuel *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seuil d'Alerte de Stock Bas
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Photo Image URL / Upload + Anti-AI Scam Check */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Photo du produit (URL ou fichier local)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer un fichier</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setFormVerification(undefined);
                      setVerifyError(null);
                    }}
                    placeholder="https://... ou image importée"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    disabled={!image.trim() || isVerifyingImage}
                    onClick={handleVerifyFormImage}
                    className="px-3 py-2 rounded-xl bg-[#0B192C] hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    title="Vérifier si la photo est générée par IA pour éviter toute arnaque"
                  >
                    {isVerifyingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyse...</span>
                      </>
                    ) : (
                      <>
                        <ScanSearch className="w-3.5 h-3.5" />
                        <span>Vérifier photo (Anti-IA)</span>
                      </>
                    )}
                  </button>
                </div>

                {image && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={image} alt="Aperçu produit" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                    <div className="text-xs text-slate-500 min-w-0 flex-1">
                      <p className="font-medium text-slate-700">Aperçu photo prêt pour le catalogue</p>
                      <p className="text-[11px] text-slate-400">Lancez la vérification Anti-IA avant publication si la source vient d'un fournisseur externe.</p>
                    </div>
                  </div>
                )}

                {verifyError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {formVerification && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      formVerification.verdict === 'AUTHENTIC'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : formVerification.verdict === 'SUSPICIOUS'
                        ? 'bg-amber-50 border-amber-200 text-amber-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {formVerification.verdict === 'AUTHENTIC' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : formVerification.verdict === 'SUSPICIOUS' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold tabular-nums">
                        {formVerification.verdict === 'AUTHENTIC'
                          ? `Photo authentique (${formVerification.aiProbability}% probabilité IA)`
                          : formVerification.verdict === 'SUSPICIOUS'
                          ? `Photo suspecte (${formVerification.aiProbability}% probabilité IA)`
                          : `Attention : Visuel IA / frauduleux détecté (${formVerification.aiProbability}% IA)`}
                      </p>
                      <p className="text-[11px] opacity-90">{formVerification.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description du produit
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails, matière, conseils d'utilisation..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Online shop toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Publier sur ma boutique en ligne</p>
                    <p className="text-[11px] text-slate-500">Visible par les clients sur le web et WhatsApp</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
