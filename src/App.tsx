import { useState, useEffect, useRef } from 'react';
import { WifiOff, LogOut, X, AlertTriangle, Loader2, MessageCircle, Mail } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import DepotDashboardPage from './pages/depot/DepotDashboardPage';
import DepotStockPage from './pages/depot/DepotStockPage';
import DepotDealerPage from './pages/depot/DepotDealerPage';
import DepotOfficerPage from './pages/depot/DepotOfficerPage';
import DepotBonusPage from './pages/depot/DepotBonusPage';
import DepotCompanyPage from './pages/depot/DepotCompanyPage';
import DepotStockInPage from './pages/depot/DepotStockInPage';
import DepotExpensePage from './pages/depot/DepotExpensePage';
import DepotReportsPage from './pages/depot/DepotReportsPage';
import DepotTransferPage from './pages/depot/DepotTransferPage';
import DepotSalesKhataPage from './pages/depot/DepotSalesKhataPage';
import DepotPurchaseKhataPage from './pages/depot/DepotPurchaseKhataPage';

import {
  PurchasePage, SalePage,
  PurchaseKhataPage, SaleKhataPage, DueKhataPage, ExpenseKhataPage,
  ContactsPage, ProductListPage, StockPage, ReportsPage,
  SrPage, MarketPage, CompanyPage,
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
import InstallPWA from './components/InstallPWA';
import { GlobalToast } from './components/PremiumToast';

export type ScreenKey =
  | 'dashboard' | 'purchase' | 'sale'
  | 'purchase_khata' | 'sale_khata' | 'due_khata' | 'expense_khata'
  | 'purchase_details' | 'sale_details'
  | 'new_expense' | 'expense_history'
  | 'contacts' | 'product_list' | 'stock' | 'reports'
  | 'depot' | 'sr' | 'market' | 'company'
  | 'cashbox' | 'partners' | 'marketing' | 'app_access'
  | 'expired' | 'warranty' | 'printer' | 'recycle_bin'
  | 'inbox' | 'help' | 'menu' | 'calculator' | 'bonus' | 'depot_sales_khata' | 'depot_purchase_khata';

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
  const { user, userStatus, activeBusiness, isLoading, businesses, switchBusiness, signOut } = useAuth();

  const [currentScreen, setCurrentScreen] = useState<ScreenKey>(() => {
    const saved = localStorage.getItem('currentScreen');
    return (saved as ScreenKey) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
  }, [currentScreen]);

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

  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(() => {
    return localStorage.getItem('selectedTransactionId') || null;
  });

  useEffect(() => {
    if (selectedTransactionId) {
      localStorage.setItem('selectedTransactionId', selectedTransactionId);
    } else {
      localStorage.removeItem('selectedTransactionId');
    }
  }, [selectedTransactionId]);

  const historyStackRef = useRef<ScreenKey[]>([currentScreen]);
  const currentScreenRef = useRef<ScreenKey>(currentScreen);
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

  useEffect(() => {
    if (!businesses.length) return;
    if (currentMode === 'depot' && activeBusiness?.type !== 'depot') {
      const depotBiz = businesses.find(b => b.type === 'depot' && b.name.includes('Dream')) || businesses.find(b => b.type === 'depot');
      if (depotBiz) switchBusiness(depotBiz.id);
    } else if (currentMode === 'shop' && activeBusiness?.type !== 'shop') {
      const shopBiz = businesses.find(b => b.type === 'shop');
      if (shopBiz) switchBusiness(shopBiz.id);
    }
  }, [currentMode, businesses, activeBusiness?.id, activeBusiness?.type]);

  const handleToggleMode = async () => {
    if (currentMode === 'depot') {
      const shopBiz = businesses.find(b => b.type === 'shop');
      if (shopBiz && activeBusiness?.id !== shopBiz.id) await switchBusiness(shopBiz.id);
      setCurrentMode('shop');
    } else {
      const depotBiz = businesses.find(b => b.type === 'depot' && b.name.includes('Dream')) || businesses.find(b => b.type === 'depot');
      if (depotBiz && activeBusiness?.type !== 'depot') await switchBusiness(depotBiz.id);
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

  // ✅ Pending স্ক্রিন (ইউজার অ্যাডমিন দ্বারা অনুমোদিত না হলে)
  if (user && userStatus === 'pending') {
    const userName = user.user_metadata?.name || 'ইউজার';
    const userPhone = user.user_metadata?.phone || '';
    const userEmail = user.email || '';

    const whatsappMessage = encodeURIComponent(`আসসালামু আলাইকুম, আমি ${userName} (${userPhone})। আমি Hishabpati অ্যাপে রেজিস্ট্রেশন করেছি। অনুগ্রহ করে আমার অ্যাকাউন্টটি অনুমোদন করুন।`);
    const emailSubject = encodeURIComponent(`Hishabpati Account Approval Request - ${userName}`);
    const emailBody = encodeURIComponent(`আসসালামু আলাইকুম,\n\nআমি ${userName} (${userPhone})।\nআমার ইমেইল: ${userEmail}\n\nআমি Hishabpati অ্যাপে রেজিস্ট্রেশন করেছি। অনুগ্রহ করে আমার অ্যাকাউন্টটি অনুমোদন করুন।\n\nধন্যবাদ।`);

    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#EFF6F3] p-5 text-center">
        <div className="w-20 h-20 bg-[#0B5C47]/10 text-[#0B5C47] rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-xl font-bold text-[#0B5C47] mb-2">অনুমোদনের অপেক্ষায়!</h1>
        <p className="text-gray-600 mb-6 text-sm px-4">আপনার অ্যাকাউন্টটি বর্তমানে অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করছে। দ্রুত অনুমোদন পেতে নিচের বাটনগুলো ব্যবহার করে যোগাযোগ করুন।</p>

        <div className="flex flex-col gap-3 w-full max-w-xs mb-6">
          {/* হোয়াটসঅ্যাপ বাটন */}
          <a
            href={`https://wa.me/8801752005057?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition"
          >
            <MessageCircle size={18} /> হোয়াটসঅ্যাপে মেসেজ দিন
          </a>

          {/* ইমেইল বাটন */}
          <a
            href={`mailto:mdrahmatakanda@gmail.com?subject=${emailSubject}&body=${emailBody}`}
            className="w-full bg-white border-2 border-[#1E88E5] text-[#1E88E5] py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-2 active:scale-95 transition"
          >
            <Mail size={18} /> ইমেইল করুন
          </a>
        </div>

        <button onClick={signOut} className="text-gray-500 font-bold text-sm hover:underline mt-2">
          অথবা লগআউট করুন
        </button>
      </div>
    );
  }

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

    if (currentScreen === 'purchase') {
      return currentMode === 'depot'
        ? <DepotStockInPage onBack={goBack} />
        : <PurchasePage onBack={goBack} />;
    }
    if (currentScreen === 'sale') return <SalePage isDepot={currentMode === 'depot'} onBack={goBack} onNavigate={navigateTo} />;

    if (currentScreen === 'purchase_khata') return <PurchaseKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'sale_khata') return <SaleKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'due_khata') return <DueKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'expense_khata') {
      return currentMode === 'depot'
        ? <DepotExpensePage onBack={goBack} onNavigate={navigateTo} />
        : <ExpenseKhataPage onBack={goBack} onNavigate={navigateTo} />;
    }

    // ✅ ডিপো ক্রয় ও বিক্রয় খাতা রাউটিং
    if (currentScreen === 'depot_sales_khata') return <DepotSalesKhataPage onBack={goBack} onNavigate={navigateTo} />;
    if (currentScreen === 'depot_purchase_khata') return <DepotPurchaseKhataPage onBack={goBack} />;

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
    if (currentScreen === 'reports') {
      return currentMode === 'depot'
        ? <DepotReportsPage onBack={goBack} />
        : <ReportsPage onBack={goBack} onNavigate={navigateTo} />;
    }

    if (currentScreen === 'depot') {
      return <DepotTransferPage onBack={goBack} />;
    }

    if (currentScreen === 'bonus') return <DepotBonusPage onBack={goBack} />;
    if (currentScreen === 'sr') {
      return currentMode === 'depot'
        ? <DepotOfficerPage onBack={goBack} onNavigate={navigateTo} />
        : <SrPage onBack={goBack} />;
    }
    if (currentScreen === 'company') {
      return currentMode === 'depot'
        ? <DepotCompanyPage onBack={goBack} onNavigate={navigateTo} />
        : <CompanyPage onBack={goBack} />;
    }

    if (currentScreen === 'cashbox') return <CashboxPage isDepot={currentMode === 'depot'} onBack={goBack} />;
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

      <InstallPWA />
      <GlobalToast />

      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-4 flex flex-col items-center justify-center relative">
              <button onClick={() => setShowExitModal(false)} className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition"><X size={16} /></button>
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 border border-white/20"><AlertTriangle size={24} className="text-amber-300" /></div>
              <h2 className="text-white font-bold text-lg text-center">বের হতে চান?</h2>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-5">আপনি কি সত্যিই <strong className="text-[#0B5C47]">HishabPati</strong> অ্যাপ থেকে বের হতে চান?</p>
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