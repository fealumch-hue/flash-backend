

// Standardized React import to resolve JSX namespace issues
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { playUISound } from '../services/soundService';

interface GateProps {
  onEnter: () => void;
}

const VALID_CODE = "SNOWFALL7477";

const Gate: React.FC<GateProps> = ({ onEnter }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle' || !code) return;

    setError(false);
    setStatus('submitting');
    playUISound('action');

    await new Promise(resolve => setTimeout(resolve, 800));

    if (code.trim() === VALID_CODE) {
      setStatus('success');
      playUISound('success');
      await new Promise(resolve => setTimeout(resolve, 1200)); // Delay for animation
      onEnter();
    } else {
      setError(true);
      setStatus('idle');
      playUISound('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(false);
    setCode(e.target.value.toUpperCase());
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-background text-gray-900 dark:text-white p-4 overflow-hidden relative transition-colors duration-500">
      {/* Abstract background elements - Dark mode only for these specific glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-0 dark:opacity-20 pointer-events-none transition-opacity duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 dark:bg-card/50 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group transition-colors duration-500">
          
          {/* Subtle sheen effect on card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="flex flex-col items-center gap-8 relative z-10">
            {/* Logo / Title Area */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icons.Flash className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-white/60 pb-1 transition-colors duration-500">
                Flash.
              </h1>
              <p className="text-gray-500 dark:text-white/40 text-sm font-medium tracking-wide mt-2 transition-colors duration-500">
                BETA ACCESS RESTRICTED
              </p>
            </motion.div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <motion.div
                    animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <input
                      type="password"
                      value={code}
                      onChange={handleChange}
                      placeholder="Enter Beta Access Code"
                      disabled={status !== 'idle'}
                      className={`w-full bg-gray-100 dark:bg-black/40 border ${error ? 'border-red-500/50 text-red-600 dark:text-red-200 focus:border-red-500' : 'border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-white/40'} rounded-xl px-4 py-4 text-center placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none transition-all duration-300 tracking-widest font-mono text-lg focus:ring-1 ${error ? 'focus:ring-red-500/20' : 'focus:ring-gray-400/20 dark:focus:ring-white/10'}`}
                      autoFocus
                    />
                  </motion.div>
                  
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute -bottom-6 left-0 right-0 text-center flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400 text-xs font-medium"
                      >
                         <Icons.Error className="w-3 h-3" />
                         <span>Access Denied</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                whileHover={status === 'idle' ? { scale: 1.02 } : {}}
                whileTap={status === 'idle' ? { scale: 0.98 } : {}}
                disabled={status !== 'idle' || !code}
                className={`w-full bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/15 border border-transparent dark:border-white/5 text-white font-medium py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${!code || status !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2">
                      <span>Enter Flash.</span>
                      <Icons.Flash className="w-4 h-4 fill-current" />
                    </motion.div>
                  )}
                  {status === 'submitting' && (
                    <motion.div key="submitting" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                      <Icons.Spinner className="w-5 h-5" />
                    </motion.div>
                  )}
                  {status === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-center gap-2">
                      <Icons.Check className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </div>
        </div>
        
        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mt-8 text-gray-400 dark:text-white/20 text-xs transition-colors duration-500"
        >
          <p>Restricted Environment v0.9.4</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Gate;