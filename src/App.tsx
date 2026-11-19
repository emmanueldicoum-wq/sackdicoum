import React, { useState } from 'react';
import { 
  ViewTab, 
  Product, 
  Order, 
  MerchantProfile, 
  StockMovement, 
  OrderStatus,
  ProductImageVerification,
  Customer,
  PromoCampaignLog
} from './types';
import { 
  initialProducts, 
  initialOrders, 
  initialMerchantProfile, 
  initialStockMovements,
  initialCustomers
} from './data/mockData';
import { CurrencyProvider } from './context/CurrencyContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { OrdersView } from './components/OrdersView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { ConfirmInvoiceStockPayload } from './components/InvoiceScannerModal';
import { PosView } from './components/PosView';
import { ShopManagementView } from './components/ShopManagementView';
import { AnalyticsView } from './components/AnalyticsView';
import { AntiFraudView } from './components/AntiFraudView';
import { PublicStorefrontView } from './components/PublicStorefrontView';
import { InvoiceModal } from './components/InvoiceModal';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Calculator, 
  Store 
} from 'lucide-react';

interface AppContentProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  merchant: MerchantProfile;
  setMerchant: React.Dispatch<React.SetStateAction<MerchantProfile>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  promoLogs: PromoCampaignLog[];
  setPromoLogs: React.Dispatch<React.SetStateAction<PromoCampaignLog[]>>;
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
}

