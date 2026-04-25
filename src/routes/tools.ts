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

function getCardNetworkSpecs(bin: string): CardSpecs {
  if (/^3[47]/.test(bin)) return { network: 'American Express', length: 15, cvvLength: 4 };
  if (/^5[1-5]/.test(bin) || /^2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[0-1]\d{2}|720)/.test(bin)) return { network: 'Mastercard', length: 16, cvvLength: 3 };
  if (/^4/.test(bin)) return { network: 'Visa', length: 16, cvvLength: 3 };
  if (/^6(?:011|5\d{2}|4[4-9]\d|22(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/.test(bin)) return { network: 'Discover', length: 16, cvvLength: 3 };
  if (/^35/.test(bin)) return { network: 'JCB', length: 16, cvvLength: 3 };
  if (/^3(?:0[0-5]|[68])/.test(bin)) return { network: 'Diners Club', length: 14, cvvLength: 3 };
  if (/^5[45]/.test(bin)) return { network: 'Diners Club US', length: 16, cvvLength: 3 };
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
  cardPayload: z.string().min(10, "Payload too short")
});

toolsRouter.post('/check-card', zValidator('json', checkCardSchema), async (c) => {
  const { cardPayload } = c.req.valid('json');
  
  const rawNumbers = cardPayload.replace(/[^0-9|]/g, '');
  const parts = rawNumbers.split('|');
  const bin = parts[0]?.substring(0, 6) || '';

  let binInfoString = 'Unknown Network';

  if (bin.length >= 6) {
    try {
      const binResponse = await fetch(`https://api.stripe.com/edge-internal/card-metadata?bin_prefix=${bin}&key=pk_live_51HOrSwC6h1nxGoI3lTAgRjYVrz4dU3fVOabyCcKR3pbEJguCVAlqCxdxCUvoRh1XWwRacViovU3kLKvpkjh7IqkW00iXQsjo3n`);
      if (binResponse.ok) {
        const binData = await binResponse.json() as StripeMetadataResponse;
        if (binData?.data && binData.data.length > 0) {
          const meta = binData.data[0];
          binInfoString = `${meta.brand || ''} - ${meta.funding || ''} - ${meta.country || ''}`;
        }
      }
    } catch (e) {
      // Silently fail BIN lookup if network issues occur
    }
  }

  try {
    const params = new URLSearchParams();
    params.append('data', cardPayload);

    const checkResponse = await fetch("https://mock.payate.com/api.php", {
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://mock.payate.com/"
      },
      body: params.toString(),
      method: "POST"
    });

    const gatewayData = await checkResponse.json() as { error: number; msg: string };
    const cleanMsg = gatewayData.msg ? gatewayData.msg.replace(/<[^>]*>?/gm, '').trim() : 'No response data';

    let statusString = 'Unknown';
    if (gatewayData.error === 1) statusString = 'Live';
    else if (gatewayData.error === 2) statusString = 'Die';

    return c.json({ 
      success: true, 
      status: statusString,
      rawMsg: gatewayData.msg,
      cleanMsg: cleanMsg,
      binInfo: binInfoString,
      formattedOutput: `${cardPayload} BIN Info: <${binInfoString}>`
    });

  } catch (error) {
    return c.json({ 
      success: false, 
      status: 'Error', 
      message: 'Gateway execution failed',
      formattedOutput: `${cardPayload} BIN Info: <${binInfoString}> - Connection Error`
    });
  }
});

const checkBinSchema = z.object({ bin: z.string().min(6).max(19).regex(/^[0-9]+$/) });

