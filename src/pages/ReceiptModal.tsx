import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Download, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ReceiptItem {
  id: string;
  name: string;
  category?: string;
  brandCategory?: string;
  companyName?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  invoiceNo: string;
  date: string;
  status: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  shopLogoUrl?: string;
  shopDescription?: string;
  tableNote?: string;
  
  customerName: string;
  proprietor: string;
  customerPhone: string;
  customerAddress: string;
  marketName: string;
  
  // অফিসারের তথ্য
  officerName: string;
  officerPhone: string;
  officerEmail: string;
  receiptTime: string;

  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  transportRent: number;

  items: ReceiptItem[];
  totalBags: number;
  totalPieces: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paidInWords?: string;
  note?: string;
  footerText1?: string;
  footerText2?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: () => void;
  onCancel: () => void;
  isSaving: boolean;
  data: ReceiptData | null;
}

const PAGE_W = 794;
const PAGE_H = 1039;
const INK = 'text-[#1B2A41]';
const MUTED = 'text-[#4A5568]';
const GOLD = '#B98F33';

const formatTaka = (amount: number) => '৳ ' + (amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 0 });

const RECEIPT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap');
  .rm-paper, .rm-paper * { font-family: 'Noto Serif Bengali', 'Tiro Bangla', 'SolaimanLipi', Georgia, serif !important; }
  #receipt-print-root { position: fixed; left: -99999px; top: 0; width: 210mm; visibility: hidden; pointer-events: none; z-index: -1; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4 portrait; margin: 0; }
    html, body { display: block !important; position: static !important; visibility: visible !important; margin: 0 !important; padding: 0 !important; width: 210mm !important; height: auto !important; overflow: visible !important; background: #fff !important; }
    body > *:not(#receipt-print-root) { display: none !important; }
    body > #receipt-print-root { display: block !important; position: static !important; left: auto !important; top: auto !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; z-index: auto !important; width: 210mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    #receipt-print-root * { visibility: visible !important; }
    #receipt-print-root .rm-paper { width: 210mm !important; height: auto !important; min-height: 275mm !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; }
  }
`;

const ReceiptPaper: React.FC<{ data: ReceiptData; style?: React.CSSProperties; ref?: React.Ref<HTMLDivElement> }> = ({ data, style, ref }) => {
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1 mb-1 pb-1 border-b border-[#E6DBBE]">
      <span className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
      <h3 className={`font-bold text-[11.5px] ${INK}`}>{children}</h3>
    </div>
  );

  return (
    <div ref={ref} className={`rm-paper bg-white ${INK} relative`} style={{ width: PAGE_W, minHeight: PAGE_H, boxSizing: 'border-box', padding: 14, fontSize: 12.5, lineHeight: 1.4, ...style }}>
      <div className="min-h-full flex flex-col" style={{ border: `1.5px solid ${GOLD}`, outline: '1px solid #E6DBBE', outlineOffset: 3, padding: '20px 24px 16px', boxSizing: 'border-box' }}>
        
        <div className="grid grid-cols-[1.5fr,1fr] gap-4 items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[58px] h-[58px] shrink-0 rounded-full bg-[#FBF5E6] flex items-center justify-center overflow-hidden" style={{ border: `2px solid ${GOLD}` }}>
              {data.shopLogoUrl ? <img src={data.shopLogoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" /> : <div className="text-center leading-none"><div className="text-[18px] font-bold text-[#1B2A41]">DA</div><div className="text-[8px] font-semibold mt-0.5" style={{ color: GOLD }}>AGRO</div></div>}
            </div>
            <div className="min-w-0">
              <h1 className={`text-[22px] font-bold uppercase leading-tight ${INK}`}>{data.shopName}</h1>
              <p className="text-[11.5px] font-semibold text-[#2B5C8A] mt-0.5">{data.shopDescription}</p>
              <p className={`text-[11.5px] mt-0.5 ${MUTED}`}>ফোন: {data.shopPhone}<span className="mx-2 text-[#B8C0CC]">|</span>ইমেইল: {data.shopEmail}</p>
            </div>
          </div>
          <div className="rounded-md overflow-hidden border border-[#E6DBBE] bg-white">
            <div className="flex justify-between items-baseline px-3 py-1.5 bg-[#FBF5E6] border-b border-[#E6DBBE]"><span className={`font-bold text-[13px] ${INK}`}>বিক্রয় চালান</span><span className="font-semibold text-[10.5px] text-[#7A5E1E]">SALES INVOICE</span></div>
            <div className="px-3 py-1.5 text-[12px] space-y-0.5">
              <div className="flex justify-between"><span className={MUTED}>চালান নং:</span><span className="font-bold text-[#2B5C8A]">#{data.invoiceNo}</span></div>
              <div className="flex justify-between"><span className={MUTED}>তারিখ:</span><span className="font-semibold">{data.date}</span></div>
              <div className="flex justify-between items-center"><span className={MUTED}>স্ট্যাটাস:</span><span className="px-2 rounded-full border border-[#E3C772] bg-[#FDF3D4] text-[#6B4E0F] text-[11px] font-bold">{data.status}</span></div>
            </div>
          </div>
        </div>

        <div className="my-3" style={{ borderTop: `1px solid ${GOLD}`, borderBottom: `1px solid ${GOLD}`, height: 4 }} />

        <div className="grid grid-cols-3 gap-2 text-[11px] leading-tight">
          <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-2 py-1.5">
            <SectionTitle>ক্রেতা / দোকান</SectionTitle>
            <p className="font-bold text-[12px] leading-tight mb-0.5">{data.customerName}</p>
            <p><span className={MUTED}>প্রোপ্রাইটর: </span>{data.proprietor}</p>
            <p><span className={MUTED}>ফোন: </span>{data.customerPhone}</p>
            <p className="truncate"><span className={MUTED}>ঠিকানা: </span>{data.customerAddress}</p>
            <p className="truncate"><span className={MUTED}>বাজার: </span>{data.marketName}</p>
          </div>
          
          <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-2 py-1.5">
            <SectionTitle>অফিসার ও ডেলিভারি</SectionTitle>
            <p className="font-bold text-[12px] leading-tight mb-0.5">{data.officerName}</p>
            <p><span className={MUTED}>ফোন: </span>{data.officerPhone}</p>
            <p className="break-all"><span className={MUTED}>ইমেইল: </span>{data.officerEmail}</p>
            <p className="mt-0.5"><span className={MUTED}>সময়:</span> <span className="font-semibold">{data.receiptTime}</span></p>
          </div>

          <div className="rounded-md border border-[#EADFC0] bg-[#FDFAF0] px-2 py-1.5">
            <SectionTitle>পরিবহন ও গাড়ির তথ্য</SectionTitle>
            <p><span className={MUTED}>গাড়ি নাম্বার: </span><span className="font-semibold">{data.vehicleNo || 'N/A'}</span></p>
            <p><span className={MUTED}>ড্রাইভার: </span>{data.driverName || 'N/A'}</p>
            <p><span className={MUTED}>ড্রাইভার ফোন: </span>{data.driverPhone || 'N/A'}</p>
            <p className="mt-0.5"><span className={MUTED}>গাড়ি ভাড়া: </span><span className="font-bold text-[#2B5C8A]">{formatTaka(data.transportRent)}</span></p>
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-3 relative">
          <table className="w-full h-full border-collapse text-[12px] border border-[#CBD3DF]" style={{ tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: 38 }} /><col /><col style={{ width: 108 }} /><col style={{ width: 84 }} /><col style={{ width: 112 }} /></colgroup>
            <thead>
              <tr className="bg-[#EAF0F8]" style={{ borderBottom: `2px solid ${GOLD}` }}>
                <th className="py-1.5 px-2 text-center font-bold border-r border-[#D5DCE8]">#</th>
                <th className="py-1.5 px-3 text-left font-bold border-r border-[#D5DCE8]">পণ্যের বিবরণ</th>
                <th className="py-1.5 px-2 text-center font-bold border-r border-[#D5DCE8]">মোট পরিমাণ</th>
                <th className="py-1.5 px-2 text-right font-bold border-r border-[#D5DCE8]">দর (৳)</th>
                <th className="py-1.5 px-3 text-right font-bold">মোট টাকা (৳)</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const company = item.companyName || (item.brandCategory && item.brandCategory !== item.category ? item.brandCategory : undefined);
                const meta = [item.category, company].filter(Boolean).join(' • ');
                return (
                  <tr key={item.id || index} className="border-b border-[#E3E8F0]">
                    <td className={`py-1.5 px-2 text-center border-r border-[#E3E8F0] ${MUTED}`}>{(index + 1).toLocaleString('bn-BD', { minimumIntegerDigits: 2 })}</td>
                    <td className="py-1.5 px-3 border-r border-[#E3E8F0] font-semibold leading-snug"><span>{item.name}</span>{meta && <span className={`ml-1.5 text-[11px] font-normal ${MUTED}`}>({meta})</span>}</td>
                    <td className="py-1.5 px-2 text-center border-r border-[#E3E8F0] font-semibold">{item.quantity} {item.unit}</td>
                    <td className="py-1.5 px-2 text-right border-r border-[#E3E8F0]">{item.unitPrice.toLocaleString('bn-BD')}</td>
                    <td className="py-1.5 px-3 text-right font-bold">{item.totalPrice.toLocaleString('bn-BD')}</td>
                  </tr>
                );
              })}
              <tr style={{ height: '100%' }}>
                <td className="border-r border-[#E3E8F0]" />
                <td className={`border-r border-[#E3E8F0] align-top px-3 pt-2 text-[11px] italic ${MUTED}`}>{data.tableNote}</td>
                <td className="border-r border-[#E3E8F0]" /><td className="border-r border-[#E3E8F0]" /><td />
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#F3F6FB] font-bold" style={{ borderTop: `1.5px solid ${GOLD}` }}>
                <td colSpan={2} className="py-2 px-3 text-right border-r border-[#D5DCE8]">সর্বমোট পণ্যের পরিমাণ:</td>
                <td className="py-2 px-2 text-center border-r border-[#D5DCE8] text-[#2B5C8A]">{data.totalBags} বস্তা</td>
                <td className="py-2 px-2 text-center border-r border-[#D5DCE8]">{data.totalPieces} পিস</td>
                <td className="py-2 px-3 text-right">{formatTaka(data.subtotal)}</td>
              </tr>
            </tfoot>
          </table>
          <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <span className="font-bold uppercase whitespace-nowrap" style={{ fontSize: 46, color: '#1B2A41', opacity: 0.04, transform: 'rotate(-18deg)' }}>{data.shopName}</span>
          </div>
        </div>

        <div className="grid grid-cols-[1.35fr,1fr] gap-3 mt-3 items-start text-[12.5px]">
          <div className="space-y-2">
            <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-3 py-2">
              <span className={MUTED}>মোট জমার পরিমাণ কথায়: </span><span className="font-bold">{data.paidInWords || 'শূন্য টাকা মাত্র'}</span>
            </div>
            <div className="rounded-md border border-[#DDE3EC] bg-white px-3 py-1.5 flex items-center justify-between text-[12px]">
              <span><span className={MUTED}>মোট বস্তা: </span><b>{data.totalBags}</b></span><span className="w-px h-4 bg-[#CBD3DF]" />
              <span><span className={MUTED}>মোট পিস: </span><b>{data.totalPieces} পিস</b></span><span className="w-px h-4 bg-[#CBD3DF]" />
              <span><span className={MUTED}>গাড়ি ভাড়া: </span><b className="text-[#2B5C8A]">{formatTaka(data.transportRent)}</b></span>
            </div>
            <div className="rounded-md bg-[#FDFAF0] px-3 py-1.5 text-[12px]" style={{ border: '1px solid #EADFC0', borderLeft: `4px solid ${GOLD}` }}>
              <p className="font-bold">নোট:</p><p>{data.note}</p>
            </div>
          </div>
          <div className="rounded-md border border-[#CBD3DF] overflow-hidden bg-white">
            <div className="px-3 py-2 space-y-1 text-[12.5px]">
              <div className="flex justify-between"><span className={MUTED}>মোট বিল:</span><span className="font-bold">{formatTaka(data.subtotal)}</span></div>
              <div className="flex justify-between"><span className={MUTED}>গাড়ি ভাড়া (আলাদা):</span><span className="font-bold text-[#2B5C8A]">{formatTaka(data.transportRent)}</span></div>
              <div className="flex justify-between"><span className={MUTED}>মোট জমা:</span><span className="font-bold text-[#2B5C8A]">- {formatTaka(data.paidAmount)}</span></div>
            </div>
            <div className="px-3 py-2.5 flex justify-between items-center bg-[#FBF1D6]" style={{ borderTop: `1.5px solid ${GOLD}` }}>
              <span className="font-bold text-[13px]">সর্বমোট বাকি:</span><span className="font-bold text-[17px]">{formatTaka(data.dueAmount)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center text-[12px] mt-3" style={{ paddingTop: 58 }}>
          <div className="pt-1.5" style={{ borderTop: '1.5px solid #8793A6' }}>
            <p className="font-bold">ক্রেতার স্বাক্ষর</p><p className={`text-[11px] ${MUTED}`}>{data.customerName}</p>
          </div>
          <div className="pt-1.5" style={{ borderTop: '1.5px solid #8793A6' }}>
            <p className="font-bold">ডেলিভারি ম্যানের স্বাক্ষর</p><p className={`text-[11px] ${MUTED}`}>{data.driverName && data.driverName !== 'N/A' ? data.driverName : '\u00A0'}{data.vehicleNo && data.vehicleNo !== 'N/A' ? ` (${data.vehicleNo})` : ''}</p>
          </div>
          <div className="pt-1.5" style={{ borderTop: `1.5px solid ${GOLD}` }}>
            <p className="font-bold">ডিলারের স্বাক্ষর ও সিল</p><p className="text-[11px] text-[#7A5E1E]">{data.shopName}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 text-[11px]" style={{ borderTop: '1px solid #E6DBBE' }}>
          <span className="font-bold">{data.footerText1}</span><span className={`font-medium ${MUTED}`}>{data.footerText2}</span>
        </div>
      </div>
    </div>
  );
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, onFinalize, onCancel, isSaving, data }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const w = scrollRef.current?.clientWidth ?? PAGE_W;
      setScale(Math.min(1, (w - 16) / PAGE_W));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handlePrint = async () => {
    try { await document.fonts?.ready; } catch {}
    requestAnimationFrame(() => window.print());
  };

  const handleDownload = async () => {
    if (!paperRef.current) return;
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${data.invoiceNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error(err);
      alert('পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে!');
    }
  };

  const handleShare = async () => {
    if (!paperRef.current) return;
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Receipt-${data.invoiceNo}.png`, { type: 'image/png' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ 
              files: [file], 
              title: `Receipt - ${data.invoiceNo}`,
              text: `${data.shopName} থেকে আপনার ক্রয়ের রিসিপ্ট` 
            });
          } catch (shareError) {
            console.log('শেয়ার ক্যান্সেল করা হয়েছে');
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Receipt-${data.invoiceNo}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    } catch (err) {
      console.error(err);
      alert('শেয়ার করতে সমস্যা হয়েছে!');
    }
  };

  return (
    <>
      {createPortal(<style>{RECEIPT_STYLES}</style>, document.head)}

      <div className="receipt-modal-preview fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-white w-full max-w-[860px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FBF5E6] border-b border-[#E6DBBE] shrink-0">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-[#B98F33]" />
              <span className="font-semibold text-sm">বিক্রয় চালান প্রিভিউ (A4)</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-700 hover:bg-[#F3E8C8] transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div ref={scrollRef} className="overflow-auto bg-slate-100 p-2 flex-1">
            <div className="mx-auto shadow-sm" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
              <ReceiptPaper data={data} ref={paperRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} />
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm">
                <Printer className="w-4 h-4" /> প্রিন্ট
              </button>
              <button onClick={handleDownload} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm border border-blue-200">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={handleShare} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm border border-green-200">
                <Share2 className="w-4 h-4" /> শেয়ার
              </button>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={onCancel} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-lg transition-colors text-sm border border-red-200">
                বাতিল করুন
              </button>
              <button onClick={onFinalize} disabled={isSaving} className="flex-[2] bg-[#0A2540] hover:bg-[#1565C0] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] text-sm">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} বিক্রি চূড়ান্ত করুন
              </button>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <div id="receipt-print-root">
          <ReceiptPaper data={data} />
        </div>,
        document.body
      )}
    </>
  );
};