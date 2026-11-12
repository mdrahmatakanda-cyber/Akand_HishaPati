import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, HelpCircle, Plus, Search, Building2, Truck, 
  X, Loader2, Phone, MapPin, FileText, Image as ImageIcon, Edit3,
  Clock, ArrowRightLeft, PackagePlus, Wallet
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { demoCompanyStats, demoCompanyActivities, demoSupplierStats, demoSupplierActivities } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

interface Company {
  id: string;
  name: string;
  commission: number;
  max_discount: number;
  contact_person: string;
  phone: string;
  address: string;
  notes: string;
  commission_rate_upto_100: number;
  commission_rate_above_100: number;
  loading_unloading_rate_per_ton: number;
  delivery_rent_per_ton: number;
  transport_allowance_per_ton: number;
  default_warehouse_rent: number;
  default_manager_salary: number;
  image_url?: string;
  documents?: string[];
}

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  due_balance: number;
  notes: string;
  image_url?: string;
  documents?: string[];
}

export default function DepotCompanyPage({ onBack, onNavigate }: Props) {
  const { activeBusiness } = useAuth();
  const { isDemoMode } = useAppContext();

  const [activeTab, setActiveTab] = useState<'companies' | 'suppliers'>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // ডিটেইলস ভিউ স্টেট
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // মডাল স্টেট
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingSupplier, setIsEditingSupplier] = useState(false);

  // ফর্ম স্টেট
  const [companyForm, setCompanyForm] = useState({ 
    name: '', commission: '', maxDiscount: '0', contactPerson: '', phone: '', address: '', notes: '',
    commission_upto_100: '1000', commission_above_100: '1300',
    loading_rate: '500', delivery_rate: '1000', transport_allowance: '0',
    warehouse_rent: '15000', manager_salary: '10000'
  });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '', previousDue: '0', notes: '' });

  // আপলোড স্টেট
  const [companyImage, setCompanyImage] = useState<File | null>(null);
  const [companyDoc, setCompanyDoc] = useState<File | null>(null);
  const companyImageInputRef = useRef<HTMLInputElement>(null);
  const companyDocInputRef = useRef<HTMLInputElement>(null);

  const [supplierImage, setSupplierImage] = useState<File | null>(null);
  const [supplierDoc, setSupplierDoc] = useState<File | null>(null);
  const supplierImageInputRef = useRef<HTMLInputElement>(null);
  const supplierDocInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setCompanies([
          { id: 'c1', name: 'নিউজা', commission: 5, max_discount: 2, contact_person: 'রফিক', phone: '01711223344', address: 'ঢাকা', notes: '', commission_rate_upto_100: 1000, commission_rate_above_100: 1300, loading_unloading_rate_per_ton: 500, delivery_rent_per_ton: 1000, transport_allowance_per_ton: 0, default_warehouse_rent: 15000, default_manager_salary: 10000, image_url: '', documents: ['trade_license.pdf'] },
        ]);
        setSuppliers([
          { id: 's1', name: 'ভাই ভাই এগ্রো', phone: '01811223344', address: 'গাজীপুর', due_balance: 15000, notes: '', image_url: '', documents: [] }
        ]);
      } else {
        if (!activeBusiness?.id) return;

        const [compRes, supRes] = await Promise.all([
          supabase.from('companies').select('*').eq('business_id', activeBusiness.id).order('created_at', { ascending: false }),
          supabase.from('suppliers').select('*').eq('business_id', activeBusiness.id).order('created_at', { ascending: false })
        ]);
        
        if (compRes.error) throw compRes.error;
        if (supRes.error) throw supRes.error;

        setCompanies(compRes.data || []);
        setSuppliers(supRes.data || []);
      }
    } catch (error: any) {
      alert("ডাটা লোড করতে সমস্যা হয়েছে: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  // --- কোম্পানি সেভ ---
  const handleSaveCompany = async () => {
    if (!companyForm.name || !companyForm.commission) return alert('কোম্পানির নাম এবং কমিশন % আবশ্যক');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newC: Company = {
          id: selectedCompany && isEditingCompany ? selectedCompany.id : Date.now().toString(),
          name: companyForm.name,
          commission: Number(companyForm.commission) || 0,
          max_discount: Number(companyForm.maxDiscount) || 0,
          contact_person: companyForm.contactPerson,
          phone: companyForm.phone,
          address: companyForm.address,
          notes: companyForm.notes,
          commission_rate_upto_100: Number(companyForm.commission_upto_100) || 1000,
          commission_rate_above_100: Number(companyForm.commission_above_100) || 1300,
          loading_unloading_rate_per_ton: Number(companyForm.loading_rate) || 500,
          delivery_rent_per_ton: Number(companyForm.delivery_rate) || 1000,
          transport_allowance_per_ton: Number(companyForm.transport_allowance) || 0,
          default_warehouse_rent: Number(companyForm.warehouse_rent) || 15000,
          default_manager_salary: Number(companyForm.manager_salary) || 10000,
          image_url: companyImage ? URL.createObjectURL(companyImage) : (isEditingCompany ? selectedCompany?.image_url : ''),
          documents: companyDoc ? [companyDoc.name] : (isEditingCompany ? selectedCompany?.documents : [])
        };
        
        if (isEditingCompany && selectedCompany) {
          setCompanies(companies.map(c => c.id === selectedCompany.id ? newC : c));
          setSelectedCompany(newC);
        } else {
          setCompanies([newC, ...companies]);
          setSelectedCompany(newC);
        }
      } else {
        if (!activeBusiness?.id) return;
        
        const companyData = {
          business_id: activeBusiness.id,
          name: companyForm.name,
          commission: Number(companyForm.commission) || 0,
          max_discount: Number(companyForm.maxDiscount) || 0,
          contact_person: companyForm.contactPerson,
          phone: companyForm.phone,
          address: companyForm.address,
          notes: companyForm.notes,
          commission_rate_upto_100: Number(companyForm.commission_upto_100) || 1000,
          commission_rate_above_100: Number(companyForm.commission_above_100) || 1300,
          loading_unloading_rate_per_ton: Number(companyForm.loading_rate) || 500,
          delivery_rent_per_ton: Number(companyForm.delivery_rate) || 1000,
          transport_allowance_per_ton: Number(companyForm.transport_allowance) || 0,
          default_warehouse_rent: Number(companyForm.warehouse_rent) || 15000,
          default_manager_salary: Number(companyForm.manager_salary) || 10000
        };

        const { data, error } = isEditingCompany && selectedCompany
          ? await supabase.from('companies').update(companyData).eq('id', selectedCompany.id).select().single()
          : await supabase.from('companies').insert([companyData]).select().single();

        if (error) throw error;
        fetchData();
        if (data) setSelectedCompany(data);
      }
      
      alert('কোম্পানি সফলভাবে সেভ হয়েছে!');
      setShowCompanyModal(false);
      setIsEditingCompany(false);
    } catch (error: any) {
      alert('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- সাপ্লায়ার সেভ ---
  const handleSaveSupplier = async () => {
    if (!supplierForm.name) return alert('সাপ্লায়ারের নাম আবশ্যক');
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newS: Supplier = {
          id: selectedSupplier && isEditingSupplier ? selectedSupplier.id : Date.now().toString(),
          name: supplierForm.name,
          phone: supplierForm.phone,
          address: supplierForm.address,
          due_balance: Number(supplierForm.previousDue) || 0,
          notes: supplierForm.notes,
          image_url: supplierImage ? URL.createObjectURL(supplierImage) : (isEditingSupplier ? selectedSupplier?.image_url : ''),
          documents: supplierDoc ? [supplierDoc.name] : (isEditingSupplier ? selectedSupplier?.documents : [])
        };
        
        if (isEditingSupplier && selectedSupplier) {
          setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? newS : s));
          setSelectedSupplier(newS);
        } else {
          setSuppliers([newS, ...suppliers]);
          setSelectedSupplier(newS);
        }
      } else {
        if (!activeBusiness?.id) return;
        
        const supplierData = {
          business_id: activeBusiness.id,
          name: supplierForm.name,
          phone: supplierForm.phone,
          address: supplierForm.address,
          due_balance: Number(supplierForm.previousDue) || 0,
          notes: supplierForm.notes
        };

        const { data, error } = isEditingSupplier && selectedSupplier
          ? await supabase.from('suppliers').update(supplierData).eq('id', selectedSupplier.id).select().single()
          : await supabase.from('suppliers').insert([supplierData]).select().single();

        if (error) throw error;
        fetchData();
        if (data) setSelectedSupplier(data);
      }
      
      alert('সাপ্লায়ার সফলভাবে সেভ হয়েছে!');
      setShowSupplierModal(false);
      setIsEditingSupplier(false);
    } catch (error: any) {
      alert('সেভ করতে সমস্যা হয়েছে: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // কোম্পানি এডিট ওপেন
  const openEditCompany = (c: Company) => {
    setCompanyForm({
      name: c.name, commission: c.commission.toString(), maxDiscount: c.max_discount.toString(),
      contactPerson: c.contact_person || '', phone: c.phone || '', address: c.address || '', notes: c.notes || '',
      commission_upto_100: c.commission_rate_upto_100.toString(), commission_above_100: c.commission_rate_above_100.toString(),
      loading_rate: c.loading_unloading_rate_per_ton.toString(), delivery_rate: c.delivery_rent_per_ton.toString(),
      transport_allowance: c.transport_allowance_per_ton.toString(), warehouse_rent: c.default_warehouse_rent.toString(),
      manager_salary: c.default_manager_salary.toString()
    });
    setIsEditingCompany(true);
    setShowCompanyModal(true);
  };

  // সাপ্লায়ার এডিট ওপেন
  const openEditSupplier = (s: Supplier) => {
    setSupplierForm({
      name: s.name, phone: s.phone || '', address: s.address || '',
      previousDue: s.due_balance.toString(), notes: s.notes || ''
    });
    setIsEditingSupplier(true);
    setShowSupplierModal(true);
  };

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.phone && s.phone.includes(searchQuery)));

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (selectedCompany) setSelectedCompany(null);
                else if (selectedSupplier) setSelectedSupplier(null);
                else onBack();
              }} 
              className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                {selectedCompany ? 'কোম্পানি প্রোফাইল' : selectedSupplier ? 'সাপ্লায়ার প্রোফাইল' : 'কোম্পানি ও সাপ্লায়ার'}
              </h1>
            </div>
          </div>
          {!selectedCompany && !selectedSupplier && (
            <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          )}
        </div>

        {/* টগল বার (শুধু লিস্ট ভিউতে দেখাবে) */}
        {!selectedCompany && !selectedSupplier && (
          <div className="flex px-2 pt-1">
            <button onClick={() => { setActiveTab('companies'); setSearchQuery(''); }} className={`flex-1 py-2 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'companies' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
              <Building2 size={16}/> কোম্পানি
            </button>
            <button onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }} className={`flex-1 py-2 text-sm font-bold border-b-2 transition flex justify-center items-center gap-1.5 ${activeTab === 'suppliers' ? 'border-white text-white' : 'border-transparent text-white/60'}`}>
              <Truck size={16}/> সাপ্লায়ার
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        {/* ==================== লিস্ট ভিউ ==================== */}
        {!selectedCompany && !selectedSupplier && (
          <>
            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm shrink-0 mt-1">
              <Search size={18} className="text-da-textMuted" />
              <input 
                type="text" 
                placeholder={activeTab === 'companies' ? "কোম্পানি খুঁজুন..." : "সাপ্লায়ার খুঁজুন..."} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full outline-none text-sm bg-transparent" 
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
            ) : activeTab === 'companies' ? (
              <div className="flex flex-col gap-1.5">
                {filteredCompanies.map(c => (
                  <div key={c.id} onClick={() => setSelectedCompany(c)} className="bg-white border border-da-cardBorder rounded-xl p-2.5 shadow-sm cursor-pointer active:scale-[0.98] transition-transform flex gap-2.5">
                    {/* বাম পাশে কোম্পানির ছবি */}
                    <div className="w-12 h-12 rounded-lg bg-da-depotBg flex items-center justify-center text-da-depotBlue shrink-0 overflow-hidden border border-da-cardBorder">
                      {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover"/> : <Building2 size={24}/>}
                    </div>
                    
                    {/* ডান পাশে তথ্য */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-da-textDark truncate">{c.name}</h3>
                      <p className="text-[10px] text-da-textMuted truncate mt-0.5">যোগাযোগ: {c.contact_person || 'নেই'}</p>
                      
                      <div className="grid grid-cols-3 gap-1 mt-1.5 border-t border-da-cardBorder/50 pt-1.5 text-[9px] font-bold">
                        <div className="flex flex-col">
                          <span className="text-da-textMuted">কমিশন</span>
                          <span className="text-da-depotBlue">৳{toBangla(c.commission_rate_upto_100 || 1000)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-da-textMuted">স্টক ভ্যালু</span>
                          <span className="text-da-textDark">৳{toBangla(isDemoMode ? demoCompanyStats.currentStockValue : 0)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-da-textMuted">কোম্পানি পাওনা</span>
                          <span className="text-da-red">৳{toBangla(isDemoMode ? demoCompanyStats.companyPayable : 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredSuppliers.map(s => (
                  <div key={s.id} onClick={() => setSelectedSupplier(s)} className="bg-white border border-da-cardBorder rounded-xl p-2.5 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-da-depotBg flex items-center justify-center text-da-depotBlue overflow-hidden shrink-0">
                        {s.image_url ? <img src={s.image_url} alt="" className="w-full h-full object-cover"/> : <Truck size={14}/>}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-da-textDark">{s.name}</h3>
                        <p className="text-[10px] text-da-textMuted mt-0.5 flex items-center gap-1"><Phone size={10}/> {s.phone || 'ফোন নেই'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[13px] text-da-red">৳{toBangla(s.due_balance || 0)}</p>
                      <span className="text-[8px] font-bold text-da-textMuted">বাকি</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== কোম্পানি প্রোফাইল ভিউ ==================== */}
        {selectedCompany && (
          <div className="flex flex-col gap-2 animate-in zoom-in-95 duration-200">
            
            <div className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm relative">
              
              {/* এডিট বাটন (উপরে ডান কোণায়) */}
              <button onClick={() => openEditCompany(selectedCompany)} className="absolute top-3 right-3 flex items-center gap-1 text-da-depotBlue bg-da-depotBlue/10 px-2 py-1 rounded-md text-[10px] font-bold active:scale-95 transition">
                <Edit3 size={12}/> এডিট
              </button>

              <div className="flex items-center gap-2.5 mb-2.5 pr-16">
                <div className="w-10 h-10 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue border border-da-cardBorder overflow-hidden shrink-0">
                  {selectedCompany.image_url ? <img src={selectedCompany.image_url} alt="" className="w-full h-full object-cover"/> : <Building2 size={20}/>}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-base text-da-textDark truncate">{selectedCompany.name}</h2>
                  <p className="text-[10px] text-da-textMuted truncate">যোগাযোগ: {selectedCompany.contact_person || 'নেই'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left">
                  <Phone className="text-da-depotNavy shrink-0" size={12} />
                  <p className="text-[11px] font-bold text-da-textDark truncate">{selectedCompany.phone || 'ফোন নেই'}</p>
                </div>
                {selectedCompany.address && (
                  <div className="flex items-center gap-1.5 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left">
                    <MapPin className="text-da-depotNavy shrink-0" size={12} />
                    <p className="text-[11px] font-bold text-da-textDark truncate">{selectedCompany.address}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left mb-1.5">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-bold text-da-textDark">
                  <p>কমিশন (১০০টন): <span className="text-da-depotBlue">৳{toBangla(selectedCompany.commission_rate_upto_100)}</span></p>
                  <p>কমিশন (১০০+): <span className="text-da-depotBlue">৳{toBangla(selectedCompany.commission_rate_above_100)}</span></p>
                  <p>ভাড়া: <span className="text-da-depotBlue">৳{toBangla(selectedCompany.delivery_rent_per_ton)}</span></p>
                  <p>লোডিং: <span className="text-da-depotBlue">৳{toBangla(selectedCompany.loading_unloading_rate_per_ton)}</span></p>
                </div>
              </div>

              {selectedCompany.documents && selectedCompany.documents.length > 0 && (
                <div className="bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left flex items-center gap-1.5">
                  <FileText size={12} className="text-da-depotNavy shrink-0" />
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {selectedCompany.documents.map((doc, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-da-depotBlue bg-white px-1.5 py-0.5 rounded border border-da-cardBorder whitespace-nowrap">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

                        {/* ৩টি অ্যাকশন বাটন */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button onClick={() => onNavigate('purchase')} className="bg-da-depotBlue text-white py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <PackagePlus size={16}/> <span className="text-[11px]">মাল গ্রহণ</span>
              </button>
              <button onClick={() => alert('কোম্পানিকে পেমেন্ট করার পপআপ')} className="bg-da-green text-white py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <Wallet size={16}/> <span className="text-[11px]">পেমেন্ট</span>
              </button>
              <button onClick={() => onNavigate('depot')} className="bg-da-depotAmber text-da-depotNavy py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <ArrowRightLeft size={16}/> <span className="text-[11px]">মাল ট্রান্সফার</span>
              </button>
            </div>

            {/* লেনদেনের সংক্ষিপ্ত তথ্য */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 shrink-0 mt-1">
              <h3 className="font-bold text-[11px] text-da-textDark mb-2 flex items-center gap-1.5 border-b border-da-cardBorder pb-1.5">
                <Clock size={14} className="text-da-depotBlue"/> লেনদেনের সংক্ষিপ্ত তথ্য
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-da-textMuted mb-0.5">বর্তমান স্টক</span>
                  <span className="font-black text-sm text-da-depotBlue">
                    ৳ {toBangla(isDemoMode ? demoCompanyStats.currentStockValue : 0)}
                  </span>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-red-600 mb-0.5">কোম্পানির পাওনা</span>
                  <span className="font-black text-sm text-red-600">
                    ৳ {toBangla(isDemoMode ? demoCompanyStats.companyPayable : 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* সাম্প্রতিক কাজের লিস্ট */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 shrink-0 mt-1">
              <h3 className="font-bold text-[11px] text-da-textDark mb-2 flex items-center gap-1.5 border-b border-da-cardBorder pb-1.5">
                <Clock size={14} className="text-da-depotBlue"/> সাম্প্রতিক কাজ
              </h3>
              
              <div className="flex flex-col gap-1.5">
                {isDemoMode ? demoCompanyActivities.map(activity => (
                  <div key={activity.id} onClick={() => setSelectedActivity(activity)} className="bg-da-depotBg border border-da-cardBorder rounded-lg p-2 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white border border-da-cardBorder flex items-center justify-center shrink-0">
                        {activity.type === 'মাল গ্রহণ' ? <PackagePlus size={14} className="text-da-depotBlue"/> : 
                         activity.type === 'মাল ট্রান্সফার' ? <ArrowRightLeft size={14} className="text-da-depotAmber"/> : 
                         <Wallet size={14} className="text-da-green"/>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-da-textDark truncate">{activity.type}</p>
                        <p className="text-[9px] text-da-textMuted truncate mt-0.5">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="font-black text-[11px] text-da-depotNavy">৳{toBangla(activity.amount)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-[10px] text-da-textMuted py-4">কোনো সাম্প্রতিক কাজ পাওয়া যায়নি।</div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ==================== সাপ্লায়ার প্রোফাইল ভিউ ==================== */}
        {selectedSupplier && (
          <div className="flex flex-col gap-2 animate-in zoom-in-95 duration-200">
            
            <div className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm relative">
              
              <button onClick={() => openEditSupplier(selectedSupplier)} className="absolute top-3 right-3 flex items-center gap-1 text-da-depotBlue bg-da-depotBlue/10 px-2 py-1 rounded-md text-[10px] font-bold active:scale-95 transition">
                <Edit3 size={12}/> এডিট
              </button>

              <div className="flex items-center gap-2.5 mb-2.5 pr-16">
                <div className="w-10 h-10 bg-da-depotBg rounded-full flex items-center justify-center text-da-depotBlue border border-da-cardBorder overflow-hidden shrink-0">
                  {selectedSupplier.image_url ? <img src={selectedSupplier.image_url} alt="" className="w-full h-full object-cover"/> : <Truck size={20}/>}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-base text-da-textDark truncate">{selectedSupplier.name}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left">
                  <Phone className="text-da-depotNavy shrink-0" size={12} />
                  <p className="text-[11px] font-bold text-da-textDark truncate">{selectedSupplier.phone || 'ফোন নেই'}</p>
                </div>
                {selectedSupplier.address && (
                  <div className="flex items-center gap-1.5 bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left">
                    <MapPin className="text-da-depotNavy shrink-0" size={12} />
                    <p className="text-[11px] font-bold text-da-textDark truncate">{selectedSupplier.address}</p>
                  </div>
                )}
              </div>

              {selectedSupplier.documents && selectedSupplier.documents.length > 0 && (
                <div className="bg-da-depotBg px-2 py-1.5 rounded-lg border border-da-cardBorder text-left flex items-center gap-1.5">
                  <FileText size={12} className="text-da-depotNavy shrink-0" />
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                    {selectedSupplier.documents.map((doc, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-da-depotBlue bg-white px-1.5 py-0.5 rounded border border-da-cardBorder whitespace-nowrap">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button onClick={() => onNavigate('purchase')} className="bg-da-depotBlue text-white py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <PackagePlus size={16}/> <span className="text-[11px]">মাল গ্রহণ</span>
              </button>
              <button onClick={() => alert('সাপ্লায়ারকে পেমেন্ট করার পপআপ')} className="bg-da-green text-white py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <Wallet size={16}/> <span className="text-[11px]">পেমেন্ট</span>
              </button>
              <button onClick={() => onNavigate('depot')} className="bg-da-depotAmber text-da-depotNavy py-2.5 rounded-lg font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition">
                <ArrowRightLeft size={16}/> <span className="text-[11px]">মাল ট্রান্সফার</span>
              </button>
            </div>

            {/* লেনদেনের সংক্ষিপ্ত তথ্য (সাপ্লায়ারের জন্য) */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 shrink-0 mt-1">
              <h3 className="font-bold text-[11px] text-da-textDark mb-2 flex items-center gap-1.5 border-b border-da-cardBorder pb-1.5">
                <Clock size={14} className="text-da-depotBlue"/> লেনদেনের সংক্ষিপ্ত তথ্য
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-da-depotBg p-2 rounded-lg border border-da-cardBorder flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-da-textMuted mb-0.5">মোট ক্রয়</span>
                  <span className="font-black text-sm text-da-depotBlue">
                    ৳ {toBangla(isDemoMode ? demoSupplierStats.totalPurchased : 0)}
                  </span>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-200 flex flex-col items-center text-center">
                  <span className="text-[9px] font-bold text-red-600 mb-0.5">মোট বাকি</span>
                  <span className="font-black text-sm text-red-600">
                    ৳ {toBangla(isDemoMode ? demoSupplierStats.totalDue : 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* সাম্প্রতিক কাজের লিস্ট (সাপ্লায়ারের জন্য) */}
            <div className="bg-white rounded-xl border border-da-cardBorder shadow-sm p-2.5 shrink-0 mt-1">
              <h3 className="font-bold text-[11px] text-da-textDark mb-2 flex items-center gap-1.5 border-b border-da-cardBorder pb-1.5">
                <Clock size={14} className="text-da-depotBlue"/> সাম্প্রতিক কাজ
              </h3>
              
              <div className="flex flex-col gap-1.5">
                {isDemoMode ? demoSupplierActivities.map(activity => (
                  <div key={activity.id} onClick={() => setSelectedActivity(activity)} className="bg-da-depotBg border border-da-cardBorder rounded-lg p-2 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-white border border-da-cardBorder flex items-center justify-center shrink-0">
                        {activity.type === 'মাল গ্রহণ' ? <PackagePlus size={14} className="text-da-depotBlue"/> : 
                         <Wallet size={14} className="text-da-green"/>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-da-textDark truncate">{activity.type}</p>
                        <p className="text-[9px] text-da-textMuted truncate mt-0.5">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="font-black text-[11px] text-da-depotNavy">৳{toBangla(activity.amount)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-[10px] text-da-textMuted py-4">কোনো সাম্প্রতিক কাজ পাওয়া যায়নি।</div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* বটম বার (শুধু লিস্ট ভিউতে) */}
      {!selectedCompany && !selectedSupplier && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50">
          <button 
            onClick={() => {
              if (activeTab === 'companies') {
                setCompanyForm({ name: '', commission: '', maxDiscount: '0', contactPerson: '', phone: '', address: '', notes: '', commission_upto_100: '1000', commission_above_100: '1300', loading_rate: '500', delivery_rate: '1000', transport_allowance: '0', warehouse_rent: '15000', manager_salary: '10000' });
                setIsEditingCompany(false);
                setShowCompanyModal(true);
              } else {
                setSupplierForm({ name: '', phone: '', address: '', previousDue: '0', notes: '' });
                setIsEditingSupplier(false);
                setShowSupplierModal(true);
              }
            }} 
            className="w-full bg-da-depotBlue text-white py-3 rounded-xl font-bold shadow-blue-soft flex justify-center items-center gap-2 active:scale-95 transition"
          >
            <Plus size={18}/> নতুন {activeTab === 'companies' ? 'কোম্পানি' : 'সাপ্লায়ার'} যোগ করুন
          </button>
        </div>
      )}

      {/* ================= মডাল: কোম্পানি ================= */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{isEditingCompany ? 'কোম্পানি এডিট করুন' : 'নতুন কোম্পানি যোগ করুন'}</h2>
              <button onClick={() => setShowCompanyModal(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কোম্পানির নাম *</label>
                  <input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">যোগাযোগকারী</label>
                  <input type="text" value={companyForm.contactPerson} onChange={e => setCompanyForm({...companyForm, contactPerson: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন নম্বর</label>
                  <input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কমিশন (%)</label>
                  <input type="number" value={companyForm.commission} onChange={e => setCompanyForm({...companyForm, commission: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label>
                <input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              <div className="bg-da-depotBg p-2.5 rounded-xl border border-da-cardBorder mt-1">
                <h3 className="text-[11px] font-bold text-da-depotNavy mb-2 border-b border-da-cardBorder pb-1">কমিশন সেটআপ (৳)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-da-textMuted mb-1 block">১০০ টন পর্যন্ত</label>
                    <input type="number" value={companyForm.commission_upto_100} onChange={e => setCompanyForm({...companyForm, commission_upto_100: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-da-textMuted mb-1 block">১০০ টনের বেশি</label>
                    <input type="number" value={companyForm.commission_above_100} onChange={e => setCompanyForm({...companyForm, commission_above_100: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                </div>
              </div>

              <div className="bg-da-depotBg p-2.5 rounded-xl border border-da-cardBorder mt-1">
                <h3 className="text-[11px] font-bold text-da-depotNavy mb-2 border-b border-da-cardBorder pb-1">পরিবহন খরচ (প্রতি টন)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-da-textMuted mb-1 block">লোডিং</label>
                    <input type="number" value={companyForm.loading_rate} onChange={e => setCompanyForm({...companyForm, loading_rate: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-da-textMuted mb-1 block">ডেলিভারি</label>
                    <input type="number" value={companyForm.delivery_rate} onChange={e => setCompanyForm({...companyForm, delivery_rate: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-da-textMuted mb-1 block">কোম্পানির</label>
                    <input type="number" value={companyForm.transport_allowance} onChange={e => setCompanyForm({...companyForm, transport_allowance: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                  </div>
                </div>
              </div>

              {/* কোম্পানি আপলোড */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => companyImageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <ImageIcon size={18} className={companyImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{companyImage ? companyImage.name : 'কোম্পানির ছবি'}</span>
                </button>
                <input type="file" ref={companyImageInputRef} onChange={e => setCompanyImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                <button onClick={() => companyDocInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <FileText size={18} className={companyDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{companyDoc ? companyDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={companyDocInputRef} onChange={e => setCompanyDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setShowCompanyModal(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveCompany} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: সাপ্লায়ার ================= */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[80dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm">{isEditingSupplier ? 'সাপ্লায়ার এডিট করুন' : 'নতুন সাপ্লায়ার যোগ করুন'}</h2>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">সাপ্লায়ারের নাম *</label>
                <input type="text" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ফোন নম্বর</label>
                <input type="tel" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ঠিকানা</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পূর্বের বাকি</label>
                <input type="number" value={supplierForm.previousDue} onChange={e => setSupplierForm({...supplierForm, previousDue: e.target.value})} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
              </div>

              {/* সাপ্লায়ার আপলোড */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => supplierImageInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <ImageIcon size={18} className={supplierImage ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{supplierImage ? supplierImage.name : 'সাপ্লায়ারের ছবি'}</span>
                </button>
                <input type="file" ref={supplierImageInputRef} onChange={e => setSupplierImage(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
                <button onClick={() => supplierDocInputRef.current?.click()} className="border border-dashed border-da-cardBorder rounded-lg p-2 flex flex-col items-center text-da-textMuted">
                  <FileText size={18} className={supplierDoc ? 'text-da-green' : ''} />
                  <span className="text-[10px] font-bold mt-1 truncate w-full text-center">{supplierDoc ? supplierDoc.name : 'ডকুমেন্ট (PDF)'}</span>
                </button>
                <input type="file" ref={supplierDocInputRef} onChange={e => setSupplierDoc(e.target.files?.[0] || null)} accept=".pdf,image/*" className="hidden" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setShowSupplierModal(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveSupplier} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: সাম্প্রতিক কাজের বিস্তারিত ================= */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Clock size={16}/> কাজের বিস্তারিত</h2>
              <button onClick={() => setSelectedActivity(null)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-bold text-da-textMuted mb-0.5">কাজের ধরন</p>
                <p className="font-bold text-sm text-da-textDark">{selectedActivity.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-da-textMuted mb-0.5">তারিখ</p>
                <p className="font-bold text-sm text-da-textDark">{selectedActivity.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-da-textMuted mb-0.5">পরিমাণ / বিবরণ</p>
                <p className="font-bold text-sm text-da-depotBlue">৳{toBangla(selectedActivity.amount)}</p>
                <p className="text-xs text-da-textDark mt-1 bg-da-depotBg p-2 rounded-lg border border-da-cardBorder">{selectedActivity.details}</p>
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg">
              <button onClick={() => setSelectedActivity(null)} className="w-full bg-da-depotNavy text-white py-2 rounded-xl font-bold">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}