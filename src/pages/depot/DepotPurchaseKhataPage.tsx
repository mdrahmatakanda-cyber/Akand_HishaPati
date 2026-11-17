import { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Clock, Search, Loader2, ShoppingBag } from 'lucide-react';
import DepotStockInPage from './DepotStockInPage';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toBangla } from '../../lib/utils';

interface Props { onBack: () => void; }

export default function DepotPurchaseKhataPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history');
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab !== 'history') return;

    const fetchPurchases = async () => {
      setIsLoading(true);
      if (isDemoMode) {
        setPurchases([
          { id: '1', invoice_no: 'PUR-001', grand_total: 50000, created_at: new Date().toISOString(), suppliers: { name: 'নিউজা' } },
          { id: '2', invoice_no: 'PUR-002', grand_total: 12000, created_at: new Date().toISOString(), suppliers: { name: 'ভাই ভাই এগ্রো' } }
        ]);
        setIsLoading(false);
        return;
      }
      if (!activeBusiness?.id) return;

      const { data } = await supabase.from('purchases')
        .select('id, invoice_no, grand_total, created_at, suppliers(name)')
        .eq('business_id', activeBusiness.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      setPurchases(data || []);
      setIsLoading(false);
    };
    fetchPurchases();
  }, [isDemoMode, activeBusiness, activeTab]);

  const filteredPurchases = purchases.filter(p => 
    p.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] bg-da-depotBg flex flex-col overflow-hidden w-full font-serif">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">ক্রয়ের খাতা</h1>
        </div>
        <div className="flex px-2 bg-white/5">
          <button onClick={() => setActiveTab('new')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'new' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <PlusCircle size={16}/> নতুন ক্রয়
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'history' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <Clock size={16}/> ক্রয়ের ইতিহাস
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'new' ? (
          <div className="h-full"><DepotStockInPage onBack={() => setActiveTab('history')} /></div>
        ) : (
          <div className="h-full overflow-y-auto p-3 flex flex-col gap-3">
            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm shrink-0">
              <Search size={18} className="text-da-textMuted" />
              <input type="text" placeholder="চালান বা কোম্পানি খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>

            {isLoading ? (
              <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো ক্রয়ের ইতিহাস পাওয়া যায়নি</div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredPurchases.map(purchase => (
                  <div key={purchase.id} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue"><ShoppingBag size={20} /></div>
                      <div>
                        <h3 className="font-bold text-sm text-da-textDark">{purchase.invoice_no || 'চালান নেই'}</h3>
                        <p className="text-[10px] text-da-textMuted mt-0.5">{purchase.suppliers?.name || 'সাধারণ সাপ্লায়ার'} | {new Date(purchase.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-black text-[14px] text-da-red">৳{toBangla(purchase.grand_total)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}