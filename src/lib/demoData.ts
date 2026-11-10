// src/lib/demoData.ts

export const demoProducts = [
  { id: 1, name: 'গ্রোয়ার ফিড', category: 'মাছের খাদ্য', company: 'নিউজা', stock: 50, purchasePrice: 1900, salePrice: 2050, image_url: '' },
  { id: 2, name: 'ক্যালসিয়াম পাউডার', category: 'ঔষধ ও ভিটামিন', company: 'স্কয়ার', stock: 100, purchasePrice: 280, salePrice: 350, image_url: '' },
  { id: 3, name: 'অক্সিজেন পাম্প', category: 'যন্ত্রপাতি', company: 'নিপ্রো', stock: 5, purchasePrice: 4000, salePrice: 4500, image_url: '' },
  { id: 4, name: 'রুই পোনা খাদ্য', category: 'মাছের খাদ্য', company: 'প্যারাগন', stock: 30, purchasePrice: 800, salePrice: 950, image_url: '' },
  { id: 5, name: 'প্লাস্টিকের ড্রাম', category: 'প্যাকেজিং', company: 'নিউজা', stock: 20, purchasePrice: 500, salePrice: 650, image_url: '' },
];

export const demoCategories = [
  { id: 1, name: 'মাছের খাদ্য' },
  { id: 2, name: 'ঔষধ ও ভিটামিন' },
  { id: 3, name: 'যন্ত্রপাতি' },
  { id: 4, name: 'প্যাকেজিং' },
];

export const demoCompanies = [
  { id: 1, name: 'নিউজা' },
  { id: 2, name: 'প্যারাগন' },
  { id: 3, name: 'স্কয়ার' },
  { id: 4, name: 'নিপ্রো' },
];

export const demoDealers = [
  { id: 1, name: "ভাই ভাই এগ্রো", phone: "01711000001", area: "গাজীপুর", due_balance: 15000, total_paid: 50000 },
  { id: 2, name: "মোল্লা পোল্ট্রি", phone: "01711000002", area: "সাভার", due_balance: 8000, total_paid: 120000 },
];

export const demoCustomers = [
  { id: 'c1', name: 'করিম মিয়া', phone: '01711223344', due_balance: 0 },
  { id: 'c2', name: 'রহিম উদ্দিন', phone: '01811223344', due_balance: 1500 },
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

export const demoDashboardStats = {
  TODAY: { 
    sales: 8500, 
    expense: 1200, 
    due_received: 500, 
    due_given: 200,
    unread_inbox: 2 
  },
  WEEK: { 
    sales: 45000, 
    expense: 6500, 
    due_received: 3000, 
    due_given: 1500,
    unread_inbox: 5
  },
  MONTH: { 
    sales: 245000, 
    expense: 34500, 
    due_received: 15000, 
    due_given: 8000,
    unread_inbox: 12
  },
};