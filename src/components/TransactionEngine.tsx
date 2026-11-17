import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Search, Trash2, 
  CheckCircle, Truck, X, 
  Filter, Tag, ShoppingBag, ChevronRight, Plus, Image as ImageIcon
} from 'lucide-react';
import { toBangla, numberToWordsBn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { showAppToast } from './PremiumToast';
import { supabase } from '../lib/supabase';
import { ReceiptModal, getMergedReceiptSettings, formatReceiptNumber, type ReceiptData, type ReceiptTypeKey } from '../pages/ReceiptModal';

export interface EngineProduct { id: string | number; name: string; category: string; company: string; stockQty: number; rate: number; unit: string; image_url?: string; }
export interface EngineParty { id: string; name: string; phone: string; address: string; }
export interface TransferItem { id: string | number; name: string; quantity: number; rate: number; unit: string; }

export async function fetchEngineData(
  businessId: string,
  partyTable: 'customers' | 'companies' | 'suppliers' | 'dealers',
  priceField: 'sale_price' | 'purchase_price' = 'sale_price',
  allBusinessIds?: string[],
  isDepot: boolean = false
): Promise<{ products: EngineProduct[]; parties: EngineParty[] }> {
  const prodBizIds = allBusinessIds && allBusinessIds.length > 0 ? allBusinessIds : [businessId];
  const [prodRes, catRes, compRes, partyRes] = await Promise.all([
    supabase.from('products').select('*').in('business_id', prodBizIds),
    supabase.from('categories').select('*'),
    supabase.from('companies').select('*').eq('business_id', businessId),
    partyTable === 'companies' ? Promise.resolve({ data: null }) : supabase.from(partyTable).select('*').eq('business_id', businessId),
  ]);

  const cats = catRes.data || [];
  const comps = compRes.data || [];
  const rawParties = partyTable === 'companies' ? comps : (partyRes.data || []);

  return {
    products: (prodRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: cats.find((c: any) => c.id === p.category_id)?.name || 'সাধারণ',
      company: comps.find((c: any) => c.id === p.company_id)?.name || 'সাধারণ',
      stockQty: isDepot ? (p.depot_stock_quantity || 0) : (p.stock_quantity || 0),
      rate: p[priceField] || 0,
      unit: p.unit || 'পিস',
      image_url: p.image_url,
    })),
    parties: rawParties.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || 'N/A',
      address: c.address || c.area || 'N/A',
    })),
  };
}

// Transaction Engine
interface TransactionEngineProps {
  mode: 'sale' | 'purchase' | 'dealer_transfer' | 'depot_transfer';
  title: string;
  partyLabel: string;
  products: EngineProduct[];
  parties: EngineParty[];
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onFinalize: (data: any) => void;
}

