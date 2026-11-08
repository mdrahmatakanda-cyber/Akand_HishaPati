import { ArrowLeft, Image as ImageIcon, UserPlus, Printer, Share2, ArrowUpRight } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface DetailsProps {
  onBack: () => void;
  type?: 'purchase' | 'sale';
}

export default function TransactionDetailsPage({ onBack, type = 'purchase' }: DetailsProps) {
  // ডেমু ডাটা (বাস্তবে আপনি প্রপ্স বা স্টেট থেকে ডাটা নিবেন)
  const receiptNo = "JTMPBC953J7J20P";
  const amount = 280;
  const date = "07 November 2026 | 10:56 AM";
  const paymentType = "নগদ টাকা";
  const itemName = "তুলা";
  const itemQty = 1;
  const itemPrice = 280;

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">{type === 'purchase' ? 'ক্রয়ের বিবরণ' : 'বিক্রির বিবরণ'}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-6">
        
        {/* টপ ইনফো কার্ড */}
        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex justify-between items-start shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-gray-800">{receiptNo}</h3>
            <p className="text-[11px] text-gray-600 mt-0.5">মূল্য পরিশোধ পদ্ধতি: {paymentType}</p>
            <p className="text-[11px] text-gray-500 mt-1">{toBangla(date)}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-black text-lg">{toBangla(amount)} ৳</span>
            <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center mt-2">
              <ImageIcon size={16} className="text-gray-500" />
            </div>
          </div>
        </div>

        {/* সাপ্লায়ার/কাস্টমার কার্ড */}
        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
          <span className="text-sm text-gray-600 font-medium">
            {type === 'purchase' ? 'সাপ্লায়ার:' : 'কাস্টমার:'} [দেওয়া হয়নি]
          </span>
          <button className="text-[#1E88E5]"><UserPlus size={20} /></button>
        </div>

        {/* পণ্যের লিস্ট */}
        <div className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 shadow-sm">
          <h3 className="font-bold text-sm text-gray-800 mb-2">ক্রয় করা পণ্যের লিস্ট</h3>
          
          <div className="bg-white rounded-lg p-2 flex items-center justify-between border border-gray-200 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                <ImageIcon size={14} className="text-gray-400" />
              </div>
              <span className="font-bold text-sm">{itemName}</span>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="text-gray-500">X{toBangla(itemQty)}</span>
              <span>{toBangla(itemPrice)} ৳</span>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-[#1E88E5] text-white font-bold py-2 rounded-lg text-sm shadow-sm active:scale-95 transition">এডিট করুন</button>
            <button className="flex-1 bg-[#1E88E5] text-white font-bold py-2 rounded-lg text-sm shadow-sm active:scale-95 transition">রিটান</button>
          </div>
        </div>

        {/* সামারি (টোটাল) */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>মোট</span>
            <span>{toBangla(amount)} ৳</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ডেলিভারি চার্জ</span>
            <span>{toBangla(0)} ৳</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>ডিসকাউন্ট</span>
            <span>{toBangla(0)} ৳</span>
          </div>
          <hr className="my-1 border-gray-200" />
          <div className="flex justify-between font-black text-base text-gray-800">
            <span>সর্বমোট</span>
            <span>{toBangla(amount)} ৳</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>পেমেন্ট অবস্থা</span>
            <span className="text-green-600">পরিশোধিত</span>
          </div>
        </div>

        {/* সাপ্লায়ার ব্যালেন্স */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex justify-between items-center">
          <span className="font-bold text-sm text-gray-800">{type === 'purchase' ? 'সাপ্লায়ার' : 'কাস্টমার'} ব্যালেন্স</span>
          <div className="flex items-center gap-2 text-[#1E88E5] font-bold">
            <span>{toBangla(0)}</span>
            <ArrowUpRight size={18} />
          </div>
        </div>

        {/* প্রিন্ট ও শেয়ার বাটন */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition">
            <Printer size={20} className="text-gray-700" />
            <span className="font-bold text-xs text-gray-700">রিসিপ্ট প্রিন্ট করুন</span>
          </button>
          <button className="bg-[#F3F4F6] border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition">
            <Share2 size={20} className="text-gray-700" />
            <span className="font-bold text-xs text-gray-700">রিসিপ্ট শেয়ার</span>
          </button>
        </div>

        {/* নোট */}
        <div className="bg-white border border-gray-300 rounded-xl p-2.5 shadow-sm mt-1">
          <label className="text-[11px] text-gray-500 font-bold mb-1 block">নোট</label>
          <p className="text-sm">{itemName}</p>
        </div>

      </main>
    </div>
  );
}