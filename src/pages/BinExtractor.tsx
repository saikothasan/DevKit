import { useState } from 'react';
import { Search } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { ToolPageHeader } from '../components/ToolPageHeader';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface ExtractorResponse {
  success: boolean;
  totalFound?: number;
  bins?: string[];
  error?: string;
  meta?: {
    traceId: string;
    processingTimeMs: number;
    targetFormat: string;
  };
}

export default function BinExtractor() {
  const [inputText, setInputText] = useState<string>('');
  const [extractedBins, setExtractedBins] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [extract8Digit, setExtract8Digit] = useState<boolean>(false);
  const [processMetrics, setProcessMetrics] = useState<string | null>(null);
  
  const { copy } = useCopyToClipboard();

  const handleExtract = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setProcessMetrics(null);
    try {
      const response = await fetch('/api/bin-extractor/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, extract8Digit }),
      });

      const data = (await response.json()) as ExtractorResponse;
      
      if (data.success && data.bins) {
        setExtractedBins(data.bins);
        setHasExtracted(true);
        if (data.meta) {
          setProcessMetrics(`Processed in ${data.meta.processingTimeMs}ms`);
        }
      } else {
        console.error(data.error);
        alert(data.error || 'Failed to extract BINs');
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      alert('A network error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyAll = () => {
    if (extractedBins.length > 0) {
      copy(extractedBins.join('\n'));
    }
  };

  const handleClear = () => {
    setInputText('');
    setExtractedBins([]);
    setHasExtracted(false);
    setProcessMetrics(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 md:p-12">
      <SeoHead 
        title="BIN Extractor - Professional Developer Tools" 
        description="Instantly extract and deduplicate valid Bank Identification Numbers (BINs) from messy text dumps." 
      />
      
      <div className="max-w-5xl mx-auto space-y-8">
        <ToolPageHeader 
          title="BIN Extractor" 
          description="Parse raw text dumps, logs, or unstructured data to instantly extract unique Bank Identification Numbers." 
          badge="Utility"
          badgeIcon={Search}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="raw-text" className="text-sm font-medium tracking-tight">
                Raw Text Dump
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={extract8Digit}
                  onChange={(e) => setExtract8Digit(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900"
                />
                Extract modern 8-digit BINs
              </label>
            </div>
            <textarea
              id="raw-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your dirty text dump here (e.g., 'Zalando: 475128...' or '377852 - Westpac...')"
              className="flex-1 min-h-[400px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm font-mono shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleExtract}
                disabled={isProcessing || !inputText.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Extract BINs'}
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-2.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between h-5">
              <label className="text-sm font-medium tracking-tight">
                Extracted BINs <span className="text-zinc-500 text-xs ml-2">({extractedBins.length} found)</span>
              </label>
              {extractedBins.length > 0 && (
                <div className="flex items-center gap-4">
                  {processMetrics && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                      {processMetrics}
                    </span>
                  )}
                  <button
                    onClick={handleCopyAll}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Copy All
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 relative overflow-hidden flex flex-col shadow-inner">
              {extractedBins.length > 0 ? (
                <textarea
                  readOnly
                  value={extractedBins.join('\n')}
                  className="w-full h-full min-h-[400px] bg-transparent font-mono text-sm focus:outline-none resize-none"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 h-full min-h-[400px]">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <p>{hasExtracted ? 'No valid BINs found.' : 'Results will appear here.'}</p>
                </div>
              )}
            </div>

            {/* Telegram Channel Banner */}
            <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Need more premium tools, scripts, and bypasses? 
                <a 
                  href="https://t.me/drkingbd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Join @drkingbd on Telegram
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
