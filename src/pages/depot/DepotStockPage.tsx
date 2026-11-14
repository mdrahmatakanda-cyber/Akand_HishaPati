import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, Clock, 
  X, ScanBarcode, Tag, Building2, Package, Loader2, List,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts } from '../../lib/demoData';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

type ViewMode = 'list' | 'category' | 'company';

export default function DepotStockPage({ onBack, onNavigate }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQty, setNewQty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
          stock_quantity: p.stock,
          purchase_price: p.purchasePrice,
          sale_price: p.salePrice,
          image_url: p.image_url || ''
        })));
      } else {
        if (!activeBusiness?.id) return;
        const { data, error } = await supabase
          .from('products')
          .select('*, categories(name), companies(name)')
          .eq('business_id', activeBusiness.id);

        if (error) throw error;

        if (data) {
          setProducts(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.categories?.name || 'আনক্যাটাগরি',
            company: p.companies?.name || 'আননোন',
            stock_quantity: Number(p.stock_quantity),
            purchase_price: Number(p.purchase_price),
            sale_price: Number(p.sale_price),
            image_url: p.image_url || ''
          })));
        }
      }
    } catch (error) {
      console.error("Stock fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isDemoMode, activeBusiness?.id]);

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
      ).catch(() => setScannerError("ক্যামেরা চালু করা যাচ্ছে না। পারমিশন চেক করুন।"));
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [isScannerOpen, products]);

  const categoryData = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const cat = p.category || 'আনক্যাটাগরি';
      if (!map.has(cat)) map.set(cat, { name: cat, totalQty: 0, totalValue: 0, image_url: p.image_url });
      const curr = map.get(cat);
      curr.totalQty += p.stock_quantity;
      curr.totalValue += (p.stock_quantity * p.purchase_price);
      if (!curr.image_url && p.image_url) curr.image_url = p.image_url;
    });
    return Array.from(map.values());
  }, [products]);

  const companyData = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const comp = p.company || 'আননোন';
      if (!map.has(comp)) map.set(comp, { name: comp, totalQty: 0, totalValue: 0, image_url: p.image_url });
      const curr = map.get(comp);
      curr.totalQty += p.stock_quantity;
      curr.totalValue += (p.stock_quantity * p.purchase_price);
      if (!curr.image_url && p.image_url) curr.image_url = p.image_url;
    });
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchGroup = true;
      if (selectedGroup) {
        if (viewMode === 'category') matchGroup = p.category === selectedGroup;
        else if (viewMode === 'company') matchGroup = p.company === selectedGroup;
      }
      return matchSearch && matchGroup;
    });
  }, [products, searchQuery, selectedGroup, viewMode]);

  const totalStock = filteredProducts.reduce((acc, curr) => acc + curr.stock_quantity, 0);
  const totalValue = filteredProducts.reduce((acc, curr) => acc + (curr.stock_quantity * curr.purchase_price), 0);

  const handleOpenUpdate = (prod: any) => {
    setSelectedProduct(prod);
    setNewQty(prod.stock_quantity.toString());
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!newQty || parseInt(newQty) < 0) return alert('সঠিক স্টক পরিমাণ দিন');
    setIsSaving(true);
    try {
      const qtyNum = Number(newQty);
      if (isDemoMode) {
        setProducts(products.map(p => 
          p.id === selectedProduct.id ? { ...p, stock_quantity: qtyNum } : p
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

  const handleCardClick = (name: string, mode: ViewMode) => {
    setSelectedGroup(name);
    setViewMode(mode);
  };

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={selectedGroup ? () => setSelectedGroup(null) : onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">
              {selectedGroup ? `${selectedGroup} (স্টক)` : 'স্টকের হিসাব'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNavigate('purchase_khata')} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/30 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition">
              <Clock size={14} /> ইতিহাস
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        <div className="bg-gradient-to-r from-da-depotNavy to-da-depotBlue text-white p-3 rounded-xl shadow-md flex justify-between items-center shrink-0">
          <div className="flex-1 text-center border-r border-white/20">
            <p className="text-xs font-bold text-blue-100">মোট মজুদ</p>
            <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(totalStock)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-blue-100">মজুদ মূল্য</p>
            <p className="text-xl font-black mt-1">{isLoading ? '...' : toBangla(totalValue)} ৳</p>
          </div>
        </div>

        {!selectedGroup && (
          <div className="flex flex-col gap-2 shrink-0">
            <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-blue">
              <Search size={18} className="text-da-textMuted" />
              <input type="text" placeholder="পণ্য খোঁজ করুন" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
              <button onClick={() => setIsScannerOpen(true)} className="text-da-depotBlue font-bold text-xs flex items-center gap-1 active:scale-90 transition">
                <ScanBarcode size={16} /> স্ক্যান
              </button>
            </div>

            <div className="bg-[#E1EBE6] p-0.5 rounded-lg flex items-center shadow-inner">
              <button onClick={() => setViewMode('list')} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition flex items-center justify-center gap-1 ${viewMode === 'list' ? 'bg-white shadow-sm text-da-depotNavy' : 'text-da-textMuted'}`}>
                <List size={14}/> লিস্ট
              </button>
              <button onClick={() => setViewMode('category')} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition flex items-center justify-center gap-1 ${viewMode === 'category' ? 'bg-white shadow-sm text-da-depotNavy' : 'text-da-textMuted'}`}>
                <Tag size={14}/> ক্যাটাগরি
              </button>
              <button onClick={() => setViewMode('company')} className={`flex-1 py-1.5 text-xs rounded-md font-bold transition flex items-center justify-center gap-1 ${viewMode === 'company' ? 'bg-white shadow-sm text-da-depotNavy' : 'text-da-textMuted'}`}>
                <Building2 size={14}/> কোম্পানি
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
        ) : (
          <>
            {!selectedGroup && viewMode !== 'list' && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(viewMode === 'category' ? categoryData : companyData).map((group, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleCardClick(group.name, viewMode)}
                    className="bg-white p-2.5 rounded-xl border border-da-cardBorder shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-da-depotBg flex items-center justify-center overflow-hidden border border-da-cardBorder shrink-0">
                        {group.image_url ? (
                          <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-black text-da-depotBlue text-lg">{group.name.charAt(0)}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-[13px] text-da-textDark line-clamp-2 leading-tight">{group.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-da-cardBorder/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-da-textMuted">স্টক</span>
                        <span className="font-bold text-[11px] text-da-textDark">{toBangla(group.totalQty)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-da-textMuted">মূল্য</span>
                        <span className="font-black text-[11px] text-da-depotBlue">৳{toBangla(group.totalValue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(viewMode === 'list' || selectedGroup) && (
              <div className="flex flex-col gap-1.5 mt-1">
                {filteredProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-da-cardBorder rounded-lg p-6 flex flex-col items-center justify-center text-center bg-white/50">
                    <Package size={28} className="text-da-textMuted mb-2"/>
                    <p className="text-xs text-da-textMuted font-bold">কোনো পণ্য পাওয়া যায়নি</p>
                  </div>
                ) : (
                  filteredProducts.map(item => (
                    <div key={item.id} className="bg-white px-2.5 py-1.5 rounded-lg border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleOpenUpdate(item)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-da-depotBg rounded-md flex items-center justify-center shrink-0 border border-da-cardBorder overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-da-depotBlue" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-[12px] text-da-textDark truncate">{item.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-bold text-da-teal bg-da-teal/10 px-1 rounded border border-da-teal/20 whitespace-nowrap truncate max-w-[60px]">{item.category}</span>
                            <span className="text-[8px] font-bold text-da-depotBlue bg-da-depotBlue/10 px-1 rounded border border-da-depotBlue/20 whitespace-nowrap truncate max-w-[60px]">{item.company}</span>
                            <span className="text-[9px] text-da-textMuted font-bold ml-1 whitespace-nowrap">স্টক: {toBangla(item.stock_quantity)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-black text-[13px] text-da-textDark shrink-0 pl-2">
                        ৳{toBangla(item.stock_quantity * item.purchase_price)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {!selectedGroup && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-da-cardBorder p-2.5 z-50 flex gap-2">
          <button onClick={() => onNavigate('product_list')} className="w-full bg-da-depotBlue text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1">
            <Package size={16}/> প্রোডাক্ট যুক্ত করুন
          </button>
        </div>
      )}

      {isUpdateModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-da-depotNavy p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-base">স্টক আপডেট করুন</h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-da-textDark">{selectedProduct.name}</p>
                <p className="text-xs text-da-textMuted">বর্তমান স্টক: {toBangla(selectedProduct.stock_quantity)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-da-textDark mb-1 block">নতুন স্টকের পরিমাণ</label>
                <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2.5 text-lg font-bold outline-none focus:border-da-depotBlue" />
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2">
              <button onClick={() => setIsUpdateModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleUpdateStock} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

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