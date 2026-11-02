import {
  Transaction,
  Customer,
  CardProduct,
  SimWallet,
  ShopExpense,
  ActivityLog,
  ShopSettings,
  MonthlyProfitReport
} from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'telekhatta_transactions',
  CUSTOMERS: 'telekhatta_customers',
  CARDS: 'telekhatta_cards',
  WALLETS: 'telekhatta_wallets',
  EXPENSES: 'telekhatta_expenses',
  LOGS: 'telekhatta_logs',
  SETTINGS: 'telekhatta_settings',
  SNAPSHOTS: 'telekhatta_snapshots'
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Mawa Enterprise & Digital Hub',
  shopOwner: 'মোঃ শাহ আলম',
  phone: '01712-345678',
  address: 'নিউ মার্কেট মোড়, স্টেশন রোড',
  currencySymbol: '৳',
  isPinLocked: false,
  masterPin: '1234',
  autoLockMinutes: 15,
  printPaperSize: '58mm',
  drawerCash: 16400,
  commissions: {
    bkashCashOutRate: 4.10, // 4.10 Tk per 1000 Tk
    bkashCashInRate: 1.50, // 1.50 Tk per 1000 Tk
    bkashCashInFee: 0,
    nagadCashOutRate: 4.30,
    nagadCashInRate: 1.50,
    nagadCashInFee: 0,
    rocketCashOutRate: 4.20,
    rocketCashInRate: 1.50,
    rocketCashInFee: 0,
    flexiloadCommissionPerThousand: 28 // 28 Tk per 1000 Tk (2.8%)
  },
  language: 'bn'
};

const DEFAULT_WALLETS: SimWallet[] = [
  { id: 'w1', name: 'বিকাশ এজেন্ট ১', service: 'bkash', walletType: 'agent', phone: '01712-345678', currentBalance: 42350, minThreshold: 5000 },
  { id: 'w2', name: 'নগদ এজেন্ট ১', service: 'nagad', walletType: 'agent', phone: '01823-456789', currentBalance: 27500, minThreshold: 5000 },
  { id: 'w3', name: 'রকেট এজেন্ট', service: 'rocket', walletType: 'agent', phone: '01912-334455', currentBalance: 15800, minThreshold: 3000 },
  { id: 'w4', name: 'জিপি ফ্লেক্সিলোড সিম', service: 'gp', walletType: 'agent', phone: '01700-112233', currentBalance: 8900, minThreshold: 1500 },
  { id: 'w5', name: 'বাংলালিংক ইজিলোড সিম', service: 'bl', walletType: 'agent', phone: '01900-223344', currentBalance: 6200, minThreshold: 1500 },
  { id: 'w6', name: 'রবি / এয়ারটেল লোড সিম', service: 'robi', walletType: 'agent', phone: '01800-334455', currentBalance: 7400, minThreshold: 1500 },
  { id: 'w7', name: 'বিকাশ পার্সোনাল সিম', service: 'bkash', walletType: 'personal', phone: '01733-998877', currentBalance: 12500, minThreshold: 2000 },
  { id: 'w8', name: 'নগদ পার্সোনাল সিম', service: 'nagad', walletType: 'personal', phone: '01855-667788', currentBalance: 8400, minThreshold: 2000 }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'রফিকুল ইসলাম (শিক্ষক)',
    phone: '01711-223344',
    address: 'বাসা ১২, কলেজ রোড',
    totalDue: 450,
    totalDeposit: 0,
    notes: 'মাসের ১ তারিখে বেতন পেয়ে বাকি পরিশোধ করেন',
    createdAt: '2026-10-15T09:00:00.000Z',
    lastActivityAt: '2026-11-01T08:30:00.000Z'
  },
  {
    id: 'c2',
    name: 'আল-আমিন ভাই (মুদি দোকানি)',
    phone: '01822-334455',
    address: 'বাজার গলি দোকান নং ৪',
    totalDue: 1200,
    totalDeposit: 0,
    notes: 'নগদ ক্যাশআউটের বাকি',
    createdAt: '2026-10-18T10:15:00.000Z',
    lastActivityAt: '2026-10-31T17:40:00.000Z'
  },
  {
    id: 'c3',
    name: 'মোঃ সেলিম মাস্টার',
    phone: '01933-445566',
    address: 'উত্তরপাড়া',
    totalDue: 0,
    totalDeposit: 500,
    notes: 'অগ্রিম ৫০০ টাকা জমা রেখেছেন রিচার্জের জন্য',
    createdAt: '2026-10-20T11:00:00.000Z',
    lastActivityAt: '2026-11-01T09:10:00.000Z'
  },
  {
    id: 'c4',
    name: 'কামাল হোসেন (প্রবাসী ভাইয়ের পরিবার)',
    phone: '01644-556677',
    address: 'পূর্বপাড়া মসজিদ সংলগ্ন',
    totalDue: 800,
    totalDeposit: 0,
    notes: 'বিদেশ থেকে টাকা পাঠালে শোধ করবেন',
    createdAt: '2026-10-22T14:20:00.000Z',
    lastActivityAt: '2026-10-29T16:15:00.000Z'
  },
  {
    id: 'c5',
    name: 'তানভীর আহমেদ',
    phone: '01555-667788',
    address: 'রেলগেট রোড',
    totalDue: 250,
    totalDeposit: 0,
    notes: 'ইন্টারনেট ড্রাইভ প্যাক বাকি',
    createdAt: '2026-10-25T16:00:00.000Z',
    lastActivityAt: '2026-10-30T19:00:00.000Z'
  }
];