toolsRouter.post('/check-bin', zValidator('json', checkBinSchema), async (c) => {
  const { bin } = c.req.valid('json');
  try {
    const response = await fetch(`https://api.stripe.com/edge-internal/card-metadata?bin_prefix=${bin}&key=pk_live_51HOrSwC6h1nxGoI3lTAgRjYVrz4dU3fVOabyCcKR3pbEJguCVAlqCxdxCUvoRh1XWwRacViovU3kLKvpkjh7IqkW00iXQsjo3n`);
    if (!response.ok) return c.json({ success: false, message: 'Failed to query metadata' });
    
    const data = await response.json() as StripeMetadataResponse;
    
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

const checkIpSchema = z.object({ ip: z.string().optional() });

toolsRouter.post('/check-ip', zValidator('json', checkIpSchema), async (c) => {
  let { ip } = c.req.valid('json');
  
  if (!ip || ip.trim() === '') {
    const rawIp = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || '1.1.1.1';
    ip = rawIp.split(',')[0].trim();
  }

  try {
    let ipInfo: any = null;
    let fallbackUsed = false;

    // Primary Execution: ip-api.com
    try {
      const ipApiRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,hosting`);
      if (ipApiRes.ok) {
        const data = await ipApiRes.json() as any;
        if (data.status === 'success') {
          ipInfo = data;
        }
      }
    } catch (e) {
      // Primary provider failed, failover to secondary
    }

    // Secondary Execution: ipwho.is (Robust Fallback)
    if (!ipInfo) {
      try {
        const ipWhoRes = await fetch(`https://ipwho.is/${ip}`);
        if (ipWhoRes.ok) {
          const data = await ipWhoRes.json() as any;
          if (data.success) {
            ipInfo = {
              continent: data.continent,
              country: data.country,
              countryCode: data.country_code,
              regionName: data.region,
              city: data.city,
              zip: data.postal || '',
              lat: data.latitude,
              lon: data.longitude,
              timezone: data.timezone?.id || 'UTC',
              isp: data.connection?.isp || 'Unknown',
              org: data.connection?.org || 'Unknown',
              as: data.connection?.asn ? `AS${data.connection.asn}` : 'Unknown',
              reverse: data.connection?.domain || '',
              mobile: false, 
              proxy: false,
              hosting: false
            };
            fallbackUsed = true;
          }
        }
      } catch (e) {
        // Total provider failure
      }
    }

    if (!ipInfo) {
      return c.json({ success: false, message: 'All upstream Geo-IP providers rejected the connection or rate-limited the node.' }, 502);
    }

    // Proxy/VPN & Threat Risk analysis over HTTPS
    let proxyData: any = {};
    try {
      const proxyCheckRes = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1&risk=1`);
      if (proxyCheckRes.ok) {
        const proxyCheck = await proxyCheckRes.json() as any;
        proxyData = proxyCheck[ip] || {};
      }
    } catch {
      // Graceful degradation for proxy check
    }

    const data = {
       ip,
       location: {
         continent: ipInfo.continent || 'Unknown', 
         country: ipInfo.country || 'Unknown', 
         countryCode: ipInfo.countryCode || 'XX',
         region: ipInfo.regionName || 'Unknown', 
         city: ipInfo.city || 'Unknown', 
         zip: ipInfo.zip || '',
         lat: ipInfo.lat || 0, 
         lon: ipInfo.lon || 0, 
         timezone: ipInfo.timezone || 'UTC',
       },
       network: {
         isp: ipInfo.isp || 'Unknown', 
         org: ipInfo.org || 'Unknown', 
         asn: ipInfo.as || 'Unknown', 
         reverse: ipInfo.reverse || ''
       },
       security: {
         isProxy: ipInfo.proxy === true || proxyData.proxy === 'yes' || false,
         isVpn: proxyData.vpn === 'yes' || false,
         isHosting: ipInfo.hosting === true || false,
         isMobile: ipInfo.mobile === true || false,
         riskScore: parseInt(proxyData.risk) || 0,
         type: proxyData.type || (fallbackUsed ? 'Unknown' : 'Residential')
       }
    };

    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, message: 'Execution timeout during IP analysis.' }, 500);
  }
});
