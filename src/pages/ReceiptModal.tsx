import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Download, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
  officerName: string; // ✅ srName বাদ দিয়ে officerName
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
  type?: 'sale' | 'purchase' | 'transfer' | 'expense';
  partyLabel?: string;
  batch?: string;
  challan?: string;
  deliveryCharge?: number;
  previousDue?: number;
}

export type ReceiptTypeKey = 'sale' | 'purchase' | 'transfer' | 'expense';

export type ReceiptNumberFormat = 'brand_year_seq' | 'day_month_seq' | 'code_seq' | 'custom';

export interface TypeReceiptConfig {
  title: string;
  subtitle: string;
  prefix: string;
  numberFormat?: ReceiptNumberFormat;
  brandCode?: string;
  startSeq?: number;
  seqDigits?: number;
  separator?: '-' | '/';
  customTemplate?: string;
  showPartyInfo: boolean;
  showOfficer: boolean;
  showTransport: boolean;
  showPriceAndTotals: boolean;
  showPreviousDue: boolean;
  showInWords: boolean;
  showWatermark: boolean;
  showSignatures: boolean;
}

export interface ReceiptSettings {
  shopName: string;
  shopTagline: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  shopLogoUrl: string;
  badgeText: string;
  badgeSubText: string;
  themeColor: string;
  format: 'A4' | '80mm' | '58mm';
  fontSize: 'small' | 'medium' | 'large';
  copyMode: 'single' | 'double';
  greetingText: string;
  footerText: string;
  types: Record<ReceiptTypeKey, TypeReceiptConfig>;
}

export const LOCKED_FOOTER_2 = 'সফ্টওয়্যার তৈরিতে Akand Smart Solutions | WhatsApp: 01752005057';

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  shopName: 'DREAM AGRO & FISHERIES',
  shopTagline: 'ক্রয়বিক্রয় ও পরিষেবা: উন্নতমানের পোল্ট্রি, ফিশ ফিড ও এগ্রো',
  shopAddress: '',
  shopPhone: '01774188741',
  shopEmail: 'hishab.offical@gmail.com',
  shopLogoUrl: '',
  badgeText: 'DA',
  badgeSubText: 'AGRO',
  themeColor: '#B98F33',
  format: 'A4',
  fontSize: 'medium',
  copyMode: 'single',
  greetingText: 'আমাদের সাথে ব্যবসা করার জন্য ধন্যবাদ, আপনার সাফল্য আমাদের একান্ত কাম্য।',
  footerText: 'সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত ডিজিটাল রিসিপ্ট।',
  types: {
    sale: {
      title: 'বিক্রয় চালান',
      subtitle: 'SALES INVOICE',
      prefix: 'INV-',
      showPartyInfo: true,
      showOfficer: true,
      showTransport: true,
      showPriceAndTotals: true,
      showPreviousDue: false,
      showInWords: true,
      showWatermark: true,
      showSignatures: true,
    },
    purchase: {
      title: 'ক্রয় চালান',
      subtitle: 'PURCHASE RECEIPT',
      prefix: 'PUR-',
      showPartyInfo: true,
      showOfficer: true,
      showTransport: true,
      showPriceAndTotals: true,
      showPreviousDue: false,
      showInWords: true,
      showWatermark: true,
      showSignatures: true,
    },
    transfer: {
      title: 'ডেলিভারি চালান',
      subtitle: 'GATE PASS',
      prefix: 'TRN-',
      showPartyInfo: true,
      showOfficer: true,
      showTransport: true,
      showPriceAndTotals: true,
      showPreviousDue: false,
      showInWords: true,
      showWatermark: true,
      showSignatures: true,
    },
    expense: {
      title: 'খরচের ভাউচার',
      subtitle: 'EXPENSE VOUCHER',
      prefix: 'EXP-',
      showPartyInfo: true,
      showOfficer: true,
      showTransport: false,
      showPriceAndTotals: true,
      showPreviousDue: false,
      showInWords: true,
      showWatermark: true,
      showSignatures: true,
    },
  },
};

