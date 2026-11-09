import { useState } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, ChevronLeft, ChevronRight, 
  CalendarDays, TrendingUp, ShoppingBag, Box, Users, 
  UserSquare2, ArrowDownUp, Wallet, Truck, Banknote, 
  RotateCcw, ChevronDown, ChevronUp, PlusCircle, MinusCircle, Tag, X, Search, CheckCircle2, Building2
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

// --- রিপোর্ট ডেটা ম্যাপিং ---
const reportData: Record<string, any[]> = {
  'sale': [
    { id: 1, date: '০৭ নভেম্বর, ২৬', item: 'গ্রোয়ার ফিড', customer: 'রহিম স্টোর', amount: 2050, status: 'পরিশোধিত' },
    { id: 2, date: '০৬ নভেম্বর, ২৬', item: 'ক্যালসিয়াম পাউডার', customer: 'করিম এন্টারপ্রাইজ', amount: 350, status: 'বাকি' },
  ],
  'purchase': [
    { id: 1, date: '০৭ নভেম্বর, ২৬', item: 'গ্রোয়ার ফিড', supplier: 'ভাই ভাই এগ্রো', amount: 1900, status: 'পরিশোধিত' },
    { id: 2, date: '০৫ নভেম্বর, ২৬', item: 'অক্সিজেন পাম্প', supplier: 'মোল্লা পোল্ট্রি', amount: 4000, status: 'বাকি' },
  ],
  'stock': [
    { id: 1, product: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', stock: 50, value: 95000 },
    { id: 2, product: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', stock: 100, value: 28000 },
  ],
  'product': [
    { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', salePrice: 2050, purchasePrice: 1900 },
    { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', salePrice: 350, purchasePrice: 280 },
  ],
  'best_customer': [
    { id: 1, name: 'রহিম স্টোর', phone: '01711000001', totalPurchase: 15000 },
    { id: 2, name: 'করিম এন্টারপ্রাইজ', phone: '01711000002', totalPurchase: 12000 },
  ],
  'best_employee': [
    { id: 1, name: 'সজীব (ম্যানেজার)', phone: '01911000001', totalSales: 45000 },
    { id: 2, name: 'রফিক (এসআর)', phone: '01911000002', totalSales: 38000 },
  ],
  'profit_loss': [
    { id: 1, category: 'মাছের খাদ্য', sale: 45000, purchase: 38000, profit: 7000 },
    { id: 2, category: 'ঔষধ ও ভিটামিন', sale: 12000, purchase: 13500, profit: -1500 },
  ],
  'expense': [
    { id: 1, date: '০৭ নভেম্বর, ২৬', reason: 'দোকান ভাড়া', amount: 5000 },
    { id: 2, date: '০৫ নভেম্বর, ২৬', reason: 'বিদ্যুৎ বিল', amount: 1200 },
  ],
  'supplier': [
    { id: 1, name: 'ভাই ভাই এগ্রো', phone: '01511000001', due: 5000 },
    { id: 2, name: 'মোল্লা পোল্ট্রি', phone: '01511000002', due: 2000 },
  ],
  'income': [
    { id: 1, date: '০৭ নভেম্বর, ২৬', source: 'পণ্য বিক্রি', amount: 25000 },
    { id: 2, date: '০৬ নভেম্বর, ২৬', source: 'অন্যান্য আয়', amount: 1000 },
  ],
  'sale_return': [
    { id: 1, date: '০৭ নভেম্বর, ২৬', item: 'গ্রোয়ার ফিড', customer: 'রহিম স্টোর', amount: 2050 },
  ],
  'purchase_return': [
    { id: 1, date: '০৬ নভেম্বর, ২৬', item: 'ক্যালসিয়াম পাউডার', supplier: 'ভাই ভাই এগ্রো', amount: 350 },
  ],
};

const reportTitles: Record<string, string> = {
  'sale': 'বিক্রির রিপোর্ট', 'purchase': 'ক্রয়ের রিপোর্ট', 'stock': 'স্টকের রিপোর্ট',
  'product': 'পণ্য রিপোর্ট', 'best_customer': 'সেরা কাস্টমার', 'best_employee': 'সেরা কর্মচারী',
  'profit_loss': 'লাভ ক্ষতি রিপোর্ট', 'expense': 'খরচের রিপোর্ট', 'supplier': 'সাপ্লায়ার রিপোর্ট',
  'income': 'আয়ের রিপোর্ট', 'sale_return': 'বেচার রিটাইল রিপোর্ট', 'purchase_return': 'কেনার রিটাইল রিপোর্ট',
};

export default function ReportsPage({ onBack, onNavigate }: Props) {
  const [activeFilter, setActiveFilter] = useState('month');
  const [dateRange, setDateRange] = useState('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬');
  const [showAllReports, setShowAllReports] = useState(true);
  
  // টগল স্টেট (ক্যাটাগরি নাকি কোম্পানি)
  const [activeProfitTab, setActiveProfitTab] = useState<'category' | 'company'>('category');

  // মডাল স্টেট
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // সামারি ডাটা (৯টি কার্ডের জন্য)
  const summaryData = {
    cashBalance: 180000,
    totalInvestment: 500000,
    totalPurchase: 320000,
    totalSales: 245000,
    totalExpense: 34500,
    totalProfit: 210500,
    stockValue: 155000,
    customerDue: 15000,
    supplierDue: 8000
  };

  // ক্যাটাগরি ভিত্তিক ডাটা
  const categoryReports = [
    { name: 'মাছের খাদ্য', sales: 45000, purchase: 38000, profit: 7000 },
    { name: 'ঔষধ ও ভিটামিন', sales: 12000, purchase: 13500, profit: -1500 },
    { name: 'যন্ত্রপাতি', sales: 25000, purchase: 18000, profit: 7000 },
    { name: 'প্যাকেজিং', sales: 5000, purchase: 3500, profit: 1500 },
  ];
  const totalCategoryProfit = categoryReports.reduce((acc, curr) => acc + curr.profit, 0);

  // কোম্পানি ভিত্তিক ডাটা
  const companyReports = [
    { name: 'নিউজা', sales: 65000, purchase: 52000, profit: 13000 },
    { name: 'প্যারাগন', sales: 45000, purchase: 38000, profit: 7000 },
    { name: 'স্কয়ার', sales: 30000, purchase: 28000, profit: 2000 },
  ];
  const totalCompanyProfit = companyReports.reduce((acc, curr) => acc + curr.profit, 0);

  const reportItems = [
    { title: 'বিক্রির রিপোর্ট', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', type: 'sale' },
    { title: 'ক্রয়ের রিপোর্ট', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100', type: 'purchase' },
    { title: 'স্টকের রিপোর্ট', icon: Box, color: 'text-orange-600', bg: 'bg-orange-100', type: 'stock' },
    { title: 'পণ্য রিপোর্ট', icon: Box, color: 'text-amber-600', bg: 'bg-amber-100', type: 'product' },
    { title: 'সেরা কাস্টমার', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', type: 'best_customer' },
    { title: 'সেরা কর্মচারী', icon: UserSquare2, color: 'text-purple-600', bg: 'bg-purple-100', type: 'best_employee' },
    { title: 'লাভ ক্ষতি রিপোর্ট', icon: ArrowDownUp, color: 'text-red-600', bg: 'bg-red-100', type: 'profit_loss' },
    { title: 'খরচের রিপোর্ট', icon: Wallet, color: 'text-yellow-600', bg: 'bg-yellow-100', type: 'expense' },
    { title: 'সাপ্লায়ার রিপোর্ট', icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-100', type: 'supplier' },
    { title: 'আয়ের রিপোর্ট', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-100', type: 'income' },
    { title: 'বেচার রিটাইল রিপোর্ট', icon: RotateCcw, color: 'text-pink-600', bg: 'bg-pink-100', type: 'sale_return' },
    { title: 'কেনার রিটাইল রিপোর্ট', icon: RotateCcw, color: 'text-rose-600', bg: 'bg-rose-100', type: 'purchase_return' },
  ];

  const openReportModal = (type: string) => {
    setSelectedReportType(type);
    setModalSearchQuery('');
  };

  const currentModalData = selectedReportType ? reportData[selectedReportType] : [];
  const filteredModalData = currentModalData.filter(item => 
    JSON.stringify(item).toLowerCase().includes(modalSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      {/* ================= স্ক্রিন ভিউ ================= */}
      <div className="flex flex-col h-full print-hidden">
        
        <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
              <h1 className="font-bold text-lg">দোকান রিপোর্ট</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center gap-1 text-xs font-bold px-2">
                <FileText size={16} /> প্রিন্ট
              </button>
              <button onClick={() => onNavigate('help')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto flex flex-col pb-6 scrollbar-hide">
          
          <div className="bg-[#1E88E5] text-white p-3 rounded-2xl shadow-md mx-2 mt-2 shrink-0">
            <div className="flex justify-between items-center mb-1">
              <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
              <span className="text-xs font-medium text-blue-100">{toBangla(dateRange)}</span>
              <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
            <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => { setActiveFilter('day'); setDateRange('০৭ নভেম্বর, ২৬'); }} />
            <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => { setActiveFilter('month'); setDateRange('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬'); }} />
            <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => { setActiveFilter('year'); setDateRange('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬'); }} />
            <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setDateRange('সব সময়'); }} />
            <button onClick={() => setActiveFilter('custom')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
              <CalendarDays size={14} /> কাস্টম
            </button>
          </div>

          <div className="p-2 flex flex-col gap-3">
            
            {/* ৯টি সামারি কার্ড */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <SummaryCard title="ক্যাশ ব্যালেন্স" value={summaryData.cashBalance} icon={Wallet} color="text-[#166534]" bg="bg-[#DDF3E2]" border="border-[#B4DFBF]" />
              <SummaryCard title="মোট ইনভেস্ট" value={summaryData.totalInvestment} icon={Box} color="text-[#1E40AF]" bg="bg-[#DCEBFC]" border="border-[#B5D2F3]" />
              <SummaryCard title="মোট ক্রয়" value={summaryData.totalPurchase} icon={ShoppingBag} color="text-[#0F766E]" bg="bg-[#D6F1EE]" border="border-[#A5DDD6]" />
              <SummaryCard title="মোট বিক্রি" value={summaryData.totalSales} icon={TrendingUp} color="text-[#15803D]" bg="bg-[#DCFCE7]" border="border-[#86EFAC]" />
              <SummaryCard title="মোট খরচ" value={summaryData.totalExpense} icon={Wallet} color="text-[#B91C1C]" bg="bg-[#FEE2E2]" border="border-[#FCA5A5]" />
              <SummaryCard title="মোট লাভ" value={summaryData.totalProfit} icon={CheckCircle2} color="text-[#047857]" bg="bg-[#D1FAE5]" border="border-[#6EE7B7]" />
              <SummaryCard title="স্টক ভ্যালু" value={summaryData.stockValue} icon={Box} color="text-[#B45309]" bg="bg-[#FEF3C7]" border="border-[#FCD34D]" />
              <SummaryCard title="কাস্টমার বাকি" value={summaryData.customerDue} icon={Users} color="text-[#B91C1C]" bg="bg-[#FEE2E2]" border="border-[#FCA5A5]" />
              <SummaryCard title="সাপ্লায়ার বাকি" value={summaryData.supplierDue} icon={Truck} color="text-[#1D4ED8]" bg="bg-[#DBEAFE]" border="border-[#93C5FD]" />
            </div>

            {/* আয় ও ব্যয় বাটন */}
            <div className="grid grid-cols-2 gap-2 shrink-0 mt-1">
              <button onClick={() => openReportModal('income')} className="border border-green-500 text-green-600 bg-green-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition">
                <PlusCircle size={16}/> আয় যোগ করুন
              </button>
              <button onClick={() => openReportModal('expense')} className="border border-red-500 text-red-600 bg-red-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition">
                <MinusCircle size={16}/> ব্যয় যোগ করুন
              </button>
            </div>

            {/* ক্যাটাগরি ও কোম্পানি ভিত্তিক লাভ-ক্ষতি (টগল সিস্টেম) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
              {/* টগল হেডার */}
              <div className="bg-[#F3F4F6] p-2 flex justify-between items-center border-b border-gray-200">
                <div className="flex bg-[#E1EBE6] p-0.5 rounded-lg shadow-inner w-full">
                  <button
                    onClick={() => setActiveProfitTab('category')}
                    className={`flex-1 py-1.5 text-xs rounded-md font-bold transition flex items-center justify-center gap-1 ${
                      activeProfitTab === 'category' ? 'bg-white shadow-sm text-[#0B5C47]' : 'text-gray-500'
                    }`}
                  >
                    <Tag size={14}/> ক্যাটাগরি ভিত্তিক
                  </button>
                  <button
                    onClick={() => setActiveProfitTab('company')}
                    className={`flex-1 py-1.5 text-xs rounded-md font-bold transition flex items-center justify-center gap-1 ${
                      activeProfitTab === 'company' ? 'bg-white shadow-sm text-[#1E88E5]' : 'text-gray-500'
                    }`}
                  >
                    <Building2 size={14}/> কোম্পানি ভিত্তিক
                  </button>
                </div>
              </div>
              
              {/* কন্টেন্ট এরিয়া */}
              <div className="p-2 flex flex-col gap-2 animate-in fade-in duration-200">
                {activeProfitTab === 'category' ? (
                  <>
                    {categoryReports.map((cat, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-2.5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><Tag size={14} className="text-[#0B5C47]"/> {cat.name}</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${cat.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cat.profit >= 0 ? 'লাভ' : 'লস'}: ৳{toBangla(Math.abs(cat.profit))}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600">
                          <div className="flex justify-between bg-white p-1.5 rounded border border-gray-100">
                            <span>বিক্রি:</span> <span className="text-green-600">৳{toBangla(cat.sales)}</span>
                          </div>
                          <div className="flex justify-between bg-white p-1.5 rounded border border-gray-100">
                            <span>ক্রয়:</span> <span className="text-red-600">৳{toBangla(cat.purchase)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-[#E8F5E9] border border-green-200 rounded-lg p-2.5 flex justify-between items-center mt-1">
                      <span className="font-bold text-sm text-gray-800">সর্বমোট ক্যাটাগরি লাভ/লস:</span>
                      <span className={`font-black text-base ${totalCategoryProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ৳ {toBangla(Math.abs(totalCategoryProfit))}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {companyReports.map((comp, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-2.5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5"><Building2 size={14} className="text-[#1E88E5]"/> {comp.name}</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${comp.profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {comp.profit >= 0 ? 'লাভ' : 'লস'}: ৳{toBangla(Math.abs(comp.profit))}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-gray-600">
                          <div className="flex justify-between bg-white p-1.5 rounded border border-gray-100">
                            <span>বিক্রি:</span> <span className="text-green-600">৳{toBangla(comp.sales)}</span>
                          </div>
                          <div className="flex justify-between bg-white p-1.5 rounded border border-gray-100">
                            <span>ক্রয়:</span> <span className="text-red-600">৳{toBangla(comp.purchase)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-[#EFF6FF] border border-[#1E88E5]/30 rounded-lg p-2.5 flex justify-between items-center mt-1">
                      <span className="font-bold text-sm text-gray-800">সর্বমোট কোম্পানি লাভ/লস:</span>
                      <span className={`font-black text-base ${totalCompanyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ৳ {toBangla(Math.abs(totalCompanyProfit))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ব্যবসার সকল রিপোর্ট গ্রিড */}
            <div className="bg-[#F3F4F6] rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
              <div onClick={() => setShowAllReports(!showAllReports)} className="p-2.5 flex justify-between items-center cursor-pointer">
                <span className="font-bold text-base">সকল রিপোর্ট দেখুন</span>
                {showAllReports ? <ChevronUp size={20} className="text-gray-600"/> : <ChevronDown size={20} className="text-gray-600"/>}
              </div>
              
              {showAllReports && (
                <div className="p-2.5 grid grid-cols-3 gap-2 bg-white border-t border-gray-200">
                  {reportItems.map((item, idx) => (
                    <button key={idx} onClick={() => openReportModal(item.type)} className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition bg-white active:scale-95">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color} mb-1.5`}>
                         <item.icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* প্রিন্ট বাটন */}
            <button onClick={() => window.print()} className="w-full bg-[#1E88E5] text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2 active:scale-95 transition mt-2">
               <FileText size={18}/> A4 সাইজে রিপোর্ট প্রিন্ট করুন
            </button>

          </div>
        </main>
      </div>

      {/* ================= A4 প্রিন্ট ভিউ ================= */}
      <div className="hidden print-only w-full bg-white text-black font-serif text-[12px]">
        
        {/* প্রিন্ট হেডার */}
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-xl font-bold uppercase">Akand Smart Solutions</h1>
          <p className="text-sm">দোকান রিপোর্ট</p>
          <p className="text-xs mt-1">রিপোর্টের সময়কাল: {toBangla(dateRange)}</p>
        </div>

        {/* ৯টি সামারি টেবিল */}
        <table className="w-full border-collapse border border-black mb-4 text-center">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold">ক্যাশ ব্যালেন্স<br/>৳{toBangla(summaryData.cashBalance)}</td>
              <td className="border border-black p-1 font-bold">মোট ইনভেস্ট<br/>৳{toBangla(summaryData.totalInvestment)}</td>
              <td className="border border-black p-1 font-bold">মোট ক্রয়<br/>৳{toBangla(summaryData.totalPurchase)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">মোট বিক্রি<br/>৳{toBangla(summaryData.totalSales)}</td>
              <td className="border border-black p-1 font-bold">মোট খরচ<br/>৳{toBangla(summaryData.totalExpense)}</td>
              <td className="border border-black p-1 font-bold">মোট লাভ<br/>৳{toBangla(summaryData.totalProfit)}</td>
            </tr>
            <tr>
              <td className="border border-black p-1 font-bold">স্টক ভ্যালু<br/>৳{toBangla(summaryData.stockValue)}</td>
              <td className="border border-black p-1 font-bold">কাস্টমার বাকি<br/>৳{toBangla(summaryData.customerDue)}</td>
              <td className="border border-black p-1 font-bold">সাপ্লায়ার বাকি<br/>৳{toBangla(summaryData.supplierDue)}</td>
            </tr>
          </tbody>
        </table>

        {/* ক্যাটাগরি ও কোম্পানি রিপোর্ট টেবিল */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-bold border-b border-black mb-1 pb-0.5">ক্যাটাগরি ভিত্তিক লাভ-ক্ষতি</h3>
            <table className="w-full border-collapse border border-black text-left text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1">ক্যাটাগরি</th>
                  <th className="border border-black p-1 text-right">বিক্রি</th>
                  <th className="border border-black p-1 text-right">ক্রয়</th>
                  <th className="border border-black p-1 text-right">লাভ/লস</th>
                </tr>
              </thead>
              <tbody>
                {categoryReports.map((cat, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1">{cat.name}</td>
                    <td className="border border-black p-1 text-right">{toBangla(cat.sales)}</td>
                    <td className="border border-black p-1 text-right">{toBangla(cat.purchase)}</td>
                    <td className="border border-black p-1 text-right font-bold">{cat.profit >= 0 ? '+' : '-'}{toBangla(Math.abs(cat.profit))}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className="border border-black p-1 text-right" colSpan={3}>সর্বমোট:</td>
                  <td className="border border-black p-1 text-right">{toBangla(Math.abs(totalCategoryProfit))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-bold border-b border-black mb-1 pb-0.5">কোম্পানি ভিত্তিক লাভ-ক্ষতি</h3>
            <table className="w-full border-collapse border border-black text-left text-[11px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1">কোম্পানি</th>
                  <th className="border border-black p-1 text-right">বিক্রি</th>
                  <th className="border border-black p-1 text-right">ক্রয়</th>
                  <th className="border border-black p-1 text-right">লাভ/লস</th>
                </tr>
              </thead>
              <tbody>
                {companyReports.map((comp, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1">{comp.name}</td>
                    <td className="border border-black p-1 text-right">{toBangla(comp.sales)}</td>
                    <td className="border border-black p-1 text-right">{toBangla(comp.purchase)}</td>
                    <td className="border border-black p-1 text-right font-bold">{comp.profit >= 0 ? '+' : '-'}{toBangla(Math.abs(comp.profit))}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className="border border-black p-1 text-right" colSpan={3}>সর্বমোট:</td>
                  <td className="border border-black p-1 text-right">{toBangla(Math.abs(totalCompanyProfit))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* প্রিন্ট ফুটার */}
        <div className="mt-8 text-center text-[10px] text-gray-600">
          <p>This report is generated by Akand Smart Solutions</p>
          <p>Printed on: {new Date().toLocaleString('bn-BD')}</p>
        </div>
      </div>

      {/* ================= রিপোর্ট ডিটেইলস মডাল ================= */}
      {selectedReportType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm print-hidden">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base">{reportTitles[selectedReportType]}</h2>
              <button onClick={() => setSelectedReportType(null)} className="p-1 bg-white/20 rounded-full active:scale-90"><X size={18}/></button>
            </div>

            <div className="p-3 bg-white border-b border-gray-200 shrink-0">
              <div className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="খুঁজুন..." value={modalSearchQuery} onChange={e => setModalSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {filteredModalData.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 text-sm">কোনো ডাটা পাওয়া যায়নি</div>
              ) : (
                filteredModalData.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    {selectedReportType === 'sale' && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.item}</h3>
                          <span className="font-black text-green-600">৳{toBangla(item.amount)}</span>
                        </div>
                        <p className="text-xs text-gray-600">কাস্টমার: {item.customer}</p>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                          <span>{toBangla(item.date)}</span>
                          <span className={`font-bold ${item.status === 'পরিশোধিত' ? 'text-green-500' : 'text-red-500'}`}>{item.status}</span>
                        </div>
                      </>
                    )}
                    {selectedReportType === 'purchase' && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.item}</h3>
                          <span className="font-black text-red-600">৳{toBangla(item.amount)}</span>
                        </div>
                        <p className="text-xs text-gray-600">সাপ্লায়ার: {item.supplier}</p>
                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                          <span>{toBangla(item.date)}</span>
                          <span className={`font-bold ${item.status === 'পরিশোধিত' ? 'text-green-500' : 'text-red-500'}`}>{item.status}</span>
                        </div>
                      </>
                    )}
                    {selectedReportType === 'stock' && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.product}</h3>
                          <span className="font-black text-[#1E88E5]">৳{toBangla(item.value)}</span>
                        </div>
                        <p className="text-xs text-gray-600">ক্যাটাগরি: {item.category} | স্টক: {toBangla(item.stock)}</p>
                      </>
                    )}
                    {selectedReportType === 'product' && (
                      <>
                        <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                        <p className="text-xs text-gray-600 mb-1">ক্যাটাগরি: {item.category}</p>
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="text-green-600">বিক্রয়: ৳{toBangla(item.salePrice)}</span>
                          <span className="text-red-600">ক্রয়: ৳{toBangla(item.purchasePrice)}</span>
                        </div>
                      </>
                    )}
                    {(selectedReportType === 'best_customer' || selectedReportType === 'supplier') && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                          <span className="font-black text-[#1E88E5]">৳{toBangla(item.totalPurchase || item.due)}</span>
                        </div>
                        <p className="text-xs text-gray-600">{toBangla(item.phone)}</p>
                      </>
                    )}
                    {selectedReportType === 'best_employee' && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                          <span className="font-black text-green-600">৳{toBangla(item.totalSales)}</span>
                        </div>
                        <p className="text-xs text-gray-600">{toBangla(item.phone)}</p>
                      </>
                    )}
                    {selectedReportType === 'profit_loss' && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-sm text-gray-800">{item.category}</h3>
                          <span className={`font-black ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profit >= 0 ? 'লাভ' : 'লস'}: ৳{toBangla(Math.abs(item.profit))}
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs font-bold text-gray-600">
                          <span>বিক্রি: ৳{toBangla(item.sale)}</span> | <span>ক্রয়: ৳{toBangla(item.purchase)}</span>
                        </div>
                      </>
                    )}
                    {(selectedReportType === 'expense' || selectedReportType === 'income') && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.reason || item.source}</h3>
                          <span className={`font-black ${selectedReportType === 'income' ? 'text-green-600' : 'text-red-600'}`}>৳{toBangla(item.amount)}</span>
                        </div>
                        <p className="text-xs text-gray-600">{toBangla(item.date)}</p>
                      </>
                    )}
                    {(selectedReportType === 'sale_return' || selectedReportType === 'purchase_return') && (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-sm text-gray-800">{item.item}</h3>
                          <span className="font-black text-red-600">৳{toBangla(item.amount)}</span>
                        </div>
                        <p className="text-xs text-gray-600">{item.customer || item.supplier}</p>
                        <p className="text-[10px] text-gray-500">{toBangla(item.date)}</p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 🧩 রি-ইউজেবল কম্পোনেন্টস
// ==========================================

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}>
      {title}
    </button>
  );
}

function SummaryCard({ title, value, icon: Icon, color, bg, border }: { title: string, value: number, icon: any, color: string, bg: string, border: string }) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-1.5 flex flex-col items-center justify-center min-w-0 shadow-sm`}>
      <span className={`flex items-center justify-center gap-0.5 w-full min-w-0 text-[8px] sm:text-[9px] font-bold ${color}`}>
        <Icon size={10} strokeWidth={2.5} className="shrink-0" /> <span className="truncate">{title}</span>
      </span>
      <span className={`text-[11px] sm:text-[12px] font-black ${color} truncate w-full text-center mt-0.5`}>৳ {toBangla(value)}</span>
    </div>
  );
}