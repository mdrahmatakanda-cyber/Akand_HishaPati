// src/context/AppContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // ডিফল্টভাবে ডেমু মোড চালু থাকবে
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

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