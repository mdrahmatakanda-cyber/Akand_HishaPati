import { useState } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, ChevronLeft, ChevronRight, 
  CalendarDays, TrendingUp, ShoppingBag, Box, Users, 
  UserSquare2, ArrowDownUp, Wallet, Truck, Banknote, 
  RotateCcw, ChevronDown, ChevronUp, PlusCircle, MinusCircle,
  PieChart, Tag, X, Search, Building2
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

// --- রিপোর্ট ডেটা ম্যাপিং (আগের মতোই) ---
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
    { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', salePrice: 2050, purchasePrice: 1900 },
    { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', salePrice: 350, purchasePrice: 280 },
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
  const [showCategoryReport, setShowCategoryReport] = useState(true);
  const [showCompanyReport, setShowCompanyReport] = useState(true);

  // মডাল স্টেট
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // ১. ক্যাটাগরি ভিত্তিক রিপোর্ট ডাটা
  const categoryReports = [
    { name: 'মাছের খাদ্য', sales: 45000, purchase: 38000, profit: 7000 },
    { name: 'ঔষধ ও ভিটামিন', sales: 12000, purchase: 13500, profit: -1500 },
    { name: 'যন্ত্রপাতি', sales: 25000, purchase: 18000, profit: 7000 },
    { name: 'প্যাকেজিং', sales: 5000, purchase: 3500, profit: 1500 },
  ];
  const totalCategoryProfit = categoryReports.reduce((acc, curr) => acc + curr.profit, 0);

  // ২. কোম্পানি ভিত্তিক রিপোর্ট ডাটা (নতুন)
  const companyReports = [
    { name: 'নিউজা', sales: 65000, purchase: 55000, profit: 10000 },
    { name: 'প্যারাগন', sales: 15000, purchase: 16000, profit: -1000 },
    { name: 'স্কয়ার', sales: 20000, purchase: 18000, profit: 2000 },
    { name: 'নিপ্রো', sales: 8000, purchase: 5000, profit: 3000 },
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

  // মডাল ওপেন করার ফাংশন
  const openReportModal = (type: string) => {
    setSelectedReportType(type);
    setModalSearchQuery('');
  };

  // মডালের ভেতরের ডেটা ফিল্টার
  const currentModalData = selectedReportType ? reportData[selectedReportType] : [];
  const filteredModalData = currentModalData.filter(item => 
    JSON.stringify(item).toLowerCase().includes(modalSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ব্যবসার রিপোর্ট</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
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
          
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <button onClick={() => openReportModal('income')} className="border border-green-500 text-green-600 bg-green-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition">
              <PlusCircle size={16}/> আয় যোগ করুন
            </button>
            <button onClick={() => openReportModal('expense')} className="border border-red-500 text-red-600 bg-red-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition">
              <MinusCircle size={16}/> ব্যয় যোগ করুন
            </button>
          </div>

          {/* ১. ক্যাটাগরি ভিত্তিক লাভ-ক্ষতি */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            <div onClick={() => setShowCategoryReport(!showCategoryReport)} className="bg-[#F3F4F6] p-2.5 flex justify-between items-center cursor-pointer border-b border-gray-200">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-[#0B5C47]"/>
                <span className="font-bold text-sm text-gray-800">ক্যাটাগরি ভিত্তিক লাভ-ক্ষতি</span>
              </div>
              {showCategoryReport ? <ChevronUp size={20} className="text-gray-600"/> : <ChevronDown size={20} className="text-gray-600"/>}
            </div>
            
            {showCategoryReport && (
              <div className="p-2 flex flex-col gap-2 animate-in fade-in duration-200">
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
              </div>
            )}
          </div>

          {/* ২. কোম্পানি ভিত্তিক লাভ-ক্ষতি (নতুন) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            <div onClick={() => setShowCompanyReport(!showCompanyReport)} className="bg-[#F3F4F6] p-2.5 flex justify-between items-center cursor-pointer border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#1E88E5]"/>
                <span className="font-bold text-sm text-gray-800">কোম্পানি ভিত্তিক লাভ-ক্ষতি</span>
              </div>
              {showCompanyReport ? <ChevronUp size={20} className="text-gray-600"/> : <ChevronDown size={20} className="text-gray-600"/>}
            </div>
            
            {showCompanyReport && (
              <div className="p-2 flex flex-col gap-2 animate-in fade-in duration-200">
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
                
                <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-2.5 flex justify-between items-center mt-1">
                  <span className="font-bold text-sm text-gray-800">সর্বমোট কোম্পানি লাভ/লস:</span>
                  <span className={`font-black text-base ${totalCompanyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ৳ {toBangla(Math.abs(totalCompanyProfit))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* মোট বাকির হিসাব */}
          <div className="bg-[#F3F4F6] rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            <div className="bg-[#E8ECEB] p-2 flex justify-between items-center border-b border-gray-200">
              <span className="font-bold text-sm">মোট বাকির হিসাব</span>
              <span className="font-black text-red-500 text-sm">{toBangla(0)} ৳</span>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2">
              <div className="bg-[#0B5C47] text-white p-2 rounded-lg text-center">
                <p className="text-[11px] font-bold">সাপ্লায়ারকে দিবো</p>
                <p className="font-black text-base mt-1">{toBangla(0)} ৳</p>
              </div>
              <div className="bg-[#DC2626] text-white p-2 rounded-lg text-center">
                <p className="text-[11px] font-bold">কাস্টমার থেকে পাবো</p>
                <p className="font-black text-base mt-1">{toBangla(0)} ৳</p>
              </div>
            </div>
          </div>

          {/* সাধারণ বিক্রি রিপোর্ট */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm shrink-0">
             <div className="bg-[#F3F4F6] p-2.5 font-bold border-b border-gray-200">সাধারণ বিক্রি রিপোর্ট</div>
             <div className="p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <div><p className="font-bold text-gray-700">নগদ বেচা</p><p className="text-[10px] text-gray-500">(কাস্টমার বাকি বাদে)</p></div>
                  <span className="font-bold text-green-600">{toBangla(100)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">কাস্টমার থেকে বাকির টাকা পেয়েছেন</p>
                  <span className="font-bold text-green-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">অন্যান্য আয়</p>
                  <span className="font-bold text-green-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <div><p className="font-bold text-gray-700">নগদ কেনা</p><p className="text-[10px] text-gray-500">(সাপ্লায়ার বাকি বাদে)</p></div>
                  <span className="font-bold text-red-600">{toBangla(980)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">সাপ্লায়ারকে বাকির টাকা দিয়েছেন</p>
                  <span className="font-bold text-red-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">অন্যান্য খরচ</p>
                  <span className="font-bold text-red-600">{toBangla(0)} ৳</span>
                </div>
             </div>
             <div className="bg-[#F3F4F6] p-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-gray-800">সর্বমোট ব্যালেন্স</p>
                  <span className="font-black text-red-600 text-base">-{toBangla(880)} ৳</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">(মোট বিক্রি + কাস্টমার বাকি + অন্যান্য আয়) - (মোট কেনা + সাপ্লায়ার বাকি + অন্যান্য খরচ)</p>
                
                <p className="font-bold text-gray-800">পণ্য বিক্রি থেকে লাভ</p>
                <p className="text-[10px] text-gray-500 mb-2">(বিক্রিত পণ্যের বিক্রয় - ক্রয় মূল্য)</p>
                <div className="grid grid-cols-3 divide-x divide-gray-300 text-center bg-white rounded-lg border py-1">
                   <div><p className="text-[10px] text-gray-500">নগদ টাকা</p><p className="font-bold text-sm text-green-600">{toBangla(30)} ৳</p></div>
                   <div><p className="text-[10px] text-gray-500">বাকি</p><p className="font-bold text-sm text-red-600">{toBangla(0)} ৳</p></div>
                   <div><p className="text-[10px] text-gray-500">মোট</p><p className="font-bold text-sm text-gray-800">{toBangla(30)} ৳</p></div>
                </div>
             </div>
          </div>

          {/* ব্যবসার সকল রিপোর্ট গ্রিড */}
          <div className="bg-[#F3F4F6] rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            <div onClick={() => setShowAllReports(!showAllReports)} className="p-2.5 flex justify-between items-center cursor-pointer">
              <span className="font-bold text-base">ব্যবসার সকল রিপোর্ট</span>
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

        </div>
      </main>

      {/* ================= রিপোর্ট ডিটেইলস মডাল ================= */}
      {selectedReportType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
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
                    {/* রিপোর্ট টাইপ অনুযায়ী ডাইনামিক ডিসপ্লে */}
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
                        <p className="text-xs text-gray-600 mb-1">ক্যাটাগরি: {item.category} | কোম্পানি: {item.company}</p>
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

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}>
      {title}
    </button>
  );
}