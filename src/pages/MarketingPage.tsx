import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, History, Phone, User, Users, 
  Truck, Contact, Search, X, Check, MessageSquare, 
  Mic, ShoppingBag, Info, CheckCircle2
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

// ডেমু ডাটা
const dummyContacts = {
  customer: [
    { id: 1, name: 'রহিম স্টোর', phone: '01711000001' },
    { id: 2, name: 'করিম এন্টারপ্রাইজ', phone: '01711000002' },
    { id: 3, name: 'আল-মদিনা', phone: '01711000003' },
  ],
  employee: [
    { id: 4, name: 'ম্যানেজার (সজীব)', phone: '01911000001' },
    { id: 5, name: 'এসআর (রফিক)', phone: '01911000002' },
  ],
  supplier: [
    { id: 6, name: 'ভাই ভাই এগ্রো', phone: '01511000001' },
    { id: 7, name: 'মোল্লা পোল্ট্রি', phone: '01511000002' },
  ],
  phonebook: [
    { id: 8, name: 'অজানা নম্বর ১', phone: '01811000001' },
    { id: 9, name: 'অজানা নম্বর ২', phone: '01811000002' },
  ]
};

const templates = [
  "আসসালামু আলাইকুম, আপনার কাছে বাকি টাকা {due} রয়ে গেছে। অনুগ্রহ করে পরিশোধ করুন।",
  "নতুন স্টক এসেছে! আজই কিনুন।",
  "ঈদ মোবারক! আপনার ব্যবসা দিন দিন বৃদ্ধি পাক।"
];

