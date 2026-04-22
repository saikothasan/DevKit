import { useState } from 'react';
import { Crown, CheckCircle2, ShieldCheck, Zap, LockKeyhole, Loader2, Link2 } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

// Apirone Supported Currencies Matrix
const SUPPORTED_NETWORKS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'trx', name: 'Tron', symbol: 'TRX' },
  { id: 'usdt@trx', name: 'USDT (TRC20)', symbol: 'USDT' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
];

export default function VIPPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('usdt@trx');

  const initiateTransaction = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/vip/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency })
      });
      
      const data = await res.json() as { success?: boolean; error?: string; invoiceUrl?: string };
      
      if (res.ok && data.success && data.invoiceUrl) {
        toast('Invoice established. Redirecting to secure gateway.', 'success');
        // Secure redirect to the external payment processor
        window.location.href = data.invoiceUrl;
      } else {
        toast(data.error || 'Invoice generation execution failed.', 'error');
        setIsProcessing(false);
      }
    } catch (err) {
      toast('Network disruption detected during payload transfer.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto md:py-8 animation-fade-in">
      <SeoHead title="VIP Checkout" description="Secure lifetime VIP access utilizing transparent blockchain protocols." />
      
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 mb-6">
          <Crown className="size-10 text-orange-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">Elite Node Access</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Deploy a localized transaction via a decentralized network to procure permanent VIP decryption keys.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>

        <div className="space-y-8 z-10 pt-4">
          <div>
             <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">VIP Benefit</h2>
             <p className="text-zinc-500 text-sm">Get unlimited access to any resources, Access Premium Tools and Access private Bins.</p>
          </div>
          <ul className="space-y-4">
            {[
              { icon: LockKeyhole, text: 'Read access to locked data streams.' },
              { icon: Zap, text: 'Permanent bypass of point expenditure parameters.' },
              { icon: ShieldCheck, text: 'VIP verification badge globally active.' },
              { icon: CheckCircle2, text: 'Premium Tools Access And More.' }
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <item.icon className="size-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center z-10 flex flex-col gap-6">
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Execution Cost</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-zinc-400">$</span>
              <span className="text-6xl font-black text-zinc-900 dark:text-white">49</span>
              <span className="text-2xl font-bold text-zinc-400">.99</span>
            </div>
            <span className="text-xs text-zinc-500 mt-1 font-medium">One-Time Fiat Equivalent</span>
          </div>

          <div className="space-y-3 text-left w-full">
             <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
               <Link2 className="size-4" /> Destination Network
             </label>
             <div className="grid grid-cols-2 gap-2">
               {SUPPORTED_NETWORKS.map(net => (
                 <button
                   key={net.id}
                   onClick={() => setSelectedCurrency(net.id)}
                   className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                     selectedCurrency === net.id 
                       ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm' 
                       : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                   }`}
                 >
                   <div className="flex items-center justify-center gap-2">
                     {net.symbol} <span className="text-xs opacity-60">({net.name})</span>
                   </div>
                 </button>
               ))}
             </div>
          </div>
          
          {user?.isVip ? (
            <div className="w-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="size-5" /> VIP Protocol Engaged
            </div>
          ) : (
            <button 
              onClick={initiateTransaction}
              disabled={isProcessing}
              className="w-full bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-4 rounded-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
              {isProcessing ? 'Compiling Payload...' : 'Purchase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
