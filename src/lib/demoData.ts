// src/lib/demoData.ts

export const demoProducts = [
  { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', stock: 50, purchasePrice: 1900, salePrice: 2050 },
  { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', stock: 100, purchasePrice: 280, salePrice: 350 },
  { id: 3, name: 'অক্সিজেন পাম্প', category: 'যন্ত্রপাতি', company: 'নিপ্রো', stock: 5, purchasePrice: 4000, salePrice: 4500 },
];

export const demoCategories = [
  { id: 1, name: 'মাছের খাদ্য' },
  { id: 2, name: 'ঔষধ ও ভিটামিন' },
  { id: 3, name: 'যন্ত্রপাতি' },
];

export const demoCompanies = [
  { id: 1, name: 'নিউজা' },
  { id: 2, name: 'প্যারাগন' },
  { id: 3, name: 'স্কয়ার' },
];

export const demoDealers = [
  { id: 1, name: "ভাই ভাই এগ্রো", phone: "01711000001", area: "গাজীপুর", dueBalance: 15000, totalPaid: 50000 },
  { id: 2, name: "মোল্লা পোল্ট্রি", phone: "01711000002", area: "সাভার", dueBalance: 8000, totalPaid: 120000 },
];

export const demoReportData = {
  cashBalance: 180000,
  totalInvestment: 500000,
  totalPurchase: 320000,
  totalSales: 245000,
  totalExpense: 34500,
  totalProfit: 210500,
  stockValue: 155000,
  customerDue: 15000,
  supplierDue: 8000
};

// এখানে আপনার অ্যাপের বাকি সব ডেমু ডাটা (খাতা, পার্টনার ইত্যাদি) রাখতে পারেন।