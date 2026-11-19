import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Phone, 
  Truck, 
  X, 
  Plus, 
  Minus, 
  Check, 
  ArrowLeft, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Product, MerchantProfile, Order, OrderItem, PaymentMethod } from '../types';
import { useCurrency, CURRENCY_RATES } from '../context/CurrencyContext';
import { getActiveTaxRate, calculateTaxAmount } from '../utils/tax';

interface PublicStorefrontViewProps {
  merchant: MerchantProfile;
  products: Product[];
  onBackToDashboard: () => void;
  onNewCustomerOrder: (order: Order) => void;
}

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  merchant,
  products,
  onBackToDashboard,
  onNewCustomerOrder,
}) => {
  const { currency, setCurrency, formatPrice, currentCurrencyDetails } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+229 ');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<'cotonou' | 'calavi' | 'portoNovo' | 'interieur'>('cotonou');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [orderCompleted, setOrderCompleted] = useState<Order | null>(null);

  const onlineProducts = products.filter(p => p.isOnline);
  const categories = ['ALL', 'Mode & Wax', 'Cosmétique Bio', 'Alimentation Locale', 'Artisanat & Déco'];

  const filteredProducts = onlineProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          productName: product.name,
          unitPrice: product.sellPrice,
          quantity: 1,
          image: product.image,
        }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const activeTaxRate = getActiveTaxRate(merchant);
  const activeTaxLabel = merchant.taxLabel?.trim() || 'TVA';
  const taxAmount = calculateTaxAmount(subtotal, activeTaxRate);
  const deliveryFee = merchant.deliveryRates[deliveryZone] || 1000;
  const totalAmount = subtotal + taxAmount + deliveryFee;
  const totalItemsCount = cart.reduce((s, i) => s + i.quantity, 0);

  const getCityName = () => {
    switch (deliveryZone) {
      case 'cotonou': return 'Cotonou';
      case 'calavi': return 'Abomey-Calavi';
      case 'portoNovo': return 'Porto-Novo';
      case 'interieur': return 'Intérieur du Bénin (Parakou, etc.)';
    }
  };

  const handleOrderSubmit = (viaWhatsApp: boolean) => {
    if (cart.length === 0 || !customerName.trim() || !customerPhone.trim()) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `CMD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryCity: getCityName(),
      deliveryAddress: deliveryAddress.trim() || 'À convenir par téléphone',
      items: [...cart],
      subtotal,
      taxRate: activeTaxRate,
      taxLabel: activeTaxLabel,
      taxAmount,
      deliveryFee,
      totalAmount,
      paymentMethod,
      status: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      channel: viaWhatsApp ? 'WHATSAPP' : 'STORE_FRONT',
    };

    onNewCustomerOrder(newOrder);
    setOrderCompleted(newOrder);

    if (viaWhatsApp) {
      const itemsList = cart.map(i => `- ${i.quantity}x ${i.productName} (${formatPrice(i.unitPrice * i.quantity)})`).join('\n');
      const text = encodeURIComponent(
        `Bonjour ${merchant.storeName} ! Je souhaite commander en ligne :\n\n` +
        `${itemsList}\n\n` +
        `📦 Sous-total HT : ${formatPrice(subtotal)}\n` +
        `🧾 ${activeTaxLabel} (${activeTaxRate}%) : ${formatPrice(taxAmount)}\n` +
        `🚚 Livraison vers : ${getCityName()} (${formatPrice(deliveryFee)})\n` +
        `💰 TOTAL TTC : ${formatPrice(totalAmount)}\n` +
        `💳 Paiement prévu : ${paymentMethod}\n\n` +
        `👤 Client : ${customerName}\n` +
        `📞 Téléphone : ${customerPhone}\n` +
        `📍 Adresse : ${deliveryAddress || 'Cotonou'}`
      );
      const cleanPhone = merchant.whatsapp.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    }

    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner to switch back to Merchant mode */}
      <div className="bg-[#0B192C] text-white px-4 py-2.5 text-xs flex items-center justify-between sticky top-0 z-40 border-b border-slate-700 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold hidden sm:inline">Aperçu Vitrine Publique en direct :</span>
          <span className="font-mono text-sky-300">boutikpro.bj/{merchant.storeSlug}</span>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour Espace Marchand</span>
        </button>
      </div>

      {/* Store Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <img
            src={merchant.logo}
            alt={merchant.storeName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-sky-400 shadow-2xl shrink-0"
          />
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-2 border border-sky-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Boutique Officielle Certifiée • Bénin 🇧🇯</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white">
              {merchant.storeName}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {merchant.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                {merchant.address}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {merchant.whatsapp}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Customer Currency Switcher */}
            <div className="flex items-center bg-black/40 border border-white/20 rounded-2xl p-1 text-xs">
              {(['FCFA', 'EUR', 'USD'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-[11px] flex items-center gap-1 ${
                    currency === c 
                      ? 'bg-sky-500 text-white shadow-xs' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{CURRENCY_RATES[c].flag}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>

            {/* Floating Cart Launcher Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-sky-500/30 flex items-center gap-3 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Mon Panier</span>
              {totalItemsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-white text-sky-700 font-extrabold text-xs">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search & Categories Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Rechercher un produit de la boutique..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'Tous les produits' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const inCart = cart.find(i => i.productId === p.id);

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {p.description}
                    </p>
                    {p.imageVerification?.verdict === 'AUTHENTIC' && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Photo réelle vérifiée</span>
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Prix</p>
                        <p className="text-lg font-black font-heading text-slate-900">
                          {formatPrice(p.sellPrice)}
                        </p>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        En stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => addToCart(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                      inCart 
                        ? 'bg-sky-50 text-sky-700 border border-sky-300' 
                        : 'bg-slate-900 hover:bg-sky-700 text-white shadow-xs'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{inCart ? `Ajouté (${inCart.quantity})` : 'Ajouter au Panier'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart & Checkout Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsCartOpen(false)} />

          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sky-600" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Votre Panier ({totalItemsCount} article{totalItemsCount > 1 ? 's' : ''})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Items List */}
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold">Votre panier est vide</p>
                  <p className="text-[11px] mt-1">Ajoutez des articles pour passer commande</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {cart.map(item => (
                      <div key={item.productId} className="p-3 flex items-center justify-between gap-3 bg-white">
                        <img src={item.image} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{formatPrice(item.unitPrice)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-1 text-slate-600 hover:bg-white rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-1 text-slate-600 hover:bg-white rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-black text-slate-900">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Information Form */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Coordonnées de Livraison
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Votre Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Amina Dossou"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Numéro WhatsApp / Téléphone Mobile Money *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+229 97 12 34 56"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Zone de Livraison au Bénin *
                      </label>
                      <select
                        value={deliveryZone}
                        onChange={(e) => setDeliveryZone(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                      >
                        <option value="cotonou">Cotonou (+{formatPrice(merchant.deliveryRates.cotonou)})</option>
                        <option value="calavi">Abomey-Calavi (+{formatPrice(merchant.deliveryRates.calavi)})</option>
                        <option value="portoNovo">Porto-Novo (+{formatPrice(merchant.deliveryRates.portoNovo)})</option>
                        <option value="interieur">Intérieur du Pays (Bus) (+{formatPrice(merchant.deliveryRates.interieur)})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Adresse ou Repère précis (Quartier, Rue...)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Haie Vive près du glacier, Zogbadjè face campus..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selection */}
                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
                    <h4 className="font-bold text-sky-900 uppercase tracking-wider text-[10px]">
                      Mode de Paiement Préféré
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MTN_MOMO')}
                        className={`p-2 rounded-xl border text-left font-bold ${
                          paymentMethod === 'MTN_MOMO'
                            ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MOOV_MONEY')}
                        className={`p-2 rounded-xl border text-left font-bold ${
                          paymentMethod === 'MOOV_MONEY'
                            ? 'bg-[#004D98] text-white border-blue-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Moov Money
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CELTIIS_CASH')}
                        className={`p-2 rounded-xl border text-left font-bold ${
                          paymentMethod === 'CELTIIS_CASH'
                            ? 'bg-[#FF6600] text-white border-orange-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Celtiis Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                        className={`p-2 rounded-xl border text-left font-bold ${
                          paymentMethod === 'CASH_ON_DELIVERY'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        À la livraison
                      </button>
                    </div>
                  </div>

                  {/* Pricing Total Summary */}
                  <div className="space-y-1.5 pt-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total articles HT :</span>
                      <span className="font-mono tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{activeTaxLabel} ({activeTaxRate > 0 ? `${activeTaxRate}%` : 'Exonéré 0%'}) :</span>
                      <span className="font-mono font-semibold text-amber-700 tabular-nums">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Frais de livraison :</span>
                      <span className="font-mono tabular-nums">{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                      <span>Total TTC à payer :</span>
                      <span className="text-xl font-black font-heading text-sky-700 tabular-nums">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                <button
                  onClick={() => handleOrderSubmit(true)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Commander via WhatsApp ({formatPrice(totalAmount)})</span>
                </button>

                <button
                  onClick={() => handleOrderSubmit(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payer par Mobile Money (Validation Directe)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Success Modal */}
      {orderCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-slate-900">
                Commande Confirmée !
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Merci {orderCompleted.customerName}, votre commande <strong className="text-slate-900">{orderCompleted.orderNumber}</strong> est bien enregistrée chez {merchant.storeName}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant total :</span>
                <span className="font-black text-slate-900">{formatPrice(orderCompleted.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode de paiement :</span>
                <span className="font-semibold text-slate-800">{orderCompleted.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination :</span>
                <span className="font-semibold text-slate-800">{orderCompleted.deliveryCity}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Le commerçant prépare votre colis pour expédition rapide.
            </p>

            <button
              onClick={() => {
                setOrderCompleted(null);
                setIsCartOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
