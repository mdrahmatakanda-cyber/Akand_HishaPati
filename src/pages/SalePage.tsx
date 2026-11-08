import { useState } from 'react';
import { 
  ArrowLeft, Search, Filter, ShoppingBag, CheckCircle2, 
  Printer, Share2, Smartphone, Calendar, Image as ImageIcon, 
  Plus, ChevronRight, HelpCircle, ScanBarcode, UserPlus, 
  Trash2, X, Info 
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface SaleProps {
  onBack: () => void;
}

const products = [
  { id: 1, name: 'টেস্ট প্রোডাক্ট', stock: 21, price: 100 },
  { id: 2, name: 'তুলা', stock: 203, price: 300 },
];

export default function SalePage({ onBack }: SaleProps) {
  const [step, setStep] = useState<number>(1);
  const [saleMode, setSaleMode] = useState<'list' | 'quick'>('list');
  
  // কার্ট ও ইনপুট স্টেট
  const [cart, setCart] = useState<any[]>([]);
  const [challan, setChallan] = useState('');
  const [discount, setDiscount] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [profit, setProfit] = useState('0');
  const [productDetails, setProductDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showEmployeeInfo, setShowEmployeeInfo] = useState(false);
  
  // অ্যানিমেশন স্টেট
  const [flyingItem, setFlyingItem] = useState<{ id: number, x: number, y: number } | null>(null);

  const addToCart = (product: any, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFlyingItem({ id: product.id, x: rect.left, y: rect.top });

    setTimeout(() => {
      setFlyingItem(null);
    }, 700);

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.price }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQty = (id: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const updateRate = (id: number, newRate: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, rate: newRate } : item));
  };

  const subTotal = cart.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const dueAmount = subTotal - (parseInt(cashReceived) || 0);
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-base">
              {step === 1 && (saleMode === 'list' ? "বিক্রি - প্রোডাক্ট লিস্ট" : "বিক্রি - দ্রুত বিক্রি")}
              {step === 2 && "বিক্রি - কার্ট"}
              {step === 3 && "পেমেন্ট কনফার্ম করুন"}
              {step === 4 && `বিক্রি করেছেন ${toBangla(subTotal)}৳ মূল্যের পণ্য`}
            </h1>
          </div>
          {step === 1 && <HelpCircle size={22} className="text-white/80" />}
          {step === 4 && (
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      {/* মেইন কন্টেন্ট */}
      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 scrollbar-hide">
        
        {/* ================= স্টেপ ১: প্রোডাক্ট সিলেকশন ================= */}
        {step === 1 && (
          <>
            {/* মোড টগল (দ্রুত বিক্রি / প্রোডাক্ট লিস্ট) */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              <button 
                onClick={() => setSaleMode('quick')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition ${saleMode === 'quick' ? 'bg-[#1E88E5] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                <ShoppingBag size={18} /> দ্রুত বিক্রি
              </button>
              <button 
                onClick={() => setSaleMode('list')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm transition ${saleMode === 'list' ? 'bg-[#1E88E5] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
              >
                <ScanBarcode size={18} /> প্রোডাক্ট লিস্ট
              </button>
            </div>

            {/* লিস্ট মোড */}
            {saleMode === 'list' && (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                    <Search size={16} className="text-gray-400" />
                    <input type="text" placeholder="পণ্য খোজ করুন" className="w-full outline-none text-xs bg-transparent" />
                    <div className="h-4 w-[1px] bg-gray-300"></div>
                    <Filter size={16} className="text-gray-500" />
                  </div>
                  <button className="bg-white border border-gray-300 rounded-lg px-2 shadow-sm text-[#1E88E5]">
                    <ScanBarcode size={20} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                          <ShoppingBag size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#0F2A3D] truncate">{prod.name}</h3>
                          <div className="flex gap-4 text-[11px] text-gray-500 mt-0.5">
                            <span>স্টক: {toBangla(prod.stock)}</span>
                            <span className="text-[#1B5E20] font-bold">বিক্রয়: ৳{toBangla(prod.price)}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => addToCart(prod, e)}
                        className="w-8 h-8 bg-[#1E88E5] text-white rounded-lg flex items-center justify-center shadow-sm active:scale-90 transition shrink-0 z-10"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* দ্রুত বিক্রি মোড */}
            {saleMode === 'quick' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <button className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-1.5 text-sm font-bold text-gray-700">
                    <Calendar size={16}/> {new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long' })}
                  </button>
                  <button className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-1.5 text-sm font-bold text-gray-700">
                    <ImageIcon size={16}/> ছবি
                  </button>
                  <button className="w-10 h-10 bg-white border border-gray-400 rounded-full flex items-center justify-center text-gray-700 shadow-sm shrink-0">
                    <Plus size={22}/>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ক্যাশ পেয়েছেন</label>
                  <textarea value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0B5C47] min-h-[60px] text-sm shadow-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">কাস্টমার মোবাইল</label>
                  <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-2 py-2 flex items-center gap-1 border-r text-sm font-bold text-gray-700">
                      <span className="text-red-500">●</span> +88
                    </div>
                    <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full p-2 outline-none text-sm" />
                    <button className="px-3 text-[#1E88E5]"><UserPlus size={18}/></button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">লাভ</label>
                  <input type="number" value={profit} onChange={e => setProfit(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0B5C47] text-sm shadow-sm" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্য সম্পর্কে বিস্তারিত</label>
                  <textarea value={productDetails} onChange={e => setProductDetails(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0B5C47] min-h-[50px] text-sm shadow-sm" />
                </div>

                <div className="border border-[#1E88E5] rounded-lg p-2 flex items-center gap-2 bg-[#EFF6FF]">
                  <Info size={16} className="text-[#1E88E5]" />
                  <span className="text-[11px] font-bold text-[#1E88E5]">সাবস্ক্রিপশন কিনতে এখানে ক্লিক করুন <ChevronRight size={14} className="inline"/></span>
                </div>
                
                <button className="w-full bg-gray-200 text-gray-400 py-2.5 rounded-xl font-bold shadow-sm mt-2">সাবমিট</button>
                
                <div className="flex justify-center mt-1">
                  <div className="bg-gray-200 rounded-full p-1 flex items-center gap-2 px-3">
                    <span className="text-[10px] font-bold text-gray-600">এস এম এস: (10)</span>
                    <button onClick={() => setIsSmsEnabled(!isSmsEnabled)} className={`w-8 h-4 rounded-full relative transition-colors ${isSmsEnabled ? 'bg-[#0B5C47]' : 'bg-white'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isSmsEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================= স্টেপ ২: কার্ট ================= */}
        {step === 2 && (
          <>
            <div className="flex justify-between items-center">
               <label className="text-xs font-bold text-gray-700">চালান নং</label>
               <button className="border border-[#1E88E5] text-[#1E88E5] text-xs font-bold px-2 py-1 rounded bg-white">
                 ০৯ NOVEMBER
               </button>
            </div>
            <input type="text" value={challan} onChange={e => setChallan(e.target.value)} placeholder="চালান নং" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47] shadow-sm" />

            {/* কার্ট টেবিল */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-1">
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
                    {/* অ্যাকশন বাটন */}
                    <div className="flex justify-end gap-1.5 mb-2">
                       <button className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 text-gray-700 shadow-sm"><ScanBarcode size={10}/> বারকোড</button>
                       <button className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 text-gray-700 shadow-sm"><Calendar size={10}/> ওয়ারেন্টি</button>
                       <button className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 text-gray-700 shadow-sm"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> এডিট</button>
                    </div>
                    {/* আইটেম ডাটা */}
                    <div className="grid grid-cols-4 items-center gap-1">
                       <div className="col-span-1 flex flex-col items-center">
                         <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mb-1">
                            <ShoppingBag size={14} />
                         </div>
                         <span className="text-[10px] font-bold text-gray-700 text-center truncate w-full">{item.name}</span>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-500 mt-1"><Trash2 size={12}/></button>
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))} className="w-10 text-center border border-gray-300 rounded bg-gray-50 py-1 text-xs font-bold" />
                       </div>
                       <div className="col-span-1 flex justify-center">
                         <input type="number" value={item.rate} onChange={(e) => updateRate(item.id, parseInt(e.target.value))} className="w-12 text-center border border-gray-300 rounded bg-gray-50 py-1 text-xs font-bold" />
                       </div>
                       <div className="col-span-1 text-right font-bold text-sm">৳ {toBangla(item.qty * item.rate)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* টোটাল ও টগল */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 flex flex-col gap-2 text-sm mt-1">
              <div className="flex justify-between font-bold text-base">
                <span>মোট</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-[#F3F4F6] p-2 rounded-lg border border-gray-100">
                <span className="font-bold text-gray-700 text-xs">ডিসকাউন্ট</span>
                <button onClick={() => setDiscount(!discount)} className={`w-9 h-5 rounded-full relative transition-colors ${discount ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${discount ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center bg-[#F3F4F6] p-2 rounded-lg border border-gray-100">
                <span className="font-bold text-gray-700 text-xs">ডেলিভারি চার্জ</span>
                <button onClick={() => setDelivery(!delivery)} className={`w-9 h-5 rounded-full relative transition-colors ${delivery ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${delivery ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= স্টেপ ৩: পেমেন্ট ================= */}
        {step === 3 && (
          <>
            <div className="bg-[#1E88E5] text-white rounded-xl p-3 flex justify-between items-center shadow-md">
              <span className="font-bold text-sm">সর্বমোট</span>
              <span className="font-black text-xl">{toBangla(subTotal)}</span>
            </div>

            <div className="flex flex-col gap-1 mt-1">
               <label className="text-xs font-bold text-[#1E88E5]">ক্যাশ পেয়েছি</label>
               <input 
                  type="number" 
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] font-bold text-lg shadow-sm"
                  placeholder="0"
                />
            </div>

            <div className="flex items-center gap-1 px-1 mb-2">
               <span className="text-sm font-bold text-gray-700">ফেরত দিবেন</span>
               <span className="text-[#1E88E5] font-black text-lg">{toBangla(Math.max(0, (parseInt(cashReceived) || 0) - subTotal))}</span>
               <div className="w-2 h-2 rounded-full border-2 border-[#1E88E5] ml-1"></div>
            </div>

            {/* পেমেন্ট মেথড কার্ড গ্রিড */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setPaymentMethod('cash')} className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${paymentMethod === 'cash' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg></div>
                <span className="text-xs font-bold text-gray-700">নগদ টাকা</span>
              </button>
              <button onClick={() => setPaymentMethod('due')} className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${paymentMethod === 'due' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg></div>
                <span className="text-xs font-bold text-gray-700">বাকি</span>
              </button>
              <button onClick={() => setPaymentMethod('bkash')} className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition ${paymentMethod === 'bkash' ? 'border-[#1E88E5] bg-[#EFF6FF] shadow-sm' : 'border-gray-200 bg-white'}`}>
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600"><Smartphone size={24}/></div>
                <span className="text-xs font-bold text-gray-700 text-center leading-tight">বিকাশ/নগদ<br/>কিউআর</span>
              </button>
            </div>

            {/* এসএমএস টগল */}
            <div className="flex justify-center mt-2">
              <div className="bg-[#F3F4F6] rounded-full p-1 flex items-center gap-2 px-3 border border-gray-200">
                <span className="text-[11px] font-bold text-gray-600">এস এম এস: (10)</span>
                <button onClick={() => setIsSmsEnabled(!isSmsEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${isSmsEnabled ? 'bg-[#1E88E5]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isSmsEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>

            <div className="border border-[#1E88E5] rounded-lg p-2 flex items-center gap-2 bg-[#EFF6FF]">
              <Info size={16} className="text-[#1E88E5]" />
              <span className="text-[11px] font-bold text-[#1E88E5]">সাবস্ক্রিপশন কিনতে এখানে ক্লিক করুন <ChevronRight size={14} className="inline"/></span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">মন্তব্য লিখুন</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2 outline-none focus:border-[#0B5C47] min-h-[50px] text-sm shadow-sm" />
            </div>

            <div className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm">
              <span className="font-bold text-gray-700 text-sm">কাস্টমার তথ্য</span>
              <button onClick={() => setShowCustomerInfo(!showCustomerInfo)} className={`w-9 h-5 rounded-full relative transition-colors ${showCustomerInfo ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showCustomerInfo ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm">
              <span className="font-bold text-gray-700 text-sm">কর্মচারী তথ্য</span>
              <button onClick={() => setShowEmployeeInfo(!showEmployeeInfo)} className={`w-9 h-5 rounded-full relative transition-colors ${showEmployeeInfo ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${showEmployeeInfo ? 'left-4.5' : 'left-0.5'}`}></div>
              </button>
            </div>
          </>
        )}

        {/* ================= স্টেপ ৪: রিসিপ্ট ================= */}
        {step === 4 && (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 font-serif text-sm relative overflow-hidden">
             <div className="text-center mb-4">
               <h2 className="text-lg font-bold text-gray-800">মিওয়ান</h2>
               <p className="text-xs text-gray-600">01752005057</p>
             </div>

             <div className="text-sm mb-3">
               <p className="font-bold">রিসিপ্ট # GVMTQX7S4WGR89W</p>
               <p className="text-xs">তারিখ: {new Date().toLocaleString('bn-BD')}</p>
             </div>

             <div className="text-[11px] mb-2 leading-relaxed border-b border-dashed border-gray-400 pb-2">
               <p><strong>নাম :</strong> [{showCustomerInfo ? 'প্রদান করা হয়নি' : 'দেওয়া হয়নি'}]</p>
               <p><strong>মোবাইল :</strong> [{customerMobile || 'দেওয়া হয়নি'}]</p>
               <p><strong>ঠিকানা :</strong> [দেওয়া হয়নি]</p>
             </div>

             <div className="border-b border-dashed border-gray-400 py-2 mb-2">
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span className="w-1/2">পণ্যের নাম</span>
                  <span className="w-1/6 text-center">দাম</span>
                  <span className="w-1/6 text-center">পরিমাণ</span>
                  <span className="w-1/6 text-right">মোট দাম</span>
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5">
                    <span className="w-1/2">{i+1}. {item.name}</span>
                    <span className="w-1/6 text-center">{toBangla(item.rate)}</span>
                    <span className="w-1/6 text-center">{toBangla(item.qty)}</span>
                    <span className="w-1/6 text-right">{toBangla(item.qty * item.rate)} ৳</span>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-1 text-[11px] text-right pr-2">
                <div className="flex justify-between font-bold"><span>মোট:</span> <span>{toBangla(subTotal)} ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>(+) ভ্যাট পরিমাণ:</span> <span>০ ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>(-) ডিসকাউন্ট:</span> <span>০ ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>ডেলিভারি চার্জ:</span> <span>০ ৳</span></div>
                
                <div className="border-t border-dashed border-gray-400 mt-1 pt-1">
                  <div className="flex justify-between font-bold text-sm text-gray-800"><span>মোট প্রদেয়:</span> <span>{toBangla(subTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-gray-800"><span>মূল্য পেয়েছেন:</span> <span>{toBangla(cashReceived || subTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-gray-800"><span>এই লেনদেনের বাকি:</span> <span>{toBangla(Math.max(0, dueAmount))} ৳</span></div>
                  <div className="flex justify-between font-bold text-gray-800 mt-1"><span>বর্তমান বাকি</span> <span>০ ৳</span></div>
                </div>
             </div>

             <div className="text-[11px] mt-3 text-left">
               <p>মূল্যপরিশোধ পদ্ধতি: {paymentMethod === 'cash' ? 'নগদ টাকা' : paymentMethod === 'due' ? 'বাকি' : 'বিকাশ/নগদ কিউআর'}</p>
               <p className="mt-1">নোটঃ {cart.map(c => c.name).join(', ')}</p>
             </div>

             <div className="text-center mt-6 text-[10px] text-gray-500">
               Powered by: Hishabee Business Manager
             </div>
             
             <div className="flex justify-center gap-10 mt-6">
               <button className="flex flex-col items-center gap-1.5 text-gray-700"><Printer size={28}/><span className="text-[11px] font-bold">রিসিপ্ট প্রিন্ট করুন</span></button>
               <button className="flex flex-col items-center gap-1.5 text-gray-700"><Share2 size={28}/><span className="text-[11px] font-bold">রিসিপ্ট শেয়ার</span></button>
             </div>
          </div>
        )}

      </main>

      {/* ================= স্টিকি বটম বার ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
         {step === 1 && saleMode === 'list' && (
           <div className="flex justify-between items-center bg-[#1E88E5] text-white p-2 rounded-xl shadow-md">
             <div className="flex items-center gap-2 font-bold text-sm pl-1">
               সর্বমোট: ৳ {toBangla(subTotal)}
             </div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#1E88E5] px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">
               {toBangla(cart.length)} <ChevronRight size={18}/>
             </button>
           </div>
         )}

         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             এগিয়ে যান
           </button>
         )}

         {step === 3 && (
           <button onClick={() => setStep(4)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             পেমেন্ট কনফার্ম করুন <CheckCircle2 size={18}/>
           </button>
         )}

         {step === 4 && (
           <button onClick={onBack} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md">
             নতুন বিক্রয় শুরু করুন
           </button>
         )}
      </div>

      {/* ================= ফ্লাইং অ্যানিমেশন ================= */}
      {flyingItem && (
        <div 
          className="fixed z-[999] w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shadow-xl border border-amber-300 pointer-events-none"
          style={{
            left: flyingItem.x,
            top: flyingItem.y,
            animation: 'flyToCart 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards'
          }}
        >
          <ShoppingBag size={20} />
          <style>{`
            @keyframes flyToCart {
              0% { transform: scale(1) translate(0, 0); opacity: 1; }
              100% { transform: scale(0.1) translate(-100px, 250px); opacity: 0; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}