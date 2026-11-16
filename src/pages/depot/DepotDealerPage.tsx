import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Plus, X, Loader2, 
  User, Phone, MapPin, Wallet, 
  ReceiptText, Clock, CheckCircle2, AlertTriangle, ArrowRightLeft,
  Image as ImageIcon, FileText, Truck, Edit3, Store, Building2, Trash2, ExternalLink
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoDepotDealers } from '../../lib/demoData';
import { uploadImageToSupabase, uploadPdfToUpstash, getUpstashFileUrl } from '../../lib/upload';
import PremiumToast from '../../components/PremiumToast';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function DepotDealerPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<'dealer' | 'depot'>('dealer');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dealers, setDealers] = useState<any[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingDocKey, setLoadingDocKey] = useState<string | null>(null);
  
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [selectedDepot, setSelectedDepot] = useState<any>(null);

  // ডিলার মডাল স্টেট
  const [isAddDealerModalOpen, setIsAddDealerModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ডিপো মডাল স্টেট
  const [isAddDepotModalOpen, setIsAddDepotModalOpen] = useState(false);
  const [newDepotForm, setNewDepotForm] = useState({ name: '', depot_code: '', owner_name: '', owner_phone: '', owner_phone_2: '', address: '' });
  
  // ডিপো আপলোড স্টেট
  const [depotImage, setDepotImage] = useState<File | null>(null);
  const [depotDoc, setDepotDoc] = useState<File | null>(null);
  const depotImageInputRef = useRef<HTMLInputElement>(null);
  const depotDocInputRef = useRef<HTMLInputElement>(null);

  // ডিলার ফর্ম স্টেট
  const [newDealer, setNewDealer] = useState({ name: '', phone: '', phone_2: '', area: '', dealer_code: '', previous_due: '' });
  const [dealerImage, setDealerImage] = useState<File | null>(null);
  const [dealerDoc, setDealerDoc] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  // ডিলার এডিট স্টেট
  const [editDealerImage, setEditDealerImage] = useState<File | null>(null);
  const [editDealerDoc, setEditDealerDoc] = useState<File | null>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const [editDealerData, setEditDealerData] = useState({ name: '', phone: '', phone_2: '', area: '', dealer_code: '', previous_due: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [deleteConfirmType, setDeleteConfirmType] = useState<'dealer' | 'depot' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ show: true, message, type });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setDealers(demoDepotDealers);
        setDepots([
          { id: 'dp1', name: "সেন্ট্রাল ডিপো", depot_code: "DP-001", owner_name: "আব্দুর রহিম", owner_phone: "01711111111", owner_phone_2: "01811111111", address: "ঢাকা", image_url: '', documents: [] },
          { id: 'dp2', name: "গাজীপুর ডিপো", depot_code: "DP-002", owner_name: "করিম মিয়া", owner_phone: "01822222222", owner_phone_2: "", address: "গাজীপুর", image_url: '', documents: [] }
        ]);
      } else {
        if (!activeBusiness?.id) return;
        
        const [dealRes, depRes] = await Promise.all([
          supabase.from('dealers').select('*').eq('business_id', activeBusiness.id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('depots').select('*').eq('business_id', activeBusiness.id).is('deleted_at', null).order('created_at', { ascending: false })
        ]);
        
        if (dealRes.error) throw dealRes.error;
        if (depRes.error) throw depRes.error;

        setDealers(dealRes.data || []);
        setDepots(depRes.data || []);
      }
    } catch (error: any) {
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredList = useMemo(() => {
    if (activeTab === 'dealer') {
      return dealers.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.phone && d.phone.includes(searchQuery)));
    } else {
      return depots.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.depot_code && d.depot_code.toLowerCase().includes(searchQuery.toLowerCase())));
    }
  }, [activeTab, dealers, depots, searchQuery]);

  const totalDealerDue = dealers.reduce((acc, curr) => acc + Number(curr.due_balance || 0), 0);

  // ✅ ফাইল দেখার ফাংশন
  const handleViewDocument = async (fileKey: string) => {
    try {
      setLoadingDocKey(fileKey);
      let url = fileKey;
      
      if (!fileKey.startsWith('http')) {
        url = await getUpstashFileUrl(fileKey);
      }

      // ✅ নতুন ট্যাবে ফাইল ওপেন করার জন্য (ডাউনলোড হবে না)
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      
    } catch (error: any) {
      showToast('ফাইল দেখতে সমস্যা হয়েছে: ' + error.message, 'error');
    } finally {
      setLoadingDocKey(null);
    }
  };

  // --- ডিলার ফাংশন ---
  const handleAddDealer = async () => {
    if (!newDealer.name || !newDealer.phone) return showToast('নাম এবং মোবাইল নম্বর আবশ্যক', 'error');
    setIsSaving(true);
    try {
      let uploadedImageUrl = '';
      let uploadedDocKey = '';

      if (!isDemoMode && activeBusiness?.id) {
        if (dealerImage) uploadedImageUrl = await uploadImageToSupabase(dealerImage, 'dealers');
        if (dealerDoc) {
          if (dealerDoc.type === 'application/pdf') {
            const { fileKey } = await uploadPdfToUpstash(dealerDoc);
            uploadedDocKey = fileKey;
          } else {
            uploadedImageUrl = await uploadImageToSupabase(dealerDoc, 'dealer_docs');
          }
        }

        const { error } = await supabase.from('dealers').insert([{
          business_id: activeBusiness.id,
          dealer_code: newDealer.dealer_code,
          name: newDealer.name,
          phone: newDealer.phone,
          phone_2: newDealer.phone_2,
          area: newDealer.area,
          due_balance: Number(newDealer.previous_due) || 0,
          image_url: uploadedImageUrl,
          documents: uploadedDocKey ? [uploadedDocKey] : []
        }]);
        if (error) throw error;
        fetchData();
      } else {
        const newD = {
          id: Date.now().toString(), ...newDealer,
          due_balance: Number(newDealer.previous_due) || 0,
          image_url: dealerImage ? URL.createObjectURL(dealerImage) : '',
          documents: dealerDoc ? [dealerDoc.name] : []
        };
        setDealers([newD, ...dealers]);
      }
      
      setIsAddDealerModalOpen(false);
      setNewDealer({ name: '', phone: '', phone_2: '', area: '', dealer_code: '', previous_due: '' });
      setDealerImage(null); setDealerDoc(null);
      showToast('নতুন ডিলার যোগ হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsSaving(false); }
  };

  const openProfileModal = (dealer: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDealer(dealer);
    setEditDealerData({
      name: dealer.name || '', phone: dealer.phone || '', phone_2: dealer.phone_2 || '', area: dealer.area || '',
      dealer_code: dealer.dealer_code || '', previous_due: dealer.due_balance ? dealer.due_balance.toString() : '0'
    });
    setEditDealerImage(null);
    setEditDealerDoc(null);
    setIsEditingProfile(false);
    setIsProfileModalOpen(true);
  };

  const handleUpdateDealer = async () => {
    if (!editDealerData.name || !editDealerData.phone) return showToast('নাম এবং মোবাইল আবশ্যক', 'error');
    setIsSaving(true);
    try {
      let uploadedImageUrl = selectedDealer.image_url || '';
      let uploadedDocKey = selectedDealer.documents?.[0] || '';

      if (!isDemoMode && activeBusiness?.id) {
        if (editDealerImage) uploadedImageUrl = await uploadImageToSupabase(editDealerImage, 'dealers');
        
        if (editDealerDoc) {
          if (editDealerDoc.type === 'application/pdf') {
            const { fileKey } = await uploadPdfToUpstash(editDealerDoc);
            uploadedDocKey = fileKey;
          } else {
            uploadedImageUrl = await uploadImageToSupabase(editDealerDoc, 'dealer_docs');
          }
        }

        const { error } = await supabase.from('dealers').update({
          name: editDealerData.name, phone: editDealerData.phone, phone_2: editDealerData.phone_2, area: editDealerData.area,
          dealer_code: editDealerData.dealer_code, due_balance: Number(editDealerData.previous_due),
          image_url: uploadedImageUrl, documents: uploadedDocKey ? [uploadedDocKey] : []
        }).eq('id', selectedDealer.id);
        
        if (error) throw error;
        fetchData();
        setSelectedDealer({ ...selectedDealer, name: editDealerData.name, phone: editDealerData.phone, phone_2: editDealerData.phone_2, area: editDealerData.area, dealer_code: editDealerData.dealer_code, due_balance: Number(editDealerData.previous_due), image_url: uploadedImageUrl, documents: uploadedDocKey ? [uploadedDocKey] : [] });
      } else {
        const updated = dealers.map(d => d.id === selectedDealer.id ? {
          ...d, name: editDealerData.name, phone: editDealerData.phone, phone_2: editDealerData.phone_2, area: editDealerData.area,
          dealer_code: editDealerData.dealer_code, due_balance: Number(editDealerData.previous_due),
          image_url: editDealerImage ? URL.createObjectURL(editDealerImage) : d.image_url,
          documents: editDealerDoc ? [editDealerDoc.name] : d.documents
        } : d);
        setDealers(updated);
        setSelectedDealer(updated.find(d => d.id === selectedDealer.id));
      }
      setIsEditingProfile(false);
      showToast('ডিলারের তথ্য আপডেট হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsSaving(false); }
  };

  const handlePayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return showToast('সঠিক টাকার পরিমাণ দিন', 'error');
    setIsSaving(true);
    try {
      const amount = Number(paymentAmount);
      if (isDemoMode) {
        setDealers(dealers.map(d => d.id === selectedDealer.id ? { ...d, due_balance: d.due_balance - amount } : d));
        setSelectedDealer({ ...selectedDealer, due_balance: selectedDealer.due_balance - amount });
      } else {
        const { error } = await supabase.from('dealers').update({ due_balance: selectedDealer.due_balance - amount }).eq('id', selectedDealer.id);
        if (error) throw error;
        fetchData();
        setSelectedDealer({ ...selectedDealer, due_balance: selectedDealer.due_balance - amount });
      }
      setIsPaymentModalOpen(false); setPaymentAmount(''); showToast('টাকা জমা সফল হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsSaving(false); }
  };

  const handleDeleteDealer = async () => {
    if (!selectedDealer) return;
    setIsDeleting(true);
    try {
      if (isDemoMode) setDealers(prev => prev.filter(d => d.id !== selectedDealer.id));
      else {
        const { error } = await supabase.from('dealers').update({ deleted_at: new Date().toISOString() }).eq('id', selectedDealer.id);
        if (error) throw error;
        fetchData();
      }
      setIsProfileModalOpen(false); setSelectedDealer(null); setDeleteConfirmType(null); showToast('ডিলার ডিলিট হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsDeleting(false); }
  };

  const handleDeleteDepot = async () => {
    if (!selectedDepot) return;
    setIsDeleting(true);
    try {
      if (isDemoMode) setDepots(prev => prev.filter(d => d.id !== selectedDepot.id));
      else {
        const { error } = await supabase.from('depots').update({ deleted_at: new Date().toISOString() }).eq('id', selectedDepot.id);
        if (error) throw error;
        fetchData();
      }
      setSelectedDepot(null); setDeleteConfirmType(null); showToast('ডিপো ডিলিট হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsDeleting(false); }
  };

  // --- ডিপো ফাংশন ---
  const handleAddDepot = async () => {
    if (!newDepotForm.name) return showToast('ডিপোর নাম আবশ্যক', 'error');
    setIsSaving(true);
    try {
      let uploadedImageUrl = '';
      let uploadedDocKey = '';

      if (!isDemoMode && activeBusiness?.id) {
        if (depotImage) uploadedImageUrl = await uploadImageToSupabase(depotImage, 'depots');
        if (depotDoc) {
          if (depotDoc.type === 'application/pdf') {
            const { fileKey } = await uploadPdfToUpstash(depotDoc);
            uploadedDocKey = fileKey;
          } else {
            uploadedImageUrl = await uploadImageToSupabase(depotDoc, 'depot_docs');
          }
        }

        const { error } = await supabase.from('depots').insert([{
          business_id: activeBusiness.id,
          name: newDepotForm.name,
          depot_code: newDepotForm.depot_code,
          owner_name: newDepotForm.owner_name,
          owner_phone: newDepotForm.owner_phone,
          owner_phone_2: newDepotForm.owner_phone_2,
          address: newDepotForm.address,
          image_url: uploadedImageUrl,
          documents: uploadedDocKey ? [uploadedDocKey] : []
        }]);
        if (error) throw error;
        fetchData();
      } else {
        const newD = { 
          id: Date.now().toString(), 
          ...newDepotForm,
          image_url: depotImage ? URL.createObjectURL(depotImage) : '',
          documents: depotDoc ? [depotDoc.name] : []
        };
        setDepots([newD, ...depots]);
      }
      
      setIsAddDepotModalOpen(false);
      setNewDepotForm({ name: '', depot_code: '', owner_name: '', owner_phone: '', owner_phone_2: '', address: '' });
      setDepotImage(null); setDepotDoc(null);
      showToast('নতুন ডিপো যোগ হয়েছে!');
    } catch (error: any) { showToast(error.message, 'error'); } finally { setIsSaving(false); }
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      <PremiumToast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={selectedDealer ? () => setSelectedDealer(null) : selectedDepot ? () => setSelectedDepot(null) : onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">
              {selectedDealer ? 'ডিলার বিস্তারিত' : selectedDepot ? 'ডিপো বিস্তারিত' : 'ডিলার ও ডিপো'}
            </h1>
          </div>
          {selectedDealer && (
            <button onClick={() => openProfileModal(selectedDealer)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition active:scale-95">
              <User size={16} />
              <span className="text-xs font-bold">প্রোফাইল</span>
            </button>
          )}
        </div>

        {/* টগল বার (ডিলার / ডিপো) */}
        {!selectedDealer && !selectedDepot && (
          <div className="flex px-3 pb-2 gap-2">
            <button onClick={() => setActiveTab('dealer')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'dealer' ? 'bg-white text-da-depotNavy shadow-sm' : 'bg-white/10 text-white/80'}`}>
              <User size={14}/> ডিলার
            </button>
            <button onClick={() => setActiveTab('depot')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'depot' ? 'bg-white text-da-depotNavy shadow-sm' : 'bg-white/10 text-white/80'}`}>
              <Building2 size={14}/> ডিপো
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ==================== ডিলার ভিউ ==================== */}
        {!selectedDealer && !selectedDepot && activeTab === 'dealer' && (
          <>
            <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex justify-between items-center shrink-0">
              <div className="flex-1 text-center border-r border-white/20">
                <p className="text-xs font-bold text-blue-100">মোট ডিলার</p>
                <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(dealers.length)} জন</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-blue-100">মোট বাকি</p>
                <p className="text-xl font-black mt-1 text-da-depotAmber">{isLoading ? '...' : toBangla(totalDealerDue)} ৳</p>
              </div>
            </div>

            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-blue shrink-0">
              <Search size={18} className="text-da-textMuted" />
              <input type="text" placeholder="ডিলারের নাম বা মোবাইল খুঁজুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : filteredList.length === 0 ? (
              <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো ডিলার পাওয়া যায়নি</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredList.map(dealer => (
                  <div key={dealer.id} onClick={() => setSelectedDealer(dealer)} className="bg-white px-2.5 py-2 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue shrink-0 border border-da-cardBorder overflow-hidden" onClick={(e) => openProfileModal(dealer, e)}>
                        {dealer.image_url ? <img src={dealer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      <div className="min-w-0" onClick={(e) => openProfileModal(dealer, e)}>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[13px] text-da-textDark truncate">{dealer.name}</h3>
                          {dealer.dealer_code && <span className="text-[9px] bg-da-depotBlue/10 text-da-depotBlue px-1 rounded border border-da-depotBlue/20">{dealer.dealer_code}</span>}
                        </div>
                        <p className="text-[10px] text-da-textMuted truncate flex items-center gap-1.5 mt-0.5">
                          <Phone size={10} /> {dealer.phone} {dealer.phone_2 ? ` / ${dealer.phone_2}` : ''} {dealer.area ? `| ${dealer.area}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className={`font-black text-[13px] ${Number(dealer.due_balance) > 0 ? 'text-da-red' : 'text-da-green'}`}>৳{toBangla(dealer.due_balance)}</p>
                      <span className="text-[8px] font-bold text-da-textMuted uppercase">বাকি</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== ডিপো ভিউ (লিস্ট) ==================== */}
        {!selectedDealer && !selectedDepot && activeTab === 'depot' && (
          <>
            <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex justify-center items-center shrink-0">
              <div className="text-center">
                <p className="text-xs font-bold text-blue-100">মোট ডিপো</p>
                <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(depots.length)} টি</p>
              </div>
            </div>

            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-blue shrink-0">
              <Search size={18} className="text-da-textMuted" />
              <input type="text" placeholder="ডিপোর নাম বা কোড খুঁজুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : filteredList.length === 0 ? (
              <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো ডিপো পাওয়া যায়নি</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredList.map(depot => (
                  <div 
                    key={depot.id} 
                    onClick={() => setSelectedDepot(depot)}
                    className="bg-white px-2.5 py-2 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue shrink-0 overflow-hidden border border-da-cardBorder">
                        {depot.image_url ? <img src={depot.image_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={18}/>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-[13px] text-da-textDark truncate">{depot.name}</h3>
                          {depot.depot_code && <span className="text-[9px] bg-da-depotBlue/10 text-da-depotBlue px-1 rounded border border-da-depotBlue/20">{depot.depot_code}</span>}
                        </div>
                        <p className="text-[10px] text-da-textMuted truncate flex items-center gap-1.5 mt-0.5">
                          <User size={10} /> {depot.owner_name || 'মালিক নেই'} | <Phone size={10} /> {depot.owner_phone} {depot.owner_phone_2 ? ` / ${depot.owner_phone_2}` : ''}
                        </p>
                      </div>
                    </div>
                    <ArrowRightLeft size={16} className="text-da-textMuted shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== ডিলার লেজার ভিউ ==================== */}
        {selectedDealer && (
          <>
            <div className="bg-white p-4 rounded-xl border border-da-cardBorder shadow-sm flex flex-col items-center text-center shrink-0">
              <div onClick={() => openProfileModal(selectedDealer)} className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform">
                <div className="w-16 h-16 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue mb-2 border border-da-cardBorder overflow-hidden group-hover:ring-2 group-hover:ring-da-depotBlue/50 transition-all">
                  {selectedDealer.image_url ? <img src={selectedDealer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={32} />}
                </div>
                <h2 className="font-black text-lg text-da-textDark group-hover:text-da-depotBlue transition-colors">{selectedDealer.name}</h2>
              </div>
              <p className="text-sm text-da-textMuted flex items-center gap-1 mt-1"><Phone size={12}/> {selectedDealer.phone} {selectedDealer.phone_2 ? ` / ${selectedDealer.phone_2}` : ''}</p>
              {selectedDealer.area && <p className="text-xs text-da-textMuted flex items-center gap-1 mt-1"><MapPin size={12}/> {selectedDealer.area}</p>}
              
              <div className="w-full mt-3 pt-3 border-t border-da-cardBorder flex justify-between items-center">
                <span className="text-sm font-bold text-da-textDark">বর্তমান বাকি</span>
                <span className={`font-black text-xl ${Number(selectedDealer.due_balance) > 0 ? 'text-da-red' : 'text-da-green'}`}>৳{toBangla(selectedDealer.due_balance)}</span>
              </div>

              {selectedDealer.documents && selectedDealer.documents.length > 0 && (
                <div className="w-full mt-2 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left flex items-start gap-1.5">
                  <FileText size={14} className="text-da-depotNavy shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                    {selectedDealer.documents.map((doc: string, idx: number) => (
                      <button key={idx} onClick={() => handleViewDocument(doc)} disabled={loadingDocKey === doc} className="text-[10px] font-bold text-da-depotBlue bg-white px-2 py-1 rounded border border-da-cardBorder whitespace-nowrap flex items-center gap-1 active:scale-95 transition">
                        {loadingDocKey === doc ? <Loader2 size={10} className="animate-spin" /> : <ExternalLink size={10} />} ডকুমেন্ট দেখুন
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                <p className="text-xs text-da-textMuted font-bold">এই ডিলারের কোনো লেনদেন পাওয়া যায়নি।</p>
              </div>
            </div>
          </>
        )}

        {/* ==================== ডিপো বিস্তারিত ভিউ ==================== */}
        {selectedDepot && (
          <>
            <div className="bg-white p-4 rounded-xl border border-da-cardBorder shadow-sm flex flex-col items-center text-center shrink-0">
              <div className="w-16 h-16 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue mb-2 border border-da-cardBorder overflow-hidden">
                {selectedDepot.image_url ? <img src={selectedDepot.image_url} alt="" className="w-full h-full object-cover" /> : <Building2 size={32}/>}
              </div>
              <h2 className="font-black text-lg text-da-textDark">{selectedDepot.name}</h2>
              {selectedDepot.depot_code && <span className="text-xs font-bold text-da-depotBlue bg-da-depotBlue/10 px-2 py-0.5 rounded-full mt-1 border border-da-depotBlue/20">{selectedDepot.depot_code}</span>}
              
              <div className="w-full mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-da-depotBg p-2.5 rounded-lg border border-da-cardBorder text-left">
                  <User className="text-da-depotNavy" size={18} />
                  <div>
                    <p className="text-[10px] text-da-textMuted font-bold">ডিপো মালিক</p>
                    <p className="text-sm font-bold text-da-textDark">{selectedDepot.owner_name || 'দেওয়া হয়নি'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-da-depotBg p-2.5 rounded-lg border border-da-cardBorder text-left">
                  <Phone className="text-da-depotNavy" size={18} />
                  <div>
                    <p className="text-[10px] text-da-textMuted font-bold">মোবাইল নম্বর</p>
                    <p className="text-sm font-bold text-da-textDark">
                      {selectedDepot.owner_phone || 'দেওয়া হয়নি'} 
                      {selectedDepot.owner_phone_2 ? ` / ${selectedDepot.owner_phone_2}` : ''}
                    </p>
                  </div>
                </div>
                {selectedDepot.address && (
                  <div className="flex items-center gap-3 bg-da-depotBg p-2.5 rounded-lg border border-da-cardBorder text-left">
                    <MapPin className="text-da-depotNavy" size={18} />
                    <div>
                      <p className="text-[10px] text-da-textMuted font-bold">ঠিকানা</p>
                      <p className="text-sm font-bold text-da-textDark">{selectedDepot.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedDepot.documents && selectedDepot.documents.length > 0 && (
                <div className="w-full mt-2 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left flex items-start gap-1.5">
                  <FileText size={14} className="text-da-depotNavy shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                    {selectedDepot.documents.map((doc: string, idx: number) => (
                      <button key={idx} onClick={() => handleViewDocument(doc)} disabled={loadingDocKey === doc} className="text-[10px] font-bold text-da-depotBlue bg-white px-2 py-1 rounded border border-da-cardBorder whitespace-nowrap flex items-center gap-1 active:scale-95 transition">
                        {loadingDocKey === doc ? <Loader2 size={10} className="animate-spin" /> : <ExternalLink size={10} />} ডকুমেন্ট দেখুন
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 shrink-0 mt-1">
              <button onClick={() => onNavigate('depot')} className="bg-da-depotBlue text-white py-3 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <ArrowRightLeft size={20}/> <span className="text-xs">মাল ট্রান্সফার</span>
              </button>
              <button onClick={() => onNavigate('stock')} className="bg-da-depotNavy text-white py-3 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Store size={20}/> <span className="text-xs">স্টক দেখুন</span>
              </button>
            </div>
            <button onClick={() => setDeleteConfirmType('depot')} className="mt-2 bg-red-50 text-da-red border border-da-red/30 py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95 transition shrink-0">
              <Trash2 size={16}/> ডিপো ডিলিট করুন
            </button>
          </>
        )}

      </main>

      {/* বটম বার */}
      {!selectedDealer && !selectedDepot && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
          {activeTab === 'dealer' ? (
            <button onClick={() => setIsAddDealerModalOpen(true)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
              <Plus size={18}/> নতুন ডিলার যোগ করুন
            </button>
          ) : (
            <button onClick={() => setIsAddDepotModalOpen(true)} className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
              <Plus size={18}/> নতুন ডিপো যোগ করুন
            </button>
          )}
        </div>
      )}

      {/* ==================== নতুন ডিলার মডাল ==================== */}
      {isAddDealerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন ডিলার</h2>
              <button onClick={() => setIsAddDealerModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলারের নাম *</label><input type="text" value={newDealer.name} onChange={e => setNewDealer({...newDealer, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলার আইডি</label><input type="text" value={newDealer.dealer_code} onChange={e => setNewDealer({...newDealer, dealer_code: e.target.value})} placeholder="DLR-001" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন ১ *</label><input type="tel" inputMode="numeric" value={newDealer.phone} onChange={e => setNewDealer({...newDealer, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন ২</label><input type="tel" inputMode="numeric" value={newDealer.phone_2} onChange={e => setNewDealer({...newDealer, phone_2: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">পূর্বের বাকি</label><input type="number" value={newDealer.previous_due} onChange={e => setNewDealer({...newDealer, previous_due: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা / এলাকা</label><input type="text" value={newDealer.area} onChange={e => setNewDealer({...newDealer, area: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => imageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <ImageIcon size={18} className={dealerImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{dealerImage ? dealerImage.name : 'ডিলারের ছবি'}</span>
                </button>
                <input type="file" ref={imageInputRef} onChange={e => setDealerImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                <button onClick={() => docInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <FileText size={18} className={dealerDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{dealerDoc ? dealerDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={docInputRef} onChange={e => setDealerDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddDealerModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddDealer} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== নতুন ডিপো মডাল ==================== */}
      {isAddDepotModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Building2 size={16}/> নতুন ডিপো</h2>
              <button onClick={() => setIsAddDepotModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিপোর নাম *</label><input type="text" value={newDepotForm.name} onChange={e => setNewDepotForm({...newDepotForm, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিপো কোড</label><input type="text" value={newDepotForm.depot_code} onChange={e => setNewDepotForm({...newDepotForm, depot_code: e.target.value})} placeholder="DP-001" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">মালিকের নাম</label><input type="text" value={newDepotForm.owner_name} onChange={e => setNewDepotForm({...newDepotForm, owner_name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">মালিকের ফোন ১</label><input type="tel" inputMode="numeric" value={newDepotForm.owner_phone} onChange={e => setNewDepotForm({...newDepotForm, owner_phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">মালিকের ফোন ২</label><input type="tel" inputMode="numeric" value={newDepotForm.owner_phone_2} onChange={e => setNewDepotForm({...newDepotForm, owner_phone_2: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label><input type="text" value={newDepotForm.address} onChange={e => setNewDepotForm({...newDepotForm, address: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => depotImageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <ImageIcon size={18} className={depotImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{depotImage ? depotImage.name : 'ডিপোর ছবি'}</span>
                </button>
                <input type="file" ref={depotImageInputRef} onChange={e => setDepotImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                <button onClick={() => depotDocInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <FileText size={18} className={depotDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{depotDoc ? depotDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={depotDocInputRef} onChange={e => setDepotDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddDepotModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddDepot} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}</button>
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
                  <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold transition"><Edit3 size={12}/> এডিট</button>
                ) : (
                  <button onClick={() => setIsEditingProfile(false)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-bold transition"><X size={12}/> বাতিল</button>
                )}
                <button onClick={() => setIsProfileModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
              </div>
            </div>
            <div className="p-5 flex flex-col items-center overflow-y-auto">
              
              <div onClick={() => isEditingProfile && editImageInputRef.current?.click()} className="w-24 h-24 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue mb-3 border-4 border-da-depotNavy/10 overflow-hidden shadow-inner relative group cursor-pointer">
                {editDealerImage ? <img src={URL.createObjectURL(editDealerImage)} alt="" className="w-full h-full object-cover" /> : selectedDealer.image_url ? <img src={selectedDealer.image_url} alt={selectedDealer.name} className="w-full h-full object-cover" /> : <User size={48} />}
                {isEditingProfile && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><ImageIcon size={24} className="text-white" /></div>}
              </div>
              <input type="file" ref={editImageInputRef} onChange={e => setEditDealerImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />

              {!isEditingProfile ? (
                <>
                  <h2 className="font-black text-xl text-da-textDark">{selectedDealer.name}</h2>
                  <div className="w-full mt-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <Phone className="text-da-depotNavy" size={18} />
                      <div>
                        <p className="text-[10px] text-da-textMuted font-bold">মোবাইল নম্বর</p>
                        <p className="text-sm font-bold text-da-textDark">{selectedDealer.phone} {selectedDealer.phone_2 ? ` / ${selectedDealer.phone_2}` : ''}</p>
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
                  </div>
                </>
              ) : (
                <div className="w-full mt-2 flex flex-col gap-3">
                  <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলারের নাম</label><input type="text" value={editDealerData.name} onChange={e => setEditDealerData({...editDealerData, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলার আইডি</label><input type="text" value={editDealerData.dealer_code} onChange={e => setEditDealerData({...editDealerData, dealer_code: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                    <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন ১</label><input type="tel" inputMode="numeric" value={editDealerData.phone} onChange={e => setEditDealerData({...editDealerData, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন ২</label><input type="tel" inputMode="numeric" value={editDealerData.phone_2} onChange={e => setEditDealerData({...editDealerData, phone_2: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                    <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">পূর্বের বাকি</label><input type="number" value={editDealerData.previous_due} onChange={e => setEditDealerData({...editDealerData, previous_due: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                  </div>
                  <div><label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label><input type="text" value={editDealerData.area} onChange={e => setEditDealerData({...editDealerData, area: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" /></div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button
                onClick={() => setDeleteConfirmType('dealer')}
                disabled={isSaving}
                className="bg-red-50 text-da-red border border-da-red/30 px-3 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-1 active:scale-95 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
              {isEditingProfile ? (
                <button onClick={handleUpdateDealer} disabled={isSaving} className="flex-1 bg-da-green text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16}/> সেভ করুন</>}</button>
              ) : (
                <button onClick={() => setIsProfileModalOpen(false)} className="flex-1 bg-da-depotNavy text-white py-2.5 rounded-xl font-bold shadow-md">বন্ধ করুন</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* পেমেন্ট মডাল */}
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
              <button onClick={handlePayment} disabled={isSaving} className="flex-1 bg-da-green text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">{isSaving ? <Loader2 size={16} className="animate-spin"/> : 'জমা করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ডিলিট কনফার্মেশন মডাল */}
      {deleteConfirmType && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 text-center">
              <div className="w-14 h-14 bg-da-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} className="text-da-red" />
              </div>
              <h3 className="font-bold text-base text-da-textDark mb-1">
                {deleteConfirmType === 'dealer' ? 'ডিলার ডিলিট করবেন?' : 'ডিপো ডিলিট করবেন?'}
              </h3>
              <p className="text-xs text-da-textMuted">
                {deleteConfirmType === 'dealer'
                  ? `"${selectedDealer?.name}" ডিলিট হয়ে যাবে। এটি আর ফেরানো যাবে না।`
                  : `"${selectedDepot?.name}" ডিলিট হয়ে যাবে। এটি আর ফেরানো যাবে না।`}
              </p>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setDeleteConfirmType(null)} disabled={isDeleting} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold disabled:opacity-50">বাতিল</button>
              <button onClick={deleteConfirmType === 'dealer' ? handleDeleteDealer : handleDeleteDepot} disabled={isDeleting} className="flex-1 bg-da-red text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center gap-1.5 disabled:opacity-60">
                {isDeleting ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} ডিলিট
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}