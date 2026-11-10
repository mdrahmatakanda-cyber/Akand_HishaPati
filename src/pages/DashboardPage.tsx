import { useState, useEffect, useRef } from 'react';
import {
  // হেডার
  RefreshCcw, Headset, Mail,
  // সামারি
  ShoppingBasket,
  // মেইন অ্যাকশন
  PackagePlus, ReceiptText, Wheat, Fish,
  // খাতা সমূহ
  BadgeDollarSign, HandCoins, Banknote,
  // আপনার ব্যবসার জন্য
  Contact, PackageSearch, ClipboardList, TrendingUp,
  // ডিপো ও ডিস্ট্রিবিউশন
  Warehouse, Truck, Store, Building2,
  // অন্যান্য ফিচার
  WalletCards, Handshake, Megaphone, KeyRound, Hourglass, ShieldCheck, Printer, Recycle,
  // কুইক অ্যাকশন ও নেভিগেশন
  Calculator, X, Home, BookOpenText, Boxes, LayoutGrid, Plus
} from 'lucide-react';
import { toBangla } from '../lib/utils'; 
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoDashboardStats } from '../lib/demoData';

type TimePeriod = 'TODAY' | 'WEEK' | 'MONTH';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  currentMode: 'shop' | 'depot' | 'general';
  modeConfig: any;
}