export default function TransactionEngine({ 
  mode, title, partyLabel, products, parties, onBack, onNavigate, onFinalize 
}: TransactionEngineProps) {
  const { user, activeBusiness } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<TransferItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব পণ্য');
  const [selectedCompany, setSelectedCompany] = useState('সব কোম্পানি');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState('');
  
  const [cashReceived, setCashReceived] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');

  const [vehicleNo, setVehicleNo] = useState("");
  const [vDriverName, setVDriverName] = useState('');
  const [vDriverPhone, setVDriverPhone] = useState('');

  // পারচেজের জন্য বাড়তি ফিল্ড
  const [batch, setBatch] = useState('');
  const [challan, setChallan] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const [isGatePassReady, setIsGatePassReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const receiptType: ReceiptTypeKey = mode === 'purchase' ? 'purchase' : (mode === 'dealer_transfer' || mode === 'depot_transfer') ? 'transfer' : 'sale';
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (partyId) {
      const p = parties.find(x => x.id === partyId);
      if (p) { setPartyName(p.name); setPartyPhone(p.phone); setPartyAddress(p.address); }
    }
  }, [partyId, parties]);

  const allCategories = useMemo(() => ['সব পণ্য', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const allCompanies = useMemo(() => ['সব কোম্পানি', ...Array.from(new Set(products.map(p => p.company)))], [products]);
  const filteredProducts = useMemo(() => products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory === 'সব পণ্য' || p.category === selectedCategory) &&
    (selectedCompany === 'সব কোম্পানি' || p.company === selectedCompany)
  ), [searchQuery, selectedCategory, selectedCompany, products]);

  const addToCart = (product: EngineProduct) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { ...product, quantity: 1 }]);
  };

  const updateQty = (id: any, val: any) => setCart(cart.map(item => item.id === id ? { ...item, quantity: val === '' ? '' as any : Number(val) } : item));
  const updateRate = (id: any, val: any) => setCart(cart.map(item => item.id === id ? { ...item, rate: val === '' ? '' as any : Number(val) } : item));
  const removeFromCart = (id: any) => setCart(cart.filter(item => item.id !== id));

  const subTotal = cart.reduce((acc, item) => acc + ((Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0);
  const discountVal = hasDiscount ? (Number(discountAmount) || 0) : 0;
  const deliveryVal = hasDelivery ? (Number(deliveryCharge) || 0) : 0;
  const finalTotal = subTotal - discountVal + deliveryVal;
  const dueAmount = finalTotal - (Number(cashReceived) || 0);

  const handleProceedToGatePass = () => {
    if (!partyName.trim()) return showAppToast(`${partyLabel}-এর নাম আবশ্যক!`, 'error');
    setIsGatePassReady(true);
  };

  const { formattedNo, seqStorageKey, nextSeq } = useMemo(() => {
    const cached = activeBusiness?.id ? localStorage.getItem(`receipt_settings_${activeBusiness.id}`) : null;
    const merged = getMergedReceiptSettings(cached ? JSON.parse(cached) : null, activeBusiness);
    const cfg = merged.types[receiptType];
    const now = new Date();
    const ddmm = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = cfg?.numberFormat === 'day_month_seq'
      ? `receipt_seq_${activeBusiness?.id || 'default'}_${receiptType}_${ddmm}`
      : `receipt_seq_${activeBusiness?.id || 'default'}_${receiptType}`;
    const savedSeq = Number(localStorage.getItem(key) || 0);
    const startSeq = Number(cfg?.startSeq) || 1;
    const currentSeq = Math.max(startSeq, savedSeq || startSeq);
    return {
      formattedNo: formatReceiptNumber(cfg, currentSeq, merged.badgeText),
      seqStorageKey: key,
      nextSeq: currentSeq + 1,
    };
  }, [activeBusiness, receiptType, isGatePassReady]);

  const handleFinalize = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(seqStorageKey, String(nextSeq));
      onFinalize({ 
        mode, 
        cart, 
        partyId, 
        cashReceived: Number(cashReceived) || 0, 
        subTotal, 
        discountVal, 
        deliveryVal, 
        finalTotal, 
        dueAmount, 
        remarks,
        batch,
        challan,
        receiptImage
      });
      setIsSaving(false);
      setStep(1); setCart([]); setPartyId(''); setPartyName(''); setPartyPhone(''); setPartyAddress('');
      setCashReceived(''); setRemarks(''); setHasDiscount(false); setHasDelivery(false);
      setBatch(''); setChallan(''); setReceiptImage(null);
      setIsGatePassReady(false);
    }, 1000);
  };

  const receiptData: ReceiptData = useMemo(() => {
    const totalQty = cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    const totalBags = cart.filter(i => i.unit?.includes('বস্তা') || i.unit?.toLowerCase().includes('bag')).reduce((a, i) => a + (Number(i.quantity) || 0), 0);
    const totalPieces = totalQty - totalBags;
    const paid = Number(cashReceived) || 0;

    return {
      type: receiptType,
      partyLabel,
      invoiceNo: formattedNo,
      date: currentDate,
      receiptTime: currentTime,
      status: dueAmount <= 0 ? 'পরিশোধিত' : paid > 0 ? 'আংশিক জমা' : 'বাকি',
      shopName: activeBusiness?.name || 'DREAM AGRO & FISHERIES',
      shopAddress: (activeBusiness as any)?.address || '',
      shopPhone: (activeBusiness as any)?.phone || '',
      shopEmail: (activeBusiness as any)?.email || '',
      customerName: partyName || 'N/A',
      proprietor: 'N/A',
      customerPhone: partyPhone || 'N/A',
      customerAddress: partyAddress || 'N/A',
      marketName: 'N/A',
      officerName: user?.user_metadata?.name || user?.email || 'অফিসার',
      officerPhone: user?.user_metadata?.phone || 'N/A',
      officerEmail: user?.email || 'N/A',
      vehicleNo,
      driverName: vDriverName,
      driverPhone: vDriverPhone,
      transportRent: deliveryVal,
      deliveryCharge: deliveryVal,
      items: cart.map((item, idx) => ({
        id: String(item.id || idx),
        name: item.name,
        quantity: Number(item.quantity) || 0,
        unit: item.unit,
        unitPrice: Number(item.rate) || 0,
        totalPrice: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      })),
      totalBags,
      totalPieces,
      subtotal: subTotal,
      discount: discountVal,
      grandTotal: finalTotal,
      paidAmount: paid,
      dueAmount: Math.max(0, dueAmount),
      paidInWords: numberToWordsBn(paid),
      note: remarks,
      batch,
      challan,
    };
  }, [activeBusiness, receiptType, partyLabel, formattedNo, currentDate, currentTime, dueAmount, cashReceived, partyName, partyPhone, partyAddress, user, vehicleNo, vDriverName, vDriverPhone, deliveryVal, cart, subTotal, discountVal, finalTotal, remarks, batch, challan]);


  return (
    <div className="min-h-screen bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col">

      <header className="bg-gradient-to-r from-[#1B5E20] via-[#00796B] to-[#0D3B80] text-white shadow-md sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { if (isGatePassReady) setIsGatePassReady(false); else if (step > 1) setStep(step - 1); else onBack(); }} className="p-1.5 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="font-bold text-base sm:text-lg">{isGatePassReady ? "রিসিপ্ট প্রিভিউ" : `${title} - ধাপ ${toBangla(step)}`}</h2>
              <p className="text-[10px] text-cyan-200">DREAM AGRO & FISHERIES</p>
            </div>
          </div>
          
          {!isGatePassReady && step === 1 && mode === 'sale' && onNavigate && (
            <button onClick={() => onNavigate('product_list')} className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition hover:bg-white/20">
              <Plus size={14} /> নতুন পণ্য
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 flex flex-col gap-3 pb-24 print:pb-0">
        {/* STEP 1: Product Selection */}
        {step === 1 && !isGatePassReady && (
          <>
            <div className="flex gap-1 shrink-0 mb-0.5">
              <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                <Search size={14} className="text-gray-500" />
                <input type="text" placeholder="পণ্য খোজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
                <button onClick={() => setIsFilterOpen(true)} className="text-gray-500"><Filter size={16} /></button>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
              {allCategories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${selectedCategory === cat ? 'bg-[#1B5E20] text-white' : 'bg-white text-gray-500'}`}>{cat}</button>)}
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
              {allCompanies.map(comp => <button key={comp} onClick={() => setSelectedCompany(comp)} className={`px-2 py-1 rounded-md text-[10px] font-bold border ${selectedCompany === comp ? 'bg-[#0D3B80] text-white' : 'bg-white text-gray-500'}`}>{comp}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {filteredProducts.map(prod => {
                const cartItem = cart.find(c => c.id === prod.id);
                return (
                  <div key={prod.id} onClick={() => addToCart(prod)} className="relative bg-white p-1.5 rounded-lg border border-gray-300 shadow-sm flex items-center gap-2 cursor-pointer h-[68px]">
                    {cartItem && <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{toBangla(cartItem.quantity)}</div>}
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 shrink-0">
                      {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover rounded" /> : <ShoppingBag size={20} />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <h3 className="font-bold text-[11px] text-gray-800 line-clamp-2 leading-tight">{prod.name}</h3>
                      <div className="flex justify-between items-end mt-0.5">
                        <span className="text-[9px] text-gray-500 font-bold">স্টক: {toBangla(prod.stockQty)}</span>
                        <span className="text-[11px] font-black text-[#1B5E20]">৳{toBangla(prod.rate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 2: Cart */}
        {step === 2 && !isGatePassReady && (
          <>
            <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden mt-1 shrink-0">
              <div className="bg-gray-100 py-1.5 text-[11px] font-bold text-[#0D3B80] text-center border-b border-gray-300">আইটেম {toBangla(cart.length)}টি | মোট পণ্য {toBangla(cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0))}টি</div>
              <div className="grid grid-cols-[1fr_55px_65px_75px] gap-1 bg-[#0D3B80] p-2 text-[11px] font-bold text-white text-center">
                <div className="text-left pl-1">পণ্য</div><div>পরিমাণ</div><div>দর</div><div className="text-right pr-1">মোট</div>
              </div>
              {cart.map((item, idx) => (
                <div key={idx} className="border-b border-gray-200 last:border-0 px-2 py-1.5">
                  <div className="grid grid-cols-[1fr_55px_65px_75px] gap-1 items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-1 bg-red-50 rounded"><Trash2 size={14}/></button>
                      <p className="text-[11px] font-bold text-gray-800 truncate">{item.name}</p>
                    </div>
                    <input type="number" value={item.quantity} onChange={(e) => updateQty(item.id, e.target.value)} className="w-full text-center border rounded py-1 text-[11px] font-bold" />
                    <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, e.target.value)} className="w-full text-center border rounded py-1 text-[11px] font-bold text-[#0D3B80]" />
                    <div className="text-right pr-1 font-bold text-xs">৳ {toBangla((Number(item.quantity) || 0) * (Number(item.rate) || 0))}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-300 shadow-sm p-2.5 mt-1 shrink-0">
              <div className="flex justify-between font-bold text-base text-gray-800 mb-2"><span>সাব টোটাল</span><span>৳ {toBangla(subTotal)}</span></div>
              <div className="flex flex-col gap-2">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setHasDiscount(!hasDiscount)}>
                    <span className="font-bold text-xs flex items-center gap-1">ডিসকাউন্ট <Tag size={12}/></span>
                    <div className={`w-10 h-5 rounded-full relative ${hasDiscount ? 'bg-[#1B5E20]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDiscount ? 'translate-x-5' : 'translate-x-0.5'}`}></div></div>
                  </div>
                  {hasDiscount && <input type="number" placeholder="পরিমাণ" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} className="mt-1.5 w-full border rounded p-2 text-sm" />}
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setHasDelivery(!hasDelivery)}>
                    <span className="font-bold text-xs flex items-center gap-1">ডেলিভারি চার্জ <Truck size={12}/></span>
                    <div className={`w-10 h-5 rounded-full relative ${hasDelivery ? 'bg-[#1B5E20]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${hasDelivery ? 'translate-x-5' : 'translate-x-0.5'}`}></div></div>
                  </div>
                  {hasDelivery && <input type="number" placeholder="পরিমাণ" value={deliveryCharge} onChange={e => setDeliveryCharge(e.target.value)} className="mt-1.5 w-full border rounded p-2 text-sm" />}
                </div>
              </div>
              <div className="flex justify-between font-black text-lg text-[#0D3B80] mt-2 border-t pt-2"><span>সর্বমোট</span><span>৳ {toBangla(finalTotal)}</span></div>
            </div>
          </>
        )}

        {/* STEP 3: Information */}
        {step === 3 && !isGatePassReady && (
          <>
            <div className="bg-[#0D3B80] text-white rounded-xl p-3 flex justify-between items-center shadow-md mb-1">
              <span className="font-bold text-sm">সর্বমোট</span><span className="font-black text-xl">{toBangla(finalTotal)}</span>
            </div>
            
            <div className="flex flex-col gap-1 mt-1 shrink-0">
               <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-[#0D3B80]">অ্যাডভান্স পেয়েছি</label>
                 <div className="flex gap-1.5">
                   <button onClick={() => setCashReceived(finalTotal.toString())} className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded border">পুরো টাকা</button>
                   <button onClick={() => setCashReceived('0')} className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded border">বাকি</button>
                 </div>
               </div>
               <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full bg-white border rounded-lg p-2.5 outline-none font-bold text-lg shadow-sm mt-1" placeholder="0" />
            </div>

            <div className="flex items-center justify-between px-1 mb-2 shrink-0">
               <span className="text-sm font-bold text-gray-800">ফেরত দিবেন: <span className="text-[#0D3B80]">{toBangla(Math.max(0, (parseInt(cashReceived) || 0) - finalTotal))}</span></span>
               {dueAmount > 0 && <span className="text-red-500 font-bold text-sm">বাকি: ৳ {toBangla(dueAmount)}</span>}
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-300 shadow-sm flex flex-col gap-3 mt-1">
              <h3 className="text-sm font-bold text-[#0D3B80] border-b pb-1">{partyLabel} তথ্য</h3>
              
              {parties.length > 0 && (
                <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full bg-gray-50 border rounded-lg p-2 text-sm outline-none mb-1">
                  <option value="">-- সেভ করা {partyLabel} --</option>
                  {parties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}

              <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)} placeholder="নাম *" className="w-full border rounded-lg p-2 text-sm outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={partyPhone} onChange={e => setPartyPhone(e.target.value)} placeholder="মোবাইল" className="w-full border rounded-lg p-2 text-sm outline-none" />
                <input type="text" value={partyAddress} onChange={e => setPartyAddress(e.target.value)} placeholder="ঠিকানা" className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>

              {/* পারচেজের জন্য বাড়তি ফিল্ড */}
              {mode === 'purchase' && (
                <div className="flex gap-2 mt-1">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">ব্যাচ</label>
                    <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="ব্যাচ" className="w-full border rounded-lg p-2 text-sm outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">চালান নং</label>
                    <input type="text" value={challan} onChange={e => setChallan(e.target.value)} placeholder="চালান নং" className="w-full border rounded-lg p-2 text-sm outline-none" />
                  </div>
                </div>
              )}

              <h3 className="text-sm font-bold text-[#0D3B80] border-b pb-1 mt-2">পরিবহন তথ্য</h3>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="গাড়ি নম্বর" className="w-full border rounded-lg p-2 text-sm outline-none" />
                <input type="text" value={vDriverName} onChange={e => setVDriverName(e.target.value)} placeholder="ড্রাইভার নাম" className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
              <input type="text" value={vDriverPhone} onChange={e => setVDriverPhone(e.target.value)} placeholder="ড্রাইভার মোবাইল" className="w-full border rounded-lg p-2 text-sm outline-none" />

              {mode === 'purchase' && (
                <button onClick={() => receiptInputRef.current?.click()} className="w-full mt-2 border border-dashed border-gray-400 rounded-lg p-2 flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                  {receiptImage ? <span className="text-green-600 truncate">{receiptImage.name}</span> : <><ImageIcon size={16}/> রিসিপ্টের ছবি আপলোড করুন</>}
                </button>
              )}
              <input type="file" ref={receiptInputRef} onChange={(e) => setReceiptImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />

              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="মন্তব্য" className="w-full border rounded-lg p-2 text-sm outline-none mt-2" />
            </div>
          </>
        )}
      </main>

      {/* Fixed Bottom Buttons */}
      {!isGatePassReady && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-2.5 z-50 print:hidden">
          {step === 1 && (
            <div className="flex justify-between items-center bg-gradient-to-r from-[#1B5E20] to-[#0D3B80] text-white p-3 rounded-2xl shadow-lg">
              <div className="flex flex-col"><span className="text-[10px] opacity-80">মোট</span><span className="font-black text-xl">৳ {toBangla(finalTotal)}</span></div>
              <div className="flex items-center gap-3">
                <div className="text-right text-[11px] font-bold text-amber-200">আইটেম: {toBangla(cart.length)} | পণ্য: {toBangla(cart.reduce((a, i) => a + (Number(i.quantity) || 0), 0))}</div>
                <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#0D3B80] px-5 py-2.5 rounded-xl font-black"><ChevronRight size={20}/></button>
              </div>
            </div>
          )}
          {step === 2 && <button onClick={() => setStep(3)} className="w-full bg-[#0D3B80] text-white py-3 rounded-xl font-bold">এগিয়ে যান</button>}
          {step === 3 && <button onClick={handleProceedToGatePass} className="w-full bg-[#0D3B80] text-white py-3 rounded-xl font-bold flex justify-center gap-2"><CheckCircle size={18}/> চালান কনফার্ম করুন</button>}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#1B5E20] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Filter size={16}/> ফিল্টার</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-3 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-200 pb-1">ক্যাটাগরি</p>
                <div className="flex flex-col gap-1.5">
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === cat ? 'border-[#1B5E20] bg-green-50 text-[#1B5E20] font-bold' : 'border-gray-200 text-gray-500'}`}>
                      {cat} {selectedCategory === cat && <CheckCircle size={16}/>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-200 pb-1">কোম্পানি</p>
                <div className="flex flex-col gap-1.5">
                  {allCompanies.map(comp => (
                    <button key={comp} onClick={() => setSelectedCompany(comp)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === comp ? 'border-[#0D3B80] bg-blue-50 text-[#0D3B80] font-bold' : 'border-gray-200 text-gray-500'}`}>
                      {comp} {selectedCompany === comp && <CheckCircle size={16}/>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setIsFilterOpen(false)} className="w-full bg-[#0D3B80] text-white py-2.5 rounded-lg font-bold shadow-sm">অ্যাপ্লাই করুন</button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        isOpen={isGatePassReady}
        onClose={() => setIsGatePassReady(false)}
        onCancel={() => { setIsGatePassReady(false); setStep(1); setCart([]); }}
        onFinalize={handleFinalize}
        isSaving={isSaving}
        data={receiptData}
      />
    </div>
  );
}