import { useState, useMemo } from 'react';
import { SeoHead } from '../components/SeoHead';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { Copy, Check, Sparkles, Database, ShieldAlert, Code2, FileJson, FileText, CreditCard, Network, AlertCircle, Shield, Cpu, RefreshCw, HelpCircle } from 'lucide-react';

const PRESET_BINS = [
  { name: 'Stripe Visa', bin: '424242' },
  { name: 'Stripe MC', bin: '555555' },
  { name: 'Braintree Amex', bin: '378282' },
  { name: 'Discover Test', bin: '601100' },
  { name: 'JCB QA', bin: '352800' }
];

type CardData = {
  network?: string; number: string; expMonth: string; expYear: string; cvv: string; formattedString?: string;
};
type ExportFormat = 'pipe' | 'json' | 'csv';

const FAQ_DATA = [
  { question: "What is a test credit card generator?", answer: "A test credit card generator creates dummy card numbers that pass the cryptographic Luhn Check (Modulus 10). They are used strictly by developers to test payment gateways like Stripe, PayPal, or Braintree in a sandbox environment." },
  { question: "Can these generated cards make real purchases?", answer: "Absolutely not. These cards do not correspond to any real bank accounts and hold no financial validity. They will be instantly declined if used on a live production gateway." },
  { question: "What is the Luhn algorithm?", answer: "The Luhn algorithm (or Mod 10) is a checksum formula used to validate a variety of identification numbers, primarily credit card numbers. Our generator ensures every dummy vector perfectly satisfies this algorithm to bypass front-end validation." }
];

