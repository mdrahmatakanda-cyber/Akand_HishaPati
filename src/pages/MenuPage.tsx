import { useState, useRef } from 'react';
import { 
  ArrowLeft, Globe, Calculator, HelpCircle, Share2, Star, LogOut, 
  ChevronRight, ShieldCheck, Trash2, Printer, AlertTriangle, Bell, 
  Sun, Moon, Lock, Store, Building2, Layers, Settings, Check, X,
  Database, Edit2, Loader2, Plus, User, Camera, Mail
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import type { BusinessMode, ModeConfig } from '../App'; 
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  currentMode: BusinessMode;
  setCurrentMode: (mode: BusinessMode) => void;
  modeConfig: ModeConfig;
  setModeConfig: (config: ModeConfig) => void;
}

export default function MenuPage({ 
  onBack, onNavigate, currentMode, setCurrentMode, modeConfig, setModeConfig 
}: Props) {
  const { isDemoMode, toggleDemoMode } = useAppContext();
  const { user, businesses, activeBusiness, refreshBusinesses, switchBusiness, signOut } = useAuth();

  // স্টেট
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isAppLockOn, setIsAppLockOn] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // কাস্টম টোস্ট ও কনফার্ম মডাল স্টেট
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, message: string, action: () => void }>({ show: false, title: '', message: '', action: () => {} });

  // মডাল স্টেট
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ModeConfig>(modeConfig);

  // ফাইল রেফ
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shopLogoInputRef = useRef<HTMLInputElement>(null);

  // ফর্ম স্টেট
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    email: user?.email || '',
    avatar_url: user?.user_metadata?.avatar_url || ''
  });

  const [editShopForm, setEditShopForm] = useState({
    id: '', name: '', ownerName: '', address: '', type: 'shop', logo_url: ''
  });

  const [newShopForm, setNewShopForm] = useState({
    name: '', ownerName: '', address: '', type: 'shop' as 'shop' | 'depot' | 'general', logo_url: ''
  });

  const userName = user?.user_metadata?.name || 'ইউজার';
  const userPhone = user?.user_metadata?.phone || '';
  const userAvatar = user?.user_metadata?.avatar_url || '';

  // 🎨 মোড অনুযায়ী অ্যাক্টিভ কার্ড লজিক
  const currentShop = businesses.find(b => b.type === 'shop');
  const currentDepot = businesses.find(b => b.type === 'depot');

  // ডাইনামিক প্রোফাইল স্ট্যাটাস
  const profileFields = [user?.user_metadata?.name, user?.user_metadata?.phone, user?.user_metadata?.address, user?.user_metadata?.avatar_url];
  const filledFields = profileFields.filter(f => f && f.trim() !== '').length;
  const completionPercentage = Math.round((filledFields / profileFields.length) * 100);

  let barColor = 'bg-red-500', textColor = 'text-red-500';
  if (completionPercentage === 100) { barColor = 'bg-green-500'; textColor = 'text-green-500'; }
  else if (completionPercentage >= 60) { barColor = 'bg-[#1E88E5]'; textColor = 'text-[#1E88E5]'; }
  else if (completionPercentage >= 30) { barColor = 'bg-amber-500'; textColor = 'text-amber-500'; }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // 🔄 মোড চেঞ্জ লজিক
  const handleModeChange = async (mode: BusinessMode) => {
    setCurrentMode(mode);
    if (mode === 'shop') {
      if (currentShop) { await switchBusiness(currentShop.id); showToast('দোকান মোড সচল!'); }
    } else if (mode === 'depot') {
      if (currentDepot) { await switchBusiness(currentDepot.id); showToast('ডিপো মোড সচল!'); }
    }
  };

  // 📸 ইমেজ আপলোড হেল্পার
  const uploadImage = async (file: File, folder: string) => {
    if (file.size > 2 * 1024 * 1024) throw new Error('ছবির সাইজ ২MB এর কম হতে হবে।');
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}-${user.id}-${Math.random()}.${fileExt}`;
    const { error } = await supabase.storage.from('avatars').upload(fileName, file);
    if (error) throw error;
    const { data } = await supabase.storage.from('avatars').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const url = await uploadImage(file, 'user');
      setProfileForm(prev => ({ ...prev, avatar_url: url }));
      showToast('ছবি আপলোড সফল! সেভ করুন।');
    } catch (error: any) { showToast(error.message, 'error'); }
    finally { setIsSaving(false); }
  };

  const handleShopLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const url = await uploadImage(file, 'shop');
      if (isEdit) setEditShopForm(prev => ({ ...prev, logo_url: url }));
      else setNewShopForm(prev => ({ ...prev, logo_url: url }));
      showToast('লোগো আপলোড সফল!');
    } catch (error: any) { showToast(error.message, 'error'); }
    finally { setIsSaving(false); }
  };

  // 💾 প্রোফাইল এডিট
  const handleEditProfile = async () => {
    if (!profileForm.name.trim()) return showToast('নাম আবশ্যক', 'error');
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({ data: { name: profileForm.name, phone: profileForm.phone, address: profileForm.address, avatar_url: profileForm.avatar_url }});
      await supabase.from('profiles').update({ name: profileForm.name, phone: profileForm.phone, address: profileForm.address, avatar_url: profileForm.avatar_url }).eq('id', user.id);
      setIsEditProfileModalOpen(false);
      showToast('প্রোফাইল সেভ হয়েছে!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) { showToast('সমস্যা: ' + error.message, 'error'); }
    finally { setIsSaving(false); }
  };

  // 💾 দোকান এডিট
  const handleEditShop = async () => {
    if (!editShopForm.name.trim() || !editShopForm.id) return showToast('দোকানের নাম আবশ্যক', 'error');
    setIsSaving(true);
    try {
      await supabase.from('businesses').update({
        name: editShopForm.name.trim(), owner_name: editShopForm.ownerName, address: editShopForm.address, type: editShopForm.type, logo_url: editShopForm.logo_url
      }).eq('id', editShopForm.id);
      await refreshBusinesses();
      setIsEditShopModalOpen(false);
      showToast('দোকান আপডেট হয়েছে!');
    } catch (error: any) { showToast('সমস্যা: ' + error.message, 'error'); }
    finally { setIsSaving(false); }
  };

  // 💾 নতুন দোকান
  const handleAddNewShop = async () => {
    if (!newShopForm.name.trim()) return showToast('দোকানের নাম আবশ্যক', 'error');
    setIsSaving(true);
    try {
      const { data: newBiz, error: bizError } = await supabase.from('businesses').insert([{
        name: newShopForm.name.trim(), owner_name: newShopForm.ownerName, address: newShopForm.address, type: newShopForm.type, logo_url: newShopForm.logo_url, owner_id: user.id
      }]).select().single();
      if (bizError) throw bizError;

      await refreshBusinesses();
      await switchBusiness(newBiz.id);
      setIsAddShopModalOpen(false);
      setIsShopModalOpen(false);
      showToast('নতুন দোকান যোগ হয়েছে!');
    } catch (error: any) { showToast('সমস্যা: ' + error.message, 'error'); }
    finally { setIsSaving(false); }
  };

  // 🗑️ দোকান ডিলিট (সম্পূর্ণ ঠিক করা লজিক)
  const confirmDeleteShop = (id: string, name: string) => {
    setConfirmModal({
      show: true,
      title: 'দোকান ডিলিট করবেন?',
      message: `আপনি কি সত্যিই "${name}" দোকানটি মুছে ফেলতে চান? এর ফলে এই দোকানের সব ডাটা (প্রোডাক্ট, খাতা) চিরতরে মুছে যাবে!`,
      action: async () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        setIsSaving(true);
        try {
          if (activeBusiness?.id === id) {
            const { error: profileError } = await supabase.from('profiles').update({ business_id: null }).eq('id', user.id);
            if (profileError) throw new Error("প্রোফাইল আপডেট ব্যর্থ: " + profileError.message);
          }

          const { data: deletedData, error: deleteError } = await supabase
            .from('businesses')
            .delete()
            .eq('id', id)
            .select(); 

          if (deleteError) throw new Error(deleteError.message);
          
          if (!deletedData || deletedData.length === 0) {
             throw new Error("ডিলিট করা সম্ভব হয়নি! ডাটাবেসে পলিসি বা রিলেশন চেক করুন।");
          }
          
          await refreshBusinesses();
          showToast('দোকান সফলভাবে ডিলিট হয়েছে!');
        } catch (error: any) { 
          showToast(error.message, 'error'); 
        } finally { 
          setIsSaving(false); 
        }
      }
    });
  };

  // ⚙️ কাস্টমাইজেশন ফাংশন
  const handleConfigToggle = (section: string, mode: 'shop' | 'depot' | 'general') => {
    setTempConfig(prev => ({ ...prev, [section]: { ...prev[section], [mode]: !prev[section][mode] } }));
  };

  const saveCustomization = () => {
    setModeConfig(tempConfig);
    setIsCustomizeModalOpen(false);
    showToast('মোড সেটিংস সেভ হয়েছে!');
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {toast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#0B5C47]' : 'bg-red-500'} text-white`}>
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            {toast.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
          </div>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">মেনু ও সেটিংস</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 pb-8 scrollbar-hide">
        
        {/* প্রোফাইল কার্ড */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0B5C47] to-[#1E88E5] rounded-full flex items-center justify-center text-white shadow-md shrink-0 text-xl font-bold overflow-hidden border-2 border-white">
              {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-base text-gray-800 truncate">{userName}</h2>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5 truncate">Owner (মালিক)</p>
              <p className="text-[11px] font-bold text-gray-600 mt-0.5 truncate">+৮৮{toBangla(userPhone)}</p>
            </div>
            <button onClick={() => setIsEditProfileModalOpen(true)} className="px-3 py-1.5 border border-[#1E88E5] text-[#1E88E5] rounded-lg text-xs font-bold active:scale-95 transition shrink-0">এডিট</button>
          </div>
          
          <div>
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
              <span>প্রোফাইল স্ট্যাটাস</span>
              <span className={`${textColor}`}>{toBangla(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>

          {/* মোড অনুযায়ী অ্যাক্টিভ কার্ড */}
          <div className="flex flex-col gap-2 mt-1">
            {currentMode === 'general' && (
              <>
                {currentShop && <ActiveCard business={currentShop} onManage={() => setIsShopModalOpen(true)} />}
                {currentDepot && <ActiveCard business={currentDepot} onManage={() => setIsShopModalOpen(true)} />}
              </>
            )}
            {currentMode === 'shop' && currentShop && (
              <ActiveCard business={currentShop} onManage={() => setIsShopModalOpen(true)} />
            )}
            {currentMode === 'depot' && currentDepot && (
              <ActiveCard business={currentDepot} onManage={() => setIsShopModalOpen(true)} />
            )}
            {!currentShop && !currentDepot && (
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500 font-bold">
                কোনো দোকান বা ডিপো নেই! ম্যানেজ করে যোগ করুন।
              </div>
            )}
          </div>
        </div>

        {/* বিজনেস মোড সুইচার */}
        <div className="bg-white rounded-2xl border border-gray-200 p-1.5 shadow-sm shrink-0 flex gap-1">
          <button onClick={() => handleModeChange('shop')} className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${currentMode === 'shop' ? 'bg-[#EFF6FF] text-[#1E88E5] border border-[#1E88E5]/30 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Store size={16}/> দোকান</button>
          <button onClick={() => handleModeChange('depot')} className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${currentMode === 'depot' ? 'bg-[#E8F5E9] text-[#0B5C47] border border-[#0B5C47]/30 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Building2 size={16}/> ডিপো</button>
          <button onClick={() => handleModeChange('general')} className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${currentMode === 'general' ? 'bg-gray-100 text-gray-800 border border-gray-300 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}><Layers size={16}/> সাধারণ</button>
        </div>

        {/* অ্যাপ সেটিংস */}
        <SectionTitle title="অ্যাপ সেটিংস" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
          <MenuItem icon={Globe} color="text-blue-600" bg="bg-blue-50" label="ভাষা (Language)" value="বাংলা" onClick={() => showToast('ভাষা পরিবর্তন')} />
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">{isDarkMode ? <Moon size={16}/> : <Sun size={16}/>}</div><span className="text-sm font-bold text-gray-700">ডার্ক মোড</span></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isDarkMode ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isDarkMode ? 'left-5' : 'left-0.5'}`}></div></button>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0"><Bell size={16}/></div><span className="text-sm font-bold text-gray-700">নোটিফিকেশন</span></div>
            <button onClick={() => setIsNotificationsOn(!isNotificationsOn)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isNotificationsOn ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isNotificationsOn ? 'left-5' : 'left-0.5'}`}></div></button>
          </div>
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Lock size={16}/></div><span className="text-sm font-bold text-gray-700">অ্যাপ লক</span></div>
            <button onClick={() => setIsAppLockOn(!isAppLockOn)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isAppLockOn ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isAppLockOn ? 'left-5' : 'left-0.5'}`}></div></button>
          </div>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Database size={16}/></div><div><span className="text-sm font-bold text-gray-700 block">ডেমু ডাটা (Demo Mode)</span><span className="text-[10px] text-gray-500 block">চালু করলে সব জায়গায় ডেমু তথ্য দেখাবে</span></div></div>
            <button onClick={toggleDemoMode} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isDemoMode ? 'bg-[#1E88E5]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isDemoMode ? 'left-5' : 'left-0.5'}`}></div></button>
          </div>
        </div>

        {/* সিস্টেম টুলস */}
        <SectionTitle title="সিস্টেম টুলস" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
          <MenuItem icon={Settings} color="text-indigo-600" bg="bg-indigo-50" label="মোড কাস্টমাইজেশন" onClick={() => { setTempConfig(modeConfig); setIsCustomizeModalOpen(true); }} />
          <MenuItem icon={Printer} color="text-purple-600" bg="bg-purple-50" label="প্রিন্টার সেটিংস" onClick={() => onNavigate('printer')} />
          <MenuItem icon={ShieldCheck} color="text-green-600" bg="bg-green-50" label="ইউজার ও অ্যাক্সেস ম্যানেজমেন্ট" onClick={() => onNavigate('app_access')} />
          <MenuItem icon={Trash2} color="text-red-600" bg="bg-red-50" label="রিসাইকেল বিন" onClick={() => onNavigate('recycle_bin')} />
          <MenuItem icon={Calculator} color="text-cyan-600" bg="bg-cyan-50" label="ক্যালকুলেটর" onClick={() => onNavigate('calculator')} />
        </div>

        {/* সাহায্য ও তথ্য */}
        <SectionTitle title="সাহায্য ও তথ্য" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
          <MenuItem icon={HelpCircle} color="text-[#1E88E5]" bg="bg-blue-50" label="সাহায্য ও সাপোর্ট" onClick={() => onNavigate('help')} />
          <MenuItem icon={Share2} color="text-amber-600" bg="bg-amber-50" label="এই অ্যাপটি শেয়ার করুন" onClick={() => showToast('শেয়ার লিংক কপি হয়েছে')} />
          <MenuItem icon={Star} color="text-amber-500" bg="bg-amber-50" label="এই অ্যাপ রেট করুন" onClick={() => showToast('প্লে স্টোর লিংক')} />
        </div>

        <div className="text-center text-[10px] font-bold text-gray-400 mt-1 shrink-0">App Version: {toBangla('4.1.6')}</div>
        <button onClick={() => setIsLogoutModalOpen(true)} className="w-full bg-red-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition mb-2 shrink-0"><LogOut size={18} /> লগ আউট করুন</button>

      </main>

      {/* ================= কাস্টম কনফার্মেশন মডাল ================= */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4"><AlertTriangle size={32} /></div>
              <h2 className="font-bold text-lg text-gray-800">{confirmModal.title}</h2>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm active:scale-95 transition">বাতিল</button>
              <button onClick={confirmModal.action} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition">হ্যাঁ, ডিলিট</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: প্রোফাইল এডিট ================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><User size={16}/> প্রোফাইল এডিট</h2>
              <button onClick={() => setIsEditProfileModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center mb-2">
                <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 bg-gray-100 rounded-full border-2 border-dashed border-[#1E88E5] flex items-center justify-center overflow-hidden group cursor-pointer hover:bg-gray-200 transition">
                  {isSaving ? <Loader2 size={30} className="text-[#1E88E5] animate-spin" /> : profileForm.avatar_url ? <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-400 group-hover:scale-110 transition" />}
                  {!isSaving && <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 flex justify-center text-white"><Camera size={14} /></div>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleProfileImageUpload} accept="image/*" className="hidden" />
                <p className="text-[10px] text-gray-500 font-bold mt-2">ছবি পরিবর্তন করতে ক্লিক করুন</p>
              </div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">নাম <span className="text-red-500">*</span></label><input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-1"><Mail size={12}/> ইমেইল</label><input type="email" value={profileForm.email} disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2.5 text-sm outline-none cursor-not-allowed" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">মোবাইল নম্বর</label><input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">ঠিকানা</label><input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsEditProfileModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleEditProfile} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">{isSaving ? <Loader2 size={18} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: আমার দোকান/ডিপো লিস্ট ================= */}
      {isShopModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><Store size={18}/> আমার সব দোকান/ডিপো</h2>
              <button onClick={() => setIsShopModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {businesses.map((biz) => (
                <div key={biz.id} className={`bg-white border rounded-xl p-3 shadow-sm flex items-center justify-between transition ${activeBusiness?.id === biz.id ? 'border-2 border-[#1E88E5]' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border">
                      {biz.logo_url ? <img src={biz.logo_url} className="w-full h-full object-cover" /> : <Store size={20} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-800 truncate">{biz.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-bold">{biz.type === 'shop' ? 'রিটেইল দোকান' : biz.type === 'depot' ? 'ডিস্ট্রিবিউশন ডিপো' : 'সাধারণ'}</p>
                      {activeBusiness?.id === biz.id && <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">✓ অ্যাক্টিভ</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    {activeBusiness?.id !== biz.id && (
                      <button onClick={() => { switchBusiness(biz.id); setIsShopModalOpen(false); showToast('দোকান পরিবর্তন হয়েছে!'); }} className="text-[10px] bg-blue-50 text-[#1E88E5] px-3 py-1 rounded-lg font-bold border border-[#1E88E5]/30 active:scale-95 transition">সুইচ করুন</button>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => { setEditShopForm({ id: biz.id, name: biz.name, ownerName: biz.owner_name || '', address: biz.address || '', type: biz.type, logo_url: biz.logo_url || '' }); setIsEditShopModalOpen(true); }} className="p-1.5 border border-gray-200 text-gray-600 bg-gray-50 rounded-lg shadow-sm active:scale-90"><Edit2 size={14}/></button>
                      <button onClick={() => confirmDeleteShop(biz.id, biz.name)} disabled={isSaving} className="p-1.5 border border-red-200 text-red-500 bg-red-50 rounded-lg shadow-sm active:scale-90">{isSaving ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}</button>
                    </div>
                  </div>
                </div>
              ))}

              {businesses.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-10">আপনার কোনো দোকান নেই। নতুন দোকান যুক্ত করুন।</div>
              )}
              
              <button onClick={() => { setNewShopForm({ name: '', ownerName: userName, address: '', type: 'shop', logo_url: '' }); setIsAddShopModalOpen(true); }} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-1 mt-4 active:scale-95 transition"><Plus size={18}/> নতুন দোকান/ডিপো যোগ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: দোকান এডিট ================= */}
      {isEditShopModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Edit2 size={16}/> দোকান এডিট করুন</h2>
              <button onClick={() => setIsEditShopModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col items-center mb-2">
                <div onClick={() => shopLogoInputRef.current?.click()} className="relative w-20 h-20 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden group cursor-pointer hover:bg-gray-200 transition">
                  {isSaving ? <Loader2 size={24} className="text-gray-500 animate-spin" /> : editShopForm.logo_url ? <img src={editShopForm.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store size={28} className="text-gray-400 group-hover:scale-110 transition" />}
                  {!isSaving && <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 flex justify-center text-white"><Camera size={12} /></div>}
                </div>
                <input type="file" ref={shopLogoInputRef} onChange={(e) => handleShopLogoUpload(e, true)} accept="image/*" className="hidden" />
                <p className="text-[10px] text-gray-500 font-bold mt-1">লোগো পরিবর্তন করুন</p>
              </div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">দোকানের নাম <span className="text-red-500">*</span></label><input type="text" value={editShopForm.name} onChange={e => setEditShopForm({...editShopForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">মালিকের নাম</label><input type="text" value={editShopForm.ownerName} onChange={e => setEditShopForm({...editShopForm, ownerName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">ঠিকানা</label><input type="text" value={editShopForm.address} onChange={e => setEditShopForm({...editShopForm, address: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">ধরন</label><select value={editShopForm.type} onChange={e => setEditShopForm({...editShopForm, type: e.target.value as any})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]"><option value="shop">রিটেইল দোকান</option><option value="depot">ডিস্ট্রিবিউশন ডিপো</option><option value="general">সাধারণ ব্যবসা</option></select></div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsEditShopModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleEditShop} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">{isSaving ? <Loader2 size={18} className="animate-spin"/> : 'সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন দোকান ================= */}
      {isAddShopModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Plus size={16}/> নতুন দোকান যোগ করুন</h2>
              <button onClick={() => setIsAddShopModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col items-center mb-2">
                <div onClick={() => shopLogoInputRef.current?.click()} className="relative w-20 h-20 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden group cursor-pointer hover:bg-gray-200 transition">
                  {isSaving ? <Loader2 size={24} className="text-gray-500 animate-spin" /> : newShopForm.logo_url ? <img src={newShopForm.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store size={28} className="text-gray-400 group-hover:scale-110 transition" />}
                  {!isSaving && <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 flex justify-center text-white"><Camera size={12} /></div>}
                </div>
                <input type="file" ref={shopLogoInputRef} onChange={(e) => handleShopLogoUpload(e, false)} accept="image/*" className="hidden" />
                <p className="text-[10px] text-gray-500 font-bold mt-1">লোগো যুক্ত করুন</p>
              </div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">দোকানের নাম <span className="text-red-500">*</span></label><input type="text" placeholder="যেমন: আমার দোকান" value={newShopForm.name} onChange={e => setNewShopForm({...newShopForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">মালিকের নাম</label><input type="text" value={newShopForm.ownerName} onChange={e => setNewShopForm({...newShopForm, ownerName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">ঠিকানা</label><input type="text" value={newShopForm.address} onChange={e => setNewShopForm({...newShopForm, address: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">ধরন</label><select value={newShopForm.type} onChange={e => setNewShopForm({...newShopForm, type: e.target.value as any})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]"><option value="shop">রিটেইল দোকান</option><option value="depot">ডিস্ট্রিবিউশন ডিপো</option><option value="general">সাধারণ ব্যবসা</option></select></div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsAddShopModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleAddNewShop} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-1">{isSaving ? <Loader2 size={18} className="animate-spin"/> : 'তৈরি করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: মোড কাস্টমাইজেশন ================= */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><Settings size={18}/> মোড কাস্টমাইজেশন</h2>
              <button onClick={() => setIsCustomizeModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {[{ key: 'khata', title: 'খাতা সমূহ' },{ key: 'business', title: 'আপনার ব্যবসার জন্য' },{ key: 'depot', title: 'ডিপো ও ডিস্ট্রিবিউশন' },{ key: 'others', title: 'অন্যান্য ফিচার' }].map(section => (
                <div key={section.key} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-800 mb-2 border-b pb-1">{section.title}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition"><input type="checkbox" checked={tempConfig[section.key]?.shop || false} onChange={() => handleConfigToggle(section.key, 'shop')} className="w-4 h-4 mb-1 accent-[#1E88E5]" /><span className="text-[10px] font-bold text-gray-600">দোকান</span></label>
                    <label className="flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition"><input type="checkbox" checked={tempConfig[section.key]?.depot || false} onChange={() => handleConfigToggle(section.key, 'depot')} className="w-4 h-4 mb-1 accent-[#0B5C47]" /><span className="text-[10px] font-bold text-gray-600">ডিপো</span></label>
                    <label className="flex flex-col items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition"><input type="checkbox" checked={tempConfig[section.key]?.general || false} onChange={() => handleConfigToggle(section.key, 'general')} className="w-4 h-4 mb-1 accent-gray-600" /><span className="text-[10px] font-bold text-gray-600">সাধারণ</span></label>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
              <button onClick={() => setIsCustomizeModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={saveCustomization} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1"><Check size={18}/> সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: লগ আউট কনফার্মেশন ================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3"><AlertTriangle size={28} /></div>
              <h2 className="font-bold text-lg text-gray-800">লগ আউট করবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি নিশ্চিতভাবে লগ আউট করতে চান?</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={signOut} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold shadow-md">হ্যাঁ, লগ আউট</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🌟 অ্যাক্টিভ কার্ড কম্পোনেন্ট
function ActiveCard({ business, onManage }: { business: any, onManage: () => void }) {
  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E88E5] to-[#0D47A1] p-3.5 shadow-lg text-white">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
      
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 backdrop-blur-md shrink-0 shadow-inner">
            {business.logo_url ? <img src={business.logo_url} className="w-full h-full object-cover rounded-xl" /> : <Store size={24} className="text-white" />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-blue-100 uppercase tracking-wider">
              {business.type === 'shop' ? 'অ্যাক্টিভ দোকান' : business.type === 'depot' ? 'অ্যাক্টিভ ডিপো' : 'অ্যাক্টিভ ব্যবসা'}
            </p>
            <h2 className="text-base font-black truncate">{business.name}</h2>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold inline-block mt-0.5">
              {business.type === 'shop' ? 'রিটেইল দোকান' : business.type === 'depot' ? 'ডিস্ট্রিবিউশন ডিপো' : 'সাধারণ'}
            </span>
          </div>
        </div>
        <button onClick={onManage} className="bg-white text-[#1E88E5] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition shrink-0">
          ম্যানেজ
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-[11px] font-bold text-gray-500 mb-1 px-2 uppercase tracking-wider mt-1.5 shrink-0">{title}</h3>;
}

function MenuItem({ icon: Icon, color, bg, label, value, onClick }: { icon: any, color: string, bg: string, label: string, value?: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition last:border-0 text-left shrink-0">
      <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center shrink-0`}><Icon size={16} /></div><span className="text-sm font-bold text-gray-700">{label}</span></div>
      <div className="flex items-center gap-1 shrink-0">{value && <span className="text-[11px] font-bold text-gray-400">{value}</span>}<ChevronRight size={16} className="text-gray-400" /></div>
    </button>
  );
}