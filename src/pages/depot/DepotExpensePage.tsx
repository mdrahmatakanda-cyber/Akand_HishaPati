import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft, FileText, HelpCircle, Plus, Loader2, X, Edit3,
  Banknote, CalendarDays, Search, Image as ImageIcon, Trash2, ExternalLink
} from 'lucide-react';
import { toBangla, numberToWordsBn } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotExpenses, demoEmployeesList } from '../../lib/demoData';
import { showAppToast } from '../../components/PremiumToast';
import { ReceiptModal, type ReceiptData } from '../ReceiptModal';
import { uploadImageToSupabase, uploadPdfToUpstash, getUpstashFileUrl } from '../../lib/upload';

interface Props {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export default function DepotExpensePage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, user } = useAuth();
  const preparedByName = user?.user_metadata?.name || user?.email || 'ইউজার';

  const [expenses, setExpenses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingDocKey, setLoadingDocKey] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('month');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    expense_type: 'সাধারণ', for_whom: '', employee_id: '',
    amount: '', note: '', date: new Date().toISOString().split('T')[0]
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGlobalReceiptOpen, setIsGlobalReceiptOpen] = useState(false);
  const [globalReceiptData, setGlobalReceiptData] = useState<ReceiptData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setExpenses(demoDepotExpenses.map((e: any) => ({ ...e, rawDate: e.rawDate || new Date(e.date).getTime() || Date.now() })));
        setEmployees(demoEmployeesList);
      } else if (activeBusiness?.id) {
        const [expRes, empRes] = await Promise.all([
          supabase.from('expenses').select('*').eq('business_id', activeBusiness.id).eq('is_depot', true).is('deleted_at', null).order('date', { ascending: false }),
          supabase.from('employees').select('*').eq('business_id', activeBusiness.id).is('deleted_at', null)
        ]);

        if (expRes.error) throw expRes.error;
        if (empRes.data) setEmployees(empRes.data);
        if (expRes.data) {
          const empList = empRes.data || [];
          setExpenses(expRes.data.map((e: any) => {
            const d = new Date(e.date);
            return {
              ...e,
              employee_name: empList.find((emp: any) => emp.id === e.employee_id)?.name || '',
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
      }
    } catch (error: any) {
      showAppToast('খরচ লোড করতে সমস্যা: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, [isDemoMode, activeBusiness?.id]);

  const filteredList = useMemo(() => {
    return expenses.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        (item.expense_type && item.expense_type.toLowerCase().includes(q)) ||
        (item.for_whom && item.for_whom.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q));

      let matchDate = true;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const raw = item.rawDate || now;

      if (activeFilter === 'day') matchDate = raw >= now - oneDay;
      else if (activeFilter === 'month') matchDate = raw >= now - 30 * oneDay;
      else if (activeFilter === 'year') matchDate = raw >= now - 365 * oneDay;
      else if (activeFilter === 'custom' && startDate && endDate) {
        matchDate = raw >= new Date(startDate).getTime() && raw <= new Date(endDate).getTime() + oneDay;
      }
      return matchSearch && matchDate;
    });
  }, [expenses, searchQuery, activeFilter, startDate, endDate]);

  const totalExpense = filteredList.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const openForm = (expense: any = null) => {
    if (expense) {
      setEditingId(expense.id);
      setFormData({
        expense_type: expense.expense_type || 'সাধারণ',
        for_whom: expense.for_whom || '',
        employee_id: expense.employee_id || '',
        amount: expense.amount?.toString() || '',
        note: expense.note || '',
        date: expense.rawDate ? new Date(expense.rawDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingId(null);
      setFormData({ expense_type: 'সাধারণ', for_whom: '', employee_id: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    }
    setReceiptFile(null);
    setIsFormOpen(true);
  };

  const handleViewReceipt = async (fileUrlOrKey: string) => {
    try {
      if (fileUrlOrKey.startsWith('http')) {
        window.open(fileUrlOrKey, '_blank');
      } else {
        setLoadingDocKey(fileUrlOrKey);
        const url = await getUpstashFileUrl(fileUrlOrKey);
        window.open(url, '_blank');
      }
    } catch (error: any) {
      showAppToast('রিসিপ্ট দেখতে সমস্যা হয়েছে: ' + error.message, 'error');
    } finally {
      setLoadingDocKey(null);
    }
  };

  const handleSaveExpense = async () => {
    if (!formData.expense_type || !formData.amount || Number(formData.amount) <= 0) {
      return showAppToast('সঠিক ক্যাটাগরি এবং টাকার পরিমাণ দিন', 'error');
    }
    setIsSaving(true);
    try {
      const amountNum = Number(formData.amount);
      const formattedDate = new Date(formData.date);
      const empName = employees.find(e => e.id === formData.employee_id)?.name || '';
      let uploadedUrl = editingId ? (expenses.find(e => e.id === editingId)?.receipt_url || '') : '';

      if (!isDemoMode && activeBusiness?.id) {
        if (receiptFile) {
          if (receiptFile.type === 'application/pdf') {
            const { fileKey } = await uploadPdfToUpstash(receiptFile);
            uploadedUrl = fileKey;
          } else {
            uploadedUrl = await uploadImageToSupabase(receiptFile, 'expenses');
          }
        }

        const payload = {
          business_id: activeBusiness.id,
          is_depot: true,
          expense_type: formData.expense_type,
          for_whom: formData.for_whom,
          employee_id: formData.employee_id || null,
          amount: amountNum,
          note: formData.note,
          receipt_url: uploadedUrl,
          date: formData.date
        };

        const { error } = editingId
          ? await supabase.from('expenses').update(payload).eq('id', editingId)
          : await supabase.from('expenses').insert([payload]);
        if (error) throw error;
        await fetchExpenses();
      } else {
        const newItem = {
          id: editingId || Date.now().toString(),
          expense_type: formData.expense_type,
          for_whom: formData.for_whom,
          employee_id: formData.employee_id,
          employee_name: empName,
          amount: amountNum,
          note: formData.note,
          receipt_url: receiptFile ? URL.createObjectURL(receiptFile) : uploadedUrl,
          date: formattedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: formattedDate.getTime()
        };
        setExpenses(prev =>
          editingId
            ? prev.map(e => e.id === editingId ? newItem : e).sort((a, b) => b.rawDate - a.rawDate)
            : [newItem, ...prev].sort((a, b) => b.rawDate - a.rawDate)
        );
      }

      setIsFormOpen(false);
      showAppToast(editingId ? 'খরচ আপডেট হয়েছে!' : 'খরচ সফলভাবে যোগ হয়েছে!', 'success');
    } catch (error: any) {
      showAppToast("সমস্যা: " + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenGlobalReceipt = (expense: any) => {
    const receipt: ReceiptData = {
      type: 'expense',
      invoiceNo: `EXP-${String(expense.id).slice(-5).toUpperCase()}`,
      date: expense.date,
      status: 'পরিশোধিত',
      shopName: activeBusiness?.name || 'DREAM AGRO',
      shopAddress: (activeBusiness as any)?.address || '',
      shopPhone: (activeBusiness as any)?.phone || '',
      shopEmail: (activeBusiness as any)?.email || '',
      customerName: expense.for_whom || 'সাধারণ খরচ',
      proprietor: 'N/A',
      customerPhone: 'N/A',
      customerAddress: 'N/A',
      marketName: 'N/A',
      officerName: expense.employee_name || preparedByName,
      officerPhone: user?.user_metadata?.phone || 'N/A',
      officerEmail: user?.email || 'N/A',
      receiptTime: expense.date,
      vehicleNo: 'N/A',
      driverName: 'N/A',
      driverPhone: 'N/A',
      transportRent: 0,
      items: [{
        id: '1', name: expense.expense_type, category: 'ডিপো খরচ',
        quantity: 1, unit: 'টি', unitPrice: Number(expense.amount), totalPrice: Number(expense.amount)
      }],
      totalBags: 0, totalPieces: 1, subtotal: Number(expense.amount),
      discount: 0, grandTotal: Number(expense.amount),
      paidAmount: Number(expense.amount), dueAmount: 0,
      paidInWords: numberToWordsBn(Number(expense.amount)),
      note: expense.note || ''
    };
    setGlobalReceiptData(receipt);
    setIsGlobalReceiptOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      if (!isDemoMode && activeBusiness?.id) {
        const { error } = await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', deleteConfirmId);
        if (error) throw error;
      }
      setExpenses(prev => prev.filter(e => e.id !== deleteConfirmId));
      showAppToast('খরচ সফলভাবে ডিলিট হয়েছে!', 'success');
      setDeleteConfirmId(null);
    } catch (error: any) {
      showAppToast('সমস্যা: ' + error.message, 'error');
    } finally {
      setIsDeleting(false);
    }
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
            <button onClick={() => showAppToast('খরচের কার্ডে ট্যাপ করলে রিসিপ্ট ও প্রিন্ট অপশন পাবেন!', 'success')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        <div className="bg-gradient-to-br from-da-depotNavy to-da-depotBlue rounded-xl p-4 shadow-lg flex flex-col items-center justify-center text-white shrink-0">
          <span className="text-sm font-bold text-blue-100 mb-1">সর্বমোট ডিপো খরচ</span>
          {isLoading ? <Loader2 className="animate-spin text-white mt-1" size={28} /> : <span className="font-black text-3xl">৳ {toBangla(totalExpense)}</span>}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          {['day', 'month', 'year', 'all'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === f ? 'bg-da-depotBlue text-white border-da-depotBlue' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
              {f === 'day' ? 'দিন' : f === 'month' ? 'মাস' : f === 'year' ? 'বছর' : 'সব সময়'}
            </button>
          ))}
          <button onClick={() => setIsCustomDateOpen(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-da-depotBlue text-white border-da-depotBlue' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        <div className="bg-white border border-da-cardBorder rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm shrink-0">
          <Search size={18} className="text-da-textMuted" />
          <input type="text" placeholder="খরচ খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32} /></div>
        ) : filteredList.length > 0 ? (
          <div className="flex flex-col gap-1.5 mt-1">
            {filteredList.map((item) => (
              <div key={item.id} onClick={() => handleOpenGlobalReceipt(item)} className="bg-white rounded-xl p-2.5 border border-da-cardBorder shadow-sm flex flex-col gap-1.5 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue shrink-0"><Banknote size={16} /></div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[13px] text-da-textDark truncate">{item.expense_type}</h3>
                      <p className="text-[10px] text-da-textMuted mt-0.5 truncate">{item.date} • {item.note || 'নোট নেই'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pl-2">
                    <p className="font-black text-[14px] text-da-red mr-1">৳{toBangla(item.amount)}</p>
                    {item.receipt_url && (
                      <button onClick={(e) => { e.stopPropagation(); handleViewReceipt(item.receipt_url); }} disabled={loadingDocKey === item.receipt_url} className="p-1 text-da-depotBlue hover:text-da-green" title="ফাইল দেখুন">
                        {loadingDocKey === item.receipt_url ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openForm(item); }} className="p-1 text-da-depotBlue hover:bg-blue-50 rounded" title="এডিট">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }} className="p-1 text-da-textMuted hover:text-da-red" title="ডিলিট">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
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
          <div className="flex-1 flex flex-col items-center justify-center text-da-textMuted mt-10"><FileText size={48} className="mb-2 opacity-50" /><p className="text-sm font-bold">কোনো খরচের তথ্য পাওয়া যায়নি</p></div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
        <button onClick={() => openForm()} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2 active:scale-95 transition"><Plus size={18} /> নতুন খরচ যোগ করুন</button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{editingId ? 'খরচ এডিট করুন' : 'নতুন খরচ যোগ করুন'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">টাকার পরিমাণ *</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold text-da-depotBlue outline-none focus:border-da-depotBlue bg-da-depotBg/50" placeholder="৳ 0" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">তারিখ</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ক্যাটাগরি *</label>
                <select value={formData.expense_type} onChange={e => setFormData({ ...formData, expense_type: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue">
                  <option>সাধারণ</option><option>গোডাউন ভাড়া</option><option>ম্যানেজার বেতন</option>
                  <option>পরিবহন খরচ</option><option>বিদ্যুৎ বিল</option><option>অন্যান্য</option>
                  {formData.expense_type && !['সাধারণ', 'গোডাউন ভাড়া', 'ম্যানেজার বেতন', 'পরিবহন খরচ', 'বিদ্যুৎ বিল', 'অন্যান্য'].includes(formData.expense_type) && <option>{formData.expense_type}</option>}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">প্রাপক</label>
                  <input type="text" value={formData.for_whom} onChange={e => setFormData({ ...formData, for_whom: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="যেমন: ড্রাইভার" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">এন্ট্রি করেছেন</label>
                  <select value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option value="">সিলেক্ট করুন</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট</label>
                <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="বিস্তারিত লিখুন..." />
              </div>
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-da-cardBorder rounded-lg p-2 flex items-center justify-center gap-2 text-da-textMuted hover:bg-da-depotBg transition">
                  <ImageIcon size={16} className={receiptFile ? 'text-da-green' : ''} />
                  <span className="text-[11px] font-bold truncate max-w-[200px]">{receiptFile ? receiptFile.name : 'রিসিপ্টের ছবি বা PDF আপলোড করুন'}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={e => setReceiptFile(e.target.files?.[0] || null)} accept="image/*,.pdf" className="hidden" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsFormOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveExpense} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><CalendarDays size={16} /> তারিখ নির্বাচন</h2>
              <button onClick={() => setIsCustomDateOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">শুরুর তারিখ</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm" /></div>
              <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">শেষ তারিখ</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm" /></div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={() => { if (startDate && endDate) { setActiveFilter('custom'); setIsCustomDateOpen(false); } else showAppToast('শুরু ও শেষ তারিখ দিন', 'error'); }} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md">অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-da-red/10 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={26} className="text-da-red" /></div>
              <h3 className="font-bold text-base text-da-textDark mb-1">খরচ ডিলিট করবেন?</h3>
              <p className="text-xs text-da-textMuted">এই খরচটি রিসাইকেল বিনে জমা হবে এবং ক্যাশবক্স থেকেও সমন্বয় হবে।</p>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleDeleteExpense} disabled={isDeleting} className="flex-1 bg-da-red text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1.5">
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} ডিলিট
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        isOpen={isGlobalReceiptOpen}
        onClose={() => setIsGlobalReceiptOpen(false)}
        onCancel={() => setIsGlobalReceiptOpen(false)}
        onFinalize={() => setIsGlobalReceiptOpen(false)}
        isSaving={false}
        previewOnly={true}
        data={globalReceiptData}
      />
    </div>
  );
}