const DEFAULT_CARDS: CardProduct[] = [
  {
    id: 'p1',
    title: 'Robi 350 Minutes (30 Days)',
    banglaTitle: 'রবি ৩৫০ মিনিট (৩০ দিন)',
    operator: 'robi',
    category: 'minute',
    buyingPrice: 220,
    sellingPrice: 250,
    stockCount: 16,
    validityDays: 30,
    minutes: 350
  },
  {
    id: 'p2',
    title: 'Banglalink 10 GB (7 Days Drive)',
    banglaTitle: 'বাংলালিংক ১০ জিবি (৭ দিন ড্রাইভ)',
    operator: 'bl',
    category: 'mb',
    buyingPrice: 155,
    sellingPrice: 185,
    stockCount: 24,
    validityDays: 7,
    dataMb: 10240
  },
  {
    id: 'p3',
    title: 'GP 550 Min + 2 GB Combo (30 Days)',
    banglaTitle: 'জিপি ৫৫০ মিনিট + ২ জিবি কম্বো (৩০ দিন)',
    operator: 'gp',
    category: 'combo',
    buyingPrice: 385,
    sellingPrice: 435,
    stockCount: 12,
    validityDays: 30,
    minutes: 550,
    dataMb: 2048
  },
  {
    id: 'p4',
    title: 'Airtel Unlimited Voice 30 Days',
    banglaTitle: 'এয়ারটেল আনলিমিটেড মিনিট প্যাক (৩০ দিন)',
    operator: 'airtel',
    category: 'minute',
    buyingPrice: 195,
    sellingPrice: 225,
    stockCount: 9,
    validityDays: 30,
    minutes: 400
  },
  {
    id: 'p5',
    title: 'GP 30 Tk Scratch Card',
    banglaTitle: 'জিপি ৩০ টাকা স্ক্র্যাচ কার্ড',
    operator: 'gp',
    category: 'scratch',
    buyingPrice: 28.5,
    sellingPrice: 30,
    stockCount: 45,
    validityDays: 60
  },
  {
    id: 'p6',
    title: 'BL 50 Tk Scratch Card',
    banglaTitle: 'বাংলালিংক ৫০ টাকা স্ক্র্যাচ কার্ড',
    operator: 'bl',
    category: 'scratch',
    buyingPrice: 47.5,
    sellingPrice: 50,
    stockCount: 38,
    validityDays: 90
  }
];

