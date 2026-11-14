import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import TransactionEngine from '../../components/TransactionEngine';
import type { EngineProduct, EngineParty } from '../../components/TransactionEngine';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoCompaniesList } from '../../lib/demoData';

interface Props { onBack: () => void; }

export default function DepotStockInPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [companies, setCompanies] = useState<EngineParty[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isDemoMode && !activeBusiness?.id) return;
      setIsDataLoading(true);

      try {
        if (isDemoMode) {
          setProducts(demoProducts.map(p => ({ 
            id: p.id.toString(), name: p.name, category: p.category, company: p.company, 
            stockQty: p.stock, rate: p.purchasePrice, unit: 'পিস', image_url: p.image_url
          })));
          setCompanies(demoCompaniesList.map(c => ({ id: c.id, name: c.name, phone: c.phone || '', address: c.address || '' })));
        } else {
          if (!activeBusiness) return;
          const bizId = activeBusiness.id;
          const [prodRes, catRes, compRes] = await Promise.all([
            supabase.from('products').select('*').eq('business_id', bizId),
            supabase.from('categories').select('*'),
            supabase.from('companies').select('*')
          ]);

          if (prodRes.data) {
            const cats = catRes.data || [];
            const comps = compRes.data || [];
            setProducts(prodRes.data.map((p: any) => ({
              id: p.id, name: p.name, 
              category: cats.find((c: any) => c.id === p.category_id)?.name || 'সাধারণ', 
              company: comps.find((c: any) => c.id === p.company_id)?.name || 'সাধারণ',
              stockQty: p.stock_quantity || 0, rate: p.purchase_price || 0, unit: p.unit || 'পিস', image_url: p.image_url
            })));
          }
          if (compRes.data) setCompanies(compRes.data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone || 'N/A', address: c.address || 'N/A' })));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const handleFinalizeStockIn = async (data: any) => {
    if (!isDemoMode) {
      const itemsJson = data.cart.map((item: any) => ({ 
        product_id: item.id, quantity: Number(item.quantity) || 0, rate: Number(item.rate) || 0, total: (Number(item.quantity) || 0) * (Number(item.rate) || 0) 
      }));

      const { error } = await supabase.rpc('create_purchase', {
        p_business_id: activeBusiness?.id,
        p_supplier_id: data.partyId || null,
        p_total_amount: data.finalTotal,
        p_discount: data.discountVal,
        p_delivery_charge: data.deliveryVal,
        p_paid_amount: data.cashReceived,
        p_due_amount: data.dueAmount > 0 ? data.dueAmount : 0,
        p_payment_method: 'cash',
        p_note: data.remarks,
        p_items: itemsJson
      });

      if (error) {
        alert("সেভ করতে সমস্যা: " + error.message);
        throw error;
      }
    }
    alert('স্টক ইন সফলভাবে সম্পন্ন হয়েছে!');
    onBack();
  };

  if (isDataLoading) {
    return <div className="h-[100dvh] flex flex-col items-center justify-center bg-da-depotBg"><Loader2 className="animate-spin text-da-depotBlue mb-3" size={32}/><p className="font-bold text-da-textMuted">ডেটা লোড হচ্ছে...</p></div>;
  }

  return (
    <TransactionEngine 
      mode="purchase"
      title="স্টক ইন"
      partyLabel="কোম্পানি"
      products={products}
      parties={companies}
      onBack={onBack}
      onFinalize={handleFinalizeStockIn}
    />
  );
}