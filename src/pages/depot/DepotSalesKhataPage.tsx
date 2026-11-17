import { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Clock, Search, Loader2, ReceiptText } from 'lucide-react';
import SalePage from '../SalePage';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toBangla } from '../../lib/utils';

interface Props { onBack: () => void; onNavigate: (screen: string) => void; }

export default function DepotSalesKhataPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history');
  
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab !== 'history') return;

    const fetchSales = async () => {
      setIsLoading(true);
      if (isDemoMode) {
        setSales([
          { id: '1', invoice_no: 'INV-001', grand_total: 5000, created_at: new Date().toISOString(), customers: { name: 'রহিম এন্টারপ্রাইজ' } },
          { id: '2', invoice_no: 'INV-002', grand_total: 12000, created_at: new Date().toISOString(), customers: { name: 'করিম স্টোর' } }
        ]);
        setIsLoading(false);
        return;
      }
      if (!activeBusiness?.id) return;

      const { data } = await supabase.from('sales')
        .select('id, invoice_no, grand_total, created_at, customers(name)')
        .eq('business_id', activeBusiness.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      setSales(data || []);
      setIsLoading(false);
    };
    fetchSales();
  }, [isDemoMode, activeBusiness, activeTab]);

  const filteredSales = sales.filter(s => 
    s.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[100dvh] bg-da-depotBg flex flex-col overflow-hidden w-full font-serif">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">বিক্রির খাতা</h1>
        </div>
        <div className="flex px-2 bg-white/5">
          <button onClick={() => setActiveTab('new')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'new' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <PlusCircle size={16}/> নতুন বিক্রি
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'history' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <Clock size={16}/> বিক্রির ইতিহাস
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'new' ? (
          <div className="h-full"><SalePage onBack={() => setActiveTab('history')} onNavigate={onNavigate} /></div>
        ) : (
          <div className="h-full overflow-y-auto p-3 flex flex-col gap-3">
            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm shrink-0">
              <Search size={18} className="text-da-textMuted" />
              <input type="text" placeholder="রিসিপ্ট বা কাস্টমার খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>

            {isLoading ? (
              <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো বিক্রির ইতিহাস পাওয়া যায়নি</div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredSales.map(sale => (
                  <div key={sale.id} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue"><ReceiptText size={20} /></div>
                      <div>
                        <h3 className="font-bold text-sm text-da-textDark">{sale.invoice_no || 'রিসিপ্ট নেই'}</h3>
                        <p className="text-[10px] text-da-textMuted mt-0.5">{sale.customers?.name || 'সাধারণ কাস্টমার'} | {new Date(sale.created_at).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-black text-[14px] text-da-greenDeep">৳{toBangla(sale.grand_total)}</p></div>
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