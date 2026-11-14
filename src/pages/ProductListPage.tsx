import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Search, ScanBarcode, 
  Plus, X, Trash2, Edit2, Tag, Building2, 
  Layers, Package, Loader2, Image as ImageIcon, ChevronRight
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { demoProducts, demoCategories, demoCompanies } from '../lib/demoData';

interface Props {
  onBack: () => void;
}

interface Category { id: string; name: string; }
interface Company { id: string; name: string; }

interface Product {
  id: string;
  name: string;
  category_id: string;
  company_id: string;
  sale_price: number;
  purchase_price: number;
  wholesale_price?: number;
  dealer_price?: number;
  stock_quantity: number;
  unit?: string;
  description: string;
  image_url: string;
  is_online?: boolean;
  is_wholesale?: boolean;
  low_stock_alert?: number;
  is_vat?: boolean;
  warranty?: string;
  discount?: number;
}

// ছবির মতো ইউনিট লিস্ট
const UNITS = [
  'কেজি', 'পিস', 'লিটার', 'টি', 'ডজন', 'বস্তা', 'সেট', 'গজ',
  'প্যাকেট', 'কার্টন', 'স্কোয়ার মিটার', 'স্কোয়ার ফিট', 'ফুট',
  'ইঞ্চি', 'মিটার', 'অন্যান্য'
];

