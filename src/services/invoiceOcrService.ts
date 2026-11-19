import { InvoiceOcrResult, Product } from '../types';

export async function extractInvoiceStockItems(params: {
  imageDataUrl: string;
  products: Product[];
}): Promise<InvoiceOcrResult> {
  const catalogProducts = params.products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit: p.unit,
  }));

  const response = await fetch('/api/ai/ocr-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageDataUrl: params.imageDataUrl,
      catalogProducts,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' && data.error
        ? data.error
        : `Erreur serveur (${response.status}) lors de la lecture OCR de la facture.`
    );
  }

  return data as InvoiceOcrResult;
}
