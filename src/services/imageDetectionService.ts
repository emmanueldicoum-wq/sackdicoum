import { ImageDetectionResult } from '../types';

export interface DetectImageParams {
  imageDataUrl?: string;
  imageUrl?: string;
  context?: 'product_photo' | 'payment_proof' | 'general';
  productName?: string;
}

export async function analyzeImageAuthenticity(
  params: DetectImageParams
): Promise<ImageDetectionResult> {
  const response = await fetch('/api/ai/detect-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' && data.error
        ? data.error
        : `Erreur serveur (${response.status}) lors de l'analyse de la photo.`
    );
  }

  return data as ImageDetectionResult;
}

export async function fileToOptimizedDataUrl(file: File, maxDimension = 1400): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image sélectionné.'));
    reader.readAsDataURL(file);
  });

  // Resize large photos gently in browser while preserving visual artifacts for forensics
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(rawDataUrl);
        return;
      }

      const scale = Math.min(maxDimension / width, maxDimension / height);
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outputMime, 0.92));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
