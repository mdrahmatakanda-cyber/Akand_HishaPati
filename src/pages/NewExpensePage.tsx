import { useState } from 'react';
import { ArrowLeft, Calendar, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function NewExpensePage({ onBack }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [employee, setEmployee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (!amount) return alert('পরিমাণ লিখুন');
    alert('খরচ সেভ হয়েছে!');
    onBack();
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
          <h1 className="font-bold text-lg">নতুন খরচ</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-6">
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">কর্মচারী</label>
          <select value={employee} onChange={e => setEmployee(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]">
            <option value="">--সিলেক্ট--</option>
            <option value="1">রহিম</option>
            <option value="2">করিম</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">খরচের পরিমাণ (টাকা) <span className="text-red-500">*</span></label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">খরচের কারণ</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="খরচের কারণ" className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 shadow-sm">
            <ImageIcon size={18} /> <span className="text-[#1E88E5] font-black text-lg">+</span>
          </button>
          <div className="flex-1 bg-white border border-[#1E88E5] rounded-lg p-2.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 shadow-sm">
            <Calendar size={18} /> <input type="date" value={date} onChange={e => setDate(e.target.value)} className="outline-none bg-transparent w-full" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-[#1E88E5] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 mt-4 active:scale-95 transition">
          সেভ করুন <CheckCircle size={18}/>
        </button>
      </main>
    </div>
  );
}