import { useState, useEffect, } from 'react';
import { ArrowLeft, FileText, HelpCircle, Plus, Loader2, X, Clock, Banknote } from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoExpenses } from '../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ExpenseKhataPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({ reason: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setExpenses(demoExpenses);
      } else {
        if (!activeBusiness?.id) return;
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('date', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setExpenses(data.map((e: any) => {
            const d = new Date(e.date);
            return {
              id: e.id,
              reason: e.reason,
              amount: Number(e.amount),
              note: e.note || '',
              date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              rawDate: d.getTime()
            };
          }));
        }
      }
    } catch (error) {
      console.error("Expense fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [isDemoMode, activeBusiness?.id]);

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const recentExpenses = expenses.slice(0, 3);

  const handleAddExpense = async () => {
    if (!newExpenseForm.reason || !newExpenseForm.amount) return alert('খরচের কারণ এবং পরিমাণ আবশ্যক');
    
    setIsSaving(true);
    try {
      const amountNum = Number(newExpenseForm.amount);
      const formattedDate = new Date(newExpenseForm.date);
      
      if (isDemoMode) {
        const newItem = {
          id: Date.now().toString(),
          reason: newExpenseForm.reason,
          amount: amountNum,
          note: newExpenseForm.note,
          date: formattedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: formattedDate.getTime()
        };
        setExpenses([newItem, ...expenses].sort((a, b) => b.rawDate - a.rawDate));
      } else {
        if (!activeBusiness?.id) return;
        const { error } = await supabase.from('expenses').insert([{
          business_id: activeBusiness.id,
          reason: newExpenseForm.reason,
          amount: amountNum,
          note: newExpenseForm.note,
          date: newExpenseForm.date
        }]);
        if (error) throw error;
        fetchExpenses();
      }
      setIsAddModalOpen(false);
      setNewExpenseForm({ reason: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">খরচের খাতা</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-[#FF5252] to-[#D32F2F] border border-red-300 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <span className="text-sm font-bold text-red-100 mb-1">এখন পর্যন্ত সর্বমোট খরচ</span>
          {isLoading ? (
            <Loader2 className="animate-spin text-white mt-1" size={32}/>
          ) : (
            <span className="font-black text-4xl">{toBangla(totalExpense)} ৳</span>
          )}
          <button onClick={() => onNavigate('expense_history')} className="mt-4 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-bold transition">
            <Clock size={14}/> সম্পূর্ণ ব্যয়ের তালিকা দেখুন
          </button>
        </div>

        {/* Recent Expenses Preview */}
        <div className="flex justify-between items-center px-1 mt-2">
          <h2 className="font-bold text-sm text-gray-700">সাম্প্রতিক খরচসমূহ</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-5"><Loader2 className="animate-spin text-[#0B5C47]" size={24}/></div>
        ) : recentExpenses.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentExpenses.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 shrink-0">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{item.reason}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-red-500">{toBangla(item.amount)} ৳</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-5">
            <FileText size={48} className="mb-2 opacity-50" />
            <p className="text-sm font-bold">কোনো খরচের তথ্য পাওয়া যায়নি</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন খরচ যোগ করুন
        </button>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন খরচ যোগ করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">খরচের কারণ <span className="text-red-500">*</span></label>
                <input type="text" value={newExpenseForm.reason} onChange={e => setNewExpenseForm({...newExpenseForm, reason: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" placeholder="যেমন: বিদ্যুৎ বিল" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">টাকার পরিমাণ <span className="text-red-500">*</span></label>
                  <input type="number" value={newExpenseForm.amount} onChange={e => setNewExpenseForm({...newExpenseForm, amount: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" placeholder="৳ 0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">তারিখ</label>
                  <input type="date" value={newExpenseForm.date} onChange={e => setNewExpenseForm({...newExpenseForm, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নোট (ঐচ্ছিক)</label>
                <input type="text" value={newExpenseForm.note} onChange={e => setNewExpenseForm({...newExpenseForm, note: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" placeholder="বিস্তারিত লিখুন..." />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddExpense} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}