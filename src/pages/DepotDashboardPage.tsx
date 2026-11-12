import { useState, useEffect } from 'react';
import { 
  // হেডার
  Headset, Mail, Scale, Store,
  // সামারি কার্ড
  Warehouse, HandCoins, Building2, 
  // ডিপো অপারেশনস
  Boxes, Handshake, Truck, ArrowRightLeft, ReceiptText, Banknote, Gift, BarChart3,
  // অন্যান্য
  Loader2, History,
  // নেভিগেশন
  LayoutDashboard, BookOpenText, PackageSearch, LayoutGrid
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoDepotStats } from '../lib/demoData';

interface Props {
  onNavigate: (screen: string) => void;
  onToggleMode: () => void;
}

// রঙ গাঢ় করার সহায়ক ফাংশন (আইকন টাইলের গ্রেডিয়েন্টের জন্য)
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function DepotDashboardPage({ onNavigate, onToggleMode }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ stockValue: 0, marketDue: 0, companyPayable: 0 });

  useEffect(() => {
    const fetchDepotStats = async () => {
      setIsLoading(true);
      try {
        if (isDemoMode) {
          setStats(demoDepotStats);
        } else {
          if (!activeBusiness?.id) return;
          const bizId = activeBusiness.id;

          const [prodRes, custRes, dealRes, supRes] = await Promise.all([
            supabase.from('products').select('stock_quantity, purchase_price').eq('business_id', bizId),
            supabase.from('customers').select('due_balance').eq('business_id', bizId),
            supabase.from('dealers').select('due_balance').eq('business_id', bizId),
            supabase.from('suppliers').select('due_balance').eq('business_id', bizId)
          ]);

          const stockVal = prodRes.data?.reduce((acc, curr) => acc + (Number(curr.stock_quantity) * Number(curr.purchase_price)), 0) || 0;
          
          const custDue = custRes.data?.reduce((acc, curr) => acc + Number(curr.due_balance), 0) || 0;
          const dealDue = dealRes.data?.reduce((acc, curr) => acc + Number(curr.due_balance), 0) || 0;
          
          const supDue = supRes.data?.reduce((acc, curr) => acc + Number(curr.due_balance), 0) || 0;

          setStats({
            stockValue: stockVal,
            marketDue: custDue + dealDue,
            companyPayable: supDue
          });
        }
      } catch (error) {
        console.error("Depot stats fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDepotStats();
  }, [isDemoMode, activeBusiness?.id]);

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* পেছনে হালকা নেভি আভা */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0A2540]/10 to-transparent pointer-events-none"></div>

      {/* ============================================================== */}
      {/* হেডার */}
      {/* ============================================================== */}
      <header className="relative bg-da-depotNavy text-white shadow-[0_12px_28px_-10px_rgba(10,37,64,0.75)] shrink-0 z-40 rounded-b-xl">
        <div className="px-3 py-2.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 p-1 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-[16px] text-white truncate max-w-[150px] leading-tight">{activeBusiness?.name || 'সেন্ট্রাল ডিপো'}</span>
              <span className="text-[10px] text-cyan-200 mt-0.5">ডিপো প্যানেল</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* ১. মোড (দোকান) পরিবর্তন */}
            <button onClick={onToggleMode} className="flex flex-col items-center text-white/90 hover:text-white transition group">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-active:scale-90 transition">
                <Store size={18} />
              </span>
              <span className="text-[9px] mt-0.5 font-medium">দোকান</span>
            </button>
            
            {/* ২. সাহায্য */}
            <button onClick={() => onNavigate('help')} className="flex flex-col items-center text-white/90 hover:text-white transition group">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-active:scale-90 transition"><Headset size={18} /></span>
              <span className="text-[9px] mt-0.5 font-medium">সাহায্য</span>
            </button>
            
            {/* ৩. ইনবক্স */}
            <button onClick={() => onNavigate('inbox')} className="flex flex-col items-center text-white/90 hover:text-white transition relative group">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-active:scale-90 transition">
                <Mail size={18} />
              </span>
              <span className="text-[9px] mt-0.5 font-medium">ইনবক্স</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* মেইন বডি */}
      {/* ============================================================== */}
      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-28 scrollbar-hide relative z-10">
        
        {/* সামারি কার্ড (৩টি) */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <SummaryCard
            title="মোট স্টক"
            icon={Warehouse}
            color="#1565C0"
            valueClass="text-da-depotBlue"
            cardClass="from-[#DDEAFB] to-white border-[#B7D2F4] shadow-[0_8px_16px_-10px_rgba(21,101,192,0.7)]"
            isLoading={isLoading}
            value={stats.stockValue}
          />
          <SummaryCard
            title="বাজারে পাওনা"
            icon={HandCoins}
            color="#D97706"
            valueClass="text-[#B45309]"
            cardClass="from-[#FDEFD0] to-white border-[#F5D69A] shadow-[0_8px_16px_-10px_rgba(217,119,6,0.7)]"
            isLoading={isLoading}
            value={stats.marketDue}
          />
          <SummaryCard
            title="কোম্পানি দেনা"
            icon={Building2}
            color="#D32F2F"
            valueClass="text-da-red"
            cardClass="from-[#FCE2E2] to-white border-[#F3BDBD] shadow-[0_8px_16px_-10px_rgba(211,47,47,0.7)]"
            isLoading={isLoading}
            value={stats.companyPayable}
          />
        </div>

        {/* নিট অবস্থা স্টেটাস বার */}
        <div className="bg-gradient-to-r from-white to-[#E8EEF5] rounded-xl border border-da-depotNavy/20 p-2.5 shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-da-depotNavy flex items-center justify-center shadow-inner">
              <Scale size={16} className="text-da-depotAmber" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-da-depotNavy">নিট অবস্থা</span>
              <span className="text-[9px] text-da-textMuted leading-none">(স্টক + পাওনা) - দেনা</span>
            </div>
          </div>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-da-depotNavy" />
          ) : (
            <span className={`font-black text-[16px] ${(stats.stockValue + stats.marketDue - stats.companyPayable) >= 0 ? 'text-da-depotNavy' : 'text-da-red'}`}>
              ৳{toBangla(Math.abs(stats.stockValue + stats.marketDue - stats.companyPayable))}
            </span>
          )}
        </div>

        {/* মূল মডিউল গ্রিড (৮টি) */}
        <div className="bg-white rounded-2xl border border-da-cardBorder shadow-[0_8px_22px_-12px_rgba(10,37,64,0.5)] overflow-hidden shrink-0">
          <div className="bg-gradient-to-r from-[#E4ECF5] to-white px-3 py-2 border-b border-da-cardBorder flex items-center gap-2">
            <div className="w-1.5 h-4 bg-gradient-to-b from-da-depotAmber to-da-depotBlue rounded-full"></div>
            <h3 className="font-bold text-[12px] text-da-depotNavy">ডিপো অপারেশনস</h3>
          </div>
          <div className="p-3 grid grid-cols-4 gap-y-4 gap-x-1 bg-gradient-to-b from-white to-[#F5F8FC]">
            <DepotModuleButton title="স্টক" icon={Boxes} color="#1565C0" onClick={() => onNavigate('stock')} />
            <DepotModuleButton title="ডিলার" icon={Handshake} color="#D97706" onClick={() => onNavigate('market')} />
            <DepotModuleButton title="এসআর" icon={Truck} color="#12386B" onClick={() => onNavigate('sr')} />
            <DepotModuleButton title="ট্রান্সফার" icon={ArrowRightLeft} color="#0891B2" onClick={() => onNavigate('depot')} />
            
            <DepotModuleButton title="বিক্রি" icon={ReceiptText} color="#2E7D32" onClick={() => onNavigate('sale')} />
            <DepotModuleButton title="খরচ" icon={Banknote} color="#D32F2F" onClick={() => onNavigate('expense_khata')} />
            <DepotModuleButton title="বোনাস" icon={Gift} color="#E65100" onClick={() => onNavigate('stock')} />
            <DepotModuleButton title="রিপোর্টস" icon={BarChart3} color="#00796B" onClick={() => onNavigate('reports')} />
          </div>
        </div>

        {/* সাম্প্রতিক অ্যাক্টিভিটি */}
        <div className="bg-white rounded-2xl border border-da-cardBorder shadow-[0_8px_22px_-12px_rgba(10,37,64,0.5)] p-3 shrink-0">
           <div className="flex items-center gap-2 mb-2 border-b border-da-cardBorder pb-2">
             <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-da-depotNavy to-da-depotBlue flex items-center justify-center shadow-[0_4px_8px_-3px_rgba(21,101,192,0.7)]">
               <History size={15} className="text-white" />
             </span>
             <h3 className="font-bold text-[12px] text-da-depotNavy">সাম্প্রতিক অ্যাক্টিভিটি</h3>
           </div>
           <div className="flex flex-col items-center py-4">
             <div className="w-12 h-12 rounded-full bg-[#EAF0F8] ring-1 ring-[#D3DFEE] flex items-center justify-center mb-2">
               <ReceiptText size={22} className="text-da-depotBlue/60" />
             </div>
             <div className="text-center text-[11px] text-da-textMuted font-bold">
               ডিপোতে কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি।
             </div>
           </div>
        </div>

      </main>

      {/* ============================================================== */}
      {/* বটম নেভিগেশন বার */}
      {/* ============================================================== */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl shadow-[0_-12px_30px_-8px_rgba(10,37,64,0.35)] rounded-t-[26px] border-t border-white z-50 shrink-0">
        <div className="absolute top-0 inset-x-10 h-[2px] rounded-full bg-gradient-to-r from-da-depotNavy via-da-depotBlue to-da-depotAmber"></div>
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <DepotNavItem icon={LayoutDashboard} label="হোম" isSelected={true} onClick={() => {}} />
          <DepotNavItem icon={BookOpenText} label="হিসাব" isSelected={false} onClick={() => onNavigate('reports')} />
          <DepotNavItem icon={PackageSearch} label="পণ্য" isSelected={false} onClick={() => onNavigate('stock')} />
          <DepotNavItem icon={LayoutGrid} label="মেনু" isSelected={false} onClick={() => onNavigate('menu')} />
        </div>
      </div>

    </div>
  );
}

