import { MerchantProfile, Order } from '../types';

export interface TaxBreakdown {
  taxRate: number;
  taxLabel: string;
  taxAmount: number;
  totalAmount: number;
}

export function getActiveTaxRate(merchant: MerchantProfile): number {
  if (!merchant.taxEnabled) return 0;
  const parsed = Number(merchant.taxRate);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.min(100, parsed);
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  if (taxRate <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * (taxRate / 100));
}

export function computeOrderTaxBreakdown(order: Order, merchant: MerchantProfile): TaxBreakdown {
  const effectiveMerchantRate = getActiveTaxRate(merchant);
  const taxRate = order.taxRate !== undefined ? order.taxRate : effectiveMerchantRate;
  const taxLabel = order.taxLabel || merchant.taxLabel?.trim() || 'TVA';
  const taxAmount =
    order.taxAmount !== undefined
      ? order.taxAmount
      : calculateTaxAmount(order.subtotal, taxRate);
  const totalAmount =
    order.taxAmount !== undefined
      ? order.totalAmount
      : order.subtotal + taxAmount + order.deliveryFee;

  return {
    taxRate,
    taxLabel,
    taxAmount,
    totalAmount,
  };
}
