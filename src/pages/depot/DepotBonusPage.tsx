import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, Loader2, X, Gift, 
  Trash2, FileText
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoBonusEntries, demoProducts, demoCompaniesList } from '../../lib/demoData';

interface Props {
  onBack: () => void;
}

export default function DepotBonusPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // ফর্ম স্টেট
  const [selectedCompany, setSelectedCompany] = useState('');
  const [bonusDate, setBonusDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setEntries(demoBonusEntries);
        setProducts(demoProducts);
        setCompanies(demoCompaniesList || []);
      } else {
        if (!activeBusiness?.id) return;
        const bizId = activeBusiness.id;

        const [entryRes, prodRes, compRes] = await Promise.all([
          supabase.from('bonus_entries').select('*, companies(name), bonus_items(quantity, products(name))').eq('business_id', bizId).order('date', { ascending: false }),
          supabase.from('products').select('id, name, stock_quantity').eq('business_id', bizId),
          supabase.from('companies').select('id, name').eq('business_id', bizId)
        ]);

        if (entryRes.data) {
          setEntries(entryRes.data.map((e: any) => ({
            id: e.id,
            company_name: e.companies?.name || 'অজানা কোম্পানি',
            date: new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            note: e.note,
            items: e.bonus_items?.map((i: any) => ({ product_name: i.products?.name || 'পণ্য', quantity: i.quantity })) || []
          })));
        }
        if (prodRes.data) setProducts(prodRes.data);
        if (compRes.data) setCompanies(compRes.data);
      }
    } catch (error) {
      console.error("Error fetching bonus data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id]);

  const handleAddToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleSave = async () => {
    if (!selectedCompany) return alert('কোম্পানি সিলেক্ট করুন');
    if (cart.length === 0) return alert('অন্তত একটি পণ্য যোগ করুন');

    setIsSaving(true);
    try {
      if (isDemoMode) {
        const companyName = companies.find(c => c.id === selectedCompany)?.name || 'কোম্পানি';
        const newEntry = {
          id: Date.now().toString(),
          company_name: companyName,
          date: new Date(bonusDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: note,
          items: cart.map(c => ({ product_name: c.name, quantity: c.qty }))
        };
        setEntries([newEntry, ...entries]);
      } else {
        const itemsJson = cart.map(item => ({ product_id: item.id, quantity: item.qty }));
        
        const { error } = await supabase.rpc('create_bonus_entry', {
          p_business_id: activeBusiness?.id,
          p_company_id: selectedCompany,
          p_date: bonusDate,
          p_note: note,
          p_items: itemsJson
        });
        if (error) throw error;
        fetchData();
      }
      
      setIsAddModalOpen(false);
      setSelectedCompany('');
      setNote('');
      setCart([]);
      setProductSearchQuery(''); // সার্চ ক্লিয়ার
      setBonusDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      alert("সমস্যা: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.note && e.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">বোনাস এন্ট্রি</h1>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-1 bg-da-depotBlue px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition">
            <Plus size={16} /> নতুন বোনাস
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        
        <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue shrink-0 mt-1">
          <Search size={18} className="text-da-textMuted" />
          <input type="text" placeholder="কোম্পানি বা নোট খুঁজুন..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full outline-none text-sm bg-transparent" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center text-da-textMuted mt-10 text-sm font-bold">কোনো বোনাস এন্ট্রি পাওয়া যায়নি</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredEntries.map(entry => (
              <div 
                key={entry.id} 
                onClick={() => { setSelectedEntry(entry); setIsDetailModalOpen(true); }}
                className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-da-depotBg rounded-lg flex items-center justify-center text-da-depotBlue shrink-0">
                    <Gift size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[13px] text-da-textDark truncate">{entry.company_name}</h3>
                    <p className="text-[10px] text-da-textMuted mt-0.5">{entry.date} {entry.note ? `• ${entry.note}` : ''}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="font-black text-[13px] text-da-depotBlue">{entry.items.length} আইটেম</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Bonus Modal (Full Screen) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-da-depotBg z-[100] flex flex-col w-full">
          <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0 shadow-md">
            <h2 className="font-bold text-base flex items-center gap-2"><Gift size={20}/> নতুন বোনাস এন্ট্রি</h2>
            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white/20 rounded-full"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কোম্পানি *</label>
                  <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue">
                    <option value="">সিলেক্ট করুন</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">তারিখ</label>
                  <input type="date" value={bonusDate} onChange={e => setBonusDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">পণ্য নির্বাচন করুন</label>
                
                {/* সার্চ বার */}
                <div className="bg-white border border-da-cardBorder rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue mb-2">
                  <Search size={16} className="text-da-textMuted" />
                  <input type="text" placeholder="পণ্য খুঁজুন..." value={productSearchQuery} onChange={e => setProductSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
                </div>

                <div className="grid grid-cols-2 gap-2 p-1">
                  {products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).map(p => (
                    <div key={p.id} onClick={() => handleAddToCart(p)} className="bg-white border border-da-cardBorder rounded-lg p-2 flex items-center justify-between cursor-pointer active:scale-95 transition shadow-sm">
                      <div className="min-w-0 pr-1">
                        <h4 className="text-[11px] font-bold text-da-textDark truncate">{p.name}</h4>
                        <span className="text-[9px] text-da-textMuted">স্টক: {toBangla(p.stock_quantity || p.stock)}</span>
                      </div>
                      <span className="text-[10px] bg-da-depotBlue/10 text-da-depotBlue px-1.5 py-0.5 rounded font-bold shrink-0">+</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div className="border border-da-cardBorder rounded-lg overflow-hidden">
                  <div className="bg-da-depotBg p-2 text-[10px] font-bold text-da-textMuted border-b border-da-cardBorder">সিলেক্টেড পণ্য</div>
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border-b border-da-cardBorder last:border-0 text-xs">
                      <span className="font-bold text-da-textDark truncate">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1" value={item.qty} onChange={e => setCart(cart.map(c => c.id === item.id ? { ...c, qty: parseInt(e.target.value) || 1 } : c))} className="w-10 text-center border border-da-cardBorder rounded py-1 outline-none" />
                        <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-da-red"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট (ঐচ্ছিক)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue" placeholder="যেমন: গাড়িপ্রতি ১০ বস্তা ফ্রি" />
              </div>
            </div>

            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-da-cardBorder text-da-textMuted py-2 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2 rounded-xl font-bold shadow-md flex justify-center items-center">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedEntry && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80dvh]">
            <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><FileText size={16}/> বোনাসের বিস্তারিত</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-2 overflow-y-auto">
              <div className="bg-da-depotBg p-3 rounded-lg border border-da-cardBorder">
                <p className="text-[10px] font-bold text-da-textMuted">কোম্পানি</p>
                <p className="font-bold text-sm text-da-textDark">{selectedEntry.company_name}</p>
                <p className="text-[10px] text-da-textMuted mt-1">{selectedEntry.date}</p>
                {selectedEntry.note && <p className="text-xs text-da-textDark mt-1 border-t border-da-cardBorder pt-1">নোট: {selectedEntry.note}</p>}
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="text-[10px] font-bold text-da-textMuted">পণ্যের লিস্ট</p>
                {selectedEntry.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-da-cardBorder">
                    <span className="font-bold text-xs text-da-textDark">{item.product_name}</span>
                    <span className="font-black text-xs text-da-depotBlue">{toBangla(item.quantity)} পিস</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg shrink-0">
              <button onClick={() => setIsDetailModalOpen(false)} className="w-full bg-da-depotNavy text-white py-2 rounded-xl font-bold">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}