import { useState, useRef, useEffect } from 'react';
import { SeoHead } from '../components/SeoHead';
import { Square, CreditCard, Activity, Trash2, Search, Database, Info, ShieldCheck, Globe } from 'lucide-react';

type CheckStatus = 'Found' | 'Not Found' | 'Error';

interface CheckedBin {
  raw: string;
  status: CheckStatus;
  brand?: string;
  country?: string;
  funding?: string;
  length?: number;
  rangeLow?: string;
  rangeHigh?: string;
  fullData?: any;
  time: number;
}

const FAQ_DATA = [
  { question: "What is a Bank Identification Number (BIN)?", answer: "The Bank Identification Number (BIN) or Issuer Identification Number (IIN) refers to the first 6 to 8 digits of a payment card number. It identifies the institution that issued the card and the card network (like Visa or Mastercard)." },
  { question: "What information can a BIN Lookup provide?", answer: "A BIN lookup reveals the card scheme (e.g., Visa, Amex), card type (Credit, Debit, Prepaid), card level (Classic, Platinum, Corporate), the issuing bank's name, and the country of origin." },
  { question: "Why is a BIN Checker important for developers?", answer: "Developers use BIN checkers for payment validation, fraud prevention, and UX optimization. By identifying the card type and country, systems can apply dynamic 3D Secure rules, prevent cross-border transaction errors, and block high-risk prepaid cards." }
];