export function formatReceiptNumber(
  cfg: Partial<TypeReceiptConfig> | undefined,
  seqNumber?: number | string,
  fallbackBrand?: string
): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const ddmm = `${dd}${mm}`;

  const sep = cfg?.separator || '-';
  const rawBrand = (cfg?.brandCode || fallbackBrand || 'DA').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'DA';
  const rawCode = (cfg?.prefix || 'INV').replace(/[-/]+$/g, '').trim() || 'INV';
  const fmt = cfg?.numberFormat || 'brand_year_seq';

  const rawSeq = seqNumber !== undefined ? Number(seqNumber) : (Number(cfg?.startSeq) || 1);
  const defaultDigits = fmt === 'brand_year_seq' ? 4 : fmt === 'day_month_seq' ? 3 : 0;
  const digits = cfg?.seqDigits !== undefined ? Number(cfg.seqDigits) : defaultDigits;
  const seqStr = digits > 0 ? String(rawSeq).padStart(digits, '0') : String(rawSeq);

  if (fmt === 'brand_year_seq') return `${rawBrand}${sep}${yyyy}${sep}${seqStr}`;
  if (fmt === 'day_month_seq') return `${ddmm}${sep}${seqStr}`;
  if (fmt === 'code_seq') return `${rawCode}${sep}${seqStr}`;
  if (fmt === 'custom') {
    const tpl = cfg?.customTemplate || `{CODE}${sep}{YYYY}${sep}{SEQ}`;
    return tpl
      .replace(/\{BRAND\}/g, rawBrand)
      .replace(/\{CODE\}/g, rawCode)
      .replace(/\{YYYY\}/g, yyyy)
      .replace(/\{DDMM\}/g, ddmm)
      .replace(/\{SEQ\}/g, seqStr);
  }
  return `${rawBrand}${sep}${yyyy}${sep}${seqStr}`;
}

