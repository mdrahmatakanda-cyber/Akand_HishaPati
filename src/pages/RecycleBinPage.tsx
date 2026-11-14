import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, HelpCircle, Search, Trash2,
  RotateCcw, AlertTriangle, FileText, ShoppingBag,
  Package, Users, Truck, ChevronDown, Loader2,
  Banknote, X, ArrowRightLeft, RefreshCw, Info, Building2,
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { demoDeletedItems } from '../lib/demoData';
import PremiumToast from '../components/PremiumToast';

interface Props {
  onBack: () => void;
}

export const RECYCLE_TYPES: Record<
  string,
  { label: string; icon: any; table: string; nameField: string; amountField?: string }
> = {
  Sale:      { label: 'বিক্রি',      icon: FileText,        table: 'sales',     nameField: 'invoice_no',   amountField: 'grand_total' },
  Purchase:  { label: 'ক্রয়',         icon: ShoppingBag,     table: 'purchases', nameField: 'invoice_no',   amountField: 'grand_total' },
  Product:   { label: 'প্রোডাক্ট',   icon: Package,         table: 'products',  nameField: 'name' },
  Customer:  { label: 'কাস্টমার',   icon: Users,           table: 'customers', nameField: 'name' },
  Supplier:  { label: 'সাপ্লায়ার',   icon: Truck,           table: 'suppliers', nameField: 'name' },
  Expense:   { label: 'খরচ',         icon: Banknote,        table: 'expenses',  nameField: 'expense_type', amountField: 'amount' },
  Dealer:    { label: 'ডিলার',       icon: Users,           table: 'dealers',   nameField: 'name' },
  Depot:     { label: 'ডিপো',         icon: Building2,       table: 'depots',    nameField: 'name' },
  Company:   { label: 'কোম্পানি',    icon: Building2,       table: 'companies', nameField: 'name' },
  Transfer:  { label: 'ট্রান্সফার',   icon: ArrowRightLeft, table: '', nameField: '' },
  Partner:   { label: 'পার্টনার',     icon: Users,           table: 'partners',  nameField: 'name' },
  Officer:   { label: 'অফিসার',       icon: Users,           table: 'employees', nameField: 'name' },
};

type TransferCfg = {
  nameFn: (row: any) => string;
  fetchRows: (bizId: string) => Promise<any[]>;
};

const TRANSFER_TABLES: Record<string, TransferCfg> = {
  dealer_transfers: {
    nameFn: (r) =>
      r.challan_no
        ? `চালান # ${r.challan_no}`
        : `ডিলার ট্রান্সফার #${String(r.id).slice(0, 6).toUpperCase()}`,
    fetchRows: async (bizId) => {
      const { data } = await supabase
        .from('dealer_transfers')
        .select('*')
        .eq('business_id', bizId)
        .not('deleted_at', 'is', null);
      return data || [];
    },
  },
  internal_transfers: {
    nameFn: (r) =>
      r.vehicle_no
        ? `অভ্যন্তরীণ ট্রান্সফার (গাড়ি: ${r.vehicle_no})`
        : `অভ্যন্তরীণ ট্রান্সফার #${String(r.id).slice(0, 6).toUpperCase()}`,
    fetchRows: async (bizId) => {
      const { data } = await supabase
        .from('internal_transfers')
        .select('*')
        .eq('business_id', bizId)
        .not('deleted_at', 'is', null);
      return data || [];
    },
  },
  depot_transfers: {
    nameFn: (r) =>
      r.driver_name
        ? `ডিপো ট্রান্সফার (ড্রাইভার: ${r.driver_name})`
        : `ডিপো ট্রান্সফার #${String(r.id).slice(0, 6).toUpperCase()}`,
    fetchRows: async (bizId) => {
      const { data: depots } = await supabase
        .from('depots')
        .select('id')
        .eq('business_id', bizId);
      const depotIds = (depots || []).map((d: any) => d.id);
      if (!depotIds.length) return [];
      const inClause = depotIds.join(',');
      const { data } = await supabase
        .from('depot_transfers')
        .select('*')
        .or(`from_depot_id.in.(${inClause}),to_depot_id.in.(${inClause})`)
        .not('deleted_at', 'is', null);
      return data || [];
    },
  },
};

