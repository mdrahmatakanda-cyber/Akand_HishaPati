import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, Download, Share2, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { showAppToast } from '../components/PremiumToast';
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
  textColor?: string;
  bgColor?: string;
  format: 'A4' | 'A5' | 'custom';
  customWidthMm?: number;
  customHeightMm?: number;
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
  textColor: '#1B2A41',
  bgColor: '#B98F33',
  format: 'A4',
  customWidthMm: 148,
  customHeightMm: 210,
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
const GOLD = '#B98F33';

const formatTaka = (amount: number) => '৳ ' + (amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 0 });

export function getPaperDimensions(s?: ReceiptSettings) {
  const fmt = s?.format;
  if (fmt === 'A5') return { mmW: 148, mmH: 210, pxW: 560, pxH: 794, pageCss: 'A5 portrait' };
  if (fmt === 'custom') {
    const mmW = Math.max(80, Math.min(350, Number(s?.customWidthMm) || 148));
    const mmH = Math.max(100, Math.min(450, Number(s?.customHeightMm) || 210));
    return { mmW, mmH, pxW: Math.round(mmW * 3.78), pxH: Math.round(mmH * 3.78), pageCss: `${mmW}mm ${mmH}mm` };
  }
  return { mmW: 210, mmH: 297, pxW: PAGE_W, pxH: PAGE_H, pageCss: 'A4 portrait' };
}

