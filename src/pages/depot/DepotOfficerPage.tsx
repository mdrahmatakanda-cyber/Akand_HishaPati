import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, X, Loader2, 
  User, Phone, MapPin, Wallet, 
  ReceiptText, Clock, CheckCircle2, AlertTriangle, 
  Image as ImageIcon, FileText, Truck, Edit3,
  Map, Table, Users, Shield, Eye, EyeOff, 
  ChevronDown, CheckSquare, Square, Navigation, UserPlus
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoOfficers } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

const featureList = [
  "Dashboard", "Companies", "Products", "Markets", "Shops / Customer",
  "Officer Team", "Sale", "Payment", "Damage", "Return",
  "Stock", "Purchase", "Suppliers", "Reports", "Transactions",
  "Expenses", "Business Finance", "Referral", "Subscription",
  "Support", "Profile"
];

export default function DepotOfficerPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [officers, setOfficers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');

  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isViewRolesModalOpen, setIsViewRolesModalOpen] = useState(false);
  const [isVanLoadModalOpen, setIsVanLoadModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // রোল স্টেট
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  // অফিসার ফর্ম স্টেট
  const [newOfficer, setNewOfficer] = useState({ 
    name: '', phone: '', password: '', area: '', target_amount: '', commission_rate: '', 
    status: 'Active', commission_type: 'Officer Commission', role: 'Default Officer', 
    isAdvanced: false, company_access: 'All Companies', market_access: 'All Markets'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editOfficerData, setEditOfficerData] = useState<any>({});
  
  // ভ্যান ও ক্যাশ স্টেট
  const [vanLoadAmount, setVanLoadAmount] = useState('');
  const [cashDepositAmount, setCashDepositAmount] = useState('');
  
  // আপলোড স্টেট
  const [officerImage, setOfficerImage] = useState<File | null>(null);
  const [officerDoc, setOfficerDoc] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchOfficers = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setOfficers(demoOfficers);
      } else {
        if (!activeBusiness?.id) return;
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOfficers(data || []);
      }
    } catch (error: any) {
      console.error(error);
      showToast('ডাটা লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [isDemoMode, activeBusiness?.id]);

  const filteredOfficers = useMemo(() => {
    return officers.filter(o => {
      const matchSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) || (o.phone && o.phone.includes(searchQuery));
      const matchStatus = statusFilter === 'All Status' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [officers, searchQuery, statusFilter]);

  const totalVanStock = officers.reduce((acc, curr) => acc + Number(curr.van_stock_value || 0), 0);
  const totalCash = officers.reduce((acc, curr) => acc + Number(curr.cash_in_hand || 0), 0);

  const handlePermissionChange = (feature: string, type: string) => {
    setPermissions(prev => ({
      ...prev,
      [feature]: { ...prev[feature], [type]: !prev[feature]?.[type] }
    }));
  };

  const handleSaveRole = () => {
    if (!roleName) return showToast('রোলের নাম আবশ্যক', 'error');
    setRolesList([...rolesList, { id: Date.now(), name: roleName, permissions }]);
    setIsRoleModalOpen(false);
    setRoleName('');
    setPermissions({});
    showToast('নতুন রোল তৈরি হয়েছে!');
  };

  const handleAddOfficer = async () => {
    if (!newOfficer.name || !newOfficer.phone) return showToast('নাম এবং মোবাইল নম্বর আবশ্যক', 'error');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newO = {
          id: Date.now().toString(),
          ...newOfficer,
          target_amount: Number(newOfficer.target_amount) || 0,
          commission_rate: Number(newOfficer.commission_rate) || 0,
          van_stock_value: 0,
          cash_in_hand: 0,
          image_url: officerImage ? URL.createObjectURL(officerImage) : '',
          documents: officerDoc ? [officerDoc.name] : []
        };
        setOfficers([newO, ...officers]);
      } else {
        if (!activeBusiness?.id) return;
        const { error } = await supabase.from('employees').insert([{
          business_id: activeBusiness.id,
          name: newOfficer.name,
          phone: newOfficer.phone,
          role: newOfficer.role || 'sr',
          target_amount: Number(newOfficer.target_amount) || 0,
          commission_rate: Number(newOfficer.commission_rate) || 0
        }]);
        if (error) throw error;
        fetchOfficers();
      }
      setIsAddModalOpen(false);
      setNewOfficer({ name: '', phone: '', password: '', area: '', target_amount: '', commission_rate: '', status: 'Active', commission_type: 'Officer Commission', role: 'Default Officer', isAdvanced: false, company_access: 'All Companies', market_access: 'All Markets' });
      setOfficerImage(null);
      setOfficerDoc(null);
      showToast('নতুন অফিসার যোগ হয়েছে!');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVanLoad = async () => {
    if (!vanLoadAmount || Number(vanLoadAmount) <= 0) return showToast('সঠিক পরিমাণ দিন', 'error');
    setIsSaving(true);
    try {
      const amount = Number(vanLoadAmount);
      const updated = officers.map(o => 
        o.id === selectedOfficer.id ? { ...o, van_stock_value: o.van_stock_value + amount } : o
      );
      setOfficers(updated);
      setSelectedOfficer(updated.find(o => o.id === selectedOfficer.id));
      setIsVanLoadModalOpen(false);
      setVanLoadAmount('');
      showToast('ভ্যানে মাল লোড হয়েছে!');
    } finally { setIsSaving(false); }
  };

  const handleCashDeposit = async () => {
    if (!cashDepositAmount || Number(cashDepositAmount) <= 0) return showToast('সঠিক পরিমাণ দিন', 'error');
    setIsSaving(true);
    try {
      const amount = Number(cashDepositAmount);
      const updated = officers.map(o => 
        o.id === selectedOfficer.id ? { ...o, cash_in_hand: o.cash_in_hand - amount } : o
      );
      setOfficers(updated);
      setSelectedOfficer(updated.find(o => o.id === selectedOfficer.id));
      setIsCashModalOpen(false);
      setCashDepositAmount('');
      showToast('ক্যাশ জমা সফল হয়েছে!');
    } finally { setIsSaving(false); }
  };

  const openProfileModal = (officer: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOfficer(officer);
    setEditOfficerData({ ...officer });
    setIsEditingProfile(false);
    setIsProfileModalOpen(true);
  };

  const handleUpdateOfficer = async () => {
    if (!editOfficerData.name || !editOfficerData.phone) return showToast('নাম এবং মোবাইল আবশ্যক', 'error');
    setIsSaving(true);
    try {
      const updated = officers.map(o => o.id === selectedOfficer.id ? {
        ...o, ...editOfficerData,
        target_amount: Number(editOfficerData.target_amount) || 0,
        commission_rate: Number(editOfficerData.commission_rate) || 0
      } : o);
      setOfficers(updated);
      setSelectedOfficer(updated.find(o => o.id === selectedOfficer.id));
      setIsEditingProfile(false);
      showToast('অফিসারের তথ্য আপডেট হয়েছে!');
    } finally { setIsSaving(false); }
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
            <button onClick={selectedOfficer ? () => setSelectedOfficer(null) : onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">{selectedOfficer ? 'অফিসার লেজার' : 'অফিসার ম্যানেজমেন্ট'}</h1>
          </div>
          {selectedOfficer && (
            <button onClick={() => openProfileModal(selectedOfficer)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition active:scale-95">
              <User size={16} />
              <span className="text-xs font-bold">প্রোফাইল</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ==================== লিস্ট ও ম্যানেজমেন্ট ভিউ ==================== */}
        {!selectedOfficer && (
          <>
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold text-blue-100">মোট ভ্যান স্টক</p>
                <p className="text-lg font-black mt-1 text-da-depotAmber">{isLoading ? '...' : toBangla(totalVanStock)} ৳</p>
              </div>
              <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex flex-col items-center justify-center text-center">
                <p className="text-xs font-bold text-blue-100">মোট ক্যাশ</p>
                <p className="text-lg font-black mt-1 text-green-300">{isLoading ? '...' : toBangla(totalCash)} ৳</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0 mt-1">
              <div className="flex gap-1.5 items-center">
                <div className="flex bg-white p-0.5 rounded-lg shrink-0 border border-da-cardBorder shadow-sm">
                  <button onClick={() => setActiveTab('table')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${activeTab === 'table' ? 'bg-da-depotNavy text-white shadow-sm' : 'text-da-textMuted'}`}>
                    <Table size={12}/> টেবিল
                  </button>
                  <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${activeTab === 'map' ? 'bg-da-depotNavy text-white shadow-sm' : 'text-da-textMuted'}`}>
                    <Map size={12}/> ম্যাপ
                  </button>
                </div>
                <button onClick={() => setIsViewRolesModalOpen(true)} className="flex-1 bg-white border border-da-cardBorder text-da-textDark rounded-lg py-1.5 text-[11px] font-bold shadow-sm active:scale-95 transition">রোল দেখুন</button>
              </div>

              <div className="flex gap-1.5">
                <button onClick={() => setIsRoleModalOpen(true)} className="flex-1 bg-white border border-da-cardBorder text-da-textDark py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
                  <Shield size={14}/> রোল যোগ
                </button>
                <button onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-da-depotBlue text-white py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
                  <UserPlus size={14}/> নতুন অফিসার
                </button>
              </div>
            </div>

            {activeTab === 'table' && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                <div className="bg-white border border-da-cardBorder rounded-lg p-2 shadow-sm flex flex-wrap gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-da-depotBg px-1.5 py-0.5 rounded text-[9px] font-bold text-da-textDark"><Users size={10}/> {toBangla(officers.length)} মোট</div>
                  <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {toBangla(officers.filter(o=>o.status==='Active').length)} অ্যাক্টিভ</div>
                  <div className="flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-red-700"><div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div> {toBangla(officers.filter(o=>o.status==='Inactive').length)} ইনঅ্যাক্টিভ</div>
                </div>

                <div className="bg-white border border-da-cardBorder rounded-lg p-2 flex flex-col gap-1.5 shadow-sm shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-da-textMuted" />
                    <input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-md pl-8 pr-2 py-1.5 text-xs outline-none focus:border-da-depotBlue" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-da-depotBg border border-da-cardBorder rounded-md px-2 py-1.5 text-xs outline-none appearance-none font-bold text-da-textDark">
                        <option>All Status</option>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-textMuted" />
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
                ) : filteredOfficers.length === 0 ? (
                  <div className="border border-dashed border-da-cardBorder rounded-lg p-6 flex flex-col items-center justify-center text-center bg-white/50 mt-1">
                    <Users size={32} className="text-da-textMuted/50 mb-2" />
                    <h3 className="font-bold text-da-textDark text-sm">কোনো অফিসার পাওয়া যায়নি</h3>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {filteredOfficers.map(officer => (
                      <div key={officer.id} onClick={() => setSelectedOfficer(officer)} className="bg-white px-2.5 py-2 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue shrink-0 border border-da-cardBorder overflow-hidden" onClick={(e) => openProfileModal(officer, e)}>
                            {officer.image_url ? <img src={officer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={18} />}
                          </div>
                          <div className="min-w-0" onClick={(e) => openProfileModal(officer, e)}>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-[13px] text-da-textDark truncate">{officer.name}</h3>
                              <span className={`text-[8px] font-bold px-1 rounded border ${officer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{officer.status}</span>
                            </div>
                            <p className="text-[10px] text-da-textMuted truncate flex items-center gap-1.5 mt-0.5">
                              <Phone size={10} /> {officer.phone} | {officer.role}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <p className="font-black text-[11px] text-da-depotBlue">স্টক: ৳{toBangla(officer.van_stock_value || 0)}</p>
                          <p className="font-bold text-[10px] text-da-green">ক্যাশ: ৳{toBangla(officer.cash_in_hand || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'map' && (
              <div className="flex-1 bg-da-depotBg rounded-lg border border-da-cardBorder relative overflow-hidden flex items-center justify-center min-h-[250px] animate-in fade-in duration-200 mt-1">
                <div className="z-10 bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-da-cardBorder">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-xs text-da-textDark">{toBangla(0)} অ্যাক্টিভ ({toBangla(0)} ট্র্যাকড)</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white p-1.5 rounded-full shadow-md border border-da-cardBorder">
                   <Navigation size={18} className="text-da-depotBlue" />
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== লেজার ভিউ ==================== */}
        {selectedOfficer && (
          <>
            <div className="bg-white p-4 rounded-xl border border-da-cardBorder shadow-sm flex flex-col items-center text-center shrink-0">
              <div onClick={() => openProfileModal(selectedOfficer)} className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform">
                <div className="w-16 h-16 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue mb-2 border border-da-cardBorder overflow-hidden group-hover:ring-2 group-hover:ring-da-depotBlue/50 transition-all">
                  {selectedOfficer.image_url ? <img src={selectedOfficer.image_url} alt="" className="w-full h-full object-cover" /> : <User size={32} />}
                </div>
                <h2 className="font-black text-lg text-da-textDark group-hover:text-da-depotBlue transition-colors">{selectedOfficer.name}</h2>
              </div>
              <p className="text-sm text-da-textMuted flex items-center gap-1 mt-1"><Phone size={12}/> {selectedOfficer.phone}</p>
              {selectedOfficer.area && <p className="text-xs text-da-textMuted flex items-center gap-1 mt-1"><MapPin size={12}/> {selectedOfficer.area}</p>}
              
              <div className="w-full mt-3 pt-3 border-t border-da-cardBorder grid grid-cols-2 gap-2">
                <div className="bg-da-depotBg rounded-lg p-2 flex flex-col items-center border border-da-cardBorder">
                  <span className="text-[10px] font-bold text-da-textMuted">ভ্যান স্টক</span>
                  <span className="font-black text-sm text-da-depotBlue">৳{toBangla(selectedOfficer.van_stock_value || 0)}</span>
                </div>
                <div className="bg-green-50 rounded-lg p-2 flex flex-col items-center border border-green-200">
                  <span className="text-[10px] font-bold text-green-700">হাতে থাকা ক্যাশ</span>
                  <span className="font-black text-sm text-green-700">৳{toBangla(selectedOfficer.cash_in_hand || 0)}</span>
                </div>
                {selectedOfficer.target_amount > 0 && (
                  <div className="col-span-2 bg-blue-50 rounded-lg p-1.5 flex justify-between items-center px-3 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700">মাসিক টার্গেট: ৳{toBangla(selectedOfficer.target_amount)}</span>
                    <span className="text-[10px] font-bold text-blue-700">কমিশন: {toBangla(selectedOfficer.commission_rate)}% ({selectedOfficer.commission_type})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <button onClick={() => setIsVanLoadModalOpen(true)} className="bg-da-depotBlue text-white py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Truck size={16}/> <span className="text-[10px]">ভ্যান লোডিং</span>
              </button>
              <button onClick={() => setIsCashModalOpen(true)} className="bg-da-green text-white py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <Wallet size={16}/> <span className="text-[10px]">ক্যাশ জমা</span>
              </button>
              <button onClick={() => onNavigate('sale')} className="bg-da-depotAmber text-da-depotNavy py-2 rounded-lg font-bold shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition">
                <ReceiptText size={16}/> <span className="text-[10px]">অফিসার বিক্রি</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-3 shrink-0 mt-1">
              <h3 className="font-bold text-sm text-da-textDark mb-2 flex items-center gap-2 border-b border-da-cardBorder pb-2">
                <Clock size={16} className="text-da-depotBlue"/> লেনদেনের ইতিহাস
              </h3>
              <div className="flex flex-col items-center py-6">
                <p className="text-xs text-da-textMuted font-bold">এই অফিসারের কোনো লেনদেন পাওয়া যায়নি।</p>
              </div>
            </div>
          </>
        )}

      </main>

      {/* Add Officer Modal (সব ফিল্ডসহ) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy px-3 py-2 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">নতুন অফিসার তৈরি করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নাম <span className="text-da-red">*</span></label>
                  <input type="text" value={newOfficer.name} onChange={e => setNewOfficer({...newOfficer, name: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন <span className="text-da-red">*</span></label>
                  <input type="text" value={newOfficer.phone} onChange={e => setNewOfficer({...newOfficer, phone: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পাসওয়ার্ড</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={newOfficer.password} onChange={e => setNewOfficer({...newOfficer, password: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 pr-8 text-sm outline-none focus:border-da-depotBlue" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-textMuted">
                    {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">মাসিক টার্গেট</label>
                  <input type="number" value={newOfficer.target_amount} onChange={e => setNewOfficer({...newOfficer, target_amount: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">স্ট্যাটাস</label>
                  <select value={newOfficer.status} onChange={e => setNewOfficer({...newOfficer, status: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কমিশন রেট (%)</label>
                  <input type="number" value={newOfficer.commission_rate} onChange={e => setNewOfficer({...newOfficer, commission_rate: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কমিশন টাইপ</label>
                  <select value={newOfficer.commission_type} onChange={e => setNewOfficer({...newOfficer, commission_type: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option>Officer Commission</option>
                    <option>Fixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">রোল</label>
                  <select value={newOfficer.role} onChange={e => setNewOfficer({...newOfficer, role: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option>Default Officer</option>
                    {rolesList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">এলাকা / রুট</label>
                  <input type="text" value={newOfficer.area} onChange={e => setNewOfficer({...newOfficer, area: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>

              {/* অ্যাডভান্সড অপশন */}
              <div className="border border-da-cardBorder rounded-lg p-2 bg-da-depotBg mt-1">
                <div onClick={() => setNewOfficer({...newOfficer, isAdvanced: !newOfficer.isAdvanced})} className="flex items-center gap-1.5 cursor-pointer select-none">
                  {newOfficer.isAdvanced ? <CheckSquare size={16} className="text-da-depotBlue"/> : <Square size={16} className="text-da-textMuted"/>}
                  <span className="font-bold text-xs text-da-textDark">অ্যাডভান্সড অ্যাক্সেস</span>
                </div>
                {newOfficer.isAdvanced && (
                  <div className="mt-2 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="text-[10px] font-bold text-da-textDark mb-1 block">কোম্পানি অ্যাক্সেস</label>
                      <div className="relative">
                        <select value={newOfficer.company_access} onChange={e => setNewOfficer({...newOfficer, company_access: e.target.value})} className="w-full bg-white border border-da-depotBlue/30 rounded-lg px-2 py-1.5 text-[11px] font-bold text-da-depotBlue outline-none appearance-none">
                          <option>All Companies (Full Access)</option>
                          <option>Specific Companies</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-depotBlue" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-da-textDark mb-1 block">রোড ও মার্কেট</label>
                      <div className="relative">
                        <select value={newOfficer.market_access} onChange={e => setNewOfficer({...newOfficer, market_access: e.target.value})} className="w-full bg-white border border-da-depotBlue/30 rounded-lg px-2 py-1.5 text-[11px] font-bold text-da-depotBlue outline-none appearance-none">
                          <option>All Routes & Markets (Full Access)</option>
                          <option>Specific Markets</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-depotBlue" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* আপলোড অপশন */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => imageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center justify-center text-da-textMuted hover:bg-da-depotBg transition">
                  <ImageIcon size={18} className={officerImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{officerImage ? officerImage.name : 'অফিসারের ছবি'}</span>
                </button>
                <input type="file" ref={imageInputRef} onChange={e => setOfficerImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />

                <button onClick={() => docInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center justify-center text-da-textMuted hover:bg-da-depotBg transition">
                  <FileText size={18} className={officerDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{officerDoc ? officerDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={docInputRef} onChange={e => setOfficerDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>

            <div className="p-2.5 bg-da-depotBg border-t border-da-cardBorder flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-lg font-bold text-xs">বাতিল</button>
              <button onClick={handleAddOfficer} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-lg font-bold text-xs shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotBg px-3 py-2 flex justify-between items-center border-b border-da-cardBorder shrink-0">
              <h2 className="font-bold text-sm text-da-textDark">রোল যোগ করুন</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-1 bg-white border border-da-cardBorder rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">রোলের নাম <span className="text-da-red">*</span></label>
                <input type="text" placeholder="উদাহরণ: স্টোর ম্যানেজার" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              <div className="bg-da-depotBlue/5 border border-da-depotBlue/20 rounded-lg p-2 text-[10px] text-da-depotBlue leading-relaxed">
                এই অফিসার রোলের জন্য শুধুমাত্র প্রয়োজনীয় অনুমতিগুলো টেবিল থেকে দিন।
              </div>

              <div className="border border-da-cardBorder rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-da-depotBg p-1.5 text-[9px] font-bold text-da-textMuted border-b border-da-cardBorder">
                  <div className="col-span-4">ফিচার</div>
                  <div className="col-span-2 text-center">ভিউ</div>
                  <div className="col-span-2 text-center">সব</div>
                  <div className="col-span-2 text-center">অ্যাড</div>
                  <div className="col-span-2 text-center">অ্যাকশন</div>
                </div>
                
                <div className="divide-y divide-da-cardBorder/50 max-h-[35vh] overflow-y-auto">
                  {featureList.map(feature => (
                    <div key={feature} className="grid grid-cols-12 items-center p-1.5 text-[10px] font-bold text-da-textDark hover:bg-da-depotBg/50">
                      <div className="col-span-4 truncate pr-1">{feature}</div>
                      <div className="col-span-2 flex justify-center">
                        <ToggleSwitch checked={permissions[feature]?.view || false} onChange={() => handlePermissionChange(feature, 'view')} />
                      </div>
                      <div className="col-span-2 flex justify-center">
                         <ToggleSwitch checked={permissions[feature]?.viewAll || false} onChange={() => handlePermissionChange(feature, 'viewAll')} />
                      </div>
                      <div className="col-span-2 flex justify-center">
                         <ToggleSwitch checked={permissions[feature]?.add || false} onChange={() => handlePermissionChange(feature, 'add')} />
                      </div>
                      <div className="col-span-2 flex justify-center text-gray-400">
                        <div className="w-3.5 h-3.5 border border-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-da-depotBg border-t border-da-cardBorder flex gap-2 shrink-0">
              <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-lg font-bold text-xs">বাতিল</button>
              <button onClick={handleSaveRole} className="flex-1 bg-da-depotBlue text-white py-2 rounded-lg font-bold text-xs shadow-md">রোল তৈরি করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* View Roles Modal */}
      {isViewRolesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[60dvh] sm:h-auto sm:max-h-[60vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotBg px-3 py-2 flex justify-between items-center border-b border-da-cardBorder shrink-0">
              <h2 className="font-bold text-sm text-da-textDark">রোল তালিকা</h2>
              <button onClick={() => setIsViewRolesModalOpen(false)} className="p-1 bg-white border border-da-cardBorder rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
               {rolesList.length === 0 ? (
                 <div className="text-center text-da-textMuted mt-10 text-xs font-bold">কোনো রোল তৈরি করা হয়নি</div>
               ) : (
                 rolesList.map(r => (
                   <div key={r.id} className="bg-white border border-da-cardBorder p-2 rounded-lg shadow-sm flex items-center gap-2">
                     <Shield size={16} className="text-da-depotBlue" />
                     <span className="font-bold text-xs text-da-textDark">{r.name}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Van Load Modal */}
      {isVanLoadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotBlue p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Truck size={16}/> ভ্যানে মাল লোডিং</h2>
              <button onClick={() => setIsVanLoadModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-center text-sm font-bold">{selectedOfficer?.name}</p>
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">মালের মূল্য (৳)</label>
                <input type="number" value={vanLoadAmount} onChange={e => setVanLoadAmount(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold outline-none focus:border-da-depotBlue" placeholder="৳ 0" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsVanLoadModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleVanLoad} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'লোড করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Deposit Modal */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-green p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Wallet size={16}/> ক্যাশ জমা নিন</h2>
              <button onClick={() => setIsCashModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-center text-sm font-bold">{selectedOfficer?.name}</p>
              <div>
                <label className="text-xs font-bold text-da-textMuted mb-1 block">জমার পরিমাণ (৳)</label>
                <input type="number" value={cashDepositAmount} onChange={e => setCashDepositAmount(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold outline-none focus:border-da-green" placeholder="৳ 0" />
              </div>
              <button onClick={() => setCashDepositAmount(selectedOfficer?.cash_in_hand?.toString() || '0')} className="text-xs font-bold bg-da-green/10 text-da-green py-1.5 rounded border border-da-green/30">পুরো ক্যাশ</button>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsCashModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleCashDeposit} disabled={isSaving} className="flex-1 bg-da-green text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'জমা করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (View & Edit) */}
      {isProfileModalOpen && selectedOfficer && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] flex flex-col">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><User size={16}/> অফিসার প্রোফাইল</h2>
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
                {selectedOfficer.image_url ? (
                  <img src={selectedOfficer.image_url} alt={selectedOfficer.name} className="w-full h-full object-cover" />
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
                  <h2 className="font-black text-xl text-da-textDark">{selectedOfficer.name}</h2>
                  <div className="w-full mt-5 flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <Phone className="text-da-depotNavy" size={18} />
                      <div>
                        <p className="text-[10px] text-da-textMuted font-bold">মোবাইল নম্বর</p>
                        <p className="text-sm font-bold text-da-textDark">{selectedOfficer.phone}</p>
                      </div>
                    </div>
                    {selectedOfficer.area && (
                      <div className="flex items-center gap-3 bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                        <MapPin className="text-da-depotNavy" size={18} />
                        <div>
                          <p className="text-[10px] text-da-textMuted font-bold">এলাকা / রুট</p>
                          <p className="text-sm font-bold text-da-textDark">{selectedOfficer.area}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-da-textMuted">রোল:</span>
                        <span className="text-da-textDark">{selectedOfficer.role}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-da-textMuted">স্ট্যাটাস:</span>
                        <span className={selectedOfficer.status === 'Active' ? 'text-green-600' : 'text-red-600'}>{selectedOfficer.status}</span>
                      </div>
                      {selectedOfficer.target_amount > 0 && (
                        <>
                          <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-da-textMuted">টার্গেট:</span>
                            <span className="text-da-depotBlue">৳{toBangla(selectedOfficer.target_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-da-textMuted">কমিশন:</span>
                            <span className="text-da-green">{toBangla(selectedOfficer.commission_rate)}% ({selectedOfficer.commission_type})</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                      <p className="text-[10px] text-da-textMuted font-bold mb-2 flex items-center gap-1"><FileText size={12}/> সংযুক্ত ডকুমেন্টস</p>
                      {selectedOfficer.documents && selectedOfficer.documents.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {selectedOfficer.documents.map((doc: string, idx: number) => (
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
                    <label className="text-[11px] font-bold text-da-textMuted mb-1 block">অফিসারের নাম</label>
                    <input type="text" value={editOfficerData.name || ''} onChange={e => setEditOfficerData({...editOfficerData, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন নম্বর</label>
                      <input type="tel" value={editOfficerData.phone || ''} onChange={e => setEditOfficerData({...editOfficerData, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">এলাকা / রুট</label>
                      <input type="text" value={editOfficerData.area || ''} onChange={e => setEditOfficerData({...editOfficerData, area: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">মাসিক টার্গেট</label>
                      <input type="number" value={editOfficerData.target_amount || ''} onChange={e => setEditOfficerData({...editOfficerData, target_amount: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কমিশন (%)</label>
                      <input type="number" value={editOfficerData.commission_rate || ''} onChange={e => setEditOfficerData({...editOfficerData, commission_rate: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              {isEditingProfile ? (
                <button onClick={handleUpdateOfficer} disabled={isSaving} className="w-full bg-da-green text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
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

function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-7 h-4 rounded-full relative transition-colors ${checked ? 'bg-da-depotBlue' : 'bg-gray-300'}`}
    >
      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${checked ? 'left-3.5' : 'left-0.5'}`}></div>
    </button>
  );
}