export default function TestCards() {
  const [bin, setBin] = useState('424242');
  const [quantity, setQuantity] = useState<number>(10);
  const [generatedCards, setGeneratedCards] = useState<CardData[]>([]);
  const [metadata, setMetadata] = useState<{ networkDetected: string, vectorLength: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [format, setFormat] = useState<ExportFormat>('pipe');
  
  const { copiedText, copy } = useCopyToClipboard();

  const detectedNetwork = useMemo(() => {
    if (/^3[47]/.test(bin)) return 'American Express';
    if (/^5[1-5]/.test(bin) || /^2(2[2-9][1-9]|2[3-9]\d{2}|[3-6]\d{3}|7[0-1]\d{2}|720)/.test(bin)) return 'Mastercard';
    if (/^4/.test(bin)) return 'Visa';
    if (/^6(?:011|5\d{2}|4[4-9]\d|22(?:12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/.test(bin)) return 'Discover';
    if (/^35/.test(bin)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(bin)) return 'Diners Club';
    if (/^62/.test(bin)) return 'China UnionPay';
    return bin.length > 0 ? 'Custom Network' : 'Awaiting BIN...';
  }, [bin]);

  const handleGenerate = async () => {
    if (!bin.trim()) { setError('Please provide a valid BIN.'); return; }
    setIsLoading(true); setError('');
    
    try {
      const res = await fetch('/api/tools/generate-cards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bin, quantity })
      });
      const data = await res.json() as { success?: boolean, cards?: CardData[], metadata?: any, error?: string };
      
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to execute payload generation.');
      
      if (data.cards) {
        setGeneratedCards(data.cards);
        if (data.metadata) setMetadata(data.metadata);
      }
    } catch (err: any) { setError(err.message); } 
    finally { setIsLoading(false); }
  };

  const formattedOutput = useMemo(() => {
    if (!generatedCards.length) return '';
    if (format === 'pipe') return generatedCards.map(c => c.formattedString || `${c.number}|${c.expMonth}|${c.expYear}|${c.cvv}`).join('\n');
    if (format === 'csv') return 'Network,CardNumber,ExpMonth,ExpYear,CVV\n' + generatedCards.map(c => `${c.network || 'Unknown'},${c.number},${c.expMonth},${c.expYear},${c.cvv}`).join('\n');
    if (format === 'json') return JSON.stringify(generatedCards.map(({ formattedString, ...rest }) => rest), null, 2);
    return '';
  }, [generatedCards, format]);

  return (
    <div className="max-w-5xl mx-auto md:py-8 animation-fade-in">
      <SeoHead 
        title="Test Credit Card Generator | Luhn Valid CC Numbers" 
        description="Generate 100% structurally valid, Luhn-compliant dummy credit card payloads. Output clean testing data for Visa, Mastercard, Amex, and Discover in JSON or CSV." 
        keywords="test credit card generator, valid cc generator with cvv, dummy credit card numbers, Luhn algorithm generator, QA testing cards, test payment vectors"
        isTool={true}
        faqData={FAQ_DATA}
      />
      
      <div className="mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
          <Database className="size-3.5 fill-current" /> Structurally Valid QA Payload
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Enterprise Test Card Generator</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Instantly synthesize mathematically valid dummy payment vectors utilizing precise network length constraints and cryptographic Luhn checks.</p>
        
        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 inline-flex px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/20">
          <AlertCircle className="size-4" /> Strictly for local development and sandbox environments. Data holds no financial validity.
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/20 dark:shadow-black/20 overflow-hidden mb-16">
        
        <div className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a]/50">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">Gateway Presets</span>
            {PRESET_BINS.map((preset) => (
              <button key={preset.name} onClick={() => setBin(preset.bin)} className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-500 shadow-sm">
                {preset.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5">
              <label className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                <span>Target BIN Prefix</span>
                <span className="text-orange-500 flex items-center gap-1"><Network className="size-3" /> {detectedNetwork}</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                <input type="text" value={bin} onChange={(e) => setBin(e.target.value.replace(/\D/g, ''))} placeholder="Enter 1 to 16 digits..." maxLength={16} className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 font-mono text-lg font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm" />
              </div>
            </div>
            
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Volume Size</label>
              <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-4 text-base font-semibold outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm appearance-none cursor-pointer">
                <option value={1}>1 Vector</option><option value={10}>10 Vectors</option><option value={50}>50 Vectors</option><option value={100}>100 Vectors</option><option value={500}>500 Vectors (Bulk)</option>
              </select>
            </div>
            
            <div className="md:col-span-3 pt-6">
              <button onClick={handleGenerate} disabled={isLoading || bin.length < 1} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold rounded-2xl transition-all disabled:opacity-50 shadow-lg active:scale-[0.98] cursor-pointer">
                <Sparkles className="size-5" /> {isLoading ? 'Synthesizing...' : 'Execute'}
              </button>
            </div>
          </div>
          {error && <div className="mt-5 flex items-center gap-3 text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 font-medium"><ShieldAlert className="size-5 shrink-0" /> {error}</div>}
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-lg flex items-center gap-2"><Code2 className="size-5 text-orange-500" /> Generated Payload</h3>
              {metadata && <span className="hidden md:flex px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider rounded-md border border-zinc-200 dark:border-zinc-700">{metadata.networkDetected} • {metadata.vectorLength} DIGITS</span>}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-zinc-100 dark:bg-[#0a0a0a] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button onClick={() => setFormat('pipe')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${format === 'pipe' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer'}`}>Raw</button>
                <button onClick={() => setFormat('json')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${format === 'json' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer'}`}><FileJson className="size-3.5" /> JSON</button>
                <button onClick={() => setFormat('csv')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${format === 'csv' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer'}`}><FileText className="size-3.5" /> CSV</button>
              </div>
              <button onClick={() => copy(formattedOutput)} disabled={generatedCards.length === 0} className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 ${copiedText ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md border border-orange-500'}`}>
                {copiedText ? <Check className="size-4" /> : <Copy className="size-4" />} {copiedText ? 'Copied' : 'Copy Payload'}
              </button>
            </div>
          </div>
          
          <div className="relative group">
            <textarea readOnly rows={Math.max(12, Math.min(25, generatedCards.length || 12))} value={formattedOutput} placeholder="Awaiting execution... Output will render here." className={`w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-5 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-300 outline-none resize-y custom-scrollbar placeholder:text-zinc-400 focus:border-orange-500/50 ${format === 'json' ? 'whitespace-pre' : ''}`} />
            {generatedCards.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                 <Database className="size-16 mb-4 text-zinc-400" />
                 <span className="text-sm font-semibold text-zinc-500">System Standing By...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Why Use a Luhn-Valid Credit Card Generator?</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-3">
            <div className="size-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 border border-orange-500/20 mb-4"><Shield className="size-5" /></div>
            <h3 className="font-bold text-lg">Bypass Front-End Validation</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Modern web forms use JavaScript to enforce Modulus 10 (Luhn) checks before submission. Generating mathematically accurate dummy numbers ensures your testing reaches the backend seamlessly.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20 mb-4"><RefreshCw className="size-5" /></div>
            <h3 className="font-bold text-lg">E-Commerce Flow Testing</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Ensure cart abstractions, tax calculators, and database writes function correctly. You can export clean JSON or CSV formats to populate automated Playwright or Cypress testing scripts.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-4"><Cpu className="size-5" /></div>
            <h3 className="font-bold text-lg">Dynamic Network Simulation</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Our engine automatically adjusts vector length based on the BIN network prefix (e.g., yielding 15 digits for Amex and 16 digits for Visa/Mastercard) for pixel-perfect integration testing.</p>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2"><HelpCircle className="size-6 text-orange-500" /> Frequently Asked Questions</h2>
          <div className="grid gap-6">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100">{faq.question}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

    </div>
  );
}
