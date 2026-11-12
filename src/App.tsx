import { useState, useEffect, useRef } from 'react';
import { WifiOff, LogOut, X, AlertTriangle, Loader2 } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import DepotDashboardPage from './pages/depot/DepotDashboardPage';
import DepotStockPage from './pages/depot/DepotStockPage';
import DepotDealerPage from './pages/depot/DepotDealerPage';
import DepotOfficerPage from './pages/depot/DepotOfficerPage';
import DepotTransferPage from './pages/depot/DepotTransferPage';
import {
  PurchasePage, SalePage,
  PurchaseKhataPage, SaleKhataPage, DueKhataPage, ExpenseKhataPage,
  ContactsPage, ProductListPage, StockPage, ReportsPage,
  DepotPage, SrPage, MarketPage, CompanyPage,
  CashboxPage, PartnersPage, MarketingPage, AppAccessPage,
  ExpiredPage, WarrantyPage, PrinterPage, RecycleBinPage
} from './pages';

import InboxPage from './pages/InboxPage';
import HelpPage from './pages/HelpPage';
import MenuPage from './pages/MenuPage';
import CalculatorPage from './pages/CalculatorPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import NewExpensePage from './pages/NewExpensePage';
import ExpenseHistoryPage from './pages/ExpenseHistoryPage';
import AuthPage from './pages/AuthPage';
import SetupBusinessPage from './pages/SetupBusinessPage';

import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

export type ScreenKey = 
  | 'dashboard' | 'purchase' | 'sale'
  | 'purchase_khata' | 'sale_khata' | 'due_khata' | 'expense_khata'
  | 'purchase_details' | 'sale_details' 
  | 'new_expense' | 'expense_history'
  | 'contacts' | 'product_list' | 'stock' | 'reports'
  | 'depot' | 'sr' | 'market' | 'company'
  | 'cashbox' | 'partners' | 'marketing' | 'app_access'
  | 'expired' | 'warranty' | 'printer' | 'recycle_bin'
  | 'inbox' | 'help' | 'menu' | 'calculator';

export type BusinessMode = 'shop' | 'depot' | 'general';

export interface ModeConfig {
  [key: string]: { shop: boolean; depot: boolean; general: boolean; }
}

const defaultModeConfig: ModeConfig = {
  khata: { shop: true, depot: true, general: true },
  business: { shop: true, depot: true, general: true },
  depot: { shop: false, depot: true, general: true }, 
  others: { shop: true, depot: true, general: true },
};

