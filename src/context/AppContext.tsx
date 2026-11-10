// src/context/AppContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AppContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // লোকাল স্টোরেজ থেকে ডেমু মোডের স্টেট নেওয়া, না থাকলে ডিফল্ট true
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDemoMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // স্টেট পরিবর্তন হলে লোকাল স্টোরেজে সেভ করা
  useEffect(() => {
    localStorage.setItem('isDemoMode', JSON.stringify(isDemoMode));
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  return (
    <AppContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}