import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Shield, Zap, LockOpen, Server, ArrowRight, Loader2, ScanLine } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto w-full py-8 md:py-12 px-4 relative z-10">
      
      {/* Deep Background Radiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-orange/10 dark:bg-brand-orange/15 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="text-center mb-16 relative">
        <motion.div 
          initial={{ scale: 0, rotate: -45 }} 
          animate={{ scale: 1, rotate: 0 }} 
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }} 
          className="size-24 bg-gradient-to-br from-brand-orange to-amber-400 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(243,128,32,0.5)] border border-white/20 relative"
        >
          <div className="absolute inset-0 bg-white/20 blur-md rounded-3xl" />
          <Crown className="size-12 text-white relative z-10 drop-shadow-md" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white tracking-tight mb-5">Ascend to Elite Node</h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Unlock absolute network sovereignty. Bypass all execution firewalls and access encrypted telemetries perpetually via cryptographic payment.
        </p>
      </div>

      {!invoice ? (
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center max-w-4xl mx-auto">
          
          {/* Elite Perks Ledger */}
          <div className="space-y-6 lg:space-y-8">
            <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-3">
               <span className="w-8 h-px bg-zinc-300 dark:bg-zinc-700" /> Protocol Advantages
            </h3>
            <div className="space-y-5">
              {perks.map((perk, i) => (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, type: 'spring' }} key={i} className="flex items-start gap-4">
                  <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner mt-0.5">
                    <CheckCircle2 className="size-4.5" />
                  </div>
                  <span className="text-zinc-700 dark:text-zinc-200 font-bold text-[15px] leading-snug">{perk}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Execution Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-zinc-950 rounded-[2.5rem] p-8 md:p-10 border border-zinc-800 shadow-2xl shadow-brand-orange/10 relative overflow-hidden group"
          >
            {/* Dynamic Card Backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 z-0" />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-700 pointer-events-none z-0">
              <Zap className="size-56 text-brand-orange" />
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-orange/20 blur-[80px] rounded-full z-0 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="mb-10">
                <span className="inline-block px-3 py-1 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 rounded-full font-black text-[10px] uppercase tracking-widest mb-4 shadow-inner">
                  Lifetime License
                </span>
                <div className="flex items-baseline gap-1 text-white drop-shadow-md">
                  <span className="text-6xl font-black tracking-tighter">$49</span>
                  <span className="text-2xl text-zinc-400 font-bold">.99</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-[14px] text-zinc-300 font-bold bg-white/5 border border-white/5 p-3 rounded-xl">
                  <Shield className="size-5 text-emerald-400" /> Anonymous Cryptographic Transfer
                </div>
                <div className="flex items-center gap-3 text-[14px] text-zinc-300 font-bold bg-white/5 border border-white/5 p-3 rounded-xl">
                  <Server className="size-5 text-[#2AABEE]" /> Zero Log Persistence
                </div>
                <div className="flex items-center gap-3 text-[14px] text-zinc-300 font-bold bg-white/5 border border-white/5 p-3 rounded-xl">
                  <LockOpen className="size-5 text-amber-400" /> Instant Access Automation
                </div>
              </div>

              {user ? (
                user.isVip ? (
                  <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 md:p-5 text-center font-black tracking-wide flex items-center justify-center gap-2 shadow-inner">
                    <CheckCircle2 className="size-5" /> Elite Status Active
                  </div>
                ) : (
                  <button 
                    onClick={initializePaymentLedger}
                    disabled={isGenerating}
                    className="mt-auto w-full bg-brand-orange hover:bg-brand-orange-light text-white font-black text-[15px] py-4 md:py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(243,128,32,0.3)] hover:shadow-[0_0_40px_rgba(243,128,32,0.4)] active:scale-[0.98] focus-ring flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {isGenerating ? <Loader2 className="size-5 animate-spin" /> : (
                      <>Initialize Invoice <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                )
              ) : (
                <div className="mt-auto bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 md:p-5 text-center text-[14px] font-black uppercase tracking-wider shadow-inner">
                  Auth Required for Upgrade
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        /* Advanced Cryptographic Terminal UI */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="max-w-lg mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-brand-orange/5"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent" />
            
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                 <ScanLine className="size-6" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Awaiting Transfer</h3>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl inline-block mb-8 relative group">
                  {/* Simulated Scanner Line */}
                  <div className="absolute top-0 left-0 w-full h-full rounded-2xl overflow-hidden pointer-events-none z-10">
                    <div className="w-full h-1 bg-brand-orange/50 shadow-[0_0_15px_rgba(243,128,32,1)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                  
                  {/* QR Code Matrix Placeholder */}
                  <div className="size-56 bg-zinc-100 flex items-center justify-center text-zinc-400 font-mono text-xs overflow-hidden relative border border-zinc-200">
                      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIj48L3JlY3Q+Cjwvc3ZnPg==')] bg-repeat" />
                      <span className="relative z-10 px-4 text-center break-all">[QR_MATRIX: {invoice.address}]</span>
                  </div>
              </div>
              
              <div className="w-full">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block text-center">Destination Ledger Address</label>
                <div className="relative">
                  <p className="font-mono text-[13px] md:text-[14px] text-brand-orange-light bg-black border border-zinc-800 py-4 px-4 rounded-xl break-all select-all text-center shadow-inner">
                    {invoice.address}
                  </p>
                  <div className="absolute -inset-0.5 bg-brand-orange/20 blur opacity-0 transition duration-500" />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-center gap-3 text-amber-500 text-[13px] font-bold uppercase tracking-wider">
              <div className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-3 bg-amber-500"></span>
              </div>
              Scanning Network...
            </div>
        </motion.div>
      )}
    </div>
  );
}
