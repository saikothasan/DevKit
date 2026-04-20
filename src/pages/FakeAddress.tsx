import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { 
  Copy, Check, Sparkles, MapPin, UserSquare2, Phone, Hash, Globe, 
  Loader2, FileCode2, Database, Shield, ChevronRight, ArrowLeft,
  Mail, Calendar, Briefcase, Building2
} from 'lucide-react';

// Static import replacing the dynamic import
import { allFakers } from '@faker-js/faker';

const SUPPORTED_LOCALES: Record<string, { code: string; name: string; region: string; flag: string }> = {
  'us': { code: 'en_US', name: 'United States', region: 'North America', flag: '🇺🇸' },
  'ca': { code: 'en_CA', name: 'Canada', region: 'North America', flag: '🇨🇦' },
  'mx': { code: 'es_MX', name: 'Mexico', region: 'North America', flag: '🇲🇽' },
  'gb': { code: 'en_GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  'de': { code: 'de', name: 'Germany', region: 'Europe', flag: '🇩🇪' },
  'fr': { code: 'fr', name: 'France', region: 'Europe', flag: '🇫🇷' },
  'it': { code: 'it', name: 'Italy', region: 'Europe', flag: '🇮🇹' },
  'es': { code: 'es', name: 'Spain', region: 'Europe', flag: '🇪🇸' },
  'nl': { code: 'nl', name: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  'ru': { code: 'ru', name: 'Russia', region: 'Europe', flag: '🇷🇺' },
  'au': { code: 'en_AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺' },
  'br': { code: 'pt_BR', name: 'Brazil', region: 'South America', flag: '🇧🇷' },
  'jp': { code: 'ja', name: 'Japan', region: 'Asia', flag: '🇯🇵' },
  'kr': { code: 'ko', name: 'South Korea', region: 'Asia', flag: '🇰🇷' },
  'cn': { code: 'zh_CN', name: 'China', region: 'Asia', flag: '🇨🇳' },
  'in': { code: 'en_IND', name: 'India', region: 'Asia', flag: '🇮🇳' },
  'bd': { code: 'bn_BD', name: 'Bangladesh', region: 'Asia', flag: '🇧🇩' },
  'za': { code: 'af_ZA', name: 'South Africa', region: 'Africa', flag: '🇿🇦' },
  'ng': { code: 'en_NG', name: 'Nigeria', region: 'Africa', flag: '🇳🇬' },
  'ae': { code: 'ar', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪' },
  'sa': { code: 'ar', name: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦' },
  'tr': { code: 'tr', name: 'Turkey', region: 'Middle East', flag: '🇹🇷' }
};

type Identity = {
  fullName: string; 
  email: string;
  phone: string; 
  idNumber: string; 
  dateOfBirth: string;
  jobTitle: string;
  company: string;
  street: string;
  city: string; 
  state: string; 
  zip: string;
  country: string;
  avatar: string;
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

  const generateIdentity = () => {
    if (!activeLocaleData) return;
    setIsGenerating(true);
    
    // Simulate a brief delay for UI/UX feedback before synchronous generation
    setTimeout(() => {
      try {
        const faker = allFakers[activeLocaleData.code as keyof typeof allFakers] || allFakers['en_US'];

        const safeCall = (fn: () => string, fallback: string = 'N/A') => {
          try { const res = fn(); return res === null || res === undefined || res.trim() === '' ? fallback : res; } 
          catch { return fallback; }
        };

        setIdentity({
          fullName: safeCall(() => faker.person.fullName()),
          email: safeCall(() => faker.internet.email()),
          phone: safeCall(() => faker.phone.number()),
          idNumber: safeCall(() => faker.string.alphanumeric({ length: 10, casing: 'upper' })),
          dateOfBirth: safeCall(() => faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toLocaleDateString()),
          jobTitle: safeCall(() => faker.person.jobTitle()),
          company: safeCall(() => faker.company.name()),
          street: safeCall(() => faker.location.streetAddress()),
          city: safeCall(() => faker.location.city()),
          state: safeCall(() => faker.location.state()),
          zip: safeCall(() => faker.location.zipCode()),
          country: safeCall(() => faker.location.country()),
          avatar: safeCall(() => faker.image.avatar()),
        });
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  const formattedOutput = identity ? 
    `[Personal Information]\nName: ${identity.fullName}\nEmail: ${identity.email}\nPhone: ${identity.phone}\nDOB: ${identity.dateOfBirth}\nID Vector: ${identity.idNumber}\n\n[Employment]\nJob Title: ${identity.jobTitle}\nCompany: ${identity.company}\n\n[Location]\nStreet: ${identity.street}\nCity: ${identity.city}\nState/Province: ${identity.state}\nPostal Code: ${identity.zip}\nCountry: ${identity.country}` : '';

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
            
            {/* Column 1: Personal & Employment */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <img src={identity.avatar} alt="Avatar" className="size-16 rounded-full bg-zinc-200 dark:bg-zinc-800 object-cover shadow-sm" />
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1"><UserSquare2 className="size-3.5" /> Full Name</label>
                  <div className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{identity.fullName}</div>
                </div>
              </div>

              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Mail className="size-3.5" /> Email Address</label><div className="text-base font-medium text-zinc-900 dark:text-white truncate">{identity.email}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Phone className="size-3.5" /> Phone Number</label><div className="text-base font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.phone}</div></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Calendar className="size-3.5" /> Date of Birth</label><div className="text-base font-medium text-zinc-900 dark:text-white">{identity.dateOfBirth}</div></div>
                <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Hash className="size-3.5" /> Vector ID</label><div className="text-base font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.idNumber}</div></div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="mb-4"><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Briefcase className="size-3.5" /> Job Title</label><div className="text-base font-medium text-zinc-900 dark:text-white">{identity.jobTitle}</div></div>
                <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Building2 className="size-3.5" /> Company</label><div className="text-base font-medium text-zinc-900 dark:text-white">{identity.company}</div></div>
              </div>
            </div>

            {/* Column 2: Location Information */}
            <div className="space-y-6 md:border-l border-zinc-200 dark:border-zinc-800 md:pl-8 flex flex-col justify-center">
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><MapPin className="size-3.5" /> Street Address</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.street}</div></div>
              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">City</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.city}</div></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">State/Province</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.state}</div></div>
                <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Postal Code</label><div className="text-lg font-medium text-zinc-900 dark:text-white font-mono bg-zinc-200/50 dark:bg-zinc-800/50 inline-block px-3 py-1 rounded-lg">{identity.zip}</div></div>
              </div>

              <div><label className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"><Globe className="size-3.5" /> Country</label><div className="text-lg font-medium text-zinc-900 dark:text-white">{identity.country}</div></div>
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
