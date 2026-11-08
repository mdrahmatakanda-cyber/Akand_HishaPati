import { useState } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, ChevronLeft, ChevronRight, 
  CalendarDays, TrendingUp, ShoppingBag, Box, Users, 
  UserSquare2, ArrowDownUp, Wallet, Truck, Banknote, 
  RotateCcw, ChevronDown, ChevronUp, PlusCircle, MinusCircle 
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

export default function ReportsPage({ onBack }: Props) {
  const [activeFilter, setActiveFilter] = useState('month');
  const [dateRange, setDateRange] = useState('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬');
  const [showAllReports, setShowAllReports] = useState(true);

  const reportItems = [
    { title: 'বিক্রির রিপোর্ট', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'ক্রয়ের রিপোর্ট', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'স্টকের রিপোর্ট', icon: Box, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'পণ্য রিপোর্ট', icon: Box, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'সেরা কাস্টমার', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'সেরা কর্মচারী', icon: UserSquare2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'লাভ ক্ষতি রিপোর্ট', icon: ArrowDownUp, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'খরচের রিপোর্ট', icon: Wallet, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'সাপ্লায়ার রিপোর্ট', icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { title: 'আয়ের রিপোর্ট', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'বেচার রিটাইল রিপোর্ট', icon: RotateCcw, color: 'text-pink-600', bg: 'bg-pink-100' },
    { title: 'কেনার রিটাইল রিপোর্ট', icon: RotateCcw, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">ব্যবসার রিপোর্ট</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><FileText size={18} /></button>
            <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-6">
        
        {/* টপ ফিল্টার */}
        <div className="bg-[#1E88E5] text-white p-3 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-blue-100">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => { setActiveFilter('day'); setDateRange('০৭ নভেম্বর, ২৬'); }} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => { setActiveFilter('month'); setDateRange('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬'); }} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => { setActiveFilter('year'); setDateRange('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬'); }} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setDateRange('সব সময়'); }} />
          <button onClick={() => setActiveFilter('custom')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        <div className="p-2 flex flex-col gap-3">
          {/* আয় ও ব্যয় বাটন */}
          <div className="grid grid-cols-2 gap-2">
            <button className="border border-green-500 text-green-600 bg-green-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"><PlusCircle size={16}/> আয় যোগ করুন</button>
            <button className="border border-red-500 text-red-600 bg-red-50 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"><MinusCircle size={16}/> ব্যয় যোগ করুন</button>
          </div>

          {/* মোট বাকির হিসাব */}
          <div className="bg-[#F3F4F6] rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#E8ECEB] p-2 flex justify-between items-center border-b border-gray-200">
              <span className="font-bold text-sm">মোট বাকির হিসাব</span>
              <span className="font-black text-red-500 text-sm">{toBangla(0)} ৳</span>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2">
              <div className="bg-[#0B5C47] text-white p-2 rounded-lg text-center">
                <p className="text-[11px] font-bold">সাপ্লায়ারকে দিবো</p>
                <p className="font-black text-base mt-1">{toBangla(0)} ৳</p>
              </div>
              <div className="bg-[#DC2626] text-white p-2 rounded-lg text-center">
                <p className="text-[11px] font-bold">কাস্টমার থেকে পাবো</p>
                <p className="font-black text-base mt-1">{toBangla(0)} ৳</p>
              </div>
            </div>
          </div>

          {/* সাধারণ বিক্রি রিপোর্ট */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
             <div className="bg-[#F3F4F6] p-2.5 font-bold border-b border-gray-200">সাধারণ বিক্রি রিপোর্ট</div>
             <div className="p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <div><p className="font-bold text-gray-700">নগদ বেচা</p><p className="text-[10px] text-gray-500">(কাস্টমার বাকি বাদে)</p></div>
                  <span className="font-bold text-green-600">{toBangla(100)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">কাস্টমার থেকে বাকির টাকা পেয়েছেন</p>
                  <span className="font-bold text-green-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">অন্যান্য আয়</p>
                  <span className="font-bold text-green-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <div><p className="font-bold text-gray-700">নগদ কেনা</p><p className="text-[10px] text-gray-500">(সাপ্লায়ার বাকি বাদে)</p></div>
                  <span className="font-bold text-red-600">{toBangla(980)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">সাপ্লায়ারকে বাকির টাকা দিয়েছেন</p>
                  <span className="font-bold text-red-600">{toBangla(0)} ৳</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <p className="font-bold text-gray-700">অন্যান্য খরচ</p>
                  <span className="font-bold text-red-600">{toBangla(0)} ৳</span>
                </div>
             </div>
             <div className="bg-[#F3F4F6] p-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-gray-800">সর্বমোট ব্যালেন্স</p>
                  <span className="font-black text-red-600 text-base">-{toBangla(880)} ৳</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">(মোট বিক্রি + কাস্টমার বাকি + অন্যান্য আয়) - (মোট কেনা + সাপ্লায়ার বাকি + অন্যান্য খরচ)</p>
                
                <p className="font-bold text-gray-800">পণ্য বিক্রি থেকে লাভ</p>
                <p className="text-[10px] text-gray-500 mb-2">(বিক্রিত পণ্যের বিক্রয় - ক্রয় মূল্য)</p>
                <div className="grid grid-cols-3 divide-x divide-gray-300 text-center bg-white rounded-lg border py-1">
                   <div><p className="text-[10px] text-gray-500">নগদ টাকা</p><p className="font-bold text-sm text-green-600">{toBangla(30)} ৳</p></div>
                   <div><p className="text-[10px] text-gray-500">বাকি</p><p className="font-bold text-sm text-red-600">{toBangla(0)} ৳</p></div>
                   <div><p className="text-[10px] text-gray-500">মোট</p><p className="font-bold text-sm text-gray-800">{toBangla(30)} ৳</p></div>
                </div>
             </div>
          </div>

          {/* ব্যবসার সকল রিপোর্ট গ্রিড */}
          <div className="bg-[#F3F4F6] rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div onClick={() => setShowAllReports(!showAllReports)} className="p-2.5 flex justify-between items-center cursor-pointer">
              <span className="font-bold text-base">ব্যবসার সকল রিপোর্ট</span>
              {showAllReports ? <ChevronUp size={20} className="text-gray-600"/> : <ChevronDown size={20} className="text-gray-600"/>}
            </div>
            
            {showAllReports && (
              <div className="p-2.5 grid grid-cols-3 gap-2 bg-white border-t border-gray-200">
                {reportItems.map((item, idx) => (
                  <button key={idx} onClick={() => alert(`${item.title} ওপেন হলো`)} className="flex flex-col items-center justify-center p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition bg-white active:scale-95">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color} mb-1.5`}>
                       <item.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}>
      {title}
    </button>
  );
}