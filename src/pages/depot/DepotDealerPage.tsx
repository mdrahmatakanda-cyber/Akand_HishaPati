import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Plus, X, Loader2, 
  User, Phone, MapPin, Wallet, 
  ReceiptText, Clock, CheckCircle2, AlertTriangle, ArrowRightLeft,
  Image as ImageIcon, FileText, Truck, Edit3
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotDealers } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DepotDealerPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [dealers, setDealers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDealer, setSelectedDealer] = useState<any>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editDealerData, setEditDealerData] = useState({ name: '', phone: '', area: '', dealer_code: '', previous_due: '' });
  
  // ফর্ম স্টেট (নতুন ফিল্ডসহ)
  const [newDealer, setNewDealer] = useState({ 
    name: '', phone: '', area: '', dealer_code: '', previous_due: '' 
  });
  const [dealerImage, setDealerImage] = useState<File | null>(null);
  const [dealerDoc, setDealerDoc] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchDealers = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setDealers(demoDepotDealers);
      } else {
        if (!activeBusiness?.id) return;
        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setDealers(data || []);
      }
    } catch (error: any) {
      console.error(error);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredDealers = useMemo(() => {
    return dealers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (d.phone && d.phone.includes(searchQuery)) ||
      (d.dealer_code && d.dealer_code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [dealers, searchQuery]);

  const totalDue = dealers.reduce((acc, curr) => acc + Number(curr.due_balance || 0), 0);

  const handleAddDealer = async () => {
    if (!newDealer.name || !newDealer.phone) return showToast('নাম এবং মোবাইল নম্বর আবশ্যক', 'error');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newD = {
          id: Date.now().toString(),
          dealer_code: newDealer.dealer_code || `DLR-${Math.floor(Math.random()*1000)}`,
          name: newDealer.name,
          phone: newDealer.phone,
          area: newDealer.area,
          due_balance: Number(newDealer.previous_due) || 0,
          previous_due: Number(newDealer.previous_due) || 0,
          image_url: dealerImage ? URL.createObjectURL(dealerImage) : '',
          documents: dealerDoc ? [dealerDoc.name] : []
        };
        setDealers([newD, ...dealers]);
      } else {
        if (!activeBusiness?.id) return;
        // রিয়েল মোডে ইমেজ/ডকুমেন্ট আপলোডের লজিক এখানে বসবে (Supabase Storage)
        
        const { error } = await supabase.from('dealers').insert([{
          business_id: activeBusiness.id,
          dealer_code: newDealer.dealer_code,
          name: newDealer.name,
          phone: newDealer.phone,
          area: newDealer.area,
          due_balance: Number(newDealer.previous_due) || 0,
          previous_due: Number(newDealer.previous_due) || 0
        }]);
        if (error) throw error;
        fetchDealers();
      }
      setIsAddModalOpen(false);
      setNewDealer({ name: '', phone: '', area: '', dealer_code: '', previous_due: '' });
      setDealerImage(null);
      setDealerDoc(null);
      showToast('নতুন ডিলার যোগ হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

   const handlePayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return showToast('সঠিক টাকার পরিমাণ দিন', 'error');
    setIsSaving(true);
    try {
      const amount = Number(paymentAmount);
      if (isDemoMode) {
        setDealers(dealers.map(d => 
          d.id === selectedDealer.id ? { ...d, due_balance: d.due_balance - amount } : d
        ));
        setSelectedDealer({ ...selectedDealer, due_balance: selectedDealer.due_balance - amount });
      } else {
        const { error: dealerError } = await supabase
          .from('dealers')
          .update({ due_balance: selectedDealer.due_balance - amount })
          .eq('id', selectedDealer.id);
        
        if (dealerError) throw dealerError;
        fetchDealers();
        setSelectedDealer({ ...selectedDealer, due_balance: selectedDealer.due_balance - amount });
      }
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      showToast('টাকা জমা সফল হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

   const openProfileModal = (dealer: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDealer(dealer);
    setEditDealerData({
      name: dealer.name || '',
      phone: dealer.phone || '',
      area: dealer.area || '',
      dealer_code: dealer.dealer_code || '',
      previous_due: dealer.due_balance ? dealer.due_balance.toString() : '0'
    });
    setIsEditingProfile(false);
    setIsProfileModalOpen(true);
  };

  const handleUpdateDealer = async () => {
    if (!editDealerData.name || !editDealerData.phone) return showToast('নাম এবং মোবাইল আবশ্যক', 'error');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const updatedDealers = dealers.map(d => d.id === selectedDealer.id ? {
          ...d,
          name: editDealerData.name,
          phone: editDealerData.phone,
          area: editDealerData.area,
          dealer_code: editDealerData.dealer_code,
          due_balance: Number(editDealerData.previous_due)
        } : d);
        setDealers(updatedDealers);
        setSelectedDealer(updatedDealers.find(d => d.id === selectedDealer.id));
      } else {
        const { error } = await supabase.from('dealers').update({
          name: editDealerData.name,
          phone: editDealerData.phone,
          area: editDealerData.area,
          dealer_code: editDealerData.dealer_code,
          due_balance: Number(editDealerData.previous_due)
        }).eq('id', selectedDealer.id);
        
        if (error) throw error;
        fetchDealers();
        setSelectedDealer({
          ...selectedDealer,
          name: editDealerData.name,
          phone: editDealerData.phone,
          area: editDealerData.area,
          dealer_code: editDealerData.dealer_code,
          due_balance: Number(editDealerData.previous_due)
        });
      }
      setIsEditingProfile(false);
      showToast('ডিলারের তথ্য আপডেট হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {toast.show && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[999] w-[280px] px-5 py-4 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-2 animate-in slide-in-from-top-8 fade-in duration-300 border border-white/20 ${toast.type === 'success' ? 'bg-da-greenDeep' : 'bg-da-red'} text-white`}>
          <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shadow-inner">
            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <span className="text-sm font-bold text-center leading-snug">{toast.message}</span>
        </div>
      )}

      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={selectedDealer ? () => setSelectedDealer(null) : onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">{selectedDealer ? 'ডিলার লেজার' : 'ডিলার ম্যানেজমেন্ট'}</h1>
          </div>
          {selectedDealer && (
            <button onClick={() => openProfileModal(selectedDealer)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition active:scale-95">
              <User size={16} />
              <span className="text-xs font-bold">প্রোফাইল</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ==================== ১. লিস্ট ভিউ ==================== */}
        {!selectedDealer && (
          <>
            <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex justify-between items-center shrink-0">
              <div className="flex-1 text-center border-r border-white/20">
                <p className="text-xs font-bold text-blue-100">মোট ডিলার</p>
                <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(dealers.length)} জন</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-blue-100">মোট বাকি</p>
                <p className="text-xl font-black mt-1 text-da-depotAmber">{isLoading ? '...' : toBangla(totalDue)} ৳</p>
              </div>
            </div>

            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-blue shrink-0">
              <Search size={18} className="text-da-textMuted" />
              <input 
                type="text" 
                placeholder="ডিলারের নাম, আইডি বা মোবাইল খুঁজুন" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full outline-none text-sm bg-transparent" 
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : filteredDealers.length === 0 ? (
              <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো ডিলার পাওয়া যায়নি</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredDealers.map(dealer => (
                  <div 
                    key={dealer.id} 
                    onClick={() => setSelectedDealer(dealer)}
                    className="bg-white px-2.5 py-2 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue shrink-0 border border-da-cardBorder overflow-hidden">
                        {dealer.image_url ? <img src={dealer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[13px] text-da-textDark truncate">{dealer.name}</h3>
                          {dealer.dealer_code && <span className="text-[9px] bg-da-depotBlue/10 text-da-depotBlue px-1 rounded border border-da-depotBlue/20">{dealer.dealer_code}</span>}
                        </div>
                        <p className="text-[10px] text-da-textMuted truncate flex items-center gap-1.5 mt-0.5">
                          <Phone size={10} /> {dealer.phone} {dealer.area ? `| ${dealer.area}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className={`font-black text-[13px] ${Number(dealer.due_balance) > 0 ? 'text-da-red' : 'text-da-green'}`}>
                        ৳{toBangla(dealer.due_balance)}
                      </p>
                      <span className="text-[8px] font-bold text-da-textMuted uppercase">বাকি</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== ২. ডিলার লেজার ভিউ ==================== */}
        {selectedDealer && (
          <>
            <div className="bg-white p-4 rounded-xl border border-da-cardBorder shadow-sm flex flex-col items-center text-center shrink-0">
              <div 
                onClick={() => openProfileModal(selectedDealer)} 
                className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue mb-2 border border-da-cardBorder overflow-hidden group-hover:ring-2 group-hover:ring-da-depotBlue/50 transition-all">
                  {selectedDealer.image_url ? <img src={selectedDealer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={32} />}
                </div>
                <h2 className="font-black text-lg text-da-textDark group-hover:text-da-depotBlue transition-colors">{selectedDealer.name}</h2>
                <p className="text-xs text-da-textMuted mt-0.5">{selectedDealer.dealer_code}</p>
              </div>
              <p className="text-sm text-da-textMuted flex items-center gap-1 mt-1"><Phone size={12}/> {selectedDealer.phone}</p>
              {selectedDealer.area && <p className="text-xs text-da-textMuted flex items-center gap-1 mt-1"><MapPin size={12}/> {selectedDealer.area}</p>}
              
              <div className="w-full mt-3 pt-3 border-t border-da-cardBorder flex justify-between items-center">
                <span className="text-sm font-bold text-da-textDark">বর্তমান বাকি</span>
                <span className={`font-black text-xl ${Number(selectedDealer.due_balance) > 0 ? 'text-da-red' : 'text-da-green'}`}>
                  ৳{toBangla(selectedDealer.due_balance)}
                </span>
              </div>
            </div>

            {/* অ্যাকশন বাটন (এক লাইনে ৩টি) */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <button onClick={() => setIsPaymentModalOpen(true)} className="bg-da-green text-white py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Wallet size={16}/> <span className="text-[10px]">নতুন জমা</span>
              </button>
              <button onClick={() => onNavigate('sale')} className="bg-da-depotBlue text-white py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <ReceiptText size={16}/> <span className="text-[10px]">নতুন বিক্রি</span>
              </button>
              <button onClick={() => onNavigate('depot')} className="bg-da-depotAmber text-da-depotNavy py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Truck size={16}/> <span className="text-[10px]">মাল ট্রান্সফার</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-3 shrink-0 mt-1">
              <h3 className="font-bold text-sm text-da-textDark mb-2 flex items-center gap-2 border-b border-da-cardBorder pb-2">
                <Clock size={16} className="text-da-depotBlue"/> লেনদেনের ইতিহাস
              </h3>
              <div className="flex flex-col items-center py-6">
                <div className="w-12 h-12 rounded-full bg-da-depotBg flex items-center justify-center mb-2">
                  <ArrowRightLeft size={20} className="text-da-depotBlue/50" />
                </div>
                <p className="text-xs text-da-textMuted font-bold">এই ডিলারের কোনো লেনদেন পাওয়া যায়নি।</p>
              </div>
            </div>
          </>
        )}

      </main>

      {!selectedDealer && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
          <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
            <Plus size={18}/> নতুন ডিলার যোগ করুন
          </button>
        </div>
      )}

      {/* ==================== নতুন ডিলার মডাল ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন ডিলার যুক্ত করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলারের নাম <span className="text-da-red">*</span></label>
                  <input type="text" value={newDealer.name} onChange={e => setNewDealer({...newDealer, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলার আইডি</label>
                  <input type="text" value={newDealer.dealer_code} onChange={e => setNewDealer({...newDealer, dealer_code: e.target.value})} placeholder="DLR-001" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন নম্বর <span className="text-da-red">*</span></label>
                  <input type="tel" value={newDealer.phone} onChange={e => setNewDealer({...newDealer, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পূর্বের বাকি</label>
                  <input type="number" value={newDealer.previous_due} onChange={e => setNewDealer({...newDealer, previous_due: e.target.value})} placeholder="৳ 0" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা / এলাকা</label>
                <input type="text" value={newDealer.area} onChange={e => setNewDealer({...newDealer, area: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              {/* আপলোড অপশন */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => imageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center justify-center text-da-textMuted hover:bg-da-depotBg transition">
                  <ImageIcon size={18} className={dealerImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{dealerImage ? dealerImage.name : 'ডিলারের ছবি'}</span>
                </button>
                <input type="file" ref={imageInputRef} onChange={e => setDealerImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />

                <button onClick={() => docInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center justify-center text-da-textMuted hover:bg-da-depotBg transition">
                  <FileText size={18} className={dealerDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{dealerDoc ? dealerDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={docInputRef} onChange={e => setDealerDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddDealer} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== টাকা জমা মডাল ==================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-green p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Wallet size={16}/> টাকা জমা নিন</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-da-textDark">{selectedDealer?.name}</p>
                <p className="text-xs text-da-textMuted">বর্তমান বাকি: ৳{toBangla(selectedDealer?.due_balance)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">টাকার পরিমাণ</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold outline-none focus:border-da-green" placeholder="৳ 0" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPaymentAmount(selectedDealer?.due_balance.toString() || '0')} className="flex-1 py-1.5 bg-da-green/10 text-da-green text-xs font-bold rounded border border-da-green/30">পুরো বাকি</button>
                <button onClick={() => setPaymentAmount('')} className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded border border-gray-300">রিসেট</button>
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handlePayment} disabled={isSaving} className="flex-1 bg-da-green text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'জমা করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ডিলার প্রোফাইল মডাল ==================== */}
      {isProfileModalOpen && selectedDealer && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><User size={16}/> ডিলার প্রোফাইল</h2>
              <div className="flex items-center gap-2">
                {!isEditingProfile ? (
                  <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold transition">
                    <Edit3 size={12}/> এডিট
                  </button>
                ) : (
                  <button onClick={() => setIsEditingProfile(false)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold transition">
                    <X size={12}/> বাতিল
                  </button>
                )}
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
              </div>
            </div>
            
            <div className="p-5 flex flex-col items-center overflow-y-auto">
              <div className="w-24 h-24 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue mb-3 border-4 border-da-depotNavy/10 overflow-hidden shadow-inner relative group">
                {selectedDealer.image_url ? (
                  <img src={selectedDealer.image_url} alt={selectedDealer.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
                    <ImageIcon size={24} className="text-white" />
                  </div>
                )}
              </div>

              {!isEditingProfile ? (
                <>
                  <h2 className="font-black text-xl text-da-textDark">{selectedDealer.name}</h2>
                  {selectedDealer.dealer_code && (
                    <span className="text-xs font-bold text-da-depotBlue bg-da-depotBlue/10 px-2 py-0.5 rounded-full mt-1 border border-da-depotBlue/20">
                      {selectedDealer.dealer_code}
                    </span>
                  )}

                  <div className="w-full mt-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <Phone className="text-da-depotNavy" size={18} />
                      <div>
                        <p className="text-[10px] text-da-textMuted font-bold">মোবাইল নম্বর</p>
                        <p className="text-sm font-bold text-da-textDark">{selectedDealer.phone}</p>
                      </div>
                    </div>

                    {selectedDealer.area && (
                      <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                        <MapPin className="text-da-depotNavy" size={18} />
                        <div>
                          <p className="text-[10px] text-da-textMuted font-bold">ঠিকানা / এলাকা</p>
                          <p className="text-sm font-bold text-da-textDark">{selectedDealer.area}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <Wallet className="text-da-green" size={18} />
                      <div>
                        <p className="text-[10px] text-da-textMuted font-bold">বর্তমান বাকি</p>
                        <p className={`text-sm font-bold ${Number(selectedDealer.due_balance) > 0 ? 'text-da-red' : 'text-da-green'}`}>
                          ৳ {toBangla(selectedDealer.due_balance)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <p className="text-[10px] text-da-textMuted font-bold mb-2 flex items-center gap-1"><FileText size={12}/> সংযুক্ত ডকুমেন্টস</p>
                      {selectedDealer.documents && selectedDealer.documents.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {selectedDealer.documents.map((doc: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200">
                              <span className="text-xs font-bold text-da-depotBlue truncate">{doc}</span>
                              <span className="text-[10px] text-gray-400">PDF</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">কোনো ডকুমেন্ট আপলোড করা হয়নি।</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full mt-2 flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলারের নাম</label>
                    <input type="text" value={editDealerData.name} onChange={e => setEditDealerData({...editDealerData, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলার আইডি</label>
                      <input type="text" value={editDealerData.dealer_code} onChange={e => setEditDealerData({...editDealerData, dealer_code: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন নম্বর</label>
                      <input type="tel" value={editDealerData.phone} onChange={e => setEditDealerData({...editDealerData, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label>
                      <input type="text" value={editDealerData.area} onChange={e => setEditDealerData({...editDealerData, area: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পূর্বের বাকি</label>
                      <input type="number" value={editDealerData.previous_due} onChange={e => setEditDealerData({...editDealerData, previous_due: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              {isEditingProfile ? (
                <button onClick={handleUpdateDealer} disabled={isSaving} className="w-full bg-da-green text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16}/> সেভ করুন</>}
                </button>
              ) : (
                <button onClick={() => setIsProfileModalOpen(false)} className="w-full bg-da-depotNavy text-white py-2.5 rounded-xl font-bold shadow-md">বন্ধ করুন</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}