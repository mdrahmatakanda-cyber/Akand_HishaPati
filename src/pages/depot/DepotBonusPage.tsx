import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Search, Loader2, X, Gift, 
  Trash2, FileText, ArrowDownLeft, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { toBangla } from '../../lib/utils';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { demoBonusEntries, demoProducts, demoCompaniesList } from '../../lib/demoData';
import { showAppToast } from '../../components/PremiumToast';

interface Props {
  onBack: () => void;
}

export default function DepotBonusPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, businesses } = useAuth();

  const [activeTab, setActiveTab] = useState<'inward' | 'outward'>('inward');
  const [entries, setEntries] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // ফর্ম স্টেট
  const [modalType, setModalType] = useState<'inward' | 'outward'>('inward');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [bonusDate, setBonusDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setEntries(demoBonusEntries.map((e: any, idx: number) => ({
          ...e,
          entry_type: idx % 2 === 0 ? 'inward' : 'outward',
          party_name: idx % 2 === 0 ? (e.company_name || 'নিউজা') : 'মেসার্স ভাই ভাই ট্রেডার্স',
        })));
        setProducts(demoProducts.map((p: any) => ({
          ...p,
          company: p.company || 'সাধারণ',
          stockQty: p.stock || 50
        })));
        setCompanies(demoCompaniesList || []);
        setDealers([{ id: 'd1', name: 'মেসার্স ভাই ভাই ট্রেডার্স' }, { id: 'd2', name: 'করিম স্টোর' }]);
      } else {
        if (!activeBusiness?.id) return;
        const bizId = activeBusiness.id;
        const allBizIds = businesses.length > 0 ? businesses.map(b => b.id) : [bizId];

        // ✅ সব বিজনেস থেকে সেন্ট্রাল পণ্য ও কোম্পানি এবং বর্তমান ডিপোর বোনাস ও ডিলার লোড
        const [entryRes, prodRes, compRes, dealRes] = await Promise.all([
          supabase
            .from('bonus_entries')
            .select('*, bonus_items(product_id, quantity, products(name))')
            .eq('business_id', bizId)
            .is('deleted_at', null)
            .order('date', { ascending: false }),
          supabase.from('products').select('id, name, depot_stock_quantity, stock_quantity, company_id').in('business_id', allBizIds),
          supabase.from('companies').select('id, name').in('business_id', allBizIds),
          supabase.from('dealers').select('id, name').eq('business_id', bizId).is('deleted_at', null)
        ]);

        const compList = compRes.data || [];
        const dealList = dealRes.data || [];
        if (compRes.data) setCompanies(compList);
        if (dealRes.data) setDealers(dealList);

        if (prodRes.data) {
          setProducts(prodRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            company: compList.find((c: any) => c.id === p.company_id)?.name || 'সাধারণ',
            stockQty: Number(p.depot_stock_quantity ?? p.stock_quantity ?? 0)
          })));
        }

        if (entryRes.data) {
          setEntries(entryRes.data.map((e: any) => ({
            id: e.id,
            entry_type: e.entry_type || 'inward',
            company_id: e.company_id,
            dealer_id: e.dealer_id,
            party_name: e.entry_type === 'outward'
              ? (dealList.find((d: any) => d.id === e.dealer_id)?.name || 'ডিলার')
              : (compList.find((c: any) => c.id === e.company_id)?.name || 'কোম্পানি'),
            date: new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            rawDate: new Date(e.date).getTime(),
            note: e.note,
            items: e.bonus_items?.map((i: any) => ({
              product_id: i.product_id,
              product_name: i.products?.name || 'পণ্য',
              quantity: Number(i.quantity || 0)
            })) || []
          })));
        }
      }
    } catch (error: any) {
      showAppToast('ডাটা লোড করতে সমস্যা: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode, activeBusiness?.id, businesses.length]);

  const handleAddToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleSave = async () => {
    if (modalType === 'inward' && !selectedCompany) return showAppToast('কোম্পানি সিলেক্ট করুন', 'error');
    if (modalType === 'outward' && !selectedDealer) return showAppToast('ডিলার সিলেক্ট করুন', 'error');
    if (cart.length === 0) return showAppToast('অন্তত একটি বোনাস পণ্য যোগ করুন', 'error');

    setIsSaving(true);
    try {
      if (isDemoMode) {
        const party = modalType === 'inward'
          ? (companies.find(c => c.id === selectedCompany)?.name || 'কোম্পানি')
          : (dealers.find(d => d.id === selectedDealer)?.name || 'ডিলার');

        const newEntry = {
          id: Date.now().toString(),
          entry_type: modalType,
          party_name: party,
          date: new Date(bonusDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          note: note,
          items: cart.map(c => ({ product_id: c.id, product_name: c.name, quantity: c.qty }))
        };
        setEntries([newEntry, ...entries]);
      } else if (activeBusiness?.id) {
        // ১. bonus_entries টেবিলে এন্ট্রি তৈরি
        const { data: newEntry, error: entryErr } = await supabase.from('bonus_entries').insert([{
          business_id: activeBusiness.id,
          entry_type: modalType,
          company_id: modalType === 'inward' ? selectedCompany : null,
          dealer_id: modalType === 'outward' ? selectedDealer : null,
          date: bonusDate,
          note: note
        }]).select().single();

        if (entryErr) throw entryErr;

        // ২. bonus_items ও ডিপো স্টক আপডেট
        for (const item of cart) {
          await supabase.from('bonus_items').insert([{
            bonus_entry_id: newEntry.id,
            product_id: item.id,
            quantity: item.qty
          }]);

          // ✅ কোম্পানি থেকে পেলে ডিপো স্টক বাড়বে (+), ডিলারকে দিলে ডিপো স্টক কমবে (-)
          const qtyDiff = modalType === 'inward' ? Number(item.qty) : -Number(item.qty);
          const currentProd = products.find(p => p.id === item.id);
          const currentStock = Number(currentProd?.stockQty || 0);
          const nextStock = Math.max(0, currentStock + qtyDiff);

          await supabase.from('products').update({ depot_stock_quantity: nextStock }).eq('id', item.id);
        }

        await fetchData();
      }

      showAppToast(modalType === 'inward' ? 'কোম্পানি বোনাস সফলভাবে যোগ হয়েছে!' : 'ডিলার বোনাস সফলভাবে বিতরণ হয়েছে!', 'success');
      setIsAddModalOpen(false);
      setSelectedCompany('');
      setSelectedDealer('');
      setNote('');
      setCart([]);
      setProductSearchQuery('');
      setBonusDate(new Date().toISOString().split('T')[0]);
    } catch (error: any) {
      showAppToast("সমস্যা: " + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteConfirmId) return;
    try {
      if (!isDemoMode) {
        const entry = entries.find(e => e.id === deleteConfirmId);
        // রিভার্স স্টক সমন্বয়
        if (entry?.items) {
          for (const it of entry.items) {
            const currentProd = products.find(p => p.id === it.product_id);
            const curStock = Number(currentProd?.stockQty || 0);
            const reverseQty = entry.entry_type === 'inward' ? -Number(it.quantity) : Number(it.quantity);
            await supabase.from('products').update({ depot_stock_quantity: Math.max(0, curStock + reverseQty) }).eq('id', it.product_id);
          }
        }
        await supabase.from('bonus_entries').update({ deleted_at: new Date().toISOString() }).eq('id', deleteConfirmId);
        await fetchData();
      } else {
        setEntries(prev => prev.filter(e => e.id !== deleteConfirmId));
      }
      showAppToast('বোনাস এন্ট্রি সফলভাবে ডিলিট হয়েছে!', 'success');
      setDeleteConfirmId(null);
      setIsDetailModalOpen(false);
    } catch (err: any) {
      showAppToast('ডিলিট করতে সমস্যা: ' + err.message, 'error');
    }
  };

  const totalInwardBags = entries.filter(e => e.entry_type === 'inward').reduce((sum, e) => sum + e.items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0), 0);
  const totalOutwardBags = entries.filter(e => e.entry_type === 'outward').reduce((sum, e) => sum + e.items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0), 0);
  const surplusBags = totalInwardBags - totalOutwardBags;

  const filteredEntries = entries.filter(e => {
    const matchTab = e.entry_type === activeTab;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (e.party_name && e.party_name.toLowerCase().includes(q)) || (e.note && e.note.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  return (
    <div className="h-[100dvh] bg-da-depotBg text-da-textDark font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-da-depotNavy text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ডিপো বোনাস খাতা</h1>
          </div>
          <button
            onClick={() => {
              setModalType(activeTab);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1 bg-da-depotBlue px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition"
          >
            <Plus size={16} /> + বোনাস যোগ
          </button>
        </div>

        {/* ২-ট্যাব: কোম্পানি থেকে প্রাপ্তি বনাম ডিলারকে বিতরণ */}
        <div className="flex px-3 pb-2 gap-2">
          <button
            onClick={() => setActiveTab('inward')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'inward' ? 'bg-white text-da-depotNavy shadow-sm' : 'bg-white/10 text-white/80'}`}
          >
            <ArrowDownLeft size={15} /> কোম্পানি থেকে প্রাপ্ত ({toBangla(entries.filter(e => e.entry_type === 'inward').length)})
          </button>
          <button
            onClick={() => setActiveTab('outward')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'outward' ? 'bg-white text-da-depotNavy shadow-sm' : 'bg-white/10 text-white/80'}`}
          >
            <ArrowUpRight size={15} /> ডিলারকে বিতরণ ({toBangla(entries.filter(e => e.entry_type === 'outward').length)})
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24">
        {/* ৩টি সামারি কার্ড */}
        <div className="grid grid-cols-3 gap-1.5 shrink-0">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-emerald-800">মোট প্রাপ্ত বোনাস</span>
            <span className="font-black text-sm text-emerald-700 mt-0.5">+{toBangla(totalInwardBags)} পিস</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-red-800">মোট বিতরণ বোনাস</span>
            <span className="font-black text-sm text-red-600 mt-0.5">-{toBangla(totalOutwardBags)} পিস</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-blue-800">ডিপোর নিট লাভ</span>
            <span className="font-black text-sm text-da-depotBlue mt-0.5">{toBangla(surplusBags)} পিস</span>
          </div>
        </div>

        <div className="bg-white border border-da-cardBorder rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue shrink-0">
          <Search size={18} className="text-da-textMuted" />
          <input
            type="text"
            placeholder={activeTab === 'inward' ? "কোম্পানি বা নোট খুঁজুন..." : "ডিলার বা নোট খুঁজুন..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-10"><Loader2 className="animate-spin text-da-depotBlue" size={32}/></div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center text-da-textMuted mt-10 text-sm font-bold">
            {activeTab === 'inward' ? 'কোম্পানি থেকে কোনো বোনাস এন্ট্রি পাওয়া যায়নি' : 'ডিলারদের কোনো বোনাস বিতরণের তথ্য পাওয়া যায়নি'}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredEntries.map(entry => {
              const totalQty = entry.items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);
              return (
                <div 
                  key={entry.id} 
                  onClick={() => { setSelectedEntry(entry); setIsDetailModalOpen(true); }}
                  className="bg-white p-3 rounded-xl border border-da-cardBorder shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform hover:bg-blue-50/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${entry.entry_type === 'inward' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {entry.entry_type === 'inward' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-[13px] text-da-textDark truncate">{entry.party_name}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${entry.entry_type === 'inward' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.entry_type === 'inward' ? 'প্রাপ্তি (+)' : 'বিতরণ (-)'}
                        </span>
                      </div>
                      <p className="text-[10px] text-da-textMuted mt-0.5">{entry.date} {entry.note ? `• ${entry.note}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2 flex items-center gap-1.5">
                    <div>
                      <p className={`font-black text-[13px] ${entry.entry_type === 'inward' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {entry.entry_type === 'inward' ? '+' : '-'}{toBangla(totalQty)} পিস
                      </p>
                      <span className="text-[9px] text-da-textMuted">{entry.items.length}টি পণ্য</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Bonus Modal (Full Screen) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-da-depotBg z-[100] flex flex-col w-full animate-in slide-in-from-bottom duration-300">
          <div className="bg-da-depotNavy p-3 flex justify-between items-center text-white shrink-0 shadow-md">
            <h2 className="font-bold text-base flex items-center gap-2">
              <Gift size={20}/> {modalType === 'inward' ? 'কোম্পানি থেকে বোনাস প্রাপ্তি' : 'ডিলারকে বোনাস বিতরণ'}
            </h2>
            <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 bg-white/20 rounded-full"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {/* ইনওয়ার্ড বনাম আউটওয়ার্ড নির্বাচন */}
            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-da-cardBorder">
              <button
                type="button"
                onClick={() => setModalType('inward')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${modalType === 'inward' ? 'bg-[#0B5C47] text-white shadow-sm' : 'text-gray-600'}`}
              >
                <ArrowDownLeft size={15} /> কোম্পানি থেকে প্রাপ্তি (+)
              </button>
              <button
                type="button"
                onClick={() => setModalType('outward')}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${modalType === 'outward' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600'}`}
              >
                <ArrowUpRight size={15} /> ডিলারকে বিতরণ (-)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {modalType === 'inward' ? (
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">কোম্পানি নির্বাচন *</label>
                  <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-white">
                    <option value="">-- কোম্পানি সিলেক্ট --</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-da-textMuted mb-1 block">ডিলার নির্বাচন *</label>
                  <select value={selectedDealer} onChange={e => setSelectedDealer(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-white">
                    <option value="">-- ডিলার সিলেক্ট --</option>
                    {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-da-textMuted mb-1 block">তারিখ</label>
                <input type="date" value={bonusDate} onChange={e => setBonusDate(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-white" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-da-textMuted">বোনাস পণ্য নির্বাচন করুন (সেন্ট্রাল লিস্ট)</label>
                <span className="text-[10px] text-da-depotBlue font-bold">{modalType === 'inward' ? 'ডিপো স্টক বাড়বে (+)' : 'ডিপো স্টক কমবে (-)'}</span>
              </div>
              
              <div className="bg-white border border-da-cardBorder rounded-lg px-2.5 py-2 flex items-center gap-2 shadow-sm focus-within:border-da-depotBlue mb-2">
                <Search size={16} className="text-da-textMuted" />
                <input type="text" placeholder="পণ্যের নাম বা কোম্পানি খুঁজুন..." value={productSearchQuery} onChange={e => setProductSearchQuery(e.target.value)} className="w-full outline-none text-xs bg-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 max-h-52 overflow-y-auto">
                {products
                  .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || (p.company && p.company.toLowerCase().includes(productSearchQuery.toLowerCase())))
                  .map(p => (
                    <div key={p.id} onClick={() => handleAddToCart(p)} className="bg-white border border-da-cardBorder rounded-lg p-2 flex items-center justify-between cursor-pointer active:scale-95 transition shadow-sm">
                      <div className="min-w-0 pr-1">
                        <h4 className="text-[11px] font-bold text-da-textDark truncate">{p.name}</h4>
                        <p className="text-[9px] font-bold text-[#0D3B80] truncate">{p.company || 'সাধারণ'}</p>
                        <span className="text-[9px] text-da-textMuted">ডিপো স্টক: {toBangla(p.stockQty)}</span>
                      </div>
                      <span className="text-[11px] bg-da-depotBlue/10 text-da-depotBlue px-2 py-1 rounded font-bold shrink-0">+</span>
                    </div>
                  ))}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="border border-da-cardBorder rounded-lg overflow-hidden bg-white mt-2">
                <div className="bg-da-depotBg p-2 text-[10px] font-bold text-da-textMuted border-b border-da-cardBorder">সিলেক্টেড বোনাস পণ্য ও পরিমাণ</div>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 border-b border-da-cardBorder last:border-0 text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-da-textDark truncate block">{item.name}</span>
                      <span className="text-[9px] text-da-textMuted">{item.company}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input type="number" min="1" value={item.qty} onChange={e => setCart(cart.map(c => c.id === item.id ? { ...c, qty: parseInt(e.target.value) || 1 } : c))} className="w-14 text-center border border-da-cardBorder rounded py-1 font-bold text-da-depotBlue outline-none" />
                      <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-da-red"><Trash2 size={15}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-1">
              <label className="text-[11px] font-bold text-da-textMuted mb-1 block">নোট (ঐচ্ছিক)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full border border-da-cardBorder rounded-lg p-2 text-sm outline-none focus:border-da-depotBlue bg-white" placeholder="যেমন: গাড়িপ্রতি ১০ বস্তা ফ্রি স্কিম" />
            </div>
          </div>

          <div className="p-3 border-t border-da-cardBorder bg-white flex gap-2 shrink-0">
            <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-da-depotBg border border-da-cardBorder text-da-textMuted py-2.5 rounded-xl font-bold">বাতিল</button>
            <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-da-depotBlue text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center">
              {isSaving ? <Loader2 size={16} className="animate-spin"/> : 'সেভ করুন'}
            </button>
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
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] font-bold text-da-textMuted">{selectedEntry.entry_type === 'inward' ? 'কোম্পানি' : 'ডিলার'}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${selectedEntry.entry_type === 'inward' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedEntry.entry_type === 'inward' ? 'কোম্পানি থেকে প্রাপ্ত' : 'ডিলারকে বিতরণ'}
                  </span>
                </div>
                <p className="font-bold text-sm text-da-textDark">{selectedEntry.party_name}</p>
                <p className="text-[10px] text-da-textMuted mt-1">তারিখ: {selectedEntry.date}</p>
                {selectedEntry.note && <p className="text-xs text-da-textDark mt-1 border-t border-da-cardBorder pt-1">নোট: {selectedEntry.note}</p>}
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="text-[10px] font-bold text-da-textMuted">বোনাস পণ্যের লিস্ট</p>
                {selectedEntry.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-da-cardBorder">
                    <span className="font-bold text-xs text-da-textDark">{item.product_name}</span>
                    <span className="font-black text-xs text-da-depotBlue">{toBangla(item.quantity)} পিস</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 border-t border-da-cardBorder bg-da-depotBg flex gap-2 shrink-0">
              <button
                onClick={() => setDeleteConfirmId(selectedEntry.id)}
                className="bg-red-50 text-red-600 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
              >
                <Trash2 size={14} /> ডিলিট
              </button>
              <button onClick={() => setIsDetailModalOpen(false)} className="flex-1 bg-da-depotNavy text-white py-2 rounded-xl font-bold text-xs">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ডিলিট কনফার্মেশন */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl p-4 text-center">
            <h3 className="font-bold text-sm text-gray-800 mb-1">বোনাস এন্ট্রি ডিলিট করবেন?</h3>
            <p className="text-xs text-gray-500 mb-4">ডিলিট করলে এই মালের স্টক পূর্বের অবস্থায় ফিরে যাবে।</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-white border py-2 rounded-xl font-bold text-xs">বাতিল</button>
              <button onClick={handleDeleteEntry} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-xs">ডিলিট করুন</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}