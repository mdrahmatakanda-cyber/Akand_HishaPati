import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Search, AlertTriangle, 
  Trash2, Package, Clock, CheckCircle2 
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

interface ExpiredItem {
  id: number;
  productName: string;
  batchNo: string;
  quantity: number;
  expiryDate: string;
}

const initialExpired: ExpiredItem[] = [
  { id: 1, productName: 'ক্যালসিয়াম পাউডার', batchNo: 'B-1023', quantity: 5, expiryDate: '2026-10-15' },
  { id: 2, productName: 'ফিশ ফিড (২৫ কেজি)', batchNo: 'FF-809', quantity: 12, expiryDate: '2026-09-01' },
  { id: 3, productName: 'ভিটামিন সিরাপ', batchNo: 'V-44', quantity: 24, expiryDate: '2026-11-20' },
];

export default function ExpiredPage({ onBack }: Props) {
  const [items, setItems] = useState<ExpiredItem[]>(initialExpired);
  const [searchQuery, setSearchQuery] = useState('');
  
  // মডাল স্টেট
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExpiredItem | null>(null);

  const filteredItems = items.filter(item => 
    item.productName.includes(searchQuery) || item.batchNo.includes(searchQuery)
  );

  const handleDispose = () => {
    setItems(items.filter(i => i.id !== selectedItem?.id));
    setIsDisposeModalOpen(false);
    alert('পণ্যটি সফলভাবে ডিসপোজ করা হয়েছে!');
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">মেয়াদ উত্তীর্ণ পণ্য</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-8">
        
        {/* অ্যালার্ট কার্ড */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 shadow-sm flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-red-700 text-sm">সতর্কতা!</h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">আপনার {toBangla(totalItems)} টি পণ্যের মেয়াদ শেষ হয়ে গেছে।</p>
          </div>
        </div>

        {/* সার্চ */}
        <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm shrink-0">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="পণ্য বা ব্যাচ নম্বর খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
        </div>

        {/* লিস্ট */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredItems.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center mt-6 bg-white/50">
              <CheckCircle2 size={40} className="text-green-400 mb-3" />
              <h3 className="font-bold text-gray-700 text-base">কোনো মেয়াদ উত্তীর্ণ পণ্য নেই</h3>
              <p className="text-xs text-gray-500 mt-1">আপনার সব পণ্য নিরাপদ ও ফ্রেশ আছে।</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{item.productName}</h3>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">ব্যাচ: {item.batchNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-gray-800">{toBangla(item.quantity)} পিস</p>
                    <p className="text-[10px] font-bold text-red-500 flex items-center justify-end gap-1 mt-0.5"><Clock size={10}/> {toBangla(item.expiryDate)}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-100">
                  <button 
                    onClick={() => { setSelectedItem(item); setIsDisposeModalOpen(true); }}
                    className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                  >
                    <Trash2 size={12}/> ডিসপোজ করুন
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ================= মডাল: ডিসপোজ কনফার্মেশন ================= */}
      {isDisposeModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 animate-pulse">
                <Trash2 size={28} />
              </div>
              <h2 className="font-bold text-lg text-red-600">ডিসপোজ করবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি <strong>{selectedItem.productName}</strong> (ব্যাচ: {selectedItem.batchNo}) স্টক থেকে চিরতরে মুছে ফেলতে চান?</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsDisposeModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleDispose} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold shadow-md text-sm">হ্যাঁ, ডিসপোজ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}