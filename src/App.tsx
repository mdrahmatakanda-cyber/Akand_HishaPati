import { useState, useEffect, useRef } from 'react';
import { WifiOff, LogOut, X, AlertTriangle } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import {
  PurchasePage, SalePage,
  PurchaseKhataPage, SaleKhataPage, DueKhataPage, ExpenseKhataPage,
  ContactsPage, ProductListPage, StockPage, ReportsPage,
  DepotPage, SrPage, MarketPage, CompanyPage,
  CashboxPage, PartnersPage, MarketingPage, AppAccessPage,
  ExpiredPage, WarrantyPage, PrinterPage, RecycleBinPage
} from './pages';

import DemoDataPage from './pages/DemoDataPage';
import InboxPage from './pages/InboxPage';
import HelpPage from './pages/HelpPage';
import MenuPage from './pages/MenuPage';
import CalculatorPage from './pages/CalculatorPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';

// নতুন পেইজ ইমপোর্ট
import NewExpensePage from './pages/NewExpensePage';
import ExpenseHistoryPage from './pages/ExpenseHistoryPage';
import DueHistoryPage from './pages/DueHistoryPage';

export type ScreenKey = 
  | 'dashboard' | 'purchase' | 'sale'
  | 'purchase_khata' | 'sale_khata' | 'due_khata' | 'expense_khata'
  | 'purchase_details' | 'sale_details' 
  | 'new_expense' | 'expense_history' | 'due_history'
  | 'contacts' | 'product_list' | 'stock' | 'reports'
  | 'depot' | 'sr' | 'market' | 'company'
  | 'cashbox' | 'partners' | 'marketing' | 'app_access'
  | 'expired' | 'warranty' | 'printer' | 'recycle_bin'
  | 'demo_data' | 'inbox' | 'help' | 'menu' | 'calculator';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  
  // ডাইনামিক নেভিগেশন স্ট্যাক
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

  // ==============================================================
  // 🧭 নেভিগেশন ফাংশন (Error Fixed)
  // ==============================================================
  const navigateTo = (screen: string) => {
    if (screen === currentScreen) return;
    historyStackRef.current.push(screen as ScreenKey); // string to ScreenKey cast
    setCurrentScreen(screen as ScreenKey);
  };

  // ব্যাক বাটন লজিক
  const goBack = () => {
    if (historyStackRef.current.length > 1) {
      historyStackRef.current.pop();
      const prevScreen = historyStackRef.current[historyStackRef.current.length - 1];
      setCurrentScreen(prevScreen);
    } else {
      setCurrentScreen('dashboard');
    }
  };

  // ==============================================================
  // 📱 মোবাইল হার্ডওয়্যার ব্যাক বাটন হ্যান্ডেলিং
  // ==============================================================
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    historyCount.current = 1;

    const handlePopState = () => {
      if (isExitingRef.current) return;

      setTimeout(() => {
        window.history.pushState(null, '', window.location.href);
        historyCount.current += 1;

        const current = currentScreenRef.current;
        
        if (current === 'dashboard') {
          setShowExitModal(true);
        } else {
          goBack();
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

  // ==============================================================
  // 🧭 সেন্ট্রাল পেজ রাউটার
  // ==============================================================
  
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
          <DashboardPage onNavigate={navigateTo} />
        </>
      );
    }

    if (currentScreen === 'demo_data') return <DemoDataPage onBack={goBack} />;
    if (currentScreen === 'inbox') return <InboxPage onBack={goBack} />;
    if (currentScreen === 'help') return <HelpPage onBack={goBack} />;
    if (currentScreen === 'menu') return <MenuPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'calculator') return <CalculatorPage onBack={goBack} />;

    if (currentScreen === 'purchase') return <PurchasePage onBack={goBack} />;
    if (currentScreen === 'sale') return <SalePage onBack={goBack} />;

    if (currentScreen === 'purchase_khata') return <PurchaseKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'sale_khata') return <SaleKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'due_khata') return <DueKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'expense_khata') return <ExpenseKhataPage onBack={goBack} onNavigate={navigateTo} />;

    if (currentScreen === 'new_expense') return <NewExpensePage onBack={goBack} />;
    if (currentScreen === 'expense_history') return <ExpenseHistoryPage onBack={goBack} />;
    if (currentScreen === 'due_history') return <DueHistoryPage onBack={goBack} />;

    if (currentScreen === 'purchase_details') return <TransactionDetailsPage onBack={goBack} type="purchase" />;
    if (currentScreen === 'sale_details') return <TransactionDetailsPage onBack={goBack} type="sale" />;

    if (currentScreen === 'contacts') return <ContactsPage onBack={goBack} />;
    if (currentScreen === 'product_list') return <ProductListPage onBack={goBack} />;
    if (currentScreen === 'stock') return <StockPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'reports') return <ReportsPage onBack={goBack} />;

    if (currentScreen === 'depot') return <DepotPage onBack={goBack} />;
    if (currentScreen === 'sr') return <SrPage onBack={goBack} />;
    if (currentScreen === 'market') return <MarketPage onBack={goBack} />;
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
              <button onClick={() => setShowExitModal(false)} className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
                <X size={16} />
              </button>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 border border-white/20">
                <AlertTriangle size={24} className="text-amber-300" />
              </div>
              <h2 className="text-white font-bold text-lg text-center">বের হতে চান?</h2>
            </div>

            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-5">
                আপনি কি সত্যিই <strong className="text-[#0B5C47]">Dream Agro</strong> অ্যাপ থেকে বের হতে চান?
              </p>
              
              <div className="flex gap-2 w-full">
                <button onClick={() => setShowExitModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition active:scale-95 text-sm">
                  থাকুন
                </button>
                <button onClick={handleConfirmExit} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 text-sm shadow-md shadow-red-500/30">
                  <LogOut size={16} />
                  বের হোন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}