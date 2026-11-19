import React, { useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  Send,
  Edit3,
  Trash2,
  X,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  Calendar,
  FileText,
  Award,
  Megaphone
} from 'lucide-react';
import { Customer, MerchantProfile, Order, PromoCampaignLog } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { computeOrderTaxBreakdown } from '../utils/tax';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  merchant: MerchantProfile;
  promoLogs: PromoCampaignLog[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onRecordPromoCampaign: (log: PromoCampaignLog, recipientIds: string[]) => void;
  onOpenInvoice: (order: Order) => void;
}

interface CustomerWithStats extends Customer {
  matchedOrders: Order[];
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  segment: 'VIP' | 'REGULAR' | 'NEW';
}

const normalizePhone = (phone: string): string => phone.replace(/[^0-9]/g, '');

const PROMO_TEMPLATES = [
  {
    id: 'arrival',
    title: 'Nouvel Arrivage Boutique',
    buildText: (storeName: string, slug: string) =>
      `Bonjour {nom} ! Nouvel arrivage exclusif chez ${storeName} (Pagnes Wax, Bazin & soins naturels). Venez découvrir nos nouveautés ici : https://boutikpro.bj/${slug}`,
  },
  {
    id: 'loyalty',
    title: 'Remise Fidélité -10%',
    buildText: (storeName: string, slug: string) =>
      `Merci pour votre confiance {nom} ! Pour vous remercier de votre fidélité chez ${storeName}, profitez de -10% cette semaine avec le code FIDEL10 : https://boutikpro.bj/${slug}`,
  },
  {
    id: 'weekend',
    title: 'Vente Flash Week-end',
    buildText: (storeName: string) =>
      `Offre spéciale week-end chez ${storeName} ! Livraison rapide sur Cotonou, Calavi & Porto-Novo. Répondez directement à ce message pour réserver votre article, {nom}.`,
  },
];

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  merchant,
  promoLogs,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onRecordPromoCampaign,
  onOpenInvoice,
}) => {
  const { formatPrice } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'ALL' | 'VIP' | 'REGULAR' | 'NEW'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Add / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('+229 ');
  const [formCity, setFormCity] = useState('Cotonou');
  const [formNotes, setFormNotes] = useState('');

  // Purchase History Modal
  const [historyCustomerId, setHistoryCustomerId] = useState<string | null>(null);

  // Promo Composer Modal
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoTargetMode, setPromoTargetMode] = useState<'SELECTED' | 'ALL' | 'VIP' | 'NEW'>('ALL');
  const [promoChannel, setPromoChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [promoTitle, setPromoTitle] = useState('Nouvel Arrivage Boutique');
  const [promoText, setPromoText] = useState(() =>
    PROMO_TEMPLATES[0].buildText(merchant.storeName, merchant.storeSlug)
  );
  const [copiedPromo, setCopiedPromo] = useState(false);

  // Compute live purchase stats per customer from `orders`
  const customersWithStats: CustomerWithStats[] = useMemo(() => {
    return customers.map(c => {
      const cPhoneNorm = normalizePhone(c.phone);
      const cNameNorm = c.name.trim().toLowerCase();

      const matchedOrders = orders
        .filter(o => {
          if (o.status === 'CANCELLED') return false;
          const oPhoneNorm = normalizePhone(o.customerPhone);
          const phoneMatch = cPhoneNorm.length >= 8 && oPhoneNorm === cPhoneNorm;
          const nameMatch = o.customerName.trim().toLowerCase() === cNameNorm;
          return phoneMatch || nameMatch;
        })
        .sort((a, b) => b.date.localeCompare(a.date));

      const totalSpent = matchedOrders.reduce(
        (s, o) => s + computeOrderTaxBreakdown(o, merchant).totalAmount,
        0
      );
      const ordersCount = matchedOrders.length;
      const lastOrderDate = matchedOrders.length > 0 ? matchedOrders[0].date : null;

      const segment: 'VIP' | 'REGULAR' | 'NEW' =
        totalSpent >= 100000 || ordersCount >= 2
          ? 'VIP'
          : ordersCount === 1
          ? 'REGULAR'
          : 'NEW';

      return {
        ...c,
        matchedOrders,
        ordersCount,
        totalSpent,
        lastOrderDate,
        segment,
      };
    });
  }, [customers, orders, merchant]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customersWithStats.filter(c => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q);
      const matchesSegment = segmentFilter === 'ALL' || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [customersWithStats, searchTerm, segmentFilter]);

  const vipCount = customersWithStats.filter(c => c.segment === 'VIP').length;
  const activeBuyersCount = customersWithStats.filter(c => c.ordersCount > 0).length;
  const totalCustomerSpend = customersWithStats.reduce((s, c) => s + c.totalSpent, 0);

  const historyCustomer = useMemo(
    () => customersWithStats.find(c => c.id === historyCustomerId) || null,
    [customersWithStats, historyCustomerId]
  );

  // Selection helpers
  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every(c => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const visibleSet = new Set(filteredCustomers.map(c => c.id));
      setSelectedIds(prev => prev.filter(id => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...filteredCustomers.map(c => c.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Add / Edit Customer Form Handlers
  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('+229 ');
    setFormCity('Cotonou');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormCity(c.city || 'Cotonou');
    setFormNotes(c.notes || '');
    setIsFormOpen(true);
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        city: formCity.trim() || 'Cotonou',
        notes: formNotes.trim() || undefined,
      });
      setNoticeMessage(`Fiche de ${formName.trim()} mise à jour.`);
    } else {
      onAddCustomer({
        id: `cust-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        city: formCity.trim() || 'Cotonou',
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setNoticeMessage(`${formName.trim()} ajouté(e) à votre base clients.`);
    }
    setIsFormOpen(false);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Promo Composer Helpers
  const openPromoForSelection = (specificCustomerId?: string) => {
    if (specificCustomerId) {
      setSelectedIds([specificCustomerId]);
      setPromoTargetMode('SELECTED');
    } else if (selectedIds.length > 0) {
      setPromoTargetMode('SELECTED');
    } else {
      setPromoTargetMode('ALL');
    }
    setCopiedPromo(false);
    setIsPromoModalOpen(true);
  };

  const promoRecipients = useMemo(() => {
    if (promoTargetMode === 'SELECTED') {
      return customersWithStats.filter(c => selectedIds.includes(c.id));
    }
    if (promoTargetMode === 'VIP') {
      return customersWithStats.filter(c => c.segment === 'VIP');
    }
    if (promoTargetMode === 'NEW') {
      return customersWithStats.filter(c => c.ordersCount === 0);
    }
    return customersWithStats;
  }, [customersWithStats, promoTargetMode, selectedIds]);

  const personalizePromoMessage = (recipientName?: string) => {
    const firstName = recipientName ? recipientName.split(' ')[0] : 'cher(e) client(e)';
    return promoText.replace(/\{nom\}/gi, firstName);
  };

  const singleRecipient = promoRecipients.length === 1 ? promoRecipients[0] : null;
  const whatsappSingleHref = singleRecipient
    ? `https://wa.me/${normalizePhone(singleRecipient.phone)}?text=${encodeURIComponent(
        personalizePromoMessage(singleRecipient.name)
      )}`
    : undefined;

  const handleCopyPromo = () => {
    const sample = personalizePromoMessage(singleRecipient?.name);
    navigator.clipboard?.writeText(sample);
    setCopiedPromo(true);
    setTimeout(() => setCopiedPromo(false), 2000);
  };

  const handleSendAndLogPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoRecipients.length === 0 || !promoText.trim()) return;

    const log: PromoCampaignLog = {
      id: `promo-${Date.now()}`,
      title: promoTitle.trim() || 'Message promotionnel',
      message: promoText.trim(),
      channel: promoChannel,
      recipientCount: promoRecipients.length,
      recipientNames: promoRecipients.map(r => r.name),
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onRecordPromoCampaign(
      log,
      promoRecipients.map(r => r.id)
    );

    setIsPromoModalOpen(false);
    setNoticeMessage(
      `Campagne "${log.title}" enregistrée (${promoChannel}) pour ${promoRecipients.length} client${promoRecipients.length > 1 ? 's' : ''}.`
    );
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Base Clients & Fidélisation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivez l'historique d'achats de vos clients et envoyez des offres promotionnelles ciblées
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => openPromoForSelection()}
            className="px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-sky-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Megaphone className="w-4 h-4 text-sky-300" />
            <span>
              Envoyer une promo{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau client</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Notice */}
      {noticeMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Clients enregistrés
          </p>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2 tabular-nums">
            {customersWithStats.length}
          </p>
          <p className="text-xs text-slate-400 mt-1 tabular-nums">
            Dont {activeBuyersCount} avec commande enregistrée
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Clients VIP / Fidèles
          </p>
          <p className="text-2xl font-black font-heading text-sky-700 mt-2 tabular-nums">
            {vipCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            2+ achats ou ≥ 100 000 FCFA
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Volume d'Achats Suivi
          </p>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2 tabular-nums">
            {formatPrice(totalCustomerSpend)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cumulé sur la base clients
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Promos Envoyées
          </p>
          <p className="text-2xl font-black font-heading text-emerald-600 mt-2 tabular-nums">
            {promoLogs.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Campagnes WhatsApp & SMS
          </p>
        </div>
      </div>

      {/* Search & Segment Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone (+229...) ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
          {([
            { id: 'ALL', label: `Tous (${customersWithStats.length})` },
            { id: 'VIP', label: `VIP (${vipCount})` },
            {
              id: 'REGULAR',
              label: `Réguliers (${customersWithStats.filter(c => c.segment === 'REGULAR').length})`,
            },
            {
              id: 'NEW',
              label: `Nouveaux (${customersWithStats.filter(c => c.segment === 'NEW').length})`,
            },
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSegmentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                segmentFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Aucun client trouvé</p>
            <p className="text-xs text-slate-500">
              Ajoutez un nouveau client ou modifiez vos filtres de recherche.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter un client</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      title="Tout sélectionner"
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Téléphone</th>
                  <th className="py-3 px-3">Statut Fidélité</th>
                  <th className="py-3 px-3 text-right">Achats</th>
                  <th className="py-3 px-3 text-right">Total Dépensé</th>
                  <th className="py-3 px-3">Dernier Achat</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{c.city || 'Cotonou'}</span>
                            {c.lastPromoSentAt && (
                              <>
                                <span>·</span>
                                <span className="text-sky-700">Promo envoyée</span>
                              </>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap">
                        {c.phone}
                      </td>
                      <td className="py-3 px-3">
                        {c.segment === 'VIP' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                            <Award className="w-3.5 h-3.5" />
                            <span>Client VIP</span>
                          </span>
                        ) : c.segment === 'REGULAR' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                            <Check className="w-3.5 h-3.5" />
                            <span>Régulier</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Nouveau contact</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {c.ordersCount}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sky-700 tabular-nums whitespace-nowrap">
                        {formatPrice(c.totalSpent)}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {c.lastOrderDate || 'Aucun achat'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHistoryCustomerId(c.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                            title="Voir l'historique d'achats"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-600" />
                            <span>Historique</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPromoForSelection(c.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                            title="Envoyer un message promotionnel"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Promo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Supprimer"
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
        )}
      </div>

      {/* Promo Campaigns History */}
      {promoLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900">
                Historique des Messages Promotionnels Envoyés
              </h3>
              <p className="text-xs text-slate-500">
                Suivi des campagnes de fidélisation WhatsApp & SMS
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {promoLogs.map(log => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.title}</span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="font-semibold text-emerald-700">{log.channel}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-1">{log.message}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="font-bold text-slate-800 tabular-nums">
                    {log.recipientCount} destinataire{log.recipientCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">{log.sentAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="p-5 bg-[#0B192C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <h3 className="font-heading font-bold text-base">
                  {editingCustomer ? 'Modifier le Client' : 'Nouveau Client'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCustomerFormSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom complet du client *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Adjoua Koudjo"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Téléphone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ville / Quartier
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Cotonou"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Préférences & notes de fidélité
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Préfère les tissus Wax bleu, taille M..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCustomer ? 'Enregistrer' : 'Ajouter le client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setHistoryCustomerId(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg">{historyCustomer.name}</h3>
                <p className="text-xs text-sky-200 flex items-center gap-2 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono">{historyCustomer.phone}</span>
                  <span>·</span>
                  <span>{historyCustomer.city || 'Cotonou'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryCustomerId(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Commandes</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {historyCustomer.ordersCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                  <p className="text-sky-700">Total dépensé</p>
                  <p className="text-lg font-black text-[#0B192C] tabular-nums mt-0.5">
                    {formatPrice(historyCustomer.totalSpent)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-slate-500">Panier moyen</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">
                    {formatPrice(
                      historyCustomer.ordersCount > 0
                        ? Math.round(historyCustomer.totalSpent / historyCustomer.ordersCount)
                        : 0
                    )}
                  </p>
                </div>
              </div>

              {historyCustomer.notes && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                  <span className="font-bold">Note client : </span>
                  <span>{historyCustomer.notes}</span>
                </div>
              )}

              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900 mb-2.5">
                  Historique détaillé des achats
                </h4>

                {historyCustomer.matchedOrders.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500">
                    Aucun achat enregistré pour ce client pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyCustomer.matchedOrders.map(order => (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {order.date}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-semibold text-sky-700">{order.channel}</span>
                          </div>
                          <span className="font-black text-sm text-slate-900 tabular-nums">
                            {formatPrice(computeOrderTaxBreakdown(order, merchant).totalAmount)}
                          </span>
                        </div>

                        <div className="text-slate-600 space-y-1 pl-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between gap-2">
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="font-mono text-slate-500 tabular-nums">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            Paiement : <strong>{order.paymentMethod}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setHistoryCustomerId(null);
                              onOpenInvoice(order);
                            }}
                            className="text-sky-700 hover:text-sky-900 font-bold inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Voir facture</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const id = historyCustomer.id;
                  setHistoryCustomerId(null);
                  openPromoForSelection(id);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer une promo à ce client</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryCustomerId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promo Message Composer Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsPromoModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
            <div className="p-5 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg">
                    Envoyer un Message Promotionnel
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    Personnalisation automatique avec {'{nom}'} pour fidéliser vos clients
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAndLogPromo} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Target Audience Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">1. Destinataires</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPromoTargetMode('SELECTED')}
                      className={`p-2 rounded-xl border font-bold text-left ${
                        promoTargetMode === 'SELECTED'
                          ? 'border-sky-600 bg-sky-50 text-sky-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Sélection ({selectedIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPromoTargetMode('ALL')}
                    className={`p-2 rounded-xl border font-bold text-left ${
                      promoTargetMode === 'ALL'
                        ? 'border-sky-600 bg-sky-50 text-sky-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tous ({customersWithStats.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoTargetMode('VIP')}
                    className={`p-2 rounded-xl border font-bold text-left ${
                      promoTargetMode === 'VIP'
                        ? 'border-sky-600 bg-sky-50 text-sky-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Clients VIP ({vipCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoTargetMode('NEW')}
                    className={`p-2 rounded-xl border font-bold text-left ${
                      promoTargetMode === 'NEW'
                        ? 'border-sky-600 bg-sky-50 text-sky-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nouveaux ({customersWithStats.filter(c => c.ordersCount === 0).length})
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {promoRecipients.length > 0
                    ? `Destinataires ciblés : ${promoRecipients.map(r => r.name).join(', ')}`
                    : 'Aucun client dans ce segment.'}
                </p>
              </div>

              {/* Channel & Quick Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">2. Canal d'envoi</label>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPromoChannel('WHATSAPP')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                        promoChannel === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoChannel('SMS')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                        promoChannel === 'SMS' ? 'bg-sky-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      SMS Bénin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Modèle rapide</label>
                  <select
                    value={promoTitle}
                    onChange={(e) => {
                      const tpl = PROMO_TEMPLATES.find(t => t.title === e.target.value);
                      setPromoTitle(e.target.value);
                      if (tpl) {
                        setPromoText(tpl.buildText(merchant.storeName, merchant.storeSlug));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {PROMO_TEMPLATES.map(t => (
                      <option key={t.id} value={t.title}>{t.title}</option>
                    ))}
                    <option value="Message personnalisé">Message personnalisé</option>
                  </select>
                </div>
              </div>

              {/* Message Editor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">3. Texte du message promotionnel</label>
                  <span className="text-[11px] text-slate-400">Astuce : utilisez {'{nom}'} pour le prénom</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={promoText}
                  onChange={(e) => setPromoText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Aperçu client ({singleRecipient ? singleRecipient.name : 'Exemple'})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPromo}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1"
                  >
                    {copiedPromo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPromo ? 'Copié !' : 'Copier le texte'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {personalizePromoMessage(singleRecipient?.name || promoRecipients[0]?.name)}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {whatsappSingleHref && promoChannel === 'WHATSAPP' && (
                    <a
                      href={whatsappSingleHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Ouvrir WhatsApp ({singleRecipient?.name})</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={promoRecipients.length === 0 || !promoText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-sky-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      Envoyer & journaliser ({promoRecipients.length})
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
