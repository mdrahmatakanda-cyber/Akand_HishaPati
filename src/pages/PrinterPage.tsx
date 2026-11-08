import { useState } from 'react';
import { 
  ArrowLeft, HelpCircle, Printer, Bluetooth, 
  Search, Plus, CheckCircle2, X, Settings, 
  Trash2, Star, RefreshCw, Smartphone
} from 'lucide-react';
import { toBangla } from '../lib/utils';

interface Props {
  onBack: () => void;
}

interface PrinterDevice {
  id: number;
  name: string;
  isDefault: boolean;
  paperSize: '58mm' | '80mm';
}

export default function PrinterPage({ onBack }: Props) {
  // ডাটা স্টেট
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  
  // মডাল স্টেট
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'found'>('idle');
  const [foundDevices, setFoundDevices] = useState<{id: number, name: string}[]>([]);
  
  // পিন স্টেট
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<{id: number, name: string} | null>(null);
  const [pinCode, setPinCode] = useState('');

  // স্ক্যান সিমুলেশন
  const handleScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      setFoundDevices([
        { id: 1, name: 'BM58E' },
        { id: 2, name: 'Thermal Printer 80mm' },
        { id: 3, name: 'Generic POS Printer' }
      ]);
      setScanState('found');
    }, 2000); // ২ সেকেন্ড পর ডিভাইস পাবে
  };

  // ডিভাইসে ক্লিক করলে পিন চাইবে
  const handleDeviceSelect = (device: {id: number, name: string}) => {
    setSelectedDevice(device);
    setIsPinModalOpen(true);
    setPinCode('');
  };

  // পিন কনফার্ম
  const handleConfirmPin = () => {
    if (pinCode.length !== 4) return alert('৪ ডিজিটের পিন দিন (যেমন: ০০০০)');
    
    // প্রিন্টার লিস্টে যোগ করা
    const newPrinter: PrinterDevice = {
      id: Date.now(),
      name: selectedDevice!.name,
      isDefault: printers.length === 0, // প্রথম প্রিন্টার হলে ডিফল্ট হবে
      paperSize: '58mm'
    };
    
    setPrinters([...printers, newPrinter]);
    setIsPinModalOpen(false);
    setIsAddModalOpen(false);
    setScanState('idle');
    setFoundDevices([]);
    alert('প্রিন্টার সফলভাবে যুক্ত হয়েছে!');
  };

  // ডিলিট
  const handleRemove = (id: number) => {
    if(window.confirm('আপনি কি প্রিন্টারটি ডিসকানেক্ট করতে চান?')) {
      setPrinters(printers.filter(p => p.id !== id));
    }
  };

  // ডিফল্ট সেট
  const setDefault = (id: number) => {
    setPrinters(printers.map(p => ({ ...p, isDefault: p.id === id })));
  };

  // পেপার সাইজ চেঞ্জ
  const togglePaperSize = (id: number) => {
    setPrinters(printers.map(p => p.id === id ? { ...p, paperSize: p.paperSize === '58mm' ? '80mm' : '58mm' } : p));
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      {/* হেডার */}
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">প্রিন্টার সেটিংস</h1>
          </div>
          <button onClick={() => alert('সাহায্য')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 pb-6">
        
        {/* প্রিন্টার খালি থাকলে (Screenshot 1) */}
        {printers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <Printer size={64} className="text-gray-400" />
            </div>
            <h2 className="font-bold text-gray-700 text-lg mb-1">আপনার কোন প্রিন্টার সংযুক্ত নেই</h2>
            <p className="text-sm text-gray-500 mb-6 px-4">রিসিপ্ট প্রিন্ট করতে প্রিন্টার যোগ করতে "প্রিন্টার যোগ করুন" বাটনটি চাপুন</p>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1E88E5] text-white px-8 py-3 rounded-xl font-bold shadow-md active:scale-95 transition">
              প্রিন্টার যোগ করুন
            </button>
          </div>
        ) : (
          /* প্রিন্টার লিস্ট থাকলে */
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-700 text-base">সংযুক্ত প্রিন্টারসমূহ</h2>
              <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1E88E5] text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition">
                <Plus size={14}/> নতুন যোগ করুন
              </button>
            </div>

            {printers.map(printer => (
              <div key={printer.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${printer.isDefault ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <Printer size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                        {printer.name} 
                        {printer.isDefault && <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded">ডিফল্ট</span>}
                      </h3>
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5"><CheckCircle2 size={12}/> কানেক্টেড</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(printer.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* কন্ট্রোল প্যানেল */}
                <div className="flex gap-2 border-t border-gray-100 pt-2">
                  {!printer.isDefault && (
                    <button onClick={() => setDefault(printer.id)} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95">
                      <Star size={14}/> ডিফল্ট করুন
                    </button>
                  )}
                  <button onClick={() => togglePaperSize(printer.id)} className="flex-1 border border-gray-300 text-gray-600 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95">
                    <Settings size={14}/> পেপার: {toBangla(printer.paperSize === '58mm' ? '৫৮' : '৮০')} মিমি
                  </button>
                  <button onClick={() => alert('টেস্ট রিসিপ্ট প্রিন্ট করা হচ্ছে...')} className="flex-1 bg-[#EFF6FF] border border-[#1E88E5] text-[#1E88E5] py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95">
                    <RefreshCw size={14}/> টেস্ট প্রিন্ট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= মডাল: প্রিন্টার যোগ করার ইনস্ট্রাকশন (Screenshot 2) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="bg-white p-4 flex justify-between items-center border-b shrink-0">
              <h2 className="font-bold text-base text-gray-800">প্রিন্টার যোগ করার ধাপসমূহ</h2>
              <button onClick={() => { setIsAddModalOpen(false); setScanState('idle'); }} className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              
              {scanState === 'idle' && (
                <>
                  <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1E88E5] text-white font-bold flex items-center justify-center shrink-0">১</div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">প্রিন্টার সুইচ অন করুন</h3>
                      <p className="text-xs text-gray-600 mt-1">প্রথমত প্রিন্টারের পাওয়ার বাটন চেপে প্রিন্টারটি অন করুন।</p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1E88E5] text-white font-bold flex items-center justify-center shrink-0">২</div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">Bluetooth এর অনুমতি এবং প্রিন্টার PAIR করুন</h3>
                      <p className="text-xs text-gray-600 mt-1">আপনার ফোনে Bluetooth এর পারমিশন চাওয়া হলে "ALLOW" বাটনটি চাপুন এবং স্ক্যান করে খুঁজে পাওয়া ডিভাইসগুলোর মধ্যে থেকে প্রিন্টারটি সিলেক্ট করুন।</p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#1E88E5] text-white font-bold flex items-center justify-center shrink-0">৩</div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">পিন নাম্বার</h3>
                      <p className="text-xs text-gray-600 mt-1">"BM58E" বা আপনার প্রিন্টারের নাম ধরে খুঁজে সিলেক্ট করুন। প্রিন্টার সিলেক্ট করার পর যদি পিন নাম্বার চায় তাহলে ৪টি শূন্য ( ০০০০ ) পিন হিসেবে ইনপুট দিন।</p>
                    </div>
                  </div>
                </>
              )}

              {scanState === 'scanning' && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="font-bold text-gray-700">ডিভাইস খোঁজা হচ্ছে...</h3>
                  <p className="text-xs text-gray-500 mt-1">অনুগ্রহ করে প্রিন্টারটি অন রাখুন</p>
                </div>
              )}

              {scanState === 'found' && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-gray-700 mb-1 flex items-center gap-2"><Bluetooth size={16}/> ডিভাইস খুঁজে পাওয়া গেছে:</h3>
                  {foundDevices.map(device => (
                    <button key={device.id} onClick={() => handleDeviceSelect(device)} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm flex items-center justify-between active:scale-95 transition">
                      <div className="flex items-center gap-3">
                        <Printer size={20} className="text-gray-500" />
                        <span className="font-bold text-sm text-gray-800">{device.name}</span>
                      </div>
                      <span className="text-[10px] bg-[#EFF6FF] text-[#1E88E5] px-2 py-1 rounded font-bold">কানেক্ট</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t flex gap-2 shrink-0">
              <button onClick={() => { setIsAddModalOpen(false); setScanState('idle'); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm">বাতিল</button>
              
              {scanState === 'idle' && (
                <button onClick={handleScan} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1">
                  <Search size={16}/> স্ক্যান করুন
                </button>
              )}

              {scanState === 'scanning' && (
                <button disabled className="flex-1 bg-gray-300 text-white py-2.5 rounded-xl font-bold shadow-sm">অপেক্ষা করুন...</button>
              )}

              {scanState === 'found' && (
                <button onClick={handleScan} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1">
                  <RefreshCw size={16}/> আবার স্ক্যান
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: পিন কোড ইনপুট ================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 text-white flex justify-between items-center">
              <h2 className="font-bold text-sm">পিন কোড দিন</h2>
              <button onClick={() => setIsPinModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3 items-center">
              <Smartphone size={40} className="text-gray-400" />
              <p className="text-xs text-gray-600 text-center font-bold">
                {selectedDevice?.name} এর সাথে কানেক্ট করতে ৪ ডিজিটের পিন দিন (ডিফল্ট: ০০০০)
              </p>
              <input 
                type="number" 
                value={pinCode} 
                onChange={e => setPinCode(e.target.value)} 
                placeholder="0000" 
                maxLength={4}
                className="w-32 text-center text-2xl font-black tracking-widest border-b-2 border-[#1E88E5] outline-none pb-1 bg-transparent" 
              />
            </div>

            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsPinModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleConfirmPin} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-lg font-bold shadow-md text-sm">কানেক্ট</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}