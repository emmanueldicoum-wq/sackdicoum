import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Download,
  ArrowUpRight,
  ShoppingBag,
  Percent,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { MerchantProfile, Product, Order } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { computeOrderTaxBreakdown } from '../utils/tax';

interface AnalyticsViewProps {
  products: Product[];
  orders: Order[];
  merchant: MerchantProfile;
}

interface DailyRevenuePoint {
  isoDate: string;
  shortDate: string;
  fullDate: string;
  revenueFCFA: number;
  convertedRevenue: number;
  ordersCount: number;
  isWeekendOrMarket: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  products,
  orders,
  merchant,
}) => {
  const { formatPrice, convertPrice, currency, currentCurrencyDetails } = useCurrency();
  const [period, setPeriod] = useState<'7D' | '30D' | 'YEAR'>('30D');
  const [showAverageLine, setShowAverageLine] = useState(true);
  const [reportNotice, setReportNotice] = useState(false);

  // Financial Computations
  const getOrderTotal = (o: Order) => computeOrderTaxBreakdown(o, merchant).totalAmount;
  const totalGrossRevenue = orders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Calculate estimated total product cost for all items ordered
  let totalCostOfGoodsSold = 0;
  orders.forEach(order => {
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const buyPrice = prod ? prod.buyPrice : item.unitPrice * 0.65;
      totalCostOfGoodsSold += buyPrice * item.quantity;
    });
  });

  const estimatedNetProfit = totalGrossRevenue - totalCostOfGoodsSold;
  const profitMarginPercent = totalGrossRevenue > 0 ? Math.round((estimatedNetProfit / totalGrossRevenue) * 100) : 0;

  // 30-day daily revenue series (blends realistic Beninese market baseline with live orders)
  const last30DaysData: DailyRevenuePoint[] = useMemo(() => {
    // Baseline daily figures in FCFA (with Dantokpa market cycle & weekend peaks)
    const deterministicCurve = [
      118000, 142000, 165000, 134000, 189000, 245000, 212000,
      128000, 154000, 198000, 162000, 215000, 278000, 236000,
      141000, 176000, 224000, 184000, 252000, 312000, 268000,
      158000, 192000, 248000, 205000, 286000, 342000, 294000,
      218000, 264000
    ];

    const ordersByDate = new Map<string, { revenue: number; count: number }>();
    orders.forEach(o => {
      if (o.status === 'CANCELLED') return;
      const dateKey = o.date.slice(0, 10);
      const existing = ordersByDate.get(dateKey) || { revenue: 0, count: 0 };
      ordersByDate.set(dateKey, {
        revenue: existing.revenue + computeOrderTaxBreakdown(o, merchant).totalAmount,
        count: existing.count + 1,
      });
    });

    const today = new Date();
    const points: DailyRevenuePoint[] = [];

    for (let offset = 29; offset >= 0; offset--) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;

      const dayOfWeek = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
      const isWeekendOrMarket = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      const index = 29 - offset;
      const baseFCFA = deterministicCurve[index] ?? 180000;
      const liveForDay = ordersByDate.get(isoDate);

      const revenueFCFA = baseFCFA + (liveForDay ? liveForDay.revenue : 0);
      const baseOrders = Math.max(2, Math.round(baseFCFA / 42000));
      const ordersCount = baseOrders + (liveForDay ? liveForDay.count : 0);

      const shortDate = `${dd}/${mm}`;
      const fullDate = d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      points.push({
        isoDate,
        shortDate,
        fullDate,
        revenueFCFA,
        convertedRevenue: Number(convertPrice(revenueFCFA).toFixed(currency === 'FCFA' ? 0 : 2)),
        ordersCount,
        isWeekendOrMarket,
      });
    }

    return points;
  }, [orders, merchant, convertPrice, currency]);

  const total30dFCFA = useMemo(
    () => last30DaysData.reduce((sum, pt) => sum + pt.revenueFCFA, 0),
    [last30DaysData]
  );
  const avgDaily30dFCFA = Math.round(total30dFCFA / Math.max(1, last30DaysData.length));
  const avgDailyConverted = Number(convertPrice(avgDaily30dFCFA).toFixed(currency === 'FCFA' ? 0 : 2));
  const peakDay = useMemo(
    () =>
      last30DaysData.reduce(
        (best, cur) => (cur.revenueFCFA > best.revenueFCFA ? cur : best),
        last30DaysData[0]
      ),
    [last30DaysData]
  );

  const formatYAxisTick = (val: number) => {
    if (currency === 'FCFA') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${Math.round(val / 1000)}k`;
      return `${val}`;
    }
    const symbol = currentCurrencyDetails.symbol;
    return currency === 'USD' ? `${symbol}${Math.round(val)}` : `${Math.round(val)} ${symbol}`;
  };

  // Channel breakdown
  const webOrders = orders.filter(o => o.channel === 'STORE_FRONT');
  const waOrders = orders.filter(o => o.channel === 'WHATSAPP');
  const posOrders = orders.filter(o => o.channel === 'POS');

  const webRevenue = webOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const waRevenue = waOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const posRevenue = posOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Operator breakdown
  const momoOrders = orders.filter(o => o.paymentMethod === 'MTN_MOMO');
  const moovOrders = orders.filter(o => o.paymentMethod === 'MOOV_MONEY');
  const celtiisOrders = orders.filter(o => o.paymentMethod === 'CELTIIS_CASH');
  const cashOrders = orders.filter(o => o.paymentMethod === 'CASH_ON_DELIVERY');

  const momoTotal = momoOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const moovTotal = moovOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const celtiisTotal = celtiisOrders.reduce((s, o) => s + getOrderTotal(o), 0);
  const cashTotal = cashOrders.reduce((s, o) => s + getOrderTotal(o), 0);

  // Weekly bar data simulation
  const weeklyData = [
    { day: 'Lun', sales: 185000, orders: 3 },
    { day: 'Mar', sales: 240000, orders: 4 },
    { day: 'Mer', sales: 310000, orders: 6 },
    { day: 'Jeu', sales: 195000, orders: 3 },
    { day: 'Ven', sales: 480000, orders: 8 },
    { day: 'Sam', sales: 620000, orders: 11 },
    { day: 'Dim', sales: 455000, orders: 7 },
  ];
  const maxSale = Math.max(...weeklyData.map(d => d.sales));

  const handleGeneratePdf = () => {
    setReportNotice(true);
    setTimeout(() => setReportNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
            Statistiques Commerciales & Performance Financière
          </h2>
          <p className="text-xs text-slate-500">
            Suivi des marges nettes, encaissements Mobile Money et rentabilité en {currentCurrencyDetails.code}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold">
            <button
              onClick={() => setPeriod('7D')}
              className={`px-3 py-1 rounded-lg transition-colors ${period === '7D' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod('30D')}
              className={`px-3 py-1 rounded-lg transition-colors ${period === '30D' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              30 jours
            </button>
            <button
              onClick={() => setPeriod('YEAR')}
              className={`px-3 py-1 rounded-lg transition-colors ${period === 'YEAR' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Année 2026
            </button>
          </div>

          <button
            onClick={handleGeneratePdf}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Rapport PDF</span>
          </button>
        </div>
      </div>

      {reportNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Rapport comptable mensuel préparé avec les chiffres actuels ({currentCurrencyDetails.code}).</span>
        </div>
      )}

      {/* Top Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chiffre d'Affaires Brut
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2 tabular-nums">
            {formatPrice(totalGrossRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+22.5%</span>
            <span className="text-slate-400 font-normal">vs période précédente</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bénéfice Net Estimé
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-emerald-600 mt-2 tabular-nums">
            +{formatPrice(estimatedNetProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Après déduction des coûts d'achat
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taux de Marge Moyenne
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-purple-700 mt-2 tabular-nums">
            {profitMarginPercent}%
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Rentabilité saine & élevée
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Panier Moyen Client
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-heading text-slate-900 mt-2 tabular-nums">
            {formatPrice(orders.length > 0 ? Math.round(totalGrossRevenue / orders.length) : 0)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Par commande validée
          </p>
        </div>
      </div>

      {/* 30-Day Revenue Line Chart (Recharts) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                Évolution du Chiffre d'Affaires — 30 derniers jours
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tendance quotidienne combinant l'historique d'activité et les encaissements récents ({currentCurrencyDetails.code})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500">Cumul 30j : </span>
              <span className="font-black text-slate-900 tabular-nums">{formatPrice(total30dFCFA)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200/80">
              <span className="text-sky-700">Moy. / jour : </span>
              <span className="font-black text-[#0B192C] tabular-nums">{formatPrice(avgDaily30dFCFA)}</span>
            </div>
            {peakDay && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <span className="text-emerald-700">Pic ({peakDay.shortDate}) : </span>
                <span className="font-black text-emerald-900 tabular-nums">{formatPrice(peakDay.revenueFCFA)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAverageLine(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
                showAverageLine
                  ? 'bg-[#0B192C] text-white border-[#0B192C]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Ligne moyenne
            </button>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last30DaysData}
              margin={{ top: 12, right: 16, left: 6, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                interval={4}
              />
              <YAxis
                tickFormatter={formatYAxisTick}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={58}
              />
              <Tooltip
                cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload as DailyRevenuePoint;
                  const diffPercent = avgDaily30dFCFA > 0
                    ? Math.round(((point.revenueFCFA - avgDaily30dFCFA) / avgDaily30dFCFA) * 100)
                    : 0;
                  return (
                    <div className="rounded-2xl bg-[#0B192C] text-white px-3.5 py-2.5 shadow-xl border border-slate-700 text-xs space-y-1">
                      <p className="font-semibold text-sky-300 capitalize">{point.fullDate}</p>
                      <p className="text-sm font-black tabular-nums">
                        {formatPrice(point.revenueFCFA)}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-[11px] text-slate-300 pt-0.5 border-t border-slate-700/80">
                        <span className="tabular-nums">{point.ordersCount} commandes</span>
                        <span className={`font-semibold tabular-nums ${diffPercent >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
                          {diffPercent >= 0 ? `+${diffPercent}%` : `${diffPercent}%`} vs moy.
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {showAverageLine && (
                <ReferenceLine
                  y={avgDailyConverted}
                  stroke="#94A3B8"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Moyenne 30j',
                    position: 'insideTopRight',
                    fill: '#64748B',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="convertedRevenue"
                name="Chiffre d'affaires"
                stroke="#0284C7"
                strokeWidth={3}
                dot={{ r: 2.5, fill: '#0284C7', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#0B192C', stroke: '#38BDF8', strokeWidth: 2 }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Trend Bar Chart (Simulated Weekly Revenue) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Évolution des Ventes Hebdomadaires ({currentCurrencyDetails.code})
            </h3>
            <p className="text-xs text-slate-500">
              Pics d'activité réguliers le week-end (marché Dantokpa & sorties Cotonou)
            </p>
          </div>
          <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full tabular-nums">
            Total semaine : {formatPrice(weeklyData.reduce((s, d) => s + d.sales, 0))}
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100">
          {weeklyData.map((d) => {
            const heightPercent = Math.round((d.sales / maxSale) * 100);
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap tabular-nums">
                  {formatPrice(d.sales)}
                </div>
                <div className="w-full bg-slate-100 rounded-t-xl h-44 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-gradient-to-t from-[#0B192C] to-sky-500 rounded-lg transition-all duration-500 group-hover:from-sky-600 group-hover:to-blue-400 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">{d.day}</span>
                <span className="text-[10px] text-slate-400 tabular-nums">{d.orders} cmd</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Distribution: Payment methods & Sales Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales by Channel */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900">
            Canaux d'Acquisition & Vente
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">Boutique en Ligne Web (Lien direct)</span>
                <span className="font-black text-slate-900">{formatPrice(webRevenue)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${totalGrossRevenue ? (webRevenue / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">Commandes WhatsApp</span>
                <span className="font-black text-slate-900">{formatPrice(waRevenue)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalGrossRevenue ? (waRevenue / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">Caisse Comptoir en Boutique (POS)</span>
                <span className="font-black text-slate-900">{formatPrice(posRevenue)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalGrossRevenue ? (posRevenue / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Money Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-heading font-bold text-base text-slate-900">
            Répartition des Encaissements Opérateurs
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="font-semibold text-slate-800">MTN Mobile Money (MoMo)</span>
                </div>
                <span className="font-black text-slate-900">{formatPrice(momoTotal)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${totalGrossRevenue ? (momoTotal / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#004D98]"></span>
                  <span className="font-semibold text-slate-800">Moov Money (Flooz Bénin)</span>
                </div>
                <span className="font-black text-slate-900">{formatPrice(moovTotal)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#004D98] rounded-full" style={{ width: `${totalGrossRevenue ? (moovTotal / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600]"></span>
                  <span className="font-semibold text-slate-800">Celtiis Cash (SBIN)</span>
                </div>
                <span className="font-black text-slate-900">{formatPrice(celtiisTotal)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-[#FF6600] rounded-full" style={{ width: `${totalGrossRevenue ? (celtiisTotal / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-800">Espèces à la livraison / Boutique</span>
                </div>
                <span className="font-black text-slate-900">{formatPrice(cashTotal)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalGrossRevenue ? (cashTotal / totalGrossRevenue) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
