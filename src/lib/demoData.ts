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

// 🚀 রিসিপ্টের জন্য সম্পূর্ণ ডেমু ডেটা
export const demoReceiptDefaults = {
  shopDescription: 'প্রোপ্রাইটর্রি ও পরিবেশক: উন্নতমানের পোল্ট্রি, ফিশ ফিড ও এগ্রো সলিউশনস',
  tableNote: '* ডেলিভারির সময় পণ্যের বস্তা ও ওজন সঠিকভাবে বুঝে নেওয়া হলো।',
  footerText1: 'আমাদের সাথে ব্যবসা পরিচালনার জন্য ধন্যবাদ!',
  footerText2: 'সফটওয়্যার তৈরিতে Akand Smart Solutions',
  defaultNote: 'AGM Mob No: 01774401252 বিল পরিশোধ কোম্পানির কাছে।',
  
  // এসআর তথ্য
  srName: 'মো: রহমতুল্লাহ আকন্দ',
  srPhone: '০১৭১১২২৩৩৪৪',
  
  // গাড়ি ও ড্রাইভার তথ্য
  vehicleNo: 'ঢাকা মেট্রো-ট ১১-৮৬২৩',
  driverName: 'মো: মিজানুর ইসলাম',
  driverPhone: '০১৭৫৫-৮০৬৯২০',
  transportRent: 500,

  // কথায় টাকা (ইন-ওয়ার্ডস)
  inWords: 'দুই হাজার সাতশত নব্বই টাকা মাত্র',
};

// কাস্টমার ডেমু ডেটা (যদি আগের ফাইলে না থাকে তবে এগুলো ব্যবহার হবে)
export const demoCustomersDetailed = [
  { 
    id: 'c1', 
    name: 'AlHira poultry and fish feed', 
    proprietor: 'Md. Amran Hossain', 
    phone: '০১৭৩৩৩৮৮৮০৫', 
    address: 'খানপাড়া, শ্রী মতি বাজার, হাজীপুর', 
    market_name: 'বাজার: খানপাড়া, শ্রী মতি বাজার, হাজীপুর', 
    due_balance: 15000 
  },
  { 
    id: 'c2', 
    name: 'মেসার্স ভাই ভাই এগ্রো', 
    proprietor: 'আব্দুর রহিম', 
    phone: '০১৮২২৩৩৪৪৫৫', 
    address: 'নতুন বাজার, মিরপুর', 
    market_name: 'বাজার: মিরপুর ১১', 
    due_balance: 0 
  }
];

// ডিপো ট্রান্সফারের জন্য ডেমু ডাটা
export const demoDepots = [
  { id: 'dep1', name: 'কেন্দ্রীয় গুদাম', phone: '01700000000', address: 'হেড অফিস' },
  { id: 'dep2', name: 'গাজীপুর ডিপো', phone: '01700000001', address: 'গাজীপুর' }
];

export const demoDepotStockHistory = [
  {
    id: 'h1',
    type: 'stock_in',
    date: '14 Nov 2026, 10:30 AM',
    reference_no: 'PUR-10023',
    party_name: 'ACI Limited',
    amount: 25000,
    items: [
      { name: 'গ্রোয়ার ফিড', qty: 10, unit: 'বস্তা' },
      { name: 'ক্যালসিয়াম পাউডার', qty: 5, unit: 'পিস' }
    ]
  },
  {
    id: 'h2',
    type: 'sale',
    date: '13 Nov 2026, 04:15 PM',
    reference_no: 'INV-8821',
    party_name: 'মোল্লা পোল্ট্রি',
    amount: 8500,
    items: [
      { name: 'গ্রোয়ার ফিড', qty: 4, unit: 'বস্তা' }
    ]
  },
  {
    id: 'h3',
    type: 'transfer',
    date: '12 Nov 2026, 11:00 AM',
    reference_no: 'TRN-5521',
    party_name: 'গাজীপুর ডিপো',
    amount: 15000,
    items: [
      { name: 'রুই পোনা খাদ্য', qty: 15, unit: 'ব্যাগ' }
    ]
  },
  {
    id: 'h4',
    type: 'stock_in',
    date: '10 Nov 2026, 09:00 AM',
    reference_no: 'PUR-10022',
    party_name: 'স্কয়ার ফিড',
    amount: 40000,
    items: [
      { name: 'লেয়ার ফিড', qty: 20, unit: 'বস্তা' }
    ]
  }
];

// ইউজার ও রোল ম্যানেজমেন্টের ডেমু ডাটা
export const demoUsers = [
  { id: 'u1', name: 'মিওয়ান', role: 'OWNER', phone: '01752005057', status: 'Active', address: 'ঢাকা', email: 'owner@example.com', joinDate: '2026-01-01' },
  { id: 'u2', name: 'রফিকুল ইসলাম', role: 'MANAGER', phone: '01911000001', status: 'Active', address: 'গাজীপুর', email: 'rafiq@example.com', joinDate: '2026-05-15' },
];

