import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Filter, X, Plus, Minus, CalendarDays, Search,
  Loader2, WalletCards, ArrowDownLeft, ArrowUpRight, Trash2, ChevronRight, FileText
} from 'lucide-react';
import { toBangla, numberToWordsBn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoShopCashbox, demoDepotCashbox } from '../lib/demoData';
import { showAppToast } from '../components/PremiumToast';
import TransactionDetailsPage from './TransactionDetailsPage';
import { ReceiptModal, type ReceiptData } from './ReceiptModal';

interface Props {
  onBack: () => void;
  isDepot?: boolean;
}

interface CashTx {
  id: string;
  rawId?: string;
  source: 'manual' | 'sale' | 'purchase' | 'expense' | 'dealer' | 'company';
  type: string;
  title: string;
  amount: number;
  isIncome: boolean;
  rawDate: number;
  date: string;
  note?: string;
}

export default function CashboxPage({ onBack, isDepot = false }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [transactions, setTransactions] = useState<CashTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ বিস্তারিত দেখার স্টেট
  const [selectedTx, setSelectedTx] = useState<{ id: string; type: 'sale' | 'purchase' } | null>(null);
  const [selectedExpenseReceipt, setSelectedExpenseReceipt] = useState<ReceiptData | null>(null);
  const [selectedManualTx, setSelectedManualTx] = useState<CashTx | null>(null);

  const [activeFilter, setActiveFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all' | 'custom'>('month');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('সব');

  const [cashModalMode, setCashModalMode] = useState<'in' | 'out' | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [note, setNote] = useState('');

  const fetchCashboxData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setTransactions((isDepot ? demoDepotCashbox : demoShopCashbox) as CashTx[]);
        return;
      }
      if (!activeBusiness?.id) return;
      const bizId = activeBusiness.id;

      const queries: any[] = [
        supabase.from('cashbox_transactions').select('*').eq('business_id', bizId).eq('is_depot', isDepot).is('deleted_at', null),
        supabase.from('sales').select('id, receipt_no, paid_amount, sale_date, note').eq('business_id', bizId).eq('is_depot', isDepot).is('deleted_at', null).gt('paid_amount', 0),
        supabase.from('purchases').select('id, challan_no, paid_amount, purchase_date, note').eq('business_id', bizId).eq('is_depot', isDepot).is('deleted_at', null).gt('paid_amount', 0),
        supabase.from('expenses').select('id, expense_type, for_whom, amount, date, note').eq('business_id', bizId).eq('is_depot', isDepot).is('deleted_at', null),
      ];

      if (isDepot) {
        queries.push(
          supabase.from('depot_dealer_ledger').select('id, entry_type, total_amount, paid_amount, entry_date, notes').eq('business_id', bizId),
          supabase.from('depot_company_ledger').select('id, entry_type, amount, entry_date, notes').eq('business_id', bizId).eq('entry_type', 'payment')
        );
      }

      const [manualRes, saleRes, purRes, expRes, dealLedRes, compLedRes] = await Promise.all(queries);
      const list: CashTx[] = [];

      (manualRes?.data || []).forEach((m: any) => {
        const d = new Date(m.tx_date || m.created_at);
        list.push({
          id: m.id,
          rawId: m.id,
          source: 'manual',
          type: m.tx_type === 'transport_in' ? 'কোম্পানি গাড়ি ভাড়া' : m.is_income ? 'ক্যাশ ইন' : 'ক্যাশ আউট',
          title: m.title || (m.is_income ? 'নগদ জমা' : 'নগদ খরচ'),
          amount: Number(m.amount || 0),
          isIncome: Boolean(m.is_income),
          rawDate: d.getTime(),
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: m.note || ''
        });
      });

      (saleRes?.data || []).forEach((s: any) => {
        const d = new Date(s.sale_date);
        list.push({
          id: `sale_${s.id}`,
          rawId: s.id,
          source: 'sale',
          type: 'নগদ বিক্রি',
          title: `বিক্রি #${s.receipt_no || s.id.slice(0, 6).toUpperCase()}`,
          amount: Number(s.paid_amount || 0),
          isIncome: true,
          rawDate: d.getTime(),
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: s.note || ''
        });
      });

      (purRes?.data || []).forEach((p: any) => {
        const d = new Date(p.purchase_date);
        list.push({
          id: `pur_${p.id}`,
          rawId: p.id,
          source: 'purchase',
          type: 'নগদ ক্রয়',
          title: `ক্রয় ${p.challan_no ? `#${p.challan_no}` : ''}`.trim(),
          amount: Number(p.paid_amount || 0),
          isIncome: false,
          rawDate: d.getTime(),
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: p.note || ''
        });
      });

      (expRes?.data || []).forEach((e: any) => {
        const d = new Date(e.date);
        list.push({
          id: `exp_${e.id}`,
          rawId: e.id,
          source: 'expense',
          type: e.expense_type === 'পরিবহন খরচ' ? 'গাড়ি ভাড়া' : 'খরচ',
          title: e.expense_type || 'খরচ',
          amount: Number(e.amount || 0),
          isIncome: false,
          rawDate: d.getTime(),
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: [e.for_whom, e.note].filter(Boolean).join(' • ')
        });
      });

      if (isDepot) {
        (dealLedRes?.data || []).forEach((dl: any) => {
          const amt = dl.entry_type === 'payment' ? Number(dl.total_amount || 0) : dl.entry_type === 'transfer' ? Number(dl.paid_amount || 0) : 0;
          if (amt <= 0) return;
          const d = new Date(dl.entry_date);
          list.push({
            id: `dl_${dl.id}`,
            source: 'dealer',
            type: 'ডিলার জমা',
            title: 'ডিলার থেকে নগদ প্রাপ্তি',
            amount: amt,
            isIncome: true,
            rawDate: d.getTime(),
            date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            note: dl.notes || ''
          });
        });

        (compLedRes?.data || []).forEach((cl: any) => {
          const amt = Number(cl.amount || 0);
          if (amt <= 0) return;
          const d = new Date(cl.entry_date);
          list.push({
            id: `cl_${cl.id}`,
            source: 'company',
            type: 'কোম্পানি পেমেন্ট',
            title: 'কোম্পানিকে পেমেন্ট',
            amount: amt,
            isIncome: false,
            rawDate: d.getTime(),
            date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            note: cl.notes || ''
          });
        });
      }

      setTransactions(list.sort((a, b) => b.rawDate - a.rawDate));
    } catch (error: any) {
      showAppToast('ক্যাশবক্স লোড করতে সমস্যা: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashboxData();
  }, [isDemoMode, activeBusiness?.id, isDepot]);

  const filteredList = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return transactions.filter(tx => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || tx.title.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q) || (tx.note && tx.note.toLowerCase().includes(q));

      let matchDate = true;
      if (activeFilter === 'day') matchDate = tx.rawDate >= todayStart.getTime();
      else if (activeFilter === 'week') matchDate = tx.rawDate >= now - 7 * dayMs;
      else if (activeFilter === 'month') matchDate = tx.rawDate >= now - 30 * dayMs;
      else if (activeFilter === 'year') matchDate = tx.rawDate >= now - 365 * dayMs;
      else if (activeFilter === 'custom' && startDate && endDate) {
        matchDate = tx.rawDate >= new Date(startDate).getTime() && tx.rawDate <= new Date(endDate).getTime() + dayMs;
      }

      let matchType = true;
      if (filterType === 'ক্যাশ ইন (সব জমা)') matchType = tx.isIncome;
      else if (filterType === 'ক্যাশ আউট (সব খরচ)') matchType = !tx.isIncome;
      else if (filterType === 'নগদ বিক্রি') matchType = tx.source === 'sale';
      else if (filterType === 'নগদ ক্রয়') matchType = tx.source === 'purchase';
      else if (filterType === 'খরচ ও গাড়ি ভাড়া') matchType = tx.source === 'expense' || tx.type === 'কোম্পানি গাড়ি ভাড়া';
      else if (filterType === 'ম্যানুয়াল লেনদেন') matchType = tx.source === 'manual';

      return matchSearch && matchDate && matchType;
    });
  }, [transactions, searchQuery, activeFilter, startDate, endDate, filterType]);

  const cashInTotal = filteredList.filter(t => t.isIncome).reduce((a, c) => a + c.amount, 0);
  const cashOutTotal = filteredList.filter(t => !t.isIncome).reduce((a, c) => a + c.amount, 0);
  const balance = cashInTotal - cashOutTotal;

  const handleCashSubmit = async () => {
    const amt = Number(cashAmount);
    if (!amt || amt <= 0) return showAppToast('সঠিক টাকার পরিমাণ দিন', 'error');
    const isIncome = cashModalMode === 'in';
    setIsSaving(true);

    try {
      if (isDemoMode) {
        const newTx: CashTx = {
          id: Date.now().toString(),
          source: 'manual',
          type: isIncome ? 'ক্যাশ ইন' : 'ক্যাশ আউট',
          title: note || (isIncome ? 'নগদ জমা' : 'নগদ উত্তোলন / খরচ'),
          amount: amt,
          isIncome,
          rawDate: Date.now(),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note
        };
        setTransactions(prev => [newTx, ...prev]);
      } else if (activeBusiness?.id) {
        const { error } = await supabase.from('cashbox_transactions').insert([{
          business_id: activeBusiness.id,
          is_depot: isDepot,
          tx_type: isIncome ? 'manual_in' : 'manual_out',
          title: note || (isIncome ? 'নগদ জমা' : 'নগদ উত্তোলন / খরচ'),
          amount: amt,
          is_income: isIncome,
          note,
          tx_date: new Date().toISOString().split('T')[0]
        }]);
        if (error) throw error;
        await fetchCashboxData();
      }

      showAppToast(`${isIncome ? 'ক্যাশ ইন' : 'ক্যাশ আউট'} সফল হয়েছে!`, 'success');
      setCashModalMode(null);
      setCashAmount('');
      setNote('');
    } catch (error: any) {
      showAppToast('সেভ করতে সমস্যা: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteManual = async (id: string) => {
    try {
      if (!isDemoMode) {
        const { error } = await supabase.from('cashbox_transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      showAppToast('এন্ট্রি ডিলিট করা হয়েছে!', 'success');
      setSelectedManualTx(null);
    } catch (err: any) {
      showAppToast('ডিলিট করা যায়নি: ' + err.message, 'error');
    }
  };

  const handleTxClick = (tx: CashTx) => {
    if (tx.source === 'sale') {
      setSelectedTx({ id: tx.rawId || tx.id.replace('sale_', ''), type: 'sale' });
    } else if (tx.source === 'purchase') {
      setSelectedTx({ id: tx.rawId || tx.id.replace('pur_', ''), type: 'purchase' });
    } else if (tx.source === 'expense') {
      const rData: ReceiptData = {
        type: 'expense',
        invoiceNo: `EXP-${String(tx.rawId || tx.id).slice(-5).toUpperCase()}`,
        date: tx.date,
        status: 'পরিশোধিত',
        shopName: activeBusiness?.name || (isDepot ? 'ডিপো' : 'দোকান'),
        shopAddress: (activeBusiness as any)?.address || '',
        shopPhone: (activeBusiness as any)?.phone || '',
        shopEmail: (activeBusiness as any)?.email || '',
        customerName: tx.title || 'খরচ',
        proprietor: 'N/A',
        customerPhone: 'N/A',
        customerAddress: 'N/A',
        marketName: 'N/A',
        officerName: 'ম্যানেজার / ক্যাশিয়ার',
        officerPhone: 'N/A',
        officerEmail: 'N/A',
        receiptTime: tx.date,
        vehicleNo: 'N/A',
        driverName: 'N/A',
        driverPhone: 'N/A',
        transportRent: 0,
        items: [{
          id: '1',
          name: tx.title || 'ক্যাশ খরচ',
          category: 'ক্যাশবক্স খরচ',
          quantity: 1,
          unit: 'টি',
          unitPrice: tx.amount,
          totalPrice: tx.amount
        }],
        totalBags: 0,
        totalPieces: 1,
        subtotal: tx.amount,
        discount: 0,
        grandTotal: tx.amount,
        paidAmount: tx.amount,
        dueAmount: 0,
        paidInWords: numberToWordsBn(tx.amount),
        note: tx.note || ''
      };
      setSelectedExpenseReceipt(rData);
    } else {
      setSelectedManualTx(tx);
    }
  };

  // ✅ বিক্রি বা ক্রয়ে ক্লিক করলে পূর্ণাঙ্গ বিস্তারিত পেজ চালু হবে
  if (selectedTx) {
    return (
      <TransactionDetailsPage
        type={selectedTx.type}
        transactionId={selectedTx.id}
        onBack={() => {
          setSelectedTx(null);
          fetchCashboxData();
        }}
      />
    );
  }

  return (
    <div className={`h-[100dvh] ${isDepot ? 'bg-da-depotBg' : 'bg-[#EFF6F3]'} text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative`}>
      <header className={`${isDepot ? 'bg-da-depotNavy' : 'bg-gradient-to-r from-[#0B5C47] to-[#062D5E]'} text-white shadow-md shrink-0 z-40`}>
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="font-bold text-lg leading-tight">{isDepot ? 'ডিপো ক্যাশবক্স' : 'দোকান ক্যাশবক্স'}</h1>
              <p className="text-[10px] text-white/75">{isDepot ? 'ডিপোর নগদ হিসাব ও গাড়ি ভাড়া' : 'দোকানের নগদ জমা ও খরচ'}</p>
            </div>
          </div>
          <WalletCards size={20} className="text-white/80" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        {/* ব্যালেন্স ও ইন/আউট কার্ড */}
        <div className={`${isDepot ? 'bg-gradient-to-br from-da-depotNavy to-da-depotBlue' : 'bg-gradient-to-br from-[#0B5C47] to-[#1565C0]'} text-white p-4 rounded-2xl shadow-lg shrink-0`}>
          <p className="text-xs font-bold text-white/80 text-center">হাতে থাকা ক্যাশ ব্যালেন্স</p>
          <p className={`text-3xl font-black text-center mt-1 ${balance < 0 ? 'text-amber-300' : 'text-white'}`}>
            {isLoading ? '...' : `${toBangla(balance)} ৳`}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15">
            <div className="bg-white/10 rounded-xl p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0"><ArrowDownLeft size={16} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/75">মোট ক্যাশ ইন</p>
                <p className="font-black text-sm text-emerald-200 truncate">+{toBangla(cashInTotal)} ৳</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-400/20 text-red-300 flex items-center justify-center shrink-0"><ArrowUpRight size={16} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-white/75">মোট ক্যাশ আউট</p>
                <p className="font-black text-sm text-red-200 truncate">-{toBangla(cashOutTotal)} ৳</p>
              </div>
            </div>
          </div>
        </div>

        {/* সময় ফিল্টার */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 flex-nowrap shrink-0">
          {[
            { k: 'day', l: 'আজ' },
            { k: 'week', l: 'সপ্তাহ' },
            { k: 'month', l: 'মাস' },
            { k: 'year', l: 'বছর' },
            { k: 'all', l: 'সব সময়' },
          ].map(f => (
            <button key={f.k} onClick={() => setActiveFilter(f.k as any)} className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition ${activeFilter === f.k ? (isDepot ? 'bg-da-depotNavy text-white border-da-depotNavy' : 'bg-[#0B5C47] text-white border-[#0B5C47]') : 'bg-white text-gray-600 border-gray-200'}`}>
              {f.l}
            </button>
          ))}
          <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-200'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* সার্চ ও টাইপ ফিল্টার */}
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="লেনদেন বা নোট খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
          </div>
          <button onClick={() => setIsFilterModalOpen(true)} className={`flex items-center gap-1 px-3 rounded-xl border text-xs font-bold shadow-sm ${filterType !== 'সব' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-700'}`}>
            <Filter size={14} /> {filterType === 'সব' ? 'ফিল্টার' : filterType}
          </button>
        </div>

        {/* লেনদেন লিস্ট */}
        {isLoading ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32} /></div>
        ) : filteredList.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 text-xs font-bold">কোনো ক্যাশ লেনদেন পাওয়া যায়নি</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredList.map(tx => (
              <div
                key={tx.id}
                onClick={() => handleTxClick(tx)}
                className="bg-white hover:bg-blue-50/40 p-3 rounded-xl border border-gray-200/80 shadow-sm flex justify-between items-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {tx.isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tx.isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{tx.type}</span>
                      {tx.source !== 'manual' && <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">অটো</span>}
                    </div>
                    <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{tx.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{tx.date}{tx.note ? ` • ${tx.note}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-black text-sm ${tx.isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.isIncome ? '+' : '-'}{toBangla(tx.amount)} ৳
                  </span>
                  {tx.source === 'manual' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteManual(tx.id); }}
                      className="p-1 text-gray-400 hover:text-red-600 transition"
                      title="ডিলিট"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* বটম বার */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50 flex gap-2">
        <button onClick={() => setCashModalMode('in')} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1 text-sm">
          <Plus size={18} /> ক্যাশ ইন
        </button>
        <button onClick={() => setCashModalMode('out')} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1 text-sm">
          <Minus size={18} /> ক্যাশ আউট
        </button>
      </div>

      {/* টাইপ ফিল্টার মডাল */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end flex-col sm:justify-center sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-3 border-b flex justify-between items-center">
              <span className="flex items-center gap-2 font-bold text-sm text-gray-700"><Filter size={16} /> ধরন অনুযায়ী ফিল্টার</span>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-1 bg-gray-100 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-3 overflow-y-auto flex flex-col gap-1 text-sm">
              {['সব', 'ক্যাশ ইন (সব জমা)', 'ক্যাশ আউট (সব খরচ)', 'নগদ বিক্রি', 'নগদ ক্রয়', 'খরচ ও গাড়ি ভাড়া', 'ম্যানুয়াল লেনদেন'].map(item => (
                <label key={item} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <input type="radio" name="filter" checked={filterType === item} onChange={() => setFilterType(item)} className="w-4 h-4 text-[#0B5C47]" />
                  <span className="font-bold text-xs text-gray-700">{item}</span>
                </label>
              ))}
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setIsFilterModalOpen(false)} className="w-full bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold text-sm">অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {/* কাস্টম ডেট মডাল */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-[#0B5C47] p-3 text-white flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5"><CalendarDays size={16} /> তারিখ নির্বাচন</span>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">শুরুর তারিখ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">শেষ তারিখ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg p-2 text-sm" /></div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border py-2 rounded-xl font-bold text-xs">বাতিল</button>
              <button onClick={() => { if (startDate && endDate) { setActiveFilter('custom'); setIsCustomDateOpen(false); } else showAppToast('তারিখ নির্বাচন করুন', 'error'); }} className="flex-1 bg-[#0B5C47] text-white py-2 rounded-xl font-bold text-xs">অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {/* ক্যাশ ইন/আউট মডাল */}
      {cashModalMode && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className={`${cashModalMode === 'in' ? 'bg-emerald-600' : 'bg-red-500'} p-3 flex justify-between items-center text-white`}>
              <h2 className="font-bold text-base">{cashModalMode === 'in' ? 'নতুন ক্যাশ ইন' : 'নতুন ক্যাশ আউট'}</h2>
              <button onClick={() => setCashModalMode(null)} className="p-1 bg-white/20 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                <p className="text-xs text-blue-700 font-bold">বর্তমান ব্যালেন্স</p>
                <p className="text-lg font-black text-blue-800">{toBangla(balance)} ৳</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">টাকার পরিমাণ *</label>
                <input type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="0" className="w-full border border-gray-300 rounded-xl p-2.5 text-lg font-bold outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বিবরণ / নোট</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="যেমন: মালিকের জমা / ব্যাংক থেকে উত্তোলন" className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setCashModalMode(null)} className="flex-1 bg-white border py-2.5 rounded-xl font-bold text-sm">বাতিল</button>
              <button onClick={handleCashSubmit} disabled={isSaving} className={`flex-1 ${cashModalMode === 'in' ? 'bg-emerald-600' : 'bg-red-500'} text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center text-sm`}>
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ম্যানুয়াল ও অন্যান্য ক্যাশ লেনদেনের পূর্ণাঙ্গ বিবরণ পপআপ */}
      {selectedManualTx && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`${selectedManualTx.isIncome ? 'bg-emerald-600' : 'bg-red-500'} p-3.5 text-white flex justify-between items-center`}>
              <span className="font-bold text-sm flex items-center gap-1.5"><FileText size={16} /> ক্যাশ লেনদেনের বিস্তারিত</span>
              <button onClick={() => setSelectedManualTx(null)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="text-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${selectedManualTx.isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedManualTx.type}
                </span>
                <p className={`text-2xl font-black ${selectedManualTx.isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedManualTx.isIncome ? '+' : '-'}{toBangla(selectedManualTx.amount)} ৳
                </p>
                <p className="text-[11px] font-bold text-gray-500 mt-1">
                  কথায়: {numberToWordsBn(selectedManualTx.amount)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-gray-500 font-bold">বিবরণ / খাত:</span>
                  <span className="font-bold text-gray-800 text-right">{selectedManualTx.title}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-gray-500 font-bold">তারিখ:</span>
                  <span className="font-bold text-gray-800">{selectedManualTx.date}</span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-gray-500 font-bold">উৎস:</span>
                  <span className="font-bold text-gray-800">{selectedManualTx.source === 'manual' ? 'সরাসরি এন্ট্রি' : 'সিস্টেম অটো'}</span>
                </div>
                {selectedManualTx.note && (
                  <div className="pt-1">
                    <span className="text-gray-500 font-bold block mb-0.5">নোট:</span>
                    <p className="bg-gray-50 p-2 rounded-lg text-gray-700 font-medium">{selectedManualTx.note}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              {selectedManualTx.source === 'manual' && (
                <button
                  onClick={() => handleDeleteManual(selectedManualTx.id)}
                  className="bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                >
                  <Trash2 size={14} /> ডিলিট
                </button>
              )}
              <button
                onClick={() => setSelectedManualTx(null)}
                className="flex-1 bg-gray-800 text-white py-2 rounded-xl text-xs font-bold active:scale-95 transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* খরচের রিসিপ্ট দেখার মডাল */}
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