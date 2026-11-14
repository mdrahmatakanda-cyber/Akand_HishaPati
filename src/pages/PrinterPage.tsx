import { useState, useEffect } from 'react';
import { 
  ArrowLeft, HelpCircle, Printer, 
  Search, Plus, CheckCircle2, X, Settings, 
  Trash2, Star, RefreshCw, Smartphone, Save,
  FileText, LayoutTemplate, ReceiptText, ChevronRight
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import PremiumToast from '../components/PremiumToast';

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
  const { activeBusiness } = useAuth();
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'found'>('idle');
  const [foundDevices, setFoundDevices] = useState<{id: number, name: string}[]>([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<{id: number, name: string} | null>(null);
  const [pinCode, setPinCode] = useState('');

  // ✅ নতুন স্টেট সমূহ
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ show: true, message, type });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [invoiceFormat, setInvoiceFormat] = useState<'A4' | '80mm' | '58mm'>('A4');

  const [receiptSettings, setReceiptSettings] = useState({
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    footerText: 'আমাদের সাথে ব্যবসা করার জন্য ধন্যবাদ!',
    invoicePrefix: 'INV-',
    format: 'A4'
  });

  useEffect(() => {
    if (activeBusiness?.id) {
      const saved = localStorage.getItem(`receipt_settings_${activeBusiness.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setReceiptSettings(parsed);
        if (parsed.format) setInvoiceFormat(parsed.format);
      } else {
        setReceiptSettings({
          shopName: activeBusiness.name || '',
          shopAddress: (activeBusiness as any).address || '',
          shopPhone: (activeBusiness as any).phone || '',
          shopEmail: (activeBusiness as any).email || '',
          footerText: 'আমাদের সাথে ব্যবসা করার জন্য ধন্যবাদ!',
          invoicePrefix: 'INV-',
          format: 'A4'
        });
      }
    }
  }, [activeBusiness]);

  const handleSaveSettings = () => {
    if (!activeBusiness?.id) return showToast('বিজনেস পাওয়া যায়নি!', 'error');
    const dataToSave = { ...receiptSettings, format: invoiceFormat };
    localStorage.setItem(`receipt_settings_${activeBusiness.id}`, JSON.stringify(dataToSave));
    setReceiptSettings(dataToSave);
    showToast('রিসিপ্ট সেটিংস সফলভাবে সেভ হয়েছে!', 'success');
    setIsSettingsOpen(false); 
  };

  const handleScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      setFoundDevices([
        { id: 1, name: 'BM58E' },
        { id: 2, name: 'Thermal Printer 80mm' },
        { id: 3, name: 'Generic POS Printer' }
      ]);
      setScanState('found');
    }, 2000);
  };

  const handleDeviceSelect = (device: {id: number, name: string}) => {
    setSelectedDevice(device);
    setIsPinModalOpen(true);
    setPinCode('');
  };

  const handleConfirmPin = () => {
    if (pinCode.length !== 4) return showToast('৪ ডিজিটের পিন দিন (যেমন: ০০০০)', 'error');
    const newPrinter: PrinterDevice = {
      id: Date.now(),
      name: selectedDevice!.name,
      isDefault: printers.length === 0,
      paperSize: '58mm'
    };
    setPrinters([...printers, newPrinter]);
    setIsPinModalOpen(false);
    setIsAddModalOpen(false);
    setScanState('idle');
    setFoundDevices([]);
    showToast('প্রিন্টার সফলভাবে যুক্ত হয়েছে!', 'success');
  };

  const handleRemove = (id: number) => {
    setPrinters(printers.filter(p => p.id !== id));
    showToast('প্রিন্টার ডিসকানেক্ট করা হয়েছে!', 'success');
  };

  const setDefault = (id: number) => setPrinters(printers.map(p => ({ ...p, isDefault: p.id === id })));
  const togglePaperSize = (id: number) => setPrinters(printers.map(p => p.id === id ? { ...p, paperSize: p.paperSize === '58mm' ? '80mm' : '58mm' } : p));

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full relative">
      
      <PremiumToast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />

      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg">প্রিন্টার ও রিসিপ্ট</h1>
          </div>
          <button onClick={() => showToast('সাহায্য শীঘ্রই আসছে!', 'success')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"><HelpCircle size={18} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 pb-24">
        
        {/* ✅ রিসিপ্ট সেটিংস ওপেন করার সুন্দর বাটন কার্ড */}
        <div 
          onClick={() => setIsSettingsOpen(true)}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#EFF6FF] text-[#1E88E5] rounded-full flex items-center justify-center shrink-0">
              <ReceiptText size={24} />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-800">রিসিপ্ট সেটিংস</h2>
              <p className="text-xs text-gray-500 mt-0.5">দোকানের তথ্য ও চালানের ফরম্যাট পরিবর্তন করুন</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>

        {/* প্রিন্টার লিস্ট সেকশন */}
        <div className="flex justify-between items-center mt-2 border-b pb-2">
          <h2 className="font-bold text-sm text-gray-800">সংযুক্ত প্রিন্টারসমূহ</h2>
          {printers.length > 0 && (
            <button onClick={() => setIsAddModalOpen(true)} className="bg-[#1E88E5] text-white px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 active:scale-95 shadow-sm">
              <Plus size={14}/> নতুন
            </button>
          )}
        </div>
        
        {printers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Printer size={40} className="text-gray-400" /></div>
            <h3 className="font-bold text-gray-700 mb-1">কোনো প্রিন্টার সংযুক্ত নেই</h3>
            <button onClick={() => setIsAddModalOpen(true)} className="mt-3 bg-[#1E88E5] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md active:scale-95 transition">প্রিন্টার যোগ করুন</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {printers.map(printer => (
              <div key={printer.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${printer.isDefault ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}><Printer size={20} /></div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">{printer.name} {printer.isDefault && <span className="bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded">ডিফল্ট</span>}</h3>
                      <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5"><CheckCircle2 size={12}/> কানেক্টেড</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(printer.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                </div>
                <div className="flex gap-2 border-t border-gray-100 pt-2">
                  {!printer.isDefault && <button onClick={() => setDefault(printer.id)} className="flex-1 border text-gray-600 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Star size={14}/> ডিফল্ট</button>}
                  <button onClick={() => togglePaperSize(printer.id)} className="flex-1 border text-gray-600 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Settings size={14}/> {toBangla(printer.paperSize === '58mm' ? '৫৮' : '৮০')} মিমি</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= মডাল: প্রিন্টার যোগ করুন ================= */}
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
                  <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3"><div className="w-6 h-6 rounded-full bg-[#1E88E5] text-white font-bold flex items-center justify-center shrink-0">১</div><div><h3 className="font-bold text-sm text-gray-800">প্রিন্টার সুইচ অন করুন</h3></div></div>
                  <div className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm flex gap-3"><div className="w-6 h-6 rounded-full bg-[#1E88E5] text-white font-bold flex items-center justify-center shrink-0">২</div><div><h3 className="font-bold text-sm text-gray-800">Bluetooth পারমিশন দিন ও পেয়ার করুন</h3></div></div>
                </>
              )}
              {scanState === 'scanning' && <div className="flex flex-col items-center py-10"><div className="w-16 h-16 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin mb-4"></div><h3 className="font-bold text-gray-700">খোঁজা হচ্ছে...</h3></div>}
              {scanState === 'found' && (
                <div className="flex flex-col gap-2">
                  {foundDevices.map(device => (
                    <button key={device.id} onClick={() => handleDeviceSelect(device)} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm flex items-center justify-between active:scale-95 transition">
                      <div className="flex items-center gap-3"><Printer size={20} className="text-gray-500" /><span className="font-bold text-sm text-gray-800">{device.name}</span></div>
                      <span className="text-[10px] bg-[#EFF6FF] text-[#1E88E5] px-2 py-1 rounded font-bold">কানেক্ট</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-white border-t flex gap-2 shrink-0">
              <button onClick={() => { setIsAddModalOpen(false); setScanState('idle'); }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              {scanState === 'idle' && <button onClick={handleScan} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1 text-sm"><Search size={16}/> স্ক্যান করুন</button>}
              {scanState === 'found' && <button onClick={handleScan} className="flex-1 bg-[#1E88E5] text-white py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-1 text-sm"><RefreshCw size={16}/> আবার স্ক্যান</button>}
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: পিন কোড ================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#0B5C47] p-3 text-white flex justify-between items-center"><h2 className="font-bold text-sm">পিন কোড দিন</h2><button onClick={() => setIsPinModalOpen(false)} className="p-1 bg-white/20 rounded-full"><X size={16}/></button></div>
            <div className="p-4 flex flex-col gap-3 items-center">
              <Smartphone size={40} className="text-gray-400" />
              <p className="text-xs text-gray-600 text-center font-bold">{selectedDevice?.name} কানেক্ট করতে ৪ ডিজিটের পিন দিন (০০০০)</p>
              <input type="number" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="0000" maxLength={4} className="w-32 text-center text-2xl font-black tracking-widest border-b-2 border-[#1E88E5] outline-none pb-1" />
            </div>
            <div className="p-3 border-t bg-gray-50 flex gap-2">
              <button onClick={() => setIsPinModalOpen(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleConfirmPin} className="flex-1 bg-[#1E88E5] text-white py-2 rounded-lg font-bold shadow-md text-sm">কানেক্ট</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= মডাল: বিস্তারিত রিসিপ্ট সেটিংস ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex justify-center items-end sm:items-center backdrop-blur-sm">
          <div className="bg-[#EFF6F3] w-full h-[90dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            <div className="bg-[#0B5C47] p-4 flex justify-between items-center text-white shrink-0">
              <h2 className="font-bold text-base flex items-center gap-2"><Settings size={18}/> রিসিপ্ট সেটিংস</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 bg-white/20 rounded-full hover:bg-white/30"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* ৩টি ফরম্যাট সিলেকশন অপশন */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 mb-2 block">চালানের ফরম্যাট সিলেক্ট করুন</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setInvoiceFormat('A4')} className={`p-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${invoiceFormat === 'A4' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                    <FileText size={24} className={invoiceFormat === 'A4' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                    <span className="text-[11px] font-bold text-gray-800">A4 পেজ</span>
                  </button>
                  <button onClick={() => setInvoiceFormat('80mm')} className={`p-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${invoiceFormat === '80mm' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                    <LayoutTemplate size={24} className={invoiceFormat === '80mm' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                    <span className="text-[11px] font-bold text-gray-800">থার্মাল ৮০</span>
                  </button>
                  <button onClick={() => setInvoiceFormat('58mm')} className={`p-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition ${invoiceFormat === '58mm' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                    <ReceiptText size={24} className={invoiceFormat === '58mm' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                    <span className="text-[11px] font-bold text-gray-800">থার্মাল ৫৮</span>
                  </button>
                </div>
              </div>

              {/* কাস্টমাইজেশন ফর্ম */}
              <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 mb-1 block">দোকানের নাম</label>
                  <input type="text" value={receiptSettings.shopName} onChange={e => setReceiptSettings({...receiptSettings, shopName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 mb-1 block">ঠিকানা</label>
                  <input type="text" value={receiptSettings.shopAddress} onChange={e => setReceiptSettings({...receiptSettings, shopAddress: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">মোবাইল</label>
                    <input type="text" value={receiptSettings.shopPhone} onChange={e => setReceiptSettings({...receiptSettings, shopPhone: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ইমেইল</label>
                    <input type="text" value={receiptSettings.shopEmail} onChange={e => setReceiptSettings({...receiptSettings, shopEmail: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">চালান প্রিফিক্স</label>
                    <input type="text" value={receiptSettings.invoicePrefix} onChange={e => setReceiptSettings({...receiptSettings, invoicePrefix: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47] mb-1.5" placeholder="INV-" />
                    <div className="flex gap-1.5 flex-wrap">
                      {['INV-', 'MEMO-', 'CHALLAN-'].map((prefix) => (
                        <button
                          key={prefix}
                          type="button"
                          onClick={() => setReceiptSettings({ ...receiptSettings, invoicePrefix: prefix })}
                          className={`text-[10px] px-2 py-1 rounded border transition ${receiptSettings.invoicePrefix === prefix ? 'bg-[#EFF6FF] border-[#1E88E5] text-[#1E88E5] font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                          {prefix}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 mb-1 block">ফুটার টেক্সট</label>
                    <input type="text" value={receiptSettings.footerText} onChange={e => setReceiptSettings({...receiptSettings, footerText: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-[#0B5C47]" />
                  </div>
                </div>
              </div>
            </div>

            {/* মডালের ফুটার বাটন */}
            <div className="p-3 bg-white border-t flex gap-2 shrink-0">
              <button onClick={() => setIsSettingsOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold shadow-sm text-sm">বাতিল</button>
              <button onClick={handleSaveSettings} className="flex-1 bg-[#0B5C47] text-white py-2.5 rounded-xl font-bold shadow-md flex justify-center items-center gap-2 text-sm active:scale-95 transition">
                <Save size={16}/> সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}