const getReceiptStyles = (mmW: number, mmH: number, pageCss: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap');
  .rm-paper, .rm-paper * { font-family: 'Noto Serif Bengali', 'Tiro Bangla', 'SolaimanLipi', Georgia, serif !important; }
  #receipt-print-root { position: fixed; left: -99999px; top: 0; width: ${mmW}mm; visibility: hidden; pointer-events: none; z-index: -1; }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: ${pageCss}; margin: 0; }
    html, body { display: block !important; position: static !important; visibility: visible !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; background: #fff !important; }
    body > *:not(#receipt-print-root) { display: none !important; }
    body > #receipt-print-root { display: block !important; position: static !important; left: auto !important; top: auto !important; visibility: visible !important; opacity: 1 !important; pointer-events: auto !important; z-index: auto !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
    #receipt-print-root * { visibility: visible !important; }
    #receipt-print-root .rm-paper { width: ${mmW}mm !important; height: auto !important; min-height: ${Math.max(mmH - 12, 80)}mm !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; page-break-after: always; }
    #receipt-print-root .rm-paper:last-child { page-break-after: auto; }
  }
`;

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#B98F33').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (isNaN(num)) return `rgba(185, 143, 51, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

export const ReceiptPaper: React.FC<{ data: ReceiptData; settings?: ReceiptSettings; copyLabel?: string; style?: React.CSSProperties; ref?: React.Ref<HTMLDivElement> }> = ({ data, settings, copyLabel, style, ref }) => {
  const s = settings || DEFAULT_RECEIPT_SETTINGS;
  const dims = getPaperDimensions(s);
  const isCompact = dims.pxW < 650;
  const rType: ReceiptTypeKey = data.type || 'sale';
  const cfg = s.types?.[rType] || DEFAULT_RECEIPT_SETTINGS.types.sale;

  const accent = s.themeColor || GOLD;
  const inkColor = s.textColor || '#1B2A41';
  const mutedColor = hexToRgba(inkColor, 0.72);

  const rawBg = s.bgColor || accent;
  const isNoBg = rawBg === 'none' || rawBg.toLowerCase() === '#ffffff';
  const bgSoft = isNoBg ? '#FFFFFF' : hexToRgba(rawBg, 0.06);
  const bgHeader = isNoBg ? '#F8FAFC' : hexToRgba(rawBg, 0.13);
  const bgStrong = isNoBg ? '#F1F5F9' : hexToRgba(rawBg, 0.20);
  const borderSoft = hexToRgba(accent, 0.35);

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

  const baseFont = s.fontSize === 'small' ? 11.5 : s.fontSize === 'large' ? 13.5 : 12.5;
  const fontSizePx = isCompact ? Math.max(10, baseFont - 1.5) : baseFont;
  const greeting = s.greetingText || DEFAULT_RECEIPT_SETTINGS.greetingText;
  const footer1 = s.footerText || data.footerText1 || DEFAULT_RECEIPT_SETTINGS.footerText;
  const previousDue = Number(data.previousDue || 0);
  const netPayableWithPrev = Math.max(0, (data.dueAmount || 0) + previousDue);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1 mb-1 pb-1" style={{ borderBottom: `1px solid ${borderSoft}` }}>
      <span className="w-1.5 h-1.5 rotate-45" style={{ background: accent }} />
      <h3 className={`font-bold ${isCompact ? 'text-[10.5px]' : 'text-[11.5px]'}`} style={{ color: inkColor }}>{children}</h3>
    </div>
  );

  const infoColsCount = (cfg.showPartyInfo ? 1 : 0) + (cfg.showOfficer ? 1 : 0) + (cfg.showTransport && !isExpense ? 1 : 0);

  return (
    <div ref={ref} className="rm-paper bg-white relative" style={{ width: dims.pxW, minHeight: dims.pxH, boxSizing: 'border-box', padding: isCompact ? 10 : 14, fontSize: fontSizePx, lineHeight: 1.4, color: inkColor, ...style }}>
      <div className="min-h-full flex flex-col bg-white" style={{ border: `1.5px solid ${accent}`, outline: `1px solid ${borderSoft}`, outlineOffset: 3, padding: isCompact ? '12px 14px 10px' : '20px 24px 16px', boxSizing: 'border-box' }}>
        
        <div className="grid grid-cols-[1.5fr,1fr] gap-4 items-center">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-[58px] h-[58px] shrink-0 rounded-full flex items-center justify-center overflow-hidden" style={{ border: `2px solid ${accent}`, backgroundColor: bgHeader }}>
              {shopLogo ? <img src={shopLogo} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" /> : <div className="text-center leading-none"><div className="text-[18px] font-bold" style={{ color: inkColor }}>{s.badgeText || 'DA'}</div><div className="text-[8px] font-semibold mt-0.5" style={{ color: accent }}>{s.badgeSubText || 'AGRO'}</div></div>}
            </div>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold uppercase leading-tight" style={{ color: inkColor }}>{shopName}</h1>
              {shopDesc && <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: accent }}>{shopDesc}</p>}
              <p className="text-[11px] mt-0.5" style={{ color: mutedColor }}>
                {shopPhone ? `ফোন: ${shopPhone}` : ''}{shopEmail ? `${shopPhone ? ' | ' : ''}ইমেইল: ${shopEmail}` : ''}{shopAddress ? `${shopPhone || shopEmail ? ' | ' : ''}${shopAddress}` : ''}
              </p>
            </div>
          </div>
          <div className="rounded-md overflow-hidden bg-white" style={{ border: `1px solid ${borderSoft}` }}>
            <div className="flex justify-between items-baseline px-3 py-1.5" style={{ backgroundColor: bgHeader, borderBottom: `1px solid ${borderSoft}` }}>
              <span className="font-bold text-[13px]" style={{ color: inkColor }}>{cfg.title}</span>
              <span className="font-semibold text-[10px]" style={{ color: accent }}>{copyLabel ? `${cfg.subtitle} • ${copyLabel}` : cfg.subtitle}</span>
            </div>
            <div className="px-3 py-1.5 text-[12px] space-y-0.5">
              <div className="flex justify-between"><span style={{ color: mutedColor }}>রিসিপ্ট নং:</span><span className="font-bold" style={{ color: accent }}>#{data.invoiceNo}</span></div>
              <div className="flex justify-between"><span style={{ color: mutedColor }}>তারিখ:</span><span className="font-semibold">{data.date}</span></div>
              <div className="flex justify-between items-center">
                <span style={{ color: mutedColor }}>স্ট্যাটাস:</span>
                <span className="px-2 rounded-full text-[11px] font-bold" style={{ backgroundColor: bgStrong, border: `1px solid ${borderSoft}`, color: inkColor }}>{data.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="my-3" style={{ borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, height: 4 }} />

        {infoColsCount > 0 && (
          <div className={`grid ${infoColsCount === 3 ? 'grid-cols-3' : infoColsCount === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-[11px] leading-tight`}>
            {cfg.showPartyInfo && (
              isExpense ? (
                <div className="rounded-md px-2 py-1.5" style={{ border: `1px solid ${borderSoft}`, backgroundColor: bgSoft }}>
                  <SectionTitle>খরচের তথ্য</SectionTitle>
                  <p className="font-bold text-[12px] leading-tight mb-0.5">{data.customerName}</p>
                  <p><span style={{ color: mutedColor }}>খরচের ধরন: </span>{data.items[0]?.name || 'সাধারণ'}</p>
                  <p className="truncate"><span style={{ color: mutedColor }}>নোট: </span>{data.note || 'N/A'}</p>
                </div>
              ) : (
                <div className="rounded-md px-2 py-1.5" style={{ border: `1px solid ${borderSoft}`, backgroundColor: bgSoft }}>
                  <SectionTitle>{partyHeading}</SectionTitle>
                  <p className="font-bold text-[12px] leading-tight mb-0.5">{data.customerName}</p>
                  {data.proprietor && data.proprietor !== 'N/A' && <p><span style={{ color: mutedColor }}>প্রোপ্রাইটর: </span>{data.proprietor}</p>}
                  <p><span style={{ color: mutedColor }}>ফোন: </span>{data.customerPhone || 'N/A'}</p>
                  <p className="truncate"><span style={{ color: mutedColor }}>ঠিকানা: </span>{data.customerAddress || 'N/A'}</p>
                  {data.marketName && data.marketName !== 'N/A' && <p className="truncate"><span style={{ color: mutedColor }}>বাজার: </span>{data.marketName}</p>}
                  {isPurchase && (data.batch || data.challan) && (
                    <p className="truncate mt-0.5">{data.batch ? `ব্যাচ: ${data.batch} ` : ''}{data.challan ? `• চালান: ${data.challan}` : ''}</p>
                  )}
                </div>
              )
            )}

            {cfg.showOfficer && (
              <div className="rounded-md px-2 py-1.5" style={{ border: `1px solid ${borderSoft}`, backgroundColor: bgSoft }}>
                <SectionTitle>{isExpense ? 'অফিসার তথ্য' : 'অফিসার ও সময়'}</SectionTitle>
                <p className="font-bold text-[12px] leading-tight mb-0.5">{data.officerName}</p>
                <p><span style={{ color: mutedColor }}>ফোন: </span>{data.officerPhone}</p>
                {data.officerEmail && data.officerEmail !== 'N/A' && <p className="break-all"><span style={{ color: mutedColor }}>ইমেইল: </span>{data.officerEmail}</p>}
                <p className="mt-0.5"><span style={{ color: mutedColor }}>সময়:</span> <span className="font-semibold">{data.receiptTime}</span></p>
              </div>
            )}

            {cfg.showTransport && !isExpense && (
              <div className="rounded-md px-2 py-1.5" style={{ border: `1px solid ${borderSoft}`, backgroundColor: bgSoft }}>
                <SectionTitle>পরিবহন ও গাড়ির তথ্য</SectionTitle>
                <p><span style={{ color: mutedColor }}>গাড়ি নাম্বার: </span><span className="font-semibold">{data.vehicleNo || 'N/A'}</span></p>
                <p><span style={{ color: mutedColor }}>ড্রাইভার: </span>{data.driverName || 'N/A'}</p>
                <p><span style={{ color: mutedColor }}>ড্রাইভার ফোন: </span>{data.driverPhone || 'N/A'}</p>
                {cfg.showPriceAndTotals && <p className="mt-0.5"><span style={{ color: mutedColor }}>গাড়ি ভাড়া: </span><span className="font-bold" style={{ color: accent }}>{formatTaka(data.transportRent)}</span></p>}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 mt-3 relative">
          <table className="w-full h-full border-collapse text-[12px]" style={{ tableLayout: 'fixed', border: `1px solid ${borderSoft}` }}>
            {cfg.showPriceAndTotals ? (
              <colgroup><col style={{ width: 38 }} /><col /><col style={{ width: 108 }} /><col style={{ width: 84 }} /><col style={{ width: 112 }} /></colgroup>
            ) : (
              <colgroup><col style={{ width: 38 }} /><col /><col style={{ width: 130 }} /></colgroup>
            )}
            <thead>
              <tr style={{ backgroundColor: bgHeader, borderBottom: `2px solid ${accent}` }}>
                <th className="py-1.5 px-2 text-center font-bold" style={{ borderRight: `1px solid ${borderSoft}` }}>#</th>
                <th className="py-1.5 px-3 text-left font-bold" style={{ borderRight: `1px solid ${borderSoft}` }}>বিবরণ</th>
                <th className="py-1.5 px-2 text-center font-bold" style={{ borderRight: `1px solid ${borderSoft}` }}>পরিমাণ</th>
                {cfg.showPriceAndTotals && (
                  <>
                    <th className="py-1.5 px-2 text-right font-bold" style={{ borderRight: `1px solid ${borderSoft}` }}>দর (৳)</th>
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
                  <tr key={item.id || index} style={{ borderBottom: `1px solid ${borderSoft}` }}>
                    <td className="py-1.5 px-2 text-center" style={{ borderRight: `1px solid ${borderSoft}`, color: mutedColor }}>{(index + 1).toLocaleString('bn-BD', { minimumIntegerDigits: 2 })}</td>
                    <td className="py-1.5 px-3 font-semibold leading-snug" style={{ borderRight: `1px solid ${borderSoft}` }}><span>{item.name}</span>{meta && <span className="ml-1.5 text-[11px] font-normal" style={{ color: mutedColor }}>({meta})</span>}</td>
                    <td className="py-1.5 px-2 text-center font-semibold" style={{ borderRight: `1px solid ${borderSoft}` }}>{item.quantity} {item.unit}</td>
                    {cfg.showPriceAndTotals && (
                      <>
                        <td className="py-1.5 px-2 text-right" style={{ borderRight: `1px solid ${borderSoft}` }}>{item.unitPrice.toLocaleString('bn-BD')}</td>
                        <td className="py-1.5 px-3 text-right font-bold">{item.totalPrice.toLocaleString('bn-BD')}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              <tr style={{ height: '100%' }}>
                <td style={{ borderRight: `1px solid ${borderSoft}` }} />
                <td className="align-top px-3 pt-2 text-[11px] italic" style={{ borderRight: `1px solid ${borderSoft}`, color: mutedColor }}>{data.tableNote}</td>
                <td style={{ borderRight: `1px solid ${borderSoft}` }} />
                {cfg.showPriceAndTotals && <><td style={{ borderRight: `1px solid ${borderSoft}` }} /><td /></>}
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-bold" style={{ backgroundColor: bgHeader, borderTop: `1.5px solid ${accent}` }}>
                <td colSpan={2} className="py-2 px-3 text-right" style={{ borderRight: `1px solid ${borderSoft}` }}>{isExpense ? 'মোট:' : 'সর্বমোট পণ্যের পরিমাণ:'}</td>
                <td className="py-2 px-2 text-center" style={{ borderRight: `1px solid ${borderSoft}`, color: accent }}>{isExpense ? '-' : `${data.totalBags} বস্তা / ${data.totalPieces} পিস`}</td>
                {cfg.showPriceAndTotals && (
                  <>
                    <td className="py-2 px-2 text-center" style={{ borderRight: `1px solid ${borderSoft}` }}>{isExpense ? '-' : 'বিল:'}</td>
                    <td className="py-2 px-3 text-right">{formatTaka(data.subtotal)}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
          {cfg.showWatermark && (
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span className="font-bold uppercase whitespace-nowrap" style={{ fontSize: 46, color: inkColor, opacity: 0.04, transform: 'rotate(-18deg)' }}>{shopName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1.35fr,1fr] gap-3 mt-3 items-start text-[12px]">
          <div className="space-y-2">
            {cfg.showPriceAndTotals && cfg.showInWords && (
              <div className="rounded-md px-3 py-2" style={{ border: `1px solid ${borderSoft}`, backgroundColor: bgSoft }}>
                <span style={{ color: mutedColor }}>{isExpense ? 'মোট খরচ কথায়: ' : isTransfer ? 'মোট পরিমাণ / টাকা কথায়: ' : 'কথায়: '}</span><span className="font-bold">{data.paidInWords || 'শূন্য টাকা মাত্র'}</span>
              </div>
            )}
            
            {!isExpense && (
              <div className="rounded-md bg-white px-3 py-1.5 flex items-center justify-between text-[12px]" style={{ border: `1px solid ${borderSoft}` }}>
                <span><span style={{ color: mutedColor }}>মোট বস্তা: </span><b>{data.totalBags}</b></span><span className="w-px h-4" style={{ backgroundColor: borderSoft }} />
                <span><span style={{ color: mutedColor }}>মোট পিস: </span><b>{data.totalPieces} পিস</b></span>
                {cfg.showPriceAndTotals && (
                  <>
                    <span className="w-px h-4" style={{ backgroundColor: borderSoft }} />
                    <span><span style={{ color: mutedColor }}>গাড়ি ভাড়া: </span><b style={{ color: accent }}>{formatTaka(data.transportRent)}</b></span>
                  </>
                )}
              </div>
            )}
            
            {data.note && (
              <div className="rounded-md px-3 py-1.5 text-[12px]" style={{ backgroundColor: bgSoft, border: `1px solid ${borderSoft}`, borderLeft: `4px solid ${accent}` }}>
                <p className="font-bold">নোট:</p><p>{data.note}</p>
              </div>
            )}
          </div>
          
          {cfg.showPriceAndTotals && (
            <div className="rounded-md overflow-hidden bg-white" style={{ border: `1px solid ${borderSoft}` }}>
              {isExpense ? (
                <div className="px-3 py-3 flex justify-between items-center" style={{ backgroundColor: bgStrong, borderTop: `1.5px solid ${accent}` }}>
                  <span className="font-bold text-[13px]">মোট খরচ:</span><span className="font-bold text-[17px]">{formatTaka(data.grandTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 space-y-1 text-[12px]">
                    <div className="flex justify-between"><span style={{ color: mutedColor }}>মোট বিল:</span><span className="font-bold">{formatTaka(data.subtotal)}</span></div>
                    {data.discount > 0 && <div className="flex justify-between"><span style={{ color: mutedColor }}>ডিসকাউন্ট:</span><span className="font-bold">- {formatTaka(data.discount)}</span></div>}
                    {(data.deliveryCharge || data.transportRent) > 0 && <div className="flex justify-between"><span style={{ color: mutedColor }}>ডেলিভারি / ভাড়া:</span><span className="font-bold" style={{ color: accent }}>{formatTaka(data.deliveryCharge || data.transportRent)}</span></div>}
                    <div className="flex justify-between"><span style={{ color: mutedColor }}>মোট জমা:</span><span className="font-bold" style={{ color: accent }}>- {formatTaka(data.paidAmount)}</span></div>
                    {cfg.showPreviousDue && <div className="flex justify-between"><span style={{ color: mutedColor }}>পূর্বের বাকি:</span><span className="font-bold">{formatTaka(previousDue)}</span></div>}
                  </div>
                  <div className="px-3 py-2.5 flex justify-between items-center" style={{ backgroundColor: bgStrong, borderTop: `1.5px solid ${accent}` }}>
                    <span className="font-bold text-[13px]">{cfg.showPreviousDue ? 'সর্বমোট বাকি:' : 'বাকি:'}</span>
                    <span className="font-bold text-[17px]">{formatTaka(cfg.showPreviousDue ? netPayableWithPrev : data.dueAmount)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ✅ স্বাক্ষর সারির একটু উপরে শুভেচ্ছা বার্তা */}
        <div className="mt-4 pt-2 border-t border-dashed text-center" style={{ borderColor: borderSoft }}>
          <p className="text-[11.5px] font-bold italic" style={{ color: inkColor }}>{greeting}</p>
        </div>

        {cfg.showSignatures && (
          <div className={`grid ${isExpense ? 'grid-cols-2' : 'grid-cols-3'} gap-6 text-center text-[12px] mt-1`} style={{ paddingTop: 48 }}>
            {!isExpense ? (
              <>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${borderSoft}` }}>
                  <p className="font-bold">{sigLabels[0]}</p><p className="text-[11px]" style={{ color: mutedColor }}>{data.customerName}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${borderSoft}` }}>
                  <p className="font-bold">{sigLabels[1]}</p><p className="text-[11px]" style={{ color: mutedColor }}>{data.driverName && data.driverName !== 'N/A' ? data.driverName : '\u00A0'}{data.vehicleNo && data.vehicleNo !== 'N/A' ? ` (${data.vehicleNo})` : ''}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${accent}` }}>
                  <p className="font-bold">{sigLabels[2]}</p><p className="text-[11px]" style={{ color: accent }}>{shopName}</p>
                </div>
              </>
            ) : (
              <>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${borderSoft}` }}>
                  <p className="font-bold">{sigLabels[0]}</p><p className="text-[11px]" style={{ color: mutedColor }}>{data.customerName}</p>
                </div>
                <div className="pt-1.5" style={{ borderTop: `1.5px solid ${accent}` }}>
                  <p className="font-bold">{sigLabels[2]}</p><p className="text-[11px]" style={{ color: accent }}>{shopName}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ ফুটার ১ ও লকড ফুটার ২ — সেন্টারে ২ লাইনে */}
        <div className="mt-3 pt-2 text-center space-y-0.5" style={{ borderTop: `1px solid ${borderSoft}` }}>
          <p className="text-[10px] font-medium" style={{ color: mutedColor }}>{footer1}</p>
          <p className="text-[10.5px] font-bold" style={{ color: inkColor }}>{LOCKED_FOOTER_2}</p>
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
  const dims = getPaperDimensions(activeSettings);
  const paperW = dims.pxW;
  const paperH = dims.pxH;

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
    const imgData = canvas.toDataURL('image/jpeg', 0.86);
    const fmt = activeSettings.format === 'A5' ? 'a5' : activeSettings.format === 'custom' ? [dims.mmW, dims.mmH] : 'a4';
    const pdf = new jsPDF({ orientation: dims.mmW > dims.mmH ? 'l' : 'p', unit: 'mm', format: fmt as any, compress: true });
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
      showAppToast('পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে!', 'error');
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
      showAppToast('শেয়ার করতে সমস্যা হয়েছে!', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const formatLabel = activeSettings.format === 'custom' ? `${dims.mmW}×${dims.mmH}mm` : activeSettings.format;

  return (
    <>
      {createPortal(<style>{getReceiptStyles(dims.mmW, dims.mmH, dims.pageCss)}</style>, document.head)}

      <div className="receipt-modal-preview fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4">
        <div className="bg-white w-full max-w-[860px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FBF5E6] border-b border-[#E6DBBE] shrink-0">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="w-4 h-4 text-[#B98F33]" />
              <span className="font-semibold text-sm">{cfg.title} প্রিভিউ ({formatLabel})</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-700 hover:bg-[#F3E8C8] transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div ref={scrollRef} className="overflow-auto bg-slate-100 p-2 flex-1">
            <div className="mx-auto shadow-sm" style={{ width: paperW * scale, minHeight: paperH * scale }}>
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
          {activeSettings.copyMode === 'double' && (
            <ReceiptPaper data={data} settings={activeSettings} copyLabel="অফিস কপি" />
          )}
        </div>,
        document.body
      )}
    </>
  );
};