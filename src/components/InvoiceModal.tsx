import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { Order, MerchantProfile } from '../types';
import { useCurrency, CURRENCY_RATES } from '../context/CurrencyContext';
import { computeOrderTaxBreakdown } from '../utils/tax';

interface InvoiceModalProps {
  order: Order | null;
  merchant: MerchantProfile;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  merchant,
  onClose,
}) => {
  const { formatPrice, currency, currentCurrencyDetails } = useCurrency();
  if (!order) return null;

  const { taxRate, taxLabel, taxAmount, totalAmount } = computeOrderTaxBreakdown(order, merchant);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[95vh] flex flex-col">
        {/* Actions Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm">Facture Normalisée / Reçu de Caisse</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-400/30">
              Bénin DGI Conforme
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-white font-black text-sm flex items-center justify-center">
                  BP
                </div>
                <h2 className="text-xl font-black font-heading text-slate-900">
                  {merchant.storeName}
                </h2>
              </div>
              <p className="text-slate-600 font-medium">{merchant.address}</p>
              <p className="text-slate-500">{merchant.city}, République du Bénin</p>
              <p className="text-slate-500 font-mono">Tél : {merchant.phone} • WhatsApp : {merchant.whatsapp}</p>
              <div className="pt-1 flex items-center gap-1 font-mono font-bold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>N° IFU : {merchant.ifuNumber}</span>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 font-mono font-black text-xs text-slate-900 uppercase">
                FACTURE N° {order.orderNumber}
              </span>
              <p className="text-slate-500 mt-1">Date d'émission : {order.date}</p>
              <p className="text-slate-500 font-semibold">Statut : {order.status === 'PAID' || order.status === 'DELIVERED' ? 'PAYÉE' : 'EN ATTENTE'}</p>
              <p className="text-slate-500">Règlement : {order.paymentMethod}</p>
            </div>
          </div>

          {/* Client Destination */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturé à :</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</p>
              <p className="font-mono text-slate-600 mt-0.5">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lieu de Livraison :</p>
              <p className="font-semibold text-slate-800 mt-0.5">{order.deliveryCity}</p>
              <p className="text-slate-600 mt-0.5">{order.deliveryAddress}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-600 font-bold uppercase text-[10px]">
                <th className="py-2">Désignation</th>
                <th className="py-2 text-center">Qté</th>
                <th className="py-2 text-right">Prix Unitaire</th>
                <th className="py-2 text-right">Total ({currentCurrencyDetails.symbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-semibold text-slate-900">
                    {item.productName}
                    {item.variant && <span className="text-slate-500 font-normal block text-[11px]">{item.variant}</span>}
                  </td>
                  <td className="py-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 text-right font-mono">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatPrice(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-76 space-y-2 border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Total HT :</span>
                <span className="font-mono font-semibold tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {taxLabel} ({taxRate > 0 ? `${taxRate}%` : 'Régime TPS 0%'}) :
                </span>
                <span className="font-mono font-semibold tabular-nums">{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de livraison :</span>
                <span className="font-mono font-semibold tabular-nums">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>NET À PAYER (TTC) :</span>
                <span className="text-base text-sky-700 font-mono tabular-nums">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              {currency !== 'FCFA' && (
                <p className="text-[10px] text-slate-400 italic text-right pt-1">
                  Équivalent légal : {formatPrice(totalAmount, 'FCFA')}
                </p>
              )}
            </div>
          </div>

          {/* Footer Legal & Security */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Facture certifiée émise via le logiciel BOUTIKPRO Bénin.</p>
              <p>Merci pour votre confiance et à très bientôt dans notre boutique !</p>
            </div>
            <div className="text-center font-mono">
              <div className="w-12 h-12 bg-slate-100 rounded border border-slate-300 flex items-center justify-center mx-auto mb-0.5">
                <QrCode className="w-8 h-8 text-slate-700" />
              </div>
              <span>DGI-MECeF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
