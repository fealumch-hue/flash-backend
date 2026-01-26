
// Standardized React import to resolve JSX namespace issues
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { humanizeText } from '../services/geminiService';
import { playUISound } from '../services/soundService';

const HumanizerTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    playUISound('action');
    
    try {
      const result = await humanizeText(input);
      setOutput(result || 'Conversion protocol failed.');
      playUISound('success');
    } catch (error) {
      setOutput('Error: Uplink interrupted during humanization sequence.');
      playUISound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    playUISound('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    playUISound('switch');
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#080808] overflow-hidden">
      <div className="h-24 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-10 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tighter">Humanizer Protocol.</h2>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest text-[10px]">Academic AI-Bypass Matrix</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleClear}
            className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Clear Matrix
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Input */}
        <div className="flex-1 flex flex-col p-8 border-r border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
              <Icons.Brain className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Robotic / AI Draft</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste robotic text or AI-generated draft here..."
            className="flex-1 w-full bg-gray-50 dark:bg-white/[0.02] border border-transparent dark:border-white/5 rounded-[2rem] p-10 outline-none focus:border-blue-500/30 text-lg font-medium resize-none transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
          />
        </div>

        {/* Middle: Action Button */}
        <div className="lg:w-24 shrink-0 flex items-center justify-center py-4 lg:py-0 relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleHumanize}
            disabled={!input.trim() || isProcessing}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all z-10 ${
              isProcessing 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <Icons.Spinner className="w-6 h-6 text-white" />
            ) : (
              <Icons.ArrowRight className="w-6 h-6 text-white" />
            )}
          </motion.button>
          
          {/* Subtle connecting line for desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-100 dark:via-white/5 to-transparent" />
        </div>

        {/* Right: Output */}
        <div className="flex-1 flex flex-col p-8 bg-gray-50/30 dark:bg-white/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-blue-500">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icons.Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Materialized Humanized Result</span>
            </div>
            
            <AnimatePresence>
              {output && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
                >
                  {copied ? (
                    <>
                      <Icons.Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Icons.Clipboard className="w-3.5 h-3.5" />
                      <span>Copy Result</span>
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex-1 w-full bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-[2rem] p-10 text-lg font-medium leading-relaxed overflow-y-auto whitespace-pre-wrap select-text selection:bg-blue-500/20 selection:text-blue-500">
            {output || (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4">
                <Icons.Sparkles className="w-12 h-12" />
                <p className="text-sm font-bold uppercase tracking-widest max-w-[200px]">Waiting for Humanization Protocol</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanizerTab;
