import { useState } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Search, ScanBarcode, 
  MoreVertical, Plus, X, Trash2, Edit2, ChevronDown, 
  Clock 
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

const initialProducts = [
  { id: 1, name: 'টেস্ট প্রোডাক্ট', salePrice: 100, purchasePrice: 70, stock: 19, category: 'ইউনিট', description: 'দেওয়া হয়নি' },
  { id: 2, name: 'তুলা', salePrice: 300, purchasePrice: 280, stock: 200, category: 'ইউনিট', description: 'দেওয়া হয়নি' },
];

export default function ProductListPage({ onBack }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  
  // মডাল স্টেট
  const [modalType, setModalType] = useState<'none' | 'add' | 'details'>('none');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: '', salePrice: '', purchasePrice: '', stock: '', 
    category: 'ইউনিট', description: '', 
    onlineSale: false, wholesale: false, stockAlert: false, 
    tax: false, warranty: false, discount: false
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', salePrice: '', purchasePrice: '', stock: '', category: 'ইউনিট', description: '', onlineSale: false, wholesale: false, stockAlert: false, tax: false, warranty: false, discount: false });
    setModalType('add');
  };

  const handleOpenDetails = (prod: any) => {
    setSelectedProduct(prod);
    setModalType('details');
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.salePrice) return alert('পণ্যের নাম এবং বিক্রয় মূল্য দিন');
    
    if (selectedProduct) {
      // Edit mode
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...formData, salePrice: Number(formData.salePrice), purchasePrice: Number(formData.purchasePrice), stock: Number(formData.stock) } : p));
    } else {
      // Add mode
      const newProd = {
        id: Date.now(),
        ...formData,
        salePrice: Number(formData.salePrice),
        purchasePrice: Number(formData.purchasePrice) || 0,
        stock: Number(formData.stock) || 0,
      };
      setProducts([newProd, ...products]);
    }
    setModalType('none');
  };

  const handleDelete = (id: number) => {
    if(window.confirm('আপনি কি সত্যিই এই পণ্যটি মুছে ফেলতে চান?')) {
      setProducts(products.filter(p => p.id !== id));
      setModalType('none');
    }
  };

  const filteredProducts = products.filter(p => p.name.includes(searchQuery));

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">প্রোডাক্ট লিস্ট</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        <div className="flex gap-2">
          <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
            <Search size={18} className="text-gray-400" />
            <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <button className="text-gray-500 font-bold text-xs flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> ফিল্টার</button>
          </div>
          <button className="bg-white border border-gray-300 rounded-xl px-2.5 shadow-sm text-[#1E88E5]"><ScanBarcode size={22}/></button>
        </div>

        <div className="font-bold text-sm text-gray-700">মোট পণ্য আছে: {toBangla(filteredProducts.length)}</div>

        <div className="flex flex-col gap-2">
          {filteredProducts.map(prod => (
            <div key={prod.id} onClick={() => handleOpenDetails(prod)} className="bg-[#F3F4F6] p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{prod.name}</h3>
                  <p className="text-xs font-bold text-red-500 mt-0.5">{toBangla(prod.salePrice)} ৳</p>
                </div>
              </div>
              <MoreVertical size={20} className="text-gray-500" />
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={handleOpenAdd} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> প্রোডাক্ট যুক্ত করুন
        </button>
      </div>

      {/* ================= Add/Edit Product Modal ================= */}
      {modalType === 'add' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">{selectedProduct ? 'প্রোডাক্ট এডিট' : 'প্রোডাক্ট যুক্ত করুন'}</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="পণ্যের নাম লিখুন" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বিক্রয় মূল্য <span className="text-red-500">*</span></label>
                <input type="number" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} placeholder="বিক্রয় মূল্য লিখুন" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বর্তমান মজুদ আছে</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="স্টকের পরিমাণ লিখুন" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                <p className="text-[10px] text-[#1E88E5] bg-blue-50 border border-dashed border-[#1E88E5] rounded-lg p-2 mt-1">পূর্বের প্রোডাক্টের ক্ষেত্রে স্টকের পরিমাণ দিন। নতুন স্টক থাকলে জিরো পরিমাণ দিয়ে পরবর্তীতে স্টক আপডেট করুন।</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ক্রয়মূল্য</label>
                <input type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} placeholder="ক্রয় মূল্য লিখুন" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                <p className="text-[10px] text-[#1E88E5] bg-blue-50 border border-dashed border-[#1E88E5] rounded-lg p-2 mt-1">পণ্যের ক্রয়মূল্য না দিলে ব্যবসার লাভ ক্ষতির হিসাব সঠিক ভাবে দেখা যাবে না</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                <div className="flex justify-between items-center mb-2 pb-2 border-b">
                  <span className="text-xs font-bold text-[#1E88E5]">পণ্যের অ্যাডভান্স তথ্য</span>
                  <ChevronDown size={16} className="text-[#1E88E5]"/>
                </div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ক্যাটাগরি</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"><option>--ক্যাটাগরি--</option></select>
                </div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-gray-600 mb-1 block">সাব ক্যাটাগরি</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"><option>--সাব ক্যাটাগরি--</option></select>
                </div>
                <div className="mb-2">
                  <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের একক</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none"><option>ইউনিট</option><option>কেজি</option><option>পিস</option></select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের বিস্তারিত</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="পণ্যের বিস্তারিত (না দিলেও হবে)" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47] min-h-[60px]" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                {[
                  { key: 'onlineSale', label: 'অনলাইনে বিক্রি করতে চান?' },
                  { key: 'wholesale', label: 'পাইকারি বিক্রি করতে চান?' },
                  { key: 'stockAlert', label: 'স্টক কমের এলার্ট?' },
                  { key: 'tax', label: 'ভ্যাট প্রযোজ্য?' },
                  { key: 'warranty', label: 'ওয়ারেন্টি' },
                  { key: 'discount', label: 'ডিস্কাউন্ট' },
                ].map((item) => (
                  <div key={item.key} className="bg-[#F3F4F6] p-2.5 rounded-lg flex justify-between items-center border border-gray-200">
                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                    <button onClick={() => setFormData({...formData, [item.key]: !formData[item.key as keyof typeof formData]})} className={`w-9 h-5 rounded-full relative transition-colors ${formData[item.key as keyof typeof formData] ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${formData[item.key as keyof typeof formData] ? 'left-4.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-[#F3F4F6] p-3 rounded-xl border border-gray-200">
                <label className="text-sm font-bold text-gray-800 mb-2 block">পণ্যের ছবি (সর্বোচ্চ ৫ টি)</label>
                <button className="w-14 h-14 border border-[#1E88E5] bg-white rounded-lg flex items-center justify-center text-[#1E88E5] shadow-sm"><Plus size={24}/></button>
              </div>

              <button className="w-full bg-[#1E88E5] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 mt-1 shadow-sm">
                <ScanBarcode size={18}/> বারকোড স্ক্যান
              </button>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0">
              <button onClick={handleSaveProduct} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Product Details Modal ================= */}
      {modalType === 'details' && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg">পণ্যের বিস্তারিত</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {/* Top Info */}
              <div className="flex gap-3 items-start">
                <div className="w-20 h-20 bg-white rounded-xl shadow-sm border flex items-center justify-center shrink-0">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-sm font-bold text-gray-700 mt-1">{toBangla(selectedProduct.salePrice)} ৳</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDelete(selectedProduct.id)} className="p-1.5 border border-red-200 text-red-500 bg-red-50 rounded shadow-sm"><Trash2 size={16}/></button>
                    <button onClick={() => { setFormData(selectedProduct); setModalType('add'); }} className="flex-1 border border-[#1E88E5] text-[#1E88E5] bg-white rounded shadow-sm flex items-center justify-center gap-1 text-xs font-bold py-1"><Edit2 size={14}/> এডিট করুন</button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300"/>

              {/* Stats Grid 1 */}
              <div className="grid grid-cols-3 gap-2">
                <StatBox title="স্টক সংখ্যা" value={toBangla(selectedProduct.stock)} />
                <StatBox title="ক্রয়মূল্য" value={`${toBangla(selectedProduct.purchasePrice)} ৳`} />
                <StatBox title="লাভ" value={`${toBangla(selectedProduct.salePrice - selectedProduct.purchasePrice)} ৳`} />
                <StatBox title="মজুদ মূল্য" value={`${toBangla(selectedProduct.purchasePrice * selectedProduct.stock)} ৳`} />
                <StatBox title="ডিস্কাউন্ট" value="[দেওয়া হয়নি]" />
                <StatBox title="সাব ক্যাটাগরি" value="[দেওয়া হয়নি]" />
              </div>

              <div className="text-sm font-bold text-[#1E88E5] mt-1">পণ্যের আরও কিছু তথ্য</div>

              {/* Stats Grid 2 */}
              <div className="grid grid-cols-3 gap-2">
                <StatBox title="ভ্যাট%" value="০" />
                <StatBox title="ওয়ারেন্টি" value="[দেওয়া হয়নি]" />
                <StatBox title="স্টক কমের এলার্ট" value="[দেওয়া হয়নি]" />
              </div>

              <div className="bg-transparent border border-gray-300 rounded-lg p-2 mt-1 relative">
                <span className="absolute -top-2 left-2 bg-[#EFF6F3] px-1 text-[10px] text-gray-500">পণ্য সম্পর্কে বিস্তারিত</span>
                <p className="text-sm text-gray-700">{selectedProduct.description || '[দেওয়া হয়নি]'}</p>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex flex-col gap-2">
              <button className="w-full bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-2"><Plus size={18}/> পণ্য সংখ্যা আপডেট করুন</button>
              <button className="w-full border border-[#1E88E5] text-[#1E88E5] bg-white py-2.5 rounded-xl font-bold active:scale-95 transition flex justify-center items-center gap-2"><Clock size={18}/> স্টকের ইতিহাস</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ title, value }: { title: string, value: string }) {
  return (
    <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
      <span className="font-black text-[#1E88E5] text-sm">{value}</span>
      <span className="text-[10px] text-gray-600 font-bold mt-0.5">{title}</span>
    </div>
  );
}