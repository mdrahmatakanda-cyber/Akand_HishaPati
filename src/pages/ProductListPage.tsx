import { useState, useMemo } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Search, ScanBarcode, 
  Plus, X, Trash2, Edit2, Tag, Building2, 
  Layers, Package
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

// ইন্টারফেস
interface Category { id: number; name: string; }
interface Company { id: number; name: string; }
interface Product {
  id: number;
  name: string;
  categoryId: number;
  companyId: number;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  description: string;
}

export default function ProductListPage({ onBack }: Props) {
  // ১. ডেমু ডাটা
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'মাছের খাদ্য' },
    { id: 2, name: 'ঔষধ ও ভিটামিন' },
    { id: 3, name: 'যন্ত্রপাতি' }
  ]);

  const [companies, setCompanies] = useState<Company[]>([
    { id: 1, name: 'নিউজা' },
    { id: 2, name: 'প্যারাগন' },
    { id: 3, name: 'স্কয়ার' },
    { id: 4, name: 'নিপ্রো' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'গ্রোয়ার ফিড', categoryId: 1, companyId: 1, salePrice: 2050, purchasePrice: 1900, stock: 50, description: 'উন্নত মানের ফিড' },
    { id: 2, name: 'ক্যালসিয়াম পাউডার', categoryId: 2, companyId: 3, salePrice: 350, purchasePrice: 280, stock: 100, description: 'হাড় গঠনে সহায়ক' },
    { id: 3, name: 'অক্সিজেন পাম্প', categoryId: 3, companyId: 4, salePrice: 4500, purchasePrice: 4000, stock: 5, description: '১২০০ লিটার/ঘন্টা' },
    { id: 4, name: 'ফ্লোটিং ফিড', categoryId: 1, companyId: 2, salePrice: 1800, purchasePrice: 1600, stock: 80, description: 'প্যারাগন কোম্পানির ফিড' },
  ]);

  // ২. স্টেট ম্যানেজমেন্ট
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | 'all'>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<number | 'all'>('all');
  
  // মডাল স্টেট
  const [modalType, setModalType] = useState<'none' | 'add_product' | 'master_data'>('none');
  const [masterTab, setMasterTab] = useState<'category' | 'company'>('category');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // নতুন ক্যাটাগরি/কোম্পানি ইনপুট স্টেট
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');

  // প্রোডাক্ট ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: '', categoryId: '', companyId: '', salePrice: '', purchasePrice: '', stock: '', description: ''
  });

  // ৩. ফিল্টার লজিক
  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'all' || prod.categoryId === selectedCategoryFilter;
      const matchCompany = selectedCompanyFilter === 'all' || prod.companyId === selectedCompanyFilter;
      return matchSearch && matchCategory && matchCompany;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedCompanyFilter]);

  // ৪. ক্যাটাগরি ও কোম্পানি ম্যানেজমেন্ট
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return alert('ক্যাটাগরির নাম লিখুন');
    if (categories.some(c => c.name === newCategoryName.trim())) return alert('এই ক্যাটাগরি আগে থেকেই আছে');
    setCategories([...categories, { id: Date.now(), name: newCategoryName.trim() }]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (id: number) => {
    const isUsed = products.some(p => p.categoryId === id);
    if (isUsed) return alert('এই ক্যাটাগরির অধীনে পণ্য আছে। আগে পণ্যগুলো মুছুন বা ক্যাটাগরি পরিবর্তন করুন।');
    if (window.confirm('আপনি কি এই ক্যাটাগরি মুছে ফেলতে চান?')) {
      setCategories(categories.filter(c => c.id !== id));
      if (selectedCategoryFilter === id) setSelectedCategoryFilter('all');
    }
  };

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) return alert('কোম্পানির নাম লিখুন');
    if (companies.some(c => c.name === newCompanyName.trim())) return alert('এই কোম্পানি আগে থেকেই আছে');
    setCompanies([...companies, { id: Date.now(), name: newCompanyName.trim() }]);
    setNewCompanyName('');
  };

  const handleDeleteCompany = (id: number) => {
    const isUsed = products.some(p => p.companyId === id);
    if (isUsed) return alert('এই কোম্পানির অধীনে পণ্য আছে। আগে পণ্যগুলো মুছুন বা কোম্পানি পরিবর্তন করুন।');
    if (window.confirm('আপনি কি এই কোম্পানি মুছে ফেলতে চান?')) {
      setCompanies(companies.filter(c => c.id !== id));
      if (selectedCompanyFilter === id) setSelectedCompanyFilter('all');
    }
  };

  // ৫. প্রোডাক্ট ম্যানেজমেন্ট
  const handleOpenAddProduct = () => {
    setSelectedProduct(null);
    setFormData({ name: '', categoryId: categories[0]?.id.toString() || '', companyId: companies[0]?.id.toString() || '', salePrice: '', purchasePrice: '', stock: '', description: '' });
    setModalType('add_product');
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      categoryId: prod.categoryId.toString(),
      companyId: prod.companyId.toString(),
      salePrice: prod.salePrice.toString(),
      purchasePrice: prod.purchasePrice.toString(),
      stock: prod.stock.toString(),
      description: prod.description
    });
    setModalType('add_product');
  };

  const handleSaveProduct = () => {
    if (!formData.name || !formData.categoryId || !formData.companyId || !formData.salePrice) {
      return alert('পণ্যের নাম, ক্যাটাগরি, কোম্পানি এবং বিক্রয় মূল্য আবশ্যক');
    }
    
    const productData = {
      name: formData.name,
      categoryId: Number(formData.categoryId),
      companyId: Number(formData.companyId),
      salePrice: Number(formData.salePrice),
      purchasePrice: Number(formData.purchasePrice) || 0,
      stock: Number(formData.stock) || 0,
      description: formData.description
    };

    if (selectedProduct) {
      setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...productData } : p));
    } else {
      setProducts([{ id: Date.now(), ...productData }, ...products]);
    }
    setModalType('none');
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('আপনি কি সত্যিই এই পণ্যটি মুছে ফেলতে চান?')) {
      setProducts(products.filter(p => p.id !== id));
      setSelectedProduct(null);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
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
        
        {/* সার্চ ও অ্যাড বাটন */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>
            <button className="bg-white border border-gray-300 rounded-xl px-2.5 shadow-sm text-[#1E88E5]"><ScanBarcode size={22}/></button>
          </div>
          
          {/* ক্যাটাগরি ও কোম্পানি ফিল্টার ট্যাব */}
          <div className="flex flex-col gap-1.5">
            {/* ক্যাটাগরি */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              <button 
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCategoryFilter === 'all' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                <Tag size={12}/> সব ক্যাটাগরি
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCategoryFilter === cat.id ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* কোম্পানি */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              <button 
                onClick={() => setSelectedCompanyFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border flex items-center gap-1 ${selectedCompanyFilter === 'all' ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}
              >
                <Building2 size={12}/> সব কোম্পানি
              </button>
              {companies.map(comp => (
                <button 
                  key={comp.id}
                  onClick={() => setSelectedCompanyFilter(comp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${selectedCompanyFilter === comp.id ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  {comp.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* টোটাল ও ক্যাটাগরি ম্যানেজ বাটন */}
        <div className="flex justify-between items-center shrink-0 mt-1">
          <div className="font-bold text-sm text-gray-700">মোট পণ্য: {toBangla(filteredProducts.length)}</div>
          <button onClick={() => setModalType('master_data')} className="flex items-center gap-1 text-xs font-bold text-[#0B5C47] bg-[#E8F5E9] px-2 py-1 rounded-lg border border-[#A5D6A7] active:scale-95 transition">
            <Layers size={14}/> ক্যাটাগরি ও কোম্পানি
          </button>
        </div>

        {/* প্রোডাক্ট লিস্ট */}
        <div className="flex flex-col gap-2">
          {filteredProducts.length === 0 ? (
             <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-2 bg-white/50">
               <Package size={32} className="text-gray-300 mb-2"/>
               <p className="text-sm text-gray-500 font-bold">কোনো পণ্য পাওয়া যায়নি</p>
             </div>
          ) : (
            filteredProducts.map(prod => {
              const catName = categories.find(c => c.id === prod.categoryId)?.name || 'অনির্ধারিত';
              const compName = companies.find(c => c.id === prod.companyId)?.name || 'অনির্ধারিত';
              return (
                <div key={prod.id} onClick={() => setSelectedProduct(prod)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                      <Package size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-gray-800 truncate">{prod.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[9px] font-bold text-[#0B5C47] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#A5D6A7]">{catName}</span>
                        <span className="text-[9px] font-bold text-[#1E88E5] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#B5D2F3]">{compName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-gray-800">৳ {toBangla(prod.salePrice)}</p>
                    <p className="text-[10px] font-bold text-gray-500 mt-0.5">স্টক: {toBangla(prod.stock)}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* বটম বাটন */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={handleOpenAddProduct} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন প্রোডাক্ট যুক্ত করুন
        </button>
      </div>

      {/* ================= মডাল ১: ক্যাটাগরি ও কোম্পানি ম্যানেজমেন্ট ================= */}
      {modalType === 'master_data' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><Layers size={18}/> মাস্টার ডাটা</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            {/* ট্যাব */}
            <div className="flex border-b border-gray-200 shrink-0">
              <button onClick={() => setMasterTab('category')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${masterTab === 'category' ? 'border-[#0B5C47] text-[#0B5C47]' : 'border-transparent text-gray-500'}`}>ক্যাটাগরি</button>
              <button onClick={() => setMasterTab('company')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${masterTab === 'company' ? 'border-[#1E88E5] text-[#1E88E5]' : 'border-transparent text-gray-500'}`}>কোম্পানি</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* ক্যাটাগরি ট্যাব কন্টেন্ট */}
              {masterTab === 'category' && (
                <>
                  <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="নতুন ক্যাটাগরির নাম..." className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    <button onClick={handleAddCategory} className="bg-[#0B5C47] text-white px-4 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition"><Plus size={16}/> যোগ</button>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {categories.map((cat, idx) => (
                      <div key={cat.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <span className="font-bold text-sm text-gray-800">{toBangla(idx+1)}. {cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* কোম্পানি ট্যাব কন্টেন্ট */}
              {masterTab === 'company' && (
                <>
                  <div className="flex gap-2">
                    <input type="text" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="নতুন কোম্পানির নাম..." className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#1E88E5]" />
                    <button onClick={handleAddCompany} className="bg-[#1E88E5] text-white px-4 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition"><Plus size={16}/> যোগ</button>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    {companies.map((comp, idx) => (
                      <div key={comp.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <span className="font-bold text-sm text-gray-800">{toBangla(idx+1)}. {comp.name}</span>
                        <button onClick={() => handleDeleteCompany(comp.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল ২: প্রোডাক্ট অ্যাড/এডিট ================= */}
      {modalType === 'add_product' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base">{selectedProduct ? 'প্রোডাক্ট এডিট' : 'প্রোডাক্ট যুক্ত করুন'}</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="পণ্যের নাম" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ক্যাটাগরি <span className="text-red-500">*</span></label>
                  <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option value="">সিলেক্ট করুন</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">কোম্পানি <span className="text-red-500">*</span></label>
                  <select value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option value="">সিলেক্ট করুন</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">বিক্রয় মূল্য <span className="text-red-500">*</span></label>
                  <input type="number" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">ক্রয় মূল্য</label>
                  <input type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বর্তমান স্টক</label>
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="স্টক পরিমাণ" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বিস্তারিত (ঐচ্ছিক)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="পণ্যের বিস্তারিত..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47] min-h-[60px]" />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
              <button onClick={() => setModalType('none')} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveProduct} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল ৩: প্রোডাক্ট ডিটেইলস ================= */}
      {selectedProduct && modalType === 'none' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[80dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base">পণ্যের বিস্তারিত</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm border flex items-center justify-center shrink-0">
                  <Package size={32} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-sm font-bold text-gray-700 mt-1">৳ {toBangla(selectedProduct.salePrice)}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="p-1.5 border border-red-200 text-red-500 bg-red-50 rounded shadow-sm"><Trash2 size={16}/></button>
                    <button onClick={() => handleOpenEditProduct(selectedProduct)} className="flex-1 border border-[#1E88E5] text-[#1E88E5] bg-white rounded shadow-sm flex items-center justify-center gap-1 text-xs font-bold py-1"><Edit2 size={14}/> এডিট করুন</button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300"/>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-[#1E88E5] text-sm">{toBangla(selectedProduct.stock)}</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">স্টক সংখ্যা</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-[#1E88E5] text-sm">{toBangla(selectedProduct.purchasePrice)} ৳</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">ক্রয়মূল্য</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-green-600 text-sm">{toBangla(selectedProduct.salePrice - selectedProduct.purchasePrice)} ৳</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">লাভ</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-[#0B5C47] text-[11px] truncate w-full px-1">{categories.find(c=>c.id===selectedProduct.categoryId)?.name || 'নেই'}</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">ক্যাটাগরি</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm col-span-2">
                  <span className="font-black text-[#1E88E5] text-[11px] truncate w-full px-1">{companies.find(c=>c.id===selectedProduct.companyId)?.name || 'নেই'}</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">কোম্পানি</span>
                </div>
              </div>

              <div className="bg-transparent border border-gray-300 rounded-lg p-2 mt-1 relative">
                <span className="absolute -top-2 left-2 bg-[#EFF6F3] px-1 text-[10px] text-gray-500">পণ্য সম্পর্কে বিস্তারিত</span>
                <p className="text-sm text-gray-700">{selectedProduct.description || '[দেওয়া হয়নি]'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}