function AppContent() {
  const { user, activeBusiness, isLoading, businesses, switchBusiness } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  
  const [currentMode, setCurrentMode] = useState<BusinessMode>(() => {
    const savedMode = localStorage.getItem('appMode');
    return (savedMode as BusinessMode) || 'general';
  });

  useEffect(() => {
    localStorage.setItem('appMode', currentMode);
  }, [currentMode]);

  const [modeConfig, setModeConfig] = useState<ModeConfig>(defaultModeConfig);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const historyStackRef = useRef<ScreenKey[]>(['dashboard']);
  const currentScreenRef = useRef<ScreenKey>('dashboard');
  const isExitingRef = useRef<boolean>(false);
  const historyCount = useRef<number>(0);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleMode = async () => {
    if (currentMode === 'depot') {
      const shopBiz = businesses.find(b => b.type === 'shop');
      if (shopBiz) await switchBusiness(shopBiz.id);
      setCurrentMode('shop');
    } else {
      const depotBiz = businesses.find(b => b.type === 'depot');
      if (depotBiz) await switchBusiness(depotBiz.id);
      setCurrentMode('depot');
    }
  };

  const navigateTo = (screen: string, id?: string) => {
    if (screen === currentScreen) return;
    if (id) setSelectedTransactionId(id);
    historyStackRef.current.push(screen as ScreenKey);
    setCurrentScreen(screen as ScreenKey);
  };

  const goBack = () => {
    if (historyStackRef.current.length > 1) {
      historyStackRef.current.pop();
      const prevScreen = historyStackRef.current[historyStackRef.current.length - 1];
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('dashboard');
    }
  };

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    historyCount.current = 1;

    const handlePopState = () => {
      if (isExitingRef.current) return;
      setTimeout(() => {
        window.history.pushState(null, '', window.location.href);
        historyCount.current += 1;
        if (currentScreenRef.current === 'dashboard') {
          setShowExitModal(true);
        } else {
          const event = new CustomEvent('appBack', { cancelable: true });
          const notPrevented = window.dispatchEvent(event);
          if (notPrevented) {
            goBack();
          }
        }
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleConfirmExit = () => {
    isExitingRef.current = true;
    setShowExitModal(false);
    window.history.go(-historyCount.current);
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-[#EFF6F3] flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-[#1E88E5] animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  
  if (user && !activeBusiness) return <SetupBusinessPage />;

  const renderScreen = () => {
    if (currentScreen === 'dashboard') {
      return (
        <>
          {!isOnline && (
            <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow sticky top-0 z-50">
              <WifiOff size={14} />
              <span>আপনি বর্তমানে <strong>অফলাইনে</strong> আছেন। সব হিসাব দেখা যাবে, তবে নতুন কোনো তথ্য সেভ হবে না।</span>
            </div>
          )}
          {currentMode === 'depot' ? (
            <DepotDashboardPage onNavigate={navigateTo} onToggleMode={handleToggleMode} />
          ) : (
            <DashboardPage onNavigate={navigateTo} currentMode={currentMode} modeConfig={modeConfig} onToggleMode={handleToggleMode} />
          )}
        </>
      );
    }

    if (currentScreen === 'inbox') return <InboxPage onBack={goBack} />;
    if (currentScreen === 'help') return <HelpPage onBack={goBack} />;
    if (currentScreen === 'menu') {
      return (
        <MenuPage 
          onBack={goBack} 
          onNavigate={navigateTo} 
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          modeConfig={modeConfig}
          setModeConfig={setModeConfig}
        />
      );
    }
    if (currentScreen === 'calculator') return <CalculatorPage onBack={goBack} />;

    if (currentScreen === 'purchase') return <PurchasePage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'sale') return <SalePage onBack={goBack} onNavigate={navigateTo} />;

    if (currentScreen === 'purchase_khata') return <PurchaseKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'sale_khata') return <SaleKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'due_khata') return <DueKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'expense_khata') return <ExpenseKhataPage onBack={goBack} onNavigate={navigateTo} />;

    if (currentScreen === 'new_expense') return <NewExpensePage onBack={goBack} />;
    if (currentScreen === 'expense_history') return <ExpenseHistoryPage onBack={goBack} />;

    if (currentScreen === 'purchase_details') return <TransactionDetailsPage onBack={goBack} type="purchase" transactionId={selectedTransactionId} />;
    if (currentScreen === 'sale_details') return <TransactionDetailsPage onBack={goBack} type="sale" transactionId={selectedTransactionId} />;

    if (currentScreen === 'contacts') return <ContactsPage onBack={goBack} />;
    if (currentScreen === 'product_list') return <ProductListPage onBack={goBack} />;
    if (currentScreen === 'stock') {
      return currentMode === 'depot' 
        ? <DepotStockPage onBack={goBack} onNavigate={navigateTo} />
        : <StockPage onBack={goBack} onNavigate={navigateTo} />;
    }

    if (currentScreen === 'market') {
      return currentMode === 'depot'
        ? <DepotDealerPage onBack={goBack} onNavigate={navigateTo} />
        : <MarketPage onBack={goBack} />;
    }
    if (currentScreen === 'reports') return <ReportsPage onBack={goBack} onNavigate={navigateTo} />;

    if (currentScreen === 'depot') {
      return currentMode === 'depot'
        ? <DepotTransferPage onBack={goBack} onNavigate={navigateTo} />
        : <DepotPage onBack={goBack} />;
    }
    if (currentScreen === 'sr') {
      return currentMode === 'depot' 
        ? <DepotOfficerPage onBack={goBack} onNavigate={navigateTo} />
        : <SrPage onBack={goBack} />;
    }
    if (currentScreen === 'company') return <CompanyPage onBack={goBack} />;

    if (currentScreen === 'cashbox') return <CashboxPage onBack={goBack} />;
    if (currentScreen === 'partners') return <PartnersPage onBack={goBack} />;
    if (currentScreen === 'marketing') return <MarketingPage onBack={goBack} />;
    if (currentScreen === 'app_access') return <AppAccessPage onBack={goBack} />;
    if (currentScreen === 'expired') return <ExpiredPage onBack={goBack} />;
    if (currentScreen === 'warranty') return <WarrantyPage onBack={goBack} />;
    if (currentScreen === 'printer') return <PrinterPage onBack={goBack} />;
    if (currentScreen === 'recycle_bin') return <RecycleBinPage onBack={goBack} />;

    return null;
  };

  return (
    <>
      {renderScreen()}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-4 flex flex-col items-center justify-center relative">
              <button onClick={() => setShowExitModal(false)} className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition"><X size={16} /></button>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 border border-white/20"><AlertTriangle size={24} className="text-amber-300" /></div>
              <h2 className="text-white font-bold text-lg text-center">বের হতে চান?</h2>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-5">আপনি কি সত্যিই <strong className="text-[#0B5C47]">Akand HishabPati</strong> অ্যাপ থেকে বের হতে চান?</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setShowExitModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition active:scale-95 text-sm">থাকুন</button>
                <button onClick={handleConfirmExit} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-sm shadow-md shadow-red-500/30"><LogOut size={16} /> বের হোন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}