// ==============================================================
// 🧩 রি-ইউজেবল কম্পোনেন্টস
// ==============================================================

function SummaryCard({ title, icon: Icon, color, valueClass, cardClass, isLoading, value }: {
  title: string; icon: any; color: string; valueClass: string; cardClass: string; isLoading: boolean; value: number;
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b rounded-2xl border px-1.5 pt-2.5 pb-2 flex flex-col justify-center items-center text-center min-w-0 ${cardClass}`}>
      {/* উপরে রঙিন স্ট্রাইপ */}
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${color}, ${shade(color, 0.25)})` }}></div>

      <div
        className="relative overflow-hidden w-9 h-9 rounded-xl flex items-center justify-center mb-1 border border-white/30"
        style={{
          background: `linear-gradient(145deg, ${color}, ${shade(color, 0.32)})`,
          boxShadow: `0 6px 10px -4px ${color}99, inset 0 1px 0 rgba(255,255,255,0.4)`
        }}
      >
        <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-white/20"></span>
        <Icon size={20} strokeWidth={2} className="relative text-white drop-shadow-sm" />
      </div>

      <span className="text-[10px] font-bold text-da-textMuted whitespace-nowrap">{title}</span>
      {isLoading ? (
        <Loader2 size={14} className={`animate-spin mt-1 ${valueClass}`} />
      ) : (
        <span className={`font-black text-[14px] mt-0.5 truncate w-full ${valueClass}`}>৳{toBangla(value)}</span>
      )}
    </div>
  );
}

