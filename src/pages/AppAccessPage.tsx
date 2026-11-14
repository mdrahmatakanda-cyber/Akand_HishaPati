import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, Filter, Plus, UserPlus, 
  Check, Calendar, Image as ImageIcon, Save, 
  ChevronRight, Phone, Loader2, Lock
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoStaffMembers, demoRoles } from '../lib/demoData';
import PremiumToast from '../components/PremiumToast';

interface Props { onBack: () => void; }

const featureCategories = [
  { title: 'কেনা', items: ['কার্ট এডিট', 'ডিসকাউন্ট', 'ডেলিভারি চার্জ'] },
  { title: 'বিক্রি করুন', items: ['দ্রুত বিক্রি', 'কার্ট এডিট', 'ডিসকাউন্ট', 'ডেলিভারি চার্জ'] },
  { title: 'কেনার খাতা', items: ['এডিট করুন', 'মুছে ফেলুন'] },
  { title: 'বিক্রির খাতা', items: ['এডিট করুন', 'মুছে ফেলুন'] },
  { title: 'বাকি', items: ['ইতিহাস', 'রিয়েলাইজ'] },
  { title: 'খরচ', items: ['অ্যাড', 'এডিট', 'ডিলিট'] },
  { title: 'যোগাযোগ', items: ['কাস্টমার', 'সাপ্লায়ার', 'কর্মচারী'] },
  { title: 'প্রোডাক্ট লিস্ট', items: ['অ্যাড', 'এডিট', 'ডিলিট'] },
  { title: 'স্টকের হিসাব', items: ['স্টক আপডেট', 'স্টক ইতিহাস'] },
  { title: 'মার্কেটিং', items: ['এসএমএস', 'নোটিফিকেশন'] },
];
const settingItems = ['Shop Reset', 'রিসাইকেল বিন', 'শপ এডিট', 'বিকাশ/নগদ কিউ আর'];

