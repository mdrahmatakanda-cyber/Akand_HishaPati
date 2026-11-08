import { useState } from 'react';
import { 
  ArrowLeft, Search, Filter, ShoppingBag, CheckCircle2, 
  Printer, Share2, CreditCard, Banknote, Building2, Smartphone,
  Trash2, Plus, ChevronRight, Calendar, Image as ImageIcon, 
 Info,
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface PurchaseProps {
  onBack: () => void;
}

// ডেমু প্রোডাক্ট লিস্ট (স্টক ও দাম সহ)
const products = [
  { id: 1, name: 'টেস্ট প্রোডাক্ট', stock: 19, salePrice: 100, purchasePrice: 70 },
  { id: 2, name: 'তুলা', stock: 200, salePrice: 300, purchasePrice: 280 },
];

export default function PurchasePage({ onBack }: PurchaseProps) {
  const [step, setStep] = useState<number>(1);
  const [cart, setCart] = useState<any[]>([]);
  
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

  const addToCart = (product: any, e: React.MouseEvent) => {
    // ১. অ্যানিমেশন ট্রিগার করা
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFlyingItem({ id: product.id, x: rect.left, y: rect.top });

    setTimeout(() => {
      setFlyingItem(null);
    }, 700); // অ্যানিমেশন শেষে মুছে ফেলা

    // ২. কার্টে যোগ করা
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, rate: product.purchasePrice }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

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
      
      {/* হেডার */}
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

      {/* মেইন কন্টেন্ট */}
      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 scrollbar-hide">
        
        {/* ================= স্টেপ ১: প্রোডাক্ট লিস্ট ================= */}
        {step === 1 && (
          <>
            {/* সার্চ বার */}
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="পণ্য খোজ করুন" className="w-full outline-none text-xs bg-transparent" />
                <div className="h-4 w-[1px] bg-gray-300"></div>
                <Filter size={16} className="text-gray-500" />
              </div>
              <button className="bg-white border border-gray-300 rounded-lg px-2 shadow-sm text-[#1E88E5]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg>
              </button>
            </div>

            {/* প্রোডাক্ট কার্ড */}
            <div className="flex flex-col gap-2">
              {products.map(prod => (
                <div key={prod.id} className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#0F2A3D] truncate">{prod.name}</h3>
                      <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span>স্টক: {toBangla(prod.stock)}</span>
                        <span className="text-[#DC2626]">বিক্রয়: ৳{toBangla(prod.salePrice)}</span>
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
              ))}
            </div>
          </>
        )}

        {/* ================= স্টেপ ২: কার্ট ================= */}
        {step === 2 && (
          <>
            {/* ব্যাচ ও চালান */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">ব্যাচ</label>
                <input type="text" value={batch} onChange={e => setBatch(e.target.value)} placeholder="ব্যাচ" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">চালান নং</label>
                <input type="text" value={challan} onChange={e => setChallan(e.target.value)} placeholder="চালান নং" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>

            {/* কার্ট আইটেম */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                         <span>{item.name}</span>
                      </div>
                      <div className="flex gap-1.5 mt-1 text-[9px]">
                         <button className="bg-gray-100 px-1 py-0.5 rounded flex items-center gap-0.5 text-gray-600"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="7" y="7" width="10" height="10" rx="1"></rect></svg> বারকোড</button>
                         <button className="bg-gray-100 px-1 py-0.5 rounded flex items-center gap-0.5 text-gray-600"><Calendar size={10}/> মেয়াদ</button>
                         <button className="bg-gray-100 px-1 py-0.5 rounded flex items-center gap-0.5 text-blue-600"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> এডিট</button>
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateQty(item.id, parseInt(e.target.value))}
                        className="w-10 text-center border rounded bg-gray-50 py-1 text-xs" 
                      />
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

            {/* টোটাল ও টগল */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2.5 flex flex-col gap-2 text-sm">
              <div className="flex justify-between font-bold text-base">
                <span>মোট</span>
                <span>৳ {toBangla(subTotal)}</span>
              </div>
              
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
                <span className="font-bold text-gray-700 text-xs">ডিসকাউন্ট</span>
                <button onClick={() => setDiscount(!discount)} className={`w-9 h-5 rounded-full relative transition-colors ${discount ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${discount ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
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
            <div className="text-center py-2">
              <span className="text-xs text-gray-500 font-bold">মোট প্রদেয়</span>
              <h2 className="text-3xl font-black text-[#1E88E5]">৳ {toBangla(subTotal)}</h2>
            </div>

            <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-[#1E88E5]">ক্যাশ দিয়েছি</label>
               <input 
                  type="number" 
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] font-bold text-lg shadow-sm"
                  placeholder={subTotal.toString()}
                />
            </div>

            {/* সাপ্লায়ার ও তারিখ */}
            <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700 mb-1 block">সাপ্লায়ার</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 outline-none bg-white text-sm">
                  <option value="">--সিলেক্ট--</option>
                  <option value="miyan">মিয়াঁন</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700">
                  <ImageIcon size={16}/> রিসিপ্টের ছবি
                </button>
                <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-700">
                  <Calendar size={16}/> {date}
                </div>
              </div>
            </div>

            {/* এসএমএস টগল */}
            <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-gray-200 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="bg-white p-1 rounded border"><Smartphone size={16} className="text-gray-500"/></div>
                 <span className="text-sm font-bold text-gray-700">এস এম এস এ রিসিপ্ট পাঠান</span>
               </div>
               <button onClick={() => setIsSmsEnabled(!isSmsEnabled)} className={`w-9 h-5 rounded-full relative transition-colors ${isSmsEnabled ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${isSmsEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
               </button>
            </div>

            {/* সাবস্ক্রিপশন লিংক */}
            <div className="border border-[#1E88E5] rounded-lg p-2 flex items-center gap-2 bg-[#EFF6FF]">
              <Info size={16} className="text-[#1E88E5]" />
              <span className="text-xs font-bold text-[#1E88E5]">সাবস্ক্রিপশন কিনতে এখানে ক্লিক করুন <ChevronRight size={14} className="inline"/></span>
            </div>

            {/* পেমেন্ট মেথড */}
            <div>
              <h3 className="font-bold text-sm mb-1">মূল্য পরিশোধ পদ্ধতি</h3>
              <p className="text-[11px] text-gray-500 mb-2">আপনার মূল্য পরিশোধের ধরন নির্বাচন করুন</p>
              <div className="flex flex-col gap-1.5">
                <PaymentMethod id="cash" label="নগদ টাকা" icon={Banknote} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="due" label="বাকি রাখুন" icon={CreditCard} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bkash" label="বিকাশ/নগদ কিউআর" icon={Smartphone} selected={paymentMethod} setSelected={setPaymentMethod} />
                <PaymentMethod id="bank" label="ব্যাংক চেক" icon={Building2} selected={paymentMethod} setSelected={setPaymentMethod} />
              </div>
            </div>

            {/* মন্তব্য */}
            <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="মন্তব্য লিখুন" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 outline-none focus:border-[#0B5C47] text-sm" />
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

             <div className="text-[11px] mb-2 leading-relaxed">
               <p><strong>নাম :</strong> [{supplier === 'miyan' ? 'মিয়াঁন' : 'দেওয়া হয়নি'}]</p>
               <p><strong>মোবাইল :</strong> [দেওয়া হয়নি]</p>
               <p><strong>ঠিকানা :</strong> [দেওয়া হয়নি]</p>
             </div>

             <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2">
                <div className="flex justify-between text-[11px] font-bold mb-1 border-b border-dashed border-gray-400 pb-1">
                  <span className="w-1/2">পণ্যের নাম</span>
                  <span className="w-1/6 text-center">দর</span>
                  <span className="w-1/6 text-center">পরিমাণ</span>
                  <span className="w-1/6 text-right">মোট দাম</span>
                </div>
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] py-0.5">
                    <span className="w-1/2">{i+1}. {item.name}</span>
                    <span className="w-1/6 text-center">{toBangla(item.rate)} ৳</span>
                    <span className="w-1/6 text-center">{toBangla(item.qty)}</span>
                    <span className="w-1/6 text-right">{toBangla(item.qty * item.rate)} ৳</span>
                  </div>
                ))}
             </div>

             <div className="flex flex-col gap-1 text-[11px] text-right pr-2">
                <div className="flex justify-between font-bold"><span>মোট:</span> <span>{toBangla(subTotal)} ৳</span></div>
                <div className="flex justify-between text-gray-600"><span>(+) ভ্যাট পরিমাণ:</span> <span>0.0</span></div>
                <div className="flex justify-between text-gray-600"><span>(-) ডিসকাউন্ট:</span> <span>০%</span></div>
                <div className="flex justify-between text-gray-600"><span>ডেলিভারি চার্জ:</span> <span>০ ৳</span></div>
                
                <div className="border-t border-dashed border-gray-400 mt-1 pt-1">
                  <div className="flex justify-between font-bold text-sm text-[#1E88E5]"><span>মোট প্রদেয়:</span> <span>{toBangla(subTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-[#0B5C47]"><span>দিয়েছি:</span> <span>{toBangla(paidAmount || subTotal)} ৳</span></div>
                  <div className="flex justify-between font-bold text-[#DC2626]"><span>এই লেনদেনের বাকি:</span> <span>{toBangla(subTotal - (parseInt(paidAmount) || subTotal))} ৳</span></div>
                </div>
             </div>

             <div className="text-[11px] mt-3 text-left">
               <p>মূল্যপরিশোধ পদ্ধতি: {paymentMethod === 'cash' ? 'নগদ টাকা' : paymentMethod === 'due' ? 'বাকি' : paymentMethod === 'bkash' ? 'বিকাশ' : 'ব্যাংক চেক'}</p>
               <p className="mt-1">নোটঃ {cart.map(c => c.name).join(', ')}</p>
             </div>

             <div className="text-center mt-6 text-[10px] text-gray-400">
               Powered by: Hisabee Business Manager
             </div>
             
             <div className="flex justify-center gap-8 mt-5">
               <button className="flex flex-col items-center gap-1 text-gray-700"><Printer size={26}/><span className="text-[11px] font-bold">রিসিপ্ট প্রিন্ট করুন</span></button>
               <button className="flex flex-col items-center gap-1 text-gray-700"><Share2 size={26}/><span className="text-[11px] font-bold">রিসিপ্ট শেয়ার</span></button>
             </div>
          </div>
        )}

      </main>

      {/* ================= স্টিকি বটম বার ================= */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
         {step === 1 && (
           <div className="flex justify-between items-center bg-[#1E88E5] text-white p-2 rounded-xl shadow-md">
             <div className="flex items-center gap-2 font-bold text-sm pl-1">
               <ShoppingBag size={18} /> পণ্য নির্বাচন করেছেন: {toBangla(cart.reduce((a,c)=>a+c.qty,0))}
             </div>
             <button onClick={() => setStep(2)} disabled={cart.length === 0} className="bg-white text-[#1E88E5] px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1 disabled:opacity-50">
               পণ্য কিনুন <ChevronRight size={18}/>
             </button>
           </div>
         )}

         {step === 2 && (
           <button onClick={() => setStep(3)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             এগিয়ে যান <ChevronRight size={18}/>
           </button>
         )}

         {step === 3 && (
           <button onClick={() => setStep(4)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
             পেমেন্ট কনফার্ম করুন <CheckCircle2 size={18}/>
           </button>
         )}

         {step === 4 && (
           <button onClick={onBack} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md">
             সম্পন্ন করুন
           </button>
         )}
      </div>

      {/* ================= ফ্লাইং অ্যানিমেশন (উড়ে এসে কার্টে যুক্ত হওয়া) ================= */}
      {flyingItem && (
        <div 
          className="fixed z-[999] w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-500 shadow-xl border border-amber-300 pointer-events-none"
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