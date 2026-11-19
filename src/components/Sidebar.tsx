import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Boxes, 
  Calculator, 
  Store, 
  BarChart3, 
  ExternalLink, 
  Share2, 
  Check, 
  ShieldCheck,
  LogOut,
  Smartphone,
  ScanSearch,
  Users
} from 'lucide-react';
import { ViewTab, MerchantProfile } from '../types';

interface SidebarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  merchant: MerchantProfile;
  onOpenStorePreview: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  pendingOrdersCount,
  lowStockCount,
  merchant,
  onOpenStorePreview,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const [copied, setCopied] = React.useState(false);

  const menuItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'products' as ViewTab,
      label: 'Catalogue Produits',
      icon: Package,
      badge: null,
    },
    {
      id: 'orders' as ViewTab,
      label: 'Commandes',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'customers' as ViewTab,
      label: 'Clients & Fidélité',
      icon: Users,
      badge: null,
    },
    {
      id: 'inventory' as ViewTab,
      label: 'Gestion des Stocks',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alerte${lowStockCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'pos' as ViewTab,
      label: 'Caisse & Vente POS',
      icon: Calculator,
      highlight: true,
    },
    {
      id: 'shop' as ViewTab,
      label: 'Boutique en Ligne',
      icon: Store,
    },
    {
      id: 'anti_fraud' as ViewTab,
      label: 'Anti-Arnaque IA',
      icon: ScanSearch,
    },
    {
      id: 'analytics' as ViewTab,
      label: 'Finances & Stats',
      icon: BarChart3,
    },
  ];

  const copyStoreLink = () => {
    navigator.clipboard?.writeText(`https://boutikpro.bj/${merchant.storeSlug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Découvrez notre boutique en ligne *${merchant.storeName}* : https://boutikpro.bj/${merchant.storeSlug}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B192C] text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/20 font-heading font-black text-white text-xl tracking-wider">
              BP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg tracking-tight text-white">BOUTIK<span className="text-sky-400">PRO</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  BJ 🇧🇯
                </span>
              </div>
              <p className="text-xs text-slate-400">Commerce & Vente en Ligne</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Current Merchant Shop Card */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <img 
            src={merchant.logo} 
            alt={merchant.storeName} 
            className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate">{merchant.storeName}</h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Boutique ouverte</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    POS
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Public Store Quick Link Card */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#1E3E62] to-[#122A45] border border-sky-500/20 text-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Lien de votre boutique
            </span>
            <button
              onClick={onOpenStorePreview}
              className="text-[11px] font-medium text-sky-200 hover:text-white flex items-center gap-0.5 underline"
            >
              Voir vitrine <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-mono text-slate-300 bg-black/25 px-2 py-1.5 rounded-lg truncate mb-2.5 select-all">
            boutikpro.bj/{merchant.storeSlug}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyStoreLink}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-400/30">
              SH
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{merchant.name}</p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                IFU: {merchant.ifuNumber.slice(0, 7)}...
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Quitter ou changer de mode"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