const DEFAULT_EXPENSES: ShopExpense[] = [
  {
    id: 'e1',
    category: 'rent',
    title: 'দোকান ভাড়া (অক্টোবর)',
    amount: 5000,
    date: '2026-10-05T10:00:00.000Z',
    paidFrom: 'drawer'
  },
  {
    id: 'e2',
    category: 'electricity',
    title: 'পল্লী বিদ্যুৎ বিল',
    amount: 1450,
    date: '2026-10-12T11:30:00.000Z',
    paidFrom: 'drawer'
  },
  {
    id: 'e3',
    category: 'refreshment',
    title: 'কাস্টমার ও দোকানের চা-নাস্তা খরচ',
    amount: 420,
    date: '2026-10-28T16:00:00.000Z',
    paidFrom: 'drawer'
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-101',
    type: 'cash_in',
    service: 'bkash',
    amount: 3000,
    customerPhone: '01712-889900',
    customerName: 'মাসুদ রানা',
    trxId: 'BKA881239X',
    commission: 0,
    fee: 0,
    profit: 0,
    drawerCashDelta: 3000,
    simBalanceDelta: -3000,
    createdAt: '2026-11-01T09:15:00.000Z',
    source: 'pos',
    simWalletId: 'w1'
  },
  {
    id: 'trx-102',
    type: 'cash_out',
    service: 'bkash',
    amount: 5000,
    customerPhone: '01788-112233',
    customerName: 'আব্দুল করিম',
    trxId: 'BKA881452Y',
    commission: 20.50, // 4.10 * 5
    fee: 0,
    profit: 20.50,
    drawerCashDelta: -5000,
    simBalanceDelta: 5000,
    createdAt: '2026-11-01T09:35:00.000Z',
    source: 'pos',
    simWalletId: 'w1'
  },
  {
    id: 'trx-103',
    type: 'flexiload',
    service: 'gp',
    amount: 200,
    customerPhone: '01711-223344',
    customerName: 'রফিকুল ইসলাম',
    commission: 5.60, // 28 per 1000 => 2.8%
    fee: 0,
    profit: 5.60,
    drawerCashDelta: 200,
    simBalanceDelta: -200,
    operator: 'gp',
    createdAt: '2026-11-01T09:50:00.000Z',
    source: 'mobile',
    simWalletId: 'w4'
  },
  {
    id: 'trx-104',
    type: 'cash_out',
    service: 'nagad',
    amount: 4000,
    customerPhone: '01899-776655',
    customerName: 'ফারুক হোসেন',
    trxId: 'NGD992384P',
    commission: 17.20, // 4.30 * 4
    fee: 0,
    profit: 17.20,
    drawerCashDelta: -4000,
    simBalanceDelta: 4000,
    createdAt: '2026-11-01T10:05:00.000Z',
    source: 'pos',
    simWalletId: 'w2'
  },
  {
    id: 'trx-105',
    type: 'card_sale',
    service: 'card',
    amount: 250,
    customerPhone: '01855-667788',
    customerName: 'জাহিদুল ইসলাম',
    commission: 0,
    fee: 0,
    profit: 30, // 250 - 220
    packDetails: 'রবি ৩৫০ মিনিট (৩০ দিন)',
    cardProductId: 'p1',
    drawerCashDelta: 250,
    simBalanceDelta: 0,
    createdAt: '2026-11-01T10:12:00.000Z',
    source: 'pos'
  },
  {
    id: 'trx-106',
    type: 'customer_payment',
    service: 'customer',
    amount: 500,
    customerPhone: '01822-334455',
    customerName: 'আল-আমিন ভাই',
    customerId: 'c2',
    commission: 0,
    fee: 0,
    profit: 0,
    drawerCashDelta: 500,
    simBalanceDelta: 0,
    note: 'পূর্বের ১,৭০০ টাকার বাকি থেকে ৫০০ টাকা জমা',
    createdAt: '2026-11-01T10:15:00.000Z',
    source: 'mobile'
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    action: 'দোকান হিসাব ওপেন',
    details: 'সকাল ৯:০০ টায় ক্যাশ ড্রয়ার ও সিম ব্যালেন্স মিলিয়ে সিস্টেম শুরু',
    timestamp: '2026-11-01T09:00:00.000Z',
    category: 'system',
    level: 'info'
  },
  {
    id: 'log-2',
    action: 'বিকাশ ক্যাশআউট সফল',
    details: '৳৫,০০০ ক্যাশআউট। ট্রানজেকশন আইডি: BKA881452Y',
    timestamp: '2026-11-01T09:35:00.000Z',
    category: 'transaction',
    level: 'success'
  },
  {
    id: 'log-3',
    action: 'বাকি আদায়',
    details: 'আল-আমিন ভাই ৫০০ টাকা পরিশোধ করেছেন',
    timestamp: '2026-11-01T10:15:00.000Z',
    category: 'ledger',
    level: 'success'
  }
];