function AppContent({
  products,
  setProducts,
  orders,
  setOrders,
  merchant,
  setMerchant,
  stockMovements,
  setStockMovements,
  customers,
  setCustomers,
  promoLogs,
  setPromoLogs,
  currentTab,
  setCurrentTab,
}: AppContentProps) {
  // App Modes: Presentation Landing, Merchant Backend Dashboard, or Customer Online Store
  const [appMode, setAppMode] = useState<'landing' | 'merchant' | 'public_store'>('merchant');
  
  // Real-time Notification hook
  const { checkAndNotifyStock } = useNotifications();

  // Modals & Navigation States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Stock & Order Handlers
  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    // Log initial stock movement
    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'IN',
        quantity: newProduct.stock,
        reason: 'Stock initial à la création du produit',
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        user: merchant.name,
      };
      setStockMovements(prev => [movement, ...prev]);
    }

    // Check if new product is already low stock
    if (newProduct.stock <= newProduct.minStockAlert) {
      checkAndNotifyStock(newProduct);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    if (updatedProduct.stock <= updatedProduct.minStockAlert) {
      checkAndNotifyStock(updatedProduct);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleSaveProductVerification = (
    productId: string,
    verification: ProductImageVerification
  ) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, imageVerification: verification } : p))
    );
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleUpdateStock = (productId: string, newStock: number, reason: string, type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    const diff = Math.abs(newStock - targetProduct.stock);
    const updatedProd = { ...targetProduct, stock: newStock };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProd : p));

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId,
      productName: targetProduct.name,
      type,
      quantity: diff,
      reason,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      user: merchant.name,
    };
    setStockMovements(prev => [newMovement, ...prev]);

    // Check real-time critical threshold
    if (newStock <= targetProduct.minStockAlert) {
      checkAndNotifyStock(updatedProd);
    }
  };

  // Quick 1-click replenishment directly from navbar notification
  const handleQuickReplenishStock = (productId: string, quantity: number) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;
    const newStock = targetProduct.stock + quantity;
    handleUpdateStock(productId, newStock, 'Réapprovisionnement rapide depuis alerte navigation', 'IN');
  };

  // Batch incoming stock reception from OCR-scanned supplier invoice
  const handleBatchReceiveInvoiceStock = (payload: ConfirmInvoiceStockPayload) => {
    const nowDate = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const createdProducts: Product[] = [];
    const newMovements: StockMovement[] = [];

    const existingIncrements = new Map<string, { qty: number; buyPrice: number; updateBuyPrice: boolean }>();

    payload.lines.forEach((line, idx) => {
      if (line.mode === 'EXISTING' && line.productId) {
        const prev = existingIncrements.get(line.productId);
        existingIncrements.set(line.productId, {
          qty: (prev?.qty || 0) + line.quantity,
          buyPrice: line.unitBuyPrice > 0 ? line.unitBuyPrice : (prev?.buyPrice || 0),
          updateBuyPrice: Boolean(line.updateBuyPrice || prev?.updateBuyPrice),
        });
        const target = products.find(p => p.id === line.productId);
        if (target) {
          newMovements.push({
            id: `mov-${Date.now()}-${idx}`,
            productId: target.id,
            productName: target.name,
            type: 'IN',
            quantity: line.quantity,
            reason: payload.reason,
            date: nowDate,
            user: merchant.name,
          });
        }
      } else if (line.mode === 'NEW' && line.newProduct) {
        const newId = `prod-${Date.now()}-${idx}`;
        const newProd: Product = {
          id: newId,
          name: line.newProduct.name,
          category: line.newProduct.category,
          sku: `OCR-${Math.floor(100 + Math.random() * 900)}`,
          barcode: `613000${Math.floor(1000000 + Math.random() * 8999999)}`,
          buyPrice: line.newProduct.buyPrice,
          sellPrice: line.newProduct.sellPrice,
          stock: line.quantity,
          minStockAlert: 5,
          unit: line.newProduct.unit,
          description: `Ajouté via scan OCR facture (${payload.supplierName})`,
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
          isOnline: true,
          totalSold: 0,
        };
        createdProducts.push(newProd);
        newMovements.push({
          id: `mov-${Date.now()}-new-${idx}`,
          productId: newId,
          productName: newProd.name,
          type: 'IN',
          quantity: line.quantity,
          reason: payload.reason,
          date: nowDate,
          user: merchant.name,
        });
      }
    });

    setProducts(prev => {
      const updatedExisting = prev.map(p => {
        const inc = existingIncrements.get(p.id);
        if (!inc) return p;
        return {
          ...p,
          stock: p.stock + inc.qty,
          buyPrice: inc.updateBuyPrice && inc.buyPrice > 0 ? inc.buyPrice : p.buyPrice,
        };
      });
      return [...createdProducts, ...updatedExisting];
    });

    if (newMovements.length > 0) {
      setStockMovements(prev => [...newMovements, ...prev]);
    }
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const handleRecordPromoCampaign = (log: PromoCampaignLog, recipientIds: string[]) => {
    setPromoLogs(prev => [log, ...prev]);
    const idSet = new Set(recipientIds);
    setCustomers(prev =>
      prev.map(c => (idSet.has(c.id) ? { ...c, lastPromoSentAt: log.sentAt } : c))
    );
  };

  // When a sale is made in POS or Online Store, decrement stocks accordingly and check critical alerts
  const handleRegisterOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    // Auto-capture non-anonymous customer contact into customer database
    const cleanDigits = newOrder.customerPhone.replace(/[^0-9]/g, '');
    const isRealPhone = cleanDigits.length >= 8 && !cleanDigits.endsWith('00000000');
    const isGenericName = newOrder.customerName.trim().toLowerCase() === 'client comptoir';
    if (isRealPhone || !isGenericName) {
      setCustomers(prev => {
        const exists = prev.some(c => {
          const cDigits = c.phone.replace(/[^0-9]/g, '');
          return (isRealPhone && cDigits === cleanDigits) || c.name.trim().toLowerCase() === newOrder.customerName.trim().toLowerCase();
        });
        if (exists) return prev;
        return [
          {
            id: `cust-${Date.now()}`,
            name: newOrder.customerName.trim(),
            phone: newOrder.customerPhone.trim(),
            city: newOrder.deliveryCity.split(' (')[0] || merchant.city,
            notes: `Ajouté automatiquement depuis commande ${newOrder.orderNumber}`,
            createdAt: new Date().toISOString().slice(0, 10),
          },
          ...prev,
        ];
      });
    }

    // Decrement stock for each item ordered
    newOrder.items.forEach(item => {
      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          const updatedStock = Math.max(0, p.stock - item.quantity);
          const updatedProd = {
            ...p,
            stock: updatedStock,
            totalSold: p.totalSold + item.quantity,
          };

          // Trigger real-time alert if stock drops below critical threshold
          if (updatedStock <= p.minStockAlert) {
            checkAndNotifyStock(updatedProd);
          }

          return updatedProd;
        }
        return p;
      }));

      // Movement record
      const mov: StockMovement = {
        id: `mov-${Date.now()}-${item.productId}`,
        productId: item.productId,
        productName: item.productName,
        type: 'OUT',
        quantity: item.quantity,
        reason: `Vente ${newOrder.orderNumber} (${newOrder.channel})`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        user: newOrder.channel === 'POS' ? 'Caisse Magasin' : 'Boutique en Ligne',
      };
      setStockMovements(prev => [mov, ...prev]);
    });
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);

  // If in Public Storefront mode
  if (appMode === 'public_store') {
    return (
      <PublicStorefrontView
        merchant={merchant}
        products={products}
        onBackToDashboard={() => setAppMode('merchant')}
        onNewCustomerOrder={(ord) => handleRegisterOrder(ord)}
      />
    );
  }

  // If on Landing Page mode
  if (appMode === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setAppMode('merchant')}
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode);
            setIsAuthOpen(true);
          }}
          onOpenStorePreview={() => setAppMode('public_store')}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(data) => {
            if (data) {
              setMerchant(prev => ({ ...prev, ...data }));
            }
            setIsAuthOpen(false);
            setAppMode('merchant');
          }}
        />
      </>
    );
  }

  // Merchant Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockProducts.length}
        merchant={merchant}
        onOpenStorePreview={() => setAppMode('public_store')}
        onLogout={() => setAppMode('landing')}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Navbar with Real-time Alerts */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          merchant={merchant}
          lowStockProducts={lowStockProducts}
          recentOrders={orders}
          onOpenStorePreview={() => setAppMode('public_store')}
          onGoToLanding={() => setAppMode('landing')}
          onOpenQuickSale={() => setCurrentTab('pos')}
          setIsMobileOpen={setIsMobileSidebarOpen}
          onQuickReplenishStock={handleQuickReplenishStock}
        />

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              products={products}
              orders={orders}
              merchant={merchant}
              setCurrentTab={setCurrentTab}
              onOpenQuickSale={() => setCurrentTab('pos')}
              onOpenStorePreview={() => setAppMode('public_store')}
              onSelectOrder={(order) => setSelectedOrder(order)}
              onAddNewProduct={() => {
                setCurrentTab('products');
                setIsAddProductModalOpen(true);
              }}
            />
          )}

          {currentTab === 'products' && (
            <ProductsView
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              isAddModalOpen={isAddProductModalOpen}
              setIsAddModalOpen={setIsAddProductModalOpen}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersView
              orders={orders}
              merchant={merchant}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onOpenInvoice={(order) => setInvoiceOrder(order)}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              orders={orders}
              merchant={merchant}
              promoLogs={promoLogs}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onRecordPromoCampaign={handleRecordPromoCampaign}
              onOpenInvoice={(order) => setInvoiceOrder(order)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              products={products}
              stockMovements={stockMovements}
              onUpdateStock={handleUpdateStock}
              onReceiveInvoiceStock={handleBatchReceiveInvoiceStock}
            />
          )}

          {currentTab === 'pos' && (
            <PosView
              products={products}
              merchant={merchant}
              onCompleteSale={handleRegisterOrder}
              onOpenInvoice={(order) => setInvoiceOrder(order)}
            />
          )}

          {currentTab === 'shop' && (
            <ShopManagementView
              merchant={merchant}
              onUpdateMerchant={setMerchant}
              onOpenStorePreview={() => setAppMode('public_store')}
            />
          )}

          {currentTab === 'anti_fraud' && (
            <AntiFraudView
              products={products}
              onSaveProductVerification={handleSaveProductVerification}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              products={products}
              orders={orders}
              merchant={merchant}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for easy on-the-go access */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-semibold ${
            currentTab === 'dashboard' ? 'text-sky-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Tableau</span>
        </button>

        <button
          onClick={() => setCurrentTab('products')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-semibold ${
            currentTab === 'products' ? 'text-sky-600' : 'text-slate-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Produits</span>
        </button>

        <button
          onClick={() => setCurrentTab('pos')}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold text-sky-600"
        >
          <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Calculator className="w-5 h-5" />
          </div>
          <span>Caisse POS</span>
        </button>

        <button
          onClick={() => setCurrentTab('orders')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-semibold relative ${
            currentTab === 'orders' ? 'text-sky-600' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Commandes</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          onClick={() => setAppMode('public_store')}
          className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-semibold text-slate-500"
        >
          <Store className="w-5 h-5 text-emerald-600" />
          <span>Vitrine</span>
        </button>
      </div>

      {/* Normalized Invoice / Receipt Modal */}
      <InvoiceModal
        order={invoiceOrder}
        merchant={merchant}
        onClose={() => setInvoiceOrder(null)}
      />

      {/* Auth Modal for switching merchant account */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(data) => {
          if (data) {
            setMerchant(prev => ({ ...prev, ...data }));
          }
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [merchant, setMerchant] = useState<MerchantProfile>(initialMerchantProfile);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(initialStockMovements);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [promoLogs, setPromoLogs] = useState<PromoCampaignLog[]>([]);
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  return (
    <CurrencyProvider initialCurrency={merchant.currency}>
      <NotificationProvider 
        products={products} 
        onNavigateToInventory={() => setCurrentTab('inventory')}
      >
        <AppContent
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          merchant={merchant}
          setMerchant={setMerchant}
          stockMovements={stockMovements}
          setStockMovements={setStockMovements}
          customers={customers}
          setCustomers={setCustomers}
          promoLogs={promoLogs}
          setPromoLogs={setPromoLogs}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </NotificationProvider>
    </CurrencyProvider>
  );
}
