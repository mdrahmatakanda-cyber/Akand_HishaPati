import { useState, useMemo } from 'react';
import { 
  ArrowLeft, FileText, HelpCircle, Search, 
  ChevronLeft, ChevronRight, CalendarDays, Tag, X, Check
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface SaleKhataProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

// ডেমু ক্যাটাগরি, কোম্পানি ও লেনদেন ডাটা
const allCategories = ['মাছের খাদ্য', 'ঔষধ ও ভিটামিন', 'যন্ত্রপাতি'];
const allCompanies = ['নিউজা', 'প্যারাগন', 'স্কয়ার'];

const initialData = [
  { id: 1, receiptNo: 'GVMTQX7S4WGR89W', amount: 2050, itemNames: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', paymentType: 'নগদ টাকা', date: '2026-11-07', time: '11:32' },
  { id: 2, receiptNo: 'JTMPBC953J7J20P', amount: 350, itemNames: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', paymentType: 'নগদ টাকা', date: '2026-11-07', time: '10:56' },
  { id: 3, receiptNo: 'A64X178X00YJAXZ', amount: 950, itemNames: 'রুই পোনা খাদ্য', category: 'মাছের খাদ্য', company: 'প্যারাগন', paymentType: 'বাকি', date: '2026-11-07', time: '10:55' },
  { id: 4, receiptNo: 'X0C2J8CJXMBGS17', amount: 4500, itemNames: 'অক্সিজেন পাম্প', category: 'যন্ত্রপাতি', company: 'স্কয়ার', paymentType: 'নগদ টাকা', date: '2026-11-06', time: '10:23' },
];

export default function SaleKhataPage({ onBack, onNavigate }: SaleKhataProps) {
  const [activeFilter, setActiveFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬');
  
  // নতুন ফিল্টার স্টেট
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // সার্চ ও ফিল্টার লজিক
  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      const matchSearch = item.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.itemNames.includes(searchQuery) ||
                          item.amount.toString().includes(searchQuery);
      const matchCategory = !selectedCategory || item.category === selectedCategory;
      const matchCompany = !selectedCompany || item.company === selectedCompany;
      
      // ডেমু ডেট ফিল্টার (শুধু নভেম্বর মাসের ডাটা আছে)
      const matchDate = activeFilter === 'all' || item.date.startsWith('2026-11');
      
      return matchSearch && matchCategory && matchCompany && matchDate;
    });
  }, [searchQuery, selectedCategory, selectedCompany, activeFilter]);

  // মোট বিক্রি হিসাব (ফিল্টার করা ডাটার উপর ভিত্তি করে)
  const totalSale = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  // ফিল্টার ক্লিয়ার
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedCompany(null);
    setIsFilterModalOpen(false);
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">বেচার খাতা</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition text-white">
              <FileText size={18} />
            </button>
            <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition text-white">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col pb-6 scrollbar-hide">
        
        {/* সামারি কার্ড */}
        <div className="bg-[#1E88E5] text-white p-3 pb-4 rounded-2xl shadow-md mx-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={20} /></button>
            <span className="text-xs font-medium text-blue-100">{toBangla(dateRange)}</span>
            <button className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight size={20} /></button>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-bold text-blue-100">মোট বিক্রি</p>
            <p className="text-2xl font-black mt-1">{toBangla(totalSale)} ৳</p>
          </div>
        </div>

        {/* ডেট ফিল্টার */}
        <div className="flex gap-2 px-2 mt-3 overflow-x-auto scrollbar-hide py-1 flex-nowrap shrink-0">
          <FilterButton title="দিন" isActive={activeFilter === 'day'} onClick={() => { setActiveFilter('day'); setDateRange('০৭ নভেম্বর, ২৬'); }} />
          <FilterButton title="মাস" isActive={activeFilter === 'month'} onClick={() => { setActiveFilter('month'); setDateRange('০১ নভেম্বর, ২৬ - ৩০ নভেম্বর, ২৬'); }} />
          <FilterButton title="বছর" isActive={activeFilter === 'year'} onClick={() => { setActiveFilter('year'); setDateRange('০১ জানুয়ারী, ২৬ - ৩১ ডিসেম্বর, ২৬'); }} />
          <FilterButton title="সব সময়" isActive={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); setDateRange('সব সময়'); }} />
          <button onClick={() => setActiveFilter('custom')} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${activeFilter === 'custom' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}>
            <CalendarDays size={14} /> কাস্টম
          </button>
        </div>

        {/* সার্চ ও অ্যাডভান্সড ফিল্টার বার */}
        <div className="px-2 mt-2 flex gap-2 shrink-0">
          <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47] transition-colors">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="অনুসন্ধান করুন (নাম, রিসিপ্ট)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent placeholder-gray-400" 
            />
          </div>
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3 border rounded-xl shadow-sm flex items-center justify-center transition ${(selectedCategory || selectedCompany) ? 'bg-[#E8F5E9] border-[#0B5C47] text-[#0B5C47]' : 'bg-white border-gray-300 text-gray-600'}`}
          >
            <Tag size={18}/>
          </button>
        </div>

        {/* রিসিপ্ট লিস্ট */}
        <div className="p-2 flex flex-col gap-2 mt-1">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onNavigate('sale_details')}
                className="bg-[#F3F4F6] rounded-xl p-3 border border-gray-200 shadow-sm relative cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-gray-800">রিসিপ্ট #{item.receiptNo}</h3>
                    <p className="text-[11px] text-gray-600 truncate mt-0.5">{item.itemNames}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[9px] font-bold text-[#0B5C47] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#A5D6A7]">{item.category}</span>
                      <span className="text-[9px] font-bold text-[#1E88E5] bg-[#EFF6FF] px-1.5 py-0.5 rounded border border-[#B5D2F3]">{item.company}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <p className="font-black text-lg text-gray-800">{toBangla(item.amount)} ৳</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${item.paymentType === 'নগদ টাকা' ? 'bg-[#1E88E5] text-white' : 'bg-red-100 text-red-600'}`}>
                      {item.paymentType}
                    </span>
                  </div>
                </div>
                <div className="text-right mt-1">
                  <p className="text-[10px] text-gray-500 font-medium">{toBangla(item.date)} | {toBangla(item.time)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 mt-10 text-sm">কোনো রিসিপ্ট পাওয়া যায়নি</div>
          )}
        </div>
      </main>

      {/* ================= ফিল্টার মডাল ================= */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 flex justify-between items-center text-white">
              <h2 className="font-bold text-sm flex items-center gap-2"><Tag size={16}/> ক্যাটাগরি ও কোম্পানি ফিল্টার</h2>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-3 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              {/* ক্যাটাগরি ফিল্টার */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">ক্যাটাগরি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setSelectedCategory(null)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${!selectedCategory ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                    সব ক্যাটাগরি
                    {!selectedCategory && <Check size={16}/>}
                  </button>
                  {allCategories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCategory === cat ? 'border-[#0B5C47] bg-[#E8F5E9] text-[#0B5C47]' : 'border-gray-200 text-gray-700'}`}>
                      {cat}
                      {selectedCategory === cat && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>

              {/* কোম্পানি ফিল্টার */}
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2 border-b pb-1">কোম্পানি নির্বাচন করুন</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setSelectedCompany(null)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${!selectedCompany ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                    সব কোম্পানি
                    {!selectedCompany && <Check size={16}/>}
                  </button>
                  {allCompanies.map(comp => (
                    <button key={comp} onClick={() => setSelectedCompany(comp)} className={`flex justify-between items-center p-2 rounded-lg border text-sm ${selectedCompany === comp ? 'border-[#1E88E5] bg-[#EFF6FF] text-[#1E88E5]' : 'border-gray-200 text-gray-700'}`}>
                      {comp}
                      {selectedCompany === comp && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={clearFilters} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold shadow-sm">রিসেট</button>
              <button onClick={() => setIsFilterModalOpen(false)} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-lg font-bold shadow-md">অ্যাপ্লাই</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition ${isActive ? 'bg-[#1E88E5] text-white border-[#1E88E5]' : 'bg-white text-gray-600 border-gray-300'}`}
    >
      {title}
    </button>
  );
}