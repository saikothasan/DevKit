import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Shield, Zap, LockOpen, Server, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/apiClient';

export default function VIP() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  const perks = [
    "Lifetime bypass of cryptographic payload locks",
    "Infinite forum search API parameters",
    "Elite Node badge and persistent ranking",
    "Zero-latency priority on execution utilities",
    "Private end-to-end encrypted messaging bridge"
  ];

  const initializePaymentLedger = async () => {
    setIsGenerating(true);
    try {
      // Connects to the /api/vip route to initialize an Apirone BTC/LTC invoice
      const res = await api.post('/vip/checkout', { currency: 'btc' });
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error('Ledger initialization failure', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-8">
      <div className="text-center mb-12">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="size-20 bg-gradient-to-br from-orange-500 to-amber-400 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(243,128,32,0.4)]">
          <Crown className="size-10 text-white" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">Ascend to Elite Node</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Unlock absolute network sovereignty. Bypass all execution firewalls and access encrypted telemetries perpetually via cryptographic payment.
        </p>
      </div>

      {!invoice ? (
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          {/* Perks Column */}
          <div className="space-y-6">
            {perks.map((perk, i) => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-center gap-4">
                <div className="size-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 border border-green-500/20">
                  <CheckCircle2 className="size-4" />
                </div>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm">{perk}</span>
              </motion.div>
            ))}
          </div>

          {/* Checkout Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#141414] to-[#0a0a0a] rounded-3xl p-8 border border-zinc-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-700 pointer-events-none">
              <Zap className="size-48 text-orange-500" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-8">
                <span className="text-orange-500 font-black text-sm uppercase tracking-widest mb-2 block">Lifetime License</span>
                <div className="flex items-baseline gap-2 text-white">
                  <span className="text-5xl font-black">$49</span>
                  <span className="text-zinc-400 font-semibold">.99</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                  <Shield className="size-4 text-green-400" /> Anonymous Cryptographic Transfer
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                  <Server className="size-4 text-[#2AABEE]" /> Zero Log Persistence
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-400 font-medium">
                  <LockOpen className="size-4 text-orange-400" /> Instant Access Automation
                </div>
              </div>

              {user ? (
                user.isVip ? (
                  <div className="mt-auto bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl p-4 text-center font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="size-5" /> Elite Status Active
                  </div>
                ) : (
                  <button 
                    onClick={initializePaymentLedger}
                    disabled={isGenerating}
                    className="mt-auto w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(243,128,32,0.3)] active:scale-[0.98] focus-ring flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isGenerating ? <Loader2 className="size-5 animate-spin" /> : (
                      <>Initialize Invoice <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                )
              ) : (
                <div className="mt-auto bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-center text-sm font-bold">
                  Authentication Required for Upgrade
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        /* Render Apirone/Crypto Invoice UI Here based on backend schema response */
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto glass-panel p-8 rounded-3xl text-center">
            <h3 className="text-xl font-black text-white mb-4">Awaiting Cryptographic Transfer</h3>
            <div className="bg-white p-4 rounded-xl inline-block mb-6">
                {/* QR Code Placeholder mapping to invoice.address */}
                <div className="size-48 bg-zinc-200 border-4 border-white shadow-inner flex items-center justify-center text-zinc-400 font-mono text-xs">
                    [QR DATA: {invoice.address}]
                </div>
            </div>
            <p className="font-mono text-sm text-zinc-400 bg-[#0a0a0a] border border-zinc-800 p-3 rounded-xl break-all select-all">
              {invoice.address}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-amber-500 text-sm font-bold">
              <Loader2 className="size-4 animate-spin" /> Scanning Ledger Network...
            </div>
        </motion.div>
      )}
    </div>
  );
}
