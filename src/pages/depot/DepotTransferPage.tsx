import { useState, useEffect, } from 'react';
import { 
  ArrowLeft, Trash2, Printer, Share2, 
  CheckCircle, Truck, AlertTriangle, 
  ArrowRightLeft, CheckSquare, 
 X, PackageCheck, ShieldAlert, Loader2
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoDepotDealers, demoInternalTransfers } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DepotTransferPage({ onBack, }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState(0); // 0: Internal, 1: Dealer, 2: Receive
  
  // ডাটা স্টেট
  const [products, setProducts] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [incomingTransfers, setIncomingTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ট্রান্সফার স্টেট
  const [cart, setCart] = useState<any[]>([]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [destDepot, setDestDepot] = useState("গাজীপুর ডিপো");
  const [isGatePassReady, setIsGatePassReady] = useState(false);

  // রিসিভ স্টেট
  const [receivingTransfer, setReceivingTransfer] = useState<any>(null);
  const [receiveData, setReceiveData] = useState<Record<string, { received: number, damaged: number }>>({});

  // টোস্ট স্টেট
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({ ...p, stock_quantity: p.stock })));
        setDealers(demoDepotDealers);
        setIncomingTransfers(demoInternalTransfers);
        if (demoDepotDealers.length > 0) setSelectedDealer(demoDepotDealers[0].name);
      } else {
        if (!activeBusiness?.id) return;
        const bizId = activeBusiness.id;

        const [prodRes, dealRes, transRes] = await Promise.all([
          supabase.from('products').select('*').eq('business_id', bizId),
          supabase.from('dealers').select('*').eq('business_id', bizId),
          supabase.from('internal_transfers').select('*, internal_transfer_items(*, products(name))').eq('destination_depot_id', bizId).eq('status', 'In-Transit')
        ]);

        if (prodRes.data) setProducts(prodRes.data.map(p => ({ ...p, stock_quantity: p.stock_quantity })));
        if (dealRes.data) {
          setDealers(dealRes.data);
          if (dealRes.data.length > 0) setSelectedDealer(dealRes.data[0].name);
        }
        if (transRes.data) {
          setIncomingTransfers(transRes.data.map((t: any) => ({
            ...t,
            items: t.internal_transfer_items.map((i: any) => ({
              id: i.product_id,
              name: i.products?.name || 'পণ্য নেই',
              quantity: i.quantity,
              unit: 'পিস'
            }))
          })));
        }
      }
    } catch (error) {
      console.error(error);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const addToCart = (prod: any) => {
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
      setCart(cart.map(item => item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...prod, quantity: 1, unit: prod.unit || 'পিস' }]);
    }
  };

  const updateQty = (index: number, val: number) => {
    const updated = [...cart];
    updated[index].quantity = Math.max(1, val);
    setCart(updated);
  };

  const removeProduct = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleConfirmTransfer = () => {
    if (cart.length === 0) return showToast('দয়া করে অন্তত একটি মাল ফর্দিতে যোগ করুন!', 'error');
    if (activeTab === 1 && !vehicleNo.trim()) return showToast('দয়া করে গাড়ির নম্বর দিন!', 'error');
    
    if (activeTab === 0) {
      // ইন্টারনাল ট্রান্সফার লজিক
      showToast('ইন্টারনাল ট্রান্সফার সফল হয়েছে! মালটি এখন ট্রানজিটে আছে।');
      setCart([]);
      setVehicleNo('');
    } else {
      // ডিলার ট্রান্সফার লজিক
      setIsGatePassReady(true);
    }
  };

  const handleOpenReceiveModal = (transfer: any) => {
    setReceivingTransfer(transfer);
    const initialData: Record<string, { received: number, damaged: number }> = {};
    transfer.items.forEach((item: any) => {
      initialData[item.id] = { received: item.quantity, damaged: 0 };
    });
    setReceiveData(initialData);
  };

  const handleConfirmReceive = async () => {
    if (!receivingTransfer) return;
    
    const totalReceived = Object.values(receiveData).reduce((acc, curr) => acc + curr.received, 0);
    const totalDamaged = Object.values(receiveData).reduce((acc, curr) => acc + curr.damaged, 0);
    
    setIncomingTransfers(incomingTransfers.filter(t => t.id !== receivingTransfer.id));
    showToast(`মাল সফলভাবে রিসিভ করা হয়েছে! (রিসিভ: ${toBangla(totalReceived)} টি, ড্যামেজ: ${toBangla(totalDamaged)} টি)`);
    setReceivingTransfer(null);
  };

  const challanNo = "DC-8092";
  const currentDate = new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {toast.show && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[999] w-[280px] px-5 py-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2 animate-in slide-in-from-top-8 fade-in duration-300 border border-white/20 ${toast.type === 'success' ? 'bg-da-greenDeep' : 'bg-da-red'} text-white`}>
          <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shadow-inner">
            {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          </div>
          <span className="text-sm font-bold text-center leading-snug">{toast.message}</span>
        </div>
      )}

      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => isGatePassReady ? setIsGatePassReady(false) : onBack()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">{isGatePassReady ? 'ডেলিভারি চালান' : 'ট্রান্সফার ম্যানেজমেন্ট'}</h1>
          </div>
        </div>
        
        {!isGatePassReady && (
          <div className="flex overflow-x-auto scrollbar-hide bg-black/20 px-2 py-1.5 gap-1">
            {[
              { id: 0, title: "ইন্টারনাল", icon: ArrowRightLeft },
              { id: 1, title: "ডিলার", icon: Truck },
              { id: 2, title: "রিসিভ", icon: PackageCheck }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCart([]); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${activeTab === tab.id ? "bg-white text-da-depotNavy shadow" : "text-white/80 hover:bg-white/10"}`}>
                <tab.icon size={14} /> <span>{tab.title}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ================= ১. ইন্টারনাল ট্রান্সফার ================= */}
        {activeTab === 0 && !isGatePassReady && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl border border-da-cardBorder p-3 shadow-sm flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-da-textMuted font-bold block mb-1">গন্তব্য ডিপো <span className="text-da-red">*</span></label>
                  <select value={destDepot} onChange={(e) => setDestDepot(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-lg px-2 py-1.5 text-xs font-bold text-da-textDark outline-none">
                    <option>গাজীপুর ডিপো</option>
                    <option>সাভার ডিপো</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-da-textMuted font-bold block mb-1">গাড়ির নম্বর</label>
                  <input type="text" placeholder="ঢাকা-ট ১১-XXXX" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-da-depotBlue" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                {isLoading ? <Loader2 className="animate-spin text-da-depotBlue m-auto col-span-2" /> : 
                  products.map(product => (
                  <div key={product.id} onClick={() => addToCart(product)} className="bg-da-depotBg border border-da-cardBorder rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-da-depotBlue active:scale-95 transition">
                    <div>
                      <h4 className="text-[11px] font-bold text-da-textDark line-clamp-1">{product.name}</h4>
                      <span className="text-[9px] text-da-textMuted">স্টক: {toBangla(product.stock_quantity)}</span>
                    </div>
                    <span className="text-[10px] bg-da-depotBlue/10 text-da-depotBlue px-1.5 py-0.5 rounded font-bold">+ যোগ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm overflow-hidden flex flex-col">
              <div className="bg-da-depotBg px-3 py-1.5 border-b border-da-cardBorder">
                <h3 className="font-bold text-xs text-da-depotNavy">ট্রান্সফার ফর্দি ({toBangla(cart.length)}টি)</h3>
              </div>
              <div className="divide-y divide-da-cardBorder">
                {cart.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 items-center px-2 py-2">
                    <div className="col-span-6 font-bold text-[11px] text-da-textDark truncate pr-1">{item.name}</div>
                    <div className="col-span-4 flex justify-center items-center gap-1">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(index, parseFloat(e.target.value) || 1)} className="w-12 bg-white border border-da-cardBorder rounded px-1 py-0.5 text-center text-[11px] font-bold outline-none" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeProduct(index)} className="text-da-red p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="p-4 text-center text-xs text-da-textMuted">ফর্দিতে কোনো মাল নেই</div>}
              </div>
            </div>

            <button onClick={handleConfirmTransfer} className="w-full bg-da-depotBlue text-white font-bold py-3 rounded-xl shadow-blue-soft flex items-center justify-center gap-2 active:scale-95 transition">
              <ArrowRightLeft size={18} /> <span className="text-sm">মাল পাঠান</span>
            </button>
          </div>
        )}

        {/* ================= ২. ডিলার ট্রান্সফার ================= */}
        {activeTab === 1 && !isGatePassReady && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl border border-da-cardBorder p-3 shadow-sm flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-da-textMuted font-bold block mb-1">ডিলার</label>
                  <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-lg px-2 py-1.5 text-xs font-bold text-da-textDark outline-none">
                    {dealers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-da-textMuted font-bold block mb-1">গাড়ির নম্বর <span className="text-da-red">*</span></label>
                  <input type="text" placeholder="ঢাকা-ট ১১-XXXX" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-da-depotBlue" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                {isLoading ? <Loader2 className="animate-spin text-da-depotBlue m-auto col-span-2" /> : 
                  products.map(product => (
                  <div key={product.id} onClick={() => addToCart(product)} className="bg-da-depotBg border border-da-cardBorder rounded-lg p-2 flex items-center justify-between cursor-pointer hover:border-da-depotBlue active:scale-95 transition">
                    <div>
                      <h4 className="text-[11px] font-bold text-da-textDark line-clamp-1">{product.name}</h4>
                      <span className="text-[9px] text-da-textMuted">স্টক: {toBangla(product.stock_quantity)}</span>
                    </div>
                    <span className="text-[10px] bg-da-depotBlue/10 text-da-depotBlue px-1.5 py-0.5 rounded font-bold">+ যোগ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm overflow-hidden flex flex-col">
              <div className="bg-da-depotBg px-3 py-1.5 border-b border-da-cardBorder">
                <h3 className="font-bold text-xs text-da-depotNavy">ডেলিভারি ফর্দি ({toBangla(cart.length)}টি)</h3>
              </div>
              <div className="divide-y divide-da-cardBorder">
                {cart.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 items-center px-2 py-2">
                    <div className="col-span-6 font-bold text-[11px] text-da-textDark truncate pr-1">{item.name}</div>
                    <div className="col-span-4 flex justify-center items-center gap-1">
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(index, parseFloat(e.target.value) || 1)} className="w-12 bg-white border border-da-cardBorder rounded px-1 py-0.5 text-center text-[11px] font-bold outline-none" />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button onClick={() => removeProduct(index)} className="text-da-red p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && <div className="p-4 text-center text-xs text-da-textMuted">ফর্দিতে কোনো মাল নেই</div>}
              </div>
            </div>

            <button onClick={handleConfirmTransfer} className="w-full bg-da-depotNavy text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition">
              <CheckCircle size={18} /> <span className="text-sm">চালান কনফার্ম ও গেট-পাস তৈরি</span>
            </button>
          </div>
        )}

        {/* ================= ৩. রিসিভ ও ড্যামেজ ================= */}
        {activeTab === 2 && !isGatePassReady && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl border border-da-cardBorder p-3 shadow-sm flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm text-da-depotNavy">আগত মালের তালিকা</h3>
                <p className="text-[10px] text-da-textMuted mt-0.5">রিসিভ করার জন্য অপেক্ষমাণ</p>
              </div>
              <span className="bg-da-depotBlue/10 text-da-depotBlue px-2 py-1 rounded text-xs font-bold border border-da-depotBlue/30">
                পেন্ডিং: {toBangla(incomingTransfers.length)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {isLoading ? <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div> :
               incomingTransfers.length === 0 ? (
                <div className="bg-white border border-da-cardBorder p-8 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                  <PackageCheck size={40} className="text-da-textMuted mb-3" />
                  <h3 className="font-bold text-da-textDark text-sm">কোনো মাল পেন্ডিং নেই</h3>
                </div>
              ) : (
                incomingTransfers.map(transfer => (
                  <div key={transfer.id} className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start border-b border-da-cardBorder pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-da-depotNavy bg-da-depotBlue/10 px-1.5 py-0.5 rounded">চালান: {transfer.id}</span>
                        <p className="text-xs font-bold text-da-textDark mt-1">থেকে: {transfer.source_depot}</p>
                        <p className="text-[10px] text-da-textMuted">তারিখ: {transfer.date} | গাড়ি: {transfer.vehicle_no}</p>
                      </div>
                      <button onClick={() => handleOpenReceiveModal(transfer)} className="bg-da-green text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition">
                        রিসিভ
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {transfer.items.map((item: any, idx: number) => (
                        <span key={idx} className="text-[9px] bg-da-depotBg text-da-textMuted px-1.5 py-0.5 rounded border border-da-cardBorder">
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

        {/* ================= গেট-পাস প্রিন্ট ভিউ ================= */}
        {isGatePassReady && (
          <div className="flex flex-col gap-2.5 items-center animate-in zoom-in-95 duration-200">
            <div className="w-full max-w-sm bg-white border border-da-cardBorder rounded-xl p-4 shadow-sm flex flex-col">
              <div className="text-center pb-2 border-b border-dashed border-da-textMuted">
                <h2 className="text-lg font-black text-da-depotNavy">DREAM AGRO</h2>
                <h3 className="text-xs font-bold text-da-textDark mt-1">ডেলিভারি চালান / গেট-পাস</h3>
              </div>
              <div className="py-2 border-b border-dashed border-da-textMuted flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="font-bold text-da-textDark">ডিলার: {selectedDealer}</span>
                  <span className="font-bold">চালান: {challanNo}</span>
                </div>
                <div className="flex justify-between text-da-textMuted">
                  <span>গাড়ি: {vehicleNo}</span>
                  <span>তারিখ: {currentDate}</span>
                </div>
              </div>
              <div className="py-2 border-b border-dashed border-da-textMuted">
                <table className="w-full text-[11px]">
                  <tbody className="divide-y divide-da-cardBorder">
                    {cart.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1 font-semibold text-da-textDark">{toBangla(idx + 1)}.</td>
                        <td className="py-1 font-bold text-da-textDark">{item.name}</td>
                        <td className="py-1 text-right font-black text-da-depotBlue">{toBangla(item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="py-2 flex justify-between font-black text-xs text-da-depotNavy">
                <span>সর্বমোট পরিমাণ:</span>
                <span>{toBangla(cart.reduce((a,c)=>a+c.quantity, 0))}</span>
              </div>
            </div>

            <div className="flex w-full max-w-sm gap-2 mt-1">
              <button onClick={() => window.print()} className="flex-1 bg-da-depotNavy text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition">
                <Printer size={15} /> <span>প্রিন্ট</span>
              </button>
              <button className="flex-1 bg-da-depotBlue text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition">
                <Share2 size={15} /> <span>শেয়ার</span>
              </button>
            </div>
            <button onClick={() => { setCart([]); setIsGatePassReady(false); setActiveTab(1); }} className="w-full max-w-sm bg-white border-2 border-da-depotNavy text-da-depotNavy py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition mt-1">
              <CheckSquare size={16} /> <span>ডেলিভারি সম্পন্ন করুন</span>
            </button>
          </div>
        )}
      </main>

      {/* ================= মডাল: রিসিভ ও ড্যামেজ ================= */}
      {receivingTransfer && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-da-depotBg w-full h-[85dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="font-bold text-sm flex items-center gap-1.5"><PackageCheck size={16}/> রিসিভ করুন</h2>
                <p className="text-[10px] text-blue-200">চালান: {receivingTransfer.id}</p>
              </div>
              <button onClick={() => setReceivingTransfer(null)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-[10px] text-blue-700 flex items-start gap-1.5">
                <ShieldAlert size={14} className="shrink-0 mt-0.5"/>
                <p>মালের পরিমাণ ঠিক থাকলে 'রিসিভড' ঘরে মোট পরিমাণ লিখুন। কোনো মাল নষ্ট হলে 'ড্যামেজ' ঘরে তার পরিমাণ লিখুন।</p>
              </div>

              {receivingTransfer.items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white border border-da-cardBorder rounded-xl p-3 shadow-sm">
                  <h4 className="font-bold text-sm text-da-textDark mb-2">{item.name}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-da-textMuted mb-1 block">রিসিভড (পাঠানো: {toBangla(item.quantity)})</label>
                      <input 
                        type="number" 
                        value={receiveData[item.id]?.received || 0}
                        onChange={(e) => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], received: Number(e.target.value) } })}
                        className="w-full border border-da-cardBorder rounded-lg p-2 text-sm font-bold text-da-green outline-none focus:border-da-green" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-da-red mb-1 block">ড্যামেজ</label>
                      <input 
                        type="number" 
                        value={receiveData[item.id]?.damaged || 0}
                        onChange={(e) => setReceiveData({ ...receiveData, [item.id]: { ...receiveData[item.id], damaged: Number(e.target.value) } })}
                        className="w-full border border-da-cardBorder rounded-lg p-2 text-sm font-bold text-da-red outline-none focus:border-da-red" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-white border-t border-da-cardBorder shrink-0 flex gap-2">
              <button onClick={() => setReceivingTransfer(null)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleConfirmReceive} className="flex-1 bg-da-green text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1 active:scale-95 transition">
                <CheckCircle size={16}/> রিসিভ কনফার্ম
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}