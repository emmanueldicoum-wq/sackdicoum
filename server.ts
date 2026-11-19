import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

type AnalysisContext = 'product_photo' | 'payment_proof' | 'general';

interface DetectImageRequestBody {
  imageDataUrl?: string;
  imageUrl?: string;
  context?: AnalysisContext;
  productName?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    data: match[2].replace(/\s+/g, ''),
  };
}

function isDisallowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '::1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.startsWith('10.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('169.254.')
  ) {
    return true;
  }
  const m = lower.match(/^172\.(\d+)\./);
  if (m) {
    const secondOctet = Number(m[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  return false;
}

async function fetchRemoteImageAsBase64(rawUrl: string): Promise<{ mimeType: string; data: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("L'URL de l'image est invalide.");
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error("Seules les URL HTTP/HTTPS sont acceptées.");
  }

  if (isDisallowedHostname(parsed.hostname)) {
    throw new Error("Adresse réseau non autorisée pour le chargement d'image.");
  }

  const response = await fetch(parsed.toString(), {
    signal: AbortSignal.timeout(12000),
    headers: {
      Accept: 'image/*',
      'User-Agent': 'BOUTIKPRO-ImageInspector/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Impossible de télécharger l'image (statut HTTP ${response.status}).`);
  }

  const contentTypeHeader = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentTypeHeader.split(';')[0].trim().toLowerCase();
  if (!mimeType.startsWith('image/')) {
    throw new Error("Le lien fourni ne pointe pas vers une image valide.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error("L'image dépasse la taille maximale autorisée (10 Mo).");
  }
  if (arrayBuffer.byteLength === 0) {
    throw new Error("L'image téléchargée est vide.");
  }

  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { mimeType, data: base64 };
}

function buildContextPrompt(context: AnalysisContext, productName?: string): string {
  const productHint = productName?.trim()
    ? `Nom déclaré du produit : "${productName.trim()}". `
    : '';

  if (context === 'payment_proof') {
    return (
      `${productHint}Contexte : Vérification d'une capture d'écran ou d'un reçu de paiement Mobile Money ` +
      `(MTN MoMo, Moov Money, Celtiis Cash au Bénin). Inspecte minutieusement toute trace de retouche ` +
      `numérique, police de caractères incohérente, alignement suspect des montants/IDs de transaction, ` +
      `artefacts de copier-coller, pixels compressés localement ou génération par IA.`
    );
  }

  if (context === 'product_photo') {
    return (
      `${productHint}Contexte : Vérification d'une photo de produit e-commerce (mode wax, bazin, cosmétique, ` +
      `alimentation locale, artisanat ou accessoire vendu au Bénin). Détermine s'il s'agit d'une photographie ` +
      `réelle prise avec un appareil photo/smartphone ou d'une image générée/fortement manipulée par IA ` +
      `(ex. Midjourney, DALL-E, Flux, rendu 3D trompeur). Observe les mains/doigts, motifs textiles répétitifs ` +
      `impossibles, étiquettes/textes illisibles ou déformés, reflets synthétiques, lissage excessif de la peau ` +
      `ou des tissus, et incohérences physiques d'éclairage/ombres.`
    );
  }

  return (
    `${productHint}Contexte : Analyse forensique générale anti-arnaque. Détermine si cette image est une ` +
    `photographie authentique ou une image générée par IA / manipulée numériquement pour tromper un acheteur ou un commerçant.`
  );
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '16mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/ai/detect-image', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as DetectImageRequestBody;
      const context: AnalysisContext =
        body.context === 'payment_proof' || body.context === 'product_photo'
          ? body.context
          : 'general';

      let imagePayload: { mimeType: string; data: string } | null = null;

      if (typeof body.imageDataUrl === 'string' && body.imageDataUrl.trim()) {
        imagePayload = parseDataUrl(body.imageDataUrl.trim());
        if (!imagePayload) {
          res.status(400).json({ error: "Format d'image encodée invalide (PNG, JPG ou WEBP attendu)." });
          return;
        }
      } else if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
        imagePayload = await fetchRemoteImageAsBase64(body.imageUrl.trim());
      } else {
        res.status(400).json({ error: 'Veuillez fournir une image (fichier ou URL) à analyser.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Le service d'analyse Gemini n'est pas configuré côté serveur (GEMINI_API_KEY manquante dans Settings > Secrets).",
        });
        return;
      }

      const systemInstruction = `Tu es un expert en criminalistique numérique (digital forensics) et en lutte contre la cybercriminalité e-commerce en Afrique de l'Ouest (Bénin).
Ta mission est d'analyser l'image fournie pour détecter :
1. Les images générées par intelligence artificielle (Midjourney, DALL-E, Stable Diffusion, Flux, etc.) ;
2. Les manipulations / retouches frauduleuses (fausses preuves de paiement Mobile Money, montage produit trompeur).

Sois rigoureux, objectif et nuancé :
- Une belle photo commerciale réelle ou studio authentique (sans artefacts IA) doit recevoir verdict="AUTHENTIC" avec aiProbability faible (0-25).
- Une image présentant des anomalies mineures, une forte retouche suspecte ou une compression douteuse reçoit verdict="SUSPICIOUS" (aiProbability 35-69).
- Une image présentant des marqueurs clairs de génération IA (texte déformé, doigts/mains anormaux, textures cireuses synthétiques, motifs géométriques incohérents, physique impossible) ou une falsification manifeste reçoit verdict="AI_GENERATED" (aiProbability 70-100).
- Réponds uniquement en français clair et professionnel, avec des recommandations concrètes adaptées aux commerçants et clients au Bénin.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imagePayload.mimeType,
                data: imagePayload.data,
              },
            },
            {
              text: buildContextPrompt(context, body.productName),
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'Uniquement "AUTHENTIC", "SUSPICIOUS" ou "AI_GENERATED".',
              },
              aiProbability: {
                type: Type.INTEGER,
                description: 'Score de 0 à 100 indiquant la probabilité que l image soit générée par IA ou falsifiée.',
              },
              scamRiskLevel: {
                type: Type.STRING,
                description: 'Uniquement "LOW", "MEDIUM" ou "HIGH".',
              },
              confidence: {
                type: Type.STRING,
                description: 'Niveau de confiance de l analyse : "HIGH", "MEDIUM" ou "LOW".',
              },
              detectedType: {
                type: Type.STRING,
                description: 'Description courte du type d image observé (ex: Photo produit réelle, Visuel IA synthétique, Capture Mobile Money).',
              },
              summary: {
                type: Type.STRING,
                description: 'Synthèse claire en 1 à 2 phrases expliquant pourquoi l image semble authentique, suspecte ou générée par IA.',
              },
              indicators: {
                type: Type.ARRAY,
                description: 'Liste de 3 à 5 critères visuels observés.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    severity: {
                      type: Type.STRING,
                      description: 'Uniquement "ok", "warning" ou "danger".',
                    },
                    detail: { type: Type.STRING },
                  },
                },
              },
              recommendations: {
                type: Type.ARRAY,
                description: '2 à 3 conseils pratiques anti-arnaque pour le commerçant.',
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.status(502).json({ error: "Réponse vide reçue du moteur d'analyse IA." });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        verdict?: string;
        aiProbability?: number;
        scamRiskLevel?: string;
        confidence?: string;
        detectedType?: string;
        summary?: string;
        indicators?: Array<{ label?: string; severity?: string; detail?: string }>;
        recommendations?: string[];
      };

      const verdict =
        parsed.verdict === 'AI_GENERATED' || parsed.verdict === 'SUSPICIOUS' || parsed.verdict === 'AUTHENTIC'
          ? parsed.verdict
          : 'SUSPICIOUS';

      const aiProbability = Math.min(100, Math.max(0, Math.round(Number(parsed.aiProbability) || 0)));
      const scamRiskLevel =
        parsed.scamRiskLevel === 'HIGH' || parsed.scamRiskLevel === 'MEDIUM' || parsed.scamRiskLevel === 'LOW'
          ? parsed.scamRiskLevel
          : aiProbability >= 70
          ? 'HIGH'
          : aiProbability >= 35
          ? 'MEDIUM'
          : 'LOW';

      const confidence =
        parsed.confidence === 'HIGH' || parsed.confidence === 'MEDIUM' || parsed.confidence === 'LOW'
          ? parsed.confidence
          : 'MEDIUM';

      const indicators = Array.isArray(parsed.indicators)
        ? parsed.indicators.slice(0, 6).map(item => ({
            label: String(item.label || 'Critère visuel'),
            severity:
              item.severity === 'danger' || item.severity === 'warning' || item.severity === 'ok'
                ? item.severity
                : 'warning',
            detail: String(item.detail || ''),
          }))
        : [];

      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.slice(0, 4).map(r => String(r))
        : [];

      res.json({
        verdict,
        aiProbability,
        scamRiskLevel,
        confidence,
        detectedType: String(parsed.detectedType || 'Analyse visuelle'),
        summary: String(parsed.summary || 'Analyse visuelle terminée.'),
        indicators,
        recommendations,
        context,
        analyzedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inattendue lors de l'analyse de l'image.";
      const lower = message.toLowerCase();

      if (lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('403') || lower.includes('400')) {
        res.status(403).json({
          error: "Clé API Gemini invalide ou non autorisée. Vérifiez votre configuration dans Settings > Secrets.",
        });
        return;
      }
      if (lower.includes('resource_exhausted') || lower.includes('429')) {
        res.status(429).json({
          error: 'Quota de requêtes Gemini temporairement atteint. Réessayez dans quelques instants.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/ocr-invoice', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as {
        imageDataUrl?: string;
        catalogProducts?: Array<{ id: string; name: string; sku: string; unit: string }>;
      };

      if (typeof body.imageDataUrl !== 'string' || !body.imageDataUrl.trim()) {
        res.status(400).json({ error: 'Veuillez capturer ou importer une image de facture à lire.' });
        return;
      }

      const imagePayload = parseDataUrl(body.imageDataUrl.trim());
      if (!imagePayload) {
        res.status(400).json({ error: "Format d'image invalide (JPG, PNG ou WEBP attendu)." });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            "Le service OCR Gemini n'est pas configuré côté serveur (GEMINI_API_KEY manquante dans Settings > Secrets).",
        });
        return;
      }

      const catalogList = Array.isArray(body.catalogProducts) ? body.catalogProducts.slice(0, 60) : [];
      const validIds = new Set(catalogList.map(p => p.id));
      const catalogContext =
        catalogList.length > 0
          ? `Catalogue actuel de la boutique :\n${catalogList
              .map(p => `- id="${p.id}" | nom="${p.name}" | sku="${p.sku}" | unité="${p.unit}"`)
              .join('\n')}`
          : 'Aucun produit existant fourni.';

      const systemInstruction = `Tu es un assistant comptable et logistique expert en lecture OCR de factures fournisseurs, bons de livraison et reçus commerciaux en Afrique de l'Ouest (Bénin, prix souvent en FCFA / XOF).
Extrais avec précision toutes les lignes d'articles entrants visibles sur la facture (imprimée ou manuscrite).
- Associe chaque ligne au meilleur "matchedProductId" du catalogue fourni uniquement si la correspondance est claire et pertinente, sinon laisse matchedProductId="".
- Convertis les montants en nombres entiers (sans séparateurs de milliers ni texte "FCFA").
- Si une quantité ou un prix unitaire n'est pas lisible, indique 1 pour la quantité et 0 pour le prix unitaire.
- Réponds uniquement en JSON valide respectant le schéma demandé.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imagePayload.mimeType,
                data: imagePayload.data,
              },
            },
            {
              text: `Lis cette facture ou bon de livraison fournisseur par OCR et remplis automatiquement les détails des nouveaux stocks entrants.\n\n${catalogContext}`,
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: {
                type: Type.STRING,
                description: 'Nom du fournisseur ou grossiste lu sur la facture.',
              },
              invoiceNumber: {
                type: Type.STRING,
                description: 'Numéro de facture ou bon de livraison si présent.',
              },
              invoiceDate: {
                type: Type.STRING,
                description: 'Date de facture (ex: YYYY-MM-DD) ou chaîne vide si absente.',
              },
              totalAmount: {
                type: Type.NUMBER,
                description: 'Montant total lu sur la facture en FCFA (0 si absent).',
              },
              rawConfidence: {
                type: Type.STRING,
                description: 'Qualité globale de lecture OCR : "HIGH", "MEDIUM" ou "LOW".',
              },
              notes: {
                type: Type.STRING,
                description: 'Court résumé en français de la lecture effectuée.',
              },
              items: {
                type: Type.ARRAY,
                description: 'Articles entrants détectés sur la facture.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    detectedName: {
                      type: Type.STRING,
                      description: "Désignation de l'article lue sur la facture.",
                    },
                    matchedProductId: {
                      type: Type.STRING,
                      description: 'ID du produit correspondant dans le catalogue ou chaîne vide "".',
                    },
                    quantity: {
                      type: Type.INTEGER,
                      description: 'Quantité entrante détectée (entier >= 1).',
                    },
                    unit: {
                      type: Type.STRING,
                      description: 'Unité (pièce, sac, pot, bouteille, lot, yard, kg).',
                    },
                    unitBuyPrice: {
                      type: Type.NUMBER,
                      description: "Prix d'achat unitaire en FCFA si lisible, sinon 0.",
                    },
                    confidence: {
                      type: Type.STRING,
                      description: 'Confiance sur cette ligne : "HIGH", "MEDIUM" ou "LOW".',
                    },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Réponse vide reçue du moteur OCR.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        supplierName?: string;
        invoiceNumber?: string;
        invoiceDate?: string;
        totalAmount?: number;
        rawConfidence?: string;
        notes?: string;
        items?: Array<{
          detectedName?: string;
          matchedProductId?: string;
          quantity?: number;
          unit?: string;
          unitBuyPrice?: number;
          confidence?: string;
        }>;
      };

      const items = Array.isArray(parsed.items)
        ? parsed.items
            .filter(item => item && String(item.detectedName || '').trim().length > 0)
            .map(item => {
              const matchedId = String(item.matchedProductId || '').trim();
              return {
                detectedName: String(item.detectedName || '').trim(),
                matchedProductId: validIds.has(matchedId) ? matchedId : '',
                quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
                unit: String(item.unit || 'pièce').trim() || 'pièce',
                unitBuyPrice: Math.max(0, Math.round(Number(item.unitBuyPrice) || 0)),
                confidence:
                  item.confidence === 'HIGH' || item.confidence === 'MEDIUM' || item.confidence === 'LOW'
                    ? item.confidence
                    : 'MEDIUM',
              };
            })
        : [];

      res.json({
        supplierName: String(parsed.supplierName || 'Fournisseur'),
        invoiceNumber: String(parsed.invoiceNumber || ''),
        invoiceDate: String(parsed.invoiceDate || ''),
        totalAmount: Math.max(0, Math.round(Number(parsed.totalAmount) || 0)),
        rawConfidence:
          parsed.rawConfidence === 'HIGH' || parsed.rawConfidence === 'MEDIUM' || parsed.rawConfidence === 'LOW'
            ? parsed.rawConfidence
            : 'MEDIUM',
        notes: String(parsed.notes || `${items.length} ligne(s) extraite(s) depuis la facture.`),
        items,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inattendue lors de l'analyse OCR de la facture.";
      const lower = message.toLowerCase();

      if (lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('403') || lower.includes('400')) {
        res.status(403).json({
          error: 'Clé API Gemini invalide ou non autorisée. Vérifiez Settings > Secrets.',
        });
        return;
      }
      if (lower.includes('resource_exhausted') || lower.includes('429')) {
        res.status(429).json({
          error: 'Quota de requêtes Gemini atteint. Veuillez réessayer dans quelques instants.',
        });
        return;
      }

      res.status(500).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BOUTIKPRO server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
