import { useState } from 'react';
import { Crown, CheckCircle2, ShieldCheck, Zap, LockKeyhole, Loader2, Link2, Coins, ArrowRight, Star } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

const SUPPORTED_NETWORKS = [
  { id: 'btc',     name: 'Bitcoin',     symbol: 'BTC',  color: '#F7931A' },
  { id: 'ltc',     name: 'Litecoin',    symbol: 'LTC',  color: '#A5A9B5' },
  { id: 'doge',    name: 'Dogecoin',    symbol: 'DOGE', color: '#C2A633' },
  { id: 'trx',     name: 'Tron',        symbol: 'TRX',  color: '#EF0027' },
  { id: 'usdt@trx',name: 'USDT TRC20', symbol: 'USDT', color: '#26A17B' },
  { id: 'eth',     name: 'Ethereum',    symbol: 'ETH',  color: '#627EEA' },
];

const FEATURES = [
  { icon: LockKeyhole, text: 'Decrypt all locked content streams' },
  { icon: Zap,         text: 'Permanent bypass of point expenditure' },
  { icon: ShieldCheck, text: 'Global VIP verification badge' },
  { icon: Star,        text: 'Priority access to new tools & methods' },
  { icon: CheckCircle2,text: 'Exclusive VIP-only community channels' },
  { icon: Crown,       text: 'Lifetime access — one-time payment' },
];

export default function VIPPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('usdt@trx');

  const initiateTransaction = async () => {
    if (!user) { navigate('/login'); return; }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/vip/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency }),
      });
      const data = await res.json() as { success?: boolean; error?: string; invoiceUrl?: string };
      if (res.ok && data.success && data.invoiceUrl) {
        toast('Invoice created. Redirecting to payment gateway.', 'success');
        window.location.href = data.invoiceUrl;
      } else {
        toast(data.error || 'Failed to create invoice.', 'error');
        setIsProcessing(false);
      }
    } catch {
      toast('Network error. Please try again.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animation-fade-up">
      <SeoHead title="VIP Access | DevKit" description="Get lifetime VIP access via decentralized payment." />

      {/* ── Hero Header ── */}
      <div className="text-center mb-12 sm:mb-16">
        <div
          className="inline-flex items-center justify-center size-20 rounded-3xl mb-6 relative"
          style={{ background: 'linear-gradient(135deg, rgba(243,128,32,0.15) 0%, rgba(245,158,11,0.1) 100%)', border: '1px solid rgba(243,128,32,0.25)' }}
        >
          <Crown className="size-10 text-orange-500" />
          <div className="absolute -inset-1 rounded-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(243,128,32,0.3) 0%, transparent 70%)', filter: 'blur(12px)' }} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-mono mb-5" style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)', color: 'var(--orange)' }}>
          <Star className="size-3" /> Exclusive Access
        </div>

        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
        >
          Elite VIP Access
        </h1>
        <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          One-time payment. Lifetime access. Unlock everything DevKit has to offer.
        </p>
      </div>

      {/* ── Main Card ── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.12)' }}
      >
        <div className="h-px w-full bg-gradient-to-r from-orange-500 via-amber-400 to-transparent" />

        <div className="grid md:grid-cols-2 gap-0">

          {/* Left: Features */}
          <div
            className="p-7 sm:p-10"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
              What's included
            </h2>
            <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
              Everything you need, forever.
            </p>

            <ul className="space-y-4">
              {FEATURES.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3.5">
                  <div
                    className="flex size-8 items-center justify-center rounded-xl shrink-0"
                    style={{ background: 'var(--orange-dim)', border: '1px solid var(--orange-border)' }}
                  >
                    <item.icon className="size-4 text-orange-500" />
                  </div>
                  <span className="pt-1 text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Testimonial */}
            <div
              className="mt-8 p-4 rounded-2xl"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              <div className="flex gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "Best investment I've made. The locked content alone is worth 10x the price."
              </p>
              <p className="mt-2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>— Verified VIP Member</p>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="p-7 sm:p-10 flex flex-col">
            {/* Price */}
            <div className="text-center mb-8">
              <p className="badge-mono mb-2" style={{ color: 'var(--text-muted)' }}>One-time payment</p>
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-2xl font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>$</span>
                <span className="text-6xl font-black" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>49</span>
                <span className="text-2xl font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>.99</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fiat equivalent in crypto</p>
            </div>

            {/* Network selector */}
            <div className="mb-6">
              <p className="badge-mono mb-3" style={{ color: 'var(--text-muted)' }}>Select Payment Network</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_NETWORKS.map(net => (
                  <button
                    key={net.id}
                    onClick={() => setSelectedCurrency(net.id)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: selectedCurrency === net.id ? `${net.color}15` : 'var(--surface-raised)',
                      border: `1px solid ${selectedCurrency === net.id ? net.color + '40' : 'var(--border)'}`,
                      color: selectedCurrency === net.id ? net.color : 'var(--text-secondary)',
                      boxShadow: selectedCurrency === net.id ? `0 0 12px ${net.color}20` : 'none',
                    }}
                  >
                    <Coins className="size-4" />
                    <span>{net.symbol}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Paying with: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {SUPPORTED_NETWORKS.find(n => n.id === selectedCurrency)?.name}
                </span>
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={initiateTransaction}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-bold transition-all disabled:opacity-60 active:scale-[0.98] group relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #F38020, #F59E0B)', color: '#fff', boxShadow: '0 8px 24px rgba(243,128,32,0.35)' }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              {isProcessing ? (
                <><Loader2 className="size-5 animate-spin" /> Processing...</>
              ) : (
                <><Crown className="size-5" /> Upgrade to VIP <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>

            <div className="mt-4 flex items-center gap-2 justify-center" style={{ color: 'var(--text-muted)' }}>
              <Link2 className="size-3.5" />
              <p className="text-xs">Secure payment via Apirone gateway</p>
            </div>

            {/* Already VIP */}
            {user?.isVip && (
              <div
                className="mt-4 flex items-center gap-2.5 p-3.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-emerald-500">You already have VIP access!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
