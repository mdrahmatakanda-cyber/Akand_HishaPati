import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Plus, X, Loader2, 
  User, Phone, MapPin, Wallet, 
  ReceiptText, Clock, CheckCircle2, AlertTriangle, ArrowRightLeft,
  Image as ImageIcon, FileText, Truck, Edit3, Store, Building2, Trash2, ExternalLink,
  RotateCcw
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
  const editDocInputRef = useRef<HTMLInputElement>(null);

  const [editDealerData, setEditDealerData] = useState({ name: '', phone: '', phone_2: '', area: '', dealer_code: '', previous_due: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [deleteConfirmType, setDeleteConfirmType] = useState<'dealer' | 'depot' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ ডিলার ট্রান্সফার, রিটার্ন ও লেজার স্টেট
  const [dealerLedger, setDealerLedger] = useState<any[]>([]);
  const [depotProducts, setDepotProducts] = useState<any[]>([]);
  const [ledgerTab, setLedgerTab] = useState<'all' | 'transfer' | 'payment_return'>('all');
  const [dealerActionModal, setDealerActionModal] = useState<'transfer' | 'return' | null>(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [dealerActionForm, setDealerActionForm] = useState({
    productId: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    paidNow: '',
    isDamaged: true,
    notes: ''
  });
  
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

  const fetchDealerDetailsData = async (dealerId: string) => {
    try {
      if (isDemoMode) {
        setDepotProducts([{ id: 'p1', name: 'ডেমো ফিড (৫০ কেজি)', stock_quantity: 100, sale_price: 2200, purchase_price: 2000 }]);
        return;
      }
      if (!activeBusiness?.id) return;

      const [ledgerRes, prodRes] = await Promise.all([
        supabase.from('depot_dealer_ledger').select('*').eq('business_id', activeBusiness.id).eq('dealer_id', dealerId).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('business_id', activeBusiness.id).order('name')
      ]);

      if (!ledgerRes.error) setDealerLedger(ledgerRes.data || []);
      if (!prodRes.error) setDepotProducts(prodRes.data || []);
    } catch (err) {
      console.error('Dealer details fetch error:', err);
    }
  };

  useEffect(() => {
    if (selectedDealer) {
      fetchDealerDetailsData(selectedDealer.id);
      setLedgerTab('all');
    } else {
      setDealerLedger([]);
    }
  }, [selectedDealer?.id, isDemoMode, activeBusiness?.id]);

  const openDealerActionModal = (type: 'transfer' | 'return') => {
    setDealerActionForm({ productId: '', quantity: '', unitPrice: '', totalAmount: '', paidNow: '', isDamaged: true, notes: '' });
    setDealerActionModal(type);
  };

  const handleSaveDealerAction = async () => {
    if (!selectedDealer || !dealerActionModal) return;
    const qty = Number(dealerActionForm.quantity) || 0;
    const total = Number(dealerActionForm.totalAmount) || 0;
    const paid = Number(dealerActionForm.paidNow) || 0;

    if (dealerActionModal === 'transfer') {
      if (!dealerActionForm.productId || qty <= 0 || total <= 0) {
        return showToast('পণ্য, পরিমাণ এবং মোট টাকা দিন', 'error');
      }
    } else {
      if (total <= 0) return showToast('রিটার্ন টাকার পরিমাণ দিন', 'error');
    }

    setIsSavingAction(true);
    try {
      const prod = depotProducts.find(p => p.id === dealerActionForm.productId);
      const autoNote = [
        prod ? `পণ্য: ${prod.name}` : '',
        qty > 0 ? `পরিমাণ: ${qty}` : '',
        dealerActionModal === 'return' ? (dealerActionForm.isDamaged ? 'ড্যামেজ রিটার্ন' : 'ভালো মাল রিটার্ন') : '',
        dealerActionForm.notes
      ].filter(Boolean).join(' | ');

      const newDue = dealerActionModal === 'transfer'
        ? Number(selectedDealer.due_balance || 0) + (total - paid)
        : Number(selectedDealer.due_balance || 0) - total;

      if (!isDemoMode && activeBusiness?.id) {
        const { error: ledErr } = await supabase.from('depot_dealer_ledger').insert([{
          business_id: activeBusiness.id,
          dealer_id: selectedDealer.id,
          product_id: dealerActionForm.productId || null,
          entry_type: dealerActionModal,
          is_damaged: dealerActionModal === 'return' ? dealerActionForm.isDamaged : false,
          quantity: qty,
          total_amount: total,
          paid_amount: dealerActionModal === 'transfer' ? paid : 0,
          notes: autoNote,
          entry_date: new Date().toISOString().split('T')[0],
        }]);
        if (ledErr) throw ledErr;

        // স্টক আপডেট: ট্রান্সফার হলে কমবে, ভালো মাল রিটার্ন হলে বাড়বে (ড্যামেজ রিটার্নে ভালো স্টক বাড়বে না)
        if (prod && qty > 0) {
          if (dealerActionModal === 'transfer') {
            const newQty = Math.max(0, Number(prod.stock_quantity || 0) - qty);
            const { error: pErr } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', prod.id);
            if (pErr) throw pErr;
          } else if (dealerActionModal === 'return' && !dealerActionForm.isDamaged) {
            const newQty = Number(prod.stock_quantity || 0) + qty;
            const { error: pErr } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', prod.id);
            if (pErr) throw pErr;
          }
        }

        // ডিলারের বাকি আপডেট
        const { error: dErr } = await supabase.from('dealers').update({ due_balance: newDue }).eq('id', selectedDealer.id);
        if (dErr) throw dErr;

        await fetchDealerDetailsData(selectedDealer.id);
        fetchData();
      } else {
        setDealerLedger(prev => [{
          id: Date.now().toString(),
          entry_type: dealerActionModal,
          is_damaged: dealerActionModal === 'return' ? dealerActionForm.isDamaged : false,
          quantity: qty,
          total_amount: total,
          paid_amount: dealerActionModal === 'transfer' ? paid : 0,
          notes: autoNote,
          entry_date: new Date().toISOString().split('T')[0],
        }, ...prev]);
        setDealers(prev => prev.map(d => d.id === selectedDealer.id ? { ...d, due_balance: newDue } : d));
      }

      setSelectedDealer({ ...selectedDealer, due_balance: newDue });
      showToast(dealerActionModal === 'transfer' ? 'মাল ট্রান্সফার সফল হয়েছে!' : 'রিটার্ন সফলভাবে সেভ হয়েছে!');
      setDealerActionModal(null);
    } catch (error: any) {
      showToast('সেভ করতে সমস্যা হয়েছে: ' + error.message, 'error');
    } finally {
      setIsSavingAction(false);
    }
  };

  // ✅ ডিলারের সংক্ষিপ্ত হিসাব
  const totalTransferred = dealerLedger.filter(l => l.entry_type === 'transfer').reduce((s, l) => s + Number(l.total_amount || 0), 0);
  const totalDealerPaid = dealerLedger.reduce((s, l) => {
    if (l.entry_type === 'payment') return s + Number(l.total_amount || 0);
    if (l.entry_type === 'transfer') return s + Number(l.paid_amount || 0);
    return s;
  }, 0);
  const totalDealerReturned = dealerLedger.filter(l => l.entry_type === 'return').reduce((s, l) => s + Number(l.total_amount || 0), 0);

  const filteredDealerLedger = useMemo(() => {
    if (ledgerTab === 'transfer') return dealerLedger.filter(l => l.entry_type === 'transfer');
    if (ledgerTab === 'payment_return') return dealerLedger.filter(l => l.entry_type === 'payment' || l.entry_type === 'return');
    return dealerLedger;
  }, [dealerLedger, ledgerTab]);

  const filteredList = useMemo(() => {
    if (activeTab === 'dealer') {
      const q = searchQuery.toLowerCase();
      return dealers.filter(d => d.name.toLowerCase().includes(q) || (d.phone && d.phone.includes(searchQuery)) || (d.dealer_code && d.dealer_code.toLowerCase().includes(q)));
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
      const newDue = Number(selectedDealer.due_balance || 0) - amount;

      if (isDemoMode) {
        setDealers(dealers.map(d => d.id === selectedDealer.id ? { ...d, due_balance: newDue } : d));
        setDealerLedger(prev => [{ id: Date.now().toString(), entry_type: 'payment', total_amount: amount, notes: 'ডিলার পেমেন্ট জমা', entry_date: new Date().toISOString().split('T')[0] }, ...prev]);
        setSelectedDealer({ ...selectedDealer, due_balance: newDue });
      } else {
        const { error: ledErr } = await supabase.from('depot_dealer_ledger').insert([{
          business_id: activeBusiness?.id,
          dealer_id: selectedDealer.id,
          entry_type: 'payment',
          total_amount: amount,
          notes: 'ডিলার পেমেন্ট জমা',
          entry_date: new Date().toISOString().split('T')[0]
        }]);
        if (ledErr) throw ledErr;

        const { error } = await supabase.from('dealers').update({ due_balance: newDue }).eq('id', selectedDealer.id);
        if (error) throw error;
        fetchData();
        fetchDealerDetailsData(selectedDealer.id);
        setSelectedDealer({ ...selectedDealer, due_balance: newDue });
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
              <input type="text" placeholder="ডিলারের নাম, আইডি বা মোবাইল খুঁজুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
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
              <button onClick={() => openDealerActionModal('transfer')} className="bg-da-depotBlue text-white py-2.5 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Truck size={16}/> <span className="text-[10px]">মাল ট্রান্সফার</span>
              </button>
              <button onClick={() => setIsPaymentModalOpen(true)} className="bg-da-green text-white py-2.5 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Wallet size={16}/> <span className="text-[10px]">পেমেন্ট</span>
              </button>
              <button onClick={() => openDealerActionModal('return')} className="bg-red-600 text-white py-2.5 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <RotateCcw size={16}/> <span className="text-[10px]">রিটার্ন</span>
              </button>
            </div>

            {/* ডিলারের সংক্ষিপ্ত হিসাব */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 shrink-0 mt-1">
              <h3 className="font-bold text-[11px] text-da-textDark mb-2 flex items-center gap-1.5 border-b border-da-cardBorder pb-1.5">
                <ReceiptText size={14} className="text-da-depotBlue"/> সংক্ষিপ্ত হিসাব {selectedDealer.dealer_code ? `(${selectedDealer.dealer_code})` : ''}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-blue-700 mb-0.5">মোট মাল ট্রান্সফার</span>
                  <span className="font-black text-sm text-blue-700">৳{toBangla(totalTransferred)}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-emerald-700 mb-0.5">মোট পেমেন্ট / জমা</span>
                  <span className="font-black text-sm text-emerald-700">৳{toBangla(totalDealerPaid)}</span>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-amber-800 mb-0.5">মোট রিটার্ন</span>
                  <span className="font-black text-sm text-amber-700">৳{toBangla(totalDealerReturned)}</span>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-red-600 mb-0.5">বর্তমান বাকি</span>
                  <span className="font-black text-sm text-red-600">৳{toBangla(selectedDealer.due_balance || 0)}</span>
                </div>
              </div>
            </div>

            {/* লেনদেনের ইতিহাস (বিক্রির খাতা ও পেমেন্ট/রিটার্ন ট্যাব) */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-3 shrink-0 mt-1">
              <h3 className="font-bold text-sm text-da-textDark mb-2 flex items-center gap-2 border-b border-da-cardBorder pb-2">
                <Clock size={16} className="text-da-depotBlue"/> লেনদেনের ইতিহাস
              </h3>
              <div className="grid grid-cols-3 gap-1 bg-da-depotBg p-1 rounded-lg mb-2.5">
                <button onClick={() => setLedgerTab('all')} className={`py-1 rounded text-[10px] font-bold transition ${ledgerTab === 'all' ? 'bg-da-depotNavy text-white' : 'text-da-textMuted'}`}>সব ({toBangla(dealerLedger.length)})</button>
                <button onClick={() => setLedgerTab('transfer')} className={`py-1 rounded text-[10px] font-bold transition ${ledgerTab === 'transfer' ? 'bg-da-depotBlue text-white' : 'text-da-textMuted'}`}>বিক্রির খাতা</button>
                <button onClick={() => setLedgerTab('payment_return')} className={`py-1 rounded text-[10px] font-bold transition ${ledgerTab === 'payment_return' ? 'bg-da-green text-white' : 'text-da-textMuted'}`}>জমা ও রিটার্ন</button>
              </div>

              {filteredDealerLedger.length === 0 ? (
                <div className="flex flex-col items-center py-5">
                  <div className="w-11 h-11 rounded-full bg-da-depotBg flex items-center justify-center mb-2">
                    <ArrowRightLeft size={18} className="text-da-depotBlue/50" />
                  </div>
                  <p className="text-xs text-da-textMuted font-bold">এই ডিলারের কোনো লেনদেন পাওয়া যায়নি।</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredDealerLedger.map(item => (
                    <div key={item.id} className="bg-da-depotBg border border-da-cardBorder rounded-lg p-2 flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-white border border-da-cardBorder flex items-center justify-center shrink-0">
                          {item.entry_type === 'transfer' ? <Truck size={13} className="text-da-depotBlue"/> : item.entry_type === 'return' ? <RotateCcw size={13} className="text-red-600"/> : <Wallet size={13} className="text-da-green"/>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] text-da-textDark truncate">
                            {item.entry_type === 'transfer' ? 'মাল ট্রান্সফার / বিক্রি' : item.entry_type === 'return' ? 'মাল রিটার্ন' : 'পেমেন্ট জমা'}
                          </p>
                          <p className="text-[9px] text-da-textMuted truncate">{item.entry_date} {item.notes ? `• ${item.notes}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <p className={`font-black text-[11px] ${item.entry_type === 'transfer' ? 'text-da-depotBlue' : item.entry_type === 'return' ? 'text-red-600' : 'text-da-green'}`}>
                          ৳{toBangla(item.total_amount || 0)}
                        </p>
                        {item.entry_type === 'transfer' && Number(item.paid_amount) > 0 && (
                          <p className="text-[8px] font-bold text-da-green">জমা: ৳{toBangla(item.paid_amount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                    {Array.isArray(selectedDealer.documents) && selectedDealer.documents.length > 0 && (
                      <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder flex items-start gap-2.5">
                        <FileText className="text-da-depotNavy shrink-0 mt-0.5" size={18} />
                        <div className="flex-1 text-left">
                          <p className="text-[10px] text-da-textMuted font-bold mb-1">সংযুক্ত ডকুমেন্ট</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedDealer.documents.map((doc: string, idx: number) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleViewDocument(doc)}
                                disabled={loadingDocKey === doc}
                                className="text-xs font-bold text-da-depotBlue bg-white px-2.5 py-1 rounded border border-da-cardBorder flex items-center gap-1 active:scale-95 transition"
                              >
                                {loadingDocKey === doc ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />} ডকুমেন্ট দেখুন
                              </button>
                            ))}
                          </div>
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

                  <div>
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডকুমেন্ট (PDF / ছবি)</label>
                    <button
                      type="button"
                      onClick={() => editDocInputRef.current?.click()}
                      className="w-full border border-dashed border-da-cardBorder rounded-lg p-2.5 flex items-center justify-center gap-2 text-da-textMuted hover:border-da-depotBlue transition"
                    >
                      <FileText size={16} className={editDealerDoc ? 'text-da-green' : ''} />
                      <span className="text-xs font-bold truncate">
                        {editDealerDoc
                          ? editDealerDoc.name
                          : (Array.isArray(selectedDealer.documents) && selectedDealer.documents.length > 0 ? 'ডকুমেন্ট পরিবর্তন করুন' : 'ডকুমেন্ট (PDF) আপলোড করুন')}
                      </span>
                    </button>
                    <input type="file" ref={editDocInputRef} onChange={e => setEditDealerDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
                  </div>
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

      {/* ডিলার মাল ট্রান্সফার ও রিটার্ন মডাল */}
      {dealerActionModal && selectedDealer && (
        <div className="fixed inset-0 bg-black/60 z-[105] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90dvh]">
            <div className={`${dealerActionModal === 'transfer' ? 'bg-da-depotNavy' : 'bg-red-600'} p-3 flex justify-between items-center text-white shrink-0`}>
              <h2 className="font-bold text-sm flex items-center gap-2">
                {dealerActionModal === 'transfer' ? <><Truck size={16}/> মাল ট্রান্সফার (ডিলার)</> : <><RotateCcw size={16}/> মাল রিটার্ন (ডিলার)</>}
              </h2>
              <button onClick={() => setDealerActionModal(null)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="bg-da-depotBg p-2.5 rounded-lg border border-da-cardBorder flex justify-between items-center text-xs font-bold">
                <span className="text-da-depotNavy">{selectedDealer.name} {selectedDealer.dealer_code ? `(${selectedDealer.dealer_code})` : ''}</span>
                <span className="text-da-red">বাকি: ৳{toBangla(selectedDealer.due_balance || 0)}</span>
              </div>

              {dealerActionModal === 'return' && (
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">রিটার্নের ধরন</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setDealerActionForm({...dealerActionForm, isDamaged: true})} className={`py-2 rounded-lg text-xs font-bold border ${dealerActionForm.isDamaged ? 'bg-red-600 text-white border-red-600' : 'bg-white text-da-textDark border-da-cardBorder'}`}>ড্যামেজ মাল</button>
                    <button type="button" onClick={() => setDealerActionForm({...dealerActionForm, isDamaged: false})} className={`py-2 rounded-lg text-xs font-bold border ${!dealerActionForm.isDamaged ? 'bg-da-depotBlue text-white border-da-depotBlue' : 'bg-white text-da-textDark border-da-cardBorder'}`}>ভালো মাল ফেরত</button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পণ্য {dealerActionModal === 'transfer' ? '*' : '(ঐচ্ছিক)'}</label>
                <select
                  value={dealerActionForm.productId}
                  onChange={e => {
                    const pid = e.target.value;
                    const p = depotProducts.find(item => item.id === pid);
                    const rate = p ? String(p.sale_price || p.purchase_price || '') : '';
                    const qty = Number(dealerActionForm.quantity) || 0;
                    setDealerActionForm({
                      ...dealerActionForm,
                      productId: pid,
                      unitPrice: rate,
                      totalAmount: qty > 0 && rate ? String(qty * Number(rate)) : dealerActionForm.totalAmount
                    });
                  }}
                  className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-white"
                >
                  <option value="">-- পণ্য সিলেক্ট করুন --</option>
                  {depotProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (স্টক: {toBangla(p.stock_quantity || 0)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পরিমাণ {dealerActionModal === 'transfer' ? '*' : ''}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={dealerActionForm.quantity}
                    onChange={e => {
                      const q = e.target.value;
                      const rate = Number(dealerActionForm.unitPrice) || 0;
                      setDealerActionForm({
                        ...dealerActionForm,
                        quantity: q,
                        totalAmount: rate > 0 && Number(q) > 0 ? String(Number(q) * rate) : dealerActionForm.totalAmount
                      });
                    }}
                    placeholder="0"
                    className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">একক দর (৳)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={dealerActionForm.unitPrice}
                    onChange={e => {
                      const r = e.target.value;
                      const q = Number(dealerActionForm.quantity) || 0;
                      setDealerActionForm({
                        ...dealerActionForm,
                        unitPrice: r,
                        totalAmount: q > 0 && Number(r) > 0 ? String(q * Number(r)) : dealerActionForm.totalAmount
                      });
                    }}
                    placeholder="0"
                    className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue"
                  />
                </div>
              </div>

              <div className={dealerActionModal === 'transfer' ? 'grid grid-cols-2 gap-2' : ''}>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">{dealerActionModal === 'transfer' ? 'মোট বিল (৳) *' : 'রিটার্ন মূল্য (৳) *'}</label>
                  <input type="number" inputMode="decimal" value={dealerActionForm.totalAmount} onChange={e => setDealerActionForm({...dealerActionForm, totalAmount: e.target.value})} placeholder="0" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm font-bold outline-none focus:border-da-depotBlue" />
                </div>
                {dealerActionModal === 'transfer' && (
                  <div>
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নগদ জমা (৳)</label>
                    <input type="number" inputMode="decimal" value={dealerActionForm.paidNow} onChange={e => setDealerActionForm({...dealerActionForm, paidNow: e.target.value})} placeholder="0" className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট / বিবরণ</label>
                <input type="text" value={dealerActionForm.notes} onChange={e => setDealerActionForm({...dealerActionForm, notes: e.target.value})} placeholder="প্রয়োজনীয় নোট..." className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setDealerActionModal(null)} disabled={isSavingAction} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveDealerAction} disabled={isSavingAction} className={`flex-1 ${dealerActionModal === 'transfer' ? 'bg-da-depotBlue' : 'bg-red-600'} text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center`}>
                {isSavingAction ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
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