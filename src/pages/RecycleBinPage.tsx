import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, Trash2, 
  RotateCcw, AlertTriangle, FileText, ShoppingBag, 
  Package, Users, Truck, ChevronDown
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

// ডেমু ডাটা
const initialDeletedItems = [
  { id: 1, type: 'Sale', name: 'রিসিপ্ট # GVMTQX7S4WGR89W', amount: 100, deletedAt: '07 Nov 2026, 10:30 AM', icon: FileText },
  { id: 2, type: 'Purchase', name: 'রিসিপ্ট # JTMPBC953J7J20P', amount: 280, deletedAt: '06 Nov 2026, 04:15 PM', icon: ShoppingBag },
  { id: 3, type: 'Product', name: 'টেস্ট প্রোডাক্ট (পণ্য)', amount: 0, deletedAt: '05 Nov 2026, 11:20 AM', icon: Package },
  { id: 4, type: 'Customer', name: 'রহিম এন্টারপ্রাইজ (কাস্টমার)', amount: 0, deletedAt: '04 Nov 2026, 09:45 AM', icon: Users },
  { id: 5, type: 'Supplier', name: 'মোল্লা পোল্ট্রি (সাপ্লায়ার)', amount: 0, deletedAt: '03 Nov 2026, 02:10 PM', icon: Truck },
];

export default function RecycleBinPage({ onBack }: Props) {
  const [items, setItems] = useState(initialDeletedItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // মডাল স্টেট
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // ফিল্টার লজিক
  const filteredItems = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterType === 'All' || item.type === filterType;
    return matchSearch && matchFilter;
  });

  // পুনরুদ্ধার (Restore)
  const handleRestore = () => {
    setItems(items.filter(i => i.id !== selectedItem.id));
    setIsRestoreModalOpen(false);
    alert('ডাটা সফলভাবে পুনরুদ্ধার করা হয়েছে!');
  };

  // স্থায়ীভাবে ডিলিট (Delete)
  const handleDelete = () => {
    setItems(items.filter(i => i.id !== selectedItem.id));
    setIsDeleteModalOpen(false);
    alert('ডাটা স্থায়ীভাবে মুছে ফেলা হয়েছে!');
  };

  // সব ডিলিট (Clear All)
  const handleClearAll = () => {
    setItems([]);
    setIsClearAllModalOpen(false);
    alert('রিসাইকেল বিন খালি করা হয়েছে!');
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">রিসাইকেল বিন</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-8">
        
        {/* কন্ট্রোল প্যানেল */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-2 shrink-0">
          
          {/* সার্চ */}
          <div className="flex items-center bg-[#F3F4F6] border border-gray-300 rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="ডিলিট করা ডাটা খুঁজুন..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent text-gray-700" 
            />
          </div>
          
          {/* ফিল্টার ও ক্লিয়ার অল */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[#F3F4F6] border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none appearance-none font-bold text-gray-700 pr-8"
              >
                <option value="All">সব ডাটা</option>
                <option value="Sale">বিক্রি</option>
                <option value="Purchase">ক্রয়</option>
                <option value="Product">প্রোডাক্ট</option>
                <option value="Customer">কাস্টমার</option>
                <option value="Supplier">সাপ্লায়ার</option>
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {items.length > 0 && (
              <button 
                onClick={() => setIsClearAllModalOpen(true)}
                className="bg-red-50 text-red-600 border border-red-200 px-3 rounded-lg font-bold text-xs shadow-sm active:scale-95 transition flex items-center gap-1 shrink-0"
              >
                <Trash2 size={14}/> সব মুছুন
              </button>
            )}
          </div>
        </div>

        {/* স্ট্যাটাস */}
        <div className="flex justify-between items-center px-1 text-xs font-bold text-gray-500">
          <span>মোট ডিলিট করা ডাটা: {toBangla(filteredItems.length)} টি</span>
        </div>

        {/* ডাটা লিস্ট */}
        <div className="flex flex-col gap-2">
          {filteredItems.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center mt-6 bg-white/50">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={40} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-700 text-base">রিসাইকেল বিন খালি</h3>
              <p className="text-xs text-gray-500 mt-1">আপনার কোনো ডিলিট করা ডাটা এখানে নেই।</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">{item.type}</p>
                      </div>
                    </div>
                    {item.amount > 0 && (
                      <span className="font-bold text-sm text-gray-700">৳ {toBangla(item.amount)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-[10px] text-gray-500 font-medium">ডিলিট: {toBangla(item.deletedAt)}</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => { setSelectedItem(item); setIsRestoreModalOpen(true); }}
                        className="bg-[#EFF6FF] text-[#1E88E5] border border-[#1E88E5] px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                      >
                        <RotateCcw size={12}/> পুনরুদ্ধার
                      </button>
                      <button 
                        onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }}
                        className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                      >
                        <Trash2 size={12}/> মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* ================= মডাল: পুনরুদ্ধার কনফার্মেশন ================= */}
      {isRestoreModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                <RotateCcw size={28} />
              </div>
              <h2 className="font-bold text-lg text-gray-800">পুনরুদ্ধার করবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি <strong>{selectedItem.name}</strong> ডাটাটি পুনরুদ্ধার করতে চান?</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsRestoreModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleRestore} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md text-sm">হ্যাঁ, করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: স্থায়ীভাবে মুছে ফেলার কনফার্মেশন ================= */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 animate-pulse">
                <AlertTriangle size={28} />
              </div>
              <h2 className="font-bold text-lg text-red-600">স্থায়ীভাবে মুছবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি নিশ্চিত? <strong>{selectedItem.name}</strong> ডাটাটি চিরতরে মুছে যাবে এবং আর কখনো ফিরিয়ে আনা যাবে না।</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold shadow-md text-sm">স্থায়ীভাবে মুছুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: সব মুছে ফেলার কনফার্মেশন ================= */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 animate-pulse">
                <Trash2 size={28} />
              </div>
              <h2 className="font-bold text-lg text-red-600">সব মুছে ফেলবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি রিসাইকেল বিনের সব ডাটা (মোট {toBangla(items.length)} টি) স্থায়ীভাবে মুছে ফেলতে চান?</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsClearAllModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleClearAll} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold shadow-md text-sm">হ্যাঁ, সব মুছুন</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}