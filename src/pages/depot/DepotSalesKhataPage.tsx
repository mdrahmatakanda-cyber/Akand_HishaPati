import { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Clock, Search, Loader2, ReceiptText } from 'lucide-react';
import SalePage from '../SalePage';
import TransactionDetailsPage from '../TransactionDetailsPage';
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
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (activeTab !== 'history') return;

    const fetchSales = async () => {
      setIsLoading(true);
      if (isDemoMode) {
        setSales([
          { id: '1', receipt_no: 'INV-001', total_amount: 5000, created_at: new Date().toISOString(), customers: { name: 'রহিম এন্টারপ্রাইজ' } },
          { id: '2', receipt_no: 'INV-002', total_amount: 12000, created_at: new Date().toISOString(), customers: { name: 'করিম স্টোর' } }
        ]);
        setIsLoading(false);
        return;
      }
      if (!activeBusiness?.id) return;

      const { data, error } = await supabase.from('sales')
        .select('*, customers(name)')
        .eq('business_id', activeBusiness.id)
        .eq('is_depot', true)
        .is('deleted_at', null)
        .order('sale_date', { ascending: false });

      if (error) console.error('Depot sales fetch error:', error.message);
      setSales(data || []);
      setIsLoading(false);
    };
    fetchSales();
  }, [isDemoMode, activeBusiness, activeTab, refreshKey]);

  const filteredSales = sales.filter(s => {
    const no = s.receipt_no || s.challan_no || s.invoice_no || '';
    return no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (selectedSaleId) {
    return (
      <TransactionDetailsPage
        type="sale"
        transactionId={selectedSaleId}
        onBack={() => {
          setSelectedSaleId(null);
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
          <div className="h-full">
            <SalePage
              isDepot={true}
              onBack={() => {
                setRefreshKey(k => k + 1);
                setActiveTab('history');
              }}
              onNavigate={onNavigate}
            />
          </div>
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
                {filteredSales.map(sale => {
                  const invNo = sale.receipt_no || sale.challan_no || sale.invoice_no || sale.id.slice(0, 8).toUpperCase();
                  const totalAmt = Number(sale.total_amount ?? sale.grand_total ?? 0);
                  return (
                    <div key={sale.id} onClick={() => setSelectedSaleId(sale.id)} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue"><ReceiptText size={20} /></div>
                        <div>
                          <h3 className="font-bold text-sm text-da-textDark">{invNo}</h3>
                          <p className="text-[10px] text-da-textMuted mt-0.5">{sale.customers?.name || 'সাধারণ কাস্টমার'} | {new Date(sale.sale_date || sale.created_at).toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className="font-black text-[14px] text-da-greenDeep">৳{toBangla(totalAmt)}</p></div>
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