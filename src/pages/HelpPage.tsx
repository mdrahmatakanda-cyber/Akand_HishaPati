import { ArrowLeft, Headphones, Phone, MessageCircle, Mail, BookOpen, ChevronRight } from 'lucide-react';

interface HelpProps {
  onBack: () => void;
}

export default function HelpPage({ onBack }: HelpProps) {
  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Headphones size={20} />
            <h1 className="font-bold text-lg">সাহায্য ও সাপোর্ট</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white p-4 rounded-xl shadow-sm border border-[#D3E4DB] flex flex-col items-center gap-2 active:scale-95 transition">
            <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center">
              <Phone size={24} className="text-[#15803D]" />
            </div>
            <span className="font-bold text-sm">কল করুন</span>
          </button>
          <button className="bg-white p-4 rounded-xl shadow-sm border border-[#D3E4DB] flex flex-col items-center gap-2 active:scale-95 transition">
            <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center">
              <MessageCircle size={24} className="text-[#15803D]" />
            </div>
            <span className="font-bold text-sm">হোয়াটসঅ্যাপ</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#D3E4DB] overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-[#1565C0]" />
              <span className="font-bold text-sm">সাধারণ জিজ্ঞাসা (FAQ)</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
          <div className="p-3 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-[#DC2626]" />
              <span className="font-bold text-sm">ইমেইল করুন</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>
      </main>
    </div>
  );
}