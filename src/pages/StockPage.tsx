import { useState, useMemo } from 'react';
import { 
  ArrowLeft, Search, Filter, Clock, MoreVertical, 
  Plus, Edit3, X, ScanBarcode, Tag, Building2, Package
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

// ডেমু ডাটা
const allCategories = ['মাছের খাদ্য', 'ঔষধ ও ভিটামিন', 'যন্ত্রপাতি', 'প্যাকেজিং'];
const allCompanies = ['নিউজা', 'প্যারাগন', 'স্কয়ার', 'নিপ্রো'];

const initialStock = [
  { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', stock: 50, purchasePrice: 1900, value: 95000 },
  { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', stock: 100, purchasePrice: 280, value: 28000 },
  { id: 3, name: 'অক্সিজেন পাম্প', category: 'যন্ত্রপাতি', company: 'নিপ্রো', stock: 5, purchasePrice: 4000, value: 20000 },
  { id: 4, name: 'ফ্লোটিং ফিড', category: 'মাছের খাদ্য', company: 'প্যারাগন', stock: 80, purchasePrice: 1600, value: 128000 },
  { id: 5, name: 'প্লাস্টিকের ড্রাম', category: 'প্যাকেজিং', company: 'নিউজা', stock: 20, purchasePrice: 500, value: 10000 },
];

export default function StockPage({ onBack, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব ক্যাটাগরি');
  const [selectedCompany, setSelectedCompany] = useState('সব কোম্পানি');
  
  // মডাল স্টেট
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQty, setNewQty] = useState('');

  // ফিল্টার লজিক
  const filteredData = useMemo(() => {
    return initialStock.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'সব ক্যাটাগরি' || item.category === selectedCategory;
      const matchCompany = selectedCompany === 'সব কোম্পানি' || item.company === selectedCompany;
      return matchSearch && matchCategory && matchCompany;
    });
  }, [searchQuery, selectedCategory, selectedCompany]);

  const totalStock = filteredData.reduce((acc, curr) => acc + curr.stock, 0);
  const totalValue = filteredData.reduce((acc, curr) => acc + curr.value, 0);

  const handleOpenUpdate = (prod: any) => {
    setSelectedProduct(prod);
    setNewQty(prod.stock.toString());
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStock = () => {
    if (!newQty || parseInt(newQty) < 0) return alert('সঠিক স্টক পরিমাণ দিন');
    // ডেমু হিসেবে শুধু মেসেজ দেখাবে
    alert(`${selectedProduct.name} এর স্টক ${toBangla(newQty)} এ আপডেট করা হয়েছে!`);
    setIsUpdateModalOpen(false);
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">স্টকের হিসাব</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => alert('স্টকের ইতিহাস পেইজ')} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/30 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition">
              <Clock size={14} /> স্টকের ইতিহাস
            </button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><MoreVertical size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        
        {/* সামারি কার্ড */}
        <div className="bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white p-3 rounded-xl shadow-md flex justify-between items-center shrink-0">
          <div className="flex-1 text-center border-r border-white/20">
            <p className="text-xs font-bold text-blue-100">মোট মজুদ</p>
            <p className="text-xl font-black mt-1">{toBangla(totalStock)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-blue-100">মজুদ মূল্য</p>
            <p className="text-xl font-black mt-1">{toBangla(totalValue)} ৳</p>
          </div>
        </div>

        {/* সার্চ বার */}
        <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] shrink-0">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
          <div className="h-4 w-[1px] bg-gray-300"></div>
          <button className="text-gray-500 font-bold text-xs flex items-center gap-1"><Filter size={14} /> ফিল্টার</button>
        </div>

        {/* ক্যাটাগরি ফিল্টার */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 shrink-0">
          <button 
            onClick={() => setSelectedCategory('সব ক্যাটাগরি')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCategory === 'সব ক্যাটাগরি' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <Tag size={12}/> সব ক্যাটাগরি
          </button>
          {allCategories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCategory === cat ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* কোম্পানি ফিল্টার */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 shrink-0">
          <button 
            onClick={() => setSelectedCompany('সব কোম্পানি')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCompany === 'সব কোম্পানি' ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <Building2 size={12}/> সব কোম্পানি
          </button>
          {allCompanies.map(comp => (
            <button 
              key={comp}
              onClick={() => setSelectedCompany(comp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCompany === comp ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              {comp}
            </button>
          ))}
        </div>

        {/* স্টক লিস্ট */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredData.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white/50">
              <Package size={32} className="text-gray-300 mb-2"/>
              <p className="text-sm text-gray-500 font-bold">কোনো স্টক পাওয়া যায়নি</p>
            </div>
          ) : (
            filteredData.map(item => (
              <div key={item.id} className="bg-[#F3F4F6] p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleOpenUpdate(item)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                    <Package size={24} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[9px] font-bold text-[#0B5C47] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#A5D6A7]">{item.category}</span>
                      <span className="text-[9px] font-bold text-[#1E88E5] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#B5D2F3]">{item.company}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">স্টক সংখ্যা: {toBangla(item.stock)}</p>
                  </div>
                </div>
                <div className="font-black text-sm text-gray-800 shrink-0">{toBangla(item.value)} ৳</div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* বটম বার */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50 flex gap-2">
        <button onClick={() => { if(filteredData.length > 0) handleOpenUpdate(filteredData[0]) }} className="flex-1 bg-white border border-[#1E88E5] text-[#1E88E5] py-2.5 rounded-xl font-bold shadow-sm active:scale-95 transition flex justify-center items-center gap-1">
          <Edit3 size={16}/> পণ্য সংখ্যা আপডেট
        </button>
        <button onClick={() => onNavigate('product_list')} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1">
          <Plus size={16}/> প্রোডাক্ট যুক্ত করুন
        </button>
      </div>

      {/* আপডেট স্টক মডাল */}
      {isUpdateModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-base">স্টক আপডেট করুন</h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-gray-800">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">বর্তমান স্টক: {toBangla(selectedProduct.stock)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নতুন স্টকের পরিমাণ</label>
                <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-lg font-bold outline-none focus:border-[#0B5C47]" />
              </div>
              <button onClick={() => alert('বারকোড স্ক্যানার ওপেন হলো')} className="w-full border border-gray-300 text-gray-700 bg-gray-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                <ScanBarcode size={18}/> বারকোড স্ক্যান করুন
              </button>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={handleUpdateStock} className="w-full bg-[#1E88E5] text-white py-2.5 rounded-lg font-bold">আপডেট করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}