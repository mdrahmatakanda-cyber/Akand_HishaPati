import { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Clock, Search, Loader2, ShoppingBag } from 'lucide-react';
import DepotStockInPage from './DepotStockInPage';
import TransactionDetailsPage from '../TransactionDetailsPage';
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
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (activeTab !== 'history') return;

    const fetchPurchases = async () => {
      setIsLoading(true);
      if (isDemoMode) {
        setPurchases([
          { id: '1', receipt_no: 'PUR-001', total_amount: 50000, created_at: new Date().toISOString(), suppliers: { name: 'নিউজা' } },
          { id: '2', receipt_no: 'PUR-002', total_amount: 12000, created_at: new Date().toISOString(), suppliers: { name: 'ভাই ভাই এগ্রো' } }
        ]);
        setIsLoading(false);
        return;
      }
      if (!activeBusiness?.id) return;

      const { data, error } = await supabase.from('purchases')
        .select('*, suppliers(name)')
        .eq('business_id', activeBusiness.id)
        .eq('is_depot', true)
        .is('deleted_at', null)
        .order('purchase_date', { ascending: false });

      if (error) console.error('Depot purchases fetch error:', error.message);
      setPurchases(data || []);
      setIsLoading(false);
    };
    fetchPurchases();
  }, [isDemoMode, activeBusiness, activeTab, refreshKey]);

  const filteredPurchases = purchases.filter(p => {
    const no = p.receipt_no || p.challan_no || p.invoice_no || '';
    return no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (selectedPurchaseId) {
    return (
      <TransactionDetailsPage
        type="purchase"
        transactionId={selectedPurchaseId}
        onBack={() => {
          setSelectedPurchaseId(null);
          setRefreshKey(k => k + 1);
        }}
      />
    );
  }

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
          <div className="h-full">
            <DepotStockInPage onBack={() => { setRefreshKey(k => k + 1); setActiveTab('history'); }} />
          </div>
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
                {filteredPurchases.map(purchase => {
                  const invNo = purchase.receipt_no || purchase.challan_no || purchase.invoice_no || purchase.id.slice(0, 8).toUpperCase();
                  const totalAmt = Number(purchase.total_amount ?? purchase.grand_total ?? 0);
                  return (
                    <div key={purchase.id} onClick={() => setSelectedPurchaseId(purchase.id)} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue"><ShoppingBag size={20} /></div>
                        <div>
                          <h3 className="font-bold text-sm text-da-textDark">{invNo}</h3>
                          <p className="text-[10px] text-da-textMuted mt-0.5">{purchase.suppliers?.name || 'সাধারণ সাপ্লায়ার'} | {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className="font-black text-[14px] text-da-red">৳{toBangla(totalAmt)}</p></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}