

// Standardized React import to resolve JSX namespace issues
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Fix: Using standard modular SDK imports from firebase/auth to resolve export member errors
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Icons } from './Icons';
import { playUISound } from '../services/soundService';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    setError('');
    setStatus('loading');
    playUISound('action');

    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setError('Required fields are missing.');
      setStatus('idle');
      return;
    }

    try {
      await setPersistence(
        auth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } else {
        await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      }
      
      setStatus('success');
      playUISound('success');
      await new Promise(resolve => setTimeout(resolve, 1200));
      onSuccess();

    } catch (err: any) {
      const errorCode = err.code;
      console.error("Auth error code:", errorCode);
      playUISound('error');
      
      switch (errorCode) {
        case 'auth/invalid-credential':
          setError('Credentials rejected. Verify email and password precision.');
          break;
        case 'auth/user-not-found':
          setError('Account not identified. Verify entry.');
          break;
        case 'auth/wrong-password':
          setError('Password mismatch. Sequence rejected.');
          break;
        case 'auth/email-already-in-use':
          setError('Identity conflict. Email already registered.');
          break;
        case 'auth/weak-password':
          setError('Security threshold failed. Use 6+ characters.');
          break;
        case 'auth/invalid-email':
          setError('Malformed identity. Use a valid email format.');
          break;
        case 'auth/network-request-failed':
          setError('Material required. Check network uplink.');
          break;
        default:
          setError('Protocol failure. Entry denied.');
      }
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-background text-gray-900 dark:text-white p-4 overflow-hidden relative transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-0 dark:opacity-20 pointer-events-none transition-opacity duration-500">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/80 dark:bg-card/50 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-[3rem] p-10 sm:p-14 shadow-2xl relative overflow-hidden group">
          
          <div className="flex flex-col items-center gap-10 relative z-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Icons.Flash className="w-10 h-10 text-gray-900 dark:text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">
                {isLogin ? 'Welcome Back.' : 'Join Flash.'}
              </h1>
              <p className="text-gray-500 dark:text-white/40 text-sm font-medium tracking-wide">
                {isLogin ? 'AUTHENTICATION REQUIRED' : 'CREATE YOUR ACCOUNT'}
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    disabled={status !== 'idle'}
                    className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl px-6 py-4 outline-none focus:border-blue-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={status !== 'idle'}
                    className="w-full bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl px-6 py-4 outline-none focus:border-blue-500/50 transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <label className={`flex items-center gap-3 group ${status !== 'idle' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <div 
                    onClick={() => status === 'idle' && setRememberMe(!rememberMe)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-white/10 bg-transparent'}`}
                  >
                    {rememberMe && <Icons.Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-gray-500 dark:text-white/40 group-hover:text-gray-700 dark:group-hover:text-white/60 transition-colors uppercase tracking-widest">Remember Me</span>
                </label>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-500"
                >
                  <Icons.Error className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={status !== 'idle'}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-5 rounded-2xl shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] disabled:opacity-70"
              >
                <AnimatePresence mode="wait">
                  {status === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3">
                      <span>{isLogin ? 'Access System' : 'Initialize Profile'}</span>
                      <Icons.ArrowRight className="w-4 h-4" />
                    </motion.div>
                  )}
                  {status === 'loading' && (
                     <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Icons.Spinner className="w-5 h-5" />
                    </motion.div>
                  )}
                   {status === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Icons.Check className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </form>

            <div className="pt-4">
              <button 
                onClick={() => { if(status === 'idle') { setIsLogin(!isLogin); setError(''); playUISound('switch'); }}}
                className="text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
                disabled={status !== 'idle'}
              >
                {isLogin ? "No credentials? Request Access" : "Existing operator? Resume Session"}
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-10 text-gray-400 dark:text-white/20 text-[10px] font-bold uppercase tracking-[0.25em]">
          <p>Flash Auth Protocol v0.9.4</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;