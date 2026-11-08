import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Plus, Search, UserPlus, 
  X, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, 
  Percent, FileText
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

interface Transaction {
  id: number;
  type: 'investment' | 'withdrawal';
  amount: number;
  date: string;
  note: string;
}

interface Partner {
  id: number;
  name: string;
  phone: string;
  address: string;
  share: string;
  transactions: Transaction[];
}

export default function PartnersPage({ onBack }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  
  // সিলেক্টেড পার্টনার ও ট্রানজেকশন টাইপ
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [txType, setTxType] = useState<'investment' | 'withdrawal'>('investment');

  // ফর্ম স্টেট (প্রারম্ভিক বিনিয়োগ যুক্ত করা হয়েছে)
  const [partnerForm, setPartnerForm] = useState({ 
    name: '', phone: '', address: '', share: '', initialInvestment: '' 
  });
  const [txForm, setTxForm] = useState({ amount: '', note: '' });

  // পার্টনার সেভ
  const handleSavePartner = () => {
    if (!partnerForm.name) return alert('পার্টনারের নাম আবশ্যক');
    
    // প্রারম্ভিক লেনদেন চেক
    const initialTransactions: Transaction[] = [];
    if (partnerForm.initialInvestment && Number(partnerForm.initialInvestment) > 0) {
      initialTransactions.push({
        id: Date.now(),
        type: 'investment',
        amount: Number(partnerForm.initialInvestment),
        date: new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }),
        note: 'প্রারম্ভিক বিনিয়োগ (Opening Balance)'
      });
    }

    const newPartner: Partner = {
      id: Date.now(),
      name: partnerForm.name,
      phone: partnerForm.phone,
      address: partnerForm.address,
      share: partnerForm.share || '0',
      transactions: initialTransactions
    };

    setPartners([newPartner, ...partners]);
    setIsAddModalOpen(false);
    setPartnerForm({ name: '', phone: '', address: '', share: '', initialInvestment: '' });
  };

  // ট্রানজেকশন সেভ
  const handleSaveTx = () => {
    if (!txForm.amount || Number(txForm.amount) <= 0) return alert('সঠিক পরিমাণ লিখুন');
    if (!selectedPartner) return;

    const newTx: Transaction = {
      id: Date.now(),
      type: txType,
      amount: Number(txForm.amount),
      date: new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }) + ' | ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      note: txForm.note || (txType === 'investment' ? 'মূলধন বিনিয়োগ' : 'ব্যক্তিগত উত্তোলন')
    };

    const updatedPartner = {
      ...selectedPartner,
      transactions: [newTx, ...selectedPartner.transactions]
    };

    setPartners(partners.map(p => p.id === selectedPartner.id ? updatedPartner : p));
    setSelectedPartner(updatedPartner); // ডিটেইলস মডাল আপডেট
    setIsTxModalOpen(false);
    setTxForm({ amount: '', note: '' });
  };

  // ব্যালেন্স ক্যালকুলেশন
  const calculateBalance = (transactions: Transaction[]) => {
    const inv = transactions.filter(t => t.type === 'investment').reduce((a, c) => a + c.amount, 0);
    const wd = transactions.filter(t => t.type === 'withdrawal').reduce((a, c) => a + c.amount, 0);
    return inv - wd;
  };

  const filteredPartners = partners.filter(p => 
    p.name.includes(searchQuery) || p.phone.includes(searchQuery)
  );

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <div>
              <h1 className="font-bold text-lg leading-tight">পার্টনার ম্যানেজমেন্ট</h1>
              <p className="text-[9px] text-cyan-200">Manage investments & withdrawals</p>
            </div>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3 pb-24">
        
        {/* সার্চ ও অ্যাড বাটন */}
        <div className="flex gap-2 shrink-0">
          <div className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm focus-within:border-[#0B5C47]">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="পার্টনার খুঁজুন..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full outline-none text-sm bg-transparent" 
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1E88E5] text-white px-4 rounded-xl font-bold text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition shrink-0">
            <Plus size={18}/> নতুন
          </button>
        </div>

        {/* পার্টনার লিস্ট */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredPartners.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center mt-4 bg-white/50">
              <UserPlus size={40} className="text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-700 text-base">কোনো পার্টনার যুক্ত করা হয়নি</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">ব্যবসার মালিক বা বিনিয়োগকারী যুক্ত করুন।</p>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1E88E5] text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95 transition">নতুন পার্টনার</button>
            </div>
          ) : (
            filteredPartners.map(partner => {
              const balance = calculateBalance(partner.transactions);
              return (
                <div 
                  key={partner.id} 
                  onClick={() => { setSelectedPartner(partner); setIsDetailsModalOpen(true); }}
                  className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#EFF6FF] rounded-full flex items-center justify-center text-[#1E88E5] shrink-0">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{partner.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Percent size={10}/> {toBangla(partner.share)}% শেয়ার
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-base ${balance >= 0 ? 'text-[#0B5C47]' : 'text-red-600'}`}>
                      ৳ {toBangla(Math.abs(balance))}
                    </p>
                    <p className={`text-[10px] font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {balance >= 0 ? 'জমা আছে' : 'বাকি আছে'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* ================= মডাল: নতুন পার্টনার ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-white w-full h-auto max-h-[90dvh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-gray-50 p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">নতুন পার্টনার যুক্ত করুন</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">পার্টনারের নাম <span className="text-red-500">*</span></label>
                <input type="text" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">শতাংশ (%)</label>
                  <input type="number" value={partnerForm.share} onChange={e => setPartnerForm({...partnerForm, share: e.target.value})} placeholder="যেমন: ৫০" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">প্রারম্ভিক বিনিয়োগ (৳)</label>
                  <input type="number" value={partnerForm.initialInvestment} onChange={e => setPartnerForm({...partnerForm, initialInvestment: e.target.value})} placeholder="যেমন: ৫০০০০" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">মোবাইল নম্বর</label>
                <input type="text" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">ঠিকানা</label>
                <input type="text" value={partnerForm.address} onChange={e => setPartnerForm({...partnerForm, address: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t flex gap-2 shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              <button onClick={handleSavePartner} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: পার্টনার ডিটেইলস ও লেজার ================= */}
      {isDetailsModalOpen && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            {/* মডাল হেডার */}
            <div className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] p-4 text-white shrink-0 relative">
              <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-3 right-3 p-1 bg-white/20 rounded-full"><X size={18}/></button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selectedPartner.name}</h2>
                  <p className="text-xs text-cyan-200">{toBangla(selectedPartner.share)}% শেয়ার হোল্ডার</p>
                </div>
              </div>
            </div>

            {/* ব্যালেন্স সামারি */}
            <div className="p-3 bg-white border-b shrink-0">
              <div className="bg-[#F3F4F6] rounded-xl p-3 flex justify-between items-center border border-gray-200">
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-0.5">বর্তমান ব্যালেন্স</p>
                  <p className={`font-black text-xl ${calculateBalance(selectedPartner.transactions) >= 0 ? 'text-[#0B5C47]' : 'text-red-600'}`}>
                    ৳ {toBangla(Math.abs(calculateBalance(selectedPartner.transactions)))}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {calculateBalance(selectedPartner.transactions) >= 0 ? '(ব্যবসা পার্টনারকে দিবে)' : '(পার্টনার ব্যবসাকে দিবে)'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-[11px] font-bold">
                  <span className="text-[#1E88E5] text-right flex items-center justify-end gap-1"><TrendingUp size={12}/> বিনিয়োগ: ৳{toBangla(selectedPartner.transactions.filter(t=>t.type==='investment').reduce((a,c)=>a+c.amount,0))}</span>
                  <span className="text-red-500 text-right flex items-center justify-end gap-1"><TrendingDown size={12}/> উত্তোলন: ৳{toBangla(selectedPartner.transactions.filter(t=>t.type==='withdrawal').reduce((a,c)=>a+c.amount,0))}</span>
                </div>
              </div>
            </div>

            {/* লেনদেনের লিস্ট */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <h3 className="font-bold text-sm text-gray-700 mb-1">লেনদেনের ইতিহাস</h3>
              {selectedPartner.transactions.length === 0 ? (
                <div className="text-center text-gray-400 mt-6 text-sm flex flex-col items-center">
                  <FileText size={32} className="mb-2 opacity-50"/>
                  কোনো লেনদেন পাওয়া যায়নি
                </div>
              ) : (
                selectedPartner.transactions.map(tx => (
                  <div key={tx.id} className="bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'investment' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'investment' ? <ArrowDownCircle size={18}/> : <ArrowUpCircle size={18}/>}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-800">{tx.note}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`font-black text-sm ${tx.type === 'investment' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'investment' ? '+' : '-'}{toBangla(tx.amount)} ৳
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* অ্যাকশন বাটন */}
            <div className="p-3 bg-white border-t flex gap-2 shrink-0">
              <button onClick={() => { setTxType('withdrawal'); setIsTxModalOpen(true); }} className="flex-1 bg-white border border-red-500 text-red-500 py-2.5 rounded-xl font-bold shadow-sm text-sm flex justify-center items-center gap-1">
                <TrendingDown size={16}/> টাকা উত্তোলন
              </button>
              <button onClick={() => { setTxType('investment'); setIsTxModalOpen(true); }} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md text-sm flex justify-center items-center gap-1">
                <TrendingUp size={16}/> নতুন বিনিয়োগ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: নতুন লেনদেন (বিনিয়োগ/উত্তোলন) ================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`p-3 text-white flex justify-between items-center ${txType === 'investment' ? 'bg-[#1E88E5]' : 'bg-red-500'}`}>
              <h2 className="font-bold text-sm">{txType === 'investment' ? 'নতুন বিনিয়োগ যুক্ত করুন' : 'টাকা উত্তোলন করুন'}</h2>
              <button onClick={() => setIsTxModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-[#F3F4F6] border border-gray-200 p-2 text-center rounded-lg">
                <p className="text-[10px] text-gray-500 font-bold">পার্টনার: {selectedPartner?.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">টাকার পরিমাণ <span className="text-red-500">*</span></label>
                <input type="number" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} placeholder="0" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-lg font-bold outline-none focus:border-[#0B5C47]" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">নোট (ঐচ্ছিক)</label>
                <input type="text" value={txForm.note} onChange={e => setTxForm({...txForm, note: e.target.value})} placeholder="লেনদেনের কারণ..." className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
              </div>
            </div>

            <div className="p-3 border-t bg-gray-50">
              <button onClick={handleSaveTx} className={`w-full ${txType === 'investment' ? 'bg-[#1E88E5]' : 'bg-red-500'} text-white py-2.5 rounded-lg font-bold shadow-md`}>নিশ্চিত করুন</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}