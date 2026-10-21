import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { Request, Response } from 'express';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  verifyToken: string;
  appSecret: string;
  graphApiVersion: string;
}

export interface InboundWhatsAppText {
  messageId: string;
  waId: string;
  text: string;
  profileName?: string;
  timestamp?: string;
}

type RawRequest = Request & { rawBody?: Buffer };

export function verifyMetaSignature(
  rawBody: Buffer,
  signature: string | undefined,
  appSecret: string,
): boolean {
  if (!signature || !appSecret) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  const suppliedHex = signature.startsWith('sha256=') ? signature.slice(7) : '';
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const supplied = Buffer.from(suppliedHex, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function sendWhatsAppText(
  config: WhatsAppConfig,
  to: string,
  body: string,
): Promise<string> {
  if (!config.accessToken || !config.phoneNumberId) {
    throw new Error('WhatsApp Cloud API no configurada');
  }
  if (!/^\d{8,15}$/.test(to)) throw new Error('Número de WhatsApp inválido');

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json().catch(() => ({})) as {
    error?: { message?: string };
    messages?: Array<{ id?: string }>;
  };
  if (!response.ok) {
    throw new Error(`WhatsApp API HTTP ${response.status}: ${result.error?.message || 'error desconocido'}`);
  }
  return result.messages?.[0]?.id || '';
}

function extractTextMessages(payload: any): InboundWhatsAppText[] {
  const out: InboundWhatsAppText[] = [];
  if (payload?.object !== 'whatsapp_business_account') return out;
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;
      const value = change.value || {};
      const profileName = value.contacts?.[0]?.profile?.name;
      for (const msg of value.messages || []) {
        if (!msg.id || !msg.from || msg.type !== 'text') continue;
        out.push({
          messageId: msg.id,
          waId: String(msg.from),
          text: String(msg.text?.body || '').trim(),
          profileName,
          timestamp: msg.timestamp,
        });
      }
    }
  }
  return out;
}

export function createWhatsAppWebhookRouter(
  config: WhatsAppConfig,
  onTextMessage: (message: InboundWhatsAppText) => Promise<void>,
) {
  const router = express.Router();
  // Best-effort deduplication for a single process. Durable storage is required
  // before horizontal scaling or production use across restarts.
  const processed = new Set<string>();

  router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === config.verifyToken && typeof challenge === 'string') {
      res.status(200).type('text/plain').send(challenge);
      return;
    }
    res.status(403).send('Verificación de webhook fallida');
  });

  router.post('/', async (req: RawRequest, res: Response) => {
    if (!verifyMetaSignature(req.rawBody || Buffer.alloc(0), req.header('x-hub-signature-256'), config.appSecret)) {
      res.status(403).json({ error: 'Firma de Meta inválida o WHATSAPP_APP_SECRET no configurado' });
      return;
    }

    const messages = extractTextMessages(req.body);
    // Acknowledge valid status-only events too; Meta also sends delivery/read statuses.
    res.status(200).json({ status: 'received', messages: messages.length });
    for (const message of messages) {
      if (processed.has(message.messageId)) continue;
      processed.add(message.messageId);
      try {
        await onTextMessage(message);
      } catch (error) {
        // Allow retry after a transient processing failure.
        processed.delete(message.messageId);
        console.error('[WhatsApp webhook] Error procesando mensaje', error);
      }
    }
  });

  return router;
}
