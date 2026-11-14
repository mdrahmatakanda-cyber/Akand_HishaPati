import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, ShoppingBag, CheckCircle2, 
  CreditCard, Banknote, Building2, Smartphone,
  Trash2, ChevronRight, Tag, Loader2, Truck, AlertTriangle
} from 'lucide-react';
import { toBangla, numberToWordsBn } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoCompaniesList, demoReceiptDefaults } from '../../lib/demoData';
import { ReceiptModal, type ReceiptData } from '../ReceiptModal';

interface Props {
  onBack: () => void;
}

export default function DepotStockInPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, user } = useAuth();

  const preparedByName = user?.user_metadata?.name || user?.email || 'ইউজার';

  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState('');

  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [remarks, setRemarks] = useState('');
  
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [flyingItems, setFlyingItems] = useState<{ id: string, x: number, y: number, qty: number }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({ 
          ...p, 
          id: p.id.toString(),
          stock_quantity: p.stock,
          purchase_price: p.purchasePrice,
          category: p.category,
          company: p.company
        })));
        setCompanies(demoCompaniesList || []);
      } else {
        if (!activeBusiness?.id) return;

        const [prodRes, compRes] = await Promise.all([
          supabase.from('products').select('*, categories(name), companies(name)').eq('business_id', activeBusiness.id),
          supabase.from('companies').select('*').eq('business_id', activeBusiness.id)
        ]);

        if (prodRes.data) {
          setProducts(prodRes.data.map((p: any) => ({
            ...p,
            stock_quantity: Number(p.stock_quantity),
            purchase_price: Number(p.purchase_price),
            category: p.categories?.name || 'আনক্যাটাগরি',
            company: p.companies?.name || 'আননোন'
          })));
        }
        if (compRes.data) setCompanies(compRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredProducts = useMemo(() => {
    return products.filter(prod => prod.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const addToCart = (product: any, e?: React.MouseEvent) => {
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.qty : 0;

    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newItem = { 
        id: Math.random().toString(), 
        productId: product.id, 
        x: rect.left + rect.width/2, 
        y: rect.top + rect.height/2, 
        qty: currentQty + 1 
      };
      setFlyingItems(prev => [...prev, newItem]);
      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
      }, 800);
    }

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.purchase_price }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  
  const updateQty = (id: string, newQty: any) => { 
    const val = newQty === '' ? '' : Number(newQty);
    setCart(cart.map(item => item.id === id ? { ...item, qty: val } : item)); 
  };
  
  const updateRate = (id: string, newRate: any) => {
    const val = newRate === '' ? '' : Number(newRate);
    setCart(cart.map(item => item.id === id ? { ...item, rate: val } : item));
  };

  const subTotal = cart.reduce((acc, item) => acc + ((Number(item.qty) || 0) * (Number(item.rate) || 0)), 0);
  const discountVal = hasDiscount ? (Number(discountAmount) || 0) : 0;
  const deliveryVal = hasDelivery ? (Number(deliveryCharge) || 0) : 0;
  const finalTotal = subTotal - discountVal + deliveryVal;
  const dueAmount = finalTotal - (Number(paidAmount) || 0);

  const resetForm = () => {
    setCart([]);
    setSelectedCompany(null);
    setPaidAmount('');
    setDiscountAmount('');
    setDeliveryCharge('');
    setRemarks('');
    setStep(1);
  };

  const handleProceedToReceipt = () => {
    if (!isDemoMode) {
      if (!activeBusiness?.id) return showToast('বিজনেস সিলেক্ট করা নেই!', 'error');
      if (!selectedCompany) return showToast('কোম্পানি সিলেক্ট করুন!', 'error');
    }

    const today = new Date();
    const dateStr = today.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    let prefix = 'STK-';
    if (activeBusiness?.id) {
      const saved = localStorage.getItem(`receipt_settings_${activeBusiness.id}`);
      if (saved) prefix = JSON.parse(saved).invoicePrefix || 'STK-';
    }
    const generatedInvoiceNo = prefix + Math.floor(Math.random() * 100000);

    const newReceiptData: ReceiptData = {
      invoiceNo: isDemoMode ? 'STK-' + Math.floor(Math.random() * 10000) : generatedInvoiceNo,
      date: dateStr,
      status: dueAmount > 0 ? 'Due' : 'Paid',
      shopName: activeBusiness?.name || 'DREAM AGRO',
      shopAddress: (activeBusiness as any)?.address || '',
      shopPhone: (activeBusiness as any)?.phone || '',
      shopEmail: (activeBusiness as any)?.email || '',
      shopLogoUrl: activeBusiness?.logo_url,
      customerName: selectedCompany?.name || 'সাধারণ কোম্পানি',
      proprietor: 'N/A',
      customerPhone: 'N/A',
      customerAddress: 'N/A',
      marketName: 'N/A',
      officerName: preparedByName,
      officerPhone: user?.user_metadata?.phone || 'N/A',
      officerEmail: user?.email || 'N/A',
      receiptTime: `${dateStr}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,

      vehicleNo: isDemoMode ? demoReceiptDefaults.vehicleNo : '',
      driverName: isDemoMode ? demoReceiptDefaults.driverName : '',
      driverPhone: isDemoMode ? demoReceiptDefaults.driverPhone : '',
      transportRent: deliveryVal,
      items: cart.map(item => ({
        id: item.id, name: item.name, category: item.category || 'সাধারণ পণ্য',
        quantity: Number(item.qty) || 0, unit: 'পিস', unitPrice: Number(item.rate) || 0, totalPrice: (Number(item.qty) || 0) * (Number(item.rate) || 0)
      })),
      totalBags: 0,
      totalPieces: cart.reduce((acc, item) => acc + (Number(item.qty) || 0), 0),
      subtotal: subTotal,
      discount: discountVal,
      grandTotal: finalTotal,
      paidAmount: Number(paidAmount) || 0,
      dueAmount: Math.max(0, dueAmount),
      paidInWords: numberToWordsBn(Number(paidAmount) || 0),
      shopDescription: 'স্টক ইন চালান (পারচেজ)',
      tableNote: 'ডেলিভারির সময় পণ্যের বস্তা ও ওজন সঠিকভাবে বুঝে নেওয়া হলো।',
      footerText1: isDemoMode ? demoReceiptDefaults.footerText1 : 'ধন্যবাদ!',
      footerText2: isDemoMode ? demoReceiptDefaults.footerText2 : 'Powered by Hishabpati',
      note: remarks || (isDemoMode ? demoReceiptDefaults.defaultNote : ''),
    };

    setReceiptData(newReceiptData);
    setIsReceiptOpen(true);
  };

  const handleFinalizeStockIn = async () => {
    setIsSaving(true);
    try {
      if (!isDemoMode) {
        const itemsJson = cart.map(item => ({ 
          product_id: item.id, quantity: Number(item.qty) || 0, rate: Number(item.rate) || 0, total: (Number(item.qty) || 0) * (Number(item.rate) || 0) 
        }));

        const { error } = await supabase.rpc('create_purchase', {
          p_business_id: activeBusiness?.id,
          p_company_id: selectedCompany.id,
          p_supplier_id: null,
          p_challan_no: '',
          p_batch_no: '',
          p_total_amount: finalTotal,
          p_discount: discountVal,
          p_delivery_charge: deliveryVal,
          p_paid_amount: Number(paidAmount) || 0,
          p_due_amount: dueAmount > 0 ? dueAmount : 0,
          p_payment_method: paymentMethod === 'due' ? 'cash' : paymentMethod,
          p_note: remarks,
          p_receipt_image_url: '',
          p_items: itemsJson
        });

        if (error) throw error;
      }
      showToast('স্টক ইন সফলভাবে সম্পন্ন হয়েছে!', 'success');
      setIsReceiptOpen(false);
      resetForm();
      onBack();
    } catch (error: any) {
      showToast("সমস্যা: " + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {toast.show && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[999] w-[280px] px-5 py-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2 animate-in slide-in-from-top-8 fade-in duration-300 border border-white/20 ${toast.type === 'success' ? 'bg-da-greenDeep' : 'bg-da-red'} text-white`}>
          <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shadow-inner">
            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <span className="text-sm font-bold text-center leading-snug">{toast.message}</span>
        </div>
      )}

      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40 print:hidden">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-base">
            {step === 1 && "স্টক ইন - পণ্য নির্বাচন"}
            {step === 2 && "স্টক ইন - কার্ট"}
            {step === 3 && "স্টক ইন - পেমেন্ট"}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 print:p-0 print:overflow-visible">
        
        {step === 1 && (
          <>
            <div className="bg-white border border-da-cardBorder rounded-xl p-2.5 shadow-sm shrink-0">
              <label className="text-[11px] font-bold text-da-textMuted block mb-1">কোম্পানি সিলেক্ট করুন</label>
              <select 
                value={selectedCompany?.id || ''} 
                onChange={e => setSelectedCompany(companies.find(c => c.id === e.target.value))}
                className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-da-depotBg"
              >
                <option value="">-- কোম্পানি সিলেক্ট করুন --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex gap-1.5 shrink-0">
              <div className="flex-1 bg-white border border-da-cardBorder rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                <Search size={14} className="text-da-textMuted" />
                <input type="text" placeholder="পণ্য খোজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {isDataLoading ? (
                <div className="col-span-2 flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center text-da-textMuted text-sm mt-10">কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                filteredProducts.map(prod => {
                  const cartItem = cart.find(c => c.id === prod.id);
                  return (
                    <div 
                      key={prod.id} 
                      onClick={(e) => addToCart(prod, e)} 
                      className="relative bg-white p-1.5 rounded-lg border border-da-cardBorder shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.97] transition-transform h-[68px]"
                    >
                      {cartItem && (
                        <div className="absolute -top-1.5 -right-1.5 bg-da-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md z-10 border-2 border-white">
                          {toBangla(cartItem.qty)}
                        </div>
                      )}
                      <div className="w-12 h-12 bg-da-depotBg rounded flex items-center justify-center text-da-textMuted shrink-0 overflow-hidden border border-da-cardBorder">
                        {prod.image_url ? <img src={prod.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={20} />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                          <h3 className="font-bold text-[11px] text-da-textDark line-clamp-2 leading-tight">{prod.name}</h3>
                          <span className="text-[8px] font-bold text-da-teal truncate block mt-0.5">{prod.category}</span>
                        </div>
                        <div className="flex justify-between items-end mt-0.5">
                          <span className="text-[9px] text-da-textMuted font-bold">স্টক: {toBangla(prod.stock_quantity)}</span>
                          <span className="text-[11px] font-black text-da-depotBlue">৳{toBangla(prod.purchase_price)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm overflow-hidden mt-1 shrink-0">
              <div className="bg-da-innerBg py-1.5 px-2 text-[11px] font-bold text-da-depotBlue text-center border-b border-da-cardBorder">
                আইটেম {toBangla(cart.length)}টি | মোট পণ্য {toBangla(cart.reduce((acc, item) => acc + (Number(item.qty) || 0), 0))}টি
              </div>
              
              <div className="grid grid-cols-[1fr_55px_65px_75px] gap-1 bg-da-depotNavy p-2 text-[11px] font-bold text-white text-center items-center">
                <div className="text-left pl-1">পণ্য</div>
                <div>পরিমাণ</div>
                <div>দর</div>
                <div className="text-right pr-1">মোট</div>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-4 text-center text-sm text-da-textMuted">কার্ট খালি আছে</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="border-b border-da-cardBorder last:border-0 px-2 py-1.5">
                    <div className="grid grid-cols-[1fr_55px_65px_75px] gap-1 items-center w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button onClick={() => removeFromCart(item.id)} className="text-da-red p-1 bg-red-50 rounded active:scale-90 transition shrink-0">
                          <Trash2 size={14}/>
                        </button>
                        <p className="text-[11px] font-bold text-da-textDark truncate">{item.name}</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => updateQty(item.id, e.target.value)} 
                          className="w-full max-w-[45px] text-center border border-da-cardBorder rounded bg-white py-1 text-[11px] font-bold focus:border-da-depotBlue outline-none" 
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => updateRate(item.id, e.target.value)} 
                          className="w-full max-w-[55px] text-center border border-da-cardBorder rounded bg-white py-1 text-[11px] font-bold text-da-depotBlue focus:border-da-depotBlue outline-none" 
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="text-right pr-1 font-bold text-xs text-da-textDark shrink-0">
                        ৳ {toBangla((Number(item.qty) || 0) * (Number(item.rate) || 0))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 flex flex-col gap-2 text-sm shrink-0">
              <div className="flex justify-between font-bold text-base text-da-textDark">
                <span>সাব টোটাল</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-da-depotBg p-2 rounded-lg border border-da-cardBorder cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                  <span className="font-bold text-da-textDark text-xs flex items-center gap-1">ডিসকাউন্ট <Tag size={12}/></span>
                  <button className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${hasDiscount ? 'bg-da-depotBlue' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm transform ${hasDiscount ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                {hasDiscount && <input type="number" placeholder="ডিসকাউন্ট পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />}
                
                <div className="flex justify-between items-center bg-da-depotBg p-2 rounded-lg border border-da-cardBorder cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                  <span className="font-bold text-da-textDark text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                  <button className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${hasDelivery ? 'bg-da-depotBlue' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm transform ${hasDelivery ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                {hasDelivery && <input type="number" placeholder="ডেলিভারি চার্জ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />}
              </div>
              <div className="flex justify-between font-black text-lg text-da-depotBlue mt-1 border-t border-da-cardBorder pt-2">
                <span>সর্বমোট</span>
                <span>৳ {toBangla(finalTotal)}</span>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-da-depotNavy text-white rounded-xl p-3 flex justify-between items-center shadow-blue-soft shrink-0">
              <span className="font-bold text-sm">সর্বমোট</span>
              <span className="font-black text-xl">{toBangla(finalTotal)}</span>
            </div>

            <div className="flex flex-col gap-1 mt-1 shrink-0">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-da-depotBlue">ক্যাশ দিয়েছি</label>
                 <div className="flex gap-1.5">
                   <button onClick={() => setPaidAmount(finalTotal.toString())} className="text-[10px] font-bold bg-da-green/10 text-da-green px-2 py-1 rounded border border-da-green/30">পুরো টাকা</button>
                   <button onClick={() => setPaidAmount('0')} className="text-[10px] font-bold bg-da-red/10 text-da-red px-2 py-1 rounded border border-da-red/30">সম্পূর্ণ বাকি</button>
                 </div>
               </div>
               <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2.5 outline-none focus:border-da-depotBlue font-bold text-lg shadow-sm mt-1" placeholder="0" />
            </div>

            <div className="flex items-center justify-between px-1 mb-2 shrink-0">
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-da-textDark">ফেরত দিবেন</span>
                 <span className="text-da-depotBlue font-black text-lg">{toBangla(Math.max(0, (parseInt(paidAmount) || 0) - finalTotal))}</span>
               </div>
               {dueAmount > 0 && <span className="text-da-red font-bold text-sm">বাকি থাকবে: ৳ {toBangla(dueAmount)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'cash' ? 'border-da-depotBlue bg-da-depotBlue/10' : 'border-da-cardBorder bg-white'}`}><Banknote size={18} className={paymentMethod === 'cash' ? 'text-da-depotBlue' : 'text-da-textMuted'}/><span className="text-xs font-bold text-da-textDark">নগদ</span></button>
              <button onClick={() => setPaymentMethod('due')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'due' ? 'border-da-depotBlue bg-da-depotBlue/10' : 'border-da-cardBorder bg-white'}`}><CreditCard size={18} className={paymentMethod === 'due' ? 'text-da-depotBlue' : 'text-da-textMuted'}/><span className="text-xs font-bold text-da-textDark">বাকি</span></button>
              <button onClick={() => setPaymentMethod('bkash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bkash' ? 'border-da-depotBlue bg-da-depotBlue/10' : 'border-da-cardBorder bg-white'}`}><Smartphone size={18} className={paymentMethod === 'bkash' ? 'text-da-depotBlue' : 'text-da-textMuted'}/><span className="text-xs font-bold text-da-textDark">বিকাশ</span></button>
              <button onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bank' ? 'border-da-depotBlue bg-da-depotBlue/10' : 'border-da-cardBorder bg-white'}`}><Building2 size={18} className={paymentMethod === 'bank' ? 'text-da-depotBlue' : 'text-da-textMuted'}/><span className="text-xs font-bold text-da-textDark">ব্যাংক</span></button>
            </div>
            
            <div className="shrink-0 mt-2">
              <label className="text-xs font-bold text-da-textDark mb-1 block">মন্তব্য লিখুন</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 outline-none focus:border-da-depotBlue min-h-[50px] text-sm shadow-sm" />
            </div>
          </>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50 print:hidden">
         {step === 1 && (
           <div className="flex justify-between items-center bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-2xl shadow-lg border border-white/10">
             <div className="flex flex-col">
               <span className="text-[10px] text-white/80 font-bold mb-0.5">সর্বমোট মূল্য</span>
               <span className="font-black text-xl">৳ {toBangla(finalTotal)}</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <p className="text-[11px] font-bold text-amber-200">আইটেম: {toBangla(cart.length)} টি</p>
                 <p className="text-[11px] font-bold text-amber-200">মোট পণ্য: {toBangla(cart.reduce((acc, item) => acc + (Number(item.qty) || 0), 0))} টি</p>
               </div>
               <button onClick={() => setStep(2)} disabled={cart.length === 0 || !selectedCompany} className="bg-white text-da-depotBlue px-5 py-2.5 rounded-xl font-black shadow-md flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform">
                 <ChevronRight size={20}/>
               </button>
             </div>
           </div>
         )}

         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">এগিয়ে যান</button>
         )}

         {step === 3 && (
           <button onClick={handleProceedToReceipt} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">
             <CheckCircle2 size={18}/> পেমেন্ট কনফার্ম করুন
           </button>
         )}
      </div>

      {flyingItems.map(item => (
        <div key={item.id} className="fixed z-[999] w-8 h-8 bg-da-depotBlue text-white rounded-full flex items-center justify-center font-bold text-sm shadow-[0_0_20px_rgba(30,136,229,0.6)] border-2 border-white pointer-events-none" style={{ left: item.x - 16, top: item.y - 16, animation: 'floatUp 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          {item.qty}
          <style>{`@keyframes floatUp { 0% { transform: scale(0.5) translateY(0); opacity: 0; } 30% { transform: scale(1.2) translateY(-20px); opacity: 1; } 100% { transform: scale(1) translateY(-60px); opacity: 0; } }`}</style>
        </div>
      ))}

      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        onCancel={() => {
          setIsReceiptOpen(false);
          resetForm();
        }}
        onFinalize={handleFinalizeStockIn}
        isSaving={isSaving}
        data={receiptData} 
      />

    </div>
  );
}