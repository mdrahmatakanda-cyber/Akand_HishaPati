import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, RefreshCw, 
  Map, Table, Users, Shield, X, Eye, EyeOff, 
  ChevronDown, CheckSquare, Square, Navigation, UserPlus
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

const featureList = [
  "Dashboard", "Companies", "Products", "Markets", "Shops / Customer",
  "Officer Team", "Sale", "Payment", "Damage", "Return",
  "Stock", "Purchase", "Suppliers", "Reports", "Transactions",
  "Expenses", "Business Finance", "Referral", "Subscription",
  "Support", "Profile"
];

export default function OfficerPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'table' | 'map'>('table');
  
  // ডাটা স্টেট
  const [officerList, setOfficerList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  
  // মডাল স্টেট
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [isViewRolesModalOpen, setIsViewRolesModalOpen] = useState(false);

  // রোল ফর্ম স্টেট
  const [roleName, setRoleName] = useState('');
  const [permissions, setPermissions] = useState<Record<string, any>>({});

  // অফিসার ফর্ম স্টেট
  const [officerForm, setOfficerForm] = useState({
    name: '', phone: '', password: '', target: '', 
    status: 'Active', commissionRate: '0', commissionType: 'Officer Commission',
    role: 'Default Officer', isAdvanced: false, companyAccess: 'All Companies (Full Access)', marketAccess: 'All Routes & Markets (Full Access)'
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

  // অফিসার সেভ
  const handleSaveOfficer = () => {
    if (!officerForm.name || !officerForm.phone || !officerForm.password) return alert('নাম, ফোন এবং পাসওয়ার্ড আবশ্যক');
    setOfficerList([...officerList, { id: Date.now(), ...officerForm }]);
    setIsOfficerModalOpen(false);
    setOfficerForm({
      name: '', phone: '', password: '', target: '', 
      status: 'Active', commissionRate: '0', commissionType: 'Officer Commission',
      role: 'Default Officer', isAdvanced: false, companyAccess: 'All Companies (Full Access)', marketAccess: 'All Routes & Markets (Full Access)'
    });
  };

  const filteredOfficerList = officerList.filter(officer => {
    const matchSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase()) || officer.phone.includes(searchQuery);
    const matchStatus = statusFilter === 'All Status' || officer.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-[100dvh] bg-da-bg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-da-greenDeep text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="font-bold text-base leading-tight">অফিসার টিম</h1>
              <p className="text-[9px] text-green-100">ম্যানেজ অফিসার ও রোল</p>
            </div>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={16} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 pb-6">
        
        {/* কন্ট্রোল প্যানেল */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex gap-1.5 items-center">
            <div className="flex bg-da-innerBg p-0.5 rounded-lg shrink-0 border border-da-cardBorder">
              <button onClick={() => setActiveTab('table')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${activeTab === 'table' ? 'bg-white shadow-sm text-da-green' : 'text-da-textMuted'}`}>
                <Table size={12}/> টেবিল
              </button>
              <button onClick={() => setActiveTab('map')} className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition ${activeTab === 'map' ? 'bg-white shadow-sm text-da-green' : 'text-da-textMuted'}`}>
                <Map size={12}/> ম্যাপ
              </button>
            </div>
            <button onClick={() => setIsViewRolesModalOpen(true)} className="flex-1 bg-white border border-da-cardBorder text-da-textDark rounded-lg py-1.5 text-[11px] font-bold shadow-sm active:scale-95 transition">রোল দেখুন</button>
          </div>

          <div className="flex gap-1.5">
            <button onClick={() => setIsRoleModalOpen(true)} className="flex-1 bg-white border border-da-cardBorder text-da-textDark py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
              <Shield size={14}/> রোল যোগ
            </button>
            <button onClick={() => setIsOfficerModalOpen(true)} className="flex-1 bg-da-green text-white py-1.5 rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
              <UserPlus size={14}/> নতুন অফিসার
            </button>
          </div>
        </div>

        {/* টেবিল ভিউ */}
        {activeTab === 'table' && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            
            {/* সামারি স্ট্যাটাস */}
            <div className="bg-white border border-da-cardBorder rounded-lg p-2 shadow-sm flex flex-wrap gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-da-innerBg px-1.5 py-0.5 rounded text-[9px] font-bold text-da-textDark"><Users size={10}/> {toBangla(officerList.length)} মোট</div>
              <div className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-700"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {toBangla(0)} অনলাইন</div>
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-700"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> {toBangla(0)} আইডল</div>
              <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-500"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div> {toBangla(0)} অফলাইন</div>
            </div>

            {/* সার্চ ও ফিল্টার */}
            <div className="bg-white border border-da-cardBorder rounded-lg p-2 flex flex-col gap-1.5 shadow-sm shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-da-textMuted" />
                <input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-da-innerBg border border-da-cardBorder rounded-md pl-8 pr-2 py-1.5 text-xs outline-none focus:border-da-green" />
              </div>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-da-innerBg border border-da-cardBorder rounded-md px-2 py-1.5 text-xs outline-none appearance-none font-bold text-da-textDark">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-textMuted" />
                </div>
                <button className="px-2 bg-white border border-da-cardBorder rounded-md shadow-sm text-da-green"><RefreshCw size={14}/></button>
              </div>
            </div>

            {/* লিস্ট বা খালি অবস্থা */}
            {filteredOfficerList.length === 0 ? (
              <div className="border border-dashed border-da-cardBorder rounded-lg p-6 flex flex-col items-center justify-center text-center bg-white/50 mt-1">
                <Users size={32} className="text-da-textMuted/50 mb-2" />
                <h3 className="font-bold text-da-textDark text-sm">কোনো অফিসার পাওয়া যায়নি</h3>
                <button onClick={() => setIsOfficerModalOpen(true)} className="mt-3 bg-da-green text-white px-4 py-1.5 rounded-md font-bold text-xs shadow-sm active:scale-95 transition">অফিসার তৈরি করুন</button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {filteredOfficerList.map(officer => (
                  <div key={officer.id} className="bg-white border border-da-cardBorder rounded-lg px-2.5 py-2 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-da-innerBg rounded-full flex items-center justify-center text-da-textMuted">
                        <Users size={14}/>
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-da-textDark">{officer.name}</h3>
                        <p className="text-[10px] text-da-textMuted mt-0.5">{officer.phone} | {officer.role}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${officer.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{officer.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* টিম ম্যাপ ভিউ (প্লেসহোল্ডার) */}
        {activeTab === 'map' && (
          <div className="flex-1 bg-da-innerBg rounded-lg border border-da-cardBorder relative overflow-hidden flex items-center justify-center min-h-[250px] animate-in fade-in duration-200">
            <div className="z-10 bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-da-cardBorder">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-bold text-xs text-da-textDark">{toBangla(0)} অ্যাক্টিভ ({toBangla(0)} ট্র্যাকড)</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-white p-1.5 rounded-full shadow-md border border-da-cardBorder">
               <Navigation size={18} className="text-da-green" />
            </div>
          </div>
        )}

      </main>

      {/* ================= মডাল: নতুন রোল তৈরি ================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-innerBg px-3 py-2 flex justify-between items-center border-b border-da-cardBorder shrink-0">
              <h2 className="font-bold text-sm text-da-textDark">রোল যোগ করুন</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="p-1 bg-white border border-da-cardBorder rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">রোলের নাম <span className="text-da-red">*</span></label>
                <input type="text" placeholder="উদাহরণ: স্টোর ম্যানেজার" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
              </div>

              <div className="bg-da-blue/5 border border-da-blue/20 rounded-lg p-2 text-[10px] text-da-blue leading-relaxed">
                এই স্টাফ রোলের জন্য শুধুমাত্র প্রয়োজনীয় অনুমতিগুলো টেবিল থেকে দিন।
              </div>

              {/* পারমিশন টেবিল */}
              <div className="border border-da-cardBorder rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-da-innerBg p-1.5 text-[9px] font-bold text-da-textMuted border-b border-da-cardBorder">
                  <div className="col-span-4">ফিচার</div>
                  <div className="col-span-2 text-center">ভিউ</div>
                  <div className="col-span-2 text-center">সব</div>
                  <div className="col-span-2 text-center">অ্যাড</div>
                  <div className="col-span-2 text-center">অ্যাকশন</div>
                </div>
                
                <div className="divide-y divide-da-cardBorder/50 max-h-[35vh] overflow-y-auto">
                  {featureList.map(feature => (
                    <div key={feature} className="grid grid-cols-12 items-center p-1.5 text-[10px] font-bold text-da-textDark hover:bg-da-innerBg/50">
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

            <div className="p-2.5 bg-da-innerBg border-t border-da-cardBorder flex gap-2 shrink-0">
              <button onClick={() => setIsRoleModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-lg font-bold text-xs">বাতিল</button>
              <button onClick={handleSaveRole} className="flex-1 bg-da-blue text-white py-2 rounded-lg font-bold text-xs shadow-md">রোল তৈরি করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন অফিসার তৈরি ================= */}
      {isOfficerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-innerBg px-3 py-2 flex justify-between items-center border-b border-da-cardBorder shrink-0">
              <h2 className="font-bold text-sm text-da-textDark">নতুন অফিসার তৈরি করুন</h2>
              <button onClick={() => setIsOfficerModalOpen(false)} className="p-1 bg-white border border-da-cardBorder rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">নাম <span className="text-da-red">*</span></label>
                <input type="text" value={officerForm.name} onChange={e => setOfficerForm({...officerForm, name: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">ফোন <span className="text-da-red">*</span></label>
                <input type="text" value={officerForm.phone} onChange={e => setOfficerForm({...officerForm, phone: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">পাসওয়ার্ড <span className="text-da-red">*</span></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={officerForm.password} onChange={e => setOfficerForm({...officerForm, password: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 pr-8 text-sm outline-none focus:border-da-green" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-textMuted">
                    {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textDark mb-1 block">মাসিক টার্গেট</label>
                  <input type="number" value={officerForm.target} onChange={e => setOfficerForm({...officerForm, target: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textDark mb-1 block">স্ট্যাটাস <span className="text-da-red">*</span></label>
                  <select value={officerForm.status} onChange={e => setOfficerForm({...officerForm, status: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textDark mb-1 block">কমিশন রেট (%)</label>
                  <input type="number" value={officerForm.commissionRate} onChange={e => setOfficerForm({...officerForm, commissionRate: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textDark mb-1 block">কমিশন টাইপ</label>
                  <select value={officerForm.commissionType} onChange={e => setOfficerForm({...officerForm, commissionType: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green">
                    <option>Officer Commission</option>
                    <option>Fixed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textDark mb-1 block">রোল</label>
                <select value={officerForm.role} onChange={e => setOfficerForm({...officerForm, role: e.target.value})} className="w-full bg-white border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-green">
                  <option>Default Officer</option>
                  {rolesList.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <p className="text-[9px] text-da-textMuted mt-1">এই অফিসারের জন্য ডিলার-মালিকানাধীন রোল অ্যাসাইন করুন।</p>
              </div>

              {/* অ্যাডভান্সড অপশন */}
              <div className="border border-da-cardBorder rounded-lg p-2 bg-da-innerBg mt-1">
                <div onClick={() => setOfficerForm({...officerForm, isAdvanced: !officerForm.isAdvanced})} className="flex items-center gap-1.5 cursor-pointer select-none">
                  {officerForm.isAdvanced ? <CheckSquare size={16} className="text-da-green"/> : <Square size={16} className="text-da-textMuted"/>}
                  <span className="font-bold text-xs text-da-textDark">অ্যাডভান্সড</span>
                </div>
                
                {officerForm.isAdvanced && (
                  <div className="mt-2 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="text-[10px] font-bold text-da-textDark mb-1 block">কোম্পানি অ্যাক্সেস</label>
                      <div className="relative">
                        <select value={officerForm.companyAccess} onChange={e => setOfficerForm({...officerForm, companyAccess: e.target.value})} className="w-full bg-white border border-da-green/30 rounded-lg px-2 py-1.5 text-[11px] font-bold text-da-green outline-none appearance-none">
                          <option>All Companies (Full Access)</option>
                          <option>Specific Companies</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-green" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-da-textDark mb-1 block">রোড ও মার্কেট</label>
                      <div className="relative">
                        <select value={officerForm.marketAccess} onChange={e => setOfficerForm({...officerForm, marketAccess: e.target.value})} className="w-full bg-white border border-da-green/30 rounded-lg px-2 py-1.5 text-[11px] font-bold text-da-green outline-none appearance-none">
                          <option>All Routes & Markets (Full Access)</option>
                          <option>Specific Markets</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-da-green" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-2.5 bg-da-innerBg border-t border-da-cardBorder flex gap-2 shrink-0">
              <button onClick={() => setIsOfficerModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-lg font-bold text-xs">বাতিল</button>
              <button onClick={handleSaveOfficer} className="flex-1 bg-da-green text-white py-2 rounded-lg font-bold text-xs shadow-md">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: রোল লিস্ট দেখুন ================= */}
      {isViewRolesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[60dvh] sm:h-auto sm:max-h-[60vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-innerBg px-3 py-2 flex justify-between items-center border-b border-da-cardBorder shrink-0">
              <h2 className="font-bold text-sm text-da-textDark">রোল তালিকা</h2>
              <button onClick={() => setIsViewRolesModalOpen(false)} className="p-1 bg-white border border-da-cardBorder rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
               {rolesList.length === 0 ? (
                 <div className="text-center text-da-textMuted mt-10 text-xs font-bold">কোনো রোল তৈরি করা হয়নি</div>
               ) : (
                 rolesList.map(r => (
                   <div key={r.id} className="bg-white border border-da-cardBorder p-2 rounded-lg shadow-sm flex items-center gap-2">
                     <Shield size={16} className="text-da-blue" />
                     <span className="font-bold text-xs text-da-textDark">{r.name}</span>
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
      className={`w-7 h-4 rounded-full relative transition-colors ${checked ? 'bg-da-green' : 'bg-gray-300'}`}
    >
      <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${checked ? 'left-3.5' : 'left-0.5'}`}></div>
    </button>
  );
}