import { useState } from 'react';
import { 
  ArrowLeft, Search, Trash2, Printer, Share2, 
  CheckCircle, Truck, Package, AlertTriangle, 
  ArrowRightLeft, CheckSquare, Users, UserPlus, Phone, 
  MapPin, X, FileText, PackageCheck, ShieldAlert
} from 'lucide-react';
import { toBangla } from '../lib/utils';

// ==============================================================
// 🎨 ইন্টারফেস
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

interface Dealer {
  id: number;
  name: string;
  phone: string;
  area: string;
  dueBalance: number;
  totalPaid: number;
}

interface InternalTransfer {
  id: string;
  source: string;
  destination: string;
  vehicle: string;
  date: string;
  items: TransferItem[];
  status: 'In-Transit' | 'Received';
}

interface PageProps {
  onBack: () => void;
}

export default function DepotPage({ onBack }: PageProps) {
  // ডামি ডেটা
  const depots = ["কেন্দ্রীয় গুদাম (হেড অফিস)", "গাজীপুর ডিপো", "সাভার ডিপো"];
  
  const products: DepotProduct[] = [
    { id: 1, name: "গ্রোয়ার ফিড (২৫ কেজি)", stockQty: 500, rate: 2050, unit: "বস্তা" },
    { id: 2, name: "রুই পোনা খাদ্য (১০ কেজি)", stockQty: 150, rate: 850, unit: "ব্যাগ" },
    { id: 3, name: "সরিষার খৈল (৫০ কেজি)", stockQty: 8, rate: 1750, unit: "বস্তা" },
    { id: 4, name: "চুন ও জীবানুনাশক", stockQty: 200, rate: 420, unit: "বস্তা" },
  ];

  const [dealers, setDealers] = useState<Dealer[]>([
    { id: 1, name: "ভাই ভাই এগ্রো", phone: "01711000001", area: "গাজীপুর", dueBalance: 15000, totalPaid: 50000 },
    { id: 2, name: "মোল্লা পোল্ট্রি", phone: "01711000002", area: "সাভার", dueBalance: 8000, totalPaid: 120000 },
  ]);

  // স্টেট ম্যানেজমেন্ট (নতুন ক্রম অনুযায়ী)
  // 0: Stock, 1: Dealer List, 2: Dealer Transfer, 3: Receive, 4: Internal
  const [activeTab, setActiveTab] = useState(0); 
  const [selectedDepot, setSelectedDepot] = useState(depots[0]);
  
  // ট্রান্সফার স্টেট
  const [selectedDealer, setSelectedDealer] = useState(dealers[0].name);
  const [vehicleNo, setVehicleNo] = useState("");
  const [transferCart, setTransferCart] = useState<TransferItem[]>([]);
  const [isGatePassReady, setIsGatePassReady] = useState(false);

  // ইন্টারনাল ট্রান্সফার স্টেট
  const [destDepot, setDestDepot] = useState(depots[1]);
  const [internalCart, setInternalCart] = useState<TransferItem[]>([]);
  const [internalTransfers, setInternalTransfers] = useState<InternalTransfer[]>([]);

  // রিসিভ ও ড্যামেজ স্টেট
  const [receivingTransfer, setReceivingTransfer] = useState<InternalTransfer | null>(null);
  const [receiveData, setReceiveData] = useState<Record<number, { received: number, damaged: number }>>({});

  // ডিলার অ্যাড স্টেট
  const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);
  const [dealerForm, setDealerForm] = useState({ name: '', phone: '', area: '', openingDue: '' });

  // ডিলার লেজার স্টেট
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedLedgerDealer, setSelectedLedgerDealer] = useState<Dealer | null>(null);

  const challanNo = "DC-8092";
  const currentDate = "০৭ নভেম্বর, ২০২৬";

  // --- হেল্পার ফাংশন ---
  const addToCart = (prod: DepotProduct, cartType: 'dealer' | 'internal') => {
    if (cartType === 'dealer') {
      const existing = transferCart.find(item => item.id === prod.id);
      if (existing) setTransferCart(transferCart.map(item => item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
      else setTransferCart([...transferCart, { ...prod, quantity: 1 }]);
    } else {
      const existing = internalCart.find(item => item.id === prod.id);
      if (existing) setInternalCart(internalCart.map(item => item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
      else setInternalCart([...internalCart, { ...prod, quantity: 1 }]);
    }
  };

  const updateQty = (index: number, val: number, cartType: 'dealer' | 'internal') => {
    if (cartType === 'dealer') {
      const updated = [...transferCart];
      updated[index].quantity = Math.max(1, val); 
      setTransferCart(updated);
    } else {
      const updated = [...internalCart];
      updated[index].quantity = Math.max(1, val); 
      setInternalCart(updated);
    }
  };

  const removeProduct = (index: number, cartType: 'dealer' | 'internal') => {
    if (cartType === 'dealer') setTransferCart(transferCart.filter((_, i) => i !== index));
    else setInternalCart(internalCart.filter((_, i) => i !== index));
  };

  // --- অ্যাকশন হ্যান্ডলার ---
  const handleConfirmDealerChallan = () => {
    if (transferCart.length === 0) return alert("দয়া করে অন্তত একটি মাল ফর্দিতে যোগ করুন!");
    if (!vehicleNo.trim()) return alert("দয়া করে গাড়ির নম্বর দিন!");
    setIsGatePassReady(true);
  };

  const handleConfirmInternalTransfer = () => {
    if (internalCart.length === 0) return alert("দয়া করে মাল ফর্দিতে যোগ করুন!");
    if (selectedDepot === destDepot) return alert("সোর্স এবং ডেস্টিনেশন ডিপো একই হতে পারে না!");
    
    const newTransfer: InternalTransfer = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      source: selectedDepot,
      destination: destDepot,
      vehicle: vehicleNo || 'অজানা',
      date: currentDate,
      items: internalCart,
      status: 'In-Transit'
    };
    
    setInternalTransfers([newTransfer, ...internalTransfers]);
    setInternalCart([]);
    setVehicleNo("");
    alert("ইন্টারনাল ট্রান্সফার সফল হয়েছে! মালটি এখন ট্রানজিটে আছে।");
    setActiveTab(3); // রিসিভ ট্যাবে চলে যাবে (নতুন ক্রম অনুযায়ী 3 হলো রিসিভ)
  };

  const handleOpenReceiveModal = (transfer: InternalTransfer) => {
    setReceivingTransfer(transfer);
    const initialData: Record<number, { received: number, damaged: number }> = {};
    transfer.items.forEach(item => {
      initialData[item.id] = { received: item.quantity, damaged: 0 };
    });
    setReceiveData(initialData);
  };

  const handleConfirmReceive = () => {
    if (!receivingTransfer) return;
    
    const totalReceived = Object.values(receiveData).reduce((acc, curr) => acc + curr.received, 0);
    const totalDamaged = Object.values(receiveData).reduce((acc, curr) => acc + curr.damaged, 0);
    
    setInternalTransfers(internalTransfers.map(t => 
      t.id === receivingTransfer.id ? { ...t, status: 'Received' } : t
    ));
    
    alert(`মাল সফলভাবে রিসিভ করা হয়েছে!\nরিসিভ: ${totalReceived} টি\nড্যামেজ: ${totalDamaged} টি`);
    setReceivingTransfer(null);
  };

  const handleSaveDealer = () => {
    if (!dealerForm.name || !dealerForm.phone) return alert('ডিলারের নাম এবং ফোন নম্বর আবশ্যক');
    const newDealer: Dealer = {
      id: Date.now(),
      name: dealerForm.name,
      phone: dealerForm.phone,
      area: dealerForm.area,
      dueBalance: Number(dealerForm.openingDue) || 0,
      totalPaid: 0
    };
    setDealers([...dealers, newDealer]);
    setIsAddDealerModalOpen(false);
    setDealerForm({ name: '', phone: '', area: '', openingDue: '' });
  };

  // ফিল্টার
  const pendingReceives = internalTransfers.filter(t => t.destination === selectedDepot && t.status === 'In-Transit');

  return (
    <div className="min-h-screen bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col">
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#1B5E20] via-[#00796B] to-[#0D3B80] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => isGatePassReady ? setIsGatePassReady(false) : onBack()} className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer">
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
              <select value={selectedDepot} onChange={(e) => setSelectedDepot(e.target.value)} className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer">
                {depots.map(d => <option key={d} value={d} className="text-black">{d}</option>)}
              </select>
            </div>
          )}
        </div>
        
        {/* নেভিগেশন ট্যাব (নতুন ক্রম অনুযায়ী) */}
        {!isGatePassReady && (
          <div className="flex overflow-x-auto scrollbar-hide bg-black/20 px-2 py-1.5">
            {[
              { id: 0, title: "ডিপো স্টক", icon: Package },
              { id: 1, title: "ডিলার তথ্য", icon: Users },
              { id: 2, title: "ডিলার ট্রান্সফার", icon: Truck },
              { id: 3, title: "রিসিভ ড্যামেজ", icon: AlertTriangle },
              { id: 4, title: "ইন্টারনাল ট্রান্সফার", icon: ArrowRightLeft }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === tab.id ? "bg-white text-[#0D3B80] shadow" : "text-white/80 hover:bg-white/10"}`}>
                <tab.icon size={14} /> <span>{tab.title}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 flex flex-col gap-3 pb-12">
        
        {/* ================= ১. ট্যাব: ডিপো স্টক (id: 0) ================= */}
        {activeTab === 0 && !isGatePassReady && (
          <div className="bg-white rounded-xl border border-[#D3E4DB] shadow-sm overflow-hidden">
            <div className="bg-[#E2E7E5] px-3.5 py-2 flex items-center justify-between border-b border-[#D3E4DB]">
              <span className="font-bold text-sm text-[#0F2A3D]">মজুদ বিবরণী ({selectedDepot})</span>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ২. ট্যাব: ডিলার তথ্য / লিস্ট (id: 1) ================= */}
        {activeTab === 1 && !isGatePassReady && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm shrink-0">
              <div className="font-bold text-sm text-gray-800">মোট ডিলার: {toBangla(dealers.length)} জন</div>
              <button onClick={() => setIsAddDealerModalOpen(true)} className="bg-[#1E88E5] text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 active:scale-95 transition">
                <UserPlus size={14}/> নতুন ডিলার
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {dealers.map(dealer => (
                <div key={dealer.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{dealer.name}</h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={12}/> {toBangla(dealer.phone)}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={12}/> {dealer.area}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500">বর্তমান বাকি</p>
                      <p className={`font-black text-sm ${dealer.dueBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>৳ {toBangla(dealer.dueBalance)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedLedgerDealer(dealer); setIsLedgerModalOpen(true); }} className="w-full mt-1 bg-[#EFF6FF] border border-[#1E88E5]/30 text-[#1E88E5] py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 active:scale-95 transition">
                    <FileText size={14}/> লেজার দেখুন
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ৩. ট্যাব: ডিলার ট্রান্সফার (id: 2) ================= */}
        {activeTab === 2 && !isGatePassReady && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">ডিলার</label>
                  <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none">
                    {dealers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">গাড়ির নম্বর <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="যেমন: ঢাকা-ট ১১-XXXX" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5F7387]" />
                <input type="text" placeholder="পণ্যের নাম খুঁজুন..." className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {products.map(product => (
                  <div key={product.id} onClick={() => addToCart(product, 'dealer')} className="bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-[#43A047] active:scale-95 transition">
                    <div>
                      <h4 className="text-[11px] font-bold text-[#0F2A3D]">{product.name}</h4>
                      <span className="text-[9px] text-[#5F7387]">স্টক: {toBangla(product.stockQty)}</span>
                    </div>
                    <span className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded font-bold">+ যোগ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D3E4DB] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#E2E7E5] px-3 py-1.5 border-b border-[#D3E4DB]">
                <h3 className="font-bold text-xs text-[#0F2A3D]">ডেলিভারি ফর্দি ({toBangla(transferCart.length)}টি)</h3>
              </div>
              <div className="divide-y divide-[#EFF6F3]">
                {transferCart.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 items-center px-2 py-1.5 hover:bg-[#FAFDFB]">
                    <div className="col-span-6 font-bold text-[11px] text-[#0F2A3D] truncate pr-1">{item.name}</div>
                    <div className="col-span-4 flex justify-center items-center gap-1">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(index, parseFloat(e.target.value) || 1, 'dealer')} className="w-12 bg-white border border-[#D3E4DB] rounded px-1 py-0.5 text-center text-[11px] font-bold outline-none" />
                      <span className="text-[9px] text-[#5F7387]">{item.unit}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeProduct(index, 'dealer')} className="text-red-500 p-1"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {transferCart.length === 0 && <div className="p-4 text-center text-xs text-gray-500">ফর্দিতে কোনো মাল নেই</div>}
              </div>
            </div>

            <button onClick={handleConfirmDealerChallan} className="w-full bg-[#0D3B80] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer">
              <CheckCircle size={16} /> <span className="text-sm">চালান কনফার্ম ও গেট-পাস তৈরি</span>
            </button>
          </div>
        )}

        {/* ================= ৪. ট্যাব: রিসিভ ড্যামেজ (id: 3) ================= */}
        {activeTab === 3 && !isGatePassReady && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm text-[#0F2A3D]">আগত মালের তালিকা</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">গন্তব্য: {selectedDepot}</p>
              </div>
              <span className="bg-[#EFF6FF] text-[#1E88E5] px-2 py-1 rounded text-xs font-bold border border-[#1E88E5]/30">
                পেন্ডিং: {toBangla(pendingReceives.length)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {pendingReceives.length === 0 ? (
                <div className="bg-white border border-gray-200 p-8 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <PackageCheck size={40} className="text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-700 text-sm">কোনো মাল পেন্ডিং নেই</h3>
                  <p className="text-[10px] text-gray-500 mt-1">এই মুহূর্তে কোনো ডিপো থেকে মাল আসেনি।</p>
                </div>
              ) : (
                pendingReceives.map(transfer => (
                  <div key={transfer.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#0D3B80] bg-[#EFF6FF] px-1.5 py-0.5 rounded">চালান: {transfer.id}</span>
                        <p className="text-xs font-bold text-gray-800 mt-1">থেকে: {transfer.source}</p>
                        <p className="text-[10px] text-gray-500">তারিখ: {toBangla(transfer.date)} | গাড়ি: {transfer.vehicle}</p>
                      </div>
                      <button onClick={() => handleOpenReceiveModal(transfer)} className="bg-[#43A047] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition">
                        রিসিভ করুন
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {transfer.items.map((item, idx) => (
                        <span key={idx} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                          {item.name} ({toBangla(item.quantity)})
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= ৫. ট্যাব: ইন্টারনাল ট্রান্সফার (id: 4) ================= */}
        {activeTab === 4 && !isGatePassReady && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#EFF6F3]">
                <ArrowRightLeft size={16} className="text-[#0D3B80]" />
                <h3 className="font-bold text-xs text-[#0F2A3D]">ডিপো ট্রান্সফার তথ্য</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">কোথা থেকে (Source)</label>
                  <input type="text" disabled value={selectedDepot} className="w-full bg-gray-100 border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-600" />
                </div>
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">কোথায় যাবে (Destination) <span className="text-red-500">*</span></label>
                  <select value={destDepot} onChange={(e) => setDestDepot(e.target.value)} className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none">
                    {depots.filter(d => d !== selectedDepot).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5F7387] font-bold block mb-1">গাড়ির নম্বর</label>
                  <input type="text" placeholder="যেমন: ঢাকা-ট ১১-XXXX" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0F2A3D] focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D3E4DB] p-3 shadow-sm flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {products.map(product => (
                  <div key={product.id} onClick={() => addToCart(product, 'internal')} className="bg-[#F5FAF7] border border-[#D3E4DB] rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-[#43A047] active:scale-95 transition">
                    <div>
                      <h4 className="text-[11px] font-bold text-[#0F2A3D]">{product.name}</h4>
                      <span className="text-[9px] text-[#5F7387]">স্টক: {toBangla(product.stockQty)}</span>
                    </div>
                    <span className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded font-bold">+ যোগ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#D3E4DB] shadow-sm overflow-hidden flex flex-col">
              <div className="bg-[#E2E7E5] px-3 py-1.5 border-b border-[#D3E4DB]">
                <h3 className="font-bold text-xs text-[#0F2A3D]">ট্রান্সফার ফর্দি ({toBangla(internalCart.length)}টি)</h3>
              </div>
              <div className="divide-y divide-[#EFF6F3]">
                {internalCart.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 items-center px-2 py-1.5 hover:bg-[#FAFDFB]">
                    <div className="col-span-6 font-bold text-[11px] text-[#0F2A3D] truncate pr-1">{item.name}</div>
                    <div className="col-span-4 flex justify-center items-center gap-1">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(index, parseFloat(e.target.value) || 1, 'internal')} className="w-12 bg-white border border-[#D3E4DB] rounded px-1 py-0.5 text-center text-[11px] font-bold outline-none" />
                      <span className="text-[9px] text-[#5F7387]">{item.unit}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeProduct(index, 'internal')} className="text-red-500 p-1"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {internalCart.length === 0 && <div className="p-4 text-center text-xs text-gray-500">ফর্দিতে কোনো মাল নেই</div>}
              </div>
            </div>

            <button onClick={handleConfirmInternalTransfer} className="w-full bg-[#00796B] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer">
              <ArrowRightLeft size={16} /> <span className="text-sm">মাল পাঠান (ট্রানজিটে দিন)</span>
            </button>
          </div>
        )}

        {/* ================= গেট-পাস প্রিন্ট ভিউ (ডিলার) ================= */}
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
                  <span>গাড়ি নং: {vehicleNo}</span>
                  <span>তারিখ: {currentDate}</span>
                </div>
              </div>
              <div className="py-2 border-b border-dashed border-gray-400">
                <table className="w-full text-[11px]">
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
                <span>{toBangla(transferCart.reduce((a,c)=>a+c.quantity, 0))}</span>
              </div>
            </div>

            <div className="flex w-full max-w-lg gap-2 mt-2">
              <button onClick={() => window.print()} className="flex-1 bg-[#0D3B80] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer">
                <Printer size={15} /> <span>প্রিন্ট</span>
              </button>
              <button className="flex-1 bg-[#00796B] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer">
                <Share2 size={15} /> <span>শেয়ার</span>
              </button>
            </div>
            <button onClick={() => { setTransferCart([]); setIsGatePassReady(false); setActiveTab(2); }} className="w-full max-w-lg bg-white border-2 border-[#1B5E20] text-[#1B5E20] py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#E8F5E9] mt-1">
              <CheckSquare size={16} /> <span>ডেলিভারি সম্পন্ন করুন</span>
            </button>
          </div>
        )}
      </main>

      {/* ================= মডাল: নতুন ডিলার ================= */}
      {isAddDealerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm">নতুন ডিলার যুক্ত করুন</h2>
              <button onClick={() => setIsAddDealerModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ডিলারের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={dealerForm.name} onChange={e => setDealerForm({...dealerForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ফোন নম্বর <span className="text-red-500">*</span></label>
                  <input type="text" value={dealerForm.phone} onChange={e => setDealerForm({...dealerForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">এলাকা</label>
                  <input type="text" value={dealerForm.area} onChange={e => setDealerForm({...dealerForm, area: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">পূর্বের বাকি (ঐচ্ছিক)</label>
                <input type="number" value={dealerForm.openingDue} onChange={e => setDealerForm({...dealerForm, openingDue: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsAddDealerModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveDealer} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: ডিলার লেজার ================= */}
      {isLedgerModalOpen && selectedLedgerDealer && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[80dvh] sm:h-[70vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="font-bold text-sm">ডিলার লেজার</h2>
                <p className="text-[10px] text-cyan-200">{selectedLedgerDealer.name}</p>
              </div>
              <button onClick={() => setIsLedgerModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-3 bg-white border-b shrink-0 flex gap-2">
              <div className="flex-1 bg-[#FEE2E2] border border-red-200 rounded-lg p-2 text-center">
                <p className="text-[10px] font-bold text-red-600">মোট বাকি</p>
                <p className="font-black text-red-600 text-base">{toBangla(selectedLedgerDealer.dueBalance)} ৳</p>
              </div>
              <div className="flex-1 bg-[#DCFCE7] border border-green-200 rounded-lg p-2 text-center">
                <p className="text-[10px] font-bold text-green-600">মোট পরিশোধ</p>
                <p className="font-black text-green-600 text-base">{toBangla(selectedLedgerDealer.totalPaid)} ৳</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <h3 className="font-bold text-xs text-gray-600">লেনদেনের ইতিহাস</h3>
              {[1, 2].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-gray-800">চালান #{1000 + i}</p>
                    <p className="text-[10px] text-gray-500">০৭ নভেম্বর, ২৬</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500 text-xs">৳ {toBangla(5000)}</p>
                    <p className="text-[10px] text-gray-500">বাকি</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-white border-t shrink-0">
              <button onClick={() => alert('টাকা জমা নেওয়ার পপআপ')} className="w-full bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">টাকা জমা নিন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: রিসিভ ও ড্যামেজ ================= */}
      {receivingTransfer && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="font-bold text-sm flex items-center gap-1.5"><PackageCheck size={16}/> রিসিভ করুন</h2>
                <p className="text-[10px] text-cyan-200">চালান: {receivingTransfer.id} (থেকে: {receivingTransfer.source})</p>
              </div>
              <button onClick={() => setReceivingTransfer(null)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-[10px] text-blue-700 flex items-start gap-1.5">
                <ShieldAlert size={14} className="shrink-0 mt-0.5"/>
                <p>মালের পরিমাণ ঠিক থাকলে 'রিসিভড' ঘরে মোট পরিমাণ লিখুন। কোনো মাল নষ্ট হলে 'ড্যামেজ' ঘরে তার পরিমাণ লিখুন।</p>
              </div>

              {receivingTransfer.items.map((item, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                  <h4 className="font-bold text-sm text-gray-800 mb-2">{item.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 mb-1 block">রিসিভড (পাঠানো: {toBangla(item.quantity)})</label>
                      <input 
                        type="number" 
                        value={receiveData[item.id]?.received || 0}
                        onChange={(e) => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], received: Number(e.target.value) } })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-green-700 outline-none focus:border-green-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-red-500 mb-1 block">ড্যামেজ</label>
                      <input 
                        type="number" 
                        value={receiveData[item.id]?.damaged || 0}
                        onChange={(e) => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], damaged: Number(e.target.value) } })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm font-bold text-red-700 outline-none focus:border-red-500" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-white border-t shrink-0 flex gap-2">
              <button onClick={() => setReceivingTransfer(null)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleConfirmReceive} className="flex-1 bg-[#43A047] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1">
                <CheckCircle size={16}/> রিসিভ কনফার্ম
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}