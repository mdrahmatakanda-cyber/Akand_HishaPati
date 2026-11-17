import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import TransactionEngine, { fetchEngineData, type EngineProduct, type EngineParty } from '../../components/TransactionEngine';
import { useAppContext } from '../../context/AppContext';
import { showAppToast } from '../../components/PremiumToast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoCompaniesList } from '../../lib/demoData';

interface Props { onBack: () => void; }

export default function DepotStockInPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, businesses } = useAuth();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [companies, setCompanies] = useState<EngineParty[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!isDemoMode && !activeBusiness?.id) return;
      setIsDataLoading(true);
      try {
        if (isDemoMode) {
          setProducts(demoProducts.map(p => ({ id: p.id.toString(), name: p.name, category: p.category, company: p.company, stockQty: p.stock, rate: p.purchasePrice, unit: 'পিস', image_url: p.image_url })));
          setCompanies(demoCompaniesList.map(c => ({ id: c.id, name: c.name, phone: c.phone || '', address: c.address || '' })));
        } else if (activeBusiness?.id) {
          const res = await fetchEngineData(activeBusiness.id, 'companies', 'purchase_price', businesses.map(b => b.id), true);
          setProducts(res.products);
          setCompanies(res.parties);
        }
      } catch (error) { console.error(error); } finally { setIsDataLoading(false); }
    };
    load();
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
        p_items: itemsJson,
        p_challan_no: data.challan || null,
        p_batch_no: data.batch || null,
        p_receipt_image_url: null,
        p_is_depot: true
      });

      if (error) {
        showAppToast("সেভ করতে সমস্যা: " + error.message, 'error');
        throw error;
      }
    }
    showAppToast('স্টক ইন সফলভাবে সম্পন্ন হয়েছে!', 'success');
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