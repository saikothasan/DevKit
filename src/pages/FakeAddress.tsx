import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { Copy, Check, Sparkles, MapPin, UserSquare2, Phone, Hash, Globe, Loader2, FileCode2, Database, Shield, ChevronRight, ArrowLeft } from 'lucide-react';

const SUPPORTED_LOCALES: Record<string, { code: string; name: string; region: string; flag: string }> = {
  // North America
  'us': { code: 'en_US', name: 'United States', region: 'North America', flag: '🇺🇸' },
  'ca': { code: 'en_CA', name: 'Canada (English)', region: 'North America', flag: '🇨🇦' },
  'fr-ca': { code: 'fr_CA', name: 'Canada (French)', region: 'North America', flag: '🇨🇦' },
  'mx': { code: 'es_MX', name: 'Mexico', region: 'North America', flag: '🇲🇽' },
  
  // South America
  'br': { code: 'pt_BR', name: 'Brazil', region: 'South America', flag: '🇧🇷' },
  
  // Europe
  'cz': { code: 'cs_CZ', name: 'Czechia', region: 'Europe', flag: '🇨🇿' },
  'cy': { code: 'cy', name: 'Wales', region: 'Europe', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  'dk': { code: 'da', name: 'Denmark', region: 'Europe', flag: '🇩🇰' },
  'de': { code: 'de', name: 'Germany', region: 'Europe', flag: '🇩🇪' },
  'at': { code: 'de_AT', name: 'Austria', region: 'Europe', flag: '🇦🇹' },
  'ch': { code: 'de_CH', name: 'Switzerland (German)', region: 'Europe', flag: '🇨🇭' },
  'gr': { code: 'el', name: 'Greece', region: 'Europe', flag: '🇬🇷' },
  'gb': { code: 'en_GB', name: 'Great Britain', region: 'Europe', flag: '🇬🇧' },
  'ie': { code: 'en_IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪' },
  'es': { code: 'es', name: 'Spain', region: 'Europe', flag: '🇪🇸' },
  'fi': { code: 'fi', name: 'Finland', region: 'Europe', flag: '🇫🇮' },
  'fr': { code: 'fr', name: 'France', region: 'Europe', flag: '🇫🇷' },
  'be': { code: 'fr_BE', name: 'Belgium (French)', region: 'Europe', flag: '🇧🇪' },
  'ch-fr': { code: 'fr_CH', name: 'Switzerland (French)', region: 'Europe', flag: '🇨🇭' },
  'lu': { code: 'fr_LU', name: 'Luxembourg', region: 'Europe', flag: '🇱🇺' },
  'hr': { code: 'hr', name: 'Croatia', region: 'Europe', flag: '🇭🇷' },
  'hu': { code: 'hu', name: 'Hungary', region: 'Europe', flag: '🇭🇺' },
  'it': { code: 'it', name: 'Italy', region: 'Europe', flag: '🇮🇹' },
  'lv': { code: 'lv', name: 'Latvia', region: 'Europe', flag: '🇱🇻' },
  'mk': { code: 'mk', name: 'North Macedonia', region: 'Europe', flag: '🇲🇰' },
  'no': { code: 'nb_NO', name: 'Norway', region: 'Europe', flag: '🇳🇴' },
  'nl': { code: 'nl', name: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  'nl-be': { code: 'nl_BE', name: 'Belgium (Dutch)', region: 'Europe', flag: '🇧🇪' },
  'pl': { code: 'pl', name: 'Poland', region: 'Europe', flag: '🇵🇱' },
  'pt': { code: 'pt_PT', name: 'Portugal', region: 'Europe', flag: '🇵🇹' },
  'ro': { code: 'ro', name: 'Romania', region: 'Europe', flag: '🇷🇴' },
  'md': { code: 'ro_MD', name: 'Moldova', region: 'Europe', flag: '🇲🇩' },
  'ru': { code: 'ru', name: 'Russia', region: 'Europe', flag: '🇷🇺' },
  'sk': { code: 'sk', name: 'Slovakia', region: 'Europe', flag: '🇸🇰' },
  'si': { code: 'sl_SI', name: 'Slovenia', region: 'Europe', flag: '🇸🇮' },
  'rs': { code: 'sr_RS_latin', name: 'Serbia (Latin)', region: 'Europe', flag: '🇷🇸' },
  'se': { code: 'sv', name: 'Sweden', region: 'Europe', flag: '🇸🇪' },
  'ua': { code: 'uk', name: 'Ukraine', region: 'Europe', flag: '🇺🇦' },

  // Asia
  'bd': { code: 'bn_BD', name: 'Bangladesh', region: 'Asia', flag: '🇧🇩' },
  'mv': { code: 'dv', name: 'Maldives', region: 'Asia', flag: '🇲🇻' },
  'hk': { code: 'en_HK', name: 'Hong Kong', region: 'Asia', flag: '🇭🇰' },
  'in': { code: 'en_IN', name: 'India (English)', region: 'Asia', flag: '🇮🇳' },
  'in-ta': { code: 'ta_IN', name: 'India (Tamil)', region: 'Asia', flag: '🇮🇳' },
  'id': { code: 'id_ID', name: 'Indonesia', region: 'Asia', flag: '🇮🇩' },
  'jp': { code: 'ja', name: 'Japan', region: 'Asia', flag: '🇯🇵' },
  'kr': { code: 'ko', name: 'South Korea', region: 'Asia', flag: '🇰🇷' },
  'np': { code: 'ne', name: 'Nepal', region: 'Asia', flag: '🇳🇵' },
  'th': { code: 'th', name: 'Thailand', region: 'Asia', flag: '🇹🇭' },
  'vn': { code: 'vi', name: 'Vietnam', region: 'Asia', flag: '🇻🇳' },
  'cn': { code: 'zh_CN', name: 'China', region: 'Asia', flag: '🇨🇳' },
  'tw': { code: 'zh_TW', name: 'Taiwan', region: 'Asia', flag: '🇹🇼' },

  // Middle East & Central Asia
  'ar': { code: 'ar', name: 'Arabic (Generic)', region: 'Middle East', flag: '🇦🇪' },
  'az': { code: 'az', name: 'Azerbaijan', region: 'Middle East', flag: '🇦🇿' },
  'ir': { code: 'fa', name: 'Iran (Farsi)', region: 'Middle East', flag: '🇮🇷' },
  'il': { code: 'he', name: 'Israel (Hebrew)', region: 'Middle East', flag: '🇮🇱' },
  'am': { code: 'hy', name: 'Armenia', region: 'Middle East', flag: '🇦🇲' },
  'ge': { code: 'ka_GE', name: 'Georgia', region: 'Middle East', flag: '🇬🇪' },
  'iq': { code: 'ku_ckb', name: 'Kurdish (Sorani)', region: 'Middle East', flag: '🇮🇶' },
  'tr-ku': { code: 'ku_kmr_latin', name: 'Kurdish (Kurmanji)', region: 'Middle East', flag: '🇹🇷' },
  'tr': { code: 'tr', name: 'Turkey', region: 'Middle East', flag: '🇹🇷' },
  'pk': { code: 'ur', name: 'Pakistan (Urdu)', region: 'Middle East', flag: '🇵🇰' },
  'uz': { code: 'uz_UZ_latin', name: 'Uzbekistan', region: 'Middle East', flag: '🇺🇿' },

  // Africa
  'za-af': { code: 'af_ZA', name: 'South Africa (Afrikaans)', region: 'Africa', flag: '🇿🇦' },
  'za-en': { code: 'en_ZA', name: 'South Africa (English)', region: 'Africa', flag: '🇿🇦' },
  'za-zu': { code: 'zu_ZA', name: 'South Africa (Zulu)', region: 'Africa', flag: '🇿🇦' },
  'gh': { code: 'en_GH', name: 'Ghana', region: 'Africa', flag: '🇬🇭' },
  'ng-en': { code: 'en_NG', name: 'Nigeria (English)', region: 'Africa', flag: '🇳🇬' },
  'ng-yo': { code: 'yo_NG', name: 'Nigeria (Yoruba)', region: 'Africa', flag: '🇳🇬' },
  'sn': { code: 'fr_SN', name: 'Senegal', region: 'Africa', flag: '🇸🇳' },

  // Oceania
  'au': { code: 'en_AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺' },

  // Global Contexts
  'en': { code: 'en', name: 'Global (English)', region: 'Global', flag: '🌍' },
  'eo': { code: 'eo', name: 'Esperanto', region: 'Global', flag: '🌍' },
};

type Identity = {
  fullName: string; phone: string; idNumber: string; street: string;
  city: string; state: string; zip: string;
};

const FAQ_DATA = [
  { question: "What is a fake address generator used for?", answer: "A mock identity or fake address generator is utilized by developers, QA testers, and designers to populate databases, prototype applications, and perform form validation without exposing real PII (Personally Identifiable Information)." },
  { question: "Are these identities real people?", answer: "No. The data is entirely synthesized algorithmically using common regional name patterns and realistic (but dummy) street formats. It prevents privacy leaks in development environments." },
  { question: "How many regional locales are supported?", answer: "The localization engine supports rigorous regional constraints, generating culturally accurate names, appropriate state/province abbreviations, and correct postal code formats for regions worldwide." }
];

export default function FakeAddress() {
  const { locale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { copiedText, copy } = useCopyToClipboard();

  useEffect(() => {
    if (locale && !SUPPORTED_LOCALES[locale]) {
      navigate('/fake-address', { replace: true });
    }
  }, [locale, navigate]);

  const activeLocaleData = locale ? SUPPORTED_LOCALES[locale] : null;

  const generateIdentity = async () => {
    if (!activeLocaleData) return;
    setIsGenerating(true);
    
    try {
      const { allFakers } = await import('@faker-js/faker');
      const faker = allFakers[activeLocaleData.code as keyof typeof allFakers] || allFakers['en_US'];

      const safeCall = (fn: () => string, fallback: string = 'N/A') => {
        try { const res = fn(); return res === null || res === undefined || res.trim() === '' ? fallback : res; } 
        catch { return fallback; }
      };

      setIdentity({
        fullName: safeCall(() => faker.person.fullName()),
        phone: safeCall(() => faker.phone.number()),
        idNumber: safeCall(() => faker.string.alphanumeric({ length: 10, casing: 'upper' })),
        street: safeCall(() => faker.location.streetAddress()),
        city: safeCall(() => faker.location.city()),
        state: safeCall(() => faker.location.state()),
        zip: safeCall(() => faker.location.zipCode()),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formattedOutput = identity ? 
    `${identity.fullName}\n${identity.street}\n${identity.city}, ${identity.state !== 'N/A' ? identity.state + ' ' : ''}${identity.zip}\nPhone: ${identity.phone}\nID Vector: ${identity.idNumber}` : '';

  if (!locale) {
    const groupedLocales = Object.entries(SUPPORTED_LOCALES).reduce((acc, [slug, data]) => {
      if (!acc[data.region]) acc[data.region] = [];
      acc[data.region].push({ slug, ...data });
      return acc;
    }, {} as Record<string, Array<{ slug: string; code: string; name: string; flag: string; }>>);

    return (
      <div className="max-w-6xl mx-auto md:py-8 animation-fade-in">
        <SeoHead 
          title="Fake Address Generator Directory | Global Mock Identities" 
          description="Browse and generate localized fake addresses, random names, and dummy profiles for specific global regions. Comprehensive mock identity tools for developers." 
          keywords="fake address generator directory, global mock identity, random address by country, test user profiles"
          isTool={true}
          faqData={FAQ_DATA}
        />
        
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-6">
            <Globe className="size-3.5 fill-current" /> Global Identity Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Select Localization Profile</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">Choose a specific region to generate culturally accurate mock identities and mathematically valid regional address formats.</p>
        </div>

        <div className="grid gap-12 mb-16">
          {Object.entries(groupedLocales).sort(([a], [b]) => a.localeCompare(b)).map(([region, locales]) => (
            <section key={region}>
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin className="size-4" /> {region}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {locales.sort((a, b) => a.name.localeCompare(b.name)).map(loc => (
                  <Link 
                    key={loc.slug} 
                    to={`/fake-address/${loc.slug}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-sm">{loc.flag}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors">{loc.name}</span>
                    </div>
                    <ChevronRight className="size-4 text-zinc-300 dark:text-zinc-700 group-hover:text-orange-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto md:py-8 animation-fade-in">
      <SeoHead 
        title={`${activeLocaleData?.name} Fake Address Generator | Mock Identity API`}
        description={`Generate localized fake addresses, random names, and dummy profiles specifically for ${activeLocaleData?.name}. High-fidelity mock identity vectors for QA testing.`}
        keywords={`fake address generator ${activeLocaleData?.name}, random address ${activeLocaleData?.name}, mock identity ${activeLocaleData?.name}, dummy data ${activeLocaleData?.name}`}
        isTool={true}
        faqData={FAQ_DATA}
      />
      
      <div className="mb-8 md:mb-10">
        <Link to="/fake-address" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6">
          <ArrowLeft className="size-4" /> Back to Global Directory
        </Link>
        
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl filter drop-shadow-md">{activeLocaleData?.flag}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{activeLocaleData?.name} Identity Generator</h1>
        </div>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">Instantly generate structurally valid identity vectors and localized addresses strictly conforming to {activeLocaleData?.name} formats.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/20 dark:shadow-black/20 p-6 md:p-10 mb-16">
        
        {identity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 shadow-inner">
            <div className="space-y-5">
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><UserSquare2 className="size-3.5" /> Full Name</label><div className="text-xl font-bold text-zinc-900 dark:text-white">{identity.fullName}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Phone className="size-3.5" /> Phone Number</label><div className="text-lg font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.phone}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Hash className="size-3.5" /> Identity Vector ID</label><div className="text-lg font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.idNumber}</div></div>
            </div>
            <div className="space-y-5 md:border-l border-zinc-200 dark:border-zinc-800 md:pl-8">
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><MapPin className="size-3.5" /> Street Address</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.street}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">City & Region</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.city}{identity.state !== 'N/A' ? `, ${identity.state}` : ''}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Postal Code</label><div className="text-lg font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.zip}</div></div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed mb-8 transition-colors">
            <span className="text-6xl filter drop-shadow-sm mb-4 grayscale opacity-50">{activeLocaleData?.flag}</span>
            <p className="text-zinc-500 font-medium">System ready. Click generate to construct a localized profile.</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={generateIdentity} disabled={isGenerating} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-base font-bold rounded-2xl hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-70">
            {isGenerating ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
            {isGenerating ? 'Synthesizing Profile...' : `Generate ${activeLocaleData?.name} Profile`}
          </button>
          <button onClick={() => copy(formattedOutput)} disabled={!identity || isGenerating} className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${copiedText ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'}`}>
            {copiedText ? <Check className="size-5" /> : <Copy className="size-5" />}
            {copiedText ? 'Vector Copied' : 'Copy Full Data'}
          </button>
        </div>
      </div>

      <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Why Use a Localized Identity Generator?</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-3">
            <div className="size-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 border border-orange-500/20 mb-4"><Database className="size-5" /></div>
            <h3 className="font-bold text-lg">Database Seeding</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Instantly populate pre-production databases with thousands of localized records. Ensures that pagination, sorting, and regional search algorithms can be tested comprehensively before launch.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20 mb-4"><FileCode2 className="size-5" /></div>
            <h3 className="font-bold text-lg">Strict Form Validation</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">QA teams require accurately formatted edge-case addresses to stress-test UI inputs. Generate complex international postal codes and distinct regional phone formatting patterns securely.</p>
          </div>
          <div className="space-y-3">
            <div className="size-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-4"><Shield className="size-5" /></div>
            <h3 className="font-bold text-lg">Maintain Compliance</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Prevent data leaks and GDPR violations. By utilizing synthesized mock identities, guarantee that no real PII (Personally Identifiable Information) enters non-production environments.</p>
          </div>
        </div>
      </article>

    </div>
  );
}
