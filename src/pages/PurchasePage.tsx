import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import TransactionEngine from '../components/TransactionEngine';
import type { EngineProduct, EngineParty } from '../components/TransactionEngine';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoSuppliers } from '../lib/demoData'; // demoSuppliers ইম্পোর্ট করা হলো

interface PurchaseProps {
  onBack: () => void;
}

export default function PurchasePage({ onBack }: PurchaseProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [products, setProducts] = useState<EngineProduct[]>([]);
  const [suppliers, setSuppliers] = useState<EngineParty[]>([]);

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
            rate: p.purchasePrice || p.salePrice,
            unit: 'পিস',
            image_url: p.image_url
          })));
          setSuppliers(demoSuppliers);
        } else {
          const [prodRes, supRes] = await Promise.all([
            supabase.from('products').select('*, categories(name), companies(name)').eq('business_id', bizId),
            supabase.from('suppliers').select('*').eq('business_id', bizId)
          ]);

          if (prodRes.data) {
            setProducts(prodRes.data.map((p: any) => ({
              id: p.id, 
              name: p.name, 
              category: p.categories?.name || 'আনক্যাটাগরি', 
              company: p.companies?.name || 'আননোন',
              stockQty: p.stock_quantity,
              rate: p.purchase_price,
              unit: p.unit || 'পিস',
              image_url: p.image_url
            })));
          }
          if (supRes.data) {
            setSuppliers(supRes.data.map(s => ({
              id: s.id,
              name: s.name,
              phone: s.phone || 'N/A',
              address: s.address || 'N/A'
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const handleFinalizePurchase = async (data: any) => {
    if (!isDemoMode) {
      let uploadedReceiptUrl = '';
      
           if (data.receiptImage) {
        const fileExt = data.receiptImage.name.split('.').pop();
        const fileName = `receipt-${activeBusiness?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, data.receiptImage);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          uploadedReceiptUrl = urlData.publicUrl; // এখানে urlData.publicUrl হবে
        }
      }
      const itemsJson = data.cart.map((item: any) => ({ 
        product_id: item.id, 
        quantity: Number(item.quantity) || 0, 
        rate: Number(item.rate) || 0, 
        total: (Number(item.quantity) || 0) * (Number(item.rate) || 0) 
      }));

      const { error } = await supabase.rpc('create_purchase', {
        p_business_id: activeBusiness?.id,
        p_supplier_id: data.partyId,
        p_challan_no: data.challan,
        p_batch_no: data.batch,
        p_total_amount: data.finalTotal,
        p_discount: data.discountVal,
        p_delivery_charge: data.deliveryVal,
        p_paid_amount: data.cashReceived,
        p_due_amount: data.dueAmount > 0 ? data.dueAmount : 0,
        p_payment_method: 'cash',
        p_note: data.remarks,
        p_receipt_image_url: uploadedReceiptUrl,
        p_items: itemsJson
      });

      if (error) {
        alert("সেভ করতে সমস্যা: " + error.message);
        throw error;
      }
    }
    
    alert('ক্রয় সফলভাবে সম্পন্ন হয়েছে!');
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
      mode="purchase"
      title="ক্রয়"
      partyLabel="সাপ্লায়ার"
      products={products}
      parties={suppliers}
      onBack={onBack}
      onFinalize={handleFinalizePurchase}
    />
  );
}