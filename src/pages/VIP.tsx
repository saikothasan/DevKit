import { useState } from 'react';
import { Crown, CheckCircle2, ShieldCheck, Zap, LockKeyhole, Loader2, Coins } from 'lucide-react';
import { SeoHead } from '@/components/SeoHead';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';

const SUPPORTED_NETWORKS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC' },
  { id: 'trx', name: 'Tron', symbol: 'TRX' },
  { id: 'usdt@trx', name: 'Tether (TRC20)', symbol: 'USDT' }
];

export default function VIPPlan() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('usdt@trx');

  const generateInvoice = async () => {
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
        toast('Cryptographic session established. Redirecting to secure gateway.', 'success');
        // Redirect the user securely to the Apirone hosted invoice page
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
      <SeoHead title="VIP Access - Decentralized Checkout" description="Secure lifetime VIP access utilizing transparent blockchain protocols." />
      
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 mb-6">
          <Crown className="size-10 text-orange-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">Elite Node Authentication</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Execute a one-time transaction via preferred blockchain networks to acquire lifetime protocol bypassing privileges.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="space-y-8 z-10">
          <div>
             <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Protocol Benefits</h2>
             <p className="text-zinc-500 text-sm">Direct injection into the premium architecture.</p>
          </div>
          <ul className="space-y-4">
            {[
              { icon: LockKeyhole, text: 'Decrypted access to all locked repository fragments.' },
              { icon: Zap, text: 'Unlimited reputation bypass execution.' },
              { icon: ShieldCheck, text: 'Global VIP cryptographic signature.' },
              { icon: CheckCircle2, text: 'Priority routing and latency optimization.' }
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-300">
                <item.icon className="size-5 text-orange-500 shrink-0 mt-0.5" />
                <span className="font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-center z-10 flex flex-col gap-6">
          
          <div className="flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">One-Time Transfer</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-zinc-400">$</span>
              <span className="text-6xl font-black text-zinc-900 dark:text-white">49</span>
              <span className="text-2xl font-bold text-zinc-400">.99</span>
            </div>
          </div>

          <div className="space-y-3 text-left">
             <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
               <Coins className="size-4" /> Select Execution Network
             </label>
             <div className="grid grid-cols-2 gap-2">
               {SUPPORTED_NETWORKS.map(net => (
                 <button
                   key={net.id}
                   onClick={() => setSelectedCurrency(net.id)}
                   className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                     selectedCurrency === net.id 
                       ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                       : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                   }`}
                 >
                   {net.name} ({net.symbol})
                 </button>
               ))}
             </div>
          </div>
          
          {user?.isVip ? (
            <div className="w-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="size-5" /> Node Validated (VIP)
            </div>
          ) : (
            <button 
              onClick={generateInvoice}
              disabled={isProcessing}
              className="w-full bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold py-4 rounded-xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
              {isProcessing ? 'Generating Secure Tunnel...' : 'Checkout via Apirone'}
            </button>
          )}
          <p className="text-xs text-zinc-500 font-medium">Secured by Apirone Cryptographic Processing.</p>
        </div>
      </div>
    </div>
  );
}
