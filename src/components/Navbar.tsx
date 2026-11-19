import React, { useState } from 'react';
import { 
  Menu, 
  PlusCircle, 
  Bell, 
  ExternalLink, 
  Store, 
  Home, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  Plus,
  Boxes
} from 'lucide-react';
import { ViewTab, MerchantProfile, Product, Order } from '../types';
import { useCurrency, CURRENCY_RATES } from '../context/CurrencyContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  merchant: MerchantProfile;
  lowStockProducts: Product[];
  recentOrders: Order[];
  onOpenStorePreview: () => void;
  onGoToLanding: () => void;
  onOpenQuickSale: () => void;
  setIsMobileOpen: (open: boolean) => void;
  onQuickReplenishStock?: (productId: string, quantity: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  merchant,
  lowStockProducts,
  recentOrders,
  onOpenStorePreview,
  onGoToLanding,
  onOpenQuickSale,
  setIsMobileOpen,
  onQuickReplenishStock,
}) => {
  const { currency, setCurrency, currentCurrencyDetails, formatPrice } = useCurrency();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    triggerTestStockAlert 
  } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'STOCK' | 'ORDERS'>('ALL');

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Tableau de bord';
      case 'products': return 'Catalogue des Produits';
      case 'orders': return 'Commandes & Expéditions';
      case 'customers': return 'Base Clients & Fidélisation';
      case 'inventory': return 'Gestion des Stocks & Alertes';
      case 'pos': return 'Caisse Comptoir & Vente Rapide';
      case 'shop': return 'Paramètres Boutique en Ligne';
      case 'anti_fraud': return 'Contrôle Anti-Arnaque & Photos IA';
      case 'analytics': return 'Statistiques & Performance Financière';
      default: return 'Tableau de bord';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === 'STOCK') {
      return n.type === 'STOCK_CRITICAL' || n.type === 'STOCK_OUT';
    }
    if (notificationFilter === 'ORDERS') {
      return n.type === 'NEW_ORDER';
    }
    return true;
  });

  const stockAlertsCount = notifications.filter(n => n.type === 'STOCK_CRITICAL' || n.type === 'STOCK_OUT').length;
  const hasCriticalRupture = notifications.some(n => n.type === 'STOCK_OUT');

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & view title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <span>{merchant.storeName}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-700">{getTitle()}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-heading text-slate-900 tracking-tight">
              {getTitle()}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Sale button */}
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">Vente Rapide</span>
            <span className="xs:hidden">Vendre</span>
          </button>

          {/* View Public Storefront */}
          <button
            onClick={onOpenStorePreview}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="Aperçu de la vitrine client"
          >
            <Store className="w-4 h-4 text-sky-600" />
            <span className="hidden md:inline">Voir la Boutique</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Landing Page link */}
          <button
            onClick={onGoToLanding}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
            title="Revenir au site de présentation BOUTIKPRO"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Site BOUTIKPRO</span>
          </button>

          {/* Interactive Currency Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
              title="Changer de devise d'affichage"
            >
              <span className="text-sm">{currentCurrencyDetails.flag}</span>
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCurrencyMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowCurrencyMenu(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Changer de Devise
                  </div>
                  {(['FCFA', 'EUR', 'USD'] as const).map((c) => {
                    const info = CURRENCY_RATES[c];
                    const isSelected = currency === c;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setCurrency(c);
                          setShowCurrencyMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected ? 'bg-sky-50 text-sky-800 font-bold' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{info.flag}</span>
                          <span>{info.name}</span>
                        </div>
                        {isSelected && <span className="text-sky-600 font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Real-time Notifications Bell with Stock Alert Badge */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) {
                  // Mark all as read when opening notification panel
                  markAllAsRead();
                }
              }}
              className={`relative p-2 rounded-xl transition-all ${
                unreadCount > 0 
                  ? hasCriticalRupture 
                    ? 'bg-rose-50 text-rose-600 ring-2 ring-rose-300 animate-pulse' 
                    : 'bg-amber-50 text-amber-600 ring-2 ring-amber-300' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Centre d'alertes & notifications en temps réel"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md ${
                  hasCriticalRupture ? 'bg-rose-600 animate-ping' : 'bg-amber-500'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowNotifications(false)} 
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Notification Center Header */}
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-white">Alertes & Notifications</h4>
                        <p className="text-[10px] text-slate-400">Surveillance des stocks en temps réel</p>
                      </div>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                        title="Vider toutes les notifications"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Effacer</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Sub-nav */}
                  <div className="flex items-center bg-slate-100 p-1 border-b border-slate-200 text-xs">
                    <button
                      onClick={() => setNotificationFilter('ALL')}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                        notificationFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Toutes ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotificationFilter('STOCK')}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] transition-colors flex items-center justify-center gap-1 ${
                        notificationFilter === 'STOCK' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Stocks ({stockAlertsCount})</span>
                    </button>
                    <button
                      onClick={() => setNotificationFilter('ORDERS')}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                        notificationFilter === 'ORDERS' ? 'bg-white text-sky-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Commandes
                    </button>
                  </div>

                  {/* Notification Items List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notif) => {
                        const isStock = notif.type === 'STOCK_CRITICAL' || notif.type === 'STOCK_OUT';
                        const isRupture = notif.type === 'STOCK_OUT';

                        return (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-2xl mb-1 transition-all ${
                              isRupture 
                                ? 'bg-rose-50/80 border border-rose-200' 
                                : isStock 
                                ? 'bg-amber-50/80 border border-amber-200' 
                                : 'bg-slate-50 border border-slate-200'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                isRupture 
                                  ? 'bg-rose-100 text-rose-600' 
                                  : isStock 
                                  ? 'bg-amber-100 text-amber-600' 
                                  : 'bg-sky-100 text-sky-600'
                              }`}>
                                {isRupture ? (
                                  <ShieldAlert className="w-4 h-4" />
                                ) : isStock ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Store className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className={`text-xs font-bold ${
                                    isRupture ? 'text-rose-900' : isStock ? 'text-amber-900' : 'text-slate-900'
                                  }`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {notif.timestamp}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-600 leading-snug">
                                  {notif.message}
                                </p>

                                {/* Action Buttons for Stock Alert */}
                                {isStock && notif.productId && (
                                  <div className="mt-2.5 flex items-center gap-2">
                                    {onQuickReplenishStock && (
                                      <button
                                        onClick={() => onQuickReplenishStock(notif.productId!, 5)}
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs"
                                        title="Ajouter immédiatement 5 unités en stock"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>+5 en stock</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setCurrentTab('inventory');
                                        setShowNotifications(false);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center gap-1 transition-colors"
                                    >
                                      <Boxes className="w-3 h-3" />
                                      <span>Voir inventaire</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                        <p className="font-semibold text-slate-700">Aucune alerte pour le moment</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Vos stocks et vos commandes sont à jour.</p>
                      </div>
                    )}
                  </div>

                  {/* Notification Center Footer with Live Test Button */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <button
                      onClick={triggerTestStockAlert}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                      title="Tester la notification de stock critique en direct"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>Simuler une alerte temps réel</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentTab('inventory');
                        setShowNotifications(false);
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <span>Tous les stocks</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
