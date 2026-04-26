import { useState, useRef } from 'react';
import { SeoHead } from '@/components/SeoHead';
import { Square, CreditCard, Activity, Trash2, Search, Database, Globe, CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ToolPageHeader, ToolCard } from '@/components/ToolPageHeader';

type CheckStatus = 'Found' | 'Not Found' | 'Error';
interface CheckedBin {
  raw: string; status: CheckStatus; brand?: string; country?: string;
  funding?: string; length?: number; rangeLow?: string; rangeHigh?: string;
  fullData?: any; time: number;
}

const FAQ_DATA = [
  { q: 'What is a BIN?', a: "A Bank Identification Number (BIN) refers to the first 6–8 digits of a payment card. It identifies the issuing institution and card network." },
  { q: 'What can BIN Lookup reveal?', a: "It reveals the card scheme (Visa, Amex), card type (Credit, Debit, Prepaid), card level, issuing bank, and country of origin." },
  { q: 'Why do developers use BIN checkers?', a: "For payment validation, fraud prevention, and UX optimization — applying 3DS rules, preventing cross-border errors, and blocking high-risk prepaid cards." },
];

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'Found') return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (status === 'Not Found') return <XCircle className="size-4 text-red-500" />;
  return <AlertCircle className="size-4 text-amber-500" />;
}

export default function BinChecker() {
  const [input, setInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<CheckedBin[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleStart = async () => {
    const bins = input.split('\n').map(c => c.trim().replace(/\D/g, '').substring(0, 8)).filter(b => b.length >= 6);
    if (!bins.length) return;
    setIsChecking(true); setProgress({ current: 0, total: bins.length }); setResults([]);
    abortRef.current = new AbortController();

    for (let i = 0; i < bins.length; i++) {
      if (abortRef.current?.signal.aborted) break;
      setProgress(p => ({ ...p, current: i + 1 }));
      const t0 = Date.now();
      try {
        const res = await fetch('/api/tools/check-bin', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bin: bins[i] }), signal: abortRef.current.signal,
        });
        const data = await res.json() as any;
        if (data.success && data.fullResponse?.data?.[0]) {
          const item = data.fullResponse.data[0];
          setResults(prev => [{ raw: bins[i], status: 'Found', brand: item.brand, country: item.country, funding: item.funding, length: item.pan_length, rangeLow: item.account_range_low, rangeHigh: item.account_range_high, fullData: item, time: Date.now() - t0 }, ...prev]);
        } else {
          setResults(prev => [{ raw: bins[i], status: 'Not Found', time: Date.now() - t0 }, ...prev]);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        setResults(prev => [{ raw: bins[i], status: 'Error', time: Date.now() - t0 }, ...prev]);
      }
    }
    setIsChecking(false);
  };

  const found = results.filter(r => r.status === 'Found').length;
  const notFound = results.filter(r => r.status === 'Not Found').length;

  return (
    <div className="max-w-5xl mx-auto animation-fade-in">
      <SeoHead title="BIN Lookup | DevKit" description="Identify card brand, type, country, and issuing bank from BIN numbers." isTool={true} />

      <ToolPageHeader badge="Intelligence" badgeIcon={Database} title="BIN Lookup" description="Identify card brand, type, funding method, country, and issuing bank from BIN/IIN numbers." />

      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Input */}
        <ToolCard className="lg:col-span-3">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="badge-mono" style={{ color: 'var(--text-muted)' }}>BIN Input (one per line)</label>
              {input && (
                <button onClick={() => { setInput(''); setResults([]); }} className="badge-mono flex items-center gap-1 transition-colors hover:text-red-500" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 className="size-3" /> Clear
                </button>
              )}
            </div>
            <textarea
              rows={8}
              placeholder={"424242\n555555\n378282\n..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full rounded-xl p-4 text-sm outline-none resize-none custom-scrollbar transition-all"
              style={{ fontFamily: "'JetBrains Mono', monospace", background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--orange-dim)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleStart}
                disabled={isChecking || !input.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
                style={{ background: 'var(--orange)', color: '#fff' }}
              >
                {isChecking ? <><Loader2 className="size-4 animate-spin" /> Checking {progress.current}/{progress.total}</> : <><Search className="size-4" /> Start Lookup</>}
              </button>
              {isChecking && (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="px-4 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
                >
                  <Square className="size-4" />
                </button>
              )}
            </div>
            {isChecking && (
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full bg-orange-500 transition-all duration-300 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            )}
          </div>
        </ToolCard>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-1 gap-4 content-start">
          {[
            { label: 'Checked', value: results.length, color: 'var(--text-primary)', bg: 'var(--surface)' },
            { label: 'Found', value: found, color: '#10B981', bg: 'rgba(16,185,129,0.06)' },
            { label: 'Not Found', value: notFound, color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-5" style={{ background: stat.bg, border: '1px solid var(--border)' }}>
              <p className="badge-mono mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <p className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ToolCard className="mb-8">
          <div className="p-5">
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {results.map((r, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: 'var(--surface-raised)' }}
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <StatusIcon status={r.status} />
                    <span className="font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{r.raw}</span>
                    {r.status === 'Found' && (
                      <>
                        <span className="badge-mono px-2 py-0.5 rounded text-sky-500" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>{r.brand}</span>
                        <span className="badge-mono px-2 py-0.5 rounded text-purple-500" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>{r.funding}</span>
                        <span className="badge-mono" style={{ color: 'var(--text-muted)' }}>{r.country}</span>
                      </>
                    )}
                    <span className="ml-auto badge-mono" style={{ color: 'var(--text-muted)' }}>{r.time}ms</span>
                    {r.status === 'Found' && (expandedIdx === i ? <ChevronUp className="size-4 shrink-0" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="size-4 shrink-0" style={{ color: 'var(--text-muted)' }} />)}
                  </button>
                  {expandedIdx === i && r.fullData && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                      {[
                        ['Brand', r.fullData.brand],
                        ['Funding', r.fullData.funding],
                        ['Type', r.fullData.type],
                        ['PAN Length', r.fullData.pan_length],
                        ['Range Low', r.fullData.account_range_low],
                        ['Range High', r.fullData.account_range_high],
                      ].map(([k, v]) => (
                        <div key={k} className="p-2 rounded-lg" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                          <p className="badge-mono text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{k}</p>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{v || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ToolCard>
      )}

      {/* FAQ */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>FAQ</h3>
        {FAQ_DATA.map((item, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm transition-colors"
              style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
            >
              {item.q}
              {faqOpen === i ? <ChevronUp className="size-4 shrink-0" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="size-4 shrink-0" style={{ color: 'var(--text-muted)' }} />}
            </button>
            {faqOpen === i && (
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
