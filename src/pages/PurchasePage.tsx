import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, Filter, ShoppingBag, CheckCircle2, 
  Printer, Share2, CreditCard, Banknote, Building2, Smartphone,
  Trash2, Plus, ChevronRight, Calendar, Image as ImageIcon, ScanBarcode, X, Check, Tag
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toBangla } from '../lib/utils';

interface PurchaseProps {
  onBack: () => void;
}

// ডেমু ক্যাটাগরি, কোম্পানি ও প্রোডাক্ট ডাটা
const allCategories = ['মাছের খাদ্য', 'ঔষধ ও ভিটামিন', 'যন্ত্রপাতি', 'প্যাকেজিং'];
const allCompanies = ['নিউজা', 'প্যারাগন', 'স্কয়ার', 'নিপ্রো'];

const products = [
  { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', stock: 50, purchasePrice: 1900, salePrice: 2050 },
  { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', stock: 100, purchasePrice: 280, salePrice: 350 },
  { id: 3, name: 'অক্সিজেন পাম্প', category: 'যন্ত্রপাতি', company: 'নিপ্রো', stock: 5, purchasePrice: 4000, salePrice: 4500 },
  { id: 4, name: 'ফ্লোটিং ফিড', category: 'মাছের খাদ্য', company: 'প্যারাগন', stock: 80, purchasePrice: 1600, salePrice: 1800 },
  { id: 5, name: 'প্লাস্টিকের ড্রাম', category: 'প্যাকেজিং', company: 'স্কয়ার', stock: 20, purchasePrice: 500, salePrice: 650 },
];

export default function PurchasePage({ onBack }: PurchaseProps) {
  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<any[]>([]);
  
  // স্টেপ ১ এর স্টেট
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব ক্যাটাগরি');
  const [selectedCompany, setSelectedCompany] = useState('সব কোম্পানি');
  
  // ফিল্টার ও স্ক্যানার স্টেট
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'low' | 'high'>('default');
  const [scannerError, setScannerError] = useState('');

  // ক্যাটাগরি ও কোম্পানি ব্যবহারের ট্র্যাকিং স্টেট
  const [categoryUsage, setCategoryUsage] = useState<Record<string, number>>({ 'মাছের খাদ্য': 10, 'ঔষধ ও ভিটামিন': 5 });
  const [companyUsage, setCompanyUsage] = useState<Record<string, number>>({ 'নিউজা': 8, 'স্কয়ার': 4 });

  // স্টেপ ২ ও ৩ এর স্টেট
  const [batch, setBatch] = useState('');
  const [challan, setChallan] = useState('');
  const [discount, setDiscount] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [supplier, setSupplier] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const [remarks, setRemarks] = useState('');

  // অ্যানিমেশন স্টেট
  const [flyingItem, setFlyingItem] = useState<{ id: number, x: number, y: number } | null>(null);

  // ==========================================
  // 🎥 আসল ক্যামেরা স্ক্যানার লজিক
  // ==========================================
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
        (error) => { console.debug("Scan error:", error); }
      ).catch((err) => {
        setScannerError("ক্যামেরা চালু করা যাচ্ছে না। পারমিশন চেক করুন।");
        console.error(err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScannerOpen]);

  const handleBarcodeScanned = (barcode: string) => {
    const scannedProduct = products.find(p => p.id.toString() === barcode) || products[0]; 
    if (scannedProduct) {
      addToCart(scannedProduct);
      alert(`"${scannedProduct.name}" স্ক্যান হয়েছে এবং কার্টে যুক্ত হয়েছে!`);
    }
  };

  // ==========================================
  // 🛒 কার্ট, ক্যাটাগরি ও কোম্পানি লজিক
  // ==========================================
  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat !== 'সব ক্যাটাগরি') {
      setCategoryUsage(prev => ({ ...prev, [cat]: (prev[cat] || 0) + 1 }));
    }
  };

  const handleCompanySelect = (comp: string) => {
    setSelectedCompany(comp);
    if (comp !== 'সব কোম্পানি') {
      setCompanyUsage(prev => ({ ...prev, [comp]: (prev[comp] || 0) + 1 }));
    }
  };

  // শীর্ষ ৩টি বেশি ব্যবহৃত ক্যাটাগরি ও কোম্পানি
  const topThreeCategories = useMemo(() => {
    return [...allCategories].sort((a, b) => (categoryUsage[b] || 0) - (categoryUsage[a] || 0)).slice(0, 3);
  }, [categoryUsage]);

  const topThreeCompanies = useMemo(() => {
    return [...allCompanies].sort((a, b) => (companyUsage[b] || 0) - (companyUsage[a] || 0)).slice(0, 3);
  }, [companyUsage]);

  // ফিল্টার লজিক
  const filteredProducts = useMemo(() => {
    let result = products.filter(prod => {
      const matchSearch = prod.name.includes(searchQuery);
      const matchCategory = selectedCategory === 'সব ক্যাটাগরি' || prod.category === selectedCategory;
      const matchCompany = selectedCompany === 'সব কোম্পানি' || prod.company === selectedCompany;
      return matchSearch && matchCategory && matchCompany;
    });

    if (sortBy === 'low') result.sort((a, b) => a.purchasePrice - b.purchasePrice);
    if (sortBy === 'high') result.sort((a, b) => b.purchasePrice - a.purchasePrice);

    return result;
  }, [searchQuery, selectedCategory, selectedCompany, sortBy]);

  const addToCart = (product: any, e?: React.MouseEvent) => {
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setFlyingItem({ id: product.id, x: rect.left, y: rect.top });
      setTimeout(() => setFlyingItem(null), 700);
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

  const subTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
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
        
        {/* ================= স্টেপ ১: প্রোডাক্ট লিস্ট ================= */}
        {step === 1 && (
          <>
            {/* সার্চ বার */}
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

            {/* ক্যাটাগরি ও কোম্পানি ফিল্টার ট্যাব */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {/* ক্যাটাগরি */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 items-center">
                <button 
                  onClick={() => handleCategorySelect('সব ক্যাটাগরি')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCategory === 'সব ক্যাটাগরি' ? 'bg-[#0B5C47] text-white border-[#0B5C47] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  <Tag size={12}/> সব ক্যাটাগরি
                </button>
                {topThreeCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-[#0B5C47] text-white border-[#0B5C47] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {cat}
                  </button>
                ))}
                <button onClick={() => setIsFilterOpen(true)} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-[#0B5C47] whitespace-nowrap border border-dashed border-[#0B5C47]">+ আরও</button>
              </div>

              {/* কোম্পানি */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 items-center">
                <button 
                  onClick={() => handleCompanySelect('সব কোম্পানি')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCompany === 'সব কোম্পানি' ? 'bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  <Building2 size={12}/> সব কোম্পানি
                </button>
                {topThreeCompanies.map(comp => (
                  <button 
                    key={comp}
                    onClick={() => handleCompanySelect(comp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCompany === comp ? 'bg-[#1E88E5] text-white border-[#1E88E5] shadow-sm' : 'bg-white text-gray-600 border-gray-300'}`}
                  >
                    {comp}
                  </button>
                ))}
                <button onClick={() => setIsFilterOpen(true)} className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-[#1E88E5] whitespace-nowrap border border-dashed border-[#1E88E5]">+ আরও</button>
              </div>
            </div>

            {/* প্রোডাক্ট কার্ড */}
            <div className="flex flex-col gap-2 mt-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-5">কোনো পণ্য পাওয়া যায়নি</div>
              ) : (
                filteredProducts.map(prod => (
                  <div key={prod.id} className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                        <ShoppingBag size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-[#0F2A3D] truncate">{prod.name}</h3>
                          <span className="text-[8px] bg-[#E8F5E9] text-[#0B5C47] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">{prod.category}</span>
                          <span className="text-[8px] bg-[#EFF6FF] text-[#1E88E5] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">{prod.company}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span>স্টক: {toBangla(prod.stock)}</span>
                          <span className="text-[#1B5E20]">ক্রয়: ৳{toBangla(prod.purchasePrice)}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => addToCart(prod, e)}
                      className="w-8 h-8 bg-white border border-[#1E88E5] text-[#1E88E5] rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition shrink-0 z-10"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ================= স্টেপ ২: কার্ট ================= */}
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
                      <div className="flex items-center gap-1">
                         <span className="truncate">{item.name}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border rounded bg-gray-50 py-1 text-xs" />
                    </div>
                    <div className="col-span-2 text-center text-gray-600">৳{toBangla(item.rate)}</div>
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
                <span>মোট</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                <span className="font-bold text-gray-700 text-xs">ডিসকাউন্ট</span>
                <button onClick={() => setDiscount(!discount)} className={`w-9 h-5 rounded-full relative transition-colors ${discount ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${discount ? 'left-4.5' : 'left-0.5'}`}></div></button>
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                <span className="font-bold text-gray-700 text-xs">ডেলিভারি চার্জ</span>
                <button onClick={() => setDelivery(!delivery)} className={`w-9 h-5 rounded-full relative transition-colors ${delivery ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${delivery ? 'left-4.5' : 'left-0.5'}`}></div></button>
              </div>
            </div>
          </>
        )}

        {/* ================= স্টেপ ৩: পেমেন্ট ================= */}
        {step === 3 && (
          <>
            <div className="text-center py-2 shrink-0">
              <span className="text-xs text-gray-500 font-bold">মোট প্রদেয়</span>
              <h2 className="text-3xl font-black text-[#1E88E5]">৳ {toBangla(subTotal)}</h2>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
               <label className="text-xs font-bold text-[#1E88E5]">ক্যাশ দিয়েছি</label>
               <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] font-bold text-lg shadow-sm" placeholder={subTotal.toString()} />
            </div>

            <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 flex flex-col gap-2.5 shrink-0">
              <div>
                <label className="text-[11px] font-bold text-gray-700 mb-1 block">সাপ্লায়ার</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white text-sm">
                  <option value="">--সিলেক্ট--</option>
                  <option value="miyan">মিয়াঁন</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700"><ImageIcon size={16}/> রিসিপ্টের ছবি</button>
                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700"><Calendar size={16}/> {date}</div>
              </div>
            </div>

            <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                 <div className="bg-white p-1 rounded border"><Smartphone size={16} className="text-gray-500"/></div>
                 <span className="text-sm font-bold text-gray-700">এস এম এস এ রিসিপ্ট পাঠান</span>
               </div>
               <button onClick={() => setIsSmsEnabled(!isSmsEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${isSmsEnabled ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${isSmsEnabled ? 'left-4.5' : 'left-0.5'}`}></div></button>
            </div>

            <div className="shrink-0">
              <h3 className="font-bold text-sm mb-1">মূল্য পরিশোধ পদ্ধতি</h3>
              <div className="flex flex-col gap-1.5">
                <PaymentMethod id="cash" label="নগদ টাকা" icon={Banknote} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="due" label="বাকি রাখুন" icon={CreditCard} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bkash" label="বিকাশ/নগদ কিউআর" icon={Smartphone} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bank" label="ব্যাংক চেক" icon={Building2} selected={paymentMethod} setSelected={setPaymentMethod} />
              </div>
            </div>

            <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="মন্তব্য লিখুন" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] text-sm shrink-0" />
          </>
        )}

        {/* ================= স্টেপ ৪: রিসিপ্ট ================= */}
        {step === 4 && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 font-mono text-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-[#0B5C47]"></div>
             <div className="text-center mt-2 mb-4">
               <h2 className="text-xl font-bold text-[#0B5C47]">DREAM AGRO</h2>
               <p className="text-xs text-gray-500">& FISHERIES</p>
               <p className="text-[11px] mt-2 font-bold">রিসিপ্ট # X0C2J8CJXMBGS17</p>
               <p className="text-[11px]">{new Date().toLocaleString('bn-BD')}</p>
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
                <div className="flex justify-between font-bold text-sm text-[#1E88E5] border-t border-dashed pt-1 mt-1"><span>মোট প্রদেয়:</span> <span>{toBangla(subTotal)} ৳</span></div>
             </div>
             <div className="text-center mt-6 text-[10px] text-gray-400">Powered by: Hisabee Business Manager</div>
             <div className="flex justify-center gap-8 mt-5">
               <button className="flex flex-col items-center gap-1 text-gray-700"><Printer size={26}/><span className="text-[11px] font-bold">প্রিন্ট</span></button>
               <button className="flex flex-col items-center gap-1 text-gray-700"><Share2 size={26}/><span className="text-[11px] font-bold">শেয়ার</span></button>
             </div>
          </div>
        )}

      </main>

      {/* ================= স্টিকি বটম বার ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-[#1E88E5] text-white p-2 rounded-xl shadow-md">
             <div className="flex items-center gap-2 font-bold text-sm pl-1"><ShoppingBag size={18} /> পণ্য: {toBangla(cart.reduce((a,c)=>a+c.qty,0))}</div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#1E88E5] px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">পণ্য কিনুন <ChevronRight size={18}/></button>
           </div>
         )}
         {step === 2 && <button onClick={() => setStep(3)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">এগিয়ে যান <ChevronRight size={18}/></button>}
         {step === 3 && <button onClick={() => setStep(4)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">পেমেন্ট কনফার্ম করুন <CheckCircle2 size={18}/></button>}
         {step === 4 && <button onClick={onBack} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md">সম্পন্ন করুন</button>}
      </div>

      {/* ফ্লাইং অ্যানিমেশন */}
      {flyingItem && (
        <div className="fixed z-[999] w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-500 shadow-xl border border-amber-300 pointer-events-none" style={{ left: flyingItem.x, top: flyingItem.y, animation: 'flyToCart 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
          <ShoppingBag size={20} />
          <style>{`@keyframes flyToCart { 0% { transform: scale(1) translate(0, 0); opacity: 1; } 100% { transform: scale(0.1) translate(-100px, 250px); opacity: 0; } }`}</style>
        </div>
      )}

      {/* ================= ফিল্টার মডাল (ক্যাটাগরি ও কোম্পানি সহ) ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Filter size={16}/> ফিল্টার ও সর্টিং</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-3 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {/* ক্যাটাগরি সিলেকশন */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">ক্যাটাগরি</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleCategorySelect('সব ক্যাটাগরি')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === 'সব ক্যাটাগরি' ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                    সব ক্যাটাগরি {selectedCategory === 'সব ক্যাটাগরি' && <Check size={16}/>}
                  </button>
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => handleCategorySelect(cat)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === cat ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                      {cat} {selectedCategory === cat && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* কোম্পানি সিলেকশন */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">কোম্পানি</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => handleCompanySelect('সব কোম্পানি')} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === 'সব কোম্পানি' ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    সব কোম্পানি {selectedCompany === 'সব কোম্পানি' && <Check size={16}/>}
                  </button>
                  {allCompanies.map(comp => (
                    <button key={comp} onClick={() => handleCompanySelect(comp)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === comp ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                      {comp} {selectedCompany === comp && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* দাম অনুযায়ী সাজান */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">দাম অনুযায়ী সাজান</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => { setSortBy('default'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'default' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    ডিফল্ট {sortBy === 'default' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('low'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'low' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    কম দাম থেকে বেশি {sortBy === 'low' && <Check size={16}/>}
                  </button>
                  <button onClick={() => { setSortBy('high'); setIsFilterOpen(false); }} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${sortBy === 'high' ? 'border-[#1E88E5] bg-blue-50 text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    বেশি দাম থেকে কম {sortBy === 'high' && <Check size={16}/>}
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

      {/* ================= স্ক্যানার মডাল ================= */}
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

    </div>
  );
}

// পেমেন্ট মেথড বাটন কম্পোনেন্ট
function PaymentMethod({ id, label, icon: Icon, selected, setSelected }: any) {
  return (
    <button 
      onClick={() => setSelected(id)}
      className={`flex items-center justify-between p-2.5 rounded-lg border transition ${selected === id ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-[#F3F4F6]'}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={20} className={selected === id ? 'text-[#1E88E5]' : 'text-gray-500'} />
        <span className={`text-sm font-bold ${selected === id ? 'text-[#1E88E5]' : 'text-gray-700'}`}>{label}</span>
      </div>
      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${selected === id ? 'border-[#1E88E5]' : 'border-gray-400'}`}>
        {selected === id && <div className="w-2 h-2 bg-[#1E88E5] rounded-full"></div>}
      </div>
    </button>
  );
}