export class TeleKhattaDB {
  static getSettings(): ShopSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.shopName || parsed.shopName === 'বিসমিল্লাহ টেলিকম ও এমএফএস পয়েন্ট') {
        parsed.shopName = 'Mawa Enterprise & Digital Hub';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: ShopSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.addLog('সেটিংস পরিবর্তন', 'দোকানের সাধারণ সেটিংস ও কমিশন রেট আপডেট করা হয়েছে', 'system', 'info');
  }

  static getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getCustomers(): Customer[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      return DEFAULT_CUSTOMERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CUSTOMERS;
    }
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getCards(): CardProduct[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(DEFAULT_CARDS));
      return DEFAULT_CARDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CARDS;
    }
  }

  static saveCards(cards: CardProduct[]): void {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }

  static getWallets(): SimWallet[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(DEFAULT_WALLETS));
      return DEFAULT_WALLETS;
    }
    try {
      const parsed: SimWallet[] = JSON.parse(raw);
      // Ensure all wallets have walletType ('agent' | 'personal')
      return parsed.map(w => ({
        ...w,
        walletType: w.walletType || 'agent',
        status: w.status || 'active'
      }));
    } catch {
      return DEFAULT_WALLETS;
    }
  }

  static saveWallets(wallets: SimWallet[]): void {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }

  static addSimWallet(
    walletData: Omit<SimWallet, 'id'>, 
    deductFromDrawer: boolean = false
  ): SimWallet {
    const wallets = this.getWallets();
    const newWallet: SimWallet = {
      ...walletData,
      id: 'w-' + Date.now(),
      walletType: walletData.walletType || 'agent',
      status: walletData.status || 'active'
    };
    wallets.push(newWallet);
    this.saveWallets(wallets);

    if (deductFromDrawer && newWallet.currentBalance > 0) {
      const settings = this.getSettings();
      settings.drawerCash -= newWallet.currentBalance;
      this.saveSettings(settings);
    }

    const typeBn = newWallet.walletType === 'agent' ? 'এজেন্ট' : 'পার্সোনাল';
    this.addLog(
      `নতুন ${typeBn} সিম যুক্ত করা হয়েছে`,
      `${newWallet.name} (${newWallet.phone}) — প্রারম্ভিক ব্যালেন্স: ৳${newWallet.currentBalance.toLocaleString('en-US')}${deductFromDrawer ? ' (ড্রয়ার ক্যাশ থেকে সমন্বয়)' : ''}`,
      'system',
      'success'
    );
    return newWallet;
  }

  static editSimWallet(id: string, updates: Partial<SimWallet>): boolean {
    const wallets = this.getWallets();
    const idx = wallets.findIndex(w => w.id === id);
    if (idx === -1) return false;

    wallets[idx] = { ...wallets[idx], ...updates };
    this.saveWallets(wallets);

    this.addLog(
      'সিম তথ্য আপডেট',
      `${wallets[idx].name} এর তথ্য ও কনফিগারেশন আপডেট করা হয়েছে`,
      'system',
      'info'
    );
    return true;
  }

  static deleteSimWallet(id: string): boolean {
    const wallets = this.getWallets();
    const idx = wallets.findIndex(w => w.id === id);
    if (idx === -1) return false;

    const deleted = wallets[idx];
    wallets.splice(idx, 1);
    this.saveWallets(wallets);

    this.addLog(
      'সিম / ওয়ালেট মুছে ফেলা হয়েছে',
      `${deleted.name} (${deleted.phone}) মুছে ফেলা হয়েছে (ব্যালেন্স ছিল: ৳${deleted.currentBalance.toLocaleString('en-US')})`,
      'system',
      'warning'
    );
    return true;
  }

  static updateWalletBalance(
    walletId: string, 
    newBalance: number, 
    reason: string = 'ব্যালেন্স ঠিক করা',
    adjustDrawer: boolean = false,
    newThreshold?: number
  ): boolean {
    const wallets = this.getWallets();
    const idx = wallets.findIndex(w => w.id === walletId);
    if (idx === -1) return false;

    const oldBalance = wallets[idx].currentBalance;
    const diff = newBalance - oldBalance;
    wallets[idx].currentBalance = newBalance;
    if (typeof newThreshold === 'number' && !isNaN(newThreshold) && newThreshold >= 0) {
      wallets[idx].minThreshold = newThreshold;
    }
    this.saveWallets(wallets);

    if (adjustDrawer && diff !== 0) {
      const settings = this.getSettings();
      // If SIM balance increased and drawer cash was used, drawer reduces. If SIM balance decreased, cash goes to drawer.
      settings.drawerCash -= diff;
      this.saveSettings(settings);
    }

    const diffText = diff > 0 ? `+৳${diff.toLocaleString('en-US')}` : diff < 0 ? `-৳${Math.abs(diff).toLocaleString('en-US')}` : 'অপরিবর্তিত';
    this.addLog(
      'সিম ব্যালেন্স ঠিক করা ও সমন্বয়',
      `${wallets[idx].name}: পূর্বের ব্যালেন্স ৳${oldBalance.toLocaleString('en-US')} থেকে পরিবর্তন করে ৳${newBalance.toLocaleString('en-US')} নির্ধারণ করা হয়েছে (${diffText})। কারণ: ${reason}`,
      'system',
      'info'
    );
    return true;
  }

  static getExpenses(): ShopExpense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_EXPENSES;
    }
  }

  static saveExpenses(expenses: ShopExpense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }

  static getLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_LOGS;
    }
  }

  static addLog(action: string, details: string, category: ActivityLog['category'], level: ActivityLog['level'] = 'info'): void {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      category,
      level
    };
    logs.unshift(newLog);
    // Keep last 200 logs
    const trimmed = logs.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
  }

  /**
   * Process and record a complete new transaction
   * Automatically updates drawer cash, SIM balances, customer dues, stock counts, and generates activity log
   */
  static recordTransaction(trx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    const settings = this.getSettings();
    const wallets = this.getWallets();
    const customers = this.getCustomers();
    const cards = this.getCards();

    const newTrx: Transaction = {
      ...trx,
      id: 'trx-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    // 1. Update Drawer Cash
    settings.drawerCash += newTrx.drawerCashDelta;
    this.saveSettings(settings);

    // 2. Update SIM Wallet if attached
    if (newTrx.simWalletId) {
      const walletIdx = wallets.findIndex(w => w.id === newTrx.simWalletId);
      if (walletIdx !== -1) {
        wallets[walletIdx].currentBalance += newTrx.simBalanceDelta;
        this.saveWallets(wallets);
      }
    }

    // 3. Update Customer Due/Deposit if attached
    if (newTrx.customerId) {
      const custIdx = customers.findIndex(c => c.id === newTrx.customerId);
      if (custIdx !== -1) {
        if (newTrx.type === 'customer_due') {
          customers[custIdx].totalDue += newTrx.amount;
        } else if (newTrx.type === 'customer_payment') {
          customers[custIdx].totalDue = Math.max(0, customers[custIdx].totalDue - newTrx.amount);
        }
        customers[custIdx].lastActivityAt = newTrx.createdAt;
        this.saveCustomers(customers);
      }
    }

    // 4. Update Card Stock if card sale
    if (newTrx.cardProductId) {
      const cardIdx = cards.findIndex(p => p.id === newTrx.cardProductId);
      if (cardIdx !== -1) {
        cards[cardIdx].stockCount = Math.max(0, cards[cardIdx].stockCount - 1);
        this.saveCards(cards);
      }
    }

    // 5. Append transaction
    transactions.unshift(newTrx);
    this.saveTransactions(transactions);

    // 6. Log activity
    let actionDesc = 'লেনদেন সম্পন্ন';
    if (newTrx.type === 'cash_in') actionDesc = 'ক্যাশ ইন';
    else if (newTrx.type === 'cash_out') actionDesc = 'ক্যাশ আউট';
    else if (newTrx.type === 'flexiload') actionDesc = 'ফ্লেক্সিলোড';
    else if (newTrx.type === 'card_sale') actionDesc = 'কার্ড/প্যাক বিক্রি';
    else if (newTrx.type === 'customer_due') actionDesc = 'বাকি দেওয়া';
    else if (newTrx.type === 'customer_payment') actionDesc = 'বাকি আদায়';

    this.addLog(
      `${actionDesc} (৳${newTrx.amount.toLocaleString('en-US')})`,
      `${newTrx.customerPhone || ''} ${newTrx.customerName ? `(${newTrx.customerName})` : ''} লাভ: ৳${newTrx.profit.toFixed(2)}`,
      'transaction',
      'success'
    );

    // Check low balance warnings
    if (newTrx.simWalletId) {
      const updatedWallet = wallets.find(w => w.id === newTrx.simWalletId);
      if (updatedWallet && updatedWallet.currentBalance < updatedWallet.minThreshold) {
        this.addLog(
          'সিম ব্যালেন্স কম',
          `${updatedWallet.name} এর বর্তমান ব্যালেন্স ৳${updatedWallet.currentBalance} যা সীমার নিচে`,
          'system',
          'warning'
        );
      }
    }

    return newTrx;
  }

  /**
   * Delete transaction and reverse effects
   */
  static deleteTransaction(id: string): boolean {
    const transactions = this.getTransactions();
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;

    const trx = transactions[idx];
    const settings = this.getSettings();
    const wallets = this.getWallets();

    // Revert drawer cash
    settings.drawerCash -= trx.drawerCashDelta;
    this.saveSettings(settings);

    // Revert wallet
    if (trx.simWalletId) {
      const wIdx = wallets.findIndex(w => w.id === trx.simWalletId);
      if (wIdx !== -1) {
        wallets[wIdx].currentBalance -= trx.simBalanceDelta;
        this.saveWallets(wallets);
      }
    }

    transactions.splice(idx, 1);
    this.saveTransactions(transactions);

    this.addLog('লেনদেন বাতিল ও ডিলিট', `লেনদেন #${id} (৳${trx.amount}) ডিলিট করা হয়েছে`, 'transaction', 'warning');
    return true;
  }

  /**
   * Delete a customer from the ledger
   */
  static deleteCustomer(id: string): boolean {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const cust = customers[idx];
    customers.splice(idx, 1);
    this.saveCustomers(customers);
    this.addLog(
      'কাস্টমার খাতা ডিলিট',
      `${cust.name} (${cust.phone}) এর বাকি খাতা মুছে ফেলা হয়েছে (বাকি ছিল: ৳${cust.totalDue})`,
      'ledger',
      'warning'
    );
    return true;
  }

  /**
   * Calculate Auto Monthly Profit & Loss Reports
   */
  static generateMonthlyReport(yearMonthKey?: string): MonthlyProfitReport {
    const transactions = this.getTransactions();
    const expenses = this.getExpenses();

    // Default to current month e.g. "2026-11"
    const targetKey = yearMonthKey || new Date().toISOString().substring(0, 7);
    const [year, month] = targetKey.split('-');

    const monthNamesBn = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthIndex = parseInt(month, 10) - 1;
    const monthName = `${monthNamesBn[monthIndex]} ${year} (${monthNamesEn[monthIndex]})`;

    const filteredTrx = transactions.filter(t => t.createdAt.startsWith(targetKey));
    const filteredExpenses = expenses.filter(e => e.date.startsWith(targetKey));

    let totalTurnover = 0;
    let mfsCashOutVolume = 0;
    let mfsCashInVolume = 0;
    let flexiloadVolume = 0;
    let cardSalesVolume = 0;
    let mfsCommissions = 0;
    let flexiloadCommissions = 0;
    let cardProfits = 0;
    let otherFees = 0;
    let newCustomerDuesGiven = 0;
    let customerDuesCollected = 0;

    filteredTrx.forEach(t => {
      totalTurnover += t.amount;
      if (t.type === 'cash_out') {
        mfsCashOutVolume += t.amount;
        mfsCommissions += t.commission;
        otherFees += t.fee;
      } else if (t.type === 'cash_in') {
        mfsCashInVolume += t.amount;
        mfsCommissions += t.commission;
        otherFees += t.fee;
      } else if (t.type === 'flexiload') {
        flexiloadVolume += t.amount;
        flexiloadCommissions += t.commission;
      } else if (t.type === 'card_sale') {
        cardSalesVolume += t.amount;
        cardProfits += t.profit;
      } else if (t.type === 'customer_due') {
        newCustomerDuesGiven += t.amount;
      } else if (t.type === 'customer_payment') {
        customerDuesCollected += t.amount;
      }
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = mfsCommissions + flexiloadCommissions + cardProfits + otherFees;
    const netProfit = grossProfit - totalExpenses;

    return {
      monthKey: targetKey,
      monthName,
      totalTransactionsCount: filteredTrx.length,
      totalTurnover,
      mfsCashOutVolume,
      mfsCashInVolume,
      flexiloadVolume,
      cardSalesVolume,
      mfsCommissions,
      flexiloadCommissions,
      cardProfits,
      otherFees,
      grossProfit,
      totalExpenses,
      netProfit,
      newCustomerDuesGiven,
      customerDuesCollected
    };
  }

  /**
   * Complete Database Backup Export
   */
  static exportFullBackupJSON(): string {
    const backupData = {
      app: 'TeleKhatta POS & Ledger',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      checksum: 'tk_' + Date.now().toString(36),
      data: {
        settings: this.getSettings(),
        transactions: this.getTransactions(),
        customers: this.getCustomers(),
        cards: this.getCards(),
        wallets: this.getWallets(),
        expenses: this.getExpenses(),
        logs: this.getLogs()
      }
    };
    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Complete Database Restore
   */
  static restoreFullBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.data.settings) {
        return { success: false, message: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট! কোনো ডাটা পাওয়া যায়নি।' };
      }

      const { settings, transactions, customers, cards, wallets, expenses, logs } = parsed.data;

      if (settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      if (customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      if (cards) localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      if (wallets) localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      if (expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      if (logs) localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));

      this.addLog('ডাটাবেস রিস্টোর সফল', `ব্যাকআপ ফাইল থেকে সফলভাবে ডাটা রিস্টোর করা হয়েছে`, 'security', 'security');

      return { success: true, message: 'ব্যাকআপ ডাটা সফলভাবে রিস্টোর করা হয়েছে!' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'অজানা ত্রুটি';
      return { success: false, message: `ফাইল পার্সিং ব্যর্থ হয়েছে: ${errMsg}` };
    }
  }

  /**
   * Create an automated local snapshot before dangerous actions
   */
  static createLocalSnapshot(name: string): void {
    try {
      const snapshotsRaw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      const snapshots: Array<{ id: string; name: string; timestamp: string; dataString: string }> = snapshotsRaw ? JSON.parse(snapshotsRaw) : [];
      snapshots.unshift({
        id: 'snap-' + Date.now(),
        name,
        timestamp: new Date().toISOString(),
        dataString: this.exportFullBackupJSON()
      });
      // Keep last 5 snapshots
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots.slice(0, 5)));
    } catch {
      // Storage might be full
    }
  }

  static getLocalSnapshots(): Array<{ id: string; name: string; timestamp: string; dataString: string }> {
    try {
      const snapshotsRaw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      return snapshotsRaw ? JSON.parse(snapshotsRaw) : [];
    } catch {
      return [];
    }
  }
}
