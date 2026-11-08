import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Plus, Search, RefreshCw, 
  Map, Table, Users, Shield, X, Eye, EyeOff, 
  ChevronDown, CheckSquare, Square, Navigation
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

const featureList = [
  "Dashboard", "Companies", "Products", "Markets", "Shops / Customer",
  "SR / DSR Team", "Sale", "Payment", "Damage", "Return",
  "Stock", "Purchase", "Suppliers", "Reports", "Transactions",
  "Expenses", "Business Finance", "Referral", "Subscription",
  "Support", "Profile"
];

export default function SrPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');
  
  // ডাটা স্টেট
  const [srList, setSrList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  
  // মডাল স্টেট
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSrModalOpen, setIsSrModalOpen] = useState(false);
  const [isViewRolesModalOpen, setIsViewRolesModalOpen] = useState(false);

  // রোল ফর্ম স্টেট
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  // এসআর ফর্ম স্টেট
  const [srForm, setSrForm] = useState({
    name: '', phone: '', password: '', target: '', 
    status: 'Active', commissionRate: '0', commissionType: 'SR Commission',
    role: 'Default SR', isAdvanced: false, companyAccess: 'All Companies (Full Access)', marketAccess: 'All Routes & Markets (Full Access)'
  });
  const [showPassword, setShowPassword] = useState(false);

  // সার্চ ও ফিল্টার
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // পারমিশন টগল হ্যান্ডলার
  const handlePermissionChange = (feature: string, type: string) => {
    setPermissions(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [type]: !prev[feature]?.[type]
      }
    }));
  };

  // রোল সেভ
  const handleSaveRole = () => {
    if (!roleName) return alert('রোলের নাম আবশ্যক');
    setRolesList([...rolesList, { id: Date.now(), name: roleName, permissions }]);
    setIsRoleModalOpen(false);
    setRoleName('');
    setPermissions({});
  };

  // এসআর সেভ
  const handleSaveSr = () => {
    if (!srForm.name || !srForm.phone || !srForm.password) return alert('নাম, ফোন এবং পাসওয়ার্ড আবশ্যক');
    setSrList([...srList, { id: Date.now(), ...srForm }]);
    setIsSrModalOpen(false);
    setSrForm({
      name: '', phone: '', password: '', target: '', 
      status: 'Active', commissionRate: '0', commissionType: 'SR Commission',
      role: 'Default SR', isAdvanced: false, companyAccess: 'All Companies (Full Access)', marketAccess: 'All Routes & Markets (Full Access)'
    });
  };

  const filteredSrList = srList.filter(sr => {
    const matchSearch = sr.name.toLowerCase().includes(searchQuery.toLowerCase()) || sr.phone.includes(searchQuery);
    const matchStatus = statusFilter === 'All Status' || sr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="font-bold text-lg leading-tight">SR / DSR টিম</h1>
              <p className="text-[9px] text-cyan-200">Manage sales representatives & roles</p>
            </div>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-6">
        
        {/* কন্ট্রোল প্যানেল */}
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            <div className="flex bg-gray-200 p-1 rounded-lg shrink-0">
              <button onClick={() => setActiveTab('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'table' ? 'bg-white shadow text-[#0B5C47]' : 'text-gray-600'}`}>
                <Table size={14}/> টেবিল
              </button>
              <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'map' ? 'bg-white shadow text-[#0B5C47]' : 'text-gray-600'}`}>
                <Map size={14}/> টিম ম্যাপ
              </button>
            </div>
            <button onClick={() => setIsViewRolesModalOpen(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition">রোল দেখুন</button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsRoleModalOpen(true)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
              <Plus size={16}/> রোল যোগ করুন
            </button>
            <button onClick={() => setIsSrModalOpen(true)} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-1 active:scale-95 transition">
              <Plus size={16}/> নতুন SR / DSR
            </button>
          </div>
        </div>

        {/* টেবিল ভিউ */}
        {activeTab === 'table' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            
            {/* সামারি স্ট্যাটাস */}
            <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full text-[11px] font-bold text-gray-700"><Users size={12}/> {toBangla(srList.length)} মোট SR</div>
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-2 py-1 rounded-full text-[11px] font-bold text-green-700"><div className="w-2 h-2 bg-green-500 rounded-full"></div> {toBangla(0)} অনলাইন</div>
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full text-[11px] font-bold text-amber-700"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> {toBangla(0)} আইডল</div>
              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full text-[11px] font-bold text-gray-500"><div className="w-2 h-2 bg-gray-400 rounded-full"></div> {toBangla(0)} অফলাইন</div>
            </div>

            {/* সার্চ ও ফিল্টার */}
            <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex flex-col gap-2 shadow-sm">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="নাম বা ফোন দিয়ে SR খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#F3F4F6] border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-[#F3F4F6] border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none appearance-none font-bold text-gray-700">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
                <button className="px-3 bg-white border border-gray-300 rounded-lg shadow-sm text-green-600"><RefreshCw size={18}/></button>
              </div>
            </div>

            {/* লিস্ট বা খালি অবস্থা */}
            {filteredSrList.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-1 bg-white/50">
                <Users size={40} className="text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-base">কোনো SR পাওয়া যায়নি</h3>
                <button onClick={() => setIsSrModalOpen(true)} className="mt-4 bg-[#1E88E5] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition">Create SR</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-1">
                {filteredSrList.map(sr => (
                  <div key={sr.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-gray-800">{sr.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{sr.phone}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sr.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sr.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* টিম ম্যাপ ভিউ (প্লেসহোল্ডার) */}
        {activeTab === 'map' && (
          <div className="flex-1 bg-[#E5E7EB] rounded-xl border border-gray-300 relative overflow-hidden flex items-center justify-center min-h-[300px] animate-in fade-in duration-200">
            {/* ম্যাপের ব্যাকগ্রাউন্ড ইমেজ সিমুলেশন */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Dhaka,Bangladesh&zoom=7&size=600x400&maptype=roadmap&style=feature:all|element:geometry|color:0xf5f5f5&key=YOUR_API_KEY')] bg-cover bg-center"></div>
            
            <div className="z-10 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-200">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-sm text-gray-700">{toBangla(0)} অ্যাক্টিভ ({toBangla(0)} ট্র্যাকড)</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg border border-gray-200">
               <Navigation size={24} className="text-[#1E88E5]" />
            </div>
          </div>
        )}

      </main>

      {/* ================= মডাল: নতুন রোল তৈরি ================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">রোল যোগ করুন</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">রোলের নাম <span className="text-red-500">*</span></label>
                <input type="text" placeholder="উদাহরণ: স্টোর ম্যানেজার" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-[#1E88E5] leading-relaxed">
                এই স্টাফ রোলের জন্য শুধুমাত্র প্রয়োজনীয় অনুমতিগুলো টেবিল থেকে দিন। যে রিসোর্সগুলো সাপোর্ট করে না, সেগুলো ডিজেবল থাকে।
              </div>

              {/* পারমিশন টেবিল */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-100 p-2 text-[10px] font-bold text-gray-700 border-b">
                  <div className="col-span-4">মেনু ও ফিচার</div>
                  <div className="col-span-2 text-center">ভিউ</div>
                  <div className="col-span-2 text-center">সব ভিউ</div>
                  <div className="col-span-2 text-center">অ্যাড</div>
                  <div className="col-span-2 text-center">অ্যাকশন</div>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[40vh] overflow-y-auto">
                  {featureList.map(feature => (
                    <div key={feature} className="grid grid-cols-12 items-center p-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                      <div className="col-span-4">{feature}</div>
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
                        <div className="w-4 h-4 border-2 border-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t flex gap-2 shrink-0">
              <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={handleSaveRole} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">Create role</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন এসআর তৈরি ================= */}
      {isSrModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">SR / DSR তৈরি করুন</h2>
              <button onClick={() => setIsSrModalOpen(false)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">নাম <span className="text-red-500">*</span></label>
                <input type="text" value={srForm.name} onChange={e => setSrForm({...srForm, name: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ফোন <span className="text-red-500">*</span></label>
                <input type="text" value={srForm.phone} onChange={e => setSrForm({...srForm, phone: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">পাসওয়ার্ড <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={srForm.password} onChange={e => setSrForm({...srForm, password: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 pr-10 text-sm outline-none focus:border-[#0B5C47]" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">মাসিক টার্গেট</label>
                  <input type="number" value={srForm.target} onChange={e => setSrForm({...srForm, target: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">স্ট্যাটাস <span className="text-red-500">*</span></label>
                  <select value={srForm.status} onChange={e => setSrForm({...srForm, status: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">কমিশন রেট (%)</label>
                  <input type="number" value={srForm.commissionRate} onChange={e => setSrForm({...srForm, commissionRate: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">কমিশন টাইপ</label>
                  <select value={srForm.commissionType} onChange={e => setSrForm({...srForm, commissionType: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option>SR Commission</option>
                    <option>Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">রোল</label>
                <select value={srForm.role} onChange={e => setSrForm({...srForm, role: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                  <option>Default SR</option>
                  {rolesList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">এই SR এর জন্য ডিলার-মালিকানাধীন রোল অ্যাসাইন করুন।</p>
              </div>

              {/* অ্যাডভান্সড অপশন */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 mt-1">
                <div onClick={() => setSrForm({...srForm, isAdvanced: !srForm.isAdvanced})} className="flex items-center gap-2 cursor-pointer select-none">
                  {srForm.isAdvanced ? <CheckSquare size={18} className="text-[#1E88E5]"/> : <Square size={18} className="text-gray-400"/>}
                  <span className="font-bold text-sm text-gray-800">অ্যাডভান্সড</span>
                </div>
                
                {srForm.isAdvanced && (
                  <div className="mt-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">কোম্পানি অ্যাক্সেস</label>
                      <div className="relative">
                        <select value={srForm.companyAccess} onChange={e => setSrForm({...srForm, companyAccess: e.target.value})} className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-xs font-bold text-green-700 outline-none appearance-none">
                          <option>All Companies (Full Access)</option>
                          <option>Specific Companies</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700" />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">বর্তমানে সব কোম্পানিতে অ্যাক্সেস আছে। নির্দিষ্ট করতে ক্লিক করুন।</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1 block">রোড ও মার্কেট</label>
                      <div className="relative">
                        <select value={srForm.marketAccess} onChange={e => setSrForm({...srForm, marketAccess: e.target.value})} className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-xs font-bold text-green-700 outline-none appearance-none">
                          <option>All Routes & Markets (Full Access)</option>
                          <option>Specific Markets</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700" />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">বর্তমানে সব রুট ও মার্কেটে অ্যাক্সেস আছে। নির্দিষ্ট করতে ক্লিক করুন।</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t flex gap-2 shrink-0">
              <button onClick={() => setIsSrModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={handleSaveSr} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: রোল লিস্ট দেখুন ================= */}
      {isViewRolesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[80dvh] sm:h-auto sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">রোল তালিকা</h2>
              <button onClick={() => setIsViewRolesModalOpen(false)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
               {rolesList.length === 0 ? (
                 <div className="text-center text-gray-500 mt-10 text-sm">কোনো রোল তৈরি করা হয়নি</div>
               ) : (
                 rolesList.map(r => (
                   <div key={r.id} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm flex items-center gap-2">
                     <Shield size={18} className="text-[#1E88E5]" />
                     <span className="font-bold text-sm text-gray-800">{r.name}</span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// কাস্টম টগল সুইচ কম্পোনেন্ট
function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-[#1E88E5]' : 'bg-gray-300'}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${checked ? 'left-4' : 'left-0.5'}`}></div>
    </button>
  );
}