import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Search, Clock, 
  X, ScanBarcode, Tag, Building2, Package, Loader2, List, Truck, ReceiptText, Plus, Edit2, Printer, Share2, Download, ShieldCheck, Percent, AlignLeft, AlertCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoProducts, demoDepotStockHistory } from '../../lib/demoData';
import PremiumToast from '../../components/PremiumToast';

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
  
  const [isSaving, setIsSaving] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  
  const historyPrintRef = useRef<HTMLDivElement>(null);

  // 📌 প্রিমিয়াম টোস্ট স্টেট
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

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
          image_url: p.image_url || '',
          unit: 'বস্তা',
          wholesale_price: p.salePrice - 50,
          dealer_price: p.salePrice - 100,
          low_stock_alert: 10,
          warranty: 'N/A',
          discount: 0,
          is_vat: false,
          description: 'উন্নতমানের গ্রোয়ার ফিড।'
        })));
        setHistoryData(demoDepotStockHistory || []);
      } else {
        if (!activeBusiness?.id) return;
        
        const [prodRes, catRes, compRes] = await Promise.all([
          supabase.from('products').select('*').eq('business_id', activeBusiness.id).gt('stock_quantity', 0),
          supabase.from('categories').select('*'),
          supabase.from('companies').select('*')
        ]);

        if (prodRes.data) {
          const cats = catRes.data || [];
          const comps = compRes.data || [];
          setProducts(prodRes.data.map((p: any) => ({
            ...p,
            category: cats.find((c: any) => c.id === p.category_id)?.name || 'আনক্যাটাগরি',
            company: comps.find((c: any) => c.id === p.company_id)?.name || 'আননোন',
            stock_quantity: Number(p.stock_quantity), 
            purchase_price: Number(p.purchase_price),
            sale_price: Number(p.sale_price), 
            image_url: p.image_url || ''
          })));
        }

        const [purRes, saleRes, trnRes] = await Promise.all([
          supabase.from('purchases').select('*').eq('business_id', activeBusiness.id).order('created_at', { ascending: false }),
          supabase.from('sales').select('*').eq('business_id', activeBusiness.id).order('created_at', { ascending: false }),
          supabase.from('depot_transfers').select('*').eq('destination_depot_id', activeBusiness.id).order('created_at', { ascending: false })
        ]);

        const combined = [
          ...(purRes.data || []).map((d: any) => ({ ...d, type: 'stock_in', party_name: 'সাপ্লায়ার', amount: d.total_amount, date: d.created_at, reference_no: d.challan_no || 'PUR' })),
          ...(saleRes.data || []).map((d: any) => ({ ...d, type: 'sale', party_name: 'কাস্টমার', amount: d.total_amount, date: d.created_at, reference_no: d.receipt_no || 'INV' })),
          ...(trnRes.data || []).map((d: any) => ({ ...d, type: 'transfer', party_name: 'ডিপো ট্রান্সফার', amount: d.total_amount || 0, date: d.created_at, reference_no: d.id.substring(0, 8) }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setHistoryData(combined);
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
            setSelectedProductDetails(scannedProduct);
          } else {
            showToast('এই বারকোডের কোনো পণ্য পাওয়া যায়নি।', 'error');
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

  const handleUpdateStock = async (id: string, newQty: string) => {
    if (!newQty || parseInt(newQty) < 0) return showToast('সঠিক স্টক পরিমাণ দিন', 'error');
    setIsSaving(true);
    try {
      const qtyNum = Number(newQty);
      if (isDemoMode) {
        setProducts(products.map(p => p.id === id ? { ...p, stock_quantity: qtyNum } : p));
        setSelectedProductDetails((prev: any) => ({ ...prev, stock_quantity: qtyNum }));
      } else {
        const { error } = await supabase.from('products').update({ stock_quantity: qtyNum }).eq('id', id);
        if (error) throw error;
        fetchData();
        setSelectedProductDetails((prev: any) => ({ ...prev, stock_quantity: qtyNum }));
      }
      showToast('স্টক আপডেট হয়েছে!', 'success');
    } catch (error: any) {
      showToast("আপডেট করতে সমস্যা: " + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProduct = (productId: string) => {
    localStorage.setItem('edit_product_id', productId);
    setSelectedProductDetails(null);
    onNavigate('product_list');
  };

  const handleCardClick = (name: string, mode: ViewMode) => {
    setSelectedGroup(name);
    setViewMode(mode);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'stock_in') return <Package size={20} className="text-green-600" />;
    if (type === 'sale') return <ReceiptText size={20} className="text-blue-600" />;
    return <Truck size={20} className="text-orange-600" />;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'stock_in') return 'স্টক ইন';
    if (type === 'sale') return 'বিক্রি';
    return 'ট্রান্সফার';
  };

  const getTypeColor = (type: string) => {
    if (type === 'stock_in') return 'bg-green-50 text-green-700 border-green-200';
    if (type === 'sale') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-orange-50 text-orange-700 border-orange-200';
  };

  const handlePrintHistory = () => window.print();
  
  const handleDownloadHistory = async () => {
    if (!historyPrintRef.current) return;
    try {
      const canvas = await html2canvas(historyPrintRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`History-${selectedHistoryItem.reference_no}.pdf`);
      showToast('PDF ডাউনলোড হয়েছে!', 'success');
    } catch (err) {
      showToast('ডাউনলোডে সমস্যা হয়েছে!', 'error');
    }
  };

  // ==========================================
  // 📌 FULL PAGE: History Details
  // ==========================================
  if (selectedHistoryItem) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F1F5F9] flex flex-col print:bg-white print:block">
        <header className="bg-[#0A2540] text-white p-3 flex justify-between items-center shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedHistoryItem(null)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">লেনদেনের বিস্তারিত</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex justify-center print:p-0">
          <div ref={historyPrintRef} className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 border border-gray-200 print:shadow-none print:border-none print:max-w-none">
            
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-2xl font-black text-[#0A2540]">DREAM AGRO & FISHERIES</h2>
              <p className="text-sm text-gray-600 mt-1">লেনদেনের বিবরণী</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">রেফারেন্স নং:</p>
                <p className="font-bold text-lg">{selectedHistoryItem.reference_no}</p>
                <p className="text-gray-500 mt-2">তারিখ:</p>
                <p className="font-bold">{new Date(selectedHistoryItem.date).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">ধরন:</p>
                <p className={`font-bold px-2 py-0.5 rounded border inline-block mt-1 ${getTypeColor(selectedHistoryItem.type)}`}>
                  {getTypeLabel(selectedHistoryItem.type)}
                </p>
                <p className="text-gray-500 mt-2">পার্টি:</p>
                <p className="font-bold">{selectedHistoryItem.party_name}</p>
              </div>
            </div>

            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-2 px-3 border text-left">পণ্যের নাম</th>
                  <th className="py-2 px-3 border text-center">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {selectedHistoryItem.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 border font-bold">{item.name}</td>
                    <td className="py-2 px-3 border text-center">{toBangla(item.qty)} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="w-64 border-t-2 border-gray-800 pt-2">
                <div className="flex justify-between font-black text-lg text-[#0A2540]">
                  <span>মোট মূল্য:</span>
                  <span>৳ {toBangla(selectedHistoryItem.amount)}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400 mt-10">
              এটি একটি সিস্টেম জেনারেটেড রিপোর্ট।
            </div>
          </div>
        </div>

        <div className="bg-white border-t p-3 flex gap-2 justify-center print:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button onClick={handlePrintHistory} className="flex-1 max-w-[150px] bg-gray-100 text-gray-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
            <Printer size={18} /> প্রিন্ট
          </button>
          <button onClick={handleDownloadHistory} className="flex-1 max-w-[150px] bg-blue-50 text-blue-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 border border-blue-200 transition">
            <Download size={18} /> PDF
          </button>
          <button onClick={() => showToast('শেয়ার ফাংশন তৈরি করা হচ্ছে...')} className="flex-1 max-w-[150px] bg-green-50 text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 border border-green-200 transition">
            <Share2 size={18} /> শেয়ার
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 📌 FULL PAGE: Product Details
  // ==========================================
  if (selectedProductDetails) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#EFF6F3] flex flex-col">
        <header className="bg-da-depotNavy text-white p-3 flex justify-between items-center shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProductDetails(null)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">পণ্যের বিস্তারিত</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col items-center">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            
            <div className="flex gap-3 items-start border-b border-gray-200 pb-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {selectedProductDetails.image_url ? (
                  <img src={selectedProductDetails.image_url} alt="Product" className="w-full h-full object-cover" />
                ) : (
                  <Package size={28} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-800 leading-tight">{selectedProductDetails.name}</h2>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">{selectedProductDetails.category}</span>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{selectedProductDetails.company}</span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">একক: {selectedProductDetails.unit || 'পিস'}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-3">
              <label className="text-xs font-bold text-blue-900 mb-1.5 flex items-center gap-1"><AlertCircle size={14}/> স্টক আপডেট</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={selectedProductDetails.stock_quantity} 
                  onChange={(e) => setSelectedProductDetails({ ...selectedProductDetails, stock_quantity: e.target.value })} 
                  className="flex-1 border border-blue-300 rounded-lg p-2 text-base font-bold outline-none focus:border-blue-500" 
                />
                <button 
                  onClick={() => handleUpdateStock(selectedProductDetails.id, selectedProductDetails.stock_quantity)}
                  disabled={isSaving}
                  className="bg-da-depotBlue text-white px-4 rounded-lg font-bold shadow-sm hover:bg-blue-700 transition"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'আপডেট'}
                </button>
              </div>
            </div>

            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mt-4 mb-2">মূল্য বিবরণী</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold">ক্রয় মূল্য</p>
                <p className="font-bold text-sm text-gray-800">৳ {toBangla(selectedProductDetails.purchase_price)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold">বিক্রয় মূল্য</p>
                <p className="font-bold text-sm text-green-600">৳ {toBangla(selectedProductDetails.sale_price)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold">পাইকারি মূল্য</p>
                <p className="font-bold text-sm text-gray-800">৳ {toBangla(selectedProductDetails.wholesale_price || 0)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold">ডিলার মূল্য</p>
                <p className="font-bold text-sm text-gray-800">৳ {toBangla(selectedProductDetails.dealer_price || 0)}</p>
              </div>
            </div>

            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mt-4 mb-2">অন্যান্য তথ্য</h3>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex justify-between p-2 text-sm">
                <span className="text-gray-600 flex items-center gap-1"><AlertCircle size={14}/> লো-স্টক অ্যালার্ট</span>
                <span className="font-bold">{toBangla(selectedProductDetails.low_stock_alert || 0)}</span>
              </div>
              <div className="flex justify-between p-2 text-sm">
                <span className="text-gray-600 flex items-center gap-1"><Percent size={14}/> ডিসকাউন্ট</span>
                <span className="font-bold">{toBangla(selectedProductDetails.discount || 0)} %</span>
              </div>
              <div className="flex justify-between p-2 text-sm">
                <span className="text-gray-600 flex items-center gap-1"><ShieldCheck size={14}/> ওয়ারেন্টি</span>
                <span className="font-bold">{selectedProductDetails.warranty || 'N/A'}</span>
              </div>
              <div className="flex justify-between p-2 text-sm">
                <span className="text-gray-600">ভ্যাট প্রযোজ্য</span>
                <span className="font-bold">{selectedProductDetails.is_vat ? 'হ্যাঁ' : 'না'}</span>
              </div>
            </div>

            <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mt-4 mb-2">বিস্তারিত</h3>
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-sm text-gray-700">
              <p className="flex items-start gap-1"><AlignLeft size={16} className="mt-0.5 shrink-0"/>{selectedProductDetails.description || 'কোনো বিবরণ দেওয়া হয়নি।'}</p>
            </div>
            
            <button 
              onClick={() => handleEditProduct(selectedProductDetails.id)} 
              className="w-full mt-5 bg-white border-2 border-da-depotBlue text-da-depotBlue py-2.5 rounded-xl font-bold flex justify-center items-center gap-2"
            >
              <Edit2 size={16} /> সম্পূর্ণ তথ্য এডিট করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 📌 FULL PAGE: History List
  // ==========================================
  if (isHistoryOpen) {
    return (
      <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
        <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <button onClick={() => setIsHistoryOpen(false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">স্টক ইতিহাস</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
          ) : historyData.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 text-sm">কোনো ইতিহাস পাওয়া যায়নি</div>
          ) : (
            historyData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedHistoryItem(item)}
                className="bg-white rounded-xl p-3 border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getTypeColor(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                      <span className="text-[11px] font-bold text-gray-800 truncate">{item.reference_no}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 truncate mt-1">{item.party_name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(item.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-sm text-gray-800">৳ {toBangla(item.amount)}</p>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // 📌 MAIN: Stock Page
  // ==========================================
  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full relative">
      
      <PremiumToast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />

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
            <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-1 px-2.5 py-1.5 border border-white/30 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition">
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
                  <div key={idx} onClick={() => handleCardClick(group.name, viewMode)} className="bg-white p-2.5 rounded-xl border border-da-cardBorder shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-da-depotBg flex items-center justify-center overflow-hidden border border-da-cardBorder shrink-0">
                        {group.image_url ? <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" /> : <span className="font-black text-da-depotBlue text-lg">{group.name.charAt(0)}</span>}
                      </div>
                      <h3 className="font-bold text-[13px] text-da-textDark line-clamp-2 leading-tight">{group.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-da-cardBorder/50">
                      <div className="flex flex-col"><span className="text-[9px] text-da-textMuted">স্টক</span><span className="font-bold text-[11px] text-da-textDark">{toBangla(group.totalQty)}</span></div>
                      <div className="flex flex-col items-end"><span className="text-[9px] text-da-textMuted">মূল্য</span><span className="font-black text-[11px] text-da-depotBlue">৳{toBangla(group.totalValue)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(viewMode === 'list' || selectedGroup) && (
              <div className="flex flex-col gap-1.5 mt-1">
                {filteredProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-da-cardBorder rounded-lg p-6 flex flex-col items-center justify-center text-center bg-white/50"><Package size={28} className="text-da-textMuted mb-2"/><p className="text-xs text-da-textMuted font-bold">কোনো পণ্য পাওয়া যায়নি</p></div>
                ) : (
                  filteredProducts.map(item => (
                    <div key={item.id} className="bg-white px-2.5 py-1.5 rounded-lg border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setSelectedProductDetails(item)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-da-depotBg rounded-md flex items-center justify-center shrink-0 border border-da-cardBorder overflow-hidden">
                          {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Package size={16} className="text-da-depotBlue" />}
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
                      <div className="font-black text-[13px] text-da-textDark shrink-0 pl-2">৳{toBangla(item.stock_quantity * item.purchase_price)}</div>
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
          <button onClick={() => onNavigate('purchase')} className="flex-1 bg-da-depotNavy text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1"><Truck size={16}/> স্টক ইন</button>
          <button onClick={() => { localStorage.setItem('open_add_form', 'true'); onNavigate('product_list'); }} className="flex-1 bg-da-depotBlue text-white py-2.5 rounded-xl font-bold shadow-md active:scale-95 transition flex justify-center items-center gap-1"><Plus size={16}/> নতুন পণ্য যোগ করুন</button>
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
              {scannerError && <div className="absolute inset-0 flex items-center justify-center text-center p-4 bg-red-900/80 text-white z-20"><p>{scannerError}</p></div>}
            </div>
            <p className="text-white/80 text-sm mt-6 text-center">বারকোডটি ফ্রেমের মধ্যে রাখুন</p>
          </div>
        </div>
      )}
    </div>
  );
}