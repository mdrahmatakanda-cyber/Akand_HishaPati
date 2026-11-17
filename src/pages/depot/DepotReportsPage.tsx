import { useState, useEffect } from 'react';
import {
  ArrowLeft, Printer, TrendingUp, ShoppingBag, Banknote, Truck,
  Target, CalendarDays, X, ChevronRight, Check, Loader2, Wallet
} from 'lucide-react';
import { toBangla, numberToWordsBn } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotReportData, demoCompaniesList, demoCategories, demoDepotReportDetails } from '../../lib/demoData';
import { showAppToast } from '../../components/PremiumToast';
import TransactionDetailsPage from '../TransactionDetailsPage';
import { ReceiptModal, type ReceiptData } from '../ReceiptModal';

interface Props {
  onBack: () => void;
}

export default function DepotReportsPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, businesses } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>({
    totalSales: 0, totalPurchases: 0, totalExpenses: 0,
    totalInvestment: 0, transportIn: 0, transportOut: 0, transportSurplus: 0, totalProfit: 0,
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('MONTH');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const [companies, setCompanies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState<{ key: string; title: string } | null>(null);
  // বিস্তারিত লিস্ট স্টেট
  const [detailListData, setDetailListData] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // মূল পেজের সাম্প্রতিক লেনদেন স্টেট
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // ✅ যেকোনো লেনদেনের পূর্ণাঙ্গ বিস্তারিত দেখার স্টেট
  const [selectedTx, setSelectedTx] = useState<{ id: string; type: 'sale' | 'purchase' } | null>(null);
  const [selectedExpenseReceipt, setSelectedExpenseReceipt] = useState<ReceiptData | null>(null);

  const openExpenseReceipt = (item: any) => {
    const d = item.date || item.created_at || new Date().toISOString();
    const formattedDate = typeof d === 'string' && d.includes('/') ? d : new Date(d).toLocaleDateString('en-GB');
    const amt = Number(item.amount || item.total_amount || 0);

    const rData: ReceiptData = {
      type: 'expense',
      invoiceNo: `EXP-${String(item.id || '001').slice(-5).toUpperCase()}`,
      date: formattedDate,
      status: 'পরিশোধিত',
      shopName: activeBusiness?.name || 'DREAM AGRO',
      shopAddress: (activeBusiness as any)?.address || '',
      shopPhone: (activeBusiness as any)?.phone || '',
      shopEmail: (activeBusiness as any)?.email || '',
      customerName: item.for_whom || item.title || 'ডিপো খরচ',
      proprietor: 'N/A',
      customerPhone: 'N/A',
      customerAddress: 'N/A',
      marketName: 'N/A',
      officerName: item.employee_name || 'ম্যানেজার',
      officerPhone: 'N/A',
      officerEmail: 'N/A',
      receiptTime: formattedDate,
      vehicleNo: 'N/A',
      driverName: 'N/A',
      driverPhone: 'N/A',
      transportRent: 0,
      items: [{
        id: '1',
        name: item.expense_type || item.title || 'ডিপো খরচ',
        category: 'খরচ',
        quantity: 1,
        unit: 'টি',
        unitPrice: amt,
        totalPrice: amt
      }],
      totalBags: 0,
      totalPieces: 1,
      subtotal: amt,
      discount: 0,
      grandTotal: amt,
      paidAmount: amt,
      dueAmount: 0,
      paidInWords: numberToWordsBn(amt),
      note: item.note || ''
    };
    setSelectedExpenseReceipt(rData);
  };

  const allBizIds = businesses.length > 0 ? businesses.map(b => b.id) : (activeBusiness?.id ? [activeBusiness.id] : []);

  // বিস্তারিত মডাল ডাটা লোড
  useEffect(() => {
    if (!isDetailModalOpen || !detailType) return;
    const fetchDetails = async () => {
      setIsDetailLoading(true);
      try {
        if (detailType.key === 'profit') {
          setDetailListData([
            { id: 'pr1', label: 'মোট বিক্রি (+)', value: reportData.totalSales },
            { id: 'pr2', label: 'মোট ক্রয় (-)', value: reportData.totalPurchases },
            { id: 'pr3', label: 'মোট ডিপো খরচ (-)', value: reportData.totalExpenses },
            { id: 'pr4', label: 'গাড়ি ভাড়া উদ্বৃত্ত (+)', value: reportData.transportSurplus },
            { id: 'pr5', label: 'নিট হিসাব / লাভ', value: reportData.totalProfit },
          ]);
          return;
        }

        if (isDemoMode) {
          setDetailListData((demoDepotReportDetails as any)[detailType.key] || []);
          return;
        }
        if (!activeBusiness?.id) return;

        if (detailType.key === 'investment') {
          const { data, error } = await supabase.from('partners').select('id, name, initial_capital, created_at').in('business_id', allBizIds).is('deleted_at', null).order('created_at', { ascending: false });
          if (error) throw error;
          setDetailListData(data || []);
        } else if (detailType.key === 'sales') {
          const { data, error } = await supabase.from('sales').select('id, receipt_no, total_amount, sale_date, customers(name)').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).order('sale_date', { ascending: false }).limit(50);
          if (error) throw error;
          setDetailListData(data || []);
        } else if (detailType.key === 'purchases') {
          const { data, error } = await supabase.from('purchases').select('id, challan_no, total_amount, purchase_date, suppliers(name)').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).order('purchase_date', { ascending: false }).limit(50);
          if (error) throw error;
          setDetailListData(data || []);
        } else if (detailType.key === 'expenses') {
          const { data, error } = await supabase.from('expenses').select('id, expense_type, amount, date, note').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).order('date', { ascending: false }).limit(50);
          if (error) throw error;
          setDetailListData(data || []);
        } else if (detailType.key === 'transport') {
          const [tInRes, tOutRes] = await Promise.all([
            supabase.from('cashbox_transactions').select('id, title, amount, tx_date, note').eq('business_id', activeBusiness.id).eq('is_depot', true).eq('tx_type', 'transport_in').is('deleted_at', null).order('tx_date', { ascending: false }),
            supabase.from('expenses').select('id, expense_type, amount, date, note').eq('business_id', activeBusiness.id).eq('is_depot', true).eq('expense_type', 'পরিবহন খরচ').is('deleted_at', null).order('date', { ascending: false })
          ]);
          const combined = [
            ...(tInRes.data || []).map((x: any) => ({ id: x.id, title: `${x.title} (প্রাপ্ত)`, amount: x.amount, date: x.tx_date, note: x.note })),
            ...(tOutRes.data || []).map((x: any) => ({ id: x.id, title: `${x.expense_type} (খরচ)`, amount: -Number(x.amount), date: x.date, note: x.note })),
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setDetailListData(combined);
        }
      } catch (error: any) {
        showAppToast('বিস্তারিত আনতে সমস্যা: ' + error.message, 'error');
        setDetailListData([]);
      } finally {
        setIsDetailLoading(false);
      }
    };
    fetchDetails();
  }, [isDetailModalOpen, detailType, isDemoMode, activeBusiness?.id]);

  // কোম্পানি ও শেয়ার্ড ক্যাটাগরি লোড
  useEffect(() => {
    const fetchFilters = async () => {
      if (isDemoMode) {
        setCompanies(demoCompaniesList || []);
        setCategories(demoCategories || []);
      } else if (activeBusiness?.id) {
        const [compRes, catRes] = await Promise.all([
          supabase.from('companies').select('id, name').eq('business_id', activeBusiness.id).is('deleted_at', null),
          supabase.from('categories').select('id, name')
        ]);
        if (compRes.data) setCompanies(compRes.data);
        if (catRes.data) setCategories(catRes.data);
      }
    };
    fetchFilters();
  }, [isDemoMode, activeBusiness?.id]);

  // মূল রিপোর্ট ও সাম্প্রতিক লেনদেন লোড
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        if (isDemoMode) {
          setReportData({ ...demoDepotReportData, transportSurplus: (demoDepotReportData as any).transportSurplus || 1300 });
          const demoRecent = [
            ...demoDepotReportDetails.sales.slice(0, 2).map(s => ({ ...s, type: 'sale', title: (s as any).receipt_no || 'ডিপো বিক্রি' })),
            ...demoDepotReportDetails.purchases.slice(0, 2).map(p => ({ ...p, type: 'purchase', title: (p as any).challan_no || 'ডিপো ক্রয়' })),
            ...demoDepotReportDetails.expenses.slice(0, 1).map(e => ({ ...e, type: 'expense', title: (e as any).expense_type || 'খরচ' }))
          ];
          setRecentTransactions(demoRecent);
          return;
        }
        if (!activeBusiness?.id) return;

        let start = new Date();
        let end = new Date();
        if (selectedPeriod === 'TODAY') start.setHours(0, 0, 0, 0);
        else if (selectedPeriod === 'WEEK') start.setDate(start.getDate() - 7);
        else if (selectedPeriod === 'MONTH') start.setMonth(start.getMonth() - 1);
        else if (selectedPeriod === 'CUSTOM' && tempStartDate && tempEndDate) {
          start = new Date(tempStartDate);
          end = new Date(tempEndDate);
          end.setHours(23, 59, 59, 999);
        }

        const startIso = start.toISOString();
        const endIso = end.toISOString();

        const [rpcRes, invRes, saleRes, purRes, expRes, transInRes] = await Promise.all([
          supabase.rpc('get_depot_report_stats', {
            p_business_id: activeBusiness.id,
            p_start_date: startIso,
            p_end_date: endIso,
            p_company_id: selectedCompany === 'All' ? null : selectedCompany,
            p_category_id: selectedCategory === 'All' ? null : selectedCategory
          }),
          supabase.from('partners').select('initial_capital').in('business_id', allBizIds).is('deleted_at', null),
          supabase.from('sales').select('id, receipt_no, total_amount, sale_date').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).gte('sale_date', startIso).lte('sale_date', endIso).order('sale_date', { ascending: false }),
          supabase.from('purchases').select('id, challan_no, total_amount, purchase_date').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).gte('purchase_date', startIso).lte('purchase_date', endIso).order('purchase_date', { ascending: false }),
          supabase.from('expenses').select('id, expense_type, amount, date').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).gte('date', startIso.split('T')[0]).lte('date', endIso.split('T')[0]).order('date', { ascending: false }),
          supabase.from('cashbox_transactions').select('amount').eq('business_id', activeBusiness.id).eq('is_depot', true).eq('tx_type', 'transport_in').is('deleted_at', null).gte('tx_date', startIso.split('T')[0]).lte('tx_date', endIso.split('T')[0])
        ]);

        const totalInv = invRes.data?.reduce((a, c) => a + Number(c.initial_capital || 0), 0) || 0;
        const calcSales = saleRes.data?.reduce((a, c) => a + Number(c.total_amount || 0), 0) || 0;
        const calcPurchases = purRes.data?.reduce((a, c) => a + Number(c.total_amount || 0), 0) || 0;
        const calcExpenses = expRes.data?.reduce((a, c) => a + Number(c.amount || 0), 0) || 0;
        const transIn = transInRes.data?.reduce((a, c) => a + Number(c.amount || 0), 0) || 0;
        const transOut = expRes.data?.filter((e: any) => e.expense_type === 'পরিবহন খরচ').reduce((a, c) => a + Number(c.amount || 0), 0) || 0;
        const transportSurplus = transIn - transOut;

        const rpcData = (!rpcRes.error && rpcRes.data) ? rpcRes.data : {};
        const totalSales = Number(rpcData.totalSales ?? calcSales);
        const totalPurchases = Number(rpcData.totalPurchases ?? calcPurchases);
        const totalExpenses = Number(rpcData.totalExpenses ?? calcExpenses);
        const totalProfit = rpcData.totalProfit !== undefined
          ? Number(rpcData.totalProfit) + transportSurplus
          : (totalSales - totalPurchases - totalExpenses + transportSurplus);

        setReportData({
          totalSales,
          totalPurchases,
          totalExpenses,
          totalInvestment: totalInv,
          transportIn: transIn,
          transportOut: transOut,
          transportSurplus,
          totalProfit
        });

        const combined = [
          ...(saleRes.data || []).slice(0, 3).map((s: any) => ({ ...s, type: 'sale', date: s.sale_date, amount: s.total_amount, title: s.receipt_no || 'ডিপো বিক্রি' })),
          ...(purRes.data || []).slice(0, 2).map((p: any) => ({ ...p, type: 'purchase', date: p.purchase_date, amount: p.total_amount, title: p.challan_no || 'ডিপো ক্রয়' })),
          ...(expRes.data || []).slice(0, 3).map((e: any) => ({ ...e, type: 'expense', date: e.date, amount: e.amount, title: e.expense_type }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

        setRecentTransactions(combined);
      } catch (error: any) {
        showAppToast('রিপোর্ট লোড করতে সমস্যা: ' + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [isDemoMode, activeBusiness?.id, selectedPeriod, tempStartDate, tempEndDate, selectedCompany, selectedCategory]);

  const formatTaka = (amount: number) => toBangla(Math.round(amount || 0).toLocaleString('en-IN'));

  // ✅ লেনদেনে ট্যাপ করলে পুরো বিস্তারিত পেজ চালু হবে
  if (selectedTx) {
    return (
      <TransactionDetailsPage
        type={selectedTx.type}
        transactionId={selectedTx.id}
        onBack={() => setSelectedTx(null)}
      />
    );
  }

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40 print:hidden">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ডিপো রিপোর্ট</h1>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-da-depotBlue px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition">
            <Printer size={16} /> প্রিন্ট
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24 print:hidden">
        <div className="bg-white border border-da-cardBorder rounded-xl p-2.5 shadow-sm flex flex-col gap-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {[{ k: 'TODAY', l: 'আজ' }, { k: 'WEEK', l: 'সাপ্তাহিক' }, { k: 'MONTH', l: 'মাসিক' }].map(p => (
              <button key={p.k} onClick={() => setSelectedPeriod(p.k as any)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === p.k ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>{p.l}</button>
            ))}
            <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedPeriod === 'CUSTOM' ? 'bg-da-depotNavy text-white shadow-sm' : 'bg-da-depotBg text-da-textMuted'}`}>
              <CalendarDays size={14} /> কাস্টম
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-da-textMuted mb-1 block">কোম্পানি</label>
              <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-1.5 text-xs font-bold bg-da-depotBg outline-none">
                <option value="All">সব কোম্পানি</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরি</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-1.5 text-xs font-bold bg-da-depotBg outline-none">
                <option value="All">সব ক্যাটাগরি</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 shrink-0">
          <SummaryCard title="মোট ইনভেস্ট" value={reportData.totalInvestment} icon={Wallet} color="#8E24AA" bg="bg-gradient-to-br from-[#FAF5FF] to-white" border="border-purple-200" textColor="text-purple-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'investment', title: 'মোট ইনভেস্টের বিস্তারিত' }); setIsDetailModalOpen(true); }} />
          <SummaryCard title="মোট ক্রয়" value={reportData.totalPurchases} icon={ShoppingBag} color="#1565C0" bg="bg-gradient-to-br from-[#EFF6FF] to-white" border="border-blue-200" textColor="text-blue-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'purchases', title: 'মোট ক্রয়ের বিস্তারিত' }); setIsDetailModalOpen(true); }} />
          <SummaryCard title="মোট বিক্রি" value={reportData.totalSales} icon={TrendingUp} color="#2E7D32" bg="bg-gradient-to-br from-[#F0FDF4] to-white" border="border-green-200" textColor="text-green-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'sales', title: 'মোট বিক্রির বিস্তারিত' }); setIsDetailModalOpen(true); }} />
          <SummaryCard title="মোট খরচ" value={reportData.totalExpenses} icon={Banknote} color="#D32F2F" bg="bg-gradient-to-br from-[#FEF2F2] to-white" border="border-red-200" textColor="text-red-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'expenses', title: 'মোট খরচের বিস্তারিত' }); setIsDetailModalOpen(true); }} />
          <SummaryCard title="গাড়ি ভাড়া উদ্বৃত্ত" value={reportData.transportSurplus} icon={Truck} color="#0891B2" bg="bg-gradient-to-br from-[#ECFEFF] to-white" border="border-cyan-200" textColor="text-cyan-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'transport', title: 'গাড়ি ভাড়ার হিসাব' }); setIsDetailModalOpen(true); }} />
          <SummaryCard title="মোট লাভ" value={reportData.totalProfit} icon={Target} color="#047857" bg="bg-gradient-to-br from-[#F0FDFA] to-white" border="border-teal-200" textColor="text-teal-700" formatTaka={formatTaka} isLoading={isLoading} onClick={() => { setDetailType({ key: 'profit', title: 'লাভ-ক্ষতির হিসাব' }); setIsDetailModalOpen(true); }} />
        </div>

        <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-3 shrink-0 mt-1">
          <h3 className="font-bold text-sm text-da-depotNavy mb-2 border-b border-da-cardBorder pb-2">সাম্প্রতিক ডিপো লেনদেন</h3>
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin text-da-depotBlue" size={24} /></div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-4 text-da-textMuted text-xs font-bold">কোনো লেনদেন পাওয়া যায়নি</div>
            ) : (
              recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (tx.type === 'sale') setSelectedTx({ id: String(tx.id || idx), type: 'sale' });
                    else if (tx.type === 'purchase') setSelectedTx({ id: String(tx.id || idx), type: 'purchase' });
                    else openExpenseReceipt(tx);
                  }}
                  className="flex justify-between items-center bg-da-depotBg hover:bg-blue-50/40 p-2 rounded-xl border border-da-cardBorder cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'sale' ? 'bg-green-100 text-green-600' : tx.type === 'purchase' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.type === 'sale' ? <TrendingUp size={14} /> : tx.type === 'purchase' ? <ShoppingBag size={14} /> : <Banknote size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] text-da-textDark truncate">{tx.title || tx.type}</p>
                      <p className="text-[9px] text-da-textMuted mt-0.5">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className={`font-black text-[12px] ${tx.type === 'sale' ? 'text-green-600' : tx.type === 'purchase' ? 'text-blue-600' : 'text-red-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'} ৳ {toBangla(tx.amount)}
                    </span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* প্রিন্ট ভিউ */}
      <div className="hidden print:block w-full bg-white text-black font-serif text-[12px] p-6">
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <h1 className="text-xl font-bold uppercase">{activeBusiness?.name || 'DREAM AGRO & FISHERIES'}</h1>
          <p className="text-sm font-bold">ডিপো আর্থিক রিপোর্ট</p>
          <p className="text-xs mt-1">সময়কাল: {selectedPeriod === 'TODAY' ? 'আজ' : selectedPeriod === 'WEEK' ? 'সাপ্তাহিক' : selectedPeriod === 'MONTH' ? 'মাসিক' : `${tempStartDate} - ${tempEndDate}`}</p>
        </div>
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold">মোট বিক্রি</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalSales)}</td>
              <td className="border border-black p-2 font-bold">মোট ক্রয়</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalPurchases)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">মোট খরচ</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalExpenses)}</td>
              <td className="border border-black p-2 font-bold">গাড়ি ভাড়া উদ্বৃত্ত</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.transportSurplus)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">মোট ইনভেস্ট</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalInvestment)}</td>
              <td className="border border-black p-2 font-bold">নিট লাভ</td>
              <td className="border border-black p-2 font-bold text-right">৳ {formatTaka(reportData.totalProfit)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-8 text-center text-[10px] text-gray-600 border-t pt-2">
          <p>সফ্টওয়্যার তৈরিতে Akand Smart Solutions | WhatsApp: 01752005057</p>
          <p>প্রিন্টের সময়: {new Date().toLocaleString('bn-BD')}</p>
        </div>
      </div>

      {/* কাস্টম ডেট মডাল */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={16} /> তারিখ নির্বাচন</h2>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div><label className="text-xs font-bold text-da-textMuted mb-1 block">শুরুর তারিখ</label><input type="date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm" /></div>
              <div><label className="text-xs font-bold text-da-textMuted mb-1 block">শেষ তারিখ</label><input type="date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm" /></div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={() => { if (tempStartDate && tempEndDate) { setSelectedPeriod('CUSTOM'); setIsCustomDateOpen(false); } else showAppToast('শুরু ও শেষ তারিখ নির্বাচন করুন', 'error'); }} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1"><Check size={16} /> অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {/* ডিটেইলস মডাল */}
      {isDetailModalOpen && detailType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end sm:justify-center items-end sm:items-center backdrop-blur-sm print:hidden">
          <div className="bg-da-depotBg w-full h-[80dvh] sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{detailType.title}</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isDetailLoading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin text-da-depotBlue" size={28} /></div>
              ) : detailListData.length === 0 ? (
                <div className="text-center text-xs text-da-textMuted mt-10">কোনো বিস্তারিত তথ্য পাওয়া যায়নি।</div>
              ) : detailType.key === 'profit' ? (
                detailListData.map((row: any) => (
                  <div
                    key={row.id}
                    onClick={() => {
                      if (row.id === 'pr1') setDetailType({ key: 'sales', title: 'মোট বিক্রির বিস্তারিত' });
                      else if (row.id === 'pr2') setDetailType({ key: 'purchases', title: 'মোট ক্রয়ের বিস্তারিত' });
                      else if (row.id === 'pr3') setDetailType({ key: 'expenses', title: 'মোট খরচের বিস্তারিত' });
                      else if (row.id === 'pr4') setDetailType({ key: 'transport', title: 'গাড়ি ভাড়ার হিসাব' });
                    }}
                    className={`bg-white p-3 rounded-xl border border-da-cardBorder flex justify-between items-center font-bold text-sm ${row.id !== 'pr5' ? 'cursor-pointer hover:bg-blue-50/40 active:scale-[0.98]' : 'bg-emerald-50/40 border-emerald-200'} transition-all`}
                  >
                    <span className="flex items-center gap-1.5">{row.label} {row.id !== 'pr5' && <ChevronRight size={14} className="text-gray-400" />}</span>
                    <span className={row.id === 'pr5' ? 'text-emerald-700 font-black' : 'text-da-depotBlue'}>৳ {formatTaka(row.value)}</span>
                  </div>
                ))
              ) : (
                detailListData.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      if (detailType.key === 'sales') {
                        setIsDetailModalOpen(false);
                        setSelectedTx({ id: String(item.id || idx), type: 'sale' });
                      } else if (detailType.key === 'purchases') {
                        setIsDetailModalOpen(false);
                        setSelectedTx({ id: String(item.id || idx), type: 'purchase' });
                      } else if (detailType.key === 'expenses') {
                        openExpenseReceipt(item);
                      }
                    }}
                    className={`bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center ${detailType.key !== 'investment' ? 'cursor-pointer hover:bg-blue-50/40 active:scale-[0.98]' : ''} transition-all`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-sm text-da-textDark truncate">{item.title || item.receipt_no || item.challan_no || item.expense_type || item.name || 'লেনদেন'}</p>
                      <p className="text-[10px] text-da-textMuted mt-0.5 truncate">
                        {item.sale_date || item.purchase_date || item.date || item.created_at ? new Date(item.sale_date || item.purchase_date || item.date || item.created_at).toLocaleDateString('en-GB') : ''}
                        {item.customers?.name ? ` | ${item.customers.name}` : ''}
                        {item.suppliers?.name ? ` | ${item.suppliers.name}` : ''}
                        {item.note ? ` | ${item.note}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <p className="font-black text-sm text-da-depotBlue">৳ {toBangla(item.total_amount ?? item.amount ?? item.initial_capital ?? 0)}</p>
                      {detailType.key !== 'investment' && <ChevronRight size={14} className="text-gray-400" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* খরচের রিসিট দেখার মডাল */}
      <ReceiptModal
        isOpen={Boolean(selectedExpenseReceipt)}
        onClose={() => setSelectedExpenseReceipt(null)}
        onCancel={() => setSelectedExpenseReceipt(null)}
        onFinalize={() => setSelectedExpenseReceipt(null)}
        isSaving={false}
        previewOnly={true}
        data={selectedExpenseReceipt}
      />
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color, bg, border, textColor, formatTaka, onClick, isLoading }: any) {
  return (
    <div onClick={onClick} className={`${bg} ${border} border rounded-xl p-2.5 shadow-sm flex flex-col justify-between cursor-pointer active:scale-[0.97] transition-transform relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-white shadow-sm"><Icon size={16} style={{ color }} /></div>
          <span className={`text-[10px] font-bold ${textColor} truncate max-w-[85px]`}>{title}</span>
        </div>
        <ChevronRight size={14} className="text-gray-400" />
      </div>
      {isLoading ? <Loader2 size={18} className={`animate-spin mt-1 ${textColor}`} /> : <span className={`font-black text-[15px] ${textColor} mt-1`}>৳ {formatTaka(value)}</span>}
    </div>
  );
}