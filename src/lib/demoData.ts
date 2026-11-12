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

export const demoExpenses = [
  { id: '1', reason: 'দোকান ভাড়া', amount: 5000, date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime(), note: 'নভেম্বর মাসের ভাড়া' },
  { id: '2', reason: 'বিদ্যুৎ বিল', amount: 1200, date: '09 Nov 2026', rawDate: new Date('2026-11-09').getTime(), note: 'অক্টোবর মাসের বিল' },
  { id: '3', reason: 'কর্মচারী বেতন', amount: 15000, date: '05 Nov 2026', rawDate: new Date('2026-11-05').getTime(), note: '' }
];

export const demoDepotStats = {
  stockValue: 155000,
  marketDue: 45000,
  companyPayable: 35000,
  todaySale: 12500,
  todayExpense: 2500,
  todayProfit: 10000
};

export const demoSuppliers = [
  { id: 's1', name: 'মোল্লা পোল্ট্রি', phone: '01811223344', address: 'সাভার' },
  { id: 's2', name: 'ভাই ভাই এগ্রো', phone: '01711223344', address: 'গাজীপুর' }
];

export const demoEmployees = [
  { id: 'e1', name: 'রফিকুল ইসলাম', phone: '01911223344' }
];

export const demoReportRawData = {
  sales: [
    { id: '1', total_amount: 50000, due_amount: 5000, sale_date: new Date().toISOString(), customer_id: 'c1', customers: { name: 'রহিম স্টোর' } },
    { id: '2', total_amount: 30000, due_amount: 0, sale_date: new Date().toISOString(), customer_id: 'c2', customers: { name: 'করিম এন্টারপ্রাইজ' } }
  ],
  purchases: [
    { id: '1', total_amount: 40000, due_amount: 2000, purchase_date: new Date().toISOString(), challan_no: 'CH-001' }
  ],
  expenses: [
    { id: '1', amount: 1200, reason: 'দোকান ভাড়া', date: new Date().toISOString(), note: 'নভেম্বর মাস' },
    { id: '2', amount: 800, reason: 'বিদ্যুৎ বিল', date: new Date().toISOString(), note: '' }
  ],
  products: [
    { id: 'p1', name: 'গ্রোয়ার ফিড', stock_quantity: 50, purchase_price: 1900, sale_price: 2050, categories: { name: 'মাছের খাদ্য' }, companies: { name: 'নিউজা' } },
    { id: 'p2', name: 'ক্যালসিয়াম', stock_quantity: 100, purchase_price: 280, sale_price: 350, categories: { name: 'ঔষধ' }, companies: { name: 'স্কয়ার' } }
  ],
  customers: [
    { id: 'c1', name: 'রহিম স্টোর', due_balance: 15000, phone: '01711000001' }
  ],
  suppliers: [
    { id: 's1', name: 'ভাই ভাই এগ্রো', due_balance: 5000, phone: '01811000001' }
  ]
};

export const demoDepotDealers = [
  { id: 'd1', dealer_code: 'DLR-001', name: "ভাই ভাই এগ্রো", phone: "01711000001", area: "গাজীপুর", due_balance: 15000, previous_due: 20000, image_url: '', documents: [] },
  { id: 'd2', dealer_code: 'DLR-002', name: "মোল্লা পোল্ট্রি", phone: "01711000002", area: "সাভার", due_balance: 8000, previous_due: 8000, image_url: '', documents: [] },
];

export const demoOfficers = [
  { 
    id: 'o1', name: "রফিকুল ইসলাম", phone: "01911000001", area: "উত্তর বাজার", 
    target_amount: 100000, commission_rate: 5, commission_type: 'Officer Commission',
    status: 'Active', role: 'Default Officer', van_stock_value: 45000, cash_in_hand: 12000, 
    image_url: '', documents: [] 
  },
  { 
    id: 'o2', name: "সজীব আহমেদ", phone: "01911000002", area: "দক্ষিণ বাজার", 
    target_amount: 80000, commission_rate: 4, commission_type: 'Fixed',
    status: 'Inactive', role: 'Default Officer', van_stock_value: 38000, cash_in_hand: 8500, 
    image_url: '', documents: [] 
  },
];

export const demoInternalTransfers = [
  {
    id: 'TR-1001',
    source_depot: "কেন্দ্রীয় গুদাম",
    destination_depot: "গাজীপুর ডিপো",
    vehicle_no: "ঢাকা-ট ১১-১২৩৪",
    date: "০৭ নভেম্বর, ২০২৬",
    status: 'In-Transit',
    items: [
      { id: 'p1', name: "গ্রোয়ার ফিড (২৫ কেজি)", quantity: 50, unit: "বস্তা" },
      { id: 'p2', name: "রুই পোনা খাদ্য (১০ কেজি)", quantity: 20, unit: "ব্যাগ" }
    ]
  }
];