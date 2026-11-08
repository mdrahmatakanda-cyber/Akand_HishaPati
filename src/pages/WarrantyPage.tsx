import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, Plus, ShieldCheck, 
  Clock, CheckCircle2, AlertTriangle, X, Phone, 
  User, Calendar, ChevronDown 
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

interface WarrantyItem {
  id: number;
  productName: string;
  customerName: string;
  phone: string;
  purchaseDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired';
}

const initialWarranties: WarrantyItem[] = [
  { id: 1, productName: 'গ্রোয়ার ফিড মেশিন (মোটর)', customerName: 'রহিম মিয়া', phone: '01711000001', purchaseDate: '2026-01-10', expiryDate: '2027-01-10', status: 'Active' },
  { id: 2, productName: 'সাবমার্সিবল পাম্প', customerName: 'করিম উদ্দিন', phone: '01811000002', purchaseDate: '2025-05-15', expiryDate: '2026-05-15', status: 'Expired' },
  { id: 3, productName: 'অক্সিজেন সিলিন্ডার', customerName: 'সজীব আহমেদ', phone: '01911000003', purchaseDate: '2026-06-01', expiryDate: '2027-06-01', status: 'Active' },
];

export default function WarrantyPage({ onBack }: Props) {
  const [items, setItems] = useState<WarrantyItem[]>(initialWarranties);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ফর্ম স্টেট
  const [form, setForm] = useState({ productName: '', customerName: '', phone: '', purchaseDate: '', months: '12' });

  const handleSave = () => {
    if (!form.productName || !form.customerName || !form.purchaseDate) return alert('প্রয়োজনীয় ঘরগুলো পূরণ করুন');
    
    // এক্সপায়ারি ডেট ক্যালকুলেশন
    const pDate = new Date(form.purchaseDate);
    const eDate = new Date(pDate);
    eDate.setMonth(eDate.getMonth() + Number(form.months));
    
    const newItem: WarrantyItem = {
      id: Date.now(),
      productName: form.productName,
      customerName: form.customerName,
      phone: form.phone,
      purchaseDate: form.purchaseDate,
      expiryDate: eDate.toISOString().split('T')[0],
      status: eDate >= new Date() ? 'Active' : 'Expired'
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setForm({ productName: '', customerName: '', phone: '', purchaseDate: '', months: '12' });
  };

  const filteredItems = items.filter(item => {
    const matchSearch = item.productName.includes(searchQuery) || item.customerName.includes(searchQuery) || item.phone.includes(searchQuery);
    const matchStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = items.filter(i => i.status === 'Active').length;
  const expiredCount = items.filter(i => i.status === 'Expired').length;

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ওয়ারেন্টি ট্র্যাকিং</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        
        {/* সামারি কার্ড */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={16}/></div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold">অ্যাক্টিভ</p>
              <p className="font-black text-sm text-gray-800">{toBangla(activeCount)} টি</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle size={16}/></div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold">এক্সপায়ার্ড</p>
              <p className="font-black text-sm text-gray-800">{toBangla(expiredCount)} টি</p>
            </div>
          </div>
        </div>

        {/* সার্চ ও ফিল্টার */}
        <div className="flex gap-2 shrink-0 mt-1">
          <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="পণ্য বা কাস্টমার খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
          </div>
          <div className="relative w-24">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full h-full bg-white border border-gray-300 rounded-xl px-2 text-xs font-bold text-gray-700 outline-none appearance-none shadow-sm">
              <option value="All">সব</option>
              <option value="Active">অ্যাক্টিভ</option>
              <option value="Expired">এক্সপায়ার্ড</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
          </div>
        </div>

        {/* লিস্ট */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">কোনো ওয়ারেন্টি ডাটা পাওয়া যায়নি</div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className={item.status === 'Active' ? 'text-green-600' : 'text-gray-400'} />
                    <h3 className="font-bold text-sm text-gray-800">{item.productName}</h3>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.status === 'Active' ? 'অ্যাক্টিভ' : 'এক্সপায়ার্ড'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5"><User size={12}/> {item.customerName}</div>
                  <div className="flex items-center gap-1.5"><Phone size={12}/> {toBangla(item.phone)}</div>
                  <div className="flex items-center gap-1.5"><Calendar size={12}/> ক্রয়: {toBangla(item.purchaseDate)}</div>
                  <div className="flex items-center gap-1.5 font-bold text-[#1E88E5]"><Clock size={12}/> মেয়াদ: {toBangla(item.expiryDate)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* বটম বাটন */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন ওয়ারেন্টি যোগ করুন
        </button>
      </div>

      {/* ================= মডাল: নতুন ওয়ারেন্টি ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-auto max-h-[90dvh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">নতুন ওয়ারেন্টি যোগ করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">পণ্যের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">কাস্টমারের নাম <span className="text-red-500">*</span></label>
                  <input type="text" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">মোবাইল নম্বর</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">ক্রয়ের তারিখ <span className="text-red-500">*</span></label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">ওয়ারেন্টি সময় (মাস)</label>
                  <select value={form.months} onChange={e => setForm({...form, months: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option value="3">৩ মাস</option>
                    <option value="6">৬ মাস</option>
                    <option value="12">১ বছর</option>
                    <option value="24">২ বছর</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={handleSave} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}