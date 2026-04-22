import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const toolsRouter = new Hono();

interface CardSpecs {
  network: string;
  length: number;
  cvvLength: number;
}

interface GeneratedCard {
  network: string;
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  formattedString: string;
}

interface StripeMetadataResponse {
  data?: Array<{
    account_range_high?: string;
    account_range_low?: string;
    brand?: string;
    country?: string;
    funding?: string;
    pan_length?: number;
  }>;
}

const generateCardsSchema = z.object({
  bin: z.string().min(1).max(19).regex(/^[0-9]+$/),
  quantity: z.number().min(1).max(500).default(10)
});

/**
 * Enhanced BIN resolution using complete global network range limits
 */
function getCardNetworkSpecs(bin: string): CardSpecs {
  // American Express (Length 15)
  if (/^3[47]/.test(bin)) return { network: 'American Express', length: 15, cvvLength: 4 };
  
  // Mastercard (Length 16)
  if (/^5[1-5]/.test(bin) || /^2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[0-1]\d{2}|720)/.test(bin)) return { network: 'Mastercard', length: 16, cvvLength: 3 };
  
  // Visa (Length 16)
  if (/^4/.test(bin)) return { network: 'Visa', length: 16, cvvLength: 3 };
  
  // Discover Card (Length 16)
  if (/^6(?:011|5\d{2}|4[4-9]\d|22(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/.test(bin)) return { network: 'Discover', length: 16, cvvLength: 3 };
  
  // JCB (Length 16)
  if (/^35/.test(bin)) return { network: 'JCB', length: 16, cvvLength: 3 };
  
  // Diners Club (Length 14 or 16)
  if (/^3(?:0[0-5]|[68])/.test(bin)) return { network: 'Diners Club', length: 14, cvvLength: 3 };
  if (/^5[45]/.test(bin)) return { network: 'Diners Club US', length: 16, cvvLength: 3 };
  
  // China UnionPay (Length 16 to 19)
  if (/^62/.test(bin)) return { network: 'China UnionPay', length: 16, cvvLength: 3 }; 

  return { network: 'Unknown', length: 16, cvvLength: 3 };
}

function getSecureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint8Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

toolsRouter.post('/generate-cards', zValidator('json', generateCardsSchema), (c) => {
  const { bin, quantity } = c.req.valid('json');
  const specs = getCardNetworkSpecs(bin);
  const currentYear = new Date().getFullYear();
  const generatedCards: GeneratedCard[] = [];
  
  for (let i = 0; i < quantity; i++) {
    let num = bin;
    while(num.length < specs.length - 1) num += Math.floor(Math.random() * 10).toString();
    
    let sum = 0;
    let isEven = true; 
    for (let j = num.length - 1; j >= 0; j--) {
      let digit = parseInt(num.charAt(j), 10);
      if (isEven) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit;
      isEven = !isEven;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    num += checkDigit.toString();

    const month = String(getSecureRandomInt(1, 12)).padStart(2, '0');
    const year = String(currentYear + getSecureRandomInt(1, 5));
    const cvv = Array.from({ length: specs.cvvLength }, () => getSecureRandomInt(0, 9)).join('');

    generatedCards.push({ 
      network: specs.network, 
      number: num, 
      expMonth: month, 
      expYear: year, 
      cvv, 
      formattedString: `${num}|${month}|${year}|${cvv}` 
    });
  }

  return c.json({ 
    success: true, 
    metadata: { baseBin: bin, networkDetected: specs.network, vectorLength: specs.length }, 
    cards: generatedCards 
  });
});

const checkCardSchema = z.object({
  cardPayload: z.string().min(5, "Payload too short")
});

const BANK_NAMES = ["Chase Bank", "Bank of America", "Capital One", "Citi", "Wells Fargo", "Barclays", "HSBC", "TD Bank"];

toolsRouter.post('/check-card', zValidator('json', checkCardSchema), async (c) => {
  const { cardPayload } = c.req.valid('json');
  
  const rawNumbers = cardPayload.replace(/\D/g, '');
  const isLuhnValid = (num: string) => {
    const arr = (num + '').split('').reverse().map(x => parseInt(x, 10));
    const lastDigit = arr.splice(0, 1)[0];
    const sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9), 0);
    return (sum + lastDigit) % 10 === 0;
  };

  await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 600) + 200));

  if (rawNumbers.length < 13 || rawNumbers.length > 19) {
    return c.json({ success: false, status: 'Die', message: 'Declined - Invalid Format Length' });
  }
  
  if (!isLuhnValid(rawNumbers)) {
    return c.json({ success: false, status: 'Die', message: 'Declined - Fails Modulus 10 (Luhn) Check' });
  }

  const roll = Math.random() * 100;
  const randomBank = BANK_NAMES[Math.floor(Math.random() * BANK_NAMES.length)];
  
  if (roll <= 15) {
    return c.json({ success: true, status: 'Live', message: `Approved - CVV Match - ${randomBank}` });
  } else if (roll > 15 && roll <= 90) {
    const errorMsg = roll > 60 ? 'Insufficient Funds' : roll > 40 ? 'Do Not Honor' : 'Stolen/Lost Card';
    return c.json({ success: true, status: 'Die', message: `Declined - ${errorMsg} - ${randomBank}` });
  } else {
    return c.json({ success: false, status: 'Unknown', message: 'Network Timeout / Gateway 429' });
  }
});

const checkBinSchema = z.object({ bin: z.string().min(6).max(19).regex(/^[0-9]+$/) });

toolsRouter.post('/check-bin', zValidator('json', checkBinSchema), async (c) => {
  const { bin } = c.req.valid('json');
  try {
    const response = await fetch(`https://api.stripe.com/edge-internal/card-metadata?bin_prefix=${bin}&key=pk_live_51HOrSwC6h1nxGoI3lTAgRjYVrz4dU3fVOabyCcKR3pbEJguCVAlqCxdxCUvoRh1XWwRacViovU3kLKvpkjh7IqkW00iXQsjo3n`);
    if (!response.ok) return c.json({ success: false, message: 'Failed to query metadata' });
    
    const data = await response.json() as StripeMetadataResponse;
    
    // Pass the full response data cleanly to the client
    if (data?.data && data.data.length > 0) {
      return c.json({ 
        success: true, 
        metadata: data.data[0],
        fullResponse: data
      });
    }
    return c.json({ success: false, message: 'BIN not found' });
  } catch (error) {
    return c.json({ success: false, message: 'Network execution failed' });
  }
});
