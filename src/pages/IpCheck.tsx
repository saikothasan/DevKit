import { useState, useEffect } from 'react';
import { SeoHead } from '@/components/SeoHead';
import { Search, MapPin, Globe, Shield, ShieldAlert, ShieldCheck, Network, Server, Wifi, Loader2, Radar, Copy, Check, Activity } from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
    // Initial fetch to get user's own IP data
    handleAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRiskColor = (score: number) => {
    if (score < 33) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/20';
    if (score < 66) return 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/20';
  };

  const getRiskLabel = (score: number) => {
    if (score < 33) return 'Clean / Safe';
    if (score < 66) return 'Suspicious';
    return 'High Risk Vector';
  };

  const circumference = 351.85; // 2 * Math.PI * 56

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
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-zinc-900 dark:text-white">IP Deep Analysis</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-3xl">Scan any IP address for exact geolocation, autonomous system mapping, and deep security threat intelligence.</p>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"></div>
        
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Target IP address (leave blank to scan your own origin)..." 
              value={ipInput} 
              onChange={(e) => setIpInput(e.target.value)} 
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-14 pr-4 py-4 text-[15px] font-medium outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="md:w-auto w-full flex items-center justify-center gap-2 px-10 py-4 bg-zinc-900 hover:bg-orange-500 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-orange-500 dark:hover:text-white font-bold rounded-2xl transition-all disabled:opacity-50 shadow-md active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />} 
            {isLoading ? 'Scanning...' : 'Analyze Vector'}
          </button>
        </form>
      </div>

      {isLoading && !data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animation-fade-in">
          <div className="lg:col-span-4 space-y-6">
            <div className="h-[400px] bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className="h-32 bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-[350px] bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800"></div>
              <div className="h-[350px] bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !data && (
         <div className="p-16 text-center bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl border-dashed shadow-sm">
           <div className="mx-auto size-20 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800">
             <Activity className="size-10 text-zinc-400" />
           </div>
           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Awaiting Target Vector</h3>
           <p className="text-zinc-500 max-w-md mx-auto">Enter an IPv4 or IPv6 address above to initialize deep packet inspection, geolocation plotting, and threat intelligence analysis.</p>
         </div>
      )}

      {data && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animation-fade-in">
          
          {/* Threat Intelligence Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <Shield className="size-4 text-orange-500" /> Threat Intelligence
              </h3>
              
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="relative size-40 mb-6 drop-shadow-xl">
                  <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
                    <circle cx="80" cy="80" r="70" className="stroke-zinc-100 dark:stroke-zinc-800/80" strokeWidth="12" fill="none" />
                    <circle 
                      cx="80" cy="80" r="70" 
                      className={`${data.security.riskScore < 33 ? 'stroke-emerald-500' : data.security.riskScore < 66 ? 'stroke-amber-500' : 'stroke-red-500'} transition-all duration-1500 ease-out`} 
                      strokeWidth="12" fill="none" 
                      strokeDasharray="439.8" 
                      strokeDashoffset={439.8 - (439.8 * data.security.riskScore) / 100} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{data.security.riskScore}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Score</span>
                  </div>
                </div>
                <span className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider border shadow-md ${getRiskColor(data.security.riskScore)}`}>
                  {getRiskLabel(data.security.riskScore)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">VPN / Proxy</span>
                  {data.security.isVpn || data.security.isProxy ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20"><ShieldAlert className="size-3.5" /> Detected</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><ShieldCheck className="size-3.5" /> Clean</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Datacenter / Hosting</span>
                  {data.security.isHosting ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><Server className="size-3.5" /> Yes</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><ShieldCheck className="size-3.5" /> No</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Connection Type</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    {data.security.type} {data.security.isMobile && <span className="text-orange-500 ml-1">(Mobile)</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Stat Bar */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-sm relative group overflow-hidden">
               <div className="relative z-10">
                 <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Analyzed Vector</span>
                 <div className="flex items-center gap-4">
                   <h2 className="text-3xl md:text-5xl font-black text-orange-500 tracking-tight font-mono drop-shadow-sm">{data.ip}</h2>
                   <button 
                     onClick={() => handleCopy(data.ip, 'ip')}
                     className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-zinc-500 transition-all border border-zinc-200 dark:border-zinc-800 hover:border-orange-500"
                   >
                     {copiedId === 'ip' ? <Check className="size-5" /> : <Copy className="size-5" />}
                   </button>
                 </div>
               </div>
               <div className="size-20 md:size-24 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                 <Network className="size-10 md:size-12 text-orange-500 opacity-80" />
               </div>
               <div className="absolute -right-10 -bottom-10 size-40 bg-orange-500/10 blur-3xl rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Geolocation Card */}
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <MapPin className="size-4 text-orange-500" /> Geolocation Map
                </h3>
                
                {/* Visual Map Integration */}
                <div className="w-full h-32 rounded-xl mb-6 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative bg-zinc-100 dark:bg-zinc-900">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.location.lon-0.5},${data.location.lat-0.5},${data.location.lon+0.5},${data.location.lat+0.5}&layer=mapnik&marker=${data.location.lat},${data.location.lon}`} 
                    className="border-0 dark:invert dark:hue-rotate-180 dark:brightness-90 dark:contrast-125 filter transition-all duration-700 pointer-events-none" 
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-xl"></div>
                </div>

                <div className="space-y-4 mt-auto">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Country</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mt-1">
                       <span className="text-xl leading-none drop-shadow-sm">
                         {data.location.countryCode ? String.fromCodePoint(...[...data.location.countryCode.toUpperCase()].map(c => c.charCodeAt(0) + 127397)) : '🌐'}
                       </span>
                       {data.location.country} <span className="text-zinc-400">({data.location.countryCode})</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Region & City</label>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{data.location.city}, {data.location.region} {data.location.zip}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coordinates</label>
                      <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg mt-1.5 truncate flex justify-between items-center group/copy">
                        <span className="truncate">{data.location.lat}, {data.location.lon}</span>
                        <button onClick={() => handleCopy(`${data.location.lat}, ${data.location.lon}`, 'coords')} className="text-zinc-400 hover:text-orange-500">
                           {copiedId === 'coords' ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timezone</label>
                      <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg mt-1.5 truncate">
                        {data.location.timezone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Infrastructure Card */}
              <div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Wifi className="size-4 text-orange-500" /> Network Infrastructure
                </h3>
                <div className="space-y-6 mt-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Internet Service Provider (ISP)</label>
                    <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 line-clamp-2">
                      {data.network.isp || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organization / Carrier</label>
                    <div className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5 line-clamp-2">
                      {data.network.org || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Autonomous System Number (ASN)</label>
                    <div className="text-xs font-mono font-semibold bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg mt-1.5 truncate flex justify-between items-center group/copy">
                      <span className="truncate">{data.network.asn || 'N/A'}</span>
                      {data.network.asn && (
                        <button onClick={() => handleCopy(data.network.asn, 'asn')} className="text-zinc-400 hover:text-orange-500">
                          {copiedId === 'asn' ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Reverse DNS Hostname</label>
                    <div className="text-xs font-mono font-semibold bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400 p-3 rounded-lg mt-1.5 break-all flex justify-between items-start gap-2 group/copy">
                      <span>{data.network.reverse || 'No PTR Record Found'}</span>
                      {data.network.reverse && (
                        <button onClick={() => handleCopy(data.network.reverse, 'rev')} className="text-orange-400 hover:text-orange-600 shrink-0">
                          {copiedId === 'rev' ? <Check className="size-3.5" /> : <Copy className="size-3.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />}
                        </button>
                      )}
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
