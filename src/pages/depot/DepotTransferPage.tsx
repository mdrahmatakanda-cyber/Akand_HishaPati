import { useState, useEffect } from 'react';
import { Truck, ArrowRightLeft, Loader2 } from 'lucide-react';
import TransactionEngine from '../../components/TransactionEngine';
import type { EngineProduct, EngineParty } from '../../components/TransactionEngine';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { demoProducts } from '../../lib/demoData';

interface PageProps { onBack: () => void; }

const demoDealers: EngineParty[] = [
  { id: 'd1', name: 'মোল্লা পোল্ট্রি', phone: '01711000001', address: 'গাজীপুর' },
  { id: 'd2', name: 'ভাই ভাই এগ্রো', phone: '01711000002', address: 'সাভার' },
];

export default function DepotTransferPage({ onBack }: PageProps) {
  const { activeBusiness } = useAuth();
  const { isDemoMode } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Dealer, 1: Depot
  
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [dealers, setDealers] = useState<EngineParty[]>([]);
  const [depots, setDepots] = useState<EngineParty[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({ id: p.id, name: p.name, category: p.category, company: p.company, stockQty: p.stock, rate: p.salePrice, unit: 'পিস' })));
        setDealers(demoDealers);
        setDepots([
          { id: 'dep1', name: 'কেন্দ্রীয় গুদাম', phone: 'N/A', address: 'হেড অফিস' },
          { id: 'dep2', name: 'গাজীপুর ডিপো', phone: 'N/A', address: 'গাজীপুর' }
        ]);
      } else {
        if (!activeBusiness?.id) return;
        
        // ✅ আলাদা আলাদা কোয়েরি
        const [prodRes, catRes, compRes, custRes, bizRes] = await Promise.all([
          supabase.from('products').select('*').eq('business_id', activeBusiness.id),
          supabase.from('categories').select('*').eq('business_id', activeBusiness.id),
          supabase.from('companies').select('*').eq('business_id', activeBusiness.id),
          supabase.from('customers').select('*').eq('business_id', activeBusiness.id),
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
        if (custRes.data) setDealers(custRes.data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone || 'N/A', address: c.address || 'N/A' })));
        if (bizRes.data) setDepots(bizRes.data.map((b: any) => ({ id: b.id, name: b.name, phone: b.phone || 'N/A', address: b.address || 'N/A' })));
      }
      setIsLoading(false);
    };
    fetchData();
  }, [isDemoMode, activeBusiness]);

  const handleFinalize = (data: any) => {
    console.log("Finalized Data:", data);
    alert('সফলভাবে সম্পন্ন হয়েছে! (ব্যাকএন্ডে সেভ হবে)');
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
      {/* ট্যাব সিলেক্টর */}
      <div className="bg-[#0B5C47] text-white p-2 flex justify-center gap-2 shadow-md z-50">
        <button onClick={() => setActiveTab(0)} className={`flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 0 ? 'bg-white text-[#0D3B80] shadow' : 'bg-white/10 hover:bg-white/20'}`}>
          <Truck size={16} /> ডিলার ট্রান্সফার
        </button>
        <button onClick={() => setActiveTab(1)} className={`flex-1 max-w-[200px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 1 ? 'bg-white text-[#0D3B80] shadow' : 'bg-white/10 hover:bg-white/20'}`}>
          <ArrowRightLeft size={16} /> ডিপো ট্রান্সফার
        </button>
      </div>

      {/* মাস্টার কম্পোনেন্ট */}
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