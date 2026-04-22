import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { users, payments } from '@/db/schema';
import { requireAuth } from './auth';

export const vipRouter = new Hono<{ 
  Bindings: { 
    DB: D1Database; 
    APIRONE_ACCOUNT: string; 
    BASE_URL: string; 
  } 
}>();

// Lifetime access fiat equivalent configuration
const VIP_FIAT_PRICE = 49.99;

// Apirone Minor Unit Configuration Matrix
const CURRENCY_CONFIG: Record<string, number> = {
  'btc': 100000000,      // Satoshi
  'ltc': 100000000,      // Satoshi
  'doge': 100000000,     // Satoshi
  'trx': 1000000,        // Sun
  'usdt@trx': 1000000,   // Micro-USDT (TRC20)
  'usdc@trx': 1000000,   // Micro-USDC (TRC20)
  'eth': 1000000000000000000, // Wei
  'usdt@eth': 1000000,   // Micro-USDT (ERC20)
};

// ==========================================
// Invoice Initialization Vector
// ==========================================

vipRouter.post('/invoice', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const userPayload = c.get('user');
  const { currency } = await c.req.json();

  if (!CURRENCY_CONFIG[currency]) {
    return c.json({ error: 'Unsupported blockchain protocol.' }, 400);
  }

  const user = await db.select({ id: users.id, isVip: users.isVip }).from(users).where(eq(users.id, userPayload.id)).get();
  if (!user) return c.json({ error: 'Identity node missing.' }, 404);
  if (user.isVip) return c.json({ error: 'Node already holds VIP clearance.' }, 400);

  try {
    // 1. Interrogate Apirone Ticker for real-time exchange rates
    const tickerRes = await fetch(`https://apirone.com/api/v2/ticker?currency=${currency}&fiat=usd`);
    const tickerData = await tickerRes.json() as any;
    
    let cryptoValue = VIP_FIAT_PRICE; 
    if (tickerData && tickerData[currency] && tickerData[currency].usd) {
       cryptoValue = VIP_FIAT_PRICE / tickerData[currency].usd;
    } else if (tickerData && tickerData.usd) {
       cryptoValue = VIP_FIAT_PRICE / tickerData.usd;
    }

    // Convert fiat equivalent into precise network minor units
    const minorUnits = Math.floor(cryptoValue * CURRENCY_CONFIG[currency]);
    
    // Generate cryptographic secret for webhook validation
    const secretToken = crypto.randomUUID().replace(/-/g, '');
    const callbackUrl = `${c.env.BASE_URL}/api/vip/webhook?secret=${secretToken}`;

    // 2. Transmit Invoice Payload to Apirone Processing Layer
    const invoicePayload = {
      amount: minorUnits,
      currency: currency,
      lifetime: 3600, // 1 Hour validity
      "callback-url": callbackUrl,
      "user-data": {
        title: "Lifetime VIP Access",
        merchant: "DevKit Elite Network",
        price: `$${VIP_FIAT_PRICE}`
      },
      linkback: `${c.env.BASE_URL}/vip`
    };

    const apironeRes = await fetch(`https://apirone.com/api/v2/accounts/${c.env.APIRONE_ACCOUNT}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload)
    });

    const invoiceData = await apironeRes.json() as any;

    if (!invoiceData.invoice || !invoiceData['invoice-url']) {
       return c.json({ error: 'Invoice initialization failed at external provider.' }, 500);
    }

    // 3. Register transaction vector to D1 Ledger
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
    return c.json({ error: 'Systemic failure during payload construction.' }, 500);
  }
});

// ==========================================
// Asynchronous Webhook Processor
// ==========================================

vipRouter.post('/webhook', async (c) => {
  const db = drizzle(c.env.DB);
  const secret = c.req.query('secret');
  
  try {
    const body = await c.req.json();
    const { invoice, status } = body;

    if (!invoice || !status) {
      return c.text('Malformed payload parameters', 400);
    }

    // Retrieve ledger record
    const tx = await db.select().from(payments).where(eq(payments.invoiceId, invoice)).get();
    
    if (!tx) {
      return c.text('Invoice identifier not located', 404);
    }

    // Cryptographic validation of the secret token
    if (tx.secretToken !== secret) {
      return c.text('Cryptographic signature validation failed', 403);
    }

    // Execute state transition on ledger
    await db.update(payments)
      .set({ status: status, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(payments.id, tx.id));

    // Apirone dispatches 'paid' or 'completed' upon successful fund acquisition
    if (status === 'paid' || status === 'completed') {
      const targetUser = await db.select({ isVip: users.isVip }).from(users).where(eq(users.id, tx.userId)).get();
      
      if (targetUser && !targetUser.isVip) {
        await db.update(users)
          .set({ isVip: true, vipSince: sql`(strftime('%s', 'now'))` })
          .where(eq(users.id, tx.userId));
      }
    }

    // Apirone mandates a strict '*ok*' plain text response to acknowledge receipt
    return c.text('*ok*', 200);
  } catch (err) {
    return c.text('Internal execution fault', 500);
  }
});
