import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Users, 
  AlertTriangle, 
  Printer, 
  PlusCircle, 
  MessageSquare,
  Smartphone,
  CreditCard,
  Receipt
} from 'lucide-react';
import { Transaction, Customer, SimWallet, CardProduct, ShopSettings } from '../types';
import { formatBanglaCurrency, formatBanglaDateTime } from '../utils/printAndExport';

interface DashboardViewProps {
  transactions: Transaction[];
  customers: Customer[];
  wallets: SimWallet[];
  cards: CardProduct[];
  settings: ShopSettings;
  onOpenQuickPos: () => void;
  onSelectTransactionToPrint: (trx: Transaction) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  customers,
  wallets,
  cards,
  settings,
  onOpenQuickPos,
  onSelectTransactionToPrint,
  onNavigateTab
}) => {
  const todayDatePrefix = new Date().toISOString().substring(0, 10);
  const todayTransactions = transactions.filter(t => t.createdAt.startsWith(todayDatePrefix));

  // Compute Today's KPIs
  const todayVolume = todayTransactions.reduce((acc, t) => acc + t.amount, 0);
  const todayProfit = todayTransactions.reduce((acc, t) => acc + t.profit, 0);

  const totalSimBalance = wallets.reduce((acc, w) => acc + w.currentBalance, 0);
  const totalMarketDue = customers.reduce((acc, c) => acc + c.totalDue, 0);
  const totalCustomerDeposit = customers.reduce((acc, c) => acc + c.totalDeposit, 0);

  // MFS volume breakdown for today
  const bkashToday = todayTransactions
    .filter(t => t.service === 'bkash')
    .reduce((acc, t) => acc + t.amount, 0);
  const bkashProfit = todayTransactions
    .filter(t => t.service === 'bkash')
    .reduce((acc, t) => acc + t.profit, 0);

  const nagadToday = todayTransactions
    .filter(t => t.service === 'nagad')
    .reduce((acc, t) => acc + t.amount, 0);
  const nagadProfit = todayTransactions
    .filter(t => t.service === 'nagad')
    .reduce((acc, t) => acc + t.profit, 0);

  const flexiToday = todayTransactions
    .filter(t => ['gp', 'bl', 'robi', 'airtel', 'teletalk'].includes(t.service) && t.type === 'flexiload')
    .reduce((acc, t) => acc + t.amount, 0);
  const flexiProfit = todayTransactions
    .filter(t => ['gp', 'bl', 'robi', 'airtel', 'teletalk'].includes(t.service) && t.type === 'flexiload')
    .reduce((acc, t) => acc + t.profit, 0);

  const cardSalesToday = todayTransactions
    .filter(t => t.type === 'card_sale')
    .reduce((acc, t) => acc + t.amount, 0);
  const cardProfitToday = todayTransactions
    .filter(t => t.type === 'card_sale')
    .reduce((acc, t) => acc + t.profit, 0);

  // Check low balance SIMs
  const lowBalanceWallets = wallets.filter(w => w.currentBalance < w.minThreshold);

  // Top due customers
  const topDueCustomers = [...customers]
    .filter(c => c.totalDue > 0)
    .sort((a, b) => b.totalDue - a.totalDue)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Low Balance Alert Banner if any */}
      {lowBalanceWallets.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">সতর্কবার্তা:</span> {lowBalanceWallets.map(w => `${w.name} (বাকি: ৳${w.currentBalance.toLocaleString('en-US')})`).join(', ')} — সিম ব্যালেন্স সতর্কতার নিচে!
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('wallets')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition whitespace-nowrap shrink-0"
          >
            ব্যালেন্স লোড
          </button>
        </div>
      )}

      {/* KPI Cards Row (Tabular Figures, Single Elevation, Sophisticated 60-30-10 styling) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Today's Turnover */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">আজকের মোট লেনদেন</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatBanglaCurrency(todayVolume)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              মোট {todayTransactions.length} টি লেনদেন সম্পন্ন
            </div>
          </div>
        </div>

        {/* Today's Net Profit & Commissions */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">আজকের অর্জিত লাভ</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatBanglaCurrency(todayProfit)}
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              কমিশন ও কার্ডের নিট মার্জিন
            </div>
          </div>
        </div>

        {/* Cash in Physical Drawer */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">ড্রয়ারে নগদ ক্যাশ</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {formatBanglaCurrency(settings.drawerCash)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              হাতে থাকা ক্যাশ কাউন্টার
            </div>
          </div>
        </div>

        {/* Total SIM Agent Balances */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">সিম ব্যালেন্স মোট</span>
            <Smartphone className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
              {formatBanglaCurrency(totalSimBalance)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {wallets.length} টি সক্রিয় এজেন্ট সিম
            </div>
          </div>
        </div>

        {/* Total Customer Dues */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">বাজারে মোট বাকি</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {formatBanglaCurrency(totalMarketDue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              জমা ব্যালেন্স: {formatBanglaCurrency(totalCustomerDeposit)}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Launchpad & Service Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Volume Distribution */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                আজকের সার্ভিসভিত্তিক লেনদেন ও অর্জিত লাভ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                বিকাশ, নগদ, ফ্লেক্সিলোড ও প্যাক বিক্রির হিসাব
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              মাসিক রিপোর্ট দেখুন &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* bKash Box */}
            <div className="p-3.5 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-700 dark:text-pink-300">বিকাশ</span>
                <span className="text-[10px] font-mono text-pink-600 bg-pink-100 dark:bg-pink-900/60 px-1.5 py-0.5 rounded">bKash</span>
              </div>
              <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
                {formatBanglaCurrency(bkashToday)}
              </div>
              <div className="mt-1 text-[11px] font-medium text-pink-700 dark:text-pink-400">
                লাভ: +{formatBanglaCurrency(bkashProfit)}
              </div>
            </div>

            {/* Nagad Box */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">নগদ</span>
                <span className="text-[10px] font-mono text-amber-600 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">Nagad</span>
              </div>
              <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
                {formatBanglaCurrency(nagadToday)}
              </div>
              <div className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                লাভ: +{formatBanglaCurrency(nagadProfit)}
              </div>
            </div>

            {/* Flexiload Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">ফ্লেক্সিলোড</span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">Recharge</span>
              </div>
              <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
                {formatBanglaCurrency(flexiToday)}
              </div>
              <div className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                লাভ: +{formatBanglaCurrency(flexiProfit)}
              </div>
            </div>

            {/* Minute / MB Card Box */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">কার্ড ও প্যাক</span>
                <span className="text-[10px] font-mono text-blue-600 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">Packs</span>
              </div>
              <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
                {formatBanglaCurrency(cardSalesToday)}
              </div>
              <div className="mt-1 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                লাভ: +{formatBanglaCurrency(cardProfitToday)}
              </div>
            </div>

          </div>

          {/* Quick POS Trigger Strip */}
          <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                গ্রাহক কাউন্টারে এসেছে? দ্রুত ক্যাশ ইন বা রিচার্জ করুন:
              </span>
            </div>
            <button
              onClick={onOpenQuickPos}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap"
            >
              + নতুন লেনদেন
            </button>
          </div>
        </div>

        {/* Customer Dues Alert Box */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                শীর্ষ বাকিদার গ্রাহক
              </h3>
              <button
                onClick={() => onNavigateTab('customers')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                সব খাতা &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {topDueCustomers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  বর্তমানে কোনো বকেয়া বা বাকি হিসাব নেই
                </div>
              ) : (
                topDueCustomers.map(cust => (
                  <div 
                    key={cust.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {cust.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {cust.phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatBanglaCurrency(cust.totalDue)}
                      </div>
                      <span className="text-[10px] text-slate-400">বকেয়া</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('customers')}
            className="mt-4 w-full py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition text-center"
          >
            বাকি আদায় ও তাগাদা খাতা দেখুন
          </button>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              সাম্প্রতিক লেনদেন ইতিহাস
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              আজকের সাম্প্রতিক কাস্টমার ট্রানজেকশন তালিকা
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            সকল ট্রানজেকশন দেখুন &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-3.5 py-2.5 rounded-l-lg">সময়</th>
                <th className="px-3.5 py-2.5">সার্ভিস ও ধরন</th>
                <th className="px-3.5 py-2.5">গ্রাহকের মোবাইল</th>
                <th className="px-3.5 py-2.5 text-right">পরিমাণ</th>
                <th className="px-3.5 py-2.5 text-right">অর্জিত লাভ</th>
                <th className="px-3.5 py-2.5 text-center rounded-r-lg">রসিদ স্লিপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice(0, 6).map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-3.5 py-3 font-mono text-slate-500 whitespace-nowrap">
                    {formatBanglaDateTime(trx.createdAt)}
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                      {trx.service}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      {trx.type === 'cash_out' ? 'ক্যাশ আউট' : trx.type === 'cash_in' ? 'ক্যাশ ইন' : trx.type === 'flexiload' ? 'রিচার্জ' : trx.type === 'card_sale' ? 'প্যাক বিক্রি' : trx.type === 'customer_payment' ? 'বাকি আদায়' : trx.type}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {trx.customerPhone || 'কাউন্টার'}
                    {trx.customerName && <span className="text-slate-400 font-sans text-[11px] ml-1">({trx.customerName})</span>}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatBanglaCurrency(trx.amount)}
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    +{formatBanglaCurrency(trx.profit)}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <button
                      onClick={() => onSelectTransactionToPrint(trx)}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="রসিদ প্রিন্ট করুন"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
