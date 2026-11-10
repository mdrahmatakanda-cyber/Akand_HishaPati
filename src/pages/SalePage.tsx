import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, ShoppingBag, CheckCircle2, 
  Printer, Share2, Smartphone, 
  Plus, ChevronRight, HelpCircle, ScanBarcode, UserPlus, 
  Trash2, X, Check, Tag, Banknote, CreditCard, 
  Building2, Loader2, Truck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoCategories, demoCompanies, demoCustomers } from '../lib/demoData';

interface SaleProps {
  onBack: () => void;
}

interface Product {
  id: string; 
  name: string; 
  category_id: string; 
  company_id: string; 
  sale_price: number; 
  stock_quantity: number; 
  category: string; 
  company: string; 
  image_url?: string;
}

export default function SalePage({ onBack }: SaleProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব পণ্য');
  const [selectedCompany, setSelectedCompany] = useState('সব কোম্পানি');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'low' | 'high'>('default');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [categoryUsage, setCategoryUsage] = useState<Record<string, number>>({});

  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState('');
  
  const [cashReceived, setCashReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [receiptId, setReceiptId] = useState('');
  
  const [customerId, setCustomerId] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showEmployeeInfo, setShowEmployeeInfo] = useState(false);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [flyingItem, setFlyingItem] = useState<{ id: string, x: number, y: number } | null>(null);

  const fetchData = async () => {
    const bizId = activeBusiness?.id;
    if (!isDemoMode && !bizId) return;
    setIsDataLoading(true);

    try {
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({ 
          ...p, 
          id: p.id.toString(),
          category_id: p.category, 
          company_id: p.company, 
          sale_price: p.salePrice, 
          stock_quantity: p.stock 
        })));
        setAllCategories(demoCategories.map(c => c.name));
        setAllCompanies(demoCompanies.map(c => c.name));
        setCustomers(demoCustomers);
      } else {
        const [prodRes, catRes, compRes, custRes] = await Promise.all([
          supabase.from('products').select('*, categories(name), companies(name)').eq('business_id', bizId),
          supabase.from('categories').select('name').eq('business_id', bizId),
          supabase.from('companies').select('name').eq('business_id', bizId),
          supabase.from('customers').select('*').eq('business_id', bizId)
        ]);

        if (prodRes.data) {
          setProducts(prodRes.data.map((p: any) => ({
            ...p, 
            sale_price: p.sale_price, 
            stock_quantity: p.stock_quantity,
            category: p.categories?.name || 'আনক্যাটাগরি', 
            company: p.companies?.name || 'আননোন'
          })));
        }
        if (catRes.data) setAllCategories(catRes.data.map(c => c.name));
        if (compRes.data) setAllCompanies(compRes.data.map(c => c.name));
        if (custRes.data) setCustomers(custRes.data);
      }
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isDemoMode, activeBusiness?.id]);

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
        () => {}
      ).catch(() => setScannerError("ক্যামেরা চালু করা যাচ্ছে না।"));
    }
    return () => { 
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error); 
      }
    };
  }, [isScannerOpen]);

  const handleBarcodeScanned = (barcode: string) => {
    const scannedProduct = products.find(p => p.id.toString() === barcode); 
    if (scannedProduct) {
      addToCart(scannedProduct);
      alert(`"${scannedProduct.name}" স্ক্যান হয়েছে!`);
    } else {
      alert('পণ্য পাওয়া যায়নি।');
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'সব পণ্য') setCategoryUsage(prev => ({ ...prev, [cat]: (prev[cat] || 0) + 1 }));
  };

  const topThreeCategories = useMemo(() => {
    return [...allCategories]
      .sort((a, b) => (categoryUsage[b] || 0) - (categoryUsage[a] || 0))
      .slice(0, 3);
  }, [categoryUsage, allCategories]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(prod => {
      const matchSearch = prod.name.includes(searchQuery);
      const matchCategory = selectedCategory === 'সব পণ্য' || prod.category === selectedCategory;
      const matchCompany = selectedCompany === 'সব কোম্পানি' || prod.company === selectedCompany;
      return matchSearch && matchCategory && matchCompany;
    });
    if (sortBy === 'low') result.sort((a, b) => a.sale_price - b.sale_price);
    if (sortBy === 'high') result.sort((a, b) => b.sale_price - a.sale_price);
    return result;
  }, [searchQuery, selectedCategory, selectedCompany, sortBy, products]);

  const addToCart = (product: any, e?: React.MouseEvent) => {
    setCategoryUsage(prev => ({ ...prev, [product.category]: (prev[product.category] || 0) + 1 }));
    
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setFlyingItem({ id: product.id, x: rect.left, y: rect.top });
      setTimeout(() => setFlyingItem(null), 700);
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.sale_price }]);
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  
  const updateQty = (id: string, newQty: number) => { 
    if (newQty >= 1) setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item)); 
  };
  
  const updateRate = (id: string, newRate: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, rate: newRate } : item));
  };

  const subTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const discountVal = hasDiscount ? (Number(discountAmount) || 0) : 0;
  const deliveryVal = hasDelivery ? (Number(deliveryCharge) || 0) : 0;
  const finalTotal = subTotal - discountVal + deliveryVal;
  const dueAmount = finalTotal - (Number(cashReceived) || 0);

  const handleAddCustomer = async () => {
    if (!newCustomer.name) return alert('কাস্টমারের নাম দিন');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newCust = { id: Date.now().toString(), name: newCustomer.name, phone: newCustomer.phone, due_balance: 0 };
        setCustomers([...customers, newCust]);
        setCustomerId(newCust.id);
      } else {
        const { data, error } = await supabase.from('customers')
          .insert([{ business_id: activeBusiness?.id, name: newCustomer.name, phone: newCustomer.phone }])
          .select().single();
        if (error) throw error;
        setCustomers([...customers, data]);
        setCustomerId(data.id);
      }
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', phone: '' });
    } catch (error: any) {
      alert("কাস্টমার যোগ করতে সমস্যা: " + error.message);
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleConfirmSale = async () => {
    if (!isDemoMode && !activeBusiness?.id) return alert('বিজনেস সিলেক্ট করা নেই!');
    
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setReceiptId('DEMO-' + Math.floor(Math.random() * 100000));
        setStep(4);
      } else {
        const itemsJson = cart.map(item => ({ 
          product_id: item.id, 
          quantity: item.qty, 
          rate: item.rate, 
          total: item.qty * item.rate 
        }));

        const { data, error } = await supabase.rpc('create_sale', {
          p_business_id: activeBusiness?.id,
          p_customer_id: customerId || null,
          p_total_amount: finalTotal,
          p_discount: discountVal,
          p_delivery_charge: deliveryVal,
          p_paid_amount: Number(cashReceived) || 0,
          p_due_amount: dueAmount > 0 ? dueAmount : 0,
          p_payment_method: paymentMethod === 'due' ? 'cash' : paymentMethod,
          p_note: remarks,
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

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-base">
              {step === 1 && "বিক্রি - পণ্য নির্বাচন"}
              {step === 2 && "বিক্রি - কার্ট"}
              {step === 3 && "পেমেন্ট কনফার্ম করুন"}
              {step === 4 && `বিক্রি সম্পন্ন`}
            </h1>
          </div>
          {step === 1 && <HelpCircle size={22} className="text-white/80" />}
          {step === 4 && (
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><X size={20} /></button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 scrollbar-hide">
        
        {step === 1 && (
          <>
            <div className="flex gap-2 shrink-0">
              <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="পণ্য খোজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
                <div className="h-4 w-[1px] bg-gray-300"></div>
                <button onClick={() => setIsFilterOpen(true)} className="text-gray-500 active:scale-90 transition">
                  <Filter size={16} />
                </button>
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="bg-white border border-gray-300 rounded-lg px-2 shadow-sm text-[#1E88E5] active:scale-90 transition flex items-center justify-center">
                <ScanBarcode size={22} />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 shrink-0 items-center">
              <button onClick={() => handleCategorySelect('সব পণ্য')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCategory === 'সব পণ্য' ? 'bg-[#0B5C47] text-white border-[#0B5C47] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}>
                <Tag size={12}/> সব পণ্য
              </button>
              {topThreeCategories.map(cat => (
                <button key={cat} onClick={() => handleCategorySelect(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-[#0B5C47] text-white border-[#0B5C47] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 shrink-0 items-center">
              <button onClick={() => setSelectedCompany('সব কোম্পানি')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCompany === 'সব কোম্পানি' ? 'bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}>
                <Building2 size={12}/> সব কোম্পানি
              </button>
              {allCompanies.map(comp => (
                <button key={comp} onClick={() => setSelectedCompany(comp)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCompany === comp ? 'bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {comp}
                </button>
              ))}
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
                        <div className="flex gap-4 text-[11px] text-gray-500 mt-0.5">
                          <span>স্টক: {toBangla(prod.stock_quantity)}</span>
                          <span className="text-[#1B5E20] font-bold">বিক্রয়: ৳{toBangla(prod.sale_price)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => addToCart(prod, e)} className="w-8 h-8 bg-[#1E88E5] text-white rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition shrink-0 z-10">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-1 shrink-0">
              <div className="grid grid-cols-4 bg-[#1E88E5] p-2 text-xs font-bold text-white text-center">
                <div>পণ্য</div>
                <div>পরিমাণ</div>
                <div>দর</div>
                <div>মোট</div>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">কার্ট খালি আছে</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-100 last:border-0 p-2">
                    <div className="grid grid-cols-4 items-center gap-1">
                       <div className="col-span-1 flex flex-col items-center">
                         <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-1 overflow-hidden">
                           {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={14} />}
                         </div>
                         <span className="text-[10px] font-bold text-gray-700 text-center truncate w-full">{item.name}</span>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-500 mt-1"><Trash2 size={12}/></button>
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border border-gray-300 rounded bg-gray-50 py-1 text-xs font-bold" />
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, parseInt(e.target.value))} className="w-12 text-center border border-gray-300 rounded bg-gray-50 py-1 text-xs font-bold text-[#1E88E5]" />
                       </div>
                       <div className="col-span-1 text-right font-bold text-sm">৳ {toBangla(item.qty * item.rate)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 flex flex-col gap-2 text-sm mt-1 shrink-0">
              <div className="flex justify-between font-bold text-base">
                <span>সাব টোটাল</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                  <span className="font-bold text-gray-700 text-xs flex items-center gap-1">ডিসকাউন্ট <Tag size={12}/></span>
                  <button className={`w-9 h-5 rounded-full relative transition-colors ${hasDiscount ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDiscount ? 'left-4.5' : 'left-0.5'}`}></div></button>
                </div>
                {hasDiscount && <input type="number" placeholder="ডিসকাউন্ট পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />}

                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                  <span className="font-bold text-gray-700 text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                  <button className={`w-9 h-5 rounded-full relative transition-colors ${hasDelivery ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDelivery ? 'left-4.5' : 'left-0.5'}`}></div></button>
                </div>
                {hasDelivery && <input type="number" placeholder="ডেলিভারি চার্জ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />}
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
            <div className="bg-[#1E88E5] text-white rounded-xl p-3 flex justify-between items-center shadow-md shrink-0">
              <span className="font-bold text-sm">সর্বমোট</span>
              <span className="font-black text-xl">{toBangla(finalTotal)}</span>
            </div>

            <div className="flex flex-col gap-1 mt-1 shrink-0">
               <label className="text-xs font-bold text-[#1E88E5]">ক্যাশ পেয়েছি</label>
               <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] font-bold text-lg shadow-sm" placeholder="0" />
            </div>

            <div className="flex items-center justify-between px-1 mb-2 shrink-0">
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-gray-700">ফেরত দিবেন</span>
                 <span className="text-[#1E88E5] font-black text-lg">{toBangla(Math.max(0, (parseInt(cashReceived) || 0) - finalTotal))}</span>
               </div>
               {dueAmount > 0 && <span className="text-red-500 font-bold text-sm">বাকি থাকবে: ৳ {toBangla(dueAmount)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'cash' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <Banknote size={18} className={paymentMethod === 'cash' ? 'text-[#1E88E5]' : 'text-gray-500'}/>
                <span className="text-xs font-bold text-gray-700">নগদ</span>
              </button>
              <button onClick={() => setPaymentMethod('due')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'due' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <CreditCard size={18} className={paymentMethod === 'due' ? 'text-[#1E88E5]' : 'text-gray-500'}/>
                <span className="text-xs font-bold text-gray-700">বাকি</span>
              </button>
              <button onClick={() => setPaymentMethod('bkash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bkash' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <Smartphone size={18} className={paymentMethod === 'bkash' ? 'text-[#1E88E5]' : 'text-gray-500'}/>
                <span className="text-xs font-bold text-gray-700">বিকাশ</span>
              </button>
              <button onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bank' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <Building2 size={18} className={paymentMethod === 'bank' ? 'text-[#1E88E5]' : 'text-gray-500'}/>
                <span className="text-xs font-bold text-gray-700">ব্যাংক</span>
              </button>
            </div>

            <div className="bg-gray-200 p-2.5 rounded-xl border border-gray-300 flex justify-between items-center shrink-0 opacity-70 mt-2">
               <div className="flex items-center gap-2">
                 <div className="bg-white p-1 rounded border"><Smartphone size={16} className="text-gray-400"/></div>
                 <span className="text-sm font-bold text-gray-500">এস এম এস পাঠান</span>
               </div>
               <div className="text-[10px] font-bold text-gray-500 bg-gray-300 px-2 py-0.5 rounded">আপাতত বন্ধ</div>
            </div>

            <div className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm shrink-0 mt-2">
              <span className="font-bold text-gray-700 text-sm flex items-center gap-2"><UserPlus size={16}/> কাস্টমার তথ্য</span>
              <button onClick={() => setShowCustomerInfo(!showCustomerInfo)} className={`w-9 h-5 rounded-full relative transition-colors ${showCustomerInfo ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showCustomerInfo ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            {showCustomerInfo && (
              <div className="flex flex-col gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2">
                   <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47] shadow-sm">
                     <option value="">--কাস্টমার সিলেক্ট--</option>
                     {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                   </select>
                   <button onClick={() => setIsCustomerModalOpen(true)} className="bg-[#0B5C47] text-white px-3 rounded-lg font-bold text-sm shadow-sm">নতুন</button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm shrink-0 mt-2">
              <span className="font-bold text-gray-700 text-sm">কর্মচারী তথ্য</span>
              <button onClick={() => setShowEmployeeInfo(!showEmployeeInfo)} className={`w-9 h-5 rounded-full relative transition-colors ${showEmployeeInfo ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showEmployeeInfo ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="shrink-0 mt-2">
              <label className="text-xs font-bold text-gray-700 mb-1 block">মন্তব্য লিখুন</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0B5C47] min-h-[50px] text-sm shadow-sm" />
            </div>
          </>
        )}

        {step === 4 && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 font-serif text-sm relative overflow-hidden">
             <div className="text-center mb-4">
               <h2 className="text-lg font-bold text-gray-800">DREAM AGRO</h2>
               <p className="text-xs text-gray-600">& FISHERIES</p>
             </div>

             <div className="text-sm mb-3">
               <p className="font-bold">রিসিপ্ট # {receiptId.substring(0, 10).toUpperCase()}</p>
               <p className="text-xs">তারিখ: {new Date().toLocaleString('bn-BD')}</p>
             </div>

             <div className="text-[11px] mb-2 leading-relaxed border-b border-dashed border-gray-400 pb-2">
               <p><strong>কাস্টমার:</strong> {customers.find(c => c.id === customerId)?.name || 'সাধারণ কাস্টমার'}</p>
               <p><strong>মোবাইল:</strong> {customers.find(c => c.id === customerId)?.phone || 'দেওয়া হয়নি'}</p>
             </div>

             <div className="border-b border-dashed border-gray-400 py-2 mb-2">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="w-1/2">পণ্যের নাম</span>
                  <span className="w-1/6 text-center">দাম</span>
                  <span className="w-1/6 text-center">পরিমাণ</span>
                  <span className="w-1/6 text-right">মোট</span>
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5">
                    <span className="w-1/2 truncate">{i+1}. {item.name}</span>
                    <span className="w-1/6 text-center">{toBangla(item.rate)}</span>
                    <span className="w-1/6 text-center">{toBangla(item.qty)}</span>
                    <span className="w-1/6 text-right">{toBangla(item.qty * item.rate)} ৳</span>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-1 text-[11px] text-right pr-2">
                <div className="flex justify-between font-bold"><span>সাব টোটাল:</span> <span>{toBangla(subTotal)} ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>(-) ডিসকাউন্ট:</span> <span>{toBangla(discountVal)} ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>ডেলিভারি চার্জ:</span> <span>{toBangla(deliveryVal)} ৳</span></div>
                
                <div className="border-t border-dashed border-gray-400 mt-1 pt-1">
                  <div className="flex justify-between font-bold text-sm text-gray-800"><span>মোট প্রদেয়:</span> <span>{toBangla(finalTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-gray-800"><span>মূল্য পেয়েছেন:</span> <span>{toBangla(cashReceived || finalTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-gray-800"><span>এই লেনদেনের বাকি:</span> <span>{toBangla(Math.max(0, dueAmount))} ৳</span></div>
                </div>
             </div>

             <div className="text-[11px] mt-3 text-left">
               <p>মূল্যপরিশোধ পদ্ধতি: {paymentMethod === 'cash' ? 'নগদ টাকা' : paymentMethod === 'due' ? 'বাকি' : paymentMethod === 'bkash' ? 'বিকাশ/নগদ' : 'ব্যাংক'}</p>
               {remarks && <p className="mt-1">নোটঃ {remarks}</p>}
             </div>

             <div className="text-center mt-6 text-[10px] text-gray-500">
               Powered by: Hishabpati ERP
             </div>
             
             <div className="flex justify-center gap-10 mt-6">
               <button className="flex flex-col items-center gap-1.5 text-gray-700"><Printer size={28}/><span className="text-[11px] font-bold">রিসিপ্ট প্রিন্ট</span></button>
               <button className="flex flex-col items-center gap-1.5 text-gray-700"><Share2 size={28}/><span className="text-[11px] font-bold">শেয়ার</span></button>
             </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-[#1E88E5] text-white p-2 rounded-xl shadow-md">
             <div className="flex items-center gap-2 font-bold text-sm pl-1">সর্বমোট: ৳ {toBangla(finalTotal)}</div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#1E88E5] px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">
               {toBangla(cart.length)} <ChevronRight size={18}/>
             </button>
           </div>
         )}

         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">এগিয়ে যান</button>
         )}

         {step === 3 && (
           <button onClick={handleConfirmSale} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             {isSaving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} পেমেন্ট কনফার্ম করুন
           </button>
         )}

         {step === 4 && (
           <button onClick={onBack} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md">নতুন বিক্রয় শুরু করুন</button>
         )}
      </div>

      {flyingItem && (
        <div className="fixed z-[999] w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center text-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.6)] border-2 border-amber-400 pointer-events-none" style={{ left: flyingItem.x - 24, top: flyingItem.y - 24, animation: 'flyToCart 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <ShoppingBag size={24} />
          <style>{`@keyframes flyToCart { 0% { transform: scale(1) translateY(0); opacity: 1; } 50% { transform: scale(1.5) translateY(-30px); opacity: 1; } 100% { transform: scale(0) translateY(250px); opacity: 0; } }`}</style>
        </div>
      )}

      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Filter size={16}/> ফিল্টার ও সর্টিং</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-3 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">ক্যাটাগরি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleCategorySelect('সব পণ্য')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === 'সব পণ্য' ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                    সব পণ্য
                    {selectedCategory === 'সব পণ্য' && <Check size={16}/>}
                  </button>
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => handleCategorySelect(cat)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === cat ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                      {cat}
                      {selectedCategory === cat && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">কোম্পানি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setSelectedCompany('সব কোম্পানি')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === 'সব কোম্পানি' ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    সব কোম্পানি
                    {selectedCompany === 'সব কোম্পানি' && <Check size={16}/>}
                  </button>
                  {allCompanies.map(comp => (
                    <button key={comp} onClick={() => setSelectedCompany(comp)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === comp ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                      {comp}
                      {selectedCompany === comp && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">দাম অনুযায়ী সাজান</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => { setSortBy('default'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'default' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    ডিফল্ট
                    {sortBy === 'default' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('low'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'low' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    কম দাম থেকে বেশি
                    {sortBy === 'low' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('high'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'high' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    বেশি দাম থেকে কম
                    {sortBy === 'high' && <Check size={16}/>}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setIsFilterOpen(false)} className="w-full bg-[#1E88E5] text-white py-2.5 rounded-lg font-bold shadow-md">অ্যাপ্লাই করুন</button>
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
            
            <div id="reader" className="w-full aspect-square max-w-[280px] bg-black rounded-3xl border-2 border-gray-700 overflow-hidden shadow-2xl relative">
              {scannerError && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-red-900/80 text-white z-20">
                  <p>{scannerError}</p>
                </div>
              )}
            </div>
            
            <p className="text-white/80 text-sm mt-6 text-center">বারকোডটি ফ্রেমের মধ্যে রাখুন</p>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><UserPlus size={16}/> নতুন কাস্টমার</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নাম <span className="text-red-500">*</span></label>
                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">মোবাইল</label>
                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsCustomerModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddCustomer} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}