export function getMergedReceiptSettings(raw?: any, business?: any): ReceiptSettings {
  const base: ReceiptSettings = {
    ...DEFAULT_RECEIPT_SETTINGS,
    shopName: business?.name || DEFAULT_RECEIPT_SETTINGS.shopName,
    shopAddress: business?.address || DEFAULT_RECEIPT_SETTINGS.shopAddress,
    shopPhone: business?.phone || DEFAULT_RECEIPT_SETTINGS.shopPhone,
    shopEmail: business?.email || DEFAULT_RECEIPT_SETTINGS.shopEmail,
  };
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    types: {
      sale: { ...DEFAULT_RECEIPT_SETTINGS.types.sale, ...(raw.types?.sale || {}) },
      purchase: { ...DEFAULT_RECEIPT_SETTINGS.types.purchase, ...(raw.types?.purchase || {}) },
      transfer: { ...DEFAULT_RECEIPT_SETTINGS.types.transfer, ...(raw.types?.transfer || {}) },
      expense: { ...DEFAULT_RECEIPT_SETTINGS.types.expense, ...(raw.types?.expense || {}) },
    },
  };
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: () => void;
  onCancel: () => void;
  isSaving: boolean;
  data: ReceiptData | null;
  settingsOverride?: ReceiptSettings;
  previewOnly?: boolean;
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
    html, body { display: block !important; position: static !important; visibility: visible !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; background: #fff !important; }
    body > *:not(#receipt-print-root) { display: none !important; }
    body > #receipt-print-root { display: block !important; position: static !important; left: auto !important; top: auto !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; z-index: auto !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    #receipt-print-root * { visibility: visible !important; }
    #receipt-print-root .rm-paper.rm-a4 { width: 210mm !important; height: auto !important; min-height: 275mm !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; page-break-after: always; }
    #receipt-print-root .rm-paper.rm-80mm { width: 80mm !important; height: auto !important; box-shadow: none !important; }
    #receipt-print-root .rm-paper.rm-58mm { width: 58mm !important; height: auto !important; box-shadow: none !important; }
    #receipt-print-root .rm-paper:last-child { page-break-after: auto; }
  }
`;

export const ReceiptPaper: React.FC<{ data: ReceiptData; settings?: ReceiptSettings; copyLabel?: string; style?: React.CSSProperties; ref?: React.Ref<HTMLDivElement> }> = ({ data, settings, copyLabel, style, ref }) => {
  const s = settings || DEFAULT_RECEIPT_SETTINGS;
  const rType: ReceiptTypeKey = data.type || 'sale';
  const cfg = s.types?.[rType] || DEFAULT_RECEIPT_SETTINGS.types.sale;
  const accent = s.themeColor || GOLD;

  const shopName = s.shopName || data.shopName || 'DREAM AGRO & FISHERIES';
  const shopDesc = s.shopTagline || data.shopDescription || '';
  const shopPhone = s.shopPhone || data.shopPhone || '';
  const shopEmail = s.shopEmail || data.shopEmail || '';
  const shopAddress = s.shopAddress || data.shopAddress || '';
  const shopLogo = s.shopLogoUrl || data.shopLogoUrl || '';

  const isExpense = rType === 'expense';
  const isPurchase = rType === 'purchase';
  const isTransfer = rType === 'transfer';

  const partyHeading = data.partyLabel || (isExpense ? 'খরচের তথ্য' : isPurchase ? 'কোম্পানি / সাপ্লায়ার' : isTransfer ? 'প্রাপক / ডিলার' : 'ক্রেতা / দোকান');
  const sigLabels = isExpense
    ? ['খরচ গ্রহণকারী', '', 'অনুমোদনকারী']
    : isPurchase
    ? ['সাপ্লায়ার / ড্রাইভার', 'চেকার / পরিবহন', 'রিসিভার / ম্যানেজার']
    : isTransfer
    ? ['প্রাপকের স্বাক্ষর', 'ড্রাইভারের স্বাক্ষর', 'অনুমোদনকারী']
    : ['ক্রেতার স্বাক্ষর', 'ডেলিভারি ম্যানের স্বাক্ষর', 'বিক্রেতা / ম্যানেজার'];

  const fontSizePx = s.fontSize === 'small' ? 11.5 : s.fontSize === 'large' ? 13.5 : 12.5;
  const greeting = s.greetingText || DEFAULT_RECEIPT_SETTINGS.greetingText;
  const footer1 = s.footerText || data.footerText1 || DEFAULT_RECEIPT_SETTINGS.footerText;
  const previousDue = Number(data.previousDue || 0);
  const netPayableWithPrev = Math.max(0, (data.dueAmount || 0) + previousDue);

  // ✅ থার্মাল প্রিন্ট লেআউট (80mm / 58mm)
  if (s.format === '80mm' || s.format === '58mm') {
    const posW = s.format === '58mm' ? 260 : 340;
    const is58 = s.format === '58mm';
    return (
      <div ref={ref} className={`rm-paper ${is58 ? 'rm-58mm' : 'rm-80mm'} bg-white ${INK} relative`} style={{ width: posW, boxSizing: 'border-box', padding: is58 ? 8 : 12, fontSize: is58 ? 10 : 11, lineHeight: 1.35, ...style }}>
        <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
          {copyLabel && <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: accent }}>[ {copyLabel} ]</div>}
          <h1 className="font-bold text-[14px] uppercase">{shopName}</h1>
          {shopDesc && <p className="text-[9px] text-gray-600">{shopDesc}</p>}
          {shopAddress && <p className="text-[9px] text-gray-600">{shopAddress}</p>}
          <p className="text-[9px] text-gray-600">ফোন: {shopPhone}{shopEmail ? ` | ${shopEmail}` : ''}</p>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold mb-1">
          <span>{cfg.title}</span>
          <span>#{data.invoiceNo}</span>
        </div>
        <div className="text-[9.5px] border-b border-dashed border-gray-400 pb-1.5 mb-2 space-y-0.5">
          <div>তারিখ: {data.date} {data.receiptTime ? `(${data.receiptTime})` : ''}</div>
          {cfg.showPartyInfo && <div>{partyHeading}: <strong>{data.customerName}</strong> {data.customerPhone ? `• ${data.customerPhone}` : ''}</div>}
          {isPurchase && (data.batch || data.challan) && <div>{data.batch ? `ব্যাচ: ${data.batch} ` : ''}{data.challan ? `চালান: ${data.challan}` : ''}</div>}
          {cfg.showOfficer && <div>অফিসার: {data.officerName}</div>}
          {cfg.showTransport && !isExpense && (data.vehicleNo || data.driverName) && <div>গাড়ি: {data.vehicleNo || 'N/A'} {data.driverName ? `(${data.driverName})` : ''}</div>}
        </div>

        <table className="w-full text-[10px] border-b border-dashed border-gray-400 mb-2">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-1">বিবরণ</th>
              <th className="py-1 text-center">পরিমাণ</th>
              {cfg.showPriceAndTotals && <th className="py-1 text-right">মোট</th>}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-gray-100">
                <td className="py-1 pr-1 font-medium">{item.name}</td>
                <td className="py-1 text-center whitespace-nowrap">{item.quantity} {item.unit}{cfg.showPriceAndTotals && !isExpense ? `×${item.unitPrice}` : ''}</td>
                {cfg.showPriceAndTotals && <td className="py-1 text-right font-bold">{item.totalPrice.toLocaleString('bn-BD')}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {cfg.showPriceAndTotals && (
          <div className="text-[10px] space-y-0.5 border-b border-dashed border-gray-400 pb-2 mb-2">
            {isExpense ? (
              <div className="flex justify-between font-bold text-[11px]"><span>মোট খরচ:</span><span>{formatTaka(data.grandTotal)}</span></div>
            ) : (
              <>
                <div className="flex justify-between"><span>মোট বিল:</span><span className="font-bold">{formatTaka(data.subtotal)}</span></div>
                {data.discount > 0 && <div className="flex justify-between"><span>ডিসকাউন্ট:</span><span>- {formatTaka(data.discount)}</span></div>}
                {(data.deliveryCharge || data.transportRent) > 0 && <div className="flex justify-between"><span>ভাড়া/ডেলিভারি:</span><span>{formatTaka(data.deliveryCharge || data.transportRent)}</span></div>}
                <div className="flex justify-between"><span>জমা:</span><span>- {formatTaka(data.paidAmount)}</span></div>
                {cfg.showPreviousDue && <div className="flex justify-between"><span>পূর্বের বাকি:</span><span>{formatTaka(previousDue)}</span></div>}
                <div className="flex justify-between font-bold text-[11px]"><span>{cfg.showPreviousDue ? 'সর্বমোট বাকি:' : 'বাকি:'}</span><span>{formatTaka(cfg.showPreviousDue ? netPayableWithPrev : data.dueAmount)}</span></div>
              </>
            )}
            {cfg.showInWords && <p className="text-[9px] text-gray-600 pt-0.5">কথায়: {data.paidInWords || 'শূন্য টাকা মাত্র'}</p>}
          </div>
        )}

        {data.note && <p className="text-[9px] text-gray-600 mb-1.5">নোট: {data.note}</p>}

        <p className="text-center text-[9.5px] font-bold italic mb-2">{greeting}</p>

        {cfg.showSignatures && (
          <div className="flex justify-between text-[9px] pt-5 pb-1.5 border-b border-dashed border-gray-300">
            <span className="border-t border-gray-400 pt-0.5">{sigLabels[0]}</span>
            <span className="border-t border-gray-400 pt-0.5">{sigLabels[2]}</span>
          </div>
        )}

        <div className="pt-1.5 text-[8.5px] text-gray-600 text-center space-y-0.5">
          <p className="font-medium">{footer1}</p>
          <p className="font-bold text-[#1B2A41]">{LOCKED_FOOTER_2}</p>
        </div>
      </div>
    );
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1 mb-1 pb-1 border-b border-[#E6DBBE]">
      <span className="w-1.5 h-1.5 rotate-45" style={{ background: accent }} />
      <h3 className={`font-bold text-[11.5px] ${INK}`}>{children}</h3>
    </div>
  );

  const infoColsCount = (cfg.showPartyInfo ? 1 : 0) + (cfg.showOfficer ? 1 : 0) + (cfg.showTransport && !isExpense ? 1 : 0);

  return (
    <div ref={ref} className={`rm-paper rm-a4 bg-white ${INK} relative`} style={{ width: PAGE_W, minHeight: PAGE_H, boxSizing: 'border-box', padding: 14, fontSize: fontSizePx, lineHeight: 1.4, ...style }}>
      <div className="min-h-full flex flex-col" style={{ border: `1.5px solid ${accent}`, outline: '1px solid #E6DBBE', outlineOffset: 3, padding: '20px 24px 16px', boxSizing: 'border-box' }}>
        
        <div className="grid grid-cols-[1.5fr,1fr] gap-4 items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[58px] h-[58px] shrink-0 rounded-full bg-[#FBF5E6] flex items-center justify-center overflow-hidden" style={{ border: `2px solid ${accent}` }}>
              {shopLogo ? <img src={shopLogo} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" /> : <div className="text-center leading-none"><div className="text-[18px] font-bold text-[#1B2A41]">{s.badgeText || 'DA'}</div><div className="text-[8px] font-semibold mt-0.5" style={{ color: accent }}>{s.badgeSubText || 'AGRO'}</div></div>}
            </div>
            <div className="min-w-0">
              <h1 className={`text-[22px] font-bold uppercase leading-tight ${INK}`}>{shopName}</h1>
              {shopDesc && <p className="text-[11.5px] font-semibold text-[#2B5C8A] mt-0.5">{shopDesc}</p>}
              <p className={`text-[11px] mt-0.5 ${MUTED}`}>
                {shopPhone ? `ফোন: ${shopPhone}` : ''}{shopEmail ? `${shopPhone ? ' | ' : ''}ইমেইল: ${shopEmail}` : ''}{shopAddress ? `${shopPhone || shopEmail ? ' | ' : ''}${shopAddress}` : ''}
              </p>
            </div>
          </div>
          <div className="rounded-md overflow-hidden border border-[#E6DBBE] bg-white">
            <div className="flex justify-between items-baseline px-3 py-1.5 bg-[#FBF5E6] border-b border-[#E6DBBE]">
              <span className={`font-bold text-[13px] ${INK}`}>{cfg.title}</span>
              <span className="font-semibold text-[10px] text-[#7A5E1E]">{copyLabel ? `${cfg.subtitle} • ${copyLabel}` : cfg.subtitle}</span>
            </div>
            <div className="px-3 py-1.5 text-[12px] space-y-0.5">
              <div className="flex justify-between"><span className={MUTED}>রিসিপ্ট নং:</span><span className="font-bold text-[#2B5C8A]">#{data.invoiceNo}</span></div>
              <div className="flex justify-between"><span className={MUTED}>তারিখ:</span><span className="font-semibold">{data.date}</span></div>
              <div className="flex justify-between items-center"><span className={MUTED}>স্ট্যাটাস:</span><span className="px-2 rounded-full border border-[#E3C772] bg-[#FDF3D4] text-[#6B4E0F] text-[11px] font-bold">{data.status}</span></div>
            </div>
          </div>
        </div>

        <div className="my-3" style={{ borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, height: 4 }} />

        {infoColsCount > 0 && (
          <div className={`grid ${infoColsCount === 3 ? 'grid-cols-3' : infoColsCount === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-[11px] leading-tight`}>
            {cfg.showPartyInfo && (
              isExpense ? (
                <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-2 py-1.5">
                  <SectionTitle>খরচের তথ্য</SectionTitle>
                  <p className="font-bold text-[12px] leading-tight mb-0.5">{data.customerName}</p>
                  <p><span className={MUTED}>খরচের ধরন: </span>{data.items[0]?.name || 'সাধারণ'}</p>
                  <p className="truncate"><span className={MUTED}>নোট: </span>{data.note || 'N/A'}</p>
                </div>
              ) : (
                <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-2 py-1.5">
                  <SectionTitle>{partyHeading}</SectionTitle>
                  <p className="font-bold text-[12px] leading-tight mb-0.5">{data.customerName}</p>
                  {data.proprietor && data.proprietor !== 'N/A' && <p><span className={MUTED}>প্রোপ্রাইটর: </span>{data.proprietor}</p>}
                  <p><span className={MUTED}>ফোন: </span>{data.customerPhone || 'N/A'}</p>
                  <p className="truncate"><span className={MUTED}>ঠিকানা: </span>{data.customerAddress || 'N/A'}</p>
                  {data.marketName && data.marketName !== 'N/A' && <p className="truncate"><span className={MUTED}>বাজার: </span>{data.marketName}</p>}
                  {isPurchase && (data.batch || data.challan) && (
                    <p className="truncate mt-0.5">{data.batch ? `ব্যাচ: ${data.batch} ` : ''}{data.challan ? `• চালান: ${data.challan}` : ''}</p>
                  )}
                </div>
              )
            )}

            {cfg.showOfficer && (
              <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-2 py-1.5">
                <SectionTitle>{isExpense ? 'অফিসার তথ্য' : 'অফিসার ও সময়'}</SectionTitle>
                <p className="font-bold text-[12px] leading-tight mb-0.5">{data.officerName}</p>
                <p><span className={MUTED}>ফোন: </span>{data.officerPhone}</p>
                {data.officerEmail && data.officerEmail !== 'N/A' && <p className="break-all"><span className={MUTED}>ইমেইল: </span>{data.officerEmail}</p>}
                <p className="mt-0.5"><span className={MUTED}>সময়:</span> <span className="font-semibold">{data.receiptTime}</span></p>
              </div>
            )}

            {cfg.showTransport && !isExpense && (
              <div className="rounded-md border border-[#EADFC0] bg-[#FDFAF0] px-2 py-1.5">
                <SectionTitle>পরিবহন ও গাড়ির তথ্য</SectionTitle>
                <p><span className={MUTED}>গাড়ি নাম্বার: </span><span className="font-semibold">{data.vehicleNo || 'N/A'}</span></p>
                <p><span className={MUTED}>ড্রাইভার: </span>{data.driverName || 'N/A'}</p>
                <p><span className={MUTED}>ড্রাইভার ফোন: </span>{data.driverPhone || 'N/A'}</p>
                {cfg.showPriceAndTotals && <p className="mt-0.5"><span className={MUTED}>গাড়ি ভাড়া: </span><span className="font-bold text-[#2B5C8A]">{formatTaka(data.transportRent)}</span></p>}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 mt-3 relative">
          <table className="w-full h-full border-collapse text-[12px] border border-[#CBD3DF]" style={{ tableLayout: 'fixed' }}>
            {cfg.showPriceAndTotals ? (
              <colgroup><col style={{ width: 38 }} /><col /><col style={{ width: 108 }} /><col style={{ width: 84 }} /><col style={{ width: 112 }} /></colgroup>
            ) : (
              <colgroup><col style={{ width: 38 }} /><col /><col style={{ width: 130 }} /></colgroup>
            )}
            <thead>
              <tr className="bg-[#EAF0F8]" style={{ borderBottom: `2px solid ${accent}` }}>
                <th className="py-1.5 px-2 text-center font-bold border-r border-[#D5DCE8]">#</th>
                <th className="py-1.5 px-3 text-left font-bold border-r border-[#D5DCE8]">বিবরণ</th>
                <th className="py-1.5 px-2 text-center font-bold border-r border-[#D5DCE8]">পরিমাণ</th>
                {cfg.showPriceAndTotals && (
                  <>
                    <th className="py-1.5 px-2 text-right font-bold border-r border-[#D5DCE8]">দর (৳)</th>
                    <th className="py-1.5 px-3 text-right font-bold">মোট টাকা (৳)</th>
                  </>
                )}
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
                    {cfg.showPriceAndTotals && (
                      <>
                        <td className="py-1.5 px-2 text-right border-r border-[#E3E8F0]">{item.unitPrice.toLocaleString('bn-BD')}</td>
                        <td className="py-1.5 px-3 text-right font-bold">{item.totalPrice.toLocaleString('bn-BD')}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              <tr style={{ height: '100%' }}>
                <td className="border-r border-[#E3E8F0]" />
                <td className={`border-r border-[#E3E8F0] align-top px-3 pt-2 text-[11px] italic ${MUTED}`}>{data.tableNote}</td>
                <td className="border-r border-[#E3E8F0]" />
                {cfg.showPriceAndTotals && <><td className="border-r border-[#E3E8F0]" /><td /></>}
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#F3F6FB] font-bold" style={{ borderTop: `1.5px solid ${accent}` }}>
                <td colSpan={2} className="py-2 px-3 text-right border-r border-[#D5DCE8]">{isExpense ? 'মোট:' : 'সর্বমোট পণ্যের পরিমাণ:'}</td>
                <td className="py-2 px-2 text-center border-r border-[#D5DCE8] text-[#2B5C8A]">{isExpense ? '-' : `${data.totalBags} বস্তা / ${data.totalPieces} পিস`}</td>
                {cfg.showPriceAndTotals && (
                  <>
                    <td className="py-2 px-2 text-center border-r border-[#D5DCE8]">{isExpense ? '-' : 'বিল:'}</td>
                    <td className="py-2 px-3 text-right">{formatTaka(data.subtotal)}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
          {cfg.showWatermark && (
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span className="font-bold uppercase whitespace-nowrap" style={{ fontSize: 46, color: '#1B2A41', opacity: 0.04, transform: 'rotate(-18deg)' }}>{shopName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1.35fr,1fr] gap-3 mt-3 items-start text-[12px]">
          <div className="space-y-2">
            {cfg.showPriceAndTotals && cfg.showInWords && (
              <div className="rounded-md border border-[#DDE3EC] bg-[#F7F9FC] px-3 py-2">
                <span className={MUTED}>{isExpense ? 'মোট খরচ কথায়: ' : isTransfer ? 'মোট পরিমাণ / টাকা কথায়: ' : 'কথায়: '}</span><span className="font-bold">{data.paidInWords || 'শূন্য টাকা মাত্র'}</span>
              </div>
            )}
            
            {!isExpense && (
              <div className="rounded-md border border-[#DDE3EC] bg-white px-3 py-1.5 flex items-center justify-between text-[12px]">
                <span><span className={MUTED}>মোট বস্তা: </span><b>{data.totalBags}</b></span><span className="w-px h-4 bg-[#CBD3DF]" />
                <span><span className={MUTED}>মোট পিস: </span><b>{data.totalPieces} পিস</b></span>
                {cfg.showPriceAndTotals && (
                  <>
                    <span className="w-px h-4 bg-[#CBD3DF]" />
                    <span><span className={MUTED}>গাড়ি ভাড়া: </span><b className="text-[#2B5C8A]">{formatTaka(data.transportRent)}</b></span>
                  </>
                )}
              </div>
            )}
            
            {data.note && (
              <div className="rounded-md bg-[#FDFAF0] px-3 py-1.5 text-[12px]" style={{ border: '1px solid #EADFC0', borderLeft: `4px solid ${accent}` }}>
                <p className="font-bold">নোট:</p><p>{data.note}</p>
              </div>
            )}
          </div>
          
          {cfg.showPriceAndTotals && (
            <div className="rounded-md border border-[#CBD3DF] overflow-hidden bg-white">
              {isExpense ? (
                <div className="px-3 py-3 flex justify-between items-center bg-[#FBF1D6]" style={{ borderTop: `1.5px solid ${accent}` }}>
                  <span className="font-bold text-[13px]">মোট খরচ:</span><span className="font-bold text-[17px]">{formatTaka(data.grandTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 space-y-1 text-[12px]">
                    <div className="flex justify-between"><span className={MUTED}>মোট বিল:</span><span className="font-bold">{formatTaka(data.subtotal)}</span></div>
                    {data.discount > 0 && <div className="flex justify-between"><span className={MUTED}>ডিসকাউন্ট:</span><span className="font-bold">- {formatTaka(data.discount)}</span></div>}
                    {(data.deliveryCharge || data.transportRent) > 0 && <div className="flex justify-between"><span className={MUTED}>ডেলিভারি / ভাড়া:</span><span className="font-bold text-[#2B5C8A]">{formatTaka(data.deliveryCharge || data.transportRent)}</span></div>}
                    <div className="flex justify-between"><span className={MUTED}>মোট জমা:</span><span className="font-bold text-[#2B5C8A]">- {formatTaka(data.paidAmount)}</span></div>
                    {cfg.showPreviousDue && <div className="flex justify-between"><span className={MUTED}>পূর্বের বাকি:</span><span className="font-bold">{formatTaka(previousDue)}</span></div>}
                  </div>
                  <div className="px-3 py-2.5 flex justify-between items-center bg-[#FBF1D6]" style={{ borderTop: `1.5px solid ${accent}` }}>
                    <span className="font-bold text-[13px]">{cfg.showPreviousDue ? 'সর্বমোট বাকি:' : 'বাকি:'}</span>
                    <span className="font-bold text-[17px]">{formatTaka(cfg.showPreviousDue ? netPayableWithPrev : data.dueAmount)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ✅ স্বাক্ষর সারির একটু উপরে শুভেচ্ছা বার্তা */}
        <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-center">
          <p className="text-[11.5px] font-bold italic" style={{ color: '#1B2A41' }}>{greeting}</p>
        </div>

        {cfg.showSignatures && (
          <div className={`grid ${isExpense ? 'grid-cols-2' : 'grid-cols-3'} gap-6 text-center text-[12px] mt-1`} style={{ paddingTop: 48 }}>
            {!isExpense ? (
              <>
                <div className="pt-1.5" style={{ borderTop: '1.5px solid #8793A6' }}>
                  <p className="font-bold">{sigLabels[0]}</p><p className={`text-[11px] ${MUTED}`}>{data.customerName}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: '1.5px solid #8793A6' }}>
                  <p className="font-bold">{sigLabels[1]}</p><p className={`text-[11px] ${MUTED}`}>{data.driverName && data.driverName !== 'N/A' ? data.driverName : '\u00A0'}{data.vehicleNo && data.vehicleNo !== 'N/A' ? ` (${data.vehicleNo})` : ''}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${accent}` }}>
                  <p className="font-bold">{sigLabels[2]}</p><p className="text-[11px] text-[#7A5E1E]">{shopName}</p>
                </div>
              </>
            ) : (
              <>
                <div className="pt-1.5" style={{ borderTop: '1.5px solid #8793A6' }}>
                  <p className="font-bold">{sigLabels[0]}</p><p className={`text-[11px] ${MUTED}`}>{data.customerName}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${accent}` }}>
                  <p className="font-bold">{sigLabels[2]}</p><p className="text-[11px] text-[#7A5E1E]">{shopName}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ ফুটার ১ ও লকড ফুটার ২ — সেন্টারে ২ লাইনে */}
        <div className="mt-3 pt-2 text-center space-y-0.5" style={{ borderTop: '1px solid #E6DBBE' }}>
          <p className="text-[10px] font-medium text-[#4A5568]">{footer1}</p>
          <p className="text-[10.5px] font-bold text-[#1B2A41]">{LOCKED_FOOTER_2}</p>
        </div>
      </div>
    </div>
  );
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, onFinalize, onCancel, isSaving, data, settingsOverride, previewOnly }) => {
  const { activeBusiness } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [cloudSettings, setCloudSettings] = useState<ReceiptSettings>(() => {
    if (activeBusiness?.id) {
      try {
        const cached = localStorage.getItem(`receipt_settings_${activeBusiness.id}`);
        if (cached) return getMergedReceiptSettings(JSON.parse(cached), activeBusiness);
      } catch {}
    }
    return getMergedReceiptSettings(null, activeBusiness);
  });

  useEffect(() => {
    if (!isOpen || settingsOverride || !activeBusiness?.id) return;
    const loadSettings = async () => {
      try {
        const cached = localStorage.getItem(`receipt_settings_${activeBusiness.id}`);
        if (cached) setCloudSettings(getMergedReceiptSettings(JSON.parse(cached), activeBusiness));

        const { data: biz } = await supabase
          .from('businesses')
          .select('receipt_settings')
          .eq('id', activeBusiness.id)
          .single();

        if (biz?.receipt_settings && Object.keys(biz.receipt_settings).length > 0) {
          const merged = getMergedReceiptSettings(biz.receipt_settings, activeBusiness);
          setCloudSettings(merged);
          localStorage.setItem(`receipt_settings_${activeBusiness.id}`, JSON.stringify(merged));
        }
      } catch {}
    };
    loadSettings();
  }, [isOpen, settingsOverride, activeBusiness?.id]);

  const activeSettings = settingsOverride || cloudSettings;
  const paperW = activeSettings.format === '58mm' ? 260 : activeSettings.format === '80mm' ? 340 : PAGE_W;

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const w = scrollRef.current?.clientWidth ?? paperW;
      setScale(Math.min(1, (w - 16) / paperW));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen, paperW]);

  if (!isOpen || !data) return null;

  const rType: ReceiptTypeKey = data.type || 'sale';
  const cfg = activeSettings.types?.[rType] || DEFAULT_RECEIPT_SETTINGS.types.sale;
  const isExpense = rType === 'expense';

  const handlePrint = async () => {
    try { await document.fonts?.ready; } catch {}
    requestAnimationFrame(() => window.print());
  };

  const captureCrispCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!paperRef.current) return null;
    try { await document.fonts?.ready; } catch {}

    const clone = paperRef.current.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.transformOrigin = 'top left';
    clone.style.margin = '0';

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-10000px';
    host.style.top = '0';
    host.style.width = `${paperW}px`;
    host.style.background = '#ffffff';
    host.style.zIndex = '-1';
    host.style.pointerEvents = 'none';
    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      return await html2canvas(clone, {
        scale: 2.2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: paperW,
        windowWidth: paperW,
        logging: false,
      });
    } finally {
      document.body.removeChild(host);
    }
  };

  const buildPdfFromCanvas = (canvas: HTMLCanvasElement): jsPDF => {
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    const isThermal = activeSettings.format === '80mm' || activeSettings.format === '58mm';

    if (isThermal) {
      const mmW = activeSettings.format === '58mm' ? 58 : 80;
      const mmH = (canvas.height * mmW) / canvas.width;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [mmW, Math.max(mmH, 60)], compress: true });
      pdf.addImage(imgData, 'JPEG', 0, 0, mmW, mmH, undefined, 'MEDIUM');
      return pdf;
    }

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const finalH = Math.min(pdfHeight, pageHeight);
    const finalW = pdfHeight > pageHeight ? (canvas.width * pageHeight) / canvas.height : pdfWidth;
    const offsetX = (pdfWidth - finalW) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, 0, finalW, finalH, undefined, 'MEDIUM');
    return pdf;
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await captureCrispCanvas();
      if (!canvas) return;
      const pdf = buildPdfFromCanvas(canvas);
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
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const canvas = await captureCrispCanvas();
      if (!canvas) return;
      const pdf = buildPdfFromCanvas(canvas);
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `Receipt-${data.invoiceNo}.pdf`, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Receipt - ${data.invoiceNo}`,
            text: `${activeSettings.shopName || data.shopName} - রিসিপ্ট #${data.invoiceNo}`,
          });
          return;
        } catch {}
      }

      // যদি ব্রাউজার PDF শেয়ার সাপোর্ট না করে তবে ক্লিয়ার JPEG ছবি শেয়ার/ডাউনলোড হবে
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const imgFile = new File([blob], `Receipt-${data.invoiceNo}.jpg`, { type: 'image/jpeg' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [imgFile] })) {
              try {
                await navigator.share({ files: [imgFile], title: `Receipt - ${data.invoiceNo}` });
              } catch {}
            } else {
              const url = URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Receipt-${data.invoiceNo}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }
          resolve();
        }, 'image/jpeg', 0.9);
      });
    } catch (err) {
      console.error(err);
      alert('শেয়ার করতে সমস্যা হয়েছে!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {createPortal(<style>{RECEIPT_STYLES}</style>, document.head)}

      <div className="receipt-modal-preview fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-white w-full max-w-[860px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FBF5E6] border-b border-[#E6DBBE] shrink-0">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-[#B98F33]" />
              <span className="font-semibold text-sm">{cfg.title} প্রিভিউ ({activeSettings.format})</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-700 hover:bg-[#F3E8C8] transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div ref={scrollRef} className="overflow-auto bg-slate-100 p-2 flex-1">
            <div className="mx-auto shadow-sm" style={{ width: paperW * scale, minHeight: activeSettings.format === 'A4' ? PAGE_H * scale : undefined }}>
              <ReceiptPaper
                data={data}
                settings={activeSettings}
                copyLabel={activeSettings.copyMode === 'double' ? 'গ্রাহক কপি' : undefined}
                ref={paperRef}
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              />
            </div>
          </div>

          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0">
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm">
                <Printer className="w-4 h-4" /> {previewOnly ? 'টেস্ট প্রিন্ট' : 'প্রিন্ট'}
              </button>
              <button onClick={handleDownload} disabled={isDownloading} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm border border-blue-200 disabled:opacity-60">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
              </button>
              <button onClick={handleShare} disabled={isSharing} className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm border border-green-200 disabled:opacity-60">
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} শেয়ার
              </button>
            </div>
            {previewOnly ? (
              <button onClick={onClose} className="w-full bg-[#0A2540] hover:bg-[#1565C0] text-white font-bold py-2.5 rounded-lg text-sm">
                প্রিভিউ বন্ধ করুন
              </button>
            ) : (
              <div className="flex gap-2 mt-1">
                {!isExpense && (
                  <button onClick={onCancel} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 rounded-lg transition-colors text-sm border border-red-200">
                    বাতিল করুন
                  </button>
                )}
                <button onClick={onFinalize} disabled={isSaving} className={`${isExpense ? 'w-full' : 'flex-[2]'} bg-[#0A2540] hover:bg-[#1565C0] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] text-sm`}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isExpense ? 'ঠিক আছে' : 'নিশ্চিত করুন'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {createPortal(
        <div id="receipt-print-root">
          <ReceiptPaper data={data} settings={activeSettings} copyLabel={activeSettings.copyMode === 'double' ? 'গ্রাহক কপি' : undefined} />
          {activeSettings.copyMode === 'double' && activeSettings.format === 'A4' && (
            <ReceiptPaper data={data} settings={activeSettings} copyLabel="অফিস কপি" />
          )}
        </div>,
        document.body
      )}
    </>
  );
};