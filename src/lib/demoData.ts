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
  { id: '1', reason: 'গোডাউন ভাড়া', expense_type: 'গোডাউন ভাড়া', for_whom: 'ম্যানেজার', employee_name: 'রফিক', amount: 15000, date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime(), note: 'নভেম্বর মাসের ভাড়া' },
  { id: '2', reason: 'বিদ্যুৎ বিল', expense_type: 'বিদ্যুৎ বিল', for_whom: 'দোকান', employee_name: 'সজীব', amount: 1200, date: '09 Nov 2026', rawDate: new Date('2026-11-09').getTime(), note: 'অক্টোবর মাসের বিল' },
  { id: '3', reason: 'লোডিং খরচ', expense_type: 'পরিবহন', for_whom: 'ড্রাইভার', employee_name: '', amount: 5000, date: '05 Nov 2026', rawDate: new Date('2026-11-05').getTime(), note: '' }
];

export const demoEmployeesList = [
  { id: 'e1', name: 'রফিকুল ইসলাম' },
  { id: 'e2', name: 'সজীব আহমেদ' }
];

export const demoDepotStats = {
  stockValue: 155000,
  marketDue: 45000,
  companyPayable: 35000,
  todaySale: 12500,
  todayExpense: 2500,
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

export const demoCompanyStats = {
  currentStockValue: 150000,
  companyPayable: 35000,
};

export const demoCompanyActivities = [
  { id: 'a1', type: 'মাল গ্রহণ', date: '10 Nov 2026', amount: 50000, details: 'চালান #CH-102, ৫০ বস্তা গ্রোয়ার ফিড' },
  { id: 'a2', type: 'মাল ট্রান্সফার', date: '09 Nov 2026', amount: 20000, details: 'গাজীপুর ডিপোতে ২০ বস্তা পাঠানো হয়েছে' },
  { id: 'a3', type: 'লেনদেন', date: '08 Nov 2026', amount: 30000, details: 'ব্যাংক ট্রান্সফার এর মাধ্যমে পেমেন্ট' },
];

export const demoSupplierStats = {
  totalDue: 15000,
  totalPurchased: 250000,
};

export const demoSupplierActivities = [
  { id: 'sa1', type: 'মাল গ্রহণ', date: '11 Nov 2026', amount: 40000, details: 'চালান #CH-105, ৩০ বস্তা মাছের খাদ্য' },
  { id: 'sa2', type: 'পেমেন্ট', date: '10 Nov 2026', amount: 25000, details: 'বিকাশের মাধ্যমে পেমেন্ট' },
  { id: 'sa3', type: 'মাল গ্রহণ', date: '08 Nov 2026', amount: 60000, details: 'চালান #CH-098, ৫০ বস্তা গ্রোয়ার ফিড' },
];

export const demoCompaniesList = [
  { id: 'c1', name: 'নিউজা', commission: 5, max_discount: 2, contact_person: 'রফিক', phone: '01711223344', address: 'ঢাকা', notes: '', commission_rate_upto_100: 1000, commission_rate_above_100: 1300, loading_unloading_rate_per_ton: 500, delivery_rent_per_ton: 1000, transport_allowance_per_ton: 0, default_warehouse_rent: 15000, default_manager_salary: 10000, image_url: '', documents: ['trade_license.pdf'] },
  { id: 'c2', name: 'প্যারাগন', commission: 4, max_discount: 1, contact_person: 'সজীব', phone: '01811223344', address: 'গাজীপুর', notes: '', commission_rate_upto_100: 800, commission_rate_above_100: 1000, loading_unloading_rate_per_ton: 400, delivery_rent_per_ton: 800, transport_allowance_per_ton: 0, default_warehouse_rent: 15000, default_manager_salary: 10000, image_url: '', documents: [] }
];

export const demoPartners = [
  { id: 'p1', name: 'আব্দুর রহিম', phone: '01711223344', address: 'ঢাকা', share_percentage: 60, initial_capital: 500000, image_url: '', document_url: '' },
  { id: 'p2', name: 'করিম মিয়া', phone: '01811223344', address: 'গাজীপুর', share_percentage: 40, initial_capital: 300000, image_url: '', document_url: '' }
];

export const demoPartnerTransactions = [
  { id: 't1', partner_id: 'p1', amount: 50000, transaction_date: '2026-11-10', note: 'অতিরিক্ত বিনিয়োগ' },
  { id: 't2', partner_id: 'p1', amount: -20000, transaction_date: '2026-11-12', note: 'ব্যক্তিগত উত্তোলন' },
  { id: 't3', partner_id: 'p2', amount: 30000, transaction_date: '2026-11-11', note: 'অতিরিক্ত বিনিয়োগ' }
];

export const demoBusinessProfit = 250000;

export const demoDepotExpenses = [
  { id: '1', reason: 'গোডাউন ভাড়া', expense_type: 'গোডাউন ভাড়া', for_whom: 'ম্যানেজার', employee_name: 'রফিকুল ইসলাম', amount: 15000, date: '10 Nov 2026', rawDate: new Date('2026-11-10').getTime(), note: 'নভেম্বর মাসের ভাড়া' },
  { id: '2', reason: 'বিদ্যুৎ বিল', expense_type: 'বিদ্যুৎ বিল', for_whom: 'দোকান', employee_name: 'সজীব আহমেদ', amount: 1200, date: '09 Nov 2026', rawDate: new Date('2026-11-09').getTime(), note: 'অক্টোবর মাসের বিল' },
  { id: '3', reason: 'লোডিং খরচ', expense_type: 'পরিবহন', for_whom: 'ড্রাইভার', employee_name: '', amount: 5000, date: '05 Nov 2026', rawDate: new Date('2026-11-05').getTime(), note: '' }
];

export const demoDepotReportData = {
  totalSales: 125000,
  totalPurchases: 85000,
  totalExpenses: 15000,
  transportSurplus: 5000, // (-) হলে ঘাটতি, (+) হলে উদ্বৃত্ত
  totalProfit: 30000,
  partnerProfit: 15000, // উদাহরণস্বরূপ ৫০% শেয়ার
};

export const demoDepotReportDetails = {
  sales: [
    { id: 's1', receipt_no: 'INV-1001', date: '12 Nov 2026', amount: 12500, party: 'ভাই ভাই এগ্রো' },
    { id: 's2', receipt_no: 'INV-1002', date: '11 Nov 2026', amount: 8000, party: 'সাধারণ কাস্টমার' },
  ],
  purchases: [
    { id: 'p1', challan_no: 'CH-501', date: '10 Nov 2026', amount: 45000, party: 'নিউজা' },
    { id: 'p2', challan_no: 'CH-502', date: '09 Nov 2026', amount: 20000, party: 'স্কয়ার' },
  ],
  expenses: [
    { id: 'e1', type: 'গোডাউন ভাড়া', date: '05 Nov 2026', amount: 15000, note: 'নভেম্বর মাসের ভাড়া' },
    { id: 'e2', type: 'বিদ্যুৎ বিল', date: '04 Nov 2026', amount: 2000, note: 'অক্টোবর মাসের বিল' },
  ],
  transport: [
    { id: 't1', challan_no: 'CH-501', date: '10 Nov 2026', amount: 5000, party: 'নিউজা (উদ্বৃত্ত)' },
  ],
  profit: [
    { id: 'pr1', month: 'নভেম্বর ২০২৬', date: '30 Nov 2026', amount: 30000, note: 'মোট লাভ' },
  ],
  partner_profit: [
    { id: 'pp1', name: 'আব্দুর রহিম', date: '30 Nov 2026', amount: 18000, note: '৬০% শেয়ার' },
    { id: 'pp2', name: 'করিম মিয়া', date: '30 Nov 2026', amount: 12000, note: '৪০% শেয়ার' },
  ]
};

export const demoBonusEntries = [
  {
    id: 'b1',
    company_name: 'নিউজা',
    date: '12 Nov 2026',
    note: 'গাড়িপ্রতি ১০ বস্তা ফ্রি',
    items: [
      { product_name: 'গ্রোয়ার ফিড', quantity: 10 }
    ]
  },
  {
    id: 'b2',
    company_name: 'স্কয়ার',
    date: '10 Nov 2026',
    note: 'ঔষধ কোম্পানির বোনাস',
    items: [
      { product_name: 'ক্যালসিয়াম পাউডার', quantity: 20 }
    ]
  }
];