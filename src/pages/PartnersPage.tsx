import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, HelpCircle, Plus, Search, UserPlus, 
  X, TrendingUp, TrendingDown, 
  Percent, FileText, Image as ImageIcon, Edit3, Loader2,
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoPartners, demoPartnerTransactions, demoBusinessProfit } from '../lib/demoData';

interface Props {
  onBack: () => void;
}

interface Transaction {
  id: string;
  amount: number;
  date: string;
  note: string;
}

interface Partner {
  id: string;
  name: string;
  phone: string;
  address: string;
  share_percentage: number;
  initial_capital: number;
  image_url?: string;
  document_url?: string;
  transactions?: Transaction[];
}

export default function PartnersPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalBusinessProfit, setTotalBusinessProfit] = useState(0);

  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // সিলেক্টেড পার্টনার ও ট্রানজেকশন টাইপ
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [txType, setTxType] = useState<'investment' | 'withdrawal'>('investment');

  // ফর্ম স্টেট
  const [partnerForm, setPartnerForm] = useState({ 
    name: '', phone: '', address: '', share: '', initialInvestment: '' 
  });
  const [txForm, setTxForm] = useState({ amount: '', note: '' });

  // আপলোড স্টেট
  const [partnerImage, setPartnerImage] = useState<File | null>(null);
  const [partnerDoc, setPartnerDoc] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // টোস্ট
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const mappedPartners = demoPartners.map((p: any) => ({
          ...p,
          transactions: demoPartnerTransactions.filter((t: any) => t.partner_id === p.id).map((t: any) => ({
            id: t.id, amount: t.amount, date: t.transaction_date, note: t.note
          }))
        }));
        setPartners(mappedPartners);
        setTotalBusinessProfit(demoBusinessProfit);
      } else {
        if (!activeBusiness?.id) return;

        // ১. পার্টনার ও ট্রানজেকশন লোড
        const [partnerRes, txRes] = await Promise.all([
          supabase.from('partners').select('*').eq('business_id', activeBusiness.id),
          supabase.from('partner_transactions').select('*') // RLS handle করবে
        ]);
        
        if (partnerRes.error) throw partnerRes.error;

        const merged = (partnerRes.data || []).map(p => ({
          ...p,
          transactions: txRes.data?.filter(t => t.partner_id === p.id) || []
        }));
        setPartners(merged);

        // ২. মোট লাভের হিসাব (সম্পূর্ণ বিজনেসের জন্য)
        const [sales, purchases, expenses] = await Promise.all([
          supabase.from('sales').select('total_amount').eq('business_id', activeBusiness.id),
          supabase.from('purchases').select('total_amount').eq('business_id', activeBusiness.id),
          supabase.from('expenses').select('amount').eq('business_id', activeBusiness.id)
        ]);

        const tSales = sales.data?.reduce((a, c) => a + Number(c.total_amount), 0) || 0;
        const tPurch = purchases.data?.reduce((a, c) => a + Number(c.total_amount), 0) || 0;
        const tExp = expenses.data?.reduce((a, c) => a + Number(c.amount), 0) || 0;
        
        setTotalBusinessProfit(tSales - tPurch - tExp);
      }
    } catch (error: any) {
      showToast('ডাটা লোড করতে সমস্যা: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  // ব্যালেন্স ক্যালকুলেশন (মূলধন + লাভের শেয়ার + বিনিয়োগ - উত্তোলন)
  const calculateBalance = (partner: Partner) => {
    const inv = partner.transactions?.filter(t => t.amount > 0).reduce((a, c) => a + Number(c.amount), 0) || 0;
    const wd = partner.transactions?.filter(t => t.amount < 0).reduce((a, c) => a + Math.abs(Number(c.amount)), 0) || 0;
    
    const profitShare = (totalBusinessProfit * Number(partner.share_percentage)) / 100;
    
    return Number(partner.initial_capital) + profitShare + inv - wd;
  };

  const openEditPartner = (partner: Partner) => {
    setPartnerForm({
      name: partner.name,
      phone: partner.phone || '',
      address: partner.address || '',
      share: partner.share_percentage?.toString() || '0',
      initialInvestment: partner.initial_capital?.toString() || '0'
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleSavePartner = async () => {
    if (!partnerForm.name) return showToast('পার্টনারের নাম আবশ্যক', 'error');
    setIsSaving(true);
    
    try {
      if (isDemoMode) {
        let updatedList;
        if (isEditing && selectedPartner) {
          updatedList = partners.map(p => p.id === selectedPartner.id ? {
            ...p,
            name: partnerForm.name,
            phone: partnerForm.phone,
            address: partnerForm.address,
            share_percentage: Number(partnerForm.share),
            initial_capital: Number(partnerForm.initialInvestment),
            image_url: partnerImage ? URL.createObjectURL(partnerImage) : p.image_url
          } : p);
          setSelectedPartner(updatedList.find(p => p.id === selectedPartner.id) || null);
        } else {
          const newPartner: Partner = {
            id: Date.now().toString(),
            name: partnerForm.name,
            phone: partnerForm.phone,
            address: partnerForm.address,
            share_percentage: Number(partnerForm.share) || 0,
            initial_capital: Number(partnerForm.initialInvestment) || 0,
            image_url: partnerImage ? URL.createObjectURL(partnerImage) : '',
            transactions: []
          };
          updatedList = [newPartner, ...partners];
        }
        setPartners(updatedList);
      } else {
        if (!activeBusiness?.id) return;
        
        let uploadedImageUrl = '';
        // ইমেজ আপলোড লজিক (যদি ইমেজ থাকে)
        if (partnerImage) {
          const fileExt = partnerImage.name.split('.').pop();
          const fileName = `partner-${Date.now()}.${fileExt}`;
          const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, partnerImage);
          if (!uploadErr) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            uploadedImageUrl = data.publicUrl;
          }
        }

        const partnerData = {
          business_id: activeBusiness.id,
          name: partnerForm.name,
          phone: partnerForm.phone,
          address: partnerForm.address,
          share_percentage: Number(partnerForm.share) || 0,
          initial_capital: Number(partnerForm.initialInvestment) || 0,
          ...(uploadedImageUrl && { image_url: uploadedImageUrl })
        };

        if (isEditing && selectedPartner) {
          await supabase.from('partners').update(partnerData).eq('id', selectedPartner.id);
        } else {
          await supabase.from('partners').insert([partnerData]);
        }
        fetchData();
      }
      
      setIsAddModalOpen(false);
      setPartnerForm({ name: '', phone: '', address: '', share: '', initialInvestment: '' });
      setPartnerImage(null); setPartnerDoc(null);
      showToast(isEditing ? 'পার্টনার আপডেট হয়েছে!' : 'নতুন পার্টনার যোগ হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTx = async () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) return showToast('সঠিক পরিমাণ লিখুন', 'error');
    if (!selectedPartner) return;
    setIsSaving(true);

    try {
      const finalAmount = txType === 'investment' ? Number(txForm.amount) : -Number(txForm.amount);
      const noteText = txForm.note || (txType === 'investment' ? 'মূলধন বিনিয়োগ' : 'ব্যক্তিগত উত্তোলন');

      if (isDemoMode) {
        const newTx: Transaction = {
          id: Date.now().toString(),
          amount: finalAmount,
          date: new Date().toISOString().split('T')[0],
          note: noteText
        };

        const updatedPartner = {
          ...selectedPartner,
          transactions: [newTx, ...(selectedPartner.transactions || [])]
        };

        setPartners(partners.map(p => p.id === selectedPartner.id ? updatedPartner : p));
        setSelectedPartner(updatedPartner);
      } else {
        const { error } = await supabase.from('partner_transactions').insert([{
          partner_id: selectedPartner.id,
          amount: finalAmount,
          note: noteText,
          transaction_date: new Date().toISOString().split('T')[0]
        }]);
        if (error) throw error;
        
        fetchData();
        // লোকাল স্টেটে ট্রানজেকশন আপডেট
        const { data: newTxs } = await supabase.from('partner_transactions').select('*').eq('partner_id', selectedPartner.id);
        setSelectedPartner({ ...selectedPartner, transactions: newTxs || [] });
      }
      
      setIsTxModalOpen(false);
      setTxForm({ amount: '', note: '' });
      showToast('লেনদেন সফল হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPartners = useMemo(() => {
    return partners.filter(p => p.name.includes(searchQuery) || (p.phone && p.phone.includes(searchQuery)));
  }, [partners, searchQuery]);

  return (
    <div className="h-[100dvh] bg-da-bg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
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
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg leading-tight">পার্টনার ম্যানেজমেন্ট</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue">
            <Search size={18} className="text-da-textMuted" />
            <input 
              type="text" 
              placeholder="পার্টনার খুঁজুন..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent" 
            />
          </div>
          <button onClick={() => { 
            setIsEditing(false);
            setPartnerForm({ name: '', phone: '', address: '', share: '', initialInvestment: '' });
            setPartnerImage(null); setPartnerDoc(null);
            setIsAddModalOpen(true); 
          }} className="bg-da-depotBlue text-white px-4 rounded-xl font-bold text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition shrink-0">
            <Plus size={18}/> নতুন
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
        ) : filteredPartners.length === 0 ? (
          <div className="border-2 border-dashed border-da-cardBorder rounded-xl p-8 flex flex-col items-center justify-center text-center mt-4 bg-white/50">
            <UserPlus size={40} className="text-da-textMuted mb-3" />
            <h3 className="font-bold text-da-textDark text-base">কোনো পার্টনার যুক্ত করা হয়নি</h3>
            <button onClick={() => setIsAddModalOpen(true)} className="mt-4 bg-da-depotBlue text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md">নতুন পার্টনার</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-1">
            {filteredPartners.map(partner => {
              const balance = calculateBalance(partner);
              return (
                <div 
                  key={partner.id} 
                  onClick={() => { setSelectedPartner(partner); setIsDetailsModalOpen(true); }}
                  className="relative bg-gradient-to-b from-white to-da-depotBg/30 border border-da-cardBorder rounded-2xl p-3 shadow-[0_4px_12px_-4px_rgba(10,37,64,0.1)] flex flex-col items-center text-center cursor-pointer active:scale-[0.97] transition-transform overflow-hidden"
                >
                  {/* ডেকোরেটিভ টপ বার */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-da-depotNavy to-da-depotBlue"></div>

                  {/* প্রোফাইল ছবি */}
                  <div className="w-[85px] h-[85px] bg-white rounded-full flex items-center justify-center text-da-depotBlue shrink-0 overflow-hidden border-[3px] border-da-depotBg shadow-sm mb-1.5 mt-0.5">
                    {partner.image_url ? <img src={partner.image_url} alt="" className="w-full h-full object-cover"/> : <UserPlus size={40} />}
                  </div>

                  {/* নাম ও ঠিকানা */}
                  <h3 className="font-bold text-[15px] text-da-textDark truncate w-full leading-tight">{partner.name}</h3>
                  <p className="text-[10px] text-da-textMuted truncate w-full mt-0.5">{partner.address || 'ঠিকানা দেওয়া হয়নি'}</p>

                  {/* শেয়ার শতাংশ */}
                  <span className="text-[10px] font-bold text-da-depotBlue bg-da-depotBlue/10 px-2.5 py-0.5 rounded-full border border-da-depotBlue/20 mt-1.5 flex items-center gap-1">
                    <Percent size={12}/> {toBangla(partner.share_percentage)}% শেয়ার
                  </span>

                  {/* বিনিয়োগ ও ব্যালেন্স */}
                  <div className="w-full mt-1.5 pt-1.5 border-t border-da-cardBorder/60 flex flex-col gap-0.5 bg-white/60 rounded-lg px-1.5 py-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-da-textMuted font-bold">বিনিয়োগ:</span>
                      <span className="text-[11px] font-bold text-da-textDark">৳{toBangla(partner.initial_capital)}</span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-da-textMuted font-bold">ব্যালেন্স:</span>
                      <span className={`text-[13px] font-black ${balance >= 0 ? 'text-da-greenDeep' : 'text-da-red'}`}>
                        ৳{toBangla(Math.abs(balance))}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ================= মডাল: নতুন পার্টনার ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-auto max-h-[90dvh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{isEditing ? 'পার্টনার এডিট করুন' : 'নতুন পার্টনার যুক্ত করুন'}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পার্টনারের নাম *</label>
                <input type="text" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">শতাংশ (%)</label>
                  <input type="number" value={partnerForm.share} onChange={e => setPartnerForm({...partnerForm, share: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">প্রারম্ভিক মূলধন (৳)</label>
                  <input type="number" value={partnerForm.initialInvestment} onChange={e => setPartnerForm({...partnerForm, initialInvestment: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">মোবাইল নম্বর</label>
                <input type="text" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label>
                <input type="text" value={partnerForm.address} onChange={e => setPartnerForm({...partnerForm, address: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              {/* আপলোড অপশন */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => imageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <ImageIcon size={18} className={partnerImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{partnerImage ? partnerImage.name : 'পার্টনারের ছবি'}</span>
                </button>
                <input type="file" ref={imageInputRef} onChange={e => setPartnerImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                
                <button onClick={() => docInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <FileText size={18} className={partnerDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{partnerDoc ? partnerDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={docInputRef} onChange={e => setPartnerDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSavePartner} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: পার্টনার ডিটেইলস ও লেজার ================= */}
      {isDetailsModalOpen && selectedPartner && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-da-depotBg w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="bg-da-depotNavy p-4 text-white shrink-0 relative">
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => { setIsDetailsModalOpen(false); openEditPartner(selectedPartner); }} className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-md text-[10px] font-bold"><Edit3 size={12}/> এডিট</button>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={18}/></button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  {selectedPartner.image_url ? <img src={selectedPartner.image_url} alt="" className="w-full h-full object-cover"/> : <UserPlus size={24} />}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedPartner.name}</h2>
                  <p className="text-xs text-cyan-200">{toBangla(selectedPartner.share_percentage)}% শেয়ার হোল্ডার</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-b shrink-0">
              <div className="bg-da-depotBg rounded-xl p-3 flex justify-between items-center border border-da-cardBorder">
                <div>
                  <p className="text-[10px] font-bold text-da-textMuted mb-0.5">বর্তমান মোট মূলধন</p>
                  <p className={`font-black text-xl ${calculateBalance(selectedPartner) >= 0 ? 'text-da-depotBlue' : 'text-da-red'}`}>
                    ৳ {toBangla(Math.abs(calculateBalance(selectedPartner)))}
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-[10px] font-bold text-right">
                  <span className="text-da-textMuted">প্রারম্ভিক: ৳{toBangla(selectedPartner.initial_capital)}</span>
                  <span className="text-green-600">লাভের শেয়ার: ৳{toBangla((totalBusinessProfit * selectedPartner.share_percentage) / 100)}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <h3 className="font-bold text-[11px] text-da-textDark mb-1">লেনদেনের ইতিহাস</h3>
              {(!selectedPartner.transactions || selectedPartner.transactions.length === 0) ? (
                <div className="text-center text-da-textMuted mt-6 text-xs flex flex-col items-center">
                  <FileText size={32} className="mb-2 opacity-50"/> কোনো লেনদেন পাওয়া যায়নি
                </div>
              ) : (
                selectedPartner.transactions.map(tx => (
                  <div key={tx.id} className="bg-white border border-da-cardBorder p-2.5 rounded-lg shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.amount > 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                      </div>
                      <div>
                        <p className="font-bold text-[11px] text-da-textDark">{tx.note}</p>
                        <p className="text-[9px] text-da-textMuted mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`font-black text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : '-'}{toBangla(Math.abs(tx.amount))} ৳
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white border-t flex gap-2 shrink-0">
              <button onClick={() => { setTxType('withdrawal'); setIsTxModalOpen(true); }} className="flex-1 bg-white border border-da-red text-da-red py-2.5 rounded-xl font-bold shadow-sm text-sm flex justify-center items-center gap-1">
                <TrendingDown size={16}/> টাকা উত্তোলন
              </button>
              <button onClick={() => { setTxType('investment'); setIsTxModalOpen(true); }} className="flex-1 bg-da-depotBlue text-white py-2.5 rounded-xl font-bold shadow-md text-sm flex justify-center items-center gap-1">
                <TrendingUp size={16}/> নতুন বিনিয়োগ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন লেনদেন ================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`p-3 text-white flex justify-between items-center ${txType === 'investment' ? 'bg-da-depotBlue' : 'bg-da-red'}`}>
              <h2 className="font-bold text-sm">{txType === 'investment' ? 'নতুন বিনিয়োগ যুক্ত করুন' : 'টাকা উত্তোলন করুন'}</h2>
              <button onClick={() => setIsTxModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-da-depotBg border border-da-cardBorder p-2 text-center rounded-lg">
                <p className="text-[10px] text-da-textMuted font-bold">পার্টনার: {selectedPartner?.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-da-textDark mb-1 block">টাকার পরিমাণ <span className="text-red-500">*</span></label>
                <input type="number" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} placeholder="0" className="w-full bg-white border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-xs font-bold text-da-textDark mb-1 block">নোট (ঐচ্ছিক)</label>
                <input type="text" value={txForm.note} onChange={e => setTxForm({...txForm, note: e.target.value})} placeholder="লেনদেনের কারণ..." className="w-full bg-white border border-da-cardBorder rounded-lg p-2.5 text-sm outline-none focus:border-da-depotBlue" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg">
              <button onClick={handleSaveTx} disabled={isSaving} className={`w-full ${txType === 'investment' ? 'bg-da-depotBlue' : 'bg-da-red'} text-white py-2.5 rounded-lg font-bold shadow-md flex justify-center items-center`}>
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}