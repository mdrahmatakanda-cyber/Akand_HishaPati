import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Search, ShoppingBag, CheckCircle2, 
  Printer, Share2, CreditCard, Banknote, Building2, Smartphone,
  Trash2, Plus, ChevronRight, Image as ImageIcon, ScanBarcode, X, Tag, Loader2, UserPlus, Truck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoDealers } from '../lib/demoData';

interface PurchaseProps {
  onBack: () => void;
}

export default function PurchasePage({ onBack }: PurchaseProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [batch, setBatch] = useState('');
  const [challan, setChallan] = useState('');
  
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState('');

  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [receiptId, setReceiptId] = useState('');
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '' });
  
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const [flyingItem, setFlyingItem] = useState<{ id: number, x: number, y: number } | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isScannerOpen) {
      html5QrCode = new Html5Qrcode("reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleBarcodeScanned(decodedText);
          html5QrCode?.stop();
          setIsScannerOpen(false);
        },
        () => { }
      ).catch(() => {
        alert("ক্যামেরা চালু করা যাচ্ছে না। পারমিশন চেক করুন।");
      });
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScannerOpen]);

  const fetchData = async () => {
    const bizId = activeBusiness?.id;
    if (!isDemoMode && !bizId) return;
    setIsDataLoading(true);

    try {
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({ ...p, category_name: p.category, company_name: p.company })));
        setSuppliers(demoDealers);
      } else {
        const [prodRes, supRes] = await Promise.all([
          supabase.from('products').select('*, categories(name), companies(name)').eq('business_id', bizId),
          supabase.from('suppliers').select('*').eq('business_id', bizId)
        ]);

        if (prodRes.data) {
          setProducts(prodRes.data.map((p: any) => ({
            ...p,
            purchasePrice: p.purchase_price,
            salePrice: p.sale_price,
            stock: p.stock_quantity,
            category: p.categories?.name || 'আনক্যাটাগরি',
            company: p.companies?.name || 'আননোন'
          })));
        }
        if (supRes.data) setSuppliers(supRes.data);
      }
    } catch (error) {
      console.error("Error fetching purchase data:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchSearch = prod.name.includes(searchQuery);
      return matchSearch;
    });
  }, [searchQuery, products]);

  const handleBarcodeScanned = (barcode: string) => {
    const scannedProduct = products.find(p => p.id.toString() === barcode) || products[0]; 
    if (scannedProduct) {
      addToCart(scannedProduct);
      alert(`"${scannedProduct.name}" স্ক্যান হয়েছে এবং কার্টে যুক্ত হয়েছে!`);
    }
  };

  const addToCart = (product: any, e?: React.MouseEvent) => {
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setFlyingItem({ id: product.id, x: rect.left, y: rect.top });
      setTimeout(() => setFlyingItem(null), 800);
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.purchasePrice }]);
    }
  };

  const removeFromCart = (id: number) => setCart(cart.filter(item => item.id !== id));
  
  const updateQty = (id: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const updateRate = (id: number, newRate: number) => {
    if (newRate < 0) return;
    setCart(cart.map(item => item.id === id ? { ...item, rate: newRate } : item));
  };

  const subTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const discountVal = hasDiscount ? (Number(discountAmount) || 0) : 0;
  const deliveryVal = hasDelivery ? (Number(deliveryCharge) || 0) : 0;
  const finalTotal = subTotal - discountVal + deliveryVal;
  const dueAmount = finalTotal - (Number(paidAmount) || 0);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) return alert('সাপ্লায়ারের নাম দিন');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newSup = { id: Date.now().toString(), name: newSupplier.name, phone: newSupplier.phone };
        setSuppliers([...suppliers, newSup]);
        setSupplier(newSup.id);
      } else {
        const { data, error } = await supabase.from('suppliers').insert([{
          business_id: activeBusiness?.id,
          name: newSupplier.name,
          phone: newSupplier.phone
        }]).select().single();
        if (error) throw error;
        setSuppliers([...suppliers, data]);
        setSupplier(data.id);
      }
      setIsSupplierModalOpen(false);
      setNewSupplier({ name: '', phone: '' });
    } catch (error: any) {
      alert("সাপ্লায়ার যোগ করতে সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!isDemoMode) {
      if (!activeBusiness?.id) return alert('বিজনেস সিলেক্ট করা নেই!');
      if (!supplier) return alert('সাপ্লায়ার সিলেক্ট করুন!');
    }
    
    setIsSaving(true);
    try {
      let uploadedReceiptUrl = '';

      if (receiptImage && !isDemoMode) {
        const fileExt = receiptImage.name.split('.').pop();
        const fileName = `receipt-${activeBusiness?.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, receiptImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        uploadedReceiptUrl = urlData.publicUrl;
      }

      if (isDemoMode) {
        setReceiptId('DEMO-' + Math.floor(Math.random() * 100000));
        setStep(4);
      } else {
        const itemsJson = cart.map(item => ({
          product_id: item.id, quantity: item.qty, rate: item.rate, total: item.qty * item.rate
        }));

        const { data, error } = await supabase.rpc('create_purchase', {
          p_business_id: activeBusiness?.id,
          p_supplier_id: supplier,
          p_challan_no: challan,
          p_batch_no: batch,
          p_total_amount: finalTotal,
          p_discount: discountVal,
          p_delivery_charge: deliveryVal,
          p_paid_amount: Number(paidAmount) || 0,
          p_due_amount: dueAmount,
          p_payment_method: paymentMethod === 'due' ? 'cash' : paymentMethod,
          p_note: remarks,
          p_receipt_image_url: uploadedReceiptUrl,
          p_items: itemsJson
        });

        if (error) throw error;
        setReceiptId(data);
        setStep(4);
      }
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-base">
            {step === 1 && "ক্রয় - পণ্য নির্বাচন"}
            {step === 2 && "ক্রয় - কার্ট"}
            {step === 3 && "ক্রয় - পেমেন্ট"}
            {step === 4 && "ক্রয় - রিসিপ্ট"}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 scrollbar-hide">
        
        {step === 1 && (
          <>
            <div className="flex gap-2 shrink-0">
              <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="পণ্য খোজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="bg-white border border-gray-300 rounded-lg px-2 shadow-sm text-[#1E88E5] active:scale-90 transition flex items-center justify-center">
                <ScanBarcode size={22} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              {isDataLoading ? (
                <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32}/></div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-5">কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                filteredProducts.map(prod => (
                  <div key={prod.id} className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0 overflow-hidden border border-gray-200">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-[#0F2A3D] truncate">{prod.name}</h3>
                          <span className="text-[8px] bg-[#E8F5E9] text-[#0B5C47] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">{prod.category}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span>স্টক: {toBangla(prod.stock)}</span>
                          <span className="text-[#1B5E20]">ক্রয়: ৳{toBangla(prod.purchasePrice)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => addToCart(prod, e)} className="w-8 h-8 bg-white border border-[#1E88E5] text-[#1E88E5] rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition shrink-0 z-10">
                      <Plus size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">ব্যাচ</label>
                <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="ব্যাচ" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">চালান নং</label>
                <input type="text" value={challan} onChange={e => setChallan(e.target.value)} placeholder="চালান নং" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
              <div className="grid grid-cols-12 bg-gray-50 p-2 text-[11px] font-bold text-gray-600 border-b">
                <div className="col-span-5">পণ্য</div>
                <div className="col-span-2 text-center">পরিমাণ</div>
                <div className="col-span-2 text-center">দর</div>
                <div className="col-span-3 text-right">মোট</div>
              </div>
              {cart.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">কার্ট খালি আছে</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-2 items-center border-b last:border-0 text-xs">
                    <div className="col-span-5 font-bold flex flex-col">
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border rounded bg-gray-50 py-1 text-xs" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, parseInt(e.target.value))} className="w-12 text-center border rounded bg-white py-1 text-xs font-bold text-[#1E88E5]" />
                    </div>
                    <div className="col-span-3 text-right font-bold flex items-center justify-end gap-1">
                       ৳{toBangla(item.qty * item.rate)}
                       <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-1"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 flex flex-col gap-2 text-sm shrink-0">
              <div className="flex justify-between font-bold text-base">
                <span>সাব টোটাল</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                  <span className="font-bold text-gray-700 text-xs flex items-center gap-1">ডিসকাউন্ট <Tag size={12}/></span>
                  <button className={`w-9 h-5 rounded-full relative transition-colors ${hasDiscount ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDiscount ? 'left-4.5' : 'left-0.5'}`}></div></button>
                </div>
                {hasDiscount && (
                  <input type="number" placeholder="ডিসকাউন্ট পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                )}

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                  <span className="font-bold text-gray-700 text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                  <button className={`w-9 h-5 rounded-full relative transition-colors ${hasDelivery ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDelivery ? 'left-4.5' : 'left-0.5'}`}></div></button>
                </div>
                {hasDelivery && (
                  <input type="number" placeholder="ডেলিভারি চার্জ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                )}
              </div>

              <div className="flex justify-between font-black text-lg text-[#1E88E5] mt-1 border-t pt-2">
                <span>সর্বমোট</span>
                <span>৳ {toBangla(finalTotal)}</span>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="text-center py-2 shrink-0">
              <span className="text-xs text-gray-500 font-bold">মোট প্রদেয়</span>
              <h2 className="text-3xl font-black text-[#1E88E5]">৳ {toBangla(finalTotal)}</h2>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
               <label className="text-xs font-bold text-[#1E88E5]">ক্যাশ দিয়েছি</label>
               <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] font-bold text-lg shadow-sm" placeholder={finalTotal.toString()} />
               {Number(paidAmount) > 0 && (
                 <p className="text-xs font-bold text-red-500 text-right mt-1">বাকি থাকবে: ৳ {toBangla(dueAmount)}</p>
               )}
            </div>

            <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 flex flex-col gap-2.5 shrink-0">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-gray-700 block">সাপ্লায়ার</label>
                  <button onClick={() => setIsSupplierModalOpen(true)} className="text-[10px] font-bold text-[#0B5C47] flex items-center gap-1 bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#A5D6A7]"><UserPlus size={12}/> নতুন</button>
                </div>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white text-sm">
                  <option value="">--সিলেক্ট--</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => receiptInputRef.current?.click()} className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 overflow-hidden relative">
                  {receiptImage ? <span className="text-[#0B5C47] truncate w-full">{receiptImage.name}</span> : <><ImageIcon size={16}/> রিসিপ্টের ছবি</>}
                </button>
                <input type="file" ref={receiptInputRef} onChange={(e) => setReceiptImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-gray-700 outline-none" />
              </div>
            </div>

            <div className="bg-gray-200 p-2.5 rounded-xl border border-gray-300 flex justify-between items-center shrink-0 opacity-70">
               <div className="flex items-center gap-2">
                 <div className="bg-white p-1 rounded border"><Smartphone size={16} className="text-gray-400"/></div>
                 <span className="text-sm font-bold text-gray-500">এস এম এস এ রিসিপ্ট পাঠান</span>
               </div>
               <div className="text-[10px] font-bold text-gray-500 bg-gray-300 px-2 py-0.5 rounded">আপাতত বন্ধ</div>
            </div>

            <div className="shrink-0">
              <h3 className="font-bold text-sm mb-1">মূল্য পরিশোধ পদ্ধতি</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <PaymentMethod id="cash" label="নগদ" icon={Banknote} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="due" label="বাকি" icon={CreditCard} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bkash" label="বিকাশ" icon={Smartphone} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bank" label="ব্যাংক" icon={Building2} selected={paymentMethod} setSelected={setPaymentMethod} />
              </div>
            </div>

            <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="মন্তব্য লিখুন" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] text-sm shrink-0" />
          </>
        )}

        {step === 4 && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 font-mono text-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-[#0B5C47]"></div>
             <div className="text-center mt-2 mb-4">
               <h2 className="text-xl font-bold text-[#0B5C47]">DREAM AGRO</h2>
               <p className="text-xs text-gray-500">& FISHERIES</p>
               <p className="text-[11px] mt-2 font-bold">রিসিপ্ট # {receiptId.substring(0, 8).toUpperCase()}</p>
               <p className="text-[11px]">{new Date(purchaseDate).toLocaleDateString('bn-BD')}</p>
             </div>
             <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5">
                    <span className="w-1/2 truncate">{i+1}. {item.name}</span>
                    <span className="w-1/6 text-center">{toBangla(item.rate)} ৳</span>
                    <span className="w-1/6 text-center">{toBangla(item.qty)}</span>
                    <span className="w-1/6 text-right">{toBangla(item.qty * item.rate)} ৳</span>
                  </div>
                ))}
             </div>
             <div className="flex flex-col gap-1 text-[11px] text-right pr-2">
                {hasDiscount && <div className="flex justify-between"><span>ডিসকাউন্ট:</span> <span>-{toBangla(discountVal)} ৳</span></div>}
                {hasDelivery && <div className="flex justify-between"><span>ডেলিভারি:</span> <span>+{toBangla(deliveryVal)} ৳</span></div>}
                <div className="flex justify-between font-bold text-sm text-[#1E88E5] border-t border-dashed pt-1 mt-1"><span>সর্বমোট প্রদেয়:</span> <span>{toBangla(finalTotal)} ৳</span></div>
             </div>
             <div className="text-center mt-6 text-[10px] text-gray-400">Powered by: Hishabpati ERP</div>
             <div className="flex justify-center gap-8 mt-5">
               <button className="flex flex-col items-center gap-1 text-gray-700"><Printer size={26}/><span className="text-[11px] font-bold">প্রিন্ট</span></button>
               <button className="flex flex-col items-center gap-1 text-gray-700"><Share2 size={26}/><span className="text-[11px] font-bold">শেয়ার</span></button>
             </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-[#1E88E5] text-white p-2 rounded-xl shadow-md">
             <div className="flex items-center gap-2 font-bold text-sm pl-1"><ShoppingBag size={18} /> পণ্য: {toBangla(cart.reduce((a,c)=>a+c.qty,0))}</div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#1E88E5] px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">পণ্য কিনুন <ChevronRight size={18}/></button>
           </div>
         )}
         {step === 2 && <button onClick={() => setStep(3)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">এগিয়ে যান <ChevronRight size={18}/></button>}
         {step === 3 && (
           <button onClick={handleConfirmPurchase} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             {isSaving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} পেমেন্ট কনফার্ম করুন
           </button>
         )}
         {step === 4 && <button onClick={onBack} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md">সম্পন্ন করুন</button>}
      </div>

      {flyingItem && (
        <div className="fixed z-[999] w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center text-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.6)] border-2 border-amber-400 pointer-events-none" style={{ left: flyingItem.x - 24, top: flyingItem.y - 24, animation: 'flyToCart 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <ShoppingBag size={24} />
          <style>{`@keyframes flyToCart { 0% { transform: scale(1) translateY(0); opacity: 1; } 50% { transform: scale(1.5) translateY(-30px); opacity: 1; } 100% { transform: scale(0) translateY(250px); opacity: 0; } }`}</style>
        </div>
      )}

      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><UserPlus size={16}/> নতুন সাপ্লায়ার</h2>
              <button onClick={() => setIsSupplierModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নাম <span className="text-red-500">*</span></label>
                <input type="text" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">মোবাইল</label>
                <input type="text" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsSupplierModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddSupplier} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-white mb-4">
              <h2 className="font-bold text-lg">বারকোড স্ক্যানার</h2>
              <button onClick={() => setIsScannerOpen(false)} className="p-1.5 bg-white/20 rounded-full"><X size={20}/></button>
            </div>
            <div id="reader" className="w-full aspect-square max-w-[280px] bg-black rounded-3xl border-2 border-gray-700 overflow-hidden shadow-2xl relative"></div>
            <p className="text-white/80 text-sm mt-6 text-center">বারকোডটি ফ্রেমের মধ্যে রাখুন</p>
          </div>
        </div>
      )}

    </div>
  );
}

function PaymentMethod({ id, label, icon: Icon, selected, setSelected }: any) {
  return (
    <button 
      onClick={() => setSelected(id)}
      className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selected === id ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={18} className={selected === id ? 'text-[#1E88E5]' : 'text-gray-500'} />
        <span className={`text-sm font-bold ${selected === id ? 'text-[#1E88E5]' : 'text-gray-700'}`}>{label}</span>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected === id ? 'border-[#1E88E5]' : 'border-gray-400'}`}>
        {selected === id && <div className="w-2 h-2 bg-[#1E88E5] rounded-full"></div>}
      </div>
    </button>
  );
}