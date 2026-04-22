import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { users, payments } from '@/db/schema';
import { requireAuth } from './auth';

export const vipRouter = new Hono<{ 
  Bindings: { 
    DB: D1Database; 
    APIRONE_ACCOUNT: string; 
    WEBHOOK_SECRET_KEY: string;
    BASE_URL: string; 
  } 
}>();

const VIP_FIAT_PRICE = 49.99;

// Currencies mapping to Apirone API format and their minor unit factors
const CURRENCY_CONFIG: Record<string, number> = {
  'btc': 100000000,      // Satoshi
  'ltc': 100000000,      // Satoshi
  'trx': 1000000,        // Sun
  'usdt@trx': 1000000,   // Micro-USDT
};

vipRouter.post('/invoice', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const userPayload = c.get('user');
  const { currency } = await c.req.json();

  if (!CURRENCY_CONFIG[currency]) {
    return c.json({ error: 'Unsupported network protocol' }, 400);
  }

  const user = await db.select().from(users).where(eq(users.id, userPayload.id)).get();
  if (!user) return c.json({ error: 'Identity node missing' }, 404);
  if (user.isVip) return c.json({ error: 'Node already holds VIP clearance' }, 400);

  try {
    // 1. Fetch exact exchange rate from Apirone Ticker
    const tickerRes = await fetch(`https://apirone.com/api/v2/ticker?currency=${currency}&fiat=usd`);
    const tickerData = await tickerRes.json() as any;
    
    // Fallback calculation if rate fetch fails (assuming $1 = 1 USDT for stablecoins)
    let cryptoValue = VIP_FIAT_PRICE; 
    if (tickerData[currency] && tickerData[currency].usd) {
       cryptoValue = VIP_FIAT_PRICE / tickerData[currency].usd;
    }

    // Convert to minor units
    const minorUnits = Math.round(cryptoValue * CURRENCY_CONFIG[currency]);
    const secretToken = crypto.randomUUID();
    const callbackUrl = `${c.env.BASE_URL}/api/vip/webhook?secret=${secretToken}`;

    // 2. Generate Apirone Invoice
    const invoicePayload = {
      amount: minorUnits,
      currency: currency,
      lifetime: 3600,
      "callback-url": callbackUrl,
      "user-data": {
        title: "Lifetime VIP Access",
        merchant: "Visatk Developer Hub",
        price: `$${VIP_FIAT_PRICE}`
      },
      linkback: `${c.env.BASE_URL}/vip?status=pending`
    };

    const apironeRes = await fetch(`https://apirone.com/api/v2/accounts/${c.env.APIRONE_ACCOUNT}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload)
    });

    const invoiceData = await apironeRes.json() as any;

    if (!invoiceData.invoice) {
       throw new Error('Invoice generation failed at the external provider');
    }

    // 3. Register pending transaction in ledger
    await db.insert(payments).values({
      userId: user.id,
      invoiceId: invoiceData.invoice,
      fiatAmount: VIP_FIAT_PRICE,
      cryptoAmount: minorUnits,
      currency: currency,
      secretToken: secretToken,
      status: 'created'
    });

    return c.json({ success: true, invoiceUrl: invoiceData['invoice-url'] });
  } catch (err) {
    return c.json({ error: 'Transaction pipeline disrupted' }, 500);
  }
});

// Security: Public Webhook listening for Apirone asynchronous callbacks
vipRouter.post('/webhook', async (c) => {
  const db = drizzle(c.env.DB);
  const secret = c.req.query('secret');
  
  try {
    const body = await c.req.json();
    const { invoice, status } = body;

    if (!invoice || !status || !secret) {
      return c.json({ error: 'Malformed payload' }, 400);
    }

    const tx = await db.select().from(payments).where(eq(payments.invoiceId, invoice)).get();
    
    // Security verification using the injected secret token
    if (!tx || tx.secretToken !== secret) {
      return c.json({ error: 'Cryptographic validation failed' }, 403);
    }

    // Update transaction status
    await db.update(payments)
      .set({ status: status, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(payments.id, tx.id));

    // Apirone sends 'paid' when exact amount matches, or 'completed' when block is confirmed
    if (status === 'paid' || status === 'completed') {
      await db.update(users)
        .set({ isVip: true, vipSince: sql`(strftime('%s', 'now'))` })
        .where(eq(users.id, tx.userId));
    }

    // Return strictly *ok* in plain text to stop Apirone from retrying
    return c.text('*ok*', 200);
  } catch (err) {
    return c.json({ error: 'Webhook processing fault' }, 500);
  }
});
