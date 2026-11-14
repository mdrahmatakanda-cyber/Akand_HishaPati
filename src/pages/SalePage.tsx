import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import TransactionEngine from '../components/TransactionEngine';
import type { EngineProduct, EngineParty } from '../components/TransactionEngine';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoCustomersDetailed } from '../lib/demoData';

interface SaleProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function SalePage({ onBack, onNavigate }: SaleProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [customers, setCustomers] = useState<EngineParty[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const bizId = activeBusiness?.id;
      if (!isDemoMode && !bizId) return;
      setIsDataLoading(true);

      try {
        if (isDemoMode) {
          setProducts(demoProducts.map(p => ({ 
            id: p.id.toString(), 
            name: p.name, 
            category: p.category, 
            company: p.company, 
            stockQty: p.stock, 
            rate: p.salePrice,
            unit: 'পিস',
            image_url: p.image_url
          })));
          setCustomers(demoCustomersDetailed.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            address: c.address || c.market_name || ''
          })));
        } else {
          // ✅ আলাদা আলাদা কোয়েরি করে ডেটা আনা হচ্ছে (রিলেশন ইস্যু এড়াতে)
          const [prodRes, catRes, compRes, custRes] = await Promise.all([
            supabase.from('products').select('*').eq('business_id', bizId),
            supabase.from('categories').select('*').eq('business_id', bizId),
            supabase.from('companies').select('*').eq('business_id', bizId),
            supabase.from('customers').select('*').eq('business_id', bizId)
          ]);

          if (prodRes.data) {
            const cats = catRes.data || [];
            const comps = compRes.data || [];
            
            setProducts(prodRes.data.map((p: any) => ({
              id: p.id, 
              name: p.name, 
              // লোকাল ম্যাপিং করে ক্যাটাগরি ও কোম্পানি নাম বের করা হলো
              category: cats.find((c: any) => c.id === p.category_id)?.name || 'সাধারণ', 
              company: comps.find((c: any) => c.id === p.company_id)?.name || 'সাধারণ',
              stockQty: p.stock_quantity || 0,
              rate: p.sale_price || 0,
              unit: p.unit || 'পিস',
              image_url: p.image_url
            })));
          }
          if (custRes.data) {
            setCustomers(custRes.data.map((c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone || 'N/A',
              address: c.address || 'N/A'
            })));
          }
        }
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const handleFinalizeSale = async (data: any) => {
    if (!isDemoMode) {
      const itemsJson = data.cart.map((item: any) => ({ 
        product_id: item.id, 
        quantity: Number(item.quantity) || 0, 
        rate: Number(item.rate) || 0, 
        total: (Number(item.quantity) || 0) * (Number(item.rate) || 0) 
      }));
      
      const { error } = await supabase.rpc('create_sale', {
        p_business_id: activeBusiness?.id,
        p_customer_id: data.partyId || null,
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
    alert('বিক্রি সফলভাবে সম্পন্ন হয়েছে!');
    onBack(); 
  };

  if (isDataLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-da-bg">
        <Loader2 className="animate-spin text-da-green mb-3" size={32}/>
        <p className="font-bold text-da-textMuted">ডেটা লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <TransactionEngine 
      mode="sale"
      title="বিক্রয়"
      partyLabel="কাস্টমার"
      products={products}
      parties={customers}
      onBack={onBack}
      onNavigate={onNavigate}
      onFinalize={handleFinalizeSale}
    />
  );
}