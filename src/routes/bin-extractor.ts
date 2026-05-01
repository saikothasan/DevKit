import { Hono } from 'hono';

// 1. THE FIX: Exporting as a named constant to match your index.ts import
export const binExtractor = new Hono();

binExtractor.post('/extract', async (c) => {
  try {
    // 2. SAFETY: Safely parse JSON to prevent 500 crashes on malformed payloads
    const body = await c.req.json().catch(() => null);

    if (!body || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return c.json({ success: false, error: 'Valid text payload is required.' }, 400);
    }

    const { text } = body;

    // 3. OPTIMIZATION: Single-pass execution. 
    // \b      : Word boundary
    // [3-6]   : Must start with 3 (Amex), 4 (Visa), 5 (Mastercard), or 6 (Discover)
    // \d{5,7} : Followed by 5 to 7 digits (making the total length 6 to 8)
    // \b      : Word boundary
    const binRegex = /\b[3-6]\d{5,7}\b/g;
    const rawMatches = text.match(binRegex) || [];

    // 4. DEDUPLICATION: Native Set is the fastest way to drop duplicates
    const uniqueBins = [...new Set(rawMatches)];

    return c.json({
      success: true,
      totalFound: uniqueBins.length,
      bins: uniqueBins,
      timestamp: Date.now(),
    });
  } catch (error) {
    // 5. OBSERVABILITY: Log errors contextually (assuming reqId might be passed from global middleware)
    console.error('BIN Extraction Fault:', error);
    return c.json({ success: false, error: 'Failed to process extraction payload.' }, 500);
  }
});