// রঙ গাঢ় করার সহায়ক ফাংশন
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function DashboardPage({ onNavigate, currentMode, modeConfig }: DashboardProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('TODAY');
  const [selectedNavIndex, setSelectedNavIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  
  // ডাটা স্টেট
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(2);

  const mainRef = useRef<HTMLElement>(null);

  const bannerImages = [
    "/banners/slide1.jpg", 
    "/banners/slide2.jpg", 
    "/banners/slide3.jpg"
  ];

  // ১. ব্যানার স্লাইডার লজিক
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  // ২. স্ক্রল পজিশন রিস্টোর এবং সেভ করার লজিক
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('dashboard_scroll_y');
    if (savedScroll && mainRef.current) {
      mainRef.current.scrollTop = parseInt(savedScroll, 10);
    }
    
    const mainEl = mainRef.current;
    const handleScroll = () => {
      if (mainEl) {
        sessionStorage.setItem('dashboard_scroll_y', mainEl.scrollTop.toString());
      }
    };
    
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // ৩. ডাটা ফেচিং লজিক (ডেমু ও রিয়েল)
  useEffect(() => {
    const fetchStats = async () => {
      if (!isDemoMode && !activeBusiness?.id) {
        setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      try {
        if (isDemoMode) {
          await new Promise(resolve => setTimeout(resolve, 300)); // সিমুলেট লোডিং
          const demoData = demoDashboardStats[selectedPeriod];
          setDashboardStats(demoData);
          setUnreadCount(demoData.unread_inbox);
        } else {
          // রিয়েল মোড: Supabase RPC কল
          const { data, error } = await supabase.rpc('get_dashboard_stats', {
            p_period: selectedPeriod,
            p_business_id: activeBusiness?.id
          });
          if (error) throw error;
          setDashboardStats(data);
          if (data?.unread_inbox !== undefined) {
            setUnreadCount(data.unread_inbox);
          }
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchStats();
  }, [isDemoMode, selectedPeriod, activeBusiness?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const isSectionVisible = (sectionKey: string) => {
    if (!modeConfig[sectionKey]) return true;
    return modeConfig[sectionKey][currentMode] ?? true;
  };

  // টাকা ফরম্যাট করার হেল্পার (numeric থেকে সরাসরি)
  const formatTaka = (amount: number) => {
    if (amount === undefined || amount === null) return "0";
    return amount.toLocaleString('en-IN');
  };

  const prefix = selectedPeriod === 'TODAY' ? 'আজকের' : selectedPeriod === 'WEEK' ? 'সাপ্তাহিক' : 'এই মাসের';

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* ============================================================== */}
      {/* ১. প্রিমিয়াম টপ হেডার */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-[#0B5C47] via-[#07465B] to-[#062D5E] text-white shadow-[0_10px_24px_-8px_rgba(6,45,94,0.55)] rounded-b-[22px] shrink-0 z-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-[#43A047]/30 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#43A047] via-[#26C6DA] to-[#1E88E5] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.3)] ring-2 ring-white/30 border border-white/50 overflow-hidden p-0.5 shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-[#0B5C47] rounded-lg flex items-center justify-center text-white font-black text-[10px]">DA</div>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-[19px] tracking-wide text-white drop-shadow-md">DREAM AGRO</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-5 h-[1px] bg-gradient-to-r from-transparent to-white/60"></div>
                <span className="text-[9px] font-bold text-cyan-50/90 tracking-widest leading-none drop-shadow-sm">
                  {currentMode === 'shop' ? 'SHOP MODE' : currentMode === 'depot' ? 'DEPOT MODE' : '& FISHERIES'}
                </span>
                <div className="w-5 h-[1px] bg-gradient-to-l from-transparent to-white/60"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button onClick={handleRefresh} className="flex flex-col items-center text-white/90 hover:text-white transition cursor-pointer group">
              <span className="w-[30px] h-[30px] rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center group-active:scale-90 transition">
                <RefreshCcw size={18} className={`drop-shadow-sm group-hover:scale-110 transition-transform ${isRefreshing ? "animate-spin text-cyan-300" : ""}`} />
              </span>
              <span className="text-[9px] font-medium mt-0.5 drop-shadow-sm">সিঙ্ক</span>
            </button>
            
            <button onClick={() => onNavigate('help')} className="flex flex-col items-center text-white/90 hover:text-white transition cursor-pointer group">
              <span className="w-[30px] h-[30px] rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center group-active:scale-90 transition">
                <Headset size={18} className="drop-shadow-sm group-hover:scale-110 transition-transform" />
              </span>
              <span className="text-[9px] font-medium mt-0.5 drop-shadow-sm">সাহায্য</span>
            </button>
            
            <div 
              onClick={() => { 
                onNavigate('inbox'); 
                setUnreadCount(0);
              }} 
              className="relative flex flex-col items-center cursor-pointer text-white/90 hover:text-white transition group"
            >
              <span className="relative w-[30px] h-[30px] rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center group-active:scale-90 transition">
                <Mail size={18} className="drop-shadow-sm group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-[#FF5252] to-[#D32F2F] ring-2 ring-[#07465B] text-white rounded-full text-[8px] font-bold flex items-center justify-center shadow-md">
                    {toBangla(unreadCount)}
                  </span>
                )}
              </span>
              <span className="text-[9px] font-medium mt-0.5 drop-shadow-sm">ইনবক্স</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* মেইন বডি */}
      {/* ============================================================== */}
      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto w-full max-w-7xl mx-auto p-2.5 flex flex-col gap-2.5 pb-28 scrollbar-hide">
        
        {/* ২. সামারি সেকশন */}
        <div className="bg-white rounded-[18px] border border-[#D1E7DD] p-2 shadow-[0_8px_22px_-10px_rgba(11,92,71,0.4)] shrink-0">
          
          {/* দৈনিক / সাপ্তাহিক / মাসিক টগল */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[12px] font-bold text-[#0F2A3D]">
              {prefix} হিসাব বিবরণী
            </span>
            <div className="bg-[#E1EBE6] p-0.5 rounded-full flex items-center shadow-inner">
              <button
                onClick={() => setSelectedPeriod('TODAY')}
                className={`px-3 py-1 text-[10px] rounded-full font-bold transition cursor-pointer ${
                  selectedPeriod === 'TODAY' ? 'bg-gradient-to-r from-[#1B5E20] to-[#00796B] text-white shadow-md' : 'text-[#5F7387]'
                }`}
              >
                দৈনিক
              </button>
              <button
                onClick={() => setSelectedPeriod('WEEK')}
                className={`px-3 py-1 text-[10px] rounded-full font-bold transition cursor-pointer ${
                  selectedPeriod === 'WEEK' ? 'bg-gradient-to-r from-[#1B5E20] to-[#00796B] text-white shadow-md' : 'text-[#5F7387]'
                }`}
              >
                সাপ্তাহিক
              </button>
              <button
                onClick={() => setSelectedPeriod('MONTH')}
                className={`px-3 py-1 text-[10px] rounded-full font-bold transition cursor-pointer ${
                  selectedPeriod === 'MONTH' ? 'bg-gradient-to-r from-[#1B5E20] to-[#00796B] text-white shadow-md' : 'text-[#5F7387]'
                }`}
              >
                মাসিক
              </button>
            </div>
          </div>

          {/* বিক্রি, খরচ ও বাকি বক্স */}
          <div className="flex w-full gap-1.5">
            <div className="flex-1 bg-gradient-to-b from-[#F1FAF3] to-white border border-[#CDE8D4] rounded-xl p-1.5 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] text-[#334155] font-bold mb-0.5 whitespace-nowrap">{prefix} বিক্রি</span>
              <span className="text-[13px] font-black text-[#1B5E20] whitespace-nowrap">
                ৳ {toBangla(isDataLoading ? "..." : formatTaka(dashboardStats?.sales || 0))}
              </span>
            </div>

            <div className="flex-1 bg-gradient-to-b from-[#FEF3F2] to-white border border-[#F6CFCB] rounded-xl p-1.5 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] text-[#334155] font-bold mb-0.5 whitespace-nowrap">{prefix} খরচ</span>
              <span className="text-[13px] font-black text-[#DC2626] whitespace-nowrap">
                ৳ {toBangla(isDataLoading ? "..." : formatTaka(dashboardStats?.expense || 0))}
              </span>
            </div>

            <div className="flex-[1.6] bg-gradient-to-b from-[#F4F8F6] to-white border border-[#D8E5DE] rounded-xl p-1.5 flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] text-[#334155] font-bold mb-1 whitespace-nowrap text-center w-full">{prefix} বাকি</span>
              <div className="flex flex-row w-full gap-1">
                <div className="flex-1 bg-[#D5EFDB] text-[#15803D] font-bold text-[9px] py-0.5 rounded-md text-center whitespace-nowrap ring-1 ring-[#B4DFBF]">
                  দেয়েছি: {toBangla(isDataLoading ? "..." : formatTaka(dashboardStats?.due_received || 0))}
                </div>
                <div className="flex-1 bg-[#FDDCDC] text-[#B91C1C] font-bold text-[9px] py-0.5 rounded-md text-center whitespace-nowrap ring-1 ring-[#F6BDBD]">
                  নিয়েছি: {toBangla(isDataLoading ? "..." : formatTaka(dashboardStats?.due_given || 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ৩. স্লাইডার */}
        <div className="relative w-full h-20 sm:h-24 rounded-2xl overflow-hidden shadow-[0_8px_20px_-10px_rgba(13,59,128,0.6)] ring-1 ring-[#D3E4DB] bg-gradient-to-r from-[#1B5E20] via-[#0F6A7A] to-[#0D3B80] shrink-0">
          {bannerImages.map((img, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 cursor-pointer ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              onClick={() => idx === 0 ? onNavigate('reports') : idx === 1 ? onNavigate('app_access') : alert("হেল্পলাইন")}
            >
              <img 
                src={img} 
                alt={`Banner ${idx + 1}`} 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          ))}

          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none"></div>
          
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            {bannerImages.map((_, idx) => (
              <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
            ))}
          </div>
        </div>

        {/* ৪. মেইন অ্যাকশন বাটন */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <button 
            onClick={() => onNavigate('purchase')}
            className="relative overflow-hidden h-[58px] bg-gradient-to-br from-[#2196F3] via-[#1565C0] to-[#0D3B80] text-white rounded-2xl p-2 flex items-center shadow-[0_10px_18px_-8px_rgba(13,59,128,0.75)] ring-1 ring-white/20 active:scale-95 transition cursor-pointer group"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
            <Wheat size={72} strokeWidth={1.5} className="absolute -right-3 -bottom-3 text-white/10 -rotate-12" />
            <div className="flex items-center gap-2 relative z-10 w-full">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <PackagePlus size={20} strokeWidth={2} className="text-white drop-shadow" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-[15px] font-black leading-none mb-0.5 drop-shadow-sm">ক্রয়</h4>
                <p className="text-[9px] text-white/90 leading-tight truncate">মাল কেনা / স্টক ইন</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => onNavigate('sale')}
            className="relative overflow-hidden h-[58px] bg-gradient-to-br from-[#4CAF50] via-[#2E7D32] to-[#1B5E20] text-white rounded-2xl p-2 flex items-center shadow-[0_10px_18px_-8px_rgba(27,94,32,0.75)] ring-1 ring-white/20 active:scale-95 transition cursor-pointer group"
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
            <Fish size={72} strokeWidth={1.5} className="absolute -right-3 -bottom-3 text-white/10 -rotate-12" />
            <div className="flex items-center gap-2 relative z-10 w-full">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <ReceiptText size={20} strokeWidth={2} className="text-white drop-shadow" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-[15px] font-black leading-none mb-0.5 drop-shadow-sm">বিক্রয়</h4>
                <p className="text-[9px] text-white/90 leading-tight truncate">ক্যাশ মেমো / বেচা</p>
              </div>
            </div>
          </button>
        </div>

        {/* ================= ৫. বিভাগ ১: খাতা সমূহ ================= */}
        {isSectionVisible('khata') && (
          <DepartmentSection title="খাতা সমূহ">
            <GridFeatureButton title="ক্রয়ের খাতা" icon={ShoppingBasket} color="#1565C0" onClick={() => onNavigate('purchase_khata')} />
            <GridFeatureButton title="বিক্রির খাতা" icon={BadgeDollarSign} color="#2E7D32" onClick={() => onNavigate('sale_khata')} />
            <GridFeatureButton title="বাকির খাতা" icon={HandCoins} color="#00838F" onClick={() => onNavigate('due_khata')} />
            <GridFeatureButton title="খরচের খাতা" icon={Banknote} color="#D32F2F" onClick={() => onNavigate('expense_khata')} />
          </DepartmentSection>
        )}

        {/* ================= ৬. বিভাগ ২: আপনার ব্যবসার জন্য ================= */}
        {isSectionVisible('business') && (
          <DepartmentSection title="আপনার ব্যবসার জন্য">
            <GridFeatureButton title="যোগাযোগ" icon={Contact} color="#00796B" onClick={() => onNavigate('contacts')} />
            <GridFeatureButton title="প্রোডাক্ট লিস্ট" icon={PackageSearch} color="#0D47A1" onClick={() => onNavigate('product_list')} />
            <GridFeatureButton title="স্টকের হিসাব" icon={ClipboardList} color="#43A047" onClick={() => onNavigate('stock')} />
            <GridFeatureButton title="দোকান রিপোর্ট" icon={TrendingUp} color="#1E88E5" onClick={() => onNavigate('reports')} />
          </DepartmentSection>
        )}

        {/* ================= ৭. বিভাগ ৩: ডিপো ও ডিস্ট্রিবিউশন ================= */}
        {isSectionVisible('depot') && (
          <DepartmentSection title="ডিপো ও ডিস্ট্রিবিউশন">
            <GridFeatureButton title="ডিপো" icon={Warehouse} color="#00796B" onClick={() => onNavigate('depot')} />
            <GridFeatureButton title="এসআর" icon={Truck} color="#1565C0" onClick={() => onNavigate('sr')} />
            <GridFeatureButton title="মার্কেট" icon={Store} color="#EF6C00" onClick={() => onNavigate('market')} />
            <GridFeatureButton title="কোম্পানি" icon={Building2} color="#455A64" onClick={() => onNavigate('company')} />
          </DepartmentSection>
        )}

        {/* ================= ৮. বিভাগ ৪: অন্যান্য ফিচার ================= */}
        {isSectionVisible('others') && (
          <DepartmentSection title="অন্যান্য ফিচার">
            <GridFeatureButton title="ক্যাশবক্স" icon={WalletCards} color="#2E7D32" onClick={() => onNavigate('cashbox')} />
            <GridFeatureButton title="পার্টনার" icon={Handshake} color="#00796B" onClick={() => onNavigate('partners')} />
            <GridFeatureButton title="মার্কেটিং" icon={Megaphone} color="#1E88E5" onClick={() => onNavigate('marketing')} />
            <GridFeatureButton title="অ্যাপ অ্যাক্সেস" icon={KeyRound} color="#0D47A1" onClick={() => onNavigate('app_access')} />
            <GridFeatureButton title="মেয়াদোত্তীর্ণ" icon={Hourglass} color="#E53935" onClick={() => onNavigate('expired')} />
            <GridFeatureButton title="ওয়ারেন্টি" icon={ShieldCheck} color="#00796B" onClick={() => onNavigate('warranty')} />
            <GridFeatureButton title="প্রিন্টার" icon={Printer} color="#455A64" onClick={() => onNavigate('printer')} />
            <GridFeatureButton title="রিসাইকেল বিন" icon={Recycle} color="#C62828" onClick={() => onNavigate('recycle_bin')} />
          </DepartmentSection>
        )}

        <div className="h-2"></div>
      </main>

      {/* ============================================================== */}
      {/* কুইক অ্যাকশন মেনু (Popup) */}
      {/* ============================================================== */}
      {isQuickActionOpen && (
        <>
          <div 
            className="fixed inset-0 bg-[#062D5E]/40 z-[60] backdrop-blur-sm transition-opacity"
            onClick={() => setIsQuickActionOpen(false)}
          ></div>
          
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(6,45,94,0.6)] z-[70] p-4 border border-[#D3E4DB] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#43A047] via-[#26C6DA] to-[#1E88E5]"></div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gradient-to-b from-[#43A047] to-[#1565C0] rounded-full"></div>
                <h3 className="font-bold text-sm text-[#0F2A3D]">কুইক অ্যাকশন</h3>
              </div>
              <button onClick={() => setIsQuickActionOpen(false)} className="text-[#5F7387] hover:text-[#0F2A3D] bg-[#E8ECEB] rounded-full p-1 transition active:scale-90">
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <QuickActionButton title="ক্রয়" icon={PackagePlus} color="#1E88E5" onClick={() => { setIsQuickActionOpen(false); onNavigate('purchase'); }} />
              <QuickActionButton title="বিক্রয়" icon={ReceiptText} color="#43A047" onClick={() => { setIsQuickActionOpen(false); onNavigate('sale'); }} />
              <QuickActionButton title="খরচ" icon={Banknote} color="#D32F2F" onClick={() => { setIsQuickActionOpen(false); onNavigate('expense_khata'); }} />
              <QuickActionButton title="ক্যালকুলেটর" icon={Calculator} color="#455A64" onClick={() => { setIsQuickActionOpen(false); onNavigate('calculator'); }} />
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* বটম নেভিগেশন বার */}
      {/* ============================================================== */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl shadow-[0_-12px_30px_-8px_rgba(6,45,94,0.3)] rounded-t-[26px] border-t border-white z-[80] shrink-0">
        <div className="absolute top-0 inset-x-10 h-[2px] rounded-full bg-gradient-to-r from-[#43A047] via-[#00796B] to-[#1E88E5]"></div>

        <div className="max-w-7xl mx-auto px-4 py-1 flex justify-between items-center relative pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <BottomNavItem icon={Home} label="হোম" isSelected={selectedNavIndex === 0} onClick={() => { setSelectedNavIndex(0); onNavigate('dashboard'); }} />
          <BottomNavItem icon={BookOpenText} label="হিসাব" isSelected={selectedNavIndex === 1} onClick={() => { setSelectedNavIndex(1); onNavigate('reports'); }} />
          
          <div className="relative flex justify-center w-14">
            <button 
              onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
              className={`absolute -top-7 w-14 h-14 bg-gradient-to-br from-[#2E7D32] via-[#00796B] to-[#1565C0] rounded-full flex items-center justify-center shadow-[0_10px_22px_-6px_rgba(21,101,192,0.75)] border-4 border-[#EFF6F3] text-white transition-transform duration-300 cursor-pointer z-[90] ${isQuickActionOpen ? 'rotate-45 scale-110' : 'active:scale-95'}`}
            >
              <Plus size={28} strokeWidth={2.4} />
            </button>
          </div>

          <BottomNavItem icon={Boxes} label="পণ্য" isSelected={selectedNavIndex === 3} onClick={() => { setSelectedNavIndex(3); onNavigate('product_list'); }} />
          <BottomNavItem icon={LayoutGrid} label="মেনু" isSelected={selectedNavIndex === 4} onClick={() => { setSelectedNavIndex(4); onNavigate('menu'); }} />
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// 🧩 রি-ইউজেবল কম্পোনেন্টস
// ==============================================================

function DepartmentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D3E4DB] shadow-[0_6px_18px_-10px_rgba(11,92,71,0.4)] overflow-hidden shrink-0">
      <div className="bg-gradient-to-r from-[#E2E8E5] to-[#EEF2F0] px-3 py-2 flex items-center gap-2 border-b border-[#D3E4DB]">
        <div className="w-1.5 h-4 bg-gradient-to-b from-[#43A047] to-[#1565C0] rounded-full"></div>
        <h3 className="font-bold text-[12px] text-[#0F2A3D]">{title}</h3>
      </div>
      <div className="p-3 grid grid-cols-4 gap-y-4 gap-x-1 bg-gradient-to-b from-white to-[#F7FAF8]">
        {children}
      </div>
    </div>
  );
}

function GridFeatureButton({ title, icon: Icon, color, onClick }: { title: string; icon: any; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-start group cursor-pointer w-full">
      <div 
        className="relative overflow-hidden w-12 h-12 rounded-[16px] flex items-center justify-center border border-white/30 transition-transform active:scale-90"
        style={{
          background: `linear-gradient(145deg, ${color}, ${shade(color, 0.32)})`,
          boxShadow: `0 6px 12px -4px ${color}99, inset 0 1px 0 rgba(255,255,255,0.35)`
        }}
      >
        <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/15"></span>
        <Icon className="relative text-white drop-shadow-sm" size={24} strokeWidth={1.9} />
      </div>
      <span className="mt-1.5 text-[10px] font-bold text-[#0F2A3D] text-center leading-tight whitespace-normal break-words w-full px-0.5">
        {title}
      </span>
    </button>
  );
}

function QuickActionButton({ title, icon: Icon, color, onClick }: { title: string; icon: any; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1.5 p-1 rounded-xl hover:bg-[#F1F6F3] active:bg-[#E4EEE8] transition cursor-pointer">
      <div 
        className="relative overflow-hidden w-11 h-11 rounded-2xl flex items-center justify-center border border-white/30"
        style={{
          background: `linear-gradient(145deg, ${color}, ${shade(color, 0.32)})`,
          boxShadow: `0 6px 12px -4px ${color}99, inset 0 1px 0 rgba(255,255,255,0.35)`
        }}
      >
        <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white/15"></span>
        <Icon className="relative text-white drop-shadow-sm" size={20} strokeWidth={2} />
      </div>
      <span className="text-[10px] font-bold text-[#0F2A3D]">{title}</span>
    </button>
  );
}

function BottomNavItem({ icon: Icon, label, isSelected, onClick }: { icon: any; label: string; isSelected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 cursor-pointer w-12 pt-1">
      <div className={`p-1.5 rounded-full transition-all duration-300 ${isSelected ? 'bg-gradient-to-br from-[#2E7D32] to-[#00796B] shadow-[0_6px_12px_-4px_rgba(0,121,107,0.75)] -translate-y-0.5' : 'bg-transparent'}`}>
        <Icon size={18} className={`transition-colors duration-300 ${isSelected ? 'text-white' : 'text-[#64748B]'}`} />
      </div>
      <span className={`text-[9px] ${isSelected ? 'font-bold text-[#0B5C47]' : 'font-medium text-[#64748B]'}`}>
        {label}
      </span>
    </button>
  );
}