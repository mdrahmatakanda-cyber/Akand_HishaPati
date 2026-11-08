import { useState } from 'react';
import { 
  ArrowLeft, Globe, 
  Calculator, HelpCircle, 
  Share2, Star, LogOut, ChevronRight, MonitorSmartphone, 
  ShieldCheck, Trash2, Printer, 
  DownloadCloud, PlaySquare, AlertTriangle, Bell, Sun, Moon,
  Lock, Laptop, Store
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function MenuPage({ onBack, onNavigate }: Props) {
  // স্টেট
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [isAppLockOn, setIsAppLockOn] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ডেমু ইউজার ডাটা
  const user = {
    name: 'মিওয়ান',
    role: 'Owner (মালিক)',
    phone: '01752005057',
    completion: 80,
    currentShop: 'Dream Agro & Fisheries' // বর্তমান দোকান
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* ১. হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-lg">মেনু ও সেটিংস</h1>
          </div>
        </div>
      </header>

      {/* মেইন কন্টেন্ট (ফাঁকা জায়গা কমাতে gap-2 করা হয়েছে) */}
      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 pb-8 scrollbar-hide">
        
        {/* ২. প্রোফাইল কার্ড (দোকান পরিবর্তনসহ) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[#0B5C47] to-[#1E88E5] rounded-full flex items-center justify-center text-white shadow-md shrink-0 text-xl font-bold">
              {user.name.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-base text-gray-800 truncate">{user.name}</h2>
              <p className="text-[10px] font-bold text-gray-500 mt-0.5 truncate">{user.role}</p>
              <p className="text-[11px] font-bold text-gray-600 mt-0.5 truncate">+৮৮{toBangla(user.phone)}</p>
            </div>
            
            <button onClick={() => alert('প্রোফাইল এডিট পেইজ')} className="px-3 py-1.5 border border-[#1E88E5] text-[#1E88E5] rounded-lg text-xs font-bold active:scale-95 transition shrink-0">
              এডিট
            </button>
          </div>
          
          <div>
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
              <span>প্রোফাইল স্ট্যাটাস</span>
              <span className="text-[#1E88E5]">{toBangla(user.completion)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-[#1E88E5] h-1.5 rounded-full" style={{ width: `${user.completion}%` }}></div>
            </div>
          </div>

          {/* দোকান পরিবর্তন অপশন */}
          <button onClick={() => alert('দোকান পরিবর্তন করার পপআপ আসবে')} className="w-full flex items-center justify-between bg-[#EFF6FF] border border-[#1E88E5]/30 p-2 rounded-lg active:scale-[0.98] transition">
            <div className="flex items-center gap-2 text-[#1E88E5]">
              <Store size={14} />
              <span className="text-[11px] font-bold truncate">{user.currentShop}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#1E88E5]">
              পরিবর্তন <ChevronRight size={12} />
            </div>
          </button>
        </div>

        {/* ================= ৩. অ্যাপ সেটিংস ================= */}
        <SectionTitle title="অ্যাপ সেটিংস" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden block shrink-0">
          <MenuItem icon={Globe} color="text-blue-600" bg="bg-blue-50" label="ভাষা (Language)" value="বাংলা" onClick={() => alert('ভাষা পরিবর্তন')} />
          
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                {isDarkMode ? <Moon size={16}/> : <Sun size={16}/>}
              </div>
              <span className="text-sm font-bold text-gray-700">ডার্ক মোড</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isDarkMode ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isDarkMode ? 'left-5' : 'left-0.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0"><Bell size={16}/></div>
              <span className="text-sm font-bold text-gray-700">নোটিফিকেশন</span>
            </div>
            <button onClick={() => setIsNotificationsOn(!isNotificationsOn)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isNotificationsOn ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isNotificationsOn ? 'left-5' : 'left-0.5'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Lock size={16}/></div>
              <span className="text-sm font-bold text-gray-700">অ্যাপ লক</span>
            </div>
            <button onClick={() => setIsAppLockOn(!isAppLockOn)} className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isAppLockOn ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isAppLockOn ? 'left-5' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>

        {/* ================= ৪. সিস্টেম টুলস ================= */}
        <SectionTitle title="সিস্টেম টুলস" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden block shrink-0">
          <MenuItem icon={Printer} color="text-purple-600" bg="bg-purple-50" label="প্রিন্টার সেটিংস" onClick={() => onNavigate('printer')} />
          <MenuItem icon={ShieldCheck} color="text-green-600" bg="bg-green-50" label="ইউজার ও অ্যাক্সেস ম্যানেজমেন্ট" onClick={() => onNavigate('app_access')} />
          <MenuItem icon={Trash2} color="text-red-600" bg="bg-red-50" label="রিসাইকেল বিন" onClick={() => onNavigate('recycle_bin')} />
          <MenuItem icon={Calculator} color="text-indigo-600" bg="bg-indigo-50" label="ক্যালকুলেটর" onClick={() => onNavigate('calculator')} />
          <MenuItem icon={DownloadCloud} color="text-teal-600" bg="bg-teal-50" label="ডাটা ব্যাকআপ ও রিস্টোর" onClick={() => alert('ব্যাকআপ ফাইল ডাউনলোড হচ্ছে...')} />
          <MenuItem icon={Laptop} color="text-gray-600" bg="bg-gray-100" label="ডেস্কটপে শর্টকাট যোগ করুন" onClick={() => alert('হোম স্ক্রিনে শর্টকাট যুক্ত করা হয়েছে!')} />
        </div>

        {/* ================= ৫. সাহায্য ও তথ্য ================= */}
        <SectionTitle title="সাহায্য ও তথ্য" />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden block shrink-0">
          <MenuItem icon={HelpCircle} color="text-[#1E88E5]" bg="bg-blue-50" label="সাহায্য ও সাপোর্ট" onClick={() => onNavigate('help')} />
          <MenuItem icon={MonitorSmartphone} color="text-gray-600" bg="bg-gray-100" label="ওয়েব ভার্সন ব্যবহার করুন" onClick={() => alert('ওয়েব ভার্সন লিংক')} />
          <MenuItem icon={PlaySquare} color="text-red-500" bg="bg-red-50" label="অ্যাপ ট্রেনিং দেখুন" onClick={() => alert('টিউটোরিয়াল ভিডিও')} />
          <MenuItem icon={Share2} color="text-amber-600" bg="bg-amber-50" label="এই অ্যাপটি শেয়ার করুন" onClick={() => alert('শেয়ার লিংক কপি হয়েছে')} />
          <MenuItem icon={Star} color="text-amber-500" bg="bg-amber-50" label="এই অ্যাপ রেট করুন" onClick={() => alert('প্লে স্টোর লিংক')} />
        </div>

        {/* ভার্সন ও লগ আউট */}
        <div className="text-center text-[10px] font-bold text-gray-400 mt-1 shrink-0">
          App Version: {toBangla('4.1.6')}
        </div>

        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full bg-red-500 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition mb-2 shrink-0"
        >
          <LogOut size={18} /> লগ আউট করুন
        </button>

      </main>

      {/* ================= লগ আউট কনফার্মেশন মডাল ================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
                <AlertTriangle size={28} />
              </div>
              <h2 className="font-bold text-lg text-gray-800">লগ আউট করবেন?</h2>
              <p className="text-xs text-gray-600 mt-1">আপনি কি নিশ্চিতভাবে লগ আউট করতে চান? আপনার সব ডাটা সুরক্ষিত থাকবে।</p>
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={() => { setIsLogoutModalOpen(false); alert('লগ আউট সফল!'); }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-bold shadow-md">হ্যাঁ, লগ আউট</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🧩 রি-ইউজেবল কম্পোনেন্টস

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-[11px] font-bold text-gray-500 mb-1 px-2 uppercase tracking-wider mt-1.5 shrink-0">
      {title}
    </h3>
  );
}

function MenuItem({ icon: Icon, color, bg, label, value, onClick }: { icon: any, color: string, bg: string, label: string, value?: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition last:border-0 text-left shrink-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center shrink-0`}>
          <Icon size={16} />
        </div>
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {value && <span className="text-[11px] font-bold text-gray-400">{value}</span>}
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </button>
  );
}