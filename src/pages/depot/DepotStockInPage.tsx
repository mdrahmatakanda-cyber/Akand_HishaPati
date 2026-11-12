import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, ShoppingBag, CheckCircle2, 
  Printer, Share2, CreditCard, Banknote, Building2, Smartphone,
  Trash2, ChevronRight, Tag, Loader2, Truck, AlertTriangle
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoCompaniesList } from '../../lib/demoData';

interface Props {
  onBack: () => void;
}

export default function DepotStockInPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

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
  const [receiptId, setReceiptId] = useState('');
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

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
        setCompanies(demoCompaniesList);
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
    return products.filter(prod => {
      const matchSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [products, searchQuery]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.purchase_price }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  const updateQty = (id: string, newQty: number) => { if (newQty >= 1) setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item)); };
  const updateRate = (id: string, newRate: number) => { if (newRate >= 0) setCart(cart.map(item => item.id === id ? { ...item, rate: newRate } : item)); };

  const subTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const discountVal = hasDiscount ? (Number(discountAmount) || 0) : 0;
  const deliveryVal = hasDelivery ? (Number(deliveryCharge) || 0) : 0;
  const finalTotal = subTotal - discountVal + deliveryVal;
  const dueAmount = finalTotal - (Number(paidAmount) || 0);

  const handleConfirmStockIn = async () => {
    if (!isDemoMode) {
      if (!activeBusiness?.id) return showToast('বিজনেস সিলেক্ট করা নেই!', 'error');
      if (!selectedCompany) return showToast('কোম্পানি সিলেক্ট করুন!', 'error');
    }
    
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setReceiptId('STK-' + Math.floor(Math.random() * 100000));
        setStep(4);
      } else {
        const itemsJson = cart.map(item => ({ 
          product_id: item.id, 
          quantity: item.qty, 
          rate: item.rate, 
          total: item.qty * item.rate 
        }));

        const { data, error } = await supabase.rpc('create_purchase', {
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
        setReceiptId(data);
        setStep(4);
      }
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

      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-base">
            {step === 1 && "স্টক ইন - পণ্য নির্বাচন"}
            {step === 2 && "স্টক ইন - কার্ট"}
            {step === 3 && "স্টক ইন - পেমেন্ট"}
            {step === 4 && "স্টক ইন - রিসিপ্ট"}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ================= স্টেপ ১: প্রোডাক্ট লিস্ট ================= */}
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
                filteredProducts.map(prod => (
                  <div key={prod.id} onClick={() => addToCart(prod)} className="bg-white p-1.5 rounded-lg border border-da-cardBorder shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.97] transition-transform h-[68px]">
                    <div className="w-12 h-12 bg-da-depotBg rounded flex items-center justify-center text-da-textMuted shrink-0 overflow-hidden border border-da-cardBorder">
                      {prod.image_url ? <img src={prod.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={20} />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <h3 className="font-bold text-[11px] text-da-textDark line-clamp-2 leading-tight">{prod.name}</h3>
                        <div className="flex gap-1 mt-0.5 overflow-hidden">
                          <span className="text-[8px] font-bold text-da-teal truncate">{prod.category}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-0.5">
                        <span className="text-[9px] text-da-textMuted font-bold truncate">স্টক: {toBangla(prod.stock_quantity)}</span>
                        <span className="text-[11px] font-black text-da-depotBlue shrink-0">৳{toBangla(prod.purchase_price)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ================= স্টেপ ২: কার্ট ================= */}
        {step === 2 && (
          <>
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm overflow-hidden shrink-0">
              <div className="grid grid-cols-12 bg-da-depotBg p-2 text-[11px] font-bold text-da-textMuted border-b border-da-cardBorder">
                <div className="col-span-5">পণ্য</div>
                <div className="col-span-2 text-center">পরিমাণ</div>
                <div className="col-span-2 text-center">দর</div>
                <div className="col-span-3 text-right">মোট</div>
              </div>
              {cart.length === 0 ? (
                <div className="p-4 text-center text-sm text-da-textMuted">কার্ট খালি আছে</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-2 items-center border-b border-da-cardBorder last:border-0 text-xs">
                    <div className="col-span-5 font-bold flex flex-col">
                      <span className="truncate text-da-textDark">{item.name}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border border-da-cardBorder rounded bg-da-depotBg py-1 text-xs" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, parseInt(e.target.value))} className="w-12 text-center border border-da-cardBorder rounded bg-white py-1 text-xs font-bold text-da-depotBlue" />
                    </div>
                    <div className="col-span-3 text-right font-bold flex items-center justify-end gap-1 text-da-textDark">
                       ৳{toBangla(item.qty * item.rate)}
                       <button onClick={() => removeFromCart(item.id)} className="text-da-red ml-1"><Trash2 size={12}/></button>
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
                {hasDiscount && (
                  <input type="number" placeholder="ডিসকাউন্ট পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                )}

                <div className="flex justify-between items-center bg-da-depotBg p-2 rounded-lg border border-da-cardBorder cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                  <span className="font-bold text-da-textDark text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                  <button className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${hasDelivery ? 'bg-da-depotBlue' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm transform ${hasDelivery ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
                {hasDelivery && (
                  <input type="number" placeholder="ডেলিভারি চার্জ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                )}
              </div>

              <div className="flex justify-between font-black text-lg text-da-depotBlue mt-1 border-t border-da-cardBorder pt-2">
                <span>সর্বমোট</span>
                <span>৳ {toBangla(finalTotal)}</span>
              </div>
            </div>
          </>
        )}

        {/* ================= স্টেপ ৩: পেমেন্ট ================= */}
        {step === 3 && (
          <>
            <div className="text-center py-2 shrink-0">
              <span className="text-xs text-da-textMuted font-bold">মোট প্রদেয়</span>
              <h2 className="text-3xl font-black text-da-depotBlue">৳ {toBangla(finalTotal)}</h2>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-da-depotBlue">ক্যাশ দিয়েছি</label>
                 <div className="flex gap-1.5">
                   <button onClick={() => setPaidAmount(finalTotal.toString())} className="text-[10px] font-bold bg-da-green/10 text-da-green px-2 py-1 rounded border border-da-green/30 active:scale-95 transition">পুরো টাকা</button>
                   <button onClick={() => setPaidAmount('0')} className="text-[10px] font-bold bg-da-red/10 text-da-red px-2 py-1 rounded border border-da-red/30 active:scale-95 transition">সম্পূর্ণ বাকি</button>
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
              <button onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'cash' ? 'border-da-depotBlue bg-da-depotBlue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Banknote size={18} className={paymentMethod === 'cash' ? 'text-da-depotBlue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">নগদ</span>
              </button>
              <button onClick={() => setPaymentMethod('due')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'due' ? 'border-da-depotBlue bg-da-depotBlue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <CreditCard size={18} className={paymentMethod === 'due' ? 'text-da-depotBlue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">বাকি</span>
              </button>
              <button onClick={() => setPaymentMethod('bkash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bkash' ? 'border-da-depotBlue bg-da-depotBlue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Smartphone size={18} className={paymentMethod === 'bkash' ? 'text-da-depotBlue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">বিকাশ</span>
              </button>
              <button onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bank' ? 'border-da-depotBlue bg-da-depotBlue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Building2 size={18} className={paymentMethod === 'bank' ? 'text-da-depotBlue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">ব্যাংক</span>
              </button>
            </div>

            <div className="shrink-0 mt-2">
              <label className="text-xs font-bold text-da-textDark mb-1 block">মন্তব্য লিখুন</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 outline-none focus:border-da-depotBlue min-h-[50px] text-sm shadow-sm" />
            </div>
          </>
        )}

        {/* ================= স্টেপ ৪: রিসিপ্ট ================= */}
        {step === 4 && (
          <div id="printable-receipt" className="bg-white p-3 rounded-xl shadow-lg border border-da-cardBorder font-serif text-[11px] relative overflow-hidden w-full max-w-sm mx-auto">
             <div className="text-center mb-2">
               <h2 className="text-lg font-bold text-da-depotNavy">DREAM AGRO</h2>
               <p className="text-[10px] text-da-textMuted">স্টক ইন রিসিপ্ট</p>
             </div>

             <div className="flex justify-between items-center mb-2">
               <p className="font-bold text-da-textDark text-xs">রিসিপ্ট # {receiptId.substring(0, 14).toUpperCase()}</p>
               <p className="text-[10px] text-da-textMuted">{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
             </div>

             <div className="mb-2 leading-tight text-[10px] text-da-textDark">
               <div className="flex justify-between items-center">
                 <p className="truncate max-w-[55%]"><span className="font-bold">কোম্পানি:</span> {selectedCompany?.name || 'সাধারণ কোম্পানি'}</p>
               </div>
             </div>

             <div className="border-t border-b border-dashed border-da-textMuted py-1 mb-1">
                <div className="flex justify-between font-bold text-[10px] text-da-textDark mb-1">
                  <span className="w-1/2">পণ্যের নাম</span>
                  <span className="w-1/6 text-center">দাম</span>
                  <span className="w-1/6 text-center">পরিমাণ</span>
                  <span className="w-1/6 text-right">মোট দাম</span>
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-[10px] py-0.5 text-da-textDark">
                    <span className="w-1/2 truncate">{i+1}. {item.name}</span>
                    <span className="w-1/6 text-center">{toBangla(item.rate)} ৳</span>
                    <span className="w-1/6 text-center">{toBangla(item.qty)}</span>
                    <span className="w-1/6 text-right">{toBangla(item.qty * item.rate)} ৳</span>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-0.5 text-[10px] text-right pr-1 text-da-textDark">
                <div className="flex justify-between"><span className="text-da-textMuted">মোট:</span> <span>{toBangla(subTotal)} ৳</span></div>
                <div className="flex justify-between"><span className="text-da-textMuted">(-) ডিসকাউন্ট:</span> <span>{toBangla(discountVal)} ৳</span></div>
                <div className="flex justify-between"><span className="text-da-textMuted">ডেলিভারি চার্জ:</span> <span>{toBangla(deliveryVal)} ৳</span></div>
                <div className="flex justify-between font-bold text-xs text-da-depotNavy mt-1 pt-1 border-t border-dashed border-da-textMuted"><span>মোট প্রদেয়:</span> <span>{toBangla(finalTotal)} ৳</span></div>
                <div className="flex justify-between font-bold text-da-textDark"><span>দিয়েছি:</span> <span>{toBangla(Number(paidAmount) || 0)} ৳</span></div>
                <div className="flex justify-between font-bold text-da-textDark"><span>এই লেনদেনের বাকি:</span> <span>{toBangla(Math.max(0, dueAmount))} ৳</span></div>
             </div>

             <div className="mt-2 text-[10px] text-da-textDark">
               <p>মূল্যপরিশোধ পদ্ধতি: {paymentMethod === 'cash' ? 'নগদ টাকা' : paymentMethod === 'due' ? 'বাকি' : paymentMethod === 'bkash' ? 'বিকাশ/নগদ' : 'ব্যাংক চেক'}</p>
               {remarks && <p className="mt-0.5">নোট: {remarks}</p>}
             </div>

             <div className="text-center mt-3 text-[9px] text-da-textMuted">Powered by: Akand Smart Solutions</div>
             
             <div className="flex justify-center gap-6 mt-3 print:hidden">
               <button onClick={() => window.print()} className="flex flex-col items-center gap-1 text-da-textDark active:scale-95 transition">
                 <Printer size={20}/><span className="text-[10px] font-bold">রিসিপ্ট প্রিন্ট করুন</span>
               </button>
               <button className="flex flex-col items-center gap-1 text-da-textDark active:scale-95 transition">
                 <Share2 size={20}/><span className="text-[10px] font-bold">রিসিপ্ট শেয়ার করুন</span>
               </button>
             </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-da-depotBlue text-white p-2 rounded-xl shadow-blue-soft">
             <div className="flex items-center gap-2 font-bold text-sm pl-1">পণ্য: {toBangla(cart.reduce((a,c)=>a+c.qty,0))}</div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0 || !selectedCompany} className="bg-white text-da-depotBlue px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">
               পরবর্তী <ChevronRight size={18}/>
             </button>
           </div>
         )}
         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">এগিয়ে যান</button>
         )}
         {step === 3 && (
           <button onClick={handleConfirmStockIn} disabled={isSaving} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">
             {isSaving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} স্টক ইন কনফার্ম করুন
           </button>
         )}
         {step === 4 && (
           <button onClick={onBack} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft">সম্পন্ন করুন</button>
         )}
      </div>

    </div>
  );
}