export default function ProductListPage({ onBack }: Props) {
  const { activeBusiness } = useAuth();
  const { isDemoMode } = useAppContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | 'all'>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string | 'all'>('all');
  
  const [modalType, setModalType] = useState<'none' | 'add_product' | 'master_data'>('none');
  const [masterTab, setMasterTab] = useState<'category' | 'company'>('category');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');

  // নতুন ইউনিট সিলেক্ট মডাল স্টেট
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '', category_id: '', company_id: '', 
    unit: 'বস্তা',
    sale_price: '', purchase_price: '', 
    wholesale_price: '', dealer_price: '',
    stock_quantity: '', description: '', 
    image_url: '',
    is_online: false, is_wholesale: false, 
    low_stock_alert: '10', is_vat: false, 
    warranty: '', discount: ''
  });
  
  const [productImage, setProductImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const mappedCats = demoCategories.map(c => ({ id: c.name, name: c.name }));
        const mappedComps = demoCompanies.map(c => ({ id: c.name, name: c.name }));
        const mappedProds = demoProducts.map(p => ({
          id: p.id.toString(),
          name: p.name,
          category_id: p.category,
          company_id: p.company,
          sale_price: p.salePrice,
          purchase_price: p.purchasePrice,
          stock_quantity: p.stock,
          unit: 'বস্তা',
          description: '',
          image_url: p.image_url || ''
        }));
        setCategories(mappedCats);
        setCompanies(mappedComps);
        setProducts(mappedProds);
      } else {
        if (!activeBusiness?.id) return; 
        const bizId = activeBusiness.id;

        const [catRes, compRes, prodRes] = await Promise.all([
          supabase.from('categories').select('*').eq('business_id', bizId).order('created_at', { ascending: false }),
          supabase.from('companies').select('*').eq('business_id', bizId).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('business_id', bizId).order('created_at', { ascending: false })
        ]);

        if (catRes.error) throw catRes.error;
        if (compRes.error) throw compRes.error;
        if (prodRes.error) throw prodRes.error;

        setCategories(catRes.data || []);
        setCompanies(compRes.data || []);
        setProducts(prodRes.data || []);
      }
    } catch (error: any) {
      console.error("Data load error:", error.message);
      alert('ডাটা লোড করতে সমস্যা হয়েছে। ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBusiness?.id, isDemoMode]);

  const filteredProducts = useMemo(() => {
    return products.filter(prod => {
      const matchSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategoryFilter === 'all' || prod.category_id === selectedCategoryFilter;
      const matchCompany = selectedCompanyFilter === 'all' || prod.company_id === selectedCompanyFilter;
      return matchSearch && matchCategory && matchCompany;
    });
  }, [products, searchQuery, selectedCategoryFilter, selectedCompanyFilter]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return alert('ক্যাটাগরির নাম লিখুন');
    if (categories.some(c => c.name === newCategoryName.trim())) return alert('এই ক্যাটাগরি আগে থেকেই আছে');
    
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setCategories([...categories, { id: newCategoryName.trim(), name: newCategoryName.trim() }]);
      } else {
        if (!activeBusiness?.id) return alert('ব্যবসা লোড হয়নি');
        const { error } = await supabase.from('categories').insert([{ 
          name: newCategoryName.trim(),
          business_id: activeBusiness.id
        }]);
        if (error) throw error;
        fetchData();
      }
      setNewCategoryName('');
    } catch (error: any) {
      alert('ক্যাটাগরি সেভ করতে সমস্যা: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const isUsed = products.some(p => p.category_id === id);
    if (isUsed) return alert('এই ক্যাটাগরির অধীনে পণ্য আছে। আগে পণ্যগুলো মুছুন বা ক্যাটাগরি পরিবর্তন করুন।');
    
    if (window.confirm('আপনি কি এই ক্যাটাগরি মুছে ফেলতে চান?')) {
      setIsSaving(true);
      try {
        if (isDemoMode) {
          setCategories(categories.filter(c => c.id !== id));
        } else {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
          fetchData();
        }
        if (selectedCategoryFilter === id) setSelectedCategoryFilter('all');
      } catch (error: any) {
        alert('ডিলিট করতে সমস্যা: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return alert('কোম্পানির নাম লিখুন');
    if (companies.some(c => c.name === newCompanyName.trim())) return alert('এই কোম্পানি আগে থেকেই আছে');
    
    setIsSaving(true);
    try {
      if (isDemoMode) {
        setCompanies([...companies, { id: newCompanyName.trim(), name: newCompanyName.trim() }]);
      } else {
        if (!activeBusiness?.id) return alert('ব্যবসা লোড হয়নি');
        const { error } = await supabase.from('companies').insert([{ 
          name: newCompanyName.trim(),
          business_id: activeBusiness.id
        }]);
        if (error) throw error;
        fetchData();
      }
      setNewCompanyName('');
    } catch (error: any) {
      alert('কোম্পানি সেভ করতে সমস্যা: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const isUsed = products.some(p => p.company_id === id);
    if (isUsed) return alert('এই কোম্পানির অধীনে পণ্য আছে। আগে পণ্যগুলো মুছুন বা কোম্পানি পরিবর্তন করুন।');
    
    if (window.confirm('আপনি কি এই কোম্পানি মুছে ফেলতে চান?')) {
      setIsSaving(true);
      try {
        if (isDemoMode) {
          setCompanies(companies.filter(c => c.id !== id));
        } else {
          const { error } = await supabase.from('companies').delete().eq('id', id);
          if (error) throw error;
          fetchData();
        }
        if (selectedCompanyFilter === id) setSelectedCompanyFilter('all');
      } catch (error: any) {
        alert('ডিলিট করতে সমস্যা: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleOpenAddProduct = () => {
    setSelectedProduct(null);
    setProductImage(null);
    setFormData({ 
      name: '', 
      category_id: categories[0]?.id || '', 
      company_id: companies[0]?.id || '', 
      unit: 'বস্তা',
      sale_price: '', 
      purchase_price: '', 
      wholesale_price: '', 
      dealer_price: '',
      stock_quantity: '', 
      description: '',
      image_url: '',
      is_online: false,
      is_wholesale: false,
      low_stock_alert: '10',
      is_vat: false,
      warranty: '',
      discount: ''
    });
    setModalType('add_product');
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductImage(null);
    setFormData({
      name: prod.name,
      category_id: prod.category_id || '',
      company_id: prod.company_id || '',
      unit: prod.unit || 'বস্তা',
      sale_price: prod.sale_price.toString(),
      purchase_price: prod.purchase_price.toString(),
      wholesale_price: prod.wholesale_price?.toString() || '',
      dealer_price: prod.dealer_price?.toString() || '',
      stock_quantity: prod.stock_quantity.toString(),
      description: prod.description || '',
      image_url: prod.image_url || '',
      is_online: prod.is_online || false,
      is_wholesale: prod.is_wholesale || false,
      low_stock_alert: prod.low_stock_alert?.toString() || '10',
      is_vat: prod.is_vat || false,
      warranty: prod.warranty || '',
      discount: prod.discount?.toString() || ''
    });
    setModalType('add_product');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(e.target.files[0]);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.category_id || !formData.company_id || !formData.sale_price) {
      return alert('পণ্যের নাম, ক্যাটাগরি, কোম্পানি এবং খুচরা মূল্য আবশ্যক');
    }
    
    setIsSaving(true);
    try {
      let uploadedImageUrl = formData.image_url;

      if (productImage && !isDemoMode && activeBusiness?.id) {
        const fileExt = productImage.name.split('.').pop();
        const fileName = `prod-${activeBusiness.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, productImage);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }

      const productData = {
        name: formData.name,
        category_id: formData.category_id,
        company_id: formData.company_id,
        unit: formData.unit,
        sale_price: Number(formData.sale_price) || 0,
        purchase_price: Number(formData.purchase_price) || 0,
        wholesale_price: Number(formData.wholesale_price) || 0,
        dealer_price: Number(formData.dealer_price) || 0,
        stock_quantity: Number(formData.stock_quantity) || 0,
        description: formData.description,
        image_url: uploadedImageUrl,
        is_online: formData.is_online,
        is_wholesale: formData.is_wholesale,
        low_stock_alert: Number(formData.low_stock_alert) || 0,
        is_vat: formData.is_vat,
        warranty: formData.warranty,
        discount: Number(formData.discount) || 0,
      };

      if (isDemoMode) {
        if (selectedProduct) {
          setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...productData } : p));
        } else {
          setProducts([{ id: Date.now().toString(), ...productData }, ...products]);
        }
      } else {
        if (!activeBusiness?.id) return alert('ব্যবসা লোড হয়নি');
        const dbProductData = { ...productData, business_id: activeBusiness.id };

        if (selectedProduct) {
          const { error } = await supabase.from('products').update(dbProductData).eq('id', selectedProduct.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert([dbProductData]);
          if (error) throw error;
        }
        fetchData();
      }

      setModalType('none');
    } catch (error: any) {
      alert('প্রোডাক্ট সেভ করতে সমস্যা: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('আপনি কি সত্যিই এই পণ্যটি মুছে ফেলতে চান?')) {
      setIsSaving(true);
      try {
        if (isDemoMode) {
          setProducts(products.filter(p => p.id !== id));
        } else {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          fetchData();
        }
        setSelectedProduct(null);
      } catch (error: any) {
        alert('ডিলিট করতে সমস্যা: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

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
        
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
              <Search size={18} className="text-gray-400" />
              <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
            </div>
            <button className="bg-white border border-gray-300 rounded-xl px-2.5 shadow-sm text-[#1E88E5]"><ScanBarcode size={22}/></button>
          </div>
          
          <div className="flex flex-col gap-1.5">
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

        <div className="flex justify-between items-center shrink-0 mt-1">
          <div className="font-bold text-sm text-gray-700">মোট পণ্য: {toBangla(filteredProducts.length)}</div>
          <button onClick={() => setModalType('master_data')} className="flex items-center gap-1 text-xs font-bold text-[#0B5C47] bg-[#E8F5E9] px-2 py-1 rounded-lg border border-[#A5D6A7] active:scale-95 transition">
            <Layers size={14}/> ক্যাটাগরি ও কোম্পানি
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center mt-10">
            <Loader2 size={40} className="text-[#1E88E5] animate-spin mb-4" />
            <p className="text-sm font-bold text-gray-500">ডাটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredProducts.length === 0 ? (
               <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-2 bg-white/50">
                 <Package size={32} className="text-gray-300 mb-2"/>
                 <p className="text-sm text-gray-500 font-bold">কোনো পণ্য পাওয়া যায়নি</p>
               </div>
            ) : (
              filteredProducts.map(prod => {
                const catName = categories.find(c => c.id === prod.category_id)?.name || 'অনির্ধারিত';
                const compName = companies.find(c => c.id === prod.company_id)?.name || 'অনির্ধারিত';
                return (
                  <div key={prod.id} onClick={() => setSelectedProduct(prod)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 shrink-0 border overflow-hidden">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} />
                        )}
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
                      <p className="font-black text-sm text-gray-800">৳ {toBangla(prod.sale_price)}</p>
                      <p className="text-[10px] font-bold text-gray-500 mt-0.5">স্টক: {toBangla(prod.stock_quantity)} {prod.unit}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2.5 z-50">
        <button onClick={handleOpenAddProduct} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 active:scale-95 transition">
          <Plus size={18}/> নতুন প্রোডাক্ট যুক্ত করুন
        </button>
      </div>

      {modalType === 'master_data' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><Layers size={18}/> মাস্টার ডাটা</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex border-b border-gray-200 shrink-0">
              <button onClick={() => setMasterTab('category')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${masterTab === 'category' ? 'border-[#0B5C47] text-[#0B5C47]' : 'border-transparent text-gray-500'}`}>ক্যাটাগরি</button>
              <button onClick={() => setMasterTab('company')} className={`flex-1 py-2.5 text-sm font-bold border-b-2 transition ${masterTab === 'company' ? 'border-[#1E88E5] text-[#1E88E5]' : 'border-transparent text-gray-500'}`}>কোম্পানি</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {masterTab === 'category' && (
                <>
                  <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="নতুন ক্যাটাগরির নাম..." className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    <button onClick={handleAddCategory} disabled={isSaving} className="bg-[#0B5C47] text-white px-4 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition">
                      {isSaving ? <Loader2 size={16} className="animate-spin"/> : <><Plus size={16}/> যোগ</>}
                    </button>
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

              {masterTab === 'company' && (
                <>
                  <div className="flex gap-2">
                    <input type="text" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="নতুন কোম্পানির নাম..." className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#1E88E5]" />
                    <button onClick={handleAddCompany} disabled={isSaving} className="bg-[#1E88E5] text-white px-4 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition">
                      {isSaving ? <Loader2 size={16} className="animate-spin"/> : <><Plus size={16}/> যোগ</>}
                    </button>
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

      {modalType === 'add_product' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base">{selectedProduct ? 'প্রোডাক্ট এডিট' : 'প্রোডাক্ট যুক্ত করুন'}</h2>
              <button onClick={() => setModalType('none')} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
              
              <div className="flex flex-col items-center mb-1">
                <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition">
                  {productImage ? (
                    <img src={URL.createObjectURL(productImage)} alt="Preview" className="w-full h-full object-cover" />
                  ) : formData.image_url ? (
                    <img src={formData.image_url} alt="Current" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={30} className="text-gray-400" />
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 py-1 flex justify-center text-white"><Plus size={14} /></div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                <p className="text-[10px] text-gray-500 font-bold mt-1">ছবি যুক্ত করুন</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="পণ্যের নাম" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-600">ক্যাটাগরি <span className="text-red-500">*</span></label>
                    <button onClick={() => { setModalType('master_data'); setMasterTab('category'); }} className="text-[10px] font-bold text-[#0B5C47] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#A5D6A7] flex items-center gap-0.5"><Plus size={10}/> নতুন</button>
                  </div>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option value="">সিলেক্ট করুন</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-600">কোম্পানি <span className="text-red-500">*</span></label>
                    <button onClick={() => { setModalType('master_data'); setMasterTab('company'); }} className="text-[10px] font-bold text-[#1E88E5] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#B5D2F3] flex items-center gap-0.5"><Plus size={10}/> নতুন</button>
                  </div>
                  <select value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
                    <option value="">সিলেক্ট করুন</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">পণ্যের একক <span className="text-red-500">*</span></label>
                  <div 
                    onClick={() => setIsUnitModalOpen(true)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white flex justify-between items-center cursor-pointer"
                  >
                    <span>{formData.unit || 'সিলেক্ট করুন'}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">বর্তমান মজুদ</label>
                  <input type="number" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} placeholder="স্টক পরিমাণ" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <h3 className="text-xs font-bold text-[#0B5C47] mb-2 border-b pb-1">মূল্য নির্ধারণ</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">খুচরা মূল্য <span className="text-red-500">*</span></label>
                    <input type="number" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ক্রয়মূল্য</label>
                    <input type="number" value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">পাইকারি মূল্য</label>
                    <input type="number" value={formData.wholesale_price} onChange={e => setFormData({...formData, wholesale_price: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ডিলার মূল্য</label>
                    <input type="number" value={formData.dealer_price} onChange={e => setFormData({...formData, dealer_price: e.target.value})} placeholder="৳ 0" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold text-[#0B5C47] mb-0 border-b pb-1">অন্যান্য অপশন</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <span className="text-xs font-bold text-gray-700">অনলাইনে বিক্রি</span>
                    <input type="checkbox" checked={formData.is_online} onChange={e => setFormData({...formData, is_online: e.target.checked})} className="w-4 h-4 accent-[#0B5C47]" />
                  </label>
                  <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <span className="text-xs font-bold text-gray-700">পাইকারি বিক্রি</span>
                    <input type="checkbox" checked={formData.is_wholesale} onChange={e => setFormData({...formData, is_wholesale: e.target.checked})} className="w-4 h-4 accent-[#0B5C47]" />
                  </label>
                  <label className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <span className="text-xs font-bold text-gray-700">ভ্যাট প্রযোজ্য</span>
                    <input type="checkbox" checked={formData.is_vat} onChange={e => setFormData({...formData, is_vat: e.target.checked})} className="w-4 h-4 accent-[#0B5C47]" />
                  </label>
                  <div className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="text-xs font-bold text-gray-700">লো-স্টক</span>
                    <input type="number" value={formData.low_stock_alert} onChange={e => setFormData({...formData, low_stock_alert: e.target.value})} className="w-12 text-center border rounded p-1 text-xs outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ওয়ারেন্টি</label>
                    <input type="text" value={formData.warranty} onChange={e => setFormData({...formData, warranty: e.target.value})} placeholder="যেমন: ১ বছর" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ডিসকাউন্ট (%)</label>
                    <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} placeholder="0" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">বিস্তারিত (ঐচ্ছিক)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="পণ্যের বিস্তারিত..." className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47] min-h-[60px]" />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0 flex gap-2">
              <button onClick={() => setModalType('none')} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSaveProduct} disabled={isSaving} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2">
                {isSaving ? <><Loader2 size={18} className="animate-spin"/> সেভ হচ্ছে...</> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: ইউনিট সিলেক্ট (নতুন) ================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex justify-center items-end backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh]">
            
            <div className="flex flex-col items-center pt-3 pb-2 shrink-0 border-b border-gray-100">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-3"></div>
              <h2 className="font-bold text-lg text-[#0F2A3D]">প্রোডাক্ট এর ইউনিট সিলেক্ট করি</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {UNITS.map((unit) => (
                <div
                  key={unit}
                  onClick={() => {
                    setFormData({ ...formData, unit });
                    setIsUnitModalOpen(false);
                  }}
                  className="flex justify-between items-center py-3.5 border-b border-gray-100 last:border-0 cursor-pointer active:bg-gray-50 transition"
                >
                  <span className="text-base font-medium text-[#0F2A3D]">{unit}</span>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}

      {selectedProduct && modalType === 'none' && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[80dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-[#0B5C47] text-white p-3 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-base">পণ্যের বিস্তারিত</h2>
              <button onClick={() => setSelectedProduct(null)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm border flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-amber-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-gray-800">{selectedProduct.name}</h3>
                  <p className="text-sm font-bold text-gray-700 mt-1">৳ {toBangla(selectedProduct.sale_price)} / {selectedProduct.unit || ''}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleDeleteProduct(selectedProduct.id)} className="p-1.5 border border-red-200 text-red-500 bg-red-50 rounded shadow-sm"><Trash2 size={16}/></button>
                    <button onClick={() => handleOpenEditProduct(selectedProduct)} className="flex-1 border border-[#1E88E5] text-[#1E88E5] bg-white rounded shadow-sm flex items-center justify-center gap-1 text-xs font-bold py-1"><Edit2 size={14}/> এডিট করুন</button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300"/>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-[#1E88E5] text-sm">{toBangla(selectedProduct.stock_quantity)}</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">বর্তমান স্টক</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-gray-700 text-sm">{toBangla(selectedProduct.purchase_price)} ৳</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">ক্রয়মূল্য</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-green-600 text-sm">{toBangla(selectedProduct.sale_price - selectedProduct.purchase_price)} ৳</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">লাভ</span>
                </div>
                {selectedProduct.wholesale_price ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="font-black text-indigo-600 text-sm">{toBangla(selectedProduct.wholesale_price)} ৳</span>
                    <span className="text-[10px] text-gray-600 font-bold mt-0.5">পাইকারি মূল্য</span>
                  </div>
                ) : null}
                {selectedProduct.dealer_price ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="font-black text-teal-600 text-sm">{toBangla(selectedProduct.dealer_price)} ৳</span>
                    <span className="text-[10px] text-gray-600 font-bold mt-0.5">ডিলার মূল্য</span>
                  </div>
                ) : null}
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="font-black text-[#0B5C47] text-[11px] truncate w-full px-1">{categories.find(c=>c.id===selectedProduct.category_id)?.name || 'নেই'}</span>
                  <span className="text-[10px] text-gray-600 font-bold mt-0.5">ক্যাটাগরি</span>
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