export default function BinChecker() {
  const [input, setInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckedBin[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStart = async () => {
    const lines = input.split('\n').map(c => c.trim()).filter(c => c.length >= 6);
    const bins = lines.map(line => line.replace(/\D/g, '').substring(0, 8)).filter(b => b.length >= 6);
    
    if (bins.length === 0) return;

    setIsChecking(true);
    setProgress({ current: 0, total: bins.length });
    setResults([]);
    abortControllerRef.current = new AbortController();

    for (let i = 0; i < bins.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break;
      setProgress(p => ({ ...p, current: i + 1 }));
      const startTime = Date.now();
      
      try {
        const res = await fetch('/api/tools/check-bin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bin: bins[i] }),
          signal: abortControllerRef.current.signal
        });
        
        const data = await res.json() as any;
        
        if (data.success && data.fullResponse?.data?.[0]) {
          const item = data.fullResponse.data[0];
          setResults(prev => [{
            raw: bins[i], status: 'Found', brand: item.brand,
            country: item.country, funding: item.funding,
            length: item.pan_length, 
            rangeLow: item.account_range_low,
            rangeHigh: item.account_range_high,
            fullData: item,
            time: Date.now() - startTime
          }, ...prev]);
        } else {
          setResults(prev => [{ raw: bins[i], status: 'Not Found', time: Date.now() - startTime }, ...prev]);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        setResults(prev => [{ raw: bins[i], status: 'Error', time: Date.now() - startTime }, ...prev]);
      }
    }
    setIsChecking(false);
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsChecking(false);
  };

  useEffect(() => { return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); }; }, []);

  const stats = {
    found: results.filter(r => r.status === 'Found').length,
    notFound: results.filter(r => r.status === 'Not Found').length,
    errors: results.filter(r => r.status === 'Error').length,
  };

  const percentComplete = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto md:py-8 animation-fade-in">
      <SeoHead 
        title="BIN Checker & Credit Card BIN Lookup API Tool" 
        description="Free real-time Bank Identification Number (BIN) lookup tool. Verify credit card BIN codes to identify issuing banks, card schemes, and geographical origins for fraud prevention." 
        keywords="BIN checker, BIN lookup, bank identification number, credit card BIN lookup, IIN lookup, issuer identification number, card scheme detection, payment validation"
        isTool={true}
        faqData={FAQ_DATA}
      />
      
      <div className="mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
          <Database className="size-3.5 fill-current" /> Metadata API Integration
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Credit Card BIN Lookup Engine</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Query global issuer networks to instantly identify card brands, ranges, and geographic origin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/20 dark:shadow-black/20 overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a]/50 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <CreditCard className="size-4" /> BIN Input List
              </label>
              <button onClick={() => setInput('')} disabled={isChecking || !input} className="text-zinc-400 hover:text-red-500 disabled:opacity-50 transition-colors cursor-pointer">
                <Trash2 className="size-4" />
              </button>
            </div>
            
            <textarea 
              value={input} onChange={(e) => setInput(e.target.value)} disabled={isChecking}
              placeholder="Format: 415464&#10;Paste full cards; we automatically extract the first 6-8 digits (IIN)."
              className="flex-1 w-full bg-transparent p-6 font-mono text-sm leading-relaxed outline-none resize-none custom-scrollbar placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
            />
            
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a]/50 flex gap-3">
              {!isChecking ? (
                <button onClick={handleStart} disabled={!input.trim()} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:hover:bg-orange-500 dark:text-zinc-900 dark:hover:text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-md active:scale-[0.98] cursor-pointer">
                  <Search className="size-4" /> Start Lookup
                </button>
              ) : (
                <button onClick={handleStop} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer shadow-red-500/20">
                  <Square className="size-4 fill-current" /> Stop
                </button>
              )}
            </div>
          </div>

          {progress.total > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Activity className="size-4" /> Queue Progress</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-out" style={{ width: `${percentComplete}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none mb-1">{stats.found}</span>
              <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">Found</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400 leading-none mb-1">{stats.notFound}</span>
              <span className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest">Missing</span>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-red-700 dark:text-red-400 leading-none mb-1">{stats.errors}</span>
              <span className="text-[10px] font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-widest">Errors</span>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#0a0a0a]/50">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Metadata Output</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-zinc-50 dark:bg-[#0a0a0a]">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <Database className="size-12 mb-3 text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-500">Awaiting Queries...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((res, idx) => (
                    <div key={idx} className={`flex flex-col sm:flex-row justify-between p-4 rounded-xl border text-sm transition-colors ${res.status === 'Found' ? 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700' : res.status === 'Not Found' ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400'}`}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-base bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-lg select-all">{res.raw}</span>
                          {res.status === 'Found' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-zinc-200 dark:border-zinc-700">{res.brand}</span>
                              <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-500/20">{res.funding}</span>
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-500/20">{res.country}</span>
                              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-500/20">Len: {res.length}</span>
                            </div>
                          )}
                        </div>
                        {res.status === 'Found' && res.rangeLow && res.rangeHigh && (
                          <div className="text-[10px] text-zinc-500 font-mono tracking-wider ml-1 mt-1">
                            ACCOUNT RANGE: {res.rangeLow} - {res.rangeHigh}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-start gap-2 shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs opacity-50 font-mono">[{res.time}ms]</span>
                          {res.status !== 'Found' ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${res.status === 'Not Found' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>{res.status}</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Found</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Comprehensive Guide to BIN Lookups & Verification</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-3">
            <div className="size-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 border border-orange-500/20 mb-4"><ShieldCheck className="size-5" /></div>
            <h3 className="font-bold text-lg">Fraud Prevention</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Validate payment cards before processing to detect suspicious origins. Ensure the billing country matches the card's issuing location to drastically reduce chargeback rates.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20 mb-4"><Database className="size-5" /></div>
            <h3 className="font-bold text-lg">Payment Validation</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Instantly verify card details like network (Visa, Mastercard, Discover) and funding type (Debit, Credit, Prepaid) to improve e-commerce checkout success.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-4"><Globe className="size-5" /></div>
            <h3 className="font-bold text-lg">Regulatory Compliance</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Identify cross-border transactions automatically. Meet internal financial compliance and regulatory requirements by strictly monitoring issuer geolocations.</p>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2"><Info className="size-6 text-orange-500" /> Frequently Asked Questions</h2>
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
