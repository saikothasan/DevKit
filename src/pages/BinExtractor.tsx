import { useState, useCallback } from 'react';
import { Scissors, Copy, Trash2, Download, Check, AlertCircle } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { SeoHead } from '@/components/SeoHead';
import { useToast } from '@/context/ToastContext';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

export const BinExtractor = () => {
  const [input, setInput] = useState('');
  const [extracted, setExtracted] = useState<string[]>([]);
  const [uniqueOnly, setUniqueOnly] = useState(true);
  const { showToast } = useToast();
  const { copy } = useCopyToClipboard();

  const handleExtract = useCallback(() => {
    // Matches 6 to 8 digit BIN patterns typically found at the start of CC strings
    const binRegex = /\b\d{6,8}\b/g;
    const matches = input.match(binRegex) || [];
    
    const results = uniqueOnly ? Array.from(new Set(matches)) : matches;
    
    setExtracted(results);
    
    if (results.length > 0) {
      showToast({ 
        title: 'Extraction Complete', 
        message: `Successfully extracted ${results.length} BINs.`, 
        type: 'success' 
      });
    } else {
      showToast({ 
        title: 'No BINs Found', 
        message: 'Could not find any 6-8 digit numbers in the input.', 
        type: 'warning' 
      });
    }
  }, [input, uniqueOnly, showToast]);

  const handleDownload = () => {
    const blob = new Blob([extracted.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_bins_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <SeoHead 
        title="BIN Extractor - Bulk Card BIN Tools" 
        description="High-speed professional BIN extractor. Extract 6-8 digit Bank Identification Numbers from bulk data lists instantly."
      />
      
      <ToolPageHeader 
        title="BIN Extractor" 
        description="Extract Bank Identification Numbers (BIN) from any bulk text or card list."
        icon={Scissors}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">Raw Data Input</label>
            <button 
              onClick={() => setInput('')}
              className="text-xs text-neutral-500 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your card list or bulk data here..."
            className="w-full h-80 p-4 bg-neutral-900 border border-white/10 rounded-2xl text-neutral-200 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={uniqueOnly} 
                onChange={(e) => setUniqueOnly(e.target.checked)}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${uniqueOnly ? 'bg-blue-600 border-blue-500' : 'border-white/20 bg-white/5'}`}>
                {uniqueOnly && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-neutral-400 group-hover:text-neutral-200">Unique Only</span>
            </label>
            <button
              onClick={handleExtract}
              disabled={!input.trim()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              Extract BINs
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">
              Extracted BINs <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-full text-xs text-neutral-500">{extracted.length}</span>
            </label>
            <div className="flex gap-2">
              <button 
                onClick={() => copy(extracted.join('\n'))}
                disabled={extracted.length === 0}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Copy All"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDownload}
                disabled={extracted.length === 0}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Download TXT"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="w-full h-80 bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden relative group">
            {extracted.length > 0 ? (
              <div className="h-full overflow-y-auto p-4 font-mono text-sm grid grid-cols-2 sm:grid-cols-3 gap-2">
                {extracted.map((bin, index) => (
                  <div key={`${bin}-${index}`} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded text-blue-400 text-center hover:border-blue-500/50 transition-colors">
                    {bin}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <Scissors className="w-8 h-8 opacity-20" />
                <p className="text-sm">No BINs extracted yet</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-400 leading-relaxed">
              <strong className="text-neutral-300 block mb-1">Pro Tip:</strong>
              This tool automatically filters 6 to 8 digit numerical strings, which are the standard for modern IIN/BIN identification. For best results, paste raw card data like <code className="text-blue-400">411111xxxxxxxxxx|MM|YY|CVV</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinExtractor;
