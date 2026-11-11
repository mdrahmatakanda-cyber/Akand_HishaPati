import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, ShoppingBag, CheckCircle2, 
  Printer, Share2, Smartphone, 
  Plus, ChevronRight, ScanBarcode, UserPlus, 
  Trash2, X, Check, Tag, Banknote, CreditCard, 
  Building2, Loader2, Truck, AlertTriangle, ZoomIn
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import html2canvas from 'html2canvas';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoCategories, demoCompanies, demoCustomers } from '../lib/demoData';

interface SaleProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
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

export default function SalePage({ onBack, onNavigate }: SaleProps) {
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
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [flyingItem, setFlyingItem] = useState<{ id: string, x: number, y: number } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

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
      showToast(`"${scannedProduct.name}" স্ক্যান হয়েছে!`, 'success');
    } else {
      showToast('পণ্য পাওয়া যায়নি।', 'error');
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
      setFlyingItem({ id: product.id, x: rect.left + rect.width/2, y: rect.top + rect.height/2 });
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
    if (!newCustomer.name) return showToast('কাস্টমারের নাম দিন', 'error');
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
      showToast("কাস্টমার যোগ করতে সমস্যা: " + error.message, 'error');
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleConfirmSale = async () => {
    if (!isDemoMode && !activeBusiness?.id) return showToast('বিজনেস সিলেক্ট করা নেই!', 'error');
    
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
      showToast("সমস্যা: " + error.message, 'error');
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  useEffect(() => {
    const handleAppBack = (e: Event) => {
      if (step > 1) {
        e.preventDefault();
        setStep(step - 1);
      }
    };
    window.addEventListener('appBack', handleAppBack);
    return () => window.removeEventListener('appBack', handleAppBack);
  }, [step]);

  const handleShareReceipt = async () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;
    try {
      const canvas = await html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'receipt.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Sale Receipt' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt-${receiptId.substring(0, 8)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('ইমেজটি ডাউনলোড করা হয়েছে।', 'success');
        }
      });
    } catch (err) {
      showToast('শেয়ার করতে সমস্যা হয়েছে।', 'error');
    }
  };

  return (
    <div className="h-[100dvh] bg-da-bg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {toast.show && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[999] w-[280px] px-5 py-5 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-3 animate-in slide-in-from-top-8 fade-in duration-300 border border-white/20 ${toast.type === 'success' ? 'bg-da-greenDeep' : 'bg-da-red'} text-white`}>
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center shadow-inner">
            {toast.type === 'success' ? <CheckCircle2 size={28} className="text-white" /> : <AlertTriangle size={28} className="text-white" />}
          </div>
          <span className="text-sm font-bold text-center leading-snug">{toast.message}</span>
        </div>
      )}

      <header className="bg-gradient-to-r from-da-greenDeep to-da-blueDeep text-white shadow-md shrink-0 z-40">
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
          {step === 1 && (
            <button onClick={() => onNavigate('product_list')} className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition hover:bg-white/20">
              <Plus size={14} /> নতুন পণ্য
            </button>
          )}
          {step === 4 && (
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><X size={20} /></button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 pb-24 scrollbar-hide">
        
        {step === 1 && (
          <>
            <div className="flex gap-1 shrink-0 mb-0.5">
              <div className="flex-1 bg-white border border-da-cardBorder rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm focus-within:border-da-blue transition">
                <Search size={14} className="text-da-textMuted" />
                <input type="text" placeholder="পণ্য খোজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent placeholder-da-textMuted" />
                <button onClick={() => setIsFilterOpen(true)} className="text-da-textMuted active:scale-90 transition p-0.5">
                  <Filter size={16} />
                </button>
              </div>
              <button onClick={() => setIsScannerOpen(true)} className="bg-white border border-da-cardBorder rounded-lg px-2.5 shadow-sm text-da-blue active:scale-90 transition flex items-center justify-center">
                <ScanBarcode size={18} />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto scrollbar-hide items-center shrink-0">
              <button onClick={() => handleCategorySelect('সব পণ্য')} className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCategory === 'সব পণ্য' ? 'bg-da-green text-white border-da-green shadow-sm' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
                <Tag size={10}/> সব পণ্য
              </button>
              {topThreeCategories.map(cat => (
                <button key={cat} onClick={() => handleCategorySelect(cat)} className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-da-green text-white border-da-green shadow-sm' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-1 overflow-x-auto scrollbar-hide items-center shrink-0">
              <button onClick={() => setSelectedCompany('সব কোম্পানি')} className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCompany === 'সব কোম্পানি' ? 'bg-da-blue text-white border-da-blue shadow-sm' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
                <Building2 size={10}/> সব কোম্পানি
              </button>
              {allCompanies.map(comp => (
                <button key={comp} onClick={() => setSelectedCompany(comp)} className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition border ${selectedCompany === comp ? 'bg-da-blue text-white border-da-blue shadow-sm' : 'bg-white text-da-textMuted border-da-cardBorder'}`}>
                  {comp}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {isDataLoading ? (
                <div className="col-span-2 flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-green" size={32}/></div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center text-da-textMuted text-sm mt-10">কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                filteredProducts.map(prod => (
                  <div 
                    key={prod.id} 
                    onClick={(e) => addToCart(prod, e)}
                    className="bg-white p-1.5 rounded-lg border border-da-cardBorder shadow-sm flex items-center gap-2 cursor-pointer active:scale-[0.97] transition-transform h-[68px]"
                  >
                    <div 
                      onClick={(e) => { e.stopPropagation(); if(prod.image_url) setPreviewImage(prod.image_url); }}
                      className="w-12 h-12 bg-da-innerBg rounded flex items-center justify-center text-da-textMuted shrink-0 overflow-hidden border border-da-cardBorder relative group"
                    >
                      {prod.image_url ? (
                        <>
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <ZoomIn size={14} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <ShoppingBag size={20} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        <h3 className="font-bold text-[11px] text-da-textDark line-clamp-2 leading-tight">{prod.name}</h3>
                        <div className="flex gap-1 mt-0.5 overflow-hidden">
                          <span className="text-[8px] font-bold text-da-teal truncate">{prod.category}</span>
                          <span className="text-[8px] font-bold text-da-blue truncate">• {prod.company}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-0.5">
                        <span className="text-[9px] text-da-textMuted font-bold truncate">স্টক: {toBangla(prod.stock_quantity)}</span>
                        <span className="text-[11px] font-black text-da-green shrink-0">৳{toBangla(prod.sale_price)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm overflow-hidden mt-1 shrink-0">
              <div className="grid grid-cols-4 bg-da-blue p-2 text-xs font-bold text-white text-center">
                <div>পণ্য</div>
                <div>পরিমাণ</div>
                <div>দর</div>
                <div>মোট</div>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-4 text-center text-sm text-da-textMuted">কার্ট খালি আছে</div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="border-b border-da-cardBorder last:border-0 p-2">
                    <div className="grid grid-cols-4 items-center gap-1">
                       <div className="col-span-1 flex flex-col items-center">
                         <div className="w-8 h-8 bg-da-innerBg rounded-lg flex items-center justify-center text-da-textMuted mb-1 overflow-hidden border border-da-cardBorder">
                           {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag size={14} />}
                         </div>
                         <span className="text-[10px] font-bold text-da-textDark text-center truncate w-full">{item.name}</span>
                         <button onClick={() => removeFromCart(item.id)} className="text-da-red mt-1"><Trash2 size={12}/></button>
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border border-da-cardBorder rounded bg-da-innerBg py-1 text-xs font-bold" />
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, parseInt(e.target.value))} className="w-12 text-center border border-da-cardBorder rounded bg-da-innerBg py-1 text-xs font-bold text-da-blue" />
                       </div>
                       <div className="col-span-1 text-right font-bold text-sm text-da-textDark">৳ {toBangla(item.qty * item.rate)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 flex flex-col gap-2 text-sm mt-1 shrink-0">
              <div className="flex justify-between font-bold text-base text-da-textDark">
                <span>সাব টোটাল</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              
              <div className="flex flex-col gap-2">
                <div>
                  <div className="flex justify-between items-center bg-da-innerBg p-2 rounded-lg border border-da-cardBorder cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                    <span className="font-bold text-da-textDark text-xs flex items-center gap-1">ডিসকাউন্ট <Tag size={12}/></span>
                    <button className={`w-10 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${hasDiscount ? 'bg-da-green' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 ease-in-out shadow-sm transform ${hasDiscount ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                  {hasDiscount && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                      <input type="number" placeholder="ডিসকাউন্ট পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="mt-1.5 w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center bg-da-innerBg p-2 rounded-lg border border-da-cardBorder cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                    <span className="font-bold text-da-textDark text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                    <button className={`w-10 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${hasDelivery ? 'bg-da-green' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 ease-in-out shadow-sm transform ${hasDelivery ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                  {hasDelivery && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                      <input type="number" placeholder="ডেলিভারি চার্জ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="mt-1.5 w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between font-black text-lg text-da-blue mt-1 border-t border-da-cardBorder pt-2">
                <span>সর্বমোট</span>
                <span>৳ {toBangla(finalTotal)}</span>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="bg-da-blue text-white rounded-xl p-3 flex justify-between items-center shadow-blue-soft shrink-0">
              <span className="font-bold text-sm">সর্বমোট</span>
              <span className="font-black text-xl">{toBangla(finalTotal)}</span>
            </div>

            <div className="flex flex-col gap-1 mt-1 shrink-0">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-da-blue">ক্যাশ পেয়েছি</label>
                 <div className="flex gap-1.5">
                   <button onClick={() => setCashReceived(finalTotal.toString())} className="text-[10px] font-bold bg-da-green/10 text-da-green px-2 py-1 rounded border border-da-green/30 active:scale-95 transition">পুরো টাকা</button>
                   <button onClick={() => setCashReceived('0')} className="text-[10px] font-bold bg-da-red/10 text-da-red px-2 py-1 rounded border border-da-red/30 active:scale-95 transition">সম্পূর্ণ বাকি</button>
                 </div>
               </div>
               <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2.5 outline-none focus:border-da-green font-bold text-lg shadow-sm mt-1" placeholder="0" />
            </div>

            <div className="flex items-center justify-between px-1 mb-2 shrink-0">
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-da-textDark">ফেরত দিবেন</span>
                 <span className="text-da-blue font-black text-lg">{toBangla(Math.max(0, (parseInt(cashReceived) || 0) - finalTotal))}</span>
               </div>
               {dueAmount > 0 && <span className="text-da-red font-bold text-sm">বাকি থাকবে: ৳ {toBangla(dueAmount)}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'cash' ? 'border-da-blue bg-da-blue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Banknote size={18} className={paymentMethod === 'cash' ? 'text-da-blue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">নগদ</span>
              </button>
              <button onClick={() => setPaymentMethod('due')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'due' ? 'border-da-blue bg-da-blue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <CreditCard size={18} className={paymentMethod === 'due' ? 'text-da-blue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">বাকি</span>
              </button>
              <button onClick={() => setPaymentMethod('bkash')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bkash' ? 'border-da-blue bg-da-blue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Smartphone size={18} className={paymentMethod === 'bkash' ? 'text-da-blue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">বিকাশ</span>
              </button>
              <button onClick={() => setPaymentMethod('bank')} className={`p-2 rounded-xl border flex items-center justify-center gap-2 transition ${paymentMethod === 'bank' ? 'border-da-blue bg-da-blue/10 shadow-sm' : 'border-da-cardBorder bg-white'}`}>
                <Building2 size={18} className={paymentMethod === 'bank' ? 'text-da-blue' : 'text-da-textMuted'}/>
                <span className="text-xs font-bold text-da-textDark">ব্যাংক</span>
              </button>
            </div>

            <div className="bg-gray-200 p-2.5 rounded-xl border border-gray-300 flex justify-between items-center shrink-0 opacity-70 mt-2">
               <div className="flex items-center gap-2">
                 <div className="bg-white p-1 rounded border"><Smartphone size={16} className="text-gray-400"/></div>
                 <span className="text-sm font-bold text-gray-500">এস এম এস পাঠান</span>
               </div>
               <div className="text-[10px] font-bold text-gray-500 bg-gray-300 px-2 py-0.5 rounded">আপাতত বন্ধ</div>
            </div>

            <div className="flex justify-between items-center bg-white border border-da-cardBorder p-2.5 rounded-lg shadow-sm shrink-0 mt-2">
              <span className="font-bold text-da-textDark text-sm flex items-center gap-2"><UserPlus size={16}/> কাস্টমার তথ্য</span>
              <button onClick={() => setShowCustomerInfo(!showCustomerInfo)} className={`w-9 h-5 rounded-full relative transition-colors ${showCustomerInfo ? 'bg-da-green' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showCustomerInfo ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            {showCustomerInfo && (
              <div className="flex flex-col gap-2 shrink-0 animate-in fade-in slide-in-from-top-2">
                <button 
                  onClick={() => setIsCustomerSearchOpen(true)} 
                  className="w-full bg-white border border-da-cardBorder rounded-lg p-2.5 text-sm flex justify-between items-center text-left shadow-sm"
                >
                  <span className={customerId ? 'text-da-textDark font-bold' : 'text-da-textMuted'}>
                    {customerId ? customers.find(c => c.id === customerId)?.name : '--কাস্টমার সিলেক্ট করুন--'}
                  </span>
                  <Search size={16} className="text-da-textMuted" />
                </button>
              </div>
            )}

            <div className="shrink-0 mt-2">
              <label className="text-xs font-bold text-da-textDark mb-1 block">মন্তব্য লিখুন</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 outline-none focus:border-da-green min-h-[50px] text-sm shadow-sm" />
            </div>
          </>
        )}

        {step === 4 && (
          <div id="printable-receipt" className="bg-white p-3 rounded-xl shadow-lg border border-da-cardBorder font-serif text-[11px] relative overflow-hidden w-full max-w-sm mx-auto">
             
             <div className="text-center mb-2">
               <h2 className="text-lg font-bold text-da-textDark">{activeBusiness?.name || 'DREAM AGRO'}</h2>
               <p className="text-[10px] text-da-textMuted">{(activeBusiness as any)?.phone || '01752005057'}</p>
             </div>

             <div className="flex justify-between items-center mb-2">
               <p className="font-bold text-da-textDark text-xs">রিসিপ্ট # {receiptId.substring(0, 14).toUpperCase()}</p>
               <p className="text-[10px] text-da-textMuted">{new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
             </div>

             <div className="mb-2 leading-tight text-[10px] text-da-textDark">
               <div className="flex justify-between items-center">
                 <p className="truncate max-w-[55%]"><span className="font-bold">কাস্টমার:</span> {customers.find(c => c.id === customerId)?.name || 'সাধারণ কাস্টমার'}</p>
                 <p className="text-right"><span className="font-bold">মোবাইল:</span> {customers.find(c => c.id === customerId)?.phone || '[দেওয়া হয়নি]'}</p>
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
                <div className="flex justify-between"><span className="text-da-textMuted">(+) ভ্যাট পরিমাণ:</span> <span>০ ৳</span></div>
                <div className="flex justify-between"><span className="text-da-textMuted">(-) ডিসকাউন্ট:</span> <span>{toBangla(discountVal)} ৳</span></div>
                <div className="flex justify-between"><span className="text-da-textMuted">ডেলিভারি চার্জ:</span> <span>{toBangla(deliveryVal)} ৳</span></div>
                <div className="flex justify-between font-bold text-xs text-da-textDark mt-1 pt-1 border-t border-dashed border-da-textMuted"><span>মোট প্রদেয়:</span> <span>{toBangla(finalTotal)} ৳</span></div>
                <div className="flex justify-between font-bold text-da-textDark"><span>দিয়েছি:</span> <span>{toBangla(Number(cashReceived) || 0)} ৳</span></div>
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
               <button onClick={handleShareReceipt} className="flex flex-col items-center gap-1 text-da-textDark active:scale-95 transition">
                 <Share2 size={20}/><span className="text-[10px] font-bold">রিসিপ্ট শেয়ার করুন</span>
               </button>
             </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-da-blue text-white p-2 rounded-xl shadow-blue-soft">
             <div className="flex items-center gap-2 font-bold text-sm pl-1">সর্বমোট: ৳ {toBangla(finalTotal)}</div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-da-blue px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">
               {toBangla(cart.length)} <ChevronRight size={18}/>
             </button>
           </div>
         )}

         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-da-blue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">এগিয়ে যান</button>
         )}

         {step === 3 && (
           <button onClick={handleConfirmSale} disabled={isSaving} className="w-full bg-da-blue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2">
             {isSaving ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} পেমেন্ট কনফার্ম করুন
           </button>
         )}

         {step === 4 && (
           <button 
             onClick={() => {
               showToast('আপনার বিক্রয়টি সফলভাবে সম্পন্ন হয়েছে!', 'success');
               setTimeout(() => { onBack(); }, 1500);
             }} 
             className="w-full bg-da-blue text-white py-3 rounded-xl font-bold shadow-blue-soft"
           >
             নতুন বিক্রয় শুরু করুন
           </button>
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
            <div className="bg-da-greenDeep p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Filter size={16}/> ফিল্টার ও সর্টিং</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-3 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-da-textMuted mb-2 border-b border-da-cardBorder pb-1">ক্যাটাগরি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleCategorySelect('সব পণ্য')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === 'সব পণ্য' ? 'border-da-green bg-da-green/10 text-da-green font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                    সব পণ্য
                    {selectedCategory === 'সব পণ্য' && <Check size={16}/>}
                  </button>
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => handleCategorySelect(cat)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === cat ? 'border-da-green bg-da-green/10 text-da-green font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                      {cat}
                      {selectedCategory === cat && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-da-textMuted mb-2 border-b border-da-cardBorder pb-1">কোম্পানি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setSelectedCompany('সব কোম্পানি')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === 'সব কোম্পানি' ? 'border-da-blue bg-da-blue/10 text-da-blue font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                    সব কোম্পানি
                    {selectedCompany === 'সব কোম্পানি' && <Check size={16}/>}
                  </button>
                  {allCompanies.map(comp => (
                    <button key={comp} onClick={() => setSelectedCompany(comp)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === comp ? 'border-da-blue bg-da-blue/10 text-da-blue font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                      {comp}
                      {selectedCompany === comp && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-da-textMuted mb-2 border-b border-da-cardBorder pb-1">দাম অনুযায়ী সাজান</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => { setSortBy('default'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'default' ? 'border-da-blue bg-da-blue/10 text-da-blue font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                    ডিফল্ট
                    {sortBy === 'default' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('low'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'low' ? 'border-da-blue bg-da-blue/10 text-da-blue font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                    কম দাম থেকে বেশি
                    {sortBy === 'low' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('high'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'high' ? 'border-da-blue bg-da-blue/10 text-da-blue font-bold' : 'border-da-cardBorder text-da-textMuted'}`}>
                    বেশি দাম থেকে কম
                    {sortBy === 'high' && <Check size={16}/>}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-innerBg">
              <button onClick={() => setIsFilterOpen(false)} className="w-full bg-da-blue text-white py-2.5 rounded-lg font-bold shadow-blue-soft">অ্যাপ্লাই করুন</button>
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

      {isCustomerSearchOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end backdrop-blur-sm">
          <div className="bg-white w-full h-[80dvh] sm:max-w-md sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-greenDeep p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Search size={16}/> কাস্টমার খুঁজুন</h2>
              <button onClick={() => setIsCustomerSearchOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-3 border-b border-da-cardBorder shrink-0">
              <div className="bg-da-innerBg border border-da-cardBorder rounded-lg px-3 py-2 flex items-center gap-2">
                <Search size={18} className="text-da-textMuted" />
                <input 
                  type="text" 
                  placeholder="কাস্টমারের নাম..." 
                  value={customerSearchQuery}
                  onChange={e => setCustomerSearchQuery(e.target.value)}
                  className="w-full outline-none text-sm bg-transparent" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())).length === 0 ? (
                <div className="text-center text-da-textMuted mt-5 text-sm">কোনো কাস্টমার পাওয়া যায়নি</div>
              ) : (
                customers.filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())).map(cust => (
                  <div 
                    key={cust.id} 
                    onClick={() => { setCustomerId(cust.id); setIsCustomerSearchOpen(false); }}
                    className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition ${customerId === cust.id ? 'border-da-teal bg-da-teal/5' : 'border-da-cardBorder bg-white hover:bg-da-innerBg'}`}
                  >
                    <div>
                      <p className="font-bold text-sm text-da-textDark">{cust.name}</p>
                      <p className="text-[10px] text-da-textMuted">{cust.phone || 'মোবাইল নেই'}</p>
                    </div>
                    {customerId === cust.id && <CheckCircle2 size={20} className="text-da-teal" />}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-innerBg shrink-0">
              <button 
                onClick={() => { setIsCustomerSearchOpen(false); setIsCustomerModalOpen(true); }} 
                className="w-full bg-da-blue text-white py-3 rounded-xl font-bold shadow-blue-soft flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <UserPlus size={18}/> নতুন কাস্টমার যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-lg w-full max-h-[80vh] flex items-center justify-center">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="bg-da-greenDeep p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><UserPlus size={16}/> নতুন কাস্টমার</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">নাম <span className="text-da-red">*</span></label>
                <input type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
              </div>
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">মোবাইল</label>
                <input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-innerBg flex gap-2">
              <button onClick={() => setIsCustomerModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddCustomer} disabled={isSaving} className="flex-1 bg-da-blue text-white py-2 rounded-xl font-bold shadow-blue-soft flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}