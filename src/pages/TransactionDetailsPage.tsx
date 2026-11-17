import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, UserPlus, Printer, Share2, ArrowUpRight, Loader2, Trash2, Edit3, RotateCcw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toBangla, numberToWordsBn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ReceiptModal, type ReceiptData } from './ReceiptModal'; // নতুন ইম্পোর্ট

interface DetailsProps {
  onBack: () => void;
  type?: 'purchase' | 'sale';
  transactionId?: string | null;
}

export default function TransactionDetailsPage({ onBack, type = 'purchase', transactionId }: DetailsProps) {
  const { isDemoMode } = useAppContext();
  const { activeBusiness, user } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 📄 রিসিপ্ট মডালের স্টেট
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // ✅ এডিট, ডিলিট ও রিটার্ন স্টেট
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [editForm, setEditForm] = useState<{
    items: { id: string; productId: string; name: string; oldQty: number; qty: string; rate: string; stockQty: number }[];
    discount: string;
    deliveryCharge: string;
    paidAmount: string;
    note: string;
  }>({ items: [], discount: '0', deliveryCharge: '0', paidAmount: '0', note: '' });

  const [returnForm, setReturnForm] = useState({
    itemIndex: 0,
    quantity: '',
    amount: '',
    isDamaged: false,
    note: ''
  });

  const buildReceiptFromData = (mapped: any, partyData?: any, itemsList?: any[]): ReceiptData => {
    const items = (itemsList || mapped.items || []).map((i: any, idx: number) => ({
      id: String(i.id || idx),
      name: i.name || i.products?.name || 'পণ্য',
      category: i.category || i.products?.categories?.name || 'সাধারণ',
      quantity: Number(i.qty ?? i.quantity ?? 0),
      unit: i.unit || i.products?.unit || 'পিস',
      unitPrice: Number(i.rate ?? 0),
      totalPrice: Number(i.total ?? (Number(i.qty ?? i.quantity ?? 0) * Number(i.rate ?? 0))),
    }));
    const totalQty = items.reduce((a: number, c: any) => a + c.quantity, 0);
    const totalBags = items.filter((i: any) => i.unit?.includes('বস্তা')).reduce((a: number, c: any) => a + c.quantity, 0);
    const subtotal = Number(mapped.amount) + Number(mapped.discount || 0) - Number(mapped.deliveryCharge || 0);
    const paid = Number(mapped.paidAmount ?? mapped.amount ?? 0);

    return {
      type,
      invoiceNo: mapped.receiptNo,
      date: mapped.date,
      status: mapped.paymentStatus,
      shopName: activeBusiness?.name || 'DREAM AGRO',
      shopAddress: (activeBusiness as any)?.address || '',
      shopPhone: (activeBusiness as any)?.phone || '',
      shopEmail: (activeBusiness as any)?.email || '',
      customerName: partyData?.name || mapped.partyName || 'সাধারণ',
      proprietor: partyData?.proprietor || 'N/A',
      customerPhone: partyData?.phone || 'N/A',
      customerAddress: partyData?.address || 'N/A',
      marketName: partyData?.market_name || 'N/A',
      officerName: user?.user_metadata?.name || user?.email || 'অফিসার',
      officerPhone: user?.user_metadata?.phone || 'N/A',
      officerEmail: user?.email || 'N/A',
      receiptTime: mapped.date,
      vehicleNo: mapped.vehicleNo || 'N/A',
      driverName: mapped.driverName || 'N/A',
      driverPhone: mapped.driverPhone || 'N/A',
      transportRent: Number(mapped.deliveryCharge) || 0,
      deliveryCharge: Number(mapped.deliveryCharge) || 0,
      items,
      totalBags,
      totalPieces: totalQty - totalBags,
      subtotal,
      discount: Number(mapped.discount) || 0,
      grandTotal: Number(mapped.amount),
      paidAmount: paid,
      dueAmount: Number(mapped.dueAmount ?? 0),
      paidInWords: numberToWordsBn(paid),
      note: mapped.note || ''
    };
  };

  const fetchDetails = async () => {
    if (!transactionId && !isDemoMode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode) {
        const demoData = {
          receiptNo: type === 'purchase' ? 'PUR-001' : 'INV-001',
          amount: type === 'purchase' ? 50000 : 5000,
          paidAmount: type === 'purchase' ? 50000 : 5000,
          dueAmount: 0,
          date: '17 November 2026 | 10:56 AM',
          paymentType: 'নগদ টাকা',
          paymentStatus: 'পরিশোধিত',
          discount: 0,
          deliveryCharge: 0,
          partyId: null,
          partyName: type === 'purchase' ? 'নিউজা' : 'রহিম এন্টারপ্রাইজ',
          partyBalance: 0,
          note: 'ডেমো নোট',
          items: [
            { id: 'd1', productId: 'p1', name: type === 'purchase' ? 'স্টার্টার ফিড (৫০ কেজি)' : 'গ্রোয়ার ফিড', qty: 10, rate: type === 'purchase' ? 5000 : 500, unit: 'বস্তা', stockQty: 100, image_url: '' }
          ]
        };
        setData(demoData);
        setReceiptData(buildReceiptFromData(demoData));
      } else {
        const table = type === 'purchase' ? 'purchases' : 'sales';
        const itemsTable = type === 'purchase' ? 'purchase_items' : 'sale_items';
        const dateCol = type === 'purchase' ? 'purchase_date' : 'sale_date';
        const partyCol = type === 'purchase' ? 'suppliers(*)' : 'customers(*)';

        const { data: dbData, error } = await supabase
          .from(table)
          .select(`*, ${partyCol}, ${itemsTable}(id, product_id, quantity, rate, total, products(id, name, image_url, unit, stock_quantity, categories(name)))`)
          .eq('id', transactionId)
          .single();

        if (error) throw error;

        if (dbData) {
          const d = new Date(dbData[dateCol] || dbData.created_at);
          const partyData = type === 'purchase' ? dbData.suppliers : dbData.customers;
          const itemsData = type === 'purchase' ? dbData.purchase_items : dbData.sale_items;
          const formattedDate = d.toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          const totalAmt = Number(dbData.total_amount ?? dbData.grand_total ?? 0);
          const paidAmt = Number(dbData.paid_amount ?? totalAmt);
          const dueAmt = Number(dbData.due_amount ?? Math.max(0, totalAmt - paidAmt));

          const mappedData = {
            receiptNo: dbData.receipt_no || dbData.challan_no || dbData.invoice_no || dbData.id.substring(0, 8).toUpperCase(),
            amount: totalAmt,
            paidAmount: paidAmt,
            dueAmount: dueAmt,
            date: formattedDate,
            paymentType: dbData.payment_method === 'cash' ? 'নগদ টাকা' : 'বাকি',
            paymentStatus: dueAmt <= 0 ? 'পরিশোধিত' : 'বাকি আছে',
            discount: Number(dbData.discount) || 0,
            deliveryCharge: Number(dbData.delivery_charge) || 0,
            partyId: type === 'purchase' ? dbData.supplier_id : dbData.customer_id,
            partyName: partyData?.name || 'দেওয়া হয়নি',
            partyBalance: Number(partyData?.due_balance) || 0,
            vehicleNo: dbData.vehicle_no || 'N/A',
            driverName: dbData.driver_name || 'N/A',
            driverPhone: dbData.driver_phone || 'N/A',
            note: dbData.note || '',
            items: itemsData?.map((i: any) => ({
              id: i.id,
              productId: i.product_id || i.products?.id || '',
              name: i.products?.name || 'পণ্য নেই',
              qty: Number(i.quantity),
              rate: Number(i.rate),
              unit: i.products?.unit || 'পিস',
              stockQty: Number(i.products?.stock_quantity ?? 0),
              image_url: i.products?.image_url || ''
            })) || []
          };
          setData(mappedData);
          setReceiptData(buildReceiptFromData(mappedData, partyData, mappedData.items));
        }
      }
    } catch (error) {
      console.error("Details fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [transactionId, type, isDemoMode, activeBusiness?.id, user]);

  const openEditModal = () => {
    if (!data) return;
    setEditForm({
      items: data.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        oldQty: Number(i.qty),
        qty: String(i.qty),
        rate: String(i.rate),
        stockQty: Number(i.stockQty || 0),
      })),
      discount: String(data.discount || 0),
      deliveryCharge: String(data.deliveryCharge || 0),
      paidAmount: String(data.paidAmount ?? data.amount ?? 0),
      note: data.note || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!data) return;
    setIsProcessing(true);
    try {
      const newSubtotal = editForm.items.reduce((sum, i) => sum + ((Number(i.qty) || 0) * (Number(i.rate) || 0)), 0);
      const disc = Number(editForm.discount) || 0;
      const deliv = Number(editForm.deliveryCharge) || 0;
      const paid = Number(editForm.paidAmount) || 0;
      const newTotal = Math.max(0, newSubtotal - disc + deliv);
      const newDue = Math.max(0, newTotal - paid);

      if (isDemoMode) {
        const updated = {
          ...data,
          amount: newTotal,
          paidAmount: paid,
          dueAmount: newDue,
          discount: disc,
          deliveryCharge: deliv,
          paymentStatus: newDue <= 0 ? 'পরিশোধিত' : 'বাকি আছে',
          note: editForm.note,
          items: data.items.map((it: any, idx: number) => ({
            ...it,
            qty: Number(editForm.items[idx]?.qty) || 0,
            rate: Number(editForm.items[idx]?.rate) || 0,
          }))
        };
        setData(updated);
        setReceiptData(buildReceiptFromData(updated));
      } else {
        const table = type === 'purchase' ? 'purchases' : 'sales';
        const itemsTable = type === 'purchase' ? 'purchase_items' : 'sale_items';
        const partyTable = type === 'purchase' ? 'suppliers' : 'customers';

        for (const it of editForm.items) {
          const nQty = Number(it.qty) || 0;
          const nRate = Number(it.rate) || 0;
          if (it.id) {
            const { error: iErr } = await supabase.from(itemsTable).update({ quantity: nQty, rate: nRate, total: nQty * nRate }).eq('id', it.id);
            if (iErr) throw iErr;
          }
          const qtyDiff = nQty - it.oldQty;
          if (it.productId && qtyDiff !== 0) {
            const nextStock = type === 'sale' ? Math.max(0, it.stockQty - qtyDiff) : Math.max(0, it.stockQty + qtyDiff);
            await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', it.productId);
          }
        }

        const { error: tErr } = await supabase.from(table).update({
          total_amount: newTotal,
          discount: disc,
          delivery_charge: deliv,
          paid_amount: paid,
          due_amount: newDue,
          note: editForm.note
        }).eq('id', transactionId);
        if (tErr) throw tErr;

        const dueDiff = newDue - Number(data.dueAmount || 0);
        if (data.partyId && dueDiff !== 0) {
          await supabase.from(partyTable).update({ due_balance: Math.max(0, Number(data.partyBalance || 0) + dueDiff) }).eq('id', data.partyId);
        }

        await fetchDetails();
      }

      setShowEditModal(false);
      setActionMsg({ text: 'তথ্য সফলভাবে আপডেট হয়েছে!', type: 'success' });
    } catch (err: any) {
      setActionMsg({ text: 'আপডেট করতে সমস্যা হয়েছে: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!data) return;
    setIsProcessing(true);
    try {
      if (!isDemoMode && transactionId) {
        const table = type === 'purchase' ? 'purchases' : 'sales';
        const partyTable = type === 'purchase' ? 'suppliers' : 'customers';

        for (const it of data.items) {
          if (it.productId && Number(it.qty) > 0) {
            const nextStock = type === 'sale'
              ? Number(it.stockQty || 0) + Number(it.qty)
              : Math.max(0, Number(it.stockQty || 0) - Number(it.qty));
            await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', it.productId);
          }
        }

        if (data.partyId && Number(data.dueAmount || 0) > 0) {
          await supabase.from(partyTable).update({ due_balance: Math.max(0, Number(data.partyBalance || 0) - Number(data.dueAmount)) }).eq('id', data.partyId);
        }

        const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', transactionId);
        if (error) throw error;
      }
      setShowDeleteModal(false);
      onBack();
    } catch (err: any) {
      setActionMsg({ text: 'ডিলিট করতে সমস্যা হয়েছে: ' + err.message, type: 'error' });
      setIsProcessing(false);
    }
  };

  const openReturnModal = () => {
    if (!data || !data.items.length) return;
    const first = data.items[0];
    setReturnForm({
      itemIndex: 0,
      quantity: '1',
      amount: String(first.rate || 0),
      isDamaged: false,
      note: ''
    });
    setShowReturnModal(true);
  };

  const handleSaveReturn = async () => {
    if (!data) return;
    const item = data.items[returnForm.itemIndex];
    const retQty = Number(returnForm.quantity) || 0;
    const retAmt = Number(returnForm.amount) || 0;
    if (!item || retQty <= 0 || retQty > Number(item.qty) || retAmt <= 0) {
      setActionMsg({ text: 'সঠিক রিটার্ন পরিমাণ ও টাকা দিন', type: 'error' });
      return;
    }

    setIsProcessing(true);
    try {
      const returnLog = `[রিটার্ন: ${item.name} × ${retQty} = ৳${retAmt}${returnForm.isDamaged ? ' (ড্যামেজ)' : ''}${returnForm.note ? ` - ${returnForm.note}` : ''}]`;
      const updatedNote = [data.note, returnLog].filter(Boolean).join(' ');
      const newTotal = Math.max(0, Number(data.amount) - retAmt);
      const newDue = Math.max(0, Number(data.dueAmount || 0) - retAmt);

      if (isDemoMode) {
        const updatedItems = data.items.map((it: any, idx: number) => idx === returnForm.itemIndex ? { ...it, qty: Math.max(0, Number(it.qty) - retQty) } : it);
        const updated = { ...data, amount: newTotal, dueAmount: newDue, note: updatedNote, items: updatedItems };
        setData(updated);
        setReceiptData(buildReceiptFromData(updated));
      } else {
        const table = type === 'purchase' ? 'purchases' : 'sales';
        const itemsTable = type === 'purchase' ? 'purchase_items' : 'sale_items';
        const partyTable = type === 'purchase' ? 'suppliers' : 'customers';

        const remainQty = Math.max(0, Number(item.qty) - retQty);
        if (item.id) {
          await supabase.from(itemsTable).update({ quantity: remainQty, total: remainQty * Number(item.rate) }).eq('id', item.id);
        }

        if (!returnForm.isDamaged && item.productId) {
          const nextStock = type === 'sale'
            ? Number(item.stockQty || 0) + retQty
            : Math.max(0, Number(item.stockQty || 0) - retQty);
          await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', item.productId);
        }

        const { error: tErr } = await supabase.from(table).update({
          total_amount: newTotal,
          due_amount: newDue,
          note: updatedNote
        }).eq('id', transactionId);
        if (tErr) throw tErr;

        if (data.partyId) {
          await supabase.from(partyTable).update({ due_balance: Math.max(0, Number(data.partyBalance || 0) - retAmt) }).eq('id', data.partyId);
        }

        await fetchDetails();
      }

      setShowReturnModal(false);
      setActionMsg({ text: `${type === 'purchase' ? 'ক্রয়' : 'বিক্রি'} রিটার্ন সফলভাবে সম্পন্ন হয়েছে!`, type: 'success' });
    } catch (err: any) {
      setActionMsg({ text: 'রিটার্ন করতে সমস্যা হয়েছে: ' + err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-[#EFF6F3] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0B5C47]" size={40} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[100dvh] bg-[#EFF6F3] flex flex-col items-center justify-center">
        <p className="text-gray-500 font-bold mb-4">কোনো তথ্য পাওয়া যায়নি</p>
        <button onClick={onBack} className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg font-bold">ফিরে যান</button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">{type === 'purchase' ? 'ক্রয়ের বিবরণ' : 'বিক্রির বিবরণ'}</h1>
          </div>
          <button onClick={() => setShowDeleteModal(true)} className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg transition text-white flex items-center gap-1 text-xs font-bold px-2.5">
            <Trash2 size={15} /> ডিলিট
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-6">
        {actionMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${actionMsg.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15}/> {actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)}><X size={14}/></button>
          </div>
        )}
        
        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex justify-between items-start shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-gray-800">{data.receiptNo}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">মূল্য পরিশোধ পদ্ধতি: {data.paymentType}</p>
            <p className="text-[11px] text-gray-500 mt-1">{toBangla(data.date)}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-black text-lg">{toBangla(data.amount)} ৳</span>
            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mt-2">
              <ImageIcon size={16} className="text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
          <span className="text-sm text-gray-600 font-medium">
            {type === 'purchase' ? 'সাপ্লায়ার:' : 'কাস্টমার:'} {data.partyName}
          </span>
          <button className="text-[#1E88E5]"><UserPlus size={20} /></button>
        </div>

        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 shadow-sm">
          <h3 className="font-bold text-sm text-gray-800 mb-2">{type === 'purchase' ? 'ক্রয় করা' : 'বিক্রি করা'} পণ্যের লিস্ট</h3>
          
          {data.items.map((item: any, idx: number) => (
            <div key={idx} className="bg-white rounded-lg p-2 flex items-center justify-between border border-gray-200 mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={14} className="text-gray-400" />
                  )}
                </div>
                <span className="font-bold text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className="text-gray-500">X{toBangla(item.qty)}</span>
                <span>{toBangla(item.rate)} ৳</span>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <button onClick={openEditModal} className="flex-1 bg-[#1E88E5] text-white font-bold py-2 rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"><Edit3 size={15}/> এডিট করুন</button>
            <button onClick={openReturnModal} className="flex-1 bg-amber-600 text-white font-bold py-2 rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"><RotateCcw size={15}/> {type === 'purchase' ? 'ক্রয় রিটার্ন' : 'বিক্রি রিটার্ন'}</button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>মোট</span>
            <span>{toBangla(data.amount)} ৳</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ডেলিভারি চার্জ</span>
            <span>{toBangla(data.deliveryCharge)} ৳</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ডিসকাউন্ট</span>
            <span>{toBangla(data.discount)} ৳</span>
          </div>
          <hr className="my-1 border-gray-200" />
          <div className="flex justify-between font-black text-base text-gray-800">
            <span>সর্বমোট</span>
            <span>{toBangla(data.amount)} ৳</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>পেমেন্ট অবস্থা</span>
            <span className={data.paymentStatus === 'পরিশোধিত' ? 'text-green-600' : 'text-red-500'}>{data.paymentStatus}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex justify-between items-center">
          <span className="font-bold text-sm text-gray-800">{type === 'purchase' ? 'সাপ্লায়ার' : 'কাস্টমার'} ব্যালেন্স</span>
          <div className="flex items-center gap-2 text-[#1E88E5] font-bold">
            <span>{toBangla(data.partyBalance)}</span>
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          {/* ✅ প্রিন্ট বাটনে ক্লিক করলে মডাল ওপেন হবে */}
          <button 
            onClick={() => setIsReceiptOpen(true)}
            className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition hover:bg-gray-100"
          >
            <Printer size={20} className="text-gray-700" />
            <span className="font-bold text-xs text-gray-700">রিসিপ্ট প্রিন্ট করুন</span>
          </button>
          
          {/* ✅ শেয়ার বাটনে ক্লিক করলেও একই মডাল ওপেন হবে, যেখানে শেয়ার অপশন আছে */}
          <button 
            onClick={() => setIsReceiptOpen(true)}
            className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition hover:bg-gray-100"
          >
            <Share2 size={20} className="text-gray-700" />
            <span className="font-bold text-xs text-gray-700">রিসিপ্ট শেয়ার</span>
          </button>
        </div>

        {data.note && (
          <div className="bg-white border border-gray-300 rounded-xl p-2.5 shadow-sm mt-1">
            <label className="text-[11px] text-gray-500 font-bold mb-1 block">নোট</label>
            <p className="text-sm">{data.note}</p>
          </div>
        )}

      </main>

      {/* ✅ ৪. গ্লোবাল রিসিপ্ট মডাল (দেখা, প্রিন্ট, PDF ও শেয়ার) */}
      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        onCancel={() => setIsReceiptOpen(false)}
        onFinalize={() => setIsReceiptOpen(false)} 
        isSaving={false}
        previewOnly={true}
        data={receiptData} 
      />

      {/* ================= এডিট মডাল ================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-[130] flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90dvh] shadow-2xl">
            <div className="bg-[#0B5C47] p-3 text-white flex justify-between items-center shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><Edit3 size={16}/> পুরো তথ্য এডিট করুন</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex flex-col gap-3">
              {editForm.items.map((it, idx) => (
                <div key={idx} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <p className="font-bold text-xs text-gray-800">{it.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500">পরিমাণ</label>
                      <input type="number" value={it.qty} onChange={e => setEditForm({ ...editForm, items: editForm.items.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x) })} className="w-full border rounded-lg p-1.5 text-sm font-bold bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500">দর (৳)</label>
                      <input type="number" value={it.rate} onChange={e => setEditForm({ ...editForm, items: editForm.items.map((x, i) => i === idx ? { ...x, rate: e.target.value } : x) })} className="w-full border rounded-lg p-1.5 text-sm font-bold bg-white" />
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] font-bold text-gray-500">ডিসকাউন্ট</label><input type="number" value={editForm.discount} onChange={e => setEditForm({...editForm, discount: e.target.value})} className="w-full border rounded-lg p-2 text-sm" /></div>
                <div><label className="text-[10px] font-bold text-gray-500">ডেলিভারি/ভাড়া</label><input type="number" value={editForm.deliveryCharge} onChange={e => setEditForm({...editForm, deliveryCharge: e.target.value})} className="w-full border rounded-lg p-2 text-sm" /></div>
                <div><label className="text-[10px] font-bold text-gray-500">নগদ জমা</label><input type="number" value={editForm.paidAmount} onChange={e => setEditForm({...editForm, paidAmount: e.target.value})} className="w-full border rounded-lg p-2 text-sm font-bold text-green-700" /></div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500">নোট</label>
                <input type="text" value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2 shrink-0">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-white border py-2.5 rounded-xl font-bold text-sm">বাতিল</button>
              <button onClick={handleSaveEdit} disabled={isProcessing} className="flex-1 bg-[#0B5C47] text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center">{isProcessing ? <Loader2 size={16} className="animate-spin"/> : 'আপডেট সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= রিটার্ন মডাল ================= */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/60 z-[130] flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90dvh] shadow-2xl">
            <div className="bg-amber-600 p-3 text-white flex justify-between items-center shrink-0">
              <h2 className="font-bold text-sm flex items-center gap-2"><RotateCcw size={16}/> {type === 'purchase' ? 'ক্রয় রিটার্ন' : 'বিক্রি রিটার্ন'}</h2>
              <button onClick={() => setShowReturnModal(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">কোন পণ্যটি রিটার্ন হচ্ছে?</label>
                <select
                  value={returnForm.itemIndex}
                  onChange={e => {
                    const idx = Number(e.target.value);
                    const it = data.items[idx];
                    setReturnForm({ ...returnForm, itemIndex: idx, amount: String((Number(returnForm.quantity) || 1) * Number(it?.rate || 0)) });
                  }}
                  className="w-full border rounded-lg p-2 text-sm bg-white"
                >
                  {data.items.map((it: any, idx: number) => (
                    <option key={idx} value={idx}>{it.name} (আছে: {toBangla(it.qty)})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 mb-1 block">রিটার্ন পরিমাণ</label>
                  <input
                    type="number"
                    value={returnForm.quantity}
                    onChange={e => {
                      const q = e.target.value;
                      const rate = Number(data.items[returnForm.itemIndex]?.rate || 0);
                      setReturnForm({ ...returnForm, quantity: q, amount: String((Number(q) || 0) * rate) });
                    }}
                    className="w-full border rounded-lg p-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 mb-1 block">রিটার্ন টাকা (৳)</label>
                  <input type="number" value={returnForm.amount} onChange={e => setReturnForm({...returnForm, amount: e.target.value})} className="w-full border rounded-lg p-2 text-sm font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setReturnForm({...returnForm, isDamaged: false})} className={`py-2 rounded-lg text-xs font-bold border ${!returnForm.isDamaged ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600'}`}>ভালো মাল (স্টকে সমন্বয়)</button>
                <button type="button" onClick={() => setReturnForm({...returnForm, isDamaged: true})} className={`py-2 rounded-lg text-xs font-bold border ${returnForm.isDamaged ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600'}`}>ড্যামেজ মাল</button>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-1 block">রিটার্নের কারণ / নোট</label>
                <input type="text" value={returnForm.note} onChange={e => setReturnForm({...returnForm, note: e.target.value})} placeholder="কারণ লিখুন..." className="w-full border rounded-lg p-2 text-sm" />
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2 shrink-0">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 bg-white border py-2.5 rounded-xl font-bold text-sm">বাতিল</button>
              <button onClick={handleSaveReturn} disabled={isProcessing} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-bold text-sm flex justify-center items-center">{isProcessing ? <Loader2 size={16} className="animate-spin"/> : 'রিটার্ন সেভ করুন'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ডিলিট কনফার্মেশন মডাল ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-[130] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertTriangle size={24} className="text-red-600"/></div>
              <h3 className="font-bold text-base text-gray-800">লেনদেনটি ডিলিট করবেন?</h3>
              <p className="text-xs text-gray-500 mt-1">ডিলিট করলে এই চালানের স্টক ও বাকি ব্যালান্স পূর্বের অবস্থায় ফিরে যাবে।</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} disabled={isProcessing} className="flex-1 bg-white border py-2 rounded-xl font-bold text-sm">বাতিল</button>
              <button onClick={handleDeleteTransaction} disabled={isProcessing} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-sm flex justify-center items-center">{isProcessing ? <Loader2 size={16} className="animate-spin"/> : 'হ্যাঁ, ডিলিট করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}