import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Printer, TrendingUp, ShoppingBag, Banknote, 
  Truck, Target, Users, CalendarDays, X, ChevronRight, Check, Loader2
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotReportData, demoCompaniesList, demoCategories, demoDepotReportDetails } from '../../lib/demoData';

interface Props {
  onBack: () => void;
}

export default function DepotReportsPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
    totalSales: 0, totalPurchases: 0, totalExpenses: 0,
    transportSurplus: 0, totalProfit: 0, partnerProfit: 0,
  });

  // ফিল্টার স্টেট
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('MONTH');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  
  // ডাইনামিক ফিল্টার স্টেট
  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ডিটেইলস মডাল স্টেট
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState<{ key: string, title: string } | null>(null);
  
  // বিস্তারিত লিস্ট স্টেট
  const [detailListData, setDetailListData] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // মূল পেজের সাম্প্রতিক লেনদেন স্টেট
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // বিস্তারিত ডাটা ফেচ লজিক
  useEffect(() => {
    if (!isDetailModalOpen || !detailType) return;

    const fetchDetails = async () => {
      setIsDetailLoading(true);
      try {
        if (isDemoMode) {
          // ডেমু মোডে ডাটা লোড
          setDetailListData((demoDepotReportDetails as any)[detailType.key] || []);
        } else {
          // রিয়েল মোডে সুপাবেজ থেকে ডাটা লোড
          if (!activeBusiness?.id) return;
          
          let tableName = '';
          let dateColumn = '';
          let selectQuery = '*';

          if (detailType.key === 'sales') {
            tableName = 'sales'; dateColumn = 'sale_date'; 
            selectQuery = 'id, receipt_no, total_amount, sale_date, customers(name)';
          } else if (detailType.key === 'purchases') {
            tableName = 'purchases'; dateColumn = 'purchase_date';
            selectQuery = 'id, challan_no, total_amount, purchase_date, companies(name)';
          } else if (detailType.key === 'expenses') {
            tableName = 'expenses'; dateColumn = 'date';
            selectQuery = 'id, expense_type, amount, date, note';
          } else {
            // যদি transport বা profit হয়, আপাতত খালি রাখছি (পরবর্তীতে আলাদা কুয়েরি হবে)
            setDetailListData([]);
            setIsDetailLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from(tableName)
            .select(selectQuery)
            .eq('business_id', activeBusiness.id)
            .order(dateColumn, { ascending: false })
            .limit(50); // সর্বোচ্চ ৫০টি দেখাবে

          if (error) throw error;
          setDetailListData(data || []);
        }
      } catch (error) {
        console.error("Detail fetch error:", error);
        setDetailListData([]);
      } finally {
        setIsDetailLoading(false);
      }
    };

    fetchDetails();
  }, [isDetailModalOpen, detailType, isDemoMode, activeBusiness?.id]);

  // ১. কোম্পানি ও ক্যাটাগরি ডাটা ফেচ
  useEffect(() => {
    const fetchFilters = async () => {
      if (isDemoMode) {
        setCompanies(demoCompaniesList || []);
        setCategories(demoCategories || []); // demoData.ts এ demoCategories থাকলে
      } else {
        if (!activeBusiness?.id) return;
        const [compRes, catRes] = await Promise.all([
          supabase.from('companies').select('id, name').eq('business_id', activeBusiness.id),
          supabase.from('categories').select('id, name').eq('business_id', activeBusiness.id)
        ]);
        if (compRes.data) setCompanies(compRes.data);
        if (catRes.data) setCategories(catRes.data);
      }
    };
    fetchFilters();
  }, [isDemoMode, activeBusiness?.id]);

  // ২. রিপোর্ট ডাটা ফেচ
  useEffect(() => {
    const fetchRealReportData = async () => {
      if (isDemoMode) {
        setReportData(demoDepotReportData);
        setIsLoading(false);
        return;
      }

      if (!activeBusiness?.id) return;
      setIsLoading(true);

      try {
        let start = new Date();
        let end = new Date();
        
        if (selectedPeriod === 'TODAY') {
          start.setHours(0,0,0,0);
        } else if (selectedPeriod === 'WEEK') {
          start.setDate(start.getDate() - 7);
        } else if (selectedPeriod === 'MONTH') {
          start.setMonth(start.getMonth() - 1);
        } else if (selectedPeriod === 'CUSTOM' && tempStartDate && tempEndDate) {
          start = new Date(tempStartDate);
          end = new Date(tempEndDate);
        }

        const { data, error } = await supabase.rpc('get_depot_report_stats', {
          p_business_id: activeBusiness.id,
          p_start_date: start.toISOString(),
          p_end_date: end.toISOString(),
          p_company_id: selectedCompany === 'All' ? null : selectedCompany,
          p_category_id: selectedCategory === 'All' ? null : selectedCategory
        });

        if (error) throw error;
        if (data) setReportData(data);

        // সাম্প্রতিক লেনদেন ফেচ (মূল পেজের জন্য)
        if (isDemoMode) {
          // ডেমু ডাটা মিক্স করে দেখানো
          const demoRecent = [
            ...(demoDepotReportDetails.sales.slice(0, 2).map(s => ({ ...s, type: 'sale', label: 'বিক্রি' }))),
            ...(demoDepotReportDetails.purchases.slice(0, 2).map(p => ({ ...p, type: 'purchase', label: 'ক্রয়' }))),
            ...(demoDepotReportDetails.expenses.slice(0, 1).map(e => ({ ...e, type: 'expense', label: 'খরচ' })))
          ];
          setRecentTransactions(demoRecent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
        } else {
          // রিয়েল মোডে সাম্প্রতিক ৩টি বিক্রি ও ৩টি খরচ নিয়ে আসা
          const [saleRes, expRes] = await Promise.all([
            supabase.from('sales').select('id, receipt_no, total_amount, sale_date').eq('business_id', activeBusiness.id).order('sale_date', { ascending: false }).limit(3),
            supabase.from('expenses').select('id, expense_type, amount, date').eq('business_id', activeBusiness.id).order('date', { ascending: false }).limit(3)
          ]);
          
          let combined: any[] = [];
          if (saleRes.data) combined = [...combined, ...saleRes.data.map(s => ({ ...s, type: 'sale', label: 'বিক্রি', date: s.sale_date, amount: s.total_amount, title: s.receipt_no }))];
          if (expRes.data) combined = [...combined, ...expRes.data.map(e => ({ ...e, type: 'expense', label: 'খরচ', date: e.date, amount: e.amount, title: e.expense_type }))];
          
          setRecentTransactions(combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
        }

      } catch (error) {
        console.error("রিপোর্ট ডাটা লোড এরর:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealReportData();
  }, [isDemoMode, activeBusiness?.id, selectedPeriod, tempStartDate, tempEndDate, selectedCompany, selectedCategory]);

  const formatTaka = (amount: number) => {
    return toBangla(amount?.toLocaleString('en-IN') || '0');
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full">
      
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40 print:hidden">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">ডিপো রিপোর্ট</h1>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-da-depotBlue px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition">
            <Printer size={16} /> প্রিন্ট
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24 print:hidden">
        
        {/* ফিল্টার সেকশন */}
        <div className="bg-white border border-da-cardBorder rounded-xl p-2.5 shadow-sm flex flex-col gap-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button onClick={() => setSelectedPeriod('TODAY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === 'TODAY' ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>আজ</button>
            <button onClick={() => setSelectedPeriod('WEEK')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === 'WEEK' ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>সাপ্তাহিক</button>
            <button onClick={() => setSelectedPeriod('MONTH')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === 'MONTH' ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>মাসিক</button>
            <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === 'CUSTOM' ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>
              <CalendarDays size={14} /> কাস্টম
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-da-textMuted mb-1 block">কোম্পানি</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)} 
                className="w-full border border-da-cardBorder rounded-lg p-1.5 text-xs font-bold bg-da-depotBg outline-none focus:border-da-depotBlue"
              >
                <option value="All">সব কোম্পানি</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরি</label>
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)} 
                className="w-full border border-da-cardBorder rounded-lg p-1.5 text-xs font-bold bg-da-depotBg outline-none focus:border-da-depotBlue"
              >
                <option value="All">সব ক্যাটাগরি</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* সামারি কার্ড (৬টি) */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <SummaryCard title="মোট বিক্রি" value={reportData.totalSales} icon={TrendingUp} color="#2E7D32" bg="bg-gradient-to-br from-[#F0FDF4] to-white" border="border-green-200" textColor="text-green-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({key: 'sales', title: 'মোট বিক্রির বিস্তারিত'}); setIsDetailModalOpen(true); }} />
          
          <SummaryCard title="মোট ক্রয়" value={reportData.totalPurchases} icon={ShoppingBag} color="#1565C0" bg="bg-gradient-to-br from-[#EFF6FF] to-white" border="border-blue-200" textColor="text-blue-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({key: 'purchases', title: 'মোট ক্রয়ের বিস্তারিত'}); setIsDetailModalOpen(true); }} />
          
          <SummaryCard title="মোট খরচ" value={reportData.totalExpenses} icon={Banknote} color="#D32F2F" bg="bg-gradient-to-br from-[#FEF2F2] to-white" border="border-red-200" textColor="text-red-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({key: 'expenses', title: 'মোট খরচের বিস্তারিত'}); setIsDetailModalOpen(true); }} />
          
          <SummaryCard 
            title="গাড়ি ভাড়া" 
            value={reportData.transportSurplus} 
            icon={Truck} 
            color={reportData.transportSurplus >= 0 ? "#15803D" : "#B91C1C"} 
            bg={reportData.transportSurplus >= 0 ? "bg-gradient-to-br from-[#ECFDF5] to-white" : "bg-gradient-to-br from-[#FFF1F2] to-white"} 
            border={reportData.transportSurplus >= 0 ? "border-emerald-200" : "border-rose-200"} 
            textColor={reportData.transportSurplus >= 0 ? "text-emerald-700" : "text-rose-700"} 
            formatTaka={formatTaka} 
            isLoading={isLoading}
            onClick={() => { setDetailType({key: 'transport', title: 'গাড়ি ভাড়ার বিস্তারিত'}); setIsDetailModalOpen(true); }}
          />
          
          <SummaryCard title="মোট লাভ" value={reportData.totalProfit} icon={Target} color="#047857" bg="bg-gradient-to-br from-[#F0FDFA] to-white" border="border-teal-200" textColor="text-teal-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({key: 'profit', title: 'মোট লাভের বিস্তারিত'}); setIsDetailModalOpen(true); }} />
          
          <SummaryCard title="পার্টনার লাভ" value={reportData.partnerProfit} icon={Users} color="#8E24AA" bg="bg-gradient-to-br from-[#FAF5FF] to-white" border="border-purple-200" textColor="text-purple-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({key: 'partner_profit', title: 'পার্টনার লাভের বিস্তারিত'}); setIsDetailModalOpen(true); }} />
        </div>

        {/* বিস্তারিত রিপোর্ট সেকশন */}
        <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-3 shrink-0 mt-1">
          <h3 className="font-bold text-sm text-da-depotNavy mb-2 border-b border-da-cardBorder pb-2">সাম্প্রতিক লেনদেন</h3>
          
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin text-da-depotBlue" size={24}/></div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-da-textMuted text-xs font-bold">কোনো লেনদেন পাওয়া যায়নি</div>
            ) : (
              recentTransactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between items-center bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'sale' ? 'bg-green-100 text-green-600' : 
                      tx.type === 'purchase' ? 'bg-blue-100 text-blue-600' : 
                      'bg-red-100 text-red-600'
                    }`}>
                      {tx.type === 'sale' ? <TrendingUp size={14}/> : tx.type === 'purchase' ? <ShoppingBag size={14}/> : <Banknote size={14}/>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] text-da-textDark truncate">{tx.title || tx.type}</p>
                      <p className="text-[9px] text-da-textMuted mt-0.5">{new Date(tx.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
                  <span className={`font-black text-[12px] shrink-0 pl-2 ${
                    tx.type === 'sale' ? 'text-green-600' : 
                    tx.type === 'purchase' ? 'text-blue-600' : 
                    'text-red-600'
                  }`}>
                    {tx.type === 'sale' ? '+' : '-'} ৳ {toBangla(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      {/* প্রিন্ট ভিউ */}
      <div className="hidden print:block w-full bg-white text-black font-serif text-[12px] p-4">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-xl font-bold uppercase">DREAM AGRO & FISHERIES</h1>
          <p className="text-sm">ডিপো রিপোর্ট</p>
          <p className="text-xs mt-1">সময়কাল: {selectedPeriod === 'TODAY' ? 'আজ' : selectedPeriod === 'WEEK' ? 'সাপ্তাহিক' : selectedPeriod === 'MONTH' ? 'মাসিক' : `${tempStartDate} - ${tempEndDate}`}</p>
        </div>

        <table className="w-full border-collapse border border-black mb-4 text-center">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold text-left">মোট বিক্রি</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalSales)}</td>
              <td className="border border-black p-2 font-bold text-left">মোট ক্রয়</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalPurchases)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold text-left">মোট খরচ</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalExpenses)}</td>
              <td className="border border-black p-2 font-bold text-left">গাড়ি ভাড়া</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.transportSurplus)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold text-left">মোট লাভ</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalProfit)}</td>
              <td className="border border-black p-2 font-bold text-left">পার্টনার লাভ</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.partnerProfit)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 text-center text-[10px] text-gray-600">
          <p>This report is generated by Akand Smart Solutions</p>
          <p>Printed on: {new Date().toLocaleString('bn-BD')}</p>
        </div>
      </div>

      {/* কাস্টম ডেট মডাল */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={16}/> তারিখ নির্বাচন</h2>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">শুরুর তারিখ</label>
                <input type="date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">শেষ তারিখ</label>
                <input type="date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={() => {
                if(tempStartDate && tempEndDate) {
                  setSelectedPeriod('CUSTOM');
                  setIsCustomDateOpen(false);
                } else {
                  alert('তারিখ নির্বাচন করুন');
                }
              }} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1"><Check size={16}/> অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {/* ডিটেইলস মডাল */}
      {isDetailModalOpen && detailType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end sm:justify-center items-end sm:items-center backdrop-blur-sm print:hidden">
          <div className="bg-da-depotBg w-full h-[80dvh] sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{detailType.title}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isDetailLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin text-da-depotBlue" size={28} />
                </div>
              ) : detailListData.length === 0 ? (
                <div className="text-center text-xs text-da-textMuted mt-10">
                  কোনো বিস্তারিত তথ্য পাওয়া যায়নি।
                </div>
              ) : (
                detailListData.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-sm text-da-textDark truncate">
                        {item.receipt_no || item.challan_no || item.expense_type || item.name || 'লেনদেন'}
                      </p>
                      <p className="text-[10px] text-da-textMuted mt-0.5 truncate">
                        {item.sale_date || item.purchase_date || item.date ? new Date(item.sale_date || item.purchase_date || item.date).toLocaleDateString('en-GB') : ''}
                        {item.customers?.name ? ` | ${item.customers.name}` : ''}
                        {item.companies?.name ? ` | ${item.companies.name}` : ''}
                        {item.note ? ` | ${item.note}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-da-depotBlue">
                        ৳ {toBangla(item.total_amount || item.amount || 0)}
                      </p>
                    </div>
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

// রি-ইউজেবল সামারি কার্ড (লোডিং স্টেটসহ)
function SummaryCard({ title, value, icon: Icon, color, bg, border, textColor, formatTaka, onClick, isLoading }: any) {
  return (
    <div 
      onClick={onClick}
      className={`${bg} ${border} border rounded-xl p-2.5 shadow-sm flex flex-col justify-between cursor-pointer active:scale-[0.97] transition-transform relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-lg bg-white shadow-sm`}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className={`text-[10px] font-bold ${textColor} truncate max-w-[80px]`}>{title}</span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
      {isLoading ? (
        <Loader2 size={18} className={`animate-spin mt-1 ${textColor}`} />
      ) : (
        <span className={`font-black text-[15px] ${textColor} mt-1`}>৳ {formatTaka(value)}</span>
      )}
    </div>
  );
}