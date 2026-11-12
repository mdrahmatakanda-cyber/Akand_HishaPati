import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Plus, Loader2, X, 
  Banknote, CalendarDays, Check, Search, Image as ImageIcon,
  Printer, Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotExpenses, demoEmployeesList } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DepotExpensePage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Date Filter
  const [activeFilter, setActiveFilter] = useState('month');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  // বিস্তারিত ও এডিট স্টেট
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isEditingExpense, setIsEditingExpense] = useState(false);

  // ফর্ম স্টেট (খরচের কারণ বাদ দেওয়া হয়েছে)
  const [newExpenseForm, setNewExpenseForm] = useState({ 
    expense_type: 'সাধারণ', for_whom: '', employee_id: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] 
  });

  // রিসিপ্ট স্টেট
  const [expenseReceipt, setExpenseReceipt] = useState<File | null>(null);
  const [editReceipt, setEditReceipt] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const editReceiptInputRef = useRef<HTMLInputElement>(null);

  // রিসিপ্ট জেনারেশন ও ভিউ স্টেট
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSavedExpense, setLastSavedExpense] = useState<any>(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setExpenses(demoDepotExpenses);
        setEmployees(demoEmployeesList);
      } else {
        if (!activeBusiness?.id) return;

        const [expRes, empRes] = await Promise.all([
          supabase.from('expenses').select('*').eq('business_id', activeBusiness.id).order('date', { ascending: false }),
          supabase.from('employees').select('*').eq('business_id', activeBusiness.id)
        ]);

        if (expRes.data) {
          setExpenses(expRes.data.map((e: any) => {
            const d = new Date(e.date);
            return {
              ...e,
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
        if (empRes.data) setEmployees(empRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredList = useMemo(() => {
    return expenses.filter(item => {
      const matchSearch = (item.expense_type && item.expense_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.for_whom && item.for_whom.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchDate = true;
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (activeFilter === 'day') matchDate = item.rawDate >= now - oneDay;
      else if (activeFilter === 'month') matchDate = item.rawDate >= now - (30 * oneDay);
      else if (activeFilter === 'year') matchDate = item.rawDate >= now - (365 * oneDay);
      else if (activeFilter === 'custom' && startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + oneDay;
        matchDate = item.rawDate >= start && item.rawDate <= end;
      }
      
      return matchSearch && matchDate;
    });
  }, [expenses, searchQuery, activeFilter, startDate, endDate]);

  const totalExpense = filteredList.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleAddExpense = async () => {
    if (!newExpenseForm.expense_type || !newExpenseForm.amount) return alert('ক্যাটাগরি এবং পরিমাণ আবশ্যক');
    
    setIsSaving(true);
    try {
      const amountNum = Number(newExpenseForm.amount);
      const formattedDate = new Date(newExpenseForm.date);
      const empName = employees.find(e => e.id === newExpenseForm.employee_id)?.name || '';
      let uploadedUrl = '';

      if (isDemoMode) {
        const newItem = {
          id: Date.now().toString(),
          expense_type: newExpenseForm.expense_type,
          for_whom: newExpenseForm.for_whom,
          employee_name: empName,
          amount: amountNum,
          note: newExpenseForm.note,
          receipt_url: expenseReceipt ? URL.createObjectURL(expenseReceipt) : '',
          date: formattedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: formattedDate.getTime()
        };
        setExpenses([newItem, ...expenses].sort((a, b) => b.rawDate - a.rawDate));
      } else {
        if (!activeBusiness?.id) return;

        // রিসিপ্ট আপলোড
        if (expenseReceipt) {
          const fileExt = expenseReceipt.name.split('.').pop();
          const fileName = `expense-${activeBusiness.id}-${Date.now()}.${fileExt}`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, expenseReceipt);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            uploadedUrl = urlData.publicUrl;
          }
        }

        const { error } = await supabase.from('expenses').insert([{
          business_id: activeBusiness.id,
          expense_type: newExpenseForm.expense_type,
          for_whom: newExpenseForm.for_whom,
          employee_id: newExpenseForm.employee_id || null,
          amount: amountNum,
          note: newExpenseForm.note,
          receipt_url: uploadedUrl,
          date: newExpenseForm.date
        }]);
        if (error) throw error;
        fetchExpenses();
      }

      const newReceiptData = {
        id: Date.now().toString(),
        receiptNo: `EXP-${new Date().getTime().toString().slice(-6)}`,
        expense_type: newExpenseForm.expense_type,
        for_whom: newExpenseForm.for_whom,
        employee_name: empName,
        amount: amountNum,
        note: newExpenseForm.note,
        date: formattedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        receipt_url: expenseReceipt ? (isDemoMode ? URL.createObjectURL(expenseReceipt) : '') : ''
      };

      setIsAddModalOpen(false);
      setLastSavedExpense(newReceiptData);
      setShowReceiptModal(true);
      setExpenseReceipt(null);
      setNewExpenseForm({ expense_type: 'সাধারণ', for_whom: '', employee_id: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!newExpenseForm.expense_type || !newExpenseForm.amount) return alert('ক্যাটাগরি এবং পরিমাণ আবশ্যক');
    setIsSaving(true);
    try {
      const amountNum = Number(newExpenseForm.amount);
      const formattedDate = new Date(newExpenseForm.date);
      const empName = employees.find(e => e.id === newExpenseForm.employee_id)?.name || '';
      let uploadedUrl = selectedExpense.receipt_url || '';

      if (isDemoMode) {
        const updated = expenses.map(e => e.id === selectedExpense.id ? {
          ...e,
          expense_type: newExpenseForm.expense_type,
          for_whom: newExpenseForm.for_whom,
          employee_name: empName,
          amount: amountNum,
          note: newExpenseForm.note,
          receipt_url: editReceipt ? URL.createObjectURL(editReceipt) : e.receipt_url,
          date: formattedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: formattedDate.getTime()
        } : e);
        setExpenses(updated.sort((a, b) => b.rawDate - a.rawDate));
      } else {
        if (!activeBusiness?.id) return;

        if (editReceipt) {
          const fileExt = editReceipt.name.split('.').pop();
          const fileName = `expense-${activeBusiness.id}-${Date.now()}.${fileExt}`;
          const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, editReceipt);
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            uploadedUrl = urlData.publicUrl;
          }
        }

        const { error } = await supabase.from('expenses').update({
          expense_type: newExpenseForm.expense_type,
          for_whom: newExpenseForm.for_whom,
          employee_id: newExpenseForm.employee_id || null,
          amount: amountNum,
          note: newExpenseForm.note,
          receipt_url: uploadedUrl,
          date: newExpenseForm.date
        }).eq('id', selectedExpense.id);
        if (error) throw error;
        fetchExpenses();
      }
      
      setIsEditingExpense(false);
      setSelectedExpense(null);
      setEditReceipt(null);
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareReceipt = async () => {
    const receiptElement = document.getElementById('printable-expense-receipt');
    if (!receiptElement) return;
    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'expense-receipt.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Expense Receipt' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `expense-receipt.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('রিসিপ্টটি ডাউনলোড করা হয়েছে।');
        }
      });
    } catch (err) {
      alert('শেয়ার করতে সমস্যা হয়েছে।');
    }
  };

  const applyCustomDate = () => {
    if (!startDate || !endDate) return alert('শুরু এবং শেষ তারিখ নির্বাচন করুন');
    setActiveFilter('custom');
    setIsCustomDateOpen(false);
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ডিপো খরচের খাতা</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* সামারি কার্ড */}
        <div className="bg-gradient-to-br from-da-depotNavy to-da-depotBlue border border-da-depotNavy/30 rounded-xl p-4 shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden shrink-0">
          <span className="text-sm font-bold text-blue-100 mb-1">সর্বমোট খরচ</span>
          {isLoading ? (
            <Loader2 className="animate-spin text-white mt-1" size={28}/>
          ) : (
            <span className="font-black text-3xl">৳ {toBangla(totalExpense)}</span>
          )}
        </div>

        {/* ফিল্টার */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => setActiveFilter('day')} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => setActiveFilter('month')} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => setActiveFilter('year')} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-da-depotBlue text-white border-da-depotBlue' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* সার্চ */}
        <div className="flex gap-2 items-center shrink-0">
          <div className="flex-1 bg-white border border-da-cardBorder rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue">
            <Search size={18} className="text-da-textMuted" />
            <input type="text" placeholder="খরচ খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
          </div>
        </div>

        <div className="flex justify-between text-[11px] font-bold text-da-textMuted px-1">
          <span>মোট লেনদেন: {toBangla(filteredList.length)} টি</span>
        </div>

        {/* লিস্ট */}
        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
        ) : filteredList.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {filteredList.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { 
                  setSelectedExpense(item); 
                  setIsEditingExpense(false); 
                }} 
                className="bg-white rounded-xl p-2.5 border border-da-cardBorder shadow-sm flex flex-col gap-1.5 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue shrink-0">
                      <Banknote size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[13px] text-da-textDark truncate">{item.expense_type}</h3>
                      <p className="text-[10px] text-da-textMuted mt-0.5">{item.date} • {item.note || 'নোট নেই'}</p>
                    </div>
                  </div>
                  <p className="font-black text-[14px] text-da-red shrink-0 pl-2">৳{toBangla(item.amount)}</p>
                </div>
                
                {/* প্রাপক ও এন্ট্রি তথ্য */}
                {(item.for_whom || item.employee_name) && (
                  <div className="flex flex-wrap gap-1.5 pl-10">
                    {item.for_whom && <span className="text-[9px] font-bold text-da-textMuted bg-da-depotBg px-1.5 py-0.5 rounded border border-da-cardBorder">প্রাপক: {item.for_whom}</span>}
                    {item.employee_name && <span className="text-[9px] font-bold text-da-depotBlue bg-da-depotBlue/10 px-1.5 py-0.5 rounded border border-da-depotBlue/20">এন্ট্রি: {item.employee_name}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-da-textMuted mt-10">
            <FileText size={48} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">কোনো খরচের তথ্য পাওয়া যায়নি</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন খরচ যোগ করুন
        </button>
      </div>

      {/* ================= মডাল: নতুন খরচ ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন খরচ যোগ করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">টাকার পরিমাণ <span className="text-da-red">*</span></label>
                  <input type="number" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({...newExpenseForm, amount: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold text-da-depotBlue outline-none focus:border-da-depotBlue bg-da-depotBg/50" placeholder="৳ 0" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">তারিখ</label>
                  <input type="date" value={newExpenseForm.date} onChange={e => setNewExpenseForm({...newExpenseForm, date: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরি <span className="text-da-red">*</span></label>
                <div className="flex gap-1">
                  <select value={newExpenseForm.expense_type} onChange={e => setNewExpenseForm({...newExpenseForm, expense_type: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue">
                    <option>সাধারণ</option>
                    <option>গোডাউন ভাড়া</option>
                    <option>ম্যানেজার বেতন</option>
                    <option>পরিবহন খরচ</option>
                    <option>বিদ্যুৎ বিল</option>
                    <option>অন্যান্য</option>
                  </select>
                  <button onClick={() => setIsCategoryModalOpen(true)} className="bg-da-depotBlue/10 text-da-depotBlue px-3 rounded-lg font-bold text-lg shrink-0 border border-da-depotBlue/20">+</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">প্রাপক</label>
                  <input type="text" value={newExpenseForm.for_whom} onChange={e => setNewExpenseForm({...newExpenseForm, for_whom: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="যেমন: ড্রাইভার" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">এন্ট্রি করেছেন</label>
                  <select value={newExpenseForm.employee_id} onChange={e => setNewExpenseForm({...newExpenseForm, employee_id: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option value="">সিলেক্ট করুন</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট</label>
                <input type="text" value={newExpenseForm.note} onChange={e => setNewExpenseForm({...newExpenseForm, note: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="বিস্তারিত লিখুন..." />
              </div>

              <div>
                <button onClick={() => receiptInputRef.current?.click()} className="w-full border border-dashed border-da-cardBorder rounded-lg p-2 flex items-center justify-center gap-2 text-da-textMuted hover:bg-da-depotBg transition">
                  <ImageIcon size={16} className={expenseReceipt ? 'text-da-green' : ''} />
                  <span className="text-[11px] font-bold truncate max-w-[200px]">{expenseReceipt ? expenseReceipt.name : 'রিসিপ্টের ছবি আপলোড করুন'}</span>
                </button>
                <input type="file" ref={receiptInputRef} onChange={e => setExpenseReceipt(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddExpense} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: বিস্তারিত ও এডিট ================= */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2">
                {isEditingExpense ? 'খরচ এডিট করুন' : 'খরচের বিস্তারিত'}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditingExpense && (
                  <button onClick={() => { 
                    setIsEditingExpense(true); 
                    setNewExpenseForm({
                      expense_type: selectedExpense.expense_type || 'সাধারণ',
                      for_whom: selectedExpense.for_whom || '',
                      employee_id: selectedExpense.employee_id || '',
                      amount: selectedExpense.amount?.toString() || '',
                      note: selectedExpense.note || '',
                      date: selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });
                    setEditReceipt(null);
                  }} className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold">
                    এডিট
                  </button>
                )}
                <button onClick={() => { setSelectedExpense(null); setIsEditingExpense(false); }} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
              </div>
            </div>
            
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              {!isEditingExpense ? (
                <>
                  <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder text-center">
                    <p className="text-[10px] font-bold text-da-textMuted">মোট খরচ</p>
                    <p className="font-black text-2xl text-da-red mt-1">৳ {toBangla(selectedExpense.amount)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted uppercase tracking-wider">ক্যাটাগরি</p>
                      <p className="text-xs font-bold text-da-textDark mt-0.5">{selectedExpense.expense_type}</p>
                    </div>
                    <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted uppercase tracking-wider">তারিখ</p>
                      <p className="text-xs font-bold text-da-textDark mt-0.5">{selectedExpense.date}</p>
                    </div>
                    <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted uppercase tracking-wider">প্রাপক</p>
                      <p className="text-xs font-bold text-da-textDark mt-0.5">{selectedExpense.for_whom || 'সাধারণ'}</p>
                    </div>
                    <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted uppercase tracking-wider">এন্ট্রি করেছেন</p>
                      <p className="text-xs font-bold text-da-textDark mt-0.5">{selectedExpense.employee_name || 'সিস্টেম'}</p>
                    </div>
                  </div>
                  
                  {selectedExpense.note && (
                    <div className="bg-da-depotBg p-2.5 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted mb-1">নোট</p>
                      <p className="text-xs text-da-textDark">{selectedExpense.note}</p>
                    </div>
                  )}

                  {selectedExpense.receipt_url && (
                    <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">
                      <p className="text-[9px] font-bold text-da-textMuted mb-1 flex items-center gap-1"><ImageIcon size={10}/> রিসিপ্ট</p>
                      <img src={selectedExpense.receipt_url} alt="Receipt" className="w-full h-auto max-h-[250px] object-contain rounded border border-da-cardBorder" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">টাকার পরিমাণ</label>
                      <input type="number" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({...newExpenseForm, amount: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold text-da-depotBlue outline-none focus:border-da-depotBlue bg-da-depotBg/50" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">তারিখ</label>
                      <input type="date" value={newExpenseForm.date} onChange={e => setNewExpenseForm({...newExpenseForm, date: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরি</label>
                    <select value={newExpenseForm.expense_type} onChange={e => setNewExpenseForm({...newExpenseForm, expense_type: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue">
                      <option>সাধারণ</option>
                      <option>গোডাউন ভাড়া</option>
                      <option>ম্যানেজার বেতন</option>
                      <option>পরিবহন খরচ</option>
                      <option>বিদ্যুৎ বিল</option>
                      <option>অন্যান্য</option>
                      <option>{newExpenseForm.expense_type}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">প্রাপক</label>
                      <input type="text" value={newExpenseForm.for_whom} onChange={e => setNewExpenseForm({...newExpenseForm, for_whom: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">এন্ট্রি করেছেন</label>
                      <select value={newExpenseForm.employee_id} onChange={e => setNewExpenseForm({...newExpenseForm, employee_id: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                        <option value="">সিলেক্ট করুন</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট</label>
                    <input type="text" value={newExpenseForm.note} onChange={e => setNewExpenseForm({...newExpenseForm, note: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>

                  <div>
                    <button onClick={() => editReceiptInputRef.current?.click()} className="w-full border border-dashed border-da-cardBorder rounded-lg p-2 flex items-center justify-center gap-2 text-da-textMuted hover:bg-da-depotBg transition">
                      <ImageIcon size={16} className={editReceipt ? 'text-da-green' : ''} />
                      <span className="text-[11px] font-bold truncate max-w-[200px]">{editReceipt ? editReceipt.name : 'রিসিপ্ট পরিবর্তন করুন'}</span>
                    </button>
                    <input type="file" ref={editReceiptInputRef} onChange={e => setEditReceipt(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex flex-col gap-2 shrink-0">
              {isEditingExpense ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingExpense(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
                  <button onClick={handleUpdateExpense} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                    {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'আপডেট করুন'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => {
                    setLastSavedExpense({ ...selectedExpense, receiptNo: `EXP-${selectedExpense.id.slice(-6)}` });
                    setShowReceiptModal(true);
                  }} className="flex-1 bg-da-depotNavy text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">
                    <Printer size={14}/> রিসিপ্ট
                  </button>
                  <button onClick={() => setSelectedExpense(null)} className="flex-1 bg-white border border-da-cardBorder text-da-textDark py-2 rounded-xl font-bold shadow-md">বন্ধ করুন</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: রিসিপ্ট ভিউ ================= */}
      {showReceiptModal && lastSavedExpense && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><FileText size={16}/> খরচের রিসিপ্ট</h2>
              <button onClick={() => setShowReceiptModal(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-3 overflow-y-auto flex justify-center bg-gray-100">
              {/* প্রিন্টেবল এরিয়া */}
              <div id="printable-expense-receipt" className="bg-white p-4 w-full max-w-[320px] font-serif text-[11px] border border-gray-300 shadow-sm">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-da-depotNavy">DREAM AGRO</h2>
                  <p className="text-[10px] text-gray-500">ডিপো খরচের রিসিপ্ট</p>
                </div>
                
                <div className="flex justify-between items-center mb-2 text-[10px]">
                  <p className="font-bold text-da-textDark">রিসিপ্ট # {lastSavedExpense.receiptNo}</p>
                  <p className="text-da-textMuted">{lastSavedExpense.date}</p>
                </div>
                
                <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 flex flex-col gap-1">
                  <p><span className="font-bold">ক্যাটাগরি:</span> {lastSavedExpense.expense_type}</p>
                  {lastSavedExpense.for_whom && <p><span className="font-bold">প্রাপক:</span> {lastSavedExpense.for_whom}</p>}
                  {lastSavedExpense.employee_name && <p><span className="font-bold">এন্ট্রি করেছেন:</span> {lastSavedExpense.employee_name}</p>}
                </div>
                
                <div className="flex flex-col gap-1 text-[11px] text-right pr-1">
                  <div className="flex justify-between font-bold text-sm text-da-depotBlue mt-1 pt-1 border-t border-dashed border-gray-400">
                    <span>মোট খরচ:</span> 
                    <span>৳ {toBangla(lastSavedExpense.amount)}</span>
                  </div>
                </div>
                
                {lastSavedExpense.note && <p className="mt-2 text-[10px]">নোট: {lastSavedExpense.note}</p>}
                
                <div className="text-center mt-4 text-[9px] text-gray-400">Powered by: Akand Smart Solutions</div>
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => window.print()} className="flex-1 bg-da-depotNavy text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">
                <Printer size={16}/> প্রিন্ট
              </button>
              <button onClick={handleShareReceipt} className="flex-1 bg-da-depotBlue text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">
                <Share2 size={16}/> শেয়ার
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন ক্যাটাগরি ================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm">নতুন ক্যাটাগরি</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4">
              <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরির নাম</label>
              <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="যেমন: অফিস খরচ" />
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCategoryModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={() => {
                if(customCategory.trim()) {
                  setNewExpenseForm({...newExpenseForm, expense_type: customCategory.trim()});
                  setCustomCategory('');
                  setIsCategoryModalOpen(false);
                }
              }} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md">যোগ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: কাস্টম তারিখ ================= */}
      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={16}/> তারিখ নির্বাচন</h2>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">শুরুর তারিখ</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">শেষ তারিখ</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={applyCustomDate} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1"><Check size={16}/> অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-da-depotBlue text-white border-da-depotBlue' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
      {title}
    </button>
  );
}