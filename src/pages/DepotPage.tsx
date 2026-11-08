import { useState } from 'react';
import { 
  ArrowLeft, Search, QrCode, Trash2, Printer, Share2, 
  CheckCircle, Building2, Truck, Package, AlertTriangle, 
  ArrowRightLeft, CheckSquare
} from 'lucide-react';
import { toBangla } from '../lib/utils';

// ==============================================================
// 🎨 থিম কালার ও ইন্টারফেস
// ==============================================================
interface DepotProduct {
  id: number;
  name: string;
  stockQty: number;
  rate: number;
  unit: string;
}

interface TransferItem {
  id: number;
  name: string;
  quantity: number;
  rate: number;
  unit: string;
}

interface PageProps {
  onBack: () => void;
}

export default function DepotPage({ onBack }: PageProps) {
  // ডামি ডেটা
  const depots = ["কেন্দ্রীয় গুদাম (হেড অফিস)", "গাজীপুর ডিপো", "সাভার ডিপো"];
  const dealers = ["ভাই ভাই এগ্রো (গাজীপুর)", "মোল্লা পোল্ট্রি (সাভার)", "বিসমিল্লাহ ফিড (ময়মনসিংহ)"];
  
  const products: DepotProduct[] = [
    { id: 1, name: "গ্রোয়ার ফিড (২৫ কেজি)", stockQty: 500, rate: 2050, unit: "বস্তা" },
    { id: 2, name: "রুই পোনা খাদ্য (১০ কেজি)", stockQty: 150, rate: 850, unit: "ব্যাগ" },
    { id: 3, name: "সরিষার খৈল (৫০ কেজি)", stockQty: 8, rate: 1750, unit: "বস্তা" }, // Low stock
    { id: 4, name: "চুন ও জীবানুনাশক", stockQty: 200, rate: 420, unit: "বস্তা" },
    { id: 5, name: "ভিটামিন ও গ্রোথ প্রিমিক্স", stockQty: 4, rate: 360, unit: "প্যাক" } // Low stock
  ];

  // স্টেট ম্যানেজমেন্ট
  const [activeTab, setActiveTab] = useState(1); // 0: Stock, 1: Dealer Transfer, 2: Internal, 3: Receive
  const [selectedDepot, setSelectedDepot] = useState(depots[0]);
  
  // ডিলার ট্রান্সফার স্টেট
  const [selectedDealer, setSelectedDealer] = useState(dealers[0]);
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [transferCart, setTransferCart] = useState<TransferItem[]>([]);
  const [isGatePassReady, setIsGatePassReady] = useState(false);
  
  const challanNo = "DC-8092";
  const currentDate = "০৭ নভেম্বর, ২০২৬";

  // হিসাব নিকাশ
  const totalItems = transferCart.length;
  const totalQty = transferCart.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = transferCart.reduce((acc, item) => acc + (item.quantity * item.rate), 0);

  const handleAddProduct = (prod: DepotProduct) => {
    const existing = transferCart.find(item => item.id === prod.id);
    if (existing) {
      setTransferCart(transferCart.map(item => 
        item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setTransferCart([...transferCart, { id: prod.id, name: prod.name, quantity: 1, rate: prod.rate, unit: prod.unit }]);
    }
  };

  const updateQty = (index: number, val: number) => {
    const updated = [...transferCart];
    // মাইনাস ভ্যালু আটকানোর জন্য Math.max ব্যবহার করা হয়েছে
    updated[index].quantity = Math.max(1, val); 
    setTransferCart(updated);
  };

  const removeProduct = (index: number) => {
    setTransferCart(transferCart.filter((_, i) => i !== index));
  };

  // চালান কনফার্ম করার লজিক (ভ্যালিডেশন সহ)
  const handleConfirmChallan = () => {
    if (transferCart.length === 0) {
      return alert("দয়া করে অন্তত একটি মাল ফর্দিতে যোগ করুন!");
    }
    if (!vehicleNo.trim()) {
      return alert("দয়া করে গাড়ির নম্বর দিন!");
    }
    setIsGatePassReady(true);
  };

  // ডেলিভারি সম্পন্ন করার লজিক (স্টেট ক্লিয়ার সহ)
  const handleCompleteDelivery = () => {
    alert("চালান সফল! ডিপো স্টক কমে গেছে এবং ডিলারের খাতায় ব্যালেন্স যোগ হয়েছে।");
    
    // ডাটা ক্লিয়ার করা হচ্ছে
    setTransferCart([]);
    setVehicleNo("");
    setDriverPhone("");
    setSearchQuery("");
    setIsGatePassReady(false);
    setActiveTab(1); // ডিফল্ট ট্যাবে ফেরত যাবে
    
    onBack(); // ড্যাশবোর্ডে ফিরে যাবে
  };

  return (
    <div className="min-h-screen bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col">
      {/* ১. প্রিমিয়াম হেডার */}
      <header className="bg-gradient-to-r from-[#1B5E20] via-[#00796B] to-[#0D3B80] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => isGatePassReady ? setIsGatePassReady(false) : onBack()} 
              className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">
                {isGatePassReady ? "ডেলিভারি চালান (গেট-পাস)" : "ডিপো ও ডিস্ট্রিবিউশন"}
              </h2>
              <p className="text-[10px] text-cyan-200">DREAM AGRO & FISHERIES</p>
            </div>
          </div>
          {!isGatePassReady && (
            <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
              <select 
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
              >
                {depots.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
              </select>
            </div>
          )}
        </div>
        
        {/* টপ নেভিগেশন ট্যাব */}
        {!isGatePassReady && (
          <div className="flex overflow-x-auto scrollbar-hide bg-black/20 px-2 py-1.5">
            {[
              { id: 0, title: "বর্তমান স্টক", icon: Package },
              { id: 1, title: "ডিলার ট্রান্সফার", icon: Truck },
              { id: 2, title: "ইন্টারনাল ট্রান্সফার", icon: ArrowRightLeft },
              { id: 3, title: "রিসিভ ও ড্যামেজ", icon: AlertTriangle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id ? "bg-white text-[#0D3B80] shadow" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 flex flex-col gap-3 pb-12">
        
        {/* ==============================================================
            ট্যাব ১: বর্তমান স্টক (Current Stock)
        ============================================================== */}
        {activeTab === 0 && !isGatePassReady && (
          <div className="bg-white rounded-xl border border-[#D3E4DB] shadow-sm overflow-hidden">
            <div className="bg-[#E2E7E5] px-3.5 py-2 flex items-center justify-between border-b border-[#D3E4DB]">
              <span className="font-bold text-sm text-[#0F2A3D]">মজুদ বিবরণী ({selectedDepot})</span>
              <span className="text-[11px] font-bold text-[#1B5E20]">মোট ভ্যালু: ৳ {toBangla("1550000")}</span>
            </div>
            <div className="p-3 grid gap-2">
              {products.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg">
                  <div>
                    <h4 className="font-bold text-xs text-[#0F2A3D]">{p.name}</h4>
                    <span className="text-[10px] text-gray-500">ভ্যালু: ৳ {toBangla(p.stockQty * p.rate)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black text-sm ${p.stockQty < 10 ? 'text-red-600' : 'text-[#1B5E20]'}`}>
                      {toBangla(p.stockQty)} {p.unit}
                    </span>
                    {p.stockQty < 10 && <span className="block text-[9px] text-red-500 font-bold">লো-স্টক</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================
            ট্যাব ২: ডিলার ট্রান্সফার (Dealer Dispatch)
        ============================================================== */}
        {activeTab === 1 && !isGatePassReady && (
          <div className="flex flex-col gap-3">
            {/* ডিলার ও পরিবহন তথ্য */}
            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EFF6F3]">
                <Building2 size={16} className="text-[#0D3B80]" />
                <h3 className="font-bold text-xs sm:text-sm text-[#0F2A3D]">ডিলার ও পরিবহন তথ্য</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">ডিলার / সাব-ডিলার</label>
                  <select 
                    value={selectedDealer}
                    onChange={(e) => setSelectedDealer(e.target.value)}
                    className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none"
                  >
                    {dealers.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">গাড়ির নম্বর <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="যেমন: ঢাকা-ট ১১-XXXX"
                    value={vehicleNo} 
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">ড্রাইভারের ফোন</label>
                  <input 
                    type="text" 
                    placeholder="মোবাইল নম্বর..."
                    value={driverPhone} 
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* পণ্য নির্বাচন */}
            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F2A3D]">পণ্য নির্বাচন করুন</span>
                <button className="flex items-center gap-1 text-[10px] font-bold text-[#1565C0]">
                  <QrCode size={14} /> <span>স্ক্যান</span>
                </button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F7387]" />
                <input 
                  type="text"
                  placeholder="পণ্যের নাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#0F2A3D] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {products.filter(p => p.name.includes(searchQuery)).map(product => (
                  <div 
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-[#43A047] active:scale-95 transition"
                  >
                    <div>
                      <h4 className="text-[11px] font-bold text-[#0F2A3D]">{product.name}</h4>
                      <span className="text-[9px] text-[#5F7387]">স্টক: {toBangla(product.stockQty)}</span>
                    </div>
                    <span className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded font-bold">+ যোগ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* লাইভ ফর্দি */}
            <div className="bg-white rounded-xl border border-[#D3E4DB] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#E2E7E5] px-3 py-1.5 flex items-center justify-between border-b border-[#D3E4DB]">
                <h3 className="font-bold text-xs text-[#0F2A3D]">ডেলিভারি ফর্দি ({toBangla(totalItems)}টি)</h3>
                <span className="text-[10px] text-[#5F7387]">পরিমাণ বক্সে এডিট করুন</span>
              </div>

              <div className="grid grid-cols-12 bg-[#F5FAF7] px-2 py-1.5 text-[10px] font-bold text-[#5F7387] border-b border-[#D3E4DB]">
                <div className="col-span-1 text-center">ক্র.</div>
                <div className="col-span-6">পণ্যের নাম</div>
                <div className="col-span-3 text-center">পরিমাণ</div>
                <div className="col-span-2 text-center">মুছুন</div>
              </div>

              <div className="divide-y divide-[#EFF6F3]">
                {transferCart.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-gray-500">ফর্দিতে কোনো মাল নেই।</div>
                ) : (
                  transferCart.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 items-center px-2 py-1.5 hover:bg-[#FAFDFB]">
                      <div className="col-span-1 text-center text-[10px] font-semibold">{toBangla(index + 1)}</div>
                      <div className="col-span-6 font-bold text-[11px] text-[#0F2A3D] truncate pr-1">{item.name}</div>
                      
                      <div className="col-span-3 flex justify-center items-center gap-1">
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQty(index, parseFloat(e.target.value) || 1)}
                          className="w-12 bg-white border border-[#D3E4DB] rounded px-1 py-0.5 text-center text-[11px] font-bold text-[#0F2A3D] outline-none"
                        />
                        <span className="text-[9px] text-[#5F7387]">{item.unit}</span>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <button onClick={() => removeProduct(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-[#F5FAF7] p-2.5 flex flex-col gap-1 border-t border-[#D3E4DB]">
                <div className="flex justify-between text-xs font-bold text-[#0F2A3D]">
                  <span>মোট পরিমাণ: {toBangla(totalQty)} টি/বস্তা</span>
                  <span>মালের ভ্যালু: ৳ {toBangla(totalValue)}</span>
                </div>
                <p className="text-[9px] text-[#D32F2F] font-semibold text-right">
                  (এই ভ্যালু ডিলারের খাতায় বকেয়া হিসেবে যাবে)
                </p>
              </div>
            </div>

            {/* সাবমিট বাটন (ভ্যালিডেশন সহ) */}
            <button
              onClick={handleConfirmChallan}
              className="w-full bg-[#0D3B80] hover:bg-[#1565C0] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <CheckCircle size={16} />
              <span className="text-sm">চালান কনফার্ম ও গেট-পাস তৈরি</span>
            </button>
          </div>
        )}

        {/* ==============================================================
            ট্যাব ৩ ও ৪: অন্যান্য (অসম্পূর্ণ মডিউলগুলো)
        ============================================================== */}
        {(activeTab === 2 || activeTab === 3) && !isGatePassReady && (
          <div className="bg-white rounded-xl border border-[#D3E4DB] p-10 flex flex-col items-center justify-center text-center shadow-sm mt-4">
            <AlertTriangle size={32} className="text-amber-500 mb-3" />
            <h3 className="font-bold text-sm text-[#0F2A3D]">এই মডিউলটির কাজ চলমান</h3>
            <p className="text-[10px] text-gray-500 mt-1">খুব শীঘ্রই এই ফিচারটি যুক্ত হবে।</p>
          </div>
        )}

        {/* ==============================================================
            গেট-পাস প্রিন্ট ভিউ (ফাইনাল ডেলিভারি চালান)
        ============================================================== */}
        {isGatePassReady && (
          <div className="flex flex-col gap-3 items-center">
            <div className="w-full max-w-lg bg-white border border-gray-400 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col">
              
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <h2 className="text-lg sm:text-xl font-black text-[#1B5E20]">DREAM AGRO & FISHERIES</h2>
                <h3 className="text-xs font-bold text-[#0F2A3D] mt-1">ডেলিভারি চালান / গেট-পাস</h3>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold text-[#0F2A3D]">ডিলার: {selectedDealer}</span>
                  <span className="font-bold">চালান নং: {challanNo}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>গাড়ি নং: {vehicleNo || "দেওয়া হয়নি"}</span>
                  <span>তারিখ: {currentDate}</span>
                </div>
                <div className="text-gray-600">
                  <span>ড্রাইভার: {driverPhone || "দেওয়া হয়নি"}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-1 text-left w-8">ক্র.</th>
                      <th className="py-1 text-left">পণ্যের বিবরণ</th>
                      <th className="py-1 text-right">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transferCart.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 font-semibold text-[#0F2A3D]">{toBangla(idx + 1)}.</td>
                        <td className="py-1 font-bold text-[#0F2A3D]">{item.name}</td>
                        <td className="py-1 text-right font-black text-[#1B5E20]">{toBangla(item.quantity)} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2 flex justify-between font-black text-xs text-[#0D3B80]">
                <span>সর্বমোট পরিমাণ:</span>
                <span>{toBangla(totalQty)} পিস/বস্তা</span>
              </div>

              <div className="pt-6 flex justify-between text-[10px] text-gray-500 font-bold mt-4">
                <span className="border-t border-gray-400 pt-1 px-2">ডেলিভারি ইনচার্জ</span>
                <span className="border-t border-gray-400 pt-1 px-2">গ্রহীতার স্বাক্ষর</span>
              </div>
            </div>

            {/* অ্যাকশন বাটন */}
            <div className="flex w-full max-w-lg gap-2 mt-2">
              <button onClick={() => window.print()} className="flex-1 bg-[#0D3B80] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer hover:bg-[#1565C0]">
                <Printer size={15} /> <span>গেট-পাস প্রিন্ট</span>
              </button>
              <button className="flex-1 bg-[#00796B] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer hover:bg-[#00897B]">
                <Share2 size={15} /> <span>শেয়ার করুন</span>
              </button>
            </div>

            {/* ডেলিভারি সম্পন্ন বাটন (স্টেট ক্লিয়ার সহ) */}
            <button 
              onClick={handleCompleteDelivery}
              className="w-full max-w-lg bg-white border-2 border-[#1B5E20] text-[#1B5E20] py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E8F5E9] mt-1"
            >
              <CheckSquare size={16} /> <span>ডেলিভারি সম্পন্ন করুন</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}