export default function AppAccessPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ show: true, message, type });

  const [view, setView] = useState<'list' | 'add_user' | 'responsibility' | 'add_role'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [activeRoleTab, setActiveRoleTab] = useState('OWNER');
  const [newUser, setNewUser] = useState({ name: '', phone: '', email: '', password: '', joinDate: '', role: 'MANAGER' });
  const [newRoleName, setNewRoleName] = useState('');
  
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [roleSettings, setRoleSettings] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setUsers(demoStaffMembers);
        setRoles(demoRoles);
        applyRoleData(demoRoles, activeRoleTab);
      } else {
        if (!activeBusiness?.id) return;
        
        const [userRes, roleRes] = await Promise.all([
          supabase.from('staff_members').select('*').eq('business_id', activeBusiness.id),
          supabase.from('custom_roles').select('*').eq('business_id', activeBusiness.id)
        ]);

        if (userRes.data) setUsers(userRes.data);
        if (roleRes.data) {
          setRoles(roleRes.data);
          applyRoleData(roleRes.data, activeRoleTab);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isDemoMode, activeBusiness?.id]);

  const applyRoleData = (allRoles: any[], roleName: string) => {
    const currentRole = allRoles.find(r => r.name === roleName);
    if (currentRole) {
      setRolePermissions(currentRole.permissions || {});
      setRoleSettings(currentRole.settings || {});
    }
  };

  const handleRoleTabChange = (roleName: string) => {
    setActiveRoleTab(roleName);
    applyRoleData(roles, roleName);
  };

  const handleToggle = (key: string, isSetting = false) => {
    if (isSetting) {
      setRoleSettings(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      setRolePermissions(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // ✅ নতুন ইউজার অ্যাড করার ফাংশন (ইমেইল ছাড়াও কাজ করবে)
  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.phone) return showToast('নাম এবং মোবাইল নম্বর আবশ্যক', 'error');
    setIsSaving(true);
    try {
      // ইমেইল না থাকলে ফোন দিয়ে অটো-ইমেইল জেনারেট
      const finalEmail = newUser.email.trim() || `${newUser.phone.replace(/[^0-9]/g, '')}@hishabpati.staff`;
      const finalPassword = newUser.password || 'Staff@12345'; // ডিফল্ট পাসওয়ার্ড

      if (isDemoMode) {
        const userObj = {
          id: Date.now().toString(),
          name: newUser.name,
          phone: newUser.phone,
          email: finalEmail,
          status: 'Active',
          join_date: newUser.joinDate || new Date().toISOString().split('T')[0],
          role: newUser.role,
          business_id: activeBusiness?.id
        };
        setUsers([...users, userObj]);
        showToast('ইউজার সফলভাবে যুক্ত হয়েছে! (ডেমু)', 'success');
      } else {
        // রিয়েল মোডে: Auth ইউজার তৈরি হবে
        const { error } = await supabase.auth.signUp({
          email: finalEmail,
          password: finalPassword,
          options: {
            data: {
              name: newUser.name,
              phone: newUser.phone,
              role: newUser.role,
              business_id: activeBusiness?.id
            }
          }
        });

        if (error) throw error;

        // staff_members টেবিলে এন্ট্রি
        await supabase.from('staff_members').insert([{
          name: newUser.name,
          phone: newUser.phone,
          email: finalEmail,
          join_date: newUser.joinDate || new Date().toISOString().split('T')[0],
          role: newUser.role,
          status: 'Active',
          business_id: activeBusiness?.id
        }]);

        fetchData();
        showToast('ইউজার সফলভাবে যুক্ত হয়েছে!', 'success');
      }
      
      setView('list');
      setNewUser({ name: '', phone: '', email: '', password: '', joinDate: '', role: 'MANAGER' });
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!newRoleName) return showToast('পদবীর নাম আবশ্যক', 'error');
    const upperName = newRoleName.toUpperCase();
    if (roles.some(r => r.name === upperName)) return showToast('এই পদবী আগে থেকেই আছে', 'error');
    
    setIsSaving(true);
    try {
      const newRole = { id: Date.now().toString(), name: upperName, permissions: {}, settings: {}, business_id: activeBusiness?.id };

      if (isDemoMode) {
        setRoles([...roles, newRole]);
        setActiveRoleTab(upperName);
        showToast('নতুন পদবী তৈরি হয়েছে! (ডেমু)', 'success');
      } else {
        const { error } = await supabase.from('custom_roles').insert([newRole]);
        if (error) throw error;
        fetchData();
        showToast('নতুন পদবী তৈরি হয়েছে!', 'success');
      }
      
      setActiveRoleTab(upperName);
      applyRoleData([...roles, newRole], upperName);
      setView('responsibility');
      setNewRoleName('');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRolePermissions = async () => {
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setRoles(roles.map(r => r.name === activeRoleTab ? { ...r, permissions: rolePermissions, settings: roleSettings } : r));
      } else {
        const { error } = await supabase.from('custom_roles').update({ permissions: rolePermissions, settings: roleSettings }).eq('name', activeRoleTab).eq('business_id', activeBusiness?.id);
        if (error) throw error;
        fetchData();
      }
      showToast('পদবীর দায়িত্ব আপডেট হয়েছে!', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || (u.phone && u.phone.includes(searchQuery)));
  }, [users, searchQuery]);

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      <PremiumToast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />

      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => view === 'list' ? onBack() : setView(view === 'add_user' ? 'list' : 'responsibility')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">
              {view === 'list' && 'ইউজার লিস্ট'}
              {view === 'add_user' && 'নতুন ইউজার যুক্ত করুন'}
              {view === 'responsibility' && 'ইউজারের দায়িত্ব সেট করুন'}
              {view === 'add_role' && 'নতুন পদবী যোগ করুন'}
            </h1>
          </div>
          <button onClick={() => showToast('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24 relative">
        
        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#1E88E5]" size={32}/></div>
        ) : (
          <>
            {view === 'list' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#1E88E5]">
                  <Search size={18} className="text-gray-400" />
                  <input type="text" placeholder="ইউজার খুঁজুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
                  <div className="h-4 w-[1px] bg-gray-300"></div>
                  <button className="text-gray-500 font-bold text-xs flex items-center gap-1"><Filter size={14} /> ফিল্টার</button>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-600 font-bold px-1">
                  <span>ব্যবহারকারীর সংখ্যা: {toBangla(filteredUsers.length)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-start gap-3 relative cursor-pointer active:scale-[0.98] transition-transform">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 border border-gray-200">
                        <UserPlus size={24} className="text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800">{user.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">{user.role}</p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 mt-1">
                          <Phone size={12} /> {toBangla(user.phone)}
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${user.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{user.status}</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                  ))}
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
                  <button onClick={() => setView('add_user')} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
                    <Plus size={18}/> নতুন ইউজার যুক্ত করুন
                  </button>
                </div>
              </div>
            )}

            {view === 'add_user' && (
              <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
                <button onClick={() => showToast('ফোনবুক ইন্টিগ্রেশন শীঘ্রই আসছে')} className="w-full bg-white border border-[#1E88E5] text-[#1E88E5] py-2.5 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition">
                  <Phone size={18}/> ফোনবুক থেকে আনুন
                </button>

                <div className="flex justify-center my-2">
                  <div className="relative">
                    <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
                      <ImageIcon size={28} className="text-amber-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">ব্যবহারকারীর নাম <span className="text-red-500">*</span></label>
                  <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="ব্যবহারকারীর নাম" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                  <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-2 py-2.5 flex items-center gap-1 border-r text-sm font-bold text-gray-700">
                      <span className="text-red-500">●</span> +88
                    </div>
                    <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} placeholder="মোবাইল নম্বর" className="w-full p-2.5 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">ইমেইল (ঐচ্ছিক)</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="ইমেইল না দিলে অটো তৈরি হবে" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Lock size={12}/> পাসওয়ার্ড (ঐচ্ছিক)</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="না দিলে Staff@12345 হবে" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">পদবী সিলেক্ট করুন <span className="text-red-500">*</span></label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    {roles.length === 0 ? (
                      <option value="">কোনো পদবী নেই। আগে পদবী তৈরি করুন</option>
                    ) : (
                      roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">যোগদানের তারিখ</label>
                  <div className="relative">
                    <input type="date" value={newUser.joinDate} onChange={e => setNewUser({...newUser, joinDate: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47] appearance-none" />
                    <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
                  <button onClick={handleSaveUser} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} সেভ করুন
                  </button>
                </div>
              </div>
            )}

            {view === 'responsibility' && (
              <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
                <div className="flex justify-end">
                  <button onClick={() => setView('add_role')} className="flex items-center gap-1 text-sm font-bold text-[#1E88E5]">
                    <Plus size={16}/> নতুন পদবী যোগ করুন
                  </button>
                </div>

                <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                  {roles.map(role => (
                    <button 
                      key={role.id}
                      onClick={() => handleRoleTabChange(role.name)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap border transition ${activeRoleTab === role.name ? 'bg-[#1E88E5] text-white border-[#1E88E5] shadow-md' : 'bg-white text-gray-600 border-gray-300'}`}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                  {featureCategories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <h3 className="font-bold text-sm text-gray-800 border-b pb-1">{cat.title}</h3>
                      {cat.items.map(item => (
                        <label key={item} className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggle(cat.title)}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center text-white shadow-sm border transition ${rolePermissions[cat.title] ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'}`}>
                            {rolePermissions[cat.title] && <Check size={14} strokeWidth={3} />}
                          </div>
                          <span className="text-sm font-bold text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50 flex gap-2">
                  <button onClick={handleUpdateRolePermissions} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} দায়িত্ব সেভ করুন
                  </button>
                </div>
              </div>
            )}

            {view === 'add_role' && (
              <div className="flex flex-col gap-3 animate-in slide-in-from-right duration-300">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">পদবীর নাম <span className="text-red-500">*</span></label>
                  <input type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="পদবীর নাম (যেমন: সেলস ম্যানেজার)" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>

                <h3 className="font-bold text-sm text-gray-800 mt-2">এই পদবীর অ্যাপের অনুমতি সেট করুন</h3>
                
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {featureCategories.slice(0, 10).map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0">
                      <span className="text-sm font-bold text-gray-700">{cat.title}</span>
                      <button 
                        onClick={() => handleToggle(cat.title)} 
                        className={`w-10 h-5 rounded-full relative transition-colors ${rolePermissions[cat.title] ? 'bg-[#1E88E5]' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${rolePermissions[cat.title] ? 'left-5' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm mt-1">
                  <h3 className="font-bold text-sm text-gray-800 mb-2">সেটিংস</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {settingItems.map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggle(item, true)}>
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${roleSettings[item] ? 'bg-[#1E88E5] border-[#1E88E5]' : 'border-gray-400 bg-white'}`}>
                          {roleSettings[item] && <Check size={14} strokeWidth={3} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
                  <button onClick={handleSaveRole} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} সেভ করুন
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}