export const demoRoles = [
  { 
    id: 'r1', 
    name: 'OWNER', 
    permissions: { 'কেনা': true, 'বিক্রি করুন': true, 'কেনার খাতা': true, 'বিক্রির খাতা': true, 'বাকি': true, 'খরচ': true, 'যোগাযোগ': true, 'প্রোডাক্ট লিস্ট': true, 'স্টকের হিসাব': true, 'মার্কেটিং': true },
    settings: { 'Shop Reset': true, 'রিসাইকেল বিন': true, 'শপ এডিট': true, 'বিকাশ/নগদ কিউ আর': true }
  },
  { 
    id: 'r2', 
    name: 'MANAGER', 
    permissions: { 'কেনা': true, 'বিক্রি করুন': true, 'কেনার খাতা': true, 'বিক্রির খাতা': true, 'বাকি': true, 'খরচ': true, 'যোগাযোগ': true, 'প্রোডাক্ট লিস্ট': true, 'স্টকের হিসাব': true, 'মার্কেটিং': false },
    settings: { 'Shop Reset': false, 'রিসাইকেল বিন': true, 'শপ এডিট': false, 'বিকাশ/নগদ কিউ আর': true }
  }
];

export const demoStaffMembers = [
  { id: 's1', name: 'মিওয়ান', role: 'OWNER', phone: '01752005057', email: 'owner@demo.com', status: 'Active', join_date: '2026-01-01', business_id: 'demo-biz-1' },
  { id: 's2', name: 'রফিকুল ইসলাম', role: 'MANAGER', phone: '01911000001', email: 'rafiq@demo.com', status: 'Active', join_date: '2026-05-15', business_id: 'demo-biz-1' },
];

export const demoDeletedItems = [
  { id: 'del-sale-1',  type: 'Sale',     name: 'রিসিপ্ট # GVMTQX7S4WGR89W', amount: 100,  deletedAt: '2026-11-07T10:30:00' },
  { id: 'del-pur-1',   type: 'Purchase', name: 'রিসিপ্ট # JTMPBC953J7J20P', amount: 280,  deletedAt: '2026-11-06T16:15:00' },
  { id: 'del-prod-1',  type: 'Product',  name: 'টেস্ট প্রোডাক্ট',           amount: 0,    deletedAt: '2026-11-05T11:20:00' },
  { id: 'del-cust-1',  type: 'Customer', name: 'রহিম এন্টারপ্রাইজ',         amount: 0,    deletedAt: '2026-11-04T09:45:00' },
  { id: 'del-sup-1',   type: 'Supplier', name: 'মোল্লা পোল্ট্রি',           amount: 0,    deletedAt: '2026-11-03T14:10:00' },
  { id: 'del-exp-1',   type: 'Expense',  name: 'গোডাউন ভাড়া',              amount: 5000, deletedAt: '2026-11-02T10:00:00' },
  { id: 'del-trn-1',   type: 'Transfer', name: 'ট্রান্সফার # TR-2026-011',  amount: 0,    deletedAt: '2026-11-01T13:00:00' },
];

export const demoShopCashbox = [
  { id: 'sc1', source: 'sale', type: 'নগদ বিক্রি', title: 'বিক্রি #INV-1001 (করিম)', amount: 4500, isIncome: true, rawDate: Date.now() - 3600000, date: 'আজ | ১১:৩০ AM', note: 'দোকান নগদ বিক্রি' },
  { id: 'sc2', source: 'purchase', type: 'নগদ ক্রয়', title: 'ক্রয় #PUR-201 (ভাই ভাই এগ্রো)', amount: 2200, isIncome: false, rawDate: Date.now() - 7200000, date: 'আজ | ১০:১৫ AM', note: 'দোকান নগদ ক্রয়' },
  { id: 'sc3', source: 'expense', type: 'খরচ', title: 'বিদ্যুৎ বিল', amount: 650, isIncome: false, rawDate: Date.now() - 86400000, date: 'গতকাল', note: 'দোকান খরচ' },
];

export const demoDepotCashbox = [
  { id: 'dc1', source: 'manual', type: 'কোম্পানি গাড়ি ভাড়া', title: 'কোম্পানি থেকে প্রাপ্ত গাড়ি ভাড়া', amount: 2500, isIncome: true, rawDate: Date.now() - 3600000, date: 'আজ | ১২:০০ PM', note: 'নিউজা মাল পৌঁছানো বাবদ' },
  { id: 'dc2', source: 'sale', type: 'নগদ বিক্রি', title: 'ডিপো বিক্রি #DA-2026-0001', amount: 35000, isIncome: true, rawDate: Date.now() - 7200000, date: 'আজ | ১০:৩০ AM', note: 'ডিলার নগদ জমা' },
  { id: 'dc3', source: 'expense', type: 'পরিবহন খরচ', title: 'গাড়ি ভাড়া (ড্রাইভার সোহেল)', amount: 1200, isIncome: false, rawDate: Date.now() - 10800000, date: 'আজ | ০৯:১৫ AM', note: 'ডিলার ডেলিভারি ভাড়া' },
  { id: 'dc4', source: 'purchase', type: 'নগদ ক্রয়', title: 'ডিপো স্টক-ইন পেমেন্ট', amount: 18000, isIncome: false, rawDate: Date.now() - 86400000, date: 'গতকাল', note: 'নগদ পরিশোধ' },
];