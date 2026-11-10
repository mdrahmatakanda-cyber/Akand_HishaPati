import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, Mic, Plus, X, 
  UserPlus, User, Phone, Loader2, Trash2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoCustomers, demoSuppliers, demoEmployees } from '../lib/demoData';

interface Props {
  onBack: () => void;
}

export default function ContactsPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier' | 'employee'>('customer');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // ফর্ম স্টেট
  const [formData, setFormData] = useState({ name: '', address: '', mobile: '' });

  const getTabTitle = () => {
    if (activeTab === 'customer') return 'কাস্টমার';
    if (activeTab === 'supplier') return 'সাপ্লায়ার';
    return 'কর্মচারী';
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        if (activeTab === 'customer') setContacts(demoCustomers);
        else if (activeTab === 'supplier') setContacts(demoSuppliers);
        else setContacts(demoEmployees);
      } else {
        if (!activeBusiness?.id) return;
        
        let tableName = '';
        if (activeTab === 'customer') tableName = 'customers';
        else if (activeTab === 'supplier') tableName = 'suppliers';
        else tableName = 'employees';

        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('business_id', activeBusiness.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContacts(data || []);
      }
    } catch (error) {
      console.error("Contacts fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [activeTab, isDemoMode, activeBusiness?.id]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [contacts, searchQuery]);

  const handleSave = async () => {
    if (!formData.name || !formData.mobile) return alert('নাম এবং মোবাইল নম্বর দিন');
    
    setIsSaving(true);
    try {
      if (isDemoMode) {
        const newItem = {
          id: Date.now().toString(),
          name: formData.name,
          phone: formData.mobile,
          address: formData.address
        };
        setContacts([newItem, ...contacts]);
      } else {
        if (!activeBusiness?.id) return;
        
        let tableName = activeTab === 'customer' ? 'customers' : activeTab === 'supplier' ? 'suppliers' : 'employees';
        
        const insertData: any = {
          business_id: activeBusiness.id,
          name: formData.name,
          phone: formData.mobile
        };
        
        if (activeTab !== 'employee') {
          insertData.address = formData.address;
        }

        const { error } = await supabase.from(tableName).insert([insertData]);
        if (error) throw error;
        fetchContacts();
      }
      
      setIsAddModalOpen(false);
      setFormData({ name: '', address: '', mobile: '' });
    } catch (error: any) {
      alert('সেভ করতে সমস্যা: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি এই তথ্যটি মুছে ফেলতে চান?')) return;
    
    try {
      if (isDemoMode) {
        setContacts(contacts.filter(c => c.id !== id));
      } else {
        let tableName = activeTab === 'customer' ? 'customers' : activeTab === 'supplier' ? 'suppliers' : 'employees';
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
        fetchContacts();
      }
    } catch (error: any) {
      alert('ডিলিট করতে সমস্যা: ' + error.message);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">যোগাযোগ</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-24">
        
        <div className="bg-white shadow-sm border-b border-gray-200 shrink-0">
          <div className="flex text-sm font-bold text-gray-500">
            <button onClick={() => setActiveTab('customer')} className={`flex-1 py-3 border-b-2 transition ${activeTab === 'customer' ? 'border-[#1E88E5] text-[#1E88E5]' : 'border-transparent'}`}>কাস্টমার</button>
            <button onClick={() => setActiveTab('supplier')} className={`flex-1 py-3 border-b-2 transition ${activeTab === 'supplier' ? 'border-[#1E88E5] text-[#1E88E5]' : 'border-transparent'}`}>সাপ্লায়ার</button>
            <button onClick={() => setActiveTab('employee')} className={`flex-1 py-3 border-b-2 transition ${activeTab === 'employee' ? 'border-[#1E88E5] text-[#1E88E5]' : 'border-transparent'}`}>কর্মচারী</button>
          </div>
        </div>

        <div className="p-2.5 shrink-0">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder={`${getTabTitle()} খোঁজ করুন...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent placeholder-gray-400" />
            <Mic size={18} className="text-gray-400" />
          </div>
        </div>

        {/* লিস্ট সেকশন */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32}/></div>
        ) : filteredContacts.length > 0 ? (
          <div className="px-2.5 flex flex-col gap-2">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#1E88E5] shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-gray-800 truncate">{contact.name}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {contact.phone || 'মোবাইল নেই'} {contact.address ? `| ${contact.address}` : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(contact.id)} className="text-red-400 hover:text-red-600 p-2 shrink-0 active:scale-90 transition">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 mt-5">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'customer' ? <User size={40} className="text-gray-400"/> : <UserPlus size={40} className="text-gray-400"/>}
              </div>
              <h3 className="font-bold text-gray-600 text-base mb-1">কোন {getTabTitle()} পাওয়া যায়নি</h3>
              <p className="text-sm text-gray-400">নিচের বাটনে ক্লিক করে নতুন {getTabTitle()} যুক্ত করুন।</p>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন {getTabTitle()} যুক্ত করুন
        </button>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[85dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">{getTabTitle()} যুক্ত করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              
              <button className="w-full bg-white border border-[#1E88E5] text-[#1E88E5] py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition">
                <Phone size={18}/> ফোনবুক থেকে আনুন
              </button>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">{getTabTitle()}র নাম <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={`${getTabTitle()}র নাম`} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">মোবাইল নং <span className="text-red-500">*</span></label>
                <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-2 py-2 flex items-center gap-1 border-r text-sm font-bold text-gray-700">
                    <span className="text-red-500">●</span> +88
                  </div>
                  <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="মোবাইল নং" className="w-full p-2.5 outline-none text-sm" />
                </div>
              </div>

              {activeTab !== 'employee' && (
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ঠিকানা</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="ঠিকানা" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0">
              <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}