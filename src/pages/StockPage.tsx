import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Clock, MoreVertical, 
  Plus, Edit3, X, ScanBarcode, Tag, Building2, Package, Loader2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoProducts, demoCategories, demoCompanies } from '../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function StockPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব ক্যাটাগরি');
  const [selectedCompany, setSelectedCompany] = useState('সব কোম্পানি');
  
  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // মডাল স্টেট
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQty, setNewQty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // স্ক্যানার স্টেট
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setProducts(demoProducts.map(p => ({
          ...p,
          category: p.category,
          company: p.company,
          stock: p.stock,
          purchasePrice: p.purchasePrice,
          value: p.stock * p.purchasePrice,
          image_url: p.image_url || ''
        })));
        setAllCategories(demoCategories.map(c => c.name));
        setAllCompanies(demoCompanies.map(c => c.name));
      } else {
        if (!activeBusiness?.id) return;

        const [prodRes, catRes, compRes] = await Promise.all([
          supabase.from('products').select('*, categories(name), companies(name)').eq('business_id', activeBusiness.id),
          supabase.from('categories').select('name').eq('business_id', activeBusiness.id),
          supabase.from('companies').select('name').eq('business_id', activeBusiness.id)
        ]);

        if (prodRes.data) {
          setProducts(prodRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.categories?.name || 'আনক্যাটাগরি',
            company: p.companies?.name || 'আননোন',
            stock: Number(p.stock_quantity),
            purchasePrice: Number(p.purchase_price),
            value: Number(p.stock_quantity) * Number(p.purchase_price),
            image_url: p.image_url || ''
          })));
        }
        if (catRes.data) setAllCategories(catRes.data.map(c => c.name));
        if (compRes.data) setAllCompanies(compRes.data.map(c => c.name));
      }
    } catch (error) {
      console.error("Stock fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isScannerOpen) {
      html5QrCode = new Html5Qrcode("reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const scannedProduct = products.find(p => p.id.toString() === decodedText);
          if (scannedProduct) {
            handleOpenUpdate(scannedProduct);
          } else {
            alert('এই বারকোডের কোনো পণ্য পাওয়া যায়নি।');
          }
          html5QrCode?.stop();
          setIsScannerOpen(false);
        },
        () => { }
      ).catch(() => {
        setScannerError("ক্যামেরা চালু করা যাচ্ছে না। পারমিশন চেক করুন।");
      });
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScannerOpen, products]);

  const filteredData = useMemo(() => {
    return products.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'সব ক্যাটাগরি' || item.category === selectedCategory;
      const matchCompany = selectedCompany === 'সব কোম্পানি' || item.company === selectedCompany;
      return matchSearch && matchCategory && matchCompany;
    });
  }, [products, searchQuery, selectedCategory, selectedCompany]);

  const totalStock = filteredData.reduce((acc, curr) => acc + curr.stock, 0);
  const totalValue = filteredData.reduce((acc, curr) => acc + curr.value, 0);

  const handleOpenUpdate = (prod: any) => {
    setSelectedProduct(prod);
    setNewQty(prod.stock.toString());
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!newQty || parseInt(newQty) < 0) return alert('সঠিক স্টক পরিমাণ দিন');
    
    setIsSaving(true);
    try {
      const qtyNum = Number(newQty);
      if (isDemoMode) {
        setProducts(products.map(p => 
          p.id === selectedProduct.id ? { ...p, stock: qtyNum, value: qtyNum * p.purchasePrice } : p
        ));
      } else {
        const { error } = await supabase.from('products').update({ stock_quantity: qtyNum }).eq('id', selectedProduct.id);
        if (error) throw error;
        fetchData();
      }
      setIsUpdateModalOpen(false);
    } catch (error: any) {
      alert("আপডেট করতে সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
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
            <button onClick={() => onNavigate('purchase_khata')} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/30 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition">
              <Clock size={14} /> স্টকের ইতিহাস
            </button>
            <button className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><MoreVertical size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        
        <div className="bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white p-3 rounded-xl shadow-md flex justify-between items-center shrink-0">
          <div className="flex-1 text-center border-r border-white/20">
            <p className="text-xs font-bold text-blue-100">মোট মজুদ</p>
            <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(totalStock)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-blue-100">মজুদ মূল্য</p>
            <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(totalValue)} ৳</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] shrink-0">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
          <div className="h-4 w-[1px] bg-gray-300"></div>
          <button onClick={() => setIsScannerOpen(true)} className="text-gray-500 font-bold text-xs flex items-center gap-1 active:scale-90 transition">
            <ScanBarcode size={16} /> স্ক্যান
          </button>
        </div>

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

        <div className="flex flex-col gap-2 mt-1">
          {isLoading ? (
            <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-[#0B5C47]" size={32}/></div>
          ) : filteredData.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-white/50">
              <Package size={32} className="text-gray-300 mb-2"/>
              <p className="text-sm text-gray-500 font-bold">কোনো স্টক পাওয়া যায়নি</p>
            </div>
          ) : (
            filteredData.map(item => (
              <div key={item.id} className="bg-[#F3F4F6] p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleOpenUpdate(item)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-amber-500" />
                    )}
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
              <button onClick={() => { setIsUpdateModalOpen(false); setIsScannerOpen(true); }} className="w-full border border-gray-300 text-gray-700 bg-gray-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                <ScanBarcode size={18}/> বারকোড স্ক্যান করুন
              </button>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={handleUpdateStock} disabled={isSaving} className="w-full bg-[#1E88E5] text-white py-2.5 rounded-lg font-bold flex justify-center items-center">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* স্ক্যানার মডাল */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center text-white mb-4">
              <h2 className="font-bold text-lg">বারকোড স্ক্যানার</h2>
              <button onClick={() => setIsScannerOpen(false)} className="p-1.5 bg-white/20 rounded-full"><X size={20}/></button>
            </div>
            <div id="reader" className="w-full aspect-square max-w-[280px] bg-black rounded-3xl border-2 border-gray-700 overflow-hidden shadow-2xl relative">
              {scannerError && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-red-900/80 text-white z-20">
                  <p>{scannerError}</p>
                </div>
              )}
            </div>
            <p className="text-white/80 text-sm mt-6 text-center">বারকোডটি ফ্রেমের মধ্যে রাখুন</p>
          </div>
        </div>
      )}
    </div>
  );
}