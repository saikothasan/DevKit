import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { users, payments } from '@/db/schema';
import { requireAuth } from './auth';

export const vipRouter = new Hono<{ 
  Bindings: { DB: D1Database; APIRONE_ACCOUNT: string; BASE_URL: string; };
  Variables: { user: { id: number; username: string; role: string; exp: number; }; };
}>();

const VIP_FIAT_PRICE = 49.99;
const CURRENCY_CONFIG: Record<string, number> = {
  'btc': 100000000, 'ltc': 100000000, 'doge': 100000000, 'trx': 1000000, 
  'usdt@trx': 1000000, 'usdc@trx': 1000000, 'eth': 1000000000000000000, 'usdt@eth': 1000000,
};

vipRouter.post('/invoice', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const userPayload = c.get('user');
  const { currency } = await c.req.json();

  if (!CURRENCY_CONFIG[currency]) return c.json({ error: 'Unsupported blockchain protocol.' }, 400);

  const user = await db.select({ id: users.id, isVip: users.isVip }).from(users).where(eq(users.id, userPayload.id)).get();
  if (!user) return c.json({ error: 'Identity node missing.' }, 404);
  if (user.isVip) return c.json({ error: 'Node already holds VIP clearance.' }, 400);

  try {
    const tickerRes = await fetch(`https://apirone.com/api/v2/ticker?currency=${currency}&fiat=usd`);
    if (!tickerRes.ok) throw new Error('Oracle fetch failed');
    const tickerData = await tickerRes.json() as any;
    
    let cryptoValue = VIP_FIAT_PRICE; 
    if (tickerData?.[currency]?.usd) cryptoValue = VIP_FIAT_PRICE / tickerData[currency].usd;
    else if (tickerData?.usd) cryptoValue = VIP_FIAT_PRICE / tickerData.usd;

    const minorUnits = Math.floor(cryptoValue * CURRENCY_CONFIG[currency]);
    const secretToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const callbackUrl = `${c.env.BASE_URL}/api/vip/webhook?secret=${secretToken}`;

    const apironeRes = await fetch(`https://apirone.com/api/v2/accounts/${c.env.APIRONE_ACCOUNT}/invoices`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: minorUnits, currency: currency, lifetime: 3600,
        "callback-url": callbackUrl,
        "user-data": { title: "Lifetime VIP Access", merchant: "DevKit Elite Network", price: `$${VIP_FIAT_PRICE}` },
        linkback: `${c.env.BASE_URL}/vip`
      })
    });

    const invoiceData = await apironeRes.json() as any;
    if (!invoiceData.invoice || !invoiceData['invoice-url']) return c.json({ error: 'Invoice initialization failed at external provider.' }, 500);

    await db.insert(payments).values({
      userId: user.id, invoiceId: invoiceData.invoice, fiatAmount: VIP_FIAT_PRICE,
      cryptoAmount: minorUnits, currency: currency, secretToken: secretToken, status: 'created'
    });

    return c.json({ success: true, invoiceUrl: invoiceData['invoice-url'] });
  } catch (err) {
    return c.json({ error: 'Systemic failure during payload construction.' }, 500);
  }
});

vipRouter.post('/webhook', async (c) => {
  const db = drizzle(c.env.DB);
  const secret = c.req.query('secret');
  
  try {
    const body = await c.req.json();
    const { invoice, status } = body;

    if (!invoice || !status) return c.text('Malformed payload parameters', 400);

    const tx = await db.select().from(payments).where(eq(payments.invoiceId, invoice)).get();
    if (!tx || tx.secretToken !== secret) return c.text('Cryptographic signature validation failed', 403);

    // Execution: Atomic transaction to prevent ledger mismatch
    if (status === 'paid' || status === 'completed') {
      await db.batch([
        db.update(payments).set({ status, updatedAt: sql`(strftime('%s', 'now'))` }).where(eq(payments.id, tx.id)),
        db.update(users).set({ isVip: true, vipSince: sql`(strftime('%s', 'now'))` }).where(eq(users.id, tx.userId))
      ]);
    } else {
      await db.update(payments).set({ status, updatedAt: sql`(strftime('%s', 'now'))` }).where(eq(payments.id, tx.id));
    }

    return c.text('*ok*', 200);
  } catch (err) {
    return c.text('Internal execution fault', 500);
  }
});
