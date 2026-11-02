export type MfsService = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'mcash';
export type TelecomOperator = 'gp' | 'bl' | 'robi' | 'airtel' | 'teletalk';
export type ServiceType = MfsService | TelecomOperator | 'card' | 'customer' | 'expense' | 'sim_refill';

export type TransactionType =
  | 'cash_in'
  | 'cash_out'
  | 'send_money'
  | 'flexiload'
  | 'card_sale'
  | 'customer_due'
  | 'customer_payment'
  | 'shop_expense'
  | 'sim_refill'
  | 'drawer_adjust';

export interface Transaction {
  id: string;
  type: TransactionType;
  service: ServiceType;
  amount: number;
  customerPhone?: string;
  customerName?: string;
  customerId?: string;
  trxId?: string; // Optional MFS TrxID
  commission: number; // e.g. 4.10 tk per 1000 for Cash Out, 28 tk per 1000 for flexiload
  fee: number; // Extra fee charged to customer if any (e.g. 5 tk cash in charge)
  profit: number; // Total net profit/commission from this transaction
  note?: string;
  packDetails?: string; // For minute or MB packs, e.g. "Robi 350 Min 30 Days"
  operator?: TelecomOperator;
  cardProductId?: string;
  drawerCashDelta: number; // Effect on physical drawer cash (+/-)
  simBalanceDelta: number; // Effect on agent SIM balance (+/-)
  createdAt: string; // ISO date string
  deviceInfo?: string;
  source: 'mobile' | 'pos';
  simWalletId?: string;
  status?: 'completed' | 'pending' | 'cancelled';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDue: number; // বাকি টাকা
  totalDeposit: number; // অগ্রিম জমা টাকা
  notes?: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface CardProduct {
  id: string;
  title: string;
  banglaTitle: string;
  operator: TelecomOperator;
  category: 'minute' | 'mb' | 'combo' | 'scratch';
  buyingPrice: number; // কেনা দাম
  sellingPrice: number; // বিক্রি দাম
  stockCount: number; // বর্তমান স্টক
  validityDays: number;
  dataMb?: number;
  minutes?: number;
  smsCount?: number;
  codeOrPin?: string; // Optional card PIN/Code
}

export type SimWalletType = 'agent' | 'personal';

export interface SimWallet {
  id: string;
  name: string; // e.g. "bKash Agent 1" or "Nagad Personal"
  service: ServiceType;
  walletType?: SimWalletType; // 'agent' | 'personal'
  phone: string;
  currentBalance: number;
  minThreshold: number; // Alert if below this
  lastReloadAt?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export interface ShopExpense {
  id: string;
  category: 'rent' | 'electricity' | 'staff' | 'refreshment' | 'transport' | 'misc';
  title: string;
  amount: number;
  note?: string;
  date: string;
  paidFrom: 'drawer' | 'personal';
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  category: 'transaction' | 'ledger' | 'security' | 'backup' | 'stock' | 'system';
  level: 'info' | 'success' | 'warning' | 'security';
}

export interface ShopSettings {
  shopName: string;
  shopOwner: string;
  phone: string;
  address: string;
  currencySymbol: string;
  isPinLocked: boolean;
  masterPin: string; // 4-digit PIN
  autoLockMinutes: number;
  printPaperSize: '58mm' | '80mm' | 'a4';
  drawerCash: number; // Physical cash in hand/drawer
  commissions: {
    bkashCashOutRate: number; // e.g. 4.10 (Tk per 1000)
    bkashCashInRate?: number; // e.g. 1.50 (Tk per 1000)
    bkashCashInFee: number; // e.g. 0 or 5 tk
    nagadCashOutRate: number; // e.g. 4.30 (Tk per 1000)
    nagadCashInRate?: number;
    nagadCashInFee: number;
    rocketCashOutRate: number; // e.g. 4.20
    rocketCashInRate?: number;
    rocketCashInFee: number;
    flexiloadCommissionPerThousand: number; // e.g. 28 Tk per 1000 (2.8%)
  };
  language: 'bn' | 'en';
  autoBackupToDrive?: boolean;
  lastDriveBackupAt?: string;
}

export interface MonthlyProfitReport {
  monthKey: string; // "2026-11"
  monthName: string; // "নভেম্বর ২০২৬" / "November 2026"
  totalTransactionsCount: number;
  totalTurnover: number; // মোট লেনদেন
  mfsCashOutVolume: number;
  mfsCashInVolume: number;
  flexiloadVolume: number;
  cardSalesVolume: number;
  mfsCommissions: number; // অর্জিত এমএফএস কমিশন
  flexiloadCommissions: number; // অর্জিত ফ্লেক্সিলোড কমিশন
  cardProfits: number; // মিনিট ও ডাটা কার্ড বিক্রির লাভ
  otherFees: number; // অতিরিক্ত সার্ভিস চার্জ
  grossProfit: number; // মোট অর্জিত লাভ
  totalExpenses: number; // মোট দোকান খরচ
  netProfit: number; // নিট মুনাফা (Gross - Expenses)
  newCustomerDuesGiven: number; // নতুন বাকি
  customerDuesCollected: number; // আদায়কৃত বাকি
}