function DepotModuleButton({ title, icon: Icon, color, onClick }: { title: string, icon: any, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-start cursor-pointer w-full active:scale-95 transition">
      <div
        className="relative overflow-hidden w-14 h-14 rounded-2xl flex items-center justify-center mb-1.5 border border-white/30"
        style={{
          background: `linear-gradient(145deg, ${color}, ${shade(color, 0.35)})`,
          boxShadow: `0 8px 14px -6px ${color}AA, inset 0 1px 0 rgba(255,255,255,0.4)`
        }}
      >
        {/* ডেকোরেশন: উপরে আলো ও নিচে ছায়ার বৃত্ত */}
        <span className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/15"></span>
        <span className="absolute -bottom-5 -left-5 w-10 h-10 rounded-full bg-black/10"></span>
        <Icon size={28} strokeWidth={1.8} className="relative text-white drop-shadow" />
      </div>
      <span className="text-[11px] font-bold text-da-textDark text-center leading-tight">{title}</span>
    </button>
  );
}

function DepotNavItem({ icon: Icon, label, isSelected, onClick }: { icon: any, label: string, isSelected: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-0.5 cursor-pointer w-14 pt-1 pb-1">
      <div className={`p-1.5 rounded-xl transition-all duration-300 ${isSelected ? 'bg-gradient-to-br from-da-depotNavy to-da-depotBlue shadow-[0_6px_12px_-4px_rgba(21,101,192,0.75)] -translate-y-0.5' : 'bg-transparent'}`}>
        <Icon size={20} className={`transition-colors duration-300 ${isSelected ? 'text-white' : 'text-da-textMuted'}`} />
      </div>
      <span className={`text-[10px] ${isSelected ? 'font-bold text-da-depotNavy' : 'font-medium text-da-textMuted'}`}>
        {label}
      </span>
    </button>
  );
}