// Standardized React import to resolve JSX namespace issues
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// Fix: Use standard modular SDK named imports from firebase/auth
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Gate from './components/Gate';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { Icons } from './components/Icons';

const App: React.FC = () => {
  const [hasBetaAccess, setHasBetaAccess] = useState(() => {
    return localStorage.getItem('flash-beta-passed') === 'true';
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Theme management
    const savedTheme = localStorage.getItem('flash-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auth rehydration guard using onAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser as User | null);
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBetaPassed = () => {
    setHasBetaAccess(true);
    localStorage.setItem('flash-beta-passed', 'true');
  };

  const handleAuthSuccess = () => {
    // onAuthStateChanged handles this state change
  };

  const handleGlobalSignOut = async () => {
    // Clear local authentication state and redirect
    localStorage.removeItem('flash-beta-passed');
    setHasBetaAccess(false);
    await signOut(auth);
  };

  // App must NOT render until auth state is resolved to prevent flashing
  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-background transition-colors duration-500">
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Icons.Flash className="w-12 h-12 text-gray-900 dark:text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen text-gray-900 dark:text-white font-sans transition-colors duration-500 selection:bg-blue-500/20 selection:text-blue-600">
      <AnimatePresence mode="wait">
        {!hasBetaAccess ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50"
          >
            <Gate onEnter={handleBetaPassed} />
          </motion.div>
        ) : !user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-40"
          >
            <Auth onSuccess={handleAuthSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-30"
          >
            <Dashboard onSignOut={handleGlobalSignOut} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;