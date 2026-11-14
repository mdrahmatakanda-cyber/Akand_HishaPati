import { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, UserPlus, Printer, Share2, ArrowUpRight, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    const fetchDetails = async () => {
      if (!transactionId && !isDemoMode) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (isDemoMode) {
          const demoData = {
            receiptNo: type === 'purchase' ? 'JTMPBC953J7J20P' : 'GVMTQX7S4WGR89W',
            amount: type === 'purchase' ? 280 : 2050,
            date: '07 November 2026 | 10:56 AM',
            paymentType: 'নগদ টাকা',
            paymentStatus: 'পরিশোধিত',
            discount: 0,
            deliveryCharge: 0,
            partyName: type === 'purchase' ? 'ভাই ভাই এগ্রো' : 'করিম মিয়া',
            partyBalance: 0,
            note: 'ডেমু নোট',
            items: [
              { name: type === 'purchase' ? 'তুলা' : 'গ্রোয়ার ফিড', qty: 1, rate: type === 'purchase' ? 280 : 2050, image_url: '' }
            ]
          };
          setData(demoData);

          // ডেমু রিসিপ্ট ডেটা তৈরি
          setReceiptData({
            invoiceNo: demoData.receiptNo,
            date: demoData.date,
            status: demoData.paymentStatus === 'পরিশোধিত' ? 'Paid' : 'Due',
            shopName: activeBusiness?.name || 'DREAM AGRO',
            shopAddress: (activeBusiness as any)?.address || 'গাজীপুর, ঢাকা',
            shopPhone: (activeBusiness as any)?.phone || '01752005057',
            shopEmail: (activeBusiness as any)?.email || 'support@hishabpati.com',
            customerName: demoData.partyName,
            proprietor: 'N/A',
            customerPhone: 'N/A',
            customerAddress: 'N/A',
            marketName: 'N/A',
            officerName: user?.user_metadata?.name || user?.email || 'অফিসার',
            officerPhone: user?.user_metadata?.phone || 'N/A',
            officerEmail: user?.email || 'N/A',
            receiptTime: demoData.date,
            vehicleNo: 'N/A',
            driverName: 'N/A',
            driverPhone: 'N/A',
            transportRent: demoData.deliveryCharge,
            items: demoData.items.map((i: any) => ({
              id: Math.random().toString(),
              name: i.name,
              category: 'সাধারণ',
              quantity: i.qty,
              unit: 'পিস',
              unitPrice: i.rate,
              totalPrice: i.qty * i.rate
            })),
            totalBags: 0,
            totalPieces: demoData.items.reduce((acc: number, curr: any) => acc + curr.qty, 0),
            subtotal: demoData.amount,
            discount: demoData.discount,
            grandTotal: demoData.amount,
            paidAmount: demoData.amount,
            dueAmount: 0,
            paidInWords: numberToWordsBn(demoData.amount),
            shopDescription: 'ক্রয়বিক্রয় ও পরিষেবা',
            tableNote: '* ডেলিভারির সময় পণ্যের বস্তা ও ওজন সঠিকভাবে বুঝে নেওয়া হলো।',
            footerText1: 'ধন্যবাদ!',
            footerText2: 'Powered by Hishabpati',
            note: demoData.note
          });

        } else {
          const table = type === 'purchase' ? 'purchases' : 'sales';
          const itemsTable = type === 'purchase' ? 'purchase_items' : 'sale_items';
          const dateCol = type === 'purchase' ? 'purchase_date' : 'sale_date';
          const partyCol = type === 'purchase' ? 'suppliers(*)' : 'customers(*)';
          
          // ডাটাবেস থেকে সম্পূর্ণ তথ্য আনা (কাস্টমার/সাপ্লায়ার এবং প্রোডাক্ট ডিটেইলস সহ)
          const { data: dbData, error } = await supabase
            .from(table)
            .select(`*, ${partyCol}, ${itemsTable}(quantity, rate, total, products(name, image_url, unit, categories(name)))`)
            .eq('id', transactionId)
            .single();

          if (error) throw error;

          if (dbData) {
            const d = new Date(dbData[dateCol]);
            const partyData = type === 'purchase' ? dbData.suppliers : dbData.customers;
            const itemsData = type === 'purchase' ? dbData.purchase_items : dbData.sale_items;
            const formattedDate = d.toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            const mappedData = {
              receiptNo: dbData.receipt_no || dbData.challan_no || dbData.id.substring(0, 8).toUpperCase(),
              amount: Number(dbData.total_amount),
              date: formattedDate,
              paymentType: dbData.payment_method === 'cash' ? 'নগদ টাকা' : 'বাকি',
              paymentStatus: Number(dbData.due_amount) <= 0 ? 'পরিশোধিত' : 'বাকি আছে',
              discount: Number(dbData.discount) || 0,
              deliveryCharge: Number(dbData.delivery_charge) || 0,
              partyName: partyData?.name || 'দেওয়া হয়নি',
              partyBalance: Number(partyData?.due_balance) || 0,
              note: dbData.note || '',
              items: itemsData?.map((i: any) => ({
                name: i.products?.name || 'পণ্য নেই',
                qty: Number(i.quantity),
                rate: Number(i.rate),
                image_url: i.products?.image_url || ''
              })) || []
            };
            setData(mappedData);

            // 📄 রিসিপ্ট মডালের জন্য সম্পূর্ণ ডেটা ম্যাপিং
            setReceiptData({
              invoiceNo: mappedData.receiptNo,
              date: formattedDate,
              status: mappedData.paymentStatus === 'পরিশোধিত' ? 'Paid' : 'Due',
              shopName: activeBusiness?.name || 'DREAM AGRO',
              shopAddress: (activeBusiness as any)?.address || 'N/A',
              shopPhone: (activeBusiness as any)?.phone || 'N/A',
              shopEmail: (activeBusiness as any)?.email || 'N/A',
              customerName: partyData?.name || 'সাধারণ কাস্টমার',
              proprietor: partyData?.proprietor || 'N/A',
              customerPhone: partyData?.phone || 'N/A',
              customerAddress: partyData?.address || 'N/A',
              marketName: partyData?.market_name || 'N/A',
              officerName: user?.user_metadata?.name || user?.email || 'অফিসার',
              officerPhone: user?.user_metadata?.phone || 'N/A',
              officerEmail: user?.email || 'N/A',
              receiptTime: formattedDate,
              vehicleNo: dbData.vehicle_no || 'N/A',
              driverName: dbData.driver_name || 'N/A',
              driverPhone: dbData.driver_phone || 'N/A',
              transportRent: Number(dbData.delivery_charge) || 0,
              items: itemsData?.map((i: any) => ({
                id: i.id || Math.random().toString(),
                name: i.products?.name || 'পণ্য',
                category: i.products?.categories?.name || 'সাধারণ',
                quantity: Number(i.quantity),
                unit: i.products?.unit || 'পিস',
                unitPrice: Number(i.rate),
                totalPrice: Number(i.total)
              })) || [],
              totalBags: 0,
              totalPieces: itemsData?.reduce((acc: number, curr: any) => acc + Number(curr.quantity), 0) || 0,
              subtotal: Number(dbData.total_amount) + Number(dbData.discount) - Number(dbData.delivery_charge),
              discount: Number(dbData.discount) || 0,
              grandTotal: Number(dbData.total_amount),
              paidAmount: Number(dbData.paid_amount),
              dueAmount: Number(dbData.due_amount),
              paidInWords: numberToWordsBn(Number(dbData.paid_amount)),
              shopDescription: 'ক্রয়বিক্রয় ও পরিষেবা',
              tableNote: '* ডেলিভারির সময় পণ্যের বস্তা ও ওজন সঠিকভাবে বুঝে নেওয়া হলো।',
              footerText1: 'ধন্যবাদ!',
              footerText2: 'Powered by Hishabpati',
              note: dbData.note || ''
            });
          }
        }
      } catch (error) {
        console.error("Details fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [transactionId, type, isDemoMode, activeBusiness?.id, user]);

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
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">{type === 'purchase' ? 'ক্রয়ের বিবরণ' : 'বিক্রির বিবরণ'}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-6">
        
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
            <button className="flex-1 bg-[#1E88E5] text-white font-bold py-2 rounded-lg text-sm shadow-sm active:scale-95 transition">এডিট করুন</button>
            <button className="flex-1 bg-[#1E88E5] text-white font-bold py-2 rounded-lg text-sm shadow-sm active:scale-95 transition">রিটান</button>
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

      {/* ✅ ৪. গ্লোবাল রিসিপ্ট মডাল */}
      <ReceiptModal 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
        onCancel={() => setIsReceiptOpen(false)}
        onFinalize={() => setIsReceiptOpen(false)} 
        isSaving={false}
        data={receiptData} 
      />
    </div>
  );
}