export default function MarketingPage({ onBack }: Props) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  
  // মডাল স্টেট
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [contactType, setContactType] = useState<'customer' | 'employee' | 'supplier' | 'phonebook'>('customer');
  const [searchQuery, setSearchQuery] = useState('');

  // ব্যালেন্স স্টেট (ডেমু)
  const [smsBalance, setSmsBalance] = useState(10);
  const [voiceBalance, setVoiceBalance] = useState(3);

  // ক্যারেক্টার কাউন্ট
  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  // কন্টাক্ট সিলেক্ট হ্যান্ডলার
  const openContactModal = (type: typeof contactType) => {
    setContactType(type);
    setSearchQuery('');
    setIsContactModalOpen(true);
  };

  const toggleContact = (contact: any) => {
    const isSelected = selectedContacts.find(c => c.phone === contact.phone);
    if (isSelected) {
      setSelectedContacts(selectedContacts.filter(c => c.phone !== contact.phone));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleConfirmContacts = () => {
    // সিলেক্ট করা কন্টাক্টের ফোন নম্বরগুলো কমা দিয়ে মোবাইল নম্বর বক্সে বসিয়ে দেওয়া
    const numbers = selectedContacts.map(c => c.phone).join(', ');
    setMobileNumber(prev => prev ? `${prev}, ${numbers}` : numbers);
    setIsContactModalOpen(false);
  };

  const handleSendMessage = (type: 'sms' | 'voice') => {
    if (!mobileNumber) return alert('মোবাইল নম্বর দিন অথবা কন্টাক্ট সিলেক্ট করুন');
    if (!message && type === 'sms') return alert('মেসেজ লিখুন');
    
    if (type === 'sms' && smsBalance < smsCount) {
      return alert('পর্যাপ্ত এসএমএস ব্যালেন্স নেই!');
    }
    if (type === 'voice' && voiceBalance <= 0) {
      return alert('পর্যাপ্ত ভয়েস মিনিট নেই!');
    }

    if (type === 'sms') setSmsBalance(prev => prev - smsCount);
    if (type === 'voice') setVoiceBalance(prev => prev - 1);

    alert(`${type === 'sms' ? 'এসএমএস' : 'ভয়েস মেসেজ'} সফলভাবে পাঠানো হয়েছে!`);
    
    // রিসেট
    setMobileNumber('');
    setMessage('');
    setSelectedContacts([]);
  };

  const insertTemplate = (text: string) => {
    setMessage(text);
  };

  const filteredContacts = dummyContacts[contactType].filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">এসএমএস মার্কেটিং</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsHistoryModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/30 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 transition">
              <History size={14} /> হিস্ট্রি
            </button>
            <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-8">
        
        {/* মোবাইল নম্বর ইনপুট */}
        <div className="relative">
          <label className="absolute -top-2 left-3 bg-[#EFF6F3] px-1 text-[11px] font-bold text-gray-600">মোবাইল নম্বর</label>
          <div className="flex items-center bg-white border-2 border-gray-800 rounded-lg px-3 py-2">
            <Phone size={18} className="text-gray-500 mr-2" />
            <input 
              type="text" 
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="একাধিক নম্বরের জন্য কমা (,) ব্যবহার করুন" 
              className="w-full outline-none text-sm font-bold text-gray-800 placeholder-gray-400 bg-transparent" 
            />
          </div>
        </div>

        {/* কন্টাক্ট ক্যাটাগরি বাটন */}
        <div>
          <p className="text-xs font-bold text-gray-700 mb-1.5">নম্বর নির্বাচন করুন</p>
          <div className="grid grid-cols-4 gap-2">
            <ContactButton icon={User} label="কাস্টমার" onClick={() => openContactModal('customer')} />
            <ContactButton icon={Users} label="কর্মচারী" onClick={() => openContactModal('employee')} />
            <ContactButton icon={Truck} label="সাপ্লায়ার" onClick={() => openContactModal('supplier')} />
            <ContactButton icon={Contact} label="ফোনবুক" onClick={() => openContactModal('phonebook')} />
          </div>
        </div>

        {/* কুইক টেমপ্লেট */}
        <div className="mt-1">
          <p className="text-xs font-bold text-gray-700 mb-1.5">কুইক টেমপ্লেট</p>
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
            {templates.map((t, idx) => (
              <button 
                key={idx} 
                onClick={() => insertTemplate(t)}
                className="bg-white border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm active:scale-95 transition hover:border-[#0B5C47]"
              >
                {t.substring(0, 20)}...
              </button>
            ))}
          </div>
        </div>

        {/* মেসেজ বক্স */}
        <div className="relative mt-1">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="আপনার মেসেজ লিখুন..." 
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-[#0B5C47] min-h-[120px] shadow-sm pb-10"
          ></textarea>
          
          <div className="absolute bottom-2 right-3 text-right">
            <p className="text-[10px] text-gray-500 font-bold">- মিওয়ান</p>
            <p className="text-[10px] text-gray-500">({toBangla('01752005057')})</p>
          </div>
        </div>

        {/* ক্যারেক্টার কাউন্ট */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold px-1">
          <span>({toBangla(charCount)} ক্যারেক্টার / {toBangla(smsCount)} এসএমএস)</span>
          {selectedContacts.length > 0 && (
            <span className="text-[#1E88E5]">{toBangla(selectedContacts.length)} জন সিলেক্টেড</span>
          )}
        </div>

        {/* অ্যাকশন বাটন */}
        <div className="flex gap-2 mt-1">
          <button 
            onClick={() => handleSendMessage('voice')}
            className="flex-1 bg-white border border-[#1E88E5] text-[#1E88E5] py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Mic size={18} /> ভয়েস মেসেজ
          </button>
          <button 
            onClick={() => handleSendMessage('sms')}
            className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <MessageSquare size={18} /> মেসেজ পাঠান
          </button>
        </div>

        {/* ব্যালেন্স কার্ড */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-600">মিনিট অবশিষ্ট: <span className="text-[#1E88E5]">{toBangla(voiceBalance)}</span></p>
            <button onClick={() => alert('মিনিট কেনার পেজ')} className="mt-2 text-sm font-black text-[#0B5C47] w-full border-t border-gray-100 pt-2 flex items-center justify-center gap-1">
              মিনিট কিনুন <ShoppingBag size={14}/>
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-600">এসএমএস অবশিষ্ট: <span className="text-[#1E88E5]">{toBangla(smsBalance)}</span></p>
            <button onClick={() => alert('এসএমএস কেনার পেজ')} className="mt-2 text-sm font-black text-[#0B5C47] w-full border-t border-gray-100 pt-2 flex items-center justify-center gap-1">
              এসএমএস কিনুন <ShoppingBag size={14}/>
            </button>
          </div>
        </div>

      </main>

      {/* ================= মডাল: কন্টাক্ট সিলেক্ট ================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[85dvh] sm:h-[80vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-gray-700 text-base">কন্টাক্ট সিলেক্ট করুন</h2>
              <button onClick={() => setIsContactModalOpen(false)} className="p-1 bg-gray-100 rounded-full text-gray-500"><X size={18}/></button>
            </div>

            {/* সার্চ */}
            <div className="p-3 shrink-0">
              <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
                <Search size={18} className="text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="খোঁজ করুন..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none text-sm bg-transparent" 
                />
              </div>
            </div>

            {/* লিস্ট */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 text-sm">কোনো কন্টাক্ট পাওয়া যায়নি</div>
              ) : (
                filteredContacts.map(contact => {
                  const isSelected = selectedContacts.some(c => c.phone === contact.phone);
                  return (
                    <div 
                      key={contact.id} 
                      onClick={() => toggleContact(contact)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition ${isSelected ? 'bg-[#EFF6FF] border-[#1E88E5]' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div>
                        <p className="font-bold text-sm text-gray-800">{contact.name}</p>
                        <p className="text-xs text-gray-500">{toBangla(contact.phone)}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#1E88E5] border-[#1E88E5]' : 'border-gray-300'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* লিমিট ওয়ার্নিং (স্ক্রিনশট ১ এর মতো) */}
            {selectedContacts.length >= 10 && (
              <div className="mx-3 mb-2 p-2 border-2 border-dashed border-[#1E88E5] rounded-lg bg-blue-50 text-center flex flex-col items-center justify-center gap-1">
                <p className="text-xs font-bold text-red-500 flex items-center gap-1"><Info size={14}/> আপনি ১০ জনের লিমিট অতিক্রম করেছেন!</p>
                <p className="text-[10px] text-[#1E88E5] font-bold">সাবস্ক্রিপশন আপগ্রেড করুন ➔</p>
              </div>
            )}

            {/* বাটন */}
            <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
              <button onClick={() => setIsContactModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বন্ধ করুন</button>
              <button onClick={handleConfirmContacts} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">
                নিশ্চিত করুন ({toBangla(selectedContacts.length)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: মেসেজ হিস্ট্রি ================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-[70dvh] sm:h-[60vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><History size={18}/> মেসেজ হিস্ট্রি</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {/* ডেমু হিস্ট্রি */}
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm relative">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-[#1E88E5] flex items-center gap-1"><CheckCircle2 size={12}/> ডেলিভারড</span>
                    <span className="text-[10px] text-gray-400">০৭ নভেম্বর, ১১:৩০ AM</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">আসসালামু আলাইকুম, আপনার বাকি ৫০০ টাকা পরিশোধ করুন।</p>
                  <p className="text-[10px] text-gray-500 mt-2">প্রাপক: ০১৭১১০০০০০১, ০১৭১১০০০০০২...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// কন্টাক্ট ক্যাটাগরি বাটন কম্পোনেন্ট
function ContactButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white border border-gray-300 rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition hover:border-[#0B5C47]">
      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
        <Icon size={20} className="text-gray-600" />
      </div>
      <span className="text-[10px] font-bold text-gray-700">{label}</span>
    </button>
  );
}