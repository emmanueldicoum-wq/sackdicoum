import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification, Product } from '../types';
import { AlertTriangle, ShieldAlert, ShoppingBag, X, ArrowRight, BellRing, Sparkles } from 'lucide-react';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  activeToast: AppNotification | null;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  checkAndNotifyStock: (product: Product, previousStock?: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissToast: () => void;
  triggerTestStockAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{
  products: Product[];
  onNavigateToInventory?: () => void;
  children: React.ReactNode;
}> = ({ products, onNavigateToInventory, children }) => {
  // Initialize with initial critical stock alerts
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const initialList: AppNotification[] = [];
    products.forEach(p => {
      if (p.stock === 0) {
        initialList.push({
          id: `init-rupture-${p.id}`,
          type: 'STOCK_OUT',
          title: 'Rupture de Stock Totale !',
          message: `${p.name} est totalement épuisé (0 unité). Réapprovisionnement urgent requis.`,
          timestamp: 'Il y a 10 min',
          productId: p.id,
          productName: p.name,
          stockRemaining: 0,
          minThreshold: p.minStockAlert,
          isRead: false,
        });
      } else if (p.stock <= p.minStockAlert) {
        initialList.push({
          id: `init-crit-${p.id}`,
          type: 'STOCK_CRITICAL',
          title: 'Seuil Critique Atteint',
          message: `${p.name} n'a plus que ${p.stock} ${p.unit}s en stock (seuil critique: ${p.minStockAlert}).`,
          timestamp: 'Il y a 25 min',
          productId: p.id,
          productName: p.name,
          stockRemaining: p.stock,
          minThreshold: p.minStockAlert,
          isRead: false,
        });
      }
    });
    return initialList;
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Auto-dismiss toast after 7s
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: "À l'instant",
      isRead: false,
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);

    // Subtle audio chime feedback simulation via Audio API (non-blocking)
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio autoplay restrictions gracefully handled
    }
  }, []);

  const checkAndNotifyStock = useCallback((product: Product, previousStock?: number) => {
    // Only alert if it's currently at or below the threshold
    if (product.stock <= product.minStockAlert) {
      if (product.stock === 0) {
        addNotification({
          type: 'STOCK_OUT',
          title: '🚨 Rupture Totale de Stock !',
          message: `Le produit "${product.name}" est désormais épuisé (0 ${product.unit}). Vos ventes risquent d'être bloquées.`,
          productId: product.id,
          productName: product.name,
          stockRemaining: 0,
          minThreshold: product.minStockAlert,
        });
      } else {
        addNotification({
          type: 'STOCK_CRITICAL',
          title: '⚠️ Seuil Critique Atteint',
          message: `Attention : le stock de "${product.name}" vient de passer à ${product.stock} ${product.unit}s (seuil d'alerte : ${product.minStockAlert}).`,
          productId: product.id,
          productName: product.name,
          stockRemaining: product.stock,
          minThreshold: product.minStockAlert,
        });
      }
    }
  }, [addNotification]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setActiveToast(null);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Interactive helper for testing the real-time notification mechanism
  const triggerTestStockAlert = () => {
    addNotification({
      type: 'STOCK_CRITICAL',
      title: '⚠️ Test d\'Alerte Temps Réel',
      message: 'Pagne Super-Wax Hollandais vient de descendre à 2 pièces restantes (seuil: 5 pièces) suite à une vente.',
      productName: 'Pagne Super-Wax Hollandais Véritable',
      stockRemaining: 2,
      minThreshold: 5,
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        addNotification,
        checkAndNotifyStock,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        dismissToast,
        triggerTestStockAlert,
      }}
    >
      {children}

      {/* Real-time Toast Pop-up anchored below navigation bar */}
      {activeToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            activeToast.type === 'STOCK_OUT'
              ? 'bg-rose-900/95 border-rose-500 text-white shadow-rose-950/40'
              : activeToast.type === 'STOCK_CRITICAL'
              ? 'bg-slate-900/95 border-amber-500/80 text-white shadow-amber-950/30'
              : 'bg-slate-900/95 border-sky-500 text-white shadow-sky-950/30'
          }`}>
            {/* Visual Icon */}
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
              activeToast.type === 'STOCK_OUT'
                ? 'bg-rose-500/30 text-rose-300 animate-pulse'
                : 'bg-amber-500/30 text-amber-300 animate-bounce'
            }`}>
              {activeToast.type === 'STOCK_OUT' ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </div>

            {/* Notification Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-heading font-black text-xs sm:text-sm tracking-tight">
                  {activeToast.title}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Temps Réel
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-snug line-clamp-2">
                {activeToast.message}
              </p>

              {/* Action Link to stock view */}
              <div className="mt-2.5 flex items-center gap-2">
                {onNavigateToInventory && (
                  <button
                    onClick={() => {
                      onNavigateToInventory();
                      dismissToast();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Gérer le stock</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <span className="text-[10px] text-slate-400">
                  {activeToast.timestamp}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={dismissToast}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Fermer l'alerte"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
