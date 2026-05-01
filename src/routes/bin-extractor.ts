import { Hono } from 'hono';

const binExtractor = new Hono();

binExtractor.post('/extract', async (c) => {
  try {
    const body = await c.req.json<{ text: string }>();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return c.json({ success: false, error: 'Valid text input is required.' }, 400);
    }

    // High-level extraction logic: matches 6 to 8 digit consecutive numbers commonly used as BINs
    const binRegex = /\b\d{6,8}\b/g;
    const rawMatches = text.match(binRegex) || [];

    // Deduplicate and filter (Valid BINs typically start with 3, 4, 5, or 6)
    const uniqueBins = [...new Set(rawMatches)];
    const validBins = uniqueBins.filter(bin => /^[3456]/.test(bin));

    return c.json({
      success: true,
      totalFound: validBins.length,
      bins: validBins,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('BIN Extraction Error:', error);
    return c.json({ success: false, error: 'Failed to process text payload.' }, 500);
  }
});

export default binExtractor;
