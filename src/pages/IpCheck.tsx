import { useState, useEffect } from 'react';
import { SeoHead } from '@/components/SeoHead';
import { Search, MapPin, Globe, Shield, ShieldAlert, ShieldCheck, Network, Server, Wifi, Loader2, Radar } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface IpData {
  ip: string;
  location: {
    continent: string;
    country: string;
    countryCode: string;
    region: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
  };
  network: {
    isp: string;
    org: string;
    asn: string;
    reverse: string;
  };
  security: {
    isProxy: boolean;
    isVpn: boolean;
    isHosting: boolean;
    isMobile: boolean;
    riskScore: number;
    type: string;
  };
}

export default function IpCheck() {
  const [ipInput, setIpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<IpData | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setData(null);

    try {
      const res = await fetch('/api/tools/check-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipInput.trim() })
      });
      const resData = await res.json() as any;

      if (res.ok && resData.success) {
        setData(resData.data);
      } else {
        toast(resData.message || 'Failed to analyze IP.', 'error');
      }
    } catch (err) {
      toast('Network failure during IP resolution.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRiskColor = (score: number) => {
    if (score < 33) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (score < 66) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getRiskLabel = (score: number) => {
    if (score < 33) return 'Clean / Safe';
    if (score < 66) return 'Suspicious';
    return 'Blacklisted / High Risk';
  };

  return (
    <div className="max-w-6xl mx-auto md:py-8 animation-fade-in">
      <SeoHead 
        title="Deep IP Analysis & Blacklist Checker" 
        description="Perform deep reconnaissance on any IP address. Reveal location, ISP, proxy/VPN status, and check against global blacklists for fraud scoring." 
        isTool={true}
      />
      
      <div className="mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
          <Radar className="size-3.5 fill-current" /> Reconnaissance
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">IP Deep Analysis</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Scan any IP address for exact geolocation, ASN mapping, and deep security threat intelligence.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-black/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
        
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Enter IP address (e.g., 8.8.8.8) or leave blank for your own IP..." 
              value={ipInput} 
              onChange={(e) => setIpInput(e.target.value)} 
              className="w-full bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="md:w-auto w-full flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold rounded-2xl transition-all disabled:opacity-50 shadow-md active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />} 
            {isLoading ? 'Scanning...' : 'Analyze Vector'}
          </button>
        </form>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animation-fade-in">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield className="size-4 text-orange-500" /> Threat Intelligence
              </h3>
              
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative size-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="12" fill="none" />
                    <circle 
                      cx="64" cy="64" r="56" 
                      className={`${data.security.riskScore < 33 ? 'stroke-emerald-500' : data.security.riskScore < 66 ? 'stroke-amber-500' : 'stroke-red-500'} transition-all duration-1000`} 
                      strokeWidth="12" fill="none" 
                      strokeDasharray="351.8" 
                      strokeDashoffset={351.8 - (351.8 * data.security.riskScore) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">{data.security.riskScore}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Score</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskColor(data.security.riskScore)}`}>
                  {getRiskLabel(data.security.riskScore)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                  <span className="text-xs font-bold text-zinc-500 uppercase">VPN / Proxy</span>
                  {data.security.isVpn || data.security.isProxy ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-500"><ShieldAlert className="size-3.5" /> Detected</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500"><ShieldCheck className="size-3.5" /> Clean</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Datacenter / Hosting</span>
                  {data.security.isHosting ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500"><Server className="size-3.5" /> Yes</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500"><ShieldCheck className="size-3.5" /> No</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#0a0a0a] rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Connection Type</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                    {data.security.type} {data.security.isMobile && '(Mobile)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-sm">
               <div>
                 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Analyzed Vector</span>
                 <h2 className="text-3xl md:text-4xl font-black text-orange-500 tracking-tight font-mono">{data.ip}</h2>
               </div>
               <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                 <Network className="size-8 text-orange-500" />
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <MapPin className="size-4 text-orange-500" /> Geolocation Map
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Country</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-0.5">
                       <span className="text-xl">
                         {data.location.countryCode ? String.fromCodePoint(...[...data.location.countryCode.toUpperCase()].map(c => c.charCodeAt(0) + 127397)) : '🌐'}
                       </span>
                       {data.location.country} ({data.location.countryCode})
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Region & City</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{data.location.city}, {data.location.region} {data.location.zip}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coordinates</label>
                      <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg mt-1 truncate">
                        {data.location.lat}, {data.location.lon}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timezone</label>
                      <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg mt-1 truncate">
                        {data.location.timezone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Wifi className="size-4 text-orange-500" /> Network Infrastructure
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Internet Service Provider (ISP)</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{data.network.isp || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization / Carrier</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{data.network.org || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Autonomous System Number (ASN)</label>
                    <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg mt-1 truncate">
                      {data.network.asn || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reverse DNS Hostname</label>
                    <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg mt-1 truncate text-orange-600 dark:text-orange-400">
                      {data.network.reverse || 'No PTR Record Found'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
