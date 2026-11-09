import { useState, useEffect } from 'react';
import { 
  ArrowLeft, HelpCircle, Plus, Search, Building2, Truck, 
  Users, ShoppingBag, CheckCircle, FileText, X, 
  Box, AlertTriangle, Printer, Loader2
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { supabase } from '../lib/supabase'; // Supabase ইমপোর্ট

interface Props {
  onBack: () => void;
}

// ডাটাবেসের কলাম অনুযায়ী ইন্টারফেস
interface Company {
  id: string;
  name: string;
  commission: number;
  max_discount: number;
  contact_person: string;
  phone: string;
  address: string;
  notes: string;
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  due_balance: number; // ডাটাবেসে previous_due এর বদলে due_balance আছে
  notes: string;
}

// ডেমু বিজনেস আইডি (ভবিষ্যতে Auth থেকে আসবে)
const TEMP_BUSINESS_ID = "00000000-0000-0000-0000-000000000000"; 

export default function CompanyPage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'companies' | 'suppliers' | 'stock'>('companies');
  
  // ডাটাবেস ডাটা স্টেট
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // লোডিং স্টেট
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // সার্চ স্টেট
  const [searchCompany, setSearchCompany] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');

  // মডাল স্টেট
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // ফর্ম স্টেট
  const [companyForm, setCompanyForm] = useState({ name: '', commission: '', maxDiscount: '0', contactPerson: '', phone: '', address: '', notes: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '', previousDue: '0', notes: '' });

  // ==========================================
  // ১. ডাটাবেস থেকে ডাটা লোড করা
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // কোম্পানি লোড
      const { data: compData, error: compError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (compError) throw compError;
      if (compData) setCompanies(compData);

      // সাপ্লায়ার লোড
      const { data: supData, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (supError) throw supError;
      if (supData) setSuppliers(supData);

    } catch (error: any) {
      console.error("ডাটা লোড করতে সমস্যা:", error.message);
      alert("ডাটা লোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // ২. নতুন কোম্পানি সেভ
  // ==========================================
  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.commission) return alert('কোম্পানির নাম এবং কমিশন % আবশ্যক');
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from('companies').insert([{
        business_id: TEMP_BUSINESS_ID,
        name: companyForm.name,
        commission: Number(companyForm.commission),
        max_discount: Number(companyForm.maxDiscount) || 0,
        contact_person: companyForm.contactPerson,
        phone: companyForm.phone,
        address: companyForm.address,
        notes: companyForm.notes
      }]);

      if (error) throw error;

      alert('কোম্পানি সফলভাবে সেভ হয়েছে!');
      setShowCompanyModal(false);
      setCompanyForm({ name: '', commission: '', maxDiscount: '0', contactPerson: '', phone: '', address: '', notes: '' });
      fetchData(); // ডাটা রিফ্রেশ
    } catch (error: any) {
      alert('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // ৩. নতুন সাপ্লায়ার সেভ
  // ==========================================
  const handleSaveSupplier = async () => {
    if (!supplierForm.name) return alert('সাপ্লায়ারের নাম আবশ্যক');
    setIsSaving(true);

    try {
      const { error } = await supabase.from('suppliers').insert([{
        business_id: TEMP_BUSINESS_ID,
        name: supplierForm.name,
        phone: supplierForm.phone,
        address: supplierForm.address,
        due_balance: Number(supplierForm.previousDue) || 0,
        notes: supplierForm.notes
      }]);

      if (error) throw error;

      alert('সাপ্লায়ার সফলভাবে সেভ হয়েছে!');
      setShowSupplierModal(false);
      setSupplierForm({ name: '', phone: '', address: '', previousDue: '0', notes: '' });
      fetchData(); // ডাটা রিফ্রেশ
    } catch (error: any) {
      alert('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ফিল্টার
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchCompany.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase()) || (s.phone && s.phone.includes(searchSupplier)));

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="font-bold text-lg leading-tight">কোম্পানি ও সাপ্লায়ার</h1>
              <p className="text-[9px] text-cyan-200">Manage companies, suppliers & stock</p>
            </div>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>

        {/* ট্যাবসমূহ */}
        <div className="flex px-2 pt-1">
          <button onClick={() => setActiveTab('companies')} className={`flex-1 py-2 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'companies' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <Building2 size={16}/> কোম্পানি
          </button>
          <button onClick={() => setActiveTab('suppliers')} className={`flex-1 py-2 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'suppliers' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <Truck size={16}/> সাপ্লায়ার
          </button>
          <button onClick={() => setActiveTab('stock')} className={`flex-1 py-2 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'stock' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
            <Box size={16}/> স্টক
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-6">
        
        {/* গ্লোবাল লোডিং স্টেট */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center mt-20">
            <Loader2 size={40} className="text-[#1E88E5] animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-500">ডাটা লোড হচ্ছে...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* ================= ১. কোম্পানি ট্যাব ================= */}
            {activeTab === 'companies' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-xl text-[#0F2A3D]">কোম্পানি</h2>
                    <p className="text-xs text-gray-500 mt-0.5">ডিলার কোম্পানি এবং কমিশন নিয়মাবলী পরিচালনা করুন।</p>
                  </div>
                </div>

                <button onClick={() => setShowCompanyModal(true)} className="w-fit bg-[#1E88E5] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition">
                  <Plus size={16}/> নতুন কোম্পানি
                </button>

                <div className="relative mt-2">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="কোম্পানি খুঁজুন..." value={searchCompany} onChange={e => setSearchCompany(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#0B5C47] shadow-sm" />
                </div>

                {filteredCompanies.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-4">
                    <Building2 size={40} className="text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-700 text-base">কোনো কোম্পানি যুক্ত করা হয়নি</h3>
                    <button onClick={() => setShowCompanyModal(true)} className="mt-4 bg-[#1E88E5] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition">নতুন কোম্পানি</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {filteredCompanies.map(c => (
                      <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <h3 className="font-bold text-sm text-gray-800">{c.name}</h3>
                        <div className="flex gap-4 mt-1 text-xs text-gray-600">
                          <span>কমিশন: {toBangla(c.commission || 0)}%</span>
                          <span>সর্বোচ্চ ডিসকাউন্ট: {toBangla(c.max_discount || 0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= ২. সাপ্লায়ার ট্যাব ================= */}
            {activeTab === 'suppliers' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-xl text-[#0F2A3D]">সাপ্লায়ার</h2>
                    <p className="text-xs text-gray-500 mt-0.5">সাপ্লায়ার প্রোফাইল, ক্রয়, বাকি এবং পেমেন্ট পরিচালনা করুন।</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('stock')} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-1 active:scale-95 transition">
                    <Box size={16}/> স্টক দেখুন
                  </button>
                  <button onClick={() => setShowSupplierModal(true)} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-1 active:scale-95 transition">
                    <Plus size={16}/> সাপ্লায়ার যোগ করুন
                  </button>
                </div>

                {/* স্ট্যাটাস গ্রিড */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><Users size={14} className="text-[#1E88E5]"/> মোট সাপ্লায়ার</div>
                    <span className="font-black text-lg text-gray-800">{toBangla(suppliers.length)}</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><ShoppingBag size={14} className="text-[#1E88E5]"/> মোট ক্রয়</div>
                    <span className="font-black text-lg text-gray-800">৳ {toBangla(0)}</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><CheckCircle size={14} className="text-green-500"/> মোট পরিশোধ</div>
                    <span className="font-black text-lg text-green-600">৳ {toBangla(0)}</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold"><FileText size={14} className="text-red-500"/> মোট বাকি</div>
                    <span className="font-black text-lg text-red-600">৳ {toBangla(0)}</span>
                  </div>
                </div>

                <div className="relative mt-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="সাপ্লায়ারের নাম বা ফোন দিয়ে খুঁজুন..." value={searchSupplier} onChange={e => setSearchSupplier(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#0B5C47] shadow-sm" />
                </div>

                {filteredSuppliers.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-2">
                    <Truck size={40} className="text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-700 text-base">কোনো সাপ্লায়ার পাওয়া যায়নি</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">ক্রয় এবং বাকির হিসাব রাখতে সাপ্লায়ার যুক্ত করুন।</p>
                    <button onClick={() => setShowSupplierModal(true)} className="bg-[#1E88E5] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition flex items-center gap-1"><Plus size={16}/> প্রথম সাপ্লায়ার যোগ করুন</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-1">
                    {filteredSuppliers.map(s => (
                      <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <h3 className="font-bold text-sm text-gray-800">{s.name}</h3>
                        <p className="text-xs text-gray-600 mt-1">{s.phone || 'ফোন নেই'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= ৩. স্টক ট্যাব ================= */}
            {activeTab === 'stock' && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                {/* স্টক ট্যাবের কন্টেন্ট আগের মতোই আছে */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-xl text-[#0F2A3D]">স্টক ও ক্রয়</h2>
                    <p className="text-xs text-gray-500 mt-0.5">লো-স্টক নির্দেশকসহ বর্তমান ইনভেন্টরি।</p>
                  </div>
                </div>

                <button onClick={() => window.print()} className="w-fit border border-[#1E88E5] text-[#1E88E5] bg-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1.5 active:scale-95 transition">
                  <Printer size={16}/> স্টক প্রিন্ট করুন
                </button>

                <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-1 mt-1">
                  <button className="px-4 py-2 text-sm font-bold bg-[#1E88E5] text-white rounded-t-lg whitespace-nowrap">বর্তমান স্টক</button>
                  <button className="px-4 py-2 text-sm font-bold text-gray-500 whitespace-nowrap">স্টক যোগ করুন</button>
                  <button className="px-4 py-2 text-sm font-bold text-gray-500 whitespace-nowrap">লেজার</button>
                  <button className="px-4 py-2 text-sm font-bold text-gray-500 whitespace-nowrap">লো-স্টক</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-center text-xs text-gray-600 font-bold mb-1">
                      <span>চলমান স্টক</span>
                      <Box size={16} className="text-[#1E88E5]"/>
                    </div>
                    <span className="font-black text-xl text-[#0F2A3D]">{toBangla(0)}</span>
                    <p className="text-[10px] text-gray-500 mt-1">০ পিস স্টকে আছে</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex justify-between items-center text-xs text-gray-600 font-bold mb-1">
                      <span>স্টক অ্যালার্ট</span>
                      <AlertTriangle size={16} className="text-amber-500"/>
                    </div>
                    <span className="font-black text-xl text-[#0F2A3D]">{toBangla(0)}</span>
                    <p className="text-[10px] text-gray-500 mt-1">০ আইটেম কম আছে</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ================= মডাল: নতুন কোম্পানি ================= */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base">নতুন কোম্পানি যুক্ত করুন</h2>
              <button onClick={() => setShowCompanyModal(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">কোম্পানির নাম <span className="text-red-500">*</span></label>
                <input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">কমিশন শতাংশ (%) <span className="text-red-500">*</span></label>
                <input type="number" value={companyForm.commission} onChange={e => setCompanyForm({...companyForm, commission: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">সর্বোচ্চ ডিসকাউন্ট শতাংশ (%)</label>
                <input type="number" value={companyForm.maxDiscount} onChange={e => setCompanyForm({...companyForm, maxDiscount: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">যোগাযোগকারী</label>
                <input type="text" value={companyForm.contactPerson} onChange={e => setCompanyForm({...companyForm, contactPerson: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ফোন নম্বর</label>
                <input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ঠিকানা</label>
                <input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">নোট</label>
                <textarea value={companyForm.notes} onChange={e => setCompanyForm({...companyForm, notes: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47] min-h-[60px]" />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
              <button onClick={() => setShowCompanyModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveCompany} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
                {isSaving ? <><Loader2 size={18} className="animate-spin"/> সেভ হচ্ছে...</> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন সাপ্লায়ার ================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base">সাপ্লায়ার যুক্ত করুন</h2>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">সাপ্লায়ারের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} placeholder="যেমন: রহিম এন্টারপ্রাইজ" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ফোন নম্বর</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} placeholder="017XXXXXXXX" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ঠিকানা</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} placeholder="এলাকা / মার্কেট / শহর" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">পূর্বের বাকি / প্রারম্ভিক ব্যালেন্স</label>
                <input type="number" value={supplierForm.previousDue} onChange={e => setSupplierForm({...supplierForm, previousDue: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">নোট</label>
                <textarea value={supplierForm.notes} onChange={e => setSupplierForm({...supplierForm, notes: e.target.value})} placeholder="অতিরিক্ত বিবরণ বা নোট" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47] min-h-[60px]" />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
              <button onClick={() => setShowSupplierModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveSupplier} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
                {isSaving ? <><Loader2 size={18} className="animate-spin"/> সেভ হচ্ছে...</> : 'সাপ্লায়ার তৈরি করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}