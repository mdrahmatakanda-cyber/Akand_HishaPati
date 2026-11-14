import { useState, useEffect } from 'react';
import { Truck, ArrowRightLeft, Loader2 } from 'lucide-react';
import TransactionEngine from '../../components/TransactionEngine';
import type { EngineProduct, EngineParty } from '../../components/TransactionEngine';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoDealers, demoDepots } from '../../lib/demoData';

interface PageProps { onBack: () => void; }

export default function DepotTransferPage({ onBack }: PageProps) {
  const { activeBusiness } = useAuth();
  const { isDemoMode } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [dealers, setDealers] = useState<EngineParty[]>([]);
  const [depots, setDepots] = useState<EngineParty[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isDemoMode && !activeBusiness?.id) return;
      setIsLoading(true);

      try {
        if (isDemoMode) {
          setProducts(demoProducts.map(p => ({ 
            id: p.id, name: p.name, category: p.category, company: p.company, 
            stockQty: p.stock, rate: p.salePrice, unit: 'পিস' 
          })));
          setDealers(demoDealers.map((d: any) => ({
            id: d.id.toString(), name: d.name, phone: d.phone, address: d.area || 'N/A'
          })));
          setDepots(demoDepots);
        } else {
          if (!activeBusiness) return;
          const bizId = activeBusiness.id; // ✅ লোকাল ভ্যারিয়েবল তৈরি করে নাল-চেক এড়ানো হলো

          const [prodRes, catRes, compRes, custRes, bizRes] = await Promise.all([
            supabase.from('products').select('*').eq('business_id', bizId).gt('stock_quantity', 0),
            supabase.from('categories').select('*'),
            supabase.from('companies').select('*'),
            supabase.from('customers').select('*'),
            supabase.from('businesses').select('*').eq('type', 'depot')
          ]);

          if (prodRes.data) {
            const cats = catRes.data || [];
            const comps = compRes.data || [];
            setProducts(prodRes.data.map((p: any) => ({
              id: p.id, 
              name: p.name, 
              category: cats.find((c: any) => c.id === p.category_id)?.name || 'সাধারণ', 
              company: comps.find((c: any) => c.id === p.company_id)?.name || 'সাধারণ',
              stockQty: p.stock_quantity || 0,
              rate: p.sale_price || 0,
              unit: p.unit || 'পিস',
              image_url: p.image_url
            })));
          }
          if (custRes.data) {
            setDealers(custRes.data.map((c: any) => ({ 
              id: c.id, name: c.name, phone: c.phone || 'N/A', address: c.address || 'N/A' 
            })));
          }
          if (bizRes.data) {
            setDepots(bizRes.data.map((b: any) => ({ 
              id: b.id, name: b.name, phone: b.phone || 'N/A', address: b.address || 'N/A' 
            })));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const handleFinalize = () => {
    alert('সফলভাবে সম্পন্ন হয়েছে!');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#EFF6F3]">
        <Loader2 className="animate-spin text-[#0D3B80] mb-3" size={32}/>
        <p className="font-bold text-gray-600">ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-[#0B5C47] text-white p-2 flex justify-center gap-2 shadow-md z-50">
        <button onClick={() => setActiveTab(0)} className={`flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 0 ? 'bg-white text-[#0D3B80] shadow' : 'bg-white/10 hover:bg-white/20'}`}>
          <Truck size={16} /> ডিলার ট্রান্সফার
        </button>
        <button onClick={() => setActiveTab(1)} className={`flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 1 ? 'bg-white text-[#0D3B80] shadow' : 'bg-white/10 hover:bg-white/20'}`}>
          <ArrowRightLeft size={16} /> ডিপো ট্রান্সফার
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 0 ? (
          <TransactionEngine 
            mode="dealer_transfer"
            title="ডিলার ট্রান্সফার"
            partyLabel="ডিলার"
            products={products}
            parties={dealers}
            onBack={onBack}
            onFinalize={handleFinalize}
          />
        ) : (
          <TransactionEngine 
            mode="depot_transfer"
            title="ডিপো ট্রান্সফার"
            partyLabel="গন্তব্য ডিপো"
            products={products}
            parties={depots}
            onBack={onBack}
            onFinalize={handleFinalize}
          />
        )}
      </div>
    </div>
  );
}