export default function RecycleBinPage({ onBack }: Props) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness } = useAuth();

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ show: true, message, type });

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  /* ============== FETCH ============== */
  const fetchDeletedItems = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        setItems(
          demoDeletedItems.map((it: any) => ({
            ...it,
            rawDeletedAt: new Date(it.deletedAt).getTime(),
          }))
        );
      } else {
        if (!activeBusiness?.id) { setItems([]); return; }
        const bizId = activeBusiness.id;
        const simpleTypes = Object.entries(RECYCLE_TYPES).filter(([_, c]) => c.table);

        const results = await Promise.all([
          ...simpleTypes.map(async ([type, cfg]) => {
            try {
              const { data, error } = await supabase
                .from(cfg.table)
                .select('*')
                .eq('business_id', bizId)
                .not('deleted_at', 'is', null);
              if (error) return [];
              return (data || []).map((row: any) => ({
                id: row.id,
                type,
                sourceTable: cfg.table,
                name: row[cfg.nameField] || row.id,
                amount: cfg.amountField ? Number(row[cfg.amountField] || 0) : 0,
                deletedAt: row.deleted_at,
                rawDeletedAt: new Date(row.deleted_at).getTime(),
              }));
            } catch { return []; }
          }),
          ...Object.entries(TRANSFER_TABLES).map(async ([tbl, cfg]) => {
            try {
              const rows = await cfg.fetchRows(bizId);
              return rows.map((row: any) => ({
                id: row.id,
                type: 'Transfer',
                sourceTable: tbl,
                name: cfg.nameFn(row),
                amount: 0,
                deletedAt: row.deleted_at,
                rawDeletedAt: new Date(row.deleted_at).getTime(),
              }));
            } catch { return []; }
          }),
        ]);
        setItems(results.flat().sort((a, b) => b.rawDeletedAt - a.rawDeletedAt));
      }
    } catch (err: any) {
      showToast('ডাটা লোডে সমস্যা: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedItems();
  }, [isDemoMode, activeBusiness?.id]);

  /* ============== FILTER ============== */
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const cfg = RECYCLE_TYPES[item.type];
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        String(item.name).toLowerCase().includes(q) ||
        (cfg?.label || '').toLowerCase().includes(q) ||
        (item.type || '').toLowerCase().includes(q);
      const matchFilter = filterType === 'All' || item.type === filterType;
      return matchSearch && matchFilter;
    });
  }, [items, searchQuery, filterType]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((i) => { c[i.type] = (c[i.type] || 0) + 1; });
    return c;
  }, [items]);

  const formatDate = (val: string | number) => {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  /* ============== ACTIONS ============== */
  const handleRestore = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      if (!isDemoMode && activeBusiness?.id) {
        const table = selectedItem.sourceTable || RECYCLE_TYPES[selectedItem.type]?.table;
        if (table) {
          const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', selectedItem.id);
          if (error) throw error;

          // যদি টাইপ 'Partner' হয়, তবে তার লেনদেনগুলোও রিস্টোর করুন
          if (selectedItem.type === 'Partner') {
            await supabase
              .from('partner_transactions')
              .update({ deleted_at: null })
              .eq('partner_id', selectedItem.id);
          }

          // ✅ যদি টাইপ 'Officer' হয়, তবে তার লেনদেনগুলোও রিস্টোর করুন
          if (selectedItem.type === 'Officer') {
            await supabase
              .from('officer_transactions')
              .update({ deleted_at: null })
              .eq('employee_id', selectedItem.id);
          }
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      showToast(`"${selectedItem.name}" সম্পূর্ণ তথ্যসহ পুনরুদ্ধার হয়েছে!`, 'success');
      setIsRestoreModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      showToast('সমস্যা: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      if (!isDemoMode && activeBusiness?.id) {
        const table = selectedItem.sourceTable || RECYCLE_TYPES[selectedItem.type]?.table;
        if (table) {
          // যদি পার্টনার হয়, তবে তার ট্রানজেকশন আগে ডিলিট করুন
          if (selectedItem.type === 'Partner') {
            await supabase
              .from('partner_transactions')
              .delete()
              .eq('partner_id', selectedItem.id);
          }

          // ✅ যদি অফিসার হয়, তবে তার ট্রানজেকশন আগে ডিলিট করুন
          if (selectedItem.type === 'Officer') {
            await supabase
              .from('officer_transactions')
              .delete()
              .eq('employee_id', selectedItem.id);
          }

          const { error } = await supabase.from(table).delete().eq('id', selectedItem.id);
          if (error) throw error;
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      showToast('ডাটা স্থায়ীভাবে মুছে ফেলা হয়েছে!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      showToast('সমস্যা: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    setIsProcessing(true);
    try {
      if (!isDemoMode && activeBusiness?.id) {
        const groups = items.reduce<Record<string, string[]>>((acc, it) => {
          const t = it.sourceTable || RECYCLE_TYPES[it.type]?.table;
          if (t) (acc[t] = acc[t] || []).push(it.id);
          return acc;
        }, {});
        for (const [table, ids] of Object.entries(groups)) {
          if (!ids.length) continue;
          const { error } = await supabase.from(table).delete().in('id', ids);
          if (error) throw error;
        }
      }
      setItems([]);
      showToast('রিসাইকেল বিন খালি করা হয়েছে!', 'success');
      setIsClearAllModalOpen(false);
    } catch (err: any) {
      showToast('সমস্যা: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /* ============== RENDER ============== */
  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      <PremiumToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">রিসাইকেল বিন</h1>
          </div>
          <div className="flex gap-1.5">
            <button onClick={fetchDeletedItems} disabled={isLoading} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setIsHelpOpen(true)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-8">
        {/* কন্ট্রোল প্যানেল */}
        <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm flex flex-col gap-2 shrink-0">
          <div className="flex items-center bg-[#F3F4F6] border border-gray-300 rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="ডিলিট করা ডাটা খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent text-gray-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-700"><X size={14} /></button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[#F3F4F6] border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none appearance-none font-bold text-gray-700 pr-8"
              >
                <option value="All">সব ডাটা ({toBangla(items.length)})</option>
                {Object.entries(RECYCLE_TYPES).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label} ({toBangla(typeCounts[key] || 0)})
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {items.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="bg-red-50 text-red-600 border border-red-200 px-3 rounded-lg font-bold text-xs shadow-sm active:scale-95 transition flex items-center gap-1 shrink-0"
              >
                <Trash2 size={14} /> সব মুছুন
              </button>
            )}
          </div>
        </div>

        {/* স্ট্যাটাস */}
        <div className="flex justify-between items-center px-1 text-xs font-bold text-gray-500">
          <span>দেখানো হচ্ছে: {toBangla(filteredItems.length)} / {toBangla(items.length)} টি</span>
          {filterType !== 'All' && (
            <button onClick={() => setFilterType('All')} className="text-[#1E88E5] underline text-[11px]">ফিল্টার রিসেট</button>
          )}
        </div>

        {/* লিস্ট */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#0B5C47]" />
            <p className="text-xs font-bold mt-2">লোড হচ্ছে...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center mt-6 bg-white/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={40} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-700 text-base">
              {items.length === 0 ? 'রিসাইকেল বিন খালি' : 'কোনো মিল পাওয়া যায়নি'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {items.length === 0
                ? 'আপনার কোনো ডিলিট করা ডাটা এখানে নেই।'
                : 'সার্চ বা ফিল্টার পরিবর্তন করে দেখুন।'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredItems.map((item) => {
              const cfg = RECYCLE_TYPES[item.type];
              const Icon = cfg?.icon || FileText;
              return (
                <div key={`${item.sourceTable || item.type}-${item.id}`} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 shrink-0">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-wide">
                          {cfg?.label || item.type}
                        </p>
                      </div>
                    </div>
                    {item.amount > 0 && (
                      <span className="font-bold text-sm text-gray-700 shrink-0 pl-2">৳ {toBangla(item.amount)}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-[10px] text-gray-500 font-medium">ডিলিট: {formatDate(item.deletedAt)}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setSelectedItem(item); setIsRestoreModalOpen(true); }}
                        className="bg-[#EFF6FF] text-[#1E88E5] border border-[#1E88E5] px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                      >
                        <RotateCcw size={12} /> পুনরুদ্ধার
                      </button>
                      <button
                        onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }}
                        className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 active:scale-95 transition"
                      >
                        <Trash2 size={12} /> মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========== হেল্প মডাল ========== */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Info size={16} /> রিসাইকেল বিন — সাহায্য</h2>
              <button onClick={() => setIsHelpOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-4 text-xs text-gray-700 flex flex-col gap-2.5 leading-relaxed">
              <p><strong>রিসাইকেল বিন কী?</strong> অন্যান্য পেজ থেকে ডিলিট করা ডাটা (বিক্রি, ক্রয়, প্রোডাক্ট ইত্যাদি) সাময়িকভাবে এখানে জমা থাকে।</p>
              <p><strong>পুনরুদ্ধার:</strong> ডাটাটি আবার মূল জায়গায় ফিরিয়ে আনা হয় (soft-restore)।</p>
              <p><strong>স্থায়ীভাবে মুছুন:</strong> ডাটাবেস থেকে চিরতরে মুছে যায় — আর ফেরানো যাবে না।</p>
              <p><strong>সব মুছুন:</strong> রিসাইকেল বিনের সব ডাটা একবারে স্থায়ীভাবে মুছে ফেলে।</p>
              <p className="text-[11px] text-gray-500 italic">টিপস: সার্চ ও ফিল্টার দিয়ে দ্রুত নির্দিষ্ট ডাটা খুঁজে বের করুন।</p>
            </div>
            <div className="p-3 border-t bg-gray-50">
              <button onClick={() => setIsHelpOpen(false)} className="w-full bg-[#0B5C47] text-white py-2 rounded-xl font-bold text-sm">বুঝেছি</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== পুনরুদ্ধার কনফার্মেশন ========== */}
      {isRestoreModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                <RotateCcw size={28} />
              </div>
              <h2 className="font-bold text-lg text-gray-800">পুনরুদ্ধার করবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">
                আপনি কি <strong>{selectedItem.name}</strong> ডাটাটি পুনরুদ্ধার করতে চান?
              </p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => { setIsRestoreModalOpen(false); setSelectedItem(null); }}
                disabled={isProcessing}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm disabled:opacity-50"
              >বাতিল</button>
              <button
                onClick={handleRestore}
                disabled={isProcessing}
                className="flex-1 bg-[#1E88E5] text-white py-2 rounded-xl font-bold shadow-md text-sm flex justify-center items-center gap-1.5 disabled:opacity-60"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} হ্যাঁ, করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== স্থায়ী ডিলিট কনফার্মেশন ========== */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 animate-pulse">
                <AlertTriangle size={28} />
              </div>
              <h2 className="font-bold text-lg text-red-600">স্থায়ীভাবে মুছবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">
                <strong>{selectedItem.name}</strong> ডাটাটি চিরতরে মুছে যাবে এবং আর কখনো ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => { setIsDeleteModalOpen(false); setSelectedItem(null); }}
                disabled={isProcessing}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm disabled:opacity-50"
              >বাতিল</button>
              <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold shadow-md text-sm flex justify-center items-center gap-1.5 disabled:opacity-60"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== সব মুছুন কনফার্মেশন ========== */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3 animate-pulse">
                <Trash2 size={28} />
              </div>
              <h2 className="font-bold text-lg text-red-600">সব মুছে ফেলবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">
                রিসাইকেল বিনের সব ডাটা (মোট {toBangla(items.length)} টি) স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isProcessing}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-bold shadow-sm text-sm disabled:opacity-50"
              >বাতিল</button>
              <button
                onClick={handleClearAll}
                disabled={isProcessing}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold shadow-md text-sm flex justify-center items-center gap-1.5 disabled:opacity-60"
              >
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : 'হ্যাঁ, সব মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}