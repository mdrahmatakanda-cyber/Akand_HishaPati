import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, HelpCircle, Printer, 
  Search, Plus, CheckCircle2, X, Settings, 
  Trash2, Star, RefreshCw, Smartphone, Save,
  FileText, LayoutTemplate, ReceiptText, ChevronRight, Eye, Loader2, Image as ImageIcon
} from 'lucide-react';
import { toBangla } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/upload';
import PremiumToast from '../components/PremiumToast';
import { ReceiptModal, DEFAULT_RECEIPT_SETTINGS, getMergedReceiptSettings, formatReceiptNumber, type ReceiptSettings, type ReceiptTypeKey, type ReceiptData } from './ReceiptModal';

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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'common' | 'by_type'>('common');
  const [activeReceiptTab, setActiveReceiptTab] = useState<ReceiptTypeKey>('sale');
  const [invoiceFormat, setInvoiceFormat] = useState<'A4' | 'A5' | 'custom'>('A4');
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() => getMergedReceiptSettings(null, activeBusiness));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const normalizeFormat = (f: any): 'A4' | 'A5' | 'custom' => (f === 'A5' || f === 'custom' ? f : 'A4');

  useEffect(() => {
    if (!activeBusiness?.id) return;
    const loadFromSupabase = async () => {
      try {
        const localSaved = localStorage.getItem(`receipt_settings_${activeBusiness.id}`);
        if (localSaved) {
          const mergedLocal = getMergedReceiptSettings(JSON.parse(localSaved), activeBusiness);
          const safeLocalFmt = normalizeFormat(mergedLocal.format);
          setReceiptSettings({ ...mergedLocal, format: safeLocalFmt });
          setInvoiceFormat(safeLocalFmt);
        } else {
          setReceiptSettings(getMergedReceiptSettings(null, activeBusiness));
        }

        const { data, error } = await supabase
          .from('businesses')
          .select('receipt_settings')
          .eq('id', activeBusiness.id)
          .single();

        if (!error && data?.receipt_settings && Object.keys(data.receipt_settings).length > 0) {
          const mergedCloud = getMergedReceiptSettings(data.receipt_settings, activeBusiness);
          const safeCloudFmt = normalizeFormat(mergedCloud.format);
          setReceiptSettings({ ...mergedCloud, format: safeCloudFmt });
          setInvoiceFormat(safeCloudFmt);
          localStorage.setItem(`receipt_settings_${activeBusiness.id}`, JSON.stringify({ ...mergedCloud, format: safeCloudFmt }));
        }
      } catch (err) {
        console.error('Receipt settings load error:', err);
      }
    };
    loadFromSupabase();
  }, [activeBusiness?.id]);

  const handleSaveSettings = async () => {
    if (!activeBusiness?.id) return showToast('বিজনেস পাওয়া যায়নি!', 'error');
    setIsSavingSettings(true);
    try {
      let finalLogoUrl = receiptSettings.shopLogoUrl || '';
      if (logoFile) {
        finalLogoUrl = await uploadImageToSupabase(logoFile, 'logos');
      }

      const dataToSave: ReceiptSettings = { ...receiptSettings, shopLogoUrl: finalLogoUrl, format: invoiceFormat };
      const { error } = await supabase
        .from('businesses')
        .update({ receipt_settings: dataToSave })
        .eq('id', activeBusiness.id);
      if (error) throw error;

      localStorage.setItem(`receipt_settings_${activeBusiness.id}`, JSON.stringify(dataToSave));
      setReceiptSettings(dataToSave);
      setLogoFile(null);
      setLogoPreviewUrl('');
      showToast('রিসিপ্ট সেটিংস ক্লাউডে সেভ হয়েছে!', 'success');
      setIsSettingsOpen(false);
    } catch (err: any) {
      showToast('সেভ করতে সমস্যা হয়েছে: ' + err.message, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateTypeConfig = (key: keyof typeof DEFAULT_RECEIPT_SETTINGS.types.sale, val: any) => {
    setReceiptSettings(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [activeReceiptTab]: { ...prev.types[activeReceiptTab], [key]: val }
      }
    }));
  };

  const getSampleReceiptData = (rType: ReceiptTypeKey): ReceiptData => {
    const cfg = receiptSettings.types[rType];
    const isExp = rType === 'expense';
    return {
      type: rType,
      invoiceNo: formatReceiptNumber(cfg, undefined, receiptSettings.badgeText),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: isExp ? 'পরিশোধিত' : 'আংশিক জমা',
      shopName: receiptSettings.shopName,
      shopAddress: receiptSettings.shopAddress,
      shopPhone: receiptSettings.shopPhone,
      shopEmail: receiptSettings.shopEmail,
      shopLogoUrl: receiptSettings.shopLogoUrl,
      shopDescription: receiptSettings.shopTagline,
      customerName: isExp ? 'অফিস ভাড়া ও স্টাফ খরচ' : rType === 'purchase' ? 'নিউজা এগ্রো কোম্পানি' : 'মেসার্স ভাই ভাই ট্রেডার্স',
      proprietor: 'মোঃ করিম মিয়া',
      customerPhone: '01711-000000',
      customerAddress: 'গাজীপুর সদর',
      marketName: 'চৌরাস্তা বাজার',
      officerName: 'রফিকুল ইসলাম',
      officerPhone: '01811-000000',
      officerEmail: 'officer@hishabpati.com',
      receiptTime: '১২:৩০ PM',
      vehicleNo: 'ঢাকা মেট্রো-ট ১১-২২৩৩',
      driverName: 'সোহেল রানা',
      driverPhone: '01911-000000',
      transportRent: isExp ? 0 : 1200,
      items: isExp
        ? [{ id: '1', name: 'গুদাম ভাড়া (মাসিক)', quantity: 1, unit: 'মাস', unitPrice: 15000, totalPrice: 15000 }]
        : [
            { id: '1', name: 'ব্রয়লার স্টার্টার ফিড (৫০ কেজি)', category: 'ফিড', quantity: 20, unit: 'বস্তা', unitPrice: 2800, totalPrice: 56000 },
            { id: '2', name: 'লেয়ার লে-১ ফিড (৫০ কেজি)', category: 'ফিড', quantity: 10, unit: 'বস্তা', unitPrice: 2600, totalPrice: 26000 },
          ],
      totalBags: isExp ? 0 : 30,
      totalPieces: 0,
      subtotal: isExp ? 15000 : 82000,
      discount: 0,
      grandTotal: isExp ? 15000 : 83200,
      paidAmount: isExp ? 15000 : 50000,
      dueAmount: isExp ? 0 : 33200,
      previousDue: 12000,
      paidInWords: isExp ? 'পনেরো হাজার টাকা মাত্র' : 'পঞ্চাশ হাজার টাকা মাত্র',
      note: 'নমুনা রিসিপ্ট প্রিভিউ',
      batch: 'B-204',
      challan: 'CH-889',
    };
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

      {/* ================= ফুল-স্ক্রিন পেজ: রিসিপ্ট সেটিংস ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#EFF6F3] z-[120] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          
          {/* টপ হেডার ও ২টি মেইন ট্যাব */}
          <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0">
            <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-bold text-base leading-tight">রিসিপ্ট সেটিংস</h2>
                  <p className="text-[10px] text-emerald-100">ডিজাইন, তথ্য ও প্রিন্ট কাস্টমাইজ করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
              >
                <Eye size={14}/> প্রিভিউ
              </button>
            </div>

            <div className="max-w-3xl mx-auto flex px-3 gap-2 pb-2">
              <button
                type="button"
                onClick={() => setSettingsTab('common')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${settingsTab === 'common' ? 'bg-white text-[#0B5C47] shadow-sm' : 'bg-white/10 text-white/85'}`}
              >
                সব রিসিপ্টের কমন তথ্য
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('by_type')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${settingsTab === 'by_type' ? 'bg-white text-[#0B5C47] shadow-sm' : 'bg-white/10 text-white/85'}`}
              >
                রিসিপ্টের ধরন অনুযায়ী
              </button>
            </div>
          </header>

          {/* মূল বডি */}
          <div className="flex-1 overflow-y-auto p-3 pb-24">
            <div className="max-w-3xl mx-auto flex flex-col gap-3">

              {/* ==================== ট্যাব ১: কমন তথ্য ==================== */}
              {settingsTab === 'common' && (
                <>
                  {/* কার্ড ১: পেপার ও প্রিন্ট */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="w-1.5 h-4 bg-[#0B5C47] rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">পেপার সাইজ ও প্রিন্ট অপশন</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setInvoiceFormat('A4')} className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${invoiceFormat === 'A4' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                        <FileText size={20} className={invoiceFormat === 'A4' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                        <span className="text-[11px] font-bold text-gray-800">A4 পেজ</span>
                      </button>
                      <button type="button" onClick={() => setInvoiceFormat('A5')} className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${invoiceFormat === 'A5' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                        <LayoutTemplate size={20} className={invoiceFormat === 'A5' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                        <span className="text-[11px] font-bold text-gray-800">A5 পেজ</span>
                      </button>
                      <button type="button" onClick={() => setInvoiceFormat('custom')} className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition ${invoiceFormat === 'custom' ? 'border-[#1E88E5] bg-[#EFF6FF]' : 'border-gray-200 bg-white'}`}>
                        <ReceiptText size={20} className={invoiceFormat === 'custom' ? 'text-[#1E88E5]' : 'text-gray-400'} />
                        <span className="text-[11px] font-bold text-gray-800">কাস্টম</span>
                      </button>
                    </div>

                    {invoiceFormat === 'custom' && (
                      <div className="grid grid-cols-2 gap-2.5 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 mb-1 block">প্রস্থ (mm)</label>
                          <input
                            type="number"
                            min={80}
                            max={350}
                            value={receiptSettings.customWidthMm ?? 148}
                            onChange={e => setReceiptSettings({ ...receiptSettings, customWidthMm: Number(e.target.value) || 148 })}
                            className="w-full border border-gray-300 rounded-lg p-1.5 text-sm font-bold bg-white outline-none focus:border-[#1E88E5]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 mb-1 block">উচ্চতা (mm)</label>
                          <input
                            type="number"
                            min={100}
                            max={450}
                            value={receiptSettings.customHeightMm ?? 210}
                            onChange={e => setReceiptSettings({ ...receiptSettings, customHeightMm: Number(e.target.value) || 210 })}
                            className="w-full border border-gray-300 rounded-lg p-1.5 text-sm font-bold bg-white outline-none focus:border-[#1E88E5]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">লেখার সাইজ</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[{ k: 'small', l: 'ছোট' }, { k: 'medium', l: 'মাঝারি' }, { k: 'large', l: 'বড়' }].map(f => (
                            <button key={f.k} type="button" onClick={() => setReceiptSettings({ ...receiptSettings, fontSize: f.k as any })} className={`py-1.5 rounded-lg border text-[10px] font-bold ${receiptSettings.fontSize === f.k ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{f.l}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">প্রিন্ট কপি</label>
                        <div className="grid grid-cols-2 gap-1">
                          <button type="button" onClick={() => setReceiptSettings({ ...receiptSettings, copyMode: 'single' })} className={`py-1.5 rounded-lg border text-[10px] font-bold ${receiptSettings.copyMode === 'single' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>১ কপি</button>
                          <button type="button" onClick={() => setReceiptSettings({ ...receiptSettings, copyMode: 'double' })} className={`py-1.5 rounded-lg border text-[10px] font-bold ${receiptSettings.copyMode === 'double' ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>২ কপি</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* কার্ড ২: প্রতিষ্ঠানের পরিচয় */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="w-1.5 h-4 bg-[#1E88E5] rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">প্রতিষ্ঠানের পরিচয়</h3>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">দোকান / প্রতিষ্ঠানের নাম</label>
                      <input type="text" value={receiptSettings.shopName} onChange={e => setReceiptSettings({...receiptSettings, shopName: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">ব্যবসার বিবরণ / ট্যাগলাইন</label>
                      <input type="text" value={receiptSettings.shopTagline} onChange={e => setReceiptSettings({...receiptSettings, shopTagline: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">ঠিকানা</label>
                      <input type="text" value={receiptSettings.shopAddress} onChange={e => setReceiptSettings({...receiptSettings, shopAddress: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 mb-1 block">মোবাইল</label>
                        <input type="text" value={receiptSettings.shopPhone} onChange={e => setReceiptSettings({...receiptSettings, shopPhone: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 mb-1 block">ইমেইল</label>
                        <input type="text" value={receiptSettings.shopEmail} onChange={e => setReceiptSettings({...receiptSettings, shopEmail: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                      </div>
                    </div>
                  </div>

                  {/* কার্ড ৩: লোগো, ব্যাজ ও থিম কালার */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="w-1.5 h-4 bg-[#B98F33] rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">লোগো ও রঙের ধরন</h3>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1.5 block">প্রতিষ্ঠানের লোগো (গ্যালারি থেকে আপলোড)</label>
                      <input
                        type="file"
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLogoFile(file);
                            setLogoPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="hidden"
                      />
                      {(logoPreviewUrl || receiptSettings.shopLogoUrl) ? (
                        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={logoPreviewUrl || receiptSettings.shopLogoUrl} alt="Logo" className="w-12 h-12 rounded-full object-contain border border-gray-300 bg-white shrink-0" />
                            <span className="text-xs font-bold text-gray-700 truncate">{logoFile ? logoFile.name : 'লোগো যুক্ত করা হয়েছে'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => logoInputRef.current?.click()} className="px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] text-[#1565C0] text-[11px] font-bold border border-[#1565C0]/20">পরিবর্তন</button>
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreviewUrl('');
                                setReceiptSettings({ ...receiptSettings, shopLogoUrl: '' });
                              }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200"
                              title="লোগো সরান"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 text-gray-600 hover:border-[#0B5C47] hover:text-[#0B5C47] transition"
                        >
                          <ImageIcon size={18} />
                          <span className="text-xs font-bold">গ্যালারি থেকে লোগো আপলোড করুন</span>
                        </button>
                      )}
                    </div>

                    {/* লোগো আপলোড না থাকলেই কেবল লোগো ব্যাজ অপশন দেখাবে */}
                    {!(logoPreviewUrl || receiptSettings.shopLogoUrl) && (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 mb-1 block">লোগো ব্যাজ (উপরে)</label>
                          <input type="text" maxLength={4} value={receiptSettings.badgeText} onChange={e => setReceiptSettings({...receiptSettings, badgeText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-gray-600 mb-1 block">লোগো ব্যাজ (নিচে)</label>
                          <input type="text" maxLength={8} value={receiptSettings.badgeSubText} onChange={e => setReceiptSettings({...receiptSettings, badgeSubText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                        </div>
                      </div>
                    )}
                    {/* ১. লেখার কালার */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] font-bold text-gray-600">লেখার কালার</label>
                        <input
                          type="color"
                          value={receiptSettings.textColor || '#1B2A41'}
                          onChange={e => setReceiptSettings({ ...receiptSettings, textColor: e.target.value })}
                          className="w-7 h-6 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                          title="কাস্টম লেখার কালার"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'নেভি', color: '#1B2A41' },
                          { label: 'কালো', color: '#111827' },
                          { label: 'সবুজ', color: '#064E3B' },
                          { label: 'নীল', color: '#0D3B80' },
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setReceiptSettings({ ...receiptSettings, textColor: c.color })}
                            className={`py-1.5 rounded-xl border text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition ${(receiptSettings.textColor || '#1B2A41') === c.color ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white'}`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ২. বর্ডার কালার */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] font-bold text-gray-600">বর্ডার কালার</label>
                        <input
                          type="color"
                          value={receiptSettings.themeColor || '#B98F33'}
                          onChange={e => setReceiptSettings({ ...receiptSettings, themeColor: e.target.value })}
                          className="w-7 h-6 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                          title="কাস্টম বর্ডার কালার"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'সোনালী', color: '#B98F33' },
                          { label: 'সবুজ', color: '#0B5C47' },
                          { label: 'নীল', color: '#1565C0' },
                          { label: 'নেভি', color: '#1B2A41' },
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setReceiptSettings({ ...receiptSettings, themeColor: c.color })}
                            className={`py-1.5 rounded-xl border text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition ${receiptSettings.themeColor === c.color ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white'}`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ৩. ব্যাকগ্রাউন্ড কালার (শুধু রিসিপ্টের প্রধান অংশে, মূল কাগজ সাদাই থাকবে) */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[11px] font-bold text-gray-600">ব্যাকগ্রাউন্ড কালার (প্রধান অংশ)</label>
                        <input
                          type="color"
                          value={receiptSettings.bgColor && receiptSettings.bgColor !== 'none' ? receiptSettings.bgColor : '#1565C0'}
                          onChange={e => setReceiptSettings({ ...receiptSettings, bgColor: e.target.value })}
                          className="w-7 h-6 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                          title="কাস্টম ব্যাকগ্রাউন্ড কালার"
                        />
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { label: 'সোনালী', color: '#B98F33' },
                          { label: 'সবুজ', color: '#0B5C47' },
                          { label: 'নীল', color: '#1565C0' },
                          { label: 'ধূসর', color: '#64748B' },
                          { label: 'সাদা', color: 'none' },
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setReceiptSettings({ ...receiptSettings, bgColor: c.color })}
                            className={`py-1.5 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition ${(receiptSettings.bgColor || receiptSettings.themeColor) === c.color ? 'border-gray-900 bg-gray-100' : 'border-gray-200 bg-white'}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-gray-300" style={{ backgroundColor: c.color === 'none' ? '#ffffff' : c.color }} />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* কার্ড ৪: শুভেচ্ছা বার্তা ও ফুটার ১ */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">শুভেচ্ছা বার্তা ও ফুটার</h3>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">শুভেচ্ছা বার্তা (স্বাক্ষরের একটু উপরে)</label>
                      <textarea rows={2} value={receiptSettings.greetingText} onChange={e => setReceiptSettings({...receiptSettings, greetingText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">ফুটার ১ (নিচে সেন্টারে)</label>
                      <textarea rows={2} value={receiptSettings.footerText} onChange={e => setReceiptSettings({...receiptSettings, footerText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0B5C47]" />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          'সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত ডিজিটাল রিসিপ্ট।',
                          'ডিজিটাল পদ্ধতিতে প্রস্তুতকৃত রিসিপ্ট — যেকোনো প্রয়োজনে অফিসে যোগাযোগ করুন।',
                          'পণ্য ও হিসাব বুঝে নিয়ে স্বাক্ষর করুন। আপনার আস্থাই আমাদের মূলধন।',
                          'ডিজিটাল মেমো • দ্রুত, নির্ভুল ও নির্ভরযোগ্য হিসাব ব্যবস্থাপনা।',
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setReceiptSettings({ ...receiptSettings, footerText: preset })}
                            className={`text-[10px] px-2.5 py-1 rounded-lg border text-left transition ${receiptSettings.footerText === preset ? 'bg-[#EFF6FF] border-[#1E88E5] text-[#1E88E5] font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                          >
                            প্রিসেট {toBangla(idx + 1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ==================== ট্যাব ২: রিসিপ্টের ধরন অনুযায়ী ==================== */}
              {settingsTab === 'by_type' && (
                <>
                  {/* ৪টি রিসিপ্টের ধরন */}
                  <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-sm grid grid-cols-4 gap-1.5">
                    {[
                      { k: 'sale', l: 'বিক্রি' },
                      { k: 'purchase', l: 'ক্রয়' },
                      { k: 'transfer', l: 'ট্রান্সফার' },
                      { k: 'expense', l: 'খরচ' },
                    ].map(tab => (
                      <button
                        key={tab.k}
                        type="button"
                        onClick={() => setActiveReceiptTab(tab.k as ReceiptTypeKey)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition ${activeReceiptTab === tab.k ? 'bg-[#0B5C47] text-white shadow-sm' : 'bg-gray-50 text-gray-600'}`}
                      >
                        {tab.l}
                      </button>
                    ))}
                  </div>

                  {/* শিরোনাম ও প্রিফিক্স */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <span className="w-1.5 h-4 bg-[#0B5C47] rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">শিরোনাম ও নম্বর প্রিফিক্স</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 mb-1 block">শিরোনাম (বাংলা)</label>
                        <input type="text" value={receiptSettings.types[activeReceiptTab].title} onChange={e => updateTypeConfig('title', e.target.value)} className="w-full border border-gray-300 rounded-xl p-2 text-sm outline-none focus:border-[#0B5C47]" />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 mb-1 block">সাবটাইটেল (ইংরেজি)</label>
                        <input type="text" value={receiptSettings.types[activeReceiptTab].subtitle} onChange={e => updateTypeConfig('subtitle', e.target.value)} className="w-full border border-gray-300 rounded-xl p-2 text-sm outline-none focus:border-[#0B5C47]" />
                      </div>
                    </div>

                    {/* রিসিপ্ট নম্বর ফরম্যাট */}
                    <div className="pt-2.5 border-t border-gray-100 flex flex-col gap-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-gray-600">রিসিপ্ট নম্বর ফরম্যাট</label>
                        <span className="text-[11px] font-bold text-[#0B5C47] bg-[#EFF6F3] border border-[#0B5C47]/20 px-2.5 py-0.5 rounded-md">
                          উদাহরণ: #{formatReceiptNumber(receiptSettings.types[activeReceiptTab], undefined, receiptSettings.badgeText)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {[
                          {
                            k: 'brand_year_seq',
                            title: '[ব্র্যান্ড/কোম্পানির সংক্ষিপ্ত রূপ]-[সাল]-[ক্রমিক নম্বর]',
                            ex: 'DA-2026-0001',
                            defaultDigits: 4,
                            defaultStart: 1,
                          },
                          {
                            k: 'day_month_seq',
                            title: '[তারিখ/মাস]-[ক্রমিক নম্বর]',
                            ex: '1711-001 (১৭ নভেম্বর তারিখের ১ নম্বর রিসিপ্ট)',
                            defaultDigits: 3,
                            defaultStart: 1,
                          },
                          {
                            k: 'code_seq',
                            title: '[সংক্ষিপ্ত কোড]-[ক্রমিক নম্বর]',
                            ex: 'INV-1050 বা REC-501',
                            defaultDigits: 0,
                            defaultStart: 1050,
                          },
                          {
                            k: 'custom',
                            title: 'কাস্টম ফরম্যাট (নিজের মতো সাজান)',
                            ex: 'যেমন: DA/1711/001 অথবা INV-2026-501',
                            defaultDigits: 3,
                            defaultStart: 1,
                          },
                        ].map(fmt => {
                          const currentCfg = receiptSettings.types[activeReceiptTab];
                          const isSelected = (currentCfg.numberFormat || 'brand_year_seq') === fmt.k;
                          return (
                            <button
                              key={fmt.k}
                              type="button"
                              onClick={() => {
                                setReceiptSettings(prev => ({
                                  ...prev,
                                  types: {
                                    ...prev.types,
                                    [activeReceiptTab]: {
                                      ...prev.types[activeReceiptTab],
                                      numberFormat: fmt.k as any,
                                      seqDigits: fmt.defaultDigits,
                                      startSeq: prev.types[activeReceiptTab].startSeq ?? fmt.defaultStart,
                                    }
                                  }
                                }));
                              }}
                              className={`p-2.5 rounded-xl border text-left transition ${isSelected ? 'bg-[#EFF6FF] border-[#1E88E5] text-[#1565C0]' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                            >
                              <p className="text-[11.5px] font-bold">{fmt.title}</p>
                              <p className="text-[10.5px] opacity-85 mt-0.5">উদাহরণ: <span className="font-bold">{fmt.ex}</span></p>
                            </button>
                          );
                        })}
                      </div>

                      {/* নম্বর কাস্টমাইজেশন */}
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex flex-col gap-2.5">
                        <p className="text-[10.5px] font-bold text-[#0B5C47]">নম্বর কাস্টমাইজেশন</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">ব্র্যান্ড সংক্ষিপ্ত রূপ</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={receiptSettings.types[activeReceiptTab].brandCode ?? receiptSettings.badgeText}
                              onChange={e => updateTypeConfig('brandCode', e.target.value.toUpperCase())}
                              placeholder="DA"
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:border-[#0B5C47]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">সংক্ষিপ্ত কোড (INV / REC)</label>
                            <input
                              type="text"
                              maxLength={10}
                              value={(receiptSettings.types[activeReceiptTab].prefix || '').replace(/[-/]+$/g, '')}
                              onChange={e => updateTypeConfig('prefix', e.target.value.toUpperCase())}
                              placeholder="INV"
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:border-[#0B5C47]"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {['INV', 'REC', 'PUR', 'TRN', 'EXP'].map(code => (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => updateTypeConfig('prefix', code)}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600 font-bold hover:border-[#0B5C47]"
                                >
                                  {code}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">শুরুর ক্রমিক নম্বর</label>
                            <input
                              type="number"
                              min={1}
                              value={receiptSettings.types[activeReceiptTab].startSeq ?? 1}
                              onChange={e => updateTypeConfig('startSeq', Math.max(1, Number(e.target.value) || 1))}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:border-[#0B5C47]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">ডিজিট (০ সহ)</label>
                            <select
                              value={receiptSettings.types[activeReceiptTab].seqDigits ?? (receiptSettings.types[activeReceiptTab].numberFormat === 'brand_year_seq' ? 4 : receiptSettings.types[activeReceiptTab].numberFormat === 'day_month_seq' ? 3 : 0)}
                              onChange={e => updateTypeConfig('seqDigits', Number(e.target.value))}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:border-[#0B5C47]"
                            >
                              <option value={0}>সাধারণ (1050)</option>
                              <option value={3}>৩ ডিজিট (001)</option>
                              <option value={4}>৪ ডিজিট (0001)</option>
                              <option value={5}>৫ ডিজিট (00001)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">মাঝের চিহ্ন</label>
                            <div className="grid grid-cols-2 gap-1">
                              {['-', '/'].map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => updateTypeConfig('separator', s)}
                                  className={`py-1.5 rounded-lg border text-xs font-bold ${(receiptSettings.types[activeReceiptTab].separator || '-') === s ? 'bg-[#0B5C47] text-white border-[#0B5C47]' : 'bg-white text-gray-600 border-gray-300'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {receiptSettings.types[activeReceiptTab].numberFormat === 'custom' && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">কাস্টম প্যাটার্ন</label>
                            <input
                              type="text"
                              value={receiptSettings.types[activeReceiptTab].customTemplate || '{CODE}-{YYYY}-{SEQ}'}
                              onChange={e => updateTypeConfig('customTemplate', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg p-1.5 text-xs font-bold bg-white outline-none focus:border-[#0B5C47]"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {[
                                { tag: '{BRAND}', label: 'ব্র্যান্ড' },
                                { tag: '{CODE}', label: 'কোড' },
                                { tag: '{YYYY}', label: 'সাল' },
                                { tag: '{DDMM}', label: 'তারিখ/মাস' },
                                { tag: '{SEQ}', label: 'ক্রমিক' },
                              ].map(t => (
                                <button
                                  key={t.tag}
                                  type="button"
                                  onClick={() => updateTypeConfig('customTemplate', (receiptSettings.types[activeReceiptTab].customTemplate || '') + t.tag)}
                                  className="text-[9.5px] px-2 py-0.5 rounded bg-white border border-gray-300 text-[#0B5C47] font-bold"
                                >
                                  + {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* সেকশন শো/হাইড টগল */}
                  <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-1">
                      <span className="w-1.5 h-4 bg-[#1E88E5] rounded-full" />
                      <h3 className="text-xs font-bold text-[#0F2A3D]">এই রিসিপ্টে যা যা দেখাবে</h3>
                    </div>

                    {[
                      { key: 'showPartyInfo', label: 'পার্টি / ক্রেতা / খরচের তথ্য দেখান' },
                      { key: 'showOfficer', label: 'অফিসারের তথ্য দেখান' },
                      ...(activeReceiptTab !== 'expense' ? [{ key: 'showTransport', label: 'পরিবহন (গাড়ি/ড্রাইভার) তথ্য দেখান' }] : []),
                      { key: 'showPriceAndTotals', label: activeReceiptTab === 'transfer' ? 'দর ও টাকার হিসাব দেখান (বন্ধ রাখলে শুধু পরিমাণ দেখাবে)' : 'দর ও মোট টাকার হিসাব দেখান' },
                      ...(activeReceiptTab === 'sale' || activeReceiptTab === 'purchase' ? [{ key: 'showPreviousDue', label: 'পূর্বের বাকি + সর্বমোট বাকি দেখান' }] : []),
                      { key: 'showInWords', label: 'টাকা কথায় দেখান' },
                      { key: 'showWatermark', label: 'মাঝখানে হালকা ওয়াটারমার্ক দেখান' },
                      { key: 'showSignatures', label: 'স্বাক্ষরের সারি দেখান' },
                    ].map(item => {
                      const checked = Boolean((receiptSettings.types[activeReceiptTab] as any)[item.key]);
                      return (
                        <div
                          key={item.key}
                          onClick={() => updateTypeConfig(item.key as any, !checked)}
                          className="flex justify-between items-center cursor-pointer py-2 px-2.5 rounded-xl bg-gray-50 border border-gray-100 active:scale-[0.99] transition"
                        >
                          <span className="text-xs font-bold text-gray-700 pr-2">{item.label}</span>
                          <div className={`w-10 h-5 rounded-full relative shrink-0 transition ${checked ? 'bg-[#0B5C47]' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

            </div>
          </div>

          {/* বটম স্থির বাটন বার */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-3 z-30 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
            <div className="max-w-3xl mx-auto flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex-1 bg-[#EFF6FF] text-[#1565C0] border border-[#1565C0]/30 py-3 rounded-xl font-bold shadow-sm flex justify-center items-center gap-1.5 text-xs active:scale-95 transition"
              >
                <Eye size={16}/> প্রিভিউ ({activeReceiptTab === 'sale' ? 'বিক্রি' : activeReceiptTab === 'purchase' ? 'ক্রয়' : activeReceiptTab === 'transfer' ? 'ট্রান্সফার' : 'খরচ'})
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex-1 bg-[#0B5C47] text-white py-3 rounded-xl font-bold shadow-md flex justify-center items-center gap-1.5 text-sm active:scale-95 transition disabled:opacity-60"
              >
                {isSavingSettings ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16}/> সেভ করুন</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= লাইভ রিসিপ্ট প্রিভিউ ও টেস্ট প্রিন্ট ================= */}
      <ReceiptModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onCancel={() => setIsPreviewOpen(false)}
        onFinalize={() => setIsPreviewOpen(false)}
        isSaving={false}
        previewOnly={true}
        settingsOverride={{ ...receiptSettings, shopLogoUrl: logoPreviewUrl || receiptSettings.shopLogoUrl, format: invoiceFormat }}
        data={getSampleReceiptData(activeReceiptTab)}
      />

    </div>
  );
}